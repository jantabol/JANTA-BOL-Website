\set ON_ERROR_STOP on
-- P4-T034 exact old overloads: fail closed after candidate repair.
-- Isolated PostgreSQL fixture only. All test writes rolled back.
begin;

do $acl$
declare sig text;
begin
 foreach sig in array array[
  'public.jb_ad_public_request(text,text,text,text,text)',
  'public.jb_ad_public_request(text,text,uuid,text,text,text)',
  'public.jb_ad_public_request(text,text,uuid,text,text,text,text)'
 ] loop
  if to_regprocedure(sig) is null then raise exception 'LEGACY_SIGNATURE_MISSING: %',sig;end if;
  if has_function_privilege('anon',sig,'EXECUTE') then
   raise exception 'ANONYMOUS_LEGACY_EXECUTE_BYPASS: %',sig;end if;
  if not has_function_privilege('authenticated',sig,'EXECUTE') then
   raise exception 'OWNER_CLIENT_COMPATIBILITY_BROKEN: %',sig;end if;
 end loop;
 if not has_function_privilege('anon',
  'public.jb_ad_public_enquiry(text,text,boolean,text,uuid,text)','EXECUTE')
 then raise exception 'CONSENT_PUBLIC_ENDPOINT_NOT_EXPOSED';end if;
 if has_function_privilege('anon',
  'public.jb_ad_verify_advertiser_internal(uuid,text,text,text)','EXECUTE')
 then raise exception 'ANON_VERIFICATION_EXPOSED';end if;
end $acl$;

set local role anon;
do $anon$
declare msg text;
begin
 begin
  perform public.jb_ad_public_request('Anon Shop','9999912345','homepage','global','normal');
  raise exception 'ANON_INSERT_SUCCEEDED_5';
 exception when others then
  get stacked diagnostics msg=message_text;
  if position('permission denied' in msg)=0 then raise exception 'ANON_5_NOT_DENIED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_public_request('Anon Shop','9999912345',null::uuid,'homepage','global','normal');
  raise exception 'ANON_INSERT_SUCCEEDED_6';
 exception when others then
  get stacked diagnostics msg=message_text;
  if position('permission denied' in msg)=0 then raise exception 'ANON_6_NOT_DENIED: %',msg;end if;
 end;
 begin
  perform public.jb_ad_public_request('Anon Shop','9999912345',null::uuid,'homepage','global','normal','standard');
  raise exception 'ANON_INSERT_SUCCEEDED_7';
 exception when others then
  get stacked diagnostics msg=message_text;
  if position('permission denied' in msg)=0 then raise exception 'ANON_7_NOT_DENIED: %',msg;end if;
 end;
end $anon$;
reset role;

set local role authenticated;
do $nonowner$
declare msg text;
begin
 begin
  perform public.jb_ad_public_request('Other User Shop','9999912345','homepage','global','normal');
  raise exception 'NONOWNER_5_INSERT_SUCCEEDED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then raise exception 'NONOWNER_5_BYPASS: %',msg;end if;
 end;
 begin
  perform public.jb_ad_public_request('Other User Shop','9999912345',null::uuid,'homepage','global','normal');
  raise exception 'NONOWNER_6_INSERT_SUCCEEDED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then raise exception 'NONOWNER_6_BYPASS: %',msg;end if;
 end;
 begin
  perform public.jb_ad_public_request('Other User Shop','9999912345',null::uuid,'homepage','global','normal','standard');
  raise exception 'NONOWNER_7_INSERT_SUCCEEDED';
 exception when others then
  get stacked diagnostics msg=message_text;
  if msg<>'OWNER_AAL2_REQUIRED' then raise exception 'NONOWNER_7_BYPASS: %',msg;end if;
 end;
end $nonowner$;
reset role;

do $owner$
declare a_before int; c_before int; new_id uuid;
begin
 select count(*) into a_before from public.advertisers;
 select count(*) into c_before from public.ad_campaigns;
 if a_before<>0 or c_before<>0 then
  raise exception 'DIRTY_LEGACY_FIXTURE';end if;
 perform set_config('b7.test_owner','enabled',true);
 new_id:=public.jb_ad_public_request('Owner Shop','7777712345','homepage','global','normal');
 if new_id is null then raise exception 'OWNER_LEGACY_5_NO_RECEIPT';end if;
 new_id:=public.jb_ad_public_request('Owner Shop 6','7777712346',null::uuid,'homepage','local','high');
 if new_id is null then raise exception 'OWNER_LEGACY_6_NO_RECEIPT';end if;
 new_id:=public.jb_ad_public_request('Owner Shop 7','7777712347',null::uuid,'article','local','normal','custom');
 if new_id is null then raise exception 'OWNER_LEGACY_7_NO_RECEIPT';end if;
 if (select count(*) from public.ad_campaigns)<>c_before+3
 or (select count(*) from public.advertisers)<>a_before+3
 then raise exception 'OWNER_LEGACY_COMPATIBILITY_BROKEN';end if;
 if exists(select 1 from public.ad_campaigns
  where status<>'requested' or approved_at is not null or paid_at is not null)
 then raise exception 'UNEXPECTED_APPROVAL_OR_LIVE';end if;
 if (select count(*) from public.ad_history where event_type='owner_request')<>3
 then raise exception 'LEGACY_AUDIT_MISSING';end if;
 raise notice 'PASS [P4-T034] all 3 anon denied + all 3 nonowner denied + owner legacy positive + requested-only + original history';
end $owner$;
rollback;
