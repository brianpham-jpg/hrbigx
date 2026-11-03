/* ============================================================
   BigX HR — theme-v5.js  (giao diện v5 kiểu Haulix — mockup v3 đã duyệt 03/11/2026)
   - Sáng / tối THEO MÁY, có nút đổi tay (nhớ lựa chọn trên trình duyệt).
   - "Khoác áo" cho các tab cũ mà KHÔNG sửa file cũ: đổi màu tự động trên
     stylesheet, <style> do module chèn, style inline, thuộc tính SVG và option ECharts.
   - Gỡ file này + theme-v5.css khỏi index.html là web về y như cũ.
   ============================================================ */
(function(){
'use strict';
if(window.__bxThemeV5) return; window.__bxThemeV5=true;
var KEY='bx_theme_v5';
var mq=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
function pref(){ try{ var v=localStorage.getItem(KEY); return v==='light'||v==='dark'?v:null; }catch(e){ return null; } }
function eff(){ return pref()||(mq&&mq.matches?'dark':'light'); }
var THEME=eff();
document.documentElement.setAttribute('data-theme',THEME);
window.bxTheme=function(){ return THEME; };

/* ---------------- 1. bộ đổi màu ---------------- */
function clamp(x){ return x<0?0:x>1?1:x; }
function rgb2hsl(r,g,b){ r/=255; g/=255; b/=255; var mx=Math.max(r,g,b), mn=Math.min(r,g,b), h=0, s=0, l=(mx+mn)/2;
  if(mx!==mn){ var d=mx-mn; s=l>.5?d/(2-mx-mn):d/(mx+mn);
    h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; } return [h,s,l]; }
function hsl2rgb(h,s,l){ h=((h%360)+360)%360/360; function f(p,q,t){ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; }
  if(s===0){ var v=Math.round(l*255); return [v,v,v]; } var q=l<.5?l*(1+s):l+s-l*s, p=2*l-q;
  return [Math.round(f(p,q,h+1/3)*255),Math.round(f(p,q,h)*255),Math.round(f(p,q,h-1/3)*255)]; }
function hex(c){ return '#'+c.map(function(v){ return ('0'+Math.max(0,Math.min(255,v)).toString(16)).slice(-2); }).join(''); }
function parse(tok){
  var m; tok=tok.trim();
  if(tok[0]==='#'){ var h=tok.slice(1); if(h.length===3||h.length===4) h=h.split('').map(function(c){return c+c;}).join('');
    if(h.length!==6&&h.length!==8) return null; return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),h.length===8?parseInt(h.slice(6,8),16)/255:1]; }
  if((m=tok.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/i))){
    var a=m[4]==null?1:(/%$/.test(m[4])?parseFloat(m[4])/100:parseFloat(m[4])); return [+m[1],+m[2],+m[3],a]; }
  if(/^white$/i.test(tok)) return [255,255,255,1]; if(/^black$/i.test(tok)) return [0,0,0,1];
  return null;
}
function out(c,a){ return a>=.999?hex(c):'rgba('+c[0]+','+c[1]+','+c[2]+','+(Math.round(a*1000)/1000)+')'; }
/* bảng màu đích */
var P={
  dark:{acc:[220,242,124],accInk:[220,242,124],ok:[134,212,159],okD:[62,122,87],high:[241,181,74],crit:[240,103,92],norm:[98,174,234]},
  light:{acc:[141,179,58],accInk:[95,138,14],ok:[46,129,82],okD:[46,129,82],high:[176,120,16],crit:[200,64,47],norm:[42,114,181]}
};
/* role: bg | fg | line | shadow */
var CACHE={};
function mapColor(tok,role){
  var k=THEME+'|'+role+'|'+tok; if(CACHE[k]!==undefined) return CACHE[k];
  var c=parse(tok); if(!c){ CACHE[k]=tok; return tok; }
  var a=c[3], hs=rgb2hsl(c[0],c[1],c[2]), h=hs[0], s=hs[1], l=hs[2], T=P[THEME], res;
  var isBW=(c[0]===c[1]&&c[1]===c[2]);
  if(role==='shadow' || (isBW && l<0.02 && a<1)){ res=out([0,0,0],THEME==='light'?a*.35:a); }
  else if(s<0.4 || (l<0.26 && s<0.62)){ // trung tính (nền navy, chữ xám xanh) → xám trung tính
    var L;
    if(THEME==='dark'){ L=l<0.3?l*0.8:l>0.85?l:l*0.86; res=out(hsl2rgb(240,0.03,clamp(L)),a); }
    else{
      if(isBW&&l>0.98&&a<1){ res=out([0,0,0],a); }                       // lớp phủ trắng trong suốt → phủ đen nhạt
      else if(l<=0.10) L=role==='fg'?0.08:0.925;
      else if(l<=0.155) L=role==='fg'?0.10:1;
      else if(l<=0.19) L=role==='fg'?0.12:0.965;
      else if(l<=0.30) L=role==='fg'?0.30:0.875;
      else if(l<=0.45) L=role==='fg'?0.34:0.80;
      else if(l<=0.62) L=0.46;
      else if(l<=0.80) L=0.40;
      else if(l<=0.88) L=0.26;
      else L=role==='bg'&&!(a<1)?0.985:0.09;
      if(res===undefined) res=out(hsl2rgb(240,0.025,L),a);
    }
  }
  else if(h>=236&&h<=295){ res=out(role==='bg'?T.acc:T.accInk,a); }    // tím (màu nhấn cũ) → xanh chanh
  else if(h>=140&&h<200){ res=out(l<0.42&&role==='bg'?T.okD:T.ok,a); } // xanh ngọc → xanh lá
  else if(h>=200&&h<236){ res=out(T.norm,a); }                          // xanh dương
  else if(h>=20&&h<70){ res=out(T.high,a); }                            // vàng / cam
  else if(h<20||h>=330){ res=out(T.crit,a); }                           // đỏ
  else res=tok;
  CACHE[k]=res; return res;
}
var TOK=/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;
function mapStr(str,role){ return String(str).replace(TOK,function(t){ return mapColor(t,role); }); }
function roleOf(prop){ prop=String(prop).toLowerCase();
  if(/shadow/.test(prop)) return 'shadow';
  if(/background|^fill$|stop-color|flood-color|accent-color/.test(prop)) return 'bg';
  if(/border|outline|stroke|column-rule/.test(prop)) return 'line';
  return 'fg'; }

