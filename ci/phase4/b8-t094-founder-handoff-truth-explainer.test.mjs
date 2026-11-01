import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const html=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html','utf8');
const client=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js','utf8');
const controller=readFileSync('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js','utf8');
const sha=path=>execFileSync('git',['rev-parse','HEAD:'+path],{encoding:'utf8'}).trim();

test('T094 owner truth: only one existing form; original IDs and action unchanged',()=>{
 assert.equal((html.match(/id="g3Truth"/g)||[]).length,1);
 for(const id of ['g3Truth','g3TruthQ','g3TruthData'])assert(html.includes('id="'+id+'"'));
 assert(controller.includes("form('g3Truth',async()=>{"));
 assert(controller.includes("workflow.ownerHandoffTruth(v('g3TruthQ'))"));
});
test('T094 owner truth: visible plain Hindi explains handoff-only lookup & draft safely',()=>{
 const start=html.indexOf('<form id="g3Truth">');
 const end=html.indexOf('</form>',start);
 assert(start>=0&&end>start);
 const segment=html.slice(start,end);
 assert(segment.includes('भेजने की तैयारी (Handoff)'));
 assert(segment.includes('केवल निजी मसौदा (Draft)'));
 assert(segment.includes('कोई Handoff रिकॉर्ड नहीं मिलेगा'));
 assert(segment.includes('सरकारी जवाब न मानें'));
 assert(segment.includes('कोई संदेश नहीं भेजा जाता'));
 assert(segment.includes('role="note"'));
});
test('T094 original authority checks remain untouched in Git objects',()=>{
 assert.equal(sha('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-client.js'),
 '0bf53ef35efdc21ac985493ccb49734cdd1a0fb1');
 assert.equal(sha('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js'),
 '505d5ccd27bd62bb111061632b784aae77a56a89');
 assert(client.includes("jb_b8_g3_owner_handoff_truth"));
 assert(client.includes("p.external_delivery_status!=='NOT_VERIFIED'"));
});
test('T094 helper adds only explanatory content, not new login, SEND or SQL',()=>{
 const original=execFileSync('git',['show','1d3d229227da54bc2763fc752cb5091f0ba441ec:JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html'],{encoding:'utf8'});
 const expected='<form id="g3Truth"><fieldset><legend>सवाल भेजे जाने की वास्तविक स्थिति</legend>';
 const start=html.indexOf(expected);
 const originalStart=original.indexOf(expected);
 assert(start>=0&&originalStart>=0);
 const added=html.match(/\n<p class="hint" role="note">[^<]*(?:<strong>[^<]*<\/strong>[^<]*)*<\/p>/)?.[0];
 assert(added,'Specific explanatory helper missing');
 const without=html.replace(added,'');
 assert.equal(without,original,'Unexpected B8 html change beyond requested helper');
 assert(!/<script|onclick=|onload=|auth.signIn|window.open|fetch(/i.test(added),'helper cannot change behavior');
});
