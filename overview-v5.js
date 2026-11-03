/* ============================================================
   BigX HR — overview-v5.js  (Bảng điều khiển "Trung tâm tuyển dụng" — mockup v3 duyệt 03/11/2026)
   - CHỈ ĐỌC dữ liệu sẵn có: HR.tuyendung (tên đã viết tắt từ API) + kết quả AI chấm CV (CVAI / bản lưu trình duyệt).
   - Dùng lại helper cũ: tdFunnel, tdStage, TDPASS, parseDMY, monthKey, tdFilter, kcvTab, go.
   - Không sửa app.js / ui-v3.js / dữ liệu gốc. Gỡ file này là trang Tổng quan về bản ui-v3 cũ.
   ============================================================ */
(function(){
'use strict';
if(window.__ovV5) return; window.__ovV5=true;

var STS=['Nộp CV','HR duyệt','LM duyệt','PV vòng 1','PV vòng 2','Trúng tuyển'];
var STG=['CV nộp','HR duyệt CV','Line Manager duyệt','Phỏng vấn vòng 1','Phỏng vấn vòng 2','Trúng tuyển'];
var DN={'Custormer Account Manager':'Customer Account Manager','Marketing excu':'Marketing Executive'}; // chỉ đổi tên HIỂN THỊ
var S={per:'all',st:'ip',pos:null,cand:null,tab:'ov',cardOff:false,flow:true};
var D=null;

/* ---------- tiện ích ---------- */
function E(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function fmt(n,d){ return Number(n).toLocaleString('vi-VN',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}); }
function dn(v){ return DN[v]||v; }
function $(s,r){ return (r||document).querySelector(s); }
function $$(s,r){ return [].slice.call((r||document).querySelectorAll(s)); }
function nk(s){ return String(s||'').normalize('NFC').toUpperCase().replace(/\s+/g,' ').trim(); }
function dd(d){ return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); }
var I={
 brief:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M4 7h16v12H4zM9 7V5h6v2"/></svg>',
 mail:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M4 6h16v12H4zM4 7l8 6 8-6"/></svg>',
 clock:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M12 7v5l3 2"/><circle cx="12" cy="12" r="9"/></svg>',
 inbox:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M4 13l3-8h10l3 8v6H4zM4 13h5l1 2h4l1-2h5"/></svg>',
 check:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
 arrow:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 file:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/></svg>',
 cal:'<svg class="x5-i" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
 warn:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M12 3l10 18H2zM12 10v4M12 18h.01"/></svg>',
 x:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 user:'<svg class="x5-i" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
 flag:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M5 21V4h12l-2 4 2 4H5"/></svg>',
 ai:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></svg>',
 chart:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M4 19h16M7 16V9M12 16V5M17 16v-4"/></svg>',
 pdf:'<svg class="x5-i" viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
 card:'<svg class="x5-i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h5M7 14h8"/></svg>'
};

/* ---------- dữ liệu ---------- */
function aiRows(){
  var d=(window.CVAI&&CVAI.data)||null;
  if(!d){ try{ var c=JSON.parse(localStorage.getItem('bigx_cvai_cache_v1')||'null'); if(c&&c.ok) d=c; }catch(e){} }
  return (d&&d.rows)||[];
}
function level(c){ var K=[['hrReview','hr'],['lmReview','lm'],['r1','r1'],['r2','r2'],['final','fin']], m=0;
  K.forEach(function(k,i){ if(String(c[k[0]]||'').trim()===TDPASS[k[1]]) m=i+1; }); return m; }
function build(){
  var now=new Date(); now.setHours(0,0,0,0);
  var ai={}; aiRows().forEach(function(r){ ai[nk(r.ten)+'|'+nk(r.viTri)+'|'+String(r.ngay||'').trim()]=r; });
  var key=function(c){ return nk(c.hoTenMask)+'|'+nk(c.viTri)+'|'+String(c.ngayNop||'').trim().split(/\s+/)[0]; }, cnt={};
  (HR.tuyendung||[]).forEach(function(c){ var k=key(c); cnt[k]=(cnt[k]||0)+1; });
  var all=(HR.tuyendung||[]).map(function(c,i){
    var st=tdStage(c), b=st.bucket, d=parseDMY(c.ngayNop), k=key(c), a=cnt[k]===1?(ai[k]||null):null;
    return {i:i,c:c,name:String(c.hoTenMask||'—'),vt:String(c.viTri||'').trim()||'(trống)',lv:level(c),
      st:b==='trung'?'hd':b==='xuly'?'ip':'stp',label:st.label,d:d,days:d?Math.max(0,Math.round((now-d)/864e5)):null,ai:a};
  });
  return {all:all,now:now,ai:aiRows()};
}
function inPer(x){ if(S.per==='all') return true; if(!x.d) return false;
  var n=D.now, t=new Date(n);
  if(S.per==='30') t.setDate(t.getDate()-30); else if(S.per==='90') t.setDate(t.getDate()-90); else if(S.per==='y'){ t=new Date(n.getFullYear(),0,1); }
  return x.d>=t; }
function perList(){ return D.all.filter(inPer); }
function stOk(x){ return S.st==='all'||x.st===S.st; }
function positions(list){
  var g={}; list.forEach(function(x){ (g[x.vt]=g[x.vt]||[]).push(x); });
  return Object.keys(g).map(function(k){ var l=g[k];
    return {vt:k,list:l,n:l.length,ip:l.filter(function(x){return x.st==='ip';}).length,hd:l.filter(function(x){return x.st==='hd';}).length,f:tdFunnel(l.map(function(x){return x.c;})).map(function(s){return s.n;})}; })
    .sort(function(a,b){ return (b.ip-a.ip)||(b.n-a.n); })
    .map(function(p,i){ p.code='VT-'+String(i+1).padStart(2,'0'); return p; });
}

/* ---------- tooltip ---------- */
var tip=null;
function tipEl(){ if(!tip){ tip=document.createElement('div'); tip.className='x5-tip'; document.body.appendChild(tip); } return tip; }
function show(e,h){ var t=tipEl(); t.innerHTML=h; t.classList.add('on'); var x=e.clientX+14,y=e.clientY+14;
  if(x+t.offsetWidth>innerWidth-8) x=e.clientX-t.offsetWidth-14; if(y+t.offsetHeight>innerHeight-8) y=e.clientY-t.offsetHeight-12; t.style.left=x+'px'; t.style.top=y+'px'; }
function hide(){ if(tip) tip.classList.remove('on'); }

/* ---------- khung trang ---------- */
window.renderOverview=function(){
  if(HR.error&&!HR.loaded) return (typeof errorBox==='function')?errorBox():'<div class="x5-empty">Không tải được dữ liệu.</div>';
  if(!HR.loaded) return (typeof loadingBox==='function')?loadingBox():'<div class="x5-empty">Đang tải…</div>';
  setTimeout(init,20);
  return '<div class="v5 v5-in" id="v5">'+
    '<div class="x5-top" id="x5chips"></div>'+
    '<div class="x5-head"><div><h1>Trung tâm tuyển dụng</h1><p id="x5sub"></p></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><div class="x5-seg" id="x5per"></div>'+
      '<button class="x5-btn pri" id="x5pdf">'+I.pdf+'Mở Báo cáo</button></div></div>'+
    '<div class="x5-filt"><div class="x5-seg" id="x5st"></div><span class="x5-sw on" id="x5flow"><i></i>Hiện luồng</span></div>'+
    '<section class="x5-map" id="x5map">'+
      '<div class="x5-card" id="x5card"></div><button class="x5-btn x5-reopen" id="x5re">'+I.card+'Mở thẻ ứng viên</button>'+
      '<div class="x5-mt"><b>Bản đồ quy trình</b><span>Mỗi chấm = 1 ứng viên · bấm để xem</span></div>'+
      '<div class="x5-dial" id="x5dial"></div>'+
      '<svg class="x5-mp" id="x5mp" role="img" aria-label="Bản đồ quy trình: mỗi chấm là một ứng viên, xếp theo vị trí và bước đã qua"></svg>'+
      '<div class="x5-lg"><span><i style="background:var(--x-dot)"></i>Đang xử lý</span><span><i style="border:1.2px solid var(--x-dotdim)"></i>Đã dừng</span><span><i style="background:var(--x-accink)"></i>Trúng tuyển</span><span><i style="border:1.2px solid var(--x-dot);width:14px;height:14px"></i>Nhóm đông (số = người)</span></div>'+
    '</section>'+
    '<div class="x5-g2"><section class="x5-pn"><div class="x5-ph"><h3>'+I.brief+'Vị trí tuyển dụng<small id="x5slotsub"></small></h3></div><div class="x5-slots" id="x5slots"></div></section>'+
      '<section class="x5-pn" id="x5det"></section></div>'+
    '<div class="x5-g2"><section class="x5-pn"><div class="x5-ph"><h3>'+I.chart+'CV nhận theo tháng<small>12 tháng gần nhất · theo ngày nộp</small></h3></div>'+
      '<svg class="x5-ch2" id="x5ch" viewBox="0 0 640 220" role="img" aria-label="Biểu đồ cột số CV theo tháng"></svg><div class="x5-ins" id="x5ins"></div></section>'+
      '<section class="x5-pn"><div class="x5-ph"><h3>'+I.check+'Việc cần làm</h3><span class="x5-pill x5-p-high" id="x5tdb"></span></div><div id="x5todo"></div></section></div>'+
  '</div>';
};

function init(){
  if(!document.getElementById('v5')) return;
  D=build();
  var P=positions(perList());
  if(!S.pos||!P.some(function(p){return p.vt===S.pos;})) S.pos=P.length?P[0].vt:null;
  segs(); chips(); drawAll(); monthChart();
  $('#x5pdf').onclick=function(){ go('bao-cao'); };
  $('#x5re').onclick=function(){ S.cardOff=false; renderCard(false); };
  $('#x5flow').onclick=function(){ S.flow=!S.flow; this.classList.toggle('on',S.flow); $$('.x5-flg').forEach(function(g){ g.style.display=S.flow?'':'none'; }); };
  // AI chưa có trong trình duyệt → nạp ngầm (chỉ đọc) rồi vẽ lại
  if(!D.ai.length && typeof cvaiLoad==='function' && window.CVAI && !CVAI.loading && !CVAI.data && !CVAI.error){ try{ cvaiLoad(); }catch(e){}
    var n=0, w=setInterval(function(){ n++; if(window.CVAI&&CVAI.data&&CVAI.data.rows){ clearInterval(w); if(window.currentTab==='overview'&&document.getElementById('v5')){ D=build(); drawAll(); } } else if(n>40) clearInterval(w); },500); }
}
function drawAll(){ var P=positions(perList()); S.P=P; if(!P.some(function(p){return p.vt===S.pos;})) S.pos=P.length?P[0].vt:null; drawMap(); slots(); det(); todo(); dial(); }

function segs(){
  var per=[['all','Tất cả'],['30','30 ngày'],['90','90 ngày'],['y','Năm '+D.now.getFullYear()]];
  $('#x5per').innerHTML=per.map(function(p){ return '<button data-p="'+p[0]+'" class="'+(S.per===p[0]?'on':'')+'">'+p[1]+'</button>'; }).join('');
  $$('#x5per button').forEach(function(b){ b.onclick=function(){ S.per=b.dataset.p; S.cand=null; segs(); chips(); drawAll(); }; });
  var L=perList(), c=function(k){ return L.filter(function(x){return x.st===k;}).length; };
  var st=[['ip','Đang xử lý',c('ip')],['hd','Trúng tuyển',c('hd')],['stp','Đã dừng',c('stp')],['all','Tất cả',L.length]];
  $('#x5st').innerHTML=st.map(function(f){ return '<button data-f="'+f[0]+'" class="'+(S.st===f[0]?'on':'')+'">'+f[1]+'<span class="n">'+f[2]+'</span></button>'; }).join('');
  $$('#x5st button').forEach(function(b){ b.onclick=function(){ S.st=b.dataset.f; S.cand=null; segs(); drawAll(); }; });
}
function chips(){
  var L=perList(), P=positions(L), ip=L.filter(function(x){return x.st==='ip';}), hd=L.filter(function(x){return x.st==='hd';});
  var now=D.now, mk=String(now.getMonth()+1).padStart(2,'0')+'/'+now.getFullYear(), mth=D.all.filter(function(x){ return monthKey(x.c.ngayNop)===mk; }).length;
  var hr0=ip.filter(function(x){return x.lv===0;}).length, vt=P.filter(function(p){return p.ip>0;}).length;
  $('#x5chips').innerHTML=
    '<span class="x5-chip">'+I.brief+'Vị trí đang tuyển <b>'+vt+'</b></span>'+
    '<span class="x5-chip">'+I.mail+'CV tháng '+(now.getMonth()+1)+' <b>'+mth+'</b></span>'+
    '<span class="x5-chip">'+I.clock+'Đang xử lý <b>'+ip.length+'</b></span>'+
    '<span class="x5-chip">'+I.inbox+'Chờ HR duyệt <b>'+hr0+'</b></span>'+
    '<span class="x5-chip">'+I.check+'Tỷ lệ đậu <b>'+(L.length?fmt(hd.length/L.length*100,1):'0')+'%</b></span>';
  var lbl={all:'toàn bộ thời gian','30':'30 ngày qua','90':'90 ngày qua',y:'năm '+now.getFullYear()}[S.per];
  $('#x5sub').textContent=dd(new Date())+' · Đang xem: '+lbl+' · '+L.length+' ứng viên'+(HR.updated?' · dữ liệu cập nhật '+HR.updated:'');
}

/* ---------- bản đồ ---------- */
var CAP=24;
function drawMap(){
  var svg=$('#x5mp'); if(!svg) return;
  var P=S.P.map(function(p){ return {p:p,l:p.list.filter(stOk)}; }).filter(function(o){ return o.l.length; });
  var W=1000,X0=250,X1=800,dx=(X1-X0)/5,TOP=150,dy=Math.max(44,Math.min(60,300/Math.max(1,P.length))),H=TOP+P.length*dy+56;
  svg.setAttribute('viewBox','0 0 '+W+' '+H);
  var h='', r=mulberry(7);
  for(var i=0;i<22;i++){ var x=r()*W,y=r()*H,a=r()*Math.PI,l=200+r()*500; h+='<line x1="'+x.toFixed(0)+'" y1="'+y.toFixed(0)+'" x2="'+(x+Math.cos(a)*l).toFixed(0)+'" y2="'+(y+Math.sin(a)*l).toFixed(0)+'" stroke="var(--x-street'+(i%3?'':'2')+')" stroke-width="'+(i%4?1:6)+'"/>'; }
  if(S.hl){ S.hl.forEach(function(c){ h+='<rect class="x5-colhl" x="'+(X0+dx*c-40)+'" y="'+(TOP-70)+'" width="80" height="'+(H-TOP+40)+'" rx="14"/>'; }); }
  var colN=[0,0,0,0,0,0]; P.forEach(function(o){ o.l.forEach(function(x){ colN[x.lv]++; }); });
  STS.forEach(function(n,s){ var x=X0+dx*s; h+='<line class="x5-colg" x1="'+x+'" x2="'+x+'" y1="'+(TOP-30)+'" y2="'+(H-40)+'"/>'+
    '<text class="x5-st-n" x="'+x+'" y="'+(TOP-56)+'" text-anchor="middle">'+colN[s]+'</text><text class="x5-st-l" x="'+x+'" y="'+(TOP-42)+'" text-anchor="middle">'+n+'</text>'; });
  var pts=[]; D.all.forEach(function(x){ x.x=x.y=null; });
  P.forEach(function(o,pi){ var y=TOP+pi*dy+dy/2, p=o.p, sel=p.vt===S.pos;
    h+='<g class="x5-lane'+(sel?' sel':'')+'" data-v="'+E(p.vt)+'"><rect class="x5-lbg" x="14" y="'+(y-dy/2+2)+'" width="'+(W-28)+'" height="'+(dy-4)+'" rx="10"/>'+
      '<text class="x5-ln-c" x="30" y="'+(y-4)+'">'+p.code+' · '+o.l.length+' người</text><text class="x5-ln-l" x="30" y="'+(y+11)+'">'+E(trim(dn(p.vt),30))+'</text>';
    h+='<g class="x5-flg"'+(S.flow?'':' style="display:none"')+'>';
    for(var s=0;s<5;s++){ var pass=o.l.filter(function(x){return x.lv>s;}).length; if(!pass) continue; var w=Math.min(9,1.2+Math.sqrt(pass)*1.1);
      h+='<path class="x5-flowb" d="M'+(X0+dx*s+34)+','+y+'H'+(X0+dx*(s+1)-34)+'" stroke-width="'+(w+4).toFixed(1)+'"/><path class="x5-flow" d="M'+(X0+dx*s+34)+','+y+'H'+(X0+dx*(s+1)-34)+'" stroke-width="'+Math.max(1.6,w*.6).toFixed(1)+'"/>'; }
    h+='</g></g>';
    for(var s2=0;s2<6;s2++){ var cell=o.l.filter(function(x){return x.lv===s2;}); if(!cell.length) continue; var cx=X0+dx*s2;
      if(cell.length>CAP){ var main=cell.filter(function(x){return x.st==='ip';}).length>=cell.length/2?'ip':cell.filter(function(x){return x.st==='hd';}).length>=cell.length/2?'hd':'stp', rr=Math.min(dy/2-4,9+Math.sqrt(cell.length)*1.3);
        h+='<g class="x5-bub '+main+'" data-v="'+E(p.vt)+'" data-s="'+s2+'" data-n="'+cell.length+'"><circle cx="'+cx+'" cy="'+y+'" r="'+rr.toFixed(1)+'"/><text x="'+cx+'" y="'+(y+4)+'" text-anchor="middle">'+cell.length+'</text></g>';
        continue; }
      cell.sort(function(a,b){ var o2={hd:0,ip:1,stp:2}; return (o2[a.st]-o2[b.st])||((a.days||0)-(b.days||0)); });
      var rows=Math.ceil(cell.length/6), sp=Math.min(9.2,(dy-8)/Math.max(rows,1));
      cell.forEach(function(x,k){ var col=k%6,row=Math.floor(k/6),rowN=Math.min(6,cell.length-row*6), px=cx-(rowN-1)*sp/2+col*sp, py=y-(rows-1)*sp/2+row*sp; x.x=px; x.y=py; pts.push(x);
        h+='<circle class="x5-d '+x.st+'" data-i="'+x.i+'" cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="'+Math.min(3.3,sp*.38).toFixed(1)+'"/>'; });
    }
  });
  h+='<g id="x5sel"></g>';
  svg.innerHTML=h;
  var em=$('#x5map .x5-empty-map'); if(em) em.remove();
  if(!P.length){ var d=document.createElement('div'); d.className='x5-empty-map'; d.textContent='Không có ứng viên nào ở bộ lọc này.'; $('#x5map').appendChild(d); }
  var byI={}; pts.forEach(function(x){ byI[x.i]=x; });
  $$('.x5-d',svg).forEach(function(el){ var x=byI[el.getAttribute('data-i')];
    el.addEventListener('mousemove',function(e){ show(e,'<span class="x5-mono">'+E(dn(x.vt))+'</span><b>'+E(x.name)+'</b> · '+E(x.label)+'<br>'+(x.days!=null?'Đã nộp '+x.days+' ngày':'Chưa có ngày nộp')+(x.ai?' · AI '+E(x.ai.kl)+' ('+fmt(x.ai.diem,1)+')':'')); });
    el.addEventListener('mouseleave',hide);
    el.addEventListener('click',function(ev){ ev.stopPropagation(); selCand(x); }); });
  $$('.x5-bub',svg).forEach(function(el){ var v=el.getAttribute('data-v'), s=+el.getAttribute('data-s');
    el.addEventListener('mousemove',function(e){ show(e,'<span class="x5-mono">'+E(dn(v))+'</span><b>'+el.getAttribute('data-n')+' người</b> ở bước '+STG[s]+'<br>Bấm để xem danh sách'); });
    el.addEventListener('mouseleave',hide);
    el.addEventListener('click',function(ev){ ev.stopPropagation(); S.pos=v; S.tab='cell'; S.lvF=s; markLane(); slots(); det(); $('#x5det').scrollIntoView({behavior:'smooth',block:'nearest'}); }); });
  $$('.x5-lane',svg).forEach(function(g){ g.addEventListener('click',function(){ selPos(g.getAttribute('data-v')); }); });
  // ứng viên đang chọn
  if(!S.cand||!byI[S.cand.i]){ var fp=pts.filter(function(x){return x.vt===S.pos&&x.st==='ip';}), fa=pts.filter(function(x){return x.st===(S.st==='all'?'ip':S.st);});
    S.cand=(fp.sort(function(a,b){return (a.days||0)-(b.days||0);})[0])||(fa[0])||pts[0]||null; }
  else S.cand=byI[S.cand.i];
  markSel(); renderCard(false);
}
function niceTop(v){ var raw=v/4, p=Math.pow(10,Math.floor(Math.log10(Math.max(raw,1)))), m=[1,2,2.5,5,10].filter(function(k){return k*p>=raw;})[0]||10; return Math.max(4,m*p*4); }
function trim(s,n){ s=String(s); return s.length>n?s.slice(0,n-1)+'…':s; }
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function markSel(){ var g=$('#x5sel'); if(!g) return; var c=S.cand; g.innerHTML=c&&c.x!=null?'<circle class="x5-ring" cx="'+c.x+'" cy="'+c.y+'" r="6"/><circle class="x5-core" cx="'+c.x+'" cy="'+c.y+'" r="4.4"/>':''; }
function markLane(){ $$('.x5-lane').forEach(function(g){ g.classList.toggle('sel',g.getAttribute('data-v')===S.pos); }); }

/* ---------- đồng hồ ---------- */
function pt(cx,cy,r,a){ var t=(a-90)*Math.PI/180; return [cx+r*Math.cos(t),cy+r*Math.sin(t)]; }
function arc(cx,cy,r,a0,a1){ var p0=pt(cx,cy,r,a0),p1=pt(cx,cy,r,a1); return 'M'+p0[0]+','+p0[1]+'A'+r+','+r+' 0 '+(a1-a0>180?1:0)+' 1 '+p1[0]+','+p1[1]; }
function speedo(v){ var cx=70,cy=60,r=44,a0=-130,a1=130,av=a0+(a1-a0)*Math.max(0,Math.min(10,v))/10,h='<svg viewBox="0 0 140 104">';
  h+='<defs><linearGradient id="x5sg" x1="0" x2="1"><stop offset="0" stop-color="var(--x-crit)"/><stop offset=".55" stop-color="var(--x-high)"/><stop offset="1" stop-color="var(--x-accink)"/></linearGradient></defs>';
  h+='<path d="'+arc(cx,cy,r,a0,a1)+'" stroke="var(--x-s3)" stroke-width="7" fill="none" stroke-linecap="round"/><path d="'+arc(cx,cy,r,a0,Math.max(a0+1,av))+'" stroke="url(#x5sg)" stroke-width="7" fill="none" stroke-linecap="round"/>';
  for(var t=0;t<=10;t+=.5){ var a=a0+(a1-a0)*t/10,big=t%2.5===0,p0=pt(cx,cy,r-9,a),p1=pt(cx,cy,r-(big?16:12),a); h+='<line x1="'+p0[0]+'" y1="'+p0[1]+'" x2="'+p1[0]+'" y2="'+p1[1]+'" stroke="var(--x-fa)" stroke-width="'+(big?1.4:.8)+'"/>';
    if(t%5===0){ var pl=pt(cx,cy,r-24,a); h+='<text x="'+pl[0]+'" y="'+(pl[1]+3)+'" text-anchor="middle" font-size="7.5" fill="var(--x-mu)" font-family="JetBrains Mono,monospace">'+t+'</text>'; } }
  var n=pt(cx,cy,r-12,av); h+='<line x1="'+cx+'" y1="'+cy+'" x2="'+n[0]+'" y2="'+n[1]+'" stroke="var(--x-tx)" stroke-width="2" stroke-linecap="round"/><circle cx="'+cx+'" cy="'+cy+'" r="5" fill="var(--x-tx)"/><circle cx="'+cx+'" cy="'+cy+'" r="2" fill="var(--x-s2)"/>';
  return h+'<text x="'+cx+'" y="'+(cy+32)+'" text-anchor="middle" font-size="15" font-weight="700" fill="var(--x-tx)" font-family="JetBrains Mono,monospace">'+fmt(v,1)+'<tspan font-size="9" fill="var(--x-mu)" font-weight="500"> /10</tspan></text></svg>'; }
function liquid(d){ var cx=70,cy=52,r=38,lv=Math.min(1,d/60),y=cy+r-2*r*lv;
  function wave(ph){ var p='M20,'+y.toFixed(1); for(var x=20;x<=120;x+=10){ p+=' Q'+(x+5)+','+(y+((x/10+ph)%2?-4:4)).toFixed(1)+' '+(x+10)+','+y.toFixed(1); } return p+' V110 H20Z'; }
  return '<svg viewBox="0 0 140 104"><defs><clipPath id="x5lq"><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'"/></clipPath><linearGradient id="x5lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--x-high)"/><stop offset="1" stop-color="var(--x-crit)" stop-opacity=".75"/></linearGradient></defs>'+
  '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r+5)+'" fill="none" stroke="var(--x-s3)"/><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="var(--x-s3)"/>'+
  '<g clip-path="url(#x5lq)"><path fill="url(#x5lg)" opacity=".9" d="'+wave(0)+'"><animate attributeName="d" dur="3.2s" repeatCount="indefinite" values="'+wave(0)+';'+wave(1)+';'+wave(0)+'"/></path></g>'+
  '<text x="'+cx+'" y="'+(cy+2)+'" text-anchor="middle" font-size="18" font-weight="700" fill="var(--x-tx)" font-family="JetBrains Mono,monospace">'+d+'</text><text x="'+cx+'" y="'+(cy+16)+'" text-anchor="middle" font-size="8.5" fill="var(--x-tx2)">ngày</text>'+
  '<text x="'+cx+'" y="101" text-anchor="middle" font-size="8.5" fill="var(--x-mu)">kể từ ngày nộp</text></svg>'; }
