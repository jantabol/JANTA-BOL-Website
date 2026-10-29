\set ON_ERROR_STOP on
-- ISOLATED PG17 only, after all 14 G1..G9 SQL slices.
do $$
declare x jsonb;
begin
 select public.jb_b8_g1_runtime_readiness() into x;
 if x->>'component' <> 'JANTA_BOL_B8' or x->>'contract'<>'G0_G9_20261017'
 or x->>'db_ready' <> 'true' then
  raise exception 'B8_READINESS_MUST_ALLOW_COMPLETE_DB_AFTER_G9 %',x;
 end if;
 if x->>'official_send_by_app'<>'false'
 or x->>'edge_storage_verified'<>'false'
 or x->>'e9_external_authenticity_verified'<>'false' then
  raise exception 'B8_READINESS_CANNOT_MISREPRESENT_OFFICIAL_PROOF %',x;
 end if;
 raise notice 'PASS: real Postgres all G0-G9 SQL present; never claim upload/official source verification';
end $$;
