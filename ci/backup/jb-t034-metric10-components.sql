-- T034 RCA8: private, read-only metric 10 per-relation differential fingerprints.
-- Execute in the SAME exported snapshot as pg_dump and the 16-metric manifest.
-- Clone uses the identical reviewed SQL. Never log the output or attach artifacts.
-- No raw relation names, grants, definitions, role names or user data are output.
-- 13 pipe-separated, fixed-type fields; privacy classifier validates each field.
SELECT pg_catalog.set_config('search_path','pg_catalog',false) AS t034_context \gset
SELECT n.nspname,
       md5(n.nspname || chr(31) || c.relname),
       md5(c.relkind::text),
       md5(pg_get_userbyid(c.relowner)),
       CASE WHEN c.relacl IS NULL THEN 'N'
            WHEN cardinality(c.relacl)=0 THEN 'E' ELSE 'X' END,
       md5(COALESCE(a.grantors, '<ACL_EMPTY>')),
       md5(COALESCE(a.grantees, '<ACL_EMPTY>')),
       md5(COALESCE(a.public_grants, '<ACL_EMPTY>')),
       md5(COALESCE(a.privileges, '<ACL_EMPTY>')),
       md5(COALESCE(a.grant_options, '<ACL_EMPTY>')),
       md5(CASE WHEN c.relacl IS NULL THEN '<ACL_NULL>'
                ELSE COALESCE(a.exact_acl,'<ACL_EMPTY>') END),
       c.relrowsecurity::text,
       c.relforcerowsecurity::text
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN LATERAL (
  SELECT
    string_agg(pg_get_userbyid(x.grantor),'|' ORDER BY pg_get_userbyid(x.grantor)) AS grantors,
    string_agg(CASE WHEN x.grantee=0 THEN 'PUBLIC'
                    ELSE 'ROLE:'||pg_get_userbyid(x.grantee) END,'|'
               ORDER BY CASE WHEN x.grantee=0 THEN 'PUBLIC'
                    ELSE 'ROLE:'||pg_get_userbyid(x.grantee) END) AS grantees,
    string_agg(jsonb_build_array('GRANTOR:'||pg_get_userbyid(x.grantor),
               'PUBLIC',x.privilege_type,x.is_grantable)::text,'|'
               ORDER BY pg_get_userbyid(x.grantor),x.privilege_type,x.is_grantable)
               FILTER (WHERE x.grantee=0) AS public_grants,
    string_agg(x.privilege_type,'|' ORDER BY x.privilege_type) AS privileges,
    string_agg(x.is_grantable::text,'|' ORDER BY x.is_grantable::text) AS grant_options,
    -- Exact metric-10 ACL tuple serialization (including duplicate tuples).
    string_agg(jsonb_build_array(
        'GRANTOR:'||pg_get_userbyid(x.grantor),
        CASE WHEN x.grantee=0 THEN 'PUBLIC'
             ELSE 'ROLE:'||pg_get_userbyid(x.grantee) END,
        x.privilege_type,x.is_grantable
    )::text,'|' ORDER BY pg_get_userbyid(x.grantor),
        CASE WHEN x.grantee=0 THEN 'PUBLIC'
             ELSE 'ROLE:'||pg_get_userbyid(x.grantee) END,
        x.privilege_type,x.is_grantable) AS exact_acl
  FROM aclexplode(c.relacl) AS x
) AS a
WHERE n.nspname IN ('public','private','auth','storage')
  AND c.relkind IN ('r','p','v','m','S')
ORDER BY n.nspname, md5(n.nspname || chr(31) || c.relname);