function dial(){ var L=perList(), f=tdFunnel(L.map(function(x){return x.c;})), pct=f[0].n?f[1].n/f[0].n*100:0, cx=66,cy=66;
  var h='<svg viewBox="0 0 132 132"><defs><radialGradient id="x5bz" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="var(--x-bez1)"/><stop offset="1" stop-color="var(--x-bez2)"/></radialGradient><radialGradient id="x5fc" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="var(--x-s2)"/><stop offset="1" stop-color="var(--x-s1)"/></radialGradient></defs>';
  h+='<circle cx="'+cx+'" cy="'+cy+'" r="62" fill="url(#x5bz)" stroke="var(--x-line)"/><circle cx="'+cx+'" cy="'+cy+'" r="50" fill="url(#x5fc)" stroke="var(--x-line)"/>';
  for(var i=0;i<60;i++){ var a=i*6,b=i%5===0,p0=pt(cx,cy,59,a),p1=pt(cx,cy,b?52:55,a); h+='<line x1="'+p0[0]+'" y1="'+p0[1]+'" x2="'+p1[0]+'" y2="'+p1[1]+'" stroke="'+(i/60*100<pct?'var(--x-accink)':'var(--x-fa)')+'" stroke-width="'+(b?1.6:.8)+'"/>'; }
  var m=pt(cx,cy,46,pct*3.6),m1=pt(cx,cy,38,pct*3.6-6),m2=pt(cx,cy,38,pct*3.6+6); h+='<path d="M'+m[0]+','+m[1]+'L'+m1[0]+','+m1[1]+'L'+m2[0]+','+m2[1]+'Z" fill="var(--x-crit)"/>';
  h+='<text x="'+cx+'" y="'+(cy-8)+'" text-anchor="middle" font-size="8.5" fill="var(--x-mu)" letter-spacing=".8">QUA SÀNG LỌC HR</text><text x="'+cx+'" y="'+(cy+12)+'" text-anchor="middle" font-size="21" font-weight="700" fill="var(--x-tx)" font-family="JetBrains Mono,monospace">'+fmt(pct,0)+'%</text><text x="'+cx+'" y="'+(cy+26)+'" text-anchor="middle" font-size="8.5" fill="var(--x-mu)">'+f[1].n+'/'+f[0].n+' CV</text></svg>';
  $('#x5dial').innerHTML=h; }

