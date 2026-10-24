// JANTA BOL B11 cryptographically trusted OFFLINE proof, independent of manifest.
// Trust anchor is supplied OUTSIDE restored data; Founder private key never in repo,
// never in downloaded archive, never uploaded to GitHub or printed.
import {createHash,createPrivateKey,createPublicKey,sign,verify as checkSignature} from 'node:crypto';
import {readFileSync,writeFileSync,openSync,closeSync,fsyncSync,lstatSync,statSync,existsSync} from 'node:fs';
import {resolve,dirname,isAbsolute,relative,sep} from 'node:path';
import {verify,MANIFEST,PROJECT} from './recovery-engine.mjs';
export const SIGNATURE_SCHEMA='janta-bol-b11-ed25519-detached-v1';
function fail(code){throw new Error('B11_SIGNED_'+code)}
function under(path,base){
 const rel=relative(base,path);return rel!==''&&rel!=='..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel);
}
function privateMaterial(path){
 if(typeof path!=='string'||!path)fail('KEY_PATH_REQUIRED');
 const file=resolve(path);
 if(!existsSync(file)||lstatSync(file).isSymbolicLink()||!statSync(file).isFile())fail('KEY_FILE_NOT_REGULAR');
 return file;
}
function body(m,sha){
 return Buffer.from('JANTA_BOL_B11_MANIFEST_ED25519_V1\n'+PROJECT+'\n'+m.generation_id+'\n'+sha+'\n','utf8');
}
function sha256(bytes){return createHash('sha256').update(bytes).digest('hex')}
function publicFinger(publicKey){return sha256(publicKey.export({type:'spki',format:'der'}))}
function json(p){try{return JSON.parse(readFileSync(p,'utf8'))}catch{fail('ATTESTATION_INVALID')}}
export function attest(rootDir,privateKeyPath,outPath,{confirmation}={}){
 if(confirmation!=='JANTA_BOL_OFFLINE_SIGN_ONLY')fail('FOUNDER_EXPLICIT_SIGN_REQUIRED');
 const root=resolve(rootDir);
 const manifest=verify(root),pkey=privateMaterial(privateKeyPath),target=resolve(outPath);
 if(under(pkey,root)||under(target,root)||target===pkey||target===root ||
 !under(target,dirname(root)))fail('SIGNATURE_MUST_BE_OUTSIDE_BUNDLE');
 if(existsSync(target))fail('SIGNATURE_IMMUTABLE');
 const raw=readFileSync(root+'/'+MANIFEST);
 const key=createPrivateKey(readFileSync(pkey));
 if(key.asymmetricKeyType!=='ed25519')fail('ED25519_KEY_REQUIRED');
 const pub=createPublicKey(key),dig=sha256(raw);
 const statement={
  schema:SIGNATURE_SCHEMA,project_ref:PROJECT,generation_id:manifest.generation_id,
  manifest_sha256:dig,signer_spki_sha256:publicFinger(pub),
  signature_base64:sign(null,body(manifest,dig),key).toString('base64')
 };
 const fd=openSync(target,'wx',0o600);
 try{writeFileSync(fd,JSON.stringify(statement,null,2)+'\n');fsyncSync(fd)}
 finally{closeSync(fd)}
 return {signature_path:target,signer_spki_sha256:statement.signer_spki_sha256,
 manifest_sha256:dig,source_authenticated:true};
}
export function verifyTrusted(rootDir,signaturePath,publicKeyPath){
 const root=resolve(rootDir);
 const signatureFile=privateMaterial(signaturePath),trustedKeyFile=privateMaterial(publicKeyPath);
 if(under(trustedKeyFile,root)||under(signatureFile,root))fail('TRUST_ANCHOR_INSIDE_UNTRUSTED_SOURCE');
 const signature=json(signatureFile),manifest=verify(root),raw=readFileSync(root+'/'+MANIFEST);
 const digest=sha256(raw);
 if(signature.schema!==SIGNATURE_SCHEMA||signature.project_ref!==PROJECT||
 signature.generation_id!==manifest.generation_id||signature.manifest_sha256!==digest||
 typeof signature.signature_base64!=='string'||!/^[a-zA-Z0-9+/]{86}==$/.test(signature.signature_base64)||
 !/^[a-f0-9]{64}$/.test(signature.signer_spki_sha256))fail('SIGNATURE_FORMAT_OR_IDENTITY_MISMATCH');
 let publicKey;try{publicKey=createPublicKey(readFileSync(trustedKeyFile))}catch{fail('INVALID_TRUST_ANCHOR')}
 if(publicKey.asymmetricKeyType!=='ed25519')fail('ED25519_KEY_REQUIRED');
 if(publicFinger(publicKey)!==signature.signer_spki_sha256)fail('UNTRUSTED_SIGNER');
 if(!checkSignature(null,body(manifest,digest),publicKey,Buffer.from(signature.signature_base64,'base64')))
 fail('SIGNATURE_INVALID');
 return {source_authenticated:true,manifest_sha256:digest,
  signer_spki_sha256:signature.signer_spki_sha256,
  generation_id:manifest.generation_id,storage_count:manifest.storage_count,
  real_postgres_restore_proved:false};
}
