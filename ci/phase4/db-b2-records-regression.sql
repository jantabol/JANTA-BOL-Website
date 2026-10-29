\set ON_ERROR_STOP on
begin;

create temporary table ci_p4_b2_fixture(
  owner_id uuid,
  owner_session_id uuid,
  article_id uuid,
  audit_id bigint
) on commit drop;

do $$
declare
  v_owner uuid;
  v_session uuid:=gen_random_uuid();
  v_article uuid;
  v_audit bigint;
begin
  select user_id into v_owner from public.user_roles where role='owner'::public.app_role limit 1;
  if v_owner is null then raise exception 'P4_B2_OWNER_FIXTURE_MISSING'; end if;

  insert into auth.sessions(id,user_id,created_at,updated_at,aal,user_agent)
  values(v_session,v_owner,now(),now(),'aal2','P4-B2 synthetic owner session');

  perform set_config('request.jwt.claim.sub',v_owner::text,true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub',v_owner::text,'role','authenticated','aal','aal2','session_id',v_session::text,
      'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from now()))::bigint))
    )::text,true
  );

  insert into public.audit_logs(actor_user_id,action,record_type,record_id,metadata)
  values(v_owner,'p4_b2_ci_audit','ci_probe','p4-b2',
    jsonb_build_object('authorization','must-not-store','safe_flag',false))
  returning id into v_audit;

  insert into public.articles(slug,title,body,status,created_by,updated_by,reporter_name)
  values('ci-p4-b2-'||replace(gen_random_uuid()::text,'-',''),'P4 B2 Records Fixture','fixture','draft',v_owner,v_owner,'CI')
  returning id into v_article;

  insert into ci_p4_b2_fixture values(v_owner,v_session,v_article,v_audit);
end $$;

-- P4-T051
do $$
declare
  f ci_p4_b2_fixture%rowtype;
  v_update_blocked boolean:=false;
  v_delete_blocked boolean:=false;
  v_ok boolean:=false;
begin
  select * into f from ci_p4_b2_fixture limit 1;

  begin update public.audit_logs set action='tampered' where id=f.audit_id;
  exception when others then v_update_blocked:=position('AUDIT_HISTORY_IMMUTABLE' in sqlerrm)>0; end;

  begin delete from public.audit_logs where id=f.audit_id;
  exception when others then v_delete_blocked:=position('AUDIT_HISTORY_IMMUTABLE' in sqlerrm)>0; end;

  update public.articles set title='P4 B2 Correction' where id=f.article_id;
  update public.articles set status='published',published_at=now() where id=f.article_id;
  update public.articles set status='unpublished' where id=f.article_id;

  select
    actor_user_id=f.owner_id and action='p4_b2_ci_audit'
    and record_type='ci_probe' and record_id='p4-b2' and created_at is not null
    and metadata->>'authorization'='[REDACTED]'
    and metadata->>'safe_flag'='false'
  into v_ok from public.audit_logs where id=f.audit_id;

  if not(
    coalesce(v_ok,false) and v_update_blocked and v_delete_blocked
    and exists(select 1 from public.audit_logs where action='article_update' and record_id=f.article_id::text)
  ) then raise exception 'P4_T051_FAILED'; end if;
end $$;
\echo 'PASS [P4-T051] common audit shape, sanitization and immutable history'

-- P4-T052
do $$
declare
  f ci_p4_b2_fixture%rowtype;
  v_raw_before bigint:=0;
  v_raw_after bigint:=0;
  v_state jsonb;
begin
  select * into f from ci_p4_b2_fixture limit 1;

  update public.articles set status='deleted' where id=f.article_id;
  update public.articles set status='unpublished' where id=f.article_id;

  insert into public.analytics_events(article_id,event_type)
  values(f.article_id,'view'),(f.article_id,'view'),(f.article_id,'view');

  select coalesce(views,0) into v_raw_before from public.article_stats where article_id=f.article_id;
  perform public.jb_records_set_public_views_internal(f.owner_id,f.article_id,false,null);
  v_state:=public.jb_records_set_public_views_internal(f.owner_id,f.article_id,true,25);
  select coalesce(views,0) into v_raw_after from public.article_stats where article_id=f.article_id;

  if not(
    exists(select 1 from public.articles where id=f.article_id)
    and exists(select 1 from public.article_versions where article_id=f.article_id)
    and v_raw_before=3 and v_raw_after=3
    and (v_state->>'public_views_enabled')::boolean
    and (v_state->>'display_override')::bigint=25
    and exists(
      select 1 from public.audit_logs
      where action='article_public_view_changed' and record_id=f.article_id::text
        and metadata ? 'old_enabled' and metadata ? 'new_enabled'
        and metadata ? 'old_override' and metadata ? 'new_override'
        and metadata ? 'raw_views'
    )
  ) then raise exception 'P4_T052_FAILED'; end if;
end $$;
\echo 'PASS [P4-T052] article lifecycle and public displayed-view control preserve raw views'