/* ---------- thẻ ứng viên ---------- */
function stPill(x){ return x.st==='hd'?'<span class="x5-pill x5-p-acc">Trúng tuyển</span>':x.st==='stp'?'<span class="x5-pill x5-p-mu">Đã dừng</span>':'<span class="x5-pill x5-p-norm">Đang xử lý</span>'; }
function aiPill(kl){ return kl==='ĐẠT'?'<span class="x5-pill x5-p-ok">Đạt</span>':kl==='XEM TAY'?'<span class="x5-pill x5-p-high">Xem tay</span>':kl?'<span class="x5-pill x5-p-mu">Không đạt</span>':''; }
function card(){ var x=S.cand; if(!x) return '<div class="x5-empty">Chọn một chấm trên bản đồ để xem ứng viên.</div>';
  var pr=Math.round((x.lv+1)/6*100), ini=x.name.replace(/\./g,'').split(/\s+/).filter(Boolean).map(function(w){return w[0];}).slice(0,2).join('').toUpperCase();
  var route=x.st==='ip'&&x.lv<5?STS[x.lv]+' → '+STS[x.lv+1]:E(x.label);
  return '<div class="x5-ch"><div class="x5-av">'+E(ini)+'</div><div class="t"><div class="nm">'+E(x.name)+stPill(x)+'</div><div class="sub">'+E(dn(x.vt))+'</div></div><button class="x5-x" id="x5cx" aria-label="Đóng thẻ">'+I.x+'</button></div>'+
  '<div class="x5-route"><div class="r1"><span>'+route+'</span><span>Bước '+(x.lv+1)+'/6 · '+pr+'%</span></div><div class="x5-pbar"><i style="width:'+pr+'%"></i></div>'+
  '<div class="r2"><span>Nộp '+(x.d?dd(x.d):'—')+'</span><span>'+(x.st==='ip'?'Hiện tại: <b>'+E(x.label)+'</b>':x.st==='hd'?'<b>Đã trúng tuyển</b>':'<b>Đã dừng</b>')+'</span></div></div>'+
  '<div class="x5-gg"><div class="x5-gt"><div class="gl"><span>Điểm AI</span>'+(x.ai?aiPill(x.ai.kl):'')+'</div>'+(x.ai&&x.ai.diem!=null&&x.ai.diem!==''?speedo(+x.ai.diem):'<div class="na">Chưa có điểm AI<br>cho hồ sơ này</div>')+'</div>'+
  '<div class="x5-gt"><div class="gl"><span>Trong quy trình</span></div>'+(x.days!=null?liquid(x.days):'<div class="na">Chưa có ngày nộp</div>')+'</div></div>'+
  '<div class="x5-ca"><button class="x5-btn pri" id="x5open">'+I.file+'Mở trong Tuyển dụng</button>'+(x.ai?'<button class="x5-btn" id="x5ai">'+I.ai+'Xem chấm AI</button>':'')+'</div>'; }
