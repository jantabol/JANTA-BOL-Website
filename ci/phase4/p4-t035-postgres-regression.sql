\set ON_ERROR_STOP on
begin;
insert into public.advertisers values
('00000000-0000-0000-0000-000000000001','normal','pending'),
('00000000-0000-0000-0000-000000000002','high','pending');
insert into public.ad_campaigns values
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','live','homepage','global',now(),now(),now(),now()-interval '1 day',now()+interval '1 day'),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002','live','homepage','global',now(),now(),now(),now()-interval '1 day',now()+interval '1 day'),
('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001','live','article','district:shivpuri',now(),now(),now(),now()-interval '1 day',now()+interval '1 day');
insert into public.ad_creatives(id,campaign_id,creative_type,text_body,approved) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','text','safe advertisement',true),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','text','high risk',true),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','text','district',true);
create temp table evidence(test text,pass boolean);
insert into evidence select 'unpaid hidden',count(*)=0 from public.jb_ad_public_feed('homepage','global');
insert into evidence select 'legacy unpaid hidden',count(*)=0 from public.jb_public_active_ads('homepage');
insert into public.ad_payments values
('30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','confirmed',1000,'receipt-1'),
('30000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002','confirmed',1000,'receipt-2'),
('30000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000003','confirmed',1000,'receipt-3');
insert into evidence select 'paid normal eligible',count(*)=1 from public.jb_ad_public_feed('homepage','global');
insert into evidence select 'high risk unverified excluded',count(*)=1 from public.jb_ad_public_feed('homepage','global');
insert into evidence select 'legacy delegates',count(*)=1 from public.jb_public_active_ads('homepage');
insert into evidence select 'district scope allowed',count(*)=1 from public.jb_ad_public_feed('article','district:shivpuri');
insert into evidence select 'global excludes district-only',count(*)=0 from public.jb_ad_public_feed('article','global');
update public.advertisers set verification_state='verified' where risk_level='high';
update public.ad_campaigns set status='paused' where id='10000000-0000-0000-0000-000000000001';
insert into evidence select 'verified high risk eligible',count(*)=1 from public.jb_ad_public_feed('homepage','global');
update public.ad_campaigns set status='live',paid_at=null where id='10000000-0000-0000-0000-000000000002';
insert into evidence select 'paid timestamp required',count(*)=0 from public.jb_ad_public_feed('homepage','global');
update public.ad_campaigns set status='paused' where id='10000000-0000-0000-0000-000000000001';
insert into evidence select 'no active eligible',count(*)=0 from public.jb_ad_public_feed('homepage','global');
insert into evidence select 'invalid placement hidden',count(*)=0 from public.jb_ad_public_feed('invalid','global');
insert into evidence select 'anon can execute canonical',has_function_privilege('anon','public.jb_ad_public_feed(text,text)','EXECUTE');
insert into evidence select 'anon can execute legacy',has_function_privilege('anon','public.jb_public_active_ads(text)','EXECUTE');
insert into evidence select 'trigger denies direct anon',not has_function_privilege('anon','private.p4_validate_ad_creative_media()','EXECUTE');
-- T035 supported creative formats, latest approved version, label and scope.
update public.ad_campaigns set status='live',paid_at=now()
where id='10000000-0000-0000-0000-000000000001';
insert into public.ad_creatives(id,campaign_id,creative_type,media_url,approved,version)
values ('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','image','https://example.org/banner.png',true,2);
insert into evidence select 'image creative returned',
  count(*)=1 from public.jb_ad_public_feed('homepage','global')
  where creative_type='image' and media_url='https://example.org/banner.png' and label='विज्ञापन';
insert into public.ad_creatives(id,campaign_id,creative_type,media_url,approved,version)
values ('20000000-0000-0000-0000-000000000005','10000000-0000-0000-0000-000000000001','video','https://example.org/spot.mp4',true,3);
insert into evidence select 'video creative returned',
  count(*)=1 from public.jb_ad_public_feed('homepage','global')
  where creative_type='video' and media_url='https://example.org/spot.mp4' and label='विज्ञापन';
insert into evidence select 'legacy video label and content',
  count(*)=1 from public.jb_public_active_ads('homepage')
  where creative_type='video' and label='विज्ञापन';
