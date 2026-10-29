-- E2 isolated actual PostgreSQL queue/lease/immutable proof, no live DB.
DO $tests$
DECLARE p jsonb; id uuid; again uuid; claim jsonb;
        asset uuid := '44444444-4444-4444-8444-444444444444';
        sha text := repeat('a',64); bad jsonb; n integer;
BEGIN
 IF has_function_privilege('anon',
    'private.b7_media_queue_enqueue_server(jsonb)','EXECUTE')
 OR has_function_privilege('authenticated',
    'private.b7_media_queue_claim_server()','EXECUTE')
 OR has_table_privilege('service_role',
    'private.b7_ad_media_commands','INSERT')
 OR has_table_privilege('anon','private.b7_ad_media_commands','SELECT')
 THEN RAISE EXCEPTION 'B7_QUEUE_LEAKED_PUBLIC_PRIVILEGES';END IF;

 p:=jsonb_build_object(
  'owner_user_id','11111111-1111-4111-8111-111111111111',
  'owner_session_id','55555555-5555-4555-8555-555555555555',
  'idempotency_key','77777777-7777-4777-8777-777777777777',
  'campaign_id','33333333-3333-4333-8333-333333333333',
  'creative_id','22222222-2222-4222-8222-222222222222',
  'creative_version',4,'kind','image',
  'source_asset_id','88888888-8888-4888-8888-888888888888',
  'source_bucket','jb-ad-originals-private',
  'source_path','staged/88888888-8888-4888-8888-888888888888/'||sha||'.png',
  'source_sha256',sha,'source_bytes',1024,'source_mime','image/png');
 id:=private.b7_media_queue_enqueue_server(p);
 IF id IS NULL THEN RAISE EXCEPTION 'B7_QUEUE_INSERT_FAILED';END IF;
 again:=private.b7_media_queue_enqueue_server(p);
 IF again IS DISTINCT FROM id
 THEN RAISE EXCEPTION 'B7_QUEUE_IDEMPOTENCY_BROKEN';END IF;
 IF private.b7_media_queue_read_server(id)->>'source_sha256' IS DISTINCT FROM sha
 THEN RAISE EXCEPTION 'B7_QUEUE_READBACK_FAILED';END IF;
 SELECT count(*) INTO n FROM private.b7_ad_media_commands;
 IF n<>1 THEN RAISE EXCEPTION 'B7_QUEUE_DUPLICATE_INSERT';END IF;

 BEGIN
  PERFORM private.b7_media_queue_enqueue_server(
   jsonb_set(p,'{source_sha256}',to_jsonb(repeat('b',64))));
  RAISE EXCEPTION 'B7_QUEUE_FORGED_SOURCE_WAS_ACCEPTED';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='B7_QUEUE_FORGED_SOURCE_WAS_ACCEPTED' THEN RAISE;END IF;
 END;
 BEGIN
  PERFORM private.b7_media_queue_enqueue_server(
   jsonb_set(p,'{source_bucket}',to_jsonb('public-media'::text)));
  RAISE EXCEPTION 'B7_QUEUE_PUBLIC_SOURCE_WAS_ACCEPTED';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='B7_QUEUE_PUBLIC_SOURCE_WAS_ACCEPTED' THEN RAISE;END IF;
 END;
 BEGIN
  PERFORM private.b7_media_queue_enqueue_server(p||jsonb_build_object(
   'token','JWT_MUST_NOT_BE_STORED'));
  RAISE EXCEPTION 'B7_QUEUE_TOKEN_WAS_ACCEPTED';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='B7_QUEUE_TOKEN_WAS_ACCEPTED' THEN RAISE;END IF;
 END;
 claim:=private.b7_media_queue_claim_server();
 IF claim->>'id' IS DISTINCT FROM id::text OR
    claim->>'status'<>'leased' OR (claim->>'lease_id') IS NULL
 THEN RAISE EXCEPTION 'B7_QUEUE_CLAIM_FAILED';END IF;
 IF private.b7_media_queue_claim_server() IS NOT NULL
 THEN RAISE EXCEPTION 'B7_QUEUE_DOUBLE_CLAIM';END IF;
 IF private.b7_media_queue_complete_server(
    id,(claim->>'lease_id')::uuid,asset)
 THEN RAISE EXCEPTION 'B7_QUEUE_UNVERIFIED_RECEIPT_COMPLETED';END IF;
 IF private.b7_media_queue_complete_server(
    id,'99999999-9999-4999-8999-999999999999',asset)
 THEN RAISE EXCEPTION 'B7_QUEUE_FORGED_LEASE_COMPLETED';END IF;
 INSERT INTO private.b7_ad_media_receipts VALUES(asset,
  (p->>'creative_id')::uuid,(p->>'campaign_id')::uuid,4,
  (p->>'owner_user_id')::uuid,p->>'source_path',sha,'private_quarantined');
 IF NOT private.b7_media_queue_complete_server(
    id,(claim->>'lease_id')::uuid,asset)
 THEN RAISE EXCEPTION 'B7_QUEUE_VERIFIED_RECEIPT_NOT_COMPLETED';END IF;
 IF private.b7_media_queue_claim_server() IS NOT NULL OR
    private.b7_media_queue_complete_server(id,(claim->>'lease_id')::uuid,asset)
 THEN RAISE EXCEPTION 'B7_QUEUE_COMPLETION_REPLAY';END IF;
 RAISE NOTICE 'B7_MEDIA_QUEUE_ISOLATED_POSTGRES_PASS: idempotency, lease, receipt, auth grants, no replay';
END $tests$;
