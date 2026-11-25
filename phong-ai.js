/* ============================================================
   BigX HR — phong-ai.js  (tab "Phòng AI", mockup duyệt 25/11/2026)
   - Đợt 1: CHỈ mục "Rủi ro hệ thống" chạy thật (đọc API_URL?action=health).
     Các mục khác (Trao đổi, Robot, Nhiệm vụ…) hiện "Sắp có" — dựng ở đợt sau.
   - Banner đỏ đầu trang (mọi tab) khi có tác vụ tự dừng.
   - Chạy lại / Tạm dừng: chỉ admin (máy chủ kiểm tra lần nữa).
   - KHÔNG sửa app.js / module khác: chỉ chèn 1 nhóm menu + bọc go(). Gỡ: xoá dòng phong-ai.js trong index.html.
   ============================================================ */
(function(){
'use strict';
if(window.__paiLoaded) return; window.__paiLoaded=true;
var TAB='phong-ai', LS='bigx_pai_health_v1';

/* ---------- 1. Menu: nhóm riêng "Phòng AI" ---------- */
try{
  if(!NAV.some(function(g){ return g.items.some(function(it){ return it.id===TAB; }); })){
    var item={ id:TAB, label:'Phòng AI', icon:'ti-robot', lead:'Robot làm việc tự động · giám sát rủi ro hệ thống.', points:[] };
    var grp={ group:'Phòng AI', items:[item] };
    NAV.push(grp); MAP[TAB]={item:item, group:grp};
  }
}catch(e){ console.warn('[pai] nav',e); }

/* ---------- 2. Dữ liệu ---------- */
var S=window.__pai={ data:null, loading:false, error:null, sub:'risk', filter:'all', busy:'' };
try{ var c0=JSON.parse(localStorage.getItem(LS)||'null'); if(c0&&c0.ok) S.data=c0; }catch(e){}
function load(){
  if(S.loading||!window.BX_ROLE) return; S.loading=true; S.error=null;
  var url=API_URL+'?action=health';
  (window.bxAuthedFetch?window.bxAuthedFetch(url,{cache:'no-store'}):fetch(url,{cache:'no-store'}))
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(d){ if(!d||!d.ok) throw new Error((d&&(d.error||d.reason))||'API lỗi'); set(d); })
    .catch(function(e){ S.error=e.message||'Lỗi kết nối'; })
    .then(function(){ S.loading=false; if(window.currentTab===TAB) render(); });
}
function set(d){ S.data=d; try{ localStorage.setItem(LS,JSON.stringify(d)); }catch(e){} banner(); }
function act(action, job){
  if(window.BX_ROLE!=='admin'){ try{ bxViewerToast(); }catch(e){} return; }
  S.busy=action+(job||''); render();
  var opt={ method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ key:API_KEY, action:action, job:job||'' }) };
  (window.bxAuthedFetch?window.bxAuthedFetch(API_URL,opt):fetch(API_URL,opt))
    .then(function(r){ return r.json(); })
    .then(function(d){ if(!d||!d.ok) throw new Error((d&&d.error)||'Không thực hiện được'); set(d); })
    .catch(function(e){ S.error=e.message||'Lỗi kết nối'; })
    .then(function(){ S.busy=''; if(window.currentTab===TAB) render(); });
}

