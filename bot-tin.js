/* ============================================================
   BigX HR — bot-tin.js  (tab "Bot đăng bài tuyển dụng", mockup duyệt 06/11/2026)
   - CHỈ ĐỌC: gọi API_URL?action=bot (Apps Script đọc file "BOT ĐĂNG BÀI TUYỂN DỤNG").
   - KHÔNG sửa app.js / module khác: chỉ chèn 1 mục menu + bọc go() cho tab mới.
   ============================================================ */
(function(){
'use strict';
if(window.__botLoaded) return; window.__botLoaded=true;
var TAB='bot-tin', LS='bigx_bot_cache_v1';

/* ---------- 1. Menu: chèn ngay sau CTV Booking KOC (không có thì sau Kho CV) ---------- */
try{
  var grp=null, after=null;
  NAV.forEach(function(g){ g.items.forEach(function(it){ if(it.id==='ctv-koc'){grp=g;after='ctv-koc';} }); });
  if(!grp) NAV.forEach(function(g){ g.items.forEach(function(it){ if(it.id==='kho-cv'){grp=g;after='kho-cv';} }); });
  if(!grp) grp=NAV[1]||NAV[0];
  if(!grp.items.some(function(it){return it.id===TAB;})){
    var item={ id:TAB, label:'Bot đăng bài tuyển dụng', icon:'ti-robot', badge:'new',
      lead:'Theo dõi bot đăng tin tuyển dụng lên group Facebook.', points:[] };
    var idx=grp.items.findIndex(function(it){return it.id===after;});
    grp.items.splice(idx>=0?idx+1:grp.items.length,0,item);
    MAP[TAB]={item:item, group:grp};
  }
}catch(e){ console.warn('[bot] nav',e); }

/* ---------- 2. Dữ liệu ---------- */
var S=window.__bot={ loaded:false, loading:false, error:null, data:null, sub:'tq', f:{q:'',st:''} };
try{ var c0=JSON.parse(localStorage.getItem(LS)||'null'); if(c0&&c0.ok){ S.data=c0; S.loaded=true; } }catch(e){}
function load(){ if(S.loading) return; S.loading=true; S.error=null; attempt(2); }
function attempt(n){
  var url=API_URL+'?action=bot';
  var p=window.bxAuthedFetch?window.bxAuthedFetch(url,{cache:'no-store'}):fetch(url,{cache:'no-store'});
  p.then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
   .then(function(d){ if(!d||!d.ok) throw new Error((d&&(d.error||d.reason))||'API lỗi');
     var same=S.data && JSON.stringify([S.data.posts,S.data.runs,S.data.groups,S.data.research,S.data.config])===JSON.stringify([d.posts,d.runs,d.groups,d.research,d.config]);
     S.data=d; S.loaded=true; S.last=Date.now(); try{ localStorage.setItem(LS,JSON.stringify(d)); }catch(e){}
     S.loading=false; if(window.currentTab===TAB && (!same || S.sub==='tq')) render(); })
   .catch(function(e){
     if(n>0){ setTimeout(function(){ attempt(n-1); },1500); return; }
     S.loading=false; S.error=e.message||'Lỗi kết nối'; if(window.currentTab===TAB) render(); });
}

/* ---------- 3. Tiện ích ---------- */
function E(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function pc(a,b){ return b?Math.round(a/b*100):0; }
function pd(s){ var m=String(s||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/); if(!m) return null; return new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0)); }
function d0(d){ return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
function hm(d){ return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
function dm(d){ return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0'); }
function low(s){ return String(s||'').toLowerCase().normalize('NFC').trim(); }
function stOf(s){ s=low(s);
  if(/bị gỡ|bị xóa|bị xoá/.test(s)) return 'go';
  if(/thất bại|lỗi/.test(s)) return 'loi';
  if(/chờ/.test(s)) return 'cho';
  if(/đã đăng|hiển thị/.test(s)) return 'ok';
  return 'khac'; }
var STP={ok:['teal','Đã đăng'],cho:['clay','Chờ duyệt'],loi:['rust','Thất bại'],go:['rust','Bị gỡ'],khac:['gray','—']};
function pill(k,raw){ var p=STP[k]||STP.khac; return '<span class="pill '+p[0]+'">'+E(k==='khac'?(raw||'—'):p[1])+'</span>'; }
function cfg(k){ var c=(S.data&&S.data.config)||{}; return c[k]==null?'':String(c[k]); }
function weekStart(d){ d=d0(d); return new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7)); }
var DOW={'CN':0,'T2':1,'T3':2,'T4':3,'T5':4,'T6':5,'T7':6};
function nextRun(){
  if(/tạm dừng/i.test(cfg('TRANG_THAI'))) return null;
  var days=(cfg('NGAY_DANG')||'T2, T4, T6, CN').split(/[,\s]+/).map(function(x){return DOW[x.toUpperCase()];}).filter(function(x){return x!=null;});
  var times=(cfg('KHUNG_GIO')||'09:00').split(/[,\s]+/).filter(Boolean).sort();
  var now=new Date();
  for(var i=0;i<8;i++){ var d=new Date(now.getFullYear(),now.getMonth(),now.getDate()+i);
    if(days.indexOf(d.getDay())<0) continue;
    for(var j=0;j<times.length;j++){ var t=times[j].split(':'); var x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),+t[0],+(t[1]||0)); if(x>now) return x; } }
  return null;
}

