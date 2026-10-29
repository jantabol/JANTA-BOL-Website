-- JANTA BOL B8 Android UX case picker — private OWNER-only read, ADDITIVE.
-- REVIEW_ONLY until isolated PG17 security tests + explicit release checkpoint.
-- Does not touch B0–B7, news Article PURLs, ad billing, media or outgoing notifications.
-- No case title is ever returned to anon, Reporter, Editor or AAL1 Founder.
create function public.jb_b8_g1_owner_case_choices()
returns jsonb language plpgsql stable security definer set search_path=''
as $b8$
declare v_choices jsonb;
begin
 if not coalesce(private.current_owner_aal2(),false) then
   raise exception 'B8_OWNER_AAL2_REQUIRED';
 end if;
 select coalesce(pg_catalog.jsonb_agg(
   pg_catalog.jsonb_build_object(
     'id',s.id,'title',s.title,'area',s.area_label,
     'risk_lane',s.risk_lane,'state',s.case_state)
   order by s.created_at desc,s.id
 ),'[]'::jsonb)
 into v_choices
 from (
   select id,title,area_label,risk_lane,case_state,created_at
   from public.b8_cases
   order by created_at desc,id
   limit 50
 ) s;
 return v_choices;
end;
$b8$;
revoke all on function public.jb_b8_g1_owner_case_choices()
 from public,anon,authenticated;
grant execute on function public.jb_b8_g1_owner_case_choices()
 to authenticated;
-- Direct access to public.b8_cases remains DENIED.
-- Response contains no evidence, question text, source identities, e9 proofs or private media.
