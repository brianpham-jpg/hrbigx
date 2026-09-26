/* ============================================================
   BigX HR — v2: tab Tổng quan mới + đổi màu biểu đồ
   Nạp SAU app.js. KHÔNG sửa app.js: chỉ gán lại renderOverview
   và đổi màu trong PTC. Mọi số đọc từ HR (API hub) qua đúng các
   hàm tính sẵn trong app.js — không có số tự tạo.
   ============================================================ */
(function(){
'use strict';

/* ---- 1. Màu ECharts cho mọi tab phân tích (PTC là object dùng chung trong app.js) ---- */
if (typeof PTC === 'object' && PTC) {
  PTC.teal='#7B4FD6'; PTC.teal2='#4A64C9'; PTC.clay='#2F9E8F'; PTC.rust='#D0782A'; PTC.gold='#9A6417';
  PTC.muted='#6B7280'; PTC.faint='#9AA4B8'; PTC.ink='#1C2436'; PTC.text='#4A5263'; PTC.paper='#FFFFFF'; PTC.line='#E6E8EF';
  PTC.ramp=['#3E2780','#512FA3','#6440C4','#7B4FD6','#8C66DC','#9A7FE3'];
}

var S = { period:'nam', filter:'all', q:'', vitri:'', hlDept:-1 };
try { var sp = localStorage.getItem('bx-v2-period'); if (sp==='thang'||sp==='quy'||sp==='nam') S.period = sp; } catch(e) {}

var C = { s1:'#7B4FD6', s2:'#D0782A', s3:'#4A64C9', s4:'#2F9E8F', s5:'#9AA4B8',
  ink:'#1C2436', muted:'#6B7280', faint:'#9AA4B8', line:'#E6E8EF', line2:'#EEF0F5', paper:'#FFFFFF' };
var PERIODS = { thang:{n:1,label:'Tháng này',cmp:'so với tháng trước'}, quy:{n:3,label:'3 tháng gần nhất',cmp:'so với 3 tháng trước'}, nam:{n:12,label:'12 tháng gần nhất',cmp:'so với 12 tháng trước'} };

/* ---------- helpers ---------- */
function e_(s){ return (typeof esc==='function') ? esc(s) : String(s==null?'':s); }
function smooth(pts){
  if(!pts.length) return '';
  var d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
  for(var i=1;i<pts.length;i++){ var p=pts[i-1], q=pts[i], cx=(p[0]+q[0])/2;
    d+=' C'+cx.toFixed(1)+' '+p[1].toFixed(1)+' '+cx.toFixed(1)+' '+q[1].toFixed(1)+' '+q[0].toFixed(1)+' '+q[1].toFixed(1); }
  return d;
}
function niceMax(v, step){ step=step||1; var m=Math.max(step, Math.ceil(v/step)*step); return m; }
function last(arr,n){ return arr.slice(Math.max(0,arr.length-n)); }
function mLabel(k){ var p=k.split('/'); return 'T'+parseInt(p[0],10); }
function mLong(k){ var p=k.split('/'); return parseInt(p[0],10)+'/'+p[1]; }
function sw(c){ return '<i class="v2-sw" style="background:'+c+'"></i>'; }
function ini(name){ var w=String(name||'').trim().split(/\s+/).filter(Boolean); if(!w.length) return '?'; var a=w[w.length-1][0]||''; var b=w.length>1?(w[0][0]||''):''; return (a+b).toUpperCase(); }
function avatar(name,i,s){ var pal=[['#EFEAFB','#5F3BB0'],['#FBEFE3','#8A4E17'],['#E8EBF8','#3548A8'],['#E1F3F0','#1F6E63']][i%4];
  return '<span class="v2-av" style="width:'+s+'px;height:'+s+'px;font-size:'+(s>28?11.5:10.5)+'px;background:'+pal[0]+';color:'+pal[1]+'">'+e_(ini(name))+'</span>'; }
var ST = { good:['var(--good-bg)','var(--good)','ti-check'], warn:['var(--warn-bg)','var(--warn)','ti-hourglass'], bad:['var(--bad-bg)','var(--bad)','ti-x'], info:['var(--info-bg)','var(--info)','ti-user-search'] };
function stPill(kind,label){ var m=ST[kind]||ST.info; return '<span class="v2-st" style="background:'+m[0]+';color:'+m[1]+'"><i class="ti '+m[2]+'"></i>'+e_(label)+'</span>'; }

var tip=null;
function tipEl(){ if(!tip){ tip=document.createElement('div'); tip.className='v2-tip'; tip.setAttribute('role','tooltip'); document.body.appendChild(tip); } return tip; }
function showTip(html,x,y){ var t=tipEl(); t.innerHTML=html; t.classList.add('show'); var w=t.offsetWidth,h=t.offsetHeight; var L=x+14; if(L+w>innerWidth-8) L=x-w-14; var T=y-h/2; if(T<8) T=8; if(T+h>innerHeight-8) T=innerHeight-h-8; t.style.left=L+'px'; t.style.top=T+'px'; }
function hideTip(){ if(tip) tip.classList.remove('show'); }
function tr(c,l,v){ return '<div class="tr"><span>'+sw(c)+e_(l)+'</span><b>'+v+'</b></div>'; }

/* ---------- số liệu (chỉ gọi hàm có sẵn trong app.js) ---------- */
function periodRange(){
  var now=new Date(), end=new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
  var n=PERIODS[S.period].n, start;
  if(S.period==='nam') start=new Date(end.getFullYear()-1,end.getMonth(),end.getDate(),23,59,59);
  else start=new Date(end.getFullYear(),end.getMonth()-n+1,0,23,59,59); // cuối tháng trước kỳ
  return {start:start,end:end};
}
function prevRange(r){
  var n=PERIODS[S.period].n, e=r.start, s;
  if(S.period==='nam') s=new Date(e.getFullYear()-1,e.getMonth(),e.getDate(),23,59,59);
  else s=new Date(e.getFullYear(),e.getMonth()-n+1,0,23,59,59);
  return {start:s,end:e};
}
function hiresIn(r){ return (HR.nhansu||[]).filter(function(e){ var d=parseDMY(e.ngayVao); return d && d>r.start && d<=r.end; }).length; }
function cvIn(r){ return (HR.tuyendung||[]).filter(function(c){ var d=parseDMY(c.ngayNop); return d && d>r.start && d<=r.end; }).length; }

function model(){
  var ns=HR.nhansu||[], cv=HR.tuyendung||[], act=ovActive();
  var r=periodRange(), pr=prevRange(r);
  var T=bdTurnover(r.start,r.end), TP=bdTurnover(pr.start,pr.end);
  var T12=bdTurn12();
  var flow=last(csMonthlyFlow(ns),12);
  var cvMo=last(tdMonths(cv),12);
  var cum=0, fullFlow=csMonthlyFlow(ns), tongAll=fullFlow.map(function(x){cum+=x.inn;return cum;});
  var dang=[], run=act.length; for(var i=fullFlow.length-1;i>=0;i--){ dang[i]=run; run-=fullFlow[i].net; }
  var rateSpark=flow.map(function(x){ return bdMonthRate(x.k); });
  return { ns:ns, cv:cv, act:act, r:r, pr:pr, T:T, TP:TP, T12:T12, flow:flow, cvMo:cvMo,
    tongSpark:last(tongAll,12), dangSpark:last(dang,12), rateSpark:rateSpark,
    hires:hiresIn(r), hiresPrev:hiresIn(pr), cvNow:cvIn(r), cvPrev:cvIn(pr) };
}

/* ---------- render ---------- */
function deltaHtml(cur,prev,unit,badUp){
  var d=Math.round((cur-prev)*10)/10;
  var cls=d===0?'flat':((d>0)!==!!badUp?'up':'down');
  var ic=d>0?'ti-arrow-up-right':d<0?'ti-arrow-down-right':'ti-minus';
  return '<span class="v2-delta '+cls+'"><i class="ti '+ic+'"></i>'+(d>0?'+':'')+d+(unit||'')+'</span>';
}
function kpiCard(o){
  return '<article class="v2-card v2-kpi"'+(o.go?' data-go="'+o.go+'" role="button" tabindex="0"':'')+'>'+
    '<div class="v2-kpi-t"><span class="v2-kpi-i" style="background:'+o.soft+';color:'+o.c+'"><i class="ti '+o.icon+'"></i></span>'+o.l+'</div>'+
    '<div class="v2-kpi-b"><div><div class="v2-kpi-v num">'+o.v+'</div><div class="v2-kpi-d">'+o.d+'</div></div>'+
    '<svg class="v2-spark" width="96" height="40" data-spark="'+o.key+'" aria-hidden="true"></svg></div></article>';
}

function renderOverviewV2(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  var M=model(), P=PERIODS[S.period];
  window.__v2M=M;

  var tong=M.ns.length, dangLam=M.act.length, rate=M.T12.rate, totalCV=M.cv.length;
  var kpis=[
    {key:'tong',l:'Tổng nhân sự',v:tong,icon:'ti-users',c:C.s1,soft:'#EFEAFB',go:'ho-so',
      d:'<span><b style="color:var(--ink)">'+M.hires+'</b> người vào kỳ này</span>'+deltaHtml(M.hires,M.hiresPrev,'')+'<span>'+P.cmp+'</span>'},
    {key:'dang',l:'Đang làm',v:dangLam,icon:'ti-user-check',c:C.s3,soft:'#E8EBF8',go:'ho-so',
      d:deltaHtml(dangLam,M.T.h0,'')+'<span>so với đầu kỳ ('+M.T.h0+' người)</span>'},
    {key:'rate',l:'Tỷ lệ nghỉ · 12 tháng',v:rate+'%',icon:'ti-logout',c:C.s2,soft:'#FBEFE3',go:'pt-bien-dong',
      d:'<span>'+M.T12.left+' người nghỉ / NS bình quân '+(Math.round(M.T12.avg*10)/10)+'</span>'},
    {key:'cv',l:'Tổng CV đã nhận',v:totalCV,icon:'ti-files',c:C.s4,soft:'#E1F3F0',go:'tuyen-dung',
      d:'<span><b style="color:var(--ink)">'+M.cvNow+'</b> CV kỳ này</span>'+deltaHtml(M.cvNow,M.cvPrev,'')+'<span>'+P.cmp+'</span>'}
  ];

  /* hợp đồng + việc cần xử lý */
  var staff=ovStaff(), canKy=ovCanKy(), giaHan=ovGiaHan();
  var over=giaHan.filter(function(o){return o.n<0;}), soon=giaHan.filter(function(o){return o.n>=0;});
  var signed=staff.length-canKy.length, pctSigned=staff.length?Math.round(signed/staff.length*100):0;
  var bds=ovBirthdays(), bd7=bds.filter(function(b){return b.days<=7;});
  var newCV=M.cv.filter(function(c){ return tdStage(c).label==='Mới nộp'; }).length;
  var undated=M.ns.filter(isLeft).length-bdDated().length;
  var todo=[
    {ic:'ti-alert-triangle',t:'Hợp đồng quá hạn',s:'Cần ký lại / gia hạn',n:over.length,k:'bad',p:'Gấp',go:'hop-dong'},
    {ic:'ti-file-certificate',t:'Chưa ký bản HĐ nào',s:'Nhân sự đang làm, không tính BOD',n:canKy.length,k:'bad',p:'Ưu tiên',go:'hop-dong'},
    {ic:'ti-hourglass',t:'HĐ sắp hết hạn',s:'Trong 30 ngày tới',n:soon.length,k:'warn',p:'≤ 30 ngày',go:'hop-dong'},
    {ic:'ti-file-description',t:'CV mới chưa xử lý',s:'Chưa có kết quả vòng nào',n:newCV,k:'info',p:'Tuyển dụng',go:'tuyen-dung'},
    {ic:'ti-cake',t:'Sinh nhật 7 ngày tới',s:'Chuẩn bị lời chúc',n:bd7.length,k:'good',p:'Tuần này',go:'ho-so'},
    {ic:'ti-calendar-question',t:'Hồ sơ nghỉ thiếu ngày nghỉ',s:'Bổ sung để phân tích đúng',n:undated,k:'warn',p:'Dữ liệu',go:'ho-so'}
  ];
  var todoTotal=todo.reduce(function(s,t){return s+t.n;},0);
  var PC={bad:['var(--bad-bg)','var(--bad)'],warn:['var(--warn-bg)','var(--warn)'],info:['var(--info-bg)','var(--info)'],good:['var(--good-bg)','var(--good)']};

  /* phễu: danh sách vị trí */
  var vts=tdByViTri(M.cv).filter(function(v){return v.viTri!=='(trống)';});
  if(S.vitri && !vts.some(function(v){return v.viTri===S.vitri;})) S.vitri='';

  var R=2*Math.PI*28;
  setTimeout(v2Init,20);
  return ''+
  '<div class="v2">'+
  '<div class="v2-head"><div><h1>Chào Brian, đây là tình hình nhân sự hôm nay</h1>'+
    '<p>Nhân sự, hợp đồng và tuyển dụng của BigX Agency · cập nhật '+e_(HR.updated||'—')+'</p></div>'+
    '<div class="v2-actions"><div class="v2-seg" role="group" aria-label="Kỳ báo cáo">'+
      [['thang','Tháng'],['quy','3 tháng'],['nam','12 tháng']].map(function(p){return '<button type="button" data-v2period="'+p[0]+'" class="'+(S.period===p[0]?'on':'')+'" aria-pressed="'+(S.period===p[0])+'">'+p[1]+'</button>';}).join('')+
    '</div><button class="v2-btn" type="button" data-v2go="bao-cao"><i class="ti ti-report"></i>Báo cáo</button>'+
    '<button class="v2-btn pri" type="button" data-v2go="kho-cv"><i class="ti ti-upload"></i>Nạp CV mới</button></div></div>'+

  '<section class="v2-grid v2-kpis">'+kpis.map(kpiCard).join('')+'</section>'+

  '<section class="v2-grid v2-a">'+
    '<article class="v2-card"><div class="v2-ch"><div><h2>Biến động nhân sự</h2><p>Số người vào và nghỉ theo tháng · theo ngày vào / ngày nghỉ trong Hồ sơ</p></div><button class="v2-link" type="button" data-v2go="pt-bien-dong">Chi tiết</button></div>'+
    '<div class="v2-cb"><div class="v2-mini">'+
      '<div><span>'+sw(C.s1)+'Vào · '+P.label.toLowerCase()+'</span><b class="num">'+M.hires+'</b></div>'+
      '<div><span>'+sw(C.s2)+'Nghỉ</span><b class="num">'+M.T.left+'</b></div>'+
      '<div><span>Ròng</span><b class="num">'+(M.hires-M.T.left>0?'+':'')+(M.hires-M.T.left)+'</b></div>'+
      '<div><span>Tỷ lệ nghỉ kỳ này</span><b class="num">'+M.T.rate+'%</b></div>'+
    '</div><div class="v2-chart" id="v2-line" style="height:400px;margin-top:10px"></div></div></article>'+
    '<div style="display:flex;flex-direction:column;gap:20px;min-width:0">'+
      '<div class="v2-alert"><div class="ring-bg"></div>'+
        '<svg width="72" height="72" viewBox="0 0 72 72" style="flex-shrink:0" aria-hidden="true"><circle cx="36" cy="36" r="28" stroke="rgba(255,255,255,.22)" stroke-width="7" fill="none"/><circle cx="36" cy="36" r="28" stroke="#fff" stroke-width="7" fill="none" stroke-dasharray="'+(R*pctSigned/100).toFixed(1)+' 999" stroke-linecap="round" transform="rotate(-90 36 36)"/><text x="36" y="40.5" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="Be Vietnam Pro,sans-serif">'+pctSigned+'%</text></svg>'+
        '<div style="position:relative"><h3>Hợp đồng đã ký</h3><p>'+signed+'/'+staff.length+' nhân sự đang làm (không tính BOD) đã ký ít nhất 1 bản. '+(canKy.length?canKy.length+' người chưa ký bản nào.':'Không còn ai chưa ký.')+'</p>'+
        '<button type="button" data-v2go="hop-dong">Mở tab Hợp đồng <i class="ti ti-chevron-right"></i></button></div></div>'+
      '<article class="v2-card" style="flex:1"><div class="v2-ch"><div><h2>Việc cần xử lý</h2><p>Tự tổng hợp từ Hồ sơ, Hợp đồng, Tuyển dụng</p></div><span class="v2-prio" style="background:'+(todoTotal?'var(--bad-bg);color:var(--bad)':'var(--good-bg);color:var(--good)')+'">'+todoTotal+' việc</span></div>'+
      '<div class="v2-cb" style="padding-top:8px"><div class="v2-todo">'+todo.map(function(t){var pc=PC[t.k];
        return '<button type="button" data-v2go="'+t.go+'" class="'+(t.n?'':'zero')+'"><span class="ic" style="background:'+pc[0]+';color:'+pc[1]+'"><i class="ti '+t.ic+'"></i></span><span><b>'+t.t+'</b><small>'+t.s+'</small></span><span class="n num">'+t.n+(t.n?'<span class="v2-prio" style="background:'+pc[0]+';color:'+pc[1]+'">'+t.p+'</span>':'')+'</span></button>';}).join('')+
      '</div></div></article>'+
    '</div>'+
  '</section>'+

  '<section class="v2-grid v2-3">'+
    '<article class="v2-card"><div class="v2-ch"><div><h2>Cầu nối nhân sự</h2><p>Đang làm đầu kỳ → vào → nghỉ → cuối kỳ · '+P.label.toLowerCase()+'</p></div></div><div class="v2-cb"><div class="v2-chart" id="v2-bridge" style="height:220px"></div><div class="v2-foot" id="v2-bridge-note"></div></div></article>'+
    '<article class="v2-card"><div class="v2-ch"><div><h2>Cơ cấu theo phòng ban</h2><p>Nhân sự đang làm</p></div><button class="v2-link" type="button" data-v2go="so-do">Sơ đồ</button></div><div class="v2-cb" style="display:flex;align-items:center;gap:14px"><div class="v2-chart" id="v2-donut" style="width:150px;height:150px;flex-shrink:0"></div><div class="v2-dl" id="v2-dl"></div></div></article>'+
    '<article class="v2-card"><div class="v2-ch"><div><h2>Phễu tuyển dụng</h2><p>Tỷ lệ qua từng bước</p></div><select class="v2-sel" id="v2-vitri" aria-label="Lọc vị trí"><option value="">Tất cả vị trí</option>'+vts.map(function(v){return '<option value="'+e_(v.viTri)+'"'+(S.vitri===v.viTri?' selected':'')+'>'+e_(v.viTri)+' ('+v.total+')</option>';}).join('')+'</select></div><div class="v2-cb" id="v2-funnel"></div></article>'+
  '</section>'+

  '<section class="v2-grid v2-b">'+
    '<article class="v2-card"><div class="v2-ch"><div><h2>Thâm niên nhân sự</h2><p>Phân bố người đang làm theo ngày vào</p></div></div><div class="v2-cb"><div class="v2-chart" id="v2-tenure" style="height:180px"></div><div class="v2-foot" id="v2-tenure-note"></div></div>'+
      '<div class="v2-ch" style="border-top:1px solid var(--line-soft);padding-top:16px"><div><h2>Sinh nhật sắp tới</h2><p>Tháng này và tháng sau</p></div><span class="v2-prio" style="background:var(--good-bg);color:var(--good)">'+bds.length+'</span></div>'+
      '<div class="v2-cb"><div class="v2-bd">'+(bds.length?bds.slice(0,6).map(function(b,i){var when=b.days===0?'Hôm nay':b.days===1?'Ngày mai':'Còn '+b.days+' ngày';
        return '<div class="v2-bd-i">'+avatar(b.ten,i,32)+'<div><b>'+e_(b.ten)+'</b><small>'+e_(b.phong||'—')+' · '+b.dd+'</small></div>'+stPill(b.days<=7?'good':'info',when)+'</div>';}).join('')+(bds.length>6?'<div class="v2-foot">Và '+(bds.length-6)+' người nữa.</div>':''):'<div class="v2-empty">Không có sinh nhật trong tháng này và tháng sau.</div>')+'</div></div></article>'+
    '<article class="v2-card" style="overflow:hidden"><div class="v2-tbar"><div><div style="font-size:14.5px;font-weight:600;color:var(--ink)">Ứng viên mới nhất</div><div style="font-size:12px;color:var(--muted);margin-top:2px">Từ file Tuyển dụng · sắp theo ngày nộp</div></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><div class="v2-tabs" id="v2-tabs"></div><label class="v2-tsearch" for="v2-q"><i class="ti ti-search"></i><input id="v2-q" placeholder="Tìm ứng viên, vị trí…" autocomplete="off" value="'+e_(S.q)+'"></label></div></div>'+
      '<div class="v2-twrap"><table><thead><tr><th>Ứng viên</th><th>Vị trí</th><th>Ngày nộp</th><th>Trạng thái</th></tr></thead><tbody id="v2-tbody"></tbody></table></div>'+
      '<div class="v2-tfoot"><span id="v2-tcount"></span><button class="v2-link" type="button" data-v2go="tuyen-dung">Xem tất cả ứng viên <i class="ti ti-arrow-right"></i></button></div></article>'+
  '</section>'+
  '</div>';
}

/* ---------- charts ---------- */
function drawSparks(){
  var M=window.__v2M; if(!M) return;
  var map={tong:[M.tongSpark,C.s1],dang:[M.dangSpark,C.s3],rate:[M.rateSpark,C.s2],cv:[M.cvMo.map(function(x){return x.n;}),C.s4]};
  document.querySelectorAll('svg[data-spark]').forEach(function(svg){
    var o=map[svg.getAttribute('data-spark')]; if(!o||o[0].length<2){ svg.style.display='none'; return; }
    var v=o[0], c=o[1], W=96, H=40, mn=Math.min.apply(null,v), mx=Math.max.apply(null,v);
    var pts=v.map(function(x,i){return [3+i*(W-6)/(v.length-1), H-5-(x-mn)/((mx-mn)||1)*(H-12)];});
    var d=smooth(pts), l=pts[pts.length-1], id='v2sg-'+svg.getAttribute('data-spark');
    svg.setAttribute('viewBox','0 0 '+W+' '+H);
    svg.innerHTML='<defs><linearGradient id="'+id+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+c+'" stop-opacity=".22"/><stop offset="1" stop-color="'+c+'" stop-opacity="0"/></linearGradient></defs>'+
      '<path d="'+d+' L'+l[0]+' '+H+' L3 '+H+' Z" fill="url(#'+id+')"/><path d="'+d+'" stroke="'+c+'" stroke-width="2" fill="none" stroke-linecap="round"/>'+
      '<circle cx="'+l[0]+'" cy="'+l[1]+'" r="3.5" fill="'+c+'" stroke="#fff" stroke-width="2"/>';
  });
}

function drawLine(){
  var el=document.getElementById('v2-line'), M=window.__v2M; if(!el||!M) return;
  var F=M.flow; if(!F.length){ el.innerHTML='<div class="v2-empty">Chưa có dữ liệu ngày vào / ngày nghỉ.</div>'; return; }
  var W=el.clientWidth, H=el.clientHeight, L=30, R=46, T=12, B=28, n=F.length;
  var MAX=niceMax(Math.max.apply(null,F.map(function(x){return Math.max(x.inn,x.out);})),2);
  var step=MAX<=6?1:MAX<=12?2:Math.ceil(MAX/6);
  var x=function(i){return n===1?(L+(W-L-R)/2):L+i*(W-L-R)/(n-1);}, y=function(v){return T+(1-v/MAX)*(H-T-B);};
  var pa=F.map(function(f,i){return [x(i),y(f.inn)];}), pb=F.map(function(f,i){return [x(i),y(f.out)];});
  var la=smooth(pa), lb=smooth(pb), base=y(0), k=PERIODS[S.period].n, hl0=Math.max(0,n-k);
  var s='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Số người vào và nghỉ theo tháng">'+
    '<defs><linearGradient id="v2gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+C.s1+'" stop-opacity=".20"/><stop offset="1" stop-color="'+C.s1+'" stop-opacity="0"/></linearGradient></defs>';
  if(S.period!=='nam') s+='<rect x="'+(x(hl0)-14)+'" y="'+T+'" width="'+(x(n-1)-x(hl0)+28)+'" height="'+(base-T)+'" rx="6" fill="'+C.s1+'" fill-opacity=".06"/>';
  for(var g=0;g<=MAX;g+=step) s+='<line x1="'+L+'" x2="'+(W-R+6)+'" y1="'+y(g)+'" y2="'+y(g)+'" stroke="'+(g?C.line2:C.line)+'"'+(g?' stroke-dasharray="3 4"':'')+'/><text x="'+(L-10)+'" y="'+(y(g)+4)+'" text-anchor="end" font-size="11" fill="'+C.muted+'">'+g+'</text>';
  s+='<path d="'+la+' L'+x(n-1)+' '+base+' L'+x(0)+' '+base+' Z" fill="url(#v2gA)"/>'+
     '<path d="'+lb+'" stroke="'+C.s2+'" stroke-width="2" fill="none" stroke-linecap="round"/>'+
     '<path d="'+la+'" stroke="'+C.s1+'" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
  var ya=pa[n-1][1], yb=pb[n-1][1]; if(Math.abs(ya-yb)<14){ if(ya<=yb){ yb=ya+14; } else { ya=yb+14; } }
  s+='<text x="'+(x(n-1)+10)+'" y="'+(ya+4)+'" font-size="11.5" font-weight="600" fill="'+C.ink+'">Vào</text><text x="'+(x(n-1)+10)+'" y="'+(yb+4)+'" font-size="11.5" font-weight="600" fill="'+C.ink+'">Nghỉ</text>';
  F.forEach(function(f,i){ var on=S.period!=='nam'&&i>=hl0; s+='<text x="'+x(i)+'" y="'+(H-6)+'" text-anchor="middle" font-size="11" fill="'+(on?C.ink:C.muted)+'" font-weight="'+(on?600:400)+'">'+mLabel(f.k)+'</text>'; });
  s+='<g class="v2x" style="display:none"><line class="cx" y1="'+T+'" y2="'+base+'" stroke="'+C.faint+'" stroke-dasharray="3 3"/><circle class="ca" r="5" fill="'+C.s1+'" stroke="#fff" stroke-width="2.5"/><circle class="cb" r="5" fill="'+C.s2+'" stroke="#fff" stroke-width="2.5"/></g>'+
     '<circle cx="'+x(n-1)+'" cy="'+pa[n-1][1]+'" r="4" fill="'+C.s1+'" stroke="#fff" stroke-width="2"/><circle cx="'+x(n-1)+'" cy="'+pb[n-1][1]+'" r="4" fill="'+C.s2+'" stroke="#fff" stroke-width="2"/>'+
     '<rect x="'+(L-10)+'" y="0" width="'+(W-L-R+20)+'" height="'+H+'" fill="transparent"/></svg>';
  el.innerHTML=s;
  var svg=el.querySelector('svg'), cr=svg.querySelector('.v2x');
  svg.addEventListener('mousemove',function(ev){
    var b=svg.getBoundingClientRect(); var i=n===1?0:Math.round((ev.clientX-b.left-L)/((W-L-R)/(n-1))); i=Math.max(0,Math.min(n-1,i));
    cr.style.display=''; var cx=cr.querySelector('.cx'); cx.setAttribute('x1',x(i)); cx.setAttribute('x2',x(i));
    cr.querySelector('.ca').setAttribute('cx',x(i)); cr.querySelector('.ca').setAttribute('cy',pa[i][1]);
    cr.querySelector('.cb').setAttribute('cx',x(i)); cr.querySelector('.cb').setAttribute('cy',pb[i][1]);
    var f=F[i]; showTip('<div class="tt">Tháng '+mLong(f.k)+'</div>'+tr(C.s1,'Vào',f.inn)+tr(C.s2,'Nghỉ',f.out)+'<div class="tr sep"><span>Ròng</span><b>'+(f.net>0?'+':'')+f.net+'</b></div>',b.left+x(i),b.top+Math.min(pa[i][1],pb[i][1]));
  });
  svg.addEventListener('mouseleave',function(){ cr.style.display='none'; hideTip(); });
}

function drawBridge(){
  var el=document.getElementById('v2-bridge'), M=window.__v2M; if(!el||!M) return;
  var h0=M.T.h0, h1=M.T.h1, inn=M.hires, out=M.T.left, adj=h1-(h0+inn-out);
  var steps=[['Đầu kỳ',0,h0,C.s3,h0+' người'],['Vào',h0,h0+inn,C.s1,'+'+inn],['Nghỉ',h0+inn-out,h0+inn,C.s2,'−'+out],['Cuối kỳ',0,h1,C.s3,h1+' người']];
  var W=el.clientWidth, H=el.clientHeight, L=26, T=18, B=26, top=Math.max(h0+inn,h1,1);
  var step=top<=10?2:top<=30?5:10, mx=niceMax(top,step);
  var y=function(v){return T+(1-v/mx)*(H-T-B);}, slot=(W-L)/4, bw=Math.min(46,slot-24);
  var s='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Cầu nối nhân sự">';
  for(var g=0;g<=mx;g+=step) s+='<line x1="'+L+'" x2="'+W+'" y1="'+y(g)+'" y2="'+y(g)+'" stroke="'+(g?C.line2:C.line)+'"'+(g?' stroke-dasharray="3 4"':'')+'/><text x="'+(L-8)+'" y="'+(y(g)+4)+'" text-anchor="end" font-size="11" fill="'+C.muted+'">'+g+'</text>';
  steps.forEach(function(st,i){
    var cx=L+slot*(i+.5), x0=cx-bw/2, y0=y(st[2]), y1=y(st[1]), h=Math.max(2,y1-y0);
    s+='<rect x="'+x0+'" y="'+y0+'" width="'+bw+'" height="'+h+'" rx="4" fill="'+st[3]+'" data-i="'+i+'"/>';
    s+='<text x="'+cx+'" y="'+(y0-6)+'" text-anchor="middle" font-size="12" font-weight="700" fill="'+C.ink+'">'+(i===1?'+'+inn:i===2?'−'+out:st[2])+'</text>';
    s+='<text x="'+cx+'" y="'+(H-6)+'" text-anchor="middle" font-size="11" fill="'+C.muted+'">'+st[0]+'</text>';
    if(i<3){ var ly=i===2?y(st[1]):y(st[2]); s+='<line x1="'+(x0+bw)+'" x2="'+(L+slot*(i+1.5)-bw/2)+'" y1="'+ly+'" y2="'+ly+'" stroke="'+C.faint+'" stroke-dasharray="2 3"/>'; }
  });
  el.innerHTML=s+'</svg>';
  el.querySelectorAll('rect[data-i]').forEach(function(r){ r.addEventListener('mousemove',function(ev){ var st=steps[+r.getAttribute('data-i')]; showTip('<div class="tt">'+st[0]+'</div>'+tr(st[3],'Số người',st[4]),ev.clientX,ev.clientY); }); r.addEventListener('mouseleave',hideTip); });
  var note=document.getElementById('v2-bridge-note');
  if(note) note.innerHTML=adj?('<i class="ti ti-info-circle"></i> Lệch '+(adj>0?'+':'')+adj+' người do hồ sơ thiếu ngày vào / ngày nghỉ.'):'Tính theo ngày vào và ngày nghỉ trong Hồ sơ.';
}

function drawDonut(){
  var el=document.getElementById('v2-donut'), M=window.__v2M; if(!el||!M) return;
  var cnt=csCount(M.act,'phong'), cols=[C.s1,C.s2,C.s3,C.s4];
  var parts=cnt.slice(0,4).map(function(d,i){return [d[0],d[1],cols[i]];});
  if(cnt.length>4){ var rest=cnt.slice(4).reduce(function(s,d){return s+d[1];},0); parts.push(['Khác',rest,C.s5]); }
  var tot=parts.reduce(function(s,d){return s+d[1];},0)||1, R=64, CC=2*Math.PI*R, acc=0;
  var s='<svg width="150" height="150" viewBox="0 0 170 170" role="img" aria-label="Cơ cấu nhân sự theo phòng ban">';
  parts.forEach(function(d,i){ var len=d[1]/tot*CC, hl=S.hlDept===i, dim=S.hlDept>=0&&!hl, gap=parts.length>1?3:0;
    s+='<circle cx="85" cy="85" r="'+R+'" fill="none" stroke="'+d[2]+'" stroke-width="'+(hl?22:17)+'" stroke-dasharray="'+Math.max(0,len-gap).toFixed(2)+' '+(CC-len+gap).toFixed(2)+'" stroke-dashoffset="'+(-acc).toFixed(2)+'" transform="rotate(-90 85 85)" opacity="'+(dim?.35:1)+'" data-i="'+i+'" style="transition:stroke-width .15s,opacity .15s"/>'; acc+=len; });
  var cur=S.hlDept>=0?parts[S.hlDept]:null;
  s+='<text x="85" y="79" text-anchor="middle" font-size="11.5" fill="'+C.muted+'">'+e_(cur?(cur[0].length>14?cur[0].slice(0,13)+'…':cur[0]):'Đang làm')+'</text><text x="85" y="104" text-anchor="middle" font-size="26" font-weight="700" fill="'+C.ink+'">'+(cur?cur[1]:M.act.length)+'</text></svg>';
  el.innerHTML=s;
  var dl=document.getElementById('v2-dl');
  if(dl) dl.innerHTML=parts.map(function(d,i){return '<button type="button" data-v2dept="'+i+'" class="'+(S.hlDept===i?'hl':'')+'" title="'+e_(d[0])+'"><span>'+sw(d[2])+e_(d[0])+'</span><b>'+d[1]+' · '+Math.round(d[1]/tot*100)+'%</b></button>';}).join('');
  el.querySelectorAll('circle[data-i]').forEach(function(c){ c.addEventListener('mouseenter',function(){ setDept(+c.getAttribute('data-i')); }); c.addEventListener('mouseleave',function(){ setDept(-1); }); });
}
function setDept(i){ if(S.hlDept===i) return; S.hlDept=i; drawDonut(); }

function drawFunnel(){
  var el=document.getElementById('v2-funnel'), M=window.__v2M; if(!el||!M) return;
  var list=S.vitri?M.cv.filter(function(c){return (c.viTri||'').trim()===S.vitri;}):M.cv;
  var fn=tdFunnel(list), top=fn[0].n||1, worst=-1, wv=101;
  for(var i=1;i<fn.length;i++){ if(!fn[i-1].n) continue; var r=pct(fn[i].n,fn[i-1].n); if(r<wv){ wv=r; worst=i; } }
  el.innerHTML=fn.map(function(f,i){ var cv=i&&fn[i-1].n?pct(f.n,fn[i-1].n):null;
    return '<div class="v2-fn"><span class="l" title="'+e_(f.label)+'">'+e_(f.label)+'</span><div class="bar"><i style="width:0;opacity:'+(1-i*.12).toFixed(2)+'" data-w="'+(f.n/top*100).toFixed(1)+'"></i></div><span class="v">'+f.n+(cv!==null?' <small>· '+cv+'%</small>':'')+'</span></div>'; }).join('')+
    (worst>0?'<div class="v2-note"><i class="ti ti-trending-down"></i><span>Rơi nhiều nhất: <b>'+e_(fn[worst-1].label)+' → '+e_(fn[worst].label)+'</b> ('+wv+'% qua). Đậu chung '+pct(fn[5].n,fn[0].n)+'%.</span></div>':'<div class="v2-empty">Chưa có dữ liệu cho vị trí này.</div>');
  requestAnimationFrame(function(){ el.querySelectorAll('[data-w]').forEach(function(b){ b.style.width=b.getAttribute('data-w')+'%'; }); });
}

function drawTenure(){
  var el=document.getElementById('v2-tenure'), M=window.__v2M; if(!el||!M) return;
  var B=[['< 3 tháng',0,3],['3–6 tháng',3,6],['6–12 tháng',6,12],['1–2 năm',12,24],['> 2 năm',24,1e9]], cnt=[0,0,0,0,0], unk=0;
  M.act.forEach(function(e){ var t=csTenureMonths(e); if(t==null){unk++;return;} for(var i=0;i<B.length;i++){ if(t>=B[i][1]&&t<B[i][2]){cnt[i]++;break;} } });
  var W=el.clientWidth, H=el.clientHeight, L=24, T=16, Bm=26, mxv=Math.max.apply(null,cnt), step=mxv<=10?2:5, mx=niceMax(mxv,step);
  var y=function(v){return T+(1-v/mx)*(H-T-Bm);}, slot=(W-L)/B.length, bw=Math.min(40,slot-18);
  var s='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Phân bố thâm niên">';
  for(var g=0;g<=mx;g+=step) s+='<line x1="'+L+'" x2="'+W+'" y1="'+y(g)+'" y2="'+y(g)+'" stroke="'+(g?C.line2:C.line)+'"'+(g?' stroke-dasharray="3 4"':'')+'/><text x="'+(L-8)+'" y="'+(y(g)+4)+'" text-anchor="end" font-size="11" fill="'+C.muted+'">'+g+'</text>';
  B.forEach(function(b,i){ var cx=L+slot*(i+.5), x0=cx-bw/2, y0=y(cnt[i]), bb=y(0);
    if(cnt[i]>0) s+='<path d="M'+x0+' '+bb+' V'+Math.min(bb,y0+4)+' Q'+x0+' '+y0+' '+(x0+4)+' '+y0+' H'+(x0+bw-4)+' Q'+(x0+bw)+' '+y0+' '+(x0+bw)+' '+Math.min(bb,y0+4)+' V'+bb+' Z" fill="'+C.s4+'" data-i="'+i+'"/>';
    s+='<text x="'+cx+'" y="'+(y0-6)+'" text-anchor="middle" font-size="11.5" font-weight="600" fill="'+C.ink+'">'+cnt[i]+'</text><text x="'+cx+'" y="'+(H-6)+'" text-anchor="middle" font-size="11" fill="'+C.muted+'">'+b[0]+'</text>'; });
  el.innerHTML=s+'</svg>';
  el.querySelectorAll('path[data-i]').forEach(function(p){ p.addEventListener('mousemove',function(ev){ var i=+p.getAttribute('data-i'); showTip('<div class="tt">Thâm niên '+B[i][0]+'</div>'+tr(C.s4,'Nhân sự',cnt[i]+' người'),ev.clientX,ev.clientY); }); p.addEventListener('mouseleave',hideTip); });
  var note=document.getElementById('v2-tenure-note'); if(note) note.textContent=unk?(unk+' người chưa có ngày vào nên không tính.'):'';
}

function bucketKind(st){ return st.bucket==='trung'?'good':st.bucket==='loai'?'bad':(st.cls==='clay'?'warn':'info'); }
function drawTable(){
  var tb=document.getElementById('v2-tbody'), M=window.__v2M; if(!tb||!M) return;
  var rows=M.cv.map(function(c){return {c:c,st:tdStage(c),d:parseDMY(c.ngayNop)};}).sort(function(a,b){ if(!a.d&&!b.d) return 0; if(!a.d) return 1; if(!b.d) return -1; return b.d-a.d; });
  var cnt={all:rows.length,xuly:0,trung:0,loai:0}; rows.forEach(function(r){ cnt[r.st.bucket]=(cnt[r.st.bucket]||0)+1; });
  var tabs=document.getElementById('v2-tabs');
  if(tabs) tabs.innerHTML=[['all','Tất cả'],['xuly','Đang xử lý'],['trung','Trúng tuyển'],['loai','Loại']].map(function(t){return '<button type="button" data-v2filter="'+t[0]+'" class="'+(S.filter===t[0]?'on':'')+'">'+t[1]+'<em>'+(cnt[t[0]]||0)+'</em></button>';}).join('');
  var q=S.q.trim().toLowerCase();
  var f=rows.filter(function(r){ return (S.filter==='all'||r.st.bucket===S.filter) && (!q || ((r.c.hoTenMask||'')+' '+(r.c.viTri||'')).toLowerCase().indexOf(q)>=0); });
  var show=f.slice(0,8);
  tb.innerHTML=show.length?show.map(function(r,i){ return '<tr><td><div class="v2-person">'+avatar(r.c.hoTenMask,i,30)+'<b>'+e_(r.c.hoTenMask||'—')+'</b></div></td><td>'+e_(r.c.viTri||'—')+'</td><td class="num">'+e_(r.c.ngayNop||'—')+'</td><td>'+stPill(bucketKind(r.st),r.st.label)+'</td></tr>'; }).join('')
    :'<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:28px">Không có ứng viên khớp bộ lọc. Thử bỏ bớt điều kiện tìm.</td></tr>';
  var c=document.getElementById('v2-tcount'); if(c) c.textContent='Hiển thị '+show.length+' / '+f.length+' ứng viên'+(f.length!==rows.length?' (lọc từ '+rows.length+')':'');
}

function v2Init(){ if(!document.querySelector('.v2')) return; drawSparks(); drawLine(); drawBridge(); drawDonut(); drawFunnel(); drawTenure(); drawTable(); }
window.v2Init=v2Init;

/* ---------- gắn vào router của app.js ---------- */
renderOverview = renderOverviewV2;   // go('overview') gọi hàm này

document.addEventListener('click',function(ev){
  var t=ev.target.closest('[data-v2period],[data-v2go],[data-v2filter],[data-v2dept],.v2-kpi[data-go]'); if(!t) return;
  if(t.hasAttribute('data-v2period')){ S.period=t.getAttribute('data-v2period'); try{localStorage.setItem('bx-v2-period',S.period);}catch(e){} go('overview'); return; }
  if(t.hasAttribute('data-v2go')){ go(t.getAttribute('data-v2go')); return; }
  if(t.hasAttribute('data-v2filter')){ S.filter=t.getAttribute('data-v2filter'); drawTable(); return; }
  if(t.hasAttribute('data-v2dept')){ var i=+t.getAttribute('data-v2dept'); setDept(S.hlDept===i?-1:i); return; }
  if(t.hasAttribute('data-go')){ go(t.getAttribute('data-go')); }
});
document.addEventListener('keydown',function(ev){ if((ev.key==='Enter'||ev.key===' ')&&ev.target.matches&&ev.target.matches('.v2-kpi[data-go]')){ ev.preventDefault(); go(ev.target.getAttribute('data-go')); } });
document.addEventListener('input',function(ev){ if(ev.target.id==='v2-q'){ S.q=ev.target.value; drawTable(); } });
document.addEventListener('change',function(ev){ if(ev.target.id==='v2-vitri'){ S.vitri=ev.target.value; drawFunnel(); } });
var rz; window.addEventListener('resize',function(){ clearTimeout(rz); rz=setTimeout(function(){ if(document.querySelector('.v2')){ drawLine(); drawBridge(); drawTenure(); } },120); });
})();