/* ---------------- 2. stylesheet + <style> ---------------- */
var OFF='[style*="-30000px"],[style*="-20000px"]'; // khung dựng PDF/ảnh ngoài màn hình (Báo cáo) → giữ nguyên màu in
function skipSheet(ss){ var n=ss.ownerNode; return !n || (n.id&&/^bx-v5/.test(n.id)) || (n.getAttribute&&n.getAttribute('data-bx-v5')!=null) || (n.closest&&!!n.closest(OFF)); }
function walk(rules){
  for(var i=0;i<rules.length;i++){ var r=rules[i];
    if(r.type===4){ if(/print/.test(r.media&&r.media.mediaText||'')) continue; walk(r.cssRules); continue; }
    if(r.type===12||r.type===3){ try{ walk(r.cssRules); }catch(e){} continue; }
    if(r.type!==1||!r.style) continue;
    var st=r.style;
    if(!r.__bxo){ var o=[]; for(var j=0;j<st.length;j++){ var p=st[j]; if(p.indexOf('--')===0) continue; var v=st.getPropertyValue(p); if(TOK.test(v)){ o.push([p,v,st.getPropertyPriority(p)]); } TOK.lastIndex=0; } r.__bxo=o; }
    r.__bxo.forEach(function(x){ st.setProperty(x[0],mapStr(x[1],roleOf(x[0])),x[2]); });
  }
}
function doSheets(){ [].forEach.call(document.styleSheets,function(ss){ if(skipSheet(ss)) return; try{ walk(ss.cssRules); }catch(e){} }); }

