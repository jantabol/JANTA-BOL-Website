(function(global){
  'use strict';

  if(!global.supabase || !global.JB_SUPABASE_CONFIG){
    throw new Error('Supabase client/config missing');
  }

  const client = global.supabase.createClient(
    global.JB_SUPABASE_CONFIG.url,
    global.JB_SUPABASE_CONFIG.publishableKey,
    {
      auth:{
        persistSession:true,
        autoRefreshToken:true,
        detectSessionInUrl:true
      }
    }
  );

  const SHADOW='jantaBolBackendShadow';
  const OWNER_CACHE='jbVerifiedOwner';

  const now=()=>new Date().toISOString();

  const esc=(v)=>{
    const d=document.createElement('div');
    d.textContent=String(v??'');
    return d.innerHTML;
  };

  const safeUrl=(value)=>{
    const raw=String(value??'').trim();
    if(!raw)return '';
    try{
      const u=new URL(raw,global.location.href);
      return (u.protocol==='https:'||u.protocol==='http:') ? u.href : '';
    }catch(_){
      return '';
    }
  };

  function jwtPayload(token){
    try{
      const part=String(token||'').split('.')[1]||'';
      const normalized=part.replace(/-/g,'+').replace(/_/g,'/');
      const padded=normalized.padEnd(Math.ceil(normalized.length/4)*4,'=');
      const binary=atob(padded);
      const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    }catch(_){
      return {};
    }
  }

  async function recentMfaInfo(maxAgeSeconds=600){
    const s=await session();
    if(!s){
      return {ok:false,reason:'AUTH_REQUIRED',ageSeconds:null,method:null,timestamp:null};
    }

    const claims=jwtPayload(s.access_token);
    const amr=Array.isArray(claims.amr)?claims.amr:[];
    const latest=amr
      .filter(x=>x && (x.method==='totp'||x.method==='phone'))
      .map(x=>({...x,timestamp:Number(x.timestamp||0)}))
      .filter(x=>Number.isFinite(x.timestamp) && x.timestamp>0)
      .sort((a,b)=>b.timestamp-a.timestamp)[0]||null;
    const ts=Number(latest?.timestamp||0);
    const age=ts?Math.max(0,Math.floor(Date.now()/1000-ts)):null;

    return {
      ok:!!latest && age!==null && age<=Number(maxAgeSeconds||600),
      reason:latest?'MFA_TOO_OLD':'MFA_STEP_UP_REQUIRED',
      ageSeconds:age,
      method:latest?.method||null,
      timestamp:ts||null
    };
  }

  const slug=()=>`jb-${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;

  function normalize(row,source){
    row=row||{};
    source=source||{};

    return {
      id:row.id||'',
      version:Number(row.version||0),
      slug:row.slug||'',
      status:row.status||'draft',

      headline:row.title||'',
      summary:row.excerpt||'',
      content:row.body||'',
      category:row.category||'',

      location:row.location||'',
      author:row.reporter_name||'',
      geoLevel:row.geography_level||'',
      district:row.district||'',

      newsDate:row.news_date||'',
      newsTime:row.news_time||'',

      breaking:!!row.breaking,
      topStory:!!row.top_story,

      publishedAt:row.published_at||'',
      createdAt:row.created_at||'',
      updatedAt:row.updated_at||'',
      previousStatus:row.previous_status||'',

      media:{
        coverImageUrl:row.cover_image_url||'',
        additionalMediaUrls:Array.isArray(row.additional_media_urls)
          ? row.additional_media_urls
          : [],
        youtubeUrl:row.video_url||''
      },

      internalSource:{
        type:source.source_type||'',
        name:source.source_name||'',
        url:source.source_url||'',
        informationDate:source.information_date||'',
        note:source.internal_note||'',
        verificationStatus:
          source.verification_status||'Pending Verification',
        evidence:source.verification_evidence||'',
        publicAttribution:
          source.public_attribution||
          row.public_attribution||
          ''
      },

      social:{
        enabled:false,
        facebook:false,
        instagram:false,
        whatsapp:false,
        youtube:false,
        caption:'',
        status:{}
      },

      lifecycle:[]
    };
  }

  function toRow(item){
    return {
      slug:item.slug||slug(),
      title:item.headline||'',
      body:item.content||'',
      excerpt:item.summary||'',

      cover_image_url:item.media?.coverImageUrl||'',
      video_url:item.media?.youtubeUrl||'',
      additional_media_urls:item.media?.additionalMediaUrls||[],

      public_attribution:
        item.internalSource?.publicAttribution||'',

      category:item.category||'',
      geography_level:item.geoLevel||'',
      district:item.district||'',
      location:item.location||'',
      reporter_name:item.author||'',

      news_date:item.newsDate||null,
      news_time:item.newsTime||null,

      breaking:!!item.breaking,
      top_story:!!item.topStory
    };
  }

  function toSource(item){
    const s=item.internalSource||{};

    return {
      article_id:item.id,
      source_type:s.type||'',
      source_name:s.name||'',
      source_url:s.url||'',
      information_date:s.informationDate||null,
      internal_note:s.note||'',
      verification_status:
        s.verificationStatus||'Pending Verification',
      verification_evidence:s.evidence||'',
      public_attribution:s.publicAttribution||''
    };
  }
    async function session(){
    const {data,error}=await client.auth.getSession();

    if(error){
      throw error;
    }

    return data?.session||null;
  }

  async function role(){
    const s=await session();

    if(!s){
      return null;
    }

    try{
      const {data,error}=await client
        .from('user_roles')
        .select('role')
        .eq('user_id',s.user.id)
        .maybeSingle();

      if(error){
        throw error;
      }

      const r=data?.role||null;

      if(r==='owner'){
        localStorage.setItem(
          OWNER_CACHE,
          JSON.stringify({
            userId:s.user.id,
            role:'owner'
          })
        );
      }else{
        localStorage.removeItem(OWNER_CACHE);
      }

      return r;

    }catch(e){
      if(!navigator.onLine){
        try{
          const cached=JSON.parse(
            localStorage.getItem(OWNER_CACHE)||'null'
          );

          if(
            cached &&
            cached.userId===s.user.id &&
            cached.role==='owner'
          ){
            return 'owner';
          }
        }catch(_){}
      }

      throw e;
    }
  }

  async function requireOwner(){
    const recoveryState=JSON.parse(
      localStorage.getItem('jbLimitedRecoveryMode')||'null'
    );

    if(recoveryState?.verified===true){
      throw new Error('LIMITED_RECOVERY_MODE');
    }

    const s=await session();

    if(!s){
      throw new Error('AUTH_REQUIRED');
    }

    const r=await role();

    if(r!=='owner'){
      throw new Error('OWNER_REQUIRED');
    }

    const aal=await mfaAAL();

    if(aal?.currentLevel!=='aal2'){
      throw new Error('AAL2_REQUIRED');
    }

    return s;
  }

  async function requireRecentMfa(maxAgeSeconds=600){
    const s=await requireOwner();
    const info=await recentMfaInfo(maxAgeSeconds);

    if(!info.ok){
      throw new Error(info.reason||'MFA_STEP_UP_REQUIRED');
    }

    return s;
  }

  async function insertSecurityAudit(action,metadata={}){
    const s=await requireOwner();
    const {error}=await client
      .from('audit_logs')
      .insert({
        actor_user_id:s.user.id,
        action:String(action||'security_event'),
        record_type:'security',
        record_id:s.user.id,
        metadata:metadata||{},
        created_at:now()
      });

    if(error){
      throw error;
    }

    return true;
  }

  async function signIn(email,password){
    localStorage.removeItem(OWNER_CACHE);

    const {data,error}=await client.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      throw error;
    }

    return data;
  }

  async function signOut(){
    localStorage.removeItem(OWNER_CACHE);

    const {error}=await client.auth.signOut({
      scope:'local'
    });

    if(error){
      throw error;
    }

    return true;
  }

  async function signOutAllSessions(){
    await requireOwner();
    await insertSecurityAudit('security_logout_all_devices');
    localStorage.removeItem(OWNER_CACHE);

    const {error}=await client.auth.signOut({
      scope:'global'
    });

    if(error){
      throw error;
    }

    return true;
  }

  async function signOutOtherSessions(){
  await requireOwner();
  await insertSecurityAudit('security_logout_other_devices');

  const {error}=await client.auth.signOut({
    scope:'others'
  });

  if(error){
    throw error;
  }

  return true;
}
  async function changePassword(newPassword){
  await requireRecentMfa(600);
  // Record the authenticated request before Auth may rotate/terminate sessions.
  // Supabase Auth remains the authoritative completion audit for password change.
  await insertSecurityAudit('security_password_change_requested');

  const {data,error}=await client.auth.updateUser({
    password:newPassword
  });

  if(error){
    throw error;
  }

  return data;
}
   async function mfaListFactors(){
    const {data,error}=await client.auth.mfa.listFactors();

    if(error){
      throw error;
    }

    return data;
  }

  async function mfaEnroll(friendlyName='JANTA BOL Founder'){
    const factors=await mfaListFactors();
    const verified=(factors?.totp||[]).filter(f=>f.status==='verified');
    // Initial first-factor enrollment must remain possible from the AAL1 setup
    // flow. Adding an additional trusted-device factor requires recent MFA.
    if(verified.length){
      await requireRecentMfa(600);
      await insertSecurityAudit('security_mfa_factor_add_requested',{
        friendly_name:String(friendlyName||'JANTA BOL Founder').trim()
      });
    }

    const stalePending=(factors?.totp||[])
      .filter(f=>f.status!=='verified');

    for(const f of stalePending){
      const {error:cleanupError}=await client.auth.mfa.unenroll({
        factorId:f.id
      });

      if(cleanupError){
        throw new Error('PENDING_MFA_CLEANUP_FAILED: '+cleanupError.message);
      }
    }

    const {data,error}=await client.auth.mfa.enroll({
      factorType:'totp',
      friendlyName:String(friendlyName||'JANTA BOL Founder').trim()
        ||'JANTA BOL Founder'
    });

    if(error){
      throw error;
    }

    return data;
  }

  async function mfaUnenroll(factorId){
    if(!factorId){
      throw new Error('FACTOR_ID_REQUIRED');
    }

    await requireRecentMfa(600);
    // Record request before Auth may downgrade/rotate the current session.
    await insertSecurityAudit('security_mfa_factor_remove_requested',{factor_id:factorId});

    const {data,error}=await client.auth.mfa.unenroll({
      factorId
    });

    if(error){
      throw error;
    }

    return data;
  }

  async function recoveryDeleteMfa(factorId,recoveryKey){
  if(!factorId || !recoveryKey){
    throw new Error('RECOVERY_INPUT_REQUIRED');
  }

  const {data,error}=await client.functions.invoke(
    'jb-recovery-delete-mfa',
    {
      body:{
        factorId,
        recoveryKey
      }
    }
  );

  if(error){
    throw error;
  }

  if(!data?.ok){
    throw new Error(
      data?.error || 'RECOVERY_MFA_DELETE_FAILED'
    );
  }

  return data;
}

  async function mfaChallengeAndVerify(factorId,code){
    const {data,error}=await client.auth.mfa.challengeAndVerify({
      factorId,
      code
    });

    if(error){
      throw error;
    }

    return data;
  }

  async function mfaAAL(){
    const {data,error}=await client.auth.mfa.getAuthenticatorAssuranceLevel();

    if(error){
      throw error;
    }

    return data;
  }
  async function setOwnerRecoveryKey(recoveryKey){
  await requireRecentMfa(600);

  const {data,error}=await client.rpc(
    'jb_set_owner_recovery_key',
    {p_recovery_key:recoveryKey}
  );

  if(error){
    throw error;
  }

  // The RPC itself writes the authoritative recovery-key security audit.
  return data;
}

async function verifyOwnerRecoveryKey(recoveryKey){
  const {data,error}=await client.rpc(
    'jb_verify_owner_recovery_key',
    {p_recovery_key:recoveryKey}
  );

  if(error){
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}
async function serverSessionValid(){
  const s=await session();

  if(!s){
    return false;
  }

  const claims=jwtPayload(s.access_token);
  const sessionId=claims?.session_id;

  if(!sessionId){
    return false;
  }

  try{
    const sessions=await ownerListSessions();
    return sessions.some(
      x=>String(x.session_id)===String(sessionId)
    );
  }catch(e){
    const message=String(e?.message||'');
    if(message==='OWNER_AAL2_REQUIRED' || message==='AUTH_REQUIRED'){
      return false;
    }
    throw e;
  }
}
async function ownerListSessions(){
  await requireOwner();
  const {data,error}=await client.rpc('jb_owner_list_sessions');
  if(error){
    throw error;
  }
  return data||[];
}

async function setOwnerSessionLabel(sessionId,label){
  const s=await requireOwner();
  if(!sessionId||!String(label||'').trim()){
    throw new Error('SESSION_LABEL_REQUIRED');
  }

  const {data,error}=await client
    .from('owner_session_labels')
    .upsert({
      session_id:sessionId,
      user_id:s.user.id,
      label:String(label).trim(),
      updated_at:now()
    },{onConflict:'session_id'})
    .select('*')
    .single();

  if(error){
    throw error;
  }

  return data;
}

async function ownerRevokeSession(sessionId){
  await requireOwner();
  if(!sessionId){
    throw new Error('SESSION_ID_REQUIRED');
  }

  const {data,error}=await client.rpc('jb_owner_revoke_session',{
    p_session_id:sessionId
  });

  if(error){
    throw error;
  }

  return data;
}

async function ownerSecurityActivity(limit=50){
  const s=await requireOwner();
  const safeLimit=Math.min(100,Math.max(1,Number(limit)||50));
  const {data,error}=await client
    .from('audit_logs')
    .select('id,action,metadata,created_at')
    .eq('actor_user_id',s.user.id)
    .eq('record_type','security')
    .order('created_at',{ascending:false})
    .limit(safeLimit);

  if(error){
    throw error;
  }

  return data||[];
}

async function recoveryPhysicalStatus(){
  await requireOwner();
  const {data,error}=await client.rpc('jb_owner_recovery_physical_status');
  if(error){
    throw error;
  }
  return Array.isArray(data)?(data[0]||null):data;
}

async function confirmRecoveryPhysicalCheck(outcome='safe'){
  await requireOwner();
  const allowed=['safe','rotated_replaced'];
  if(!allowed.includes(outcome)){
    throw new Error('INVALID_RECOVERY_PHYSICAL_OUTCOME');
  }

  const {data,error}=await client.rpc('jb_owner_confirm_recovery_physical_check',{
    p_outcome:outcome
  });
  if(error){
    throw error;
  }
  return Array.isArray(data)?(data[0]||null):data;
}

  async function getSource(id){
  const {data,error}=await client
    .from('article_sources')
    .select('*')
    .eq('article_id',id)
    .maybeSingle();

  if(error){
    throw error;
  }

  return data||{};
}

  async function getArticle(id,{privateData=false}={}){
    const publicCols='id,slug,title,body,excerpt,cover_image_url,video_url,additional_media_urls,public_attribution,category,geography_level,district,location,reporter_name,status,published_at,created_at,updated_at,version,news_date,news_time,breaking,top_story';

    let q=client
      .from('articles')
      .select(privateData?'*':publicCols)
      .eq('id',id)
      .maybeSingle();

    const {data,error}=await q;

    if(error){
      throw error;
    }

    if(!data){
      return null;
    }

    let s={};

    if(privateData){
      s=await getSource(id);
    }

    return normalize(data,s);
  }

  async function listByStatus(status){
    const {data,error}=await client
      .from('articles')
      .select('*')
      .eq('status',status)
      .order('updated_at',{ascending:false});

    if(error){
      throw error;
    }

    return Promise.all(
      (data||[]).map(
        async r=>normalize(r,await getSource(r.id))
      )
    );
  }

  async function listDrafts(){
    const {data,error}=await client
      .from('articles')
      .select('*')
      .in('status',['draft','review','unpublished'])
      .order('updated_at',{ascending:false});

    if(error){
      throw error;
    }

    return Promise.all(
      (data||[]).map(
        async r=>normalize(r,await getSource(r.id))
      )
    );
  }
    async function listPublishedPublic(limit=20){
    const {data,error}=await client
      .from('articles')
      .select('id,slug,title,body,excerpt,cover_image_url,video_url,additional_media_urls,public_attribution,category,geography_level,district,location,reporter_name,status,published_at,created_at,updated_at,version,news_date,news_time,breaking,top_story')
      .eq('status','published')
      .order('published_at',{ascending:false})
      .limit(limit);

    if(error){
      throw error;
    }

    return (data||[]).map(
      r=>normalize(r,{})
    );
  }

  async function saveSource(item,prevVerification){
    const src=toSource(item);

    const {error}=await client
      .from('article_sources')
      .upsert(src,{onConflict:'article_id'});

    if(error){
      throw error;
    }

    const next=
      item.internalSource?.verificationStatus||
      'Pending Verification';

    const note=item.verificationNote||'';

    if(prevVerification!==next||note){
      const {error:e}=await client
        .from('verification_history')
        .insert({
          article_id:item.id,
          previous_status:prevVerification||'',
          new_status:next,
          evidence_reference:
            item.internalSource?.evidence||'',
          note
        });

      if(e){
        throw e;
      }
    }
  }

  async function saveDraft(
    item,
    {expectedVersion=null,prevVerification=''}={}
  ){
    await requireOwner();

    const row=toRow(item);
    let saved;

    if(item.id){
      let q=client
        .from('articles')
        .update({
          ...row,
          status:'draft',
          published_at:null,
          saved_at:now()
        })
        .eq('id',item.id);

      if(expectedVersion!==null){
        q=q.eq('version',expectedVersion);
      }

      const {data,error}=await q.select('*');

      if(error){
        throw error;
      }

      if(!data?.length){
        throw new Error('VERSION_CONFLICT');
      }

      saved=data[0];

    }else{
      const {data,error}=await client
        .from('articles')
        .insert({
          ...row,
          status:'draft',
          saved_at:now()
        })
        .select('*')
        .single();

      if(error){
        throw error;
      }

      saved=data;
    }

    const out=normalize(
      saved,
      item.internalSource||{}
    );

    out.internalSource=item.internalSource||{};
    out.verificationNote=item.verificationNote||'';

    await saveSource(out,prevVerification);

    localStorage.removeItem(SHADOW);

    return await getArticle(
      saved.id,
      {privateData:true}
    );
  }

  async function publish(
    item,
    {expectedVersion=null,prevVerification=''}={}
  ){
    await requireOwner();

    let working=item;

    if(!working.id){
      working=await saveDraft(
        working,
        {
          expectedVersion:null,
          prevVerification
        }
      );
    }

    const row=toRow(working);

    let q=client
      .from('articles')
      .update({
        ...row,
        status:'published',
        published_at:working.publishedAt||now(),
        saved_at:now()
      })
      .eq('id',working.id);

    if(expectedVersion!==null){
      q=q.eq('version',expectedVersion);
    }

    const {data,error}=await q.select('*');

    if(error){
      throw error;
    }

    if(!data?.length){
      throw new Error('VERSION_CONFLICT');
    }

    const out=normalize(
      data[0],
      working.internalSource||{}
    );

    out.internalSource=working.internalSource||{};
    out.verificationNote=working.verificationNote||'';

    await saveSource(out,prevVerification);

    localStorage.removeItem(SHADOW);

    return await getArticle(
      out.id,
      {privateData:true}
    );
  }
    async function unpublish(
    id,
    expectedVersion
  ){
    await requireOwner();

    let q=client
      .from('articles')
      .update({
        status:'draft',
        published_at:null,
        saved_at:now()
      })
      .eq('id',id);

    if(expectedVersion!=null){
      q=q.eq(
        'version',
        expectedVersion
      );
    }

    const {data,error}=await q
      .select('*');

    if(error){
      throw error;
    }

    if(!data?.length){
      throw new Error(
        'VERSION_CONFLICT'
      );
    }

    return normalize(
      data[0],
      await getSource(id)
    );
  }

  async function softDelete(
    id,
    expectedVersion
  ){
    await requireOwner();

    let q=client
      .from('articles')
      .update({
        status:'deleted'
      })
      .eq('id',id);

    if(expectedVersion!=null){
      q=q.eq(
        'version',
        expectedVersion
      );
    }

    const {data,error}=await q
      .select('*');

    if(error){
      throw error;
    }

    if(!data?.length){
      throw new Error(
        'VERSION_CONFLICT'
      );
    }

    return normalize(
      data[0],
      await getSource(id)
    );
  }

  async function restore(
    id,
    expectedVersion
  ){
    await requireOwner();

    const {
      data:current,
      error:e0
    }=await client
      .from('articles')
      .select(
        'previous_status,version'
      )
      .eq('id',id)
      .single();

    if(e0){
      throw e0;
    }

    const status=
      current.previous_status==='published'
        ?'published'
        :'draft';

    let q=client
      .from('articles')
      .update({status})
      .eq('id',id);

    if(expectedVersion!=null){
      q=q.eq(
        'version',
        expectedVersion
      );
    }

    const {data,error}=await q
      .select('*');

    if(error){
      throw error;
    }

    if(!data?.length){
      throw new Error(
        'VERSION_CONFLICT'
      );
    }

    return normalize(
      data[0],
      await getSource(id)
    );
  }

  async function permanentDelete(id){
    await requireRecentMfa(600);

    const {data,error}=await client.rpc(
      'jb_owner_permanent_delete_article',
      {p_article_id:id}
    );

    if(error){
      throw error;
    }

    if(data!==true){
      throw new Error('PERMANENT_DELETE_NOT_CONFIRMED');
    }

    return true;
  }

  function saveShadow(item){
    localStorage.setItem(
      SHADOW,
      JSON.stringify({
        item,
        savedAt:now()
      })
    );
  }

  function getShadow(){
    try{
      return JSON.parse(
        localStorage.getItem(SHADOW)
        ||'null'
      );
    }catch(e){
      return null;
    }
  }

  function clearShadow(){
    localStorage.removeItem(SHADOW);
  }

    async function uploadPublic(file){
    await requireOwner();

    const ext=(
      file.name.split('.').pop()
      ||'bin'
    ).toLowerCase();

    const path=
      `articles/${Date.now()}-${
        crypto.randomUUID
          ?crypto.randomUUID()
          :Math.random()
            .toString(36)
            .slice(2)
      }.${ext}`;

    const {error}=await client
      .storage
      .from('public-media')
      .upload(
        path,
        file,
        {upsert:false}
      );

    if(error){
      throw error;
    }

    return client
      .storage
      .from('public-media')
      .getPublicUrl(path)
      .data
      .publicUrl;
  }

  global.JBBackend={
    client,
    esc,
    safeUrl,
    session,
    serverSessionValid,
    role,
    requireOwner,
    recentMfaInfo,
    requireRecentMfa,
    insertSecurityAudit,
    signIn,
    signOutOtherSessions,
    signOutAllSessions,
    signOut,
    changePassword,
    mfaListFactors,
    mfaEnroll,
    mfaUnenroll,
    mfaChallengeAndVerify,
    mfaAAL,
    setOwnerRecoveryKey,
    recoveryDeleteMfa,
    verifyOwnerRecoveryKey,
    ownerListSessions,
    setOwnerSessionLabel,
    ownerRevokeSession,
    ownerSecurityActivity,
    recoveryPhysicalStatus,
    confirmRecoveryPhysicalCheck,
    getArticle,
    listDrafts,
    listPublished:()=>listByStatus(
      'published'
    ),
    listTrash:()=>listByStatus(
      'deleted'
    ),
    listPublishedPublic,
    saveDraft,
    publish,
    unpublish,
    softDelete,
    restore,
    permanentDelete,
    saveShadow,
    getShadow,
    clearShadow,
    uploadPublic
  };

})(window);