/* ---------- 4. Tính toán ---------- */
function calc(){
  var D=S.data, P=(D.posts||[]).map(function(p){ var x=Object.assign({},p); x._d=pd(p.thoiGian); x._s=stOf(p.trangThai); x._c=+p.comment||0; return x; });
  var ws=weekStart(new Date()), pws=new Date(ws.getFullYear(),ws.getMonth(),ws.getDate()-7);
  var wk=P.filter(function(p){return p._d&&p._d>=ws;}), pwk=P.filter(function(p){return p._d&&p._d>=pws&&p._d<ws;});
  function cnt(L,k){ return L.filter(function(p){return p._s===k;}).length; }
  var done=P.filter(function(p){return p._s!=='loi';});
  var since30=new Date(Date.now()-30*864e5);
  var G={}; P.filter(function(p){return p._d&&p._d>=since30;}).forEach(function(p){ var k=p.maGroup||p.tenGroup; if(!k) return;
    var g=G[k]||(G[k]={ten:p.tenGroup||k,bai:0,ok:0,go:0,loi:0,cmt:0}); g.bai++; if(p._s==='ok')g.ok++; if(p._s==='go')g.go++; if(p._s==='loi')g.loi++; g.cmt+=p._c; });
  var gl=Object.keys(G).map(function(k){return G[k];}).sort(function(a,b){ return (b.cmt/b.bai)-(a.cmt/a.bai) || b.bai-a.bai; });
  var runs=(D.runs||[]).slice().sort(function(a,b){ return (pd(b.batDau)||0)-(pd(a.batDau)||0); });
  var inSched=(D.groups||[]).filter(function(g){return /^có$/i.test(String(g.trongLich||'').trim());}).length;
  return { P:P, wk:wk, pwk:pwk, okW:cnt(wk,'ok'), choW:cnt(wk,'cho'), goW:cnt(wk,'go'), loiW:cnt(wk,'loi'),
    hienThi:pc(done.filter(function(p){return p._s==='ok';}).length, done.length), doneN:done.length,
    cmtW:wk.reduce(function(s,p){return s+p._c;},0), gl:gl, runs:runs, inSched:inSched,
    research:(D.research||[]).slice().sort(function(a,b){return (+b.diem||0)-(+a.diem||0);}) };
}

/* ---------- 5. Giao diện ---------- */
function css(){ if(document.getElementById('bot-css')) return; var s=document.createElement('style'); s.id='bot-css'; s.textContent=
'.bot-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap}'+
'.bot-st{display:flex;gap:10px;align-items:center;background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);padding:9px 13px;font-size:12px}'+
'.bot-st .dot{width:8px;height:8px;border-radius:50%;background:var(--teal-2)}.bot-st .dot.off{background:var(--rust)}'+
'.bot-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0}'+
'.bot-card{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);padding:14px 16px;min-width:0}'+
'.bot-k .l{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.bot-k .v{font-size:24px;font-weight:600;color:var(--ink);margin-top:4px}.bot-k .d{font-size:11px;color:var(--faint);margin-top:2px}'+
'.bot-g2{display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-bottom:14px}'+
'.bot-h{font-family:var(--serif);font-size:16px;font-weight:600;color:var(--ink)}.bot-s{font-size:11px;color:var(--faint);margin:2px 0 12px}'+
'.bot-ev{margin-top:12px;border-top:1px solid var(--line);padding-top:9px;font-size:12px;line-height:1.75;color:var(--text)}.bot-ev>b{display:block;font-size:10px;letter-spacing:.12em;color:#9B7BEA}'+
'.bot-tl div{display:flex;gap:10px;font-size:12px;padding:5px 0;border-bottom:1px dashed var(--line)}.bot-tl b{min-width:52px;color:var(--muted);font-weight:500}'+
'.bot-bar{height:8px;background:var(--paper-2);border-radius:4px;overflow:hidden;min-width:60px}.bot-bar i{display:block;height:100%;background:#9B7BEA}'+
'.bot-tabs{display:flex;gap:6px;margin:4px 0 14px;flex-wrap:wrap}.bot-tabs button{background:var(--paper);border:1px solid var(--line);color:var(--muted);font:inherit;font-size:12px;padding:6px 12px;border-radius:7px;cursor:pointer}.bot-tabs button.on{background:#7B4FD6;border-color:#7B4FD6;color:#fff}'+
'.bot-empty{border:1px dashed var(--line);border-radius:var(--radius);padding:22px;text-align:center;color:var(--muted);font-size:12.5px}'+
'.bot-f{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}.bot-f input,.bot-f select{font:inherit;font-size:12px;padding:6px 9px;border:1px solid var(--line);border-radius:7px;background:var(--paper);color:var(--text)}'+
'@media(max-width:900px){.bot-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.bot-g2{grid-template-columns:1fr}}';
document.head.appendChild(s); }

function kpi(l,v,d,c){ return '<div class="bot-card bot-k"><div class="l">'+l+'</div><div class="v"'+(c?' style="color:'+c+'"':'')+'>'+v+'</div><div class="d">'+d+'</div></div>'; }
function delta(a,b){ if(!b) return 'tuần trước: 0'; var x=a-b; return (x>=0?'▲ ':'▼ ')+Math.abs(x)+' so với tuần trước'; }

