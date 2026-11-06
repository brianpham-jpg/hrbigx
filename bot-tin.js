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
function render(){ var c=document.getElementById('content'); if(c) c.innerHTML=page(); }
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
