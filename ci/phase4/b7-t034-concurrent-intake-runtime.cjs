'use strict';
// Real TWO-connection PostgreSQL race, disposable GitHub Actions PG only.
// ADS-003/005: reject forged public geo input and oversized payload;
// concurrent 10-digit vs +91 submits must produce exactly ONE Pending receipt.
const {spawn,execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
function sql(query){
  return execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','-A','-t','-c',query],
    {encoding:'utf8',timeout:25000,env:{...process.env,PGOPTIONS:'-c statement_timeout=10000'}}).trim();
}
function attempt(query){
  return new Promise((resolve,reject)=>{
    const cp=spawn('psql',['-X','-v','ON_ERROR_STOP=1','-A','-t','-c',query],
      {env:{...process.env,PGOPTIONS:'-c statement_timeout=10000'}});
    let out='',err='';
    cp.stdout.on('data',x=>out+=x.toString());
    cp.stderr.on('data',x=>err+=x.toString());
    const timeout=setTimeout(()=>cp.kill('SIGKILL'),20000);
    cp.on('error',reject);
    cp.on('close',code=>{clearTimeout(timeout);resolve({code,out:out.trim(),err:err.trim()})});
  });
}
async function main(){
  assert.equal(Number(sql('select count(*) from public.ad_campaigns')),0,
    'Disposable fixture must be pristine after transaction-rollback tests.');
  const invalid=sql(`DO $block$
    DECLARE msg text;
    BEGIN
      BEGIN
        EXECUTE 'SELECT public.jb_ad_public_enquiry(p_name => ''Fake'',p_whatsapp => ''8888888877'',p_consent => true,p_origin => ''homepage'',p_scope => ''global'')';
        RAISE EXCEPTION 'FORGED_SCOPE_ACCEPTED';
      EXCEPTION WHEN undefined_function THEN NULL;
      END;
      BEGIN
        PERFORM public.jb_ad_public_enquiry('Large payload','8888888877',true,
            'homepage',null,repeat('x',501));
        RAISE EXCEPTION 'OVERSIZED_NOTE_ACCEPTED';
      EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS msg=MESSAGE_TEXT;
        IF msg<>'INVALID_ENQUIRY_OR_CONSENT' THEN
          RAISE EXCEPTION 'OVERSIZED_NOTE_WRONG_RESULT: %',msg;
        END IF;
      END;
      IF (SELECT count(*) FROM public.ad_campaigns)<>0
      THEN RAISE EXCEPTION 'INVALID_PUBLIC_ARGUMENT_WROTE_ROW';END IF;
    END $block$`);
  assert.equal(Number(sql('select count(*) from public.ad_campaigns')),0);
  const a="SELECT public.jb_ad_public_enquiry('Concurrent A','8888888877',true,'homepage',NULL,'Simultaneous form') AS receipt";
  const b="SELECT public.jb_ad_public_enquiry('Concurrent B','+918888888877',true,'homepage',NULL,'Simultaneous form') AS receipt";
  const results=await Promise.all([attempt(a),attempt(b)]);
  const ok=results.filter(x=>x.code===0);
  const refused=results.filter(x=>x.code!==0);
  assert.equal(ok.length,1,'Two simultaneous writers must NOT create two accepted requests: '+JSON.stringify(results));
  assert.equal(refused.length,1);
  assert.match(refused[0].err,/ENQUIRY_COOLDOWN/);
  const r=sql(`SELECT (SELECT count(*) FROM public.ad_campaigns WHERE status='requested' AND approved_at IS NULL AND paid_at IS NULL)::text||':'||
    (SELECT count(*) FROM public.advertisers WHERE contact='+918888888877')::text||':'||
    (SELECT count(*) FROM public.ad_history WHERE event_type='public_enquiry')::text`);
  assert.equal(r,'1:1:1','Exactly one campaign, advertiser and durable history required');
  console.log('PASS [ADS-003/005] forgery & 501-char payload denied; two parallel PostgreSQL connections: 1 pending receipt, 1 cooldown, 1 audit. Disposable CI only.');
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
