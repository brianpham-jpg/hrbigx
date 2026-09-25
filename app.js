/* ============================================================
   BigX HR Analytics Dashboard — app.js
   Điều hướng + data thật từ API hub (1 nguồn, đã lọc PII).
   ============================================================ */

var API_URL = 'https://script.google.com/macros/s/AKfycbwEnVeOgLI8DSnLjCWDGyCZx-878CJNVRWtobRX8AXadpiXfy4lXCQvXx0KMNUSm2AQ/exec';

/* Kho dữ liệu (nạp 1 lần) */
var HR = { loaded:false, error:null, updated:'', nhansu:[], tuyendung:[] };

/* ---- Cấu trúc điều hướng (5 nhóm) ---- */
const NAV = [
  { group:'Tổng quan', items:[
    { id:'overview', label:'Bảng điều khiển', icon:'ti-layout-dashboard',
      lead:'Một màn hình để nhìn nhanh trong 10 giây: các chỉ số chính, funnel tóm tắt, cảnh báo hợp đồng & sinh nhật.',
      points:['Dải KPI: tổng nhân sự, đang tuyển, CV trong kỳ','Funnel tuyển dụng rút gọn + cảnh báo hết hạn hợp đồng','Nhắc sinh nhật và công việc cần chú ý'],
      skeleton:'kpi' }
  ]},
  { group:'Vận hành — dữ liệu gốc', items:[
    { id:'ho-so',    label:'Hồ sơ nhân sự', icon:'ti-id-badge',
      lead:'Danh sách nhân sự để tra cứu — đọc từ file nguồn qua API, đã ẩn cột nhạy cảm (CCCD, SĐT, địa chỉ).' },
    { id:'tuyen-dung', label:'Tuyển dụng', icon:'ti-file-description',
      lead:'Danh sách CV & vị trí tuyển dụng — nơi tra cứu và cập nhật trạng thái ứng viên.',
      points:['Danh sách vị trí đang mở','Bảng CV theo vị trí & trạng thái','Ghi chú kết quả từng vòng'] },
    { id:'kho-cv',   label:'Kho CV', icon:'ti-folder',
      lead:'Kho lưu và tra cứu hồ sơ CV ứng viên.',
      points:['Lưu trữ CV theo vị trí','Tra cứu nhanh','Gắn kết với pipeline tuyển dụng'] },
    { id:'cong-viec', label:'Công việc HR', icon:'ti-checklist',
      lead:'Danh sách task HR: phụ trách, phòng ban, deadline, ưu tiên, trạng thái.',
      points:['Bảng task đang chạy','Lọc theo người phụ trách / trạng thái','Nhắc deadline'] },
    { id:'cham-cong', label:'Chấm công & phép', icon:'ti-calendar-stats', badge:'gộp',
      lead:'Bảng công theo tháng và phép năm còn lại — gộp chung một chỗ.',
      points:['Ngày công, đi trễ, tăng ca theo tháng','Nghỉ phép & phép còn lại','Theo khoá Tháng + Mã NV'] },
    { id:'hop-dong', label:'Hợp đồng', icon:'ti-file-certificate', badge:'new',
      lead:'Theo dõi hợp đồng nhân sự và cảnh báo sắp hết hạn.',
      points:['Loại HĐ, ngày bắt đầu / hết hạn, trạng thái','Cảnh báo hết hạn / quá hạn','Form mẫu HĐ BigX'] }
  ]},
  { group:'Phân tích', star:true, items:[
    { id:'pt-chi-so', label:'Chỉ số & xu hướng', icon:'ti-chart-bar', badge:'new',
      lead:'Biến số liệu thành xu hướng: headcount, cơ cấu, và các chỉ số HR theo thời gian.',
      points:['Headcount theo tháng (vào / nghỉ / ròng)','Cơ cấu theo phòng ban, loại HĐ, thâm niên','Xu hướng nhiều kỳ để so sánh'],
      skeleton:'charts' },
    { id:'pt-tuyen-dung', label:'Hiệu quả tuyển dụng', icon:'ti-activity', badge:'new',
      lead:'Funnel & hiệu quả nguồn CV: nơi biến tuyển dụng thành quyết định.',
      points:['Funnel: CV → phỏng vấn → offer → nhận việc','Tỷ lệ chuyển đổi từng bước','Hiệu quả theo nguồn CV, time-to-hire'],
      skeleton:'charts' },
    { id:'pt-bien-dong', label:'Biến động nhân sự', icon:'ti-trending-up', badge:'new',
      lead:'Turnover & giữ chân: ai vào, ai nghỉ, và vì sao.',
      points:['Turnover / attrition rate theo kỳ','Tỷ lệ giữ chân, thâm niên trung bình','Biến động theo phòng ban'],
      skeleton:'charts' },
    { id:'pt-nang-suat', label:'Chấm công & năng suất', icon:'ti-clock', badge:'new',
      lead:'Từ bảng công đến góc nhìn năng suất.',
      points:['Ngày công, đi trễ, tăng ca theo nhóm','So sánh giữa phòng ban','Xu hướng theo tháng'],
      skeleton:'charts' },
    { id:'bao-cao', label:'Báo cáo', icon:'ti-report', badge:'new',
      lead:'Báo cáo tổng hợp theo tuần / tháng — tuyển dụng, biến động nhân sự, chấm công, hợp đồng; tự gửi email T2 hằng tuần & ngày 1 hằng tháng.',
      points:['Toggle Tuần / Tháng, chọn kỳ bất kỳ','So sánh kỳ trước, đi trễ theo tên','In / Xuất PDF · tự gửi email'] }
  ]},
  { group:'Tổ chức & tham chiếu', items:[
    { id:'so-do',   label:'Sơ đồ tổ chức', icon:'ti-sitemap',
      lead:'Sơ đồ tổ chức BigX — tài liệu tĩnh, ít thay đổi.',
      points:['Cây tổ chức theo phòng ban','Ban giám đốc & đầu mối'] },
    { id:'quy-dinh', label:'Quy định & Quy trình', icon:'ti-book',
      lead:'Quy định nội bộ và quy trình HR.',
      points:['Bộ quy định nhân sự','Quy trình tuyển dụng / onboarding','Tài liệu tham chiếu'] },
    { id:'calendar', label:'Calendar', icon:'ti-calendar',
      lead:'Lịch HR — sự kiện, deadline, mốc quan trọng.',
      points:['Lịch tháng','Sự kiện & nhắc việc'] }
  ]},
  { group:'Hệ thống', items:[
    { id:'nguon',   label:'Nguồn dữ liệu', icon:'ti-database-import', badge:'new',
      lead:'Trái tim kiến trúc "1 nguồn": web đọc từ đúng 1 API, ghép theo Mã NV, lọc PII. Mọi tab đọc từ đây.',
      points:['API hub đọc: Hồ sơ + Tuyển dụng (Chấm công cắm sau)','Kiểm tra tính toàn vẹn theo Mã NV','PII (CCCD/SĐT/địa chỉ) không bao giờ rời file nguồn'],
      skeleton:'source' }
  ]}
];

var MAP = {};
NAV.forEach(function(g){ g.items.forEach(function(it){ MAP[it.id]={item:it, group:g}; }); });

/* ---- Data loader (cache phía web + tự thử lại) ---- */
var HR_CACHE_KEY = 'bigx_hr_cache_v1';

function applyData(d, fromCache){
  HR.loaded=true; HR.error=null;
  HR.updated=d.updated||''; HR.nhansu=d.nhansu||[]; HR.tuyendung=d.tuyendung||[]; HR.viTriList=d.viTriList||[];
  var up=document.getElementById('tb-note');
  if(up) up.textContent = 'Cập nhật: '+HR.updated + (fromCache?' · đang làm mới…':'');
  // [D] Dữ liệu giống lần trước thì không vẽ lại; tab Chấm công (khung nhúng, không dùng dữ liệu này) không bao giờ bị nạp lại → không mất thao tác đang làm
  var sig=''; try{ sig=JSON.stringify([HR.nhansu,HR.tuyendung,HR.viTriList]); }catch(e){}
  var same=(sig && sig===window.__hrSig); window.__hrSig=sig;
  if(currentTab && !same && currentTab!=='cham-cong') go(currentTab);
}

function fetchHR(tries, fresh){
  var url = API_URL + (fresh?'?fresh=1':'');
  var p = window.bxAuthedFetch ? window.bxAuthedFetch(url,{cache:'no-store'}) : fetch(url,{cache:'no-store'});
  return p
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .catch(function(e){
      if(tries>0){ return new Promise(function(res){ setTimeout(res,1200); }).then(function(){ return fetchHR(tries-1, fresh); }); }
      throw e;
    });
}

/* force=true → gọi API bỏ qua cache máy chủ (dùng sau khi upload CV để lấy data mới ngay) */
function loadData(force){
  HR.error=null;
  /* 1) vẽ NGAY từ bản lưu trong trình duyệt (nếu có) để không phải chờ API */
  try{
    var raw=localStorage.getItem(HR_CACHE_KEY);
    if(raw){ var c=JSON.parse(raw); if(c && c.nhansu) applyData(c, true); }
  }catch(e){}

  /* 2) gọi API nền (thử lại 2 lần), xong thì cập nhật + lưu cache */
  fetchHR(2, force)
    .then(function(d){
      applyData(d, false);
      try{ localStorage.setItem(HR_CACHE_KEY, JSON.stringify(d)); }catch(e){}
    })
    .catch(function(e){
      if(HR.loaded){ // đã có cache → giữ nguyên, chỉ báo chưa làm mới được
        var up=document.getElementById('tb-note'); if(up) up.textContent='Cập nhật: '+HR.updated+' · chưa làm mới được';
      } else {
        HR.error = e.message||'Lỗi kết nối';
        if(currentTab) go(currentTab);
      }
    });
}

/* ---- Sidebar ---- */
function renderNav(){
  var nav=document.getElementById('nav');
  nav.innerHTML = NAV.map(function(g){
    return '<div class="nav-group"><div class="nav-glabel">'+g.group+(g.star?'<span class="star">★</span>':'')+'</div>'+
      g.items.map(function(it){
        return '<div class="nav-item" id="nav-'+it.id+'" onclick="go(\''+it.id+'\')"><i class="ti '+it.icon+'"></i><span>'+it.label+'</span>'+
          (it.badge==='new'?'<span class="nav-badge new">Mới</span>':'')+
          (it.badge==='gộp'?'<span class="nav-badge new">Gộp</span>':'')+'</div>';
      }).join('')+'</div>';
  }).join('');
}

/* ---- Helpers ---- */
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function statusPill(tt){
  var cls='gray';
  if(tt==='Đang làm việc') cls='teal';
  else if(tt==='Nghỉ việc') cls='rust';
  else if(tt==='Thử việc') cls='clay';
  return '<span class="pill '+cls+'">'+esc(tt||'—')+'</span>';
}
function parseDMY(s){ var p=String(s||'').trim().split(/\s+/)[0].split('/'); if(p.length!==3||!/^\d{4}$/.test(p[2])) return null; var dd=+p[0], mo=+p[1], yy=+p[2]; var d=new Date(yy,mo-1,dd); return (isNaN(d)||d.getFullYear()!==yy||d.getMonth()!==mo-1||d.getDate()!==dd)?null:d; } // [E] 31/02, 01/03/26, 01/02/ → null
/* [E] Khoá tháng 'MM/YYYY' từ ngày dd/mm/yyyy — bỏ ngày sai hoặc năm vô lý (tránh trục tháng rỗng / 240 tháng) */
function monthKey(s){ var d=parseDMY(s); if(!d) return null; var y=d.getFullYear(), ny=new Date().getFullYear(); if(y<2015||y>ny+1) return null; return String(d.getMonth()+1).padStart(2,'0')+'/'+y; } // [D] ngày sai định dạng → null (không ra Invalid Date)
/* [D] MỘT định nghĩa chung cho mọi tab: "Nghỉ việc" = đã nghỉ; còn lại (Đang làm việc, Thử việc, Adviser…) = đang làm */
function isLeft(e){ return /^nghỉ việc$/i.test(String((e&&e.tinhTrang)||'').normalize('NFC').trim()); }
function isWorking(e){ return !isLeft(e); }
window.isLeft=isLeft; window.isWorking=isWorking;
/* [B1] Lấp tháng trống (k='MM/YYYY') từ tháng đầu tới tháng hiện tại → trục tháng liên tục, "so với tháng trước" đúng tháng liền kề */
function fillMonths(arr, mk){
  if(!arr.length) return arr;
  var by={}; arr.forEach(function(x){by[x.k]=x;});
  var F=arr[0].k.split('/'), L=arr[arr.length-1].k.split('/');
  var now=new Date(), end=Math.max(now.getFullYear()*12+now.getMonth()+1, (+L[1])*12+(+L[0]));
  var cur=Math.max((+F[1])*12+(+F[0]), end-239); // tối đa 240 tháng (chặn dữ liệu gõ sai năm)
  var out=[];
  for(;cur<=end;cur++){ var y=Math.floor((cur-1)/12), m=cur-y*12, k=String(m).padStart(2,'0')+'/'+y; out.push(by[k]||mk(k)); }
  return out;
}
/* [B1] Tỷ lệ nghỉ theo kỳ = số nghỉ trong kỳ ÷ nhân sự bình quân.
   NS bình quân: kỳ 1 tháng = (đầu kỳ + cuối kỳ)/2; kỳ 12 tháng = trung bình NS cuối mỗi tháng (chuẩn SHRM, đúng hơn khi công ty tăng nhanh).
   Người đã nghỉ nhưng CHƯA có ngày nghỉ: không xác định được kỳ → không tính. */
function bdTurnover(start, end, list, snaps){
  list=list||HR.nhansu||[];
  function st(e){ var d=parseDMY(e.ngayVao); return (d&&!isNaN(d))?d:null; }
  function en(e){ if(!isLeft(e)) return null; var d=parseDMY(e.ngayNghi); return (d&&!isNaN(d))?d:'x'; }
  function on(e,t){ var a=st(e), b=en(e); if(!a||a>t||b==='x') return false; return !b||b>t; }
  var h0=0,h1=0,left=0,stay=0;
  list.forEach(function(e){
    var a0=on(e,start), a1=on(e,end), b=en(e);
    if(a0) h0++; if(a1) h1++; if(a0&&a1) stay++;
    if(b&&b!=='x'&&b>start&&b<=end) left++;
  });
  var avg=(h0+h1)/2;
  if(snaps&&snaps.length) avg=snaps.reduce(function(sum,t){ return sum+list.filter(function(e){return on(e,t);}).length; },0)/snaps.length;
  return {left:left, h0:h0, h1:h1, avg:avg, rate:avg?Math.round(left/avg*1000)/10:0, retention:h0?Math.round(stay/h0*1000)/10:0};
}
function bdTurn12(){
  var end=new Date(); end.setHours(23,59,59,0);
  var start=new Date(end.getFullYear()-1, end.getMonth(), end.getDate(), 23,59,59);
  var snaps=[]; for(var i=12;i>=0;i--){ var d=new Date(end.getFullYear(), end.getMonth()-i+1, 0, 23,59,59); snaps.push(d>end?end:d); } // cuối 13 tháng (tháng này = hôm nay)
  var ns=HR.nhansu||[], all=bdTurnover(start,end,ns,snaps), g={};
  ns.forEach(function(e){ var v=(String(e.phong||'').trim())||'(trống)'; (g[v]=g[v]||[]).push(e); });
  all.depts=Object.keys(g).map(function(k){ var t=bdTurnover(start,end,g[k],snaps); t.phong=k; return t; });
  return all;
}
function bdMonthRate(k){ var p=k.split('/'), y=+p[1], m=+p[0]; var s=new Date(y,m-1,0,23,59,59), e=new Date(y,m,0,23,59,59); var now=new Date(); if(e>now) e=now; return bdTurnover(s,e).rate; }
function hoSoBadge(s){
  if(!s) return '<span class="pill gray">—</span>';
  if(/thiếu/i.test(s)) return '<span class="pill clay">Thiếu</span>';
  if(/đủ/i.test(s)) return '<span class="pill teal">Đủ</span>';
  return '<span class="pill gray">'+esc(s)+'</span>';
}
function conLaiNum(v){ var n=parseInt(String(v).replace(/[^\-0-9]/g,''),10); return isNaN(n)?null:n; }
function loaiHDShort(s){ return s==='Lao động chính thức' ? 'Chính thức' : (s||'—'); }
function isNewHire(ngayVao){ var d=parseDMY(ngayVao); if(!d) return false; var days=(Date.now()-d.getTime())/86400000; return days>=0 && days<=45; }
/* sắp theo ngày vào giảm dần (mới nhất trên đầu); thiếu ngày xuống cuối */
function byNgayVaoDesc(a,b){
  var da=parseDMY(a.ngayVao), db=parseDMY(b.ngayVao);
  if(!da && !db) return 0; if(!da) return 1; if(!db) return -1;
  return db.getTime()-da.getTime();
}

/* ---- Empty state (tab chưa gắn data) ---- */
function emptyState(item, group){
  var points=(item.points||[]).map(function(p){return '<div class="empty-li"><i class="ti ti-point"></i>'+esc(p)+'</div>';}).join('');
  return '<div class="empty"><div class="empty-icon"><i class="ti '+item.icon+'"></i></div><div class="empty-body">'+
    '<div class="empty-kicker">'+(group.star?'Phân tích ★':esc(group.group))+'</div>'+
    '<div class="empty-title">Khung đã sẵn sàng — chưa gắn dữ liệu</div>'+
    '<div class="empty-text">Nội dung sẽ hiển thị ở đây sau khi nạp dữ liệu từ <b>Nguồn dữ liệu</b>. Bố cục dự kiến:</div>'+
    '<div class="empty-list">'+points+'</div>'+
    '<div class="empty-foot"><i class="ti ti-plug-connected"></i>Bước tiếp theo: gắn dữ liệu cho tab này.</div>'+
    '</div></div>';
}

/* ---- Trạng thái tải ---- */
function loadingBox(){ return '<div class="empty"><div class="empty-icon"><i class="ti ti-loader"></i></div><div class="empty-body"><div class="empty-title">Đang tải dữ liệu…</div><div class="empty-text">Đọc từ API hub (Hồ sơ + Tuyển dụng).</div></div></div>'; }
function errorBox(){ return '<div class="empty"><div class="empty-icon" style="color:var(--rust);"><i class="ti ti-wifi-off"></i></div><div class="empty-body"><div class="empty-kicker" style="color:var(--rust);">Lỗi kết nối</div><div class="empty-title">Không đọc được dữ liệu</div><div class="empty-text">'+esc(HR.error)+'</div><div class="empty-foot"><i class="ti ti-refresh"></i>Thử tải lại trang, hoặc kiểm tra API hub đã deploy "Bất kỳ ai".</div></div></div>'; }

/* ============================================================
   TAB: HỒ SƠ NHÂN SỰ
   ============================================================ */
var hsFilter = { q:'', phong:'', tt:'' };