function renderCard(anim){ var el=$('#x5card'); if(!el) return;
  el.classList.toggle('off',!!S.cardOff); if(S.cardOff) return;
  var paint=function(){ el.innerHTML=card(); el.classList.remove('swap');
    var cx=$('#x5cx'); if(cx) cx.onclick=function(){ S.cardOff=true; renderCard(false); };
    var op=$('#x5open'); if(op) op.onclick=function(){ var x=S.cand; tdFilter.q=x.name; tdFilter.vitri=x.c.viTri||''; tdFilter.buoc=''; go('tuyen-dung'); };
    var ai=$('#x5ai'); if(ai) ai.onclick=function(){ window.kcvTab='ai'; try{ kcvTab='ai'; }catch(e){} go('kho-cv'); }; };
  if(anim){ el.classList.add('swap'); setTimeout(paint,160); } else paint(); }
function selCand(x){ S.cand=x; S.cardOff=false; markSel(); renderCard(true); if(x.vt!==S.pos){ S.pos=x.vt; S.tab='ov'; markLane(); slots(); det(); } }

/* ---------- ô vị trí + chi tiết ---------- */
function lvl(p){ return p.ip>0?['Đang tuyển','x5-p-acc']:p.hd>0?['Đã tuyển','x5-p-ok']:['Chưa tuyển được','x5-p-crit']; }
function slots(){ var P=S.P||[]; $('#x5slotsub').textContent=P.length+' vị trí · bấm để xem chi tiết';
  $('#x5slots').innerHTML=P.length?P.map(function(p){ var l=lvl(p);
    return '<button class="x5-slot'+(p.vt===S.pos?' on':'')+'" data-v="'+E(p.vt)+'"><span class="c"><span>'+p.code+'</span><span class="x5-pill '+l[1]+'">'+l[0]+'</span></span><span class="nm">'+E(dn(p.vt))+'</span><span class="x5-mini">'+p.f.map(function(v){return '<i class="'+(v>0?'f':'')+'"></i>';}).join('')+'</span>'+
      '<span class="k"><span><b>'+p.n+'</b> CV</span><span><b>'+p.ip+'</b> đang xử lý</span><span><b>'+p.f[5]+'</b> đậu</span></span></button>'; }).join(''):'<div class="x5-empty">Chưa có dữ liệu trong kỳ này.</div>';
  $$('.x5-slot').forEach(function(b){ b.onclick=function(){ selPos(b.getAttribute('data-v')); }; }); }
