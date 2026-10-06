/* ============================================================
   TAB NHỎ: CÔNG VIỆC CỐ ĐỊNH — mục con ngay dưới "Công việc HR" ở menu trái — file riêng, không sửa app.js
   - Trang riêng (id: cong-viec-co-dinh). Trang Công việc HR cũ giữ nguyên, không chèn gì vào
   - Nhóm: Hằng ngày (tick theo ngày) · Hằng tuần · Hằng tháng · Theo phát sinh · Liên tục
   - Mỗi việc: ngày nhận, ngày làm, hạn leader CFM, các vòng duyệt (gửi → Đạt / Cần sửa + lý do,
     leader yêu cầu gì, ngày em sửa xong, em đã sửa gì), chốt / xong. Bảng chấm công: 6 bước.
   - Lưu Firebase nhánh RIÊNG public/hrfixed (không đụng public/hrtasks của tab cũ)
       hrfixed/config  = { tasks:[...], reasons:[...] }   (chưa có → dùng danh sách mặc định bên dưới)
       hrfixed/months/<YYYY-MM>/items/<id> = bản ghi việc
       hrfixed/months/<YYYY-MM>/day/<taskId>/<ngày> = 1
   - Xuất PDF (A4 ngang) để sếp check.
   ============================================================ */
(function(){
  if(typeof window.go!=='function' || typeof NAV==='undefined' || typeof MAP==='undefined') return;
  var PAGE='cong-viec-co-dinh';
  var FB='https://bigx-chamcong-hr-default-rtdb.firebaseio.com/public/hrfixed';
  var BAK='bx_hrfixed_bak';
  try{ localStorage.removeItem('bx_cv_subtab'); }catch(e){} // dọn khoá của bản thanh-2-nút trước
  var FREQ={day:'Hằng ngày', week:'Hằng tuần', month:'Hằng tháng', event:'Theo phát sinh', proj:'Liên tục'};
  var FREQ_ORDER=['day','week','month','event','proj'];
  var DEF_REASONS=['Sai số liệu','Thiếu thông tin','Sai format / trình bày','Leader đổi yêu cầu','Khác'];
  /* Hạn chỉ điền theo Brian đã đưa: chấm công nhập 24 · sửa 26 · sửa 27 · chốt 29; lịch VP/phòng họp ngày 31. Còn lại để trống. */
  var DEF_TASKS=[
    {id:'d1', freq:'day', title:'Check-in 2 buổi'},
    {id:'d2', freq:'day', title:'Kiểm tra lịch đăng ký VP / phòng họp'},
    {id:'d3', freq:'day', title:'Tuyển dụng (lọc CV, liên hệ ứng viên)'},
    {id:'d4', freq:'day', title:'Cập nhật file CV'},
    {id:'w1', freq:'week', title:'Báo cáo tuần', sub:'Gửi sếp', approve:true},
    {id:'w2', freq:'week', title:'Cập nhật Công việc HR', sub:'Tick xong / gửi duyệt trên web', approve:false},
    {id:'cc', freq:'month', kind:'cc', title:'Bảng chấm công', sub:'Nhập → leader CFM → sửa 1 → sửa 2 → chốt → gửi kế toán', approve:true, due:24, sua1:26, sua2:27, chot:29, gui:'', cfm:''},
    {id:'vp', freq:'month', title:'Mở lịch đăng ký VP + phòng họp', sub:'Cho tháng sau', approve:false, due:31},
    {id:'bd', freq:'month', kind:'bd', title:'Sinh nhật + poster', approve:true},
    {id:'ph', freq:'month', title:'Cập nhật phép / chính thức / nghỉ', approve:true},
    {id:'rc', freq:'month', title:'Recap company meeting', approve:true},
    {id:'bm', freq:'month', title:'Báo cáo tháng', approve:true},
    {id:'ra', freq:'month', title:'Rà HĐ / hồ sơ / review lương', sub:'Đối chiếu sheet "Thiếu hồ sơ" + cột review lương', approve:true},
    {id:'nm', freq:'event', kind:'nm', title:'Người mới', sub:'Offer → HĐ thử việc → thêm vào hệ thống', approve:true},
    {id:'tv', freq:'event', kind:'tv', title:'Hết thử việc', sub:'Đánh giá → HĐLĐ → poster', approve:true},
    {id:'kl', freq:'event', title:'Ký lại HĐ', approve:true},
    {id:'nv', freq:'event', title:'Nghỉ việc', approve:true},
    {id:'vt', freq:'event', title:'Mở vị trí mới', sub:'JD, đăng tin, thư mục CV', approve:true},
    {id:'le', freq:'event', title:'Dịp lễ', approve:true},
    {id:'tb', freq:'event', title:'Thông báo nội bộ', approve:true},
    {id:'p1', freq:'proj', title:'Bảo trì dashboard / web chấm công'},
    {id:'p2', freq:'proj', title:'Chuẩn hoá HSNS'}
  ];
  var S=window.__cvcd={ loaded:false, loading:false, err:null, config:null, months:{}, month:null, f:'all',
    open:{}, settings:false, draft:null, addEv:null };

  /* ---------- tiện ích ---------- */
  function e_(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function p2(n){ return String(n).padStart(2,'0'); }
  function iso(d){ return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }
  function pISO(s){ if(!s||!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null; var p=s.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); }
  function todayISO(){ return iso(new Date()); }
  function curMonth(){ return todayISO().slice(0,7); }
  function dm(s){ if(!s) return ''; var p=s.split('-'); return p[2]+'/'+p[1]; }
  function dmy(s){ if(!s) return ''; var p=s.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
  function lastDay(ym){ var p=ym.split('-'); return new Date(+p[0],+p[1],0).getDate(); }
  function shiftMonth(ym,k){ var p=ym.split('-'); var d=new Date(+p[0],+p[1]-1+k,1); return d.getFullYear()+'-'+p2(d.getMonth()+1); }
  function monthLabel(ym){ var p=ym.split('-'); return 'Tháng '+(+p[1])+'/'+p[0]; }
  function dayDue(ym,n){ n=parseInt(n,10); if(!n||n<1) return ''; return ym+'-'+p2(Math.min(n,lastDay(ym))); }
  function diffDays(a,b){ var x=pISO(a), y=pISO(b); if(!x||!y) return null; return Math.round((x-y)/86400000); } // a - b
  function fetchJ(url,opt){ return (window.bxAuthedFetch?window.bxAuthedFetch(url,opt):fetch(url,opt)).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); }); }
  function put(path,val){ return fetchJ(FB+'/'+path+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(val)}); }
  function saveBak(){ try{ localStorage.setItem(BAK, JSON.stringify({config:S.config, months:S.months})); }catch(e){} }
  function tasks(){ return (S.config&&S.config.tasks&&S.config.tasks.length)?S.config.tasks:DEF_TASKS; }
  function reasons(){ return (S.config&&S.config.reasons&&S.config.reasons.length)?S.config.reasons:DEF_REASONS; }
  function taskById(id){ var t=tasks(); for(var i=0;i<t.length;i++) if(t[i].id===id) return t[i]; return null; }
  function mon(ym){ if(!S.months[ym]) S.months[ym]={}; var m=S.months[ym]; if(!m.items) m.items={}; if(!m.day) m.day={}; return m; }
  function rerender(){
    if(window.currentTab!==PAGE || !window.go) return;
    var c=document.getElementById('content'), y=c?c.scrollTop:0, wy=window.scrollY||0;
    window.go(PAGE);
    var back=function(){ if(c) c.scrollTop=y; if(wy) window.scrollTo(0,wy); };
    back(); setTimeout(back,0); setTimeout(back,30);
  }
  function fail(e){ alert('Chưa lưu được: '+(e&&e.message||e)+'\nKiểm tra mạng rồi thử lại.'); }

  function load(){
    if(S.loading) return; S.loading=true;
    fetchJ(FB+'.json',{cache:'no-store'}).then(function(d){
      S.config=(d&&d.config)||null; S.months=(d&&d.months)||{}; S.err=null; S.loaded=true;
      Object.keys(S.months).forEach(function(k){ var m=S.months[k]; if(m&&m.items) Object.keys(m.items).forEach(function(id){ var r=m.items[id]; if(r&&r.rounds&&!Array.isArray(r.rounds)) r.rounds=Object.keys(r.rounds).sort(function(a,b){return a-b;}).map(function(i){return r.rounds[i];}); }); });
      saveBak();
    }).catch(function(e){ S.err=e.message||String(e); S.loaded=true; })
      .then(function(){ S.loading=false; rerender(); });
  }

  /* ---------- tuần trong tháng: tuần T2→CN, thuộc tháng chứa ngày thứ Năm ---------- */
  function weeksOf(ym){
    var p=ym.split('-'), first=new Date(+p[0],+p[1]-1,1), wd=(first.getDay()+6)%7, mo=new Date(first); mo.setDate(1-wd);
    var out=[], n=1;
    for(var k=0;k<7;k++){
      var th=new Date(mo); th.setDate(mo.getDate()+3);
      var su=new Date(mo); su.setDate(mo.getDate()+6);
      if(iso(th).slice(0,7)===ym){ out.push({mon:iso(mo), sun:iso(su), n:n++}); }
      else if(iso(th).slice(0,7)>ym) break;
      mo.setDate(mo.getDate()+7);
    }
    return out;
  }

  /* ---------- danh sách việc của tháng ---------- */
  function itemsFor(ym){
    var m=mon(ym), out=[];
    tasks().forEach(function(t){
      if(t.freq==='week') weeksOf(ym).forEach(function(w){
        var id='w_'+t.id+'_'+w.mon; out.push({id:id, t:t, rec:m.items[id]||{}, week:w});
      });
      else if(t.freq==='month'){ var id='m_'+t.id; out.push({id:id, t:t, rec:m.items[id]||{}}); }
    });
    Object.keys(m.items).forEach(function(id){
      if(id.indexOf('e_')!==0) return; var r=m.items[id]||{}; var t=taskById(r.tid)||{id:r.tid, freq:'event', title:r.ptitle||'Phát sinh', approve:true};
      out.push({id:id, t:t, rec:r});
    });
    return out;
  }
  function needApprove(it){ return it.t.approve!==false; }
  function rounds(rec){ return Array.isArray(rec.rounds)?rec.rounds:[]; }
  function effDue(it,ym){ return it.rec.due || (it.t.freq==='month'?dayDue(ym,it.t.due):''); }
  function effCfm(it,ym){ return it.rec.cfmDue || (it.t.freq==='month'?dayDue(ym,it.t.cfm):''); }
  function isDone(it){ return !!it.rec.done; }
  function fixCount(it){ return rounds(it.rec).filter(function(r){return r&&r.res==='fix';}).length; }
  function okRound(it){ var rs=rounds(it.rec); for(var i=0;i<rs.length;i++) if(rs[i]&&rs[i].res==='ok') return i+1; return 0; }
  /* các mốc so hạn: [ngày thực tế, hạn, nhãn] */
  function checkpoints(it,ym){
    var r=it.rec, out=[];
    if(it.t.kind==='cc'){
      var rs=rounds(r);
      out.push([r.work, effDue(it,ym), 'nhập']);
      if(rs[0]&&rs[0].res==='fix') out.push([rs[1]&&rs[1].sent, dayDue(ym,it.t.sua1), 'sửa 1']); // chỉ tính hạn sửa khi leader yêu cầu sửa
      if(rs[1]&&rs[1].res==='fix') out.push([rs[2]&&rs[2].sent, dayDue(ym,it.t.sua2), 'sửa 2']);
      out.push([r.chot, dayDue(ym,it.t.chot), 'chốt']);
      out.push([r.done, dayDue(ym,it.t.gui), 'gửi KT']);
    } else out.push([r.work||r.done, effDue(it,ym), 'làm']);
    return out;
  }
  function lateInfo(it,ym){
    var t=todayISO(), late=0, over=false, lbl='';
    checkpoints(it,ym).forEach(function(c){
      if(!c[1]) return;
      if(c[0]){ var d=diffDays(c[0],c[1]); if(d>late){ late=d; lbl=c[2]; } }
      else if(!isDone(it) && t>c[1]) over=true;
    });
    return {late:late, over:over, lbl:lbl};
  }
  function cfmInfo(it,ym){
    var due=effCfm(it,ym), r0=rounds(it.rec)[0];
    if(!due || !needApprove(it)) return null;
    if(r0&&r0.resp){ var d=diffDays(r0.resp,due); return d>0?{late:true, txt:'leader CFM trễ '+d+' ngày'}:{ok:true, txt:'leader CFM đúng hạn'}; }
    if(r0&&r0.sent){ var n=diffDays(due,todayISO()); return n<0?{late:true, txt:'leader quá hạn CFM '+(-n)+' ngày'}:{txt:'leader còn '+n+' ngày'}; }
    return null;
  }
  function status(it,ym){
    var r=it.rec, rs=rounds(r), li=lateInfo(it,ym), ok=okRound(it);
    var st, cls;
    if(isDone(it)){ st=needApprove(it)&&ok?('Xong · Đạt lần '+ok):'Xong'; cls='done'; }
    else if(rs.length){
      var k=rs.length, last=rs[k-1]||{};
      if(last.res==='ok'){ st='Đạt lần '+k; cls='done'; }
      else if(last.res==='fix'){ st=last.fixed?('Đã sửa L'+k+' · chờ gửi lại'):('Cần sửa L'+k); cls='fix'; }
      else if(last.sent){ st='Chờ duyệt L'+k; cls='wait'; }
      else { st='Đang làm'; cls='doing'; }
    }
    else if(r.work||r.recv||r.chot){ st='Đang làm'; cls='doing'; }
    else { st='Chưa làm'; cls='todo'; }
    if(li.late>0){ st+=' · trễ '+li.late+' ngày'; cls=cls==='done'?'late':cls; }
    else if(li.over){ st+=' · quá hạn'; cls='late'; }
    return {txt:st, cls:cls};
  }

  /* ---------- ghi dữ liệu ---------- */
  function saveItem(ym,id,rec){
    var m=mon(ym); var prev=m.items[id];
    m.items[id]=rec; saveBak(); rerender();
    put('months/'+ym+'/items/'+id, rec).catch(function(e){ if(prev===undefined) delete m.items[id]; else m.items[id]=prev; saveBak(); fail(e); rerender(); });
  }
  function recCopy(ym,id){ var r=mon(ym).items[id]; r=r?JSON.parse(JSON.stringify(r)):{}; if(r.rounds&&!Array.isArray(r.rounds)) r.rounds=[]; return r; }
  window.cdSet=function(id,field,val){
    var ym=S.month, r=recCopy(ym,id);
    if(val) r[field]=val; else delete r[field];
    if(field==='done') delete r.autoDone;
    r.upd=todayISO(); saveItem(ym,id,r);
  };
  window.cdRound=function(id,i,field,val){
    var ym=S.month, r=recCopy(ym,id); r.rounds=r.rounds||[];
    while(r.rounds.length<=i) r.rounds.push({});
    var rd=r.rounds[i]||{}; if(val) rd[field]=val; else delete rd[field];
    if(field==='res' && val!=='fix'){ delete rd.reason; delete rd.req; delete rd.fixed; delete rd.did; }
    if(field==='res' && val==='ok') r.rounds=r.rounds.slice(0,i+1); // đạt rồi thì bỏ các vòng sau
    r.rounds[i]=rd;
    var t=taskById(String(id).split('_')[1])||{};
    if(t.kind!=='cc'){ // việc thường: leader Đạt → tự điền ngày xong (nếu chưa có); đổi lại thì bỏ ngày tự điền
      if(field==='res' && val==='ok' && !r.done){ r.done=rd.resp||todayISO(); r.autoDone=1; }
      else if(field==='resp' && r.autoDone && rd.res==='ok' && val){ r.done=val; }
      else if(field==='res' && val!=='ok' && r.autoDone){ delete r.done; delete r.autoDone; }
    }
    r.upd=todayISO(); saveItem(ym,id,r);
  };
  window.cdAddRound=function(id){
    var ym=S.month, r=recCopy(ym,id); r.rounds=(r.rounds||[]).concat([{sent:todayISO(), res:'wait'}]);
    S.open[id]=true; saveItem(ym,id,r);
  };
  window.cdDelRound=function(id){
    var ym=S.month, r=recCopy(ym,id); if(!r.rounds||!r.rounds.length) return;
    if(!confirm('Xoá vòng duyệt L'+r.rounds.length+'?')) return;
    r.rounds=r.rounds.slice(0,-1); saveItem(ym,id,r);
  };
  window.cdToggle=function(id){ S.open[id]=!S.open[id]; rerender(); };
  window.cdTick=function(tid,d){
    var ym=S.month, m=mon(ym); m.day[tid]=m.day[tid]||{};
    var on=!m.day[tid][d]; if(on) m.day[tid][d]=1; else delete m.day[tid][d];
    saveBak(); rerender();
    put('months/'+ym+'/day/'+tid+'/'+d, on?1:null).catch(function(e){ if(on) delete m.day[tid][d]; else m.day[tid][d]=1; saveBak(); fail(e); rerender(); });
  };
  window.cdMonth=function(k){ S.month=k===0?curMonth():shiftMonth(S.month,k); S.open={}; S.addEv=null; rerender(); };
  window.cdFilter=function(f){ S.f=f; rerender(); };
  window.cdReload=function(){ S.loaded=false; load(); rerender(); };

  /* phát sinh */
  window.cdEvOpen=function(tid,title){ S.addEv={tid:tid||'', title:title||''}; rerender(); setTimeout(function(){ var el=document.getElementById('cd-ev-title'); if(el) el.focus({preventScroll:true}); },50); };
  window.cdEvCancel=function(){ S.addEv=null; rerender(); };
  window.cdEvSave=function(){
    var sel=document.getElementById('cd-ev-tid'), ti=document.getElementById('cd-ev-title');
    var tid=sel?sel.value:'', name=ti?ti.value.trim():'';
    if(!tid){ alert('Chọn quy trình.'); return; }
    var t=taskById(tid)||{};
    var id='e_'+tid+'_'+Date.now().toString(36);
    var rec={tid:tid, ptitle:t.title||'', name:name, recv:todayISO(), created:todayISO()};
    S.addEv=null; saveItem(S.month,id,rec);
  };
  window.cdEvDel=function(id){
    var it=mon(S.month).items[id]; if(!it) return;
    if(!confirm('Xoá lần phát sinh này?')) return;
    var m=mon(S.month), prev=m.items[id]; delete m.items[id]; saveBak(); rerender();
    put('months/'+S.month+'/items/'+id, null).catch(function(e){ m.items[id]=prev; saveBak(); fail(e); rerender(); });
  };
  window.cdEvName=function(id,val){ window.cdSet(id,'name',String(val||'').trim()); };

  /* ---------- gợi ý từ HSNS ---------- */
  function people(){ return ((window.HR&&window.HR.nhansu)||[]).filter(window.isWorking||function(){return true;}); }
  function pd(s){ return (typeof window.parseDMY==='function')?window.parseDMY(s):(typeof parseDMY==='function'?parseDMY(s):null); }
  function suggestions(ym){
    var y=+ym.slice(0,4), m=+ym.slice(5,7), out=[], have={};
    Object.keys(mon(ym).items).forEach(function(id){ var r=mon(ym).items[id]; if(r&&r.name) have[r.tid+'|'+r.name]=1; });
    people().forEach(function(n){
      var nm=n.hoTen||n.maNV; if(!nm) return;
      var nv=pd(n.ngayVao); if(nv && nv.getFullYear()===y && nv.getMonth()+1===m && !have['nm|'+nm]) out.push(['nm', nm, 'Người mới: '+nm+' (vào '+p2(nv.getDate())+'/'+p2(m)+')']);
      var hh=pd(n.ngayHetHan); if(hh && hh.getFullYear()===y && hh.getMonth()+1===m && /thử việc/i.test(String(n.loaiHD||'')) && !have['tv|'+nm]) out.push(['tv', nm, 'Hết thử việc: '+nm+' ('+p2(hh.getDate())+'/'+p2(m)+')']);
    });
    return out;
  }
  function birthdays(ym){ var m=+ym.slice(5,7), n=0; people().forEach(function(p){ var sp=String(p.sinhNhat||'').split('/'); if(sp.length>=2 && +sp[1]===m) n++; }); return n; }

  /* ---------- CSS ---------- */
  function css(){
    if(document.getElementById('cvcd-css')) return;
    var s=document.createElement('style'); s.id='cvcd-css';
    s.textContent=''
    +'#cvcd{--ok:#177A53;--okb:#E3F4EE;--wa:#9A6417;--wab:#FBF1DF;--er:#A42F2F;--erb:#FDECEC;--in:#3548A8;--inb:#E8EBF8;font-size:13px}'
    +'#cvcd .cd-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}'
    +'#cvcd .cd-btn{background:var(--paper,#FBFAF6);border:1px solid var(--line,#E4DECF);border-radius:8px;padding:7px 12px;font:inherit;font-size:13px;color:var(--ink,#21303B);cursor:pointer}'
    +'#cvcd .cd-btn.dark{background:var(--ink,#21303B);color:#fff;border-color:var(--ink,#21303B);font-weight:600}'
    +'#cvcd .cd-btn.sm{padding:4px 9px;font-size:12px}'
    +'#cvcd .cd-mlbl{font-weight:700;color:var(--ink,#21303B);font-size:15px;min-width:118px;text-align:center}'
    +'#cvcd .cd-seg{display:inline-flex;flex-wrap:wrap;background:var(--paper-2,#F6F3EC);border:1px solid var(--line,#E4DECF);border-radius:9px;padding:2px}'
    +'#cvcd .cd-seg button{border:0;background:none;font:inherit;font-size:12.5px;padding:6px 11px;border-radius:7px;color:var(--muted,#8B897E);cursor:pointer}'
    +'#cvcd .cd-seg button.on{background:var(--paper,#FBFAF6);color:var(--ink,#21303B);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.06)}'
    +'#cvcd .cd-sp{flex:1}'
    +'#cvcd .cd-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:10px}'
    +'#cvcd .cd-kpi{background:var(--paper,#FBFAF6);border:1px solid var(--line,#E4DECF);border-radius:10px;padding:11px 13px}'
    +'#cvcd .cd-kpi .l{font-size:12px;color:var(--muted,#8B897E)}#cvcd .cd-kpi .v{font-size:22px;font-weight:700;color:var(--ink,#21303B);margin-top:2px}'
    +'#cvcd .cd-kpi .v small{font-size:11.5px;color:var(--muted,#8B897E);font-weight:500}'
    +'#cvcd .cd-kpi.wa{background:var(--wab);border-color:#E9CF9D}#cvcd .cd-kpi.er{background:var(--erb);border-color:#F0C2C2}#cvcd .cd-kpi.in{background:var(--inb);border-color:#B9C3EC}'
    +'#cvcd .cd-cap{font-size:11.5px;color:var(--muted,#8B897E);margin:0 0 14px}'
    +'#cvcd .cd-card{background:var(--paper,#FBFAF6);border:1px solid var(--line,#E4DECF);border-radius:10px;margin-bottom:16px;overflow:hidden}'
    +'#cvcd .cd-ch{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--line-soft,#EDE8DC)}'
    +'#cvcd .cd-ch h3{margin:0;font-size:14.5px;color:var(--ink,#21303B)}#cvcd .cd-ch .cnt{font-size:12px;color:var(--muted,#8B897E)}'
    +'#cvcd .cd-scroll{overflow-x:auto}'
    +'#cvcd table.cd-t{border-collapse:collapse;width:100%;min-width:1020px}'
    +'#cvcd .cd-t th{font-size:11.5px;font-weight:600;color:var(--muted,#8B897E);text-align:left;padding:8px 10px;background:var(--paper-2,#F6F3EC);border-bottom:1px solid var(--line,#E4DECF);white-space:nowrap}'
    +'#cvcd .cd-t td{padding:8px 10px;border-bottom:1px solid var(--line-soft,#EDE8DC);vertical-align:top}'
    +'#cvcd .tn{font-weight:600;color:var(--ink,#21303B)}#cvcd .ts{font-size:11.5px;color:var(--muted,#8B897E);margin-top:2px}'
    +'#cvcd .blank{color:var(--faint,#A9A599);font-style:italic;font-size:12px}'
    +'#cvcd input[type=date],#cvcd input[type=number]{font:inherit;font-size:12px;border:1px solid var(--line,#E4DECF);border-radius:6px;padding:4px 5px;background:#fff;color:var(--ink,#21303B);width:122px}'
    +'#cvcd input[type=number]{width:62px}'
    +'#cvcd input[type=date].ok{border-color:#9FD3BD;background:var(--okb)}#cvcd input[type=date].late{border-color:#E8A9A9;background:var(--erb)}'
    +'#cvcd input[type=text],#cvcd select,#cvcd textarea{font:inherit;font-size:12px;border:1px solid var(--line,#E4DECF);border-radius:6px;padding:5px 7px;background:#fff;color:var(--ink,#21303B)}'
    +'#cvcd input[type=text]{width:100%}'
    +'#cvcd .ch{font-size:10.5px;color:var(--muted,#8B897E);margin-top:3px;white-space:nowrap}#cvcd .ch.late{color:var(--er);font-weight:600}#cvcd .ch.ok{color:var(--ok)}'
    +'#cvcd .pill{text-transform:none;letter-spacing:0;display:inline-block;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:10px;white-space:nowrap}'
    +'#cvcd .p-todo{background:var(--paper-2,#F6F3EC);color:var(--muted,#8B897E);border:1px solid var(--line,#E4DECF)}#cvcd .p-doing{background:var(--inb);color:var(--in)}'
    +'#cvcd .p-wait{background:var(--inb);color:var(--in)}#cvcd .p-fix{background:var(--wab);color:var(--wa)}#cvcd .p-done{background:var(--okb);color:var(--ok)}#cvcd .p-late{background:var(--erb);color:var(--er)}'
    +'#cvcd .rds{font-size:11.5px;line-height:1.65}#cvcd .rd b{color:var(--ink,#21303B);margin-right:4px}'
    +'#cvcd .r-ok{color:var(--ok);font-weight:600}#cvcd .r-fix{color:var(--wa);font-weight:600}#cvcd .r-wait{color:var(--in);font-weight:600}'
    +'#cvcd .fbq{color:var(--muted,#8B897E);font-style:italic}'
    +'#cvcd .tog{display:block;background:none;border:0;color:var(--in);font:inherit;font-size:12px;cursor:pointer;padding:0;margin-top:4px}'
    +'#cvcd .panel{padding:12px 14px 14px;background:#FCFBF8;border-top:1px dashed var(--line,#E4DECF)}'
    +'#cvcd .panel h5{margin:0 0 8px;font-size:12px;color:var(--ink,#21303B)}'
    +'#cvcd .prow{display:grid;grid-template-columns:40px 126px 112px 126px 150px minmax(140px,1.3fr) 126px minmax(140px,1.3fr);gap:8px;align-items:center;padding:6px 0;border-bottom:1px dotted var(--line,#E4DECF);min-width:1000px}'
    +'#cvcd .prow.hd{font-size:11px;color:var(--muted,#8B897E);font-weight:600;border-bottom:1px solid var(--line,#E4DECF)}'
    +'#cvcd .s-ok{background:var(--okb);color:var(--ok);border-color:#9FD3BD}#cvcd .s-fix{background:var(--wab);color:var(--wa);border-color:#E9CF9D}#cvcd .s-wait{background:var(--inb);color:var(--in);border-color:#B9C3EC}'
    +'#cvcd .steps{display:flex;align-items:stretch;padding:12px 14px 14px;background:#FCFBF8;border-top:1px dashed var(--line,#E4DECF);overflow-x:auto}'
    +'#cvcd .step{min-width:168px;flex:1;padding:0 10px;border-left:2px solid var(--line,#E4DECF)}#cvcd .step:first-child{border-left:0;padding-left:0}'
    +'#cvcd .step .sn{font-size:11px;color:var(--muted,#8B897E);font-weight:600;text-transform:uppercase;letter-spacing:.03em}'
    +'#cvcd .step .st{font-weight:600;color:var(--ink,#21303B);margin:2px 0 6px}#cvcd .step .sh{font-size:11.5px;color:var(--muted,#8B897E);margin-bottom:5px}'
    +'#cvcd .step .lr{margin-top:6px;font-size:11px;color:var(--muted,#8B897E)}#cvcd .step select,#cvcd .step input[type=text]{width:100%}'
    +'#cvcd .step.skip{opacity:.45}'
    +'#cvcd .grid{display:grid;font-size:11px;min-width:980px}'
    +'#cvcd .grid div{border-bottom:1px solid var(--line-soft,#EDE8DC);border-right:1px solid var(--line-soft,#EDE8DC);padding:6px 0;text-align:center}'
    +'#cvcd .grid .gh{background:var(--paper-2,#F6F3EC);color:var(--muted,#8B897E);font-weight:600}'
    +'#cvcd .grid .gn{text-align:left;padding-left:12px;font-weight:600;color:var(--ink,#21303B);font-size:12.5px}'
    +'#cvcd .grid .c{cursor:pointer}#cvcd .grid .c:hover{background:#F0EDE4}'
    +'#cvcd .grid .we{background:#F3F0E8;color:var(--faint,#A9A599)}'
    +'#cvcd .grid .tick{color:var(--ok);font-weight:700;background:var(--okb)}#cvcd .grid .miss{color:var(--er);background:var(--erb)}'
    +'#cvcd .grid .today{outline:2px solid var(--ink,#21303B);outline-offset:-2px}'
    +'#cvcd .legend{display:flex;flex-wrap:wrap;gap:14px;padding:10px 14px;font-size:11.5px;color:var(--muted,#8B897E)}'
    +'#cvcd .lg::before{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}'
    +'#cvcd .lg-ok::before{background:var(--okb);border:1px solid #9FD3BD}#cvcd .lg-miss::before{background:var(--erb);border:1px solid #E8A9A9}#cvcd .lg-we::before{background:#F3F0E8;border:1px solid var(--line,#E4DECF)}'
    +'#cvcd .banner{display:flex;flex-wrap:wrap;gap:8px;align-items:center;background:var(--wab);border:1px solid #E9CF9D;color:var(--wa);border-radius:9px;padding:9px 12px;margin-bottom:12px;font-size:12.5px}'
    +'#cvcd .chip{background:#fff;border:1px solid var(--line,#E4DECF);border-radius:14px;padding:3px 10px;font:inherit;font-size:12px;cursor:pointer;color:var(--ink,#21303B)}'
    +'#cvcd .addev{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:10px 14px;background:#FCFBF8;border-bottom:1px solid var(--line-soft,#EDE8DC)}'
    +'#cvcd .addev input[type=text]{width:280px}'
    +'#cvcd .ico{background:none;border:0;color:var(--muted,#8B897E);cursor:pointer;font-size:15px;padding:2px 4px}'
    +'#cvcd .set{background:var(--paper,#FBFAF6);border:1px solid var(--ink,#21303B);border-radius:10px;padding:14px;margin-bottom:16px}'
    +'#cvcd .set h3{margin:0 0 4px;font-size:15px;color:var(--ink,#21303B)}'
    +'#cvcd .set table{border-collapse:collapse;width:100%;min-width:980px}#cvcd .set td,#cvcd .set th{padding:5px 6px;border-bottom:1px solid var(--line-soft,#EDE8DC);text-align:left;font-size:12px;vertical-align:middle}'
    +'#cvcd .set th{color:var(--muted,#8B897E);font-weight:600}'
    +'#cvcd .set textarea{width:100%;min-height:96px}'
    +'@media(max-width:900px){#cvcd .cd-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}';
    document.head.appendChild(s);
  }

  /* ---------- render từng phần ---------- */
  function dateIn(val,onch,cls,ph){ return '<input type="date" class="'+(cls||'')+'" value="'+e_(val||'')+'" onchange="'+onch+'"'+(ph?' title="'+e_(ph)+'"':'')+'>'; }
  function dueHint(actual,due,lbl){
    if(!due) return '';
    if(actual){ var d=diffDays(actual,due); return d>0?'<div class="ch late">trễ '+d+' ngày (hạn '+dm(due)+')</div>':'<div class="ch ok">đúng hạn ('+dm(due)+')</div>'; }
    return '<div class="ch">hạn '+(lbl?lbl+' ':'')+dm(due)+'</div>';
  }
  function cls4(actual,due){ if(!actual||!due) return ''; return diffDays(actual,due)>0?'late':'ok'; }
  function q(s){ return '\''+s+'\''; }
  function resSel(id,i,v){
    var c=v==='ok'?'s-ok':(v==='fix'?'s-fix':'s-wait');
    return '<select class="'+c+'" onchange="cdRound('+q(id)+','+i+',\'res\',this.value)">'
      +[['wait','Chờ duyệt'],['ok','Đạt'],['fix','Cần sửa']].map(function(o){ return '<option value="'+o[0]+'"'+((v||'wait')===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select>';
  }
  function reasonSel(id,i,v){
    var rs=reasons().slice(); if(v && rs.indexOf(v)<0) rs.push(v);
    return '<select class="'+(v?'s-fix':'')+'" onchange="cdRound('+q(id)+','+i+',\'reason\',this.value)"><option value="">— chọn lý do —</option>'
      +rs.map(function(o){ return '<option'+(o===v?' selected':'')+'>'+e_(o)+'</option>'; }).join('')+'</select>';
  }
  function txtIn(val,onch,ph){ return '<input type="text" value="'+e_(val||'')+'" placeholder="'+e_(ph||'')+'" onchange="'+onch+'">'; }
  function roundsSummary(it){
    var rs=rounds(it.rec);
    if(!needApprove(it)) return '<span class="ts">— không duyệt</span>';
    if(!rs.length) return '<span class="ts">Chưa gửi leader</span>';
    return '<div class="rds">'+rs.map(function(r,i){
      r=r||{}; var res=r.res==='ok'?'<span class="r-ok">Đạt</span>':(r.res==='fix'?'<span class="r-fix">Cần sửa</span>':'<span class="r-wait">Chờ duyệt</span>');
      var h='<div class="rd"><b>L'+(i+1)+'</b>gửi '+(r.sent?dm(r.sent):'—')+' → '+res+(r.resp?' '+dm(r.resp):'')+'</div>';
      if(r.res==='fix'){
        if(r.reason||r.req) h+='<div class="rd fbq">Lý do: '+e_(r.reason||'—')+(r.req?' — “'+e_(r.req)+'”':'')+'</div>';
        if(r.fixed||r.did) h+='<div class="rd fbq">Em sửa'+(r.fixed?' '+dm(r.fixed):'')+(r.did?': '+e_(r.did):'')+'</div>';
      }
      return h;
    }).join('')+'</div>';
  }
  function roundsPanel(it,title){
    var id=it.id, rs=rounds(it.rec), k=rs.length, last=rs[k-1]||{};
    var h='<div class="panel"><h5>Vòng duyệt — '+e_(title)+'</h5><div class="cd-scroll">'
      +'<div class="prow hd"><span>Lần</span><span>Ngày gửi leader</span><span>Leader phản hồi</span><span>Ngày phản hồi</span><span>Lý do sửa (nhóm)</span><span>Leader yêu cầu sửa gì</span><span>Ngày em sửa xong</span><span>Em đã sửa gì</span></div>';
    rs.forEach(function(r,i){
      r=r||{};
      h+='<div class="prow"><b>L'+(i+1)+'</b>'
        +dateIn(r.sent,'cdRound('+q(id)+','+i+',\'sent\',this.value)')
        +resSel(id,i,r.res)
        +dateIn(r.resp,'cdRound('+q(id)+','+i+',\'resp\',this.value)')
        +(r.res==='fix'
          ? reasonSel(id,i,r.reason)+txtIn(r.req,'cdRound('+q(id)+','+i+',\'req\',this.value)','Leader yêu cầu sửa gì')
            +dateIn(r.fixed,'cdRound('+q(id)+','+i+',\'fixed\',this.value)')+txtIn(r.did,'cdRound('+q(id)+','+i+',\'did\',this.value)','Em đã sửa gì')
          : '<span class="ts">—</span><span class="ts">—</span><span class="ts">—</span><span class="ts">—</span>')
        +'</div>';
    });
    h+='</div><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">';
    if(!k) h+='<button class="cd-btn sm" onclick="cdAddRound('+q(id)+')">+ Gửi leader lần 1</button>';
    else if(last.res==='fix') h+='<button class="cd-btn sm" onclick="cdAddRound('+q(id)+')">+ Gửi lại lần '+(k+1)+'</button>';
    if(k) h+='<button class="cd-btn sm" onclick="cdDelRound('+q(id)+')">Xoá vòng L'+k+'</button>';
    h+='<span class="ts" style="align-self:center">Ô lý do / sửa gì chỉ hiện khi leader chọn <b>Cần sửa</b>. Bấm “Gửi” sẽ điền sẵn ngày hôm nay, sửa lại được.</span></div></div>';
    return h;
  }
  function ccSteps(it,ym){
    var id=it.id, t=it.t, r=it.rec, rs=rounds(r), ok=okRound(it);
    function stepRound(i,name,dueTxt){
      var rd=rs[i]||{}, skip=ok&&ok<=i, prevFix=i===0 || (rs[i-1]&&rs[i-1].res==='fix');
      var h='<div class="step'+(skip?' skip':'')+'"><div class="sn">Bước '+(i+2)+'</div><div class="st">'+name+' (L'+(i+1)+')</div><div class="sh">'+dueTxt+'</div>';
      if(skip){ return h+'<div class="ts">Bỏ qua — leader đã Đạt ở L'+ok+'</div></div>'; }
      if(!prevFix && !rs[i]){ return h+'<div class="ts">Chỉ cần khi L'+i+' bị “Cần sửa”</div></div>'; }
      if(!rs[i]) return h+'<button class="cd-btn sm" onclick="cdAddRound('+q(id)+')">Gửi leader</button></div>';
      var due=i===1?dayDue(ym,t.sua1):(i===2?dayDue(ym,t.sua2):'');
      h+='<div class="lr">Ngày gửi</div>'+dateIn(rd.sent,'cdRound('+q(id)+','+i+',\'sent\',this.value)',cls4(rd.sent,due))+(due?dueHint(rd.sent,due):'')
        +'<div class="lr">Leader: '+resSel(id,i,rd.res)+'</div>'
        +'<div class="lr">Ngày leader phản hồi</div>'+dateIn(rd.resp,'cdRound('+q(id)+','+i+',\'resp\',this.value)');
      if(rd.res==='fix') h+='<div class="lr">'+reasonSel(id,i,rd.reason)+'</div><div class="lr">'+txtIn(rd.req,'cdRound('+q(id)+','+i+',\'req\',this.value)','Leader yêu cầu sửa gì')+'</div>'
        +'<div class="lr">'+txtIn(rd.did,'cdRound('+q(id)+','+i+',\'did\',this.value)','Em đã sửa gì')+'</div>';
      return h+'</div>';
    }
    var cfm=effCfm(it,ym), d1=effDue(it,ym), dc=dayDue(ym,t.chot), dg=dayDue(ym,t.gui);
    return '<div class="steps">'
      +'<div class="step"><div class="sn">Bước 1</div><div class="st">Nhập / chốt sơ bộ</div><div class="sh">Hạn: '+(d1?dm(d1):'<span class="blank">anh đặt</span>')+'</div>'+dateIn(r.work,'cdSet('+q(id)+',\'work\',this.value)',cls4(r.work,d1))+dueHint(r.work,d1)+'</div>'
      +stepRound(0,'Gửi leader CFM','Hạn leader CFM: '+(cfm?dm(cfm):'<span class="blank">anh đặt</span>'))
      +stepRound(1,'Sửa lần 1','Hạn: '+(t.sua1?('ngày '+t.sua1):'<span class="blank">anh đặt</span>'))
      +stepRound(2,'Sửa lần 2','Hạn: '+(t.sua2?('ngày '+t.sua2):'<span class="blank">anh đặt</span>'))
      +'<div class="step"><div class="sn">Bước 5</div><div class="st">Chốt</div><div class="sh">Hạn: '+(dc?dm(dc):'<span class="blank">anh đặt</span>')+'</div>'+dateIn(r.chot,'cdSet('+q(id)+',\'chot\',this.value)',cls4(r.chot,dc))+dueHint(r.chot,dc)+'</div>'
      +'<div class="step"><div class="sn">Bước 6</div><div class="st">Gửi kế toán</div><div class="sh">Hạn: '+(dg?dm(dg):'<span class="blank">anh đặt</span>')+'</div>'+dateIn(r.done,'cdSet('+q(id)+',\'done\',this.value)',cls4(r.done,dg))+dueHint(r.done,dg)+'<div class="ts">Có ngày gửi = Xong</div></div>'
      +'</div><div class="ts" style="padding:0 14px 12px;background:#FCFBF8">Leader chọn <b>Đạt</b> ở bước nào thì các bước sửa sau tự bỏ qua, chuyển sang Chốt.</div>';
  }
  function statusPill(it,ym){ var s=status(it,ym); return '<span class="pill p-'+s.cls+'">'+e_(s.txt)+'</span>'; }

  /* hàng việc (tuần / tháng / phát sinh) */
  function rowHtml(it,ym,opt){
    var id=it.id, t=it.t, r=it.rec, due=effDue(it,ym), cfm=effCfm(it,ym), ap=needApprove(it), ci=cfmInfo(it,ym);
    var cols=opt.cols, title=opt.title, h='<tr>';
    h+='<td>'+opt.nameCell+'</td>';
    if(opt.weekCell) h+='<td class="ts" style="white-space:nowrap">'+opt.weekCell+'</td>';
    // hạn làm
    if(t.kind==='cc') h+='<td class="ts" style="white-space:nowrap">nhập '+(t.due||'—')+' · sửa '+(t.sua1||'—')+' · '+(t.sua2||'—')+'<br>chốt '+(t.chot||'—')+'</td>';
    else h+='<td>'+dateIn(due,'cdSet('+q(id)+',\'due\',this.value)', due?'':'' , 'Hạn làm')+(!due?'<div class="ch blank">anh đặt</div>':(r.due||t.freq!=='month'?'':'<div class="ch">theo thiết lập</div>'))+'</td>';
    h+='<td>'+dateIn(r.recv,'cdSet('+q(id)+',\'recv\',this.value)')+'</td>';
    h+='<td>'+dateIn(r.work,'cdSet('+q(id)+',\'work\',this.value)',cls4(r.work,due))+dueHint(r.work,due)+'</td>';
    if(ap){
      h+='<td>'+dateIn(cfm,'cdSet('+q(id)+',\'cfmDue\',this.value)')+(ci?'<div class="ch'+(ci.late?' late':(ci.ok?' ok':''))+'">'+ci.txt+'</div>':(!cfm?'<div class="ch blank">anh đặt</div>':''))+'</td>';
      h+='<td>'+roundsSummary(it)+(t.kind==='cc'?'<button class="tog" onclick="cdToggle('+q(id)+')">'+(S.open[id]?'▴ Thu gọn 6 bước':'▾ Mở 6 bước để nhập')+'</button>':'<button class="tog" onclick="cdToggle('+q(id)+')">'+(S.open[id]?'▴ Thu gọn':'▾ Nhập / sửa vòng duyệt')+'</button>')+'</td>';
    } else h+='<td class="ts">— không duyệt</td><td class="ts">—</td>';
    if(t.kind==='cc'){
      var dc=dayDue(ym,t.chot);
      h+='<td><div class="ts">Chốt</div>'+dateIn(r.chot,'cdSet('+q(id)+',\'chot\',this.value)',cls4(r.chot,dc))+dueHint(r.chot,dc)+'<div class="ts" style="margin-top:4px">Gửi kế toán</div>'+dateIn(r.done,'cdSet('+q(id)+',\'done\',this.value)')+'</td>';
    } else h+='<td>'+dateIn(r.done,'cdSet('+q(id)+',\'done\',this.value)')+'</td>';
    h+='<td>'+statusPill(it,ym)+(opt.del?'<div><button class="ico" title="Xoá lần phát sinh" onclick="cdEvDel('+q(id)+')">🗑</button></div>':'')+'</td>';
    h+='</tr>';
    if(S.open[id] && ap) h+='<tr><td colspan="'+cols+'" style="padding:0">'+(t.kind==='cc'?ccSteps(it,ym):roundsPanel(it,title))+'</td></tr>';
    return h;
  }
  function nameCell(t,extra){ return '<div class="tn">'+e_(t.title)+'</div>'+(t.sub?'<div class="ts">'+e_(t.sub)+'</div>':'')+(extra||''); }

  function secDay(ym){
    var list=tasks().filter(function(t){return t.freq==='day';}); if(!list.length) return '';
    var m=mon(ym), nd=lastDay(ym), p=ym.split('-'), tdy=todayISO(), tick=0, base=0;
    var g='<div class="grid" style="grid-template-columns:220px repeat('+nd+',minmax(22px,1fr))"><div class="gh gn">Việc \\ Ngày</div>';
    for(var d=1;d<=nd;d++){ var w=new Date(+p[0],+p[1]-1,d).getDay(); g+='<div class="gh'+((w===0||w===6)?' we':'')+(ym+'-'+p2(d)===tdy?' today':'')+'">'+d+'</div>'; }
    list.forEach(function(t){
      g+='<div class="gn">'+e_(t.title)+'</div>';
      for(var d=1;d<=nd;d++){
        var di=ym+'-'+p2(d), w=new Date(+p[0],+p[1]-1,d).getDay(), we=(w===0||w===6), on=!!(m.day[t.id]&&m.day[t.id][d]);
        var past=di<tdy, c='c';
        if(!we && di<=tdy){ base++; if(on) tick++; }
        if(on) c+=' tick'; else if(we) c+=' we'; else if(past) c+=' miss';
        if(di===tdy) c+=' today';
        g+='<div class="'+c+'" onclick="cdTick(\''+t.id+'\','+d+')">'+(on?'✓':(!we&&past?'·':''))+'</div>';
      }
    });
    g+='</div>';
    S._daily={tick:tick, base:base};
    return '<div class="cd-card"><div class="cd-ch"><h3>A. Hằng ngày</h3><span class="cnt">'+list.length+' việc · đã tick '+tick+'/'+base+' lượt (ngày làm việc tính tới hôm nay)</span><span class="cd-sp"></span><span class="ts">Bấm ô để tick ✓ / bỏ tick</span></div>'
      +'<div class="cd-scroll">'+g+'</div><div class="legend"><span class="lg lg-ok">Đã làm</span><span class="lg lg-miss">Ngày làm việc đã qua mà chưa tick</span><span class="lg lg-we">Thứ 7 / CN</span></div></div>';
  }
  var HEAD8='<th>Hạn làm</th><th>Ngày nhận</th><th>Ngày làm</th><th>Hạn leader CFM</th><th style="width:24%">Duyệt của leader</th><th>Chốt / xong</th><th>Trạng thái</th>';
  function secWeek(ym,items){
    var list=items.filter(function(it){return it.t.freq==='week';}); if(!list.length) return '';
    var rows=list.map(function(it){
      var w=it.week; return rowHtml(it,ym,{cols:9, title:it.t.title+' T'+w.n, nameCell:nameCell(it.t), weekCell:'T'+w.n+'<br>'+dm(w.mon)+'–'+dm(w.sun)});
    }).join('');
    return '<div class="cd-card"><div class="cd-ch"><h3>B. Hằng tuần</h3><span class="cnt">'+tasks().filter(function(t){return t.freq==='week';}).length+' việc × '+weeksOf(ym).length+' tuần (tuần T2→CN, tính vào tháng chứa ngày thứ Năm)</span></div>'
      +'<div class="cd-scroll"><table class="cd-t"><thead><tr><th style="width:17%">Công việc</th><th>Tuần</th>'+HEAD8+'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }
  function secMonth(ym,items){
    var list=items.filter(function(it){return it.t.freq==='month';}); if(!list.length) return '';
    var rows=list.map(function(it){
      var extra=''; if(it.t.kind==='bd' && window.HR && window.HR.loaded) extra='<div class="ts">HSNS: '+birthdays(ym)+' người sinh nhật trong tháng</div>';
      return rowHtml(it,ym,{cols:8, title:it.t.title, nameCell:nameCell(it.t,extra)});
    }).join('');
    return '<div class="cd-card"><div class="cd-ch"><h3>C. Hằng tháng</h3><span class="cnt">'+list.length+' việc</span></div>'
      +'<div class="cd-scroll"><table class="cd-t"><thead><tr><th style="width:20%">Công việc</th>'+HEAD8+'</tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }
  function secEvent(ym,items){
    var procs=tasks().filter(function(t){return t.freq==='event';}); if(!procs.length) return '';
    var list=items.filter(function(it){return it.id.indexOf('e_')===0;});
    var sug=suggestions(ym);
    var h='<div class="cd-card"><div class="cd-ch"><h3>D. Theo phát sinh</h3><span class="cnt">'+procs.length+' quy trình · '+list.length+' lần phát sinh trong tháng</span><span class="cd-sp"></span><button class="cd-btn sm" onclick="cdEvOpen()">+ Thêm lần phát sinh</button></div>';
    if(sug.length) h+='<div class="addev"><span class="ts" style="margin:0">Gợi ý từ HSNS:</span>'+sug.map(function(s){ return '<button class="chip" onclick="cdEvOpen(\''+s[0]+'\',this.dataset.n)" data-n="'+e_(s[1])+'">+ '+e_(s[2])+'</button>'; }).join('')+'</div>';
    if(S.addEv){
      h+='<div class="addev"><select id="cd-ev-tid"><option value="">— Quy trình —</option>'+procs.map(function(t){ return '<option value="'+e_(t.id)+'"'+(t.id===S.addEv.tid?' selected':'')+'>'+e_(t.title)+'</option>'; }).join('')+'</select>'
        +'<input type="text" id="cd-ev-title" placeholder="Tên người / nội dung (vd: Nguyễn Văn A, Lễ 20/10)" value="'+e_(S.addEv.title)+'">'
        +'<button class="cd-btn sm dark" onclick="cdEvSave()">Thêm</button><button class="cd-btn sm" onclick="cdEvCancel()">Huỷ</button></div>';
    }
    if(list.length){
      h+='<div class="cd-scroll"><table class="cd-t"><thead><tr><th style="width:20%">Quy trình · lần phát sinh</th>'+HEAD8+'</tr></thead><tbody>'
        +list.map(function(it){
          var nc='<div class="tn">'+e_(it.t.title||it.rec.ptitle)+'</div>'+(it.t.sub?'<div class="ts">'+e_(it.t.sub)+'</div>':'')
            +'<div style="margin-top:4px">'+txtIn(it.rec.name,'cdEvName('+q(it.id)+',this.value)','Tên người / nội dung')+'</div>';
          return rowHtml(it,ym,{cols:8, title:(it.t.title||'')+(it.rec.name?': '+it.rec.name:''), nameCell:nc, del:true});
        }).join('')+'</tbody></table></div>';
    } else h+='<div class="legend">Chưa có lần phát sinh nào trong tháng. Quy trình: '+procs.map(function(t){return e_(t.title);}).join(' · ')+'</div>';
    return h+'</div>';
  }
  function secProj(ym){
    var list=tasks().filter(function(t){return t.freq==='proj';}); if(!list.length) return '';
    var m=mon(ym);
    var rows=list.map(function(t){
      var id='p_'+t.id, r=m.items[id]||{};
      var st=r.status||'doing';
      return '<tr><td>'+nameCell(t)+'</td><td>'+dateIn(r.last,'cdSet('+q(id)+',\'last\',this.value)')+'</td><td>'+txtIn(r.note,'cdSet('+q(id)+',\'note\',this.value)','Ghi ngắn nội dung đã làm')+'</td>'
        +'<td><select onchange="cdSet('+q(id)+',\'status\',this.value)">'+[['doing','Đang làm'],['pause','Tạm dừng'],['done','Xong']].map(function(o){ return '<option value="'+o[0]+'"'+(o[0]===st?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select></td></tr>';
    }).join('');
    return '<div class="cd-card"><div class="cd-ch"><h3>E. Liên tục / dự án</h3><span class="cnt">'+list.length+' việc · ghi lần cập nhật gần nhất trong tháng</span></div>'
      +'<div class="cd-scroll"><table class="cd-t"><thead><tr><th style="width:24%">Công việc</th><th>Lần cập nhật gần nhất</th><th>Nội dung đã làm</th><th>Trạng thái</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }

  /* ---------- KPI ---------- */
  function kpi(ym,items){
    var done=0, wait=0, graded=0, first=0, fix=0, late=0, cfmLate=0, rc={};
    items.forEach(function(it){
      var rs=rounds(it.rec), s=status(it,ym), li=lateInfo(it,ym), ci=cfmInfo(it,ym), ok=okRound(it);
      if(isDone(it)) done++;
      if(!isDone(it) && s.cls==='wait') wait++;
      if(needApprove(it) && ok){ graded++; if(ok===1) first++; }
      rs.forEach(function(r){ if(r&&r.res==='fix'){ fix++; var k=r.reason||'Chưa chọn lý do'; rc[k]=(rc[k]||0)+1; } });
      if(li.late>0||li.over) late++;
      if(ci&&ci.late) cfmLate++;
    });
    var top=Object.keys(rc).sort(function(a,b){return rc[b]-rc[a];}).slice(0,2).map(function(k){return k+': '+rc[k];}).join(' · ');
    return {total:items.length, done:done, wait:wait, graded:graded, first:first, fix:fix, top:top, rc:rc, late:late, cfmLate:cfmLate};
  }
  function kpiHtml(k){
    function box(l,v,c){ return '<div class="cd-kpi'+(c?' '+c:'')+'"><div class="l">'+l+'</div><div class="v">'+v+'</div></div>'; }
    return '<div class="cd-kpis">'
      +box('Việc đã xong', k.done+' <small>/ '+k.total+' việc</small>','')
      +box('Chờ leader duyệt', k.wait, k.wait?'in':'')
      +box('Đạt ngay lần 1', k.first+' <small>/ '+k.graded+' việc đã đạt</small>','')
      +box('Số lần sửa', k.fix+(k.top?' <small>'+e_(k.top)+'</small>':''), k.fix?'wa':'')
      +box('Em làm trễ / quá hạn', k.late, k.late?'er':'')
      +box('Leader CFM trễ hạn', k.cfmLate, k.cfmLate?'er':'')
      +'</div><div class="cd-cap">Tính trên việc tuần + tháng + phát sinh của '+monthLabel(S.month).toLowerCase()+'. “Leader CFM trễ” = leader phản hồi lần 1 sau hạn CFM, tách riêng, không tính vào phần trễ của anh. Việc chưa đặt hạn thì không tính trễ.</div>';
  }

  /* ---------- Thiết lập ---------- */
  window.cdSettings=function(on){
    S.settings=!!on;
    S.draft=on?{tasks:JSON.parse(JSON.stringify(tasks())), reasons:reasons().join('\n')}:null;
    rerender();
  };
  window.cdDraft=function(i,f,v){ var t=S.draft.tasks[i]; if(!t) return; if(f==='approve') t.approve=!!v; else if(['due','cfm','sua1','sua2','chot','gui'].indexOf(f)>=0){ var n=parseInt(v,10); t[f]=(n>=1&&n<=31)?n:''; } else t[f]=v; };
  window.cdDraftAdd=function(){ cdReadReasons(); S.draft.tasks.push({id:'u'+Date.now().toString(36), freq:'month', title:'', approve:true}); rerender(); };
  window.cdDraftDel=function(i){ cdReadReasons(); var t=S.draft.tasks[i]; if(!confirm('Bỏ việc "'+(t.title||'(chưa đặt tên)')+'" khỏi danh sách? (Dữ liệu đã nhập các tháng trước vẫn giữ trên cloud)')) return; S.draft.tasks.splice(i,1); rerender(); };
  window.cdDraftMove=function(i,k){ cdReadReasons(); var a=S.draft.tasks, j=i+k; if(j<0||j>=a.length) return; var x=a[i]; a[i]=a[j]; a[j]=x; rerender(); };
  window.cdReadReasons=function(){ cdReadReasons(); };
  function cdReadReasons(){ var el=document.getElementById('cd-reasons'); if(el) S.draft.reasons=el.value; }
  window.cdDraftDefault=function(){ if(!confirm('Đưa danh sách về mặc định ban đầu? (chỉ áp dụng khi bấm Lưu)')) return; S.draft={tasks:JSON.parse(JSON.stringify(DEF_TASKS)), reasons:DEF_REASONS.join('\n')}; rerender(); };
  window.cdSettingsSave=function(){
    cdReadReasons();
    var ts=S.draft.tasks.filter(function(t){ return String(t.title||'').trim(); }).map(function(t){ var o={}; Object.keys(t).forEach(function(k){ if(t[k]!==''&&t[k]!=null) o[k]=t[k]; }); o.title=String(o.title).trim(); return o; });
    var rs=String(S.draft.reasons||'').split('\n').map(function(s){return s.trim();}).filter(Boolean);
    var cfg={tasks:ts, reasons:rs.length?rs:DEF_REASONS};
    var btn=document.getElementById('cd-set-save'); if(btn){ btn.disabled=true; btn.textContent='Đang lưu…'; }
    put('config', cfg).then(function(){ S.config=cfg; saveBak(); S.settings=false; S.draft=null; rerender(); })
      .catch(function(e){ fail(e); if(btn){ btn.disabled=false; btn.textContent='Lưu thiết lập'; } });
  };
  function settingsHtml(){
    var d=S.draft, h='<div class="set"><h3>⚙ Thiết lập danh sách việc cố định</h3><div class="cd-cap">Hạn = ngày trong tháng (1–31; tháng không có ngày 31 → ngày cuối tháng). Để trống = chưa có hạn. Việc hằng tuần / phát sinh đặt hạn trực tiếp ở từng dòng.</div><div class="cd-scroll"><table><thead><tr><th></th><th style="width:22%">Tên việc</th><th style="width:22%">Mô tả ngắn</th><th>Tần suất</th><th>Hạn làm</th><th>Hạn leader CFM</th><th>Cần leader duyệt</th><th>Hạn riêng (chấm công)</th><th></th></tr></thead><tbody>';
    d.tasks.forEach(function(t,i){
      var mo=t.freq==='month';
      h+='<tr><td style="white-space:nowrap"><button class="ico" title="Lên" onclick="cdDraftMove('+i+',-1)">↑</button><button class="ico" title="Xuống" onclick="cdDraftMove('+i+',1)">↓</button></td>'
        +'<td><input type="text" value="'+e_(t.title)+'" onchange="cdDraft('+i+',\'title\',this.value)"></td>'
        +'<td><input type="text" value="'+e_(t.sub||'')+'" onchange="cdDraft('+i+',\'sub\',this.value)"></td>'
        +'<td><select onchange="cdDraft('+i+',\'freq\',this.value);cdReadReasons();rerenderSet()">'+FREQ_ORDER.map(function(f){ return '<option value="'+f+'"'+(f===t.freq?' selected':'')+'>'+FREQ[f]+'</option>'; }).join('')+'</select></td>'
        +'<td>'+(mo?'<input type="number" min="1" max="31" value="'+e_(t.due||'')+'" onchange="cdDraft('+i+',\'due\',this.value)">':'<span class="ts">—</span>')+'</td>'
        +'<td>'+(mo&&t.approve!==false?'<input type="number" min="1" max="31" value="'+e_(t.cfm||'')+'" onchange="cdDraft('+i+',\'cfm\',this.value)">':'<span class="ts">—</span>')+'</td>'
        +'<td>'+((t.freq==='day'||t.freq==='proj')?'<span class="ts">—</span>':'<input type="checkbox"'+(t.approve!==false?' checked':'')+' onchange="cdDraft('+i+',\'approve\',this.checked);cdReadReasons();rerenderSet()">')+'</td>'
        +'<td style="white-space:nowrap">'+(t.kind==='cc'?['sua1','sửa 1','sua2','sửa 2','chot','chốt','gui','gửi KT'].reduce(function(a,x,k,arr){ if(k%2) return a; return a+'<span class="ts">'+arr[k+1]+'</span> <input type="number" min="1" max="31" value="'+e_(t[x]||'')+'" onchange="cdDraft('+i+',\''+x+'\',this.value)"> '; },''):'<span class="ts">—</span>')+'</td>'
        +'<td>'+(t.kind?'<span class="ts" title="Việc có xử lý riêng">●</span>':'<button class="ico" title="Bỏ" onclick="cdDraftDel('+i+')">🗑</button>')+'</td></tr>';
    });
    h+='</tbody></table></div><div style="margin:8px 0 12px"><button class="cd-btn sm" onclick="cdDraftAdd()">+ Thêm việc</button></div>'
      +'<div class="tn" style="margin-bottom:4px">Nhóm lý do sửa (mỗi dòng 1 lý do)</div><textarea id="cd-reasons">'+e_(d.reasons)+'</textarea>'
      +'<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="cd-btn dark" id="cd-set-save" onclick="cdSettingsSave()">Lưu thiết lập</button><button class="cd-btn" onclick="cdSettings(false)">Huỷ</button><span class="cd-sp"></span><button class="cd-btn" onclick="cdDraftDefault()">Về mặc định</button></div></div>';
    return h;
  }
  window.rerenderSet=function(){ rerender(); };

  /* ---------- Xuất PDF ---------- */
  function roundsText(it){
    if(!needApprove(it)) return 'Không duyệt';
    var rs=rounds(it.rec); if(!rs.length) return '';
    return rs.map(function(r,i){ r=r||{}; var s='L'+(i+1)+' gửi '+(dm(r.sent)||'—')+' → '+(r.res==='ok'?'Đạt':(r.res==='fix'?'Cần sửa':'Chờ duyệt'))+(r.resp?' '+dm(r.resp):'');
      if(r.res==='fix') s+=(r.reason?' · lý do: '+r.reason:'')+(r.req?' ('+r.req+')':'')+(r.fixed||r.did?' · sửa'+(r.fixed?' '+dm(r.fixed):'')+(r.did?': '+r.did:''):'');
      return s; }).join('<br>');
  }
  window.cdExportPDF=function(){
    var ym=S.month, items=itemsFor(ym), k=kpi(ym,items);
    var btn=document.getElementById('cd-pdf'), old=btn?btn.innerHTML:'';
    function failP(msg){ if(btn){btn.disabled=false;btn.innerHTML=old;} alert(msg||'Không tạo được PDF, thử lại giúp em.'); }
    function run(){
      try{
        var th='padding:4px 5px;border:1px solid #D9D3C4;background:#F3F0E8;text-align:left;font-weight:600';
        var td='padding:4px 5px;border:1px solid #E4DECF;vertical-align:top';
        var rows='', n=0;
        items.forEach(function(it){
          n++; var r=it.rec, t=it.t, due=t.kind==='cc'?('nhập '+(t.due||'—')+' · sửa '+(t.sua1||'—')+'/'+(t.sua2||'—')+' · chốt '+(t.chot||'—')):dm(effDue(it,ym));
          var nm=e_(t.title||r.ptitle)+(it.week?' – T'+it.week.n+' ('+dm(it.week.mon)+'–'+dm(it.week.sun)+')':'')+(r.name?': '+e_(r.name):'');
          var s=status(it,ym);
          rows+='<tr style="page-break-inside:avoid"><td style="'+td+'">'+n+'</td><td style="'+td+'">'+nm+'</td><td style="'+td+'">'+FREQ[t.freq||'event']+'</td><td style="'+td+'">'+e_(due)+'</td><td style="'+td+'">'+dm(r.recv)+'</td><td style="'+td+'">'+dm(r.work)+'</td><td style="'+td+'">'+(needApprove(it)?dm(effCfm(it,ym)):'—')+'</td><td style="'+td+'">'+e_(roundsText(it)).replace(/&lt;br&gt;/g,'<br>')+'</td><td style="'+td+'">'+(t.kind==='cc'?(r.chot?'chốt '+dm(r.chot):'')+(r.done?'<br>gửi '+dm(r.done):''):dm(r.done))+'</td><td style="'+td+';color:'+(s.cls==='late'?'#A42F2F':(s.cls==='done'?'#177A53':'#414B54'))+'">'+e_(s.txt)+'</td></tr>';
        });
        // hằng ngày
        var m=mon(ym), nd=lastDay(ym), p=ym.split('-'), tdy=todayISO(), dRows='';
        tasks().filter(function(t){return t.freq==='day';}).forEach(function(t){
          var on=0, base=0, miss=[];
          for(var d=1;d<=nd;d++){ var di=ym+'-'+p2(d), w=new Date(+p[0],+p[1]-1,d).getDay(); if(w===0||w===6||di>tdy) continue; base++; if(m.day[t.id]&&m.day[t.id][d]) on++; else if(di<tdy) miss.push(d); }
          dRows+='<tr><td style="'+td+'">'+e_(t.title)+'</td><td style="'+td+'">'+on+'/'+base+'</td><td style="'+td+'">'+(miss.length?'Ngày chưa tick: '+miss.join(', '):'Đủ')+'</td></tr>';
        });
        var pj='';
        tasks().filter(function(t){return t.freq==='proj';}).forEach(function(t){ var r=m.items['p_'+t.id]||{}; pj+='<tr><td style="'+td+'">'+e_(t.title)+'</td><td style="'+td+'">'+dmy(r.last)+'</td><td style="'+td+'">'+e_(r.note||'')+'</td></tr>'; });
        var el=document.createElement('div');
        el.style.cssText='font-family:"Be Vietnam Pro",Arial,sans-serif;color:#21303B;font-size:10px;width:277mm;background:#fff';
        el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #21303B;padding-bottom:6px;margin-bottom:8px">'
          +'<div><div style="font-size:15px;font-weight:700">CHECKLIST CÔNG VIỆC CỐ ĐỊNH — '+monthLabel(ym).toUpperCase()+'</div><div style="color:#8B897E;margin-top:2px">Bộ phận Nhân sự · BigX · Ngày xuất '+dmy(tdy)+'</div></div>'
          +'<div style="text-align:right;color:#414B54;max-width:55%">Xong '+k.done+'/'+k.total+' · Chờ duyệt '+k.wait+' · Đạt ngay lần 1: '+k.first+'/'+k.graded+' · Sửa '+k.fix+' lần'+(k.top?' ('+e_(k.top)+')':'')+' · Trễ/quá hạn '+k.late+' · Leader CFM trễ '+k.cfmLate+'</div></div>'
          +'<table style="border-collapse:collapse;width:100%"><thead><tr><th style="'+th+'">#</th><th style="'+th+'">Công việc</th><th style="'+th+'">Tần suất</th><th style="'+th+'">Hạn</th><th style="'+th+'">Nhận</th><th style="'+th+'">Làm</th><th style="'+th+'">Hạn CFM</th><th style="'+th+';width:30%">Vòng duyệt / lý do sửa</th><th style="'+th+'">Chốt / xong</th><th style="'+th+'">Kết quả</th></tr></thead><tbody>'+rows+'</tbody></table>'
          +(dRows?'<div style="font-weight:700;margin:12px 0 4px">Việc hằng ngày (ngày làm việc tính tới '+dmy(tdy<ym+'-'+p2(nd)?tdy:ym+'-'+p2(nd))+')</div><table style="border-collapse:collapse;width:100%"><thead><tr><th style="'+th+'">Việc</th><th style="'+th+'">Đã làm</th><th style="'+th+'">Ghi chú</th></tr></thead><tbody>'+dRows+'</tbody></table>':'')
          +(pj?'<div style="font-weight:700;margin:12px 0 4px">Việc liên tục / dự án</div><table style="border-collapse:collapse;width:100%"><thead><tr><th style="'+th+'">Việc</th><th style="'+th+'">Cập nhật gần nhất</th><th style="'+th+'">Nội dung</th></tr></thead><tbody>'+pj+'</tbody></table>':'')
          +'<div style="display:flex;justify-content:space-around;margin-top:22px;page-break-inside:avoid"><div style="text-align:center">Người lập<br><br><br><br>Brian Phạm</div><div style="text-align:center">Sếp xác nhận<br><br><br><br>&nbsp;</div></div>';
        var opt={ margin:[8,10,10,10], filename:'CongViecCoDinh_'+ym+'.pdf', image:{type:'jpeg',quality:0.98},
          html2canvas:{scale:2,useCORS:true,backgroundColor:'#ffffff'}, jsPDF:{unit:'mm',format:'a4',orientation:'landscape'},
          pagebreak:{mode:['css','legacy'],avoid:['tr']} };
        window.html2pdf().set(opt).from(el).save().then(function(){ if(btn){btn.disabled=false;btn.innerHTML=old;} }, function(){ failP(); });
      }catch(e){ failP(); }
    }
    if(btn){ btn.disabled=true; btn.innerHTML='⏳ Đang tạo PDF…'; }
    if(window.html2pdf){ run(); return; }
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    s.onload=run; s.onerror=function(){ failP('Không tải được thư viện xuất PDF (kiểm tra mạng rồi thử lại).'); };
    document.head.appendChild(s);
  };

  /* ---------- trang ---------- */
  function renderCD(){
    if(!S.month) S.month=curMonth();
    var head='<div class="page-head"><div class="page-h1">Công việc cố định</div><div class="page-lead">Danh sách việc cố định theo kỳ: nhập ngày nhận, ngày làm, các lần gửi leader duyệt (Đạt / Cần sửa + lý do, đã sửa gì), ngày chốt. Web tự so với hạn và tính đúng hạn / trễ / số lần sửa. Xuất PDF để sếp check.</div></div>';
    if(!S.loaded){ load(); return head+(window.loadingBox?window.loadingBox():'Đang tải…'); }
    var ym=S.month, items=itemsFor(ym);
    var h='<div id="cvcd">';
    if(S.err) h+='<div class="banner">Không đọc được dữ liệu việc cố định ('+e_(S.err)+'). <button class="cd-btn sm" onclick="cdReload()">Thử lại</button></div>';
    h+='<div class="cd-bar"><button class="cd-btn" onclick="cdMonth(-1)">‹</button><div class="cd-mlbl">'+monthLabel(ym)+'</div><button class="cd-btn" onclick="cdMonth(1)">›</button>'
      +(ym!==curMonth()?'<button class="cd-btn" onclick="cdMonth(0)">Tháng này</button>':'')
      +'<div class="cd-seg">'+[['all','Tất cả']].concat(FREQ_ORDER.map(function(f){return [f,FREQ[f]];})).map(function(o){ return '<button class="'+(S.f===o[0]?'on':'')+'" onclick="cdFilter(\''+o[0]+'\')">'+o[1]+'</button>'; }).join('')+'</div>'
      +'<span class="cd-sp"></span><button class="cd-btn" onclick="cdSettings('+(S.settings?'false':'true')+')">⚙ Thiết lập danh sách</button><button class="cd-btn dark" id="cd-pdf" onclick="cdExportPDF()">⬇ Xuất PDF</button></div>';
    if(S.settings && S.draft) h+=settingsHtml();
    h+=kpiHtml(kpi(ym,items));
    var f=S.f;
    if(f==='all'||f==='day') h+=secDay(ym);
    if(f==='all'||f==='week') h+=secWeek(ym,items);
    if(f==='all'||f==='month') h+=secMonth(ym,items);
    if(f==='all'||f==='event') h+=secEvent(ym,items);
    if(f==='all'||f==='proj') h+=secProj(ym);
    return head+h+'</div>';
  }

  /* ---------- gắn vào menu trái: mục con ngay dưới "Công việc HR" ---------- */
  var ITEM={ id:PAGE, label:'Công việc cố định', icon:'ti-repeat', sub:true,
    lead:'Checklist việc cố định theo kỳ: ngày nhận, ngày làm, leader duyệt / sửa, xuất PDF.' };
  try{
    NAV.forEach(function(g){
      var k=g.items.map(function(it){return it.id;}).indexOf('cong-viec');
      if(k>=0 && !g.items.some(function(it){return it.id===PAGE;})){ g.items.splice(k+1,0,ITEM); MAP[PAGE]={item:ITEM, group:g}; }
    });
    if(!MAP[PAGE]){ var g0=NAV[0]; g0.items.push(ITEM); MAP[PAGE]={item:ITEM, group:g0}; }
  }catch(e){ console.warn('[cvcd] nav',e); }
  (function navCss(){
    if(document.getElementById('cvcd-nav-css')) return;
    var st=document.createElement('style'); st.id='cvcd-nav-css';
    st.textContent='#nav-'+PAGE+'{padding-left:44px;font-size:12.5px;position:relative}'
      +'#nav-'+PAGE+'::before{content:"";position:absolute;left:27px;top:0;bottom:50%;width:9px;border-left:1px solid rgba(255,255,255,.18);border-bottom:1px solid rgba(255,255,255,.18);border-bottom-left-radius:4px}'
      +'#nav-'+PAGE+' i{font-size:14px}';
    document.head.appendChild(st);
  })();
  // menu đã vẽ trước khi file này nạp → vẽ lại để hiện mục mới
  try{ if(document.querySelector('#nav .nav-item') && typeof renderNav==='function'){ renderNav(); if(window.currentTab){ var nb=document.getElementById('nav-'+window.currentTab); if(nb) nb.classList.add('active'); } } }catch(e){}
  var prevGo=window.go;
  window.go=function(id){
    prevGo.apply(this,arguments);
    if(id!==PAGE) return;
    try{ css(); var c=document.getElementById('content'); if(c) c.innerHTML=renderCD(); }catch(e){ console.warn('[cvcd]',e); }
  };
})();