/* ---------- 3. Tiện ích ---------- */
function E(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
var ST={ run:['pai-st-run','Đang chạy'], warn:['pai-st-warn','Cảnh báo'], stop:['pai-st-stop','Đã dừng'] };
function st(s){ var p=ST[s]||ST.run; return '<span class="pai-st '+p[0]+'">'+p[1]+'</span>'; }
function jobs(){ return (S.data&&S.data.jobs)||[]; }
function stopped(){ return jobs().filter(function(j){ return j.status==='stop'; }); }

/* ---------- 4. CSS (theo mockup: menu trái mảnh + bảng gọn) ---------- */
function css(){
  if(document.getElementById('pai-css')) return;
  var s=document.createElement('style'); s.id='pai-css'; s.textContent=
'.pai-app{display:grid;grid-template-columns:210px 1fr;background:var(--x-s1,#FBF7F1);border:1px solid var(--x-line,#E3D5C2);border-radius:12px;min-height:620px;overflow:hidden;font-size:13px;color:var(--x-tx2,#4A3326)}'+
'.pai-side{border-right:1px solid var(--x-line,#E3D5C2);padding:14px 10px}'+
'.pai-ws{display:flex;align-items:center;gap:8px;padding:6px 8px 14px;font-weight:600;color:var(--x-tx,#3B2418)}'+
'.pai-ws b{width:22px;height:22px;border-radius:6px;background:var(--x-tx,#3B2418);color:var(--x-s1,#FBF7F1);display:grid;place-items:center;font-size:11px}'+
'.pai-grp{font-size:10.5px;letter-spacing:.06em;color:var(--x-fa,#7A6252);padding:14px 8px 6px;font-weight:600}'+
'.pai-it{display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:7px;font-weight:500;cursor:pointer;color:var(--x-tx2,#4A3326)}'+
'.pai-it i{font-size:16px;color:var(--x-mu,#62493A)}.pai-it:hover{background:var(--x-s2,#F2E8DA)}'+
'.pai-it.on{background:var(--x-s3,#EADDCB);color:var(--x-tx,#3B2418)}'+
'.pai-it.off{color:var(--x-fa,#7A6252);cursor:default}.pai-it.off:hover{background:none}'+
'.pai-it .c{margin-left:auto;font-size:11px;color:var(--x-fa,#7A6252)}.pai-it .c.hot{color:#A3301E;font-weight:700}'+
'.pai-main{min-width:0;display:flex;flex-direction:column}'+
'.pai-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--x-line,#E3D5C2);gap:10px}'+
'.pai-bar .t{font-weight:600;color:var(--x-tx,#3B2418)}.pai-bar small{color:var(--x-fa,#7A6252);font-weight:400;margin-left:6px}'+
'.pai-b{border:1px solid var(--x-line,#E3D5C2);background:var(--x-s1,#FBF7F1);color:var(--x-tx,#3B2418);padding:6px 11px;border-radius:7px;font-size:12px;font-weight:500;font-family:inherit;display:inline-flex;gap:6px;align-items:center;cursor:pointer;white-space:nowrap}'+
'.pai-b.dk{background:var(--x-tx,#3B2418);color:var(--x-s1,#FBF7F1);border-color:var(--x-tx,#3B2418)}.pai-b[disabled]{opacity:.55;cursor:wait}'+
'.pai-kp{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--x-line,#E3D5C2)}'+
'.pai-kp>div{padding:14px 16px;border-right:1px solid var(--x-line2,#ECE1D2)}.pai-kp>div:last-child{border-right:0}'+
'.pai-kp small{color:var(--x-fa,#7A6252)}.pai-kp b{display:block;font-size:22px;color:var(--x-tx,#3B2418);margin-top:4px}'+
'.pai-tb{display:flex;gap:6px;padding:10px 16px;border-bottom:1px solid var(--x-line2,#ECE1D2)}'+
'.pai-tb span{font-size:12px;color:var(--x-mu,#62493A);padding:4px 8px;border-radius:6px;cursor:pointer}.pai-tb span.on{background:var(--x-s3,#EADDCB);color:var(--x-tx,#3B2418);font-weight:600}'+
'.pai-t{width:100%;border-collapse:collapse}.pai-t th{text-align:left;font-size:11px;color:var(--x-fa,#7A6252);font-weight:600;padding:9px 16px;border-bottom:1px solid var(--x-line,#E3D5C2)}'+
'.pai-t td{padding:11px 16px;border-bottom:1px solid var(--x-line2,#ECE1D2);vertical-align:middle}'+
'.pai-t td b{color:var(--x-tx,#3B2418)}.pai-t td small{color:var(--x-fa,#7A6252)}.pai-t tr.stop td{background:#FCF1EE}'+
'.pai-t .err{color:#A3301E;font-size:12px}'+
'.pai-st{font-size:11px;font-weight:600;padding:2px 8px;border-radius:5px;white-space:nowrap}'+
'.pai-st-run{background:#E3EFE6;color:#22633D}.pai-st-warn{background:#F4E8CF;color:#6E4706}.pai-st-stop{background:#F6E3DF;color:#A3301E}'+
'.pai-rules{padding:14px 16px;display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;font-size:12.5px;border-top:1px solid var(--x-line,#E3D5C2)}'+
'.pai-rules h4{grid-column:1/-1;margin:0 0 4px;font-size:11px;color:var(--x-fa,#7A6252);letter-spacing:.06em}'+
'.pai-log{padding:0 0 6px}.pai-soon{padding:60px 20px;text-align:center;color:var(--x-fa,#7A6252)}'+
'.pai-msg{margin:10px 16px 0;padding:8px 12px;border-radius:8px;background:#F6E3DF;color:#8E2A1A;font-size:12.5px}'+
'#pai-alert{display:none;align-items:center;gap:10px;margin:0 0 12px;background:#F6E3DF;border:1px solid #EBCBC4;color:#8E2A1A;border-radius:10px;padding:10px 14px;font-weight:500;font-size:13px}'+
'#pai-alert i{font-size:18px}#pai-alert .sp{flex:1}#pai-alert button{border:1px solid #EBCBC4;background:#fff;color:#8E2A1A;border-radius:7px;padding:6px 11px;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer}'+
'@media(max-width:860px){.pai-app{grid-template-columns:1fr}.pai-side{border-right:0;border-bottom:1px solid var(--x-line,#E3D5C2)}.pai-kp{grid-template-columns:1fr 1fr}.pai-rules{grid-template-columns:1fr}.pai-t{display:block;overflow-x:auto}}';
  document.head.appendChild(s);
}

/* ---------- 5. Banner đỏ (mọi tab) ---------- */
function banner(){
  css();
  var c=document.getElementById('content'); if(!c||!c.parentNode) return;
  var el=document.getElementById('pai-alert');
  if(!el){ el=document.createElement('div'); el.id='pai-alert'; c.parentNode.insertBefore(el,c); }
  var s=stopped();
  if(!s.length){ el.style.display='none'; return; }
  var f=s[0];
  el.innerHTML='<i class="ti ti-alert-octagon"></i><span class="sp"><b>'+s.length+' tác vụ đã tự dừng:</b> '+
    E(s.map(function(j){return j.name;}).join(', '))+' — '+E(f.note||'')+(f.stoppedAt?' (lúc '+E(f.stoppedAt)+')':'')+'. Đã gửi email cho anh.</span>'+
    '<button type="button" onclick="__paiOpen()">Xem chi tiết</button>';
  el.style.display='flex';
}

/* ---------- 6. Trang ---------- */
var MENU=[
  ['chat','ti-message-2','Trao đổi'],['robot','ti-robot','Robot'],['task','ti-list-check','Nhiệm vụ'],['duyet','ti-clipboard-check','Chờ duyệt'],
  '|GIÁM SÁT',['risk','ti-alert-triangle','Rủi ro hệ thống'],['sec','ti-shield-lock','Bảo mật'],['log','ti-history','Nhật ký'] ];
var LIVE={ risk:1, log:1 };
function side(){
  var ns=stopped().length;
  return '<aside class="pai-side"><div class="pai-ws"><b>AI</b>Phòng AI</div>'+MENU.map(function(m){
    if(typeof m==='string') return '<div class="pai-grp">'+m.slice(1)+'</div>';
    var on=S.sub===m[0], live=LIVE[m[0]];
    var cnt=m[0]==='risk'&&ns?'<span class="c hot">'+ns+'</span>':(!live?'<span class="c">Sắp có</span>':'');
    return '<div class="pai-it'+(on?' on':'')+(live?'':' off')+'"'+(live?' onclick="__paiSub(\''+m[0]+'\')"':'')+'><i class="ti '+m[1]+'"></i>'+m[2]+cnt+'</div>';
  }).join('')+'</aside>';
}
function riskView(){
  var d=S.data, J=jobs(), admin=window.BX_ROLE==='admin';
  var nRun=J.filter(function(j){return j.status!=='stop';}).length, nStop=stopped().length, nWarn=J.filter(function(j){return j.status==='warn';}).length;
  var bar='<div class="pai-bar"><div class="t">Rủi ro hệ thống'+(S.loading?'<small>đang tải…</small>':'')+'</div>'+
    (admin?'<button class="pai-b" '+(S.busy?'disabled':'')+' onclick="__paiAct(\'guardCheckNow\')"><i class="ti ti-refresh"></i>Kiểm tra ngay</button>':'')+'</div>';
  if(!d) return bar+(S.error?'<div class="pai-msg">Không tải được: '+E(S.error)+'</div>':'<div class="pai-soon">Đang tải…</div>');
  var kp='<div class="pai-kp"><div><small>Tác vụ đang chạy</small><b>'+nRun+'</b></div><div><small>Đã tự dừng</small><b'+(nStop?' style="color:#A3301E"':'')+'>'+nStop+'</b></div>'+
    '<div><small>Cảnh báo</small><b'+(nWarn?' style="color:#7A4F08"':'')+'>'+nWarn+'</b></div><div><small>Kiểm tra gần nhất</small><b style="font-size:15px;padding-top:6px">'+E(d.checkedAt||'—')+' · mỗi '+(d.every||15)+' phút</b></div></div>';
  var F=S.filter, tb='<div class="pai-tb">'+[['all','Tất cả'],['stop','Đã dừng'],['warn','Cảnh báo']].map(function(o){ return '<span class="'+(F===o[0]?'on':'')+'" onclick="__paiF(\''+o[0]+'\')">'+o[1]+'</span>'; }).join('')+'</div>';
  var rows=J.filter(function(j){ return F==='all'||j.status===F; }).map(function(j){
    var btn='';
    if(admin){
      if(j.status==='stop') btn='<button class="pai-b dk" '+(S.busy?'disabled':'')+' onclick="__paiAct(\'guardResume\',\''+j.id+'\')">Chạy lại</button>';
      else if(j.canPause) btn='<button class="pai-b" '+(S.busy?'disabled':'')+' onclick="__paiAct(\'guardPause\',\''+j.id+'\')">Tạm dừng</button>';
    }
    var note=j.status==='stop'?'<span class="err">'+E(j.note)+'</span>':E(j.note||'—');
    return '<tr'+(j.status==='stop'?' class="stop"':'')+'><td><b>'+E(j.name)+'</b><br><small>'+E(j.sub)+'</small></td><td>'+E(j.check)+'</td><td>'+st(j.status)+'</td><td>'+E(j.last||'—')+'</td><td>'+note+'</td><td style="text-align:right">'+btn+'</td></tr>';
  }).join('')||'<tr><td colspan="6" style="color:var(--x-fa,#7A6252)">Không có tác vụ nào.</td></tr>';
  var tbl='<table class="pai-t"><thead><tr><th>Tác vụ</th><th>Kiểm tra</th><th>Trạng thái</th><th>Lần chạy cuối</th><th>Ghi chú</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>';
  var rules='<div class="pai-rules"><h4>QUY TẮC TỰ DỪNG</h4>'+(d.rules||[]).map(function(r){ return '<div>'+E(r)+'</div>'; }).join('')+'</div>';
  return bar+(S.error?'<div class="pai-msg">'+E(S.error)+'</div>':'')+kp+tb+tbl+rules;
}
function logView(){
  var L=(S.data&&S.data.log)||[];
  return '<div class="pai-bar"><div class="t">Nhật ký<small>Rủi ro hệ thống · 20 dòng gần nhất</small></div></div>'+
    '<div class="pai-log"><table class="pai-t"><thead><tr><th>Lúc</th><th>Tác vụ</th><th>Sự kiện</th></tr></thead><tbody>'+
    (L.map(function(x){ return '<tr><td style="white-space:nowrap">'+E(x.at)+'</td><td>'+E(x.who)+'</td><td>'+E(x.msg)+'</td></tr>'; }).join('')||'<tr><td colspan="3" style="color:var(--x-fa,#7A6252)">Chưa có sự kiện.</td></tr>')+
    '</tbody></table></div>';
}
function page(){
  css();
  var body=S.sub==='log'?logView():riskView();
  return '<div class="pai-app">'+side()+'<section class="pai-main">'+body+'</section></div>';
}
function render(){ var c=document.getElementById('content'); if(c&&window.currentTab===TAB) c.innerHTML=page(); banner(); }

window.__paiSub=function(s){ S.sub=s; render(); };
window.__paiF=function(f){ S.filter=f; render(); };
window.__paiAct=act;
window.__paiOpen=function(){ S.sub='risk'; S.filter='all'; window.go(TAB); };

/* ---------- 7. Router + làm mới ---------- */
var prevGo=window.__paiPrevGo||window.go; window.__paiPrevGo=prevGo;
window.go=function(id){ prevGo.apply(this,arguments); banner(); if(id!==TAB) return; render(); load(); };
if(window.__bxAppBooted){ try{ window.renderNav(); if(window.currentTab) window.go(window.currentTab); }catch(e){ console.warn('[pai] late boot',e); } }
(function first(n){ if(window.BX_ROLE){ banner(); load(); } else if(n<400) setTimeout(function(){ first(n+1); },250); })(0);
setInterval(function(){ if(window.BX_ROLE && document.visibilityState==='visible') load(); },300000);
})();
