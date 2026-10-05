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
var NEW_TAB={ id:'pt-tuan-thu', label:'Tuân thủ HĐ & hồ sơ', icon:'ti-shield-check', badge:'new',
  lead:'Hợp đồng quá hạn, mức độ đủ hồ sơ, lịch review lương — việc hành chính cần xử lý trước.', points:[] };
try{
  var grp=NAV.filter(function(g){return g.group==='Phân tích';})[0];
  if(grp && !grp.items.some(function(it){return it.id===NEW_TAB.id;})){
    var at=grp.items.map(function(it){return it.id;}).indexOf('pt-nang-suat');
    grp.items.splice(at>=0?at+1:grp.items.length,0,NEW_TAB);
    MAP[NEW_TAB.id]={item:NEW_TAB, group:grp};
  }
}catch(e){ console.warn('[ix] nav',e); }

/* ---------- 1. Bọc router: chạy go() cũ trước, rồi gắn khối mới ---------- */
var origGo=window.__ixOrigGo||window.go; window.__ixOrigGo=origGo; // nạp lại file không bị bọc 2 lần
window.go=function(id){
  origGo.apply(this,arguments);
  try{
    var content=document.getElementById('content'); if(!content) return;
    if(!HR || !HR.loaded || !(HR.nhansu||[]).length) return; // chưa có dữ liệu thì giữ nguyên trang cũ
    var b=null;
    if(id==='pt-chi-so') b=blockGrowth();
    else if(id==='pt-tuyen-dung') b=blockRecruit();
    else if(id==='pt-bien-dong') b=blockProbation();
    else if(id==='pt-nang-suat') b=blockLate();
    else if(id==='pt-tuan-thu'){ content.innerHTML=pageHead(NEW_TAB.label,NEW_TAB.lead); b=blockCompliance(); }
    if(!b) return;
    injectCss();
    var wrap=document.createElement('div'); wrap.className='ix'; wrap.innerHTML=b.html; content.appendChild(wrap);
    setTimeout(function(){ try{ b.draw&&b.draw(); }catch(e){ console.warn('[ix] draw',e); } },40);
  }catch(e){ console.warn('[ix]',e); }
};

