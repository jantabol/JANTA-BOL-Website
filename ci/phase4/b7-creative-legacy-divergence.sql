\set ON_ERROR_STOP on
-- First divergence against ACTUAL existing LIVE RPC source in disposable PG.
-- Expect and RECORD that saving a new draft silently replaces old approved.
-- ROLLBACK restores baseline before the Minimum Safe Fix.
begin;
select set_config('b7.test_owner','enabled',true);
do $bug$
declare v_old uuid;v_dangerous uuid;
begin
 select id into v_old from public.ad_creatives
 where campaign_id='30000000-0000-0000-0000-000000000001'
   and approved=true limit 1;
 if v_old is null then raise exception 'SOURCE_FIXTURE_NO_OLD_APPROVED';end if;
 v_dangerous:=public.jb_ad_save_creative_internal(
  '30000000-0000-0000-0000-000000000001','text',null,
  'Unreviewed change should be DRAFT',null,null
 );
 if not exists(select 1 from public.ad_creatives
  where id=v_dangerous and approved=true)
  or exists(select 1 from public.ad_creatives
  where id=v_old and approved=true)
 then raise exception 'ORIGINAL_LIVE_FIRST_DIVERGENCE_NOT_REPRODUCED';end if;
 raise notice 'REPRODUCED [ADS-046] LIVE source SAVE auto-approves unreviewed draft and displaces existing approved creative; rolling back';
end $bug$;
rollback;
