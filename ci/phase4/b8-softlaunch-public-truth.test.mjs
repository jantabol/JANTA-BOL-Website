import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
const read=async path=>readFile(new URL(path,root),'utf8');
const banned=[
 'शिवपुरी अस्पताल में भ्रष्टाचार का आरोप',
 'शिवपुरी में भारी बारिश, कई रास्ते बंद',
 'शिवपुरी में भारी बारिश के कारण कई गांवों का संपर्क टूटा',
 'पिछोर में भारी बारिश से कई रास्ते बंद',
 '28.4K व्यूज़','24.7K व्यूज़','21.3K व्यूज़',
 '18.6K व्यूज़','15.1K व्यूज़',
 'https://picsum.photos','https://images.unsplash.com'
];
test('protected original root stays byte-identical; root CUTOVER remains blocked',async()=>{
 const html=await read('index.html');
 const bytes=Buffer.from(html,'utf8');
 const sha=createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\\0'),bytes])).digest('hex');
 assert.equal(sha,'e82e88aee6e953f0eb0f817361cb87c3a5194aae');
 // The protected demo root is not certified for soft launch; release is HOLD.
});
test('public homepage has no invented public headlines / view counts / fake video',async()=>{
 const html=await read('JANTA_BOL_PHASE_3C_WORKING/index.html');
 for(const literal of banned)assert(!html.includes(literal),'false public story: '+literal);
 for(const cls of ['class="featured-news"','class="latest-news-section"','class="breaking-news"']){
  assert(html.includes(cls),'missing stable site anchor: '+cls);
 }
 assert.match(html,/<section class="breaking-news" id="top-story" hidden/);
 assert(!html.includes('top-story-open'));
 assert(!html.includes('latest-news-open'));
 assert(!html.includes('video-news-open'));
 assert(!html.includes('trending-open'));
 assert.match(html,/src="website-v3\.js"/);
 assert.match(html,/src="backend-client\.js"/);
});
test('only server-published article data creates dynamic headline; breaking hidden until real',async()=>{
 const js=await read('JANTA_BOL_PHASE_3C_WORKING/website-v3.js');
 assert.match(js,/JBBackend\.listPublishedPublic\(30\)/);
 assert.match(js,/if\(breaking&&breakingSection\)\{breakingSection\.hidden=false/);
 assert.match(js,/article\.html\?id=/);
 assert.match(js,/newsError\?/);
 assert(!js.includes('शिवपुरी में भारी बारिश'));
 const backend=await read('JANTA_BOL_PHASE_3C_WORKING/backend-client.js');
 assert.match(backend,/listPublishedPublic/);
});
test('B8 private upload remains gated; publisher owner not replaced',async()=>{
 const html=await read('JANTA_BOL_PHASE_3C_WORKING/b8-accountability.html');
 const js=await read('JANTA_BOL_PHASE_3C_WORKING/b8-accountability-ui.js');
 assert.match(html,/अभी कोई सवाल अधिकारी को नहीं भेजा जा रहा है/);
 assert.match(js,/LOCK_MS=15\*60\*1000/);
 assert(!js.includes('.innerHTML='));
 assert(!html.includes('onclick='));
});
