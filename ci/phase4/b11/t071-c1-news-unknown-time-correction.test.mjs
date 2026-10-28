import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const page=readFileSync('JANTA_BOL_PHASE_3C_WORKING/add-news.html','utf8');
const body=page.match(/<script>\s*(\(function\(\)\{[\s\S]*?\}\)\(\);)\s*<\/script>/);
assert(body,'real add-news inline script missing');
test('news time form explicitly labels unknown/optional and does not auto-set new date time',()=>{
 assert.match(page,/News Time \(optional — verified time only\)/);
 assert.match(page,/\$\('publishTime'\)\.value=''/);
 assert(!page.includes("$('publishTime').value=currentTime()"));
});
test('loading source draft with null or blank time never invents current time',()=>{
 assert.match(page,/\$\('publishTime'\)\.value=i\.newsTime\|\|'';/);
 assert(!page.includes("i.newsTime||currentTime()"));
});
test('original manually verified time is preserved exactly',()=>{
 const expr="i.newsTime||''";
 const c=vm.createContext({i:{newsTime:'16:48'}});
 assert.equal(vm.runInContext(expr,c),'16:48');
 c.i.newsTime=null;assert.equal(vm.runInContext(expr,c),'');
 c.i.newsTime='';assert.equal(vm.runInContext(expr,c),'');
});
test('original fieldsToItem stores actual blank user value; no default injection',()=>{
 assert.match(page,/newsTime:\$\('publishTime'\)\.value/);
 assert.match(page,/\$\('publishDate'\)\.value=today\(\)/);
 assert.match(page,/JBBackend\.publish\(i,/);
 assert.match(page,/expectedVersion:editing\?editing\.version:null/);
 assert.match(page,/Published correction ko Final Review/);
});