function selPos(v){ S.pos=v; S.tab='ov'; S.lvF=null; markLane(); $$('.x5-slot').forEach(function(b){ b.classList.toggle('on',b.getAttribute('data-v')===v); }); det();
  var c=(S.P.filter(function(p){return p.vt===v;})[0]||{list:[]}).list.filter(stOk).filter(function(x){return x.x!=null;}).sort(function(a,b){return (a.days||0)-(b.days||0);})[0];
  if(c){ S.cand=c; S.cardOff=false; markSel(); renderCard(true); } }
function det(){ var el=$('#x5det'); if(!el) return; var p=(S.P||[]).filter(function(q){return q.vt===S.pos;})[0];
  if(!p){ el.innerHTML='<div class="x5-empty">Chọn một vị trí để xem chi tiết.</div>'; return; }
  var f=p.f, l=lvl(p), worst=-1, wr=2; for(var i=1;i<6;i++){ if(f[i-1]>=3){ var r=f[i]/f[i-1]; if(r<wr){ wr=r; worst=i; } } }
  var ip=p.list.filter(function(x){return x.st==='ip';}), hd=p.list.filter(function(x){return x.st==='hd';});
  var tabs=[['ov','Tổng quan',null],['uv','Đang xử lý',ip.length],['hd','Trúng tuyển',hd.length]];
  var h='<div class="x5-ph"><h3>'+I.flag+E(dn(p.vt))+'<span class="x5-pill '+l[1]+'">'+l[0]+'</span></h3><span class="x5-mono" style="font-size:10.5px;color:var(--x-mu)">'+p.code+'</span></div>'+
    '<div class="x5-tab">'+tabs.map(function(t){ return '<button data-t="'+t[0]+'" class="'+(S.tab===t[0]?'on':'')+'">'+t[1]+(t[2]!=null?'<span class="n">'+t[2]+'</span>':'')+'</button>'; }).join('')+'</div>';
  if(S.tab==='ov'){
    var A=D.ai.filter(function(r){ return nk(r.viTri)===nk(p.vt); }), a1=A.filter(function(r){return r.kl==='ĐẠT';}).length, a2=A.filter(function(r){return r.kl==='XEM TAY';}).length, a3=A.filter(function(r){return r.kl==='KHÔNG ĐẠT';}).length, at=a1+a2+a3;
    h+='<dl class="x5-kv"><div><dt>CV nhận</dt><dd>'+f[0]+'</dd></div><div><dt>Qua HR</dt><dd>'+f[1]+' <small>'+(f[0]?fmt(f[1]/f[0]*100,1):0)+'%</small></dd></div><div><dt>Trúng tuyển</dt><dd>'+f[5]+' <small>'+(f[0]?fmt(f[5]/f[0]*100,1):0)+'%</small></dd></div></dl>';
    h+='<div class="x5-sb">'+STG.map(function(n,i){ return '<div class="x5-sbr'+(i===worst?' w':'')+'"><span>'+n+'</span><span class="tr"><i style="width:'+(f[0]?f[i]/f[0]*100:0)+'%"></i></span><span class="v">'+f[i]+'</span></div>'; }).join('')+'</div>';
    h+='<div style="margin-top:12px;font-size:10.5px;color:var(--x-mu)">AI chấm theo JD'+(at?' · '+at+' CV đã chấm':'')+'</div>'+(at?'<div class="x5-ai"><i style="width:'+(a1/at*100)+'%;background:var(--x-ok)"></i><i style="width:'+(a2/at*100)+'%;background:var(--x-high)"></i><i style="width:'+(a3/at*100)+'%;background:var(--x-fa)"></i></div><div class="x5-ail"><span><i style="background:var(--x-ok)"></i>Đạt <b>'+a1+'</b></span><span><i style="background:var(--x-high)"></i>Xem tay <b>'+a2+'</b></span><span><i style="background:var(--x-fa)"></i>Không đạt <b>'+a3+'</b></span></div>':'<div class="x5-ail" style="margin-top:4px">Chưa có CV nào của vị trí này được AI chấm.</div>');
    if(worst>0){ h+='<div class="x5-call'+(wr<.3?' c':'')+'">'+I.warn+'<div><b>Điểm nghẽn của vị trí</b><span>'+STG[worst-1]+' → '+STG[worst]+' chỉ giữ '+fmt(wr*100,1)+'% ('+f[worst-1]+' → '+f[worst]+').</span></div></div>'; }
    h+='<div class="x5-da"><button class="x5-btn" id="x5vt">'+I.user+'Xem trong Tuyển dụng</button><button class="x5-btn" id="x5hq">'+I.chart+'Hiệu quả tuyển dụng</button></div>';
  } else {
    var list=(S.tab==='cell'?p.list.filter(stOk):S.tab==='uv'?ip:hd).slice(); if(S.lvF!=null){ list=list.filter(function(x){return x.lv===S.lvF;}); }
    list.sort(function(a,b){ return (a.days==null)-(b.days==null)||(a.days||0)-(b.days||0); });
    if(S.lvF!=null) h+='<div class="x5-ail" style="margin-bottom:8px">Đang xem: <b>'+STG[S.lvF]+'</b>'+(S.tab==='cell'?' · '+{ip:'đang xử lý',hd:'trúng tuyển',stp:'đã dừng',all:'mọi trạng thái'}[S.st]+' · '+list.length+' người':'')+' · <button class="x5-btn" id="x5clr" style="height:24px;font-size:11px">Bỏ lọc</button></div>';
    h+=list.length?'<div class="x5-lst">'+list.map(function(x){ return '<div class="x5-lr" data-i="'+x.i+'"><span><b>'+E(x.name)+'</b><small>'+E(x.label)+(x.days!=null?' · nộp '+x.days+' ngày':'')+'</small></span>'+(x.ai?aiPill(x.ai.kl):S.tab==='cell'?stPill(x):'')+'</div>'; }).join('')+'</div>':'<div class="x5-empty">Không có hồ sơ nào.</div>';
  }
  el.innerHTML=h;
  $$('.x5-tab button',el).forEach(function(b){ b.onclick=function(){ S.tab=b.getAttribute('data-t'); S.lvF=null; det(); }; });
  var vt=$('#x5vt'); if(vt) vt.onclick=function(){ tdFilter.q=''; tdFilter.vitri=p.vt==='(trống)'?'':p.vt; tdFilter.buoc=''; go('tuyen-dung'); };
  var hq=$('#x5hq'); if(hq) hq.onclick=function(){ go('pt-tuyen-dung'); };
  var cl=$('#x5clr'); if(cl) cl.onclick=function(){ S.lvF=null; if(S.tab==='cell') S.tab='ov'; det(); };
  $$('.x5-lr',el).forEach(function(r){ r.onclick=function(){ var x=D.all[+r.getAttribute('data-i')];
    if(!stOk(x)){ S.st=x.st; segs(); drawMap(); x=D.all[x.i]; }
    selCand(x); $('#x5map').scrollIntoView({behavior:'smooth',block:'center'}); }; });
}