function renderHoSo(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  var ns = HR.nhansu.slice().sort(function(a,b){ return String(a.maNV).localeCompare(String(b.maNV)); });

  var tong = ns.length;
  var dangLam = ns.filter(isWorking).length;
  var nghi = ns.filter(isLeft).length;
  var phongList = []; ns.forEach(function(e){ if(e.phong && phongList.indexOf(e.phong)<0) phongList.push(e.phong); });
  var ttList = []; ns.forEach(function(e){ if(e.tinhTrang && ttList.indexOf(e.tinhTrang)<0) ttList.push(e.tinhTrang); });
  var thieuHS = ns.filter(function(e){ return isWorking(e) && /thiếu/i.test(e.tinhTrangHoSo||''); }).length;

  var kpis = [
    ['Tổng nhân sự', tong, 'ti-users', ''],
    ['Đang làm', dangLam, 'ti-user-check', ''],
    ['Nghỉ việc', nghi, 'ti-user-off', ''],
    ['Thiếu hồ sơ', thieuHS, 'ti-file-alert', thieuHS>0?'warn':'']
  ].map(function(k){
    return '<div class="stat'+(k[3]==='warn'?' stat-warn':'')+'"><div class="stat-top"><span class="stat-lbl">'+k[0]+'</span><i class="ti '+k[2]+'"></i></div><div class="stat-val">'+k[1]+'</div></div>';
  }).join('');

  var opt = function(list, sel){ return '<option value="">Tất cả</option>'+list.map(function(x){return '<option value="'+esc(x)+'"'+(sel===x?' selected':'')+'>'+esc(x)+'</option>';}).join(''); };

  var html =
    '<div class="page-head"><div class="page-h1">Hồ sơ nhân sự</div>'+
    '<div class="page-lead">'+esc(MAP['ho-so'].item.lead)+'</div></div>'+
    '<div class="stat-row">'+kpis+'</div>'+
    '<div class="toolbar">'+
      '<div class="tb-search"><i class="ti ti-search"></i><input id="hs-q" placeholder="Tìm tên hoặc mã NV…" value="'+esc(hsFilter.q)+'" oninput="hsOn()"></div>'+
      '<select id="hs-phong" onchange="hsOn()"><option value="">Tất cả phòng</option>'+phongList.map(function(x){return '<option value="'+esc(x)+'"'+(hsFilter.phong===x?' selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select>'+
      '<select id="hs-tt" onchange="hsOn()"><option value="">Mọi trạng thái</option>'+ttList.map(function(x){return '<option value="'+esc(x)+'"'+(hsFilter.tt===x?' selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select>'+
      '<span class="tb-count" id="hs-count"></span>'+
    '</div>'+
    '<div class="table-wrap"><table class="dt"><thead><tr>'+
      '<th>Mã NV</th><th>Họ tên</th><th>Phòng ban</th><th>Chức vụ</th><th>Trạng thái</th><th>Ngày vào</th><th>Thâm niên</th><th>Loại HĐ</th><th>Sinh nhật</th><th>Hồ sơ</th>'+
    '</tr></thead><tbody id="hs-body"></tbody></table></div>';

  setTimeout(hsRenderBody, 0);
  return html;
}

function hsOn(){
  hsFilter.q = (document.getElementById('hs-q')||{}).value || '';
  hsFilter.phong = (document.getElementById('hs-phong')||{}).value || '';
  hsFilter.tt = (document.getElementById('hs-tt')||{}).value || '';
  hsRenderBody();
}

function hsRenderBody(){
  var body=document.getElementById('hs-body'); if(!body) return;
  var q=hsFilter.q.trim().toLowerCase();
  var rows = HR.nhansu.slice().sort(byNgayVaoDesc).filter(function(e){
    if(hsFilter.phong && e.phong!==hsFilter.phong) return false;
    if(hsFilter.tt && e.tinhTrang!==hsFilter.tt) return false;
    if(q){ var hay=((e.hoTen||'')+' '+(e.maNV||'')).toLowerCase(); if(hay.indexOf(q)<0) return false; }
    return true;
  });
  var cnt=document.getElementById('hs-count'); if(cnt) cnt.textContent = rows.length+' người';
  if(!rows.length){ body.innerHTML='<tr><td colspan="10" class="dt-empty">Không có nhân sự khớp bộ lọc.</td></tr>'; return; }
  body.innerHTML = rows.map(function(e){
    var moi = isNewHire(e.ngayVao) ? ' <span class="tag-new">Mới</span>' : '';
    return '<tr>'+
      '<td class="dt-mono">'+esc(e.maNV||'—')+'</td>'+
      '<td class="dt-name">'+esc(e.hoTen||'—')+'</td>'+
      '<td class="nw">'+esc(e.phong||'—')+'</td>'+
      '<td class="dt-muted">'+esc(e.chucVu||'—')+'</td>'+
      '<td class="nw">'+statusPill(e.tinhTrang)+'</td>'+
      '<td class="dt-date nw">'+esc(e.ngayVao||'—')+moi+'</td>'+
      '<td class="dt-muted nw">'+esc(e.thamNien||'—')+'</td>'+
      '<td class="dt-muted nw">'+esc(loaiHDShort(e.loaiHD))+'</td>'+
      '<td class="dt-muted nw">'+esc(e.sinhNhat||'—')+'</td>'+
      '<td class="nw">'+hoSoBadge(e.tinhTrangHoSo)+'</td>'+
    '</tr>';
  }).join('');
}

/* ============================================================
   TAB: HỢP ĐỒNG (chỉ nhân sự đang làm)
   ============================================================ */
var hdFilter = { q:'', phong:'' };

function hdActive(){ return HR.nhansu.filter(isWorking); }
function conLaiCell(v){
  var n=conLaiNum(v);
  if(n===null) return '<span class="dt-muted">—</span>';
  if(n<0) return '<span class="hd-over">Quá hạn '+(-n)+' ngày</span>';
  if(n<=30) return '<span class="hd-soon">Còn '+n+' ngày</span>';
  return '<span class="dt-muted">Còn '+n+' ngày</span>';
}

function renderHopDong(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  var act = hdActive();
  var soon=0, over=0, thieu=0;
  act.forEach(function(e){
    var n=conLaiNum(e.ngayConLai);
    if(n!==null && n<0) over++;
    else if(n!==null && n<=30) soon++;
    if(/thiếu/i.test(e.tinhTrangHoSo||'')) thieu++;
  });
  var phongList=[]; act.forEach(function(e){ if(e.phong && phongList.indexOf(e.phong)<0) phongList.push(e.phong); });

  var kpis=[
    ['Đang theo dõi', act.length, 'ti-file-certificate',''],
    ['Sắp hết hạn (≤30 ngày)', soon, 'ti-clock-exclamation', soon>0?'warn':''],
    ['Đã quá hạn', over, 'ti-alert-triangle', over>0?'danger':''],
    ['Thiếu hồ sơ', thieu, 'ti-file-alert', thieu>0?'warn':'']
  ].map(function(k){
    return '<div class="stat'+(k[3]==='warn'?' stat-warn':(k[3]==='danger'?' stat-danger':''))+'"><div class="stat-top"><span class="stat-lbl">'+k[0]+'</span><i class="ti '+k[2]+'"></i></div><div class="stat-val">'+k[1]+'</div></div>';
  }).join('');

  var html=
    '<div class="page-head"><div class="page-h1">Hợp đồng</div>'+
    '<div class="page-lead">Theo dõi hợp đồng nhân sự đang làm — loại HĐ hiện hành, hạn còn lại, số bản đã ký. Sắp xếp theo mức khẩn (quá hạn / sắp hết hạn lên đầu).</div></div>'+
    '<div class="stat-row">'+kpis+'</div>'+
    '<div class="toolbar">'+
      '<div class="tb-search"><i class="ti ti-search"></i><input id="hd-q" placeholder="Tìm tên hoặc mã NV…" value="'+esc(hdFilter.q)+'" oninput="hdOn()"></div>'+
      '<select id="hd-phong" onchange="hdOn()"><option value="">Tất cả phòng</option>'+phongList.map(function(x){return '<option value="'+esc(x)+'"'+(hdFilter.phong===x?' selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select>'+
      '<span class="tb-count" id="hd-count"></span>'+
    '</div>'+
    '<div class="table-wrap"><table class="dt"><thead><tr>'+
      '<th>Mã NV</th><th>Họ tên</th><th>Phòng ban</th><th>Loại HĐ hiện hành</th><th>Ngày hết hạn</th><th>Còn lại</th><th style="text-align:center;">Bản đã ký</th><th>Hồ sơ</th>'+
    '</tr></thead><tbody id="hd-body"></tbody></table></div>';

  setTimeout(hdRenderBody,0);
  return html;
}
function hdOn(){
  hdFilter.q=(document.getElementById('hd-q')||{}).value||'';
  hdFilter.phong=(document.getElementById('hd-phong')||{}).value||'';
  hdRenderBody();
}
function hdRenderBody(){
  var body=document.getElementById('hd-body'); if(!body) return;
  var q=hdFilter.q.trim().toLowerCase();
  var rows=hdActive().filter(function(e){
    if(hdFilter.phong && e.phong!==hdFilter.phong) return false;
    if(q){ var hay=((e.hoTen||'')+' '+(e.maNV||'')).toLowerCase(); if(hay.indexOf(q)<0) return false; }
    return true;
  }).sort(function(a,b){
    var na=conLaiNum(a.ngayConLai), nb=conLaiNum(b.ngayConLai);
    if(na===null && nb===null) return 0; if(na===null) return 1; if(nb===null) return -1;
    return na-nb; // khẩn nhất (số nhỏ / âm) lên đầu
  });
  var cnt=document.getElementById('hd-count'); if(cnt) cnt.textContent=rows.length+' người';
  if(!rows.length){ body.innerHTML='<tr><td colspan="8" class="dt-empty">Không có nhân sự khớp bộ lọc.</td></tr>'; return; }
  body.innerHTML=rows.map(function(e){
    return '<tr>'+
      '<td class="dt-mono">'+esc(e.maNV||'—')+'</td>'+
      '<td class="dt-name">'+esc(e.hoTen||'—')+'</td>'+
      '<td class="nw">'+esc(e.phong||'—')+'</td>'+
      '<td class="dt-muted nw">'+esc(loaiHDShort(e.loaiHD))+'</td>'+
      '<td class="dt-date nw">'+esc(e.ngayHetHan||'—')+'</td>'+
      '<td class="nw">'+conLaiCell(e.ngayConLai)+'</td>'+
      '<td style="text-align:center;">'+esc(e.soBanKy||'—')+'</td>'+
      '<td class="nw">'+hoSoBadge(e.tinhTrangHoSo)+'</td>'+
    '</tr>';
  }).join('');
}

/* ============================================================
   TAB: KHO CV — form upload CV → Drive + thêm dòng Tuyển dụng
   ============================================================ */
var API_KEY = 'bx-kho-cv-2026';
var kcvFiles = []; // [{file, hoTen}]

function kcvViTriOptions(){
  var list = (HR.viTriList && HR.viTriList.length) ? HR.viTriList.slice() : [];
  if(!list.length){ var seen={}; HR.tuyendung.forEach(function(c){ if(c.viTri && !seen[c.viTri]){seen[c.viTri]=1; list.push(c.viTri);} }); list.sort(); }
  return list.map(function(v){return '<option value="'+esc(v)+'">'+esc(v)+'</option>';}).join('');
}
function renderKhoCV(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  setTimeout(kcvRenderList,0);
  return ''+
    '<div class="page-head"><div class="page-h1">Kho CV — Nạp hồ sơ ứng viên</div>'+
    '<div class="page-lead">Chọn vị trí, tải CV lên → hệ tự lưu file vào Drive và thêm dòng vào file Tuyển dụng (Mã tự tăng · Ngày nộp hôm nay · Vị trí · Họ tên · Link CV). Vị trí lấy từ danh mục chuẩn nên không sai tên.</div></div>'+
    '<div class="kcv-card">'+
      '<div class="kcv-row"><label class="kcv-lbl">Vị trí nộp CV</label>'+
        '<select id="kcv-vitri" class="kcv-select" onchange="kcvValid()"><option value="">— Chọn vị trí —</option>'+kcvViTriOptions()+'</select></div>'+
      '<div class="kcv-row"><label class="kcv-lbl">File CV (PDF / ảnh / doc — chọn nhiều được)</label>'+
        '<label class="kcv-drop"><input type="file" id="kcv-files" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onchange="kcvPick(event)" hidden><i class="ti ti-upload"></i> Bấm để chọn file CV</label></div>'+
      '<div id="kcv-list"></div>'+
      '<div class="kcv-actions"><button id="kcv-submit" class="btn-primary" onclick="kcvSubmit()" disabled><i class="ti ti-cloud-upload"></i> Nạp vào Tuyển dụng</button>'+
        '<span id="kcv-status" class="kcv-status"></span></div>'+
    '</div><div id="kcv-result">'+(window.__kcvResultHtml||'')+'</div>'; // [D] giữ kết quả lần nạp gần nhất
}
function kcvPick(ev){
  var fs=ev.target.files;
  for(var i=0;i<fs.length;i++){ kcvFiles.push({ file:fs[i], hoTen:fs[i].name.replace(/\.[^.]+$/,'') }); }
  ev.target.value='';
  kcvRenderList();
}
function kcvRemove(i){ kcvFiles.splice(i,1); kcvRenderList(); }
function kcvName(i,v){ if(kcvFiles[i]) kcvFiles[i].hoTen=v; kcvValid(); }
function kcvEmail(i,v){ if(kcvFiles[i]) kcvFiles[i].email=v; }
function kcvGT(i,v){ if(kcvFiles[i]) kcvFiles[i].gt=v; }
function kcvSDT(i,v){ if(kcvFiles[i]) kcvFiles[i].sdt=v; }
function kcvRenderList(){
  var el=document.getElementById('kcv-list'); if(!el) return;
  if(!kcvFiles.length){ el.innerHTML=''; kcvValid(); return; }
  el.innerHTML='<div class="kcv-files">'+kcvFiles.map(function(f,i){
    return '<div class="kcv-file"><i class="ti ti-file-text"></i>'+
      '<span class="kcv-fname" title="'+esc(f.file.name)+'">'+esc(f.file.name)+'</span>'+
      '<input class="kcv-hoten" value="'+esc(f.hoTen)+'" placeholder="Họ tên ứng viên" oninput="kcvName('+i+',this.value)">'+
      '<input class="kcv-hoten kcv-email" value="'+esc(f.email||'')+'" placeholder="Email (nếu có)" oninput="kcvEmail('+i+',this.value)">'+
      '<select class="kcv-gt" onchange="kcvGT('+i+',this.value)"><option value="">Giới tính</option><option'+(f.gt==='Nam'?' selected':'')+'>Nam</option><option'+(f.gt==='Nữ'?' selected':'')+'>Nữ</option></select>'+
      '<input class="kcv-hoten kcv-sdt" value="'+esc(f.sdt||'')+'" placeholder="SĐT (nếu có)" oninput="kcvSDT('+i+',this.value)">'+
      '<button class="kcv-x" onclick="kcvRemove('+i+')" title="Bỏ"><i class="ti ti-x"></i></button></div>';
  }).join('')+'</div>';
  kcvValid();
}
function kcvValid(){
  var btn=document.getElementById('kcv-submit'); if(!btn) return;
  var vt=(document.getElementById('kcv-vitri')||{}).value;
  btn.disabled = !(vt && kcvFiles.length && kcvFiles.every(function(f){return String(f.hoTen).trim();}));
}
function readB64(file){ return new Promise(function(res,rej){ var r=new FileReader(); r.onload=function(){ res(String(r.result).split(',')[1]); }; r.onerror=rej; r.readAsDataURL(file); }); }
async function kcvSubmit(){
  var vt=document.getElementById('kcv-vitri').value;
  var status=document.getElementById('kcv-status'), btn=document.getElementById('kcv-submit');
  btn.disabled=true; status.textContent='Đang tải lên…';
  try{
    var items=[];
    for(var i=0;i<kcvFiles.length;i++){
      var b64=await readB64(kcvFiles[i].file);
      items.push({ hoTen:String(kcvFiles[i].hoTen).trim(), email:String(kcvFiles[i].email||'').trim(), gioiTinh:String(kcvFiles[i].gt||'').trim(), sdt:String(kcvFiles[i].sdt||'').trim(), fileName:kcvFiles[i].file.name, mimeType:kcvFiles[i].file.type||'application/octet-stream', b64:b64 });
    }
    var r=await (window.bxAuthedFetch ? window.bxAuthedFetch(API_URL,{ method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ key:API_KEY, viTri:vt, items:items }) }) : fetch(API_URL,{ method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ key:API_KEY, viTri:vt, items:items }) }));
    var d=await r.json();
    if(d.ok){
      status.textContent='';
      window.__kcvResultHtml='<div class="kcv-ok"><i class="ti ti-circle-check"></i> Đã nạp '+d.added.length+' CV vào Tuyển dụng:</div>'+
        '<div class="table-wrap" style="margin-top:10px;max-width:720px;"><table class="dt"><thead><tr><th>Mã UV</th><th>Họ tên</th><th>Vị trí</th><th>Link CV</th></tr></thead><tbody>'+
        d.added.map(function(a){return '<tr><td class="dt-mono">'+esc(a.maUV)+'</td><td class="dt-name">'+esc(a.hoTen)+'</td><td>'+esc(a.viTri)+'</td><td><a href="'+esc(a.url)+'" target="_blank" rel="noopener">Mở CV</a></td></tr>';}).join('')+'</tbody></table></div>';
      document.getElementById('kcv-result').innerHTML=window.__kcvResultHtml;
      kcvFiles=[]; kcvRenderList();
      loadData(true); // bỏ qua cache máy chủ để CV vừa nạp hiện ngay
    } else { status.innerHTML='<span style="color:var(--rust);">Lỗi: '+esc(d.error||'không rõ')+'</span>'; }
  }catch(e){ status.innerHTML='<span style="color:var(--rust);">Lỗi kết nối: '+esc(e.message)+'</span>'; }
  kcvValid();
}

/* ============================================================
   TAB: TUYỂN DỤNG — funnel + phân tích (đã lọc PII, tên viết tắt)
   ============================================================ */
var TDPASS = { hr:'SCAN CV PASS', lm:'PHÙ HỢP', r1:'PASS', r2:'PASS', fin:'TRÚNG TUYỂN' };
var tdFilter = { q:'', vitri:'', buoc:'' };

function pct(a,b){ return b ? Math.round(a/b*1000)/10 : 0; }

/* bước hiện tại của 1 ứng viên (dựa cột kết quả xa nhất) */
function tdStage(c){
  var f=(c.final||'').trim(), r2=(c.r2||'').trim(),
      r1=(c.r1||'').trim(), lm=(c.lmReview||'').trim(), hr=(c.hrReview||'').trim();
  function cls(v){
    if(/PASS|PHÙ HỢP|TRÚNG TUYỂN/.test(v)) return 'teal';
    if(/FAIL|KHÔNG PHÙ HỢP|TỪ CHỐI|CANCEL/.test(v)) return 'rust';
    if(/XEM XÉT|KHÔNG THAM GIA/.test(v)) return 'clay';
    return 'gray';
  }
  if(f)  return {label:(f==='TRÚNG TUYỂN'?'Trúng tuyển':f), cls:cls(f), bucket:(f==='TRÚNG TUYỂN'?'trung':'loai')};
  if(r2) return {label:'Vòng 2 · '+r2, cls:cls(r2), bucket:(r2==='PASS'?'xuly':'loai')};
  if(r1) return {label:'Vòng 1 · '+r1, cls:cls(r1), bucket:(r1==='PASS'?'xuly':'loai')};
  if(lm) return {label:'LM · '+lm, cls:cls(lm), bucket:(/PHÙ HỢP|XEM XÉT/.test(lm)?'xuly':'loai')};
  if(hr) return {label:'HR · '+hr, cls:cls(hr), bucket:(/PASS|XEM XÉT/.test(hr)?'xuly':'loai')};
  return {label:'Mới nộp', cls:'gold', bucket:'xuly'};
}

function tdFunnel(list){
  var total=list.length;
  // [D] Mỗi bước = số người đã qua bước đó HOẶC bước sau (VD qua Line Manager mà cột HR để trống vẫn tính đã qua HR) → phễu luôn giảm dần, không vượt 100%
  var K=[['hrReview','hr'],['lmReview','lm'],['r1','r1'],['r2','r2'],['final','fin']];
  var lv=list.map(function(c){ var m=0; K.forEach(function(k,i){ if((c[k[0]]||'').trim()===TDPASS[k[1]]) m=i+1; }); return m; });
  var cnt=function(i){ return lv.filter(function(x){return x>=i;}).length; };
  return [
    {label:'CV nộp',              sub:'tổng hồ sơ',   n:total},
    {label:'HR duyệt CV',         sub:'scan pass',    n:cnt(1)},
    {label:'Line Manager duyệt',  sub:'phù hợp',      n:cnt(2)},
    {label:'Phỏng vấn vòng 1',    sub:'pass',         n:cnt(3)},
    {label:'Phỏng vấn vòng 2',    sub:'pass',         n:cnt(4)},
    {label:'Trúng tuyển',         sub:'final',        n:cnt(5)}
  ];
}

/* CV theo tháng từ ngày nộp dd/mm/yyyy */
function tdMonths(list){
  var m={};
  list.forEach(function(c){
    var p=String(c.ngayNop||'').split('/');
    var k=monthKey(c.ngayNop); if(k){ m[k]=(m[k]||0)+1; } // [E]
  });
  return fillMonths(Object.keys(m).map(function(k){return {k:k,n:m[k]};}).sort(function(a,b){
    var A=a.k.split('/'), B=b.k.split('/');
    return (A[1]-B[1])||(A[0]-B[0]);
  }), function(k){return {k:k,n:0};}); // [B1] lấp tháng trống
}

/* theo vị trí */
function tdByViTri(list){
  var g={};
  list.forEach(function(c){
    var v=(c.viTri||'').trim()||'(trống)';
    if(!g[v]) g[v]={viTri:v,total:0,trung:0};
    g[v].total++;
    if((c.final||'').trim()===TDPASS.fin) g[v].trung++;
  });
  return Object.keys(g).map(function(k){return g[k];}).sort(function(a,b){return b.total-a.total;});
}

function renderTuyenDung(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  var all = HR.tuyendung || [];
  var vt = tdByViTri(all);
  var vtOpts = vt.map(function(r){return '<option value="'+esc(r.viTri)+'"'+(tdFilter.vitri===r.viTri?' selected':'')+'>'+esc(r.viTri)+'</option>';}).join('');
  var buocOpts = [['','Mọi bước'],['xuly','Đang xử lý'],['trung','Trúng tuyển'],['loai','Đã loại']]
    .map(function(o){return '<option value="'+o[0]+'"'+(tdFilter.buoc===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('');
  setTimeout(tdRenderBody,0);
  return ''+
    '<div class="page-head"><div class="page-h1">Tuyển dụng</div>'+
    '<div class="page-lead">Danh sách ứng viên đã nộp CV — tra cứu theo vị trí và bước hiện tại. Thông tin cá nhân đã ẩn (tên viết tắt, không email/SĐT). Phân tích funnel &amp; hiệu quả xem ở tab <b>Hiệu quả tuyển dụng</b>.</div></div>'+
    '<div class="toolbar">'+
      '<div class="tb-search"><i class="ti ti-search"></i><input id="td-q" placeholder="Tìm tên hoặc vị trí…" value="'+esc(tdFilter.q)+'" oninput="tdOn()"></div>'+
      '<select id="td-vitri" onchange="tdOn()"><option value="">Tất cả vị trí</option>'+vtOpts+'</select>'+
      '<select id="td-buoc" onchange="tdOn()">'+buocOpts+'</select>'+
      '<span class="tb-count" id="td-count"></span>'+
    '</div>'+
    '<div class="table-wrap"><table class="dt"><thead><tr><th>Ngày nộp</th><th>Họ tên</th><th>Vị trí</th><th>Bước hiện tại</th></tr></thead><tbody id="td-body"></tbody></table></div>';
}

function tdOn(){
  tdFilter.q=(document.getElementById('td-q')||{}).value||'';
  tdFilter.vitri=(document.getElementById('td-vitri')||{}).value||'';
  tdFilter.buoc=(document.getElementById('td-buoc')||{}).value||'';
  tdRenderBody();
}
function tdRenderBody(){
  var body=document.getElementById('td-body'); if(!body) return;
  var q=tdFilter.q.trim().toLowerCase();
  var rows=(HR.tuyendung||[]).map(function(c){ return {c:c, st:tdStage(c)}; }).filter(function(o){
    if(tdFilter.vitri && (o.c.viTri||'')!==tdFilter.vitri) return false;
    if(tdFilter.buoc && o.st.bucket!==tdFilter.buoc) return false;
    if(q){ var hay=((o.c.hoTenMask||'')+' '+(o.c.viTri||'')).toLowerCase(); if(hay.indexOf(q)<0) return false; }
    return true;
  }).sort(function(a,b){
    var da=parseDMY(a.c.ngayNop), db=parseDMY(b.c.ngayNop);
    if(!da&&!db) return 0; if(!da) return 1; if(!db) return -1;
    return db.getTime()-da.getTime();
  });
  var cnt=document.getElementById('td-count'); if(cnt) cnt.textContent=rows.length+' ứng viên';
  if(!rows.length){ body.innerHTML='<tr><td colspan="4" class="dt-empty">Không có ứng viên khớp bộ lọc.</td></tr>'; return; }
  body.innerHTML=rows.map(function(o){
    return '<tr>'+
      '<td class="dt-date nw">'+esc(o.c.ngayNop||'—')+'</td>'+
      '<td class="dt-name">'+esc(o.c.hoTenMask||'—')+'</td>'+
      '<td class="nw">'+esc(o.c.viTri||'—')+'</td>'+
      '<td class="nw"><span class="pill '+o.st.cls+'">'+esc(o.st.label)+'</span></td>'+
    '</tr>';
  }).join('');
}

/* ============================================================
   TAB: HIỆU QUẢ TUYỂN DỤNG — phân tích sâu (ECharts, tự cập nhật)
   ============================================================ */
var ptFilter = { vitri:'', month:'' };

function ptFilteredList(){
  return (HR.tuyendung||[]).filter(function(c){
    if(ptFilter.vitri && (c.viTri||'')!==ptFilter.vitri) return false;
    if(ptFilter.month){ if(monthKey(c.ngayNop)!==ptFilter.month) return false; } // [E]
    return true;
  });
}
function ptMonthsHire(list){
  var m={};
  list.forEach(function(c){
    var k=monthKey(c.ngayNop); if(!k) return; // [E]
    if(!m[k]) m[k]={k:k,cv:0,hire:0};
    m[k].cv++; if((c.final||'').trim()===TDPASS.fin) m[k].hire++;
  });
  return fillMonths(Object.keys(m).map(function(k){return m[k];}).sort(function(a,b){var A=a.k.split('/'),B=b.k.split('/');return (A[1]-B[1])||(A[0]-B[0]);}), function(k){return {k:k,cv:0,hire:0};}); // [B1]
}
function ptFirstDrop(c){
  if((c.hrReview||'').trim()==='SCAN CV FAIL') return 'HR loại CV';
  if((c.lmReview||'').trim()==='KHÔNG PHÙ HỢP') return 'LM không phù hợp';
  var r1=(c.r1||'').trim(); if(r1==='FAIL') return 'Rớt phỏng vấn V1'; if(r1==='KHÔNG THAM GIA') return 'No-show V1';
  var r2=(c.r2||'').trim(); if(r2==='FAIL') return 'Rớt phỏng vấn V2'; if(r2==='KHÔNG THAM GIA') return 'No-show V2';
  var f=(c.final||'').trim(); if(f==='TỪ CHỐI OFFER') return 'Từ chối offer'; if(f==='CANCEL') return 'Huỷ'; if(f==='FAIL') return 'Loại (không rõ bước)';
  return null;
}

/* ---- ECharts theme + registry ---- */
var PTC = { teal:'#35655B', teal2:'#4A8375', clay:'#B07A43', rust:'#A65A4B', gold:'#9A7B3F', muted:'#8B897E', faint:'#A9A599',
  ink:'#21303B', text:'#414B54', paper:'#FBFAF6', line:'#E4DECF',
  ramp:['#274b43','#35655B','#3f7669','#4c8577','#6ba496','#8dbcb0'] };
var PTFONT="'Be Vietnam Pro',sans-serif";
function ptTip(extra){ return Object.assign({backgroundColor:PTC.paper,borderColor:PTC.line,borderWidth:1,padding:[9,12],
  textStyle:{color:PTC.ink,fontFamily:PTFONT,fontSize:12},extraCssText:'box-shadow:0 6px 20px rgba(33,48,59,.12);border-radius:8px;'}, extra||{}); }
window.__ptCharts = window.__ptCharts || {};
function ptMk(id,opt){
  var el=document.getElementById(id); if(!el || typeof echarts==='undefined') return;
  if(window.__ptCharts[id]){ try{ window.__ptCharts[id].dispose(); }catch(e){} }
  var c=echarts.init(el,null,{renderer:'svg'}); c.setOption(opt); window.__ptCharts[id]=c;
}
window.addEventListener('resize',function(){ Object.keys(window.__ptCharts).forEach(function(k){ try{ window.__ptCharts[k].resize(); }catch(e){} }); });

/* funnel chart (theo bộ lọc) */
function ptDrawFunnel(){
  if(!document.getElementById('pt-funnel')) return;
  var list=ptFilteredList(); var fn=tdFunnel(list);
  var convs=fn.map(function(s,i){return (i===0||!fn[i-1].n)?null:pct(s.n,fn[i-1].n);}); // [D] bước trước = 0 → không tính
  ptMk('pt-funnel',{
    tooltip:ptTip({trigger:'item',formatter:function(p){var i=p.dataIndex;var cv=i===0?'100% tổng':((convs[i]==null?'—':convs[i]+'%')+' vs bước trên · '+pct(fn[i].n,fn[0].n)+'% tổng');return '<b>'+esc(p.name)+'</b><br/>'+p.value+' ứng viên<br/><span style="color:'+PTC.muted+'">'+cv+'</span>';}}),
    series:[{type:'funnel',left:'6%',right:'6%',top:8,bottom:8,minSize:'22%',maxSize:'100%',sort:'none',gap:3,
      label:{show:true,position:'inside',color:'#fff',fontFamily:PTFONT,fontWeight:600,fontSize:12,formatter:function(p){return p.name+'  '+p.value;}},
      labelLine:{show:false},itemStyle:{borderWidth:0},emphasis:{label:{fontSize:13}},
      data:fn.map(function(s,i){return {value:s.n,name:s.label,itemStyle:{color:PTC.ramp[i]||PTC.teal}};})
    }]
  });
  var box=document.getElementById('pt-funnote');
  if(box){ var minC=101,mi=-1; convs.forEach(function(c,i){if(c!==null&&c<minC){minC=c;mi=i;}});
    box.innerHTML='<i class="ti ti-bulb"></i> '+(mi>0?('Nghẽn nặng nhất ở <b>'+esc(fn[mi].label)+'</b> — chỉ <b style="color:var(--rust)">'+convs[mi]+'%</b> qua bước.'):'—')+' · Đậu chung <b>'+pct(fn[5].n,fn[0].n)+'%</b> ('+fn[5].n+'/'+fn[0].n+')'; }
}
function ptOn(){
  ptFilter.vitri=(document.getElementById('pt-vitri')||{}).value||'';
  ptFilter.month=(document.getElementById('pt-month')||{}).value||'';
  ptDrawFunnel();
}

function ptInitCharts(){
  var all=HR.tuyendung||[];
  ptDrawFunnel();

  /* donut kết quả cuối */
  var b={xuly:0,trung:0,loai:0}; all.forEach(function(c){var k=tdStage(c).bucket; b[k]=(b[k]||0)+1;});
  ptMk('pt-donut',{
    tooltip:ptTip({trigger:'item',formatter:function(p){return '<b>'+esc(p.name)+'</b><br/>'+p.value+' CV · '+p.percent+'%';}}),
    legend:{bottom:2,icon:'roundRect',itemWidth:11,itemHeight:11,textStyle:{color:PTC.text,fontFamily:PTFONT,fontSize:12}},
    series:[{type:'pie',radius:['52%','74%'],center:['50%','44%'],avoidLabelOverlap:true,padAngle:2,
      itemStyle:{borderColor:PTC.paper,borderWidth:2},
      label:{show:true,position:'outside',color:PTC.text,fontFamily:PTFONT,fontSize:11,formatter:'{b}\n{c}'},
      labelLine:{length:8,length2:8,lineStyle:{color:PTC.faint}},emphasis:{scale:true,scaleSize:4},
      data:[{value:b.trung,name:'Trúng tuyển',itemStyle:{color:PTC.teal}},
            {value:b.xuly,name:'Đang xử lý',itemStyle:{color:PTC.muted}},
            {value:b.loai,name:'Đã loại',itemStyle:{color:PTC.rust}}]
    }]
  });

  /* cột nhóm CV vs trúng tuyển theo tháng */
  var mh=ptMonthsHire(all);
  var mLab=mh.map(function(x){return x.k.replace(/\/(\d{2})(\d{2})$/,'/$2');});
  ptMk('pt-months',{
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){var s='<b>Tháng '+esc(a[0].axisValue)+'</b>';a.forEach(function(x){s+='<br/>'+x.marker+x.seriesName+': <b>'+x.value+'</b>';});var cv=a[0].value,hi=(a[1]?a[1].value:0);s+='<br/><span style="color:'+PTC.muted+'">Tỷ lệ đậu: '+(cv?(hi/cv*100).toFixed(1):0)+'%</span>';return s;}}),
    legend:{top:0,right:0,icon:'roundRect',itemWidth:11,itemHeight:11,textStyle:{color:PTC.text,fontFamily:PTFONT,fontSize:12}},
    grid:{left:8,right:8,top:34,bottom:4,containLabel:true},
    xAxis:{type:'category',data:mLab,axisTick:{show:false},axisLine:{lineStyle:{color:PTC.line}},axisLabel:{color:PTC.muted,fontFamily:PTFONT,fontSize:11}},
    yAxis:{type:'value',splitLine:{lineStyle:{color:PTC.line,type:'dashed'}},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11}},
    series:[{name:'CV nộp',type:'bar',data:mh.map(function(x){return x.cv;}),barWidth:11,itemStyle:{color:PTC.teal2,borderRadius:[4,4,0,0]},barGap:'20%'},
            {name:'Trúng tuyển',type:'bar',data:mh.map(function(x){return x.hire;}),barWidth:11,itemStyle:{color:PTC.clay,borderRadius:[4,4,0,0]}}]
  });

  /* drop-off bar ngang */
  var dd={}; all.forEach(function(c){var r=ptFirstDrop(c); if(r) dd[r]=(dd[r]||0)+1;});
  var da=Object.keys(dd).map(function(k){return [k,dd[k]];}).sort(function(a,b){return a[1]-b[1];}); // asc để lớn nhất trên đầu (yAxis)
  ptMk('pt-drops',{
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){return '<b>'+esc(a[0].axisValue)+'</b><br/>'+a[0].value+' ứng viên';}}),
    grid:{left:6,right:30,top:8,bottom:4,containLabel:true},
    xAxis:{type:'value',splitLine:{lineStyle:{color:PTC.line,type:'dashed'}},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11}},
    yAxis:{type:'category',data:da.map(function(x){return x[0];}),axisTick:{show:false},axisLine:{show:false},axisLabel:{color:PTC.text,fontFamily:PTFONT,fontSize:11.5}},
    series:[{type:'bar',data:da.map(function(x){return x[1];}),barWidth:'58%',itemStyle:{color:PTC.rust,borderRadius:[0,4,4,0],opacity:.85},
      label:{show:true,position:'right',color:PTC.muted,fontFamily:PTFONT,fontSize:11}}]
  });
}

function renderPhanTichTuyenDung(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  var all=HR.tuyendung||[];
  // [E] lựa chọn lọc không còn trong dữ liệu mới → reset để số liệu khớp với ô chọn đang hiện
  if(ptFilter.month && !all.some(function(c){return monthKey(c.ngayNop)===ptFilter.month;})) ptFilter.month='';
  if(ptFilter.vitri && !all.some(function(c){return (c.viTri||'')===ptFilter.vitri;})) ptFilter.vitri='';
  var total=all.length;
  var fnAll=tdFunnel(all); var trung=fnAll[5].n;
  var byBucket={xuly:0,trung:0,loai:0}; all.forEach(function(c){var k=tdStage(c).bucket; byBucket[k]=(byBucket[k]||0)+1;});

  var kpis=[
    ['Tổng CV', total, 'ti-files'],
    ['Trúng tuyển', trung, 'ti-user-check'],
    ['Tỷ lệ đậu', pct(trung,total)+'%', 'ti-target'],
    ['Đang xử lý', byBucket.xuly, 'ti-loader'],
    ['Đã loại', byBucket.loai, 'ti-user-x']
  ].map(function(k){return '<div class="stat"><div class="stat-top"><span class="stat-lbl">'+k[0]+'</span><i class="ti '+k[2]+'"></i></div><div class="stat-val">'+k[1]+'</div></div>';}).join('');

  var vt=tdByViTri(all);
  var vtOpts=vt.map(function(r){return '<option value="'+esc(r.viTri)+'"'+(ptFilter.vitri===r.viTri?' selected':'')+'>'+esc(r.viTri)+'</option>';}).join('');
  var moAll=tdMonths(all).filter(function(x){return x.n>0;}); // [B1] bộ lọc chỉ hiện tháng có CV
  var moOpts=moAll.map(function(x){var lbl=x.k.replace(/\/(\d{2})(\d{2})$/,'/$2');return '<option value="'+x.k+'"'+(ptFilter.month===x.k?' selected':'')+'>'+lbl+'</option>';}).join('');

  var vtStats=vt.map(function(r){return {viTri:r.viTri, cv:r.total, hire:r.trung, rate:pct(r.trung,r.total), perHire:(r.trung?Math.round(r.total/r.trung*10)/10:null)};});
  var maxCvVt=vtStats.reduce(function(m,x){return Math.max(m,x.cv);},1);
  var vtRows=vtStats.map(function(r){
    var rc=r.rate>=8?'good':(r.rate>=4?'mid':'low');
    return '<tr><td class="dt-name nw">'+esc(r.viTri)+'</td>'+
      '<td><div class="mini"><div class="mini-track"><div class="mini-fill" style="width:'+(r.cv/maxCvVt*100)+'%"></div></div><span class="dt-muted" style="min-width:30px">'+r.cv+'</span></div></td>'+
      '<td style="text-align:center">'+r.hire+'</td>'+
      '<td class="nw"><span class="rate '+rc+'">'+r.rate+'%</span></td>'+
      '<td style="text-align:center" class="dt-muted">'+(r.perHire!=null?r.perHire:'—')+'</td></tr>';
  }).join('');

  var gGroups=[['Nam',all.filter(function(c){return (c.gioiTinh||'').trim()==='Nam';})],['Nữ',all.filter(function(c){return (c.gioiTinh||'').trim()==='Nữ';})]];
  var gRows=gGroups.map(function(g){var f=tdFunnel(g[1]);var rr=pct(f[5].n,f[0].n);return '<tr><td class="dt-name nw">'+g[0]+'</td><td style="text-align:center">'+f[0].n+'</td><td style="text-align:center">'+f[5].n+'</td><td class="nw"><span class="rate '+(rr>=6?'good':'mid')+'">'+rr+'%</span></td></tr>';}).join('');

  var reachV1=all.filter(function(c){return (c.r1||'').trim()!=='';}).length;
  var noShow=all.filter(function(c){return (c.r1||'').trim()==='KHÔNG THAM GIA'||(c.r2||'').trim()==='KHÔNG THAM GIA';}).length;
  var tuChoi=all.filter(function(c){return (c.final||'').trim()==='TỪ CHỐI OFFER';}).length;
  var worst=vtStats.filter(function(x){return x.cv>=10;}).slice().sort(function(a,b){return a.rate-b.rate;})[0];
  var best=vtStats.filter(function(x){return x.cv>=10;}).slice().sort(function(a,b){return b.rate-a.rate;})[0];
  var convsAll=fnAll.map(function(s,i){return (i===0||!fnAll[i-1].n)?null:pct(s.n,fnAll[i-1].n);});
  var minCA=101,minIA=-1; convsAll.forEach(function(c,i){if(c!==null&&c<minCA){minCA=c;minIA=i;}});
  var insights=[
    minIA>0?('Điểm nghẽn phễu: <b>'+esc(fnAll[minIA].label)+'</b> — chỉ '+convsAll[minIA]+'% qua bước này.'):null, // [E] chưa có CV thì bỏ qua
    'HR lọc CV: <b>'+pct(fnAll[1].n,total)+'%</b> CV qua vòng scan; đậu chung <b>'+pct(trung,total)+'%</b> ('+trung+'/'+total+').',
    worst?('Vị trí khó tuyển nhất: <b>'+esc(worst.viTri)+'</b> — '+worst.cv+' CV, đậu '+worst.rate+'% ('+(worst.perHire!=null?worst.perHire+' CV/1 tuyển':'chưa tuyển được')+').'):null,
    best?('Vị trí hiệu quả nhất: <b>'+esc(best.viTri)+'</b> — đậu '+best.rate+'%.'):null,
    'No-show phỏng vấn: <b>'+noShow+'</b> lượt ('+pct(noShow,reachV1)+'% số vào phỏng vấn). Từ chối offer: <b>'+tuChoi+'</b> người.'
  ].filter(Boolean).map(function(t){return '<div class="empty-li"><i class="ti ti-point"></i><span>'+t+'</span></div>';}).join('');

  setTimeout(ptInitCharts,30);

  return ''+
    '<div class="page-head"><div class="page-h1">Hiệu quả tuyển dụng</div>'+
    '<div class="page-lead">Phân tích tự động từ data tuyển dụng — mọi chỉ số &amp; biểu đồ cập nhật theo CV nạp vào. Danh sách ứng viên xem ở tab <b>Tuyển dụng</b>.</div></div>'+
    '<div class="stat-row">'+kpis+'</div>'+

    '<div class="grid-2">'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Phễu &amp; tỷ lệ chuyển đổi</span><span class="sec-sub">lọc theo vị trí / tháng</span></div>'+
        '<div class="toolbar" style="margin-bottom:10px">'+
          '<select id="pt-vitri" onchange="ptOn()"><option value="">Tất cả vị trí</option>'+vtOpts+'</select>'+
          '<select id="pt-month" onchange="ptOn()"><option value="">Tất cả tháng</option>'+moOpts+'</select>'+
        '</div>'+
        '<div class="card"><div id="pt-funnel" class="ec ec-tall"></div><div class="pt-note" id="pt-funnote"></div></div></div>'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Kết quả cuối</span><span class="sec-sub">phân bổ toàn bộ CV</span></div>'+
        '<div class="card"><div id="pt-donut" class="ec ec-tall"></div></div></div>'+
    '</div>'+

    '<div class="sec"><div class="sec-head"><span class="sec-title">CV nộp vs Trúng tuyển theo tháng</span><span class="sec-sub">xu hướng lượng CV &amp; kết quả tuyển</span></div>'+
      '<div class="card"><div id="pt-months" class="ec"></div></div></div>'+

    '<div class="grid-2">'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Hiệu quả theo vị trí</span><span class="sec-sub">CV · tỷ lệ đậu · CV cần/1 tuyển</span></div>'+
        '<div class="table-wrap"><table class="dt"><thead><tr><th>Vị trí</th><th>Số CV</th><th style="text-align:center">Tuyển</th><th>Tỷ lệ đậu</th><th style="text-align:center">CV/1 tuyển</th></tr></thead><tbody>'+vtRows+'</tbody></table></div></div>'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Điểm rớt (drop-off)</span><span class="sec-sub">ứng viên bị loại ở bước nào</span></div>'+
        '<div class="card"><div id="pt-drops" class="ec ec-tall"></div></div></div>'+
    '</div>'+

    '<div class="grid-2">'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Theo giới tính</span><span class="sec-sub">CV &amp; tỷ lệ đậu</span></div>'+
        '<div class="table-wrap"><table class="dt"><thead><tr><th>Giới tính</th><th style="text-align:center">CV</th><th style="text-align:center">Tuyển</th><th>Tỷ lệ đậu</th></tr></thead><tbody>'+gRows+'</tbody></table></div></div>'+
      '<div class="sec" style="margin:0"><div class="callout" style="height:100%"><div class="callout-k"><i class="ti ti-bulb"></i>Đánh giá tự động</div><div class="empty-list">'+insights+'</div></div></div>'+
    '</div>';
}

/* ============================================================
   TAB: CHỈ SỐ & XU HƯỚNG — phân tích nhân sự (ECharts, tự cập nhật)
   ============================================================ */
function csActive(){ return (HR.nhansu||[]).filter(isWorking); }
function csTenureMonths(e){ var d=parseDMY(e.ngayVao); if(!d) return null; var mo=(Date.now()-d.getTime())/2629800000; return mo>=0?mo:null; }
function csCount(list,key){ var m={};list.forEach(function(e){var v=(String(e[key]||'').trim())||'(trống)';m[v]=(m[v]||0)+1;});return Object.keys(m).map(function(k){return [k,m[k]];}).sort(function(a,b){return b[1]-a[1];}); }
function csMonthlyFlow(ns){
  var m={};
  function bump(d,key){var k=monthKey(d);if(!k)return;if(!m[k])m[k]={k:k,inn:0,out:0};m[k][key]++;}
  ns.forEach(function(e){ bump(e.ngayVao,'inn'); if(isLeft(e)) bump(e.ngayNghi,'out'); });
  var arr=fillMonths(Object.keys(m).map(function(k){return m[k];}).sort(function(a,b){var A=a.k.split('/'),B=b.k.split('/');return (A[1]-B[1])||(A[0]-B[0]);}), function(k){return {k:k,inn:0,out:0};}); // [B1]
  arr.forEach(function(x){x.net=x.inn-x.out;});
  return arr;
}

