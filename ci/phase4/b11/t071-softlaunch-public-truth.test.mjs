import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = (path) => readFileSync(path, 'utf8');
const homePath = 'JANTA_BOL_PHASE_3C_WORKING/index.html';
const jsPath = 'JANTA_BOL_PHASE_3C_WORKING/script.js';
const feedPath = 'JANTA_BOL_PHASE_3C_WORKING/website-v3.js';
const articlePath = 'JANTA_BOL_PHASE_3C_WORKING/article.html';
const adsPath = 'JANTA_BOL_PHASE_3C_WORKING/public-ads.js';
const home = read(homePath);
const js = read(jsPath);
const feed = read(feedPath);
const root = read('index.html');
const redirects = JSON.parse(read('vercel.json')).redirects;
const gitBlob = (content) => createHash('sha1')
  .update('blob ' + Buffer.byteLength(content, 'utf8') + '\0' + content).digest('hex');

function problems({page=home, script=js, feedCode=feed}={}) {
  const errors=[];
  const htmlRisks=[
    [/🔴\s*LIVE/, 'unconditional public LIVE'],
    [/शिवपुरी अस्पताल में भ्रष्टाचार का आरोप/, 'static unsupported allegation'],
    [/शिवपुरी में भारी बारिश, कई रास्ते बंद/, 'static sample news card'],
    [/28\.4K\s*व्यूज़/, 'hardcoded views']
  ];
  for(const [pattern,name] of htmlRisks) if(pattern.test(page)) errors.push(name);
  if(!/<section class="breaking-news" id="top-story" hidden\b/.test(page))
    errors.push('breaking not default hidden');
  if(!/<a href="#latest-news" class="hero-btn">/.test(page)
    || !/<section class="latest-news-section" id="latest-news">/.test(page))
    errors.push('hero points to missing or hidden news section');
  if(!/<form class="citizen-news-form" id="citizen-news-form" hidden inert style="display:none" aria-hidden="true">/.test(page))
    errors.push('citizen demo form could collect private input');
  if(!/<form id="official-reporter-form" class="official-reporter-form" hidden inert style="display:none" aria-hidden="true">/.test(page))
    errors.push('reporter demo form could collect private input');
  if(!/<button type="button" class="district-button official-reporter-open" disabled aria-disabled="true"/.test(page))
    errors.push('reporter demo CTA enabled');
  if(!/href="#contact"/.test(page) || !/कोई जानकारी जमा नहीं होती/.test(page))
    errors.push('citizen failure notice not visible');
  if(!/जानकारी जमा नहीं हुई/.test(script) || !/आवेदन या दस्तावेज़ जमा नहीं हुआ/.test(script))
    errors.push('demo submit handler lacks explicit non-receipt');
  if(/"जानकारी प्राप्त हुई"|"आवेदन प्राप्त हुआ"/.test(script))
    errors.push('deceptive form success message');
  if(!/JBBackend\.listPublishedPublic\(30\)/.test(feedCode))
    errors.push('missing server-published news feed');
  if(!/newsError\s*\?/.test(feedCode) || !/breakingSection\.hidden=false/.test(feedCode))
    errors.push('offline vs no-news or real breaking gate missing');
  return errors;
}

test('existing protected root HTML Git blob is unchanged', ()=>{
  assert.equal(gitBlob(root), 'e82e88aee6e953f0eb0f817361cb87c3a5194aae');
});

test('only public root redirects to existing nested candidate; original article URLs not redirected', ()=>{
  assert.deepEqual(redirects,[{source:'/',destination:'/JANTA_BOL_PHASE_3C_WORKING/index.html',permanent:false}]);
  assert.equal(redirects.some(x=>x.source.includes('article')||x.source.includes('admin')),false);
});

test('actual reviewed homepage/feed/form scripts satisfy source-only truthful UI gates', ()=>{
  assert.deepEqual(problems(),[]);
  assert.match(home,/script src="website-v3.js"/);
  assert.match(home,/script src="public-ads.js/);
});

test('article and advertising frontends remain byte-identical to already-reviewed B8 candidate',()=>{
  assert.equal(gitBlob(read(articlePath)),'d2d414bef645c21404bcc45baa5aebbf7f9ff43e');
  assert.equal(gitBlob(read(adsPath)),'a450cc3158c4c72692e848d3044ee00e53582082');
});

test('negative: hardcoded LIVE and sample allegation are rejected',()=>{
  const faults=problems({page:home+'<div>🔴 LIVE शिवपुरी अस्पताल में भ्रष्टाचार का आरोप</div>'});
  assert.ok(faults.includes('unconditional public LIVE'));
  assert.ok(faults.includes('static unsupported allegation'));
});

test('negative: fabricated trending views are rejected',()=>{
  assert.ok(problems({page:home+' 28.4K व्यूज़'}).includes('hardcoded views'));
});

test('negative: newly enabled citizen / reporter demo forms are rejected',()=>{
  const exposed=home.replace('id="citizen-news-form" hidden inert style="display:none"','id="citizen-news-form"');
  assert.ok(problems({page:exposed}).includes('citizen demo form could collect private input'));
  const exposedReporter=home.replace('class="district-button official-reporter-open" disabled','class="district-button official-reporter-open"');
  assert.ok(problems({page:exposedReporter}).includes('reporter demo CTA enabled'));
});

test('negative: fake receipt and lost published feed contract both fail closed',()=>{
  assert.ok(problems({script:js+'"जानकारी प्राप्त हुई"'}).includes('deceptive form success message'));
  assert.ok(problems({feedCode:feed.replace('JBBackend.listPublishedPublic(30)','[]')}).includes('missing server-published news feed'));
});

test('negative: broken homepage CTA anchor and unconditional breaking are rejected',()=>{
  assert.ok(problems({page:home.replace('href="#latest-news"','href="#top-story"')})
    .includes('hero points to missing or hidden news section'));
  assert.ok(problems({page:home.replace('id="top-story" hidden','id="top-story"')})
    .includes('breaking not default hidden'));
});

test('no synthetic passing assertions ever authorise T071 final/hosted E8 or public launch',()=>{
  const status={source_contract_only:true,hosted_runtime_faults:'NOT_RUN',rpo_rto:'NOT_ESTABLISHED',
    t071_final:'HOLD',production_release_approved:false};
  assert.equal(status.t071_final,'HOLD');
  assert.equal(status.production_release_approved,false);
  assert.equal(status.hosted_runtime_faults,'NOT_RUN');
});

test('Founder FINAL hero copy: only जहाँ सच बोलता है, no geography-limited or extra slogan badge',()=>{
  assert.match(home, /<p class="tagline">\s*जहाँ सच बोलता है\s*<\/p>/);
  assert.equal((home.match(/जहाँ सच बोलता है/g)||[]).length,1);
  assert.doesNotMatch(home, /<div class="live-badge"/);
  assert.doesNotMatch(home, /दुनिया से गाँव तक|स्थानीय समाचार|🔴 LIVE/);
  assert.match(home, /<h1 class="hero-title">/);
  assert.match(home, /सच • तथ्य • भरोसा/);
  assert.match(home, /id="b9SearchNav"/);
});
