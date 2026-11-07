/* ============================================================
   BigX HR — glass-v7.js  (kính mờ + login cây đèn + chuyển động — mockup Brian duyệt 07/11/2026)
   - Login: thay GIAO DIỆN cổng #google-gate bằng cảnh cây đèn. Kiểm tra quyền vẫn là
     bxRoleOf() + Firebase Google như cũ (nhập email → Google xác nhận đúng chủ email).
   - Dashboard: nền ảnh, hoa đào, kim tuyến, logo; đổi tab thì card trồi lên lần lượt,
     số lớn đếm lên, icon kính bay vào thanh tiêu đề, màu nền đổi nhẹ theo tab.
   - KHÔNG sửa logic cũ: chỉ bọc window.go và chèn thêm phần tử.
   - Gỡ 2 dòng glass-v7.css / glass-v7.js khỏi index.html là web về y như cũ.
   ============================================================ */
(function(){
'use strict';
if(window.__bxGlassV7) return; window.__bxGlassV7=true;
var REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
var MOBILE=function(){ return innerWidth<820; };
function R(a,b){ return a+Math.random()*(b-a); }

/* ================= 1. LOGIN CÂY ĐÈN ================= */
function xSvg(c1,c2){ return '<svg viewBox="0 0 40 40"><rect x="15.5" y="1" width="9" height="38" rx="4.5" transform="rotate(45 20 20)" fill="'+c1+'" stroke="#fff" stroke-width="1.2"/><rect x="15.5" y="1" width="9" height="38" rx="4.5" transform="rotate(-45 20 20)" fill="'+c2+'" stroke="#fff" stroke-width="1.2"/></svg>'; }
function buildGate(){
  var gate=document.getElementById('google-gate'); if(!gate||gate.__bx7) return; gate.__bx7=true;
  gate.classList.add('bx7-gate');
  var X=[[7,34,-220,-60,46,.7],[21,6,-120,-200,30,1.3],[30,30,-60,180,38,1],[55,7,60,-200,52,.6],[63,33,160,160,28,1.4],[95,57,240,40,40,.9],[2,72,-220,60,34,1.2]];
  var xs=X.map(function(p,k){ return '<div class="fl" data-depth="'+p[5]+'" style="left:'+p[0]+'%;top:'+p[1]+'%"><div class="fe" style="--fx:'+p[2]+'px;--fy:'+p[3]+'px;--fr:'+(k%2?200:-200)+'deg;--d:'+(300+k*110)+'ms"><div class="fb" style="--sz:'+p[4]+'px;--bd:'+(3.2+k*.6).toFixed(1)+'s">'+(k%3===1?xSvg('#141414','#ffe037'):xSvg('#ffe037','#141414'))+'</div></div></div>'; }).join('');
  gate.innerHTML='<div class="bx7-g wait" id="bx-v5-skip">'+
    '<div class="g-photo" role="img" aria-label="Ảnh tập thể team BigX"></div><div class="g-dark"></div><div class="g-glow"></div><div class="g-beam"></div>'+
    '<div class="g-lamp" title="Bật/tắt đèn"><div class="g-wire"></div><div class="g-shade"><svg viewBox="0 0 170 70"><defs><linearGradient id="bx7sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c1d20"/><stop offset=".45" stop-color="#3b3d42"/><stop offset="1" stop-color="#17181a"/></linearGradient></defs><path d="M70 0h30l6 10c30 6 52 26 60 56H4C12 36 34 16 64 10z" fill="url(#bx7sh)"/><path d="M4 66h162" stroke="#5a5c62" stroke-width="2" stroke-linecap="round"/></svg><div class="g-bulb"></div></div></div>'+
    '<button type="button" class="g-cord" aria-label="Giật dây để bật đèn và hiện khung đăng nhập" aria-pressed="false"><i></i><b></b></button>'+
    '<div class="g-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M20 12H5M10 7l-5 5 5 5"/></svg>Giật dây đèn để đăng nhập</div>'+
    '<div class="g-xs">'+xs+'</div>'+
    '<div class="g-brand"><img src="bx7-logo.png" alt="BigX"><div><b>HR</b><small>Tuyển dụng CTV</small></div></div>'+
    '<div class="g-tag"><h2>Người BigX,<br>nơi làm việc là nhà.</h2><p>Đăng nhập để xem tuyển dụng, kho CV và báo cáo.</p></div>'+
    '<form class="g-card" novalidate autocomplete="on">'+
      '<h1>Chào mừng trở lại</h1><div class="sub">Nhập email được cấp quyền để vào dashboard</div>'+
      '<div class="g-field"><label for="bx7-em">Email</label><div class="g-inp"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg><input id="bx7-em" type="email" placeholder="ten@bigx.vn" autocomplete="email"></div></div>'+
      '<div id="google-gate-error" class="g-msg" role="status" aria-live="polite" style="display:none"></div>'+
      '<button class="g-btn" type="submit">Đăng nhập</button>'+
      '<div class="g-foot">Gặp sự cố? Liên hệ HR: brian.pham@bigx.vn</div>'+
      '<button type="button" class="g-off">Tắt đèn</button>'+
    '</form></div>';
  var g=gate.firstChild, cord=g.querySelector('.g-cord'), form=g.querySelector('.g-card'), em=g.querySelector('#bx7-em'), box=g.querySelector('.g-inp'), msg=g.querySelector('#google-gate-error');
  function toggle(){ cord.classList.add('pull'); setTimeout(function(){ cord.classList.remove('pull'); },220);
    var on=gate.classList.toggle('g7-on'); cord.setAttribute('aria-pressed',on);
    if(on) setTimeout(function(){ try{ em.focus({preventScroll:true}); }catch(e){} },900); }
  cord.addEventListener('click',toggle); g.querySelector('.g-lamp').addEventListener('click',toggle); g.querySelector('.g-off').addEventListener('click',toggle);
  function say(t,ok){ msg.textContent=t; msg.className='g-msg'+(ok?' ok':''); msg.style.display='block'; }
  form.addEventListener('submit',function(e){
    e.preventDefault(); var v=em.value.trim().toLowerCase();
    box.classList.remove('bad'); void box.offsetWidth;
    if(!v){ box.classList.add('bad'); say('Anh/chị nhập email nhé.'); em.focus(); return; }
    var role=(typeof bxRoleOf==='function')?bxRoleOf(v):null;
    if(!role){ box.classList.add('bad'); say('Email này chưa được cấp quyền truy cập. Liên hệ HR nếu cần.'); em.select(); return; }
    try{
      var p=new firebase.auth.GoogleAuthProvider(); p.setCustomParameters({prompt:'select_account',login_hint:v});
      say('Đang mở xác nhận Google cho '+v+'…',true);
      bxAuth.signInWithPopup(p).catch(function(err){ say('Đăng nhập thất bại: '+(err&&err.message?err.message:err)); });
    }catch(ex){ say('Không mở được đăng nhập Google: '+(ex&&ex.message?ex.message:ex)); }
  });
  em.addEventListener('input',function(){ box.classList.remove('bad'); });
  if(!REDUCE) g.addEventListener('mousemove',function(e){ var dx=e.clientX/innerWidth-.5, dy=e.clientY/innerHeight-.5;
    [].forEach.call(g.querySelectorAll('.g-xs .fl'),function(f){ var d=+f.getAttribute('data-depth'); f.style.transform='translate('+(-dx*40*d)+'px,'+(-dy*30*d)+'px)'; }); });
  /* tránh nháy cảnh đèn khi đã đăng nhập sẵn: chờ Firebase báo trạng thái rồi mới hiện */
  var shown=false; function reveal(){ if(!shown){ shown=true; g.classList.remove('wait'); } }
  try{ bxAuth.onAuthStateChanged(function(){ setTimeout(reveal,60); }); }catch(e){}
  setTimeout(reveal,2500);
}

/* ================= 2. NỀN + HOA ĐÀO + KIM TUYẾN + LOGO ================= */
function buildScene(){
  if(document.getElementById('bx7-bg')) return;
  var bg=document.createElement('div'); bg.id='bx7-bg'; bg.innerHTML='<div class="ph"></div><div class="tn"></div><div class="sh"></div>';
  document.body.insertBefore(bg,document.body.firstChild);
  var gl=document.createElement('div'); gl.className='bx7-glitter';
  var n=MOBILE()?45:110;
  for(var k=0;k<n;k++){ var star=Math.random()<.18, el=document.createElement(star?'b':'i'), s=star?R(8,14):R(1.5,3.5);
    el.style.cssText='left:'+R(0,100)+'%;top:'+R(0,100)+'%;width:'+s+'px;height:'+s+'px;--s:'+s+'px;--d:'+R(2.2,5).toFixed(2)+'s;--delay:'+R(0,5).toFixed(2)+'s;--o:'+R(.55,1).toFixed(2);
    if(!star&&Math.random()<.3) el.className='gold'; gl.appendChild(el); }
  var pt=document.createElement('div'); pt.className='bx7-petals';
  var m=MOBILE()?12:26;
  for(var j=0;j<m;j++){ var p=document.createElement('div'); p.className='bx7-petal';
    p.style.cssText='--x:'+R(-5,100)+'%;--dx:'+R(40,160)+'px;--d:'+R(9,18).toFixed(1)+'s;--delay:'+(-R(0,18)).toFixed(1)+'s;--s:'+R(10,18).toFixed(0)+'px;--sw:'+R(2,4).toFixed(1)+'s;--sp:'+R(3,7).toFixed(1)+'s';
    p.innerHTML='<i></i>'; pt.appendChild(p); }
  /* chỉ hiện hoa + kim tuyến sau khi đã vào web (cổng login có cảnh riêng) */
  var main=document.getElementById('main');
  (function wait(){ if(main && main.style.display!=='none'){ document.body.appendChild(gl); document.body.appendChild(pt); } else setTimeout(wait,300); })();
}
function swapLogo(){
  var lg=document.querySelector('#bx-topnav .tn-logo'); if(!lg) return false; if(lg.classList.contains('bx7-logo')) return true;
  lg.classList.add('bx7-logo'); lg.innerHTML='<img src="bx7-logo.png" alt="BigX">';
  var b=document.querySelector('#bx-topnav .tn-brand b'); if(b) b.textContent='HR';
  return true;
}

/* ================= 3. CHUYỂN ĐỘNG KHI ĐỔI TAB ================= */
var TABS={
  'overview':{hue:0,icons:['ti-chart-bar','ti-users','ti-clock','ti-calendar','ti-star']},
  'tuyen-dung':{hue:16,icons:['ti-file-description','ti-search','ti-circle-check','ti-mail','ti-user-plus']},
  'kho-cv':{hue:-12,icons:['ti-folder','ti-file-upload','ti-sparkles','ti-file-check','ti-search']},
  'ctv-koc':{hue:26,icons:['ti-user-star','ti-calendar-event','ti-video','ti-heart','ti-check']},
  'bot-tin':{hue:-26,icons:['ti-robot','ti-send','ti-clock','ti-messages','ti-chart-line']},
  'pt-tuyen-dung':{hue:10,icons:['ti-trending-up','ti-filter','ti-chart-pie','ti-target','ti-chart-bar']},
  'bao-cao':{hue:-22,icons:['ti-report','ti-printer','ti-file-text','ti-chart-line','ti-calendar']}
};
var SPOTS=[[36,10,-120,-60],[45,34,-40,90],[54,4,30,-90],[62,30,90,90],[69,8,170,-60]];
function floaters(id){
  var tb=document.querySelector('#main .topbar'); if(!tb) return;
  var box=tb.querySelector('.bx7-fls'); if(!box){ box=document.createElement('div'); box.className='bx7-fls'; tb.appendChild(box);
    if(!REDUCE) tb.parentNode.addEventListener('mousemove',function(e){ var r=tb.getBoundingClientRect(), dx=(e.clientX-r.left)/r.width-.5, dy=(e.clientY-r.top)/Math.max(r.height,200)-.5;
      [].forEach.call(box.querySelectorAll('.bx7-fl'),function(f){ var d=+f.getAttribute('data-depth'); f.style.transform='translate('+(-dx*24*d)+'px,'+(-dy*10*d)+'px)'; }); }); }
  [].forEach.call(box.querySelectorAll('.bx7-fe'),function(e){ e.classList.remove('show'); e.classList.add('gone'); });
  var old=[].slice.call(box.children); setTimeout(function(){ old.forEach(function(o){ if(o.parentNode) o.parentNode.removeChild(o); }); },500);
  var conf=TABS[id]||TABS.overview;
  conf.icons.forEach(function(ic,k){
    var s=SPOTS[k], sz=[34,26,38,28,32][k], d=[.6,1.2,.8,1.4,1][k];
    var fl=document.createElement('div'); fl.className='bx7-fl'; fl.setAttribute('data-depth',d); fl.style.cssText='left:'+s[0]+'%;top:'+s[1]+'px';
    fl.innerHTML='<div class="bx7-fe" style="--fx:'+s[2]+'px;--fy:'+s[3]+'px;--fr:'+(k%2?140:-140)+'deg;--d:'+(k*110+120)+'ms"><div class="bx7-fb" style="--sz:'+sz+'px;--bd:'+(3.6+k*.7).toFixed(1)+'s"><i class="ti '+ic+'"></i></div></div>';
    box.appendChild(fl);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ fl.firstChild.classList.add('show'); }); });
  });
}
/* tìm tầng có nhiều khối để cho trồi lên lần lượt */
function blocks(root){
  var node=root, depth=0;
  while(node && node.children.length===1 && depth<4){ node=node.children[0]; depth++; }
  if(!node) return [];
  var out=[];
  [].forEach.call(node.children,function(c){
    if(c.tagName==='STYLE'||c.tagName==='SCRIPT') return;
    var cs=getComputedStyle(c);
    if(cs.display==='none'||cs.position==='absolute'||cs.position==='fixed') return;
    var kids=[].filter.call(c.children,function(x){ return x.tagName!=='STYLE'&&x.tagName!=='SCRIPT'; });
    if((cs.display==='grid'||(cs.display==='flex'&&cs.flexWrap==='wrap')) && kids.length>=2 && kids.length<=12) kids.forEach(function(x){ out.push(x); });
    else out.push(c);
  });
  return out.slice(0,40);
}
function stagger(root){
  blocks(root).forEach(function(el,k){
    el.style.setProperty('--i',k); el.classList.remove('bx7-in'); void el.offsetWidth; el.classList.add('bx7-in');
    el.addEventListener('animationend',function h(ev){ if(ev.target===el){ el.classList.remove('bx7-in'); el.removeEventListener('animationend',h); } });
  });
}
/* số lớn (KPI) đếm từ 0 lên */
function countUps(root){
  if(REDUCE) return;
  var list=[], all=root.querySelectorAll('*');
  for(var i=0;i<all.length && list.length<24;i++){ var el=all[i];
    if(el.children.length) continue; var t=(el.textContent||'').trim();
    if(!/^\d[\d.,]*%?$/.test(t) || t.length>9) continue;
    if(el.closest('table,svg,select,input,[_echarts_instance_]')) continue;
    if(parseFloat(getComputedStyle(el).fontSize)<22) continue;
    list.push(el); }
  list.forEach(function(el){
    var raw=el.textContent.trim(), m=raw.match(/^([\d.,]+)(%?)$/); if(!m) return;
    var num=m[1], dec=0, target;
    if(/,\d{1,2}$/.test(num)){ dec=num.split(',')[1].length; target=parseFloat(num.replace(/\./g,'').replace(',','.')); }
    else if(/\.\d{1,2}$/.test(num) && !/\.\d{3}/.test(num)){ dec=num.split('.')[1].length; target=parseFloat(num); }
    else target=parseFloat(num.replace(/[.,]/g,''));
    if(!isFinite(target)||target===0) return;
    var useComma=/,/.test(num)&&dec>0, t0=performance.now(), dur=1000;
    (function step(t){ if(!el.isConnected) return; var p=Math.min(1,(t-t0)/dur), v=target*(1-Math.pow(1-p,3));
      if(p<1){ var s=dec?v.toFixed(dec):String(Math.round(v)); el.textContent=(useComma?s.replace('.',','):s)+m[2]; requestAnimationFrame(step); }
      else el.textContent=raw; })(t0);
  });
}
function tint(id){ var t=document.querySelector('#bx7-bg .tn'); if(t) t.style.filter='hue-rotate('+((TABS[id]||{}).hue||0)+'deg)'; }
var lastTab=null;
function onTab(id){
  if(id===lastTab) return; lastTab=id;
  tint(id); floaters(id);
  if(REDUCE) return;
  var c=document.getElementById('content'); if(!c) return;
  requestAnimationFrame(function(){ stagger(c); setTimeout(function(){ countUps(c); },200); });
}
function wrapGo(){
  if(typeof window.go!=='function' || window.go.__bx7) return typeof window.go==='function';
  var prev=window.go;
  var w=function(id){ var r=prev.apply(this,arguments); try{ onTab(id); }catch(e){ if(window.console) console.warn('[bx-v7]',e); } return r; };
  w.__bx7=true; window.go=w; return true;
}

/* ================= khởi động ================= */
buildGate();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',buildGate);
buildScene();
var n=0;(function tick(){
  var a=wrapGo(), b=swapLogo();
  if(window.currentTab && lastTab===null && document.getElementById('main').style.display!=='none') onTab(window.currentTab);
  if(!(a&&b&&lastTab!==null) && n++<400) setTimeout(tick,100);
})();
/* xem trước cổng login khi đã đăng nhập: thêm ?bx7login vào link */
if(/[?&]bx7login\b/.test(location.search)){ setTimeout(function(){ var g=document.getElementById('google-gate'); if(g){ g.style.display='flex'; var w=g.querySelector('.bx7-g'); if(w) w.classList.remove('wait'); } },1500); }
})();
