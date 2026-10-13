'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
const start=html.indexOf('async function creative(id){'),end=html.indexOf('async function approveLatestDraft',start);
if(start<0||end<start)throw Error('B7_OWNER_CREATIVE_SOURCE_NOT_FOUND');
const functionBody=html.slice(start,end);
function setup(file){
 const calls=[],alerts=[];
 const doc={getElementById(id){
  if(id.startsWith('adfile-'))return {files:file?[file]:[]};
  if(id.startsWith('ct-'))return {value:'image'};
  if(id.startsWith('cm-'))return {value:'https://example.org/old-media.png'};
  if(id.startsWith('cx-'))return {value:''};
  if(id.startsWith('ca-'))return {value:'website'};
  if(id.startsWith('cu-'))return {value:'https://example.org/'};
  throw Error('UNEXPECTED_DOM_LOOKUP: '+id);
 }};
 const context=vm.createContext({document:doc,alert:x=>alerts.push(x),
  JBPhase4:{adCreative:async(...args)=>{calls.push(args);return true}},
  load:async()=>{calls.push('load')}});
 vm.runInContext(functionBody,context);
 return {context,calls,alerts};
}
test('B7 SPCK local photo/video selection NEVER becomes a silently saved creative URL or approval',async()=>{
 const owner=setup({name:'Android Gallery.jpg',size:12345,type:'image/jpeg'});
 await owner.context.creative('33333333-3333-4333-8333-333333333333');
 assert.deepEqual(owner.calls,[],'no backend call when there is an unuploaded local file');
 assert.equal(owner.alerts.length,1);
 assert.match(owner.alerts[0],/LOCAL_MEDIA_NOT_UPLOADED/);
 assert.match(html,/Local File Preview — NO UPLOAD/);
});
test('Existing canonical URL-only draft path preserved when no local file is selected',async()=>{
 const owner=setup(null);
 await owner.context.creative('33333333-3333-4333-8333-333333333333');
 assert.equal(owner.alerts.length,0);
 assert.equal(owner.calls.length,2);
 assert.equal(owner.calls[0][0],'33333333-3333-4333-8333-333333333333');
 assert.equal(owner.calls[0][1].media,'https://example.org/old-media.png');
 assert.equal(owner.calls[1],'load');
});