function head(){
  var nr=nextRun(), paused=/tạm dừng/i.test(cfg('TRANG_THAI'));
  var last=S.k.runs[0];
  return '<div class="page-head bot-top"><div><div class="page-h1">Bot đăng bài tuyển dụng</div>'+
    '<div class="page-lead">Đăng '+E(cfg('NGAY_DANG')||'T2, T4, T6, CN')+' lúc '+E(cfg('KHUNG_GIO')||'09:00')+' · '+E(cfg('SO_BAI_MOI_NGAY')||'3')+' bài/ngày · tối đa '+E(cfg('MAX_BAI_GROUP_TUAN')||'2')+' bài/group/tuần. Nguồn: file <b>BOT ĐĂNG BÀI TUYỂN DỤNG</b> (chỉ đọc). <span style="color:var(--faint)">Đọc lúc '+E(S.data.updated||'')+(S.loading?' · đang làm mới…':'')+'</span></div></div>'+
    '<div class="bot-st"><span class="dot'+(paused?' off':'')+'"></span><div><b>'+(paused?'Bot đang TẠM DỪNG':(nr?'Đợt kế tiếp: '+hm(nr)+' '+(d0(nr).getTime()===d0(new Date()).getTime()?'hôm nay':dm(nr)):'Chưa có lịch'))+'</b>'+
    '<div style="color:var(--faint)">'+(last?'Đợt gần nhất '+E(last.batDau)+' — '+(+last.daDang||0)+'/'+(+last.keHoach||0)+' đã đăng'+(/có/i.test(last.dungKhanCap||'')?' · <span style="color:var(--rust)">đã dừng khẩn cấp</span>':''):'Chưa chạy đợt nào')+'</div></div></div></div>';
}

function tabs(){ return '<div class="bot-tabs">'+[['tq','Tổng quan'],['nk','Nhật ký đăng'],['hq','Hiệu quả group'],['rs','Research group']].map(function(o){
  return '<button class="'+(S.sub===o[0]?'on':'')+'" onclick="__botSub(\''+o[0]+'\')">'+o[1]+'</button>'; }).join('')+'</div>'; }

function groupTable(gl,limit){
  if(!gl.length) return '<div class="bot-empty">Chưa có bài nào trong 30 ngày.</div>';
  var mx=Math.max.apply(null,gl.map(function(g){return g.cmt/g.bai;}))||1;
  return '<div class="table-wrap"><table class="dt"><thead><tr><th>Group</th><th>Bài</th><th>Bị gỡ</th><th>Comment</th><th style="width:26%">Comment / bài</th></tr></thead><tbody>'+
    gl.slice(0,limit||999).map(function(g){ var r=g.cmt/g.bai; return '<tr><td>'+E(g.ten)+'</td><td>'+g.bai+'</td><td>'+(g.go?'<span style="color:var(--rust)">'+g.go+'</span>':'0')+'</td><td>'+g.cmt+'</td><td><div style="display:flex;gap:8px;align-items:center"><div class="bot-bar" style="flex:1"><i style="width:'+Math.max(2,Math.round(r/mx*100))+'%"></i></div><span style="font-size:11px;color:var(--muted)">'+r.toFixed(1)+'</span></div></td></tr>'; }).join('')+'</tbody></table></div>';
}
function evGroups(gl){
  if(gl.length<2) return '';
  var tot=gl.reduce(function(s,g){return s+g.cmt;},0), top=gl.slice(0,3), topC=top.reduce(function(s,g){return s+g.cmt;},0);
  var dead=gl.filter(function(g){return g.bai>=3 && g.cmt===0;}), bad=gl.filter(function(g){return g.bai>=2 && g.go/g.bai>=0.5;});
  var t=[];
  if(tot && gl.length>3) t.push(top.length+' group đầu chiếm '+pc(topC,tot)+'% comment ('+top.map(function(g){return E(g.ten);}).join(', ')+').');
  if(dead.length) t.push(dead.map(function(g){return '"'+E(g.ten)+'"';}).join(', ')+' đã đăng '+dead.map(function(g){return g.bai;}).join('/')+' bài nhưng 0 comment → cân nhắc bỏ khỏi lịch.');
  if(bad.length) t.push(bad.map(function(g){return '"'+E(g.ten)+'"';}).join(', ')+' bị gỡ từ 50% số bài trở lên → kiểm tra lại quy định group.');
  if(!t.length) t.push('Các group đang cho kết quả tương đối đều, chưa có group nào cần bỏ.');
  return '<div class="bot-ev"><b>TỰ ĐÁNH GIÁ</b>'+t.join(' ')+'</div>';
}

function lastRun(){
  var r=S.k.runs[0];
  if(!r) return '<div class="bot-card"><div class="bot-h">Đợt chạy gần nhất</div><div class="bot-s">Bot chưa chạy đợt nào.</div></div>';
  var L=S.k.P.filter(function(p){return p.maDot===r.maDot;}).sort(function(a,b){return (a._d||0)-(b._d||0);});
  var bd=pd(r.batDau), kt=pd(r.ketThuc);
  return '<div class="bot-card"><div class="bot-h">Đợt chạy gần nhất</div><div class="bot-s">'+E(r.maDot)+' · '+E(r.batDau)+'</div><div class="bot-tl">'+
    (bd?'<div><b>'+hm(bd)+'</b>Bắt đầu · '+(+r.keHoach||L.length)+' group trong lịch</div>':'')+
    L.map(function(p){ return '<div><b>'+(p._d?hm(p._d):'')+'</b><span>'+E(p.tenGroup)+' — '+pill(p._s,p.trangThai)+(p.ghiChu&&p._s!=='ok'?' <span style="color:var(--faint)">'+E(p.ghiChu)+'</span>':'')+'</span></div>'; }).join('')+
    (kt?'<div><b>'+hm(kt)+'</b>Kết thúc · '+(+r.daDang||0)+'/'+(+r.keHoach||0)+' đã đăng'+(+r.choDuyet?' · '+r.choDuyet+' chờ duyệt':'')+(+r.loi?' · '+r.loi+' lỗi':'')+'</div>':'<div><b>…</b>Đang chạy</div>')+
    '</div>'+(/có/i.test(r.dungKhanCap||'')?'<div class="bot-ev" style="color:var(--rust)"><b style="color:var(--rust)">DỪNG KHẨN CẤP</b>'+E(r.ghiChu||'')+'</div>':'')+'</div>';
}

