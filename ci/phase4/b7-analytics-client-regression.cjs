'use strict';
// Deterministic staged client handshake. No live HTTP, no actual ad events.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {test}=require('node:test');
const js=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/ad-analytics-client.js','utf8');
const article='10000000-0000-0000-0000-000000000001';
const campaign='30000000-0000-0000-0000-000000000005';
const creative='40000000-0000-0000-0000-000000000005';
const validToken='a'.repeat(48);
function client(overrides={}){
 const calls=[],callbacks=[],element={isConnected:true};
 const window={
  crypto:{getRandomValues(bytes){for(let i=0;i<bytes.length;i++)bytes[i]=i+1;return bytes}},
  IntersectionObserver:class{},
  JBAdViewability:{watch(target,cb){assert.equal(target,element);callbacks.push(cb);return ()=>{}}},
  JBBackend:{client:{rpc:async(name,args)=>{
   calls.push({name,args});return {data:name==='jb_ad_issue_view_ticket'?validToken:true,error:null};
  }}},
  ...overrides
 };
 vm.runInNewContext(js,{window,Uint8Array,Array,WeakSet});
 return {window,calls,callbacks,element,args:{element,articleId:article,campaignId:campaign,creativeId:creative}};
}
test('ADS-049 client: issue Article-only ticket with opaque 128-bit browser nonce, do not qualify before observation',async()=>{
 const {window,args,calls,callbacks}=client();
 assert.equal(await window.JBAdAnalytics.prepare(args),true);
 assert.equal(calls.length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0])),{
  name:'jb_ad_issue_view_ticket',
  args:{p_article:article,p_campaign:campaign,p_creative:creative,
   p_open_nonce:'0102030405060708090a0b0c0d0e0f10'}
 });
 assert.equal(callbacks.length,1);
 assert.equal(await callbacks[0](),true);
 assert.equal(calls.length,2);
 assert.equal(calls[1].name,'jb_ad_qualify_view_ticket');
 assert.deepEqual(JSON.parse(JSON.stringify(calls[1].args)),{p_token:validToken});
});
test('ADS-049: duplicate concurrent prepare uses ONE issuance and one callback',async()=>{
 const {window,args,calls,callbacks}=client();
 const [a,b]=await Promise.all([
  window.JBAdAnalytics.prepare(args),window.JBAdAnalytics.prepare(args)
 ]);
 assert.deepEqual([a,b],[true,false]);
 assert.equal(calls.length,1);assert.equal(callbacks.length,1);
 assert.equal(await window.JBAdAnalytics.prepare(args),false);
 assert.equal(calls.length,1);
});
test('ADS-050: invalid Article/creative/campaign cannot issue any token',async()=>{
 for(const field of ['articleId','campaignId','creativeId']){
  const {window,args,calls}=client();
  assert.equal(await window.JBAdAnalytics.prepare({...args,[field]:'district:guna'}),false);
  assert.equal(calls.length,0);
 }
});
test('ADS-050: browser without crypto or secure observer fails closed',async()=>{
 for(const prop of ['crypto','IntersectionObserver','JBAdViewability','JBBackend']){
  const {window,args,calls}=client({[prop]:null});
  assert.equal(await window.JBAdAnalytics.prepare(args),false);
  assert.equal(calls.length,0);
 }
});
test('ADS-050: server unavailable/invalid ticket never invokes qualified reporter',async()=>{
 for(const response of [{data:null,error:Error('NO_TICKET')},{data:'invalid',error:null}]){
  const {window,args,callbacks,calls}=client();
  window.JBBackend.client.rpc=async(n,a)=>{calls.push({name:n,args:a});return response};
  assert.equal(await window.JBAdAnalytics.prepare(args),false);
  assert.equal(callbacks.length,0);
  assert.equal(calls.length,1);
 }
});
test('ADS-050: element removed while issuing ticket cannot record a hidden or stale slot',async()=>{
 const {window,args,element,callbacks}=client();
 window.JBBackend.client.rpc=async()=>{element.isConnected=false;return {data:validToken,error:null}};
 assert.equal(await window.JBAdAnalytics.prepare(args),false);
 assert.equal(callbacks.length,0);
});
test('ADS-050: reporter failure is isolated from Article rendering',async()=>{
 const {window,args,callbacks}=client();
 assert.equal(await window.JBAdAnalytics.prepare(args),true);
 window.JBBackend.client.rpc=async()=>{throw Error('STATS_BACKEND_DOWN')};
 assert.equal(await callbacks[0](),false);
});
test('ADS-050: never call unsafe raw event API or leak ticket to durable storage',()=>{
 assert.doesNotMatch(js,/jb_ad_event|jb_ad_record_event|\.rpc\(['"]jb_ad_record_event/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|document\.cookie|location\.search|navigator\.geolocation|innerHTML|fetch\s*\(/);
 assert.match(js,/p_open_nonce:hexRandom\(\)/);
 assert.match(js,/jb_ad_qualify_view_ticket/);
 const articleHtml=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/article.html','utf8');
 const home=fs.readFileSync('JANTA_BOL_PHASE_3C_WORKING/index.html','utf8');
 assert.doesNotMatch(articleHtml,/ad-analytics-client\.js|ad-viewability\.js/);
 assert.doesNotMatch(home,/ad-analytics-client\.js|ad-viewability\.js/);
});


test('ADS-048: trusted anchor click uses one issued token, no navigation interception',async()=>{
 const {window,args,calls,element}=client();
 const listeners=[];
 const anchor={tagName:'A',isConnected:true,href:'https://advertiser.example.test/',
   addEventListener(name,callback,options){listeners.push({name,callback,options})}};
 element.contains=child=>child===anchor;
 const prepared=await window.JBAdAnalytics.prepare({...args,ctaElement:anchor});
 assert.equal(prepared,true);
 assert.equal(listeners.length,1);
 assert.equal(listeners[0].name,'click');
 assert.equal(listeners[0].options.passive,true);
 let prevented=0;
 const event={isTrusted:true,defaultPrevented:false,
   preventDefault(){prevented++}};
 listeners[0].callback({isTrusted:false,defaultPrevented:false});
 assert.equal(calls.length,1,'synthetic click must not count');
 listeners[0].callback(event);
 listeners[0].callback(event);
 await Promise.resolve();
 assert.equal(prevented,0,'CTA must navigate independently of analytics');
 assert.equal(calls.filter(c=>c.name==='jb_ad_record_ticket_click').length,1);
 const click=calls.find(c=>c.name==='jb_ad_record_ticket_click');
 assert.deepEqual(JSON.parse(JSON.stringify(click.args)),{p_token:validToken});
});
test('ADS-048: hidden-tab, canceled and removed ad cannot send click claim',async()=>{
 for(const mode of ['hidden','cancelled','removed','detachedLink']){
  const {window,args,calls,element}=client();
  let callback;
  const link={tagName:'A',isConnected:true,
   addEventListener(_name,cb){callback=cb}};
  element.contains=child=>child===link;
  window.document={visibilityState:'visible'};
  assert.equal(await window.JBAdAnalytics.prepare({...args,ctaElement:link}),true);
  if(mode==='hidden')window.document.visibilityState='hidden';
  if(mode==='removed')element.isConnected=false;
  if(mode==='detachedLink')link.isConnected=false;
  callback({isTrusted:true,defaultPrevented:mode==='cancelled'});
  assert.equal(calls.filter(x=>x.name==='jb_ad_record_ticket_click').length,0,mode);
 }
});
test('ADS-048: no CTA or untrusted foreign CTA never attaches click reporter',async()=>{
 for(const type of ['missing','notAnchor','foreign']){
  const {window,args,element,calls}=client();
  const link={tagName:type==='notAnchor'?'DIV':'A',isConnected:true,
   addEventListener(){throw Error('INVALID_CTA_ATTACHED')}};
  element.contains=child=>type!=='foreign'&&child===link;
  assert.equal(await window.JBAdAnalytics.prepare({
    ...args,ctaElement:type==='missing'?null:link
  }),true);
  assert.equal(calls.length,1);
 }
});
test('ADS-048: statistics backend click failure must not break user-initiated link',async()=>{
 const {window,args,element}=client();
 let callback;
 const anchor={tagName:'A',isConnected:true,
  addEventListener(_name,handler){callback=handler}};
 element.contains=child=>child===anchor;
 const original=window.JBBackend.client.rpc;
 window.JBBackend.client.rpc=(name,x)=>
   name==='jb_ad_record_ticket_click'?Promise.reject(new Error('BACKEND_OFFLINE')):original(name,x);
 assert.equal(await window.JBAdAnalytics.prepare({...args,ctaElement:anchor}),true);
 assert.doesNotThrow(()=>callback({isTrusted:true,defaultPrevented:false}));
 await Promise.resolve();
});
