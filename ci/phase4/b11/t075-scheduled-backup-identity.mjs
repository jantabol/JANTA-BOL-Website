// P4-T075 — extra, strictly opt-in scheduled backup authority.
// Existing T034/T069/T070 Founder-only manual workflow guards remain unchanged.
export const SCHEDULED_WORKFLOW='jantabol/JANTA-BOL-Website/.github/workflows/b11-t075-scheduled-encrypted-joint-review.yml@refs/heads/main';
export const SCHEDULED_AUTH='JANTA_BOL_T075_SCHEDULED_ENCRYPTED_JOINT_2026';
export function assertScheduledBackupContext(env=process.env){
  const required={
    GITHUB_ACTIONS:'true',
    GITHUB_EVENT_NAME:'schedule',
    GITHUB_REPOSITORY:'jantabol/JANTA-BOL-Website',
    GITHUB_REF:'refs/heads/main',
    GITHUB_WORKFLOW_REF:SCHEDULED_WORKFLOW,
    GITHUB_RUN_ATTEMPT:'1',
    JB_T075_AUTO_JOINT_BACKUP:'1',
    JB_T034_DUAL_RESTORE_PROBE:'1',
    JB_T070_JOINT_PROBE:'1',
    B11_MEDIA_EXPORT_CONFIRMATION:'JANTA_BOL_T075_SCHEDULED_JOINT_EXPORT',
    JB_T075_SCHEDULED_RELEASE_AUTH:SCHEDULED_AUTH
  };
  if(!Object.entries(required).every(([k,v])=>env[k]===v))
    throw Error('B11_T075_SCHEDULED_PROTECTED_CONTEXT_DENIED');
  // This tool only verifies GitHub run context. GitHub Environment approval,
  // access controls, retention budget and encryption secrets remain separate.
  return true;
}
