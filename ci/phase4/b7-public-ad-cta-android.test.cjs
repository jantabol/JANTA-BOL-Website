'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.css','utf8');
const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/index.html','utf8');
test('ADS-001 actual Android text/touch regression: CTA readable, >=44px touch, visual focus',()=>{
 assert.match(css,/\.jb-ad-contact\s*\{[^}]*font-size\s*:\s*clamp\(17px,4vw,20px\)/);
 assert.match(css,/\.jb-ad-contact a\s*\{[^}]*min-height\s*:\s*48px/);
 assert.match(css,/\.jb-ad-contact a:focus-visible\s*\{[^}]*outline\s*:/);
 assert.doesNotMatch(css,/\.jb-ad-contact\s*\{[^}]*font-size\s*:\s*13px/);
});
test('quiet contact link must not duplicate one fixed paid slot or replace permanent article link',()=>{
 assert.equal((html.match(/data-jb-ad-placement="homepage"/g)||[]).length,1);
 assert.equal((html.match(/class="jb-ad-contact"/g)||[]).length,1);
 assert.match(html,/href="advertise-request\.html\?origin=homepage">विज्ञापन के लिए संपर्क करें<\/a>/);
 assert.doesNotMatch(css,/\.jb-ad-contact(?: a)?\s*\{[^}]*position\s*:\s*fixed/);
});