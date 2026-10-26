// JANTA BOL P4-T070 G11: cross-system proof matrix. DOES NOT restore or authorize release.
// Historical T034 database and T069 media both passed individually; same-point disaster
// recovery, durable Founder AGE private-key recovery, Auth/Platform runtime remain distinct.
const P='vrffsnkycvjithwtiylt';
const digits=x=>typeof x==='string'&&/^[1-9][0-9]{7,19}$/.test(x);
const hex=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const bool=x=>x===true;
function result(code,ok){return {code,state:ok?'ASSERTED_NEEDS_INDEPENDENT_EVIDENCE':'HOLD'};}
export function assessT070G11(p={}) {
 const db=p.database??{}, media=p.media??{}, one=p.coherence??{},
       owner=p.owner??{}, platform=p.platform??{}, identity=p.identity??{},
       audit=p.audit??{};
 const checks=[
  result('EXACT_PROJECT_SCOPE',p.project===P&&p.cricket_touched===false),
  result('REAL_DATABASE_OFFSITE_CLONE',digits(db.run_id)&&bool(db.pgp17_offline_clone)&&bool(db.encrypted_offsite_readback)&&bool(db.all_26_parity)&&bool(db.all_16_security_parity)),
  result('REAL_ALL_FIVE_MEDIA_OFFSITE',digits(media.run_id)&&media.file_count===5&&media.grievance_file_count===2&&bool(media.b2_ciphertext_readback)&&bool(media.isolated_original_byte_sha256_parity)&&bool(media.non_destructive)),
  // On separate dates a DB snapshot and Storage export CANNOT be called one atomic point.
  // A caller-supplied checkpoint ID is NOT proof; require independently evidenced write barrier.
  result('ONE_TRUSTED_RECOVERY_POINT',
    typeof one.point_id==='string'&&/^JB-[A-Za-z0-9_-]{12,120}$/.test(one.point_id)&&
    one.database_point_id===one.point_id&&one.media_point_id===one.point_id&&
    bool(one.protected_write_quiescence_observed)&&bool(one.source_media_double_scan)&&
    bool(one.source_db_manifest_pinned)&&bool(one.no_app_writes_between_capture_and_restore)&&
    bool(one.external_point_provenance_reviewed)),
  // The T069 ephemeral second AGE recipient can decrypt in the same job; that alone
  // does not prove Founder can recover ciphertext after runner cleanup/disaster.
  result('DURABLE_INDEPENDENT_OWNER_AGE_KEY_RECOVERY',
    bool(owner.founder_private_key_available_off_ci)&&
    bool(owner.new_isolated_restore_from_b2_after_original_runner_destroyed)&&
    bool(owner.founder_primary_recipient_decrypted_offline)&&bool(owner.all_5_sha256_verified)),
  result('COMPLETE_ISOLATED_RUNTIME_RESTORE',
    bool(platform.disposable_destination)&&bool(platform.real_db_media_restored_together)&&
    bool(platform.auth_service_reconstructed_and_probed)&&bool(platform.rls_negative_access_tests)&&
    bool(platform.storage_private_anon_denial)&&bool(platform.edge_functions_all_recovered_and_tested)&&
    bool(platform.vercel_runtime_config_restored_and_tested)&&
    bool(platform.session_rotation_revocation_reviewed)),
  result('PERMANENT_IDENTITY_RELATIONSHIPS',
    bool(identity.article_permanent_ids_urls)&&bool(identity.grievance_ids_history)&&
    bool(identity.live_session_relationships)&&bool(identity.advertiser_ads_relationships)&&
    bool(identity.auth_ownership_recovered)),
  result('ZERO_ROW_EXERCISE_IN_CLONE_ONLY',
    bool(identity.live_update_fixture_tested_in_disposable)&&
    bool(identity.ad_payment_fixture_tested_in_disposable)&&
    bool(identity.production_has_no_artificial_rows)),
  result('FINAL_E1_E2_E4_E5_E8_INDEPENDENT_SECURITY',
    bool(audit.E1)&&bool(audit.E2)&&bool(audit.E4)&&bool(audit.E5)&&bool(audit.E8)&&
    bool(audit.independent_security_review)&&bool(audit.real_android_checks)&&
    bool(audit.production_untouched)&&bool(audit.no_secrets_or_private_evidence_disclosed))
 ];
 const missing=checks.filter(x=>x.state==='HOLD').map(x=>x.code);
 return Object.freeze({status:missing.length?'HOLD':'READY_FOR_E8_INDEPENDENT_FOUNDER_REVIEW',
  project:P,missing,checks,
  // This untrusted input evaluator can NEVER certify live action, final PASS, LOCK or T071.
  final_pass:false,final_lock:false,can_start_t071:false,
  warning:'All true fields are untrusted claims until linked to actual isolated restore and independently verified logs.'});
}
