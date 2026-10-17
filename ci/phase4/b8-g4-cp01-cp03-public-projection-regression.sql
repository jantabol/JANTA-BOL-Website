\set ON_ERROR_STOP on
-- B8 G4 actual disposable PostgreSQL17 RLS, Founder-AAL2 and strict public allowlist.
-- No LIVE project, no real Editor private note, no actual new Article publication.
begin;
do $acl$
begin
 if has_table_privilege('anon','public.b8_g4_public_revisions','SELECT')
 or has_table_privilege('authenticated','public.b8_g4_public_milestones','INSERT')
 or has_function_privilege('anon',
 'public.jb_b8_g4_owner_release_public_projection(uuid,text,text,text,text,boolean)','EXECUTE')
 or not has_function_privilege('anon','public.jb_b8_g4_public_case(uuid)','EXECUTE')
 or not has_function_privilege('anon','public.jb_b8_g4_public_feed(integer)','EXECUTE')
 then raise exception 'B8_G4_UNSAFE_PUBLIC_RIGHTS';end if;
 raise notice 'G4 PostgreSQL17 ACL PASS anon can only call strict projection, no raw table access';
end $acl$;

-- The unapproved private Case contains a synthetic potentially sensitive title
-- that must never appear in ANY public payload.
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_session','on',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g1_owner_create_case(
 'SYNTHETIC PRIVATE SOURCE PHONE 9812345678 testing no public leak',
 'Pichhore','R1') as c_public \gset
select public.jb_b8_g1_owner_create_case(
 'STRICTLY UNPUBLISHED SOURCE RECORD identity privacy test',
 'Pichhore','R0') as c_private \gset
select public.jb_b8_g1_owner_create_case(
 'RESTRICTED MINOR PRIVATE SOURCE contact hidden at all times',
 'Pichhore','R2') as c_r2 \gset
select public.jb_b8_g2_owner_link_article(
 :'c_public'::uuid,'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') as link_published \gset