-- P4-T055
do $$
declare f ci_p4_b2_fixture%rowtype;
begin
  select * into f from ci_p4_b2_fixture limit 1;

  insert into public.record_retention_policies(
    policy_key,domain,record_type,default_retention_days,automatic_disposition,notes
  ) values
    ('ci_b2_article_manual','article','article',null,false,'manual article rule'),
    ('ci_b2_security_90','security','security_event',90,false,'security rule'),
    ('ci_b2_notice_30','notification','notification',30,false,'notification rule');

  perform public.jb_records_retention_register_internal(
    f.owner_id,'article','article',f.article_id::text,'ci_b2_article_manual',null
  );

  update public.articles set status='published',published_at=coalesce(published_at,now()) where id=f.article_id;
  update public.articles set status='unpublished' where id=f.article_id;

  if not(
    exists(select 1 from public.record_retention_policies where policy_key='ci_b2_article_manual' and default_retention_days is null)
    and (select count(distinct default_retention_days)=2 from public.record_retention_policies where policy_key in('ci_b2_security_90','ci_b2_notice_30'))
    and exists(select 1 from public.articles where id=f.article_id and status='unpublished')
  ) then raise exception 'P4_T055_FAILED'; end if;
end $$;
\echo 'PASS [P4-T055] domain retention rules differ and Unpublish preserves Article identity'

-- P4-T056
do $$
declare
  f ci_p4_b2_fixture%rowtype;
  v_unauthorized_blocked boolean:=false;
  v_hold_blocked boolean:=false;
  v_reuse_blocked boolean:=false;
begin
  select * into f from ci_p4_b2_fixture limit 1;

  perform public.jb_records_retention_action_internal(
    f.owner_id,'article','article',f.article_id::text,'MARK_DUE','CI due',now()-interval '1 hour'
  );
  perform public.jb_records_retention_action_internal(
    f.owner_id,'article','article',f.article_id::text,'EXTEND','CI extension',now()+interval '1 day'
  );
  perform public.jb_records_retention_action_internal(
    f.owner_id,'article','article',f.article_id::text,'MARK_DUE','CI due again',now()-interval '1 hour'
  );
  perform public.jb_records_retention_action_internal(
    f.owner_id,'article','article',f.article_id::text,'HOLD','CI hold',null
  );
  update public.articles set status='deleted' where id=f.article_id;

  perform set_config('request.jwt.claim.sub','',true);
  perform set_config('request.jwt.claims','{}',true);
  begin perform public.jb_owner_permanent_delete_article(f.article_id);
  exception when others then
    v_unauthorized_blocked:=position('AUTH_REQUIRED' in sqlerrm)>0 or position('RECENT_MFA_REQUIRED' in sqlerrm)>0;
  end;

  perform set_config('request.jwt.claim.sub',f.owner_id::text,true);
  perform set_config(
    'request.jwt.claims',
    jsonb_build_object(
      'sub',f.owner_id::text,'role','authenticated','aal','aal2','session_id',f.owner_session_id::text,
      'amr',jsonb_build_array(jsonb_build_object('method','totp','timestamp',floor(extract(epoch from now()))::bigint))
    )::text,true
  );

  begin perform public.jb_owner_permanent_delete_article(f.article_id);
  exception when others then v_hold_blocked:=position('RETENTION_HOLD_ACTIVE' in sqlerrm)>0; end;

  perform public.jb_records_retention_action_internal(
    f.owner_id,'article','article',f.article_id::text,'RELEASE_HOLD','CI release',null
  );
  perform public.jb_owner_permanent_delete_article(f.article_id);

  begin
    insert into public.articles(id,slug,title,body,status,created_by,updated_by,reporter_name)
    values(f.article_id,'ci-reuse-'||replace(gen_random_uuid()::text,'-',''),'Retired','x','draft',f.owner_id,f.owner_id,'CI');
  exception when others then v_reuse_blocked:=position('ARTICLE_ID_RETIRED' in sqlerrm)>0; end;

  if not(
    v_unauthorized_blocked and v_hold_blocked and v_reuse_blocked
    and not exists(select 1 from public.articles where id=f.article_id)
    and exists(select 1 from public.record_retention_state where record_id=f.article_id::text and lifecycle_state='disposed')
    and exists(select 1 from public.record_retention_history where record_id=f.article_id::text and action='retention_extend')
    and exists(select 1 from public.record_retention_history where record_id=f.article_id::text and action='retention_hold')
    and exists(select 1 from public.record_retention_history where record_id=f.article_id::text and action='retention_release_hold')
    and exists(select 1 from public.record_disposition_ledger where record_type='article' and record_id=f.article_id::text)
    and exists(select 1 from public.audit_logs where action='security_permanent_delete_article' and record_id=f.article_id::text)
  ) then raise exception 'P4_T056_FAILED'; end if;
end $$;
\echo 'PASS [P4-T056] due/extension/hold/release/permanent disposition lifecycle'

-- P4-T058 database implementation half.
do $$
begin
  if not(
    to_regclass('public.audit_logs') is not null
    and to_regclass('public.article_versions') is not null
    and to_regclass('public.verification_history') is not null
    and to_regclass('public.live_retention_registry') is not null
    and to_regclass('public.live_deletion_ledger') is not null
    and to_regclass('public.record_retention_state') is not null
    and to_regclass('public.record_retention_history') is not null
    and to_regclass('public.record_disposition_ledger') is not null
    and not has_function_privilege('authenticated','public.jb_records_audit_lookup_internal(uuid,text,text,integer)','EXECUTE')
  ) then raise exception 'P4_T058_DB_FAILED'; end if;
end $$;
\echo 'PASS [P4-T058-DB] protected old history homes preserved and B2 layer additive/service-only'

rollback;
