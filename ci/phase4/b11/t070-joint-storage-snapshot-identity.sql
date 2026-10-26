-- P4-T070: storage.objects identity belonging to the SAME PG exported MVCC snapshot as raw_full.dump.
-- DO NOT print unencrypted output. Compare to original-bytes receipt inside runner private tmpdir.
-- PostgreSQL name, bucket, id, updated_at are encrypted inside dual AGE bundle.
SELECT COALESCE(
 jsonb_agg(jsonb_build_object(
 'bucket',o.bucket_id,
 'key',o.name,
 'id',o.id::text,
 'updated_at',to_char(o.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
 ) ORDER BY o.bucket_id,o.name),
 '[]'::jsonb)::text
FROM storage.objects o
WHERE o.bucket_id IN ('grievance-private','private-editorial','public-media');
