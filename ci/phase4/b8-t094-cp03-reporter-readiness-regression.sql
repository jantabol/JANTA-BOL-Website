\set ON_ERROR_STOP on
-- Real PG17 with CP03 source binding installed: Browser must not mistake old G0-G9 for T094-ready.
do $t094$
begin
 if pg_catalog.to_regprocedure('public.jb_b8_t094_source_binding_readiness()') is null
 or has_function_privilege('anon','public.jb_b8_t094_source_binding_readiness()','EXECUTE')
 or not has_function_privilege('authenticated','public.jb_b8_t094_source_binding_readiness()','EXECUTE')
 then raise exception 'B8_T094_READINESS_PRIVILEGE_CONTRACT_BROKEN';end if;
end $t094$;
set role authenticated;
do $t094$
declare j jsonb;
begin
 j:=public.jb_b8_t094_source_binding_readiness();
 if j->>'contract'<>'B8_T094_SOURCE_BINDING_V1'
    or (j->>'server_guard_ready')::boolean is distinct from true
    or (j->>'official_send_by_app')::boolean is distinct from false
    or (j->>'source_independently_verified')::boolean is distinct from false
 then raise exception 'B8_T094_REPORTER_UI_FALSE_READINESS';end if;
end $t094$;
reset role;
\echo 'B8 T094 CP03 readiness: real PG17 guard enabled, authenticated-only, external send OFF PASS'
