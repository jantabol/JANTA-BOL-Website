'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ads.html','utf8');
const js=html.split("<script>'use strict';")[1]?.split('</script>')[0];
assert.ok(js,'inline Owner script should be inspectable');
function harness(){
 const elements=new Map(),pending=[];
 const make=id=>{
  if(!elements.has(id)){
   const x={id,textContent:'',value:'',hidden:false,disabled:false,files:[],
    setAttribute(key,v){this[key]=v;},
    replaceChildren(){this.textContent='';}};
   if(id.startsWith('adfile-'))Object.defineProperty(x,'value',{
    get(){return this._value||''},set(v){this._value=v;if(v==='')this.files=[]}
   });
   elements.set(id,x);
  }
  return elements.get(id);
 };
 const media={
  dispose(box){box.replaceChildren()},
  stage(){return new Promise((resolve,reject)=>pending.push({resolve,reject}))}
 };
 const context=vm.createContext({document:{documentElement:{dataset:{jbAuth:'pending'}},
  getElementById:make},window:{addEventListener(){}},addEventListener(){},
  JBBackend:{esc:x=>x},JBPhase4:{},JBAdMediaPreview:media,Date,Intl,Set});
 vm.runInContext("'use strict';"+js,context,{filename:'ads-inline'});
 return {context,element:make,pending};
}
test('UI06 new Gallery selection invalidates prior local error and preview',()=>{
 const h=harness(),id='case06',box=h.element('adfilepreview-'+id);
 box.textContent='Local preview blocked: previous JPG';
 h.context.creativeFileChanged(id);
 assert.equal(box.textContent,'');
});
test('UI06 stale failed JPG decode must not erase newer video selection or overwrite its status',async()=>{
 const h=harness(),id='case06-race',file=h.element('adfile-'+id),
  preview=h.element('adfilepreview-'+id),kind=h.element('ct-'+id);
 kind.value='image';
 const oldFile={name:'old.jpg'},newFile={name:'fresh.jpg'};
 file.files=[oldFile];file.value='old.jpg';
 const oldRequest=h.context.previewLocalMedia(id);
 assert.equal(h.pending.length,1);
 file.files=[newFile];file.value='fresh.jpg';
 h.context.creativeFileChanged(id);
 preview.textContent='New file waiting for preview';
 h.pending[0].reject(Error('LOCAL_MEDIA_TYPE_MISMATCH'));
 await oldRequest;
 assert.equal(file.value,'fresh.jpg','old rejection cannot clear new selected file');
 assert.equal(file.files[0],newFile);
 assert.equal(preview.textContent,'New file waiting for preview',
  'old rejection cannot reintroduce stale error after new selection');
});
test('UI06 actual current invalid file may show one local error, but never uploads',async()=>{
 const h=harness(),id='case06-current',file=h.element('adfile-'+id),
  box=h.element('adfilepreview-'+id);
 h.element('ct-'+id).value='video';
 file.files=[{name:'wrong.jpg'}];file.value='wrong.jpg';
 const request=h.context.previewLocalMedia(id);
 h.pending[0].reject(Error('LOCAL_MEDIA_TYPE_MISMATCH'));
 await request;
 assert.equal(file.value,'');assert.equal(file.files.length,0);
 assert.match(box.textContent,/LOCAL_MEDIA_TYPE_MISMATCH/);
 assert.match(html,/LOCAL_MEDIA_NOT_UPLOADED/);
});
test('UI07 contextual CTA controls clear previous destinations and use phone vs URL keyboard',()=>{
 const h=harness(),id='case07',target=h.element('cu-'+id),
  choice=h.element('ca-'+id),hint=h.element('cta-hint-'+id);
 for(const [mode,kbd,show,expectedHint] of [
  ['website','url',true,/HTTPS Website/],['map','url',true,/HTTPS Map/],
  ['call','tel',true,/Country code/],['whatsapp','tel',true,/Country code/],
  ['','url',false,/No CTA/]
 ]){
  choice.value=mode;target.value='https://stale.invalid';
  h.context.creativeCtaChanged(id);
  assert.equal(target.value,'');assert.equal(target.hidden,!show);
  assert.equal(target.disabled,!show);assert.equal(target.inputmode,kbd);
  assert.match(hint.textContent,expectedHint);
 }
 assert.match(html,/aria-describedby="cta-hint-/);
});
test('UI08 Android narrow screen form prevents fixed wide inputs and keeps touch targets',()=>{
 assert.match(html,/@media\(max-width:720px\)/);
 assert.match(html,/\.row\{display:grid;grid-template-columns:minmax\(0,1fr\)/);
 assert.match(html,/\.card input\[type=datetime-local\]/);
 assert.match(html,/min-height:44px/);
 assert.match(html,/font-size:16px/);
 assert.match(html,/white-space:normal;overflow-wrap:anywhere/);
});
test('UI09 only one quiet readable CTA and one advertisement slot, never floating takeover',()=>{
 const css=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/public-ads.css','utf8');
 const home=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/index.html','utf8');
 assert.equal((home.match(/class="jb-ad-contact"/g)||[]).length,1);
 assert.equal((home.match(/data-jb-ad-placement="homepage"/g)||[]).length,1);
 assert.match(css,/font-size:clamp\(17px,4vw,20px\)/);
 assert.match(css,/\.jb-ad-contact a\{[^}]*min-height:48px/);
 assert.doesNotMatch(css,/\.jb-ad-contact(?: a)?\s*\{[^}]*position\s*:\s*fixed/);
 assert.match(home,/href="advertise-request\.html\?origin=homepage"/);
});
test('BE15 release manifest requires exact SHA + five client file hashes, no production deploy',()=>{
 const workflow=fs.readFileSync('.github/workflows/p4-t035-candidate-static.yml','utf8');
 for(const phrase of [
  'test "$(git rev-parse HEAD)" = "$GITHUB_SHA"',
  'B7_SPCK_SOURCE_SHA256.txt',
  'sha256sum -c B7_SPCK_SOURCE_SHA256.txt',
  'unzip -Z1 dist/B7_SPCK_TEST_BUILD.zip | grep -Fxq B7_SPCK_SOURCE_SHA256.txt',
  'GITHUB SOURCE COMMIT: $GITHUB_SHA',
  'B7_SPCK_TEST_BUILD.zip',
  'SPCK local preview DOES NOT deploy Supabase migrations',
  'actions/upload-artifact@v4'
 ]) assert.ok(workflow.includes(phrase),'Missing BE15 exact HEAD gate: '+phrase);
});