function csInit(){
  var ns=HR.nhansu||[]; var act=csActive();

  /* biến động nhân sự theo tháng: vào (bar) / nghỉ (bar) / ròng (line) — cùng thang đếm */
  var fl=csMonthlyFlow(ns);
  ptMk('cs-hires',{
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){var s='<b>Tháng '+esc(a[0].axisValue)+'</b>';a.forEach(function(x){s+='<br/>'+x.marker+x.seriesName+': <b>'+x.value+'</b>';});return s;}}),
    legend:{top:0,right:0,icon:'roundRect',itemWidth:11,itemHeight:11,textStyle:{color:PTC.text,fontFamily:PTFONT,fontSize:12}},
    grid:{left:8,right:8,top:34,bottom:4,containLabel:true},
    xAxis:{type:'category',data:fl.map(function(x){return x.k.replace(/\/(\d{2})(\d{2})$/,'/$2');}),axisTick:{show:false},axisLine:{lineStyle:{color:PTC.line}},axisLabel:{color:PTC.muted,fontFamily:PTFONT,fontSize:11}},
    yAxis:{type:'value',minInterval:1,splitLine:{lineStyle:{color:PTC.line,type:'dashed'}},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11}},
    series:[
      {name:'Vào',type:'bar',data:fl.map(function(x){return x.inn;}),barWidth:10,itemStyle:{color:PTC.teal,borderRadius:[3,3,0,0]}},
      {name:'Nghỉ',type:'bar',data:fl.map(function(x){return x.out;}),barWidth:10,itemStyle:{color:PTC.rust,borderRadius:[3,3,0,0]}},
      {name:'Ròng',type:'line',data:fl.map(function(x){return x.net;}),smooth:true,symbol:'circle',symbolSize:6,lineStyle:{color:PTC.clay,width:2},itemStyle:{color:PTC.clay}}
    ]
  });

  /* cơ cấu phòng ban (đang làm) */
  var dept=csCount(act,'phong');
  ptMk('cs-dept',{
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){return '<b>'+esc(a[0].axisValue)+'</b><br/>'+a[0].value+' người';}}),
    grid:{left:6,right:28,top:8,bottom:4,containLabel:true},
    xAxis:{type:'value',minInterval:1,splitLine:{lineStyle:{color:PTC.line,type:'dashed'}},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11}},
    yAxis:{type:'category',data:dept.map(function(x){return x[0];}).reverse(),axisTick:{show:false},axisLine:{show:false},axisLabel:{color:PTC.text,fontFamily:PTFONT,fontSize:11.5}},
    series:[{type:'bar',data:dept.map(function(x){return x[1];}).reverse(),barWidth:'58%',itemStyle:{color:PTC.teal,borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:PTC.muted,fontFamily:PTFONT,fontSize:11}}]
  });

  function donut(id,pairs,colors){
    ptMk(id,{
      tooltip:ptTip({trigger:'item',formatter:function(p){return '<b>'+esc(p.name)+'</b><br/>'+p.value+' người · '+p.percent+'%';}}),
      legend:{bottom:0,type:'scroll',icon:'roundRect',itemWidth:10,itemHeight:10,textStyle:{color:PTC.text,fontFamily:PTFONT,fontSize:11}},
      series:[{type:'pie',radius:['50%','72%'],center:['50%','42%'],avoidLabelOverlap:true,padAngle:2,itemStyle:{borderColor:PTC.paper,borderWidth:2},
        label:{show:true,position:'outside',color:PTC.text,fontFamily:PTFONT,fontSize:10.5,formatter:'{b}: {c}'},
        labelLine:{length:6,length2:6,lineStyle:{color:PTC.faint}},emphasis:{scale:true,scaleSize:4},
        data:pairs.map(function(p,i){return {value:p[1],name:p[0],itemStyle:{color:colors[i%colors.length]}};})}]
    });
  }
  var ramp=[PTC.teal,PTC.clay,PTC.teal2,PTC.rust,PTC.gold,PTC.muted,'#6ba496','#c79a6a'];
  donut('cs-hd', csCount(act,'loaiHD'), ramp);
  donut('cs-gender', csCount(act,'gioiTinh'), [PTC.teal,PTC.clay]);
  donut('cs-status', csCount(ns,'tinhTrang'), [PTC.teal,PTC.clay,PTC.gold,PTC.rust]);

  var bk=[['< 6 tháng',0],['6–12 tháng',0],['1–2 năm',0],['2–3 năm',0],['3 năm+',0]];
  act.forEach(function(e){var m=csTenureMonths(e);if(m==null)return;if(m<6)bk[0][1]++;else if(m<12)bk[1][1]++;else if(m<24)bk[2][1]++;else if(m<36)bk[3][1]++;else bk[4][1]++;});
  ptMk('cs-tenure',{
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){return '<b>'+esc(a[0].axisValue)+'</b><br/>'+a[0].value+' người';}}),
    grid:{left:8,right:8,top:12,bottom:4,containLabel:true},
    xAxis:{type:'category',data:bk.map(function(x){return x[0];}),axisTick:{show:false},axisLine:{lineStyle:{color:PTC.line}},axisLabel:{color:PTC.muted,fontFamily:PTFONT,fontSize:11}},
    yAxis:{type:'value',minInterval:1,splitLine:{lineStyle:{color:PTC.line,type:'dashed'}},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11}},
    series:[{type:'bar',data:bk.map(function(x){return x[1];}),barWidth:'50%',itemStyle:{color:PTC.teal2,borderRadius:[4,4,0,0]}}]
  });
}

function renderChiSo(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  var ns=HR.nhansu||[]; var act=csActive();
  var tong=ns.length, nghi=ns.filter(isLeft).length;
  var dangLam=act.length, thuViec=ns.filter(function(e){return (e.tinhTrang||'').trim()==='Thử việc';}).length;
  var nghiCoNgay=ns.filter(function(e){return isLeft(e) && String(e.ngayNghi||'').trim()!=='';}).length;
  var tenM=act.map(csTenureMonths).filter(function(x){return x!=null;});
  var avgTen=tenM.length?(tenM.reduce(function(a,b){return a+b;},0)/tenM.length):0;
  var tenTxt=avgTen>=12?((avgTen/12).toFixed(1)+' năm'):(Math.round(avgTen)+' tháng');
  var chinhThuc=act.filter(function(e){return /chính thức/i.test(e.loaiHD||'');}).length;

  var kpis=[
    ['Tổng nhân sự', tong, 'ti-users'],
    ['Đang làm', dangLam, 'ti-user-check'],
    ['Nghỉ việc', nghi, 'ti-user-off'],
    ['Thử việc', thuViec, 'ti-user-plus'],
    ['Thâm niên TB', tenTxt, 'ti-hourglass']
  ].map(function(k){return '<div class="stat"><div class="stat-top"><span class="stat-lbl">'+k[0]+'</span><i class="ti '+k[2]+'"></i></div><div class="stat-val">'+k[1]+'</div></div>';}).join('');

  var dept=csCount(act,'phong'); var topDept=dept[0];
  var namNu=csCount(act,'gioiTinh'); var gStr=namNu.map(function(x){return x[0]+' '+x[1];}).join(' · ');
  var pctNghi=tong?Math.round(nghi/tong*1000)/10:0;
  var pctThu=dangLam?Math.round(thuViec/dangLam*1000)/10:0;
  var insights=[
    'Hiện có <b>'+dangLam+'</b> nhân sự đang làm / tổng '+tong+' (đã nghỉ <b>'+nghi+'</b> — '+pctNghi+'%).',
    topDept?('Phòng đông nhất: <b>'+esc(topDept[0])+'</b> ('+topDept[1]+' người) trên '+dept.length+' phòng ban.'):null,
    'Cơ cấu giới tính (đang làm): <b>'+esc(gStr)+'</b>.',
    'Thâm niên trung bình: <b>'+tenTxt+'</b>. Chính thức: <b>'+chinhThuc+'</b>/'+dangLam+' · thử việc chiếm <b>'+pctThu+'%</b> lực lượng.'
  ].filter(Boolean).map(function(t){return '<div class="empty-li"><i class="ti ti-point"></i><span>'+t+'</span></div>';}).join('');

  var flowNote = (nghi>nghiCoNgay) ? ('<div class="pt-note"><i class="ti ti-info-circle"></i> '+(nghi-nghiCoNgay)+'/'+nghi+' người nghỉ chưa có ngày nghỉ → chưa tính vào cột "Nghỉ".</div>') : '';

  setTimeout(csInit,30);

  return ''+
    '<div class="page-head"><div class="page-h1">Chỉ số &amp; xu hướng</div>'+
    '<div class="page-lead">Bức tranh nhân sự: quy mô, cơ cấu và biến động theo thời gian — tự cập nhật theo Hồ sơ nhân sự.</div></div>'+
    '<div class="stat-row">'+kpis+'</div>'+

    '<div class="grid-2">'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Biến động nhân sự theo tháng</span><span class="sec-sub">vào · nghỉ · ròng</span></div>'+
        '<div class="card"><div id="cs-hires" class="ec"></div>'+flowNote+'</div></div>'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Cơ cấu phòng ban</span><span class="sec-sub">nhân sự đang làm</span></div>'+
        '<div class="card"><div id="cs-dept" class="ec ec-tall"></div></div></div>'+
    '</div>'+

    '<div class="grid-3">'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Loại hợp đồng</span></div><div class="card"><div id="cs-hd" class="ec"></div></div></div>'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Giới tính</span></div><div class="card"><div id="cs-gender" class="ec"></div></div></div>'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Tình trạng</span></div><div class="card"><div id="cs-status" class="ec"></div></div></div>'+
    '</div>'+

    '<div class="grid-2">'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Phân bố thâm niên</span><span class="sec-sub">nhân sự đang làm</span></div>'+
        '<div class="card"><div id="cs-tenure" class="ec"></div></div></div>'+
      '<div class="sec" style="margin:0"><div class="callout" style="height:100%"><div class="callout-k"><i class="ti ti-bulb"></i>Đánh giá tự động</div><div class="empty-list">'+insights+'</div></div></div>'+
    '</div>';
}

/* ============================================================
   TAB: BIẾN ĐỘNG NHÂN SỰ — turnover & giữ chân (ECharts, tự cập nhật)
   ============================================================ */
function bdLeavers(){ return (HR.nhansu||[]).filter(isLeft); }
function bdDated(){ return bdLeavers().filter(function(e){return String(e.ngayNghi||'').trim()!=='';}); }
/* thâm niên khi nghỉ (tháng): ngày vào → ngày nghỉ */
function bdTenureAtLeave(e){
  var a=parseDMY(e.ngayVao), b=parseDMY(e.ngayNghi);
  if(!a||!b) return null; var mo=(b.getTime()-a.getTime())/2629800000; return mo>=0?mo:null;
}
/* nghỉ theo tháng (chỉ dòng có ngày nghỉ) */
function bdByMonth(){
  var m={};
  bdDated().forEach(function(e){var k=monthKey(e.ngayNghi);if(!k)return;m[k]=(m[k]||0)+1;});
  return fillMonths(Object.keys(m).map(function(k){return {k:k,n:m[k]};}).sort(function(a,b){var A=a.k.split('/'),B=b.k.split('/');return (A[1]-B[1])||(A[0]-B[0]);}), function(k){return {k:k,n:0};}); // [B1]
}
/* biến động theo phòng ban: đang làm · đã nghỉ · tỷ lệ nghỉ · thâm niên TB khi nghỉ */
function bdByDept(){
  var g={};
  (HR.nhansu||[]).forEach(function(e){
    var v=(String(e.phong||'').trim())||'(trống)';
    if(!g[v]) g[v]={phong:v,active:0,left:0,tenSum:0,tenN:0};
    if(isLeft(e)){ g[v].left++; var t=bdTenureAtLeave(e); if(t!=null){g[v].tenSum+=t;g[v].tenN++;} }
    else g[v].active++;
  });
  return Object.keys(g).map(function(k){var r=g[k];r.tong=r.active+r.left;r.rate=r.tong?Math.round(r.left/r.tong*1000)/10:0;r.tenAvg=r.tenN?r.tenSum/r.tenN:null;return r;})
    .sort(function(a,b){return b.left-a.left || b.rate-a.rate;});
}

function bdInit(){
  /* nghỉ việc theo tháng — bar rust */
  var mo=bdByMonth();
  var moRate=mo.map(function(x){return bdMonthRate(x.k);}); // [B1] tỷ lệ nghỉ từng tháng
  ptMk('bd-month',{
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){return '<b>Tháng '+esc(a[0].axisValue)+'</b><br/>'+a[0].value+' người nghỉ'+(a[1]?' · tỷ lệ nghỉ tháng <b>'+a[1].value+'%</b>':'');}}),
    grid:{left:8,right:8,top:12,bottom:4,containLabel:true},
    xAxis:{type:'category',data:mo.map(function(x){return x.k.replace(/\/(\d{2})(\d{2})$/,'/$2');}),axisTick:{show:false},axisLine:{lineStyle:{color:PTC.line}},axisLabel:{color:PTC.muted,fontFamily:PTFONT,fontSize:11}},
    yAxis:[{type:'value',minInterval:1,splitLine:{lineStyle:{color:PTC.line,type:'dashed'}},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11}},
      {type:'value',splitLine:{show:false},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11,formatter:'{value}%'}}],
    series:[{type:'bar',data:mo.map(function(x){return x.n;}),barWidth:'46%',itemStyle:{color:PTC.rust,borderRadius:[4,4,0,0]},label:{show:true,position:'top',color:PTC.muted,fontFamily:PTFONT,fontSize:11,formatter:function(p){return p.value||'';}}},
      {type:'line',yAxisIndex:1,data:moRate,smooth:.3,symbol:'circle',symbolSize:5,lineStyle:{width:1.8,color:PTC.clay},itemStyle:{color:PTC.clay}}]
  });

  /* thâm niên khi nghỉ — phân bố (dated) */
  var bk=[['< 3 tháng',0],['3–6 tháng',0],['6–12 tháng',0],['1–2 năm',0],['2 năm+',0]];
  bdDated().forEach(function(e){var m=bdTenureAtLeave(e);if(m==null)return;if(m<3)bk[0][1]++;else if(m<6)bk[1][1]++;else if(m<12)bk[2][1]++;else if(m<24)bk[3][1]++;else bk[4][1]++;});
  ptMk('bd-tenure',{
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){return '<b>'+esc(a[0].axisValue)+'</b><br/>'+a[0].value+' người';}}),
    grid:{left:8,right:8,top:12,bottom:4,containLabel:true},
    xAxis:{type:'category',data:bk.map(function(x){return x[0];}),axisTick:{show:false},axisLine:{lineStyle:{color:PTC.line}},axisLabel:{color:PTC.muted,fontFamily:PTFONT,fontSize:11}},
    yAxis:{type:'value',minInterval:1,splitLine:{lineStyle:{color:PTC.line,type:'dashed'}},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11}},
    series:[{type:'bar',data:bk.map(function(x){return x[1];}),barWidth:'50%',itemStyle:{color:PTC.clay,borderRadius:[4,4,0,0]},label:{show:true,position:'top',color:PTC.muted,fontFamily:PTFONT,fontSize:11}}]
  });

  /* nghỉ theo phòng ban — bar ngang (toàn bộ đã nghỉ) */
  var dept=bdByDept().filter(function(r){return r.left>0;}).slice().sort(function(a,b){return a.left-b.left;});
  ptMk('bd-dept',{
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){var r=dept[a[0].dataIndex];return '<b>'+esc(r.phong)+'</b><br/>'+r.left+' người nghỉ · tỷ lệ '+r.rate+'%';}}),
    grid:{left:6,right:30,top:8,bottom:4,containLabel:true},
    xAxis:{type:'value',minInterval:1,splitLine:{lineStyle:{color:PTC.line,type:'dashed'}},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11}},
    yAxis:{type:'category',data:dept.map(function(r){return r.phong;}),axisTick:{show:false},axisLine:{show:false},axisLabel:{color:PTC.text,fontFamily:PTFONT,fontSize:11.5}},
    series:[{type:'bar',data:dept.map(function(r){return r.left;}),barWidth:'58%',itemStyle:{color:PTC.rust,borderRadius:[0,4,4,0],opacity:.9},label:{show:true,position:'right',color:PTC.muted,fontFamily:PTFONT,fontSize:11}}]
  });
}

function renderBienDong(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  var ns=HR.nhansu||[]; var tong=ns.length;
  var leav=bdLeavers(), nghi=leav.length;
  var active=tong-nghi;
  var dated=bdDated();
  var T12=bdTurn12(); // [B1] tỷ lệ nghỉ theo kỳ 12 tháng gần nhất
  var rateNghi=T12.rate;
  var retention=T12.retention;
  var tenArr=dated.map(bdTenureAtLeave).filter(function(x){return x!=null;});
  var tenAvg=tenArr.length?tenArr.reduce(function(a,b){return a+b;},0)/tenArr.length:0;
  var tenTxt=tenArr.length?(tenAvg>=12?(tenAvg/12).toFixed(1)+' năm':Math.round(tenAvg)+' tháng'):'—';
  var som=tenArr.filter(function(t){return t<6;}).length; // nghỉ sớm (<6 tháng)
  var pctSom=tenArr.length?Math.round(som/tenArr.length*1000)/10:0;

  var kpis=[
    ['Đã nghỉ việc', nghi, 'ti-user-off'],
    ['Tỷ lệ nghỉ (12 tháng)', rateNghi+'%', 'ti-trending-down'],
    ['Giữ chân (12 tháng)', retention+'%', 'ti-user-check'],
    ['Thâm niên TB khi nghỉ', tenTxt, 'ti-hourglass-low'],
    ['Nghỉ sớm (< 6 tháng)', tenArr.length?(som+'/'+tenArr.length):'—', 'ti-alert-triangle']
  ].map(function(k){return '<div class="stat"><div class="stat-top"><span class="stat-lbl">'+k[0]+'</span><i class="ti '+k[2]+'"></i></div><div class="stat-val">'+k[1]+'</div></div>';}).join('');

  /* bảng biến động theo phòng ban */
  var dept=bdByDept();
  var maxLeft=dept.reduce(function(m,r){return Math.max(m,r.left);},1);
  var deptRows=dept.map(function(r){
    var rc=r.rate>=40?'bad':(r.rate>=20?'mid':'low'); // nghỉ cao = rust, vừa = clay, thấp = muted
    var ten=r.tenAvg!=null?(r.tenAvg>=12?(r.tenAvg/12).toFixed(1)+' năm':Math.round(r.tenAvg)+' th'):'—';
    return '<tr><td class="dt-name nw">'+esc(r.phong)+'</td>'+
      '<td style="text-align:center" class="dt-muted">'+r.active+'</td>'+
      '<td><div class="mini"><div class="mini-track"><div class="mini-fill mini-rust" style="width:'+(r.left/maxLeft*100)+'%"></div></div><span class="dt-muted" style="min-width:22px">'+r.left+'</span></div></td>'+
      '<td class="nw"><span class="rate '+rc+'">'+r.rate+'%</span></td>'+
      '<td style="text-align:center" class="dt-muted nw">'+ten+'</td></tr>';
  }).join('');

  /* insights */
  var topDept=dept.slice().sort(function(a,b){return b.left-a.left;})[0];
  var worstRate=dept.filter(function(r){return r.tong>=3;}).slice().sort(function(a,b){return b.rate-a.rate;})[0];
  var undated=nghi-dated.length;
  var insights=[
    '12 tháng gần nhất: nghỉ <b>'+T12.left+'</b> người trên nhân sự bình quân <b>'+(Math.round(T12.avg*10)/10)+'</b> → tỷ lệ nghỉ <b>'+rateNghi+'%</b>; giữ chân <b>'+retention+'%</b> người có mặt đầu kỳ. Lũy kế từ trước tới nay: đã nghỉ '+nghi+'/'+tong+' người.',
    (topDept&&nghi>0&&topDept.left>0)?('Nghỉ nhiều nhất ở <b>'+esc(topDept.phong)+'</b>: <b>'+topDept.left+'</b> người ('+Math.round(topDept.left/nghi*100)+'% tổng số nghỉ).'):null,
    worstRate?('Tỷ lệ nghỉ lũy kế cao nhất: <b>'+esc(worstRate.phong)+'</b> — <b style="color:var(--rust)">'+worstRate.rate+'%</b> ('+worstRate.left+'/'+worstRate.tong+').'):null,
    tenArr.length?('Thâm niên TB khi nghỉ chỉ <b>'+tenTxt+'</b> · <b>'+som+'/'+tenArr.length+'</b> ('+pctSom+'%) nghỉ trong <b>6 tháng đầu</b> → dấu hiệu rủi ro giai đoạn thử việc / hội nhập.'):null
  ].filter(Boolean).map(function(t){return '<div class="empty-li"><i class="ti ti-point"></i><span>'+t+'</span></div>';}).join('');

  var notes=[];
  if(undated>0) notes.push(undated+'/'+nghi+' người nghỉ chưa có <b>ngày nghỉ</b> → không nằm trong biểu đồ "theo tháng", "thâm niên khi nghỉ" và tỷ lệ nghỉ 12 tháng (vẫn tính ở tổng nghỉ & theo phòng ban).');
  var lyEmpty=nghi-leav.filter(function(e){return String(e.lyDoNghi||'').trim()!=='';}).length;
  if(lyEmpty>0) notes.push('Lý do nghỉ mới ghi '+(nghi-lyEmpty)+'/'+nghi+' → chưa đủ để phân tích nguyên nhân. Ghi thêm cột "Lý do nghỉ" sẽ mở được biểu đồ nguyên nhân.');
  var noteHtml=notes.map(function(n){return '<div class="pt-note"><i class="ti ti-info-circle"></i><span>'+n+'</span></div>';}).join('');

  setTimeout(bdInit,30);

  return ''+
    '<div class="page-head"><div class="page-h1">Biến động nhân sự</div>'+
    '<div class="page-lead">Turnover &amp; giữ chân: ai nghỉ, nghỉ khi nào, ở phòng nào và sau bao lâu — tự cập nhật theo Hồ sơ nhân sự.</div></div>'+
    '<div class="stat-row">'+kpis+'</div>'+

    '<div class="grid-2">'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Nghỉ việc theo tháng</span><span class="sec-sub">số người nghỉ · tỷ lệ nghỉ tháng</span></div>'+
        '<div class="card"><div id="bd-month" class="ec"></div></div></div>'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Thâm niên khi nghỉ</span><span class="sec-sub">gắn bó bao lâu trước khi nghỉ</span></div>'+
        '<div class="card"><div id="bd-tenure" class="ec"></div></div></div>'+
    '</div>'+

    '<div class="sec"><div class="sec-head"><span class="sec-title">Biến động theo phòng ban</span><span class="sec-sub">đang làm · đã nghỉ · tỷ lệ nghỉ · thâm niên TB khi nghỉ</span></div>'+
      '<div class="table-wrap"><table class="dt"><thead><tr><th>Phòng ban</th><th style="text-align:center">Đang làm</th><th>Đã nghỉ</th><th>Tỷ lệ nghỉ (lũy kế)</th><th style="text-align:center">TN TB khi nghỉ</th></tr></thead><tbody>'+deptRows+'</tbody></table></div></div>'+

    '<div class="grid-2">'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Nghỉ theo phòng ban</span><span class="sec-sub">tổng số đã nghỉ</span></div>'+
        '<div class="card"><div id="bd-dept" class="ec ec-tall"></div></div></div>'+
      '<div class="sec" style="margin:0"><div class="callout" style="height:100%"><div class="callout-k"><i class="ti ti-bulb"></i>Đánh giá tự động</div><div class="empty-list">'+insights+'</div>'+noteHtml+'</div></div>'+
    '</div>';
}

/* ============================================================
   TAB: TỔNG QUAN — Bảng điều khiển (động, ECharts, tự cập nhật)
   ============================================================ */
function ovActive(){ return (HR.nhansu||[]).filter(isWorking); }
/* nhân viên đang làm, KHÔNG tính Ban giám đốc (BOD) — HĐLĐ không áp cho BOD */
function ovStaff(){ return ovActive().filter(function(e){ return (e.phong||'').trim()!=='BOD'; }); }
/* số bản HĐ đã ký = 0 / trống → cần ký (loại BOD) */
function ovCanKy(){
  return ovStaff().filter(function(e){ var v=String(e.soBanKy==null?'':e.soBanKy).trim(); return v===''||v==='0'; });
}
/* HĐ quá hạn / sắp hết hạn ≤30 ngày → cần ký lại (gia hạn), loại BOD */
function ovGiaHan(){
  return ovStaff().map(function(e){ return {e:e, n:conLaiNum(e.ngayConLai)}; })
    .filter(function(o){ return o.n!==null && o.n<=30; })
    .sort(function(a,b){ return a.n-b.n; });
}
/* sinh nhật sắp tới: tháng này (từ hôm nay) + tháng sau; trả kèm số ngày còn lại */
function ovBirthdays(){
  var now=new Date(); var Y=now.getFullYear();
  var list=[];
  ovActive().forEach(function(e){
    var p=String(e.sinhNhat||'').split('/'); if(p.length<2) return;
    var d=parseInt(p[0],10), m=parseInt(p[1],10); if(!d||!m) return;
    var next=new Date(Y, m-1, d); next.setHours(0,0,0,0);
    var t0=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    if(next<t0) next=new Date(Y+1, m-1, d);
    var days=Math.round((next-t0)/86400000);
    list.push({ten:e.hoTen, phong:e.phong, d:d, m:m, days:days, dd:String(d).padStart(2,'0')+'/'+String(m).padStart(2,'0')});
  });
  var curM=now.getMonth()+1, nextM=curM===12?1:curM+1, curD=now.getDate();
  // tháng này (từ hôm nay trở đi) + toàn bộ tháng sau
  return list.filter(function(b){ return b.m===nextM || (b.m===curM && b.d>=curD); }).sort(function(a,b){ return a.days-b.days; });
}

/* đếm số động (count-up) */
function ovCountUp(){
  document.querySelectorAll('.ov-num[data-to]').forEach(function(el){
    var to=parseFloat(el.getAttribute('data-to'))||0, dec=el.getAttribute('data-dec')==='1', suf=el.getAttribute('data-suf')||'';
    var fin=(dec?(Math.round(to*10)/10).toFixed(1):Math.round(to))+suf;
    el.textContent=fin; // giá trị đúng ngay
    if(document.visibilityState!=='visible' || typeof requestAnimationFrame!=='function') return;
    var dur=900, t0=null;
    function step(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1); var e=1-Math.pow(1-p,3); var v=to*e;
      el.textContent=(p>=1?fin:((dec?(Math.round(v*10)/10).toFixed(1):Math.round(v))+suf)); if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
    setTimeout(function(){ el.textContent=fin; }, dur+500); // chốt đúng dù rAF bị bóp ở tab nền
  });
}

function ovInit(){
  ovCountUp();
  var all=HR.tuyendung||[]; var act=ovActive(); var ns=HR.nhansu||[];

  /* funnel tuyển dụng rút gọn */
  var fn=tdFunnel(all);
  ptMk('ov-funnel',{
    tooltip:ptTip({trigger:'item',formatter:function(p){var i=p.dataIndex;return '<b>'+esc(p.name)+'</b><br/>'+p.value+' ứng viên'+(i>0?'<br/><span style="color:'+PTC.muted+'">'+pct(fn[i].n,fn[0].n)+'% tổng</span>':'');}}),
    series:[{type:'funnel',left:'6%',right:'6%',top:6,bottom:6,minSize:'26%',maxSize:'100%',sort:'none',gap:3,
      label:{show:true,position:'inside',color:'#fff',fontFamily:PTFONT,fontWeight:600,fontSize:11.5,formatter:function(p){return p.name+'  '+p.value;}},
      labelLine:{show:false},itemStyle:{borderWidth:0},emphasis:{label:{fontSize:12.5}},
      data:fn.map(function(s,i){return {value:s.n,name:s.label,itemStyle:{color:PTC.ramp[i]||PTC.teal}};})}]
  });

  /* cơ cấu phòng ban (đang làm) — bar ngang */
  var dept=csCount(act,'phong');
  ptMk('ov-dept',{
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){return '<b>'+esc(a[0].axisValue)+'</b><br/>'+a[0].value+' người';}}),
    grid:{left:6,right:28,top:8,bottom:4,containLabel:true},
    xAxis:{type:'value',minInterval:1,splitLine:{lineStyle:{color:PTC.line,type:'dashed'}},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11}},
    yAxis:{type:'category',data:dept.map(function(x){return x[0];}).reverse(),axisTick:{show:false},axisLine:{show:false},axisLabel:{color:PTC.text,fontFamily:PTFONT,fontSize:11}},
    series:[{type:'bar',data:dept.map(function(x){return x[1];}).reverse(),barWidth:'56%',itemStyle:{color:PTC.teal,borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:PTC.muted,fontFamily:PTFONT,fontSize:11}}]
  });

  /* sparkline KPI: Tổng nhân sự / Đang làm / Tổng CV — chuỗi tháng thật (cùng logic tab Chỉ số & xu hướng / Hiệu quả tuyển dụng) */
  function sparkOpt(labels,data,color,unit){
    return {
      grid:{left:0,right:0,top:2,bottom:0},
      xAxis:{type:'category',show:false,data:labels},
      yAxis:{type:'value',show:false,scale:true},
      tooltip:ptTip({trigger:'axis',formatter:function(p){var d=p[0];return 'Tháng '+esc(d.axisValue)+'<br/><b>'+d.data+'</b>'+(unit||'');}}),
      series:[{type:'line',data:data,smooth:.35,showSymbol:false,symbol:'circle',symbolSize:5,
        lineStyle:{width:2,color:color},itemStyle:{color:color,borderColor:PTC.paper,borderWidth:2},
        areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:color+'4D'},{offset:1,color:color+'03'}]}}
      }]
    };
  }
  var flow=csMonthlyFlow(ns);
  var mLabels=flow.map(function(x){return x.k.replace(/\/(\d{2})(\d{2})$/,'/$2');});
  var cum=0, tongSpark=flow.map(function(x){cum+=x.inn;return cum;});
  var dangLam=act.length, dangSpark=[], run=dangLam;
  for(var i=flow.length-1;i>=0;i--){ dangSpark[i]=run; run-=flow[i].net; }
  var cvMo=tdMonths(all);
  var cvLabels=cvMo.map(function(x){return x.k.replace(/\/(\d{2})(\d{2})$/,'/$2');});
  var cvSpark=cvMo.map(function(x){return x.n;});
  if(tongSpark.length) ptMk('ov-s-tong', sparkOpt(mLabels,tongSpark,PTC.teal,' người'));
  if(dangSpark.length) ptMk('ov-s-dang', sparkOpt(mLabels,dangSpark,PTC.teal2,' người'));
  if(cvSpark.length)   ptMk('ov-s-cv',   sparkOpt(cvLabels,cvSpark,PTC.clay,' CV'));
}

