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
do $$
declare n int;
begin
 select count(*) into n from evidence where not pass;
 if n>0 then raise exception 'P4_T035_ISOLATED_REGRESSION_FAILED: %', (select string_agg(test,', ') from evidence where not pass); end if;
end $$;
select case when pass then 'PASS' else 'FAIL' end || ' [P4-T035] ' || test from evidence order by test;
rollback;
