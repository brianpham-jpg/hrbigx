/* ============================================================
   BigX HR — insights-v3.js  (đánh giá chi tiết, mockup v2 đã duyệt 05/10/2026)
   - CHỈ THÊM khối mới vào cuối các tab Phân tích + 1 tab mới "Tuân thủ".
   - KHÔNG sửa hàm/logic cũ trong app.js: chỉ đọc HR.nhansu, HR.tuyendung, __ccData
     và dùng lại helper sẵn có (parseDMY, isLeft, tdFunnel, nsLates, nsWknd, nsNorm).
   - Mọi số, nhãn đánh giá và câu nhận xét tự tính lại mỗi lần mở tab.
   ============================================================ */
(function(){
'use strict';

/* ---------- 0. Đăng ký tab mới (không đụng NAV cũ, chỉ chèn thêm 1 mục) ---------- */
/* 16/10/2026: tab Tuân thủ đã gỡ (web chỉ còn tuyển dụng) */

/* ---------- 1. Bọc router: chạy go() cũ trước, rồi gắn khối mới ---------- */
var origGo=window.__ixOrigGo||window.go; window.__ixOrigGo=origGo; // nạp lại file không bị bọc 2 lần
window.go=function(id){
  origGo.apply(this,arguments);
  try{
    var content=document.getElementById('content'); if(!content) return;
    if(!HR || !HR.loaded || !(HR.tuyendung||[]).length) return; // chưa có dữ liệu thì giữ nguyên trang cũ (16/10: web chỉ còn tuyển dụng)
    var b=null;
    if(id==='pt-tuyen-dung') b=blockRecruit();
    if(!b) return;
    injectCss();
    var wrap=document.createElement('div'); wrap.className='ix'; wrap.innerHTML=b.html; content.appendChild(wrap);
    setTimeout(function(){ try{ b.draw&&b.draw(); }catch(e){ console.warn('[ix] draw',e); } },40);
  }catch(e){ console.warn('[ix]',e); }
};

/* ---------- 2. Tiện ích ---------- */
var C={s1:'#9377E6',s2:'#CF7F3F',s3:'#6A80DB',s4:'#2FB59E',s5:'#6B7488',light:'#3A4560',ink:'#E8ECF3',mut:'#A7B0C2',grid:'#263045',er:'#E36B6B',wa:'#E0A84A',ok:'#4FBF8F',in:'#8FA0F0'};
var F='"Be Vietnam Pro",system-ui,sans-serif';
function E(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function vn(x,d){ if(x==null||isNaN(x)) return '—'; var v=(d==null?Math.round(x*10)/10:Number(x).toFixed(d)); return String(v).replace('.',','); }
function pc(a,b){ return b?a/b*100:null; }
// m: 0-11
function nghi(e){ return parseDMY(e.ngayNghi); }
/* đang làm tại thời điểm t; người nghỉ chưa ghi ngày nghỉ → không xác định được → bỏ ra (giống bdTurnover) */

var CHIP={ok:['c-ok','Tốt'],wa:['c-wa','Cảnh báo'],er:['c-er','Nghiêm trọng'],in:['c-in','Lưu ý']};
function evalBox(items,rule){
  if(!items.length) items=[['in','Chưa đủ dữ liệu để đánh giá.']];
  var ord={er:0,wa:1,ok:2,in:3}; items.sort(function(a,b){return ord[a[0]]-ord[b[0]];});
  return '<div class="ix-eval"><h4>ĐÁNH GIÁ TỰ ĐỘNG</h4>'+items.map(function(x){ return '<div class="ix-ev"><span class="ix-chip '+CHIP[x[0]][0]+'">'+CHIP[x[0]][1]+'</span><div>'+x[1]+'</div></div>'; }).join('')+
    (rule?'<div class="ix-rule">Cách đánh giá: '+rule+'</div>':'')+'</div>';
}
function kpi(v,l,d,tone){ return '<div class="ix-kpi"><div class="v">'+v+'</div><div class="l">'+l+'</div>'+(d?'<div class="d" style="color:'+({ok:C.ok,wa:C.wa,er:C.er}[tone]||C.mut)+'">'+d+'</div>':'')+'</div>'; }
function card(id,title,sub,h){ return '<div class="ix-card"><div class="ct">'+title+'</div><div class="cs">'+sub+'</div>'+(id?'<div id="'+id+'" class="ix-chart'+(h?' '+h:'')+'"></div>':'')+'</div>'; }
function block(title,tab,q,inner){ return '<div class="ix-block"><div class="ix-bh"><h2>'+title+'</h2><span class="ix-tab">'+tab+'</span></div><div class="ix-q">'+q+'</div>'+inner+'</div>'; }

var tip={trigger:'axis',backgroundColor:'#0B0F17',borderWidth:0,padding:[8,12],extraCssText:'border-radius:9px',textStyle:{color:'#D5DAE3',fontFamily:F,fontSize:12}};
var ax={axisLine:{show:false},axisTick:{show:false},axisLabel:{color:C.mut,fontSize:11,fontFamily:F}};
var vg={splitLine:{lineStyle:{color:C.grid,type:[3,4]}}};
function A(){ var o={}; for(var i=0;i<arguments.length;i++){ var s=arguments[i]; for(var k in s) o[k]=s[k]; } return o; }
function mk(id,opt){ var el=document.getElementById(id); if(!el||!window.echarts) return; var old=echarts.getInstanceByDom(el); if(old) old.dispose();
  var ch=echarts.init(el,null,{renderer:'svg'}); ch.setOption(A({textStyle:{fontFamily:F},animation:false},opt));
  (window.__ixCharts=window.__ixCharts||[]).push(ch); }
if(!window.__ixResize){ window.__ixResize=true; window.addEventListener('resize',function(){ (window.__ixCharts||[]).forEach(function(c){ try{ if(!c.isDisposed()) c.resize(); }catch(e){} }); }); }
function hbar(id,cats,series,o){ o=o||{}; mk(id,{grid:{left:o.left||100,right:o.right||52,top:series.length>1?28:8,bottom:6},
  legend:series.length>1?{top:0,left:0,itemWidth:10,itemHeight:10,textStyle:{color:C.mut,fontSize:11}}:undefined,
  tooltip:A(tip,{axisPointer:{type:'shadow'}}), xAxis:A({type:'value'},ax,vg,{axisLabel:{show:false}}),
  yAxis:A({type:'category',data:cats.slice().reverse()},ax,{axisLabel:{color:C.ink,fontSize:11.5}}),
  series:series.map(function(s,k){ return {name:s.name,type:'bar',stack:'x',barWidth:13,data:s.data.slice().reverse(),itemStyle:{color:s.color},
    label:(k===series.length-1&&o.label)?{show:true,position:'right',color:C.ink,fontSize:11,fontWeight:600,formatter:function(p){return o.label(cats.length-1-p.dataIndex);}}:undefined}; })}); }

/* =====================================================================
   KHỐI 1 — Quy mô & tăng trưởng (tab Chỉ số & xu hướng)
   ===================================================================== */

/* =====================================================================
   KHỐI 2 — Chất lượng phễu theo vị trí (tab Hiệu quả tuyển dụng)
   ===================================================================== */
function blockRecruit(){
  var T=HR.tuyendung||[]; if(!T.length) return null;
  var STEPS=['CV','HR duyệt','LM duyệt','Qua V1','Qua V2','Trúng tuyển'], SN=['nộp CV','HR duyệt','Line Manager duyệt','qua vòng 1','qua vòng 2','trúng tuyển'];
  var g={}; T.forEach(function(r){ var k=(String(r.viTri||'').trim())||'(trống)'; (g[k]=g[k]||[]).push(r); });
  var pos=Object.keys(g).map(function(k){ var l=g[k], f=tdFunnel(l).map(function(x){return x.n;});
    var off=l.filter(function(r){return r.final==='TRÚNG TUYỂN'||r.final==='TỪ CHỐI OFFER';}).length, hire=l.filter(function(r){return r.final==='TRÚNG TUYỂN';}).length;
    return {k:k,f:f,off:off,hire:hire,pend:l.filter(function(r){return !String(r.final||'').trim();}).length}; }).sort(function(a,b){return b.f[0]-a.f[0];});
  var tot=tdFunnel(T).map(function(x){return x.n;});
  var hired=T.filter(function(r){return r.final==='TRÚNG TUYỂN';}).length, dec=T.filter(function(r){return r.final==='TỪ CHỐI OFFER';});
  var offers=hired+dec.length, decOdd=dec.filter(function(r){return String(r.r2||'').trim()!=='PASS';}).length;
  var acc=pc(hired,offers), acc2=pc(hired,offers-decOdd);
  var pend=T.filter(function(r){return !String(r.final||'').trim();}).length;
  var pendTop=pos.slice().sort(function(a,b){return b.pend-a.pend;})[0];
  // bất thường dữ liệu
  var anom=[];
  pos.forEach(function(p){ var f=p.f;
    for(var i=2;i<f.length;i++){ var r=f[i-1]?f[i]/f[i-1]:null, rp=f[i-2]?f[i-1]/f[i-2]:null;
      if(r!=null&&rp!=null&&f[i]>0&&f[i-1]>=10&&rp>0.8&&r<0.05){ anom.push({p:p,i:i,type:'jump'}); return; } }
    if(f[3]>=5&&f[4]===0) anom.push({p:p,i:4,type:'zero'}); });
  var rows=pos.filter(function(p){return p.f[0]>=5;});
  var offPos=pos.filter(function(p){return p.off>0;}).sort(function(a,b){return b.off-a.off||b.hire-a.hire;});
  var cph=pos.filter(function(p){return p.hire>0;}).map(function(p){return {k:p.k,v:p.f[0]/p.hire};}).sort(function(a,b){return a.v-b.v;});

  var ev=[];
  anom.forEach(function(a){ var p=a.p, f=p.f;
    if(a.type==='jump') ev.push(['er','<b>'+E(p.k)+':</b> '+f[a.i-1]+'/'+f[a.i-2]+' người '+SN[a.i-1]+' nhưng chỉ <b>'+f[a.i]+' người '+SN[a.i]+' ('+vn(pc(f[a.i],f[a.i-1]))+'%)</b>. Gần như chắc chắn là lỗi nhập liệu (đánh Pass hàng loạt), cần kiểm tra lại trước khi đọc phễu.']);
    else ev.push(['er','<b>'+E(p.k)+':</b> '+f[3]+' người qua vòng 1, <b>0 người qua vòng 2</b>. Nếu dữ liệu đúng thì tiêu chí vòng 2 đang quá chặt hoặc lệch so với vòng 1.']); });
  var lowAcc=offPos.filter(function(p){return p.off>=4&&p.hire/p.off<0.5;});
  if(lowAcc.length) ev.push(['wa',lowAcc.map(function(p){return '<b>'+E(p.k)+'</b> chỉ nhận '+p.hire+'/'+p.off+' offer';}).join(', ')+'. Nên xem lại mức offer hoặc tốc độ ra quyết định ở các vị trí này.']);
  if(decOdd) ev.push(['wa','Nhận offer chung <b>'+vn(acc)+'%</b> ('+hired+'/'+offers+'). Có <b>'+decOdd+'/'+dec.length+' người "Từ chối offer"</b> nhưng vòng 2 ghi Fail / Không tham gia. Nếu đây là bỏ ngang trước khi được offer thì tỷ lệ nhận thật là <b>'+vn(acc2)+'%</b>.']);
  else if(acc!=null) ev.push([acc<50?'wa':'ok','Nhận offer chung <b>'+vn(acc)+'%</b> ('+hired+'/'+offers+').']);
  if(cph.length) ev.push(['ok',cph.slice(0,3).map(function(x){return '<b>'+E(x.k)+'</b> ('+vn(x.v)+' CV)';}).join(', ')+' tuyển được 1 người với ít CV nhất. Trung bình toàn công ty: '+(hired?vn(T.length/hired):'—')+' CV / 1 người.']);
  if(pendTop&&pendTop.pend>=10) ev.push(['in','<b>'+E(pendTop.k)+'</b> còn <b>'+pendTop.pend+' CV chưa có kết quả</b>, có thể làm tỷ lệ đậu của vị trí này thấp hơn thực tế.']);

  var html=block('Chất lượng phễu tuyển dụng theo vị trí','Đánh giá chi tiết','Mỗi vị trí rơi ứng viên ở bước nào? Offer có được nhận không?',
    '<div class="ix-kpis">'+kpi(vn(pc(hired,T.length))+'%','CV → trúng tuyển · '+hired+'/'+T.length,hired?'cần ~'+Math.round(T.length/hired)+' CV cho 1 người':'')+
      kpi(vn(acc)+'%','nhận offer · '+hired+'/'+offers,decOdd?'hoặc '+vn(acc2)+'% nếu bỏ '+decOdd+' ca nghi nhập sai':'',acc!=null&&acc<50?'wa':'ok')+
      kpi(pend,'CV chưa có kết quả',pendTop&&pendTop.pend?pendTop.pend+' thuộc '+E(pendTop.k):'',pend?'wa':'')+
      kpi(anom.length,'vị trí có dữ liệu bất thường',anom.map(function(a){return E(a.p.k);}).join(', ')||'không có',anom.length?'er':'ok')+'</div>'+
    '<div class="ix-card"><div class="ct">Tỷ lệ qua từng bước, theo vị trí</div><div class="cs">Số ứng viên ở mỗi bước và % so với bước trước · cùng cách đếm với phễu phía trên · ô đỏ là bước rơi nhiều nhất của vị trí đó · vị trí từ 5 CV</div><div class="ix-scroll"><table class="ix-t" id="ix-b1"></table></div></div>'+
    '<div class="ix-g2 ix-mt">'+card('ix-b2','Nhận offer theo vị trí','Nhận / tổng được offer')+card('ix-b3','Số CV cần để tuyển được 1 người','Vị trí đã tuyển được ít nhất 1 người · càng thấp càng hiệu quả')+'</div>'+
    evalBox(ev,'một bước có tỷ lệ qua dưới 5% trong khi bước trước trên 80% (từ 10 người) → nghi lỗi dữ liệu (Nghiêm trọng); từ 5 người qua V1 mà 0 qua V2 → Nghiêm trọng; nhận offer dưới 50% (từ 4 offer) → Cảnh báo; 3 vị trí cần ít CV nhất → Tốt.'));
  return {html:html, draw:function(){
    var h='<tr><th class="l">Vị trí</th>'+STEPS.map(function(s){return '<th>'+s+'</th>';}).join('')+'</tr>';
    rows.concat([{k:'Toàn công ty',f:tot,total:true}]).forEach(function(p){ var v=p.f, worst=-1, wv=2;
      for(var i=1;i<v.length;i++){ if(v[i-1]>=3){ var r=v[i]/v[i-1]; if(r<wv){wv=r;worst=i;} } }
      h+='<tr'+(p.total?' class="tot"':'')+'><td class="l">'+E(p.k)+'</td>'+v.map(function(x,i){ if(!i) return '<td style="background:#1C2436"><b>'+x+'</b></td>';
        var r=v[i-1]?x/v[i-1]:null, bg=i===worst?'rgba(227,107,107,.16)':(r==null?'#1C2436':(r>=0.5?'rgba(47,181,158,.16)':'#1C2436'));
        return '<td style="background:'+bg+(i===worst?';color:'+C.er:'')+'"><b>'+x+'</b><small>'+(r==null?'—':vn(r*100)+'%')+'</small></td>'; }).join('')+'</tr>'; });
    var t=document.getElementById('ix-b1'); if(t) t.innerHTML=h;
    hbar('ix-b2',offPos.map(function(p){return p.k;}),[{name:'Nhận offer',data:offPos.map(function(p){return p.hire;}),color:C.s1},{name:'Từ chối',data:offPos.map(function(p){return p.off-p.hire;}),color:C.s2}],
      {left:140,right:90,label:function(i){var p=offPos[i]; return p.hire+'/'+p.off+' · '+Math.round(p.hire/p.off*100)+'%';}});
    mk('ix-b3',{grid:{left:140,right:44,top:8,bottom:6},tooltip:A(tip,{axisPointer:{type:'shadow'},valueFormatter:function(v){return vn(v)+' CV / 1 người';}}),
      xAxis:A({type:'value'},ax,vg,{axisLabel:{show:false}}),yAxis:A({type:'category',data:cph.map(function(x){return x.k;}).reverse()},ax,{axisLabel:{color:C.ink,fontSize:11.5}}),
      series:[{type:'bar',barWidth:13,data:cph.map(function(x,i){return {value:Math.round(x.v*10)/10,itemStyle:{color:i<3?C.s4:(i>=cph.length-2&&cph.length>4?C.s2:C.s5),borderRadius:[0,4,4,0]}};}).reverse(),
        label:{show:true,position:'right',color:C.ink,fontSize:11,fontWeight:600,formatter:function(p){return vn(p.value);}}}]});
  }};
}

/* =====================================================================
   KHỐI 3 — Thử việc & giữ chân (tab Biến động nhân sự)
   Kết quả thử việc dựa "số bản HĐ đã ký": ≥2 = đã ký HĐLĐ (qua TV); 1 = chỉ HĐ thử việc.
   ===================================================================== */

/* =====================================================================
   KHỐI 4 — Kỷ luật giờ giấc (tab Chấm công & năng suất)
   Cùng định nghĩa đi trễ với tab hiện tại: nsLates (T-S/T-C/T-C2 ≥3'), bỏ T7/CN, bỏ ngày "ĐÃ NGHỈ".
   ===================================================================== */

/* =====================================================================
   KHỐI 5 — Tuân thủ: hợp đồng, hồ sơ, review lương (tab mới)
   Review lương = ngày ký HĐLĐ 6 tháng (ngày vào + 2 tháng) + 12 tháng, cho người đã ký (số bản ≥ 2).
   ===================================================================== */

/* ---------- CSS (scoped .ix) ---------- */
function injectCss(){
  if(document.getElementById('ix-css')) return;
  var s=document.createElement('style'); s.id='ix-css'; s.textContent=
  '.ix{font-family:"Be Vietnam Pro",system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#D2D8E3;max-width:1180px}'+
  '.ix-block{background:#1C2436;border:1px solid #263045;border-radius:14px;padding:18px 20px 16px;margin:26px 0 8px}'+
  '.ix-bh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.ix-bh h2{font-size:17px;color:#E8ECF3;margin:0;font-weight:600}'+
  '.ix-tab{font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:rgba(106,128,219,.16);color:#8FA0F0}'+
  '.ix-q{font-size:12.5px;color:#A7B0C2;margin:4px 0 12px}'+
  '.ix-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}'+
  '.ix-kpi{border:1px solid #263045;border-radius:10px;padding:10px 12px}.ix-kpi .v{font-size:22px;font-weight:700;color:#E8ECF3;line-height:1.15}'+
  '.ix-kpi .l{font-size:11.5px;color:#A7B0C2;margin-top:2px}.ix-kpi .d{font-size:11.5px;font-weight:600;margin-top:4px}'+
  '.ix-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ix-g3{display:grid;grid-template-columns:1.3fr 1fr;gap:14px}.ix-mt{margin-top:14px}'+
  '.ix-card{border:1px solid #263045;border-radius:12px;padding:12px 14px 8px;min-width:0;background:#1C2436}'+
  '.ix-card .ct{font-size:13.8px;font-weight:600;color:#E8ECF3}.ix-card .cs{font-size:11.5px;color:#A7B0C2;margin:2px 0 6px}'+
  '.ix-chart{width:100%;height:260px}.ix-chart.sm{height:210px}.ix-chart.tall{height:300px}'+
  '.ix-eval{margin-top:14px;border-top:1px dashed #263045;padding-top:12px}.ix-eval h4{font-size:12px;letter-spacing:.06em;color:#A7B0C2;margin:0 0 8px;font-weight:600}'+
  '.ix-ev{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.55;margin:6px 0}.ix-ev b{color:#E8ECF3}'+
  '.ix-chip{flex:none;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;margin-top:1px;white-space:nowrap}'+
  '.c-ok{background:rgba(47,181,158,.14);color:#4FBF8F}.c-wa{background:rgba(224,168,74,.14);color:#E0A84A}.c-er{background:rgba(227,107,107,.14);color:#E36B6B}.c-in{background:rgba(106,128,219,.16);color:#8FA0F0}'+
  '.ix-rule{font-size:11.3px;color:#A7B0C2;margin-top:8px;font-style:italic}.ix-foot{font-size:11.8px;color:#A7B0C2;margin-top:10px;line-height:1.5}'+
  '.ix-scroll{overflow-x:auto}table.ix-t{width:100%;border-collapse:separate;border-spacing:2px;font-size:12px}'+
  'table.ix-t th{font-weight:600;color:#A7B0C2;font-size:10.8px;padding:4px;text-align:center;white-space:nowrap;background:none;border:0}'+
  'table.ix-t th.l,table.ix-t td.l{text-align:left;color:#E8ECF3;font-weight:500;white-space:nowrap}'+
  'table.ix-t td{text-align:center;padding:6px 4px;border-radius:5px;color:#E8ECF3;border:0}table.ix-t td small{display:block;font-size:10px;color:#A7B0C2}table.ix-t tr.tot td{font-weight:700}'+
  'table.ix-ls{width:100%;border-collapse:collapse;font-size:12.3px;margin-top:6px;border:0;background:none}'+
  'table.ix-ls th{text-align:left;color:#A7B0C2;font-weight:600;font-size:11px;padding:5px 6px;border-bottom:1px solid #263045;background:none}'+
  'table.ix-ls td{padding:5px 6px;border-bottom:1px solid #263045;color:#E8ECF3}'+
  '.ix-pill{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600}.p-er{background:rgba(227,107,107,.14);color:#E36B6B}.p-wa{background:rgba(224,168,74,.14);color:#E0A84A}.p-in{background:rgba(106,128,219,.16);color:#8FA0F0}'+
  '@media(max-width:900px){.ix-kpis{grid-template-columns:repeat(2,1fr)}.ix-g2,.ix-g3{grid-template-columns:1fr}}';
  document.head.appendChild(s);
}
})();