function renderOverview(){
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  var ns=HR.nhansu||[]; var act=ovActive(); var allCV=HR.tuyendung||[];
  var tong=ns.length, dangLam=act.length;
  var nghi=ns.filter(isLeft).length;
  var T12=bdTurn12(); var rateNghi=T12.rate; // [B1] tỷ lệ nghỉ 12 tháng gần nhất
  var totalCV=allCV.length;

  /* ---- chuỗi tháng thật cho sparkline KPI — cùng nguồn dữ liệu với tab Chỉ số & xu hướng / Hiệu quả tuyển dụng, không tự bịa số ---- */
  var flow=csMonthlyFlow(ns);
  var cum=0, tongSpark=flow.map(function(x){cum+=x.inn;return cum;});
  var dangSpark=[], run=dangLam;
  for(var i=flow.length-1;i>=0;i--){ dangSpark[i]=run; run-=flow[i].net; }
  var cvMo=tdMonths(allCV);
  var cvSpark=cvMo.map(function(x){return x.n;});
  function trend(arr){
    if(arr.length<2) return '';
    var a=arr[arr.length-2], b=arr[arr.length-1], d=b-a, up=d>=0;
    return '<span class="'+(up?'up':'down')+'"><i class="ti '+(up?'ti-arrow-up-right':'ti-arrow-down-right')+'"></i> '+(up?'+':'')+d+'</span> so với tháng trước ('+a+'→'+b+')';
  }

  /* ---- so sánh tỷ lệ nghỉ: toàn công ty vs phòng ban cao nhất (≥3 người — cùng ngưỡng tab Biến động nhân sự) ---- */
  var deptRates=T12.depts.filter(function(r){return r.avg>=3;}).map(function(r){return {phong:r.phong,rate:r.rate,left:r.left,tong:Math.round(r.avg*10)/10};}); // [B1] cùng kỳ 12 tháng, NS bình quân ≥3
  var worstDept=deptRates.slice().sort(function(a,b){return b.rate-a.rate;})[0];

  function statSpark(label,icon,chartId,value,deltaHtml){
    return '<div class="stat"><div class="stat-top"><span class="stat-lbl">'+label+'</span><i class="ti '+icon+'"></i></div>'+
      '<div class="stat-val ov-num" data-to="'+value+'" data-dec="0" data-suf="">0</div>'+
      '<div id="'+chartId+'" class="stat-spark"></div>'+
      (deltaHtml?('<div class="stat-delta">'+deltaHtml+'</div>'):'')+
    '</div>';
  }
  var kpiCVDelta=cvSpark.length?('T'+parseInt(cvMo[cvMo.length-1].k.split('/')[0],10)+' riêng: <b>'+cvSpark[cvSpark.length-1]+' CV</b> ('+pct(cvSpark[cvSpark.length-1],totalCV)+'% tổng)'):'';
  var kpis=''+
    statSpark('Tổng nhân sự','ti-users','ov-s-tong',tong,trend(tongSpark))+
    statSpark('Đang làm','ti-user-check','ov-s-dang',dangLam,trend(dangSpark))+
    '<div class="stat"><div class="stat-top"><span class="stat-lbl">Tỷ lệ nghỉ · 12 tháng</span><i class="ti ti-gauge"></i></div>'+
      '<div class="stat-val ov-num" data-to="'+rateNghi+'" data-dec="1" data-suf="%">0%</div>'+
      '<div class="stat-cmp">'+
        '<div class="stat-cmp-row"><span class="cl">Toàn cty</span><span class="cbg"><span class="cbar" style="width:'+Math.min(100,rateNghi)+'%;background:var(--muted)"></span></span><span class="cv">'+rateNghi+'%</span></div>'+
        (worstDept?('<div class="stat-cmp-row"><span class="cl" style="color:var(--rust)">'+esc(worstDept.phong)+'</span><span class="cbg"><span class="cbar" style="width:'+Math.min(100,worstDept.rate)+'%;background:var(--rust)"></span></span><span class="cv" style="color:var(--rust)">'+worstDept.rate+'%</span></div>'):'')+
      '</div></div>'+
    statSpark('Tổng CV tuyển dụng','ti-files','ov-s-cv',totalCV,kpiCVDelta);

  /* ---- ticker nhận định — tổng hợp từ các tab Phân tích, mọi số đều tính trực tiếp từ HR/tuyendung ---- */
  var dated=bdDated(); var tenArr=dated.map(bdTenureAtLeave).filter(function(x){return x!=null;});
  var som=tenArr.filter(function(t){return t<6;}).length;
  var pctSom=tenArr.length?Math.round(som/tenArr.length*1000)/10:0;
  var undated=nghi-dated.length;
  var fnAll=tdFunnel(allCV);
  var convsAll=fnAll.map(function(s,i){return (i===0||!fnAll[i-1].n)?null:pct(s.n,fnAll[i-1].n);});
  var minCA=101,minIA=-1; convsAll.forEach(function(c,i){if(c!==null&&c<minCA){minCA=c;minIA=i;}});

  var chips=[];
  if(worstDept) chips.push({sev:worstDept.rate>=50?'critical':'warning',
    html:'<b>'+esc(worstDept.phong)+'</b>: tỷ lệ nghỉ 12 tháng '+worstDept.rate+'% ('+worstDept.left+' người nghỉ / NS bình quân '+worstDept.tong+')'+(rateNghi?(' — cao gấp '+(Math.round(worstDept.rate/rateNghi*10)/10)+' lần trung bình công ty'):'')+'.', src:'Biến động nhân sự'});
  if(tenArr.length) chips.push({sev:pctSom>=50?'warning':'neutral',
    html:pctSom+'% người nghỉ ('+som+'/'+tenArr.length+' có ngày) rời trong <b>6 tháng đầu</b> — rủi ro giai đoạn thử việc/hội nhập.', src:'Biến động nhân sự'});
  if(minIA>0) chips.push({sev:minCA<30?'warning':'neutral',
    html:'Điểm nghẽn phễu tuyển dụng: <b>'+esc(fnAll[minIA].label)+'</b>, chỉ '+minCA+'% qua được bước này.', src:'Hiệu quả tuyển dụng'});
  if(undated>0) chips.push({sev:'neutral',
    html:undated+'/'+nghi+' hồ sơ nghỉ việc thiếu ngày nghỉ chính thức — cần bổ sung để phân tích chính xác hơn.', src:'Hồ sơ nhân sự'});
  var tickerHtml=chips.length?('<div class="ov-ticker">'+chips.slice(0,4).map(function(c){
    return '<div class="ov-chip sev-'+c.sev+'"><span class="dot"></span><div>'+c.html+'<span class="src">'+c.src+'</span></div></div>';
  }).join('')+'</div>'):'';

  /* ---- Hợp đồng cần ký ---- */
  var canKy=ovCanKy(); var giaHan=ovGiaHan();
  var soon=giaHan.filter(function(o){return o.n>=0;});
  var over=giaHan.filter(function(o){return o.n<0;});
  var ckRows=canKy.map(function(e){
    return '<div class="ov-li"><span class="ov-dot rust"></span><span class="ov-li-main">'+esc(e.hoTen)+'</span>'+
      '<span class="ov-li-sub">'+esc(loaiHDShort(e.loaiHD))+'</span><span class="ov-tag rust">Chưa ký</span></div>';
  }).join('');
  var soonRows=soon.map(function(o){
    return '<div class="ov-li"><span class="ov-dot clay"></span><span class="ov-li-main">'+esc(o.e.hoTen)+'</span>'+
      '<span class="ov-li-sub">'+esc(loaiHDShort(o.e.loaiHD))+'</span><span class="ov-tag clay">Còn '+o.n+'n</span></div>';
  }).join('');
  var ckTotal=canKy.length+soon.length+over.length;
  var ckBody = (canKy.length?('<div class="ov-sub-h">Chưa ký bản nào ('+canKy.length+')</div>'+ckRows):'')+
               (soon.length?('<div class="ov-sub-h">Sắp hết hạn ≤30 ngày ('+soon.length+')</div>'+soonRows):'')+
               (over.length?('<div class="ov-more"><i class="ti ti-alert-triangle"></i> Và <b>'+over.length+'</b> hợp đồng đã quá hạn cần ký lại.</div>'):'');
  if(!ckBody) ckBody='<div class="ov-empty">Không có hợp đồng cần xử lý.</div>';
  var ckNote = (over.length && ckTotal) ? ('<div style="font-size:11.5px;color:var(--text);margin-top:8px">'+Math.round(over.length/ckTotal*100)+'% ('+over.length+'/'+ckTotal+') việc cần xử lý đã <b style="color:var(--rust)">quá hạn</b> — ưu tiên ký lại nhóm này trước.</div>') : '';

  /* ---- Sinh nhật sắp tới ---- */
  var bds=ovBirthdays();
  var now=new Date(); var curM=now.getMonth()+1, nextM=curM===12?1:curM+1;
  var bdRows = bds.length ? bds.map(function(b){
    var when=b.days===0?'Hôm nay':(b.days===1?'Ngày mai':('Còn '+b.days+' ngày'));
    var soon=b.days<=7;
    return '<div class="ov-li"><span class="ov-dot '+(soon?'gold':'teal')+'"></span><span class="ov-li-main">'+esc(b.ten)+'</span>'+
      '<span class="ov-li-sub">'+esc(b.phong||'')+'</span><span class="ov-tag '+(soon?'gold':'teal')+'">'+b.dd+' · '+when+'</span></div>';
  }).join('') : '<div class="ov-empty">Không có sinh nhật trong tháng '+curM+'–'+nextM+'.</div>';

  /* ---- đánh giá tự động: Phễu tuyển dụng (rút gọn từ tab Hiệu quả tuyển dụng) ---- */
  var vt=tdByViTri(allCV).map(function(r){return {viTri:r.viTri,cv:r.total,rate:pct(r.trung,r.total)};});
  var worstVt=vt.filter(function(x){return x.cv>=10;}).slice().sort(function(a,b){return a.rate-b.rate;})[0];
  var trungAll=fnAll[5]?fnAll[5].n:0;
  var funnelEval='<div class="ov-eval"><div class="callout-k"><i class="ti ti-bulb"></i>Đánh giá tự động</div><div class="empty-list">'+
    (minIA>0?'<div class="empty-li"><i class="ti ti-point"></i><span>Điểm nghẽn phễu: <b>'+esc(fnAll[minIA].label)+'</b> — chỉ '+minCA+'% qua bước này.</span></div>':'')+
    '<div class="empty-li"><i class="ti ti-point"></i><span>HR lọc CV: <b>'+pct(fnAll[1].n,fnAll[0].n)+'%</b> qua vòng scan; đậu chung <b>'+pct(trungAll,fnAll[0].n)+'%</b> ('+trungAll+'/'+fnAll[0].n+').</span></div>'+
    (worstVt?'<div class="empty-li"><i class="ti ti-point"></i><span>Vị trí khó tuyển nhất: <b>'+esc(worstVt.viTri)+'</b> — '+worstVt.cv+' CV, đậu '+worstVt.rate+'%.</span></div>':'')+
  '</div></div>';

  /* ---- đánh giá tự động: Cơ cấu phòng ban ---- */
  var deptCount=csCount(act,'phong');
  var deptEval='<div class="ov-eval"><div class="callout-k"><i class="ti ti-bulb"></i>Đánh giá tự động</div><div class="empty-list">'+
    (deptCount.length?'<div class="empty-li"><i class="ti ti-point"></i><span>Phòng đông nhất: <b>'+esc(deptCount[0][0])+'</b> ('+deptCount[0][1]+' người) trên '+deptCount.length+' phòng ban.</span></div>':'')+
    (worstDept?'<div class="empty-li"><i class="ti ti-point"></i><span><b>'+esc(worstDept.phong)+'</b> có tỷ lệ nghỉ 12 tháng cao nhất công ty — <b style="color:var(--rust)">'+worstDept.rate+'%</b> ('+worstDept.left+' người nghỉ / NS bình quân '+worstDept.tong+').</span></div>':'')+
  '</div></div>';

  setTimeout(ovInit,30);

  return ''+
    '<div class="page-head"><div class="page-h1">Bảng điều khiển</div>'+
    '<div class="page-lead">Nhìn nhanh trong 10 giây — nhân sự, việc cần xử lý và tuyển dụng. Tự cập nhật theo nguồn dữ liệu.</div></div>'+
    '<div class="stat-row">'+kpis+'</div>'+
    tickerHtml+

    '<div class="grid-2">'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Hợp đồng cần ký</span>'+
        '<span class="sec-badge'+(ckTotal?' on':'')+'">'+ckTotal+'</span></div>'+
        '<div class="card ov-card" onclick="go(\'hop-dong\')">'+ckBody+ckNote+
        '<div class="ov-foot">Xem tab Hợp đồng <i class="ti ti-arrow-right"></i></div></div></div>'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Sinh nhật sắp tới</span>'+
        '<span class="sec-badge'+(bds.length?' on':'')+'">'+bds.length+'</span></div>'+
        '<div class="card ov-card" onclick="go(\'ho-so\')">'+bdRows+
        '<div class="ov-foot">Tháng '+curM+' &amp; tháng '+nextM+' <i class="ti ti-cake"></i></div></div></div>'+
    '</div>'+

    '<div class="grid-2">'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Phễu tuyển dụng</span><span class="sec-sub">tóm tắt</span></div>'+
        '<div class="card"><div id="ov-funnel" class="ec ec-tall"></div>'+funnelEval+'</div></div>'+
      '<div class="sec" style="margin:0"><div class="sec-head"><span class="sec-title">Cơ cấu phòng ban</span><span class="sec-sub">nhân sự đang làm</span></div>'+
        '<div class="card"><div id="ov-dept" class="ec ec-tall"></div>'+deptEval+'</div></div>'+
    '</div>'+

    '<div class="ov-nav">'+
      ['pt-chi-so|Chỉ số & xu hướng|ti-chart-bar','pt-tuyen-dung|Hiệu quả tuyển dụng|ti-activity','pt-bien-dong|Biến động nhân sự|ti-trending-up','kho-cv|Nạp CV mới|ti-folder']
      .map(function(s){var p=s.split('|');return '<button class="ov-navbtn" onclick="go(\''+p[0]+'\')"><i class="ti '+p[2]+'"></i>'+p[1]+'</button>';}).join('')+
    '</div>';
}

/* ============================================================
   TAB: CHẤM CÔNG & PHÉP — nhúng nguyên web chấm công (giữ 100%)
   ============================================================ */
var CC_APP_URL   = 'chamcong.html?cc=22'; // chấm công giờ ở ngay trong hrbigx (cùng Firebase → data giữ nguyên)

function renderChamCong(){
  return '<div class="cc-frame-wrap"><iframe class="cc-frame" src="'+CC_APP_URL+'" title="BigX Chấm công" allow="clipboard-read; clipboard-write"></iframe></div>';
}

/* ---- Router ---- */
var currentTab = null;
function go(id){
  var entry=MAP[id]; if(!entry) return;
  currentTab=id;
  var item=entry.item, group=entry.group;

  document.querySelectorAll('.nav-item').forEach(function(e){ e.classList.remove('active'); });
  var nb=document.getElementById('nav-'+id); if(nb) nb.classList.add('active');

  document.getElementById('tb-icon').innerHTML='<i class="ti '+item.icon+'"></i>';
  document.getElementById('tb-title').textContent=item.label;
  document.getElementById('tb-crumb').textContent=group.group;

  var content=document.getElementById('content');
  if(id==='overview') content.innerHTML=renderOverview();
  else if(id==='ho-so') content.innerHTML=renderHoSo();
  else if(id==='hop-dong') content.innerHTML=renderHopDong();
  else if(id==='tuyen-dung') content.innerHTML=renderTuyenDung();
  else if(id==='pt-tuyen-dung') content.innerHTML=renderPhanTichTuyenDung();
  else if(id==='pt-chi-so') content.innerHTML=renderChiSo();
  else if(id==='pt-bien-dong') content.innerHTML=renderBienDong();
  else if(id==='kho-cv') content.innerHTML=renderKhoCV();
  else if(id==='cham-cong') content.innerHTML=renderChamCong();
  else if(id==='pt-nang-suat'){content.innerHTML=window.renderNangSuat();}
  else if(id==='bao-cao'){content.innerHTML=window.renderBaoCao();}
  else if(id==='so-do'){content.innerHTML=window.renderSoDo();}
  else if(id==='calendar'){content.innerHTML=window.renderCalendar();}
  else if(id==='nguon'){content.innerHTML=window.renderNguon();}
  else if(id==='cong-viec'){content.innerHTML=window.renderCongViec();} // [G]
    else content.innerHTML='<div class="page-head"><div class="page-h1">'+esc(item.label)+'</div><div class="page-lead">'+esc(item.lead||'')+'</div></div>'+emptyState(item, group);
  content.scrollTop=0;
}

/* ---- Khởi động (chỉ chạy sau khi dang nhap Google thanh cong - xem index.html) ---- */
window.bxMainBoot = function(){
  renderNav();
  loadData(true); // luôn fresh: người mới trong HSNS tự hiện, không kẹt cache máy chủ
  go('overview');
};

/* ---- Cham cong & nang suat (pt-nang-suat) ---- */
window.__NS_FB="https://bigx-chamcong-hr-default-rtdb.firebaseio.com/public.json";
window.nsNorm=function(s){return String(s||'').toLowerCase().normalize('NFC').replace(/\s+/g,' ').trim();};
window.nsMSort=function(a,b){var A=a.slice(1).split('/'),B=b.slice(1).split('/');return ((+A[1])*12+(+A[0]))-((+B[1])*12+(+B[0]));}; // [B1] sắp 'T9/2026' theo năm-tháng
/* [B2] Đi trễ tính như tab Chấm công: chỉ lượt KHÔNG phép (T-S/T-C/T-C2) từ 3' trở lên; 1 ngày có thể 2 lượt (v.lates). T7/CN bỏ qua. */
window.nsLates=function(v){ if(!v||typeof v!=='object') return []; if(Array.isArray(v.lates)&&v.lates.length) return v.lates.map(function(x){return +x.m||0;}).filter(function(m){return m>=3;});
  var st=v.status, m=+v.lateMin||0; return (['T-S','T-C','T-C2'].indexOf(st)>=0 && m>=3)?[m]:[]; };
window.nsWknd=function(d){ var w=new Date(d+'T12:00:00').getDay(); return w===0||w===6; };
window.nsEsc=function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
/* [B1] Chấm công luôn lấy từ Firebase (không dùng bản lưu cũ trong trình duyệt); quá 2 phút thì tải lại ngầm */
window.nsuatData=function(){
  if(window.__ccData){ if(Date.now()-(window.__ccAt||0)>120000) window.nsuatLoadFirebase(); return window.__ccData; }
  return null;
};
/* [B1] Bộ nạp DUY NHẤT cho các tab dùng chấm công — xong thì vẽ lại đúng tab đang mở */
window.nsuatLoadFirebase=function(){
  if(window.__ccLoading) return; window.__ccLoading=true;
  (window.bxAuthedFetch ? window.bxAuthedFetch(window.__NS_FB) : fetch(window.__NS_FB)).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }).then(function(d){
    d=d||{};
    var fresh=!window.__ccData;
    window.__ccData={employees:d.employees||[], cc_data:d.cc_data||{}}; window.__ccAt=Date.now();
    window.__ccLoading=false;
    if(fresh && ['pt-nang-suat','bao-cao','nguon'].indexOf(window.currentTab)>=0) window.go && window.go(window.currentTab);
  }).catch(function(e){ window.__ccLoading=false; var msg='Không tải được dữ liệu chấm công (Firebase) — thử tải lại trang.'; var el=document.querySelector('#nsuat-status'); if(el) el.textContent=msg;
    try{ document.querySelectorAll('#content *').forEach(function(n){ if(n.children.length===0 && /Đang tải dữ liệu chấm công|đang tải…/.test(n.textContent)) n.textContent=msg; }); }catch(_){} }); // [E]
};
window.renderNangSuat=function(){
  var esc=window.nsEsc, norm=window.nsNorm;
  var ns=(window.HR&&window.HR.nhansu)||[];
  var nsByName={}; ns.forEach(function(n){nsByName[norm(n.hoTen)]=n;});
  var head='<div class="page-head"><div class="page-h1">Chấm công & năng suất</div>'
    +'<div class="page-lead">Từ bảng công đến góc nhìn năng suất — biểu đồ động, dữ liệu đã liên kết mã nhân viên.</div></div>';
  var style='<style id="ns-style">'
    +'#nsuat{max-width:1120px}'
    +'#nsuat .ns-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:4px 0 18px}'
    +'#nsuat .ns-kpi{background:#fff;border:1px solid #E4DECF;border-radius:10px;padding:16px 18px}'
    +'#nsuat .ns-kpi .v{font-family:Fraunces,Georgia,serif;font-size:29px;font-weight:600;color:#21303B;line-height:1}'
    +'#nsuat .ns-kpi .l{font-size:12.5px;color:#8B897E;margin-top:6px}'
    +'#nsuat .ns-note{background:#FBFAF6;border:1px solid #E4DECF;border-left:3px solid #35655B;border-radius:8px;padding:12px 16px;font-size:13.5px;color:#414B54;margin-bottom:20px;line-height:1.55}'
    +'#nsuat .ns-note b{color:#21303B}'
    +'#nsuat h3{font-family:Fraunces,Georgia,serif;font-size:16.5px;color:#21303B;margin:26px 0 10px;font-weight:600}'
    +'#nsuat .ns-card{background:#fff;border:1px solid #E4DECF;border-radius:12px;padding:15px 18px 8px;margin-bottom:18px}'
    +'#nsuat .ns-card .ct{font-family:Fraunces,serif;font-size:15px;color:#21303B;font-weight:600}'
    +'#nsuat .ns-card .cs{font-size:12px;color:#8B897E;margin:1px 0 4px}'
    +'#nsuat .ns-chart{width:100%;height:300px}'
    +'#nsuat .ns-chart.tall{height:330px}'
    +'#nsuat .ns-grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px}'
    +'#nsuat .ns-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
    +'#nsuat .ns-seg{display:inline-flex;border:1px solid #E4DECF;border-radius:8px;overflow:hidden;margin-left:auto}'
    +'#nsuat .ns-seg button{border:0;background:#fff;color:#8B897E;font-family:inherit;font-size:12.5px;padding:6px 13px;cursor:pointer}'
    +'#nsuat .ns-seg button.on{background:#35655B;color:#fff}'
    +'#nsuat table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #E4DECF;border-radius:10px;overflow:hidden;font-size:13px}'
    +'#nsuat th{text-align:left;background:#FBFAF6;color:#5c5647;font-weight:600;padding:9px 12px;border-bottom:1px solid #E4DECF;white-space:nowrap;font-size:12px}'
    +'#nsuat td{padding:8px 12px;border-bottom:1px solid #f0ebe0;color:#3d3a30}'
    +'#nsuat tr:last-child td{border-bottom:none}'
    +'#nsuat td.num,#nsuat th.num{text-align:right;font-variant-numeric:tabular-nums}'
    +'#nsuat .code{font-family:ui-monospace,Menlo,monospace;font-size:12px;color:#35655B;font-weight:600}'
    +'#nsuat .nvcode{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:#9a8f78}'
    +'#nsuat .mtag{display:inline-block;background:#eef1ea;color:#4a6b60;border-radius:4px;padding:1px 6px;font-size:11px;margin:1px 2px 1px 0}'
    +'#nsuat .late{color:#A65A4B;font-weight:600}#nsuat .muted{color:#9a8f78}'
    +'@media(max-width:820px){#nsuat .ns-kpis{grid-template-columns:repeat(2,1fr)}#nsuat .ns-grid2{grid-template-columns:1fr}}'
    +'</style>';
  var data=window.nsuatData();
  if(!data){ window.nsuatLoadFirebase(); return head+style+'<div id="nsuat"><div id="nsuat-status" class="ns-note">Đang tải dữ liệu chấm công…</div></div>'; }
  var emp=data.employees||[], cc=data.cc_data||{};
  var ccKeys=Object.keys(cc);
  var byMonth={}, byDept={}, lateEmp={};
  var rows=emp.map(function(e){
    var months={}, totalRec=0, fullDays=0, lateCnt=0;
    var n=nsByName[norm(e.name)];
    var dept=(n&&n.phong)||e.dept||'—';
    ccKeys.forEach(function(k){
      if(k.indexOf(e.id+'_')!==0) return;
      var mm=k.split('_'); if(mm.length<3) return;
      var ml='T'+mm[mm.length-1]+'/'+mm[mm.length-2]; // [E] months[ml]=1; // [B1] kèm năm
      byMonth[ml]=byMonth[ml]||{full:0,late:0,rec:0,emp:{}};
      var rec=cc[k]||{};
      Object.keys(rec).forEach(function(d){
        var v=rec[d]; var st=(v&&typeof v==='object')?v.status:v;
        if(st===''||st==null) return;
        if(window.nsWknd(d)) return; // [B2] T7/CN không tính
        totalRec++; byMonth[ml].rec++; byMonth[ml].emp[e.id]=1;
        if(st==='1'){fullDays++; byMonth[ml].full++;}
        // [B2] "Đi trễ" = từng LƯỢT không phép từ 3' (giống tab Chấm công); đi trễ có phép (-P) không tính, không phạt
        window.nsLates(v).forEach(function(lm){ lateCnt++; byMonth[ml].late++;
          var _le=lateEmp[e.id]||(lateEmp[e.id]={name:e.name,phong:dept,mon:{},tot:{c:0,m:0,f:0}});
          _le.phong=dept;
          var _mo=_le.mon[ml]||(_le.mon[ml]={c:0,m:0,f:0});
          var _f=(lm>=3&&lm<=20)?20000:((lm>=21&&lm<=45)?50000:0);
          _mo.c++;_mo.m+=lm;_mo.f+=_f;_le.tot.c++;_le.tot.m+=lm;_le.tot.f+=_f;
        });
      });
    });
    byDept[dept]=byDept[dept]||{n:0,full:0,late:0,rec:0};
    byDept[dept].n++; byDept[dept].full+=fullDays; byDept[dept].late+=lateCnt; byDept[dept].rec+=totalRec;
    return {nv:e.id, bigx:n?n.maNV:'—', name:e.name, phong:dept,
      months:Object.keys(months).sort(window.nsMSort),
      totalRec:totalRec, fullDays:fullDays, lateCnt:lateCnt};
  });
  rows.sort(function(a,b){return (a.phong+'|'+a.name).localeCompare(b.phong+'|'+b.name,'vi');});
  var months=Object.keys(byMonth).sort(window.nsMSort);
  var mArr=months.map(function(m,i){return {m:m, full:byMonth[m].full, late:byMonth[m].late, rec:byMonth[m].rec, emp:Object.keys(byMonth[m].emp).length, partial:(i===months.length-1)};});
  var dArr=Object.keys(byDept).map(function(d){return {d:d, n:byDept[d].n, full:byDept[d].full, late:byDept[d].late, rec:byDept[d].rec, rate:byDept[d].rec?+(byDept[d].late/byDept[d].rec*100).toFixed(1):0};});
  window.__nsChartData={months:months, byMonth:mArr, byDept:dArr, late:lateEmp};
  var sumFull=rows.reduce(function(s,r){return s+r.fullDays;},0);
  var sumLate=rows.reduce(function(s,r){return s+r.lateCnt;},0);
  var sumRec=rows.reduce(function(s,r){return s+r.totalRec;},0);
  var rate=sumRec?(sumLate/sumRec*100):0;
  var empNames={}; emp.forEach(function(e){empNames[norm(e.name)]=1;});
  var noAtt=ns.filter(function(n){return n.tinhTrang && isWorking(n) && !empNames[norm(n.hoTen)];});
  // top late dept
  var topLate=dArr.slice().filter(function(x){return x.n>=3;}).sort(function(a,b){return b.rate-a.rate;})[0];
  var kpis='<div class="ns-kpis">'
    +'<div class="ns-kpi"><div class="v">'+rows.length+'</div><div class="l">Nhân viên có chấm công</div></div>'
    +'<div class="ns-kpi"><div class="v">'+sumFull.toLocaleString('vi')+'</div><div class="l">Ngày công đủ ('+esc(months[0])+'–'+esc(months[months.length-1])+')</div></div>'
    +'<div class="ns-kpi"><div class="v">'+sumLate+'</div><div class="l">Lượt đi trễ</div></div>'
    +'<div class="ns-kpi"><div class="v">'+rate.toFixed(1).replace('.',',')+'%</div><div class="l">Tỷ lệ ngày đi trễ</div></div>'
    +'</div>';
  var note='<div class="ns-note"><b>Đọc nhanh:</b> '
    +(topLate?('phòng <b>'+esc(topLate.d)+'</b> có tỷ lệ đi trễ cao nhất ('+topLate.rate.toFixed(1).replace('.',',')+'%). '):'')
    +'Đã liên kết '+rows.length+'/'+emp.length+' mã chấm công (NVxxx) ↔ hồ sơ (BIGX). '
    +noAtt.length+' NV đang làm không chấm công (BOD/cố vấn/quản lý). Tháng gần nhất ('+esc(months[months.length-1])+') đang trong kỳ nên ngày công còn thấp. <i>Di chuột lên biểu đồ để xem chi tiết.</i></div>';
  var charts='<div class="ns-head"><h3 style="margin-top:6px">Xu hướng theo tháng</h3>'
    +'<span class="ns-seg" id="ns-seg"><button data-k="full" class="on">Ngày công đủ</button><button data-k="late">Đi trễ</button></span></div>'
    +'<div class="ns-card"><div class="ns-chart tall" id="ns-trend"></div></div>'
    +'<h3>So sánh giữa phòng ban</h3><div class="ns-grid2">'
    +'<div class="ns-card"><div class="ct">Ngày công đủ theo phòng</div><div class="cs">Quy mô đóng góp ngày công</div><div class="ns-chart" id="ns-dfull"></div></div>'
    +'<div class="ns-card"><div class="ct">Tỷ lệ đi trễ theo phòng</div><div class="cs">Lượt đi trễ / tổng ngày chấm (%)</div><div class="ns-chart" id="ns-dlate"></div></div>'
    +'</div>';
  var mBtns='<button data-k="all" class="on">Toàn kỳ</button>'+months.map(function(m){return '<button data-k="'+esc(m)+'">'+esc(m)+'</button>';}).join(''); // [C3]
  var lateTop='<div class="ns-head"><h3 style="margin-top:26px">Đi trễ nhiều nhất — Top 10</h3>'
    +'<span class="ns-seg" id="ns-late-seg">'+mBtns+'</span></div>'
    +'<div class="ns-card"><div class="cs" style="margin:-2px 0 3px">Xếp theo số lần đi trễ · di chuột để xem tổng phút &amp; tiền phạt ước tính</div><div class="ns-chart tall" id="ns-top-late"></div></div>';
  var thead='<tr><th>Mã BIGX</th><th>Mã CC</th><th>Họ tên</th><th>Phòng ban</th><th>Tháng có dữ liệu</th><th class="num">Ngày đã chấm</th><th class="num">Ngày công đủ</th><th class="num">Lượt đi trễ</th></tr>';
  var tbody=rows.map(function(r){
    return '<tr><td class="code">'+esc(r.bigx)+'</td><td class="nvcode">'+esc(r.nv)+'</td><td>'+esc(r.name)+'</td><td>'+esc(r.phong)+'</td>'
      +'<td>'+r.months.map(function(m){return '<span class="mtag">'+esc(m)+'</span>';}).join('')+'</td>'
      +'<td class="num">'+r.totalRec+'</td><td class="num">'+r.fullDays+'</td>'
      +'<td class="num '+(r.lateCnt>0?'late':'muted')+'">'+r.lateCnt+'</td></tr>';
  }).join('');
  var table='<h3>Nhân viên có chấm công ('+rows.length+')</h3><table>'+thead+tbody+'</table>';
  var deptRows=dArr.slice().sort(function(a,b){return a.d.localeCompare(b.d,'vi');}).map(function(x){
    return '<tr><td>'+esc(x.d)+'</td><td class="num">'+x.n+'</td><td class="num">'+x.rec+'</td><td class="num">'+x.full+'</td><td class="num '+(x.late>0?'late':'muted')+'">'+x.late+'</td></tr>';
  }).join('');
  var deptTable='<h3>Theo phòng ban</h3><table><tr><th>Phòng ban</th><th class="num">Số NV</th><th class="num">Ngày chấm</th><th class="num">Công đủ</th><th class="num">Đi trễ</th></tr>'+deptRows+'</table>';
  var noAttHtml='';
  if(noAtt.length){
    noAttHtml='<h3>Đang làm nhưng không chấm công ('+noAtt.length+')</h3><table><tr><th>Mã BIGX</th><th>Họ tên</th><th>Phòng ban</th><th>Tình trạng</th></tr>'
      +noAtt.map(function(n){return '<tr><td class="code">'+esc(n.maNV)+'</td><td>'+esc(n.hoTen)+'</td><td>'+esc(n.phong)+'</td><td class="muted">'+esc(n.tinhTrang)+'</td></tr>';}).join('')+'</table>';
  }
  if(typeof setTimeout==='function') setTimeout(window.nsInit,30);
  return head+style+'<div id="nsuat">'+kpis+note+charts+lateTop+table+deptTable+noAttHtml+'</div>';
};
window.nsInit=function(){
  if(typeof echarts==='undefined'||!window.ptMk) return;
  var D=window.__nsChartData; if(!D) return;
  var teal='#35655B', teal2='#4A8375', rust='#A65A4B', clay='#B07A43', muted='#8B897E', line='#E4DECF', faint='#efe9db', ink='#21303B', navy='#21303B';
  var FONT="'Be Vietnam Pro',sans-serif";
  var tip=(window.ptTip?window.ptTip:function(x){return x;});
  var axis={axisLine:{lineStyle:{color:line}},axisTick:{show:false},axisLabel:{color:muted,fontFamily:FONT,fontSize:11.5},splitLine:{lineStyle:{color:faint}}};
  var M=D.byMonth;
  function trendOpt(metric){
    var isLate=metric==='late';
    return {
      grid:{left:6,right:16,top:34,bottom:22,containLabel:true},
      tooltip:tip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(p){var d=M[p[0].dataIndex];return '<b>'+esc(d.m)+'</b>'+(d.partial?' <span style="color:'+clay+'">(đang trong kỳ)</span>':'')+'<br/>Ngày công đủ: <b>'+d.full+'</b><br/>Lượt đi trễ: <b>'+d.late+'</b><br/>NV chấm công: '+d.emp;}}),
      xAxis:Object.assign({type:'category',data:M.map(function(x){return x.m;})},axis),
      yAxis:Object.assign({type:'value'},axis),
      series:[{type:'bar',barWidth:'46%',
        data:M.map(function(x){var val=isLate?x.late:x.full;return {value:val,itemStyle:{color:x.partial?(isLate?'#c99183':'#8fb0a6'):(isLate?rust:teal),borderRadius:[4,4,0,0]}};}),
        label:{show:true,position:'top',color:muted,fontFamily:FONT,fontSize:11},
        animationDuration:700,animationEasing:'cubicOut'}]
    };
  }
  window.ptMk('ns-trend',trendOpt('full'));
  var seg=document.getElementById('ns-seg');
  if(seg) seg.querySelectorAll('button').forEach(function(b){
    b.onclick=function(){seg.querySelectorAll('button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');
      var c=window.__ptCharts&&window.__ptCharts['ns-trend']; if(c) c.setOption(trendOpt(b.dataset.k),true);};
  });
  var df=D.byDept.slice().sort(function(a,b){return a.full-b.full;});
  window.ptMk('ns-dfull',{
    grid:{left:6,right:34,top:8,bottom:4,containLabel:true},
    tooltip:tip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(p){return '<b>'+esc(p[0].name)+'</b><br/>Ngày công đủ: <b>'+p[0].value+'</b>';}}),
    xAxis:Object.assign({type:'value'},axis),
    yAxis:Object.assign({type:'category',data:df.map(function(x){return x.d;})},axis,{axisLabel:{color:navy,fontFamily:FONT,fontSize:11.5}}),
    series:[{type:'bar',barWidth:'62%',data:df.map(function(x){return x.full;}),itemStyle:{color:teal,borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:muted,fontFamily:FONT,fontSize:11},animationDuration:700,animationDelay:function(i){return i*40;}}]
  });
  var dl=D.byDept.slice().sort(function(a,b){return a.rate-b.rate;});
  window.ptMk('ns-dlate',{
    grid:{left:6,right:44,top:8,bottom:4,containLabel:true},
    tooltip:tip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(p){var o=dl[p[0].dataIndex];return '<b>'+esc(o.d)+'</b><br/>Tỷ lệ đi trễ: <b>'+o.rate.toFixed(1).replace('.',',')+'%</b><br/>'+o.late+' / '+o.rec+' ngày';}}),
    xAxis:Object.assign({type:'value',axisLabel:{color:muted,fontFamily:FONT,fontSize:11.5,formatter:'{value}%'}},axis),
    yAxis:Object.assign({type:'category',data:dl.map(function(x){return x.d;})},axis,{axisLabel:{color:navy,fontFamily:FONT,fontSize:11.5}}),
    series:[{type:'bar',barWidth:'62%',data:dl.map(function(x){return x.rate;}),itemStyle:{color:function(p){var r=dl[p.dataIndex].rate;return r>=10?rust:(r>=6?clay:teal2);},borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:muted,fontFamily:FONT,fontSize:11,formatter:function(o){return o.value.toFixed(1).replace('.',',')+'%';}},animationDuration:700,animationDelay:function(i){return i*40;}}]
  });
  function nsMoney(n){return (n||0).toLocaleString('vi')+'đ';}
  function topLateOpt(scope){
    var L=D.late||{};
    var arr=Object.keys(L).map(function(id){var o=L[id];var s=scope==='all'?o.tot:(o.mon[scope]||{c:0,m:0,f:0});return {name:o.name,phong:o.phong,c:s.c,m:s.m,f:s.f};}).filter(function(x){return x.c>0;});
    arr.sort(function(a,b){return (b.c-a.c)||(b.m-a.m);});
    arr=arr.slice(0,10).reverse();
    return {
      grid:{left:6,right:54,top:10,bottom:6,containLabel:true},
      tooltip:tip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(p){var o=arr[p[0].dataIndex];return '<b>'+esc(o.name)+'</b><br/><span style="color:'+muted+'">'+esc(o.phong)+'</span><br/>Số lần đi trễ: <b>'+o.c+'</b><br/>Tổng phút trễ: <b>'+o.m+'</b> phút<br/>Tiền phạt ước tính: <b>'+nsMoney(o.f)+'</b>';}}),
      xAxis:Object.assign({type:'value',minInterval:1},axis),
      yAxis:Object.assign({type:'category',data:arr.map(function(x){return x.name;})},axis,{axisLabel:{color:navy,fontFamily:FONT,fontSize:11.5}}),
      series:[{type:'bar',barWidth:'60%',data:arr.map(function(x){return x.c;}),itemStyle:{color:rust,borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:muted,fontFamily:FONT,fontSize:11.5,formatter:function(o){return arr[o.dataIndex].c+' lần';}},animationDuration:700,animationDelay:function(i){return i*45;}}],
      title:arr.length?{show:false}:{text:'Không có lượt đi trễ trong kỳ này',left:'center',top:'middle',textStyle:{color:muted,fontFamily:FONT,fontSize:13,fontWeight:400}}
    };
  }
  window.ptMk('ns-top-late',topLateOpt('all'));
  var lseg=document.getElementById('ns-late-seg');
  if(lseg) lseg.querySelectorAll('button').forEach(function(b){
    b.onclick=function(){lseg.querySelectorAll('button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');
      var c=window.__ptCharts&&window.__ptCharts['ns-top-late']; if(c) c.setOption(topLateOpt(b.dataset.k),true);};
  });
};


