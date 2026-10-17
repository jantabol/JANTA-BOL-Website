import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../../JANTA_BOL_PHASE_3C_WORKING/',import.meta.url);
const [html,ui]=await Promise.all(['b8-accountability.html','b8-accountability-ui.js'].map(n=>readFile(new URL(n,root),'utf8')));
test('Android Founder/Reporter/Editor never expose endless forms, all tasks covered',()=>{
  const map=ui.slice(ui.indexOf('const PHONE_GROUPS='),ui.indexOf('function enablePhoneWorkflow'));
  for(const [role,next] of [['owner','reporter'],['reporter','editor'],['editor',null]]){
    const start=html.indexOf('<section id="'+role+'"');
    const end=next?html.indexOf('<section id="'+next+'"'):html.indexOf('</main>');
    const ids=[...html.slice(start,end).matchAll(/<form id="([^"]+)"/g)].map(m=>m[1]);
    assert(ids.length>=3);
    for(const id of ids)assert(map.includes("'"+id+"'"),'missing '+role+'/'+id);
  }
  assert.match(ui,/forms\.some\(f=>!ids\.includes\(f\.id\)\)/);
  assert.match(ui,/hidden\.hidden=true/);
  assert.match(ui,/hidden\.append\(form\)/);
  assert.match(ui,/active\.replaceChildren\(selected\)/);
  assert.match(ui,/enablePhoneWorkflow\(role\)/);
  assert.match(ui,/pick\.addEventListener\('change',showSelected\)/);
});
test('Android safe actions require explicit intentional selection',()=>{
  assert.match(html,/<select id="g4Action" required><option value="" disabled selected>/);
  assert.match(html,/<select id="g4MilestoneCode" required><option value="" disabled selected>/);
  assert.match(html,/Public Timeline में संपादकीय घटना दर्ज करें/);
  assert.match(ui,/field\.value='';/);
  assert.match(ui,/option\.disabled=group\.label/);
  assert.match(ui,/B8_DATABASE_NOT_DEPLOYED_OR_PARTIAL_G0_G9/);
});
test('Android phone workflow does not drop session lock or source validation',()=>{
  assert.match(ui,/LOCK_MS=15\*60\*1000/);
  assert.match(ui,/await requireFreshIdentity\(\)/);
  assert(!ui.includes('.innerHTML='));
  assert.match(html,/b8-phone-menu/);
  assert.match(html,/@media\(max-width:600px\)/);
});
