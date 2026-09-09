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
      skeleton:'charts' }
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

/* ---- Data loader ---- */
function loadData(){
  HR.error=null;
  fetch(API_URL)
    .then(function(r){ return r.json(); })
    .then(function(d){
      HR.loaded=true; HR.updated=d.updated||''; HR.nhansu=d.nhansu||[]; HR.tuyendung=d.tuyendung||[]; HR.viTriList=d.viTriList||[];
      var up=document.getElementById('tb-note'); if(up) up.textContent = 'Cập nhật: '+HR.updated;
      if(currentTab) go(currentTab); // vẽ lại tab hiện tại khi data về
    })
    .catch(function(e){
      HR.error = e.message||'Lỗi kết nối';
      if(currentTab) go(currentTab);
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
function parseDMY(s){ var p=String(s||'').split('/'); return p.length===3? new Date(+p[2],+p[1]-1,+p[0]) : null; }
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

/* ---- Skeleton (khung gợi ý) ---- */
function skeleton(kind){
  if(kind==='kpi') return '<div class="skeleton-grid">'+Array.from({length:4}).map(function(){return '<div class="sk-card"><div class="sk-tag">Chỉ số</div><div class="sk-num"></div><div class="sk-line w60"></div></div>';}).join('')+'</div>';
  if(kind==='charts') return '<div class="skeleton-grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));">'+Array.from({length:2}).map(function(){return '<div class="sk-card" style="min-height:200px;"><div class="sk-tag">Biểu đồ</div><div class="sk-line w40"></div><div style="flex:1;border-radius:8px;background:var(--line-soft);margin-top:6px;"></div></div>';}).join('')+'</div>';
  if(kind==='source') return '<div class="skeleton-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));">'+['NhanSu','TuyenDung','ChamCong','HopDong'].map(function(s){return '<div class="sk-card" style="min-height:88px;"><div class="sk-tag" style="color:var(--teal);">'+s+'</div><div class="sk-line w80"></div><div class="sk-line w60"></div></div>';}).join('')+'</div>';
  return '';
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
    '</div></div>'+(item.skeleton?skeleton(item.skeleton):'');
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
  var dangLam = ns.filter(function(e){ return e.tinhTrang!=='Nghỉ việc'; }).length;
  var nghi = ns.filter(function(e){ return e.tinhTrang==='Nghỉ việc'; }).length;
  var phongList = []; ns.forEach(function(e){ if(e.phong && phongList.indexOf(e.phong)<0) phongList.push(e.phong); });
  var ttList = []; ns.forEach(function(e){ if(e.tinhTrang && ttList.indexOf(e.tinhTrang)<0) ttList.push(e.tinhTrang); });
  var thieuHS = ns.filter(function(e){ return e.tinhTrang!=='Nghỉ việc' && /thiếu/i.test(e.tinhTrangHoSo||''); }).length;

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

function hdActive(){ return HR.nhansu.filter(function(e){ return e.tinhTrang!=='Nghỉ việc'; }); }
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
    '</div><div id="kcv-result"></div>';
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
    var r=await fetch(API_URL,{ method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ key:API_KEY, viTri:vt, items:items }) });
    var d=await r.json();
    if(d.ok){
      status.textContent='';
      document.getElementById('kcv-result').innerHTML='<div class="kcv-ok"><i class="ti ti-circle-check"></i> Đã nạp '+d.added.length+' CV vào Tuyển dụng:</div>'+
        '<div class="table-wrap" style="margin-top:10px;max-width:720px;"><table class="dt"><thead><tr><th>Mã UV</th><th>Họ tên</th><th>Vị trí</th><th>Link CV</th></tr></thead><tbody>'+
        d.added.map(function(a){return '<tr><td class="dt-mono">'+esc(a.maUV)+'</td><td class="dt-name">'+esc(a.hoTen)+'</td><td>'+esc(a.viTri)+'</td><td><a href="'+esc(a.url)+'" target="_blank" rel="noopener">Mở CV</a></td></tr>';}).join('')+'</tbody></table></div>';
      kcvFiles=[]; kcvRenderList();
      loadData();
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
  return [
    {label:'CV nộp',              sub:'tổng hồ sơ',   n:total},
    {label:'HR duyệt CV',         sub:'scan pass',    n:list.filter(function(c){return (c.hrReview||'').trim()===TDPASS.hr;}).length},
    {label:'Line Manager duyệt',  sub:'phù hợp',      n:list.filter(function(c){return (c.lmReview||'').trim()===TDPASS.lm;}).length},
    {label:'Phỏng vấn vòng 1',    sub:'pass',         n:list.filter(function(c){return (c.r1||'').trim()===TDPASS.r1;}).length},
    {label:'Phỏng vấn vòng 2',    sub:'pass',         n:list.filter(function(c){return (c.r2||'').trim()===TDPASS.r2;}).length},
    {label:'Trúng tuyển',         sub:'final',        n:list.filter(function(c){return (c.final||'').trim()===TDPASS.fin;}).length}
  ];
}

/* CV theo tháng từ ngày nộp dd/mm/yyyy */
function tdMonths(list){
  var m={};
  list.forEach(function(c){
    var p=String(c.ngayNop||'').split('/');
    if(p.length===3){ var k=p[1].padStart(2,'0')+'/'+p[2]; m[k]=(m[k]||0)+1; }
  });
  return Object.keys(m).map(function(k){return {k:k,n:m[k]};}).sort(function(a,b){
    var A=a.k.split('/'), B=b.k.split('/');
    return (A[1]-B[1])||(A[0]-B[0]);
  });
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
    if(ptFilter.month){ var p=String(c.ngayNop||'').split('/'); var k=p.length===3?(p[1].padStart(2,'0')+'/'+p[2]):''; if(k!==ptFilter.month) return false; }
    return true;
  });
}
function ptMonthsHire(list){
  var m={};
  list.forEach(function(c){
    var p=String(c.ngayNop||'').split('/'); if(p.length!==3) return;
    var k=p[1].padStart(2,'0')+'/'+p[2];
    if(!m[k]) m[k]={k:k,cv:0,hire:0};
    m[k].cv++; if((c.final||'').trim()===TDPASS.fin) m[k].hire++;
  });
  return Object.keys(m).map(function(k){return m[k];}).sort(function(a,b){var A=a.k.split('/'),B=b.k.split('/');return (A[1]-B[1])||(A[0]-B[0]);});
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
var PTC = { teal:'#35655B', teal2:'#4A8375', clay:'#B07A43', rust:'#A65A4B', muted:'#8B897E', faint:'#A9A599',
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
  var convs=fn.map(function(s,i){return i===0?null:pct(s.n,fn[i-1].n);});
  ptMk('pt-funnel',{
    tooltip:ptTip({trigger:'item',formatter:function(p){var i=p.dataIndex;var cv=i===0?'100% tổng':(convs[i]+'% vs bước trên · '+pct(fn[i].n,fn[0].n)+'% tổng');return '<b>'+p.name+'</b><br/>'+p.value+' ứng viên<br/><span style="color:'+PTC.muted+'">'+cv+'</span>';}}),
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
    tooltip:ptTip({trigger:'item',formatter:function(p){return '<b>'+p.name+'</b><br/>'+p.value+' CV · '+p.percent+'%';}}),
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
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){var s='<b>Tháng '+a[0].axisValue+'</b>';a.forEach(function(x){s+='<br/>'+x.marker+x.seriesName+': <b>'+x.value+'</b>';});var cv=a[0].value,hi=(a[1]?a[1].value:0);s+='<br/><span style="color:'+PTC.muted+'">Tỷ lệ đậu: '+(cv?(hi/cv*100).toFixed(1):0)+'%</span>';return s;}}),
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
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){return '<b>'+a[0].axisValue+'</b><br/>'+a[0].value+' ứng viên';}}),
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
  var moAll=tdMonths(all);
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
  var convsAll=fnAll.map(function(s,i){return i===0?null:pct(s.n,fnAll[i-1].n);});
  var minCA=101,minIA=-1; convsAll.forEach(function(c,i){if(c!==null&&c<minCA){minCA=c;minIA=i;}});
  var insights=[
    'Điểm nghẽn phễu: <b>'+esc(fnAll[minIA].label)+'</b> — chỉ '+convsAll[minIA]+'% qua bước này.',
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
  if(id==='ho-so') content.innerHTML=renderHoSo();
  else if(id==='hop-dong') content.innerHTML=renderHopDong();
  else if(id==='tuyen-dung') content.innerHTML=renderTuyenDung();
  else if(id==='pt-tuyen-dung') content.innerHTML=renderPhanTichTuyenDung();
  else if(id==='kho-cv') content.innerHTML=renderKhoCV();
  else content.innerHTML='<div class="page-head"><div class="page-h1">'+esc(item.label)+'</div><div class="page-lead">'+esc(item.lead||'')+'</div></div>'+emptyState(item, group);
  content.scrollTop=0;
}

/* ---- Khởi động ---- */
renderNav();
loadData();
go('overview');