insert into evidence select 'empty scope denied',count(*)=0 from public.jb_ad_public_feed('homepage','');
insert into evidence select 'oversized scope denied',count(*)=0 from public.jb_ad_public_feed('homepage',repeat('x',101));
insert into evidence select 'wrong placement denied',count(*)=0 from public.jb_ad_public_feed('article','global');
update public.ad_campaigns set status='paused'
where id='10000000-0000-0000-0000-000000000001';
-- Expected trigger errors are caught inside a nested savepoint-style PL/pgSQL block.
do $guard$
declare v text;
begin
 begin
  insert into public.ad_creatives(id,campaign_id,creative_type,approved)
  values ('40000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','image',true);
  insert into evidence values ('empty approved image rejected',false);
 exception when sqlstate '22023' then
  get stacked diagnostics v=message_text;
  insert into evidence values ('empty approved image rejected',v='CREATIVE_CONTENT_REQUIRED');
 end;
 begin
  insert into public.ad_creatives(id,campaign_id,creative_type,media_url,approved)
  values ('40000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','image','http://bad.example/ad.png',true);
  insert into evidence values ('non-HTTPS image rejected',false);
 exception when sqlstate '22023' then
  get stacked diagnostics v=message_text;
  insert into evidence values ('non-HTTPS image rejected',v='INVALID_MEDIA_URL');
 end;
 begin
  insert into public.ad_creatives(id,campaign_id,creative_type,text_body,cta_type,cta_target,approved)
  values ('40000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','text','valid','website','http://bad.example',true);
  insert into evidence values ('non-HTTPS CTA rejected',false);
 exception when sqlstate '22023' then
  get stacked diagnostics v=message_text;
  insert into evidence values ('non-HTTPS CTA rejected',v='HTTPS_CTA_REQUIRED');
 end;
 begin
  insert into public.ad_creatives(id,campaign_id,creative_type,text_body,cta_type,cta_target,approved)
  values ('40000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','text','valid','call','invalid-phone',true);
  insert into evidence values ('invalid phone CTA rejected',false);
 exception when sqlstate '22023' then
  get stacked diagnostics v=message_text;
  insert into evidence values ('invalid phone CTA rejected',v='PHONE_CTA_REQUIRED');
 end;
end $guard$;
-- Positive CTA controls detect validators that reject every phone number.
do $positive$
declare v_phone text; v_type text;
begin
 foreach v_phone in array array['+919876543210','9876543210','91 98765-43210'] loop
  foreach v_type in array array['call','whatsapp'] loop
   begin
    insert into public.ad_creatives(id,campaign_id,creative_type,text_body,cta_type,cta_target,approved)
    values(gen_random_uuid(),'10000000-0000-0000-0000-000000000001','text','Valid phone test',v_type,v_phone,true);
    insert into evidence values('valid '||v_type||' '||v_phone,true);
   exception when sqlstate '22023' then
    insert into evidence values('valid '||v_type||' '||v_phone,false);
   end;
  end loop;
 end loop;
end $positive$;
-- Disposable fixture only: emulate pre-hardening drafts without modifying production.
alter table public.ad_creatives disable trigger p4_validate_ad_creative_media;
insert into public.ad_creatives(id,campaign_id,creative_type,media_url,approved)
values('50000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','image','http://legacy.invalid/banner.png',false);
alter table public.ad_creatives enable trigger p4_validate_ad_creative_media;
update public.ad_creatives set approved=false where id='50000000-0000-0000-0000-000000000001';
insert into evidence select 'legacy draft preserved unchanged',media_url='http://legacy.invalid/banner.png' and not approved
from public.ad_creatives where id='50000000-0000-0000-0000-000000000001';
do $legacy$
begin
 begin
  update public.ad_creatives set approved=true where id='50000000-0000-0000-0000-000000000001';
  insert into evidence values('legacy invalid draft approval denied',false);
 exception when sqlstate '22023' then insert into evidence values('legacy invalid draft approval denied',true);
 end;
end $legacy$;
insert into evidence select 'null scope denied',count(*)=0 from public.jb_ad_public_feed('homepage',null);
do $guard$
declare n int;
begin
 select count(*) into n from evidence where not pass;
 if n>0 then raise exception 'P4_T035_ISOLATED_REGRESSION_FAILED: %', (select string_agg(test,', ') from evidence where not pass); end if;
end $guard$;
select case when pass then 'PASS' else 'FAIL' end || ' [P4-T035] ' || test from evidence order by test;
rollback;