/* ---------- 2. Tiện ích ---------- */
var C={s1:'#7B4FD6',s2:'#D0782A',s3:'#4A64C9',s4:'#2F9E8F',s5:'#9AA4B8',light:'#C9CED9',ink:'#1C2436',mut:'#6B7280',grid:'#EEF0F5',er:'#A42F2F',wa:'#9A6417',ok:'#177A53',in:'#3548A8'};
var F='"Be Vietnam Pro",system-ui,sans-serif';
function E(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function vn(x,d){ if(x==null||isNaN(x)) return '—'; var v=(d==null?Math.round(x*10)/10:Number(x).toFixed(d)); return String(v).replace('.',','); }
function pc(a,b){ return b?a/b*100:null; }
function today(){ var t=new Date(); t.setHours(23,59,59,0); return t; }
function eom(y,m){ return new Date(y,m+1,0,23,59,59); } // m: 0-11
function edate(d,n){ var y=d.getFullYear(), m=d.getMonth()+n, last=new Date(y,m+1,0).getDate(); return new Date(y,m,Math.min(d.getDate(),last)); }
function mlab(d){ return String(d.getMonth()+1).padStart(2,'0')+'/'+String(d.getFullYear()).slice(2); }
function days(a,b){ return Math.round((b-a)/864e5); }
function median(a){ if(!a.length) return null; var s=a.slice().sort(function(x,y){return x-y;}), h=Math.floor(s.length/2); return s.length%2?s[h]:(s[h-1]+s[h])/2; }
function short(n){ var p=String(n||'').trim().split(/\s+/); return p.length>2?p.slice(-2).join(' '):p.join(' '); }
function dept(e){ return (String(e.phong||'').trim())||'(trống)'; }
function vao(e){ return parseDMY(e.ngayVao); }
function nghi(e){ return parseDMY(e.ngayNghi); }
/* đang làm tại thời điểm t; người nghỉ chưa ghi ngày nghỉ → không xác định được → bỏ ra (giống bdTurnover) */
function onAt(e,t){ var a=vao(e); if(!a||a>t) return false; if(!isLeft(e)) return true; var b=nghi(e); return !!b && b>t; }
function pageHead(t,l){ return '<div class="page-head"><div class="page-h1">'+E(t)+'</div><div class="page-lead">'+E(l)+'</div></div>'; }

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

var tip={trigger:'axis',backgroundColor:'#1C2436',borderWidth:0,padding:[8,12],extraCssText:'border-radius:9px',textStyle:{color:'#D5DAE3',fontFamily:F,fontSize:12}};
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
function vbar(id,cats,vals,cols,unit){ mk(id,{grid:{left:8,right:8,top:22,bottom:24},tooltip:A(tip,{axisPointer:{type:'shadow'},valueFormatter:function(v){return v+(unit||'');}}),
  xAxis:A({type:'category',data:cats},ax,{axisLabel:{color:C.ink,fontSize:11.5}}),yAxis:{type:'value',show:false},
  series:[{type:'bar',barWidth:42,data:vals.map(function(v,i){return {value:v,itemStyle:{color:cols[i],borderRadius:[4,4,0,0]}};}),label:{show:true,position:'top',color:C.ink,fontWeight:700,fontSize:12}}]}); }

/* =====================================================================
   KHỐI 1 — Quy mô & tăng trưởng (tab Chỉ số & xu hướng)
   ===================================================================== */
function blockGrowth(){
  var ns=HR.nhansu, T=today();
  var first=null; ns.forEach(function(e){ var a=vao(e); if(a&&(!first||a<first)) first=a; }); if(!first) return null;
  var pts=[]; for(var y=first.getFullYear(),m=first.getMonth(); y*12+m<=T.getFullYear()*12+T.getMonth(); m++){ if(m>11){m=0;y++;} var t=eom(y,m); if(t>T) t=T; pts.push(t); }
  var hc=pts.map(function(t){ return ns.filter(function(e){return onAt(e,t);}).length; });
  var L=pts.length-1, cur=hc[L], i12=Math.max(0,L-12), prev=hc[i12];
  var grow=cur-prev, growP=prev?grow/prev*100:null;
  var net3=L>=4?hc[L-1]-hc[L-4]:null, prev3=L>=7?hc[L-4]-hc[L-7]:null;
  var lab3=L>=4?(mlab(pts[L-3]).slice(0,2).replace(/^0/,'')+'–'+mlab(pts[L-1]).replace(/^0/,'')):'';
  // vào / nghỉ 13 tháng gần nhất
  var m13=pts.slice(Math.max(0,L-12));
  function inMonth(d,t){ return d && d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth(); }
  var vin=m13.map(function(t){ return ns.filter(function(e){return inMonth(vao(e),t);}).length; });
  var vout=m13.map(function(t){ return ns.filter(function(e){return isLeft(e)&&inMonth(nghi(e),t);}).length; });
  var in3=L>=3?vin.slice(-4,-1).reduce(function(a,b){return a+b;},0):0, out3=L>=3?vout.slice(-4,-1).reduce(function(a,b){return a+b;},0):0;
  // theo phòng: 12 tháng trước → nay
  var depts={}; ns.forEach(function(e){ depts[dept(e)]=1; });
  var dl=Object.keys(depts).map(function(d){ var g=ns.filter(function(e){return dept(e)===d;});
    return {d:d,a:g.filter(function(e){return onAt(e,pts[i12]);}).length,b:g.filter(function(e){return onAt(e,T);}).length,left:g.filter(isLeft).length}; })
    .filter(function(x){return x.a||x.b;}).sort(function(p,q){ return (q.b-q.a)-(p.b-p.a) || q.b-p.b; });
  var declines=[]; for(var k=Math.max(1,i12+1);k<=L;k++){ if(hc[k]<hc[k-1]) declines.push(mlab(pts[k])+' ('+(hc[k]-hc[k-1])+')'); }

  var ev=[];
  if(grow>0){ var up=dl.filter(function(x){return x.b>x.a;}).slice(0,2), upN=up.reduce(function(s,x){return s+x.b-x.a;},0);
    ev.push(['ok','Quy mô tăng <b>'+prev+' → '+cur+' người'+(growP!=null?' (+'+vn(growP,0)+'%)':'')+'</b> trong 12 tháng.'+(up.length?' Tăng chủ yếu từ '+up.map(function(x){return '<b>'+E(x.d)+' (+'+(x.b-x.a)+')</b>';}).join(' và ')+', chiếm '+upN+'/'+grow+' người tăng thêm.':'')]); }
  else ev.push(['wa','Quy mô không tăng trong 12 tháng (<b>'+prev+' → '+cur+'</b>).']);
  if(net3!=null&&prev3!=null){
    if(prev3>0 && net3<=prev3/2) ev.push(['wa','T'+lab3+' chỉ tăng ròng <b>'+(net3>=0?'+':'')+net3+'</b> (vào '+in3+', nghỉ '+out3+'), '+(net3<=0?'không tăng so với':'chỉ bằng '+vn(net3/prev3*100,0)+'%')+' 3 tháng trước đó (+'+prev3+').'+(declines.length?' Quy mô giảm ở: '+declines.join(', ')+'.':'')]);
    else ev.push(['ok','T'+lab3+' tăng ròng <b>'+(net3>=0?'+':'')+net3+'</b> (3 tháng trước đó: '+(prev3>=0?'+':'')+prev3+'), giữ được nhịp tăng.'+(declines.length?' Lưu ý quy mô giảm ở: '+declines.join(', ')+'.':'')]);
  }
  var mostLeft=dl.slice().sort(function(p,q){return q.left-p.left;})[0];
  if(mostLeft&&mostLeft.left>=3) ev.push(['in','<b>'+E(mostLeft.d)+'</b> có '+mostLeft.left+' người nghỉ (nhiều nhất công ty), quy mô 12 tháng chỉ '+mostLeft.a+' → '+mostLeft.b+'. Xem khối "Thử việc & giữ chân" ở tab Biến động nhân sự.']);
  var undated=ns.filter(function(e){return isLeft(e)&&!nghi(e);}).length;
  if(undated) ev.push(['in',undated+' người nghỉ chưa ghi ngày nghỉ nên không tính vào biểu đồ theo tháng.']);

  var html=block('Quy mô &amp; tăng trưởng','Đánh giá chi tiết','Công ty đang lớn lên hay đi ngang? Phòng nào kéo tăng trưởng?',
    '<div class="ix-kpis">'+
      kpi(cur,'người đang làm',(grow>=0?'▲ +':'▼ ')+grow+' so với 12 tháng trước ('+prev+')',grow>0?'ok':'wa')+
      kpi((growP==null?'—':(growP>=0?'+':'')+vn(growP,0)+'%'),'tăng trưởng 12 tháng',mlab(pts[i12])+' → '+mlab(T))+
      kpi((grow>=0?'+':'')+vn(grow/12,1),'người ròng / tháng (TB 12 tháng)',(grow>=0?'+':'')+grow+' người trong 12 tháng')+
      kpi(net3==null?'—':(net3>=0?'+':'')+net3,'ròng T'+lab3,prev3==null?'':'3 tháng trước đó: '+(prev3>=0?'+':'')+prev3,(prev3>0&&net3<=prev3/2)?'wa':'ok')+
    '</div><div class="ix-g3">'+card('ix-a1','Số người đang làm cuối mỗi tháng','Theo ngày vào / ngày nghỉ trong Hồ sơ')+
      card('ix-a2','Thay đổi theo phòng ban (12 tháng)','Số người '+mlab(pts[i12])+' → '+mlab(T))+'</div>'+
    '<div class="ix-mt">'+card('ix-a3','Người vào &amp; người nghỉ theo tháng','13 tháng gần nhất · chỉ tính người nghỉ có ghi ngày nghỉ','sm')+'</div>'+
    evalBox(ev,'tăng ròng 3 tháng gần nhất chỉ bằng một nửa 3 tháng trước đó hoặc thấp hơn → Cảnh báo; có tháng quy mô giảm → ghi rõ tháng; phòng có từ 3 người nghỉ trở lên và nhiều nhất công ty → Lưu ý.'));
  return {html:html, draw:function(){
    var labs=pts.map(mlab);
    mk('ix-a1',{grid:{left:32,right:24,top:22,bottom:26},tooltip:A(tip,{valueFormatter:function(v){return v+' người';}}),
      xAxis:A({type:'category',data:labs,boundaryGap:false},ax),yAxis:A({type:'value',minInterval:1},ax,vg),
      series:[{type:'line',data:hc,showSymbol:false,symbolSize:8,lineStyle:{width:2.2,color:C.s1},itemStyle:{color:C.s1,borderColor:'#fff',borderWidth:2},
        areaStyle:{color:new echarts.graphic.LinearGradient(0,0,0,1,[{offset:0,color:'rgba(123,79,214,.2)'},{offset:1,color:'rgba(123,79,214,0)'}])},
        markPoint:{symbol:'circle',symbolSize:9,itemStyle:{color:C.s1,borderColor:'#fff',borderWidth:2},label:{show:true,position:'top',color:C.ink,fontWeight:700},
          data:[{coord:[labs[L],cur],value:cur}].concat(i12<L?[{coord:[labs[i12],prev],value:prev}]:[])}}]});
    hbar('ix-a2',dl.map(function(x){return x.d;}),[{name:mlab(pts[i12]),data:dl.map(function(x){return Math.min(x.a,x.b);}),color:C.light},
      {name:'Tăng thêm',data:dl.map(function(x){return Math.max(0,x.b-x.a);}),color:C.s1}],
      {left:110,right:86,label:function(i){var x=dl[i]; return x.a+' → '+x.b+(x.b!==x.a?'  ('+(x.b>x.a?'+':'')+(x.b-x.a)+')':'');}});
    mk('ix-a3',{grid:{left:28,right:12,top:26,bottom:24},legend:{top:0,right:0,itemWidth:10,itemHeight:10,textStyle:{color:C.mut,fontSize:11}},tooltip:A(tip,{axisPointer:{type:'shadow'}}),
      xAxis:A({type:'category',data:m13.map(mlab)},ax),yAxis:A({type:'value',minInterval:1},ax,vg),
      series:[{name:'Vào',type:'bar',data:vin,barWidth:12,barGap:'20%',itemStyle:{color:C.s1,borderRadius:[4,4,0,0]}},{name:'Nghỉ',type:'bar',data:vout,barWidth:12,itemStyle:{color:C.s2,borderRadius:[4,4,0,0]}}]});
  }};
}

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
      h+='<tr'+(p.total?' class="tot"':'')+'><td class="l">'+E(p.k)+'</td>'+v.map(function(x,i){ if(!i) return '<td style="background:#F4F5F9"><b>'+x+'</b></td>';
        var r=v[i-1]?x/v[i-1]:null, bg=i===worst?'#FDECEC':(r==null?'#F4F5F9':(r>=0.5?'#E3F4EE':'#FFFFFF'));
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
function probStatus(e,T){ var a=vao(e); if(!a) return null; var s=+e.soBanKy||0;
  if(s>=2) return 'qua'; if(isLeft(e)) return 'khong'; if(s===0) return null; return edate(a,2)<=T?'trehan':'dang'; }
function blockProbation(){
  var ns=HR.nhansu, T=today();
  var st=ns.map(function(e){return {e:e,s:probStatus(e,T)};}).filter(function(x){return x.s;});
  var cnt=function(arr,s){return arr.filter(function(x){return x.s===s;}).length;};
  var qua=cnt(st,'qua'), khong=cnt(st,'khong'), rate=pc(qua,qua+khong);
  var dmap={}; st.forEach(function(x){ var d=dept(x.e); (dmap[d]=dmap[d]||[]).push(x); });
  var dl=Object.keys(dmap).map(function(d){ var a=dmap[d]; return {d:d,q:cnt(a,'qua'),k:cnt(a,'khong'),l:cnt(a,'trehan'),p:cnt(a,'dang')}; })
    .sort(function(a,b){ return (b.q+b.k+b.l+b.p)-(a.q+a.k+a.l+a.p) || a.d.localeCompare(b.d); });
  var failDays=st.filter(function(x){return x.s==='khong'&&nghi(x.e);}).map(function(x){return days(vao(x.e),nghi(x.e));}).filter(function(v){return v>=0;});
  var med=median(failDays);
  var late=st.filter(function(x){return x.s==='trehan';});
  // tỷ lệ còn làm theo tháng kể từ ngày vào: người vào trong 13 tháng gần nhất, bỏ người nghỉ chưa có ngày
  var start=new Date(T.getFullYear(),T.getMonth()-12,1);
  var coh=ns.filter(function(e){ var a=vao(e); return a&&a>=start&&!(isLeft(e)&&!nghi(e)); });
  var surv=[]; for(var m=0;m<=12;m++){ var el=0,stay=0; coh.forEach(function(e){ var t=edate(vao(e),m); if(t>T) return; el++; if(!isLeft(e)||nghi(e)>t) stay++; }); if(el<10) break; surv.push({m:m,el:el,st:stay,r:stay/el*100}); }
  var s2=surv[2], s6=surv[6];
  // theo quý vào làm (4 quý gần nhất có người vào)
  var qmap={}; st.forEach(function(x){ var a=vao(x.e), k=a.getFullYear()*10+Math.floor(a.getMonth()/3)+1; (qmap[k]=qmap[k]||[]).push(x); });
  var qs=Object.keys(qmap).map(Number).sort().slice(-4).map(function(k){ var a=qmap[k]; return {k:'Q'+(k%10)+'/'+Math.floor(k/10),q:cnt(a,'qua'),k2:cnt(a,'khong'),open:cnt(a,'dang')+cnt(a,'trehan')}; });

  var ev=[];
  var dEl=dl.filter(function(x){return x.q+x.k>=5;}), dMin=dEl.length?Math.min.apply(null,dEl.map(function(x){return x.q/(x.q+x.k);})):null;
  dl.forEach(function(x){ var d=x.q+x.k; if(d>=5){ var r=x.q/d*100; if(r<50) ev.push(['er','<b>'+E(x.d)+' chỉ '+x.q+'/'+d+' qua thử việc ('+vn(r,0)+'%)</b>'+(x.q/d===dMin?', thấp nhất công ty':'')+'. Người mới rơi rụng nhiều nên quy mô phòng khó tăng.']); else if(r<75) ev.push(['wa','<b>'+E(x.d)+'</b>: '+x.q+'/'+d+' qua thử việc ('+vn(r,0)+'%).']); } });
  var qOk=qs.filter(function(q){return q.q+q.k2>=5;});
  qOk.forEach(function(q){ var r=q.q/(q.q+q.k2)*100; if(r<50){ var others=qOk.filter(function(o){return o!==q;}).map(function(o){return o.k+' đạt '+o.q+'/'+(o.q+o.k2)+' ('+vn(o.q/(o.q+o.k2)*100,0)+'%)';});
    ev.push(['er','Đợt vào <b>'+q.k+' chỉ '+q.q+'/'+(q.q+q.k2)+' qua thử việc ('+vn(r,0)+'%)</b>'+(others.length?', trong khi '+others.join(', '):'')+'. Nên xem lại đợt tuyển này (vị trí, người phỏng vấn, nguồn CV).']); } });
  if(s6&&s6.r<80){ var drops=[]; for(var i=1;i<Math.min(surv.length,7);i++) drops.push({m:surv[i].m,d:surv[i-1].r-surv[i].r}); drops.sort(function(a,b){return b.d-a.d;});
    ev.push(['wa',(s2?'Sau 2 tháng còn <b>'+vn(s2.r)+'%</b> người mới, ':'')+'sau 6 tháng còn <b>'+vn(s6.r)+'%</b>. Trong 6 tháng đầu, rơi mạnh nhất ở tháng thứ '+drops.slice(0,2).map(function(x){return x.m;}).sort(function(a,b){return a-b;}).join(' và tháng thứ ')+'.']); }
  else if(s6) ev.push(['ok','Sau 6 tháng còn <b>'+vn(s6.r)+'%</b> người mới ('+s6.st+'/'+s6.el+').']);
  if(late.length){ var by={}; late.forEach(function(x){var d=dept(x.e); by[d]=(by[d]||0)+1;});
    ev.push(['wa','<b>'+late.length+' người đã quá 2 tháng thử việc mà chưa ký HĐ</b> ('+Object.keys(by).map(function(d){return E(d)+' '+by[d];}).join(', ')+'): '+late.map(function(x){return E(short(x.e.hoTen));}).join(', ')+'. Cần chốt kết quả.']); }
  var good=dl.filter(function(x){var d=x.q+x.k; return d>=4&&x.q/d>=0.8;}).sort(function(a,b){return b.q/(b.q+b.k)-a.q/(a.q+a.k)||b.q-a.q;}).slice(0,2);
  if(good.length) ev.push(['ok',good.map(function(x){return '<b>'+E(x.d)+' '+x.q+'/'+(x.q+x.k)+'</b>';}).join(' và ')+' qua thử việc, giữ người mới tốt nhất.']);

  var html=block('Thử việc &amp; giữ chân người mới','Đánh giá chi tiết','Người mới có ở lại không? Rơi rụng ở giai đoạn nào, phòng nào, đợt nào?',
    '<div class="ix-kpis">'+kpi(vn(rate)+'%','qua thử việc · '+qua+'/'+(qua+khong)+' đã có kết quả',khong+' người không qua',rate!=null&&rate<75?'wa':'ok')+
      kpi(med==null?'—':Math.round(med)+' ngày','trung vị thời gian làm của người không qua TV',failDays.length+' người có ngày nghỉ')+
      kpi(s6?vn(s6.r)+'%':'—','người mới còn làm sau 6 tháng',s6?s6.st+'/'+s6.el+' · vào từ '+mlab(start):'chưa đủ dữ liệu',s6&&s6.r<80?'wa':'ok')+
      kpi(late.length,'quá 2 tháng thử việc chưa chốt',late.length?'cần chốt kết quả':'không có',late.length?'er':'ok')+'</div>'+
    '<div class="ix-g2">'+card('ix-c1','Kết quả thử việc theo phòng ban','Tất cả người từng thử việc · % = qua / đã có kết quả','tall')+
      card('ix-c2','Tỷ lệ còn làm theo số tháng kể từ ngày vào',coh.length+' người vào từ '+mlab(start)+' · chỉ vẽ đến tháng còn đủ ≥ 10 người','tall')+'</div>'+
    '<div class="ix-mt">'+card('ix-c3','Tỷ lệ qua thử việc theo đợt vào làm','Theo quý vào làm · số trên cột = qua / đã có kết quả · cột xám: dưới 5 người, chưa đủ để đánh giá','sm')+'</div>'+
    '<div class="ix-foot">Kết quả thử việc lấy theo "số bản HĐ đã ký": từ 2 bản = đã ký HĐLĐ (qua thử việc); 1 bản và đã nghỉ = không qua (gồm cả rớt và tự nghỉ trong thử việc). Người nghỉ chưa ghi ngày nghỉ không tính vào đường "còn làm".</div>'+
    evalBox(ev,'qua thử việc dưới 50% (phòng hoặc đợt có từ 5 người đã có kết quả) → Nghiêm trọng; 50–75% → Cảnh báo; từ 80% (từ 4 người) → Tốt. Còn làm sau 6 tháng dưới 80% → Cảnh báo. Có người quá 2 tháng thử việc chưa ký HĐ → Cảnh báo.'));
  return {html:html, draw:function(){
    hbar('ix-c1',dl.map(function(x){return x.d;}),[{name:'Qua thử việc',data:dl.map(function(x){return x.q;}),color:C.s1},{name:'Không qua',data:dl.map(function(x){return x.k;}),color:C.s2},
      {name:'Quá hạn chưa chốt',data:dl.map(function(x){return x.l;}),color:C.s4},{name:'Đang thử việc',data:dl.map(function(x){return x.p;}),color:C.light}],
      {left:110,right:96,label:function(i){var x=dl[i],d=x.q+x.k; return d?x.q+'/'+d+' · '+Math.round(x.q/d*100)+'%':'chưa có KQ';}});
    var hi=surv.map(function(s){return s.r;}), lowIdx=[2,6].filter(function(i){return surv[i];});
    mk('ix-c2',{grid:{left:40,right:20,top:22,bottom:30},tooltip:A(tip,{formatter:function(p){var s=surv[p[0].dataIndex]; return (s.m?'Tháng thứ '+s.m:'Ngày vào')+': <b style="color:#fff">'+vn(s.r)+'%</b> ('+s.st+'/'+s.el+' còn làm)';}}),
      xAxis:A({type:'category',data:surv.map(function(s){return s.m?String(s.m):'Vào';}),boundaryGap:false,name:'tháng',nameLocation:'end',nameTextStyle:{color:C.mut,fontSize:10.5}},ax),
      yAxis:A({type:'value',min:function(v){return Math.max(0,Math.floor((v.min-10)/10)*10);},max:100,axisLabel:{color:C.mut,fontSize:11,formatter:'{value}%'}},{axisLine:{show:false},axisTick:{show:false}},vg),
      series:[{type:'line',data:hi.map(function(v){return Math.round(v*10)/10;}),showSymbol:true,symbolSize:6,lineStyle:{width:2.2,color:C.s3},itemStyle:{color:C.s3,borderColor:'#fff',borderWidth:1.5},
        markLine:{silent:true,symbol:'none',lineStyle:{color:C.wa,type:[4,4]},label:{color:C.wa,fontSize:10.5,formatter:'mốc 80%'},data:[{yAxis:80}]},
        markPoint:{symbol:'circle',symbolSize:8,itemStyle:{color:C.s3},label:{show:true,position:'top',color:C.ink,fontWeight:700,fontSize:11.5,formatter:function(p){return vn(p.value)+'%';}},
          data:lowIdx.map(function(i){return {coord:[String(i),Math.round(surv[i].r*10)/10],value:Math.round(surv[i].r*10)/10};})}}]});
    mk('ix-c3',{grid:{left:44,right:16,top:24,bottom:24},tooltip:A(tip,{axisPointer:{type:'shadow'},formatter:function(p){var q=qs[p[0].dataIndex]; return q.k+': <b style="color:#fff">'+q.q+'/'+(q.q+q.k2)+'</b> qua thử việc'+(q.open?' · '+q.open+' chưa có kết quả':'');}}),
      xAxis:A({type:'category',data:qs.map(function(q){return q.k+(q.open?'*':'');})},ax),yAxis:A({type:'value',max:100,axisLabel:{color:C.mut,fontSize:11,formatter:'{value}%'}},{axisLine:{show:false},axisTick:{show:false}},vg),
      series:[{type:'bar',barWidth:44,data:qs.map(function(q){var d=q.q+q.k2, r=d?Math.round(q.q/d*1000)/10:0; return {value:r,itemStyle:{color:d<5?C.light:(r<50?C.s2:C.s1),borderRadius:[4,4,0,0]}};}),
        label:{show:true,position:'top',color:C.ink,fontWeight:600,fontSize:11.5,formatter:function(p){var q=qs[p.dataIndex]; return (q.q+q.k2)?vn(p.value)+'% ('+q.q+'/'+(q.q+q.k2)+')':'chưa có KQ';}}}]});
  }};
}

/* =====================================================================
   KHỐI 4 — Kỷ luật giờ giấc (tab Chấm công & năng suất)
   Cùng định nghĩa đi trễ với tab hiện tại: nsLates (T-S/T-C/T-C2 ≥3'), bỏ T7/CN, bỏ ngày "ĐÃ NGHỈ".
   ===================================================================== */
function blockLate(){
  var D=window.__ccData;
  if(!D||!D.cc_data){ if(window.nsuatLoadFirebase) window.nsuatLoadFirebase(); return {html:block('Kỷ luật giờ giấc','Đánh giá chi tiết','','<div class="ix-foot">Đang tải dữ liệu chấm công…</div>')}; }
  /* gộp y hệt renderNangSuat: duyệt danh sách NV chấm công, phòng lấy theo Hồ sơ (khớp tên), mẫu số = mọi ngày có ký hiệu (T2–T6) */
  var ns=HR.nhansu, norm=window.nsNorm, byName={};
  ns.forEach(function(n){ byName[norm(n.hoTen)]=n; });
  var cell={}, months={}, dep={}, per={}, wd={}, buck=[0,0,0,0], totL=0, totD=0, ccKeys=Object.keys(D.cc_data);
  (D.employees||[]).forEach(function(e){
    var n=byName[norm(e.name)], d=(n&&n.phong)||e.dept||'—';
    var dd=(dep[d]=dep[d]||{n:0,min:0,days:0,emp:0}); dd.emp++;
    ccKeys.forEach(function(key){ if(key.indexOf(e.id+'_')!==0) return; var mm=key.split('_'); if(mm.length<3) return;
      var mk2=(+mm[mm.length-2])*100+(+mm[mm.length-1]); months[mk2]=1; var rec=D.cc_data[key]||{};
      Object.keys(rec).forEach(function(day){ var v=rec[day], stt=(v&&typeof v==='object')?v.status:v; if(stt===''||stt==null) return; if(window.nsWknd(day)) return;
        var ls=window.nsLates(v), c=(cell[d]=cell[d]||{}), x=(c[mk2]=c[mk2]||[0,0]); x[0]+=ls.length; x[1]++;
        var w=new Date(day+'T12:00:00').getDay(), q=(wd[w]=wd[w]||[0,0]); q[0]+=ls.length; q[1]++;
        dd.days++; totD++;
        ls.forEach(function(m){ dd.n++; dd.min+=m; totL++; buck[m<10?0:m<30?1:m<60?2:3]++; var pp=(per[e.id]=per[e.id]||{n:0,min:0,name:e.name,d:d}); pp.n++; pp.min+=m; }); }); }); });
  if(!totD) return null;
  var mkeys=Object.keys(months).map(Number).sort().slice(-5), Tn=today(), curKey=Tn.getFullYear()*100+Tn.getMonth()+1;
  var deps=Object.keys(cell).sort(function(a,b){ var ra=dep[a].n/dep[a].days, rb=dep[b].n/dep[b].days; return rb-ra||a.localeCompare(b); });
  var people=Object.keys(per).map(function(k){return per[k];}).sort(function(a,b){return b.n-a.n||b.min-a.min;});
  var top3=people.slice(0,3).reduce(function(s,p){return s+p.n;},0);
  var ld=Object.keys(dep).filter(function(d){return dep[d].n>0;}).sort(function(a,b){return dep[b].n-dep[a].n;});
  var wkeys=[1,2,3,4,5], wr=wkeys.map(function(w){var q=wd[w]||[0,0]; return q[1]?q[0]/q[1]*100:0;});
  var wmax=Math.max.apply(null,wr), wmin=Math.min.apply(null,wr), WN=['','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6'];

  var ev=[];
  var worst=deps.filter(function(d){return dep[d].emp>=3;})[0]; if(worst&&dep[worst].n){ var pw=people.filter(function(p){return p.d===worst;})[0], wrate=dep[worst].n/dep[worst].days*100;
    if(pw&&pw.n/dep[worst].n>0.5) ev.push(['wa','<b>'+E(worst)+'</b> có tỷ lệ trễ cao nhất trong các phòng từ 3 người ('+vn(wrate)+'%) nhưng <b>'+pw.n+'/'+dep[worst].n+' lượt là của 1 người ('+E(pw.name)+')</b>. Đây là vấn đề cá nhân, không phải của cả phòng, nên trao đổi riêng.']);
    else ev.push([wrate>=8?'wa':'in','<b>'+E(worst)+'</b> có tỷ lệ trễ cao nhất: '+vn(wrate)+'% ('+dep[worst].n+' lượt).']); }
  ld.forEach(function(d){ var a=dep[d].min/dep[d].n; if(dep[d].emp>=2&&dep[d].n>=3&&a>20){ var pm=people.filter(function(p){return p.d===d;}).sort(function(x,y){return y.min-x.min;})[0];
    ev.push(['wa','<b>'+E(d)+'</b>: trung bình <b>'+vn(a)+' phút/lượt</b>'+(worst&&d!==worst&&dep[worst].n?', gấp '+vn(a/(dep[worst].min/dep[worst].n))+' lần '+E(worst):'')+'.'+(pm?' Riêng '+E(pm.name)+': '+pm.n+' lượt, tổng '+pm.min+' phút.':'')]); } });
  var zero=Object.keys(dep).filter(function(d){return dep[d].n===0;});
  if(totL&&buck[0]/totL>=0.6) ev.push(['ok',vn(buck[0]/totL*100,0)+'% lượt trễ dưới 10 phút.'+(zero.length?' '+zero.map(E).join(', ')+' chưa đi trễ lần nào.':'')]);
  else if(zero.length) ev.push(['ok',zero.map(E).join(', ')+' chưa đi trễ lần nào.']);
  if(totL) ev.push([wmax-wmin<2?'in':'wa',WN[wkeys[wr.indexOf(wmax)]]+' có tỷ lệ trễ cao nhất ('+vn(wmax)+'%), thấp nhất '+WN[wkeys[wr.indexOf(wmin)]]+' ('+vn(wmin)+'%).'+(wmax-wmin<2?' Chênh lệch nhỏ, cần thêm dữ liệu trước khi kết luận.':'')]);

  var html=block('Kỷ luật giờ giấc','Đánh giá chi tiết','Đi trễ là vấn đề của cả phòng hay của vài cá nhân? Trễ nhẹ hay nặng?',
    '<div class="ix-kpis">'+kpi(vn(totL/totD*100,1)+'%','tỷ lệ đi trễ · '+totL+'/'+totD.toLocaleString('vi-VN'),mkeys.length?'T'+(mkeys[0]%100)+'/'+Math.floor(mkeys[0]/100)+' – T'+(mkeys[mkeys.length-1]%100)+'/'+Math.floor(mkeys[mkeys.length-1]/100):'')+
      kpi(totL?vn(top3/totL*100,0)+'%':'—','số lượt trễ do 3 người gây ra',top3+'/'+totL+' lượt',totL&&top3/totL>0.4?'er':'')+
      kpi(totL?vn(buck[0]/totL*100,0)+'%':'—','lượt trễ dưới 10 phút',buck[0]+'/'+totL+' · trễ nhẹ')+
      kpi(buck[2]+buck[3],'lượt trễ từ 30 phút trở lên','trễ nặng',buck[2]+buck[3]?'wa':'ok')+'</div>'+
    '<div class="ix-g2"><div class="ix-card"><div class="ct">Tỷ lệ đi trễ theo phòng × tháng</div><div class="cs">Lượt trễ ÷ ngày chấm · cùng cách tính với các biểu đồ phía trên · ô viền nét đứt: tháng chưa hết kỳ</div><div class="ix-scroll"><table class="ix-t" id="ix-d1"></table></div></div>'+
      card('ix-d2','Mức độ trễ: số lượt &amp; phút trung bình theo phòng','Phòng nào trễ nhiều lần, phòng nào trễ lâu','tall')+'</div>'+
    '<div class="ix-g2 ix-mt">'+card('ix-d3','Phân bố độ dài mỗi lượt trễ','Theo số phút trễ của từng lượt','sm')+card('ix-d4','Tỷ lệ trễ theo thứ trong tuần','Toàn kỳ','sm')+'</div>'+
    evalBox(ev,'xếp hạng phòng chỉ tính phòng từ 3 người (giống phần Đọc nhanh phía trên); một người chiếm trên 50% lượt trễ của phòng → ghi "vấn đề cá nhân"; phút trễ trung bình trên 20 phút (phòng từ 2 người, từ 3 lượt) → Cảnh báo; từ 60% lượt trễ dưới 10 phút → Tốt; chênh lệch giữa các thứ dưới 2 điểm % → chỉ ghi Lưu ý.'));
  return {html:html, draw:function(){
    function heat(p){ if(p===0) return '#FFFFFF'; var t=Math.min(p/20,1),a=[251,241,223],b=[208,120,42]; return 'rgb('+a.map(function(v,i){return Math.round(v+(b[i]-v)*t);}).join(',')+')'; }
    var h='<tr><th class="l">Phòng</th>'+mkeys.map(function(k){return '<th>T'+(k%100)+'/'+String(Math.floor(k/100)).slice(2)+(k===curKey?'*':'')+'</th>';}).join('')+'</tr>';
    deps.forEach(function(d){ h+='<tr><td class="l">'+E(d)+'</td>'+mkeys.map(function(k){ var c=(cell[d]||{})[k]; if(!c||!c[1]) return '<td style="background:#F4F5F9"><small>—</small></td>';
      var p=c[0]/c[1]*100; return '<td style="background:'+heat(p)+(p===0?';border:1px solid #EEF0F5':'')+(k===curKey?';outline:1px dashed #9AA4B8;outline-offset:-2px':'')+'" title="'+c[0]+' lượt / '+c[1]+' ngày"><b>'+vn(p,1)+'%</b><small>'+c[0]+'/'+c[1]+'</small></td>'; }).join('')+'</tr>'; });
    var t=document.getElementById('ix-d1'); if(t) t.innerHTML=h;
    var ln=ld.map(function(d){return dep[d].n;}), lm=ld.map(function(d){return Math.round(dep[d].min/dep[d].n*10)/10;});
    mk('ix-d2',{grid:[{left:100,right:'52%',top:28,bottom:6},{left:'56%',right:40,top:28,bottom:6}],
      title:[{text:'Số lượt trễ',left:100,top:0,textStyle:{fontSize:11.5,color:C.mut,fontWeight:500}},{text:'Phút trễ TB / lượt',left:'56%',top:0,textStyle:{fontSize:11.5,color:C.mut,fontWeight:500}}],
      tooltip:A(tip,{trigger:'item'}),
      xAxis:[A({type:'value',gridIndex:0},ax,vg,{axisLabel:{show:false}}),A({type:'value',gridIndex:1},ax,vg,{axisLabel:{show:false}})],
      yAxis:[A({type:'category',gridIndex:0,data:ld.slice().reverse()},ax,{axisLabel:{color:C.ink,fontSize:11.5}}),A({type:'category',gridIndex:1,data:ld.slice().reverse()},ax,{axisLabel:{show:false}})],
      series:[{type:'bar',xAxisIndex:0,yAxisIndex:0,barWidth:13,data:ln.slice().reverse(),itemStyle:{color:C.s1,borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:C.ink,fontSize:11,fontWeight:600}},
        {type:'bar',xAxisIndex:1,yAxisIndex:1,barWidth:13,data:lm.slice().reverse().map(function(v){return {value:v,itemStyle:{color:v>20?C.s2:'#E9C9A8',borderRadius:[0,4,4,0]}};}),label:{show:true,position:'right',color:C.ink,fontSize:11,fontWeight:600,formatter:function(p){return vn(p.value)+'p';}}}]});
    mk('ix-d3',{grid:{left:30,right:12,top:24,bottom:24},tooltip:A(tip,{axisPointer:{type:'shadow'},valueFormatter:function(v){return v+' lượt';}}),
      xAxis:A({type:'category',data:['3–9 phút','10–29 phút','30–59 phút','≥ 60 phút']},ax,{axisLabel:{color:C.ink,fontSize:11.5}}),yAxis:A({type:'value',minInterval:1},ax,vg),
      series:[{type:'bar',barWidth:42,data:buck.map(function(v,i){return {value:v,itemStyle:{color:['#E9C9A8','#DFA46F',C.s2,C.er][i],borderRadius:[4,4,0,0]}};}),label:{show:true,position:'top',color:C.ink,fontWeight:700,fontSize:12}}]});
    mk('ix-d4',{grid:{left:38,right:12,top:24,bottom:24},tooltip:A(tip,{axisPointer:{type:'shadow'},formatter:function(p){var q=wd[wkeys[p[0].dataIndex]]||[0,0]; return p[0].name+': <b style="color:#fff">'+vn(p[0].value,1)+'%</b> ('+q[0]+'/'+q[1]+')';}}),
      xAxis:A({type:'category',data:wkeys.map(function(w){return WN[w];})},ax),yAxis:A({type:'value',axisLabel:{color:C.mut,fontSize:11,formatter:'{value}%'}},{axisLine:{show:false},axisTick:{show:false}},vg),
      series:[{type:'bar',barWidth:38,data:wr.map(function(v){return {value:Math.round(v*10)/10,itemStyle:{color:v===wmax&&wmax>0?C.s2:'#E9C9A8',borderRadius:[4,4,0,0]}};}),label:{show:true,position:'top',color:C.ink,fontWeight:600,fontSize:11.5,formatter:function(p){return vn(p.value,1)+'%';}}}]});
  }};
}

/* =====================================================================
   KHỐI 5 — Tuân thủ: hợp đồng, hồ sơ, review lương (tab mới)
   Review lương = ngày ký HĐLĐ 6 tháng (ngày vào + 2 tháng) + 12 tháng, cho người đã ký (số bản ≥ 2).
   ===================================================================== */
function blockCompliance(){
  var ns=HR.nhansu, T=today(), act=ns.filter(function(e){return !isLeft(e);});
  var ct=act.filter(function(e){return String(e.ngayConLai==null?'':e.ngayConLai).trim()!==''&&!isNaN(+e.ngayConLai);}).map(function(e){return {e:e,d:+e.ngayConLai,tv:/thử việc/i.test(e.loaiHD||'')};});
  var cb=[0,0,0,0,0]; ct.forEach(function(x){ cb[x.d<0?0:x.d<=30?1:x.d<=60?2:x.d<=90?3:4]++; });
  var over=ct.filter(function(x){return x.d<0;}).sort(function(a,b){return a.d-b.d;}), overTV=over.filter(function(x){return x.tv;}), overHD=over.filter(function(x){return !x.tv;});
  var soon=ct.filter(function(x){return x.d>=0&&x.d<=60;}).sort(function(a,b){return a.d-b.d;});
  var hs={}; act.forEach(function(e){ var d=dept(e), o=(hs[d]=hs[d]||{ok:0,n:0}); o.n++; if(/^đủ/i.test(String(e.tinhTrangHoSo||'').trim())) o.ok++; });
  var hsl=Object.keys(hs).map(function(d){return {d:d,ok:hs[d].ok,n:hs[d].n};}).sort(function(a,b){return (a.ok/a.n)-(b.ok/b.n)||b.n-a.n;});
  var hsOk=hsl.reduce(function(s,x){return s+x.ok;},0), hsN=act.length, hsR=pc(hsOk,hsN);
  var rv=act.filter(function(e){return (+e.soBanKy||0)>=2&&vao(e);}).map(function(e){ var due=edate(edate(vao(e),2),12); return {e:e,due:due,d:days(new Date(T.getFullYear(),T.getMonth(),T.getDate()),due)}; });
  var rb=[0,0,0,0,0]; rv.forEach(function(x){ rb[x.d<0?0:x.d<=60?1:x.d<=90?2:x.d<=180?3:4]++; });
  var rOver=rv.filter(function(x){return x.d<0;}).sort(function(a,b){return a.d-b.d;}), rSoon=rv.filter(function(x){return x.d>=0&&x.d<=60;}).sort(function(a,b){return a.d-b.d;});
  function dmy(d){ return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0'); }

  var ev=[];
  if(overHD.length){ var yr=overHD.filter(function(x){return x.d<-365;}).length;
    ev.push(['er','<b>'+overHD.length+'/'+ct.length+' HĐ lao động đã quá hạn</b>'+(yr?', trong đó '+yr+' HĐ quá trên 1 năm':'')+'. Ưu tiên ký lại '+overHD.slice(0,3).map(function(x){return E(short(x.e.hoTen));}).join(', ')+'.']); }
  if(overTV.length) ev.push(['er','<b>'+overTV.length+' HĐ thử việc đã hết hạn</b> mà chưa chuyển HĐLĐ: '+overTV.map(function(x){return E(short(x.e.hoTen))+' ('+(-x.d)+' ngày)';}).join(', ')+'.']);
  if(hsR!=null){ var low=hsl.filter(function(x){return x.n>=3;}).slice(0,2);
    ev.push([hsR<50?'er':(hsR<90?'wa':'ok'),'<b>'+vn(hsR)+'% người đang làm đủ hồ sơ</b> ('+hsOk+'/'+hsN+').'+(low.length&&hsR<90?' Thấp nhất: '+low.map(function(x){return E(x.d)+' '+x.ok+'/'+x.n;}).join(', ')+'.':'')]); }
  if(rOver.length){ var both=rOver.filter(function(x){return over.some(function(o){return o.e===x.e;});});
    ev.push(['er','<b>'+rOver.length+' người quá hạn review lương</b>, lâu nhất '+(-rOver[0].d)+' ngày ('+rOver.filter(function(x){return x.d===rOver[0].d;}).map(function(x){return E(short(x.e.hoTen));}).join(', ')+').'+(both.length?' '+both.length+' người trong số này cũng đang quá hạn HĐ ('+both.map(function(x){return E(short(x.e.hoTen));}).join(', ')+'), nên gộp xử lý một lần.':'')]); }
  if(soon.length||rSoon.length) ev.push(['wa','Trong 60 ngày tới có <b>'+soon.length+' HĐ hết hạn</b>'+(rSoon.length?' và <b>'+rSoon.length+' người đến hạn review lương</b>: '+rSoon.map(function(x){return E(short(x.e.hoTen))+' '+dmy(x.due);}).join(', '):'')+'.']);
  if(!over.length&&!rOver.length) ev.push(['ok','Không có hợp đồng hay review lương nào quá hạn.']);

  var list=over.slice(0,5).map(function(x){return '<tr><td>'+E(x.e.hoTen)+'</td><td>'+E(x.e.loaiHD||'—')+'</td><td><span class="ix-pill p-er">'+(-x.d)+' ngày</span></td></tr>';}).join('');
  var list2=soon.map(function(x){return '<tr><td>'+E(x.e.hoTen)+'</td><td>'+E(x.e.loaiHD||'—')+'</td><td>'+E(x.e.ngayHetHan||'')+'</td><td><span class="ix-pill '+(x.d<=30?'p-wa':'p-in')+'">'+x.d+' ngày</span></td></tr>';}).join('');
  var list3=rOver.concat(rSoon).map(function(x){return '<tr><td>'+E(x.e.hoTen)+'</td><td>'+E(dept(x.e))+'</td><td>'+dmy(x.due)+'/'+x.due.getFullYear()+'</td><td><span class="ix-pill '+(x.d<0?'p-er':'p-wa')+'">'+(x.d<0?'Quá '+(-x.d):'Còn '+x.d)+' ngày</span></td></tr>';}).join('');

  var html=block('Tuân thủ: hợp đồng, hồ sơ, review lương','Đánh giá chi tiết','Việc hành chính nào đang quá hạn? Ai cần xử lý trước?',
    '<div class="ix-kpis">'+kpi(over.length,'HĐ đã quá hạn',over.length?'lâu nhất '+(-over[0].d)+' ngày':'không có',over.length?'er':'ok')+
      kpi(soon.length,'HĐ hết hạn trong 60 ngày',soon.length?'gần nhất: '+E(soon[0].e.ngayHetHan||''):'',soon.length?'wa':'ok')+
      kpi(vn(hsR)+'%','người đang làm đủ hồ sơ · '+hsOk+'/'+hsN,(hsN-hsOk)+' người thiếu',hsR<50?'er':(hsR<90?'wa':'ok'))+
      kpi(rOver.length,'người quá hạn review lương',rOver.length?'lâu nhất '+(-rOver[0].d)+' ngày':'không có',rOver.length?'er':'ok')+'</div>'+
    '<div class="ix-g2"><div class="ix-card"><div class="ct">Hợp đồng theo thời hạn còn lại</div><div class="cs">'+ct.length+' người đang làm có ngày hết hạn HĐ (cột Ngày hết hạn trong Hồ sơ)</div><div id="ix-e1" class="ix-chart sm"></div>'+
      (list?'<table class="ix-ls"><tr><th>Quá hạn lâu nhất</th><th>Loại HĐ</th><th>Quá</th></tr>'+list+'</table>':'')+'</div>'+
      card('ix-e2','Mức độ đủ hồ sơ theo phòng ban','Người đang làm · cùng tiêu chí cột Tình trạng hồ sơ / sheet Thiếu hồ sơ','tall')+'</div>'+
    '<div class="ix-g2 ix-mt"><div class="ix-card"><div class="ct">Hợp đồng hết hạn trong 60 ngày</div><div class="cs">Sắp xếp theo ngày còn lại</div>'+(list2?'<table class="ix-ls"><tr><th>Nhân sự</th><th>Loại HĐ</th><th>Hết hạn</th><th>Còn</th></tr>'+list2+'</table>':'<div class="ix-foot">Không có HĐ hết hạn trong 60 ngày.</div>')+'</div>'+
      '<div class="ix-card"><div class="ct">Lịch review lương</div><div class="cs">'+rv.length+' người có mốc review (ngày ký HĐLĐ 6 tháng + 1 năm)</div><div id="ix-e3" class="ix-chart sm"></div>'+
      (list3?'<table class="ix-ls"><tr><th>Quá hạn / đến hạn ≤ 60 ngày</th><th>Phòng</th><th>Mốc review</th><th></th></tr>'+list3+'</table>':'')+'</div></div>'+
    evalBox(ev,'có HĐ hoặc review lương quá hạn → Nghiêm trọng; đủ hồ sơ dưới 50% → Nghiêm trọng, 50–90% → Cảnh báo, từ 90% → Tốt; việc đến hạn trong 60 ngày → Cảnh báo.'));
  return {html:html, draw:function(){
    vbar('ix-e1',['Quá hạn','≤ 30 ngày','31–60 ngày','61–90 ngày','> 90 ngày'],cb,[C.er,C.wa,C.s2,C.s3,C.light],' người');
    hbar('ix-e2',hsl.map(function(x){return x.d;}),[{name:'Đủ hồ sơ',data:hsl.map(function(x){return x.ok;}),color:C.s4},{name:'Thiếu',data:hsl.map(function(x){return x.n-x.ok;}),color:'#E6E8EF'}],
      {left:110,right:50,label:function(i){return hsl[i].ok+'/'+hsl[i].n;}});
    vbar('ix-e3',['Quá hạn','≤ 60 ngày','61–90 ngày','91–180 ngày','> 180 ngày'],rb,[C.er,C.wa,C.s3,C.s5,C.light],' người');
  }};
}

/* ---------- CSS (scoped .ix) ---------- */
function injectCss(){
  if(document.getElementById('ix-css')) return;
  var s=document.createElement('style'); s.id='ix-css'; s.textContent=
  '.ix{font-family:"Be Vietnam Pro",system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#4A5263;max-width:1180px}'+
  '.ix-block{background:#fff;border:1px solid #E6E8EF;border-radius:14px;padding:18px 20px 16px;margin:26px 0 8px}'+
  '.ix-bh{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.ix-bh h2{font-size:17px;color:#1C2436;margin:0;font-weight:600}'+
  '.ix-tab{font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;background:#E8EBF8;color:#3548A8}'+
  '.ix-q{font-size:12.5px;color:#6B7280;margin:4px 0 12px}'+
  '.ix-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}'+
  '.ix-kpi{border:1px solid #E6E8EF;border-radius:10px;padding:10px 12px}.ix-kpi .v{font-size:22px;font-weight:700;color:#1C2436;line-height:1.15}'+
  '.ix-kpi .l{font-size:11.5px;color:#6B7280;margin-top:2px}.ix-kpi .d{font-size:11.5px;font-weight:600;margin-top:4px}'+
  '.ix-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ix-g3{display:grid;grid-template-columns:1.3fr 1fr;gap:14px}.ix-mt{margin-top:14px}'+
  '.ix-card{border:1px solid #E6E8EF;border-radius:12px;padding:12px 14px 8px;min-width:0;background:#fff}'+
  '.ix-card .ct{font-size:13.8px;font-weight:600;color:#1C2436}.ix-card .cs{font-size:11.5px;color:#6B7280;margin:2px 0 6px}'+
  '.ix-chart{width:100%;height:260px}.ix-chart.sm{height:210px}.ix-chart.tall{height:300px}'+
  '.ix-eval{margin-top:14px;border-top:1px dashed #E6E8EF;padding-top:12px}.ix-eval h4{font-size:12px;letter-spacing:.06em;color:#6B7280;margin:0 0 8px;font-weight:600}'+
  '.ix-ev{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.55;margin:6px 0}.ix-ev b{color:#1C2436}'+
  '.ix-chip{flex:none;font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;margin-top:1px;white-space:nowrap}'+
  '.c-ok{background:#E3F4EE;color:#177A53}.c-wa{background:#FBF1DF;color:#9A6417}.c-er{background:#FDECEC;color:#A42F2F}.c-in{background:#E8EBF8;color:#3548A8}'+
  '.ix-rule{font-size:11.3px;color:#6B7280;margin-top:8px;font-style:italic}.ix-foot{font-size:11.8px;color:#6B7280;margin-top:10px;line-height:1.5}'+
  '.ix-scroll{overflow-x:auto}table.ix-t{width:100%;border-collapse:separate;border-spacing:2px;font-size:12px}'+
  'table.ix-t th{font-weight:600;color:#6B7280;font-size:10.8px;padding:4px;text-align:center;white-space:nowrap;background:none;border:0}'+
  'table.ix-t th.l,table.ix-t td.l{text-align:left;color:#1C2436;font-weight:500;white-space:nowrap}'+
  'table.ix-t td{text-align:center;padding:6px 4px;border-radius:5px;color:#1C2436;border:0}table.ix-t td small{display:block;font-size:10px;color:#6B7280}table.ix-t tr.tot td{font-weight:700}'+
  'table.ix-ls{width:100%;border-collapse:collapse;font-size:12.3px;margin-top:6px;border:0;background:none}'+
  'table.ix-ls th{text-align:left;color:#6B7280;font-weight:600;font-size:11px;padding:5px 6px;border-bottom:1px solid #E6E8EF;background:none}'+
  'table.ix-ls td{padding:5px 6px;border-bottom:1px solid #EEF0F5;color:#1C2436}'+
  '.ix-pill{display:inline-block;padding:1px 8px;border-radius:999px;font-size:11px;font-weight:600}.p-er{background:#FDECEC;color:#A42F2F}.p-wa{background:#FBF1DF;color:#9A6417}.p-in{background:#E8EBF8;color:#3548A8}'+
  '@media(max-width:900px){.ix-kpis{grid-template-columns:repeat(2,1fr)}.ix-g2,.ix-g3{grid-template-columns:1fr}}';
  document.head.appendChild(s);
}
})();
