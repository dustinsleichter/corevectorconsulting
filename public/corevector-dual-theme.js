/* CoreVector: non-destructive dual-brand treatment. No dependency on React internals. */
(() => {
  'use strict';
  if (window.__corevectorDualThemeLoaded) return;
  window.__corevectorDualThemeLoaded = true;

  const key = 'corevector-preferred-theme';
  const themeAttr = 'data-cv-theme';
  const nextLogo = '/corevector-brand-next.webp';
  const nextFavicon = '/favicon-next.png';
  const originalLogoPattern = /(?:^|\/)corevector-brand\.webp(?:\?|$)/i;
  const oldFav = document.querySelector('link[rel~="icon"]');
  const originalFavicon = oldFav?.getAttribute('href') || '/favicon.png';
  let theme = 'original';
  let domObserver;
  let pending = false;

  const exact = new Map(Object.entries({
    '#ce1298':'#36dfff','#f34d73':'#5680ff','#ff7939':'#af64ff',
    '#090812':'#070b16','#090713':'#070c19','#0d0917':'#081124',
    '#f34d73ff':'#5680ffff'
  }));
  const clamp = (n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const hue = (r,g,b) => {
    r/=255;g/=255;b/=255;
    const hi=Math.max(r,g,b), lo=Math.min(r,g,b), delta=hi-lo;
    if(!delta)return {h:0,s:0,l:hi};
    let h=hi===r?((g-b)/delta)%6:hi===g?(b-r)/delta+2:(r-g)/delta+4;
    h=(h*60+360)%360;
    const l=(hi+lo)/2, s=delta/(1-Math.abs(2*l-1));
    return {h,s,l};
  };
  const circleDiff=(a,b)=>Math.abs(((a-b+540)%360)-180);
  function remap(r,g,b) {
    const {h,s,l}=hue(r,g,b), max=Math.max(r,g,b), min=Math.min(r,g,b);
    if (max<10 || s<.16 || l>.87) return [r,g,b]; // preserve black, white and neutrals
    if (max<91 && l<.23) { // warm dark UI -> midnight blue UI
      return [clamp(Math.round(r*.56),0,255),clamp(Math.round(g*.82+2),0,255),clamp(Math.round(Math.max(b,r*.66,g*.9)*1.18+6),0,255)];
    }
    if (s<.24) return [r,g,b];
    const sourceHues=[316,346,19], targets=[[54,223,255],[86,128,255],[175,100,255]];
    let i=0;
    for(let j=1;j<3;j++)if(circleDiff(h,sourceHues[j])<circleDiff(h,sourceHues[i]))i=j;
    // Tone-preserving blend keeps highlights, muted accents and shadows looking natural.
    const t=targets[i];
    const energy=clamp((s-.2)/.6,.45,1);
    const shade=clamp(.52+l*.92,.42,1.34);
    return t.map((v,k)=>clamp(Math.round((v*energy+(k===2?100:120)*(1-energy))*shade),0,255));
  }
  function hexRgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
  function toHex(rgb){return '#'+rgb.map(v=>clamp(v,0,255).toString(16).padStart(2,'0')).join('');}
  function remapHex(raw) {
    const val=raw.toLowerCase();
    if(exact.has(val))return exact.get(val);
    let h=val;
    if(h.length===4||h.length===5)h='#'+[...h.slice(1)].map(c=>c+c).join('');
    if(h.length!==7&&h.length!==9)return raw;
    const orig=h.slice(0,7), mapped=exact.get(orig)||toHex(remap(...hexRgb(orig)));
    return mapped+(h.length===9?h.slice(7):'');
  }
  function convertColors(value) {
    let v=value.replace(/#[0-9a-fA-F]{3,8}\b/g, remapHex);
    v=v.replace(/\brgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(\s*,\s*(?:\d*\.)?\d+)?\s*\)/gi,(str,a,b,c,alpha)=>{
      const triplet=remap(+a,+b,+c).join(', ');
      return (alpha?`rgba(${triplet}${alpha})`:`rgb(${triplet})`);
    });
    return v;
  }
  function scopeSelector(selector){
    return selector.split(',').map(part=>{
      const s=part.trim();
      if(/^:root\b/i.test(s))return s.replace(/^:root/i,'html['+themeAttr+'="next"]');
      if(/^html\b/i.test(s))return s.replace(/^html/i,'html['+themeAttr+'="next"]');
      return 'html['+themeAttr+'="next"] '+s;
    }).join(', ');
  }
  function transformSheetRules(rules) {
    let out='';
    for(const rule of rules){
      // STYLE_RULE
      if(rule.type===1 && rule.selectorText && rule.style){
        if(rule.selectorText.includes('#cv-theme-switcher'))continue;
        const declarations=[];
        for(let i=0;i<rule.style.length;i++){
          const prop=rule.style[i], value=rule.style.getPropertyValue(prop);
          if(!/(?:color|background|border|shadow|fill|stroke|outline|gradient|\-\-)/i.test(prop) && !/#[0-9a-f]{3,8}|\brgba?\(/i.test(value))continue;
          const changed=convertColors(value);
          if(changed!==value)declarations.push(prop+':'+changed+(rule.style.getPropertyPriority(prop)?' !important':'')+';');
        }
        if(declarations.length)out+=scopeSelector(rule.selectorText)+'{'+declarations.join('')+'}\n';
      } else if(rule.cssRules){
        const inner=transformSheetRules(rule.cssRules);
        if(inner){
          if(rule.conditionText)out+='@media '+rule.conditionText+'{'+inner+'}\n';
          else if(rule.name&&rule.cssText.startsWith('@layer'))out+='@layer '+rule.name+'{'+inner+'}\n';
          else out+=inner;
        }
      }
    }
    return out;
  }
  function makeColorOverrides(){
    const id='cv-generated-next-color-overrides';
    if(document.getElementById(id))return;
    let css='';
    for(const sheet of Array.from(document.styleSheets)){
      if(sheet.href && sheet.href.includes('corevector-dual-theme'))continue;
      try { css+=transformSheetRules(sheet.cssRules||[]); } catch(_) { /* skip cross-origin CSS */ }
    }
    const style=document.createElement('style');style.id=id;
    style.textContent='/* Scoped color overrides for original CSS */\n'+css;
    document.head.appendChild(style);
  }
  function swapBrandImages(){
    document.querySelectorAll('img').forEach(img=>{
      if(img.closest('#cv-theme-switcher'))return;
      const current=img.getAttribute('src')||'';
      if(originalLogoPattern.test(current))img.dataset.cvOriginalLogo=current;
      if(!img.dataset.cvOriginalLogo)return;
      const wanted=theme==='next'?nextLogo:img.dataset.cvOriginalLogo;
      if(current!==wanted)img.setAttribute('src',wanted);
    });
    let fav=document.querySelector('link[rel~="icon"]');
    if(!fav){fav=document.createElement('link');fav.rel='icon';document.head.appendChild(fav);}
    const wanted=theme==='next'?nextFavicon:originalFavicon;
    if(fav.getAttribute('href')!==wanted)fav.setAttribute('href',wanted);
  }
  function themePicker(){
    if(document.getElementById('cv-theme-switcher'))return;
    const picker=document.createElement('div');
    picker.id='cv-theme-switcher';picker.role='group';
    picker.setAttribute('aria-label','CoreVector website appearance');
    [['original','Original'],['next','Next-Gen ✦']].forEach(([id,label])=>{
      const btn=document.createElement('button');btn.type='button';btn.textContent=label;
      btn.dataset.cvThemeChoice=id;
      btn.addEventListener('click',()=>setTheme(id));
      picker.appendChild(btn);
    });
    document.body.appendChild(picker);
  }
  function refreshControls(){
    document.querySelectorAll('#cv-theme-switcher button').forEach(btn=>{
      btn.setAttribute('aria-pressed',String(btn.dataset.cvThemeChoice===theme));
    });
  }
  function setTheme(selected){
    theme=selected==='next'?'next':'original';
    document.documentElement.setAttribute(themeAttr,theme);
    try{localStorage.setItem(key,theme);}catch(_){}
    refreshControls();swapBrandImages();
  }
  function init(){
    makeColorOverrides();themePicker();
    let preferred='original';
    try{preferred=localStorage.getItem(key)||preferred;}catch(_){}
    setTheme(preferred);
    domObserver=new MutationObserver(()=>{
      if(pending)return;
      pending=true;
      requestAnimationFrame(()=>{pending=false;themePicker();refreshControls();swapBrandImages();});
    });
    domObserver.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
