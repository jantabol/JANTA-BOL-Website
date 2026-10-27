/* JANTA BOL B9 — single-source public-safe Search/Analytics adapters.
   Uses existing Supabase client, never a service key or duplicate article database. */
(function(global){
'use strict';
const sdk=()=>{if(!global.JBBackend?.client)throw Error('B9_BACKEND_NOT_READY');return global.JBBackend.client;};
async function rpc(name,args){const {data,error}=await sdk().rpc(name,args);if(error)throw Error('B9_BACKEND_REJECTED_'+name+': '+String(error.code||'REMOTE_CHECK_FAILED').slice(0,24));return data;}
const text=(v,max=120)=>String(v??'').trim().slice(0,max);
const isoDate=v=>{if(!v)return null;const s=String(v);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s+'T00:00:00Z')))throw Error('B9_INVALID_DATE');return s;};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const id=v=>{const x=text(v,80);if(!UUID.test(x))throw Error('B9_INVALID_ARTICLE_ID');return x;};
const sort=v=>['latest','oldest','relevance'].includes(v)?v:'latest';
function cleanSearch(raw={}){
  const year=raw.year===''||raw.year==null?null:Number(raw.year);
  const month=raw.month===''||raw.month==null?null:Number(raw.month);
  if(year!==null&&(!Number.isSafeInteger(year)||year<1900||year>2200))throw Error('B9_INVALID_YEAR');
  if(month!==null&&(!Number.isSafeInteger(month)||month<1||month>12))throw Error('B9_INVALID_MONTH');
  const a=isoDate(raw.from),b=isoDate(raw.to);
  if(a&&b&&a>b)throw Error('B9_INVALID_DATE_RANGE');
  const articleId=text(raw.articleId,80);
  if(articleId&&!UUID.test(articleId))throw Error('B9_INVALID_ARTICLE_ID');
  const cursor=raw.cursor===null||raw.cursor===undefined?null:raw.cursor;
  if(cursor!==null&&(typeof cursor!=='object'||Array.isArray(cursor)))throw Error('B9_INVALID_CURSOR');
  return {p_query:text(raw.query),p_id:articleId||null,p_date_from:a,p_date_to:b,
    p_year:year,p_month:month,p_district:text(raw.district,100)||null,
    p_location:text(raw.location),p_category:text(raw.category,90)||null,
    p_term:text(raw.term),p_sort:sort(raw.order),p_cursor:cursor,
    p_limit:Math.max(1,Math.min(50,Number(raw.limit)||20))};
}
async function search(filters={}){
 const result=await rpc('jb_b9_search',cleanSearch(filters));
 if(!result||!Array.isArray(result.items)||result.items.length>50)throw Error('B9_INVALID_SEARCH_RESULT');
 return result;
}
async function taxonomy(query=''){const result=await rpc('jb_b9_taxonomy_discover',{p_query:text(query,80),p_limit:40});if(!Array.isArray(result))throw Error('B9_INVALID_TERMS');return result;}
async function related(articleId){const result=await rpc('jb_b9_related_news',{p_article_id:id(articleId),p_limit:5});if(!Array.isArray(result))throw Error('B9_INVALID_RELATED');return result;}
async function reporterDiscovery(query=''){const result=await rpc('jb_b9_reporter_discovery',{p_query:text(query,80),p_limit:40});if(!Array.isArray(result))throw Error('B9_INVALID_REPORTER_LIST');return result;}
async function publicMetrics(articleId){return rpc('jb_b9_public_metrics',{p_article_id:id(articleId)});}
async function publicAuthor(articleId){return rpc('jb_b9_public_article_author',{p_article:id(articleId)});}
const requireOwner=async()=>{await global.JBBackend.requireOwner();};
async function ownerAnalytics(start,end,order='views',limit=50){
 await requireOwner();if(!['views','shares','latest'].includes(order))throw Error('B9_SORT_INVALID');
 const from=Date.parse(start),to=Date.parse(end);
 if(!Number.isFinite(from)||!Number.isFinite(to)||to<=from)throw Error('B9_RANGE_INVALID');
 return rpc('jb_b9_owner_analytics',{p_from:new Date(from).toISOString(),p_to:new Date(to).toISOString(),p_sort:order,p_limit:Math.max(1,Math.min(100,Number(limit)||50))});
}
async function ownerMetricSettings({globalSettings=true,articleId=null,views=false,shares=false,override=null}={}){
 await requireOwner();
 if(override!==null&&(!Number.isSafeInteger(Number(override))||Number(override)<0))throw Error('B9_INVALID_DISPLAY_OVERRIDE');
 return rpc('jb_b9_owner_metric_settings',{p_global:!!globalSettings,p_article_id:globalSettings?null:id(articleId),
   p_views:!!views,p_shares:!!shares,p_display_override:override===null?null:Number(override)});
}
async function ownerAssignTerm(articleId,kind,slug,label,action='add'){
 await requireOwner();
 if(!['topic','tag'].includes(kind)||!['add','remove'].includes(action)
  ||!/^[a-z0-9][a-z0-9-]{0,79}$/.test(slug)||!text(label))throw Error('B9_INVALID_TERM');
 return rpc('jb_b9_owner_assign_term',{p_article:id(articleId),p_kind:kind,p_slug:slug,p_label:text(label),p_action:action});
}
const articleLink=articleId=>'article.html?id='+encodeURIComponent(id(articleId));
global.JBB9=Object.freeze({search,cleanSearch,taxonomy,related,reporterDiscovery,publicMetrics,publicAuthor,ownerAnalytics,
 ownerMetricSettings,ownerAssignTerm,articleLink});
})(window);
