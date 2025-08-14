// ==UserScript==
// @name         holy tiktok larp skript
// @namespace    http://tampermonkey.net/
// @version      2.7.0
// @description  fun fact : wish is heavily addicted to persona games and genshin impact
// @match        https://www.tiktok.com/*
// @match        https://tiktok.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const NS = 'tts_v2';
  const KEYS = {
    enabled: `${NS}:enabled`, realUser: `${NS}:realUser`, realName: `${NS}:realName`,
    fakeUser: `${NS}:fakeUser`, fakeName: `${NS}:fakeName`, enUser: `${NS}:enUser`, enName: `${NS}:enName`, enBadge: `${NS}:enBadge`, lockUser: `${NS}:lockUser`,
    fakeFollowing: `${NS}:fakeFollowing`, fakeFollowers: `${NS}:fakeFollowers`, fakeLikes: `${NS}:fakeLikes`,
    enFollowing: `${NS}:enFollowing`, enFollowers: `${NS}:enFollowers`, enLikes: `${NS}:enLikes`,
    realFollowingRaw: `${NS}:realFollowingRaw`, realFollowersRaw: `${NS}:realFollowersRaw`, realLikesRaw: `${NS}:realLikesRaw`,
    realFollowingText: `${NS}:realFollowingText`, realFollowersText: `${NS}:realFollowersText`, realLikesText: `${NS}:realLikesText`,
  };

  const getStr=(k,d='')=>{try{const v=localStorage.getItem(k);return v===null?d:v;}catch{return d;}};
  const getBool=(k,d=false)=>{const v=getStr(k,null);if(v===null)return d;return v==='true';};
  const set=(k,v)=>{try{localStorage.setItem(k,String(v));}catch{}};

  const state = {
    enabled: getBool(KEYS.enabled, true),
    realUser: getStr(KEYS.realUser, ''),
    realName: getStr(KEYS.realName, ''),
    fakeUser: getStr(KEYS.fakeUser, ''),
    fakeName: getStr(KEYS.fakeName, ''),
    enUser: getBool(KEYS.enUser, true),
    enName: getBool(KEYS.enName, true),
    enBadge: getBool(KEYS.enBadge, false),
    fakeFollowing: +getStr(KEYS.fakeFollowing, '') || 0,
    fakeFollowers: +getStr(KEYS.fakeFollowers, '') || 0,
    fakeLikes: +getStr(KEYS.fakeLikes, '') || 0,
    enFollowing: getBool(KEYS.enFollowing, false),
    enFollowers: getBool(KEYS.enFollowers, false),
    enLikes: getBool(KEYS.enLikes, false),
    realFollowingRaw: +getStr(KEYS.realFollowingRaw, '') || 0,
    realFollowersRaw: +getStr(KEYS.realFollowersRaw, '') || 0,
    realLikesRaw: +getStr(KEYS.realLikesRaw, '') || 0,
    realFollowingText: getStr(KEYS.realFollowingText, ''),
    realFollowersText: getStr(KEYS.realFollowersText, ''),
    realLikesText: getStr(KEYS.realLikesText, ''),
    lockUser: getStr(KEYS.lockUser, ''),
  };

  const SELECTORS = {
    userH1: 'h1[data-e2e="user-title"]',
    nameH2: 'h2[data-e2e="user-subtitle"]',
    followingStrong: 'strong[data-e2e="following-count"]',
    followersStrong: 'strong[data-e2e="followers-count"]',
    likesStrong: 'strong[data-e2e="likes-count"]',
    nativeBadge: '[data-e2e="user-verified"] svg, svg[aria-label*="Verified" i]',

    editUserInput: 'input[placeholder="Username"]',
    editUserLink: 'p[data-e2e="edit-profile-username-link"]',
    editNameInput: 'input[placeholder="Name"]',
  };

  const BADGE_SVG = `
<svg data-tts-badge="1" width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-left:6px;">
  <circle cx="24" cy="24" r="24" fill="#20D5EC"></circle>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M37.1213 15.8787C38.2929 17.0503 38.2929 18.9497 37.1213 20.1213L23.6213 33.6213C22.4497 34.7929 20.5503 34.7929 19.3787 33.6213L10.8787 25.1213C9.70711 23.9497 9.70711 22.0503 10.8787 20.8787C12.0503 19.7071 13.9497 19.7071 15.1213 20.8787L21.5 27.2574L32.8787 15.8787C34.0503 14.7071 35.9497 14.7071 37.1213 15.8787Z" fill="white"></path>
</svg>`.trim();

  const waitForBody=(cb)=>{ if(document.body) return cb(); const obs=new MutationObserver(()=>{ if(document.body){ obs.disconnect(); cb(); } }); obs.observe(document.documentElement,{childList:true,subtree:true}); };
  const currentProfileUserFromURL=()=>{ try{ const m=location.pathname.match(/\/@([^\/?#]+)/i); return m?decodeURIComponent(m[1]):''; }catch{ return ''; } };
  const isOnOwnProfile=()=>{ const u=currentProfileUserFromURL(); if(!u) return false; const realU=(state.realUser||'').trim().toLowerCase(); return !!realU && u.toLowerCase()===realU; };
  const parseCountToNumber=(str)=>{ if(!str) return 0; let s=String(str).trim().replace(/,/g,''); const m=s.match(/^(\d+(?:\.\d+)?)([KkMmBb])?$/); if(m){ let num=parseFloat(m[1]); if(m[2]){ const suf=m[2].toLowerCase(); if(suf==='k') num*=1e3; else if(suf==='m') num*=1e6; else if(suf==='b') num*=1e9; } return Math.round(num); } const digits=s.replace(/[^\d]/g,''); return digits?parseInt(digits,10):0; };
  const formatCount=(n)=>{ n=Number(n)||0; if(n>=1e9) return (n/1e9).toFixed(n%1e9===0?0:1).replace(/\.0$/,'')+'B'; if(n>=1e6) return (n/1e6).toFixed(n%1e6===0?0:1).replace(/\.0$/,'')+'M'; if(n>=1e3) return (n/1e3).toFixed(n%1e3===0?0:1).replace(/\.0$/,'')+'K'; return String(n); };
  const safeSetText=(el,text)=>{ if(el && typeof text==='string' && el.textContent!==text) el.textContent=text; };
  const dispatchReactInput=(el)=>{ try{ el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); }catch{} };

  function isVisible(el){ if(!el) return false; if(el.offsetParent!==null) return true; const cs=getComputedStyle(el); return cs && cs.visibility!=='hidden' && cs.display!=='none' && +cs.opacity>0; }
  function ensureSingleBadge(){
    if(!isOnOwnProfile()) return;
    const h1=document.querySelector(SELECTORS.userH1);
    if(!h1) return;
    const existingOur=document.querySelector('svg[data-tts-badge="1"]');
    const native=document.querySelector(SELECTORS.nativeBadge);
    const hasNative=isVisible(native);
    if(state.enBadge && state.enabled){
      if(hasNative){ if(existingOur) existingOur.remove(); return; }
      if(!existingOur){ const temp=document.createElement('div'); temp.innerHTML=BADGE_SVG; h1.insertAdjacentElement('afterend', temp.firstElementChild); }
    } else {
      if(existingOur) existingOur.remove();
    }
  }

  function detectAndCacheRealCountsIfNeeded(){
    if(!isOnOwnProfile()) return;
    const fEl=document.querySelector(SELECTORS.followingStrong);
    const rEl=document.querySelector(SELECTORS.followersStrong);
    const lEl=document.querySelector(SELECTORS.likesStrong);
    const urlUser=currentProfileUserFromURL();
    if(urlUser && state.lockUser.toLowerCase()!==urlUser.toLowerCase()){
      if(fEl){ state.realFollowingText=fEl.textContent.trim(); state.realFollowingRaw=parseCountToNumber(state.realFollowingText); }
      if(rEl){ state.realFollowersText=rEl.textContent.trim(); state.realFollowersRaw=parseCountToNumber(state.realFollowersText); }
      if(lEl){ state.realLikesText=lEl.textContent.trim(); state.realLikesRaw=parseCountToNumber(state.realLikesText); }
      set(KEYS.realFollowingText,state.realFollowingText); set(KEYS.realFollowersText,state.realFollowersText); set(KEYS.realLikesText,state.realLikesText);
      set(KEYS.realFollowingRaw,state.realFollowingRaw); set(KEYS.realFollowersRaw,state.realFollowersRaw); set(KEYS.realLikesRaw,state.realLikesRaw);
      state.lockUser=urlUser; set(KEYS.lockUser,urlUser);
      return;
    }
    if(fEl && !state.realFollowingText){ state.realFollowingText=fEl.textContent.trim(); state.realFollowingRaw=parseCountToNumber(state.realFollowingText); set(KEYS.realFollowingText,state.realFollowingText); set(KEYS.realFollowingRaw,state.realFollowingRaw); }
    if(rEl && !state.realFollowersText){ state.realFollowersText=rEl.textContent.trim(); state.realFollowersRaw=parseCountToNumber(state.realFollowersText); set(KEYS.realFollowersText,state.realFollowersText); set(KEYS.realFollowersRaw,state.realFollowersRaw); }
    if(lEl && !state.realLikesText){ state.realLikesText=lEl.textContent.trim(); state.realLikesRaw=parseCountToNumber(state.realLikesText); set(KEYS.realLikesText,state.realLikesText); set(KEYS.realLikesRaw,state.realLikesRaw); }
  }

  function applyCounts(){
    if(!isOnOwnProfile()) return;
    const fEl=document.querySelector(SELECTORS.followingStrong);
    const rEl=document.querySelector(SELECTORS.followersStrong);
    const lEl=document.querySelector(SELECTORS.likesStrong);
    if(fEl){ const text=(state.enabled && state.enFollowing)?formatCount(state.fakeFollowing):(state.realFollowingText||formatCount(state.realFollowingRaw)); safeSetText(fEl,text); }
    if(rEl){ const text=(state.enabled && state.enFollowers)?formatCount(state.fakeFollowers):(state.realFollowersText||formatCount(state.realFollowersRaw)); safeSetText(rEl,text); }
    if(lEl){ const text=(state.enabled && state.enLikes)?formatCount(state.fakeLikes):(state.realLikesText||formatCount(state.realLikesRaw)); safeSetText(lEl,text); }
  }

  function syncTitle(){
    if(!isOnOwnProfile()) return;
    const useUser=(state.enabled && state.enUser && state.fakeUser)?state.fakeUser:state.realUser;
    const useName=(state.enabled && state.enName && state.fakeName)?state.fakeName:state.realName;
    if(!useUser && !useName) return;
    const userFmt=(useUser||'').replace(/^@/,'');
    const parts=[];
    if(useName) parts.push(useName);
    if(userFmt) parts.push(`(@${userFmt})`);
    const want = `${parts.join(' ')} | TikTok`.trim();
    if(document.title!==want) document.title=want;
  }

  function applyProfileSpoofs(){
    if(!isOnOwnProfile()){
      const our=document.querySelector('svg[data-tts-badge\="1\"]');
      if(our) our.remove();
      return;
    }
    const h1=document.querySelector(SELECTORS.userH1);
    const h2=document.querySelector(SELECTORS.nameH2);
    if(state.enabled){
      if(h1){ const t=(state.enUser && state.fakeUser)?state.fakeUser:state.realUser; if(t) safeSetText(h1,t); }
      if(h2){ const t=(state.enName && state.fakeName)?state.fakeName:state.realName; if(t) safeSetText(h2,t); }
      ensureSingleBadge();
    } else {
      if(h1 && state.realUser) safeSetText(h1,state.realUser);
      if(h2 && state.realName) safeSetText(h2,state.realName);
      const our=document.querySelector('svg[data-tts-badge\="1\"]');
      if(our) our.remove();
    }
  }

  function spoofEditProfile(){
    if(!state.enabled) return;

    const uInput=document.querySelector(SELECTORS.editUserInput);
    if(uInput && state.enUser && state.fakeUser){
      const cur=(uInput.value||'').trim();
      if(cur.toLowerCase()===String(state.realUser||'').trim().toLowerCase()){
        uInput.value=String(state.fakeUser).replace(/^@/,'');
        dispatchReactInput(uInput);
      }
    }

    const uLink=document.querySelector(SELECTORS.editUserLink);
    if(uLink && state.enUser && state.fakeUser){
      const expectReal = `@${String(state.realUser||'').replace(/^@/,'')}`;
      if(uLink.textContent && uLink.textContent.includes(expectReal)){
        const fakeFmt = String(state.fakeUser).replace(/^@/,'');
        uLink.textContent = `www.tiktok.com/@${fakeFmt}`;
      }
    }

    const nInput=document.querySelector(SELECTORS.editNameInput);
    if(nInput && state.enName && state.fakeName){
      const cur=(nInput.value||'').trim();
      if(cur.toLowerCase()===String(state.realName||'').trim().toLowerCase()){
        nInput.value=state.fakeName;
        dispatchReactInput(nInput);
      }
    }
  }


  function applySpoofs(){
    try{
      detectAndCacheRealCountsIfNeeded();
      applyProfileSpoofs();
      applyCounts();
      syncTitle();
      spoofEditProfile();
    }catch{}
  }


  function closeGUI(){ const b=document.getElementById('tts-backdrop'); if(b) b.remove(); }
  function openGUI(){
    closeGUI();
    const backdrop=document.createElement('div');
    backdrop.id='tts-backdrop';
    Object.assign(backdrop.style,{position:'fixed',inset:'0',background:'rgba(0,0,0,0.5)',zIndex:2147483647,display:'flex',alignItems:'center',justifyContent:'center'});

    const modal=document.createElement('div');
    Object.assign(modal.style,{background:'#0f0f0f',color:'#eaeaea',width:'min(760px, 92vw)',borderRadius:'12px',boxShadow:'0 12px 32px rgba(0,0,0,0.45)',padding:'16px',fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial'});

    const inputStyle='width:100%;box-sizing:border-box;background:#1a1a1a;color:#eaeaea;border:1px solid #2a2a2a;border-radius:8px;padding:10px;outline:none;';
    const labelStyle='display:flex;gap:8px;align-items:center;font-size:13px;opacity:.95;';
    const grid2='display:grid;grid-template-columns:1fr 1fr;gap:12px;';
    const grid3='display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;';

    modal.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <div style="font-weight:700;font-size:18px;">TikTok Spoofer</div>
        <div style="display:flex;gap:12px;align-items:center;">
          <label style="${labelStyle}"><input id="tts-enabled" type="checkbox"> Spoof enabled (Shift+U)</label>
          <button id="tts-close" style="background:transparent;border:none;color:#eaeaea;font-size:18px;cursor:pointer;">✕</button>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="${grid2}">
          <div>
            <div style="font-size:12px;margin-bottom:6px;opacity:.8;">Real username</div>
            <input id="tts-real-user" type="text" placeholder="yourusername" style="${inputStyle}">
          </div>
          <div>
            <div style="font-size:12px;margin-bottom:6px;opacity:.8;">Real display name</div>
            <input id="tts-real-name" type="text" placeholder="Your Name" style="${inputStyle}">
          </div>
        </div>
        <hr style="border:none;border-top:1px solid #272727;margin:2px 0;">
        <div style="${grid2}">
          <div>
            <label style="${labelStyle}"><input id="tts-en-user" type="checkbox"> Fake username enabled</label>
            <input id="tts-fake-user" type="text" placeholder="fakeusername" style="${inputStyle};margin-top:6px;">
          </div>
          <div>
            <label style="${labelStyle}"><input id="tts-en-name" type="checkbox"> Fake display name enabled</label>
            <input id="tts-fake-name" type="text" placeholder="Fake Name" style="${inputStyle};margin-top:6px;">
          </div>
        </div>
        <div>
          <label style="${labelStyle}"><input id="tts-en-badge" type="checkbox"> Show verified badge</label>
        </div>
        <hr style="border:none;border-top:1px solid #272727;margin:2px 0;">
        <div style="${grid3}">
          <div>
            <label style="${labelStyle}"><input id="tts-en-following" type="checkbox"> Fake Following</label>
            <input id="tts-fake-following" type="number" min="0" step="1" placeholder="0" style="${inputStyle};margin-top:6px;">
          </div>
          <div>
            <label style="${labelStyle}"><input id="tts-en-followers" type="checkbox"> Fake Followers</label>
            <input id="tts-fake-followers" type="number" min="0" step="1" placeholder="0" style="${inputStyle};margin-top:6px;">
          </div>
          <div>
            <label style="${labelStyle}"><input id="tts-en-likes" type="checkbox"> Fake Likes</label>
            <input id="tts-fake-likes" type="number" min="0" step="1" placeholder="0" style="${inputStyle};margin-top:6px;">
          </div>
        </div>
        <div id="tts-error" style="color:#ff6b6b;font-size:12px;height:16px;"></div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:6px;">
          <button id="tts-cancel" style="background:#1f1f1f;border:1px solid #2a2a2a;color:#eaeaea;border-radius:8px;padding:10px 14px;cursor:pointer;">Cancel</button>
          <button id="tts-save" style="background:#2b8a3e;border:0;color:white;border-radius:8px;padding:10px 14px;cursor:pointer;">Save</button>
        </div>
      </div>`;

    backdrop.appendChild(modal); document.body.appendChild(backdrop);
    const $ = sel => modal.querySelector(sel);

    $('#tts-enabled').checked = !!state.enabled;
    $('#tts-real-user').value = (state.realUser||'').replace(/^@/,'');
    $('#tts-real-name').value = state.realName||'';
    $('#tts-en-user').checked = !!state.enUser;
    $('#tts-fake-user').value = (state.fakeUser||'').replace(/^@/,'');
    $('#tts-en-name').checked = !!state.enName;
    $('#tts-fake-name').value = state.fakeName||'';
    $('#tts-en-badge').checked = !!state.enBadge;
    $('#tts-en-following').checked = !!state.enFollowing;
    $('#tts-en-followers').checked = !!state.enFollowers;
    $('#tts-en-likes').checked = !!state.enLikes;
    $('#tts-fake-following').value = String(state.fakeFollowing || '');
    $('#tts-fake-followers').value = String(state.fakeFollowers || '');
    $('#tts-fake-likes').value = String(state.fakeLikes || '');

    const close = () => { const b=document.getElementById('tts-backdrop'); if(b) b.remove(); };
    $('#tts-close').onclick = close; $('#tts-cancel').onclick = close;

    $('#tts-save').onclick = () => {
      const err=$('#tts-error'); err.textContent='';
      const enabled=$('#tts-enabled').checked;
      const realUser=($('#tts-real-user').value||'').trim().replace(/^@/,'');
      const realName=($('#tts-real-name').value||'').trim();
      const enUser=$('#tts-en-user').checked; const fakeUser=($('#tts-fake-user').value||'').trim().replace(/^@/,'');
      const enName=$('#tts-en-name').checked; const fakeName=($('#tts-fake-name').value||'').trim();
      const enBadge=$('#tts-en-badge').checked;
      const enFollowing=$('#tts-en-following').checked; const enFollowers=$('#tts-en-followers').checked; const enLikes=$('#tts-en-likes').checked;
      const fakeFollowing=Math.max(0, parseInt($('#tts-fake-following').value||'0',10) || 0);
      const fakeFollowers=Math.max(0, parseInt($('#tts-fake-followers').value||'0',10) || 0);
      const fakeLikes=Math.max(0, parseInt($('#tts-fake-likes').value||'0',10) || 0);

      if(!realUser){ err.textContent='Real username cannot be blank.'; return; }
      if(!/^[A-Za-z0-9._-]{1,64}$/.test(realUser)){ err.textContent='Real username has invalid characters.'; return; }
      if(!realName){ err.textContent='Real display name cannot be blank.'; return; }
      if(enUser && !fakeUser){ err.textContent='Fake username cannot be blank when enabled.'; return; }
      if(enUser && fakeUser.toLowerCase()===realUser.toLowerCase()){ err.textContent='Fake username must differ from real username.'; return; }
      if(enName && !fakeName){ err.textContent='Fake display name cannot be blank when enabled.'; return; }
      if(enName && fakeName.trim().toLowerCase()===realName.trim().toLowerCase()){ err.textContent='Fake display name must differ from real.'; return; }
      if(enFollowing && !(fakeFollowing>=0)){ err.textContent='Fake Following must be a non-negative number.'; return; }
      if(enFollowers && !(fakeFollowers>=0)){ err.textContent='Fake Followers must be a non-negative number.'; return; }
      if(enLikes && !(fakeLikes>=0)){ err.textContent='Fake Likes must be a non-negative number.'; return; }

      set(KEYS.enabled,enabled); set(KEYS.realUser,realUser); set(KEYS.realName,realName);
      set(KEYS.enUser,enUser); set(KEYS.fakeUser,fakeUser); set(KEYS.enName,enName); set(KEYS.fakeName,fakeName); set(KEYS.enBadge,enBadge);
      set(KEYS.enFollowing,enFollowing); set(KEYS.enFollowers,enFollowers); set(KEYS.enLikes,enLikes);
      set(KEYS.fakeFollowing,fakeFollowing); set(KEYS.fakeFollowers,fakeFollowers); set(KEYS.fakeLikes,fakeLikes);
      set(KEYS.lockUser,realUser);

      state.enabled=enabled; state.realUser=realUser; state.realName=realName; state.enUser=enUser; state.fakeUser=fakeUser; state.enName=enName; state.fakeName=fakeName; state.enBadge=enBadge;
      state.enFollowing=enFollowing; state.enFollowers=enFollowers; state.enLikes=enLikes; state.fakeFollowing=fakeFollowing; state.fakeFollowers=fakeFollowers; state.fakeLikes=fakeLikes;

      close(); applySpoofs();
    };

    document.body.appendChild(backdrop);
  }

  document.addEventListener('keydown',(e)=>{
    if(e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey){
      const k=(e.key||'').toLowerCase();
      if(k==='s'){
        if(document.activeElement && (document.activeElement.tagName==='INPUT'||document.activeElement.tagName==='TEXTAREA'||document.activeElement.isContentEditable)) return;
        e.preventDefault(); openGUI();
      } else if(k==='u'){
        e.preventDefault(); state.enabled=!state.enabled; set(KEYS.enabled,state.enabled); applySpoofs();
      }
    }
  });


  let scheduled=false; let applying=false;
  function schedule(){ if(scheduled) return; scheduled=true; (window.requestIdleCallback||window.requestAnimationFrame)(()=>{ scheduled=false; if(applying) return; applying=true; try{ applySpoofs(); } finally { applying=false; } }); }

  const mo=new MutationObserver(()=>schedule());
  function startObserver(){ if(document.body) mo.observe(document.body,{childList:true,subtree:true}); }
  waitForBody(startObserver);

  const origPush=history.pushState; history.pushState=function(){ const r=origPush.apply(this,arguments); setTimeout(schedule,0); return r; };
  window.addEventListener('popstate', schedule);

  let lastURL = location.href;
  setInterval(()=>{
    if(location.href !== lastURL){ lastURL = location.href; schedule(); }
    const urlUser=currentProfileUserFromURL();
    if(urlUser && state.lockUser.toLowerCase()!==urlUser.toLowerCase()){
      state.lockUser=urlUser; set(KEYS.lockUser,urlUser);
      state.realFollowingText=state.realFollowersText=state.realLikesText='';
      state.realFollowingRaw=state.realFollowersRaw=state.realLikesRaw=0;
      set(KEYS.realFollowingText,''); set(KEYS.realFollowersText,''); set(KEYS.realLikesText,'');
      set(KEYS.realFollowingRaw,0); set(KEYS.realFollowersRaw,0); set(KEYS.realLikesRaw,0);
      schedule();
    }
  }, 800);

  waitForBody(schedule);
})();
