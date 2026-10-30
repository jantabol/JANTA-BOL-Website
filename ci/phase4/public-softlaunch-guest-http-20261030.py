#!/usr/bin/env python3
"""JANTA BOL 2026-10-30, exact production HTTPS guest READ-ONLY acceptance.
No Supabase service-role token, no login, no DB/media writes, no admin action.
Never print public publishable key nor any fetched page body containing it.
"""
import json
import os
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path
from urllib.parse import urlparse

BASE = "https://jantabol.in"
PUBLIC_ID = "c49f00b6-0359-400c-a957-2082142ff8dd"
SECOND_ID = "f17f6507-02a3-4881-ad37-0b02cadf3d3f"
SUPABASE = "https://vrffsnkycvjithwtiylt.supabase.co"
ROOT = Path(__file__).resolve().parents[2]
PAGES = "JANTA_BOL_PHASE_3C_WORKING"
checks = []
def check(title, condition, detail=""):
    checks.append((title,bool(condition),str(detail)[:190]))
    print(("PASS" if condition else "HOLD")+" | "+title+((" | "+str(detail)[:140]) if detail else ""))
def call(url, method="GET", json_body=None, key=None):
    headers={
      "User-Agent":"Mozilla/5.0 JANTA-BOL-Founder-ReadOnly-SoftLaunch/2026-10-30",
      "Accept":"text/html,application/json,*/*"
    }
    if key:
       headers["apikey"]=key
       headers["Content-Type"]="application/json"
    body=json.dumps(json_body).encode() if json_body is not None else None
    req=urllib.request.Request(url,headers=headers,data=body,method=method)
    try:
      with urllib.request.urlopen(req,timeout=18) as r:
        return (r.status,r.geturl(),dict(r.headers.items()),r.read(250_000))
    except urllib.error.HTTPError as e:
      return (e.code,e.geturl(),dict(e.headers.items()),e.read(4000))
def getter(path):
    url=BASE+path
    try:
      status,final,hdr,content=call(url)
      print("GET",path,"=>",status,"bytes",len(content),"final-host",urlparse(final).hostname)
      return status,final,hdr,content.decode("utf-8","replace")
    except Exception as e:
      print("GET",path,"=> NETWORK_ERROR",type(e).__name__)
      return 0,"",{},""
def get_api(endpoint,key,payload=None):
    try:
       return call(SUPABASE+endpoint,method="POST" if payload is not None else "GET",json_body=payload,key=key)
    except Exception as e:
       print("API",endpoint,"=>",type(e).__name__)
       return 0,"",{},b""
def parse_json(body):
    try:return json.loads(body)
    except:return None
