/* ============================================================
   BigX HR — ctv-koc.js  (tab "CTV Booking KOC", mockup đã duyệt 22/10/2026)
   - CHỈ ĐỌC: gọi API_URL?action=ctv (Apps Script đọc file "Đăng ký CTV Booking KOC",
     có kiểm tra đăng nhập, tên viết tắt, không SĐT/Email). Không ghi gì về file.
   - KHÔNG sửa app.js / các module khác: chỉ chèn 1 mục menu + bọc go() cho tab mới.
   - Mọi số và câu đánh giá tự tính lại mỗi lần mở tab / đổi bộ lọc.
   ============================================================ */
(function(){
'use strict';
if(window.__ctvLoaded) return; window.__ctvLoaded=true;
var TAB='ctv-koc', LS='bigx_ctv_cache_v1';

/* ---------- 1. Menu: chèn mục mới ngay sau Kho CV ---------- */
try{
  var grp=null; NAV.forEach(function(g){ g.items.forEach(function(it){ if(it.id==='kho-cv') grp=g; }); });
  if(!grp) grp=NAV[1]||NAV[0];
  if(!grp.items.some(function(it){return it.id===TAB;})){
    var item={ id:TAB, label:'CTV Booking KOC', icon:'ti-user-plus', badge:'new',
      lead:'Theo dõi tuyển Cộng tác viên Booking KOC từ form đăng ký.', points:[] };
    var idx=grp.items.findIndex(function(it){return it.id==='kho-cv';});
    grp.items.splice(idx>=0?idx+1:grp.items.length,0,item);
    MAP[TAB]={item:item, group:grp};
  }
}catch(e){ console.warn('[ctv] nav',e); }

/* ---------- 2. Dữ liệu ---------- */
var S=window.__ctv={ loaded:false, loading:false, error:null, data:null, view:'ngay', f:{q:'',hr:'',lh:'',kn:''}, chart:null };
try{ var c0=JSON.parse(localStorage.getItem(LS)||'null'); if(c0&&c0.ok){ S.data=c0; S.loaded=true; } }catch(e){}
function load(){
  if(S.loading) return; S.loading=true; S.error=null; if(window.currentTab===TAB) stamp(); attempt(2);
}
/* [22/10] thử lại tối đa 2 lần: Apps Script đôi khi trả 404/lỗi khi đang bận (nhiều yêu cầu cùng lúc / khởi động nguội) */
function attempt(n){
  var url=API_URL+'?action=ctv';
  var p=window.bxAuthedFetch?window.bxAuthedFetch(url,{cache:'no-store'}):fetch(url,{cache:'no-store'});
  p.then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
   .then(function(d){ if(!d||!d.ok) throw new Error((d&&(d.error||d.reason))||'API lỗi');
     var same=S.data && JSON.stringify(S.data.rows)===JSON.stringify(d.rows);
     S.data=d; S.loaded=true; S.fresh=true; S.last=Date.now(); try{ localStorage.setItem(LS,JSON.stringify(d)); }catch(e){}
     S.loading=false; if(window.currentTab===TAB && !same) render(); else if(window.currentTab===TAB) stamp();
     if(window.currentTab==='bao-cao' && !same && window.go) try{ window.go('bao-cao'); }catch(e){} })
   .catch(function(e){
     if(n>0){ setTimeout(function(){ attempt(n-1); },1500); return; }
     S.loading=false; S.error=e.message||'Lỗi kết nối'; if(window.currentTab===TAB) render(); });
}

/* ---------- 3. Tiện ích ---------- */
function E(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function vn(x,d){ if(x==null||isNaN(x)) return '—'; return Number(x).toLocaleString('vi-VN',{minimumFractionDigits:d||0,maximumFractionDigits:d==null?1:d}); }
function pc(a,b){ return b?Math.round(a/b*100):0; }
function pd(s){ var m=String(s||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/); if(!m) return null; return new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0)); }
function d0(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
function dd(d){ return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0'); }
function low(s){ return String(s||'').toLowerCase().normalize('NFC').trim(); }

/* trạng thái — đọc theo chữ để không phụ thuộc chính xác danh sách dropdown */
function hrOf(r){ var v=low(r.hrReview);
  if(!v||/^chưa/.test(v)) return 'chua';
  if(/fail|không đạt|loại/.test(v)) return 'fail';
  if(/cân nhắc|xem lại|xem tay/.test(v)) return 'can';
  if(/pass|đạt/.test(v)) return 'pass';
  return 'khac'; }
function lhOf(r){ var v=low(r.lienHe);
  if(!v||/^chưa/.test(v)) return 'chua';
  if(/nhận ctv/.test(v)) return 'nhan';
  if(/từ chối/.test(v)) return 'tuchoi';
  if(/không phản hồi/.test(v)) return 'khongph';
  return 'da'; }
var HRP={pass:['teal','PASS'],can:['clay','Cân nhắc'],fail:['rust','FAIL'],chua:['gray','Chưa review']};
var LHP={nhan:['teal','Nhận CTV'],da:['clay','Đã liên hệ'],tuchoi:['rust','Từ chối'],khongph:['rust','Không phản hồi'],chua:['gray','Chưa liên hệ']};
function pill(map,k,raw){ var p=map[k]; return '<span class="pill '+(p?p[0]:'gray')+'">'+E(p?(k==='khac'||k==='da'?(raw||p[1]):p[1]):(raw||'—'))+'</span>'; }

/* nhóm đáp án (câu chọn nhiều có dấu phẩy trong nhãn → so theo từ khoá, không tách dấu phẩy) */
var KN=[['Chưa có',/chưa có/i],['Dưới 6 tháng',/dưới 6/i],['6 tháng – 1 năm',/6 tháng\s*[–-]\s*1 năm/i],['Trên 1 năm',/trên 1 năm/i]];
var TEP=[['Nano',/nano/i],['Micro',/micro/i],['Mid-tier',/mid/i],['Macro',/macro/i]];
var MANG=[['Thời trang',/thời trang/i],['Mỹ phẩm',/mỹ phẩm|làm đẹp/i],['F&B',/f&b|đồ ăn|thức uống/i],['Mẹ & bé',/mẹ\s*&\s*bé|mẹ và bé/i],['Gia dụng',/gia dụng|đời sống/i],['Công nghệ',/công nghệ/i]];
var KOC=[['Dưới 10',/dưới 10/i],['10 – 30',/10\s*[–-]\s*30/i],['30 – 50',/30\s*[–-]\s*50/i],['Trên 50',/trên 50/i]];
function tags(s,list,other){ s=String(s||''); var out=[], rest=s;
  list.forEach(function(x){ if(x[1].test(s)){ out.push(x[0]); } });
  if(other){ list.forEach(function(x){ rest=rest.replace(new RegExp(x[1].source,'ig'),''); });
    rest=rest.replace(/\([^)]*\)/g,'').replace(/[–\-,;&]/g,' ').replace(/đồ ăn|thức uống|làm đẹp|đời sống|bé/ig,' ').trim();
    if(/[a-zà-ỹ]{2,}/i.test(rest)) out.push('Khác'); }
  return out; }
function one(s,list){ for(var i=0;i<list.length;i++) if(list[i][1].test(String(s||''))) return list[i][0]; return s?'Khác':''; }
function count(rows,fn,list){ var m={}; rows.forEach(function(r){ [].concat(fn(r)).forEach(function(k){ if(k) m[k]=(m[k]||0)+1; }); });
  var order=list.map(function(x){return x[0];}).concat(['Khác']);
  return order.filter(function(k){return m[k];}).map(function(k){return [k,m[k]];}).concat(Object.keys(m).filter(function(k){return order.indexOf(k)<0;}).map(function(k){return [k,m[k]];})); }

/* ---------- 4. Tính toán ---------- */
function calc(rows){
  var n=rows.length, rev=0, pass=0, can=0, fail=0, chua=0, nhan=0, lhAll=0, fPass=0, fLh=0, fNhan=0, gap=[], waits=[];
  var now=new Date();
  rows.forEach(function(r){ var h=hrOf(r), l=lhOf(r);
    if(h==='chua'){ chua++; var d=pd(r.ngay); if(d) waits.push((now-d)/864e5); } else rev++;
    if(h==='pass') pass++; if(h==='can') can++; if(h==='fail') fail++;
    if(l==='nhan') nhan++; if(l!=='chua') lhAll++;
    if(h==='pass'){ fPass++; if(l!=='chua'){ fLh++; if(l==='nhan') fNhan++; } }
    var a=pd(r.ngay), b=pd(r.ngayLienHe); if(a&&b){ var g=(d0(b)-d0(a))/864e5; if(g>=0) gap.push(g); }
  });
  return { n:n, rev:rev, pass:pass, can:can, fail:fail, chua:chua, nhan:nhan, lhAll:lhAll,
    funnel:[['Đăng ký form',n],['HR đã review',rev],['PASS',fPass],['Đã liên hệ',fLh],['Nhận CTV',fNhan]],
    gapAvg: gap.length? gap.reduce(function(s,x){return s+x;},0)/gap.length : null,
    oldest: waits.length? Math.floor(Math.max.apply(null,waits)) : null };
}
function series(rows,view){
  var now=d0(new Date()), keys=[], m={};
  if(view==='ngay'){ for(var i=13;i>=0;i--){ var d=new Date(now); d.setDate(d.getDate()-i); var k=dd(d); keys.push(k); m[k]=0; }
    rows.forEach(function(r){ var d=pd(r.ngay); if(d){ var k=dd(d); if(k in m) m[k]++; } }); }
  else if(view==='tuan'){ var mon=new Date(now); mon.setDate(mon.getDate()-((mon.getDay()+6)%7));
    for(var j=7;j>=0;j--){ var s=new Date(mon); s.setDate(s.getDate()-7*j); var k2=dd(s); keys.push(k2); m[k2]=0; }
    rows.forEach(function(r){ var d=pd(r.ngay); if(!d) return; d=d0(d); var s=new Date(d); s.setDate(s.getDate()-((s.getDay()+6)%7)); var k=dd(s); if(k in m) m[k]++; }); }
  else { for(var t=5;t>=0;t--){ var x=new Date(now.getFullYear(),now.getMonth()-t,1); var k3=String(x.getMonth()+1).padStart(2,'0')+'/'+x.getFullYear(); keys.push(k3); m[k3]=0; }
    rows.forEach(function(r){ var d=pd(r.ngay); if(!d) return; var k=String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); if(k in m) m[k]++; }); }
  return keys.map(function(k){ return [k,m[k]]; });
}

/* ---------- 5. Đánh giá tự động ---------- */
function ev(items){ if(!items.length) items=[['in','Chưa đủ dữ liệu để đánh giá.']];
  var col={er:'var(--rust)',wa:'var(--clay)',ok:'var(--teal-2)',in:'#8FA0F0'};
  return '<div class="ctv-ev"><b>● ĐÁNH GIÁ TỰ ĐỘNG</b>'+items.map(function(x){ return '<div><span class="ctv-dot" style="background:'+col[x[0]]+'"></span>'+x[1]+'</div>'; }).join('')+'</div>'; }
function evFunnel(k){
  var it=[], f=k.funnel; if(!k.n) return ev([]);
  var worst=null; for(var i=1;i<f.length;i++){ if(!f[i-1][1]) continue; var lost=1-f[i][1]/f[i-1][1]; if(!worst||lost>worst.l) worst={l:lost,a:f[i-1][0],b:f[i][0]}; }
  if(worst && worst.l>0) it.push([worst.l>=.5?'er':'wa','Rớt mạnh nhất ở bước <b>'+E(worst.a)+' → '+E(worst.b)+'</b> (mất '+Math.round(worst.l*100)+'%).']);
  if(k.chua) it.push([k.oldest>=3?'er':'wa','<b>'+k.chua+'</b> đơn chưa review'+(k.oldest!=null?', đơn cũ nhất đã chờ <b>'+k.oldest+' ngày</b>':'')+'.']);
  else it.push(['ok','Đã review hết đơn đăng ký.']);
  if(k.nhan) it.push(['ok','Cứ khoảng <b>'+vn(k.n/k.nhan,1)+'</b> người đăng ký thì nhận được 1 CTV.']);
  if(k.gapAvg!=null) it.push([k.gapAvg>2?'wa':'ok','Từ lúc đăng ký đến ngày phỏng vấn trung bình <b>'+vn(k.gapAvg,1)+' ngày</b>.']);
  return ev(it);
}
function evSeries(sr,view){
  var tot=sr.reduce(function(s,x){return s+x[1];},0); if(!tot) return ev([['in','Chưa có đơn đăng ký nào trong khoảng này.']]);
  var lab={ngay:'ngày',tuan:'tuần bắt đầu',thang:'tháng'}[view], top=sr.slice().sort(function(a,b){return b[1]-a[1];})[0];
  var zero=sr.filter(function(x){return !x[1];}).map(function(x){return x[0];});
  var it=[['ok','Cao nhất '+lab+' <b>'+top[0]+'</b>: '+top[1]+' đơn.']];
  if(zero.length && zero.length<sr.length) it.push(['wa', zero.length+' '+(view==='thang'?'tháng':view==='tuan'?'tuần':'ngày')+' không có đơn'+(zero.length<=4?' ('+zero.join(', ')+')':'')+'.']);
  it.push(['in','Tổng '+tot+' đơn trong '+sr.length+' '+(view==='thang'?'tháng':view==='tuan'?'tuần':'ngày')+' gần nhất.']);
  return ev(it);
}

/* ---------- 6. Vẽ ---------- */
function css(){ if(document.getElementById('ctv-css')) return; var s=document.createElement('style'); s.id='ctv-css'; s.textContent=
'.ctv-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:14px}'+
'.ctv-card{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);padding:14px 16px;min-width:0}'+
'.ctv-k .l{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.ctv-k .v{font-size:24px;font-weight:600;color:var(--ink);margin-top:4px}.ctv-k .d{font-size:11px;color:var(--faint);margin-top:2px}'+
'.ctv-g2{display:grid;grid-template-columns:1.25fr 1fr;gap:14px;margin-bottom:14px}.ctv-g4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:14px}'+
'.ctv-h{font-family:var(--serif);font-size:16px;font-weight:600;color:var(--ink)}.ctv-s{font-size:11px;color:var(--faint);margin:2px 0 12px}'+
'.ctv-fun .lab{display:flex;justify-content:space-between;font-size:12px;color:var(--text);margin-bottom:3px}.ctv-fun .row{margin-bottom:9px}'+
'.ctv-fun .bar{height:16px;border-radius:4px;background:linear-gradient(90deg,#7B4FD6,#9B7BEA);min-width:3px;transition:width .8s cubic-bezier(.2,.8,.2,1)}.ctv-fun .dr{font-size:10.5px;color:var(--faint);margin-top:2px}'+
'.ctv-ev{margin-top:12px;border-top:1px solid var(--line);padding-top:9px;font-size:12px;line-height:1.75;color:var(--text)}.ctv-ev>b{display:block;font-size:10px;letter-spacing:.12em;color:#9B7BEA}'+
'.ctv-dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:7px;vertical-align:1px}'+
'.ctv-hb .r{display:grid;grid-template-columns:96px 1fr 28px;gap:8px;align-items:center;font-size:11.5px;color:var(--text);margin-bottom:7px}'+
'.ctv-hb .t{height:9px;background:var(--paper-2);border-radius:4px;overflow:hidden}.ctv-hb .t i{display:block;height:100%;background:#9B7BEA;border-radius:4px}.ctv-hb .n{text-align:right;color:var(--muted)}'+
'.ctv-seg{display:inline-flex;border:1px solid var(--line);border-radius:7px;overflow:hidden;float:right}.ctv-seg button{background:none;border:none;color:var(--muted);font:inherit;font-size:11.5px;padding:4px 10px;cursor:pointer}.ctv-seg button.on{background:#7B4FD6;color:#fff}'+
'.ctv-empty{padding:16px;border:1px dashed var(--line);border-radius:var(--radius);color:var(--muted);font-size:13px;margin-bottom:14px}'+
'.ctv-lk{color:#9B7BEA;text-decoration:underline}'+
'@media(max-width:1100px){.ctv-g4{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:820px){.ctv-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.ctv-g2,.ctv-g4{grid-template-columns:1fr}}';
document.head.appendChild(s); }

function hb(title,sub,arr){ var mx=Math.max.apply(null,[1].concat(arr.map(function(x){return x[1];})));
  return '<div class="ctv-card ctv-hb"><div class="ctv-h">'+title+'</div><div class="ctv-s">'+sub+'</div>'+
   (arr.length?arr.map(function(x){ return '<div class="r"><span>'+E(x[0])+'</span><div class="t"><i style="width:'+Math.round(x[1]/mx*100)+'%"></i></div><span class="n">'+x[1]+'</span></div>'; }).join(''):'<div style="color:var(--faint);font-size:12px">Chưa có dữ liệu</div>')+'</div>'; }

function stamp(){ var up=document.getElementById('ctv-up'); if(up&&S.data) up.innerHTML=E('Đọc lúc '+S.data.updated)+(S.loading?' · đang làm mới…':S.error?' · <span style="color:var(--rust)">chưa làm mới được ('+E(S.error)+'), đang hiện bản lưu</span> · <a href="javascript:void(0)" class="ctv-lk" onclick="__ctvLoad()">thử lại</a>':''); }

function page(){
  css();
  if(!S.loaded){
    if(S.error) return '<div class="page-head"><div class="page-h1">Tuyển CTV Booking KOC</div></div><div class="ctv-empty" style="border-color:var(--rust);color:var(--rust)">Không tải được dữ liệu: '+E(S.error)+' · <a href="javascript:void(0)" onclick="__ctv.error=null;__ctvLoad()" class="ctv-lk">thử lại</a></div>';
    return '<div class="page-head"><div class="page-h1">Tuyển CTV Booking KOC</div></div><div class="ctv-empty">Đang đọc file đăng ký CTV…</div>';
  }
  var rows=S.data.rows||[], k=calc(rows), f=k.funnel;
  var h='<div class="page-head"><div class="page-h1">Tuyển CTV Booking KOC</div>'+
    '<div class="page-lead">Nguồn: form <b>Đăng ký CTV Booking KOC</b> (chỉ đọc). Tự cập nhật khi có người điền form hoặc HR cập nhật trạng thái trong file. Tên viết tắt, không hiện SĐT/Email. <span id="ctv-up" style="color:var(--faint)"></span></div></div>';
  if(!rows.length) h+='<div class="ctv-empty"><i class="ti ti-inbox"></i> Chưa có ai đăng ký qua form. Khi có đơn đầu tiên, số liệu sẽ tự hiện ở đây.</div>';
  h+='<div class="ctv-kpis">'+
    kpi('Đăng ký',k.n,'tổng số đơn')+
    kpi('Đã review',k.rev,(k.n?pc(k.rev,k.n)+'% · ':'')+'còn '+k.chua+' chờ')+
    kpi('PASS',k.pass,k.rev?pc(k.pass,k.rev)+'% số đã review':'—','var(--teal-2)')+
    kpi('Đã nhận CTV',k.nhan,k.n?pc(k.nhan,k.n)+'% số đăng ký':'—','#9B7BEA')+
    kpi('Ngày xử lý TB',k.gapAvg==null?'—':vn(k.gapAvg,1),'từ đăng ký → phỏng vấn')+'</div>';
  var top=f[0][1]||1;
  h+='<div class="ctv-g2"><div class="ctv-card"><div class="ctv-h">Phễu tuyển CTV</div><div class="ctv-s">Mỗi bước = số người đã qua bước trước</div><div class="ctv-fun">'+
    f.map(function(x,i){ return '<div class="row"><div class="lab"><span>'+x[0]+'</span><b>'+x[1]+'</b></div><div class="bar" style="width:'+(x[1]?Math.max(2,Math.round(x[1]/top*100)):0)+'%"></div>'+
      (i&&f[i-1][1]?'<div class="dr">↓ '+pc(x[1],f[i-1][1])+'% đi tiếp</div>':'')+'</div>'; }).join('')+'</div>'+evFunnel(k)+'</div>';
  var sr=series(rows,S.view);
  h+='<div class="ctv-card"><div class="ctv-seg">'+[['ngay','Ngày'],['tuan','Tuần'],['thang','Tháng']].map(function(o){ return '<button class="'+(S.view===o[0]?'on':'')+'" onclick="__ctvView(\''+o[0]+'\')">'+o[1]+'</button>'; }).join('')+'</div>'+
    '<div class="ctv-h">Đăng ký theo '+{ngay:'ngày',tuan:'tuần',thang:'tháng'}[S.view]+'</div><div class="ctv-s">'+{ngay:'14 ngày gần nhất',tuan:'8 tuần gần nhất (tính từ thứ 2)',thang:'6 tháng gần nhất'}[S.view]+'</div>'+
    '<div id="ctv-chart" style="height:190px"></div>'+evSeries(sr,S.view)+'</div></div>';
  h+='<div class="ctv-g4">'+
    hb('Kinh nghiệm','Booking KOC/KOL',count(rows,function(r){return one(r.kinhNghiem,KN);},KN))+
    hb('Tệp KOC','Theo lượng follow · chọn nhiều',count(rows,function(r){return tags(r.tepKoc,TEP);},TEP))+
    hb('Mảng ngành hàng','Chọn nhiều',count(rows,function(r){return tags(r.mang,MANG,true);},MANG))+
    hb('Năng suất dự kiến','KOC/tháng ứng viên tự khai',count(rows,function(r){return one(r.kocThang,KOC);},KOC))+'</div>';
  var f2=S.f;
  function opt(v,l,cur){ return '<option value="'+v+'"'+(cur===v?' selected':'')+'>'+l+'</option>'; }
  h+='<div class="ctv-card"><div class="ctv-h">Danh sách ứng viên CTV</div><div class="ctv-s">Mới nhất ở trên · bấm "Xem CV" mở file trong folder CV (cần quyền Drive)</div>'+
    '<div class="toolbar"><div class="tb-search"><i class="ti ti-search"></i><input id="ctv-q" placeholder="Tìm tên hoặc mã CTV…" value="'+E(f2.q)+'" oninput="__ctvF()"></div>'+
    '<select id="ctv-hr" onchange="__ctvF()">'+opt('','HR Review: tất cả',f2.hr)+opt('pass','PASS',f2.hr)+opt('can','Cân nhắc',f2.hr)+opt('fail','FAIL',f2.hr)+opt('chua','Chưa review',f2.hr)+'</select>'+
    '<select id="ctv-lh" onchange="__ctvF()">'+opt('','Liên hệ: tất cả',f2.lh)+opt('chua','Chưa liên hệ',f2.lh)+opt('da','Đã liên hệ',f2.lh)+opt('nhan','Nhận CTV',f2.lh)+opt('tuchoi','Từ chối',f2.lh)+opt('khongph','Không phản hồi',f2.lh)+'</select>'+
    '<select id="ctv-kn" onchange="__ctvF()">'+opt('','Kinh nghiệm: tất cả',f2.kn)+KN.map(function(x){return opt(x[0],x[0],f2.kn);}).join('')+'</select>'+
    '<span class="tb-count" id="ctv-count"></span></div>'+
    '<div class="table-wrap"><table class="dt"><thead><tr><th>Ngày gửi</th><th>Ứng viên</th><th>Kinh nghiệm</th><th>Tệp KOC</th><th>Mảng</th><th>KOC/tháng</th><th>CV</th><th>HR Review</th><th>Liên hệ</th><th>Mã CTV</th><th>Ghi chú</th></tr></thead><tbody id="ctv-body"></tbody></table></div></div>';
  return h;
}
function kpi(l,v,d,c){ return '<div class="ctv-card ctv-k"><div class="l">'+l+'</div><div class="v"'+(c?' style="color:'+c+'"':'')+'>'+v+'</div><div class="d">'+d+'</div></div>'; }

function body(){
  var tb=document.getElementById('ctv-body'); if(!tb||!S.data) return;
  var f=S.f, q=low(f.q);
  var rows=(S.data.rows||[]).filter(function(r){
    if(f.hr && hrOf(r)!==f.hr) return false;
    if(f.lh && lhOf(r)!==f.lh) return false;
    if(f.kn && one(r.kinhNghiem,KN)!==f.kn) return false;
    if(q && low(r.ten+' '+r.maCtv).indexOf(q)<0) return false;
    return true;
  }).sort(function(a,b){ var x=pd(a.ngay), y=pd(b.ngay); return (y?y.getTime():0)-(x?x.getTime():0); });
  var cnt=document.getElementById('ctv-count'); if(cnt) cnt.textContent=rows.length+' ứng viên';
  if(!rows.length){ tb.innerHTML='<tr><td colspan="11" class="dt-empty">'+((S.data.rows||[]).length?'Không có ứng viên khớp bộ lọc.':'Chưa có đơn đăng ký.')+'</td></tr>'; return; }
  tb.innerHTML=rows.map(function(r){ var d=pd(r.ngay);
    return '<tr><td class="dt-date nw">'+(d?dd(d)+'/'+d.getFullYear():E(r.ngay))+'</td><td class="dt-name nw">'+E(r.ten||'—')+'</td>'+
      '<td class="nw">'+E(one(r.kinhNghiem,KN)||'—')+'</td><td class="nw">'+E(tags(r.tepKoc,TEP).join(', ')||'—')+'</td>'+
      '<td class="nw">'+E(tags(r.mang,MANG,true).join(', ')||'—')+'</td><td class="nw">'+E(one(r.kocThang,KOC)||'—')+'</td>'+
      '<td class="nw">'+(/^https:\/\/(drive|docs)\.google\.com\//.test(r.cv)?'<a class="ctv-lk" href="'+E(r.cv)+'" target="_blank" rel="noopener">Xem CV</a>':'—')+'</td>'+
      '<td class="nw">'+pill(HRP,hrOf(r),r.hrReview)+'</td><td class="nw">'+pill(LHP,lhOf(r),r.lienHe)+'</td>'+
      '<td class="nw">'+E(r.maCtv||'')+'</td><td>'+E(r.ghiChu||'')+'</td></tr>';
  }).join('');
}

function draw(){
  var el=document.getElementById('ctv-chart'); if(!el||!window.echarts||!S.data) return;
  var sr=series(S.data.rows||[],S.view);
  var c=echarts.getInstanceByDom(el)||echarts.init(el,null,{renderer:'svg'}); c.clear(); c.resize();
  var F='"Be Vietnam Pro",system-ui,sans-serif';
  c.setOption({ animationDuration:900, animationEasing:'cubicOut', grid:{left:28,right:8,top:18,bottom:24},
    tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:'#0B0F17',borderColor:'#2A3348',textStyle:{color:'#D5DAE3',fontFamily:F,fontSize:12}},
    xAxis:{type:'category',data:sr.map(function(x){return x[0];}),axisLine:{lineStyle:{color:'#263045'}},axisTick:{show:false},axisLabel:{color:'#A7B0C2',fontSize:10.5,fontFamily:F}},
    yAxis:{type:'value',minInterval:1,splitLine:{lineStyle:{color:'#222B3D',type:[3,4]}},axisLabel:{color:'#A7B0C2',fontSize:10.5,fontFamily:F}},
    series:[{type:'bar',name:'Đơn đăng ký',data:sr.map(function(x){return x[1];}),barMaxWidth:26,itemStyle:{color:'#2FB59E',borderRadius:[3,3,0,0]},
      label:{show:true,position:'top',color:'#E8ECF3',fontSize:10.5,fontFamily:F,formatter:function(p){return p.value||'';}}}] });
  S.chart=c;
}

function render(){
  var content=document.getElementById('content'); if(!content) return;
  content.innerHTML=page(); stamp();
  setTimeout(function(){ try{ body(); draw(); }catch(e){ console.warn('[ctv] draw',e); } },30);
}
window.__ctvLoad=load;
window.__ctvView=function(v){ S.view=v; render(); };
window.__ctvF=function(){ S.f.q=(document.getElementById('ctv-q')||{}).value||''; S.f.hr=(document.getElementById('ctv-hr')||{}).value||'';
  S.f.lh=(document.getElementById('ctv-lh')||{}).value||''; S.f.kn=(document.getElementById('ctv-kn')||{}).value||''; body(); };
window.addEventListener('resize',function(){ if(S.chart&&window.currentTab===TAB) try{ S.chart.resize(); }catch(e){} });

/* ---------- 6b. Phần CTV cho tab Báo cáo (baocao-td.js gọi window.ctvReport) — mockup duyệt 22/10/2026 ---------- */
/* p, pv = {start,end} (Date 00:00) của kỳ đang xem / kỳ trước. Trả null nếu chưa có dữ liệu CTV. */
window.ctvReport=function(p,pv){
  if(!S.loading && Date.now()-(S.last||0)>30000) load(); // mở Báo cáo là lấy số mới (quá 30 giây thì gọi lại)
  if(!S.loaded) return null;
  var rows=S.data.rows||[], today=d0(new Date());
  function inQ(d,q){ if(!d) return false; d=d0(d); return d>=q.start && d<=q.end; }
  function nhanKy(r,q){ if(lhOf(r)!=='nhan') return false; var pv2=pd(r.ngayLienHe); return pv2?inQ(pv2,q):inQ(pd(r.ngay),q); }
  var L=rows.filter(function(r){return inQ(pd(r.ngay),p);}), Lp=rows.filter(function(r){return inQ(pd(r.ngay),pv);});
  var k=calc(L), kp=calc(Lp), all=calc(rows);
  var pvKy=rows.filter(function(r){return inQ(pd(r.ngayLienHe),p);}).length, pvKyP=rows.filter(function(r){return inQ(pd(r.ngayLienHe),pv);}).length;
  var NH=rows.filter(function(r){return nhanKy(r,p);}), nhP=rows.filter(function(r){return nhanKy(r,pv);}).length;
  var passNoLh=rows.filter(function(r){return hrOf(r)==='pass'&&lhOf(r)==='chua';}).length;
  var pvQua=rows.filter(function(r){ var d=pd(r.ngayLienHe); return d&&d0(d)<today&&(lhOf(r)==='chua'||lhOf(r)==='da'); }).length;
  function dl(c,pr){ var d=c-pr; if(!d) return '<span class="bt-d fl">— bằng kỳ trước</span>'; return '<span class="bt-d '+(d>0?'up':'dn')+'">'+(d>0?'▲':'▼')+' '+Math.abs(d)+'</span> <span class="bt-mute">vs '+pr+'</span>'; }
  function kp1(t,v,s){ return '<div class="bt-kpi"><div class="t">'+t+'</div><div class="v">'+v+'</div><div class="s">'+s+'</div></div>'; }
  var kpis='<div class="bt-kpis" style="margin:4px 0 12px">'+
    kp1('Đăng ký mới',k.n,dl(k.n,kp.n))+
    kp1('Đã review',k.rev,(k.n?pc(k.rev,k.n)+'% · ':'')+'còn '+k.chua+' chờ')+
    kp1('PASS',k.pass,k.rev?pc(k.pass,k.rev)+'% số đã review':'—')+
    kp1('Phỏng vấn trong kỳ',pvKy,'theo Ngày phỏng vấn')+
    kp1('Nhận CTV',NH.length,dl(NH.length,nhP)+(k.n?' · '+pc(NH.length,k.n)+'% đơn':''))+'</div>';
  var f=k.funnel, fp=kp.funnel, mx=Math.max(1,f[0][1],fp[0][1]);
  var fun='<table class="bt-t"><tr><th>Bước</th><th style="width:46%"></th><th>Kỳ này</th><th>Kỳ trước</th></tr>'+f.map(function(x,i){
    var a=x[1], b=fp[i][1], ra=i&&f[i-1][1]?' <small>'+pc(a,f[i-1][1])+'%</small>':'';
    return '<tr><td>'+x[0]+'</td><td style="text-align:left"><div style="height:7px;border-radius:3px;background:#2FB59E;width:'+Math.round(a/mx*100)+'%;min-width:'+(a?3:0)+'px"></div><div style="height:7px;border-radius:3px;background:#8A93A7;opacity:.55;margin-top:3px;width:'+Math.round(b/mx*100)+'%;min-width:'+(b?3:0)+'px"></div></td><td><b>'+a+'</b>'+ra+'</td><td>'+b+'</td></tr>'; }).join('')+'</table>';
  var list=NH.slice().sort(function(a,b){ return String(a.maCtv).localeCompare(String(b.maCtv)); });
  var tbl='<table class="bt-t"><tr><th>Mã CTV</th><th>Ứng viên</th><th>Ngày gửi</th><th>Ngày PV</th><th>Kinh nghiệm</th></tr>'+(list.length?list.map(function(r){ var d=pd(r.ngay);
    return '<tr><td><b>'+E(r.maCtv||'—')+'</b></td><td style="text-align:left">'+E(r.ten)+'</td><td>'+(d?dd(d):'—')+'</td><td>'+E(r.ngayLienHe?String(r.ngayLienHe).slice(0,5):'—')+'</td><td>'+E(one(r.kinhNghiem,KN)||'—')+'</td></tr>'; }).join(''):'<tr><td colspan="5" class="bt-mute" style="text-align:left">Kỳ này chưa nhận CTV mới.</td></tr>')+'</table>';
  var ev=[];
  if(all.chua) ev.push([all.oldest>=3?'er':'wa','<b>'+all.chua+'</b> đơn CTV chưa review'+(all.oldest!=null?', đơn cũ nhất đã chờ <b>'+all.oldest+' ngày</b>':'')+'.','Chưa review']);
  if(passNoLh||pvQua) ev.push(['wa',[passNoLh?passNoLh+' người PASS nhưng chưa liên hệ':'',pvQua?pvQua+' người đã qua ngày phỏng vấn mà chưa cập nhật kết quả':''].filter(Boolean).join(' · ')+'.','Cần cập nhật']);
  if(k.n){ var r1=pc(NH.length,k.n), r0=kp.n?pc(nhP,kp.n):null;
    ev.push([r0!=null&&r1<r0?'in':'ok','Tỷ lệ nhận CTV <b>'+r1+'%</b> số đơn kỳ này'+(r0!=null?' (kỳ trước '+r0+'%)':'')+'.'+(k.gapAvg!=null?' Từ đăng ký đến phỏng vấn trung bình <b>'+vn(k.gapAvg,1)+' ngày</b>.':''),'Kết quả']); }
  else ev.push(['in','Kỳ này chưa có đơn đăng ký CTV mới.','Không có đơn']);
  var todo=[];
  if(all.chua) todo.push([all.oldest>=3?0:1,'Review <b>'+all.chua+' đơn CTV</b> đang chờ trong file Đăng ký CTV.','HR']);
  if(passNoLh) todo.push([1,'Liên hệ <b>'+passNoLh+' ứng viên CTV</b> đã PASS.','HR']);
  if(pvQua) todo.push([1,'Cập nhật kết quả cho <b>'+pvQua+' ứng viên CTV</b> đã qua ngày phỏng vấn.','HR']);
  var dk=k.n-kp.n;
  var sum='CTV Booking KOC: <b>'+k.n+' đơn đăng ký</b>'+(kp.n||k.n?' ('+(dk?(dk>0?'▲ ':'▼ ')+Math.abs(dk):'bằng')+' so với kỳ trước)':'')+', <b>'+NH.length+' người nhận CTV</b>'+(all.chua?', còn <b>'+all.chua+' đơn chưa review</b>':'')+'.';
  return { sum:sum, todo:todo,
    m:{k:k, kp:kp, chua:all.chua, oldest:all.oldest, pv:pvKy, pvP:pvKyP, nhan:NH.length, nhanP:nhP, passNoLh:passNoLh, pvQua:pvQua}, // [CTV] số liệu cho PDF bảng chỉ số
    html:function(sec,evHtml){ return sec(7,'Tuyển CTV Booking KOC','Đơn đăng ký form CTV gửi trong kỳ, kết quả tính đến hôm nay · so với đơn kỳ trước · "Nhận CTV" tính theo ngày phỏng vấn (chưa có thì theo ngày gửi)',
      kpis+'<div class="bt-g2" style="gap:12px"><div style="min-width:0;flex:1"><div class="bt-cap" style="margin-top:0"><b>Phễu đơn trong kỳ</b> · xanh = kỳ này, xám = kỳ trước</div><div class="bt-scroll">'+fun+'</div></div>'+
      '<div style="min-width:0;flex:1"><div class="bt-cap" style="margin-top:0"><b>CTV mới nhận trong kỳ</b></div><div class="bt-scroll">'+tbl+'</div></div></div>'+evHtml(ev)); } };
};

/* ---------- 7. Router ---------- */
var prevGo=window.__ctvPrevGo||window.go; window.__ctvPrevGo=prevGo;
window.go=function(id){
  prevGo.apply(this,arguments);
  if(id!==TAB) return;
  render(); load();
};

/* nạp muộn (app đã khởi động trước file này) → vẽ lại menu */
if(window.__bxAppBooted){ try{ window.renderNav(); if(window.currentTab) window.go(window.currentTab); }catch(e){ console.warn('[ctv] late boot',e); } }
/* [22/10] LUÔN tự cập nhật:
   - sau khi đăng nhập: đợi dữ liệu chính tải xong rồi mới gọi (gọi cùng lúc dễ bị Apps Script trả lỗi 404)
   - mỗi 60 giây khi trang đang mở trên màn hình (mọi tab), có thay đổi thì tự vẽ lại tab CTV / Báo cáo
   - quay lại cửa sổ web (sau khi chuyển tab trình duyệt) là làm mới ngay */
(function bootCtv(n){
  var note=(document.getElementById('tb-note')||{}).textContent||'';
  if(window.__bxAppBooted && window.BX_ROLE && window.HR && HR.loaded && !/đang làm mới|Đang tải/.test(note)){ setTimeout(function(){ if(!S.loading) load(); },800); return; }
  if(n<240) setTimeout(function(){ bootCtv(n+1); },500); else if(!S.loading) load();
})(0);
setInterval(function(){ if(window.BX_ROLE && !S.loading && document.visibilityState==='visible') load(); },60000);
document.addEventListener('visibilitychange',function(){ if(document.visibilityState==='visible' && window.BX_ROLE && !S.loading && Date.now()-(S.last||0)>30000) load(); });
})();
