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
    { id:'tuyen-dung', label:'Tuyển dụng', icon:'ti-file-description',
      lead:'Danh sách CV & vị trí tuyển dụng — nơi tra cứu và cập nhật trạng thái ứng viên.',
      points:['Danh sách vị trí đang mở','Bảng CV theo vị trí & trạng thái','Ghi chú kết quả từng vòng'] },
    { id:'kho-cv',   label:'Kho CV', icon:'ti-folder',
      lead:'Kho lưu và tra cứu hồ sơ CV ứng viên.',
      points:['Lưu trữ CV theo vị trí','Tra cứu nhanh','Gắn kết với pipeline tuyển dụng'] }
  ]},
  { group:'Phân tích', star:true, items:[
    { id:'pt-tuyen-dung', label:'Hiệu quả tuyển dụng', icon:'ti-activity', badge:'new',
      lead:'Funnel & hiệu quả nguồn CV: nơi biến tuyển dụng thành quyết định.',
      points:['Funnel: CV → phỏng vấn → offer → nhận việc','Tỷ lệ chuyển đổi từng bước','Hiệu quả theo nguồn CV, time-to-hire'],
      skeleton:'charts' },
    { id:'bao-cao', label:'Báo cáo', icon:'ti-report', badge:'new',
      lead:'Báo cáo tuyển dụng theo tuần / tháng — xuất PDF A4.',
      points:['Toggle Tuần / Tháng, chọn kỳ bất kỳ','So sánh kỳ trước','In / Xuất PDF A4'] }
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




/* ============================================================
   TAB: HỢP ĐỒNG (chỉ nhân sự đang làm)
   ============================================================ */



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
  if(kcvTab==='ai') return kcvTabsHtml()+renderCvAI(); // [CVAI] tab con Chấm CV theo JD
  if(HR.error) return errorBox();
  if(!HR.loaded) return loadingBox();
  setTimeout(kcvRenderList,0);
  return ''+kcvTabsHtml()+
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
var PTC = { teal:'#2FB59E', teal2:'#2FB59E', clay:'#E0A84A', rust:'#E36B6B', gold:'#E0A84A', muted:'#A7B0C2', faint:'#8A93A7',
  ink:'#E8ECF3', text:'#D2D8E3', paper:'#171E2E', line:'#323D57',
  ramp:['#2FB59E','#2FB59E','#2FB59E','#2FB59E','#7FD8C6','#7FD8C6'] };
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
      label:{show:true,position:'inside',color:'#FFFFFF',fontFamily:PTFONT,fontWeight:600,fontSize:12,formatter:function(p){return p.name+'  '+p.value;}},
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



/* ============================================================
   TAB: BIẾN ĐỘNG NHÂN SỰ — turnover & giữ chân (ECharts, tự cập nhật)
   ============================================================ */
/* thâm niên khi nghỉ (tháng): ngày vào → ngày nghỉ */
/* nghỉ theo tháng (chỉ dòng có ngày nghỉ) */
/* biến động theo phòng ban: đang làm · đã nghỉ · tỷ lệ nghỉ · thâm niên TB khi nghỉ */



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



/* ============================================================
   TAB: CHẤM CÔNG & PHÉP — nhúng nguyên web chấm công (giữ 100%)
   ============================================================ */
// chấm công giờ ở ngay trong hrbigx (cùng Firebase → data giữ nguyên)


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
  if(id==='overview') content.innerHTML=window.renderOverview(); // ui-v3.js
  else if(id==='tuyen-dung') content.innerHTML=renderTuyenDung();
  else if(id==='pt-tuyen-dung') content.innerHTML=renderPhanTichTuyenDung();
  else if(id==='kho-cv') content.innerHTML=renderKhoCV();
  else if(id==='bao-cao'){content.innerHTML=window.renderBaoCao();}
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
window.nsNorm=function(s){return String(s||'').toLowerCase().normalize('NFC').replace(/\s+/g,' ').trim();};
// [B1] sắp 'T9/2026' theo năm-tháng
/* [B2] Đi trễ tính như tab Chấm công: chỉ lượt KHÔNG phép (T-S/T-C/T-C2) từ 3' trở lên; 1 ngày có thể 2 lượt (v.lates). T7/CN bỏ qua. */
window.nsLates=function(v){ if(!v||typeof v!=='object') return []; if(Array.isArray(v.lates)&&v.lates.length) return v.lates.map(function(x){return +x.m||0;}).filter(function(m){return m>=3;});
  var st=v.status, m=+v.lateMin||0; return (['T-S','T-C','T-C2'].indexOf(st)>=0 && m>=3)?[m]:[]; };
window.nsWknd=function(d){ var w=new Date(d+'T12:00:00').getDay(); return w===0||w===6; };
/* [B1] Chấm công luôn lấy từ Firebase (không dùng bản lưu cũ trong trình duyệt); quá 2 phút thì tải lại ngầm */
/* [B1] Bộ nạp DUY NHẤT cho các tab dùng chấm công — xong thì vẽ lại đúng tab đang mở */


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
        html2canvas:{scale:2,useCORS:true,backgroundColor:'#1C2436',scrollX:0,scrollY:0},
        jsPDF:{unit:'mm',format:'a4',orientation:'portrait'},
        pagebreak:{mode:['css','legacy'],avoid:['.bc-kpis','.bc-sec.full','.bc-grid2','tr']} };
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

/* delta pill: goodUp=true → tăng là tốt (xanh) */

/* ---- chấm công: gom số liệu trong 1 khoảng ---- */

/* ---- Tuyển dụng theo kỳ ---- */

/* ---- Biến động nhân sự theo kỳ ---- */

/* ---- Hợp đồng & hồ sơ (hết hạn trong kỳ + snapshot hiện tại) ---- */



// [B1] dùng bộ nạp chung


function bcStyle(){ return '<style id="bc-style">'
  +'#baocao{max-width:1120px}'
  +'#baocao .bc-controls{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:6px 0 2px}'
  +'#baocao .bc-seg{display:inline-flex;background:#222B3D;border-radius:9px;padding:3px}'
  +'#baocao .bc-seg button{border:0;background:transparent;font-family:inherit;font-size:13px;font-weight:600;color:#A7B0C2;padding:6px 18px;border-radius:6px;cursor:pointer}'
  +'#baocao .bc-seg button.on{background:#1C2436;color:#E8ECF3;box-shadow:0 1px 2px rgba(0,0,0,.08)}'
  +'#baocao .bc-step{display:inline-flex;align-items:center;gap:4px;background:#1C2436;border:1px solid #323D57;border-radius:9px;padding:4px 6px}'
  +'#baocao .bc-step .arw{width:26px;height:26px;border-radius:6px;background:#1C2436;color:#E8ECF3;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;user-select:none}'
  +'#baocao .bc-step .arw.dis{opacity:.35;pointer-events:none}'
  +'#baocao .bc-step .lbl{font-size:13.5px;font-weight:600;color:#E8ECF3;padding:0 8px;text-align:center;min-width:140px}'
  +'#baocao .bc-step .lbl small{display:block;font-size:10.5px;font-weight:500;color:#A7B0C2}'
  +'#baocao .bc-cmp{font-size:12px;color:#A7B0C2}'
  +'#baocao .bc-pdf{margin-left:auto;display:inline-flex;align-items:center;background:#6E54C9;color:#FFFFFF;border:0;font-family:inherit;font-size:13px;font-weight:600;padding:9px 16px;border-radius:9px;cursor:pointer}'
  +'#baocao .bc-cad{margin:12px 0 4px;font-size:12.5px;color:#D2D8E3;background:rgba(47,181,158,.14);border:1px solid rgba(47,181,158,.38);border-radius:9px;padding:8px 13px;display:inline-block}'
  +'#baocao .bc-cad b{color:#2FB59E;font-weight:600}'
  +'#baocao .bc-kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:13px;margin:16px 0 18px}'
  +'#baocao .bc-kpi{background:#1C2436;border:1px solid #323D57;border-radius:12px;padding:15px 16px 13px}'
  +'#baocao .bc-kpi .k-t{font-size:12px;color:#A7B0C2}'
  +'#baocao .bc-kpi .k-v{font-family:Fraunces,Georgia,serif;font-size:28px;font-weight:600;color:#E8ECF3;line-height:1;margin-top:7px}'
  +'#baocao .bc-kpi .k-dw{margin-top:8px;min-height:16px}'
  +'#baocao .bc-d{font-size:11.5px;font-weight:600}#baocao .bc-d small{color:#A7B0C2;font-weight:500}'
  +'#baocao .bc-d.up{color:#4FBF8F}#baocao .bc-d.down{color:#E36B6B}#baocao .bc-d.flat{color:#A7B0C2}'
  +'#baocao .sh-d{margin-left:auto;font-size:12px;font-weight:600}#baocao .sh-d.up{color:#4FBF8F}#baocao .sh-d.down{color:#E36B6B}'
  +'#baocao .bc-sec{background:#1C2436;border:1px solid #323D57;border-radius:14px;padding:18px 20px;margin-bottom:16px}'
  +'#baocao .bc-sh{display:flex;align-items:center;gap:9px;margin-bottom:3px}'
  +'#baocao .bc-sh .dot{width:8px;height:8px;border-radius:50%;background:#1F8A78}'
  +'#baocao .bc-sh h3{font-family:Fraunces,serif;font-size:17px;color:#E8ECF3;font-weight:600;margin:0}'
  +'#baocao .bc-cap{font-size:12px;color:#A7B0C2;margin-bottom:14px}'
  +'#baocao .bc-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}'
  +'#baocao .bc-row2{display:grid;grid-template-columns:1.15fr 1fr;gap:22px;align-items:start}'
  +'#baocao .bc-chart{width:100%;height:210px}'
  +'#baocao .bc-tbl{width:100%;border-collapse:collapse}'
  +'#baocao .bc-tbl th{font-size:11px;color:#A7B0C2;text-align:left;font-weight:600;padding:7px 6px;border-bottom:1px solid #323D57}'
  +'#baocao .bc-tbl th.num{text-align:right}'
  +'#baocao .bc-tbl td{font-size:13px;color:#E8ECF3;padding:8px 6px;border-bottom:1px solid #263045}'
  +'#baocao .bc-tbl td.num{text-align:right;font-variant-numeric:tabular-nums}'
  +'#baocao .bc-tbl td .sub{font-size:11px;color:#A7B0C2;margin-top:1px}'
  +'#baocao .bc-tbl tr.hl td{background:rgba(47,181,158,.14)}#baocao .bc-tbl tr.hl td:first-child{font-weight:600;color:#2FB59E}'
  +'#baocao .bc-stat{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #263045}'
  +'#baocao .bc-stat .s-l{font-size:13px;color:#D2D8E3}#baocao .bc-stat .s-l .sub{font-size:11px;color:#A7B0C2;margin-top:2px}'
  +'#baocao .bc-stat .s-r{display:flex;align-items:baseline;gap:10px}'
  +'#baocao .bc-stat .s-v{font-family:Fraunces,serif;font-size:19px;color:#E8ECF3;font-weight:600;font-variant-numeric:tabular-nums}'
  +'#baocao .bc-tbl .nw{white-space:nowrap}'
  +'#baocao .bc-minih{font-size:12px;font-weight:600;color:#A7B0C2;margin:14px 0 2px}'
  +'#baocao .late-badge{display:inline-block;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:rgba(224,168,74,.14);color:#E0A84A}'
  +'#baocao .pill{display:inline-block;font-size:11px;font-weight:600;padding:2px 9px;border-radius:20px;background:rgba(47,181,158,.14);color:#2FB59E}'
  +'#baocao .pill.amber{background:rgba(224,168,74,.14);color:#E0A84A}#baocao .pill.red{background:rgba(227,107,107,.14);color:#E36B6B}'
  +'#baocao .muted{color:#A7B0C2}'
  +'#baocao .bc-warn{background:rgba(224,168,74,.14);border:1px solid rgba(224,168,74,.38);border-radius:9px;padding:10px 13px;font-size:12.5px;color:#E0A84A;margin-top:12px}'
  +'#baocao .bc-foot{margin-top:8px;font-size:12px;color:#A7B0C2;font-style:italic}'
  +'#baocao .bc-exphdr{display:none;align-items:center;justify-content:space-between;gap:14px;padding:0 2px 14px;margin-bottom:16px;border-bottom:2px solid #E8ECF3}'
  +'#baocao .bc-exphdr-l{display:flex;align-items:center;gap:12px}'
  +'#baocao .bc-exphdr-logo{width:40px;height:40px;border-radius:10px;background:#6E54C9;color:#FFFFFF;font-family:Fraunces,serif;font-weight:600;font-size:17px;display:flex;align-items:center;justify-content:center}'
  +'#baocao .bc-exphdr-t{font-family:Fraunces,serif;font-size:19px;font-weight:600;color:#E8ECF3;letter-spacing:.3px}'
  +'#baocao .bc-exphdr-s{font-size:12.5px;color:#A7B0C2;margin-top:2px}'
  +'#baocao .bc-exphdr-r{font-size:12px;color:#A7B0C2}'
  +'#baocao.bc-exp .bc-exphdr{display:flex}'
  +'#baocao.bc-exp .bc-row2>*,#baocao.bc-exp .bc-grid2>*{min-width:0}'
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






/* ============================================================
   TAB: CALENDAR (calendar) — lịch HR động
   Sự kiện LIVE từ HR.nhansu: 🎂 sinh nhật · 📄 hết hạn HĐ · 🎉 kỷ niệm vào làm
   Lưới tháng, chuyển tháng, tô hôm nay, danh sách sự kiện trong tháng.
   ============================================================ */
// {y,m} — null = tháng hiện tại



/* Gom sự kiện cho tháng (y,m). type: bd | hd | anniv */




/* ============================================================
   TAB: NGUỒN DỮ LIỆU (nguon) — trạng thái & sức khỏe nguồn (read-only)
   Kiến trúc "1 nguồn": Hồ sơ + Tuyển dụng -> API hub (lọc PII, ghép Mã NV)
   -> web; Chấm công qua Firebase. Trang này soi trạng thái + tính toàn vẹn.
   ============================================================ */





/* ============================================================
   KHO CV › CHẤM CV THEO JD (AI) — thêm 08/10/2026
   Đọc API_URL?action=cvai (có kiểm tra đăng nhập ở Apps Script).
   ============================================================ */
var kcvTab = 'nap';
function kcvSwitch(t){ kcvTab = t; go('kho-cv'); }
function kcvTabsHtml(){
  var p = (window.CVAI && CVAI.data) ? CVAI.data.pending : 0;
  return '<div class="kcv-tabs">'+
    '<button class="kcv-tab'+(kcvTab==='nap'?' on':'')+'" onclick="kcvSwitch(\'nap\')"><i class="ti ti-cloud-upload"></i> Nạp CV</button>'+
    '<button class="kcv-tab'+(kcvTab==='ai'?' on':'')+'" onclick="kcvSwitch(\'ai\')"><i class="ti ti-sparkles"></i> Chấm CV theo JD'+(p?' <span class="kcv-cnt">'+p+'</span>':' <span class="kcv-new">MỚI</span>')+'</button>'+
  '</div>';
}

var CVAI = { loaded:false, loading:false, error:null, data:null, sel:null, running:false, msg:'', f:{ vt:'', kl:'', q:'', chua:false } };
var CVAI_KL = { 'ĐẠT':{t:'Đạt',c:'teal',hex:'#2FB59E'}, 'XEM TAY':{t:'Xem tay',c:'clay',hex:'#E0A84A'}, 'KHÔNG ĐẠT':{t:'Không đạt',c:'rust',hex:'#E36B6B'} };

var CVAI_LS = 'bigx_cvai_cache_v1';
function cvaiLoad(){
  if(CVAI.loading) return; CVAI.loading = true; CVAI.error = null;
  // [CVAI] hiện ngay bản đã lưu trên trình duyệt, rồi làm mới ngầm
  if(!CVAI.data){ try{ var c = JSON.parse(localStorage.getItem(CVAI_LS)||'null'); if(c && c.ok){ CVAI.data = c; CVAI.loaded = true; CVAI.stale = true; setTimeout(function(){ if(currentTab==='kho-cv' && kcvTab==='ai') go('kho-cv'); },0); } }catch(e){} }
  var url = API_URL + '?action=cvai' + (CVAI.fresh ? '&fresh=1' : ''); CVAI.fresh = false;
  var p = window.bxAuthedFetch ? window.bxAuthedFetch(url,{cache:'no-store'}) : fetch(url,{cache:'no-store'});
  p.then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
   .then(function(d){ if(!d.ok) throw new Error(d.error||'API lỗi'); CVAI.data = d; CVAI.loaded = true; CVAI.stale = false; try{ localStorage.setItem(CVAI_LS, JSON.stringify(d)); }catch(e){} })
   .catch(function(e){ if(CVAI.data){ CVAI.stale = false; CVAI.msg = 'Chưa làm mới được: '+e.message+' (đang hiện bản lưu trước).'; } else CVAI.error = e.message; })
   .then(function(){ CVAI.loading = false; if(currentTab==='kho-cv' && kcvTab==='ai') go('kho-cv'); });
}

function cvaiRun(){
  if(CVAI.running) return; CVAI.running = true; CVAI.msg = 'Đang chấm… (mỗi CV ~10 giây, tối đa 10 CV/lần)'; go('kho-cv');
  var body = JSON.stringify({ key:API_KEY, action:'cvaiRun', limit:10 });
  var opt = { method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:body };
  (window.bxAuthedFetch ? window.bxAuthedFetch(API_URL,opt) : fetch(API_URL,opt))
    .then(function(r){ return r.json(); })
    .then(function(d){
      if(d.busy) CVAI.msg = 'Hệ thống đang chấm ở một lượt khác, thử lại sau ít phút.';
      else CVAI.msg = 'Đã chấm '+(d.done||0)+' CV · còn '+(d.left||0)+' CV chờ'+(d.rateLimited?' · Gemini báo giới hạn, lượt sau tự chấm tiếp':'')+((d.errors&&d.errors.length)?' · lỗi: '+d.errors.join('; '):'');
    })
    .catch(function(e){ CVAI.msg = 'Lỗi kết nối: '+e.message; })
    .then(function(){ CVAI.running = false; CVAI.loaded = false; CVAI.fresh = true; cvaiLoad(); });
}

function cvaiSet(k,v){ CVAI.f[k] = v; cvaiRenderBody(); }
function cvaiPick(ma){ CVAI.sel = ma; cvaiRenderBody(); }
function cvaiFmt(s){ return s==null||s==='' ? '—' : Number(s).toFixed(1).replace('.',','); }
function cvaiDays(d){ var p=String(d||'').split('/'); if(p.length<3) return 999; return (Date.now()-new Date(+p[2],+p[1]-1,+p[0]).getTime())/864e5; }

function cvaiRows(){
  var f = CVAI.f, q = f.q.trim().toLowerCase();
  return CVAI.data.rows.filter(function(r){
    if(f.vt && r.viTri!==f.vt) return false;
    if(f.kl && r.kl!==f.kl) return false;
    if(f.chua && r.hr) return false;
    if(q && (String(r.ma)+' '+String(r.ten).toLowerCase()).indexOf(q)<0) return false;
    return true;
  }).sort(function(a,b){ return b.ma-a.ma; });
}

function renderCvAI(){
  if(!CVAI.loaded){
    if(!CVAI.loading && !CVAI.error) setTimeout(cvaiLoad,0);
    if(CVAI.error) return '<div class="cva-note rust">Không tải được kết quả chấm: '+esc(CVAI.error)+' · <a href="javascript:void(0)" onclick="CVAI.error=null;cvaiLoad()">thử lại</a></div>';
    return '<div class="cva-note">Đang tải kết quả chấm CV…</div>';
  }
  setTimeout(cvaiRenderBody,0);
  return '<div class="page-head"><div class="page-lead" style="margin-top:0">AI đối chiếu từng CV với rubric của vị trí — điểm, kết luận, ưu/nhược kèm trích dẫn từ CV. File Tuyển dụng chỉ nhận kết luận ở cột \"AI Đánh giá\"; quyết định cuối vẫn là HR.</div></div><div id="cva-body"></div>';
}

function cvaiRenderBody(){
  var el = document.getElementById('cva-body'); if(!el || !CVAI.data) return;
  var D = CVAI.data, rows = cvaiRows(), all = D.rows, cfg = D.config||{};
  var cnt = function(k){ return all.filter(function(r){return r.kl===k;}).length; };
  var mas = all.map(function(r){return r.ma;}), minMa = Math.min.apply(null,mas), maxMa = Math.max.apply(null,mas);
  var pass = all.filter(function(r){return r.hr==='SCAN CV PASS';}), agree = pass.filter(function(r){return r.kl==='ĐẠT';}).length;
  var lr = D.lastRun||{};
  var sub = (CVAI.stale ? 'Đang làm mới… · ' : '') + (D.pending ? D.pending+' CV mới đang chờ chấm' : (lr.at ? 'Đã cập nhật '+lr.at : 'Không có CV chờ'));
  var vts = {}; all.forEach(function(r){ vts[r.viTri]=1; });
  var kpi = function(l,v,n,extra){ return '<div class="cva-kpi"><div class="l">'+l+'</div><div class="v">'+v+(extra||'')+'</div><div class="n">'+n+'</div></div>'; };
  var html = '';
  if(!D.hasKey) html += '<div class="cva-note clay"><i class="ti ti-key"></i> Chưa có GEMINI_API_KEY trong Apps Script → CV mới chưa tự chấm được. Kết quả bên dưới là lô đã chấm sẵn.</div>';
  html += '<div class="cva-kpis">'+
    kpi('Đã chấm', all.length, sub+' · Mã '+minMa+' → '+maxMa, D.pending?'<small> / '+(all.length+D.pending)+'</small>':'')+
    kpi('Đạt', cnt('ĐẠT'), '≥ '+String(cfg.DAT).replace('.',',')+' điểm')+
    kpi('Xem tay', cnt('XEM TAY'), String(cfg.XEM_TAY).replace('.',',')+' – dưới '+String(cfg.DAT).replace('.',',')+' hoặc thiếu thông tin')+
    kpi('Không đạt', cnt('KHÔNG ĐẠT'), '< '+String(cfg.XEM_TAY).replace('.',',')+' hoặc trượt điều kiện')+
    kpi('Khớp HR PASS', pass.length?Math.round(agree/pass.length*100)+'%':'—', agree+' / '+pass.length+' CV HR đã PASS được AI chấm Đạt')+
  '</div>';
  html += '<div class="cva-bar">'+
    '<select onchange="cvaiSet(\'vt\',this.value)"><option value="">Tất cả vị trí</option>'+Object.keys(vts).sort().map(function(v){return '<option'+(CVAI.f.vt===v?' selected':'')+'>'+esc(v)+'</option>';}).join('')+'</select>'+
    [['','Tất cả'],['ĐẠT','Đạt'],['XEM TAY','Xem tay'],['KHÔNG ĐẠT','Không đạt']].map(function(c){return '<span class="cva-chip'+(CVAI.f.kl===c[0]?' on':'')+'" onclick="cvaiSet(\'kl\',\''+c[0]+'\')">'+c[1]+'</span>';}).join('')+
    '<span class="cva-chip'+(CVAI.f.chua?' on':'')+'" onclick="cvaiSet(\'chua\','+(!CVAI.f.chua)+')">Chưa HR review</span>'+
    '<input class="cva-q" placeholder="Tìm mã / tên viết tắt" value="'+esc(CVAI.f.q)+'" oninput="CVAI.f.q=this.value;clearTimeout(window.__cvq);window.__cvq=setTimeout(cvaiRenderBody,250)">'+
    '<button class="btn-primary cva-run" onclick="cvaiRun()"'+((CVAI.running||!D.pending||!D.hasKey)?' disabled':'')+'><i class="ti ti-sparkles"></i> '+(CVAI.running?'Đang chấm…':'Chấm CV chưa chấm ('+D.pending+')')+'</button>'+
  '</div>';
  if(CVAI.msg) html += '<div class="cva-note">'+esc(CVAI.msg)+'</div>';
  if(!rows.find(function(r){return r.ma===CVAI.sel;})) CVAI.sel = rows.length ? rows[0].ma : null;
  html += '<div class="cva-split"><div class="table-wrap cva-tbl"><table class="dt"><thead><tr><th>Mã</th><th>Ngày</th><th>Vị trí</th><th>Ứng viên</th><th>Điểm</th><th>AI kết luận</th><th>HR</th></tr></thead><tbody>'+
    (rows.length ? rows.map(function(r){
      var k = CVAI_KL[r.kl]||{t:r.kl,c:'gray',hex:'#6B7488'};
      return '<tr class="cva-row'+(r.ma===CVAI.sel?' sel':'')+'" onclick="cvaiPick('+r.ma+')"><td class="dt-mono">'+r.ma+(cvaiDays(r.ngay)<=3?' <span class="pill gold">Mới</span>':'')+'</td><td class="dt-date nw" title="'+esc(r.ngay)+'">'+esc(String(r.ngay).slice(0,5))+'</td><td class="nw">'+esc(r.viTri)+'</td><td class="dt-name nw">'+esc(r.ten||'—')+'</td>'+
        '<td><div class="cva-sc">'+cvaiFmt(r.diem)+'<span class="tr"><span style="width:'+((r.diem||0)*10)+'%;background:'+k.hex+'"></span></span></div></td>'+
        '<td><span class="pill '+k.c+'">'+k.t+'</span></td><td class="dt-muted nw" title="'+esc(r.hr||'')+'">'+esc(String(r.hr||'—').replace('SCAN CV ',''))+'</td></tr>';
    }).join('') : '<tr><td colspan="7" class="dt-empty">Không có CV khớp bộ lọc.</td></tr>')+
    '</tbody></table><div class="cva-foot">'+rows.length+' / '+all.length+' CV · mới nhất trước</div></div>'+
    '<div class="cva-det">'+cvaiDetail(rows.find(function(r){return r.ma===CVAI.sel;}))+'</div></div>';
  el.innerHTML = html;
}

function cvaiDetail(r){
  if(!r) return '<div class="dt-muted">Chọn một CV để xem chi tiết.</div>';
  var D = CVAI.data, jd = (D.map||{})[r.viTri], crit = (D.rubric||{})[jd]||[], det = r.det||{}, k = CVAI_KL[r.kl]||{t:r.kl,c:'gray'};
  var byId = {}; crit.forEach(function(c){ byId[c.id]=c; });
  var lt = (det.lt||[]).map(function(x){ var c=byId[x[0]]||{t:'Điều kiện #'+x[0]}; var col = x[1]==='Đạt'?'teal':(x[1]==='Không đạt'?'rust':'clay');
    return '<div class="cva-cr"><div class="t"><span>'+esc(c.t)+'</span><span class="pill '+col+'">ĐK loại trừ · '+esc(x[1])+'</span></div>'+(x[2]?'<q>'+esc(x[2])+'</q>':'')+'</div>'; }).join('');
  var dd = (det.d||[]).slice().sort(function(a,b){return a[0]-b[0];}).map(function(x){ var c=byId[x[0]]||{t:'Tiêu chí #'+x[0]};
    return '<div class="cva-cr"><div class="t"><span>'+esc(c.t)+(c.w?' <em>· '+c.w+'%</em>':'')+'</span><span class="cva-dots">'+[1,2,3].map(function(n){return '<i class="'+(n<=x[1]?'f':'')+'"></i>';}).join('')+'</span></div>'+(x[2]?'<q>'+esc(x[2])+'</q>':'')+'</div>'; }).join('');
  var li = function(a){ return (a&&a.length) ? '<ul>'+a.map(function(x){return '<li>'+esc(x)+'</li>';}).join('')+'</ul>' : '<div class="dt-muted">—</div>'; };
  return '<div class="cva-h">'+esc(r.ten||'—')+'</div>'+
    '<div class="cva-meta">Mã '+r.ma+' · '+esc(r.viTri)+' · nộp '+esc(r.ngay)+' · KN đúng mảng: '+(r.soNam==null?'không rõ':String(r.soNam).replace('.',',')+' năm')+'</div>'+
    '<div class="cva-big"><div class="s">'+cvaiFmt(r.diem)+'</div><div><span class="pill '+k.c+'">'+k.t+'</span><br><small>HR review: '+esc(r.hr||'chưa review')+'</small></div></div>'+
    '<div class="cva-sec">Ưu điểm so với JD</div>'+li(det.uu)+
    '<div class="cva-sec">Nhược điểm / còn thiếu</div>'+li(det.nh)+
    (lt||dd ? '<div class="cva-sec">Theo từng tiêu chí</div>'+lt+dd : '')+
    (det.gc ? '<div class="cva-note clay" style="margin-top:12px"><b>Cần xác minh:</b> '+esc(det.gc)+'</div>' : '')+
    '<div class="cva-fs">'+(r.fileId?'<a class="cva-btn" href="https://drive.google.com/file/d/'+encodeURIComponent(r.fileId)+'/view" target="_blank" rel="noopener"><i class="ti ti-external-link"></i> Mở CV</a>':'')+
    '<span class="dt-muted" style="font-size:11px">Rubric '+esc(r.rubric||'')+' · '+esc(r.nguon||'')+' · '+esc(r.luc||'')+'</span></div>';
}
