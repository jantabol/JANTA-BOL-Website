-- B8 T094 CP03: fail-closed reporter browser/backend parity.
-- Apply ONLY after source-binding migration in disposable PG17.
-- No writes to original news, ads, case facts or external provider.
create function public.jb_b8_t094_source_binding_readiness()
returns jsonb language sql stable security invoker set search_path=''
as $b8$
 select pg_catalog.jsonb_build_object(
   'contract','B8_T094_SOURCE_BINDING_V1',
   'server_guard_ready',coalesce(
     pg_catalog.to_regclass('public.b8_question_evidence_links') is not null
     and pg_catalog.to_regprocedure('public.jb_b8_g1_reporter_bind_question_evidence(uuid,uuid)') is not null
     and pg_catalog.strpos(pg_catalog.pg_get_functiondef('public.jb_b8_g3_reporter_prepare_manual_handoff(uuid,text)'::regprocedure),
       'B8_T094_QUESTION_SOURCE_LINK_REQUIRED')>0,
     false),
   'official_send_by_app',false,
   'source_independently_verified',false
 );
$b8$;
revoke all on function public.jb_b8_t094_source_binding_readiness()
from public,anon,authenticated;
grant execute on function public.jb_b8_t094_source_binding_readiness()
to authenticated;