/* ============================================================
   TAB: BÁO CÁO theo kỳ (bao-cao)
   Tổng hợp Tuyển dụng · Biến động NS · Chấm công · Hợp đồng
   theo Tuần / Tháng, so với kỳ trước. Số liệu từ data thật:
   - HR.tuyendung / HR.nhansu (API hub)
   - Chấm công: Firebase (window.__ccData qua nsuatData/loadFirebase)
   ============================================================ */
window.__bc = window.__bc || { mode:'week', off:0 };

window.bcSetMode = function(m){ window.__bc.mode=m; window.__bc.off=0; window.go('bao-cao'); };
window.bcStep    = function(d){ window.__bc.off += d; if(window.__bc.off>0) window.__bc.off=0; window.go('bao-cao'); };

/* Xuất PDF tải về (không qua hộp thoại in). Thư viện html2pdf chỉ nạp khi bấm. */
window.bcExportPDF = function(){
  var el=document.getElementById('baocao'); if(!el) return;
  var btn=el.querySelector('.bc-pdf'), oldHtml=btn?btn.innerHTML:'';
  function fail(msg){ if(btn){btn.disabled=false;btn.innerHTML=oldHtml;} alert(msg||'Không tạo được PDF, thử lại giúp em.'); }
  function run(){
    try{
      var p=bcPeriod(window.__bc.mode, window.__bc.off), lbl=bcLabel(window.__bc.mode,p);
      var slug=(window.__bc.mode==='week'? (bcDMY(p.start)+'_'+bcDMY(p.end)) : ('Thang_'+(p.start.getMonth()+1)+'-'+p.start.getFullYear())).replace(/\//g,'-');
      var fname='BaoCao_HR_'+slug+'.pdf';
      var controls=el.querySelector('.bc-controls'), cad=el.querySelector('.bc-cad');
      var pc=controls?controls.style.display:'', pd=cad?cad.style.display:'';
      if(controls) controls.style.display='none';
      if(cad) cad.style.display='none';
      var hdr=document.createElement('div'); hdr.className='bc-exphdr';
      hdr.innerHTML='<div class="bc-exphdr-l"><div class="bc-exphdr-logo">BigX</div>'
        +'<div><div class="bc-exphdr-t">BÁO CÁO NHÂN SỰ</div><div class="bc-exphdr-s">Kỳ: '+lbl+'</div></div></div>'
        +'<div class="bc-exphdr-r">Ngày xuất: '+bcDMY(new Date())+'</div>';
      el.insertBefore(hdr, el.firstChild);
      el.classList.add('bc-exp');
      function cleanup(){ el.classList.remove('bc-exp'); if(hdr&&hdr.parentNode)hdr.parentNode.removeChild(hdr); if(controls)controls.style.display=pc; if(cad)cad.style.display=pd; if(btn){btn.disabled=false;btn.innerHTML=oldHtml;} }
      var opt={ margin:[10,10,12,10], filename:fname, image:{type:'jpeg',quality:0.98},
        html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff',windowWidth:el.scrollWidth},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
        pagebreak:{mode:['css','legacy'],avoid:['.bc-sec','.bc-kpi','tr']} };
      window.html2pdf().set(opt).from(el).save().then(cleanup, function(){ cleanup(); fail(); });
    }catch(e){ fail(); }
  }
  if(btn){ btn.disabled=true; btn.innerHTML='⏳&nbsp; Đang tạo PDF…'; }
  if(window.html2pdf){ run(); return; }
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  s.onload=run; s.onerror=function(){ fail('Không tải được thư viện xuất PDF (kiểm tra mạng rồi thử lại).'); };
  document.head.appendChild(s);
};

/* ---- helpers ---- */
function bcYmd(dt){ var m=dt.getMonth()+1, d=dt.getDate(); return dt.getFullYear()+'-'+(m<10?'0'+m:m)+'-'+(d<10?'0'+d:d); }
function bcDMY(dt){ var m=dt.getMonth()+1, d=dt.getDate(); return (d<10?'0'+d:d)+'/'+(m<10?'0'+m:m)+'/'+dt.getFullYear(); }
function bcPeriod(mode, off){
  var now=new Date(); now.setHours(0,0,0,0);
  if(mode==='week'){
    var day=(now.getDay()+6)%7;                 // Mon=0 … Sun=6
    var mon=new Date(now); mon.setDate(now.getDate()-day + off*7);
    var sun=new Date(mon); sun.setDate(mon.getDate()+6);
    return {start:mon, end:sun};
  }
  var m0=new Date(now.getFullYear(), now.getMonth()+off, 1);
  var m1=new Date(m0.getFullYear(), m0.getMonth()+1, 0);
  return {start:m0, end:m1};
}
function bcLabel(mode, p){
  if(mode==='week') return bcDMY(p.start).slice(0,5)+' – '+bcDMY(p.end);
  return 'Tháng '+(p.start.getMonth()+1)+'/'+p.start.getFullYear();
}
function bcInRangeDMY(s, p){ var d=window.parseDMY(s); return d && d>=p.start && d<=p.end; }
function bcInRangeYmd(ymd, sYmd, eYmd){ return ymd>=sYmd && ymd<=eYmd; }

/* delta pill: goodUp=true → tăng là tốt (xanh) */
function bcDelta(cur, prev, goodUp){
  var d=cur-prev;
  if(d===0) return '<span class="bc-d flat">— <small>= '+prev+'</small></span>';
  var up=d>0, good=(up===!!goodUp);
  var arw=up?'▲':'▼';
  return '<span class="bc-d '+(good?'up':'down')+'">'+arw+' '+Math.abs(d)+' <small>vs '+prev+'</small></span>';
}
function bcDeltaPct(cur, prev){ // for % metric, cur/prev are numbers (percent points)
  var d=Math.round((cur-prev)*10)/10;
  if(d===0) return '<span class="bc-d flat">— <small>= '+prev+'%</small></span>';
  var up=d>0, arw=up?'▲':'▼';
  return '<span class="bc-d '+(up?'up':'down')+'">'+arw+' '+Math.abs(d)+'đ <small>vs '+prev+'%</small></span>';
}

/* ---- chấm công: gom số liệu trong 1 khoảng ---- */
function bcCham(p){
  var data=window.nsuatData(); if(!data) return null;
  var emp=data.employees||[], cc=data.cc_data||{};
  var norm=window.nsNorm;
  var ns=(window.HR&&window.HR.nhansu)||[]; var nsByName={}; ns.forEach(function(n){nsByName[norm(n.hoTen)]=n;});
  var empById={}; emp.forEach(function(e){empById[e.id]=e;});
  var sY=bcYmd(p.start), eY=bcYmd(p.end);
  var full=0, late=0, absent=0, leave=0, work=0, lateBy={};
  Object.keys(cc).forEach(function(k){
    var mm=k.split('_'); if(mm.length<3) return;
    var id=mm.slice(0,-2).join('_'); var rec=cc[k]||{}; // [E]
    Object.keys(rec).forEach(function(d){
      if(!bcInRangeYmd(d, sY, eY)) return;         // d = 'YYYY-MM-DD'
      if(window.nsWknd(d)) return;                  // [B2] T7/CN không tính
      var v=rec[d]; var st=(v&&typeof v==='object')?v.status:v;
      if(st===''||st==null) return;
      if(st==='NL'||st==='ĐÃ NGHỈ') return;        // nghỉ lễ / đã nghỉ việc: không tính
      if(/^P/.test(st)||/-P$/.test(st)){ leave++; if(!/^T-[SC]/.test(st)) return; } // nghỉ phép (đi trễ có phép vẫn tính là đi làm bên dưới)
      work++;
      if(st==='1'){ full++; return; }
      var _L=window.nsLates(v); // [B2] chỉ lượt không phép ≥3'
      if(_L.length){
        late+=_L.length;
        var e=empById[id]; var nm=e?e.name:id; var dept=(nsByName[norm(nm)]&&nsByName[norm(nm)].phong)||(e&&e.dept)||'—';
        var o=lateBy[id]||(lateBy[id]={name:nm, dept:dept, c:0}); o.c+=_L.length;
        return;
      }
      if(/^T-[SC]/.test(st)){ full++; return; }    // [B2] trễ <3' hoặc có phép: tính là có mặt đúng giờ
      if(st==='CS'||st==='CC'){ full++; return; }    // [2S] có check-in 1 buổi: tính là có mặt
      if(st==='K'){ absent++; return; }
      // các mã nửa buổi N-S/N-C… tính vào "work" nhưng không phải full/late/absent
    });
  });
  var present=full+late;                            // ngày có mặt (đúng giờ + trễ)
  var rate=work? Math.round(present/work*1000)/10 : 0;
  var lateArr=Object.keys(lateBy).map(function(k){return lateBy[k];}).sort(function(a,b){return b.c-a.c;});
  return {full:full, late:late, absent:absent, leave:leave, work:work, rate:rate, lateArr:lateArr};
}

/* ---- Tuyển dụng theo kỳ ---- */
function bcTuyen(p){
  var t=(window.HR&&window.HR.tuyendung)||[];
  var cvNew=t.filter(function(c){return bcInRangeDMY(c.ngayNop, p);});
  var hire =t.filter(function(c){return bcInRangeDMY(c.ngayNhanViec, p);});
  var byPos={};
  cvNew.forEach(function(c){ var k=c.viTri||'—'; (byPos[k]=byPos[k]||{pos:k,cv:0,hire:0}).cv++; });
  hire.forEach(function(c){ var k=c.viTri||'—'; (byPos[k]=byPos[k]||{pos:k,cv:0,hire:0}).hire++; });
  var pos=Object.keys(byPos).map(function(k){return byPos[k];}).sort(function(a,b){return b.cv-a.cv;});
  // CV theo ngày (tuần) hoặc theo ngày trong tháng
  var buckets, labels;
  if(window.__bc.mode==='week'){
    labels=['T2','T3','T4','T5','T6','T7','CN']; buckets=[0,0,0,0,0,0,0];
    cvNew.forEach(function(c){ var d=window.parseDMY(c.ngayNop); if(d){ var idx=(d.getDay()+6)%7; buckets[idx]++; } });
  } else {
    var days=p.end.getDate(); labels=[]; buckets=[];
    for(var i=1;i<=days;i++){ labels.push(String(i)); buckets.push(0); }
    cvNew.forEach(function(c){ var d=window.parseDMY(c.ngayNop); if(d){ buckets[d.getDate()-1]++; } });
  }
  return {cvNew:cvNew.length, hire:hire.length, pos:pos, chart:{labels:labels, data:buckets}};
}

/* ---- Biến động nhân sự theo kỳ ---- */
function bcBienDong(p){
  var ns=(window.HR&&window.HR.nhansu)||[];
  var vao=ns.filter(function(n){return bcInRangeDMY(n.ngayVao, p);});
  var nghi=ns.filter(function(n){return bcInRangeDMY(n.ngayNghi, p);});
  var active=ns.filter(isWorking).length;
  return {vao:vao, nghi:nghi, active:active};
}

/* ---- Hợp đồng & hồ sơ (hết hạn trong kỳ + snapshot hiện tại) ---- */
function bcHopDong(p){
  var act=window.hdActive?window.hdActive():((window.HR&&window.HR.nhansu)||[]).filter(isWorking);
  var expire=act.filter(function(e){return bcInRangeDMY(e.ngayHetHan, p);})
    .sort(function(a,b){return (window.parseDMY(a.ngayHetHan))-(window.parseDMY(b.ngayHetHan));});
  var over=0, thieu=0;
  act.forEach(function(e){ var n=window.conLaiNum?window.conLaiNum(e.ngayConLai):null; if(n!==null&&n<0)over++; if(/thiếu/i.test(e.tinhTrangHoSo||''))thieu++; });
  return {expire:expire, over:over, thieu:thieu};
}

window.renderBaoCao = function(){
  var esc=window.nsEsc||function(s){return s;};
  if(window.HR&&window.HR.error) return (window.errorBox?window.errorBox():'<div class="page-head"><div class="page-h1">Báo cáo</div></div><div class="ns-note">Lỗi tải dữ liệu.</div>');
  if(!(window.HR&&window.HR.loaded)) return (window.loadingBox?window.loadingBox():'<div class="ns-note">Đang tải…</div>');

  var mode=window.__bc.mode, off=window.__bc.off;
  var p=bcPeriod(mode, off), pv=bcPeriod(mode, off-1);

  var head='<div class="page-head"><div class="page-h1">Báo cáo theo kỳ</div>'
    +'<div class="page-lead">Tổng hợp tuyển dụng, biến động nhân sự, chấm công và hợp đồng theo tuần hoặc tháng — số liệu lấy trực tiếp từ dữ liệu web, có so sánh với kỳ liền trước.</div></div>';

  var style=bcStyle();

  var offLbl = off===0 ? (mode==='week'?'Tuần này':'Tháng này') : (mode==='week'?(off===-1?'Tuần trước':(Math.abs(off))+' tuần trước'):(off===-1?'Tháng trước':(Math.abs(off))+' tháng trước'));
  var controls='<div class="bc-controls">'
    +'<div class="bc-seg"><button class="'+(mode==='week'?'on':'')+'" onclick="bcSetMode(\'week\')">Tuần</button>'
    +'<button class="'+(mode==='month'?'on':'')+'" onclick="bcSetMode(\'month\')">Tháng</button></div>'
    +'<div class="bc-step"><span class="arw" onclick="bcStep(-1)">‹</span>'
    +'<span class="lbl">'+bcLabel(mode,p)+'<small>'+offLbl+'</small></span>'
    +'<span class="arw'+(off>=0?' dis':'')+'" onclick="bcStep(1)">›</span></div>'
    +'<span class="bc-cmp">so với kỳ trước · '+bcLabel(mode,pv)+'</span>'
    +'<button class="bc-pdf" onclick="bcExportPDF()">⬇&nbsp; Xuất PDF</button>'
    +'</div>'
    +'<div class="bc-cad">◷&nbsp; Tự phát hành: <b>Thứ 2 hằng tuần</b> (báo cáo tuần trước) · <b>Ngày 1 hằng tháng</b> (báo cáo tháng trước) — gửi email brian.pham@bigx.vn</div>';

  /* data */
  var T=bcTuyen(p),  Tp=bcTuyen(pv);
  var B=bcBienDong(p), Bp=bcBienDong(pv);
  var H=bcHopDong(p);
  var cham=bcCham(p), champ=bcCham(pv);
  var chamReady=!!cham;
  if(!cham){ if(!window.__ccData && !window.__ccLoading) bcLoadCham(); cham={full:'—',late:'—',absent:'—',rate:0,lateArr:[]}; champ={full:0,late:0,absent:0,rate:0,work:0}; }
  var cmpCham = chamReady && champ && champ.work>0;   // chỉ so sánh khi kỳ trước có dữ liệu chấm công

  /* KPI row */
  var kpis='<div class="bc-kpis">'
    +bcKpi('CV mới nhận', T.cvNew, bcDelta(T.cvNew,Tp.cvNew,true))
    +bcKpi('Nhận việc mới', T.hire, bcDelta(T.hire,Tp.hire,true))
    +bcKpi('Nhân sự vào mới', B.vao.length, bcDelta(B.vao.length,Bp.vao.length,true))
    +bcKpi('Nghỉ việc', B.nghi.length, bcDelta(B.nghi.length,Bp.nghi.length,false))
    +bcKpi('Tỷ lệ có mặt', chamReady?(cham.rate+'%'):'—', cmpCham?bcDeltaPct(cham.rate,champ.rate):'')
    +(function(){ var sc=window.cvPerfScore?window.cvPerfScore(p):null, sp=window.cvPerfScore?window.cvPerfScore(pv):null; return bcKpi('Điểm hiệu suất HR', sc==null?'—':sc+'/100', (sc!=null&&sp!=null)?bcDelta(sc,sp,true):''); })() // [K]
    +'</div>';

  /* Section A: Tuyển dụng */
  var posRows=T.pos.length? T.pos.map(function(r){
    return '<tr'+(/telesales/i.test(r.pos)?' class="hl"':'')+'><td>'+esc(r.pos)+'</td><td class="num">'+r.cv+'</td><td class="num">'+r.hire+'</td></tr>';
  }).join('') : '<tr><td colspan="3" class="muted">Chưa có CV mới trong kỳ.</td></tr>';
  var secA='<div class="bc-sec full"><div class="bc-sh"><span class="dot"></span><h3>Tuyển dụng trong kỳ</h3>'
    +'<span class="sh-d '+(T.cvNew>=Tp.cvNew?'up':'down')+'">'+(Tp.cvNew?((T.cvNew>=Tp.cvNew?'▲':'▼')+' '+Math.abs(T.cvNew-Tp.cvNew)+' CV so kỳ trước'):(T.cvNew+' CV'))+'</span></div>'
    +'<div class="bc-cap">CV mới nhận theo '+(mode==='week'?'ngày trong tuần':'ngày trong tháng')+' và phân bổ theo vị trí.</div>'
    +'<div class="bc-row2"><div><div id="bc-cvchart" class="bc-chart"></div></div>'
    +'<div><table class="bc-tbl"><thead><tr><th>Vị trí</th><th class="num">CV mới</th><th class="num">Nhận việc</th></tr></thead><tbody>'+posRows+'</tbody></table></div></div></div>';

  /* Section B: Biến động + C: Chấm công */
  var vaoNames=B.vao.map(function(n){return esc(n.hoTen);}).join(' · ')||'—';
  var nghiNames=B.nghi.map(function(n){return esc(n.hoTen);}).join(' · ')||'—';
  var secB='<div class="bc-sec"><div class="bc-sh"><span class="dot"></span><h3>Biến động nhân sự</h3></div>'
    +'<div class="bc-cap">Người vào / nghỉ và headcount trong kỳ.</div>'
    +bcStat('Vào mới', B.vao.length, bcDelta(B.vao.length,Bp.vao.length,true), B.vao.length?vaoNames:'')
    +bcStat('Nghỉ việc', B.nghi.length, bcDelta(B.nghi.length,Bp.nghi.length,false), B.nghi.length?nghiNames:'')
    +bcStat('Đang làm (hiện tại)', B.active, '', '')
    +'</div>';

  var lateList = chamReady ? (cham.lateArr.length? '<table class="bc-tbl"><thead><tr><th>Nhân sự</th><th class="num">Số lần</th></tr></thead><tbody>'
      +cham.lateArr.map(function(o){return '<tr><td>'+esc(o.name)+'<div class="sub">'+esc(o.dept)+'</div></td><td class="num"><span class="late-badge">'+o.c+' lần</span></td></tr>';}).join('')
      +'</tbody></table>' : '<div class="muted" style="padding:8px 0">Không có lượt đi trễ trong kỳ. 👏</div>') : '<div class="muted" style="padding:8px 0">Đang tải dữ liệu chấm công…</div>';
  var secC='<div class="bc-sec"><div class="bc-sh"><span class="dot"></span><h3>Chấm công trong kỳ</h3>'
    +(cmpCham?'<span class="sh-d '+(cham.rate>=champ.rate?'up':'down')+'">có mặt '+bcDeltaBare(cham.rate,champ.rate,'đ')+'</span>':'')+'</div>'
    +'<div class="bc-cap">Tỷ lệ có mặt = (ngày công đủ + đi trễ) / ngày phải làm.</div>'
    +bcStat('Ngày công đủ', cham.full, cmpCham?bcDelta(cham.full,champ.full,true):'', '')
    +bcStat('Lượt đi trễ', cham.late, cmpCham?bcDelta(cham.late,champ.late,false):'', '')
    +bcStat('Buổi vắng (K)', cham.absent, cmpCham?bcDelta(cham.absent,champ.absent,false):'', '')
    +bcStat('Tỷ lệ có mặt', chamReady?(cham.rate+'%'):'—', '', '')
    +'<div class="bc-minih">Chi tiết đi trễ trong kỳ</div>'+lateList
    +'</div>';

  /* Section D: Hợp đồng & hồ sơ */
  var expRows=H.expire.length? H.expire.map(function(e){
    var n=window.conLaiNum?window.conLaiNum(e.ngayConLai):null;
    var cls=n===null?'':(n<0?'red':(n<=7?'red':(n<=30?'amber':'')));
    var lbl=n===null?'—':(n<0?('Quá '+Math.abs(n)+'n'):('Còn '+n+'n'));
    return '<tr><td>'+esc(e.hoTen)+'</td><td>'+esc((window.loaiHDShort?window.loaiHDShort(e.loaiHD):e.loaiHD)||'—')+'</td><td class="nw">'+esc(e.ngayHetHan||'—')+'</td><td><span class="pill '+cls+'">'+lbl+'</span></td></tr>';
  }).join('') : '<tr><td colspan="4" class="muted">Không có HĐ hết hạn trong kỳ.</td></tr>';
  var secD='<div class="bc-sec full"><div class="bc-sh"><span class="dot"></span><h3>Hợp đồng &amp; hồ sơ</h3>'
    +(H.over>0?'<span class="sh-d down">'+H.over+' HĐ quá hạn</span>':'')+'</div>'
    +'<div class="bc-cap">Hợp đồng đến hạn trong kỳ; quá hạn &amp; hồ sơ thiếu là ảnh chụp hiện tại.</div>'
    +'<div class="bc-row2"><div><table class="bc-tbl"><thead><tr><th>Nhân sự</th><th>Loại HĐ</th><th>Hết hạn</th><th>Còn lại</th></tr></thead><tbody>'+expRows+'</tbody></table></div>'
    +'<div>'+bcStat('HĐ hết hạn trong kỳ', H.expire.length, '', '')
    +bcStat('HĐ đã quá hạn (hiện tại)', H.over, '', '')
    +bcStat('Hồ sơ còn thiếu (hiện tại)', H.thieu, '', '')
    +(H.expire.length?'<div class="bc-warn">⚠ '+H.expire.length+' hợp đồng đến hạn trong kỳ — kiểm tra để gia hạn/ký lại.</div>':'')
    +'</div></div></div>';

  var secE=window.cvReportSection?window.cvReportSection(p,pv,mode):''; // [K] hiệu suất công việc HR
  var foot='<div class="bc-foot">Số liệu lấy trực tiếp từ dữ liệu web (Tuyển dụng · Hồ sơ · Chấm công · Công việc HR). Kỳ: '+bcLabel(mode,p)+'.</div>';

  if(typeof setTimeout==='function') setTimeout(function(){ bcInitChart(T.chart); }, 30);
  return head+style+'<div id="baocao">'+controls+kpis+secA+'<div class="bc-grid2">'+secB+secC+'</div>'+secD+secE+foot+'</div>';
};

function bcKpi(t, v, d){ return '<div class="bc-kpi"><div class="k-t">'+t+'</div><div class="k-v">'+v+'</div><div class="k-dw">'+(d||'')+'</div></div>'; }
function bcStat(l, v, d, sub){ return '<div class="bc-stat"><div class="s-l">'+l+(sub?('<div class="sub">'+sub+'</div>'):'')+'</div><div class="s-r"><span class="s-v">'+v+'</span>'+(d||'')+'</div></div>'; }
function bcDeltaBare(cur,prev,unit){ var d=Math.round((cur-prev)*10)/10; if(d===0) return '—'; return (d>0?'▲':'▼')+' '+Math.abs(d)+(unit||''); }

function bcLoadCham(){ window.nsuatLoadFirebase(); } // [B1] dùng bộ nạp chung

function bcInitChart(c){
  if(typeof echarts==='undefined') return;
  var el=document.getElementById('bc-cvchart'); if(!el) return;
  var teal='#35655B', teal2='#8FB3AC', muted='#8B897E', line='#E4DECF';
  var FONT="'Be Vietnam Pro',sans-serif";
  if(window.__bcChart){ try{ window.__bcChart.dispose(); }catch(e){} } // [D] không để rò biểu đồ cũ
  var ch=echarts.init(el); window.__bcChart=ch;
  ch.setOption({
    grid:{left:6,right:10,top:22,bottom:22,containLabel:true},
    tooltip:{trigger:'axis',axisPointer:{type:'shadow'},textStyle:{fontFamily:FONT,fontSize:12},
      formatter:function(p){return esc(p[0].name)+': <b>'+p[0].value+'</b> CV';}},
    xAxis:{type:'category',data:c.labels,axisLine:{lineStyle:{color:line}},axisTick:{show:false},axisLabel:{color:muted,fontFamily:FONT,fontSize:11,interval:(c.labels.length>15?2:0)}},
    yAxis:{type:'value',splitLine:{lineStyle:{color:'#f0ebe0'}},axisLabel:{color:muted,fontFamily:FONT,fontSize:11},minInterval:1},
    series:[{type:'bar',data:c.data,barWidth:'56%',
      itemStyle:{color:teal,borderRadius:[4,4,0,0]},
      label:{show:c.labels.length<=10,position:'top',color:muted,fontFamily:FONT,fontSize:11},
      animationDuration:600}]
  });
  if(!window.__bcResize){ window.__bcResize=true; window.addEventListener('resize',function(){var e=document.getElementById('bc-cvchart'); if(e){var i=echarts.getInstanceByDom(e); if(i)i.resize();}}); }
}

function bcStyle(){ return '<style id="bc-style">'
  +'#baocao{max-width:1120px}'
  +'#baocao .bc-controls{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:6px 0 2px}'
  +'#baocao .bc-seg{display:inline-flex;background:#e8e2d5;border-radius:9px;padding:3px}'
  +'#baocao .bc-seg button{border:0;background:transparent;font-family:inherit;font-size:13px;font-weight:600;color:#8B897E;padding:6px 18px;border-radius:6px;cursor:pointer}'
  +'#baocao .bc-seg button.on{background:#fff;color:#21303B;box-shadow:0 1px 2px rgba(0,0,0,.08)}'
  +'#baocao .bc-step{display:inline-flex;align-items:center;gap:4px;background:#fff;border:1px solid #E4DECF;border-radius:9px;padding:4px 6px}'
  +'#baocao .bc-step .arw{width:26px;height:26px;border-radius:6px;background:#f1ede3;color:#21303B;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;user-select:none}'
  +'#baocao .bc-step .arw.dis{opacity:.35;pointer-events:none}'
  +'#baocao .bc-step .lbl{font-size:13.5px;font-weight:600;color:#21303B;padding:0 8px;text-align:center;min-width:140px}'
  +'#baocao .bc-step .lbl small{display:block;font-size:10.5px;font-weight:500;color:#8B897E}'
  +'#baocao .bc-cmp{font-size:12px;color:#8B897E}'
  +'#baocao .bc-pdf{margin-left:auto;display:inline-flex;align-items:center;background:#21303B;color:#fff;border:0;font-family:inherit;font-size:13px;font-weight:600;padding:9px 16px;border-radius:9px;cursor:pointer}'
  +'#baocao .bc-cad{margin:12px 0 4px;font-size:12.5px;color:#414B54;background:#eef4f2;border:1px solid #d6e6e2;border-radius:9px;padding:8px 13px;display:inline-block}'
  +'#baocao .bc-cad b{color:#35655B;font-weight:600}'
  +'#baocao .bc-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:13px;margin:16px 0 18px}'
  +'#baocao .bc-kpi{background:#fff;border:1px solid #E4DECF;border-radius:12px;padding:15px 16px 13px}'
  +'#baocao .bc-kpi .k-t{font-size:12px;color:#8B897E}'
  +'#baocao .bc-kpi .k-v{font-family:Fraunces,Georgia,serif;font-size:28px;font-weight:600;color:#21303B;line-height:1;margin-top:7px}'
  +'#baocao .bc-kpi .k-dw{margin-top:8px;min-height:16px}'
  +'#baocao .bc-d{font-size:11.5px;font-weight:600}#baocao .bc-d small{color:#8B897E;font-weight:500}'
  +'#baocao .bc-d.up{color:#2e7d5b}#baocao .bc-d.down{color:#A65A4B}#baocao .bc-d.flat{color:#8B897E}'
  +'#baocao .sh-d{margin-left:auto;font-size:12px;font-weight:600}#baocao .sh-d.up{color:#2e7d5b}#baocao .sh-d.down{color:#A65A4B}'
  +'#baocao .bc-sec{background:#fff;border:1px solid #E4DECF;border-radius:14px;padding:18px 20px;margin-bottom:16px}'
  +'#baocao .bc-sh{display:flex;align-items:center;gap:9px;margin-bottom:3px}'
  +'#baocao .bc-sh .dot{width:8px;height:8px;border-radius:50%;background:#35655B}'
  +'#baocao .bc-sh h3{font-family:Fraunces,serif;font-size:17px;color:#21303B;font-weight:600;margin:0}'
  +'#baocao .bc-cap{font-size:12px;color:#8B897E;margin-bottom:14px}'
  +'#baocao .bc-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}'
  +'#baocao .bc-row2{display:grid;grid-template-columns:1.15fr 1fr;gap:22px;align-items:start}'
  +'#baocao .bc-chart{width:100%;height:210px}'
  +'#baocao .bc-tbl{width:100%;border-collapse:collapse}'
  +'#baocao .bc-tbl th{font-size:11px;color:#8B897E;text-align:left;font-weight:600;padding:7px 6px;border-bottom:1px solid #E4DECF}'
  +'#baocao .bc-tbl th.num{text-align:right}'
  +'#baocao .bc-tbl td{font-size:13px;color:#21303B;padding:8px 6px;border-bottom:1px solid #f1ece1}'
  +'#baocao .bc-tbl td.num{text-align:right;font-variant-numeric:tabular-nums}'
  +'#baocao .bc-tbl td .sub{font-size:11px;color:#8B897E;margin-top:1px}'
  +'#baocao .bc-tbl tr.hl td{background:#f3f8f6}#baocao .bc-tbl tr.hl td:first-child{font-weight:600;color:#35655B}'
  +'#baocao .bc-stat{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #f1ece1}'
  +'#baocao .bc-stat .s-l{font-size:13px;color:#414B54}#baocao .bc-stat .s-l .sub{font-size:11px;color:#8B897E;margin-top:2px}'
  +'#baocao .bc-stat .s-r{display:flex;align-items:baseline;gap:10px}'
  +'#baocao .bc-stat .s-v{font-family:Fraunces,serif;font-size:19px;color:#21303B;font-weight:600;font-variant-numeric:tabular-nums}'
  +'#baocao .bc-tbl .nw{white-space:nowrap}'
  +'#baocao .bc-minih{font-size:12px;font-weight:600;color:#8B897E;margin:14px 0 2px}'
  +'#baocao .late-badge{display:inline-block;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:#fbf1df;color:#b07a43}'
  +'#baocao .pill{display:inline-block;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:#eef4f2;color:#35655B}'
  +'#baocao .pill.amber{background:#fbf1df;color:#b07a43}#baocao .pill.red{background:#fbe7df;color:#A65A4B}'
  +'#baocao .muted{color:#9a8f78}'
  +'#baocao .bc-warn{background:#fbf3e8;border:1px solid #ecd9b6;border-radius:9px;padding:10px 13px;font-size:12.5px;color:#8a6a2e;margin-top:12px}'
  +'#baocao .bc-foot{margin-top:8px;font-size:12px;color:#8B897E;font-style:italic}'
  +'#baocao .bc-exphdr{display:none;align-items:center;justify-content:space-between;gap:14px;padding:0 2px 14px;margin-bottom:16px;border-bottom:2px solid #21303B}'
  +'#baocao .bc-exphdr-l{display:flex;align-items:center;gap:12px}'
  +'#baocao .bc-exphdr-logo{width:40px;height:40px;border-radius:10px;background:#21303B;color:#fff;font-family:Fraunces,serif;font-weight:600;font-size:17px;display:flex;align-items:center;justify-content:center}'
  +'#baocao .bc-exphdr-t{font-family:Fraunces,serif;font-size:19px;font-weight:600;color:#21303B;letter-spacing:.3px}'
  +'#baocao .bc-exphdr-s{font-size:12.5px;color:#8B897E;margin-top:2px}'
  +'#baocao .bc-exphdr-r{font-size:12px;color:#8B897E}'
  +'#baocao.bc-exp .bc-exphdr{display:flex}'
  +'#baocao .bc-sec,#baocao .bc-kpi{page-break-inside:avoid}'
  +'@media(max-width:820px){#baocao .bc-kpis{grid-template-columns:repeat(2,1fr)}#baocao .bc-grid2,#baocao .bc-row2{grid-template-columns:1fr}}'
  +'@media print{#sidebar{display:none!important}#main{margin:0!important}.topbar{display:none!important}#baocao .bc-controls .bc-pdf,#baocao .bc-seg,#baocao .bc-step .arw{display:none!important}}'
  +'</style>';
}


/* ============================================================
   TAB: SƠ ĐỒ TỔ CHỨC (so-do) — động, đọc người LIVE từ HR.nhansu
   Cấu trúc khối/phòng cố định (từ onboarding), người theo phòng
   tự cập nhật; bấm phòng → xem người (tên · chức danh) + nhiệm vụ.
   ============================================================ */
var SD_ORG = {
  lead: [
    { phong:'BOD',              label:'Ban giám đốc',      note:'Định hướng & quyết định cuối cùng' },
    { phong:'Trợ lý Giám đốc',  label:'Trợ lý GĐ · PMO',   note:'Kết nối thông tin · Theo dõi KPI · Điều phối blocker' }
  ],
  blocks: [
    { name:'Revenue & Growth', tag:'Tạo khách hàng',
      goal:'Tạo lead chất lượng · Chốt deal · Tăng trưởng doanh thu',
      depts:[
        { phong:'Sales',     label:'Sales / BD',  tasks:['Tìm kiếm khách hàng mới','Tư vấn & giải pháp','Chốt deal & doanh thu','Pipeline management'] },
        { phong:'Marketing', label:'Marketing',   tasks:['Brand & Communication','Content & Campaign','Lead Generation','Nurture & giáo dục thị trường'] }
      ]},
    { name:'Fulfillment / Outcome', tag:'Tạo kết quả & tái ký',
      goal:'Thực thi hiệu quả · Đạt KPI GMV/ROI · Tái ký & mở rộng',
      depts:[
        { phong:'E - Com',  label:'E-Com / Video AI',    tasks:['Content Creative','Video AI','Video Editor','Creative Optimization'] },
        { phong:'Booking',  label:'Booking KOC / KOL',   tasks:['Tìm kiếm & tuyển chọn','Quản lý KOC/KOL','Triển khai nội dung','Đo lường hiệu quả','Phân bổ voucher TSP'] },
        { phong:'Account',  label:'Account Management',  tasks:['Quản trị khách hàng','Onboarding','Theo dõi hiệu quả','CS & Retention'] },
        { phong:'TSP',      label:'TikTok Shop Partner', tasks:['Quản trị quan hệ TikTok Shop','Kết nối & triển khai chính sách','Hỗ trợ vận hành & xử lý vấn đề','Tối ưu cơ hội & nguồn lực','Cập nhật xu hướng & tính năng'] },
        { phong:'Agency',   label:'Agency · Performance',tasks:['Quản trị vận hành shop','Performance Marketing · Ads','Livestream Management','Giá · Voucher · Flash Sale','Phân tích dữ liệu & báo cáo','Tối ưu Conversion & GMV'] }
      ]},
    { name:'Support & Infrastructure', tag:'Nền tảng & hỗ trợ',
      goal:'Hỗ trợ vận hành · Tối ưu hệ thống · Giảm rủi ro · Năng lực dài hạn',
      depts:[
        { phong:'Kế toán - Nhân sự', label:'Kế toán – Nhân sự', tasks:['Tài chính · Công nợ · Thanh toán · Báo cáo','Tuyển dụng & Onboarding','Đào tạo & Phát triển','Chính sách & Phúc lợi'] },
        { phong:'IT',                label:'IT & Hệ thống',     tasks:['Hạ tầng & bảo mật','Hệ thống & công cụ','Data & Automation'] }
      ]}
  ]
};

window.__sd = window.__sd || { sel:null };
window.sdSelect = function(k){ window.__sd.sel = (window.__sd.sel===k?null:k); window.go('so-do'); };

function sdActive(){ return ((window.HR&&window.HR.nhansu)||[]).filter(isWorking); }
function sdByPhong(){
  var m={}; sdActive().forEach(function(n){ var p=n.phong||'—'; (m[p]=m[p]||[]).push(n); });
  Object.keys(m).forEach(function(p){ m[p].sort(function(a,b){ return String(a.hoTen||'').localeCompare(String(b.hoTen||''),'vi'); }); });
  return m;
}

window.renderSoDo = function(){
  var esc=window.nsEsc||function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
  if(window.HR&&window.HR.error) return (window.errorBox?window.errorBox():'<div>Lỗi tải dữ liệu.</div>');
  if(!(window.HR&&window.HR.loaded)) return (window.loadingBox?window.loadingBox():'<div>Đang tải…</div>');

  var byP=sdByPhong();
  var mapped={}; SD_ORG.lead.forEach(function(d){mapped[d.phong]=1;}); SD_ORG.blocks.forEach(function(b){b.depts.forEach(function(d){mapped[d.phong]=1;});});
  var extra=Object.keys(byP).filter(function(p){return !mapped[p];}); // phòng có người nhưng chưa map → không bỏ sót
  var totalActive=sdActive().length;
  var deptCount=0; SD_ORG.blocks.forEach(function(b){deptCount+=b.depts.length;});

  var sel=window.__sd.sel;

  function box(d, cls){
    var n=(byP[d.phong]||[]).length;
    var on=sel===d.phong;
    return '<div class="sd-box'+(cls?' '+cls:'')+(on?' on':'')+(n===0?' empty':'')+'" onclick="sdSelect('+esc(JSON.stringify(String(d.phong)))+')">' /* [C3] truyền tên phòng an toàn */
      +'<div class="sd-b-l">'+esc(d.label)+'</div>'
      +'<div class="sd-b-m">'+n+' người'+(d.note?' · '+esc(d.note):'')+'</div></div>';
  }

  var leadRow=SD_ORG.lead.map(function(d){return box(d,'lead');}).join('');
  var blocksHtml=SD_ORG.blocks.map(function(b){
    return '<div class="sd-block">'
      +'<div class="sd-bk-h"><span class="sd-bk-n">'+esc(b.name)+'</span><span class="sd-bk-t">'+esc(b.tag)+'</span></div>'
      +'<div class="sd-grid">'+b.depts.map(function(d){return box(d);}).join('')+'</div>'
      +'<div class="sd-goal">🎯 '+esc(b.goal)+'</div>'
      +'</div>';
  }).join('');
  var extraHtml='';
  if(extra.length){
    extraHtml='<div class="sd-block"><div class="sd-bk-h"><span class="sd-bk-n">Khác</span><span class="sd-bk-t">chưa xếp khối</span></div>'
      +'<div class="sd-grid">'+extra.map(function(p){return box({phong:p,label:p});}).join('')+'</div></div>';
  }

  // detail panel
  var panel;
  if(sel){
    var ppl=byP[sel]||[];
    var meta=null;
    SD_ORG.lead.forEach(function(d){if(d.phong===sel)meta=d;});
    SD_ORG.blocks.forEach(function(b){b.depts.forEach(function(d){if(d.phong===sel)meta=d;});});
    var label=meta?meta.label:sel;
    var tasks=(meta&&meta.tasks)||[];
    var pplHtml=ppl.length? ppl.map(function(n){
      return '<div class="sd-p"><div class="sd-p-n">'+esc(n.hoTen||'—')+'</div><div class="sd-p-r">'+esc(n.chucVu||'—')+'</div></div>';
    }).join('') : '<div class="sd-muted">Chưa có nhân sự đang làm ở phòng này.</div>';
    var taskHtml=tasks.length? '<div class="sd-tasks"><div class="sd-t-h">Nhiệm vụ chính</div>'+tasks.map(function(t){return '<span class="sd-chip">'+esc(t)+'</span>';}).join('')+'</div>' : '';
    panel='<div class="sd-panel"><div class="sd-pl-h"><span>'+esc(label)+'</span><span class="sd-pl-c">'+ppl.length+' người</span></div>'
      +'<div class="sd-people">'+pplHtml+'</div>'+taskHtml+'</div>';
  } else {
    panel='<div class="sd-panel empty"><div class="sd-hint">Bấm một phòng bên trái để xem danh sách nhân sự (tên · chức danh) và nhiệm vụ chính.</div></div>';
  }


  return '<div class="page-head"><div class="page-h1">Sơ đồ tổ chức</div>'
    +'<div class="page-lead">Cơ cấu vận hành BigX — Ban giám đốc, 3 khối và các phòng ban. Số người và danh sách nhân sự cập nhật trực tiếp từ hồ sơ; bấm một phòng để xem chi tiết.</div></div>'
    +sdStyle()
    +'<div id="sodo"><div class="sd-stats"><span><b>'+totalActive+'</b> đang làm</span><span><b>'+deptCount+'</b> phòng ban</span><span><b>'+SD_ORG.blocks.length+'</b> khối</span></div>'
    +'<div class="sd-main"><div class="sd-left">'
    +'<div class="sd-block sd-lead"><div class="sd-bk-h"><span class="sd-bk-n">Ban điều hành</span></div><div class="sd-grid sd-grid-lead">'+leadRow+'</div></div>'
    +blocksHtml+extraHtml
    +'</div><div class="sd-right">'+panel+'</div></div></div>';
};

function sdStyle(){ return '<style id="sd-style">'
  +'#sodo{max-width:1160px}'
  +'#sodo .sd-stats{display:flex;gap:22px;margin:2px 0 18px;font-size:13px;color:#8B897E}'
  +'#sodo .sd-stats b{font-family:Fraunces,Georgia,serif;font-size:18px;color:#21303B;margin-right:3px}'
  +'#sodo .sd-main{display:grid;grid-template-columns:1fr 340px;gap:20px;align-items:start}'
  +'#sodo .sd-block{margin-bottom:16px}'
  +'#sodo .sd-lead{margin-bottom:22px}'
  +'#sodo .sd-bk-h{display:flex;align-items:baseline;gap:10px;margin-bottom:10px}'
  +'#sodo .sd-bk-n{font-family:Fraunces,serif;font-size:16px;font-weight:600;color:#21303B}'
  +'#sodo .sd-bk-t{font-size:11.5px;color:#8B897E;text-transform:uppercase;letter-spacing:.08em}'
  +'#sodo .sd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}'
  +'#sodo .sd-grid-lead{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}'
  +'#sodo .sd-box{background:#fff;border:1px solid #E4DECF;border-radius:12px;padding:13px 15px;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s;border-left:3px solid #cfc7b4}'
  +'#sodo .sd-box:hover{border-color:#35655B;box-shadow:0 3px 12px rgba(0,0,0,.06);transform:translateY(-1px)}'
  +'#sodo .sd-box.on{border-color:#35655B;border-left-color:#35655B;background:#f3f8f6;box-shadow:0 3px 12px rgba(53,101,91,.12)}'
  +'#sodo .sd-box.lead{border-left-color:#B07A43}'
  +'#sodo .sd-box.lead.on{border-left-color:#B07A43}'
  +'#sodo .sd-box.empty{opacity:.6}'
  +'#sodo .sd-b-l{font-weight:600;font-size:14px;color:#21303B}'
  +'#sodo .sd-b-m{font-size:12px;color:#8B897E;margin-top:3px}'
  +'#sodo .sd-goal{font-size:12px;color:#5c5647;background:#faf7f0;border:1px solid #ece5d6;border-radius:8px;padding:8px 12px;margin-top:10px}'
  +'#sodo .sd-right{position:sticky;top:12px}'
  +'#sodo .sd-panel{background:#fff;border:1px solid #E4DECF;border-radius:14px;padding:18px}'
  +'#sodo .sd-panel.empty{background:#faf7f0;border-style:dashed}'
  +'#sodo .sd-hint{font-size:13px;color:#8B897E;line-height:1.6}'
  +'#sodo .sd-pl-h{display:flex;align-items:baseline;justify-content:space-between;border-bottom:1px solid #E4DECF;padding-bottom:10px;margin-bottom:6px}'
  +'#sodo .sd-pl-h span:first-child{font-family:Fraunces,serif;font-size:17px;font-weight:600;color:#21303B}'
  +'#sodo .sd-pl-c{font-size:12px;color:#8B897E}'
  +'#sodo .sd-people{display:flex;flex-direction:column}'
  +'#sodo .sd-p{padding:9px 0;border-bottom:1px solid #f1ece1}'
  +'#sodo .sd-p:last-child{border-bottom:0}'
  +'#sodo .sd-p-n{font-size:13.5px;color:#21303B;font-weight:500}'
  +'#sodo .sd-p-r{font-size:12px;color:#8B897E;margin-top:1px}'
  +'#sodo .sd-muted{font-size:13px;color:#9a8f78;padding:8px 0}'
  +'#sodo .sd-tasks{margin-top:14px;border-top:1px solid #f1ece1;padding-top:12px}'
  +'#sodo .sd-t-h{font-size:11.5px;color:#8B897E;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}'
  +'#sodo .sd-chip{display:inline-block;font-size:12px;color:#35655B;background:#eef4f2;border:1px solid #d6e6e2;border-radius:20px;padding:3px 11px;margin:0 4px 6px 0}'
  +'@media(max-width:860px){#sodo .sd-main{grid-template-columns:1fr}#sodo .sd-right{position:static}}'
  +'</style>';
}


/* ============================================================
   TAB: CALENDAR (calendar) — lịch HR động
   Sự kiện LIVE từ HR.nhansu: 🎂 sinh nhật · 📄 hết hạn HĐ · 🎉 kỷ niệm vào làm
   Lưới tháng, chuyển tháng, tô hôm nay, danh sách sự kiện trong tháng.
   ============================================================ */
window.__cal = window.__cal || null;   // {y,m} — null = tháng hiện tại

function calState(){
  if(window.__cal) return window.__cal;
  var n=new Date(); window.__cal={y:n.getFullYear(), m:n.getMonth()+1}; return window.__cal;
}
window.calStep = function(d){ var s=calState(); var dt=new Date(s.y, s.m-1+d, 1); window.__cal={y:dt.getFullYear(), m:dt.getMonth()+1}; window.go('calendar'); };
window.calToday = function(){ var n=new Date(); window.__cal={y:n.getFullYear(), m:n.getMonth()+1}; window.go('calendar'); };

function calDMY(s){ var p=String(s||'').split('/'); if(p.length<2) return null; return {d:+p[0], m:+p[1], y:p[2]?+p[2]:null}; }

/* Gom sự kiện cho tháng (y,m). type: bd | hd | anniv */
function calEvents(y, m){
  var ns=((window.HR&&window.HR.nhansu)||[]).filter(isWorking);
  var ev={}; // day -> [ {type,name,sub} ]
  function push(day, o){ if(!day||day<1||day>31) return; (ev[day]=ev[day]||[]).push(o); }
  ns.forEach(function(n){
    var sn=calDMY(n.sinhNhat); if(sn && sn.m===m) push(sn.d, {type:'bd', name:n.hoTen, sub:'Sinh nhật'});
    var hh=calDMY(n.ngayHetHan); if(hh && hh.m===m && hh.y===y) push(hh.d, {type:'hd', name:n.hoTen, sub:'Hết hạn HĐ · '+(window.loaiHDShort?window.loaiHDShort(n.loaiHD):(n.loaiHD||''))});
    var nv=calDMY(n.ngayVao); if(nv && nv.m===m){ var yrs=(nv.y?(y-nv.y):null); push(nv.d, {type:'anniv', name:n.hoTen, sub:'Kỷ niệm vào làm'+(yrs&&yrs>0?(' · '+yrs+' năm'):'')}); }
  });
  return ev;
}

window.renderCalendar = function(){
  var esc=window.nsEsc||function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
  if(window.HR&&window.HR.error) return (window.errorBox?window.errorBox():'<div>Lỗi tải dữ liệu.</div>');
  if(!(window.HR&&window.HR.loaded)) return (window.loadingBox?window.loadingBox():'<div>Đang tải…</div>');

  var s=calState(), y=s.y, m=s.m;
  var ev=calEvents(y,m);
  var today=new Date(); var isCurMonth=(today.getFullYear()===y && today.getMonth()+1===m); var td=today.getDate();

  var first=new Date(y, m-1, 1);
  var startOff=(first.getDay()+6)%7;            // Mon=0
  var days=new Date(y, m, 0).getDate();
  var ICON={bd:'🎂', hd:'📄', anniv:'🎉'};

  // grid cells
  var cells='';
  var totalCells=Math.ceil((startOff+days)/7)*7;
  for(var i=0;i<totalCells;i++){
    var dn=i-startOff+1;
    if(dn<1||dn>days){ cells+='<div class="cal-cell out"></div>'; continue; }
    var evs=ev[dn]||[];
    var isTd=isCurMonth&&dn===td;
    var chips=evs.slice(0,3).map(function(e){return '<div class="cal-chip '+e.type+'"><span>'+ICON[e.type]+'</span>'+esc(shortName(e.name))+'</div>';}).join('');
    if(evs.length>3) chips+='<div class="cal-more">+'+(evs.length-3)+' nữa</div>';
    cells+='<div class="cal-cell'+(isTd?' today':'')+'"><div class="cal-dn">'+dn+(isTd?'<span class="cal-td">hôm nay</span>':'')+'</div>'+chips+'</div>';
  }

  // month list
  var listItems=[];
  Object.keys(ev).map(Number).sort(function(a,b){return a-b;}).forEach(function(dn){
    ev[dn].forEach(function(e){ listItems.push({dn:dn, e:e}); });
  });
  var listHtml=listItems.length? listItems.map(function(it){
    return '<div class="cal-li"><div class="cal-li-d">'+(it.dn<10?'0'+it.dn:it.dn)+'/'+(m<10?'0'+m:m)+'</div>'
      +'<div class="cal-li-i '+it.e.type+'">'+ICON[it.e.type]+'</div>'
      +'<div class="cal-li-b"><div class="cal-li-n">'+esc(it.e.name)+'</div><div class="cal-li-s">'+esc(it.e.sub)+'</div></div></div>';
  }).join('') : '<div class="cal-empty">Không có sự kiện trong tháng này.</div>';

  var counts={bd:0,hd:0,anniv:0}; listItems.forEach(function(it){counts[it.e.type]++;});
  var MONTHS=['','Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  var wd=['T2','T3','T4','T5','T6','T7','CN'].map(function(w){return '<div class="cal-wd">'+w+'</div>';}).join('');

  return '<div class="page-head"><div class="page-h1">Calendar</div>'
    +'<div class="page-lead">Lịch HR — sinh nhật, hết hạn hợp đồng và kỷ niệm vào làm, tổng hợp trực tiếp từ hồ sơ nhân sự.</div></div>'
    +calStyle()
    +'<div id="cal">'
    +'<div class="cal-bar">'
    +'<div class="cal-step"><span class="arw" onclick="calStep(-1)">‹</span><span class="lbl">'+MONTHS[m]+' / '+y+'</span><span class="arw" onclick="calStep(1)">›</span></div>'
    +'<button class="cal-today" onclick="calToday()">Hôm nay</button>'
    +'<div class="cal-legend"><span><b class="d bd"></b>🎂 Sinh nhật</span><span><b class="d hd"></b>📄 Hết hạn HĐ</span><span><b class="d anniv"></b>🎉 Kỷ niệm vào làm</span></div>'
    +'</div>'
    +'<div class="cal-main"><div class="cal-cal">'
    +'<div class="cal-wds">'+wd+'</div><div class="cal-grid">'+cells+'</div></div>'
    +'<div class="cal-side"><div class="cal-side-h">Sự kiện trong '+MONTHS[m].toLowerCase()+' <span>('+listItems.length+')</span></div>'
    +'<div class="cal-counts">🎂 '+counts.bd+' · 📄 '+counts.hd+' · 🎉 '+counts.anniv+'</div>'
    +'<div class="cal-list">'+listHtml+'</div></div></div>'
    +'</div>';
};
function shortName(full){ var p=String(full||'').trim().split(/\s+/); return p.length>1? (p[0]+' '+p[p.length-1]) : (p[0]||''); }

function calStyle(){ return '<style id="cal-style">'
  +'#cal{max-width:1160px}'
  +'#cal .cal-bar{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin:2px 0 16px}'
  +'#cal .cal-step{display:inline-flex;align-items:center;gap:4px;background:#fff;border:1px solid #E4DECF;border-radius:10px;padding:4px 6px}'
  +'#cal .cal-step .arw{width:28px;height:28px;border-radius:7px;background:#f1ede3;color:#21303B;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:16px;user-select:none}'
  +'#cal .cal-step .lbl{font-family:Fraunces,serif;font-size:16px;font-weight:600;color:#21303B;padding:0 12px;min-width:130px;text-align:center}'
  +'#cal .cal-today{background:#21303B;color:#fff;border:0;font-family:inherit;font-size:13px;font-weight:600;padding:8px 15px;border-radius:9px;cursor:pointer}'
  +'#cal .cal-legend{display:flex;gap:16px;margin-left:auto;font-size:12.5px;color:#5c5647;flex-wrap:wrap}'
  +'#cal .cal-legend .d{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}'
  +'#cal .d.bd{background:#B07A43}#cal .d.hd{background:#A65A4B}#cal .d.anniv{background:#35655B}'
  +'#cal .cal-main{display:grid;grid-template-columns:1fr 320px;gap:18px;align-items:start}'
  +'#cal .cal-cal{background:#fff;border:1px solid #E4DECF;border-radius:14px;padding:14px}'
  +'#cal .cal-wds{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px}'
  +'#cal .cal-wd{text-align:center;font-size:11.5px;font-weight:600;color:#8B897E;padding:4px 0}'
  +'#cal .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}'
  +'#cal .cal-cell{min-height:92px;border:1px solid #f0ebe0;border-radius:9px;padding:6px;background:#fdfcf9;display:flex;flex-direction:column;gap:3px}'
  +'#cal .cal-cell.out{background:transparent;border:0}'
  +'#cal .cal-cell.today{border-color:#35655B;background:#f3f8f6;box-shadow:inset 0 0 0 1px #35655B}'
  +'#cal .cal-dn{font-size:12.5px;color:#5c5647;font-weight:600;display:flex;align-items:center;gap:6px}'
  +'#cal .cal-td{font-size:9.5px;font-weight:700;color:#35655B;background:#dcebe6;border-radius:10px;padding:1px 6px}'
  +'#cal .cal-chip{font-size:10.5px;color:#21303B;background:#faf7f0;border:1px solid #ece5d6;border-radius:6px;padding:2px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:3px}'
  +'#cal .cal-chip span{font-size:10px}'
  +'#cal .cal-chip.bd{border-left:2px solid #B07A43}#cal .cal-chip.hd{border-left:2px solid #A65A4B}#cal .cal-chip.anniv{border-left:2px solid #35655B}'
  +'#cal .cal-more{font-size:10px;color:#8B897E;padding-left:3px}'
  +'#cal .cal-side{background:#fff;border:1px solid #E4DECF;border-radius:14px;padding:16px;position:sticky;top:12px}'
  +'#cal .cal-side-h{font-family:Fraunces,serif;font-size:16px;font-weight:600;color:#21303B}'
  +'#cal .cal-side-h span{color:#8B897E;font-family:"Be Vietnam Pro",sans-serif;font-size:13px}'
  +'#cal .cal-counts{font-size:12.5px;color:#8B897E;margin:4px 0 12px;border-bottom:1px solid #f1ece1;padding-bottom:12px}'
  +'#cal .cal-list{display:flex;flex-direction:column;max-height:520px;overflow:auto}'
  +'#cal .cal-li{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #f1ece1}'
  +'#cal .cal-li:last-child{border-bottom:0}'
  +'#cal .cal-li-d{font-size:12px;font-weight:600;color:#8B897E;font-variant-numeric:tabular-nums;min-width:38px}'
  +'#cal .cal-li-i{font-size:16px;width:20px;text-align:center}'
  +'#cal .cal-li-n{font-size:13.5px;color:#21303B;font-weight:500}'
  +'#cal .cal-li-s{font-size:11.5px;color:#8B897E;margin-top:1px}'
  +'#cal .cal-empty{font-size:13px;color:#9a8f78;padding:10px 0}'
  +'@media(max-width:860px){#cal .cal-main{grid-template-columns:1fr}#cal .cal-side{position:static}#cal .cal-cell{min-height:72px}}'
  +'</style>';
}


/* ============================================================
   TAB: NGUỒN DỮ LIỆU (nguon) — trạng thái & sức khỏe nguồn (read-only)
   Kiến trúc "1 nguồn": Hồ sơ + Tuyển dụng -> API hub (lọc PII, ghép Mã NV)
   -> web; Chấm công qua Firebase. Trang này soi trạng thái + tính toàn vẹn.
   ============================================================ */
function ngNorm(s){ return String(s||'').toLowerCase().normalize('NFC').replace(/\s+/g,' ').trim(); }

window.renderNguon = function(){
  var esc=window.nsEsc||function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
  if(window.HR&&window.HR.error) return (window.errorBox?window.errorBox():'<div>Lỗi tải dữ liệu.</div>');
  if(!(window.HR&&window.HR.loaded)) return (window.loadingBox?window.loadingBox():'<div>Đang tải…</div>');

  var ns=(window.HR.nhansu)||[], td=(window.HR.tuyendung)||[], vt=(window.HR.viTriList)||[];
  var active=ns.filter(isWorking);

  /* chấm công (Firebase) — nạp nếu chưa có, không chặn trang */
  var cc=window.__ccData;
  if(!cc && window.__NS_FB) window.nsuatLoadFirebase(); // [B1] dùng bộ nạp chung

  /* ---- kiểm tra tính toàn vẹn ---- */
  // Mã NV
  var reBIGX=/^BIGX-\d{3}$/;
  var maBad=ns.filter(function(n){var m=(n.maNV||'').trim(); return m && !reBIGX.test(m);}).length;
  var maEmpty=ns.filter(function(n){return !(n.maNV||'').trim();}).length;
  var seen={}, dup={}; ns.forEach(function(n){var m=(n.maNV||'').trim(); if(!m)return; seen[m]=(seen[m]||0)+1; if(seen[m]>1)dup[m]=1;});
  var maDup=Object.keys(dup).length;
  // hồ sơ thiếu
  var hoSoThieu=active.filter(function(n){return /thiếu/i.test(n.tinhTrangHoSo||'');}).length;
  // HĐ chưa có ngày hết hạn (đang làm)
  var hanTrong=active.filter(function(n){return !(n.ngayHetHan||'').trim();}).length;
  // tuyển dụng thiếu vị trí / ngày nộp
  var tdThieu=td.filter(function(c){return !(c.viTri||'').trim() || !(c.ngayNop||'').trim();}).length;
  // PII scan: field nào chứa chuỗi >=9 chữ số liền (CCCD/SĐT) => rò rỉ
  var piiHits=0;
  function scan(rows){ rows.forEach(function(r){ Object.keys(r).forEach(function(k){ var v=r[k]; if(typeof v==='string' && /\d{9,}/.test(v.replace(/[\s.\-]/g,''))) piiHits++; }); }); }
  scan(ns); scan(td);
  // chấm công mapping
  var ccEmp=(cc&&cc.employees)||[]; var ccKeys=cc?Object.keys(cc.cc_data||{}).length:0;
  var nameSet={}; ns.forEach(function(n){nameSet[ngNorm(n.hoTen)]=1;});
  var ccUnlinked=cc? ccEmp.filter(function(e){return !nameSet[ngNorm(e.name)];}).length : null;

  function chk(ok, label, detail){
    var cls=ok?'ok':'warn'; var ic=ok?'✓':'!';
    return '<div class="ng-chk '+cls+'"><span class="ng-ic">'+ic+'</span><div class="ng-ck-b"><div class="ng-ck-l">'+label+'</div><div class="ng-ck-d">'+detail+'</div></div></div>';
  }

  var srcCards=''
    +ngCard('API Hub (Apps Script)', (window.HR.loaded?'LIVE':'—'), 'Cập nhật: '+(esc(window.HR.updated)||'—'), 'ti', window.HR.loaded)
    +ngCard('Hồ sơ nhân sự', ns.length+' bản ghi', active.length+' đang làm · '+(ns.length-active.length)+' đã nghỉ', 'ho', true)
    +ngCard('Tuyển dụng', td.length+' CV', vt.length+' vị trí chuẩn', 'td', true)
    +ngCard('Chấm công (Firebase)', cc?(ccEmp.length+' NV chấm công'):'đang tải…', cc?(ccKeys+' bảng công theo tháng'):'—', 'cc', !!cc);

  var checks=''
    +chk(maBad===0 && maEmpty===0, 'Mã NV đúng định dạng BIGX-0XX', maBad===0&&maEmpty===0?'Tất cả hợp lệ':(maBad+' sai định dạng · '+maEmpty+' bỏ trống'))
    +chk(maDup===0, 'Mã NV không trùng', maDup===0?'Không có trùng':(maDup+' mã bị trùng'))
    +chk(piiHits===0, 'PII sạch trên web (không lộ CCCD/SĐT)', piiHits===0?'Không phát hiện chuỗi ≥9 chữ số':(piiHits+' trường nghi lộ — cần kiểm API'))
    +chk(tdThieu===0, 'Tuyển dụng đủ vị trí & ngày nộp', tdThieu===0?'Tất cả dòng hợp lệ':(tdThieu+' dòng thiếu'))
    +chk(hoSoThieu===0, 'Hồ sơ nhân sự đầy đủ', hoSoThieu===0?'Không thiếu':(hoSoThieu+' người thiếu hồ sơ (đang làm)'))
    +chk(hanTrong===0, 'HĐ có ngày hết hạn', hanTrong===0?'Đủ':(hanTrong+' người đang làm chưa có ngày hết hạn'))
    +(cc?chk(ccUnlinked===0, 'Chấm công liên kết hồ sơ (theo tên)', ccUnlinked===0?'Khớp hết':(ccUnlinked+' NV chấm công chưa khớp hồ sơ')):'');

  var warnCount=[maBad+maEmpty>0, maDup>0, piiHits>0, tdThieu>0, hoSoThieu>0, hanTrong>0, (cc&&ccUnlinked>0)].filter(Boolean).length;

  var flow='<div class="ng-flow">'
    +'<div class="ng-src"><div class="ng-fn">Hồ sơ nhân sự</div><div class="ng-fs">Google Sheet · PII gốc</div></div>'
    +'<div class="ng-src"><div class="ng-fn">Tuyển dụng</div><div class="ng-fs">Google Sheet · CV</div></div>'
    +'<div class="ng-arrow">→</div>'
    +'<div class="ng-hub"><div class="ng-fn">API Hub</div><div class="ng-fs">Ghép theo Mã NV · lọc PII</div></div>'
    +'<div class="ng-arrow">→</div>'
    +'<div class="ng-web"><div class="ng-fn">Dashboard</div><div class="ng-fs">Mọi tab đọc từ đây</div></div>'
    +'</div>'
    +'<div class="ng-flow2"><div class="ng-src cc"><div class="ng-fn">Chấm công</div><div class="ng-fs">Firebase (điểm danh)</div></div><div class="ng-arrow">→</div><span class="ng-note2">nạp trực tiếp cho tab Chấm công · Báo cáo</span></div>';

  return '<div class="page-head"><div class="page-h1">Nguồn dữ liệu</div>'
    +'<div class="page-lead">Kiến trúc "1 nguồn": web đọc từ API hub (ghép theo Mã NV, đã lọc PII). Trang này theo dõi trạng thái từng nguồn và kiểm tra tính toàn vẹn dữ liệu.</div></div>'
    +ngStyle()
    +'<div id="nguon">'
    +'<div class="ng-h">Trạng thái nguồn</div><div class="ng-cards">'+srcCards+'</div>'
    +'<div class="ng-h">Kiểm tra tính toàn vẹn '+(warnCount===0?'<span class="ng-badge ok">Tất cả đạt</span>':'<span class="ng-badge warn">'+warnCount+' cần chú ý</span>')+'</div>'
    +'<div class="ng-checks">'+checks+'</div>'
    +'<div class="ng-h">Luồng dữ liệu</div><div class="ng-flow-wrap">'+flow+'</div>'
    +'<div class="ng-pii">🔒 PII (CCCD · SĐT · địa chỉ · ảnh) không bao giờ rời file nguồn — API chỉ trả các cột đã lọc. HR xem PII trực tiếp trong file Hồ sơ.</div>'
    +'</div>';
};

function ngCard(title, big, sub, ic, ok){
  return '<div class="ng-card"><div class="ng-c-top"><span class="ng-dot '+(ok?'on':'off')+'"></span><span class="ng-c-t">'+title+'</span></div>'
    +'<div class="ng-c-v">'+big+'</div><div class="ng-c-s">'+sub+'</div></div>';
}

function ngStyle(){ return '<style id="ng-style">'
  +'#nguon{max-width:1080px}'
  +'#nguon .ng-h{font-family:Fraunces,serif;font-size:16px;font-weight:600;color:#21303B;margin:20px 0 12px;display:flex;align-items:center;gap:10px}'
  +'#nguon .ng-h:first-child{margin-top:2px}'
  +'#nguon .ng-badge{font-size:11.5px;font-weight:600;padding:2px 10px;border-radius:20px}'
  +'#nguon .ng-badge.ok{background:#e7f3ec;color:#2e7d5b}#nguon .ng-badge.warn{background:#fbf1df;color:#b07a43}'
  +'#nguon .ng-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}'
  +'#nguon .ng-card{background:#fff;border:1px solid #E4DECF;border-radius:12px;padding:15px 16px}'
  +'#nguon .ng-c-top{display:flex;align-items:center;gap:8px}'
  +'#nguon .ng-dot{width:8px;height:8px;border-radius:50%}#nguon .ng-dot.on{background:#2e7d5b}#nguon .ng-dot.off{background:#c9c2b2}'
  +'#nguon .ng-c-t{font-size:12.5px;color:#8B897E}'
  +'#nguon .ng-c-v{font-family:Fraunces,serif;font-size:22px;font-weight:600;color:#21303B;margin-top:8px;line-height:1.1}'
  +'#nguon .ng-c-s{font-size:12px;color:#8B897E;margin-top:5px}'
  +'#nguon .ng-checks{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
  +'#nguon .ng-chk{display:flex;gap:11px;align-items:flex-start;background:#fff;border:1px solid #E4DECF;border-radius:10px;padding:12px 14px;border-left:3px solid #2e7d5b}'
  +'#nguon .ng-chk.warn{border-left-color:#b07a43}'
  +'#nguon .ng-ic{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;background:#2e7d5b;flex:0 0 20px;margin-top:1px}'
  +'#nguon .ng-chk.warn .ng-ic{background:#b07a43}'
  +'#nguon .ng-ck-l{font-size:13.5px;color:#21303B;font-weight:500}'
  +'#nguon .ng-ck-d{font-size:12px;color:#8B897E;margin-top:2px}'
  +'#nguon .ng-flow-wrap{background:#fff;border:1px solid #E4DECF;border-radius:12px;padding:20px 18px}'
  +'#nguon .ng-flow{display:flex;align-items:center;gap:12px;flex-wrap:wrap}'
  +'#nguon .ng-flow2{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px;padding-top:14px;border-top:1px dashed #e4dece}'
  +'#nguon .ng-src,#nguon .ng-hub,#nguon .ng-web{border:1px solid #E4DECF;border-radius:10px;padding:11px 14px;background:#fdfcf9;min-width:150px}'
  +'#nguon .ng-hub{background:#f3f8f6;border-color:#bcd7cf}'
  +'#nguon .ng-web{background:#eef4f2;border-color:#bcd7cf}'
  +'#nguon .ng-src.cc{background:#faf7f0;border-color:#ece5d6}'
  +'#nguon .ng-fn{font-size:13.5px;font-weight:600;color:#21303B}'
  +'#nguon .ng-fs{font-size:11.5px;color:#8B897E;margin-top:2px}'
  +'#nguon .ng-arrow{font-size:20px;color:#35655B}'
  +'#nguon .ng-note2{font-size:12px;color:#8B897E}'
  +'#nguon .ng-pii{margin-top:16px;background:#f3f8f6;border:1px solid #d6e6e2;border-radius:10px;padding:12px 15px;font-size:12.5px;color:#3d4b45;line-height:1.55}'
  +'@media(max-width:860px){#nguon .ng-cards{grid-template-columns:repeat(2,1fr)}#nguon .ng-checks{grid-template-columns:1fr}}'
  +'</style>';
}


/* ============================================================
   TAB: CÔNG VIỆC HR (cong-viec) — [G][H][I]
   Xem theo THÁNG LỊCH (1 → cuối tháng). Mỗi tháng 3 nhóm:
   1) Việc cố định hằng tháng: chốt & gửi bảng chấm công (hạn 25), lịch đăng ký văn phòng & phòng họp (hạn 31 / cuối tháng)
   2) Việc tự động từ dữ liệu: poster sinh nhật (hạn ngày 1), HĐ thử việc cho người mới vào, HĐ hết hạn / đánh giá hết thử việc
      (bấm Pass → tự tạo "Poster chúc mừng pass thử việc"), hồ sơ thiếu (chỉ tháng hiện tại)
   3) Việc anh tự thêm (có Loại) — thuộc tháng theo deadline (không có deadline → tháng tạo)
   Việc chưa xong ở tháng cũ nằm lại tháng cũ (banner nhắc HĐ/việc tự thêm còn tồn).
   Feedback sếp: Gửi duyệt → ✓ Đạt / ✎ Cần sửa (ghi nội dung). Số lần sửa; xong ghi "Đạt lần N"; không feedback = đạt lần đầu.
   Lưu Firebase public/hrtasks = { tasks:{id:{...}}, autoDone:{id:date} (bản cũ) } — ghi từng task; chamcong.html dùng PATCH nên không xoá nhánh này.
   ============================================================ */
(function(){
  var FB_TASKS='https://bigx-chamcong-hr-default-rtdb.firebaseio.com/public/hrtasks';
  var BAK='bx_hrtasks_bak';
  var START='2026-09'; // việc cố định / sinh nhật / HĐTV / hồ sơ: bắt đầu tính từ tháng ra mắt tính năng
  var S=window.__cv={ loaded:false, loading:false, err:null, tasks:{}, autoDone:{}, emptyCloud:false,
    month:null, f:{ q:'', st:'', owner:'', cat:'' }, form:null, fixDraft:null, gen:{} };
  var ST={todo:'Chưa làm', doing:'Đang làm', review:'Chờ duyệt', fix:'Cần sửa', done:'Xong'};
  var PRI={cao:'Cao', tb:'Trung bình', thap:'Thấp'};
  var PRI_W={cao:0, tb:1, thap:2};
  var CAT={tuyendung:'Tuyển dụng', hopdong:'HĐ – Hồ sơ', luong:'Chấm công – Lương', truyenthong:'Truyền thông nội bộ', khac:'Khác'};
  var GROUPS=[['fixed','Việc cố định hằng tháng','ti-repeat'],['auto','Việc tự động từ dữ liệu','ti-bolt'],['manual','Việc anh tự thêm','ti-pencil-plus']];
  var OPEN_ID=null;
  function e_(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function p2(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }
  function todayISO(){ return iso(new Date()); }
  function curMonth(){ return todayISO().slice(0,7); }
  function dmy(s){ if(!s) return '—'; var p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
  function daysTo(s){ if(!s) return null; var p=s.split('-'); var d=new Date(+p[0],+p[1]-1,+p[2]); var t=new Date(); t.setHours(0,0,0,0); return Math.round((d-t)/86400000); }
  function monthLabel(ym){ var p=ym.split('-'); return 'Tháng '+(+p[1])+'/'+p[0]; }
  function shiftMonth(ym,k){ var p=ym.split('-'); var d=new Date(+p[0], +p[1]-1+k, 1); return d.getFullYear()+'-'+p2(d.getMonth()+1); }
  function lastDay(ym){ var p=ym.split('-'); return new Date(+p[0], +p[1], 0).getDate(); }
  function fbKey(k){ return String(k).replace(/[.#$\[\]\/|%]/g,'_'); }
  function fetchJ(url, opt){ return (window.bxAuthedFetch?window.bxAuthedFetch(url,opt):fetch(url,opt)).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }); }
  /* Vẽ lại tab nhưng GIỮ vị trí cuộn (go() mặc định kéo lên đầu trang) */
  function rerender(){
    if(window.currentTab!=='cong-viec' || !window.go) return;
    var c=document.getElementById('content'), y=c?c.scrollTop:0, wy=window.scrollY||0;
    window.go('cong-viec');
    var back=function(){ if(c) c.scrollTop=y; if(wy) window.scrollTo(0,wy); };
    back(); setTimeout(back,0); setTimeout(back,30); // bảng vẽ sau setTimeout → khôi phục lại lần nữa
  }
  function showForm(){ setTimeout(function(){ var f=document.querySelector('.cv-form'); if(f&&f.scrollIntoView) f.scrollIntoView({block:'center'}); var t=document.getElementById('cvf-title'); if(t) t.focus({preventScroll:true}); },60); }
  function saveBak(){ try{ localStorage.setItem(BAK, JSON.stringify({tasks:S.tasks, autoDone:S.autoDone})); }catch(e){} }
  function fixes(t){ return (t.log||[]).filter(function(x){return x.t==='fix';}).length; }

  function load(){
    if(S.loading) return; S.loading=true;
    fetchJ(FB_TASKS+'.json',{cache:'no-store'}).then(function(d){
      S.tasks=(d&&d.tasks)||{}; S.autoDone=(d&&d.autoDone)||{}; S.err=null; S.loaded=true;
      var bak=null; try{ bak=JSON.parse(localStorage.getItem(BAK)||'null'); }catch(e){}
      S.emptyCloud = !d && bak && bak.tasks && Object.keys(bak.tasks).length>0;
      if(!S.emptyCloud) saveBak();
    }).catch(function(e){ S.err=e.message||String(e); S.loaded=true; })
      .then(function(){ S.loading=false; rerender(); if(window.currentTab==='bao-cao' && window.go) window.go('bao-cao'); });
  }
  window.cvReload=function(){ S.loaded=false; load(); rerender(); };
  window.cvRestore=function(){
    var bak=null; try{ bak=JSON.parse(localStorage.getItem(BAK)||'null'); }catch(e){}
    if(!bak) return;
    if(!confirm('Khôi phục '+Object.keys(bak.tasks||{}).length+' việc từ bản lưu trên máy này lên cloud?')) return;
    fetchJ(FB_TASKS+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(bak)})
      .then(function(){ S.emptyCloud=false; window.cvReload(); })
      .catch(function(e){ alert('Không khôi phục được: '+(e.message||e)); });
  };

  /* ---- Sinh việc cố định + tự động cho tháng ym ---- */
  function people(){ return ((window.HR&&window.HR.nhansu)||[]).filter(window.isWorking||function(){return true;}); }
  function genMonth(ym){
    var out=[], y=+ym.slice(0,4), m=+ym.slice(5,7);
    function add(o){ o.id=fbKey(o.key); o.month=ym; o.owner=o.owner||'HR'; out.push(o); }
    if(ym>=START){
      add({key:'fx|cc|'+ym, group:'fixed', kind:'cc', title:'Chốt & gửi bảng chấm công', note:'Hằng tháng · hạn ngày 25', due:ym+'-25', pri:'cao', dept:'Kế toán - Nhân sự'});
      add({key:'fx|vp|'+ym, group:'fixed', kind:'vp', title:'Lịch đăng ký lên văn phòng & phòng họp', note:'Hằng tháng · ngày 31 (tháng không có 31 → ngày cuối tháng)', due:ym+'-'+p2(Math.min(31,lastDay(ym))), pri:'tb', dept:''});
    }
    people().forEach(function(n){
      var pid=n.maNV||n.hoTen, nm=n.hoTen||n.maNV||'—';
      if(ym>=START){
        var sp=String(n.sinhNhat||'').split('/');
        if(sp.length>=2 && +sp[1]===m && +sp[0]>=1 && +sp[0]<=31)
          add({key:'bd|'+pid+'|'+y, group:'auto', kind:'bd', title:'Poster chúc sinh nhật: '+nm+' ('+p2(+sp[0])+'/'+p2(m)+')', note:'', due:ym+'-01', pri:'tb', dept:n.phong||''});
        var nv=(typeof parseDMY==='function')?parseDMY(n.ngayVao):null;
        if(nv && nv.getFullYear()===y && nv.getMonth()+1===m)
          add({key:'hdtv|'+pid+'|'+iso(nv), group:'auto', kind:'hdtv', title:'Chuẩn bị HĐ thử việc: '+nm+' (vào '+p2(nv.getDate())+'/'+p2(m)+')', note:(n.chucVu||''), due:iso(nv), pri:'cao', dept:n.phong||''});
        if(ym===curMonth() && /thiếu/i.test(String(n.tinhTrangHoSo||'')))
          add({key:'hs|'+pid+'|'+ym, group:'auto', kind:'hs', title:'Bổ sung hồ sơ còn thiếu: '+nm, note:String(n.tinhTrangHoSo||''), due:'', pri:'thap', dept:n.phong||''});
      }
      var hh=(typeof parseDMY==='function')?parseDMY(n.ngayHetHan):null;
      if(hh && hh.getFullYear()===y && hh.getMonth()+1===m){
        var tv=/thử việc/i.test(String(n.loaiHD||''));
        add({key:'hd|'+pid+'|'+iso(hh), group:'auto', kind:(tv?'tv':'hd'), person:nm, title:(tv?'Đánh giá hết thử việc: ':'Gia hạn / ký HĐ mới (HĐ hết hạn): ')+nm, note:(n.loaiHD||''), due:iso(hh), pri:'cao', dept:n.phong||''});
      }
    });
    return out;
  }
  function taskMonth(t){ return t.month || String(t.due||t.createdAt||todayISO()).slice(0,7); }
  /* Gộp: việc sinh ra (tiêu đề sống theo dữ liệu) + trạng thái đã lưu; cộng việc đã lưu thuộc tháng ym */
  function itemsFor(ym){
    var gen=genMonth(ym), seen={}, out=[];
    gen.forEach(function(g){
      S.gen[g.id]=g; seen[g.id]=1;
      var st=S.tasks[g.id];
      var it=Object.assign({}, g, {status:'todo', log:[], doneAt:''});
      if(st) Object.assign(it, {status:st.status||'todo', log:st.log||[], doneAt:st.doneAt||'', result:st.result||'', owner:st.owner||g.owner});
      else if(S.autoDone[g.id]){ it.status='done'; it.doneAt=S.autoDone[g.id]; }
      out.push(it);
    });
    Object.keys(S.tasks).forEach(function(id){
      if(seen[id]) return; var t=S.tasks[id]||{};
      if(taskMonth(t)!==ym) return;
      out.push(Object.assign({id:id, group:t.group||'manual'}, t));
    });
    return out;
  }
  function isOpen(t){ return t.status!=='done'; }
  function passFilter(t){
    var q=S.f.q.trim().toLowerCase();
    if(S.f.st==='open' && !isOpen(t)) return false;
    if(S.f.st==='hasfb'){ if(!fixes(t)) return false; }
    else if(S.f.st && S.f.st!=='open' && t.status!==S.f.st) return false;
    if(S.f.owner && (t.owner||'')!==S.f.owner) return false;
    if(S.f.cat && (t.group!=='manual' || (t.cat||'khac')!==S.f.cat)) return false;
    if(q && ((t.title||'')+' '+(t.note||'')+' '+(t.owner||'')+' '+(t.dept||'')).toLowerCase().indexOf(q)<0) return false;
    return true;
  }
  function sortItems(a,b){
    var oa=isOpen(a)?0:1, ob=isOpen(b)?0:1; if(oa!==ob) return oa-ob;
    var fa=a.status==='fix'?0:1, fb=b.status==='fix'?0:1; if(fa!==fb) return fa-fb;
    var da=a.due||'9999', db=b.due||'9999'; if(da!==db) return da<db?-1:1;
    return (PRI_W[a.pri]||1)-(PRI_W[b.pri]||1);
  }
  /* Việc tồn ở các tháng trước (chỉ nhắc HĐ/thử việc + việc tự thêm; 36 tháng gần nhất) */
  function backlog(){
    var res=[], cm=curMonth();
    for(var k=1;k<=36;k++){ // 3 năm gần nhất
      var ym=shiftMonth(cm,-k);
      var n=itemsFor(ym).filter(function(t){ return isOpen(t) && (t.group==='manual' || t.kind==='hd' || t.kind==='tv'); }).length;
      if(n) res.push([ym,n]);
    }
    return res;
  }

  function css(){
    if(document.getElementById('cv-css')) return;
    var s=document.createElement('style'); s.id='cv-css';
    s.textContent='.cv-form{max-width:1180px;background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:16px 18px;margin-bottom:14px}'
     +'.cv-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px 12px}'
     +'.cv-grid label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--muted);letter-spacing:.3px}'
     +'.cv-grid input,.cv-grid select,.cv-grid textarea{font:inherit;font-size:13px;color:var(--text);background:#fff;border:1px solid var(--line);border-radius:var(--radius-sm);padding:7px 9px;outline:none}'
     +'.cv-grid textarea{min-height:54px;resize:vertical}.cv-span3{grid-column:1/-1}'
     +'.cv-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}'
     +'.cv-btn{font:inherit;font-size:12px;border:1px solid var(--line);background:var(--paper-2);color:var(--text);border-radius:var(--radius-sm);padding:5px 10px;cursor:pointer;margin-right:3px}'
     +'.cv-btn:hover{background:#EDE8DC}.cv-ico{border:none;background:none;cursor:pointer;color:var(--muted);font-size:15px;padding:2px 4px}.cv-ico:hover{color:var(--ink)}'
     +'.cv-ok{border-color:#B9D3C8;color:var(--teal)}.cv-bad{border-color:#E2BCB3;color:var(--rust)}'
     +'.cv-st{font:inherit;font-size:12px;border:1px solid var(--line);border-radius:var(--radius-sm);padding:4px 6px;background:#fff;color:var(--text)}'
     +'.cv-st-fix{border-color:#E2BCB3;color:var(--rust)}.cv-st-review{border-color:#E4C99A;color:var(--clay)}'
     +'.cv-done td{color:var(--faint)!important}.cv-done .dt-name{text-decoration:line-through;color:var(--faint)}'
     +'.cv-note{font-size:11.5px;color:var(--muted);margin-top:2px}.cv-due-over{color:var(--rust);font-weight:600}.cv-due-soon{color:var(--clay);font-weight:600}'
     +'.cv-banner{max-width:1180px;margin-bottom:14px;padding:10px 14px;border-radius:var(--radius-sm);background:var(--rust-bg);color:var(--rust);font-size:12.5px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}'
     +'.cv-chip{font:inherit;font-size:12px;border:1px solid #E2BCB3;background:#fff;color:var(--rust);border-radius:20px;padding:2px 10px;cursor:pointer}'
     +'.cv-month{display:flex;align-items:center;gap:8px;max-width:1180px;margin-bottom:16px}'
     +'.cv-month .cv-m-lbl{font-family:var(--serif);font-size:22px;font-weight:600;color:var(--ink);min-width:170px;text-align:center}'
     +'.cv-sec{max-width:1180px;margin:18px 0 8px;display:flex;align-items:center;gap:10px}'
     +'.cv-sec-t{font-weight:600;color:var(--ink);font-size:14px;display:flex;align-items:center;gap:6px}.cv-sec-t i{color:var(--teal)}'
     +'.cv-bar{flex:0 0 140px;height:6px;border-radius:4px;background:var(--line-soft);overflow:hidden}.cv-bar>div{height:100%;background:var(--teal)}'
     +'.cv-sec-n{font-size:12px;color:var(--muted)}'
     +'.cv-hist td{background:var(--paper-2)}.cv-h-title{font-size:12px;font-weight:600;color:var(--ink);margin-bottom:6px}'
     +'.cv-h-list{margin:0;padding-left:18px;font-size:12.5px;line-height:1.7}.cv-h-fix{color:var(--rust)}.cv-h-ok{color:var(--teal)}'
     +'.cv-fb{margin-top:8px}.cv-fb textarea{width:100%;min-height:60px;font:inherit;font-size:13px;border:1px solid var(--line);border-radius:var(--radius-sm);padding:7px 9px;background:#fff;resize:vertical;box-sizing:border-box}'
     +'table.cv-t td:first-child{width:38%}'
     +'.cv-perf{max-width:1180px;margin-bottom:18px}.cv-perf-h{font-weight:600;color:var(--ink);font-size:15px;display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap}.cv-perf-h i{color:var(--teal)}'
     +'.cv-perf-note{font-weight:400;font-size:11px;color:var(--muted);margin-left:auto}'
     +'.cv-pcs{display:grid;grid-template-columns:1.3fr repeat(4,1fr);gap:12px;margin-bottom:12px}'
     +'.cv-pc{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:14px 16px}'
     +'.cv-pc-l{font-size:11.5px;color:var(--muted)}.cv-pc-v{font-family:var(--serif);font-size:28px;font-weight:600;color:var(--ink);line-height:1.15;margin-top:6px}.cv-pc-v small{font-size:14px;color:var(--muted)}'
     +'.cv-pc-s{font-size:11.5px;color:var(--muted);margin-top:2px}.cv-pc-d{margin-top:6px;min-height:16px}'
     +'.cv-pc.main .cv-pc-v{font-size:34px}.cv-pc.main.good{border-color:#B9D3C8;background:linear-gradient(0deg,rgba(53,101,91,.05),rgba(53,101,91,.05)),var(--paper)}.cv-pc.main.good .cv-pc-v,.cv-pc.main.good .cv-pc-s{color:var(--teal)}'
     +'.cv-pc.main.ok .cv-pc-v,.cv-pc.main.ok .cv-pc-s{color:var(--clay)}.cv-pc.main.bad{border-color:#D9A99E}.cv-pc.main.bad .cv-pc-v,.cv-pc.main.bad .cv-pc-s{color:var(--rust)}.cv-pc.warn .cv-pc-v{color:var(--clay)}'
     +'.cv-d{font-size:11.5px;font-weight:600}.cv-d.up{color:var(--teal)}.cv-d.down{color:var(--rust)}.cv-d.flat{color:var(--muted);font-weight:400}'
     +'.cv-prow{display:grid;grid-template-columns:1.5fr 1fr;gap:12px;margin-bottom:12px}'
     +'.cv-pbox{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);padding:14px 16px;min-width:0}'
     +'.cv-pbox-t{font-size:12px;font-weight:600;color:var(--ink);margin-bottom:6px}.cv-ch{height:250px}.cv-ch.sm{height:170px}'
     +'.cv-eval-h{font-size:13px;font-weight:600;color:var(--ink);margin-bottom:6px}.cv-eval-b{font-size:12.5px;line-height:1.6;color:var(--text)}.cv-eval-b p{margin:0 0 6px}.cv-eval-b ul{margin:2px 0 0;padding-left:18px}'
     +'.cv-grade{font-weight:600}.cv-g-good{color:var(--teal)}.cv-g-ok{color:var(--clay)}.cv-g-bad{color:var(--rust)}.cv-e-red{color:var(--rust)}.cv-e-amb{color:var(--clay)}'
     +'@media(max-width:900px){.cv-pcs{grid-template-columns:repeat(2,1fr)}.cv-prow{grid-template-columns:1fr}}'
     +'@media(max-width:760px){.cv-grid{grid-template-columns:1fr}}';
    document.head.appendChild(s);
  }

  function ownersList(){
    var set={'HR':1}; Object.keys(S.tasks).forEach(function(id){ var o=(S.tasks[id]||{}).owner; if(o) set[o]=1; });
    return Object.keys(set).sort(function(a,b){return a.localeCompare(b,'vi');});
  }
  function deptList(){ var set={}; people().forEach(function(n){ if(n.phong) set[n.phong]=1; }); return Object.keys(set).sort(function(a,b){return a.localeCompare(b,'vi');}); }
  function peopleNames(){ return people().map(function(n){return n.hoTen;}).filter(Boolean); }

  /* ---- Form thêm/sửa việc tự thêm ---- */
  function formHtml(){
    var f=S.form; if(!f) return '';
    var opt=function(obj,v){ return Object.keys(obj).map(function(k){ return '<option value="'+k+'"'+(k===v?' selected':'')+'>'+obj[k]+'</option>'; }).join(''); };
    return '<div class="cv-form">'
      +'<div style="font-weight:600;color:var(--ink);margin-bottom:10px">'+(f.id?'Sửa việc':'Thêm việc mới')+'</div>'
      +'<div class="cv-grid">'
      +'<label>Tên việc *<input id="cvf-title" value="'+e_(f.title)+'" placeholder="VD: Soạn quy trình onboarding…"></label>'
      +'<label>Loại<select id="cvf-cat">'+opt(CAT,f.cat||'khac')+'</select></label>'
      +'<label>Deadline (quyết định việc thuộc tháng nào)<input id="cvf-due" type="date" value="'+e_(f.due)+'"></label>'
      +'<label>Người phụ trách<input id="cvf-owner" list="cv-people" value="'+e_(f.owner)+'"></label>'
      +'<label>Phòng ban<input id="cvf-dept" list="cv-depts" value="'+e_(f.dept)+'"></label>'
      +'<label>Ưu tiên<select id="cvf-pri">'+opt(PRI,f.pri)+'</select></label>'
      +'<label class="cv-span3">Ghi chú<textarea id="cvf-note">'+e_(f.note)+'</textarea></label>'
      +'</div>'
      +'<datalist id="cv-people">'+peopleNames().concat(ownersList()).filter(function(v,i,a){return a.indexOf(v)===i;}).map(function(n){return '<option value="'+e_(n)+'">';}).join('')+'</datalist>'
      +'<datalist id="cv-depts">'+deptList().map(function(n){return '<option value="'+e_(n)+'">';}).join('')+'</datalist>'
      +'<div class="cv-actions"><button class="cv-btn" onclick="cvCancel()">Huỷ</button><button class="btn-primary" id="cvf-save" onclick="cvSave()"><i class="ti ti-device-floppy"></i>Lưu</button></div>'
      +'</div>';
  }
  function readForm(){
    var g=function(id){ var el=document.getElementById(id); return el?el.value:''; };
    if(!S.form) return;
    S.form.title=g('cvf-title'); S.form.owner=g('cvf-owner'); S.form.dept=g('cvf-dept'); S.form.due=g('cvf-due');
    S.form.pri=g('cvf-pri')||'tb'; S.form.cat=g('cvf-cat')||'khac'; S.form.note=g('cvf-note');
  }
  window.cvAdd=function(){
    var ym=S.month||curMonth(); var due=(ym===curMonth())?'':ym+'-'+p2(lastDay(ym));
    S.form={id:'', title:'', owner:'Brian', dept:'', due:due, pri:'tb', cat:'khac', note:''}; rerender(); showForm();
  };
  window.cvEdit=function(id){ var t=S.tasks[id]; if(!t) return; S.form=Object.assign({id:id, title:'', owner:'', dept:'', due:'', pri:'tb', cat:'khac', note:''}, t, {id:id}); rerender(); showForm(); };
  window.cvCancel=function(){ S.form=null; rerender(); };
  window.cvSave=function(){
    readForm(); var f=S.form; if(!f) return;
    if(!f.title.trim()){ alert('Nhập tên việc.'); return; }
    var id=f.id || ('t'+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
    var old=S.tasks[id]||{};
    var t=Object.assign({}, old, { title:f.title.trim(), owner:f.owner.trim(), dept:f.dept.trim(), due:f.due||'', pri:f.pri||'tb', cat:f.cat||'khac', note:f.note.trim(),
      status: old.status||'todo', createdAt: old.createdAt||todayISO(), doneAt: old.doneAt||'', log: old.log||[] });
    if(!old.group) delete t.group;
    var btn=document.getElementById('cvf-save'); if(btn){ btn.disabled=true; }
    fetchJ(FB_TASKS+'/tasks/'+id+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(t)})
      .then(function(){ S.tasks[id]=t; saveBak(); S.form=null; if(t.due) S.month=t.due.slice(0,7); rerender(); })
      .catch(function(e){ if(btn) btn.disabled=false; alert('Chưa lưu được (kiểm tra đăng nhập / mạng): '+(e.message||e)); });
  };

  /* ---- Trạng thái + feedback ---- */
  function ensure(id){
    if(S.tasks[id]) return S.tasks[id];
    var g=S.gen[id]; if(!g) return null;
    var t={ title:g.title, note:g.note||'', owner:g.owner||'HR', dept:g.dept||'', due:g.due||'', pri:g.pri||'tb', group:g.group, kind:g.kind, month:g.month,
      status: S.autoDone[id]?'done':'todo', doneAt: S.autoDone[id]||'', log:[], createdAt:todayISO() };
    if(g.person) t.person=g.person;
    return t;
  }
  function putTask(id, nt){
    return fetchJ(FB_TASKS+'/tasks/'+id+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(nt)})
      .then(function(){ S.tasks[id]=nt; saveBak(); rerender(); })
      .catch(function(e){ alert('Chưa lưu được: '+(e.message||e)); rerender(); });
  }
  window.cvSetStatus=function(id, st, note){
    var t=ensure(id); if(!t) return;
    if(st==='fix' && note==null){ OPEN_ID=id; S.fixDraft=id; rerender(); setTimeout(function(){ var el=document.getElementById('cv-fb-'+id); if(el){ el.focus({preventScroll:true}); if(el.scrollIntoView) el.scrollIntoView({block:'nearest'}); } },60); return; }
    var log=(t.log||[]).slice(), d=todayISO();
    if(st==='review' && t.status!=='review') log.push({d:d, t:'submit'});
    if(st==='fix') log.push({d:d, t:'fix', note:String(note||'').trim()});
    if(st==='done' && t.status!=='done' && log.length) log.push({d:d, t:'ok'});
    if((st==='doing'||st==='todo') && t.status!==st) log.push({d:d, t:'st', to:st}); // ghi ngày chuyển trạng thái để báo cáo đúng ngày thao tác
    var nt=Object.assign({}, t, {status:st, log:log, doneAt: st==='done'?(t.status==='done'?(t.doneAt||d):d):''});
    if(st!=='done') delete nt.result;
    S.fixDraft=null; return putTask(id, nt);
  };
  window.cvFixSubmit=function(id){
    var el=document.getElementById('cv-fb-'+id); var note=el?el.value.trim():'';
    if(!note){ alert('Nhập nội dung feedback của sếp.'); if(el) el.focus(); return; }
    window.cvSetStatus(id,'fix',note);
  };
  window.cvFixCancel=function(){ S.fixDraft=null; rerender(); };
  window.cvToggle=function(id){ OPEN_ID=(OPEN_ID===id?null:id); S.fixDraft=null; renderBody(); };
  /* Đánh giá hết thử việc: Pass → tạo việc "Poster chúc mừng pass thử việc" trong cùng tháng */
  window.cvTrial=function(id, pass){
    var t=ensure(id); if(!t) return;
    var nm=t.person || String(t.title).replace(/^.*?:\s*/,'');
    if(!confirm((pass?'Xác nhận PASS thử việc: ':'Xác nhận KHÔNG pass thử việc: ')+nm+'?')) return;
    var d=todayISO();
    var nt=Object.assign({}, t, {status:'done', doneAt:d, result:(pass?'pass':'fail'), log:(t.log||[]).concat([{d:d, t:'result', note:(pass?'Pass thử việc':'Không pass')}])});
    fetchJ(FB_TASKS+'/tasks/'+id+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(nt)}).then(function(){
      S.tasks[id]=nt; saveBak();
      if(!pass){ rerender(); return; }
      var pid=fbKey('pass|'+id);
      if(S.tasks[pid]){ rerender(); return; }
      var pt={ title:'Poster chúc mừng pass thử việc: '+nm, note:'Tạo khi bấm Pass ('+dmy(d)+')', owner:'HR', dept:t.dept||'', due:t.due||d, pri:'tb', group:'auto', kind:'pass', month:t.month||String(t.due||d).slice(0,7), status:'todo', doneAt:'', log:[], createdAt:d };
      return putTask(pid, pt);
    }).catch(function(e){ alert('Chưa lưu được: '+(e.message||e)); });
  };
  window.cvDel=function(id){
    var t=S.tasks[id]; if(!t) return;
    if(!confirm('Xoá việc "'+t.title+'"?')) return;
    fetchJ(FB_TASKS+'/tasks/'+id+'.json',{method:'DELETE'})
      .then(function(){ delete S.tasks[id]; saveBak(); rerender(); })
      .catch(function(e){ alert('Chưa xoá được: '+(e.message||e)); });
  };
  window.cvOn=function(){
    var g=function(id){ var el=document.getElementById(id); return el?el.value:''; };
    S.f.q=g('cv-q'); S.f.st=g('cv-st'); S.f.owner=g('cv-owner'); S.f.cat=g('cv-cat');
    renderBody();
  };
  window.cvMonth=function(k){ S.month=(k===0)?curMonth():shiftMonth(S.month||curMonth(),k); OPEN_ID=null; S.fixDraft=null; rerender(); };
  window.cvGoMonth=function(ym){ S.month=ym; OPEN_ID=null; rerender(); };

  /* ---- Ô trong bảng ---- */
  function dueCell(t){
    if(!t.due) return '<span class="dt-muted">—</span>';
    var n=daysTo(t.due), s=dmy(t.due);
    if(t.status==='done') return e_(s);
    if(n<0) return '<span class="cv-due-over">'+e_(s)+' · quá '+(-n)+' ngày</span>';
    if(n===0) return '<span class="cv-due-over">'+e_(s)+' · hôm nay</span>';
    if(n<=7) return '<span class="cv-due-soon">'+e_(s)+' · còn '+n+' ngày</span>';
    return e_(s);
  }
  function priPill(p){ var c=p==='cao'?'rust':(p==='tb'?'clay':'gray'); return '<span class="pill '+c+'">'+(PRI[p]||'—')+'</span>'; }
  function fixCell(t){
    var n=fixes(t);
    if(t.kind==='tv' && t.result) return t.result==='pass'?'<span class="pill teal">Pass</span>':'<span class="pill rust">Không pass</span>';
    if(t.status==='done') return n ? '<span class="pill clay" title="Sửa '+n+' lần">Đạt lần '+(n+1)+'</span>' : '<span class="pill teal">Đạt lần 1</span>';
    return n ? '<span class="pill rust">'+n+' lần</span>' : '<span class="dt-muted">0</span>';
  }
  function histRow(t){
    var log=t.log||[], sub=0, fx=0;
    var items=log.map(function(x){
      if(x.t==='submit'){ sub++; return '<li><b>'+dmy(x.d)+'</b> · Gửi duyệt lần '+sub+'</li>'; }
      if(x.t==='fix'){ fx++; return '<li class="cv-h-fix"><b>'+dmy(x.d)+'</b> · Cần sửa (lần '+fx+')'+(x.note?': '+e_(x.note):'')+'</li>'; }
      if(x.t==='result') return '<li class="cv-h-ok"><b>'+dmy(x.d)+'</b> · '+e_(x.note||'')+'</li>';
      if(x.t==='st') return '<li><b>'+dmy(x.d)+'</b> · Chuyển "'+(ST[x.to]||x.to)+'"</li>';
      return '<li class="cv-h-ok"><b>'+dmy(x.d)+'</b> · Sếp duyệt đạt'+(fx?' (sau '+fx+' lần sửa)':' ngay lần đầu')+'</li>';
    }).join('');
    var q='\''+t.id+'\'';
    var fb = S.fixDraft===t.id
      ? '<div class="cv-fb"><textarea id="cv-fb-'+t.id+'" placeholder="Dán nội dung feedback của sếp…"></textarea><div class="cv-actions"><button class="cv-btn" onclick="cvFixCancel()">Huỷ</button><button class="cv-btn cv-bad" onclick="cvFixSubmit('+q+')">Ghi "Cần sửa"</button></div></div>'
      : '<div style="margin-top:8px"><button class="cv-btn cv-bad" onclick="cvSetStatus('+q+',\'fix\')">✎ Ghi feedback cần sửa</button></div>';
    return '<tr class="cv-hist"><td colspan="7"><div class="cv-h-title">Lịch sử feedback — '+e_(t.title)+'</div>'
      +(items?'<ul class="cv-h-list">'+items+'</ul>':'<div class="dt-muted" style="font-size:12px">Chưa có feedback. Bấm "Gửi duyệt" khi nộp cho sếp.</div>')+fb+'</td></tr>';
  }
  function rowHtml(t){
    var q='\''+t.id+'\'';
    var stCell='<select class="cv-st cv-st-'+t.status+'" onchange="cvSetStatus('+q+',this.value)">'+Object.keys(ST).map(function(k){return '<option value="'+k+'"'+(k===t.status?' selected':'')+'>'+ST[k]+'</option>';}).join('')+'</select>';
    var flow;
    if(t.kind==='tv' && t.status!=='done') flow='<button class="cv-btn cv-ok" onclick="cvTrial('+q+',true)">✓ Pass</button><button class="cv-btn cv-bad" onclick="cvTrial('+q+',false)">✗ Không pass</button>';
    else if(t.status==='review') flow='<button class="cv-btn cv-ok" onclick="cvSetStatus('+q+',\'done\')">✓ Đạt</button><button class="cv-btn cv-bad" onclick="cvSetStatus('+q+',\'fix\')">✎ Cần sửa</button>';
    else if(t.status==='done') flow='';
    else flow='<button class="cv-btn" onclick="cvSetStatus('+q+',\'review\')">Gửi duyệt</button>';
    var act=flow+'<button class="cv-ico" title="Lịch sử feedback" onclick="cvToggle('+q+')"><i class="ti ti-message-2"></i></button>';
    if(t.group==='manual') act+='<button class="cv-ico" title="Sửa" onclick="cvEdit('+q+')"><i class="ti ti-pencil"></i></button><button class="cv-ico" title="Xoá" onclick="cvDel('+q+')"><i class="ti ti-trash"></i></button>';
    var tag = t.group==='manual' ? '<span class="pill gray" style="margin-left:4px">'+e_(CAT[t.cat]||CAT.khac)+'</span>' : '';
    return '<tr class="'+(t.status==='done'?'cv-done':'')+'">'
      +'<td><div class="dt-name">'+e_(t.title)+tag+'</div>'+(t.note?'<div class="cv-note">'+e_(t.note)+'</div>':'')+'</td>'
      +'<td class="nw">'+e_(t.owner||'—')+'</td>'
      +'<td class="nw">'+dueCell(t)+'</td>'
      +'<td class="nw">'+priPill(t.pri)+'</td>'
      +'<td class="nw">'+stCell+'</td>'
      +'<td class="nw" style="text-align:center">'+fixCell(t)+'</td>'
      +'<td class="nw" style="text-align:right">'+act+'</td>'
      +'</tr>'+(OPEN_ID===t.id ? histRow(t) : '');
  }

  function renderBody(){
    var host=document.getElementById('cv-groups'); if(!host) return;
    var all=itemsFor(S.month||curMonth());
    var total=0;
    host.innerHTML=GROUPS.map(function(g){
      var inG=all.filter(function(t){ return t.group===g[0]; });
      var done=inG.filter(function(t){ return t.status==='done'; }).length;
      var rows=inG.filter(passFilter).sort(sortItems); total+=rows.length;
      var pct=inG.length?Math.round(done/inG.length*100):0;
      var head='<div class="cv-sec"><div class="cv-sec-t"><i class="ti '+g[2]+'"></i>'+g[1]+'</div>'
        +(inG.length?'<div class="cv-bar"><div style="width:'+pct+'%"></div></div><span class="cv-sec-n">xong '+done+'/'+inG.length+' · '+pct+'%</span>':'<span class="cv-sec-n">không có việc</span>')
        +(g[0]==='manual' && !S.form?'<button class="btn-primary" onclick="cvAdd()" style="margin-left:auto"><i class="ti ti-plus"></i>Thêm việc</button>':'')+'</div>';
      if(!inG.length) return head;
      var body=rows.length?rows.map(rowHtml).join(''):'<tr><td colspan="7" class="dt-empty">Không có việc khớp bộ lọc.</td></tr>';
      return head+'<div class="table-wrap"><table class="dt cv-t"><thead><tr><th>Việc</th><th>Phụ trách</th><th>Deadline</th><th>Ưu tiên</th><th>Trạng thái</th><th style="text-align:center">Kết quả</th><th></th></tr></thead><tbody>'+body+'</tbody></table></div>';
    }).join('');
    var cnt=document.getElementById('cv-count'); if(cnt) cnt.textContent=total+' việc';
  }

  /* ================= [K] HIỆU SUẤT (tuần / tháng) =================
     Chỉ tính việc CÓ DEADLINE trong kỳ. Kỳ đang chạy: chỉ tính việc đã tới hạn (≤ hôm nay) hoặc đã xong.
     % Hoàn thành = xong / việc tính;  % Đúng hạn = xong ≤ deadline / xong;  % Đạt lần đầu = xong không bị sửa / xong (bỏ Pass/Không pass thử việc)
     Điểm hiệu suất = trung bình các chỉ số có dữ liệu (thang 100). Xếp loại: ≥90 Xuất sắc · ≥75 Tốt · ≥60 Đạt · <60 Cần cải thiện */
  function monthsBetween(s,e){ var out=[], ym=s.slice(0,7), end=e.slice(0,7), guard=0; while(ym<=end && guard++<40){ out.push(ym); ym=shiftMonth(ym,1); } return out; }
  function rangeItems(s,e){
    var seen={}, out=[];
    monthsBetween(s,e).forEach(function(ym){ itemsFor(ym).forEach(function(t){ if(seen[t.id]) return; seen[t.id]=1; if(t.due && t.due>=s && t.due<=e) out.push(t); }); });
    return out;
  }
  var LAUNCH='2026-09-24'; // ngày bắt đầu theo dõi trên web
  function pct(a,b){ return b? Math.round(a/b*1000)/10 : null; }
  function grade(sc){ if(sc==null) return '—'; return sc>=90?'Xuất sắc':(sc>=75?'Tốt':(sc>=60?'Đạt':'Cần cải thiện')); }
  function inR(d,s,e){ return !!d && d>=s && d<=e; }
  function scored(t){ return t.group==='manual' || (t.due && t.due>=LAUNCH); } // việc tự sinh có hạn trước ngày theo dõi: không chấm đúng hạn / quá hạn
  /* Mọi việc CÓ THAO TÁC trong kỳ (theo đúng ngày anh bấm trên tab Công việc) + việc tới hạn trong kỳ */
  function touched(s,e){
    var seen={}, out=[];
    rangeItems(s,e).forEach(function(t){ seen[t.id]=1; out.push(t); });
    Object.keys(S.tasks).forEach(function(id){
      if(seen[id]) return; var t=S.tasks[id]||{};
      var hit=inR(t.doneAt,s,e) || inR(t.createdAt,s,e) || (t.log||[]).some(function(x){ return inR(x.d,s,e); });
      if(hit){ seen[id]=1; out.push(Object.assign({id:id, group:t.group||'manual'}, t)); }
    });
    return out;
  }
  function perf(s,e){
    var today=todayISO(), cut=e<today?e:today;
    var all=touched(s,e);
    // Việc tính: việc XONG trong kỳ (theo ngày tick xong) + việc chưa xong đã tới hạn trong kỳ
    var doneIn=all.filter(function(t){ return t.status==='done' && inR(t.doneAt,s,e); });
    var openDue=all.filter(function(t){ return t.status!=='done' && scored(t) && inR(t.due,s,cut); });
    var base=doneIn.concat(openDue), done=doneIn;
    var otBase=done.filter(function(t){ return scored(t); });
    var onTime=otBase.filter(function(t){ return t.doneAt<=t.due; });
    var graded=done.filter(function(t){ return t.kind!=='tv'; });
    var firstOk=graded.filter(function(t){ return !fixes(t); });
    var fb=[]; Object.keys(S.tasks).forEach(function(id){ var t=S.tasks[id]||{}; (t.log||[]).forEach(function(x){ if(x.t==='fix' && inR(x.d,s,e)) fb.push({d:x.d, title:t.title, note:x.note||''}); }); });
    fb.sort(function(a,b){ return a.d<b.d?-1:1; });
    var r={ s:s, e:e, items:all, base:base, done:done, otBase:otBase, onTime:onTime, graded:graded, firstOk:firstOk, fb:fb,
      overdue: openDue.filter(function(t){ return t.due<today; }),
      late: otBase.filter(function(t){ return t.doneAt>t.due; }),
      pending: all.filter(function(t){ return t.status!=='done' && inR(t.due,s,e) && t.due>=today; }),
      pDone:pct(done.length,base.length), pOnTime:pct(onTime.length,otBase.length), pFirst:pct(firstOk.length,graded.length) };
    var arr=[r.pDone,r.pOnTime,r.pFirst].filter(function(x){return x!=null;});
    r.score = arr.length ? Math.round(arr.reduce(function(a,b){return a+b;},0)/arr.length) : null;
    r.grade = grade(r.score);
    return r;
  }
  /* Các thao tác trong kỳ của 1 việc — để báo cáo ghi đúng ngày anh bấm */
  function actions(t,s,e){
    var out=[], sub=0, fx=0;
    if(inR(t.createdAt,s,e)) out.push([t.createdAt, t.group==='manual'?'Tạo việc':'Bắt đầu theo dõi']);
    (t.log||[]).forEach(function(x){
      if(x.t==='submit') sub++; if(x.t==='fix') fx++;
      if(!inR(x.d,s,e)) return;
      if(x.t==='submit') out.push([x.d,'Gửi duyệt lần '+sub]);
      else if(x.t==='fix') out.push([x.d,'Cần sửa lần '+fx]);
      else if(x.t==='ok') out.push([x.d,'Sếp duyệt đạt']);
      else if(x.t==='result') out.push([x.d, x.note||'Kết quả']);
      else if(x.t==='st') out.push([x.d, 'Chuyển "'+(ST[x.to]||x.to)+'"']);
    });
    if(t.status==='done' && inR(t.doneAt,s,e) && !out.some(function(o){ return /duyệt đạt|pass/i.test(o[1]); })) out.push([t.doneAt,'Hoàn thành']);
    out.sort(function(a,b){ return a[0]<b[0]?-1:(a[0]>b[0]?1:0); });
    return out;
  }
  function weekRange(off, ref){ var d=ref?new Date(+ref.slice(0,4),+ref.slice(5,7)-1,+ref.slice(8,10)):new Date(); d.setHours(0,0,0,0); var day=(d.getDay()+6)%7; var mon=new Date(d); mon.setDate(d.getDate()-day+off*7); var sun=new Date(mon); sun.setDate(mon.getDate()+6); return [iso(mon), iso(sun)]; }
  function fmtP(v){ return v==null?'—':(Math.round(v)+'%'); }
  /* Đánh giá tự động, viết từ việc cụ thể trong kỳ */
  function evalHtml(r, prev, label){
    if(!r.base.length && !r.done.length) return '<div class="cv-eval"><div class="cv-eval-h">Đánh giá '+e_(label)+'</div><div class="dt-muted">Chưa có việc hoàn thành hoặc tới hạn trong kỳ để đánh giá.</div></div>';
    var li=[];
    li.push('<b>Kết quả:</b> hoàn thành '+r.done.length+' việc'+(r.overdue.length?', còn '+r.overdue.length+' việc tới hạn chưa xong':'')+' ('+fmtP(r.pDone)+'); đúng hạn '+r.onTime.length+'/'+r.otBase.length+' ('+fmtP(r.pOnTime)+'); đạt ngay lần đầu '+r.firstOk.length+'/'+r.graded.length+' ('+fmtP(r.pFirst)+').');
    if(prev && prev.score!=null && r.score!=null){ var d=r.score-prev.score; li.push('<b>So với kỳ trước:</b> '+(d===0?'giữ nguyên':(d>0?'tăng ':'giảm ')+Math.abs(d)+' điểm')+' ('+prev.score+' → '+r.score+').'); }
    var good=r.firstOk.filter(function(t){ return t.kind!=='tv' && (!scored(t) || t.doneAt<=t.due); }).sort(function(a,b){ return (PRI_W[a.pri]||1)-(PRI_W[b.pri]||1); });
    if(good.length) li.push('<b>Làm tốt:</b> '+good.slice(0,4).map(function(t){ return e_(t.title); }).join('; ')+(good.length>4?' và '+(good.length-4)+' việc khác':'')+' — hoàn thành, không phải sửa.');
    var bad=[], reason={}, order=[];
    function why(t,msg){ if(!reason[t.id]){ reason[t.id]={t:t, m:[]}; order.push(t.id); } reason[t.id].m.push(msg); }
    r.overdue.forEach(function(t){ why(t,'<span class="cv-e-red">quá hạn '+(-daysTo(t.due))+' ngày, chưa xong</span>'); });
    r.late.forEach(function(t){ var d=Math.round((new Date(t.doneAt)-new Date(t.due))/86400000); why(t,'<span class="cv-e-amb">xong trễ '+d+' ngày</span>'); });
    r.done.concat(r.overdue).forEach(function(t){ var n=fixes(t); if(n){ var last=(t.log||[]).filter(function(x){return x.t==='fix';}).pop(); why(t,'<span class="cv-e-red">sửa '+n+' lần'+(last&&last.note?': "'+e_(last.note)+'"':'')+'</span>'); } });
    order.forEach(function(id){ var o=reason[id]; bad.push(e_(o.t.title)+' — '+o.m.join(' · ')); });
    if(bad.length) li.push('<b>Cần cải thiện:</b><ul>'+bad.slice(0,8).map(function(x){return '<li>'+x+'</li>';}).join('')+(bad.length>8?'<li>… và '+(bad.length-8)+' mục khác</li>':'')+'</ul>');
    else li.push('<b>Cần cải thiện:</b> không có — không việc nào quá hạn, trễ hạn hay phải sửa.');
    if(r.pending.length) li.push('<b>Còn lại trong kỳ:</b> '+r.pending.length+' việc chưa tới hạn.');
    return '<div class="cv-eval"><div class="cv-eval-h">Đánh giá '+e_(label)+' · <span class="cv-grade cv-g-'+(r.score==null?'na':(r.score>=75?'good':(r.score>=60?'ok':'bad')))+'">'+(r.score==null?'—':r.score+'/100')+' · '+r.grade+'</span></div><div class="cv-eval-b">'+li.map(function(x){return '<p>'+x+'</p>';}).join('')+'</div></div>';
  }
  function delta(cur, prev, unit){ if(cur==null||prev==null) return ''; var d=Math.round((cur-prev)*10)/10; if(d===0) return '<span class="cv-d flat">= kỳ trước</span>'; return '<span class="cv-d '+(d>0?'up':'down')+'">'+(d>0?'▲':'▼')+' '+Math.abs(d)+(unit||'')+'</span>'; }
  function deltaInv(cur, prev){ if(cur==null||prev==null) return ''; var d=cur-prev; if(d===0) return '<span class="cv-d flat">= kỳ trước</span>'; return '<span class="cv-d '+(d<0?'up':'down')+'">'+(d>0?'▲':'▼')+' '+Math.abs(d)+'</span>'; }

  function perfSection(ym){
    var s=ym+'-01', e=ym+'-'+p2(lastDay(ym)), pv=shiftMonth(ym,-1);
    var r=perf(s,e), rp=perf(pv+'-01', pv+'-'+p2(lastDay(pv)));
    var card=function(lbl,val,sub,d,cls){ return '<div class="cv-pc'+(cls?' '+cls:'')+'"><div class="cv-pc-l">'+lbl+'</div><div class="cv-pc-v">'+val+'</div><div class="cv-pc-s">'+(sub||'')+'</div><div class="cv-pc-d">'+(d||'')+'</div></div>'; };
    var gcls=r.score==null?'':(r.score>=75?'good':(r.score>=60?'ok':'bad'));
    var cards='<div class="cv-pcs">'
      +card('Điểm hiệu suất', r.score==null?'—':r.score+'<small>/100</small>', r.grade, delta(r.score,rp.score,'đ'), 'main '+gcls)
      +card('% Hoàn thành', fmtP(r.pDone), r.done.length+' xong / '+r.base.length+' việc', delta(r.pDone,rp.pDone,'đ'))
      +card('% Đúng hạn', fmtP(r.pOnTime), r.onTime.length+'/'+r.otBase.length+' việc xong', delta(r.pOnTime,rp.pOnTime,'đ'))
      +card('% Đạt ngay lần đầu', fmtP(r.pFirst), r.firstOk.length+'/'+r.graded.length+' việc xong', delta(r.pFirst,rp.pFirst,'đ'))
      +card('Số lần sửa', r.fb.length, 'feedback trong tháng', deltaInv(r.fb.length,rp.fb.length), r.fb.length?'warn':'')
      +'</div>';
    return '<div class="cv-perf"><div class="cv-perf-h"><i class="ti ti-chart-line"></i>Hiệu suất '+monthLabel(ym).toLowerCase()+'<span class="cv-perf-note">Tính theo ngày anh thao tác: việc xong trong kỳ + việc tới hạn chưa xong · Đúng hạn chỉ chấm việc có hạn từ 24/09/2026 · Điểm = trung bình 3 tỷ lệ · ≥90 Xuất sắc · ≥75 Tốt · ≥60 Đạt</span></div>'
      +cards
      +'<div class="cv-prow"><div class="cv-pbox"><div class="cv-pbox-t">Xu hướng 8 tuần (nhãn = ngày thứ 2 của tuần)</div><div id="cv-ch-trend" class="cv-ch"></div></div>'
      +'<div class="cv-pbox"><div class="cv-pbox-t">Trạng thái việc trong tháng</div><div id="cv-ch-status" class="cv-ch"></div></div></div>'
      +'<div class="cv-prow"><div class="cv-pbox"><div class="cv-pbox-t">Hoàn thành theo nhóm (việc tới hạn)</div><div id="cv-ch-group" class="cv-ch sm"></div></div>'
      +'<div class="cv-pbox">'+evalHtml(r, rp, monthLabel(ym).toLowerCase())+'</div></div>'
      +'</div>';
  }
  var CH=window.__cvCharts=window.__cvCharts||{};
  function mkChart(id){ if(typeof echarts==='undefined') return null; var el=document.getElementById(id); if(!el) return null; if(CH[id]){ try{CH[id].dispose();}catch(e){} } CH[id]=echarts.init(el); return CH[id]; }
  function drawCharts(ym){
    var FONT="'Be Vietnam Pro',sans-serif", teal='#35655B', teal2='#8FB3AC', clay='#B07A43', rust='#A65A4B', muted='#8B897E', grid='#f0ebe0';
    var ref=ym===curMonth()?todayISO():(ym+'-'+p2(lastDay(ym)));
    var lab=[], sD=[], sO=[], sF=[], sFix=[], sSc=[];
    for(var k=-7;k<=0;k++){ var w=weekRange(k, ref), r=perf(w[0],w[1]); lab.push(dmy(w[0]).slice(0,5)); sD.push(r.pDone); sO.push(r.pOnTime); sF.push(r.pFirst); sFix.push(r.fb.length); sSc.push(r.score); }
    var c1=mkChart('cv-ch-trend');
    if(c1) c1.setOption({ textStyle:{fontFamily:FONT}, grid:{left:8,right:8,top:34,bottom:4,containLabel:true},
      legend:{top:0,left:0,itemWidth:14,itemHeight:8,textStyle:{color:muted,fontSize:11},data:['Điểm','% Hoàn thành','% Đúng hạn','% Đạt lần đầu','Lần sửa']},
      tooltip:{trigger:'axis',textStyle:{fontSize:12},valueFormatter:function(v){return v==null?'—':v;}},
      xAxis:{type:'category',data:lab,axisTick:{show:false},axisLine:{lineStyle:{color:'#E4DECF'}},axisLabel:{color:muted,fontSize:11}},
      yAxis:[{type:'value',min:0,max:100,splitLine:{lineStyle:{color:grid}},axisLabel:{color:muted,fontSize:11,formatter:'{value}%'}},{type:'value',minInterval:1,splitLine:{show:false},axisLabel:{color:muted,fontSize:11}}],
      series:[{name:'Lần sửa',type:'bar',yAxisIndex:1,data:sFix,barWidth:'38%',itemStyle:{color:'rgba(166,90,75,.28)',borderRadius:[3,3,0,0]}},
        {name:'Điểm',type:'line',data:sSc,connectNulls:true,symbolSize:7,lineStyle:{width:3,color:'#21303B'},itemStyle:{color:'#21303B'}},
        {name:'% Hoàn thành',type:'line',data:sD,connectNulls:true,symbolSize:5,lineStyle:{width:2,color:teal},itemStyle:{color:teal}},
        {name:'% Đúng hạn',type:'line',data:sO,connectNulls:true,symbolSize:5,lineStyle:{width:2,color:clay},itemStyle:{color:clay}},
        {name:'% Đạt lần đầu',type:'line',data:sF,connectNulls:true,symbolSize:5,lineStyle:{width:2,color:teal2,type:'dashed'},itemStyle:{color:teal2}}] });
    var its=itemsFor(ym), today=todayISO();
    var cnt={done:0,doing:0,review:0,fix:0,over:0,todo:0};
    its.forEach(function(t){ if(t.status==='done') cnt.done++; else if(t.status==='fix') cnt.fix++; else if(t.status==='review') cnt.review++; else if(t.due && t.due<today) cnt.over++; else if(t.status==='doing') cnt.doing++; else cnt.todo++; });
    var c2=mkChart('cv-ch-status');
    if(c2) c2.setOption({ textStyle:{fontFamily:FONT}, tooltip:{trigger:'item',formatter:'{b}: {c} ({d}%)'},
      legend:{orient:'vertical',right:0,top:'middle',itemWidth:10,itemHeight:10,textStyle:{color:muted,fontSize:11}},
      series:[{type:'pie',radius:['52%','78%'],center:['36%','50%'],avoidLabelOverlap:true,label:{show:true,position:'center',formatter:function(){ return its.length?Math.round(cnt.done/its.length*100)+'%\nxong':''; },fontSize:16,fontWeight:600,color:'#21303B',lineHeight:20},labelLine:{show:false},
        data:[{name:'Xong',value:cnt.done,itemStyle:{color:teal}},{name:'Đang làm',value:cnt.doing,itemStyle:{color:teal2}},{name:'Chờ duyệt',value:cnt.review,itemStyle:{color:clay}},
              {name:'Cần sửa',value:cnt.fix,itemStyle:{color:rust}},{name:'Quá hạn',value:cnt.over,itemStyle:{color:'#D9A99E'}},{name:'Chưa làm (còn hạn)',value:cnt.todo,itemStyle:{color:'#E4DECF'}}].filter(function(x){return x.value>0;})}] });
    var r=perf(ym+'-01', ym+'-'+p2(lastDay(ym)));
    var gN=['Cố định','Tự động','Tự thêm'];
    var gd=GROUPS.map(function(g){ return r.base.filter(function(t){return t.group===g[0] && t.status==='done';}).length; });
    var gr=GROUPS.map(function(g){ return r.base.filter(function(t){return t.group===g[0] && t.status!=='done';}).length; });
    var c3=mkChart('cv-ch-group');
    if(c3) c3.setOption({ textStyle:{fontFamily:FONT}, grid:{left:8,right:40,top:6,bottom:4,containLabel:true}, tooltip:{trigger:'axis',axisPointer:{type:'shadow'}},
      xAxis:{type:'value',minInterval:1,splitLine:{lineStyle:{color:grid}},axisLabel:{color:muted,fontSize:11}},
      yAxis:{type:'category',data:gN,axisTick:{show:false},axisLine:{show:false},axisLabel:{color:'#414B54',fontSize:12}},
      series:[{name:'Xong',type:'bar',stack:'a',data:gd,barWidth:16,itemStyle:{color:teal}},
        {name:'Chưa xong',type:'bar',stack:'a',data:gr,itemStyle:{color:'#E4DECF'},label:{show:true,position:'right',color:muted,fontSize:11,formatter:function(p){ var t=gd[p.dataIndex]+gr[p.dataIndex]; return t?Math.round(gd[p.dataIndex]/t*100)+'%':''; }}}] });
    if(!window.__cvRz){ window.__cvRz=1; window.addEventListener('resize',function(){ Object.keys(CH).forEach(function(k){ try{CH[k].resize();}catch(e){} }); }); }
  }

  /* ---- Cho tab Báo cáo dùng chung ---- */
  window.cvReportSection=function(p, pv, mode){
    css(); // nạp CSS khối Đánh giá (cv-eval) cả khi chưa mở tab Công việc HR
    if(!S.loaded){ load(); return '<div class="bc-sec full"><div class="bc-sh"><span class="dot"></span><h3>Hiệu suất công việc HR</h3></div><div class="muted">Đang tải danh sách công việc…</div></div>'; }
    var s=iso(p.start), e=iso(p.end), r=perf(s,e), rp=perf(iso(pv.start), iso(pv.end));
    var lbl=(mode==='week'?'tuần ':'')+(typeof bcLabel==='function'?bcLabel(mode,p):s+' – '+e);
    var stat=function(l,v,d,sub){ return '<div class="bc-stat"><div class="s-l">'+l+(sub?'<div class="sub">'+sub+'</div>':'')+'</div><div class="s-r"><span class="s-v">'+v+'</span>'+(d||'')+'</div></div>'; };
    var dl=function(a,b){ return (a==null||b==null)?'':(typeof bcDeltaPct==='function'?bcDeltaPct(a,b):''); };
    var rowT=function(t){ var n=fixes(t), ac=actions(t,s,e); return '<tr><td>'+e_(t.title)+'</td><td class="nw">'+(t.due?dmy(t.due):'—')+'</td><td>'+(ac.length?ac.map(function(x){ return '<span class="nw">'+dmy(x[0]).slice(0,5)+' '+e_(x[1])+'</span>'; }).join('<br>'):'<span class="muted">—</span>')+'</td><td class="nw">'+(t.doneAt?dmy(t.doneAt):'—')+'</td><td class="nw">'+(t.kind==='tv'&&t.result?(t.result==='pass'?'Pass':'Không pass'):(t.status==='done'?('Đạt lần '+(n+1)):(t.due&&t.due<todayISO()&&scored(t)?'<span class="pill red">Quá hạn</span>':ST[t.status])))+'</td></tr>'; };
    var list=r.items.slice().sort(sortItems);
    var tbl=list.length?'<table class="bc-tbl"><thead><tr><th>Việc</th><th>Deadline</th><th>Thao tác trong kỳ</th><th>Xong ngày</th><th>Kết quả</th></tr></thead><tbody>'+list.map(rowT).join('')+'</tbody></table>':'<div class="muted">Không có việc nào trong kỳ.</div>';
    var fbT=r.fb.length?'<table class="bc-tbl"><thead><tr><th>Ngày</th><th>Việc</th><th>Feedback</th></tr></thead><tbody>'+r.fb.map(function(x){ return '<tr><td class="nw">'+dmy(x.d)+'</td><td>'+e_(x.title)+'</td><td>'+e_(x.note||'—')+'</td></tr>'; }).join('')+'</tbody></table>':'<div class="muted" style="padding:6px 0">Không có feedback cần sửa trong kỳ.</div>';
    return '<div class="bc-sec full"><div class="bc-sh"><span class="dot"></span><h3>Hiệu suất công việc HR</h3>'
      +(r.score!=null?'<span class="sh-d '+(r.score>=75?'up':(r.score>=60?'':'down'))+'">'+r.score+'/100 · '+r.grade+'</span>':'')+'</div>'
      +'<div class="bc-cap">Lấy đúng theo thao tác trên tab Công việc HR: việc anh tạo / gửi duyệt / tick xong trong kỳ + việc tới hạn trong kỳ. Điểm = trung bình % hoàn thành, % đúng hạn, % đạt ngay lần đầu.</div>'
      +'<div class="bc-row2"><div>'
      +stat('Điểm hiệu suất', r.score==null?'—':r.score+'/100', (r.score!=null&&rp.score!=null&&typeof bcDelta==='function')?bcDelta(r.score,rp.score,true):'', r.grade)
      +stat('% Hoàn thành', fmtP(r.pDone), dl(r.pDone,rp.pDone), r.done.length+' xong / '+r.base.length+' việc (xong trong kỳ + tới hạn chưa xong)')
      +stat('% Đúng hạn', fmtP(r.pOnTime), dl(r.pOnTime,rp.pOnTime), r.onTime.length+'/'+r.otBase.length+' việc xong có hạn')
      +stat('% Đạt ngay lần đầu', fmtP(r.pFirst), dl(r.pFirst,rp.pFirst), r.firstOk.length+'/'+r.graded.length+' việc xong')
      +stat('Số lần sửa (feedback)', r.fb.length, typeof bcDelta==='function'?bcDelta(r.fb.length,rp.fb.length,false):'', '')
      +'</div><div>'+evalHtml(r, rp, lbl)+'</div></div>'
      +'<div class="bc-minih">Danh sách việc trong kỳ</div>'+tbl
      +'<div class="bc-minih">Feedback của sếp trong kỳ</div>'+fbT
      +'</div>';
  };
  window.cvPerfScore=function(p){ if(!S.loaded) return null; return perf(iso(p.start), iso(p.end)).score; };

  window.renderCongViec=function(){
    css();
    if(S.form && document.getElementById('cvf-title')) readForm(); // giữ chữ đang gõ khi trang tự vẽ lại
    if(!S.month) S.month=curMonth();
    if(!S.loaded){ load(); return '<div class="page-head"><div class="page-h1">Công việc HR</div></div>'+(window.loadingBox?window.loadingBox():'Đang tải…'); }
    if(window.HR && !window.HR.loaded && !window.HR.error) return (window.loadingBox?window.loadingBox():'Đang tải…');
    var ym=S.month, items=itemsFor(ym), open=items.filter(isOpen);
    var done=items.filter(function(t){ return t.status==='done'; });
    var over=open.filter(function(t){ var n=daysTo(t.due); return n!==null && n<0; }).length;
    var review=items.filter(function(t){ return t.status==='review'; }).length;
    var graded=done.filter(function(t){ return t.kind!=='tv'; }); // kết quả Pass/Không pass thử việc không tính chất lượng việc
    var firstOk=graded.filter(function(t){ return !fixes(t); }).length;
    var rate=graded.length ? Math.round(firstOk/graded.length*100)+'%' : '—';
    var fixN=0; items.forEach(function(t){ fixN+=fixes(t); });
    var pct=items.length?Math.round(done.length/items.length*100):0;
    var small=function(s){ return '<span style="font-size:13px;color:var(--muted);font-family:inherit"> '+s+'</span>'; };
    var kpis=[['Hoàn thành', pct+'%'+small(done.length+'/'+items.length),'ti-circle-check',''],['Quá hạn',over,'ti-alert-triangle',over?'danger':''],['Chờ sếp duyệt',review,'ti-hourglass',review?'warn':''],
      ['Đạt ngay lần đầu',rate+(graded.length?small(firstOk+'/'+graded.length):''),'ti-award',''],['Số lần sửa',fixN,'ti-arrow-back-up',fixN?'warn':'']]
      .map(function(k){ return '<div class="stat'+(k[3]==='warn'?' stat-warn':(k[3]==='danger'?' stat-danger':''))+'"><div class="stat-top"><span class="stat-lbl">'+k[0]+'</span><i class="ti '+k[2]+'"></i></div><div class="stat-val">'+k[1]+'</div></div>'; }).join('');
    var sel=function(id,opts,v){ return '<select id="'+id+'" onchange="cvOn()">'+opts.map(function(o){ return '<option value="'+e_(o[0])+'"'+(o[0]===v?' selected':'')+'>'+e_(o[1])+'</option>'; }).join('')+'</select>'; };
    var html='<div class="page-head"><div class="page-h1">Công việc HR</div>'
      +'<div class="page-lead">Theo từng tháng: việc cố định hằng tháng, việc web tự sinh từ dữ liệu (sinh nhật, người mới, HĐ/thử việc, hồ sơ) và việc anh tự thêm. Nộp cho sếp: <b>Gửi duyệt</b> → <b>✓ Đạt</b> hoặc <b>✎ Cần sửa</b> (ghi nội dung). Không feedback = đạt ngay lần đầu.</div></div>';
    html+='<div class="cv-month"><button class="cv-btn" onclick="cvMonth(-1)">‹</button><div class="cv-m-lbl">'+monthLabel(ym)+'</div><button class="cv-btn" onclick="cvMonth(1)">›</button>'
      +(ym!==curMonth()?'<button class="cv-btn" onclick="cvMonth(0)">Tháng này</button>':'')+'</div>';
    if(S.err) html+='<div class="cv-banner"><i class="ti ti-wifi-off"></i>Không đọc được danh sách việc ('+e_(S.err)+'). <button class="cv-btn" onclick="cvReload()">Thử lại</button></div>';
    if(S.emptyCloud) html+='<div class="cv-banner"><i class="ti ti-alert-triangle"></i>Danh sách việc trên cloud đang trống, nhưng máy này còn bản lưu. <button class="cv-btn" onclick="cvRestore()">Khôi phục</button></div>';
    if(ym===curMonth()){
      var bl=backlog();
      if(bl.length) html+='<div class="cv-banner"><i class="ti ti-history"></i>Các tháng trước còn việc chưa xong (HĐ / thử việc / việc tự thêm):'
        +bl.map(function(b){ return '<button class="cv-chip" onclick="cvGoMonth(\''+b[0]+'\')">'+monthLabel(b[0]).replace('Tháng ','T')+': '+b[1]+'</button>'; }).join('')+'</div>';
    }
    html+=perfSection(ym)
      +formHtml()
      +'<div class="toolbar">'
      +'<div class="tb-search"><i class="ti ti-search"></i><input id="cv-q" placeholder="Tìm việc, người, phòng…" value="'+e_(S.f.q)+'" oninput="cvOn()"></div>'
      +sel('cv-st',[['','Mọi trạng thái'],['open','Chưa xong'],['todo','Chưa làm'],['doing','Đang làm'],['review','Chờ duyệt'],['fix','Cần sửa'],['done','Xong'],['hasfb','Có feedback sửa']],S.f.st)
      +sel('cv-owner',[['','Mọi người phụ trách']].concat(ownersList().map(function(o){return [o,o];})),S.f.owner)
      +sel('cv-cat',[['','Mọi loại (việc tự thêm)']].concat(Object.keys(CAT).map(function(k){return [k,CAT[k]];})),S.f.cat)
      +'<span class="tb-count" id="cv-count"></span>'
      +'</div>'
      +'<div id="cv-groups"></div>';
    setTimeout(function(){ renderBody(); drawCharts(ym); },0);
    return html;
  };
})();
