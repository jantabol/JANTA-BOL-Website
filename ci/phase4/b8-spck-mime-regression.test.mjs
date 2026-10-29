import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const d=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../JANTA_BOL_PHASE_3C_WORKING');
const read=name=>readFile(path.join(d,name),'utf8');
test('B8 private and public browser JS modules use SPCK-compatible .js not .mjs octet-stream',async()=>{
 for(const b of ['b8-accountability-client','b8-accountability-ui','b8-public-case-client','b8-public-case-ui']){
  await access(path.join(d,b+'.js'));
  await assert.rejects(access(path.join(d,b+'.mjs')),{code:'ENOENT'});
 }
 const [a,p,u,v]=await Promise.all([read('b8-accountability.html'),read('accountability-public.html'),read('b8-accountability-ui.js'),read('b8-public-case-ui.js')]);
 assert.match(a,/<script type="module" src="b8-accountability-ui\.js"><\/script>/);
 assert.match(p,/<script type="module" src="b8-public-case-ui\.js"><\/script>/);
 assert.match(u,/from ['"]\.\/b8-accountability-client\.js['"]/);
 assert.match(v,/from ['"]\.\/b8-public-case-client\.js['"]/);
 for(const s of [a,p,u,v])assert.doesNotMatch(s,/b8-(?:accountability|public-case)-(?:client|ui)\.mjs/);
});
test('Original B8 safe preview disclaimer and 15-minute security timeout retained',async()=>{
 const a=await read('b8-accountability.html'),u=await read('b8-accountability-ui.js');
 assert.match(a,/कोई सरकारी संदेश नहीं भेजा जाता/);
 assert.match(a,/बिना प्रमाण पास नहीं/);
 assert.match(u,/const LOCK_MS=15\*60\*1000/);
});
