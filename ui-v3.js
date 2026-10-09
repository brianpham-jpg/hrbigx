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
var C={s1:'#9377E6',s2:'#CF7F3F',s3:'#6A80DB',s4:'#23A08C',ink:'#E8ECF3',ink2:'#B4BCCB',mute:'#8A94A8',line:'#263045',grid:'#222B3D',card:'#171E2E',good:'#4FBF8F',warn:'#E0A84A',bad:'#E36B6B',slate:'#2C3650'};
var FONT='"Be Vietnam Pro",system-ui,sans-serif';
var ANIM={animationDuration:1000,animationEasing:'cubicOut',animationDurationUpdate:600};
var TIP={trigger:'axis',backgroundColor:'#0B0F17',borderColor:'#2A3348',borderWidth:1,padding:[8,11],textStyle:{color:'#D5DAE3',fontFamily:FONT,fontSize:12},extraCssText:'border-radius:9px;box-shadow:0 8px 24px rgba(0,0,0,.4)'};
var VL={show:true,color:C.ink,fontSize:11.5,fontWeight:600,fontFamily:FONT};
function A(){ var o={}; for(var i=0;i<arguments.length;i++){ var s=arguments[i]; for(var k in s) o[k]=s[k]; } return o; }
function T(o){ return A(TIP,o||{}); }
function ax(data,o){ return A({type:'category',data:data,axisLine:{lineStyle:{color:C.line}},axisTick:{show:false},axisLabel:{color:C.mute,fontSize:11,fontFamily:FONT}},o||{}); }
function yax(o){ return A({type:'value',minInterval:1,splitLine:{lineStyle:{color:C.grid,type:[3,4]}},axisLabel:{color:C.mute,fontSize:11,fontFamily:FONT}},o||{}); }
function area(c){ return {type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:c+'40'},{offset:1,color:c+'00'}]}; }
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
function fmt(d){ return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0'); }
function vao(e){ return parseDMY(e.ngayVao); }
function nghi(e){ return parseDMY(e.ngayNghi); }
function onAt(e,t){ var a=vao(e); if(!a||a>t) return false; if(!isLeft(e)) return true; var b=nghi(e); return !!b && b>t; }
function ph(e){ return (String(e.phong||'').trim())||'(trống)'; }
function short(n){ var p=String(n||'').trim().split(/\s+/); return p.length>2?p.slice(-2).join(' '):p.join(' '); }
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
function tag(fr,t){ if(!t) return '<span class="v3-tag n">Chưa đủ dữ liệu</span>'; return fr===0?'<span class="v3-tag ok">● Ổn định</span>':fr<.5?'<span class="v3-tag w">▲ Theo dõi</span>':'<span class="v3-tag r">■ Rủi ro</span>'; }

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
var TABS=[['ov','Tổng quan'],['risk','Rủi ro'],['dept','Phòng ban'],['rec','Tuyển dụng'],['rep','Báo cáo']];
var cur='ov', D=null, flowN=12, todoTab='tv', selDept=null;
window.renderOverview=function(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  setTimeout(initV3,30);
  var now=new Date(), h=now.getHours(), chao=h<11?'Chào buổi sáng':h<14?'Chào buổi trưa':h<18?'Chào buổi chiều':'Chào buổi tối';
  var thu=['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'][now.getDay()];
  var P_=function(id,inner){ return '<section class="v3-panel'+(cur===id?' show':'')+'" id="v3p-'+id+'">'+inner+'</section>'; };
  return '<div class="v3"><div class="v3-top"><nav class="v3-tabs" id="v3tabs"><span class="v3-pill" id="v3pill"></span>'+
    TABS.map(function(t){return '<button class="v3-tab'+(cur===t[0]?' on':'')+'" data-t="'+t[0]+'">'+t[1]+'</button>';}).join('')+
    '</nav></div>'+
  P_('ov','<div class="v3-hero"><div><h1>'+chao+', Brian</h1><div class="v3-date">'+thu+', '+fmt(now)+'/'+now.getFullYear()+'</div>'+
    '<div class="v3-insight"><h4>Nhận định tháng này</h4><ul id="v3ins"></ul></div><div class="v3-kpis" id="v3kpis"></div></div>'+
    '<div class="v3-gauge"><div class="t">Tỷ lệ qua thử việc</div><div class="s">Ký từ 2 bản HĐ = qua · nghỉ khi mới 1 bản = không qua</div><div id="v3gauge" class="v3-ch g"></div><div class="v3-eval" id="ve_gauge"></div></div></div>'+
    '<div class="v3-row v3-r2"><div class="v3-card"><div class="v3-hd"><div><h3>Vào &amp; nghỉ theo tháng</h3><div class="sub">Theo ngày vào / ngày nghỉ trong Hồ sơ nhân sự · các tháng đã đủ</div></div>'+
      '<div class="v3-seg" id="v3segFlow"><button data-m="6">6 tháng</button><button class="on" data-m="12">12 tháng</button></div></div><div id="v3flow" class="v3-ch"></div><div class="v3-eval" id="ve_flow"></div></div>'+
    '<div class="v3-card"><h3>Cơ cấu hợp đồng</h3><div class="sub">Người đang làm · theo loại HĐ hiện tại</div><div id="v3hd" class="v3-ch"></div><div class="v3-eval" id="ve_hd"></div></div></div>'+
    '<div class="v3-row v3-r2b"><div class="v3-card"><h3>Việc cần xử lý</h3><div class="sub">Tự động từ Hồ sơ nhân sự</div>'+
      '<div class="v3-seg" id="v3segTodo" style="margin-bottom:10px"></div><div class="v3-todo" id="v3todo"></div><div class="v3-eval" id="ve_todo"></div></div>'+
    '<div class="v3-card"><h3>Tuyển dụng tóm tắt</h3><div class="sub">CV nhận theo tháng · file Tuyển dụng</div><div id="v3cvmini" class="v3-ch s"></div><div class="v3-eval" id="ve_cvmini"></div></div></div>')+
  P_('risk','<div class="v3-ptitle">Rủi ro nhân sự</div><div class="v3-psub">Thử việc, nghỉ sớm và dữ liệu thiếu</div>'+
    '<div class="v3-row v3-r11"><div class="v3-card"><h3>Tỷ lệ qua thử việc theo phòng</h3><div class="sub">Qua / (qua + không qua) · phòng dưới 3 người gộp vào Khác</div><div id="v3pass" class="v3-ch"></div><div class="v3-eval" id="ve_pass"></div></div>'+
    '<div class="v3-card"><h3>Nghỉ sau bao lâu</h3><div class="sub">Từ ngày vào đến ngày nghỉ · chỉ người có ngày nghỉ</div><div id="v3exit" class="v3-ch"></div><div class="v3-eval" id="ve_exit"></div></div></div>'+
    '<div class="v3-row v3-r11"><div class="v3-card"><h3>Thử việc chưa chốt</h3><div class="sub">Đã ký 1 bản HĐ · hạn = ngày vào + 2 tháng</div><div class="v3-todo" id="v3tvlist"></div><div class="v3-eval" id="ve_tv"></div></div>'+
    '<div class="v3-card"><h3>Chất lượng dữ liệu</h3><div class="sub">Trường thiếu làm sai lệch chỉ số</div><div id="v3dq" class="v3-ch s"></div><div class="v3-eval" id="ve_dq"></div></div></div>')+
  P_('dept','<div class="v3-ptitle">Phòng ban</div><div class="v3-psub">Bấm vào thẻ phòng để xem đánh giá riêng</div>'+
    '<div class="v3-row v3-r2"><div class="v3-card"><h3>Thẻ phòng ban</h3><div class="sub" id="v3deptsub"></div><div class="v3-depts" id="v3depts"></div><div class="v3-eval" id="ve_dept"></div></div>'+
    '<div class="v3-card"><h3>Nhân sự theo phòng</h3><div class="sub">Đang làm việc · không tính BOD</div><div id="v3hcd" class="v3-ch t"></div><div class="v3-eval" id="ve_hcd"></div></div></div>'+
    '<div class="v3-row v3-r11"><div class="v3-card"><h3>Thâm niên</h3><div class="sub">Người đang làm · tính đến hôm nay</div><div id="v3ten" class="v3-ch"></div><div class="v3-eval" id="ve_ten"></div></div>'+
    '<div class="v3-card"><h3>Vào &amp; nghỉ theo phòng · 12 tháng</h3><div class="sub">Vào theo ngày vào · Nghỉ theo ngày nghỉ (thiếu ngày thì theo ngày vào)</div><div id="v3io" class="v3-ch"></div><div class="v3-eval" id="ve_io"></div></div></div>')+
  P_('rec','<div class="v3-ptitle">Tuyển dụng</div><div class="v3-psub">File Tuyển dụng · AI Chấm CV</div>'+
    '<div class="v3-row v3-r2"><div class="v3-card"><h3>CV nhận theo tháng</h3><div class="sub">Theo Ngày nộp · 12 tháng gần nhất (tháng này tính đến hôm nay)</div><div id="v3cv" class="v3-ch"></div><div class="v3-eval" id="ve_cv"></div></div>'+
    '<div class="v3-card"><h3>AI chấm CV theo JD</h3><div class="sub">Từ tab Kho CV › Chấm CV theo JD</div><div id="v3ai"></div><div class="v3-eval" id="ve_ai"></div></div></div>'+
    '<div class="v3-row v3-r11"><div class="v3-card"><h3>Phễu tuyển dụng</h3><div class="sub">Cùng cách tính tab Tuyển dụng (qua bước sau = đã qua bước trước)</div><div class="v3-fun" id="v3fun"></div><div class="v3-eval" id="ve_fun"></div></div>'+
    '<div class="v3-card"><h3>Kết quả sau Line Manager</h3><div class="sub">CV Line Manager đánh giá phù hợp · kết quả hiện tại</div><div id="v3mgr" class="v3-ch"></div><div class="v3-eval" id="ve_mgr"></div></div></div>')+
  P_('rep','<div class="v3-ptitle">Báo cáo tháng</div><div class="v3-psub">12 tháng đã đủ gần nhất · báo cáo đầy đủ ở tab Báo cáo</div>'+
    '<div class="v3-row v3-r2"><div class="v3-card"><h3>Bảng tổng hợp</h3><div class="sub">Vào / nghỉ theo Hồ sơ · CV theo file Tuyển dụng</div><div style="overflow-x:auto"><table id="v3tbl"></table></div><div class="v3-eval" id="ve_rep"></div></div>'+
    '<div class="v3-card"><h3>Nhân sự cuối tháng</h3><div class="sub">Tính lại từ ngày vào / ngày nghỉ · người nghỉ thiếu ngày bị loại</div><div id="v3hcl" class="v3-ch t"></div><div class="v3-eval" id="ve_hcl"></div></div></div>')+
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
R.ov=function(){
  var d=D, act=d.act, dd=act.length-d.hc30all, M=d.M12, last=d.CVM[10], prev=d.CVM[9];
  var lv=sum(d.F12.vao), ln=sum(d.F12.nghi);
  document.getElementById('v3kpis').innerHTML=
    kpi('Đang làm việc',act.length,(dd>=0?'<span class="up">▲ '+dd:'<span class="dn">▼ '+(-dd))+'</span> so với 30 ngày trước ('+d.hc30all+')',.08)+
    kpi('Vào · 12 tháng',lv,M[0].l+' – '+M[11].l,.12)+
    kpi('Nghỉ · 12 tháng',ln,d.leftNoDate.length?'+ '+d.leftNoDate.length+' người nghỉ chưa có ngày nghỉ':'theo ngày nghỉ',.16)+
    kpi('CV tháng '+last.k.slice(0,2).replace(/^0/,''),last.n,(last.n>=prev.n?'<span class="up">▲ ':'<span class="dn">▼ ')+Math.abs(last.n-prev.n)+'</span> so với tháng '+prev.k.slice(0,2).replace(/^0/,'')+' ('+prev.n+')',.2);
  countUp(document.getElementById('v3kpis'));
  // nhận định
  var rate=P(d.qua,d.qua+d.khong), worst=d.depts.filter(function(x){return x.pass+x.fail>=3;}).sort(function(a,b){return a.pass/(a.pass+a.fail)-b.pass/(b.pass+b.fail);})[0];
  var best=d.depts.filter(function(x){return x.fail===0&&x.pass>=3;}).sort(function(a,b){return b.pass-a.pass;})[0];
  var od=d.tv.filter(function(x){return x.left<0;}).length, f=d.fun, maxCV=Math.max.apply(0,d.CVM.slice(0,11).map(function(x){return x.n;}));
  var ins=['Nhân sự đang làm <b>'+act.length+' người</b> ('+(dd>=0?'+':'')+dd+' so với 30 ngày trước). <b>'+d.tv.length+' người</b> đang thử việc'+(od?', '+od+' người đã quá 2 tháng mà chưa ký bản HĐ thứ 2.':'.')];
  if(worst&&P(worst.pass,worst.pass+worst.fail)<rate) ins.push('Rủi ro thử việc cao nhất ở <b>'+E(worst.n)+'</b>: '+(worst.pass+worst.fail)+' người đã có kết quả thì <b>'+worst.fail+' người nghỉ</b>.'+(best?' '+E(best.n)+' giữ '+best.pass+'/'+best.pass+'.':''));
  ins.push('Tháng '+last.k.slice(0,2).replace(/^0/,'')+' nhận <b>'+last.n+' CV</b>'+(last.n===maxCV&&last.n>0?', cao nhất 12 tháng':'')+'. Toàn bộ '+f[0].n+' CV có <b>'+vn1(f[0].n?f[5].n/f[0].n*100:0)+'% trúng tuyển</b>.');
  document.getElementById('v3ins').innerHTML=ins.map(function(s){return '<li>'+s+'</li>';}).join('');
  // gauge
  chart('v3gauge',{series:[{type:'gauge',startAngle:215,endAngle:-35,min:0,max:100,radius:'94%',center:['50%','58%'],
    progress:{show:true,width:12,roundCap:true,itemStyle:{color:C.s1}},axisLine:{roundCap:true,lineStyle:{width:12,color:[[1,'#262F44']]}},
    pointer:{show:false},axisTick:{show:false},splitLine:{show:false},axisLabel:{distance:-32,color:C.mute,fontSize:10,fontFamily:FONT,formatter:function(v){return v%50===0?v:'';}},
    detail:{offsetCenter:[0,'2%'],valueAnimation:true,formatter:function(v){return '{a|'+Math.round(v)+'%}\n{b|'+d.qua+' / '+(d.qua+d.khong)+' người}';},rich:{a:{fontSize:30,fontWeight:600,color:C.ink,fontFamily:FONT},b:{fontSize:11.5,color:C.mute,fontFamily:FONT,padding:[4,0,0,0]}}},
    data:[{value:d.qua+d.khong?d.qua/(d.qua+d.khong)*100:0}]}],animationDuration:1400});
  var ev=[[rate>=70?'g':rate>=50?'w':'r','Chung: <b>'+rate+'%</b> qua thử việc ('+d.qua+'/'+(d.qua+d.khong)+').']];
  if(worst){ var op=d.qua-worst.pass, of=d.khong-worst.fail; ev.push(['r',E(worst.n)+' <b>'+P(worst.pass,worst.pass+worst.fail)+'%</b> ('+worst.pass+'/'+(worst.pass+worst.fail)+'), các phòng khác <b>'+P(op,op+of)+'%</b>.']); }
  evalBox('ve_gauge',ev);
  drawFlow(flowN);
  [].forEach.call(document.querySelectorAll('#v3segFlow button'),function(b){ b.classList.toggle('on',+b.getAttribute('data-m')===flowN);
    b.onclick=function(){ flowN=+b.getAttribute('data-m'); [].forEach.call(b.parentNode.children,function(x){x.classList.toggle('on',x===b);}); drawFlow(flowN); }; });
  // hợp đồng
  var hm={}; act.forEach(function(e){ var k=loaiHDShort(String(e.loaiHD||'').trim())||'—'; if(k==='—'||!String(e.loaiHD||'').trim()) k='(chưa ghi)'; hm[k]=(hm[k]||0)+1; });
  var hk=Object.keys(hm).sort(function(a,b){return hm[b]-hm[a];}), hv=hk.map(function(k){return hm[k];}), tvi=hk.indexOf('Thử việc');
  chart('v3hd',{grid:{left:8,right:8,top:30,bottom:30},tooltip:T({axisPointer:{type:'none'},formatter:function(p){return E(p[0].name)+': <b style="color:#fff">'+p[0].value+'</b> người · '+P(p[0].value,act.length)+'%';}}),
    xAxis:ax(hk,{axisLabel:{color:C.mute,fontSize:10.5,fontFamily:FONT,interval:0,formatter:function(v){return v.length>12?v.slice(0,11)+'…':v;}}}),yAxis:{show:false,max:Math.max.apply(0,hv)+2},
    series:[{type:'bar',barMaxWidth:46,data:hv.map(function(v,i){return {value:v,itemStyle:{color:i===tvi?C.s2:C.slate,borderRadius:[6,6,3,3]}};}),
      emphasis:{itemStyle:{color:C.s1}},label:A(VL,{position:'top',fontSize:13}),animationDelay:function(i){return i*110;}}]});
  var lng=sum(hk.map(function(k,i){return /1 năm|Chính thức|không xác định|3 năm|2 năm/i.test(k)?hv[i]:0;}));
  evalBox('ve_hd',[['i','Nhiều nhất: <b>'+E(hk[0])+' '+hv[0]+' người ('+P(hv[0],act.length)+'%)</b>.'],
    lng?['i','<b>'+P(lng,act.length)+'%</b> có HĐ từ 1 năm trở lên hoặc chính thức.']:null,
    tvi>=0?[hv[tvi]>=5?'w':'g','<b>'+hv[tvi]+' người ('+P(hv[tvi],act.length)+'%)</b> đang ghi loại HĐ Thử việc.']:null,
    hm['(chưa ghi)']?['w',hm['(chưa ghi)']+' người chưa ghi loại HĐ.']:null]);
  drawTodo();
  // CV mini
  var cvv=d.CVM.map(function(x){return x.n;}), mx=Math.max.apply(0,cvv);
  chart('v3cvmini',{grid:{left:34,right:8,top:20,bottom:24},tooltip:T({axisPointer:SHADOW,formatter:function(p){return p[0].name+': <b style="color:#fff">'+p[0].value+'</b> CV';}}),
    xAxis:ax(d.CVM.map(function(x){return x.l;})),yAxis:yax(),series:[{type:'bar',barMaxWidth:16,data:cvv.map(function(v){return {value:v,itemStyle:{color:v===mx&&v>0?C.s4:'#1F5F59',borderRadius:[3,3,0,0]}};}),animationDelay:function(i){return i*60;}}]});
  var ai=aiData();
  evalBox('ve_cvmini',[['i','Phễu: '+f[0].n+' CV → '+f[1].n+' HR duyệt → '+f[2].n+' LM duyệt → <b>'+f[5].n+' trúng tuyển</b>.'],
    ai?['g','AI đã chấm '+ai.all+' CV'+(ai.pass?', khớp HR <b>'+P(ai.agree,ai.pass)+'%</b>':'')+'. '+(ai.pending?ai.pending+' CV đang chờ chấm.':'Không còn CV chờ chấm.')]:null]);
};
function kpi(l,v,dd,delay){ return '<div class="v3-kpi" style="animation-delay:'+delay+'s"><div class="l">'+l+'</div><div class="v" data-to="'+v+'">'+v+'</div><div class="d">'+dd+'</div></div>'; }
function drawFlow(n){
  var ms=D.M12.slice(12-n), f=D.flow(ms), labs=ms.map(function(x){return x.l;});
  var maxV=Math.max.apply(0,f.vao), maxN=Math.max.apply(0,f.nghi);
  function mp(arr,c,mx){ var i=arr.lastIndexOf(mx); return {symbol:'circle',symbolSize:9,itemStyle:{color:c,borderColor:C.card,borderWidth:2},label:A(VL,{position:'top'}),data:mx?[{coord:[labs[i],mx],value:mx}]:[]}; }
  chart('v3flow',{grid:{left:30,right:16,top:30,bottom:26},
    tooltip:T({axisPointer:{type:'line',lineStyle:{color:'#3A4560'}},formatter:function(p){var a=p[0].value,b=p[1].value;return p[0].name+'<br>'+p.map(function(s){return s.marker+s.seriesName+': <b style="color:#fff">'+s.value+'</b>';}).join('<br>')+'<div style="border-top:1px solid #2A3348;margin-top:5px;padding-top:4px">Ròng: <b style="color:#fff">'+(a-b>=0?'+':'')+(a-b)+'</b></div>';}}),
    legend:{right:0,top:-4,icon:'roundRect',itemWidth:12,itemHeight:3,textStyle:{color:C.ink2,fontFamily:FONT,fontSize:12},data:['Vào','Nghỉ']},
    xAxis:ax(labs,{boundaryGap:false}),yAxis:yax({max:Math.max(maxV,maxN,1)+1}),
    series:[{name:'Vào',type:'line',data:f.vao,symbol:'circle',symbolSize:7,showSymbol:false,lineStyle:{width:2.2,color:C.s1},itemStyle:{color:C.s1,borderColor:C.card,borderWidth:2},areaStyle:{color:area(C.s1)},markPoint:mp(f.vao,C.s1,maxV)},
      {name:'Nghỉ',type:'line',data:f.nghi,symbol:'circle',symbolSize:7,showSymbol:false,lineStyle:{width:2,color:C.s2},itemStyle:{color:C.s2,borderColor:C.card,borderWidth:2},areaStyle:{color:area(C.s2)},markPoint:mp(f.nghi,C.s2,maxN)}],animationDuration:1300});
  var sv=sum(f.vao), sn=sum(f.nghi), worse=labs.filter(function(k,i){return f.nghi[i]>f.vao[i];});
  evalBox('ve_flow',[[sv>=sn?'g':'r',n+' tháng: vào <b>'+sv+'</b>, nghỉ có ngày <b>'+sn+'</b>, ròng <b>'+(sv-sn>=0?'+':'')+(sv-sn)+'</b>.'],
    ['i','Tuyển nhiều nhất '+(maxV?labs[f.vao.lastIndexOf(maxV)]+' ('+maxV+' người)':'—')+'; nghỉ nhiều nhất '+(maxN?labs[f.nghi.lastIndexOf(maxN)]+' ('+maxN+' người)':'không có')+'.'],
    [worse.length?'w':'g',worse.length?'Tháng nghỉ nhiều hơn vào: <b>'+worse.join(', ')+'</b>.':'Không có tháng nào nghỉ nhiều hơn vào.'],
    D.leftNoDate.length?['w',D.leftNoDate.length+' người "Nghỉ việc" chưa có ngày nghỉ nên không lên biểu đồ. Cần bổ sung trong Hồ sơ.']:null]);
}
function itHtml(list){ if(!list.length) return '<div class="v3-empty">Không có mục nào.</div>';
  return list.map(function(x,i){ return '<div class="v3-it" style="animation-delay:'+(.05+i*.05)+'s"><span class="k" style="background:'+x.c+'"></span><div><b>'+x.t+'</b><small>'+x.s+'</small></div><span class="when" style="color:'+x.c+'">'+x.w+'</span></div>'; }).join(''); }
function tvItems(){ return D.tv.map(function(x){ var c=x.left<-14?C.bad:x.left<0?C.warn:C.s3;
  return {c:c,t:E(short(x.e.hoTen))+' · '+E(ph(x.e)),s:'Vào '+fmt(x.a)+' · hết 2 tháng ngày '+fmt(x.end),w:x.left<0?'Quá '+(-x.left)+' ngày':'Còn '+x.left+' ngày'}; }); }
function drawTodo(){
  var gh=ovGiaHan(), ck=ovCanKy(), bd=ovBirthdays(), tv=tvItems();
  var segs=[['tv','Thử việc',tv.length],['hd','HĐ hết hạn',gh.length],['ky','Cần ký',ck.length],['sn','Sinh nhật',bd.length]];
  var seg=document.getElementById('v3segTodo');
  seg.innerHTML=segs.map(function(s){return '<button data-k="'+s[0]+'"'+(todoTab===s[0]?' class="on"':'')+'>'+s[1]+' ('+s[2]+')</button>';}).join('');
  [].forEach.call(seg.children,function(b){ b.onclick=function(){ todoTab=b.getAttribute('data-k'); drawTodo(); }; });
  var list, ev;
  if(todoTab==='tv'){ list=tv; var od=D.tv.filter(function(x){return x.left<0;});
    ev=[[od.length?'r':'g','<b>'+od.length+'/'+D.tv.length+'</b> ca thử việc đã quá 2 tháng mà chưa ký bản HĐ thứ 2'+(od.length?', nên chốt trong tuần.':'.')],
      D.tv[0]&&D.tv[0].left<0?['i','Ca lâu nhất: '+E(short(D.tv[0].e.hoTen))+' ('+E(ph(D.tv[0].e))+'), đã quá <b>'+(-D.tv[0].left)+' ngày</b>.']:null]; }
  else if(todoTab==='hd'){ list=gh.map(function(o){ var c=o.n<0?C.bad:o.n<=7?C.warn:C.s3; return {c:c,t:E(short(o.e.hoTen))+' · '+E(ph(o.e)),s:E(loaiHDShort(o.e.loaiHD))+(o.e.ngayHetHan?' · hết hạn '+E(o.e.ngayHetHan):''),w:o.n<0?'Quá '+(-o.n)+' ngày':'Còn '+o.n+' ngày'}; });
    var q=gh.filter(function(o){return o.n<0;}).length; ev=[[q?'r':gh.length?'w':'g',gh.length?'<b>'+gh.length+'</b> HĐ quá hạn hoặc hết hạn trong 30 ngày'+(q?', trong đó <b>'+q+'</b> đã quá hạn.':'.'):'Không có HĐ sắp hết hạn trong 30 ngày.']]; }
  else if(todoTab==='ky'){ list=ck.map(function(e){ return {c:C.warn,t:E(short(e.hoTen))+' · '+E(ph(e)),s:'Vào '+E(e.ngayVao||'—')+' · '+E(loaiHDShort(e.loaiHD)),w:'Chưa ký'}; });
    ev=[[ck.length?'w':'g',ck.length?'<b>'+ck.length+'</b> người chưa ký bản HĐ nào (số bản đã ký = 0).':'Mọi người đều đã ký HĐ.']]; }
  else { list=bd.map(function(b){ return {c:b.days<=7?C.s1:C.s3,t:E(short(b.ten))+' · '+E(b.phong||''),s:'Sinh nhật '+b.dd,w:b.days===0?'Hôm nay':'Còn '+b.days+' ngày'}; });
    ev=[['i',bd.length?'<b>'+bd.length+'</b> sinh nhật trong tháng này và tháng sau'+(bd[0]?'; gần nhất '+E(short(bd[0].ten))+' ('+bd[0].dd+').':'.'):'Không có sinh nhật trong tháng này và tháng sau.']]; }
  document.getElementById('v3todo').innerHTML=itHtml(list);
  evalBox('ve_todo',ev);
}

/* ================= 6. TAB RỦI RO ================= */
R.risk=function(){
  var d=D, ds=d.depts.filter(function(x){return x.pass+x.fail>0;}).map(function(x){return {n:x.n,r:P(x.pass,x.pass+x.fail),t:x.pass+x.fail,p:x.pass};}).sort(function(a,b){return a.r-b.r;});
  chart('v3pass',{grid:{left:110,right:46,top:6,bottom:10},tooltip:T({axisPointer:{type:'none'},formatter:function(p){var x=ds[p[0].dataIndex];return E(x.n)+': <b style="color:#fff">'+x.p+' / '+x.t+'</b> qua · '+x.r+'%';}}),
    xAxis:{type:'value',max:100,show:false},yAxis:ax(ds.map(function(x){return x.n;}),{axisLine:{show:false},axisLabel:{color:C.ink2,fontSize:12,fontFamily:FONT,width:100,overflow:'truncate'}}),
    series:[{type:'bar',barWidth:14,showBackground:true,backgroundStyle:{color:'#1C2436',borderRadius:4},data:ds.map(function(x){return {value:x.r,itemStyle:{borderRadius:4,color:x.r===100?C.good:x.r>=50?C.warn:C.bad}};}),
      label:A(VL,{position:'right',formatter:function(p){return p.value+'%';}}),animationDelay:function(i){return i*120;}}]});
  var w=ds[0], full=ds.filter(function(x){return x.r===100;}), sm=ds.filter(function(x){return x.t<5;});
  evalBox('ve_pass',[w?['r','Thấp nhất: <b>'+E(w.n)+' '+w.r+'%</b> ('+w.p+'/'+w.t+').']:null,
    full.length?['g',full.map(function(x){return E(x.n);}).join(', ')+' giữ 100% người qua thử việc.']:null,
    sm.length?['i','Mẫu nhỏ (dưới 5 người): '+sm.map(function(x){return E(x.n);}).join(', ')+' chỉ nên xem như tín hiệu.']:null]);
  var bins=[['< 1 tháng',0,30],['1–2 tháng',30,60],['2–3 tháng',60,90],['3–6 tháng',90,180],['> 6 tháng',180,1e6]];
  var dated=d.left.filter(function(e){return nghi(e)&&vao(e);}), bv=bins.map(function(b){return dated.filter(function(e){var x=days(vao(e),nghi(e));return x>=b[1]&&x<b[2];}).length;});
  chart('v3exit',{grid:{left:30,right:8,top:24,bottom:26},tooltip:T({axisPointer:SHADOW,formatter:function(p){return 'Nghỉ sau '+p[0].name+': <b style="color:#fff">'+p[0].value+'</b> người';}}),
    xAxis:ax(bins.map(function(b){return b[0];})),yAxis:yax(),series:[{type:'bar',barMaxWidth:40,data:bv.map(function(v,i){return {value:v,itemStyle:{color:i<2?C.s2:C.slate,borderRadius:[4,4,0,0]}};}),label:A(VL,{position:'top'}),animationDelay:function(i){return i*120;}}]});
  var early=bv[0]+bv[1], mn=dated.map(function(e){return days(vao(e),nghi(e));}).sort(function(a,b){return a-b;})[0];
  evalBox('ve_exit',[[early*3>=dated.length?'r':'w','<b>'+early+'/'+dated.length+'</b> người nghỉ ngay trong 2 tháng đầu.'],
    mn!=null?['i','Ca ngắn nhất: '+mn+' ngày sau khi vào.']:null,
    d.leftNoDate.length?['w','Chưa tính '+d.leftNoDate.length+' người thiếu ngày nghỉ.']:null]);
  document.getElementById('v3tvlist').innerHTML=itHtml(tvItems());
  var od=d.tv.filter(function(x){return x.left<0;}), byD={}; od.forEach(function(x){byD[ph(x.e)]=(byD[ph(x.e)]||0)+1;});
  var topD=Object.keys(byD).sort(function(a,b){return byD[b]-byD[a];})[0];
  evalBox('ve_tv',[[od.length?'r':'g','<b>'+od.length+'</b> ca quá hạn'+(od.length?', tổng cộng '+od.reduce(function(a,x){return a-x.left;},0)+' ngày trễ.':'.')],
    topD&&byD[topD]>1?['i',E(topD)+' chiếm '+byD[topD]+'/'+od.length+' ca quá hạn.']:null]);
  var dq=[['Nghỉ việc thiếu ngày nghỉ',d.leftNoDate.length,d.left.length],['Đang làm thiếu ngày vào',d.act.filter(function(e){return !vao(e);}).length,d.act.length],
    ['Đang làm thiếu loại HĐ',d.act.filter(function(e){return !String(e.loaiHD||'').trim();}).length,d.act.length],['Đang làm thiếu số bản HĐ',d.act.filter(function(e){return String(e.soBanKy==null?'':e.soBanKy).trim()==='';}).length,d.act.length]];
  chart('v3dq',{grid:{left:170,right:60,top:6,bottom:6},tooltip:T({axisPointer:{type:'none'},formatter:function(p){var x=dq[p[0].dataIndex];return E(x[0])+': <b style="color:#fff">'+x[1]+' / '+x[2]+'</b>';}}),xAxis:{type:'value',show:false,max:100},
    yAxis:ax(dq.map(function(x){return x[0];}),{inverse:true,axisLine:{show:false},axisLabel:{color:C.ink2,fontSize:12,fontFamily:FONT}}),
    series:[{type:'bar',barWidth:12,showBackground:true,backgroundStyle:{color:'#1C2436',borderRadius:4},data:dq.map(function(x){return {value:x[2]?x[1]/x[2]*100:0,itemStyle:{borderRadius:4,color:x[1]?C.warn:C.good}};}),
      label:A(VL,{position:'right',formatter:function(p){var x=dq[p.dataIndex];return x[1]+' / '+x[2];}})}]});
  var bad=dq.filter(function(x){return x[1];});
  evalBox('ve_dq',[bad.length?['w',bad.map(function(x){return E(x[0])+': <b>'+x[1]+'</b>';}).join(' · ')+'.']:['g','Không thiếu trường nào.'],
    d.leftNoDate.length?['i','Thiếu ngày nghỉ làm thấp số nghỉ theo tháng và tỉ lệ nghỉ việc.']:null]);
};

/* ================= 7. TAB PHÒNG BAN ================= */
R.dept=function(){
  var d=D, box=document.getElementById('v3depts');
  document.getElementById('v3deptsub').innerHTML='Nhãn theo tỉ lệ nghỉ khi đang thử việc: 0% Ổn định · dưới 50% Theo dõi · từ 50% Rủi ro'+(d.khacList.length?' · Khác = '+d.khacList.map(E).join(', '):'');
  box.innerHTML=d.depts.map(function(x,i){ var t=x.pass+x.fail, fr=t?x.fail/t:0, pr=P(x.pass,t), col=!t?C.mute:fr===0?C.good:fr<.5?C.warn:C.bad;
    return '<div class="v3-dp'+(selDept===i?' sel':'')+'" data-i="'+i+'"><div class="h"><b>'+E(x.n)+'</b>'+tag(fr,t)+'</div><div class="v3-dl"><span>Đang làm</span><b>'+x.hc+' người</b></div>'+
      '<div class="v3-dl"><span>Qua thử việc</span><b>'+(t?x.pass+' / '+t+' · '+pr+'%':'—')+'</b></div><div class="v3-mini"><span data-w="'+pr+'" style="background:'+col+'"></span></div>'+
      '<div class="v3-dl"><span>Đang thử việc</span><b>'+x.tv+'</b></div><div class="v3-dl"><span>Nghỉ · 12 tháng</span><b>'+x.left+'</b></div></div>'; }).join('');
  grow('#v3depts .v3-mini span');
  [].forEach.call(box.querySelectorAll('.v3-dp'),function(el){ el.onclick=function(){ selDept=+el.getAttribute('data-i'); [].forEach.call(box.querySelectorAll('.v3-dp'),function(z){z.classList.toggle('sel',z===el);}); deptEval(); }; });
  deptEval();
  var hs=d.depts.slice().sort(function(a,b){return a.hc-b.hc;});
  chart('v3hcd',{grid:{left:110,right:36,top:6,bottom:10},tooltip:T({axisPointer:{type:'none'},formatter:function(p){return E(p[0].name)+': <b style="color:#fff">'+p[0].value+'</b> người · '+P(p[0].value,d.staff.length)+'%';}}),
    xAxis:{type:'value',show:false},yAxis:ax(hs.map(function(x){return x.n;}),{axisLine:{show:false},axisLabel:{color:C.ink2,fontSize:12,fontFamily:FONT,width:100,overflow:'truncate'}}),
    series:[{type:'bar',barWidth:14,data:hs.map(function(x){return {value:x.hc,itemStyle:{borderRadius:4,color:C.s1}};}),label:A(VL,{position:'right'}),animationDelay:function(i){return i*90;}}]});
  var top=hs[hs.length-1];
  evalBox('ve_hcd',[top?['i','Lớn nhất: <b>'+E(top.n)+' '+top.hc+' người ('+P(top.hc,d.staff.length)+'%)</b>.']:null,['i','Không tính BOD ('+(d.act.length-d.staff.length)+' người).']]);
  var tb=[['< 3 tháng',0,3],['3–6 tháng',3,6],['6–12 tháng',6,12],['1–2 năm',12,24],['> 2 năm',24,1e6]];
  var tv=tb.map(function(b){return d.act.filter(function(e){var a=vao(e);if(!a)return false;var m=(d.t-a)/2629800000;return m>=b[1]&&m<b[2];}).length;});
  chart('v3ten',{grid:{left:30,right:8,top:24,bottom:26},tooltip:T({axisPointer:SHADOW,formatter:function(p){return p[0].name+': <b style="color:#fff">'+p[0].value+'</b> người';}}),
    xAxis:ax(tb.map(function(b){return b[0];})),yAxis:yax(),series:[{type:'bar',barMaxWidth:40,data:tv.map(function(v){return {value:v,itemStyle:{color:C.s4,borderRadius:[4,4,0,0]}};}),label:A(VL,{position:'top'}),animationDelay:function(i){return i*110;}}]});
  var tot=sum(tv), u6=tv[0]+tv[1], o1=tv[3]+tv[4];
  evalBox('ve_ten',[[P(u6,tot)>=30?'w':'g','<b>'+P(u6,tot)+'%</b> nhân sự làm dưới 6 tháng'+(P(u6,tot)>=30?', đội còn mới.':'.')],['i','Gắn bó trên 1 năm: '+o1+' người ('+P(o1,tot)+'%).']]);
  chart('v3io',{grid:{left:30,right:8,top:30,bottom:30},legend:{right:0,top:-4,icon:'roundRect',itemWidth:12,itemHeight:3,textStyle:{color:C.ink2,fontFamily:FONT,fontSize:12}},
    tooltip:T({axisPointer:SHADOW}),xAxis:ax(d.depts.map(function(x){return x.n;}),{axisLabel:{color:C.mute,fontSize:10.5,fontFamily:FONT,interval:0,formatter:function(v){return v.length>10?v.slice(0,9)+'…':v;}}}),yAxis:yax(),
    series:[{name:'Vào',type:'bar',barMaxWidth:18,barGap:'15%',data:d.depts.map(function(x){return x.vao;}),itemStyle:{color:C.s1,borderRadius:[3,3,0,0]}},
      {name:'Nghỉ',type:'bar',barMaxWidth:18,data:d.depts.map(function(x){return x.left;}),itemStyle:{color:C.s2,borderRadius:[3,3,0,0]}}]});
  var wr=d.depts.filter(function(x){return x.vao>0;}).sort(function(a,b){return b.left/b.vao-a.left/a.vao;})[0], st=d.depts.filter(function(x){return x.vao>=3;}).sort(function(a,b){return a.left/a.vao-b.left/b.vao;})[0];
  evalBox('ve_io',[wr&&wr.left?[wr.left/wr.vao>=.5?'r':'w',E(wr.n)+' tuyển <b>'+wr.vao+'</b> người trong 12 tháng, <b>'+wr.left+'</b> người nghỉ'+(wr.left/wr.vao>=.5?': phần lớn tuyển để bù người nghỉ.':'.')]:null,
    st&&st!==wr?['g',E(st.n)+' tuyển '+st.vao+', nghỉ '+st.left+': ổn định nhất.']:null]);
};
function deptEval(){
  var d=D;
  if(selDept===null||!d.depts[selDept]){ var r=d.depts.filter(function(x){var t=x.pass+x.fail;return t&&x.fail/t>=.5;}).map(function(x){return E(x.n);});
    evalBox('ve_dept',[r.length?['r','Phòng nhãn Rủi ro: <b>'+r.join(', ')+'</b>.']:['g','Không có phòng nào nhãn Rủi ro.'],['i','Bấm vào một thẻ để xem đánh giá riêng phòng đó.']]); return; }
  var x=d.depts[selDept], t=x.pass+x.fail;
  evalBox('ve_dept',[['i','<b>'+E(x.n)+'</b>: '+x.hc+' người đang làm, '+x.vao+' người vào trong 12 tháng, '+x.left+' người nghỉ.'],
    t?[x.fail===0?'g':x.fail/t>=.5?'r':'w','Qua thử việc '+x.pass+'/'+t+' ('+P(x.pass,t)+'%).']:['i','Chưa có ai có kết quả thử việc.'],
    x.tv?['w','Còn '+x.tv+' người đang thử việc.']:null]);
}

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
R.rep=function(){
  var d=D, M=d.M12, f=d.F12, byK={}; d.CVM.forEach(function(x){byK[x.k]=x.n;});
  var mo=tdMonths(d.td), all={}; mo.forEach(function(x){all[x.k]=x.n;});
  var cv=M.map(function(mm){return all[mm.k]||0;});
  var rows=M.map(function(mm,i){var n=f.vao[i]-f.nghi[i];return '<tr style="animation-delay:'+(i*.035)+'s"><td>'+mm.l+'</td><td>'+f.vao[i]+'</td><td>'+f.nghi[i]+'</td><td><b>'+(n>=0?'+':'')+n+'</b></td><td>'+cv[i]+'</td></tr>';}).join('');
  var sv=sum(f.vao), sn=sum(f.nghi);
  document.getElementById('v3tbl').innerHTML='<thead><tr><th>Tháng</th><th>Vào</th><th>Nghỉ*</th><th>Ròng</th><th>CV nhận</th></tr></thead><tbody>'+rows+
    '<tr><td><b>Tổng</b></td><td><b>'+sv+'</b></td><td><b>'+sn+'</b></td><td><b>'+(sv-sn>=0?'+':'')+(sv-sn)+'</b></td><td><b>'+sum(cv)+'</b></td></tr></tbody>';
  evalBox('ve_rep',[['i','12 tháng: vào '+sv+', nghỉ có ngày '+sn+', nhận '+sum(cv)+' CV.'],d.leftNoDate.length?['w','*Nghỉ chưa gồm '+d.leftNoDate.length+' người thiếu ngày nghỉ.']:null]);
  var hc=M.map(function(mm){var e=new Date(mm.y,mm.m+1,0,23,59,59);return d.ns.filter(function(x){return onAt(x,e);}).length;});
  chart('v3hcl',{grid:{left:30,right:16,top:26,bottom:26},tooltip:T({axisPointer:{type:'line',lineStyle:{color:'#3A4560'}},formatter:function(p){return p[0].name+': <b style="color:#fff">'+p[0].value+'</b> người';}}),
    xAxis:ax(M.map(function(x){return x.l;}),{boundaryGap:false}),yAxis:yax({min:0}),
    series:[{type:'line',data:hc,symbol:'circle',symbolSize:7,lineStyle:{width:2.2,color:C.s1},itemStyle:{color:C.s1,borderColor:C.card,borderWidth:2},areaStyle:{color:area(C.s1)},
      label:A(VL,{show:true,position:'top',formatter:function(p){return p.dataIndex===11||p.dataIndex===0?p.value:'';}})}],animationDuration:1300});
  var nd=d.leftNoDate.map(vao).filter(Boolean).sort(function(a,b){return a-b;});
  evalBox('ve_hcl',[[hc[11]>=hc[0]?'g':'r','Từ '+hc[0]+' (cuối '+M[0].l+') đến <b>'+hc[11]+'</b> (cuối '+M[11].l+').'],
    nd.length?['w','Các tháng trước có thể thấp hơn thực tế: '+nd.length+' người nghỉ thiếu ngày nghỉ (vào '+fmt(nd[0])+'/'+nd[0].getFullYear()+' – '+fmt(nd[nd.length-1])+'/'+nd[nd.length-1].getFullYear()+') bị loại khỏi mọi tháng.']:null]);
};


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
  var t2=text.replace(/ /g,' '), phRe=/(?:\+\s?)?\(?\d[\d\s.\-()]{7,20}\d/g;
  while((m=phRe.exec(t2))){
    var raw=m[0], digits=raw.replace(/[^\d]/g,'');
    if(digits.length<9||digits.length>13) continue;
    var n=norm(raw);
    if(!n){ // chuỗi dài dính 2 số → thử tách theo khoảng trắng lớn / dấu |
      continue; }
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
  .then(function(r){ cvxApply(f,cvxParse(r.text,r.links)); redraw();
    if(!cvxNeed(f)) return 'ok';
    f.__cvx='ocr'; redraw();
    return cvxServer(f.file).then(function(r2){ cvxApply(f,cvxParse(r2.text,[])); return 'ok'; }).catch(function(e){ console.warn('[cvx] ocr',e); return 'loi'; }); })
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

/* ================= 10. KHỞI ĐỘNG MUỘN =================
   Đăng nhập Firebase có thể xong TRƯỚC khi file này tải xong → app đã boot bằng sidebar/trang cũ.
   Trường hợp đó vẽ lại sidebar + trang hiện tại bằng bản mới. */
if(window.__bxAppBooted){ try{ window.renderNav(); if(window.currentTab) window.go(window.currentTab); }catch(e){ console.warn('[v3] late boot',e); } }
})();