select public.jb_b8_g2_owner_link_article(
 :'c_public'::uuid,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') as link_draft \gset
reset role;
select set_config('b8.fixture_public_case',:'c_public',false);
select set_config('b8.fixture_private_case',:'c_private',false);
select set_config('b8.fixture_r2_case',:'c_r2',false);

set role anon;
do $unapproved$
declare v jsonb;
begin
 select public.jb_b8_g4_public_feed(12) into v;
 if v<>'[]'::jsonb then raise exception 'B8_G4_PRIVATE_CASE_IN_FEED';end if;
 if public.jb_b8_g4_public_case(current_setting('b8.fixture_public_case')::uuid) is not null
 or public.jb_b8_g4_public_case(current_setting('b8.fixture_private_case')::uuid) is not null
 or public.jb_b8_g4_public_case(current_setting('b8.fixture_r2_case')::uuid) is not null
 then raise exception 'B8_G4_UNAPPROVED_CASE_LEAK';end if;
end $unapproved$;
reset role;

-- Reporter cannot publish safe projection or approve its own source review.
select set_config('b8.fixture_actor','22222222-2222-2222-2222-222222222222',false);
select set_config('b8.fixture_aal','aal1',false);
set role authenticated;
do $reporter$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g4_owner_release_public_projection(
   current_setting('b8.fixture_public_case')::uuid,'PUBLISH',
   'PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',true);
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_G4_REPORTER_PUBLISHED_PRIVATE_CASE';end if;
end $reporter$;
reset role;

-- Owner AAL1 also denied; ownership does not bypass this.
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
set role authenticated;
do $owner_low$
declare denied boolean:=false;
begin
 begin
  perform public.jb_b8_g4_owner_release_public_projection(
   current_setting('b8.fixture_public_case')::uuid,'PUBLISH',
   'PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',true);
 exception when others then denied:=sqlerrm='B8_OWNER_AAL2_REQUIRED';end;
 if not denied then raise exception 'B8_G4_OWNER_AAL1_PUBLISHED';end if;
end $owner_low$;
reset role;
select set_config('b8.fixture_aal','aal2',false);

set role authenticated;
do $negative$
declare restricted boolean:=false;missing_ack boolean:=false;
        arbitrary_text boolean:=false;false_awaiting boolean:=false;
begin
 begin
  perform public.jb_b8_g4_owner_release_public_projection(
   current_setting('b8.fixture_r2_case')::uuid,'PUBLISH',
   'HEALTHCARE','PICHHORE','UNDER_REVIEW',true);
 exception when others then restricted:=sqlerrm='B8_G4_RESTRICTED_CASE_PUBLICATION_DENIED';end;
 begin
  perform public.jb_b8_g4_owner_release_public_projection(
   current_setting('b8.fixture_public_case')::uuid,'PUBLISH',
   'PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',false);
 exception when others then missing_ack:=sqlerrm='B8_G4_FOUNDER_PRIVACY_ATTESTATION_REQUIRED';end;
 begin
  perform public.jb_b8_g4_owner_release_public_projection(
   current_setting('b8.fixture_public_case')::uuid,'PUBLISH',
   'SYNTHETIC SOURCE PHONE 9812345678','PICHHORE','UNDER_REVIEW',true);
 exception when others then arbitrary_text:=sqlerrm='B8_G4_INVALID_PUBLIC_ENUM';end;
 begin
  perform public.jb_b8_g4_owner_release_public_projection(
   current_setting('b8.fixture_public_case')::uuid,'PUBLISH',
   'PUBLIC_WORKS','PICHHORE','AWAITING_RESPONSE',true);
 exception when others then false_awaiting:=sqlerrm='B8_G4_NO_REAL_OFFICIAL_DISPATCH_PROOF';end;
 if not(restricted and missing_ack and arbitrary_text and false_awaiting) then
  raise exception 'B8_G4_FALSE_APPROVAL_OR_PRIVACY_ESCALATION';end if;
end $negative$;
select public.jb_b8_g4_owner_release_public_projection(
 :'c_public'::uuid,'PUBLISH','PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',true) as pub_id \gset
select public.jb_b8_g4_owner_add_public_milestone(
 :'c_public'::uuid,'CASE_REVIEW_STARTED') as event_a \gset
reset role;

-- Nonexistent underlying Case events cannot be fabricated by Owner.
set role authenticated;
do $event_denial$
declare fake_q boolean:=false;fake_edit boolean:=false;
       fake_reply boolean:=false;fake_followup boolean:=false;
begin
 begin
  perform public.jb_b8_g4_owner_add_public_milestone(
   current_setting('b8.fixture_public_case')::uuid,'QUESTION_DRAFT_PREPARED');
 exception when others then fake_q:=sqlerrm='B8_G4_QUESTION_DRAFT_NOT_RECORDED';end;
 begin
  perform public.jb_b8_g4_owner_add_public_milestone(
   current_setting('b8.fixture_public_case')::uuid,'EDITORIAL_REVIEW_UPDATED');
 exception when others then fake_edit:=sqlerrm='B8_G4_EDITOR_REVIEW_NOT_RECORDED';end;
 begin
  perform public.jb_b8_g4_owner_add_public_milestone(
   current_setting('b8.fixture_public_case')::uuid,'RESPONSE_STATUS_NOT_VERIFIED');
 exception when others then fake_reply:=sqlerrm='B8_G4_HANDOFF_NOT_RECORDED';end;
 begin
  perform public.jb_b8_g4_owner_add_public_milestone(
   current_setting('b8.fixture_public_case')::uuid,'FOLLOWUP_ARTICLE_LINKED');
 exception when others then fake_followup:=sqlerrm='B8_G4_SECOND_PUBLISHED_ARTICLE_REQUIRED';end;
 if not(fake_q and fake_edit and fake_reply and fake_followup) then
  raise exception 'B8_G4_INVENTED_PUBLIC_TIMELINE_FACT';end if;
end $event_denial$;
reset role;

set role anon;
do $projection$
declare v jsonb;f jsonb;raw text;
begin
 v:=public.jb_b8_g4_public_case(current_setting('b8.fixture_public_case')::uuid);
 f:=public.jb_b8_g4_public_feed(12);
 raw:=v::text||f::text;
 if v->>'public_topic'<>'PUBLIC_WORKS'
 or v->>'public_area'<>'PICHHORE'
 or v->>'title'<>'Public works accountability'
 or (v->>'public_revision')::int<>1
 or jsonb_array_length(v->'articles')<>1
 or v->'articles'->0->>'article_id'<>'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
 or jsonb_array_length(v->'timeline')<>1
 or jsonb_array_length(f)<>1 then
   raise exception 'B8_G4_PUBLIC_ALLOWLIST_OR_PUBLISHED_ARTICLE_LINK_MISMATCH';end if;
 if raw like '%9812345678%' or raw like '%PRIVATE SOURCE%'
 or raw like '%SYNTHETIC PRIVATE%' or raw like '%PRIVATE DRAFT%'
 or raw like '%source_name%' or raw like '%object_key%'
 or raw like '%recipient%' or raw like '%editor%' or raw like '%/storage/%'
 or raw like '%confidential%' then
  raise exception 'B8_G4_PRIVATE_DATA_LEAKED_TO_ANON';end if;
 if v->>'source_evidence_public'<>'false'
 or v->>'official_reply_independently_verified'<>'false' then
  raise exception 'B8_G4_FALSE_PUBLIC_SOURCE_OR_OFFICIAL_VERIFICATION';end if;
 if public.jb_b8_g4_public_case(current_setting('b8.fixture_private_case')::uuid) is not null then
  raise exception 'B8_G4_UNAPPROVED_SECOND_CASE_VISIBLE';end if;
 raise notice 'B8 G4 PostgreSQL17 anonymous allowlisted response, filtered draft article, no phone/private/evidence leak PASS';
end $projection$;
reset role;

-- Article published→unpublished makes link vanish, original Article UUID unchanged.
update public.articles set status='unpublished'::public.article_status
 where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
set role anon;
do $unpublished$
declare v jsonb;
begin
 v:=public.jb_b8_g4_public_case(current_setting('b8.fixture_public_case')::uuid);
 if jsonb_array_length(v->'articles')<>0 then
  raise exception 'B8_G4_UNPUBLISHED_ARTICLE_STILL_PUBLIC_LINKED';end if;
end $unpublished$;
reset role;
update public.articles set status='published'::public.article_status,version=version+1
 where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Add genuine distinct SECOND published Article under original Founder, no rewrite.
select set_config('b8.fixture_actor','11111111-1111-1111-1111-111111111111',false);
select set_config('b8.fixture_aal','aal2',false);
set role authenticated;
select public.jb_b8_g2_owner_link_article(
 :'c_public'::uuid,'cccccccc-cccc-4ccc-8ccc-cccccccccccc') as followup_link \gset
-- Explicit regression for original flake: all three links in this transaction share
-- now() but must sort by new monotonic linked_order, never random UUID.
reset role;
do $link_order$
declare ids uuid[];
begin
 if (select count(distinct linked_at) from public.b8_case_article_links
     where case_id=current_setting('b8.fixture_public_case')::uuid)<>1 then
  raise exception 'B8_G4_EXPECTED_SAME_TRANSACTION_NOW_TIE_NOT_REPRODUCED';end if;
 select array_agg(article_id order by linked_order) into ids
 from public.b8_case_article_links
 where case_id=current_setting('b8.fixture_public_case')::uuid;
 if ids is distinct from array[
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc'::uuid] then
  raise exception 'B8_G4_LINKED_ORDER_NONDETERMINISTIC';end if;
 raise notice 'B8 G4 verified three same-transaction linked_at TIES, monotonic append linked_order preserved';
end $link_order$;
set role authenticated;
select public.jb_b8_g4_owner_add_public_milestone(
 :'c_public'::uuid,'FOLLOWUP_ARTICLE_LINKED') as follow_event \gset
select public.jb_b8_g4_owner_release_public_projection(
 :'c_public'::uuid,'REVISE','PUBLIC_WORKS','SHIVPURI','UPDATED',true) as revise_id \gset
select public.jb_b8_g4_owner_add_public_milestone(
 :'c_public'::uuid,'CASE_STATUS_UPDATED') as case_update_event \gset
reset role;
set role anon;
do $followups$
declare v jsonb;
begin
 v:=public.jb_b8_g4_public_case(current_setting('b8.fixture_public_case')::uuid);
 raise notice 'B8 G4 TRACE revision=% articles=% timeline=% status=%',
 v->>'public_revision', v->'articles', jsonb_array_length(v->'timeline'),v->>'public_status';
 if (v->>'public_revision')::int<>2
 or jsonb_array_length(v->'articles')<>2
 or v->'articles'->0->>'article_id'<>'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
 or v->'articles'->1->>'article_id'<>'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
 or jsonb_array_length(v->'timeline')<>3
 or v->>'public_status'<>'UPDATED'
 then raise exception 'B8_G4_CORRECTION_SAME_UUID_OR_NEW_FOLLOWUP_ID_LOST';end if;
end $followups$;
reset role;

-- HIDE is an append-only Founder AAL2 action. Anon immediately loses visibility.
set role authenticated;
select public.jb_b8_g4_owner_release_public_projection(
 :'c_public'::uuid,'HIDE',null,null,null,false) as hide_id \gset
reset role;
set role anon;
do $hide$
begin
 if public.jb_b8_g4_public_case(current_setting('b8.fixture_public_case')::uuid) is not null
 or public.jb_b8_g4_public_feed(12)<>'[]'::jsonb then
  raise exception 'B8_G4_HIDE_FAILED_TO_WITHDRAW_PUBLIC_CASE';end if;
end $hide$;
reset role;

-- History cannot be silently deleted, even by test DB privileged role.
do $immutable$
declare blocked_revision boolean:=false;blocked_event boolean:=false;
begin
 begin
  update public.b8_g4_public_revisions set action='PUBLISH'
   where case_id=current_setting('b8.fixture_public_case')::uuid;
 exception when others then blocked_revision:=sqlerrm='B8_G4_PUBLIC_APPROVAL_HISTORY_IMMUTABLE';end;
 begin
  delete from public.b8_g4_public_milestones
   where case_id=current_setting('b8.fixture_public_case')::uuid;
 exception when others then blocked_event:=sqlerrm='B8_G4_PUBLIC_APPROVAL_HISTORY_IMMUTABLE';end;
 if not(blocked_revision and blocked_event) then
  raise exception 'B8_G4_APPEND_ONLY_PUBLIC_HISTORY_MUTABLE';end if;
 if (select count(*) from public.b8_g4_public_revisions
   where case_id=current_setting('b8.fixture_public_case')::uuid)<>3
 or (select count(*) from public.b8_g4_public_milestones
   where case_id=current_setting('b8.fixture_public_case')::uuid)<>3 then
  raise exception 'B8_G4_APPEND_ONLY_PUBLIC_HISTORY_LOST';end if;
end $immutable$;

-- Explicit privacy review required before publishing again after safety withdrawal.
set role authenticated;
select public.jb_b8_g4_owner_release_public_projection(
 :'c_public'::uuid,'PUBLISH','PUBLIC_WORKS','PICHHORE','UNDER_REVIEW',true) as repub_id \gset
reset role;
set role anon;
do $repub$
declare v jsonb;
begin
 v:=public.jb_b8_g4_public_case(current_setting('b8.fixture_public_case')::uuid);
 if (v->>'public_revision')::int<>4 or jsonb_array_length(v->'timeline')<>3
 or jsonb_array_length(v->'articles')<>2
 then raise exception 'B8_G4_REPUBLICATION_LOST_HISTORY';end if;
end $repub$;
reset role;
rollback;

do $rolledback$
begin
 if (select count(*) from public.b8_g4_public_revisions)<>0
 or (select count(*) from public.b8_g4_public_milestones)<>0
 or (select count(*) from public.b8_cases)<>0
 or (select count(*) from public.articles)<>3
 or (select count(*) from public.articles
   where id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
     and status='published'::public.article_status and version=7)<>1
 or (select count(*) from public.ad_campaigns where status='requested')<>1
 then raise exception 'B8_G4_ROLLBACK_DAMAGED_OLD_ARTICLE_AD_SENTINEL';end if;
 raise notice 'B8 G4 FULL disposable PG17 privacy/founder/revision/timeline/article/correction/hide/republish ROLLBACK PASS';
end $rolledback$;
