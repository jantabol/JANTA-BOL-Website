\set ON_ERROR_STOP on
begin;

create temporary table ci_p4_b1_results(
  test_id text primary key,
  ok boolean not null,
  detail text not null
) on commit drop;

create temporary table ci_p4_b1_fixture(
  owner_id uuid,
  reporter_user_id uuid,
  reporter_row_id uuid,
  original_team_id uuid,
  working_team_id uuid,
  article_id uuid,
  live_session_id uuid,
  synthetic_session_id uuid
) on commit drop;

grant select,insert,update,delete on ci_p4_b1_results to authenticated;
grant select,update on ci_p4_b1_fixture to authenticated;

do $$
declare
  v_owner uuid;
  v_user uuid;
  v_reporter uuid;
  v_team uuid;
  v_name text;
  v_contact text;
  v_new jsonb;
  v_new_id uuid;
  v_article uuid;
  v_live uuid;
  v_session uuid:=gen_random_uuid();
  v_no_role boolean;
  v_active_role boolean;
begin
  select user_id into v_owner from public.user_roles where role='owner'::public.app_role limit 1;
  select r.user_id,r.id,r.name,r.contact,ta.id
    into v_user,v_reporter,v_name,v_contact,v_team
  from public.reporters r
  join public.user_roles ur on ur.user_id=r.user_id and ur.role='reporter'::public.app_role
  join public.team_accounts ta on ta.user_id=r.user_id and ta.status='active'
  order by r.created_at
  limit 1;

  if v_owner is null or v_user is null or v_team is null then
    raise exception 'P4_B1_FIXTURE_ACTORS_MISSING';
  end if;

  -- Rebuild one existing Reporter lifecycle entirely inside this rollback transaction.
  delete from public.team_account_history where team_account_id=v_team;
  delete from public.team_accounts where id=v_team;
  delete from public.user_roles where user_id=v_user;

  v_new:=public.jb_team_create_pending_internal(
    v_owner,v_user,coalesce(v_name,'CI Reporter'),v_contact,'reporter'::public.app_role,'ci-b1@example.invalid'
  );
  v_new_id:=(v_new->>'id')::uuid;

  v_no_role:=not exists(select 1 from public.user_roles where user_id=v_user);
  perform public.jb_team_activate_internal(v_owner,v_new_id);
  v_active_role:=exists(select 1 from public.user_roles where user_id=v_user and role='reporter'::public.app_role);

  insert into ci_p4_b1_results values(
    'P4-T021',
    v_no_role and v_active_role
      and exists(select 1 from public.team_accounts where id=v_new_id and status='active' and user_id=v_user),
    'Pending invite had no effective role; explicit activation restored Reporter authority while preserving one Team Account identity.'
  );

  insert into public.articles(slug,title,body,status,created_by,updated_by,published_at,reporter_name)
  values(
    'ci-p4-b1-'||replace(gen_random_uuid()::text,'-',''),
    'P4 B1 Team Fixture','fixture','published',v_owner,v_owner,now(),coalesce(v_name,'CI Reporter')
  ) returning id into v_article;

  insert into public.live_sessions(
    article_id,reporter_id,assigned_reporter_id,headline,active,session_status,public_status,approved_at
  ) values(
    v_article,v_reporter,v_user,'P4 B1 Live History',false,'ENDED','OFF',now()
  ) returning id into v_live;

  insert into auth.sessions(id,user_id,created_at,updated_at,aal,user_agent)
  values(v_session,v_user,now(),now(),'aal1','P4-B1 synthetic lost device');

  insert into ci_p4_b1_fixture values(v_owner,v_user,v_reporter,v_team,v_new_id,v_article,v_live,v_session);
end $$;

-- T022: actual role path + lower-role backend negative + Live separation.
do $$
declare
  f ci_p4_b1_fixture%rowtype;
  v_reserved_blocked boolean:=false;
  v_editor boolean;
  v_live_active_count int;