/* ---------- CV theo tháng ---------- */
function monthChart(){
  var now=new Date(), M=[]; for(var i=11;i>=0;i--){ var d=new Date(now.getFullYear(),now.getMonth()-i,1); M.push({k:String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(),l:String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getFullYear()).slice(2),n:0}); }
  var idx={}; M.forEach(function(m,i){ idx[m.k]=i; }); D.all.forEach(function(x){ var k=monthKey(x.c.ngayNop); if(idx[k]!=null) M[idx[k]].n++; });
  var V=M.map(function(m){return m.n;}), full=V.slice(0,11), mxv=Math.max.apply(0,V.concat([1])), top=niceTop(mxv*1.1);
  var s=$('#x5ch'), W=640,H=220,L=30,R=6,T=16,B=24, h='<defs><pattern id="x5hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--x-s2)"/><line x1="0" y1="0" x2="0" y2="5" stroke="var(--x-mu)" stroke-width="1.4"/></pattern></defs>';
  [0,.25,.5,.75,1].forEach(function(f){ var t=Math.round(top*f),y=T+(H-T-B)*(1-f); h+='<line class="x5-gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text class="x5-ax" x="'+(L-7)+'" y="'+(y+3)+'" text-anchor="end">'+t+'</text>'; });
  var st=(W-L-R)/12, bw=st*.58, avg=full.reduce(function(a,b){return a+b;},0)/11, ay=T+(H-T-B)*(1-avg/top), mi=full.indexOf(Math.max.apply(0,full));
  V.forEach(function(v,i){ var x=L+st*i+(st-bw)/2, bh=(H-T-B)*v/top, y=H-B-bh, r=Math.min(4,bh/2);
    h+='<path class="x5-bar'+(i===mi&&v?' cur':'')+(i===11?' part':'')+'" data-i="'+i+'" d="M'+x+','+(H-B)+'V'+(y+r)+'Q'+x+','+y+' '+(x+r)+','+y+'H'+(x+bw-r)+'Q'+(x+bw)+','+y+' '+(x+bw)+','+(y+r)+'V'+(H-B)+'Z"/>'+
      '<text class="x5-ax" x="'+(x+bw/2)+'" y="'+(H-7)+'" text-anchor="middle">'+M[i].l+'</text>';
    if(v&&(i===mi||i===11||v>=mxv*.3)) h+='<text x="'+(x+bw/2)+'" y="'+(y-6)+'" text-anchor="middle" font-size="10" font-weight="600" fill="var(--x-tx)" font-family="JetBrains Mono,monospace">'+v+'</text>'; });
  h+='<line class="x5-avg" x1="'+L+'" x2="'+(W-R)+'" y1="'+ay+'" y2="'+ay+'"/><text class="x5-avgt" x="'+(L+4)+'" y="'+(ay-5)+'">TB 11 tháng đủ · '+fmt(avg,1)+'</text>';
  V.forEach(function(v,i){ h+='<rect x="'+(L+st*i)+'" y="'+T+'" width="'+st+'" height="'+(H-T-B)+'" fill="transparent" data-i="'+i+'" class="x5-hit"/>'; });
  s.innerHTML=h;
  $$('.x5-hit',s).forEach(function(el){ var i=+el.getAttribute('data-i'), b=s.querySelector('.x5-bar[data-i="'+i+'"]');
    el.onmousemove=function(e){ b.classList.add('hv'); var d=i?V[i]-V[i-1]:0; show(e,'<span class="x5-mono">THÁNG '+M[i].l+'</span><b>'+V[i]+' CV</b>'+(i===11?' · tính đến '+dd(now):i?' · '+(d>=0?'+':'')+d+' so với tháng trước':'')); };
    el.onmouseleave=function(){ b.classList.remove('hv'); hide(); }; });
  var last=V[10], prev=V[9], chg=prev?Math.round((last-prev)/prev*100):null, txt='Cao nhất <b>'+M[mi].l+': '+full[mi]+' CV</b> (gấp '+(avg?fmt(full[mi]/avg,1):'—')+' lần trung bình).';
  txt+=' Tháng '+M[10].l+': <b>'+last+' CV</b>'+(chg!=null?' ('+(chg>=0?'+':'')+chg+'% so với tháng trước)':'')+'. Tháng này đến hôm nay: '+V[11]+' CV.';
  var good=chg==null||chg>=0; $('#x5ins').innerHTML='<span class="x5-pill '+(good?'x5-p-ok':'x5-p-high')+'">'+(good?'Tốt':'Giảm')+'</span><span>'+txt+'</span>';
}

