// Public news launch gate: offline regression probes. No credentials, database writes or network.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('../../api/public-news.js');

const UUID = 'f17f6507-02a3-4881-ad37-0b02cadf3d3f';
const DRAFT = '690405f8-21af-4e46-9ddc-3c2e45abca9c';
const OLD_URL = process.env.JB_PUBLIC_SUPABASE_URL;
const OLD_KEY = process.env.JB_PUBLIC_SUPABASE_KEY;
const originalFetch = globalThis.fetch;
process.env.JB_PUBLIC_SUPABASE_URL = 'https://vrffsnkycvjithwtiylt.supabase.co';
process.env.JB_PUBLIC_SUPABASE_KEY = 'sb_publishable_OFFLINE_FIXTURE';
const sample = [
  {id: UUID, slug: 'isro', title: 'ISRO SpaDeX', body: 'Verified publication body',
   excerpt: 'News summary', category: 'Technology', status: 'published',
   published_at: '2026-10-28T04:30:02Z', public_attribution: 'ISRO public notice',
   cover_image_url: '', secret_internal: 'MUST_NOT_EXPOSE', created_by: 'PRIVATE'},
  {id: DRAFT, title: 'Private draft', body: 'PRIVATE', category: 'Technology',
   status: 'draft', published_at: null}
];

async function invoke(method='GET',query={}){
  const result={code:200, body:null, headers:{}};
  const res={
    setHeader(k,v){result.headers[k]=v;return this;},
    status(n){result.code=n;return this;},
    json(data){result.body=data;return this;}
  };
  await handler({method,query},res);
  return result;
}
test.after(()=>{
  globalThis.fetch=originalFetch;
  if(OLD_URL===undefined)delete process.env.JB_PUBLIC_SUPABASE_URL;
  else process.env.JB_PUBLIC_SUPABASE_URL=OLD_URL;
  if(OLD_KEY===undefined)delete process.env.JB_PUBLIC_SUPABASE_KEY;
  else process.env.JB_PUBLIC_SUPABASE_KEY=OLD_KEY;
});
test('published list is bounded, private columns and body omitted',async()=>{
  let requested;
  globalThis.fetch=async(url,options)=>{
    requested={url,options};
    return {ok:true,json:async()=>({items:sample})};
  };
  const r=await invoke();
  assert.equal(r.code,200);
  assert.equal(r.body.items.length,1);
  assert.equal(r.body.items[0].title,'ISRO SpaDeX');
  assert.equal(r.body.items[0].status,'published');
  assert.equal(r.body.items[0].body,undefined);
  assert.equal(r.body.items[0].secret_internal,undefined);
  assert.equal(r.body.items[0].created_by,undefined);
  assert.match(requested.url,/\/rpc\/jb_c1_public_articles$/);
  assert.equal(JSON.parse(requested.options.body).p_limit,30);
  assert.equal(requested.options.method,'POST');
  assert.equal(r.headers['Cache-Control'],'no-store, max-age=0');
});
test('detail returns published body and never a draft',async()=>{
  globalThis.fetch=async(_url,opts)=>({ok:true,json:async()=>{
    const id=JSON.parse(opts.body).p_article_id;
    return {items:id===DRAFT?[sample[1]]:[sample[0]]};
  }});
  const yes=await invoke('GET',{id:UUID});
  assert.equal(yes.code,200);
  assert.equal(yes.body.article.body,'Verified publication body');
  assert.equal(yes.body.article.secret_internal,undefined);
  const no=await invoke('GET',{id:DRAFT});
  assert.equal(no.code,200);
  assert.equal(no.body.article,null);
});
test('category filter ignores letter case and blocks mismatched categories',async()=>{
  globalThis.fetch=async()=>({ok:true,json:async()=>({items:sample})});
  const tech=await invoke('GET',{category:'technology'});
  assert.equal(tech.body.items.length,1);
  const crime=await invoke('GET',{category:'Crime'});
  assert.equal(crime.body.items.length,0);
});
test('invalid UUID and malformed category fail closed',async()=>{
  assert.equal((await invoke('GET',{id:'? OR 1=1'})).code,400);
  assert.equal((await invoke('GET',{id:['x','y']})).code,400);
  assert.equal((await invoke('GET',{category:'<script>'})).code,400);
  assert.equal((await invoke('GET',{category:['Technology','Crime']})).code,400);
});
test('POST and missing environment reject without query',async()=>{
  assert.equal((await invoke('POST')).code,405);
  const old=process.env.JB_PUBLIC_SUPABASE_KEY;
  delete process.env.JB_PUBLIC_SUPABASE_KEY;
  assert.equal((await invoke()).code,503);
  process.env.JB_PUBLIC_SUPABASE_KEY=old;
});
test('upstream errors and malformed RPC fail closed',async()=>{
  const saved=console.error;
  console.error=()=>{};
  try{
    globalThis.fetch=async()=>({ok:false,status:401});
    assert.equal((await invoke()).code,502);
    globalThis.fetch=async()=>({ok:true,json:async()=>({notItems:'invalid'})});
    assert.equal((await invoke()).code,502);
  }finally{console.error=saved;}
});
test('no service key, no unsafe public HTML, no fake-news ticker, no false reporter receipts',()=>{
  const base=path.join(__dirname,'../../');
  const homepage=fs.readFileSync(path.join(base,'index.html'),'utf8');
  const article=fs.readFileSync(path.join(base,'article.html'),'utf8');
  const reader=fs.readFileSync(path.join(base,'public-news.js'),'utf8');
  const backend=fs.readFileSync(path.join(base,'api/public-news.js'),'utf8');
  assert.match(homepage,/id="jb-news"/);
  assert.match(homepage,/id="jb-tech-news"/);
  assert.match(homepage,/id="technology"/);
  assert.doesNotMatch(homepage,/शिवपुरी अस्पताल में भ्रष्टाचार/);
  assert.doesNotMatch(homepage,/28\.4K व्यूज़/);
  assert.match(homepage,/#citizen-news-form,#official-reporter-form\{display:none!important\}/);
  assert.match(homepage,/जमा नहीं होगी/);
  assert.match(article,/hourCycle:'h23'/);
  assert.match(article,/IST/);
  assert.doesNotMatch(reader,/innerHTML\s*=/);
  assert.doesNotMatch(article,/innerHTML\s*=/);
  assert.doesNotMatch(reader,/sb_publishable_/);
  assert.doesNotMatch(backend,/process\.env\.SERVICE_ROLE/);
  assert.match(reader,/categoryMatch/);
  assert.match(reader,/cloneNode\(true\)/);
});
