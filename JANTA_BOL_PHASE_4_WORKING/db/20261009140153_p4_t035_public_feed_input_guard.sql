-- Minimum safe input guard. Patch the current definition in place without
-- exporting or replacing unrelated Production source, grants or data.
-- A concurrent definition change fails closed and requires a new source audit.
do $migration$
declare
 v_sql text := pg_get_functiondef('public.jb_ad_public_feed(text,text)'::regprocedure);
 v_find text := 'where c.status=''live''';
 v_replace text := 'where p_placement in (''homepage'',''article'') and length(p_scope) between 1 and 100 and c.status=''live''';
begin
 if md5(v_sql) <> 'f2aa206638a1528407b4e8b57aaf1fc4' then
  raise exception 'B7_BASELINE_CHANGED_REAUDIT_REQUIRED';
 end if;
 if (length(v_sql)-length(replace(v_sql,v_find,''))) <> length(v_find) then
  raise exception 'B7_PATCH_TARGET_NOT_UNIQUE';
 end if;
 execute replace(v_sql,v_find,v_replace);
end $migration$;
