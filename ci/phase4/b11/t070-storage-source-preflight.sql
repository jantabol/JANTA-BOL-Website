-- T070 G2 SOURCE ONLY: safe aggregate metadata and grievance object relationship.
-- This is NOT file-byte recovery, file decryption, B2 recovery or restore evidence.
-- Do not log object paths, user IDs, media bytes, SHA values, or JWTs.
WITH scoped_buckets AS (
 SELECT b.id, b.public
 FROM storage.buckets AS b
 WHERE b.id IN ('grievance-private', 'private-editorial', 'public-media')
), object_counts AS (
 SELECT b.id AS bucket_id, b.public AS is_public,
        count(o.id)::integer AS object_count,
        count(o.id) FILTER (WHERE o.metadata->>'size' ~ '^[0-9]+$')::integer AS size_metadata_count,
        count(o.id) FILTER (WHERE o.metadata ? 'sha256')::integer AS metadata_hash_field_count
 FROM scoped_buckets AS b
 LEFT JOIN storage.objects AS o ON o.bucket_id=b.id
 GROUP BY b.id, b.public
), evidence_counts AS (
 SELECT count(e.id)::integer AS evidence_rows,
        count(e.id) FILTER (WHERE o.id IS NOT NULL)::integer AS matched_object_paths,
        count(e.id) FILTER (WHERE e.sha256 ~ '^[A-Fa-f0-9]{64}$')::integer AS evidence_recorded_hash_count,
        count(e.id) FILTER (WHERE e.byte_size IS NOT NULL)::integer AS evidence_recorded_size_count
 FROM public.grievance_evidence AS e
 LEFT JOIN storage.objects AS o ON o.bucket_id=e.bucket_id AND o.name=e.storage_path
)
SELECT object_counts.bucket_id, object_counts.is_public,
       object_counts.object_count, object_counts.size_metadata_count,
       object_counts.metadata_hash_field_count,
       evidence_counts.evidence_rows, evidence_counts.matched_object_paths,
       evidence_counts.evidence_recorded_hash_count, evidence_counts.evidence_recorded_size_count,
       'SOURCE_METADATA_ONLY_NOT_RESTORED_BYTES' AS evidence_scope
FROM object_counts CROSS JOIN evidence_counts
ORDER BY object_counts.bucket_id;
