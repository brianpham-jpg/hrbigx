/* ============================================================
   BigX HR — phong-ai.js  (tab "Phòng AI", mockup duyệt 25/11/2026)
   - Rủi ro hệ thống (API_URL?action=health) + Trao đổi · Robot · Nhiệm vụ · Chờ duyệt · Bảo mật (API_URL?action=pai).
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
var S=window.__pai={ wk:0, sel:null, f:{robot:'bien_tap',viec:'',lap:'weekly',ngay:['T2'],gio:'08:00',batDau:'',duyet:true}, data:null, loading:false, error:null, sub:'chat', filter:'all', busy:'', pai:null, paiLoading:false, paiErr:null, sending:false, draft:'', tf:'all', open:{} };
var LS2='bigx_pai_state_v1';
try{ var c1=JSON.parse(localStorage.getItem(LS2)||'null'); if(c1&&c1.ok) S.pai=c1; }catch(e){}
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
function setPai(d){ S.pai=d; try{ localStorage.setItem(LS2,JSON.stringify(d)); }catch(e){}
  var busy=(d.tasks||[]).some(function(t){ return t.status==='Chờ chạy'||t.status==='Đang làm'; });
  clearTimeout(S.pollT); if(busy) S.pollT=setTimeout(function(){ if(window.currentTab===TAB && !S.sending) loadPai(); },8000); }
function loadPai(){
  if(S.paiLoading||!window.BX_ROLE) return; S.paiLoading=true; S.paiErr=null;
  var url=API_URL+'?action=pai';
  (window.bxAuthedFetch?window.bxAuthedFetch(url,{cache:'no-store'}):fetch(url,{cache:'no-store'}))
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(d){ if(!d||!d.ok) throw new Error((d&&(d.error||d.reason))||'API lỗi'); setPai(d); })
    .catch(function(e){ S.paiErr=e.message||'Lỗi kết nối'; })
    .then(function(){ S.paiLoading=false; if(window.currentTab===TAB) render(); });
}
function paiPost(body, done){
  if(window.BX_ROLE!=='admin'){ try{ bxViewerToast(); }catch(e){} return; }
  body.key=API_KEY;
  var opt={ method:'POST', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(body) };
  (window.bxAuthedFetch?window.bxAuthedFetch(API_URL,opt):fetch(API_URL,opt))
    .then(function(r){ return r.json(); })
    .then(function(d){ if(!d||!d.ok) throw new Error((d&&d.error)||'Không thực hiện được'); setPai(d); S.paiErr=null; })
    .catch(function(e){ S.paiErr=e.message||'Lỗi kết nối'; })
    .then(function(){ if(done) done(); if(window.currentTab===TAB) render(); });
}
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
'.pai-st-info{background:rgba(142,197,255,.3);color:#24578A}.pai-st-off{background:var(--x-s3,#EADDCB);color:var(--x-mu,#62493A)}'+
'.pai-b.ok{color:#22633D}.pai-b.no{color:#A3301E}a.pai-b{text-decoration:none}'+
'.pai-thread{flex:1;overflow:auto;padding:18px 0 10px;max-height:560px;min-height:380px}.pai-thread .col{width:680px;max-width:92%;margin:0 auto}'+
'.pai-me{display:flex;justify-content:flex-end;margin-bottom:16px}.pai-me .bx{background:var(--x-s2,#F2E8DA);border:1px solid var(--x-line2,#ECE1D2);border-radius:10px;padding:9px 12px;max-width:420px;line-height:1.55}'+
'.pai-ag{margin-bottom:18px;max-width:600px}.pai-ag .tx{line-height:1.6}.meta{font-size:11.5px;color:var(--x-fa,#7A6252);margin-bottom:4px}.meta b{color:var(--x-tx,#3B2418);font-weight:600}'+
'.pai-typing{color:var(--x-fa,#7A6252);font-style:italic}.pai-empty{color:var(--x-fa,#7A6252);text-align:center;padding:60px 10px;line-height:1.7}'+
'.pai-att{margin-top:10px;border:1px solid var(--x-line,#E3D5C2);border-radius:10px;background:#fff;overflow:hidden}.pai-att.big{margin:0 0 12px}'+
'.pai-att>.h{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 12px;border-bottom:1px solid var(--x-line2,#ECE1D2)}.pai-att>.h b{color:var(--x-tx,#3B2418)}'+
'.pai-att>.c{padding:10px 12px;color:var(--x-mu,#62493A);line-height:1.55}'+
'.pai-acts{display:flex;gap:6px;padding:9px 12px;border-top:1px solid var(--x-line2,#ECE1D2);background:var(--x-s1,#FBF7F1)}'+
'.pai-post{margin:8px 12px;border:1px solid var(--x-line2,#ECE1D2);border-radius:8px;padding:10px 12px;background:var(--x-s1,#FBF7F1)}.pai-post .h{display:flex;justify-content:space-between;gap:8px;margin-bottom:6px}'+
'.pai-post .c{line-height:1.6;white-space:normal}.pai-post .n,.pai-detail .n{font-size:12px;color:var(--x-fa,#7A6252);margin-top:6px}'+
'.pai-res{margin:8px 12px;line-height:1.65;white-space:normal}.pai-detail td{background:var(--x-s1,#FBF7F1)}.pai-row{cursor:pointer}.pai-row:hover td{background:var(--x-s2,#F2E8DA)}'+
'.pai-comp{width:680px;max-width:92%;margin:0 auto 6px;border:1px solid var(--x-line,#E3D5C2);border-radius:12px;background:#fff;box-shadow:0 8px 24px -16px rgba(59,36,24,.35)}'+
'.pai-comp textarea{width:100%;border:0;outline:0;resize:none;padding:12px;font:inherit;font-size:13.5px;color:var(--x-tx,#3B2418);background:transparent;box-sizing:border-box}'+
'.pai-comp .bot{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 10px 8px}.pai-comp .chips{display:flex;gap:6px;flex-wrap:wrap}'+
'.pai-comp .chips span{font-size:11.5px;color:var(--x-mu,#62493A);border:1px solid var(--x-line,#E3D5C2);background:var(--x-s1,#FBF7F1);border-radius:6px;padding:3px 8px;cursor:pointer}'+
'.pai-send{background:var(--x-tx,#3B2418);color:var(--x-s1,#FBF7F1);border:0;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:600;display:inline-flex;gap:6px;align-items:center;cursor:pointer;font-family:inherit}.pai-send[disabled]{opacity:.5}'+
'.pai-disc{text-align:center;font-size:11px;color:var(--x-fa,#7A6252);padding:4px 0 14px}'+
'.pai-nm{display:flex;gap:10px;align-items:center}.pai-nm .ic{width:28px;height:28px;border-radius:7px;background:var(--x-s2,#F2E8DA);border:1px solid var(--x-line,#E3D5C2);display:grid;place-items:center;color:var(--x-tx,#3B2418)}'+
'.pai-pad{padding:14px 16px}.pai-muted{color:var(--x-fa,#7A6252)}'+
'.pai-legend{display:flex;gap:12px;font-size:11.5px;color:var(--x-mu,#62493A)}.pai-legend span{display:inline-flex;align-items:center;gap:5px}.pai-legend i{width:9px;height:9px;border-radius:2px;display:inline-block;border-left:0}'+
'.pg{display:grid;grid-template-columns:1fr 300px;min-height:620px}.pg-wk{border-right:1px solid var(--x-line,#E3D5C2);overflow:auto;max-height:760px}'+
'.pg-wkbar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--x-line2,#ECE1D2)}.pg-wkbar .nav2{display:flex;gap:6px;align-items:center;font-weight:600;color:var(--x-tx,#3B2418)}'+
'.pg-grid{display:grid;grid-template-columns:48px repeat(7,1fr)}.pg-h{font-size:11px;color:var(--x-fa,#7A6252);text-align:center;padding:8px 0;border-bottom:1px solid var(--x-line,#E3D5C2);font-weight:600;position:sticky;top:0;background:var(--x-s1,#FBF7F1);z-index:1}'+
'.pg-h b{display:block;font-size:15px;color:var(--x-tx,#3B2418);margin-top:2px}.pg-h.today b{background:var(--x-tx,#3B2418);color:var(--x-s1,#FBF7F1);border-radius:6px;width:28px;margin:2px auto 0}'+
'.pg-hr{font-size:10.5px;color:var(--x-fa,#7A6252);text-align:right;padding:2px 6px 0 0;min-height:44px;border-bottom:1px solid var(--x-line2,#ECE1D2)}'+
'.pg-c{min-height:44px;border-bottom:1px solid var(--x-line2,#ECE1D2);border-left:1px solid var(--x-line2,#ECE1D2);padding:3px}.pg-c.today{background:rgba(142,197,255,.08)}'+
'.pg-band{grid-column:2/9;font-size:11.5px;color:var(--x-mu,#62493A);padding:7px 10px;border-bottom:1px solid var(--x-line2,#ECE1D2);background:var(--x-s2,#F2E8DA);display:flex;gap:18px;flex-wrap:wrap}.pg-band b{color:var(--x-tx,#3B2418)}'+
'.pg-ev{border-radius:5px;padding:4px 6px;font-size:11px;line-height:1.3;border-left:3px solid;cursor:pointer;margin-bottom:3px;overflow:hidden}.pg-ev b{display:block}.pg-ev.off{opacity:.45}.pg-ev.sel{box-shadow:0 0 0 2px var(--x-tx,#3B2418)}'+
'.pqv-bt{background:#EFE4D4;border-color:#3B2418;color:#3B2418}.pqv-ts{background:#DCEBFA;border-color:#24578A;color:#1E4670}.pqv-bm{background:#E3EFE6;border-color:#22633D;color:#1C5232}.pqv-em{background:#F4E8CF;border-color:#7A4F08;color:#6E4706}'+
'.pai-legend i.pqv-bt{background:#3B2418}.pai-legend i.pqv-ts{background:#24578A}.pai-legend i.pqv-bm{background:#22633D}.pai-legend i.pqv-em{background:#7A4F08}'+
'.pf{padding:14px 16px;display:flex;flex-direction:column;gap:12px}.pf h3{margin:0;font-size:14px;color:var(--x-tx,#3B2418)}.pf-h{display:flex;justify-content:space-between;align-items:center}'+
'.pf .fl label{display:block;font-size:11.5px;color:var(--x-fa,#7A6252);margin-bottom:5px;font-weight:500}'+
'.pf select,.pf input[type=time],.pf input[type=date],.pf textarea{width:100%;box-sizing:border-box;border:1px solid var(--x-line,#E3D5C2);background:#fff;border-radius:7px;padding:8px 10px;font-size:13px;font-family:inherit;color:var(--x-tx,#3B2418)}.pf textarea{resize:none;height:66px}'+
'.pf .row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pf .seg{display:flex;border:1px solid var(--x-line,#E3D5C2);border-radius:7px;overflow:hidden}'+
'.pf .seg span{flex:1;text-align:center;padding:7px 0;font-size:12px;color:var(--x-mu,#62493A);border-right:1px solid var(--x-line,#E3D5C2);background:#fff;cursor:pointer}.pf .seg span:last-child{border-right:0}.pf .seg span.on{background:var(--x-s3,#EADDCB);color:var(--x-tx,#3B2418);font-weight:600}'+
'.pf .days{display:flex;gap:4px}.pf .days span{flex:1;text-align:center;padding:6px 0;font-size:11.5px;border:1px solid var(--x-line,#E3D5C2);border-radius:6px;background:#fff;color:var(--x-mu,#62493A);cursor:pointer}.pf .days span.on{background:var(--x-tx,#3B2418);color:var(--x-s1,#FBF7F1);border-color:var(--x-tx,#3B2418)}'+
'.pf .tg{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;cursor:pointer}.pf .tg input{width:16px;height:16px;accent-color:#3B2418}'+
'.pf .hint{font-size:11.5px;color:var(--x-fa,#7A6252);line-height:1.5;background:var(--x-s2,#F2E8DA);border-radius:7px;padding:8px 10px}.pai-b.wide{justify-content:center;padding:9px}'+
'.pf-d{display:flex;flex-direction:column;gap:5px;font-size:12.5px;line-height:1.5}.pf-d b{color:var(--x-tx,#3B2418)}.pf-acts{display:flex;gap:6px;flex-wrap:wrap}'+
'.pf-next{border-top:1px solid var(--x-line,#E3D5C2);padding:12px 16px}.pf-next h4{margin:0 0 8px;font-size:11px;color:var(--x-fa,#7A6252);letter-spacing:.06em}'+
'.pf-next .nx{display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:6px 0;border-bottom:1px solid var(--x-line2,#ECE1D2);cursor:pointer}.pf-next .nx span:last-child{color:var(--x-fa,#7A6252);white-space:nowrap}'+
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
  ['chat','ti-message-2','Trao đổi'],['robot','ti-robot','Robot'],['task','ti-list-check','Nhiệm vụ'],['lich','ti-calendar-event','Lịch & giao việc'],['duyet','ti-clipboard-check','Chờ duyệt'],
  '|GIÁM SÁT',['risk','ti-alert-triangle','Rủi ro hệ thống'],['sec','ti-shield-lock','Bảo mật'],['log','ti-history','Nhật ký'] ];
var LIVE={ chat:1, robot:1, task:1, lich:1, duyet:1, risk:1, sec:1, log:1 };
function side(){
  var ns=stopped().length;
  return '<aside class="pai-side"><div class="pai-ws"><b>AI</b>Phòng AI</div>'+MENU.map(function(m){
    if(typeof m==='string') return '<div class="pai-grp">'+m.slice(1)+'</div>';
    var on=S.sub===m[0], live=LIVE[m[0]];
    var P=S.pai||{}, nT=(P.tasks||[]).length, nW=(P.tasks||[]).filter(function(t){return t.status==='Chờ duyệt';}).length;
    var cnt=m[0]==='risk'&&ns?'<span class="c hot">'+ns+'</span>':m[0]==='duyet'&&nW?'<span class="c hot">'+nW+'</span>':m[0]==='task'&&nT?'<span class="c">'+nT+'</span>':
      m[0]==='robot'?'<span class="c">'+((P.robots||[]).length||'')+'</span>':m[0]==='sec'&&P.security?'<span class="c">'+P.security.score+'</span>':(!live?'<span class="c">Sắp có</span>':'');
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

/* ---------- 6b. Các màn Phòng AI ---------- */
var RN={ bao_cao:'Email báo cáo', truong_phong:'Trưởng phòng', bien_tap:'Biên tập viên', trinh_sat:'Trinh sát', buu_ta:'Bưu tá', le_tan:'Lễ tân Zalo', gac_cong:'Gác cổng', bao_mat:'Bảo mật', he_thong:'Hệ thống' };
var RI={ truong_phong:'ti-user-star', bien_tap:'ti-pencil', trinh_sat:'ti-telescope', buu_ta:'ti-mail', le_tan:'ti-message-circle', gac_cong:'ti-shield-check', bao_mat:'ti-shield-lock' };
var TS={ 'Hoàn tất':'pai-st-run','Đã duyệt':'pai-st-run','Đang làm':'pai-st-info','Chờ chạy':'pai-st-info','Chờ duyệt':'pai-st-warn','Lỗi':'pai-st-stop','Từ chối':'pai-st-off','Chưa cấu hình':'pai-st-off' };
function whyTxt(w){ return w==='REVIEW'?'Lịch yêu cầu anh duyệt kết quả':w; }
function tst(s){ return '<span class="pai-st '+(TS[s]||'pai-st-off')+'">'+E(s||'—')+'</span>'; }
function P(){ return S.pai||{}; }
function paiBar(t,sub,btn){ return '<div class="pai-bar"><div class="t">'+t+(sub?'<small>'+sub+'</small>':'')+'</div>'+(btn||'')+'</div>'; }
function waitMsg(){ return S.paiErr?'<div class="pai-msg">'+E(S.paiErr)+'</div>':''; }
function nl(s){ return E(s).replace(/\n/g,'<br>'); }
function taskById(id){ return (P().tasks||[]).filter(function(t){ return String(t.id)===String(id); })[0]; }
function decideBtns(t){
  if(!t||t.status!=='Chờ duyệt'||window.BX_ROLE!=='admin') return '';
  var dis=S.busy?' disabled':'';
  return '<div class="pai-acts"><button class="pai-b ok"'+dis+' onclick="__paiDecide('+t.id+',\'approve\')"><i class="ti ti-check"></i>'+(t.robot==='bien_tap'?'Duyệt bài':'Cho phép')+'</button>'+
    '<button class="pai-b no"'+dis+' onclick="__paiDecide('+t.id+',\'reject\')"><i class="ti ti-x"></i>Từ chối</button></div>';
}
function resultHtml(t){
  if(!t||!t.result) return '';
  if(t.robot==='bien_tap'){ var arr=null; try{ arr=JSON.parse(t.result); }catch(e){}
    if(Array.isArray(arr)) return arr.map(function(b,i){ var r=+b.ruiRo||0;
      return '<div class="pai-post"><div class="h"><b>Bài '+(i+1)+(b.tieuDe?' · '+E(b.tieuDe):'')+'</b><span class="pai-st '+(r>=60?'pai-st-stop':r>=30?'pai-st-warn':'pai-st-run')+'">Rủi ro '+r+'/100</span></div>'+
        '<div class="c">'+nl(b.noiDung)+'</div>'+(b.lyDo||b.goiYSua?'<div class="n">'+(b.lyDo?E(b.lyDo):'')+(b.goiYSua?' · Gợi ý: '+E(b.goiYSua):'')+'</div>':'')+'</div>'; }).join(''); }
  if(/^\{/.test(t.result)) return '';
  return '<div class="pai-res">'+nl(t.result)+'</div>';
}
function chatView(){
  var p=P(), C=p.chat||[], admin=window.BX_ROLE==='admin';
  var msgs=C.map(function(m){
    if(m.who==='Anh') return '<div class="pai-me"><div class="bx"><div class="meta"><b>Anh</b> · '+E(m.at)+'</div>'+nl(m.text)+'</div></div>';
    var cards='', seen={};
    String(m.text).replace(/#(\d+)/g,function(_,id){ if(seen[id]) return; seen[id]=1; var t=taskById(id); if(t&&t.status==='Chờ duyệt') cards+='<div class="pai-att"><div class="h"><b>#'+t.id+' · '+E(RN[t.robot]||t.robot)+'</b>'+tst(t.status)+'</div><div class="c">'+E(t.why||t.text)+'</div>'+resultHtml(t)+decideBtns(t)+'</div>'; });
    return '<div class="pai-ag"><div class="meta"><b>'+E(m.who)+'</b> · '+E(m.at)+'</div><div class="tx">'+nl(m.text)+'</div>'+cards+'</div>';
  }).join('');
  if(!C.length) msgs='<div class="pai-empty">Nhắn cho Trưởng phòng để bắt đầu. Ví dụ: “Tuần này có bao nhiêu CV mới?”, “Viết 3 bài tuyển CTV Booking KOC”, “Nghiên cứu mức hoa hồng CTV booking KOC”.</div>';
  if(S.sending) msgs+='<div class="pai-ag"><div class="meta"><b>Trưởng phòng</b></div><div class="tx pai-typing">Đang xử lý… Gemini có thể mất 1–2 phút, anh cứ để đó.</div></div>';
  var comp=admin?'<div class="pai-comp"><textarea id="pai-in" rows="2" placeholder="Nhắn cho Trưởng phòng… (Enter để gửi, Shift+Enter xuống dòng)" onkeydown="__paiKey(event)"'+(S.sending?' disabled':'')+'>'+E(S.draft)+'</textarea>'+
    '<div class="bot"><div class="chips">'+['Tuần này có bao nhiêu CV mới?','Viết 3 bài tuyển CTV Booking KOC','Kiểm tra rủi ro hệ thống'].map(function(q){ return '<span onclick="__paiQ(this)">'+E(q)+'</span>'; }).join('')+'</div>'+
    '<button class="pai-send"'+(S.sending?' disabled':'')+' onclick="__paiSend()"><i class="ti ti-send"></i>Gửi</button></div></div>'+
    '<div class="pai-disc">Lệnh đụng dữ liệu ứng viên, gửi ra ngoài, xoá hoặc hàng loạt sẽ bị Gác cổng giữ lại chờ anh duyệt.</div>'
    :'<div class="pai-disc">Tài khoản chỉ xem — không gửi lệnh được.</div>';
  return paiBar('Trao đổi','Trưởng phòng · Gemini'+(S.paiLoading?' · đang tải…':''), p.sheetUrl?'<a class="pai-b" href="'+E(p.sheetUrl)+'" target="_blank" rel="noopener"><i class="ti ti-table"></i>Sheet dữ liệu</a>':'')+waitMsg()+
    '<div class="pai-thread" id="pai-thread"><div class="col">'+msgs+'</div></div>'+comp;
}
var RS={ run:['pai-st-run','Đang chạy'], warn:['pai-st-warn','Cần xử lý'], err:['pai-st-stop','Lỗi'], off:['pai-st-off','Chưa cấu hình'] };
function robotView(){
  var R=P().robots||[];
  var rows=R.map(function(r){ var s=RS[r.status]||RS.run;
    return '<tr><td><div class="pai-nm"><span class="ic"><i class="ti '+(RI[r.id]||'ti-robot')+'"></i></span><div><b>'+E(r.name)+'</b><br><small>'+E(r.job)+'</small></div></div></td><td>'+E(r.tool)+'</td><td>'+E(r.sched)+'</td><td><span class="pai-st '+s[0]+'">'+s[1]+'</span></td><td>'+E(r.note)+'</td></tr>'; }).join('');
  return paiBar('Robot',R.length+' robot')+waitMsg()+(R.length?'<table class="pai-t"><thead><tr><th>Robot</th><th>Công cụ</th><th>Lịch chạy</th><th>Trạng thái</th><th>Ghi chú</th></tr></thead><tbody>'+rows+'</tbody></table>':'<div class="pai-soon">Đang tải…</div>');
}
function taskRows(list){
  return list.map(function(t){ var open=S.open[t.id];
    return '<tr class="pai-row" onclick="__paiOpenT('+t.id+')"><td>#'+E(t.id)+'</td><td>'+E(t.text)+'</td><td>'+E(RN[t.robot]||t.robot)+'</td><td>'+E(t.from)+'</td><td>'+tst(t.status)+'</td><td style="white-space:nowrap">'+E(t.upd||t.at)+'</td></tr>'+
      (open?'<tr class="pai-detail"><td></td><td colspan="5">'+(t.why?'<div class="n">'+E(whyTxt(t.why))+'</div>':'')+(resultHtml(t)||'<div class="n">Chưa có kết quả.</div>')+decideBtns(t)+'</td></tr>':''); }).join('');
}
function taskView(){
  var T=P().tasks||[], f=S.tf;
  var L=T.filter(function(t){ return f==='all'||(f==='wait'&&t.status==='Chờ duyệt')||(f==='err'&&t.status==='Lỗi')||(f==='done'&&(t.status==='Hoàn tất'||t.status==='Đã duyệt')); });
  var tb='<div class="pai-tb">'+[['all','Tất cả'],['wait','Chờ duyệt'],['done','Hoàn tất'],['err','Lỗi']].map(function(o){ return '<span class="'+(f===o[0]?'on':'')+'" onclick="__paiTF(\''+o[0]+'\')">'+o[1]+'</span>'; }).join('')+'</div>';
  return paiBar('Nhiệm vụ',T.length+' việc gần nhất · bấm 1 dòng để xem kết quả')+waitMsg()+tb+
    '<table class="pai-t"><thead><tr><th>#</th><th>Việc</th><th>Robot</th><th>Từ</th><th>Trạng thái</th><th>Cập nhật</th></tr></thead><tbody>'+(taskRows(L)||'<tr><td colspan="6" class="pai-muted">Chưa có nhiệm vụ.</td></tr>')+'</tbody></table>';
}
function duyetView(){
  var W=(P().tasks||[]).filter(function(t){ return t.status==='Chờ duyệt'; });
  var cards=W.map(function(t){ return '<div class="pai-att big"><div class="h"><b>#'+t.id+' · '+E(RN[t.robot]||t.robot)+'</b><span>'+tst(t.status)+'</span></div><div class="c"><b>'+E(t.text)+'</b><br><span class="pai-muted">'+E(t.why||'')+' · '+E(t.at)+'</span></div>'+resultHtml(t)+decideBtns(t)+'</div>'; }).join('');
  return paiBar('Chờ duyệt',W.length+' việc')+waitMsg()+'<div class="pai-pad">'+(cards||'<div class="pai-soon">Không có việc nào chờ duyệt.</div>')+'</div>';
}
function secView(){
  var s=P().security, admin=window.BX_ROLE==='admin';
  var btn=admin?'<button class="pai-b dk"'+(S.busy?' disabled':'')+' onclick="__paiScan()"><i class="ti ti-shield-search"></i>'+(S.busy==='scan'?'Đang quét…':'Quét ngay')+'</button>':'';
  if(!s) return paiBar('Bảo mật','')+waitMsg()+'<div class="pai-soon">Chưa có kết quả quét.</div>';
  var ok=s.checks.filter(function(c){return c.ok;}).length;
  var kp='<div class="pai-kp"><div><small>Điểm bảo mật</small><b'+(s.score<100?' style="color:#A3301E"':'')+'>'+s.score+'</b></div><div><small>Đạt</small><b>'+ok+'/'+s.checks.length+'</b></div><div><small>Lịch quét</small><b style="font-size:15px;padding-top:6px">Mỗi ngày 22:00</b></div><div><small>Quét gần nhất</small><b style="font-size:15px;padding-top:6px">'+E(s.at)+'</b></div></div>';
  var rows=s.checks.map(function(c){ return '<tr'+(c.ok?'':' class="stop"')+'><td><b>'+E(c.name)+'</b></td><td><span class="pai-st '+(c.ok?'pai-st-run':'pai-st-stop')+'">'+(c.ok?'Đạt':'Không đạt')+'</span></td><td>'+E(c.detail)+'</td></tr>'; }).join('');
  return paiBar('Bảo mật','quét tự động, không đọc dữ liệu ứng viên',btn)+waitMsg()+kp+'<table class="pai-t"><thead><tr><th>Hạng mục</th><th>Kết quả</th><th>Chi tiết</th></tr></thead><tbody>'+rows+'</tbody></table>';
}

/* ---------- Lịch & giao việc ---------- */
var DOW=['T2','T3','T4','T5','T6','T7','CN'], RC={ bien_tap:'pqv-bt', trinh_sat:'pqv-ts', bao_mat:'pqv-bm', bao_cao:'pqv-em' };
function pdm(s){ var m=String(s||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/); return m?new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0)):null; }
function z2(n){ return (n<10?'0':'')+n; }
function wkStart(off){ var d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)+7*off); return d; }
function occ(s, ws){ // các lần chạy trong tuần bắt đầu ws
  var out=[], hm=String(s.gio||'08:00').split(':'), h=+hm[0]||0, mi=+hm[1]||0, st=pdm(s.batDau), days=String(s.ngay||'').split(',');
  for(var i=0;i<7;i++){ var d=new Date(ws); d.setDate(d.getDate()+i); d.setHours(h,mi,0,0);
    if(st && d<new Date(st.getFullYear(),st.getMonth(),st.getDate())) continue;
    if(s.lap==='once'){ if(st && d.toDateString()===st.toDateString()) out.push({d:i,h:h,m:mi}); }
    else if(s.lap==='daily'||days.indexOf(DOW[i])>-1) out.push({d:i,h:h,m:mi}); }
  return out;
}
function lapTxt(s){ return s.lap==='once'?'1 lần · '+String(s.batDau||'').slice(0,10)+' '+s.gio:s.lap==='daily'?'Hằng ngày '+s.gio:'Hằng tuần '+String(s.ngay||'').replace(/,/g,', ')+' · '+s.gio; }
function lichView(){
  var p=P(), sc=p.sched||{}, L=sc.list||[], admin=window.BX_ROLE==='admin', ws=wkStart(S.wk), today=new Date(); today.setHours(0,0,0,0);
  var we=new Date(ws); we.setDate(we.getDate()+6);
  var ev={}, minH=7, maxH=23;
  L.forEach(function(s){ occ(s,ws).forEach(function(o){ if(o.h<minH) minH=o.h; var k=o.d+'_'+o.h; (ev[k]=ev[k]||[]).push(s); }); });
  var legend='<div class="pai-legend">'+[['bien_tap','Biên tập viên'],['trinh_sat','Trinh sát'],['bao_mat','Bảo mật'],['bao_cao','Email báo cáo']].map(function(x){ return '<span><i class="'+RC[x[0]]+'"></i>'+x[1]+'</span>'; }).join('')+'</div>';
  var head='<div class="pg-h"></div>'+DOW.map(function(d,i){ var dt=new Date(ws); dt.setDate(dt.getDate()+i); var t=dt.getTime()===today.getTime();
    return '<div class="pg-h'+(t?' today':'')+'">'+d+'<b>'+dt.getDate()+'</b></div>'; }).join('');
  var band='<div class="pg-hr" style="height:auto;padding:8px 6px 0 0">Liên tục</div><div class="pg-band">'+(sc.continuous||[]).map(function(x){ var a=x.split(' · '); return '<span><b>'+E(a[0])+'</b> '+E(a[1]||'')+'</span>'; }).join('')+'</div>';
  var rows='';
  for(var h=minH;h<=maxH;h++){ rows+='<div class="pg-hr">'+z2(h)+':00</div>';
    for(var d=0;d<7;d++){ var dt=new Date(ws); dt.setDate(dt.getDate()+d); var t=dt.getTime()===today.getTime();
      rows+='<div class="pg-c'+(t?' today':'')+'">'+(ev[d+'_'+h]||[]).map(function(s){ return '<div class="pg-ev '+(RC[s.robot]||'pqv-bt')+(s.bat?'':' off')+(S.sel===s.id?' sel':'')+'" onclick="__paiSel(\''+s.id+'\')"><b>'+E(RN[s.robot]||s.robot)+'</b>'+E(s.viec)+'</div>'; }).join('')+'</div>'; } }
  var grid='<div class="pg-wkbar"><div class="nav2"><button class="pai-b" onclick="__paiWk(-1)"><i class="ti ti-chevron-left"></i></button>Tuần '+z2(ws.getDate())+'/'+z2(ws.getMonth()+1)+' – '+z2(we.getDate())+'/'+z2(we.getMonth()+1)+'/'+we.getFullYear()+'<button class="pai-b" onclick="__paiWk(1)"><i class="ti ti-chevron-right"></i></button></div><button class="pai-b" onclick="__paiWk(0)">Hôm nay</button></div>'+
    '<div class="pg-grid">'+head+band+rows+'</div>';
  // panel phải: chi tiết lịch đang chọn hoặc form
  var side='', sel=L.filter(function(s){ return s.id===S.sel; })[0];
  if(sel){ side='<div class="pf"><div class="pf-h"><h3>'+E(RN[sel.robot]||sel.robot)+'</h3><button class="pai-b" onclick="__paiSel(null)"><i class="ti ti-x"></i></button></div>'+
      '<div class="pf-d"><b>'+E(sel.viec)+'</b><div>'+E(lapTxt(sel))+'</div><div>Lần tới: '+E(sel.next||'—')+'</div>'+(sel.lastRun?'<div>Chạy gần nhất: '+E(sel.lastRun)+'</div>':'')+(sel.sys?'<div class="pai-muted">Lịch hệ thống — cố định</div>':'<div>Trạng thái: '+(sel.bat?'Đang bật':'Đang tắt')+(sel.duyet?' · duyệt kết quả':'')+'</div>')+'</div>'+
      (admin&&!sel.sys?'<div class="pf-acts"><button class="pai-b dk"'+(S.busy?' disabled':'')+' onclick="__paiSch(\'runNow\',\''+sel.id+'\')"><i class="ti ti-player-play"></i>Chạy ngay</button><button class="pai-b"'+(S.busy?' disabled':'')+' onclick="__paiSch(\'toggle\',\''+sel.id+'\')">'+(sel.bat?'Tạm dừng':'Bật lại')+'</button><button class="pai-b no"'+(S.busy?' disabled':'')+' onclick="__paiSch(\'delete\',\''+sel.id+'\')">Xoá</button></div>':'')+'</div>'; }
  else if(admin){ var f=S.f;
    side='<div class="pf"><h3>Giao việc mới</h3>'+
      '<div class="fl"><label>Robot</label><select onchange="__paiFF(\'robot\',this.value)">'+[['bien_tap','Biên tập viên'],['trinh_sat','Trinh sát'],['bao_mat','Bảo mật'],['bao_cao','Email báo cáo']].map(function(o){ return '<option value="'+o[0]+'"'+(f.robot===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select></div>'+
      '<div class="fl"><label>Việc cần làm</label><textarea id="pf-viec" oninput="__paiFF(\'viec\',this.value,1)" placeholder="'+(f.robot==='bien_tap'?'VD: Viết 3 bài tuyển CTV Booking KOC, xoay keyword…':f.robot==='trinh_sat'?'VD: Đối thủ đang tuyển KOC với mức hoa hồng nào?':'Không cần ghi')+'">'+E(f.viec)+'</textarea></div>'+
      '<div class="fl"><label>Lặp lại</label><div class="seg">'+[['once','1 lần'],['daily','Hằng ngày'],['weekly','Hằng tuần']].map(function(o){ return '<span class="'+(f.lap===o[0]?'on':'')+'" onclick="__paiFF(\'lap\',\''+o[0]+'\')">'+o[1]+'</span>'; }).join('')+'</div></div>'+
      (f.lap==='weekly'?'<div class="fl"><label>Vào các ngày</label><div class="days">'+DOW.map(function(d){ return '<span class="'+(f.ngay.indexOf(d)>-1?'on':'')+'" onclick="__paiDay(\''+d+'\')">'+d+'</span>'; }).join('')+'</div></div>':'')+
      '<div class="row2"><div class="fl"><label>Giờ chạy</label><input type="time" value="'+E(f.gio)+'" onchange="__paiFF(\'gio\',this.value,1)"></div><div class="fl"><label>'+(f.lap==='once'?'Ngày chạy':'Bắt đầu từ')+'</label><input type="date" value="'+E(f.batDau)+'" onchange="__paiFF(\'batDau\',this.value,1)"></div></div>'+
      '<label class="tg"><span>Duyệt trước khi dùng kết quả</span><input type="checkbox"'+(f.duyet?' checked':'')+' onchange="__paiFF(\'duyet\',this.checked,1)"></label>'+
      '<div class="hint">Việc đụng dữ liệu ứng viên, gửi ra ngoài, xoá hoặc làm hàng loạt luôn phải qua Chờ duyệt, kể cả khi đã lên lịch.</div>'+
      '<button class="pai-b dk wide"'+(S.busy?' disabled':'')+' onclick="__paiAddSch()"><i class="ti ti-calendar-plus"></i>'+(S.busy==='sch'?'Đang lưu…':'Lên lịch')+'</button></div>'; }
  else side='<div class="pf"><div class="pai-muted">Tài khoản chỉ xem — không giao việc được.</div></div>';
  var up=L.filter(function(s){ return s.bat&&s.next; }).sort(function(a,b){ return pdm(a.next)-pdm(b.next); }).slice(0,5);
  side+='<div class="pf-next"><h4>SẮP CHẠY</h4>'+(up.map(function(s){ return '<div class="nx" onclick="__paiSel(\''+s.id+'\')"><span>'+E(RN[s.robot]||s.robot)+' · '+E(s.viec)+'</span><span>'+E(s.next)+'</span></div>'; }).join('')||'<div class="pai-muted">Chưa có lịch.</div>')+'</div>';
  return paiBar('Lịch & giao việc',(S.paiLoading?'đang tải…':''),legend)+waitMsg()+(sc.error?'<div class="pai-msg">'+E(sc.error)+'</div>':'')+'<div class="pg"><div class="pg-wk">'+grid+'</div><aside class="pg-side">'+side+'</aside></div>';
}
function page(){
  css();
  var V={chat:chatView, robot:robotView, task:taskView, lich:lichView, duyet:duyetView, sec:secView, log:logView, risk:riskView};
  var body=(V[S.sub]||riskView)();
  return '<div class="pai-app">'+side()+'<section class="pai-main">'+body+'</section></div>';
}
function render(){ var c=document.getElementById('content'); if(c&&window.currentTab===TAB){ c.innerHTML=page(); var th=document.getElementById('pai-thread'); if(th) th.scrollTop=th.scrollHeight; var ti=document.getElementById('pai-in'); if(ti&&!S.sending&&S.sub==='chat'){ ti.focus(); ti.selectionStart=ti.selectionEnd=ti.value.length; } } banner(); }

window.__paiSub=function(s){ S.sub=s; render(); if(s!=='risk'&&s!=='log') loadPai(); };
window.__paiKey=function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); window.__paiSend(); } else setTimeout(function(){ var el=document.getElementById('pai-in'); if(el) S.draft=el.value; },0); };
window.__paiQ=function(el){ S.draft=el.textContent; render(); var t=document.getElementById('pai-in'); if(t){ t.focus(); } };
window.__paiSend=function(){ var el=document.getElementById('pai-in'), txt=(el?el.value:S.draft).trim(); if(!txt||S.sending) return;
  S.sending=true; S.draft=''; var p=S.pai||{ok:true}; p.chat=(p.chat||[]).concat([{at:'vừa xong',who:'Anh',text:txt}]); S.pai=p; render();
  paiPost({ action:'paiChat', text:txt }, function(){ S.sending=false; }); };
