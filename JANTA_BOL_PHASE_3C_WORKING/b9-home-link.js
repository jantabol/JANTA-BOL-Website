/* Additive public navigation. Never mutates existing homepage Article/Live/Ad rendering. */
(function(){
'use strict';
if(document.getElementById('b9SearchNav'))return;
const anchor=document.createElement('a');anchor.id='b9SearchNav';
anchor.href='b9-search.html';anchor.textContent='🔎 खबरें खोजें / पुराना संग्रह';
anchor.style.cssText='display:inline-block;background:#a4151d;color:#fff;font-weight:700;padding:10px 14px;border-radius:9px;text-decoration:none;margin:10px 6px;min-height:44px';
const header=document.querySelector('header.navbar')||document.querySelector('header')||document.body;
header.appendChild(anchor);
})();
