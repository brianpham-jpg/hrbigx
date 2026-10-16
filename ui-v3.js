/* ============================================================
   BigX HR — ui-v3.js  (giao diện tối v7, mockup đã duyệt 08/10/2026)
   1) Sidebar thu gọn: cột icon 64px, rê chuột mở ngăn tính năng.
   2) Trang Tổng quan mới 5 tab (Tổng quan · Rủi ro · Phòng ban · Tuyển dụng · Báo cáo),
      biểu đồ động + đánh giá tự động dưới mỗi biểu đồ + hiệu ứng chuyển tab.
   KHÔNG sửa logic cũ: chỉ đọc HR.nhansu, HR.tuyendung, CVAI và dùng lại helper sẵn có
   (parseDMY, isLeft, ovActive, ovStaff, ovCanKy, ovGiaHan, ovBirthdays, tdFunnel, tdMonths, tdStage).
   Hàm renderOverview cũ vẫn còn trong app.js (gỡ file này là quay về bản cũ).
   ============================================================ */
(function(){
'use strict';

/* ================= 1. SIDEBAR ================= */
var TILE_GROUPS=['Tổng quan','Vận hành — dữ liệu gốc'];
function drawerHtml(){
  var tiles='', groups='';
  NAV.forEach(function(g){
    var isTile=TILE_GROUPS.indexOf(g.group)>=0;
    if(isTile){ g.items.forEach(function(it){ tiles+='<div class="nav-item v3-tile" id="nav-'+it.id+'" onclick="go(\''+it.id+'\')"><i class="ti '+it.icon+'"></i>'+(it.id==='overview'?'Tổng quan':it.label)+'</div>'; }); return; }
    groups+='<div class="v3-grp">'+g.group+(g.star?'<span class="star">★</span>':'')+'</div>'+g.items.map(function(it){
      var badge=(it.badge==='new'?'<span class="nav-badge new">Mới</span>':'')+(it.badge==='gộp'?'<span class="nav-badge new">Gộp</span>':'');
      return '<div class="nav-item" id="nav-'+it.id+'" onclick="go(\''+it.id+'\')"><i class="ti '+it.icon+'"></i><span>'+it.label+'</span>'+badge+'</div>';
    }).join('');
  });
  return '<div class="v3-drawer"><div class="v3-brand"><div class="v3-logo">B</div><div><b>BigX Agency</b><small>HR Analytics</small></div></div>'+
    '<div class="v3-tiles">'+tiles+'</div>'+groups+
    (window.BX_ROLE==='viewer'?'<div class="v3-foot"><div class="av">'+E(String(window.BX_USER||'?').slice(0,2).toUpperCase())+'</div><div><b>'+E(window.BX_USER||'')+'</b><small>Chỉ xem</small></div></div></div>':'<div class="v3-foot"><div class="av">BP</div><div><b>Brian Pham</b><small>HR Specialist</small></div></div></div>');
}
function railHtml(){
  var h='<div class="v3-rail"><div class="v3-logo">B</div>', sep=false;
  NAV.forEach(function(g){
    var isTile=TILE_GROUPS.indexOf(g.group)>=0;
    if(!isTile && !sep){ h+='<span class="v3-rsep"></span>'; sep=true; }
    g.items.forEach(function(it){ h+='<span class="v3-ri" data-id="'+it.id+'"><i class="ti '+it.icon+'"></i></span>'; });
  });
  return h+'</div>';
}
window.renderNav=function(){
  var sb=document.getElementById('sidebar'); if(!sb) return;
  sb.innerHTML=railHtml()+drawerHtml();
  markRail(window.currentTab||'overview');
};
function markRail(id){ [].forEach.call(document.querySelectorAll('.v3-ri'),function(el){ el.classList.toggle('on',el.getAttribute('data-id')===id); }); }
var prevGo=window.__v3PrevGo||window.go; window.__v3PrevGo=prevGo;
window.go=function(id){ prevGo.apply(this,arguments); try{ markRail(id); }catch(e){} };

/* ================= 2. TIỆN ÍCH ================= */
var C={s1:'#9377E6',s2:'#CF7F3F',s3:'#6A80DB',s4:'#23A08C',ink:'#E8ECF3',ink2:'#D2D8E3',mute:'#A7B0C2',line:'#263045',grid:'#222B3D',card:'#171E2E',good:'#4FBF8F',warn:'#E0A84A',bad:'#E36B6B',slate:'#2C3650'};
var FONT='"Be Vietnam Pro",system-ui,sans-serif';
var ANIM={animationDuration:1000,animationEasing:'cubicOut',animationDurationUpdate:600};
var TIP={trigger:'axis',backgroundColor:'#0B0F17',borderColor:'#2A3348',borderWidth:1,padding:[8,11],textStyle:{color:'#D5DAE3',fontFamily:FONT,fontSize:12},extraCssText:'border-radius:9px;box-shadow:0 8px 24px rgba(0,0,0,.4)'};
var VL={show:true,color:C.ink,fontSize:11.5,fontWeight:600,fontFamily:FONT};
function A(){ var o={}; for(var i=0;i<arguments.length;i++){ var s=arguments[i]; for(var k in s) o[k]=s[k]; } return o; }
function T(o){ return A(TIP,o||{}); }
function ax(data,o){ return A({type:'category',data:data,axisLine:{lineStyle:{color:C.line}},axisTick:{show:false},axisLabel:{color:C.mute,fontSize:11,fontFamily:FONT}},o||{}); }
function yax(o){ return A({type:'value',minInterval:1,splitLine:{lineStyle:{color:C.grid,type:[3,4]}},axisLabel:{color:C.mute,fontSize:11,fontFamily:FONT}},o||{}); }
var SHADOW={type:'shadow',shadowStyle:{color:'rgba(255,255,255,.04)'}};
function chart(id,opt){ var el=document.getElementById(id); if(!el||!window.echarts) return null;
  var c=echarts.getInstanceByDom(el)||echarts.init(el,null,{renderer:'svg'}); c.clear(); c.resize(); c.setOption(A(ANIM,opt)); return c; }
function E(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function P(a,b){ return b?Math.round(a/b*100):0; }
function sum(a){ return a.reduce(function(x,y){return x+y;},0); }
function vn1(x){ return (Math.round(x*10)/10).toFixed(1).replace('.',','); }
function today(){ var t=new Date(); t.setHours(23,59,59,0); return t; }
function days(a,b){ return Math.round((b-a)/864e5); }
function edate(d,n){ var y=d.getFullYear(), m=d.getMonth()+n, last=new Date(y,m+1,0).getDate(); return new Date(y,m,Math.min(d.getDate(),last)); }
function vao(e){ return parseDMY(e.ngayVao); }
function nghi(e){ return parseDMY(e.ngayNghi); }
function onAt(e,t){ var a=vao(e); if(!a||a>t) return false; if(!isLeft(e)) return true; var b=nghi(e); return !!b && b>t; }
function ph(e){ return (String(e.phong||'').trim())||'(trống)'; }
/* thử việc — cùng định nghĩa với tab Biến động (insights-v3): ký ≥2 bản = qua; nghỉ khi mới 1 bản = không qua */
function probStatus(e,t){ var a=vao(e); if(!a) return null; var s=+e.soBanKy||0;
  if(s>=2) return 'qua'; if(isLeft(e)) return 'khong'; if(s===0) return null; return edate(a,2)<=t?'trehan':'dang'; }
/* 12 tháng đã đủ, kết thúc ở tháng trước */
function months(n){ var t=new Date(), r=[]; for(var i=n;i>=1;i--){ var d=new Date(t.getFullYear(),t.getMonth()-i,1); r.push({y:d.getFullYear(),m:d.getMonth(),k:String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(),l:String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getFullYear()).slice(2)}); } return r; }
function inM(d,mm){ return d && d.getFullYear()===mm.y && d.getMonth()===mm.m; }
function evalBox(id,items){ var el=document.getElementById(id); if(!el) return;
  el.innerHTML='<div><h5>Đánh giá tự động</h5>'+items.filter(Boolean).map(function(x){return '<p class="'+x[0]+'">'+x[1]+'</p>';}).join('')+'</div>';
  [].forEach.call(el.querySelectorAll('p'),function(p,i){ setTimeout(function(){ p.classList.add('in'); },650+i*150); }); }
function countUp(root){ [].forEach.call(root.querySelectorAll('[data-to]'),function(el){ var to=+el.getAttribute('data-to')||0,t0=null; el.textContent=to;
  if(typeof requestAnimationFrame!=='function'||document.visibilityState!=='visible') return;
  function st(t){ if(!t0)t0=t; var k=Math.min(1,(t-t0)/900); el.textContent=Math.round(to*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(st); else el.textContent=to; }
  requestAnimationFrame(st); setTimeout(function(){ el.textContent=to; },1500); }); }
function grow(sel,attr){ setTimeout(function(){ [].forEach.call(document.querySelectorAll(sel),function(s,i){ setTimeout(function(){ s.style.width=s.getAttribute(attr||'data-w')+'%'; },i*120); }); },150); }

/* ================= 3. DỮ LIỆU ================= */
function data(){
  var ns=HR.nhansu||[], t=today(), act=ovActive(), staff=ovStaff(), M12=months(12);
  var d={ns:ns,t:t,act:act,staff:staff,M12:M12};
  d.left=ns.filter(isLeft); d.leftNoDate=d.left.filter(function(e){return !nghi(e);});
  d.flow=function(ms){ return {vao:ms.map(function(mm){return ns.filter(function(e){return inM(vao(e),mm);}).length;}),
                               nghi:ms.map(function(mm){return ns.filter(function(e){return isLeft(e)&&inM(nghi(e),mm);}).length;})}; };
  d.F12=d.flow(M12);
  var t30=new Date(t); t30.setDate(t30.getDate()-30); d.hc30=ns.filter(function(e){return onAt(e,t30)&&!/^adviser$/i.test(String(e.tinhTrang||'').trim());}).length;
  d.hc30all=ns.filter(function(e){return onAt(e,t30);}).length;
  // thử việc
  d.prob=ns.map(function(e){return {e:e,s:probStatus(e,t)};}).filter(function(x){return x.s;});
  d.qua=d.prob.filter(function(x){return x.s==='qua';}).length; d.khong=d.prob.filter(function(x){return x.s==='khong';}).length;
  d.tv=d.prob.filter(function(x){return x.s==='dang'||x.s==='trehan';}).map(function(x){var a=vao(x.e),end=edate(a,2);return {e:x.e,a:a,end:end,left:days(t,end)};}).sort(function(a,b){return a.left-b.left;});
  // phòng ban: phòng ≥3 người đang làm đứng riêng, còn lại gộp "Khác"; không tính BOD
  var cnt={}; staff.forEach(function(e){ cnt[ph(e)]=(cnt[ph(e)]||0)+1; });
  var big=Object.keys(cnt).filter(function(k){return cnt[k]>=3;}).sort(function(a,b){return cnt[b]-cnt[a];});
  d.grp=function(e){ var p=ph(e); return p==='BOD'?null:(big.indexOf(p)>=0?p:'Khác'); };
  var small=Object.keys(cnt).filter(function(k){return big.indexOf(k)<0;});
  d.khacList=small; var y1=new Date(t); y1.setFullYear(y1.getFullYear()-1);
  d.depts=big.concat(small.length?['Khác']:[]).map(function(g){
    var all=ns.filter(function(e){return d.grp(e)===g;}), pr=d.prob.filter(function(x){return d.grp(x.e)===g;});
    return {n:g, hc:staff.filter(function(e){return d.grp(e)===g;}).length,
      vao:all.filter(function(e){var a=vao(e);return a&&a>y1;}).length,
      left:all.filter(function(e){var b=nghi(e),a=vao(e);return isLeft(e)&&((b&&b>y1)||(!b&&a&&a>y1));}).length,
      pass:pr.filter(function(x){return x.s==='qua';}).length, fail:pr.filter(function(x){return x.s==='khong';}).length,
      tv:pr.filter(function(x){return x.s==='dang'||x.s==='trehan';}).length};
  });
  // tuyển dụng
  var td=HR.tuyendung||[]; d.td=td; d.fun=tdFunnel(td);
  var mo=tdMonths(td), byK={}; mo.forEach(function(x){byK[x.k]=x.n;});
  var tm=new Date(); d.CVM=[]; for(var i=11;i>=0;i--){ var dd=new Date(tm.getFullYear(),tm.getMonth()-i,1),k=String(dd.getMonth()+1).padStart(2,'0')+'/'+dd.getFullYear(); d.CVM.push({k:k,l:k.slice(0,3)+k.slice(-2),n:byK[k]||0,cur:i===0}); }
  return d;
}

/* ================= 4. KHUNG TRANG ================= */
var TABS=[['rec','Tuyển dụng']]; // 16/10/2026: web chỉ còn tuyển dụng (gỡ Tổng quan · Rủi ro · Phòng ban · Báo cáo tháng)
var cur='rec', D=null, flowN=12, todoTab='tv', selDept=null;
window.renderOverview=function(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  setTimeout(initV3,30);
  var now=new Date(), h=now.getHours(), chao=h<11?'Chào buổi sáng':h<14?'Chào buổi trưa':h<18?'Chào buổi chiều':'Chào buổi tối';
  var thu=['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][now.getDay()];
  var P_=function(id,inner){ if(!TABS.some(function(t){return t[0]===id;})) return ''; return '<section class="v3-panel'+(cur===id?' show':'')+'" id="v3p-'+id+'">'+inner+'</section>'; };
  return '<div class="v3"><div class="v3-top"><nav class="v3-tabs" id="v3tabs"><span class="v3-pill" id="v3pill"></span>'+
    TABS.map(function(t){return '<button class="v3-tab'+(cur===t[0]?' on':'')+'" data-t="'+t[0]+'">'+t[1]+'</button>';}).join('')+
    '</nav></div>'+
  P_('rec','<div class="v3-ptitle">Tuyển dụng</div><div class="v3-psub">File Tuyển dụng · AI Chấm CV</div>'+
    '<div class="v3-row v3-r2"><div class="v3-card"><h3>CV nhận theo tháng</h3><div class="sub">Theo Ngày nộp · 12 tháng gần nhất (tháng này tính đến hôm nay)</div><div id="v3cv" class="v3-ch"></div><div class="v3-eval" id="ve_cv"></div></div>'+
    '<div class="v3-card"><h3>AI chấm CV theo JD</h3><div class="sub">Từ tab Kho CV › Chấm CV theo JD</div><div id="v3ai"></div><div class="v3-eval" id="ve_ai"></div></div></div>'+
    '<div class="v3-row v3-r11"><div class="v3-card"><h3>Phễu tuyển dụng</h3><div class="sub">Cùng cách tính tab Tuyển dụng (qua bước sau = đã qua bước trước)</div><div class="v3-fun" id="v3fun"></div><div class="v3-eval" id="ve_fun"></div></div>'+
    '<div class="v3-card"><h3>Kết quả sau Line Manager</h3><div class="sub">CV Line Manager đánh giá phù hợp · kết quả hiện tại</div><div id="v3mgr" class="v3-ch"></div><div class="v3-eval" id="ve_mgr"></div></div></div>')+
  '</div>';
};

function movePill(){ var b=document.querySelector('.v3-tab.on'), p=document.getElementById('v3pill'); if(!b||!p) return; p.style.width=b.offsetWidth+'px'; p.style.transform='translateX('+b.offsetLeft+'px)'; }
var R={};
function initV3(){
  if(!document.getElementById('v3tabs')) return;
  try{ D=data(); }catch(e){ console.warn('[v3] data',e); return; }
  [].forEach.call(document.querySelectorAll('.v3-tab'),function(b){ b.onclick=function(){ switchTab(b.getAttribute('data-t')); }; });
  movePill(); runTab(cur);
  try{ if(!aiData() && window.cvaiLoad && !(window.CVAI&&CVAI.loading)) cvaiLoad(); }catch(e){}
}
var busy=false;
function switchTab(t){ if(t===cur||busy) return; busy=true;
  var o=document.getElementById('v3p-'+cur), n=document.getElementById('v3p-'+t);
  [].forEach.call(document.querySelectorAll('.v3-tab'),function(b){ b.classList.toggle('on',b.getAttribute('data-t')===t); }); movePill();
  var on=document.querySelector('.v3-tab.on'); if(on&&on.scrollIntoView) on.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
  o.classList.remove('show'); o.classList.add('out');
  setTimeout(function(){ o.classList.remove('out'); n.classList.add('show'); cur=t; runTab(t); busy=false; var c=document.getElementById('content'); if(c) c.scrollTop=0; },170);
}
function runTab(t){ try{ R[t](); }catch(e){ console.warn('[v3] '+t,e); } }
window.addEventListener('resize',function(){ movePill(); [].forEach.call(document.querySelectorAll('.v3 [_echarts_instance_]'),function(el){ var c=echarts.getInstanceByDom(el); if(c) c.resize(); }); });

/* ================= 5. TAB TỔNG QUAN ================= */

/* ================= 6. TAB RỦI RO ================= */

/* ================= 7. TAB PHÒNG BAN ================= */

/* ================= 8. TAB TUYỂN DỤNG ================= */
function aiData(){
  var D2=(window.CVAI&&CVAI.data)||null;
  if(!D2){ try{ var c=JSON.parse(localStorage.getItem('bigx_cvai_cache_v1')||'null'); if(c&&c.ok) D2=c; }catch(e){} }
  if(!D2||!D2.rows) return null;
  var rows=D2.rows, c=function(k){return rows.filter(function(r){return r.kl===k;}).length;}, pass=rows.filter(function(r){return r.hr==='SCAN CV PASS';});
  return {all:rows.length,dat:c('ĐẠT'),xem:c('XEM TAY'),khong:c('KHÔNG ĐẠT'),pass:pass.length,agree:pass.filter(function(r){return r.kl==='ĐẠT';}).length,pending:D2.pending||0};
}
var aiWait=0;
R.rec=function(){
  var d=D, cvv=d.CVM.map(function(x){return x.n;}), mx=Math.max.apply(0,cvv);
  chart('v3cv',{grid:{left:34,right:8,top:24,bottom:26},tooltip:T({axisPointer:SHADOW,formatter:function(p){return p[0].name+': <b style="color:#fff">'+p[0].value+'</b> CV';}}),
    xAxis:ax(d.CVM.map(function(x){return x.l;})),yAxis:yax(),series:[{type:'bar',barMaxWidth:22,data:cvv.map(function(v,i){return {value:v,itemStyle:{color:v===mx&&v>0?C.s4:i===11?'#23A08C66':'#1F5F59',borderRadius:[4,4,0,0]}};}),
      label:A(VL,{position:'top',formatter:function(p){return p.value&&p.value>=mx*.25?p.value:'';}}),animationDelay:function(i){return i*70;}}]});
  var full=cvv.slice(0,11), rest=full.filter(function(v){return v!==mx;}), avg=rest.length?sum(rest)/rest.length:0, low=d.CVM.slice(0,11).filter(function(x){return x.n<avg/3;});
  evalBox('ve_cv',[mx?['g','Cao nhất '+d.CVM[cvv.indexOf(mx)].l+': <b>'+mx+' CV</b>'+(avg?', gấp ~'+Math.max(1,Math.round(mx/avg))+' lần trung bình các tháng còn lại ('+Math.round(avg)+').':'.')]:null,
    low.length?['w','Tháng rất ít CV (dưới 1/3 trung bình): '+low.map(function(x){return x.l+' ('+x.n+')';}).join(', ')+'. Nguồn CV chưa đều.']:null,
    ['i','Tháng này đến hôm nay: '+cvv[11]+' CV.']]);
  drawAI();
  var f=d.fun, h='', drops=[];
  f.forEach(function(s,i){ if(i){ var r=P(s.n,f[i-1].n); drops.push(r); h+='<div class="v3-drop'+(r<20?' big':'')+'">↓ '+r+'% đi tiếp</div>'; }
    h+='<div class="v3-fs"><div class="lab"><span>'+s.label+'</span><b>'+s.n+'</b></div><div class="v3-bar"><span data-w="'+(f[0].n?s.n/f[0].n*100:0)+'" style="background:'+(i===f.length-1?C.s4:['#7B4FD6','#8C66DC','#9A7FE3','#A48CE6','#B09BEA'][i])+'"></span></div></div>'; });
  document.getElementById('v3fun').innerHTML=h; grow('#v3fun .v3-bar span');
  var wi=drops.indexOf(Math.min.apply(0,drops));
  evalBox('ve_fun',[wi>=0?['r','Rơi nhiều nhất: <b>'+f[wi].label+' → '+f[wi+1].label+'</b>, chỉ '+drops[wi]+'% đi tiếp.']:null,
    f[5].n?['i','Tỉ lệ chung '+vn1(f[5].n/f[0].n*100)+'%: khoảng '+Math.round(f[0].n/f[5].n)+' CV mới có 1 người trúng tuyển.']:null]);
  // sau Line Manager
  var lm=d.td.filter(function(c){ var K=['lmReview','r1','r2','final'], ok=String(c.lmReview||'').trim()===TDPASS.lm; if(String(c.r1||'').trim()===TDPASS.r1||String(c.r2||'').trim()===TDPASS.r2||String(c.final||'').trim()===TDPASS.fin) ok=true; return ok; });
  var g={'Trúng tuyển':0,'Không đạt':0,'Từ chối / huỷ':0,'Đang xử lý':0};
  lm.forEach(function(c){ var fn=String(c.final||'').trim(), all=[c.final,c.r2,c.r1].map(function(v){return String(v||'').trim();}).join('|');
    if(fn===TDPASS.fin) g['Trúng tuyển']++; else if(/TỪ CHỐI|CANCEL|KHÔNG THAM GIA/.test(all)) g['Từ chối / huỷ']++; else if(tdStage(c).bucket==='loai') g['Không đạt']++; else g['Đang xử lý']++; });
  var cols={'Không đạt':C.bad,'Trúng tuyển':C.good,'Từ chối / huỷ':C.warn,'Đang xử lý':C.s3}, keys=Object.keys(g).filter(function(k){return g[k];}), tot=lm.length;
  chart('v3mgr',{tooltip:{trigger:'item',backgroundColor:'#0B0F17',borderColor:'#2A3348',textStyle:{color:'#D5DAE3',fontFamily:FONT,fontSize:12},formatter:function(p){return p.name+': <b style="color:#fff">'+p.value+'</b> · '+p.percent+'%';}},
    legend:{orient:'vertical',right:0,top:'middle',icon:'circle',itemWidth:8,textStyle:{color:C.ink2,fontFamily:FONT,fontSize:12},formatter:function(n){return n+'  '+g[n];}},
    series:[{type:'pie',radius:['52%','74%'],center:['36%','50%'],itemStyle:{borderColor:C.card,borderWidth:3},label:{show:false},data:keys.map(function(k){return {name:k,value:g[k],itemStyle:{color:cols[k]}};}),animationType:'expansion',animationDuration:1200}]});
  evalBox('ve_mgr',[tot?['i','<b>'+tot+'</b> CV đã được Line Manager đánh giá phù hợp.']:null,
    g['Không đạt']?['r','<b>'+P(g['Không đạt'],tot)+'%</b> vẫn Không đạt ở các vòng sau.']:null,
    g['Từ chối / huỷ']?['w',g['Từ chối / huỷ']+' ứng viên từ chối / huỷ ('+P(g['Từ chối / huỷ'],tot)+'%). Nên ghi lý do để biết nguyên nhân.']:null,
    g['Trúng tuyển']?['g',g['Trúng tuyển']+' người trúng tuyển ('+P(g['Trúng tuyển'],tot)+'%).']:null]);
};
function drawAI(){
  var el=document.getElementById('v3ai'); if(!el) return; var a=aiData();
  if(!a){ el.innerHTML='<div class="v3-empty">Đang tải kết quả AI chấm CV…</div>'; evalBox('ve_ai',[]);
    if(window.cvaiLoad&&!(window.CVAI&&CVAI.loading)) try{ cvaiLoad(); }catch(e){}
    if(aiWait<20){ aiWait++; setTimeout(function(){ if(cur==='rec'&&document.getElementById('v3ai')) drawAI(); },1000); } return; }
  aiWait=0;
  el.innerHTML='<div class="v3-big"><span data-to="'+a.all+'">'+a.all+'</span> <span style="font-size:13px;color:var(--muted);font-weight:400">CV đã chấm</span></div>'+
    '<div class="v3-stack"><span data-w="'+P(a.dat,a.all)+'" style="background:var(--good)">'+a.dat+'</span><span data-w="'+P(a.xem,a.all)+'" style="background:var(--warn)">'+a.xem+'</span><span data-w="'+P(a.khong,a.all)+'" style="background:var(--bad)">'+a.khong+'</span></div>'+
    '<div class="v3-ai"><div>Đạt<b>'+a.dat+'</b></div><div>Xem tay<b>'+a.xem+'</b></div><div>Không đạt<b>'+a.khong+'</b></div></div>';
  countUp(el); grow('#v3ai .v3-stack span');
  evalBox('ve_ai',[['i','<b>'+P(a.dat,a.all)+'%</b> CV đạt JD; '+P(a.xem,a.all)+'% cần HR xem tay.'],
    a.pass?[P(a.agree,a.pass)>=70?'g':'w','Khớp HR <b>'+P(a.agree,a.pass)+'%</b>: '+a.agree+'/'+a.pass+' CV HR đã PASS được AI chấm Đạt.']:null,
    [a.pending?'w':'g',a.pending?a.pending+' CV mới đang chờ chấm.':'Không còn CV chờ chấm.']]);
}

/* ================= 9. TAB BÁO CÁO ================= */


/* ================= 9b. CHẾ ĐỘ CHỈ XEM (viewer) =================
   Ẩn nút nạp CV / chấm AI; mở Kho CV thẳng vào tab kết quả. Lệnh ghi còn bị chặn ở index.html và máy chủ. */
if(window.kcvSwitch){ var _kcvS=window.kcvSwitch; window.kcvSwitch=function(t){ if(window.BX_ROLE==='viewer'&&t==='nap'){ t='ai'; } return _kcvS(t); }; }
var _goV=window.go; window.go=function(id){ if(window.BX_ROLE==='viewer'&&id==='kho-cv'&&window.kcvTab==='nap') window.kcvTab='ai'; return _goV.apply(this,arguments); };

/* ================= 9c. KHO CV: TỰ ĐIỀN EMAIL / SĐT / GIỚI TÍNH NGAY KHI CHỌN FILE =================
   Bước 1 (trên trình duyệt, ~1 giây): PDF có chữ (pdf.js, đọc cả link mailto:/tel:), DOCX (đọc cả header/footer + link).
   Bước 2 (chỉ khi bước 1 còn thiếu email hoặc SĐT): gửi file cho Apps Script đọc bằng Google Drive OCR
   → đọc được ảnh, PDF scan, .doc cũ. Chỉ đọc, KHÔNG lưu gì vào Drive/Sheet (file tạm xoá ngay).
   Chỉ điền ô còn trống, không ghi đè thứ anh đã gõ. Ô tự điền có viền tím để anh kiểm tra lại. */
var CVX={pdf:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',worker:'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',zip:'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'};
var cvxLoaded={};
function cvxLoad(src){ if(cvxLoaded[src]) return cvxLoaded[src];
  return (cvxLoaded[src]=new Promise(function(res,rej){ var sc=document.createElement('script'); sc.src=src; sc.onload=res; sc.onerror=function(){ delete cvxLoaded[src]; rej(new Error('load '+src)); }; document.head.appendChild(sc); })); }
function cvxPdf(file){
  return cvxLoad(CVX.pdf).then(function(){ var lib=window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc=CVX.worker;
    return file.arrayBuffer().then(function(buf){ return lib.getDocument({data:buf}).promise; }).then(function(pdf){
      var jobs=[], links=[], max=Math.min(pdf.numPages,4);
      for(var i=1;i<=max;i++) jobs.push(pdf.getPage(i).then(function(pg){
        return Promise.all([pg.getTextContent(), pg.getAnnotations().catch(function(){return [];})]).then(function(r){
          r[1].forEach(function(an){ if(an.url) links.push(an.url); });
          // ghép chữ theo vị trí: cùng dòng + sát nhau thì không chèn khoảng trắng (tránh tách đôi email)
          var out='', prev=null;
          r[0].items.forEach(function(it){ if(!it.str) return; var x=it.transform[4], y=it.transform[5];
            if(prev){ if(Math.abs(y-prev.y)>2) out+='\n'; else if(x-(prev.x+prev.w)>1.5) out+=' '; }
            out+=it.str; prev={x:x,y:y,w:it.width||0}; if(it.hasEOL){ out+='\n'; prev=null; } });
          return out; }); }));
      return Promise.all(jobs).then(function(a){ return {text:a.join('\n'), links:links}; }); }); });
}
function cvxDocx(file){
  return cvxLoad(CVX.zip).then(function(){ return file.arrayBuffer(); }).then(function(buf){ return window.JSZip.loadAsync(buf); }).then(function(z){
    var names=Object.keys(z.files).filter(function(n){ return /^word\/(document|header\d*|footer\d*|footnotes)\.xml$/.test(n)||/^word\/_rels\/.*\.rels$/.test(n); });
    return Promise.all(names.map(function(n){ return z.file(n).async('string').then(function(x){ return {n:n,x:x}; }); })).then(function(parts){
      var text=[], links=[];
      parts.forEach(function(p){
        if(/\.rels$/.test(p.n)){ (p.x.match(/Target="[^"]+"/g)||[]).forEach(function(t){ links.push(t.slice(8,-1).replace(/&amp;/g,'&')); }); return; }
        text.push(p.x.replace(/<w:tab\/>/g,' ').replace(/<\/w:p>|<w:br\/>/g,'\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'));
      });
      return {text:text.join('\n'), links:links}; }); });
}
function cvxBrowser(file){ var n=String(file.name||'').toLowerCase(), t=String(file.type||'');
  if(/\.pdf$/.test(n)||/pdf/.test(t)) return cvxPdf(file);
  if(/\.docx$/.test(n)) return cvxDocx(file);
  return Promise.resolve({text:'',links:[]}); }
function cvxServer(file){
  return readB64(file).then(function(b64){
    return window.bxAuthedFetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key:API_KEY,action:'cvxOcr',fileName:file.name,mimeType:file.type||'',b64:b64})}); })
    .then(function(r){ return r.json(); }).then(function(d){ if(!d||!d.ok) throw new Error((d&&d.error)||'OCR lỗi'); return {text:d.text||'',links:[]}; });
}
/* Bộ tách email / SĐT / giới tính từ chữ trong CV — dùng chung cho mọi định dạng (PDF, DOCX, ảnh qua OCR). */
function cvxParse(text, links){
  var o={}; text=String(text||''); links=links||[];
  /* ---- EMAIL ---- */
  var t=text.replace(/ /g,' ')
    .replace(/\s*[\[(]\s*(?:at|a còng)\s*[\])]\s*/gi,'@')
    .replace(/\s*@\s*/g,'@')
    .replace(/@([A-Za-z0-9\-]+)\s*(?:\.|\[dot\]|\(dot\))\s*([A-Za-z]{2,})\b/gi,'@$1.$2');
  var emRe=/[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}/g, ems=[];
  links.forEach(function(u){ var m=String(u).match(/^mailto:([^?]+)/i); if(m) ems.push({v:decodeURIComponent(m[1]).trim(),s:100}); });
  var m; while((m=emRe.exec(t))){ var pre=t.slice(Math.max(0,m.index-25),m.index).toLowerCase();
    ems.push({v:m[0].replace(/^[._\-]+|[._\-]+$/g,''),s:(/mail|e-mail|liên hệ|contact/.test(pre)?20:0)-m.index/1e6}); }
  ems=ems.filter(function(x){ return !/\.(png|jpe?g|gif|pdf)$/i.test(x.v) && !/@(example|domain|email)\./i.test(x.v); });
  if(ems.length){ ems.sort(function(a,b){return b.s-a.s;}); o.email=ems[0].v.toLowerCase(); }
  /* ---- SĐT ---- */
  function norm(raw){ var d=String(raw).replace(/[^\d]/g,'');
    if(/^840\d{9}$/.test(d)) d=d.slice(2);            // +84 (0) 912 345 678
    else if(/^84\d{9}$/.test(d)) d='0'+d.slice(2);    // +84 912 345 678
    else if(/^[35789]\d{8}$/.test(d)) d='0'+d;        // thiếu số 0 đầu
    return (/^0[35789]\d{8}$/.test(d)||/^02\d{9}$/.test(d)) ? d : null; }
  var ph=[];
  links.forEach(function(u){ var mm=String(u).match(/^(?:tel|callto|sms):(.+)$/i); if(mm){ var n=norm(decodeURIComponent(mm[1])); if(n) ph.push({v:n,s:100}); }
    var z=String(u).match(/(?:zalo\.me|wa\.me)\/(\+?\d{9,12})/i); if(z){ var n2=norm(z[1]); if(n2) ph.push({v:n2,s:60}); } });
  var t2=text.replace(/ /g,' '), phRe=/(?:\+[ \t]?)?\(?\d[\d \t.\-()]{7,20}\d/g; // không vượt qua xuống dòng
  while((m=phRe.exec(t2))){
    var raw=m[0], digits=raw.replace(/[^\d]/g,'');
    if(digits.length<9||digits.length>22) continue;
    var n=norm(raw);
    if(!n){ // dính thêm nhóm số phía sau (VD "0912 345 678 2019") → bỏ dần từng nhóm cuối
      var parts=raw.split(/[ \t]+/); while(!n && parts.length>1){ parts.pop(); n=norm(parts.join(' ')); }
      if(!n) continue; raw=parts.join(' '); }
    var pre2=t2.slice(Math.max(0,m.index-30),m.index).toLowerCase(), post=t2.slice(m.index+raw.length,m.index+raw.length+3);
    if(/\d/.test(post.charAt(0))) continue;
    var sc=/^0[35789]/.test(n)?10:0;
    if(/(công ty|cong ty|company|văn phòng|office|fax)/.test(pre2)) sc-=20;
    if(/(phone|mobile|tel|sđt|sdt|điện thoại|dien thoai|đt|liên hệ|hotline|zalo|di động|contact|số điện)/.test(pre2)) sc+=30;
    if(/(cccd|cmnd|căn cước|mst|mã số thuế|stk|tài khoản|account|id)/.test(pre2)) sc-=50;
    if(/^0(1|2)\d\/|\d{1,2}\/\d{1,2}\/\d{4}/.test(raw)) sc-=50; // ngày tháng
    ph.push({v:n,s:sc-m.index/1e6});
  }
  if(ph.length){ ph.sort(function(a,b){return b.s-a.s;}); if(ph[0].s>-40) o.sdt=ph[0].v; }
  /* ---- GIỚI TÍNH ---- */
  var g=text.match(/giới\s*tính\s*[:.\-|]*\s*(nam|nữ)(?![A-Za-zÀ-ỹ])/i)||text.match(/(?:gender|sex)\s*[:.\-|]*\s*(male|female)(?![A-Za-z])/i);
  if(g){ var v=g[1].toLowerCase(); o.gt=(v==='nam'||v==='male')?'Nam':'Nữ'; }
  return o;
}

function cvxStatus(msg){ var el=document.getElementById('kcv-status'); if(el) el.textContent=msg||''; }
var cvxBusy=0;
function cvxApply(f,o){ f.auto=f.auto||{};
  if(o.email&&!String(f.email||'').trim()){ f.email=o.email; f.auto.email=1; }
  if(o.sdt&&!String(f.sdt||'').trim()){ f.sdt=o.sdt; f.auto.sdt=1; }
  if(o.gt&&!String(f.gt||'').trim()){ f.gt=o.gt; f.auto.gt=1; } }
function cvxNeed(f){ return !String(f.email||'').trim()||!String(f.sdt||'').trim(); }
function cvxRun(f){
  if(f.__cvx) return; f.__cvx='doc'; cvxBusy++; cvxStatus('Đang đọc CV để tự điền email / SĐT…');
  function redraw(){ if(window.kcvRenderList) kcvRenderList(); }
  cvxBrowser(f.file).catch(function(e){ console.warn('[cvx] browser',e); return {text:'',links:[]}; })
  .then(function(r){ f.__text=String(r.text||''); cvxApply(f,cvxParse(r.text,r.links)); redraw();
    if(!cvxNeed(f)) return 'ok';
    f.__cvx='ocr'; redraw();
    return cvxServer(f.file).then(function(r2){ if(String(r2.text||'').length>f.__text.length) f.__text=String(r2.text); cvxApply(f,cvxParse(r2.text,[])); return 'ok'; }).catch(function(e){ console.warn('[cvx] ocr',e); return 'loi'; }); })
  .then(function(st){ f.__cvx=st; })
  .then(function(){ cvxBusy--; redraw(); if(!cvxBusy) cvxStatus(''); });
}
if(window.kcvPick){ var _kcvPick=window.kcvPick; window.kcvPick=function(ev){ var r=_kcvPick.apply(this,arguments); try{ (window.kcvFiles||[]).forEach(cvxRun); }catch(e){} return r; }; }
if(window.kcvRenderList){ var _kcvRL=window.kcvRenderList; window.kcvRenderList=function(){ var r=_kcvRL.apply(this,arguments);
  try{ var rows=document.querySelectorAll('#kcv-list .kcv-file');
    (window.kcvFiles||[]).forEach(function(f,i){ var row=rows[i]; if(!row) return; var a=f.auto||{};
      [['.kcv-email','email','input'],['.kcv-sdt','sdt','input'],['.kcv-gt','gt','change']].forEach(function(q){ var el=row.querySelector(q[0]); if(!el||!a[q[1]]) return;
        el.classList.add('v3-auto'); el.title='Tự điền từ CV, kiểm tra lại'; el.addEventListener(q[2],function(){ delete a[q[1]]; el.classList.remove('v3-auto'); }); });
      var msg='';
      if(f.__cvx==='doc') msg='Đang đọc CV…';
      else if(f.__cvx==='ocr') msg='CV dạng ảnh / scan, đang nhờ Google đọc chữ (5–15 giây)…';
      else if(f.__cvx==='loi') msg='Chưa đọc được tự động, anh nhập tay hoặc cứ nạp, hệ thống sẽ đọc lại';
      else if(f.__cvx==='ok'&&cvxNeed(f)) msg='CV không ghi '+(!String(f.email||'').trim()?'email':'')+(!String(f.email||'').trim()&&!String(f.sdt||'').trim()?' / ':'')+(!String(f.sdt||'').trim()?'SĐT':'');
      if(msg) row.setAttribute('data-cvx',msg); else row.removeAttribute('data-cvx');
    }); }catch(e){}
  return r; }; }

/* [CVAI-TEXT] Chấm CV không cần Google OCR: web gửi kèm chữ đã đọc được khi nạp CV,
   và trước khi bấm "Chấm" thì đọc chữ các CV đang chờ ngay trên trình duyệt. */
(function(){
  var _f=window.fetch;
  window.fetch=function(url,opts){
    try{ if(opts&&String(opts.method||'').toUpperCase()==='POST'&&typeof opts.body==='string'&&typeof API_URL!=='undefined'&&String(url).indexOf(API_URL)===0&&opts.body.indexOf('"items":[')>-1){
      var b=JSON.parse(opts.body), fs=window.kcvFiles||[];
      if(!b.action&&Array.isArray(b.items)){ b.items.forEach(function(it,i){ var f=fs[i]; if(f&&f.file&&f.file.name===it.fileName&&f.__text&&f.__text.length>150) it.text=f.__text.slice(0,45000); });
        opts=Object.assign({},opts,{body:JSON.stringify(b)}); } } }catch(e){ console.warn('[cvai-text] inject',e); }
    return _f.call(this,url,opts); };
})();
function cvaiB64File(d){ var bin=atob(d.b64), u=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
  return new File([u], d.name||'cv', {type:d.mime||''}); }
function cvaiMsgOf(d,pre){
  if(d.busy) return 'Hệ thống đang chấm ở một lượt khác, thử lại sau ít phút.';
  var e=(d.errors||[]).join(' '), m='Đã chấm '+(d.done||0)+' CV · còn '+(d.left||0)+' CV chờ';
  if(/DRIVE_OCR_LIMIT/.test(e)) m+=' · CV dạng ảnh/scan: Google tạm giới hạn lượt đọc chữ, lượt chấm tự động sau sẽ làm tiếp';
  else if(/GEMINI_BUSY|429|503|quota|RESOURCE_EXHAUSTED/i.test(e)) m+=' · Gemini đang quá tải, lượt chấm tự động sau (mỗi giờ) làm tiếp';
  else if(e) m+=' · lỗi: '+e.slice(0,300);
  return (pre?pre+' · ':'')+m; }
function cvaiPrepText(){
  var A=window.bxAuthedFetch||fetch, n=0, ok=0;
  return A(API_URL+'?action=cvaiPending',{cache:'no-store'}).then(function(r){ return r.json(); }).then(function(d){
    if(!d||!d.ok) return '';
    var need=(d.list||[]).filter(function(p){ return !p.hasText&&p.fileId; }).slice(0,10); n=need.length;
    return need.reduce(function(pr,p,i){ return pr.then(function(){
      CVAI.msg='Đang đọc chữ CV '+(i+1)+'/'+n+' trên trình duyệt…'; if(currentTab==='kho-cv') go('kho-cv');
      return A(API_URL+'?action=cvaiFile&id='+encodeURIComponent(p.fileId),{cache:'no-store'}).then(function(r){ return r.json(); })
        .then(function(fd){ if(!fd||!fd.ok) throw new Error((fd&&fd.error)||'tải file lỗi'); return cvxBrowser(cvaiB64File(fd)); })
        .then(function(t){ var txt=String((t&&t.text)||'').trim(); if(txt.length<=150) return;
          return A(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key:API_KEY,action:'cvaiText',ma:p.ma,text:txt.slice(0,45000),nguon:'web · nút chấm'})})
            .then(function(r){ return r.json(); }).then(function(x){ if(x&&x.ok&&x.saved) ok++; }); })
        .catch(function(e){ console.warn('[cvai-text] '+p.ma,e); }); }); }, Promise.resolve())
      .then(function(){ return n?('Đọc được chữ '+ok+'/'+n+' CV ngay trên web'+(ok<n?' (còn lại là ảnh/scan, cần Google đọc)':'')):''; });
  }).catch(function(e){ console.warn('[cvai-text] pending',e); return ''; });
}
window.cvaiRun=function(){
  if(CVAI.running) return; CVAI.running=true; CVAI.msg='Đang kiểm tra CV chờ chấm…'; go('kho-cv');
  cvaiPrepText().then(function(pre){
    CVAI.msg=(pre?pre+' · ':'')+'Đang chấm… (mỗi CV ~10 giây, tối đa 10 CV/lần)'; if(currentTab==='kho-cv') go('kho-cv');
    var opt={method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({key:API_KEY,action:'cvaiRun',limit:10})};
    return (window.bxAuthedFetch?window.bxAuthedFetch(API_URL,opt):fetch(API_URL,opt)).then(function(r){ return r.json(); })
      .then(function(d){ CVAI.msg=cvaiMsgOf(d,pre); }); })
  .catch(function(e){ CVAI.msg='Lỗi kết nối: '+e.message; })
  .then(function(){ CVAI.running=false; CVAI.loaded=false; CVAI.fresh=true; cvaiLoad(); });
};

/* ================= 10. KHỞI ĐỘNG MUỘN =================
   Đăng nhập Firebase có thể xong TRƯỚC khi file này tải xong → app đã boot bằng sidebar/trang cũ.
   Trường hợp đó vẽ lại sidebar + trang hiện tại bằng bản mới. */
if(window.__bxAppBooted){ try{ window.renderNav(); if(window.currentTab) window.go(window.currentTab); }catch(e){ console.warn('[v3] late boot',e); } }
})();