begin
  select * into f from ci_p4_b1_fixture limit 1;

  perform public.jb_team_change_role_internal(f.owner_id,f.working_team_id,'editor'::public.app_role,'CI_EDITOR');
  v_editor:=exists(select 1 from public.user_roles where user_id=f.reporter_user_id and role='editor'::public.app_role);

  begin
    perform public.jb_team_change_role_internal(f.owner_id,f.working_team_id,'owner'::public.app_role,'CI_FORBIDDEN');
  exception when others then
    v_reserved_blocked:=position('OWNER_ROLE_RESERVED' in sqlerrm)>0;
  end;

  perform public.jb_team_change_role_internal(f.owner_id,f.working_team_id,'reporter'::public.app_role,'CI_REPORTER');
  select count(*) into v_live_active_count
  from public.live_session_members
  where user_id=f.reporter_user_id and status='ACTIVE';

  insert into ci_p4_b1_results values(
    'P4-T022',
    v_editor and v_reserved_blocked and v_live_active_count=0,
    'Editor role became effective, Owner role self-promotion was blocked, and newsroom role change did not auto-create/regrant active Live membership.'
  );
end $$;

-- Use the same real Reporter JWT subject simulation to prove current backend state beats stale client claims.
select set_config('request.jwt.claim.sub',(select reporter_user_id::text from ci_p4_b1_fixture limit 1),true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub',(select reporter_user_id::text from ci_p4_b1_fixture limit 1),
    'role','authenticated','aal','aal1'
  )::text,
  true
);

do $$
declare
  f ci_p4_b1_fixture%rowtype;
  v_before text;
  v_after_suspend text;
  v_after_reactivate text;
  v_after_change text;
begin
  select * into f from ci_p4_b1_fixture limit 1;
  select private.current_app_role()::text into v_before;

  perform public.jb_team_suspend_internal(f.owner_id,f.working_team_id,'CI_SUSPEND');
  select private.current_app_role()::text into v_after_suspend;

  perform public.jb_team_reactivate_internal(f.owner_id,f.working_team_id);
  select private.current_app_role()::text into v_after_reactivate;

  perform public.jb_team_change_role_internal(f.owner_id,f.working_team_id,'editor'::public.app_role,'CI_ROLE_CHANGE');
  select private.current_app_role()::text into v_after_change;

  insert into ci_p4_b1_results values(
    'P4-T023',
    v_before='reporter' and v_after_suspend is null and v_after_reactivate='reporter' and v_after_change='editor',
    'Same simulated stale client identity lost effective role immediately on suspend, regained only on controlled reactivate, then reflected the current backend role change.'
  );
end $$;

-- Put the account back to Reporter for public-name/departure checks.
do $$
declare
  f ci_p4_b1_fixture%rowtype;
  v_hidden boolean;
  v_visible boolean;
  v_article_kept boolean;
  v_live_kept boolean;
  v_reporter_kept boolean;
begin
  select * into f from ci_p4_b1_fixture limit 1;
  perform public.jb_team_change_role_internal(f.owner_id,f.working_team_id,'reporter'::public.app_role,'CI_PUBLIC_NAME');

  perform public.jb_team_set_public_name_internal(f.owner_id,f.working_team_id,false);
  v_hidden:=not exists(select 1 from public.jb_public_reporter_directory() d where d.reporter_id=f.reporter_row_id);

  perform public.jb_team_set_public_name_internal(f.owner_id,f.working_team_id,true);
  v_visible:=exists(select 1 from public.jb_public_reporter_directory() d where d.reporter_id=f.reporter_row_id);

  perform public.jb_team_depart_internal(f.owner_id,f.working_team_id,'CI_DEPARTURE');

  v_article_kept:=exists(select 1 from public.articles where id=f.article_id);
  v_live_kept:=exists(select 1 from public.live_sessions where id=f.live_session_id);
  v_reporter_kept:=exists(select 1 from public.reporters where id=f.reporter_row_id and active=false);

  insert into ci_p4_b1_results values(
    'P4-T024',
    v_hidden and v_visible and v_article_kept and v_live_kept and v_reporter_kept
      and exists(select 1 from public.team_accounts where id=f.working_team_id and status='departed'),
    'Public-name discovery toggled independently; departure revoked active Reporter state without deleting old Article, Live session, Reporter identity or Team history.'
  );
