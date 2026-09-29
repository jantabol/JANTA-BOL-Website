(function(){
  'use strict';
  const LOCK_MINUTES=15;
  const LOCK_MS=LOCK_MINUTES*60*1000, KEY='jbAdminLastActivity';
  const GUARD_RETRIES=3, GUARD_RETRY_MS=450;
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  async function readSecurityState(){
    const s=await JBBackend.session();
    if(!s)return {kind:'no-session'};

    const r=await JBBackend.role();
    if(r!=='owner')return {kind:'role',role:r};

    const aal=await JBBackend.mfaAAL();
    if(aal?.currentLevel!=='aal2')return {kind:'aal',aal};

    return {kind:'ok',session:s};
  }

  async function verifySecurityState(){
    let lastState=null, lastError=null;

    for(let attempt=0;attempt<GUARD_RETRIES;attempt++){
      try{
        const state=await readSecurityState();
        if(state.kind==='ok')return state;
        lastState=state;
      }catch(e){
        lastError=e;
      }

      if(attempt<GUARD_RETRIES-1)await sleep(GUARD_RETRY_MS*(attempt+1));
    }

    if(lastState)return lastState;
    throw lastError||new Error('SECURITY_CHECK_UNAVAILABLE');
  }

  function nextPage(){
    return location.pathname.split('/').pop()+location.search;
  }

  function showGuardUnavailable(error){
    console.error(error);
    document.body.innerHTML='<main style="padding:24px;font-family:sans-serif"><h2>Security check temporarily unavailable</h2><p>Admin content load nahi kiya gaya. Network/session check stable hone ke baad Retry karein.</p><button id="jbGuardRetry" style="padding:10px 16px">Retry Security Check</button></main>';
    const btn=document.getElementById('jbGuardRetry');
    if(btn)btn.onclick=()=>location.reload();
  }

  async function boot(){
    try{
      const security=await verifySecurityState();
      if(
  security.kind==='ok' &&
  !(await JBBackend.serverSessionValid())
){
  location.replace(
    'admin-login.html?reason=session&next='+
    encodeURIComponent(nextPage())
  );
  return;
}

      if(security.kind==='no-session'){
        location.replace('admin-login.html?reason=session&next='+encodeURIComponent(nextPage()));
        return;
      }

      if(security.kind==='role'){
        document.body.innerHTML='<main style="padding:24px;font-family:sans-serif"><h2>Access denied</h2><p>Super Admin/Owner permission required.</p></main>';
        return;
      }

      if(security.kind==='aal'){
        location.replace('admin-login.html?reason=aal2&next='+encodeURIComponent(nextPage()));
        return;
      }

      const last=Number(localStorage.getItem(KEY)||Date.now());
      if(Date.now()-last>LOCK_MS){
        location.replace('admin-login.html?locked=1&next='+encodeURIComponent(nextPage()));
        return;
      }

      const touch=()=>localStorage.setItem(KEY,String(Date.now()));
      ['pointerdown','keydown','scroll','touchstart','click','input','change','focusin']
        .forEach(e=>addEventListener(e,touch,{passive:true}));
      touch();

      setInterval(()=>{
        const t=Number(localStorage.getItem(KEY)||0);
        if(Date.now()-t>LOCK_MS){
          location.replace('admin-login.html?locked=1&next='+encodeURIComponent(nextPage()));
        }
      },30000);

      document.documentElement.dataset.jbAuth='ready';
      setTimeout(()=>dispatchEvent(new Event('jb-auth-ready')),0);
    }catch(e){
      // Fail closed on transient/provider errors: do not expose protected data and
      // do not falsely present a full-login requirement while the session may still be valid.
      showGuardUnavailable(e);
    }
  }

  boot();
})();