function logTable(){
  var q=low(S.f.q), st=S.f.st;
  var L=S.k.P.filter(function(p){ return (!q||low(p.tenGroup).indexOf(q)>=0) && (!st||p._s===st); }).sort(function(a,b){return (b._d||0)-(a._d||0);});
  var h='<div class="bot-f"><input id="bot-q" placeholder="Tìm group…" value="'+E(S.f.q)+'" oninput="__botF()"><select id="bot-st" onchange="__botF()"><option value="">Mọi trạng thái</option>'+
    ['ok','cho','loi','go'].map(function(k){return '<option value="'+k+'"'+(st===k?' selected':'')+'>'+STP[k][1]+'</option>';}).join('')+'</select><span style="font-size:11px;color:var(--faint);align-self:center">'+L.length+' bài</span></div>';
  if(!L.length) return h+'<div class="bot-empty">Chưa có bài nào.</div>';
  return h+'<div class="table-wrap"><table class="dt"><thead><tr><th>Thời gian</th><th>Group</th><th>Mẫu</th><th>Trạng thái</th><th>Comment</th><th>Bài</th><th>Ghi chú</th></tr></thead><tbody>'+
    L.slice(0,200).map(function(p){ return '<tr><td>'+E(p.thoiGian)+'</td><td>'+E(p.tenGroup)+'</td><td>'+E(p.mau)+'</td><td>'+pill(p._s,p.trangThai)+'</td><td>'+(p.comment===''||p.comment==null?'–':E(p.comment))+'</td><td>'+(/^https?:/.test(p.linkBai||'')?'<a href="'+E(p.linkBai)+'" target="_blank" rel="noopener">Mở</a>':'–')+'</td><td style="color:var(--faint)">'+E(p.ghiChu||'')+'</td></tr>'; }).join('')+'</tbody></table></div>';
}

function researchTable(){
  var R=S.k.research;
  if(!R.length) return '<div class="bot-empty">Bot chưa quét group. Bot chỉ quét các group nick đã tham gia, không tự join.</div>';
  return '<div class="table-wrap"><table class="dt"><thead><tr><th>Group</th><th>Thành viên</th><th>Bài/ngày</th><th>Cho đăng tuyển</th><th>Điểm</th><th>Đề xuất</th><th>Ngày quét</th></tr></thead><tbody>'+
    R.map(function(g){ var cd=low(g.choDang); var c=/^có/.test(cd)?'teal':/cấm|không/.test(cd)?'rust':'clay';
      return '<tr><td>'+(/^https?:/.test(g.link||'')?'<a href="'+E(g.link)+'" target="_blank" rel="noopener">'+E(g.ten)+'</a>':E(g.ten))+'</td><td>'+E(g.thanhVien)+'</td><td>'+E(g.baiNgay)+'</td><td><span class="pill '+c+'">'+E(g.choDang||'—')+'</span></td><td><b>'+E(g.diem||'–')+'</b></td><td>'+E(g.deXuat||'')+'</td><td style="color:var(--faint)">'+E(g.ngayQuet)+'</td></tr>'; }).join('')+'</tbody></table></div>'+
    '<div class="bot-ev"><b>CÁCH CHẤM</b>Độ liên quan (booking KOC, việc remote, TikTok Shop) · quy mô · mức hoạt động · quy định đăng tin tuyển dụng. Muốn đưa group vào lịch: ở file bot, tab Group, đặt cột "Trong lịch" = Có.</div>';
}

function page(){
  css();
  if(!S.loaded){
    if(S.error) return '<div class="page-head"><div class="page-h1">Bot đăng bài tuyển dụng</div></div><div class="bot-empty" style="border-color:var(--rust);color:var(--rust)">Không tải được dữ liệu: '+E(S.error)+' · <a href="javascript:void(0)" onclick="__bot.error=null;__botLoad()">thử lại</a></div>';
    return '<div class="page-head"><div class="page-h1">Bot đăng bài tuyển dụng</div></div><div class="bot-empty">Đang đọc file bot…</div>';
  }
  var k=S.k=calc(), h=head()+tabs();
  if(S.sub==='nk') return h+'<div class="bot-card">'+logTable()+'</div>';
  if(S.sub==='hq') return h+'<div class="bot-card"><div class="bot-h">Hiệu quả theo group</div><div class="bot-s">30 ngày gần nhất · xếp theo comment / bài</div>'+groupTable(k.gl)+evGroups(k.gl)+'</div>';
  if(S.sub==='rs') return h+'<div class="bot-card"><div class="bot-h">Research group</div><div class="bot-s">Trong các group nick đã tham gia · không tự join</div>'+researchTable()+'</div>';
  h+='<div class="bot-kpis">'+
    kpi('Bài đã đăng (tuần)',k.okW+k.choW,delta(k.wk.filter(function(p){return p._s==='ok'||p._s==='cho';}).length,k.pwk.filter(function(p){return p._s==='ok'||p._s==='cho';}).length))+
    kpi('Tỷ lệ hiển thị',k.doneN?k.hienThi+'%':'—',(k.goW?k.goW+' bài bị gỡ tuần này':'không bài nào bị gỡ tuần này'),k.hienThi&&k.hienThi<70?'var(--rust)':'')+
    kpi('Comment (tuần)',k.cmtW,'trên các bài tuần này')+
    kpi('Group trong lịch',k.inSched,(k.research.length?k.research.length+' group đã research':'chưa research'))+'</div>';
  h+='<div class="bot-g2"><div class="bot-card"><div class="bot-h">Hiệu quả theo group</div><div class="bot-s">30 ngày · top 5 theo comment / bài</div>'+groupTable(k.gl,5)+evGroups(k.gl)+'</div>'+lastRun()+'</div>';
  return h;
}
/* ---------- 7. Giao diện v2 (mockup tab Bot duyệt 07/11/2026) — thay trang Tổng quan, giữ tab Hiệu quả group & Research ---------- */
function nk(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'d').toLowerCase().replace(/[^a-z0-9]/g,''); }
function gv(o,cands){ if(!o) return ''; var keys=Object.keys(o), N={}; keys.forEach(function(k){ N[nk(k)]=k; });
  for(var i=0;i<cands.length;i++){ var c=nk(cands[i]); if(N[c]!=null && o[N[c]]!=='' && o[N[c]]!=null) return o[N[c]]; }
  for(var j=0;j<cands.length;j++){ var c2=nk(cands[j]); for(var k in N){ if(k.indexOf(c2)===0 && o[N[k]]!=='' && o[N[k]]!=null) return o[N[k]]; } }
  return ''; }