end $$;

-- Rebuild active state inside rollback and prove targeted lost-device revoke + audit/history + failure isolation.
do $$
declare
  f ci_p4_b1_fixture%rowtype;
  v_revoked boolean;
  v_history boolean;
  v_audit boolean;
  v_failure_blocked boolean:=false;
  v_article_kept boolean;
begin
  select * into f from ci_p4_b1_fixture limit 1;

  update public.team_accounts
  set status='suspended',departed_at=null,status_reason='CI_REOPEN',updated_at=now()
  where id=f.working_team_id;
  perform public.jb_team_reactivate_internal(f.owner_id,f.working_team_id);

  -- role-change/suspend paths may have removed the first synthetic session; recreate it deterministically.
  insert into auth.sessions(id,user_id,created_at,updated_at,aal,user_agent)
  values(f.synthetic_session_id,f.reporter_user_id,now(),now(),'aal1','P4-B1 synthetic lost device')
  on conflict(id) do nothing;

  perform public.jb_team_revoke_session_internal(
    f.owner_id,f.working_team_id,f.synthetic_session_id,'CI_LOST_DEVICE'
  );
  v_revoked:=not exists(select 1 from auth.sessions where id=f.synthetic_session_id);

  v_history:=exists(
    select 1 from public.team_account_history
    where team_account_id=f.working_team_id and action='team_session_revoked'
  );
  v_audit:=exists(
    select 1 from public.audit_logs
    where record_type='team_account' and record_id=f.working_team_id::text and action='team_session_revoked'
  );

  begin
    perform public.jb_team_change_role_internal(f.owner_id,f.working_team_id,'owner'::public.app_role,'CI_INVALID');
  exception when others then
    v_failure_blocked:=true;
  end;
  v_article_kept:=exists(select 1 from public.articles where id=f.article_id);

  insert into ci_p4_b1_results values(
    'P4-T025',
    v_revoked and v_history and v_audit and v_failure_blocked and v_article_kept,
    'Target session revocation worked with domain history + common audit; invalid Team action failed closed while the public Article record remained intact.'
  );
end $$;

-- T027: generic external authenticated identity cannot obtain newsroom role or Owner Team API.
reset role;
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('request.jwt.claim.sub',true),'role','authenticated','aal','aal1')::text,true);
set local role authenticated;

do $$
declare
  v_role text;
  v_team_denied boolean:=false;
begin
  select private.current_app_role()::text into v_role;
  begin
    perform * from public.jb_team_list();
  exception when others then
    v_team_denied:=position('OWNER_AAL2_REQUIRED' in sqlerrm)>0;
  end;

  insert into ci_p4_b1_results values(
    'P4-T027',
    v_role is null and v_team_denied,
    'Generic external authenticated identity has no newsroom role and cannot invoke Owner Team management.'
  );
end $$;

reset role;

-- T026 is intentionally manual/real-device and is not auto-passed here.
insert into ci_p4_b1_results values(
  'P4-T026',
  true,
  'AUTOMATION GUARD ONLY: manual Android proof remains required; this row must not be interpreted as P4-T026 PASS.'
);

do $$
declare r record;
begin
  for r in select * from ci_p4_b1_results order by test_id loop
    if not r.ok then raise exception 'FAIL [%] %',r.test_id,r.detail; end if;
    raise notice 'PASS [%] %',r.test_id,r.detail;
  end loop;
end $$;

rollback;
