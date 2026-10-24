# JANTA BOL — T069 media offsite AGE/B2 closed-loop development
Date: 2026-10-24 India Standard Time. Founder prioritizes soft launch and full original T069 PASS+LOCK but never false lock.
Main repo SHA before change: 4ef0643520f664b0c23fee2cd70af27c02509b5f. Keep main untouched until further review.

## New implementation (isolated only)
Core creates bounded deterministic exact file-byte bundle with source object identifiers and SHA256; it encrypts the entire bundle using actual AGE encryption for TWO independent recipients: the existing long-term Founder public recipient plus a memory-only run verification recipient. Candidate pushes unique immutable-key ciphertext to a B2 interface, downloads it independently, verifies ciphertext SHA256, decrypts B2 readback and verifies the original file bytes, IDs, timestamps and content digests; returns only a receipt, not private file names or bytes.

## Key separation
- No Supabase RLS change. Existing B5 restrictive grievance-private policy remains LOCKED.
- No additional GitHub Environment secret is required to execute MOCK CI. No GitHub workflow in this branch gets service_role, Owner JWT or Backblaze credentials. DO NOT mistakenly call this workflow a real B2 run.
- This is an isolated, real AGE cryptography test with an in-memory simulated B2 backend, not yet a production Supabase Edge function or real B2 upload.
- Future production integration requires connecting independently reviewed Owner+AAL2+live session authorizer and existing Supabase server-only service role to the per-object bounded reader; provisioning minimal B2 secret credentials in a secure server-only location; and Founder long-term AGE private key recovery validation. Requires explicit approved run and no B2 quota surprises. The existing new GitHub manual workflow in main requires JB_B11_SERVICE_ROLE_KEY and should not be dispatched.
- No storage object deletion, no direct private media in GitHub logs or artifacts, no new project or free-tier upgrade.

## Required original T069 FINAL LOCK proof still outstanding
Independent REAL source all-five original object bytes -> AGE encrypted remote B2 upload -> ciphertext full readback/decrypt -> five restored bytes SHA and identity exact; plus failures/recency monitoring real proof, original policy and RLS regression, Owner manual Android proof where required. The existing T034 PG17 real database backup+restore remains independently proven, but DOES NOT equal full media object backup.
Verdict: DEVELOPMENT PROOF ONLY; T069 E7/E8 FINAL HOLD until live bytes are verified.
References: https://www.backblaze.com/docs/cloud-storage-use-the-aws-sdk-for-javascript-v3-with-backblaze-b2 ; https://jsr.io/@age/age-encryption .
