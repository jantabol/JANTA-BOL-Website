(function(global){
'use strict';
const e=v=>global.JBBackend?.esc?global.JBBackend.esc(String(v??'')):String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const stateClass=s=>s==='READY'?'good':(s==='LIMITED'?'warnText':(s==='DISABLED'||s==='RETIRED'?'bad':'muted'));
async function render(){
  const box=document.getElementById('encoderEngineBox'); if(!box)return;
  try{
    const d=await global.JBLive.encoderAdminOverview();
    const cfg=d.engine||{}, list=d.connectors||[];
    const byKey=new Map(list.map(x=>[String(x.connector_key),x]));
    const active=byKey.get(String(cfg.active_connector_key||''));
    const fallback=byKey.get(String(cfg.fallback_connector_key||''));
    const activeName=active?.display_name||cfg.active_connector_key||'Not configured';
    const fallbackName=fallback?.display_name||cfg.fallback_connector_key||'Not configured';
    const cards=list.map(c=>{
      const key=String(c.connector_key||''),isActive=key===String(cfg.active_connector_key||''),isFallback=key===String(cfg.fallback_connector_key||'');
      const canSwitch=c.switch_enabled===true&&['READY','LIMITED'].includes(String(c.operational_state||''));
      return `<div class="sub"><div class="row"><b>${e(c.display_name)}</b>${isActive?'<span class="pill live">ACTIVE APP</span>':''}${isFallback?'<span class="pill ready">BACKUP APP</span>':''}<span class="pill ${stateClass(String(c.operational_state))}">${e(c.operational_state)}</span></div><div class="muted">${c.supports_auto_config?'Auto-config supported':'Manual setup required'} · ${c.platform==='ANDROID'?'Android':e(c.platform)}</div>${c.founder_note?`<div class="muted">${e(c.founder_note)}</div>`:''}<div class="row">${canSwitch&&!isActive?`<button class="btn" onclick="JB3CLiveEngineAdmin.makeActive('${e(key)}','${e(c.display_name)}')">Use for LIVE</button>`:''}${canSwitch&&!isActive&&!isFallback?`<button class="btn alt" onclick="JB3CLiveEngineAdmin.makeFallback('${e(key)}','${e(c.display_name)}')">Set as Backup</button>`:''}</div></div>`;
    }).join('')||'<div class="empty">No streaming app connector registered.</div>';
    box.innerHTML=`<div class="sub priority"><div class="muted">Currently JANTA BOL LIVE streaming app</div><h3>${e(activeName)}</h3><div class="${stateClass(String(active?.operational_state||''))}"><b>${e(active?.operational_state||'UNKNOWN')}</b></div><div class="muted">Backup: ${e(fallbackName)} · Auto fallback: ${cfg.auto_fallback_enabled?'ON':'OFF'} · Engine config v${Number(cfg.config_version||0)}</div></div>${cards}`;
  }catch(err){box.innerHTML='<span class="bad">Live Engine status unavailable: '+e(err.message||'Unknown error')+'</span>'}
}
async function makeActive(key,name){
  if(!confirm(`${name} ko JANTA BOL ka active Live streaming app banana hai?`))return;
  try{await global.JBLive.encoderSwitch(key,'ACTIVE','FOUNDER_SWITCH_ACTIVE_ENCODER');await render()}catch(err){alert('App switch failed: '+(err.message||'Unknown error'))}
}
async function makeFallback(key,name){
  if(!confirm(`${name} ko backup Live streaming app banana hai?`))return;
  try{await global.JBLive.encoderSwitch(key,'FALLBACK','FOUNDER_SET_FALLBACK_ENCODER');await render()}catch(err){alert('Backup set failed: '+(err.message||'Unknown error'))}
}
global.JB3CLiveEngineAdmin={render,makeActive,makeFallback};
})(window);