/* ---------------- 3. style inline + thuộc tính SVG ---------------- */
var ATTRS=['fill','stroke','stop-color','flood-color','color'];
function skipEl(el){ return el.closest && el.closest('.v5,[_echarts_instance_],#bx-v5-skip,'+OFF); }
function doEl(el,prev){
  if(el.nodeType!==1||skipEl(el)) return;
  if(!el.__bxo){ var o={s:[],a:[]}, st=el.style;
    if(st&&st.length){ for(var j=0;j<st.length;j++){ var p=st[j]; if(p.indexOf('--')===0) continue; var v=st.getPropertyValue(p); if(TOK.test(v)) o.s.push([p,v,st.getPropertyPriority(p)]); TOK.lastIndex=0; } }
    for(var k=0;k<ATTRS.length;k++){ var av=el.getAttribute(ATTRS[k]); if(av&&TOK.test(av)) o.a.push([ATTRS[k],av]); TOK.lastIndex=0; }
    if(prev){ // giá trị hiện tại = đúng màu mình đã đổi trước đó → giữ màu gốc cũ
      o.s.forEach(function(x){ prev.s.forEach(function(y){ if(y[0]===x[0]&&y[3]===x[1]) x[1]=y[1]; }); });
      o.a.forEach(function(x){ prev.a.forEach(function(y){ if(y[0]===x[0]&&y[2]===x[1]) x[1]=y[1]; }); }); }
    el.__bxo=o; }
  var b=el.__bxo; if(!b.s.length&&!b.a.length) return;
  b.s.forEach(function(x){ el.style.setProperty(x[0],mapStr(x[1],roleOf(x[0])),x[2]); x[3]=el.style.getPropertyValue(x[0]); });
  b.a.forEach(function(x){ el.setAttribute(x[0],mapStr(x[1],x[0]==='color'?'fg':roleOf(x[0]))); x[2]=el.getAttribute(x[0]); });
  el.__bxLast=sig(el);
}
function sig(el){ return (el.getAttribute('style')||'')+'|'+(el.getAttribute('fill')||'')+'|'+(el.getAttribute('stroke')||''); }
function doTree(root){ if(!root||root.nodeType!==1) return; doEl(root); var all=root.getElementsByTagName('*'); for(var i=0;i<all.length;i++) doEl(all[i]); }