window.__paiDecide=function(id,d){ S.busy='d'+id; render(); paiPost({ action:'paiDecide', id:id, decision:d }, function(){ S.busy=''; }); };
window.__paiScan=function(){ S.busy='scan'; render(); paiPost({ action:'paiScan' }, function(){ S.busy=''; }); };
window.__paiTF=function(f){ S.tf=f; render(); };
window.__paiWk=function(d){ S.wk=d?S.wk+d:0; render(); };
window.__paiSel=function(id){ S.sel=id; render(); };
window.__paiFF=function(k,v,quiet){ S.f[k]=v; if(!quiet) render(); };
window.__paiDay=function(d){ var a=S.f.ngay, i=a.indexOf(d); if(i>-1) a.splice(i,1); else a.push(d); render(); };
window.__paiAddSch=function(){ var f=S.f, bd=f.batDau?f.batDau.split('-').reverse().join('/'):''; var el=document.getElementById('pf-viec'); if(el) f.viec=el.value;
  S.busy='sch'; render(); paiPost({ action:'paiSched', op:'add', robot:f.robot, viec:f.viec, lap:f.lap, ngay:f.ngay, gio:f.gio, batDau:bd, duyet:f.duyet }, function(){ S.busy=''; if(!S.paiErr){ S.f.viec=''; } }); };
window.__paiSch=function(op,id){ S.busy='s'+id; render(); paiPost({ action:'paiSched', op:op, id:id }, function(){ S.busy=''; if(op==='delete') S.sel=null; }); };
window.__paiOpenT=function(id){ S.open[id]=!S.open[id]; render(); };
window.__paiF=function(f){ S.filter=f; render(); };
window.__paiAct=act;
window.__paiOpen=function(){ S.sub='risk'; S.filter='all'; window.go(TAB); };

/* ---------- 7. Router + làm mới ---------- */
var prevGo=window.__paiPrevGo||window.go; window.__paiPrevGo=prevGo;
window.go=function(id){ prevGo.apply(this,arguments); banner(); if(id!==TAB) return; render(); load(); loadPai(); };
if(window.__bxAppBooted){ try{ window.renderNav(); if(window.currentTab) window.go(window.currentTab); }catch(e){ console.warn('[pai] late boot',e); } }
(function first(n){ if(window.BX_ROLE){ banner(); load(); } else if(n<400) setTimeout(function(){ first(n+1); },250); })(0);
setInterval(function(){ if(window.BX_ROLE && document.visibilityState==='visible'){ load(); if(window.currentTab===TAB && !S.sending) loadPai(); } },300000);
})();
