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
  assert.match(html,/सार्वजनिक घटनाक्रम में संपादकीय गतिविधि दर्ज करें/);
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

test('Founder Android labels and source-attributed private ledger are Hindi-first',()=>{
 assert.match(html,/जनता बोल — जवाबदेही कार्यक्षेत्र/);
 assert.match(html,/अनुमानित \/ प्रस्तावित लागत \(स्वीकृत बजट या खर्च नहीं\)/);
 assert.match(html,/केवल संस्थापक के लिए निजी रिकॉर्ड इतिहास/);
 assert.doesNotMatch(html,/Estimated \/ Proposed Cost \(NOT sanctioned or spent\)/);
 assert.match(ui,/displayHindiPrivateLedger\(out,x\)/);
 assert.match(ui,/यह ऐतिहासिक अनुमान है, स्वीकृत बजट या वास्तविक खर्च नहीं/);
 assert.match(ui,/इसे प्रमाणित सरकारी तथ्य न मानें/);
 assert.match(ui,/node\.replaceChildren\(\)/);
 assert.match(ui,/value\.textContent=String\(val/);
 assert(!ui.includes('.innerHTML='));
});
test('Cost history renders exact large rupees without JS float rounding',()=>{
 const start=ui.indexOf('function formatExactINR(');
 const end=ui.indexOf('function hindiDateTime(');
 assert(start>=0 && end>start);
 const format=new Function(ui.slice(start,end)+';return formatExactINR;')();
 assert.equal(format('23864600000.00'),'₹23,86,46,00,000.00');
 assert.equal(format('1234567.80'),'₹12,34,567.80');
 assert.equal(format('120000'),'₹1,20,000');
 assert.equal(format('0.10'),'₹0.10');
 assert.equal(format('not-a-number'),'राशि स्पष्ट नहीं है');
});
test('Underlying RPC and foreign keys never translated',()=>{
 assert.match(html,/value="ESTIMATED_PROPOSED"/);
 assert.match(html,/id="g5Field"/);
 assert.match(ui,/jb_b8_g1_runtime_readiness/);
 assert.match(ui,/workflow\.ownerG5PrivateLedger\(v\('g5LedgerCase'\)\)/);
 assert.match(ui,/LOCK_MS=15\*60\*1000/);
});