def main():
    # PRODUCTION HTTPS origin only. Do not test Vercel Preview against real backend.
    status,final,hdr,html=getter("/")
    check("E1_ROOT_HTTPS_REAL_V3_HOME",status==200 and
      urlparse(final).hostname=="jantabol.in" and
      "JANTA" in html and "b9SearchNav" in html and "public-c1-projection.js" in html,
      "root canonical + visible public search + real news projection")
    check("E1_ROOT_VERCEL_REDIRECT_V3",urlparse(final).path=="/JANTA_BOL_PHASE_3C_WORKING/index.html",
      "canonical root must not serve obsolete mock V2 root index")
    check("E1_MOBILE_VIEWPORT_HOME","name=\"viewport\"" in html or "name='viewport'" in html)
    check("E1_HOME_NO_FAKE_FORM", "ऑनलाइन खबर भेजने का फ़ॉर्म अभी चालू नहीं है" in html)
    check("E1_HOME_NO_HARDCODED_SECRET", "service_role" not in html and "GOOGLE_CLIENT_SECRET" not in html)

    for id in (PUBLIC_ID,SECOND_ID):
      status,url,h,body=getter(f"/{PAGES}/article.html?id={id}")
      check("E1_PUBLIC_PERMANENT_ARTICLE_"+id[:8],status==200 and
       "JBPublicC1.get" in body and "whatsappShare" in body and
       "grievance-submit.html" in body and 'name="viewport"' in body,
       "public-only load, share, correction link")
      check("E1_ARTICLE_URL_STABLE_"+id[:8],urlparse(url).query=="id="+id)
    status,u,h,body=getter(f"/{PAGES}/b9-search.html")
    check("E1_B9_SEARCH_ARCHIVE_PAGE",status==200 and
      'id="b9Filters"' in body and 'id="b9Results"' in body and
      'src="b9-search-ui.js"' in body and "खबर" in body)
    status,u,h,body=getter(f"/{PAGES}/grievance-submit.html")
    check("E1_PUBLIC_CORRECTION_PAGE",status==200 and
       ("grievance" in body.lower() or "शिकायत" in body or "Correction" in body))
    status,u,h,body=getter(f"/{PAGES}/accountability-public.html")
    check("E1_ACCOUNTABILITY_PAGE",status==200 and ("जवाबदेही" in body or "accountability" in body.lower()))
    status,u,h,auth_html=getter(f"/{PAGES}/admin-login.html")
    check("E1_ADMIN_LOGIN_SHELL_ONLY",status==200 and
       "JBBackend.mfaChallengeAndVerify" in auth_html and
       "JBBackend.role()" in auth_html and
       "2FA" in auth_html,
       "public shell != admin authorization; signed-in Owner still needs Android proof")
    status,u,h,b9js=getter(f"/{PAGES}/b9-search-ui.js")
    check("E1_B9_SAFE_RENDER_JS",status==200 and
      "textContent" in b9js and "B9_INVALID_DATE_RANGE" in b9js)
    status,u,h,c1js=getter(f"/{PAGES}/public-c1-projection.js")
    check("E1_C1_PUBLISHED_ONLY_JS",status==200 and
      "row.status !== 'published'" in c1js and "jb_c1_public_articles" in c1js)
    status,u,h,settings=getter(f"/{PAGES}/supabase-config.js")
    check("E1_CANONICAL_SUPABASE_FAIL_CLOSED",status==200 and
      "JB_PREVIEW_NO_PRODUCTION_BACKEND" in settings and
      "root.location.hostname === 'jantabol.in'" in settings)
    # Publishable key is intentionally public: only used to emulate a real anonymous
    # guest web client. Never print/log/export the publishable key.
    m=re.search(r"publishableKey\s*:\s*['\"](sb_publishable_[^'\"]+)['\"]",settings)
    check("E1_GUEST_PUBLIC_KEY_CONFIG_PRESENT",m is not None)
    if m:
      key=m.group(1)
      status,_,_,raw=get_api("/rest/v1/rpc/jb_c1_public_articles",key,
                        {"p_article_id":None,"p_limit":30})
      data=parse_json(raw)
      items=data.get("items") if isinstance(data,dict) else None
      ids={r.get("id") for r in items if isinstance(r,dict)} if isinstance(items,list) else set()
      check("E1_ACTUAL_ANON_PUBLISHED_RPC",status==200 and isinstance(items,list) and
         {PUBLIC_ID,SECOND_ID}.issubset(ids) and len(items)==2,
         f"HTTP {status}, count {len(items) if isinstance(items,list) else 'n/a'}")
      check("E1_ANON_PROJECTION_FIELD_ALLOWLIST",isinstance(items,list) and all(
         "refresh_token" not in r and "internal_source" not in r
         and r.get("status")=="published" for r in items if isinstance(r,dict)))
      status,_,_,raw=get_api("/rest/v1/rpc/jb_c1_public_articles",key,
                        {"p_article_id":PUBLIC_ID,"p_limit":1})
      one=parse_json(raw);one_items=one.get("items") if isinstance(one,dict) else None
      check("E1_ACTUAL_DIRECT_ARTICLE_RPC",status==200 and isinstance(one_items,list)
        and len(one_items)==1 and one_items[0].get("id")==PUBLIC_ID,
        f"HTTP {status}, count {len(one_items) if isinstance(one_items,list) else 'n/a'}")
      status,_,_,raw=get_api("/rest/v1/rpc/jb_b9_search",key,
                        {"p_query":"ISRO","p_limit":20})
      data=parse_json(raw);found=data.get("items") if isinstance(data,dict) else None
      check("E1_ACTUAL_GUEST_SEARCH",status==200 and isinstance(found,list) and
        {PUBLIC_ID,SECOND_ID}.issubset({x.get("id") for x in found if isinstance(x,dict)}),
        f"HTTP {status}, count {len(found) if isinstance(found,list) else 'n/a'}")
      status,_,_,raw=get_api("/rest/v1/rpc/jb_b9_search",key,
                        {"p_query":"NONEXISTENT_JANTABOL_2099_TEST","p_limit":20})
      data=parse_json(raw);found=data.get("items") if isinstance(data,dict) else None
      check("E1_GUEST_NO_MATCH_SEARCH",status==200 and isinstance(found,list)
        and len(found)==0,f"HTTP {status}")
      # Deliberately permitted published-only article columns remain public.
      # No unpublished/deleted row may be returned through guest RLS.
      status,_,_,raw=get_api("/rest/v1/articles?select=id,status&limit=100",key)
      records=parse_json(raw)
      visible_ids={x.get("id") for x in records if isinstance(x,dict)} if isinstance(records,list) else set()
      check("E1_ANON_RAW_PUBLIC_COLUMNS_PUBLISHED_ONLY",
        status==200 and isinstance(records,list) and len(records)==2 and
        visible_ids=={PUBLIC_ID,SECOND_ID} and
        all(x.get("status")=="published" for x in records if isinstance(x,dict)),
        f"HTTP {status}, public_rows {len(records) if isinstance(records,list) else 'not_array'}")
      status,_,_,raw=get_api("/rest/v1/articles?select=created_by&limit=1",key)
      check("E1_ANON_PRIVATE_CREATOR_COLUMN_DENIED",status in (401,403),
        f"HTTP {status}, creator_private_column_denied")
      # Security triage: if public publishable key can see raw articles, prove
      # whether ANY draft/deleted rows leak, without printing titles/IDs/content.
      status,_,_,raw=get_api("/rest/v1/articles?select=id,status,deleted_at&limit=100",key)
      rows=parse_json(raw)
      if status==200 and isinstance(rows,list):
        leaked=[x for x in rows if isinstance(x,dict) and
          (x.get("status")!="published" or x.get("deleted_at") is not None)]
        unknown=[x for x in rows if isinstance(x,dict) and
          x.get("id") not in {PUBLIC_ID,SECOND_ID}]
        print("ANON_ARTICLES_PRIVACY_DIAGNOSTIC",
          json.dumps({"http":status,"visible_total":len(rows),
            "unpublished_or_deleted_count":len(leaked),"not_in_current_published_allowlist":len(unknown)}))
        check("E1_NO_DRAFT_OR_DELETED_EXPOSURE",not leaked and not unknown,
          f"public raw rows {len(rows)}, unpublished or unexpected {len(leaked)+len(unknown)}")
      else:
        check("E1_NO_DRAFT_OR_DELETED_EXPOSURE",status in (401,403),
          f"HTTP {status}, denied/no row access")
      status,_,_,raw=get_api("/rest/v1/grievances?select=id&limit=1",key)
      check("E1_ANON_PRIVATE_GRIEVANCE_BLOCKED",status in (401,403),
        f"HTTP {status} (expected forbidden)")
    failed=[name for name,ok,_ in checks if not ok]
    print("SUMMARY",json.dumps({"total":len(checks),"pass":len(checks)-len(failed),
      "hold":len(failed),"hold_names":failed},ensure_ascii=False))
    return 1 if failed else 0
if __name__=="__main__":
    sys.exit(main())