/* ---------------- 4. ECharts ---------------- */
var FGK=/label|textStyle|axisLabel|title|legend|nameTextStyle|subtextStyle|axisName|detail/;
function mapOpt(o,path,seen){ // seen = {k:[gốc], v:[đã đổi]}
  if(o==null) return o; var t=typeof o;
  if(t==='string'){ var key=path[path.length-1]||'';
    if(!TOK.test(o)){ TOK.lastIndex=0; return o; } TOK.lastIndex=0;
    if(key==='extraCssText') return o.replace(/([a-z-]+)\s*:\s*([^;]+)/gi,function(m,p,v){ return p+':'+mapStr(v,roleOf(p)); });
    var role=/shadowColor/.test(key)?'shadow':/borderColor/.test(key)?'line':key==='backgroundColor'?'bg':
      (key==='color'||key==='textBorderColor')&&path.some(function(p){return FGK.test(p);})?'fg':
      path.some(function(p){return /lineStyle|splitLine|axisLine|axisTick/.test(p);})?'line':'bg';
    return mapStr(o,role); }
  if(t==='function'){ if(path[path.length-1]==='formatter'){ return function(){ var r=o.apply(this,arguments); return typeof r==='string'?mapHtml(r):r; }; } return o; }
  if(t!=='object') return o;
  var si=seen.k.indexOf(o); if(si>=0) return seen.v[si];
  if(o.image||o.nodeType||o instanceof Date) return o;
  if(o.colorStops){ var g={}; for(var kk in o) g[kk]=o[kk]; g.colorStops=o.colorStops.map(function(cs){ var c2={}; for(var q in cs) c2[q]=cs[q]; c2.color=mapStr(cs.color,'bg'); return c2; }); seen.k.push(o); seen.v.push(g); return g; }
  var r=Array.isArray(o)?[]:{}; seen.k.push(o); seen.v.push(r);
  if(Array.isArray(o)){ for(var i=0;i<o.length;i++) r[i]=mapOpt(o[i],path.concat(path[path.length-1]||''),seen); return r; }
  for(var k in o){ if(Object.prototype.hasOwnProperty.call(o,k)) r[k]=mapOpt(o[k],path.concat(k),seen); } return r;
}
function mapHtml(s){ return String(s).replace(/style\s*=\s*(["'])(.*?)\1/gi,function(m,q,body){ return 'style='+q+body.replace(/([a-z-]+)\s*:\s*([^;]+)/gi,function(mm,p,v){ return p+':'+mapStr(v,roleOf(p)); })+q; }); }
function patchECharts(){
  var ec=window.echarts; if(!ec||ec.__bxv5) return; ec.__bxv5=true;
  var init=ec.init;
  ec.init=function(dom){ var inst=init.apply(this,arguments);
    if(dom&&dom.closest&&dom.closest(OFF)) return inst; // chart dựng ảnh cho PDF → giữ màu in
    if(!inst.__bxv5){ inst.__bxv5=true; var so=inst.setOption;
      inst.setOption=function(opt){ var a=[].slice.call(arguments); try{ a[0]=mapOpt(opt,[],{k:[],v:[]}); }catch(e){} return so.apply(this,a); }; }
    return inst; };
}

/* ---------------- 5. theo dõi DOM ---------------- */
var mo=new MutationObserver(function(list){
  for(var i=0;i<list.length;i++){ var m=list[i]; try{
    if(m.type==='childList'){ for(var j=0;j<m.addedNodes.length;j++){ var n=m.addedNodes[j];
      if(n.nodeType!==1) continue;
      if(n.tagName==='STYLE'||(n.tagName==='LINK'&&/stylesheet/i.test(n.rel))){ setTimeout(doSheets,0); if(n.tagName==='LINK') n.addEventListener('load',doSheets); continue; }
      doTree(n); } }
    else if(m.type==='attributes'){ var el=m.target; if(el.__bxLast!==undefined&&el.__bxLast===sig(el)) continue; var pv=el.__bxo; el.__bxo=null; el.__bxLast=undefined; doEl(el,pv); }
  }catch(e){ if(window.console) console.warn('[bx-v5]',e); } }
});
function start(){
  patchECharts(); doSheets(); doTree(document.body);
  mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','fill','stroke']});
  addToggle();
}

/* ---------------- 6. đổi sáng / tối ---------------- */
function setTheme(t,save){
  if(save){ try{ localStorage.setItem(KEY,t); }catch(e){} }
  if(t===THEME) return; THEME=t; document.documentElement.setAttribute('data-theme',t);
  doSheets(); doTree(document.body); markToggle();
  try{ if(window.currentTab && typeof window.go==='function' && window.HR && HR.loaded && !dirty()) window.go(window.currentTab); }catch(e){}
}
/* ô nhập trong trang đã có dữ liệu người dùng gõ / chọn file → không vẽ lại (tránh mất dữ liệu đang nhập) */
function dirty(){ var c=document.getElementById('content'); if(!c) return false;
  return [].some.call(c.querySelectorAll('input,textarea,select'),function(f){
    if(f.type==='file') return !!(f.files&&f.files.length);
    if(f.type==='checkbox'||f.type==='radio') return f.checked!==f.defaultChecked;
    if(f.tagName==='SELECT') return [].some.call(f.options,function(o){ return o.selected!==o.defaultSelected; });
    if(f.type==='hidden'||f.type==='button'||f.type==='submit') return false;
    return f.value!==f.defaultValue; }); }
window.bxSetTheme=function(t){ setTheme(t,true); };
if(mq){ var onMq=function(){ if(!pref()) setTheme(mq.matches?'dark':'light',false); };
  if(mq.addEventListener) mq.addEventListener('change',onMq); else if(mq.addListener) mq.addListener(onMq); }
var SUN='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
var MOON='<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"/></svg>';
function markToggle(){ var b=document.getElementById('bx-v5-theme'); if(!b) return;
  b.innerHTML=(THEME==='dark'?SUN:MOON)+'<span>'+(THEME==='dark'?'Sáng':'Tối')+'</span>';
  b.title=(pref()?'Đang chọn tay: ':'Đang theo máy: ')+(THEME==='dark'?'tối':'sáng')+' · bấm để đổi'; }
function addToggle(){
  var host=document.querySelector('.topbar .tb-right'); if(!host||document.getElementById('bx-v5-theme')) return;
  var b=document.createElement('button'); b.id='bx-v5-theme'; b.type='button'; b.className='bx5-theme';
  b.setAttribute('aria-label','Đổi giao diện sáng / tối');
  b.addEventListener('click',function(){ setTheme(THEME==='dark'?'light':'dark',true); });
  host.insertBefore(b,host.firstChild); markToggle();
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
if(!window.echarts){ var tries=0, t=setInterval(function(){ if(window.echarts||++tries>100){ clearInterval(t); patchECharts(); } },50); }
})();
