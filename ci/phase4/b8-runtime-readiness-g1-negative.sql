\set ON_ERROR_STOP on
-- ISOLATED PG17 only, after G1 migration, BEFORE G2..G9.
do $$
declare x jsonb;
begin
 select public.jb_b8_g1_runtime_readiness() into x;
 if x->>'component' <> 'JANTA_BOL_B8' or x->>'contract'<>'G0_G9_20261017'
 or x->>'db_ready' <> 'false' then
  raise exception 'B8_READINESS_MUST_DENY_PARTIAL_G1 %',x;
 end if;
 if has_function_privilege('anon','public.jb_b8_g1_runtime_readiness()','EXECUTE')
 or not has_function_privilege('authenticated','public.jb_b8_g1_runtime_readiness()','EXECUTE') then
  raise exception 'B8_READINESS_PUBLIC_GRANTS_NOT_MINIMUM';
 end if;
 raise notice 'PASS: real Postgres G1-only B8 not ready, anon denied, authenticated read-only handshake';
end $$;
