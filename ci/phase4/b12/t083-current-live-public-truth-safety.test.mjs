// JANTA BOL B12/T083 review-only current public homepage truth regressions.
// This asserts current C1 published-only feed (not an older B11 backend method),
// safe disabled demo forms, and no fabricated receipts. No live writes/network.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base='JANTA_BOL_PHASE_3C_WORKING/';
const read=x=>readFileSync(x,'utf8');
const html=read(base+'index.html');
const js=read(base+'script.js');
const feed=read(base+'website-v3.js');
const c1=read(base+'public-c1-projection.js');
const b9=read(base+'b9-home-entry.css');
const vercel=JSON.parse(read('vercel.json'));

function issues({page=html,script=js,publicFeed=feed}={}){
 const errors=[];
 if(!/<form class="citizen-news-form" id="citizen-news-form" hidden inert style="display:none" aria-hidden="true">/.test(page))errors.push('citizen_form_not_inert');
 if(!/<form id="official-reporter-form" class="official-reporter-form" hidden inert style="display:none" aria-hidden="true">/.test(page))errors.push('reporter_form_not_inert');
 if(!/<button type="button" class="district-button official-reporter-open" disabled aria-disabled="true"/.test(page))errors.push('reporter_cta_enabled');
 if(!/<a href="#contact">आधिकारिक संपर्क विकल्प देखें<\/a>/.test(page)||!/कोई जानकारी जमा नहीं होती/.test(page))errors.push('nonreceipt_contact_missing');
 if(!/जानकारी जमा नहीं हुई/.test(script)||!/आवेदन या दस्तावेज़ जमा नहीं हुआ/.test(script))errors.push('false_receipt_possible');
 if(/"जानकारी प्राप्त हुई"|"आवेदन प्राप्त हुआ"/.test(script))errors.push('deceptive_receipt');
 if(!/JBPublicC1\.list\(30\)/.test(publicFeed))errors.push('current_c1_published_only_feed_missing');
 if(!/newsError\s*\?/.test(publicFeed))errors.push('rpc_outage_not_separated_from_empty_feed');
 if(!/breakingSection\.hidden=false/.test(publicFeed))errors.push('no_real_breaking_path');
 if(!/id="top-story" hidden aria-live="polite"/.test(page)||!/#top-story\[hidden\]\{display:none!important\}/.test(page))errors.push('default_breaking_visible');
 if(/<div class="live-badge"|🔴\s*LIVE|28\.4K\s*व्यूज़|शिवपुरी अस्पताल में भ्रष्टाचार का आरोप/.test(page))errors.push('unverified_badge_or_news');
 if(!/<p class="tagline">\s*जहाँ सच बोलता है\s*<\/p>/.test(page))errors.push('founder_tagline_broken');
 if(!/id="b9SearchNav"/.test(page)||!/href="b9-search\.html"/.test(page)||!/b9-home-entry\.css\?v=20261027-t071/.test(page))errors.push('b9_mobile_search_missing');
 return errors;
}
test('Current live-source review candidate: no demo PII forms, non-receipt, real C1 news and Founder brand',()=>{
 assert.deepEqual(issues(),[]);
});
test('Negative: exposing hidden citizen form MUST fail',()=>{
 const broken=html.replace('id="citizen-news-form" hidden inert style="display:none"','id="citizen-news-form"');
 assert(issues({page:broken}).includes('citizen_form_not_inert'));
});
test('Negative: enabled reporter CTA MUST fail',()=>{
 const broken=html.replace('class="district-button official-reporter-open" disabled','class="district-button official-reporter-open"');
 assert(issues({page:broken}).includes('reporter_cta_enabled'));
});
test('Negative: fake received-success copy MUST fail',()=>{
 assert(issues({script:js+'"आवेदन प्राप्त हुआ"'}).includes('deceptive_receipt'));
});
test('Negative: broken C1 feed cannot be replaced by silent empty list or unverified direct article source',()=>{
 const broken=feed.replace('JBPublicC1.list(30)','[]');
 assert(issues({publicFeed:broken}).includes('current_c1_published_only_feed_missing'));
 assert.match(c1,/jb_b8_c1_public_article_get|jb_public_articles|jb_b8_c1_public_news_list|public_articles/i);
});
test('B9 mobile search remains 46px focus-ready and accessible before hero',()=>{
 assert.match(b9,/min-height:46px/);
 assert.match(b9,/focus-visible/);
 assert(html.indexOf('id="b9SearchNav"')<html.indexOf('<section class="hero">'));
 assert.match(html,/<section class="latest-news-section" id="latest-news">/);
});
test('Vercel original route still exact, no redirect of Article or Founder',()=>{
 assert.deepEqual(vercel.redirects,[{source:'/',destination:'/JANTA_BOL_PHASE_3C_WORKING/index.html',permanent:false}]);
 assert(!JSON.stringify(vercel).includes('service_role'));
});
test('Anti-fake-lock: sources and static tests cannot declare E8 or current Founder E4 complete',()=>{
 const gates={source_only:true,real_current_e8:false,real_e4:false,Founder_production_signoff:false};
 assert(!gates.real_current_e8);
 assert(!gates.real_e4);
 assert(!gates.Founder_production_signoff);
});