function css2(){ if(document.getElementById('bot-css2')) return; var s=document.createElement('style'); s.id='bot-css2'; s.textContent=
'.b2-head{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;flex-wrap:wrap;margin-bottom:14px}'+
'.b2-head .page-h1{margin:0}.b2-sub{font-size:12.5px;color:var(--muted);margin-top:4px}'+
'.b2-st{display:flex;gap:10px;align-items:center;flex-wrap:wrap}'+
'.b2-pill{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;padding:5px 11px;border-radius:20px;white-space:nowrap}.b2-pill::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}'+
'.b2-on{background:var(--goodbg);color:var(--good)}.b2-wait{background:var(--warnbg);color:var(--warn)}.b2-bad{background:var(--badbg);color:var(--bad)}.b2-info{background:var(--x-accsoft,rgba(31,182,213,.14));color:var(--x-accink,#0e7f99)}.b2-mute{background:var(--paper-2);color:var(--muted)}'+
'.b2-next{background:#10242b;color:#fff;border-radius:14px;padding:9px 14px;display:flex;gap:12px;align-items:center}.b2-next small{display:block;font-size:10.5px;opacity:.7}.b2-next b{font-size:14.5px}'+
'.b2-next .cd{font-family:ui-monospace,Menlo,monospace;font-size:13px;background:rgba(255,255,255,.12);padding:4px 8px;border-radius:8px}'+
'.b2-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:16px;min-width:0}'+
'.b2-card h3{font-size:13.5px;font-weight:700;color:var(--ink);margin:0}.b2-card .cs{font-size:11.5px;color:var(--muted);margin-top:2px}'+
'.b2-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:14px}'+
'.b2-kpi .l{font-size:12px;font-weight:600;color:var(--text)}.b2-kpi .v{font-size:28px;font-weight:800;color:var(--ink);margin-top:6px;letter-spacing:-.02em}.b2-kpi .n{font-size:11px;color:var(--muted)}'+
'.b2-row{display:grid;grid-template-columns:1.25fr 1fr;gap:14px;margin-bottom:14px}.b2-col{display:flex;flex-direction:column;gap:14px;min-width:0}'+
'.b2-week{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:12px}'+
'.b2-day{border-radius:12px;padding:9px 4px;text-align:center;font-size:11px;background:var(--paper-2);color:var(--muted)}.b2-day b{display:block;font-size:13px;color:var(--text)}'+
'.b2-day.post{background:var(--x-accsoft,rgba(31,182,213,.14));color:var(--x-accink,#0e7f99)}.b2-day.done{background:var(--goodbg);color:var(--good)}.b2-day.today{outline:2px solid var(--x-acc,#1fb6d5);outline-offset:-2px}.b2-day .c{display:block;margin-top:3px;font-weight:700}'+
'.b2-runs{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}.b2-runs button{font-weight:600;font-size:11px;font-family:inherit;padding:4px 10px;border-radius:14px;border:0;background:var(--paper-2);color:var(--muted);cursor:pointer}.b2-runs button.on{background:#10242b;color:#fff}'+
'.b2-tl{margin-top:12px;position:relative}.b2-tl::before{content:"";position:absolute;left:58px;top:6px;bottom:6px;width:2px;background:var(--line)}'+
'.b2-step{display:grid;grid-template-columns:48px 22px 1fr;gap:10px;align-items:start;padding:7px 0;font-size:12.5px}'+
'.b2-step time{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:var(--muted);text-align:right;padding-top:2px}'+
'.b2-dot{width:14px;height:14px;border-radius:50%;margin:3px 0 0 4px;background:var(--paper);border:3px solid var(--x-acc,#1fb6d5);position:relative;z-index:1}'+
'.b2-dot.ok{border-color:var(--good)}.b2-dot.warn{border-color:var(--warn)}.b2-dot.bad{border-color:var(--bad)}.b2-dot.mute{border-color:var(--faint)}'+
'.b2-step b{color:var(--ink)}.b2-step small{display:block;color:var(--muted);font-size:11.5px;margin-top:1px}'+
'.b2-tm{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-top:10px}'+
'.b2-tm div{border-radius:12px;padding:10px;background:var(--paper-2);font-size:11.5px;color:var(--muted)}.b2-tm b{display:block;color:var(--ink);font-size:12.5px}'+
'.b2-tm div.nx{background:var(--x-accsoft,rgba(31,182,213,.12));outline:1.5px solid var(--x-acc,#1fb6d5)}'+
'.b2-code{font-family:ui-monospace,Menlo,monospace;font-size:11px;background:var(--paper-2);padding:2px 6px;border-radius:6px}'+
'.b2-bar{height:6px;border-radius:6px;background:var(--paper-2);width:64px;overflow:hidden;display:inline-block;vertical-align:middle;margin-right:6px}.b2-bar i{display:block;height:100%;background:var(--x-acc,#1fb6d5);border-radius:6px}'+
'.b2-g a{color:inherit;text-decoration:none}.b2-g a:hover{text-decoration:underline}.b2-g b{display:block;color:var(--ink);font-weight:600}.b2-g small{color:var(--muted);font-size:10.5px}'+
'.b2-tabs{display:flex;gap:6px;margin:0 0 14px;flex-wrap:wrap}.b2-tabs button{font-weight:600;font-size:12px;font-family:inherit;padding:6px 12px;border-radius:14px;border:1px solid var(--line);background:var(--paper);color:var(--muted);cursor:pointer}.b2-tabs button.on{background:#10242b;border-color:#10242b;color:#fff}'+
'.b2-mb{margin-bottom:14px}'+
'@media(max-width:1000px){.b2-row{grid-template-columns:1fr}.b2-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:560px){.b2-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.b2-tl::before{left:50px}.b2-step{grid-template-columns:40px 22px 1fr}}';
document.head.appendChild(s); }

