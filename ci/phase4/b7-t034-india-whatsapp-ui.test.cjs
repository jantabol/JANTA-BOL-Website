'use strict';
// T034 ADS002 — NO production APIs or personal numbers. Browser-contract fake.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.resolve(__dirname, '../../JANTA_BOL_PHASE_3C_WORKING/advertise-request.html'), 'utf8');
const input = html.match(/<input id="adWhatsApp"[^>]*>/)?.[0];
assert.ok(input, 'Indian WhatsApp field must be present');
for (const attribute of [
  'type="tel"', 'inputmode="numeric"', 'autocomplete="tel-national"',
  'minlength="10"', 'maxlength="10"', 'pattern="[6-9][0-9]{9}"', 'required'
]) assert.ok(input.includes(attribute), 'missing 10-digit contract: ' + attribute);
assert.ok(html.includes('WhatsApp मोबाइल नंबर (10 अंक)'));
assert.ok(html.includes('देश कोड (+91) सिस्टम अपने आप जोड़ देगा'));
assert.ok(!html.includes('देश कोड सहित'), 'customer must not type +91');
assert.ok(html.includes('p_whatsapp:whatsapp'), 'send bare 10-digit mobile; backend adds +91');
assert.ok(!html.includes('p_whatsapp:'+ "'+91'" + '+whatsapp'), 'do not double-prefix +91');
assert.ok(html.includes("code.includes('INVALID_ENQUIRY_OR_CONSENT')"), 'show helpful backend invalid-number rejection');

const pattern = new RegExp('^(?:' + input.match(/pattern="([^"]+)"/)?.[1] + ')$');
for (const good of ['9000000000','9876543210','6123456789']) assert.ok(pattern.test(good), 'valid Indian 10-digit example rejected');
for (const bad of ['', '1','1234567890','0123456789','900000000','90000000000','+919000000000','91 9000000000','abcdefghij','９０００００００００']) {
  assert.ok(!pattern.test(bad), 'invalid Indian mobile accepted: ' + JSON.stringify(bad));
}

const script = html.match(/<script>\s*(\(function\(\)\{[\s\S]+?\}\)\(\);)\s*<\/script>/)?.[1];
assert.ok(script, 'must execute actual page submit handler, not recreated logic');
function fakePage({ name = 'T034 UI TEST', whatsapp = '9000000000', consent = true, backendError = null } = {}) {
  const feedback = {hidden:true,className:'',textContent:''};
  const button = {disabled:false};
  const nameInput = {value:name};
  const phoneInput = {value:whatsapp};
  const noteInput = {value:''};
  const consentInput = {checked:consent};
  let callback, resetCount=0;
  const calls=[];
  const form = {
    addEventListener(event,handler){assert.equal(event,'submit');callback=handler;},
    reportValidity(){return nameInput.value.trim().length>=2 && pattern.test(phoneInput.value) && consentInput.checked;},
    reset(){resetCount++;}
  };
  const elements = {enquiry:form,adSubmit:button,adFeedback:feedback,adName:nameInput,adWhatsApp:phoneInput,adNote:noteInput,adConsent:consentInput};
  const context = {
    document:{getElementById(id){return elements[id];}},
    location:{search:'?origin=homepage'},
    URLSearchParams,
    window:{JBBackend:{client:{async rpc(fn,args){calls.push({fn,args});return backendError
      ? {data:null,error:{message:backendError}}
      : {data:'11111111-1111-4111-8111-111111111111',error:null};}}}}
  };
  // Browsers expose window.JBBackend as the global identifier JBBackend.
  // vm sandboxes do not do this implicitly; bind both to the SAME fake object.
  context.JBBackend=context.window.JBBackend;
  vm.runInNewContext(script,context,{timeout:1000});
  assert.equal(typeof callback,'function');
  return {submit:()=>callback({preventDefault(){}}),calls,feedback,button,getReset:()=>resetCount};
}
(async () => {
  for (const invalid of [
    {whatsapp:'1',consent:true},
    {whatsapp:'+919000000000',consent:true},
    {whatsapp:'9000000000',consent:false},
    {whatsapp:'1234567890',consent:true},
    {name:' ',whatsapp:'9000000000',consent:true}
  ]) {
    const ui=fakePage(invalid);await ui.submit();
    assert.equal(ui.calls.length,0,'invalid browser input must never reach RPC');
  }
  const valid=fakePage();await valid.submit();
  assert.equal(valid.calls.length,1);
  assert.equal(valid.calls[0].fn,'jb_ad_public_enquiry');
  assert.equal(valid.calls[0].args.p_whatsapp,'9000000000','only 10 digits go to existing backend');
  assert.equal(valid.calls[0].args.p_consent,true);
  assert.equal(valid.calls[0].args.p_origin,'homepage');
  assert.ok(valid.feedback.textContent.includes('Pending'));
  assert.equal(valid.button.disabled,false);
  assert.equal(valid.getReset(),1);

  const backendReject=fakePage({backendError:'INVALID_ENQUIRY_OR_CONSENT'});
  await backendReject.submit();
  assert.equal(backendReject.calls.length,1);
  assert.match(backendReject.feedback.textContent,/10 अंकों/);
  assert.equal(backendReject.getReset(),0,'failed request must keep user form');
  assert.equal(backendReject.button.disabled,false);

  console.log('PASS T034 ADS002 10-digit Indian number only; +91 backend normalization unchanged (contract)');
  console.log('PASS HTML5 pattern/length/consent/name guard and mocked RPC Pending receipt');
  console.log('PASS early backend validation shows helpful Hindi error, NO real API/database access');
})().catch(e=>{console.error('FAIL T034 ADS002 fake UI test:',e.message);process.exitCode=1;});
