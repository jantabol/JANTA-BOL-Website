-- P4-T034 CP-02 B1 protected database-level owner/ACL/locale identity.
-- One JSON line, NO credentials, secrets, personal rows, or SQL source bodies.
-- Run only inside same exported snapshot as the authoritative raw PG dump.
WITH db AS (
 SELECT * FROM pg_database WHERE datname=current_database()
), grants AS (
 SELECT d.datname,
        COALESCE(jsonb_agg(
          jsonb_build_object(
            'grantee', CASE WHEN a.grantee=0 THEN 'PUBLIC'
                            ELSE pg_get_userbyid(a.grantee) END,
            'grantor', pg_get_userbyid(a.grantor),
            'privilege', a.privilege_type,
            'grantable', a.is_grantable)
          ORDER BY a.grantee,a.grantor,a.privilege_type,a.is_grantable
        ),'[]'::jsonb) AS acl
 FROM db d LEFT JOIN LATERAL aclexplode(
    COALESCE(d.datacl,acldefault('d',d.datdba))
 ) a ON TRUE
 GROUP BY d.datname
)
SELECT jsonb_build_object(
 'database',d.datname,
 'owner',pg_get_userbyid(d.datdba),
 'encoding',pg_encoding_to_char(d.encoding),
 'provider',d.datlocprovider::text,
 'collate',d.datcollate,
 'ctype',d.datctype,
 'locale',d.datlocale,
 'collversion',d.datcollversion,
 'acl',g.acl,
 'database_settings',COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'role',CASE WHEN s.setrole=0 THEN 'ALL_ROLES'
                  ELSE pg_get_userbyid(s.setrole) END,
      'options',to_jsonb(s.setconfig)
    ) ORDER BY s.setrole)
    FROM pg_db_role_setting s WHERE s.setdatabase=d.oid
 ),'[]'::jsonb)
)::text
FROM db d JOIN grants g USING(datname);