function pill2(cls,t){ return '<span class="b2-pill '+cls+'">'+E(t)+'</span>'; }
function stPill(k,raw){ var m={ok:['b2-on','Đã đăng'],cho:['b2-wait','Chờ duyệt'],loi:['b2-bad','Thất bại'],go:['b2-bad','Bị gỡ']}[k]; return m?pill2(m[0],m[1]):pill2('b2-mute',raw||'—'); }
function grpRows(){
  var D=S.data, ws=weekStart(new Date()), max=+cfg('MAX_BAI_GROUP_TUAN')||2;
  return (D.groups||[]).map(function(g){
    var ma=String(gv(g,['maGroup','ma','Mã group'])||''), ten=String(gv(g,['tenGroup','ten','Tên group'])||ma), link=String(gv(g,['link'])||'');
    var inS=/^có$/i.test(String(gv(g,['trongLich','Trong lịch'])||'').trim());
    var duyet=String(gv(g,['canDuyet','Cần duyệt'])||''), note=String(gv(g,['ghiChu','Ghi chú'])||'');
    var tv=(note.match(/([\d.,]+\s*K)\s*TV/i)||[])[1]||String(gv(g,['thanhVien'])||''), hd=(note.match(/(\d+\+?\s*bài\/ngày)/i)||[])[1]||'';
    var mine=S.k.P.filter(function(p){ return (ma&&p.maGroup===ma)||(!ma&&p.tenGroup===ten); }).sort(function(a,b){return (b._d||0)-(a._d||0);});
    var wk=mine.filter(function(p){ return p._d&&p._d>=ws&&p._s!=='loi'; }), last=mine[0];
    var st;
    if(!inS) st=pill2('b2-mute','Ngoài lịch');
    else if(/treo/i.test(duyet)) st=pill2('b2-bad','Bỏ qua · treo bài'+((duyet.match(/(\d{1,2}\/\d{1,2})/)||[])[1]?' '+duyet.match(/(\d{1,2}\/\d{1,2})/)[1]:''));
    else if(wk.length>=max) st=pill2('b2-mute','Đủ '+max+' bài tuần này');
    else if(last&&last._s==='cho'&&wk.length) st=pill2('b2-wait','Chờ duyệt');
    else if(wk.length) st=pill2('b2-on','Đã đăng tuần này');
    else st=pill2('b2-info','Sẵn sàng');
    return { ma:ma, ten:ten, link:link, tv:tv, hd:hd, why:(duyet.split('–')[1]||duyet).trim(), duyet:duyet.replace(/\s*–.*$/,'')||'—', n:wk.length, max:max, last:last, st:st, inS:inS, skip:/treo/i.test(duyet) };
  });
}
function weekCard(){
  var days=(cfg('NGAY_DANG')||'T2, T4, T6, CN').split(/[,\s]+/).map(function(x){return DOW[x.toUpperCase()];}).filter(function(x){return x!=null;});
  var ws=weekStart(new Date()), today=d0(new Date()).getTime(), per=+cfg('SO_BAI_MOI_NGAY')||3, nr=nextRun(), L=['T2','T3','T4','T5','T6','T7','CN'];
  var cells=L.map(function(lb,i){ var d=new Date(ws.getFullYear(),ws.getMonth(),ws.getDate()+i), isP=days.indexOf(d.getDay())>=0;
    var c=S.k.P.filter(function(p){ return p._d&&d0(p._d).getTime()===d.getTime()&&p._s!=='loi'; }).length;
    var future=d.getTime()>today||(d.getTime()===today&&nr&&d0(nr).getTime()===today);
    var cls='b2-day'+(c?' done':isP?' post':'')+(d.getTime()===today?' today':'');
    var txt=c?c+' bài':(isP?(future?per+' bài':'—'):'nghỉ');
    return '<div class="'+cls+'"><b>'+lb+'</b>'+dm(d)+'<span class="c">'+txt+'</span></div>'; }).join('');
  return '<div class="b2-card"><h3>Lịch tuần này</h3><div class="cs">Đăng '+E(cfg('NGAY_DANG')||'T2, T4, T6, CN')+' lúc '+E(cfg('KHUNG_GIO')||'09:00')+' · mỗi group tối đa '+E(cfg('MAX_BAI_GROUP_TUAN')||'2')+' bài/tuần</div><div class="b2-week">'+cells+'</div></div>';
}
function tmplCard(){
  var D=S.data, T=(D.templates||D.mauBai||[]).map(function(t){ return {ma:String(gv(t,['maMau','ma','Mã mẫu'])||''), ten:String(gv(t,['tenMau','ten','Tên mẫu'])||''), on:/^có$/i.test(String(gv(t,['dangDung','Đang dùng'])||'').trim())}; }).filter(function(t){return t.ma&&t.on;});
  var used={}; S.k.P.forEach(function(p){ if(!p.mau||p._s==='loi') return; var u=used[p.mau]||(used[p.mau]={n:0,last:null}); u.n++; if(!u.last||(p._d||0)>(u.last._d||0)) u.last=p; });
  var known=T.length;
  if(!T.length) T=Object.keys(used).sort().map(function(m){return {ma:m,ten:'',on:true};});
  if(!T.length) return '';
  var nx=!known?'':T.slice().sort(function(a,b){ return ((used[a.ma]||{}).n||0)-((used[b.ma]||{}).n||0) || a.ma.localeCompare(b.ma); })[0].ma;
  return '<div class="b2-card"><h3>Mẫu bài đang xoay</h3><div class="cs">Không lặp mẫu trong cùng một group</div><div class="b2-tm">'+
    T.map(function(t){ var u=used[t.ma]; return '<div'+(t.ma===nx?' class="nx"':'')+'><b>'+E(t.ma)+'</b>'+(t.ten?E(t.ten)+'<br>':'')+(u?'dùng '+u.n+' lần · '+E(u.last.maGroup||u.last.tenGroup||''):'chưa dùng')+(t.ma===nx?' · dùng tiếp theo':'')+'</div>'; }).join('')+'</div></div>';
}
function timeline(){
  var runs=S.k.runs; if(!runs.length) return '<div class="b2-card"><h3>Bot đã làm gì · từng bước</h3><div class="cs">Bot chưa chạy đợt nào.</div></div>';
  var i=Math.min(S.run||0,runs.length-1), r=runs[i], bd=pd(r.batDau), kt=pd(r.ketThuc);
  var L=S.k.P.filter(function(p){return p.maDot===r.maDot;}).sort(function(a,b){return (a._d||0)-(b._d||0);});
  var st=[];
  if(bd) st.push([hm(bd),'ok','Bắt đầu đợt · kiểm tra nick','Kế hoạch '+(+r.keHoach||0)+' bài']);
  L.forEach(function(p){ var cls=p._s==='ok'?'ok':p._s==='cho'?'warn':'bad';
    st.push([p._d?hm(p._d):'', cls, 'Đăng '+(p.maGroup?p.maGroup+' · ':'')+(p.tenGroup||''), 'Mẫu '+(p.mau||'—')+' · '+({ok:'bài hiển thị',cho:'chờ admin duyệt',go:'bị gỡ',loi:'thất bại'}[p._s]||p.trangThai||'')+(p.ghiChu?' · '+p.ghiChu:'')]); });
  var skip=grpRows().filter(function(g){return g.inS&&g.skip;});
  st.sort(function(a,b){ return a[0]===b[0]?0:(a[0]<b[0]?-1:1); });
  if(skip.length) st.splice(bd?1:0,0,['', 'warn', 'Bỏ qua '+skip.map(function(g){return g.ma;}).join(' · '), skip.map(function(g){return g.ma+': '+g.why;}).join(' · ')+' → không đăng chồng']);
  var em=/có/i.test(r.dungKhanCap||'');
  if(kt) st.push([hm(kt), em?'bad':'mute', em?'Dừng khẩn cấp':'Kết thúc đợt', (+r.daDang||0)+'/'+(+r.keHoach||0)+' đã đăng'+(+r.choDuyet?' · '+r.choDuyet+' chờ duyệt':'')+(+r.loi?' · '+r.loi+' lỗi':'')+(r.ghiChu?' · '+r.ghiChu:'')]);
  else st.push(['…','', 'Đang chạy','']);
  return '<div class="b2-card"><h3>Bot đã làm gì · từng bước</h3><div class="cs">Mỗi đợt chạy ghi lại từng bước để cùng theo dõi</div>'+
    '<div class="b2-runs">'+runs.slice(0,6).map(function(x,j){ var d=pd(x.batDau); return '<button class="'+(j===i?'on':'')+'" onclick="__botRun('+j+')">'+E(x.maDot)+(d?' · '+dm(d):'')+'</button>'; }).join('')+'</div>'+
    '<div class="b2-tl">'+st.map(function(s){ return '<div class="b2-step"><time>'+E(s[0])+'</time><span class="b2-dot '+s[1]+'"></span><div><b>'+E(s[2])+'</b>'+(s[3]?'<small>'+E(s[3])+'</small>':'')+'</div></div>'; }).join('')+'</div></div>';
}
function groupCard(G){
  if(!G.length) return '<div class="b2-card b2-mb"><h3>Group trong lịch</h3><div class="bot-empty" style="margin-top:10px">Chưa có group. Thêm ở file bot, tab Group.</div></div>';
  return '<div class="b2-card b2-mb"><h3>Group trong lịch</h3><div class="cs">Bot chỉ đăng vào group có "Trong lịch = Có"</div><div class="table-wrap"><table class="dt"><thead><tr><th>Mã</th><th>Group</th><th>Thành viên</th><th>Duyệt bài</th><th>Tuần này</th><th>Đăng gần nhất</th><th>Trạng thái với bot</th></tr></thead><tbody>'+
    G.map(function(g){ return '<tr><td><span class="b2-code">'+E(g.ma||'—')+'</span></td><td class="b2-g"><b>'+(/^https?:/.test(g.link)?'<a href="'+E(g.link)+'" target="_blank" rel="noopener">'+E(g.ten)+'</a>':E(g.ten))+'</b>'+(g.hd?'<small>'+E(g.hd)+'</small>':'')+'</td><td>'+E(g.tv||'—')+'</td><td>'+E(g.duyet)+'</td>'+
      '<td><span class="b2-bar"><i style="width:'+Math.min(100,Math.round(g.n/g.max*100))+'%"></i></span>'+g.n+'/'+g.max+'</td><td>'+(g.last&&g.last._d?dm(g.last._d)+' '+hm(g.last._d)+' · '+E(g.last.mau||''):'—')+'</td><td>'+g.st+'</td></tr>'; }).join('')+'</tbody></table></div></div>';
}
function page2(){
  css(); css2();
  if(!S.loaded) return page();
  var k=S.k=calc();
  var tabs2='<div class="b2-tabs">'+[['tq','Tổng quan'],['hq','Hiệu quả group'],['rs','Research group']].map(function(o){ return '<button class="'+(S.sub===o[0]?'on':'')+'" onclick="__botSub(\''+o[0]+'\')">'+o[1]+'</button>'; }).join('')+'</div>';
  var paused=/tạm dừng/i.test(cfg('TRANG_THAI')), nr=nextRun();
  var head2='<div class="b2-head"><div><div class="page-h1">Bot đăng bài tuyển dụng</div><div class="b2-sub">Đăng tin CTV Booking KOC lên group Facebook · đọc từ file "BOT ĐĂNG BÀI TUYỂN DỤNG"'+(S.data.updated?' · cập nhật '+E(S.data.updated):'')+(S.loading?' · đang làm mới…':'')+'</div></div>'+
    '<div class="b2-st">'+(paused?pill2('b2-bad','Đang TẠM DỪNG'):pill2('b2-on','Đang BẬT'))+
    (nr&&!paused?'<div class="b2-next"><div><small>Lần chạy tới</small><b>'+(['CN','T2','T3','T4','T5','T6','T7'][nr.getDay()])+' '+dm(nr)+' · '+hm(nr)+'</b></div><span class="cd" id="bot-cd" data-t="'+nr.getTime()+'">--:--:--</span></div>':'')+'</div></div>';
  if(S.sub==='hq') return head2+tabs2+'<div class="bot-card"><div class="bot-h">Hiệu quả theo group</div><div class="bot-s">30 ngày gần nhất · xếp theo comment / bài</div>'+groupTable(k.gl)+evGroups(k.gl)+'</div>';
  if(S.sub==='rs') return head2+tabs2+'<div class="bot-card"><div class="bot-h">Research group</div><div class="bot-s">Các group đã quét</div>'+researchTable()+'</div>';
  var G=grpRows(), canPost=G.filter(function(g){return g.inS&&!g.skip;}).length, inS=G.filter(function(g){return g.inS;}).length;
  var sumWk=k.okW+k.choW;
  var kp='<div class="b2-kpis">'+
    '<div class="b2-card b2-kpi"><div class="l">Bài tuần này</div><div class="v">'+sumWk+'</div><div class="n">'+delta(sumWk,k.pwk.filter(function(p){return p._s==='ok'||p._s==='cho';}).length)+'</div></div>'+
    '<div class="b2-card b2-kpi"><div class="l">Đã hiển thị</div><div class="v">'+k.okW+'</div><div class="n">bài lên group tuần này</div></div>'+
    '<div class="b2-card b2-kpi"><div class="l">Chờ admin duyệt</div><div class="v">'+k.choW+'</div><div class="n">tuần này</div></div>'+
    '<div class="b2-card b2-kpi"><div class="l">Bị gỡ / lỗi</div><div class="v"'+((k.goW+k.loiW)?' style="color:var(--bad)"':'')+'>'+(k.goW+k.loiW)+'</div><div class="n">'+((k.goW+k.loiW)?'cần kiểm tra':'nick an toàn')+'</div></div>'+
    '<div class="b2-card b2-kpi"><div class="l">Group đăng được</div><div class="v">'+canPost+'/'+inS+'</div><div class="n">'+(inS-canPost?(inS-canPost)+' group treo bài cũ':'trong lịch')+'</div></div></div>';
  var log='<div class="b2-card"><h3>Nhật ký bài đăng</h3><div class="cs">Bot mở lại link bài sau đăng để cập nhật trạng thái và số comment</div>'+logTable()+'</div>';
  return head2+tabs2+kp+'<div class="b2-row">'+timeline()+'<div class="b2-col">'+weekCard()+tmplCard()+'</div></div>'+groupCard(G)+log;
}
/* đồng hồ đếm ngược tới lần chạy tới */
setInterval(function(){ var el=document.getElementById('bot-cd'); if(!el) return; var s=Math.max(0,Math.floor((+el.getAttribute('data-t')-Date.now())/1000));
  var d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), x=s%60;
  el.textContent=(d?d+'n ':'')+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0'); },1000);
window.__botRun=function(j){ S.run=j; render(); };

function render(){ var c=document.getElementById('content'); if(c) c.innerHTML=page2(); }
window.__botLoad=load;
window.__botSub=function(s){ S.sub=s; render(); };
window.__botF=function(){ S.f.q=(document.getElementById('bot-q')||{}).value||''; S.f.st=(document.getElementById('bot-st')||{}).value||'';
  var pos=(document.getElementById('bot-q')||{}).selectionStart; render(); var q=document.getElementById('bot-q'); if(q&&document.activeElement!==q&&S.f.q){ q.focus(); try{q.setSelectionRange(pos,pos);}catch(e){} } };

/* ---------- 6. Router ---------- */
var prevGo=window.__botPrevGo||window.go; window.__botPrevGo=prevGo;
window.go=function(id){ prevGo.apply(this,arguments); if(id!==TAB) return; render(); load(); };
if(window.__bxAppBooted){ try{ window.renderNav(); if(window.currentTab) window.go(window.currentTab); }catch(e){ console.warn('[bot] late boot',e); } }
setInterval(function(){ if(window.BX_ROLE && !S.loading && document.visibilityState==='visible' && window.currentTab===TAB) load(); },120000);
})();