/* ---------- việc cần làm ---------- */
function todo(){ var L=perList(), ip=L.filter(function(x){return x.st==='ip';});
  var a=ip.filter(function(x){return x.lv===0;}).length, b=ip.filter(function(x){return x.lv===1;}).length, c=ip.filter(function(x){return x.lv===2||x.lv===3;}).length,
      d=ip.filter(function(x){return x.lv===4;}).length,
      e=D.ai.filter(function(r){ var hr=String(r.hr||'').trim(); return r.kl==='XEM TAY'&&(!hr||hr==='XEM XÉT')&&inPer({d:parseDMY(r.ngay)}); }).length;
  var T=[['inbox','CV chờ HR duyệt','Xem cột Nộp CV trên bản đồ',a,'var(--x-highbg)','var(--x-high)',[0]],
         ['user','Chờ Line Manager duyệt','Đã qua HR · xem cột HR duyệt',b,'var(--x-highbg)','var(--x-high)',[1]],
         ['cal','Ứng viên ở vòng phỏng vấn','Chờ vòng 1 hoặc vòng 2',c,'var(--x-normbg)','var(--x-norm)',[2,3]],
         ['flag','Chờ quyết định cuối','Đã qua vòng 2, chưa có kết quả',d,'var(--x-okbg)','var(--x-ok)',[4]],
         ['ai','AI đề nghị xem tay, HR chưa chốt','Kho CV › Chấm CV theo JD',e,'var(--x-accsoft)','var(--x-accink)','ai']];
  $('#x5todo').innerHTML=T.map(function(t,i){ return '<div class="x5-td" data-k="'+i+'"><span class="ico" style="background:'+t[4]+';color:'+t[5]+'">'+I[t[0]]+'</span><span><b>'+t[1]+'</b><small>'+t[2]+'</small></span><span style="display:flex;align-items:center;gap:10px"><span class="nn">'+t[3]+'</span><span class="x5-go">'+I.arrow+'</span></span></div>'; }).join('');
  $('#x5tdb').textContent=(a+b+c+d)+' hồ sơ đang chờ';
  $$('.x5-td').forEach(function(r){ r.onclick=function(){ var t=T[+r.getAttribute('data-k')];
    if(t[6]==='ai'){ try{ kcvTab='ai'; }catch(e){} go('kho-cv'); return; }
    S.st='ip'; S.hl=t[6]; segs(); drawMap(); $('#x5map').scrollIntoView({behavior:'smooth',block:'center'});
    clearTimeout(S.hlT); S.hlT=setTimeout(function(){ S.hl=null; $$('.x5-colhl').forEach(function(r){ r.remove(); }); },6000); }; });
}

})();
