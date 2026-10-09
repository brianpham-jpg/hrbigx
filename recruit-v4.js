/* ============================================================
   BigX HR — recruit-v4.js  (tab Hiệu quả tuyển dụng — mockup v2 đã duyệt 09/10/2026)
   - CHỈ THÊM: khối "Diễn biến theo tháng" (bar chart race tự chạy) + khung "Đánh giá"
     dưới từng biểu đồ/bảng + sửa HIỂN THỊ (phễu đúng tỷ lệ, dấu phẩy thập phân,
     tên vị trí không bị cắt / sửa chính tả khi hiển thị, bỏ tháng trống trên trục).
   - KHÔNG sửa app.js / insights-v3.js / dữ liệu gốc. Chỉ đọc HR.tuyendung và dùng lại
     helper sẵn có (tdFunnel, tdStage, tdByViTri, ptFirstDrop, ptFilteredList, monthKey, pct, ptMk, PTC, ptTip, esc).
   - Mọi số và câu đánh giá tự tính lại mỗi lần mở tab / đổi bộ lọc.
   ============================================================ */
(function(){
'use strict';
if(window.__rvLoaded) return; window.__rvLoaded=true;
var TAB='pt-tuyen-dung';
var R=window.__rv={timer:null,chart:null,io:null};

/* ---------- tiện ích ---------- */
var DN={'Custormer Account Manager':'Customer Account Manager','Marketing excu':'Marketing Executive'}; // chỉ đổi tên HIỂN THỊ
function dn(v){ return DN[v]||v; }
function E(s){ return (typeof esc==='function')?esc(s):String(s==null?'':s); }
function vn(x,d){ if(x==null||isNaN(x)) return '—'; return Number(x).toLocaleString('vi-VN',{minimumFractionDigits:d==null?0:d,maximumFractionDigits:d==null?1:d}); }
function pc(a,b){ return b?a/b*100:null; }
function mOrd(k){ var p=String(k).split('/'); return (+p[1])*12+(+p[0]); }
function mlab(k){ return k.slice(0,2)+'/'+k.slice(5); }
function curK(){ var n=new Date(); return String(n.getMonth()+1).padStart(2,'0')+'/'+n.getFullYear(); }
function isTab(){ return window.currentTab===TAB && document.getElementById('pt-funnel'); }
var CH={er:['rv-er','Nghiêm trọng'],wa:['rv-wa','Cảnh báo'],ok:['rv-ok','Tốt'],in:['rv-in','Lưu ý']};
function evHtml(items,note){
  if(!items.length) items=[['in','Chưa đủ dữ liệu để đánh giá.']];
  var o={er:0,wa:1,ok:2,in:3}; items.sort(function(a,b){return o[a[0]]-o[b[0]];});
  return '<h4>ĐÁNH GIÁ'+(note?'<span class="rv-n">· '+note+'</span>':'')+'</h4>'+items.map(function(x){
    return '<div class="rv-ev"><span class="rv-chip '+CH[x[0]][0]+'">'+(x[2]||CH[x[0]][1])+'</span><div>'+x[1]+'</div></div>'; }).join('');
}
/* đặt khung đánh giá ngay sau 1 phần tử (tạo nếu chưa có) */
function evAfter(anchor,id,items,note){
  if(!anchor) return; var box=document.getElementById(id);
  if(!box){ box=document.createElement('div'); box.id=id; box.className='rv-eval'; anchor.parentNode.insertBefore(box,anchor.nextSibling); }
  box.innerHTML=evHtml(items,note);
}
function T(){ return HR.tuyendung||[]; }
function lvOf(c){ return tdFunnel([c]).map(function(x){return x.n;}); }

/* vị trí có dữ liệu bất thường — đúng quy tắc của insights-v3.js */
function anomalies(all){
  var g={}; all.forEach(function(r){ var k=(String(r.viTri||'').trim())||'(trống)'; (g[k]=g[k]||[]).push(r); }); var out=[];
  Object.keys(g).forEach(function(k){ var f=tdFunnel(g[k]).map(function(x){return x.n;}), hit=null;
    for(var i=2;i<f.length;i++){ var r=f[i-1]?f[i]/f[i-1]:null, rp=f[i-2]?f[i-1]/f[i-2]:null;
      if(r!=null&&rp!=null&&f[i]>0&&f[i-1]>=10&&rp>0.8&&r<0.05){ hit={k:k,i:i}; break; } }
    if(!hit&&f[3]>=5&&f[4]===0) hit={k:k,i:4}; if(hit) out.push(hit); });
  return out;
}
/* chuỗi tháng liên tục: bỏ các tháng lẻ đứng cách xa (>3 tháng trống) ở đầu */
function monthSeries(all){
  var s={}; all.forEach(function(c){ var k=monthKey(c.ngayNop); if(k) s[k]=1; });
  var ks=Object.keys(s).sort(function(a,b){return mOrd(a)-mOrd(b);}); if(!ks.length) return {ms:[],hidden:[]};
  var cut=0; for(var i=1;i<ks.length;i++){ if(mOrd(ks[i])-mOrd(ks[i-1])>3) cut=i; }
  var a=mOrd(ks[cut]), b=Math.max(mOrd(ks[ks.length-1]),mOrd(curK())), ms=[];
  for(var o=a;o<=b;o++){ var y=Math.floor((o-1)/12), m=o-y*12, k=String(m).padStart(2,'0')+'/'+y;
    var l=all.filter(function(c){return monthKey(c.ngayNop)===k;});
    ms.push({k:k,cv:l.length,hire:l.filter(function(c){return (c.final||'').trim()==='TRÚNG TUYỂN';}).length,list:l}); }
  var hidden=ks.slice(0,cut).map(function(k){ return {k:k,cv:all.filter(function(c){return monthKey(c.ngayNop)===k;}).length}; });
  return {ms:ms,hidden:hidden};
}

/* ---------- CSS ---------- */
function css(){
  if(document.getElementById('rv-css')) return;
  var s=document.createElement('style'); s.id='rv-css'; s.textContent=
  '.rv-eval{margin-top:12px;border-top:1px dashed #263045;padding-top:12px;font-family:"Be Vietnam Pro",system-ui,sans-serif}'+
  '.rv-eval h4{margin:0 0 8px;font-size:11.5px;letter-spacing:.07em;color:#A99BEF;font-weight:700}.rv-n{font-weight:400;letter-spacing:0;color:#7C879A;margin-left:6px}'+
  '.rv-ev{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.55;margin:6px 0;color:#D2D8E3}.rv-ev b{color:#E8ECF3}'+
  '.rv-chip{flex:none;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;margin-top:1px;line-height:1.45}'+
  '.rv-er{background:rgba(227,107,107,.14);color:#E36B6B}.rv-wa{background:rgba(224,168,74,.14);color:#E0A84A}.rv-ok{background:rgba(47,181,158,.14);color:#4FBF8F}.rv-in{background:rgba(106,128,219,.16);color:#8FA0F0}'+
  '.rv-card{background:#1C2436;border:1px solid #263045;border-radius:14px;padding:16px 18px;margin:4px 0 22px;font-family:"Be Vietnam Pro",system-ui,sans-serif}'+
  '.rv-hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.rv-hd h2{margin:0;font-size:17px;font-weight:600;color:#E8ECF3}.rv-sub{font-size:12px;color:#7C879A}'+
  '.rv-scs{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.rv-sc{border:1px solid #263045;background:transparent;color:#A7B0C2;padding:5px 11px;border-radius:999px;font:inherit;font-size:12px;cursor:pointer}'+
  '.rv-sc.on{background:#9377E6;border-color:#9377E6;color:#fff}.rv-ctl{margin-left:auto;display:flex;gap:8px;align-items:center}'+
  '.rv-btn{background:#232C40;border:1px solid #263045;color:#E8ECF3;height:30px;padding:0 10px;border-radius:8px;cursor:pointer;font:inherit;font-size:12px}'+
  '.rv-prog{height:3px;background:#263045;border-radius:2px;margin:10px 0 12px;overflow:hidden}.rv-prog div{height:100%;background:#9377E6;width:0}'+
  '.rv-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px}#rv-race{height:400px}'+
  '.rv-log{display:flex;flex-direction:column;gap:6px;height:330px;overflow:hidden}'+
  '.rv-lg{display:flex;gap:8px;font-size:12.5px;line-height:1.5;color:#D2D8E3;animation:rvIn .4s ease}.rv-lg b{color:#E8ECF3}.rv-lg .m{flex:none;width:36px;color:#7C879A;font-size:11px;padding-top:2px}'+
  '@keyframes rvIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}'+
  '.rv-concl ul{margin:6px 0 0;padding-left:18px}.rv-concl li{margin:3px 0;font-size:13px;color:#D2D8E3}.rv-concl b{color:#E8ECF3}'+
  '@media(max-width:900px){.rv-grid{grid-template-columns:1fr}}';
  document.head.appendChild(s);
}

/* ---------- SỬA HIỂN THỊ: chữ (dấu phẩy thập phân + tên vị trí) ---------- */
function fixText(root){
  if(!root) return;
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
    var p=n.parentNode; while(p&&p!==root){ if(p.classList&&(p.classList.contains('ec')||p.id==='rv-block'))return NodeFilter.FILTER_REJECT; if(p.tagName==='svg'||p.tagName==='SCRIPT')return NodeFilter.FILTER_REJECT; p=p.parentNode; }
    return NodeFilter.FILTER_ACCEPT; }});
  var n; while((n=w.nextNode())){ var t=n.nodeValue, u=t.replace(/(\d)\.(\d)/g,'$1,$2');
    Object.keys(DN).forEach(function(k){ u=u.split(k).join(DN[k]); }); if(u!==t) n.nodeValue=u; }
  var sel=document.getElementById('pt-vitri'); if(sel) [].forEach.call(sel.options,function(o){ if(DN[o.value]) o.text=DN[o.value]; });
}

/* ---------- PHỄU: vẽ đúng tỷ lệ + đánh giá theo bộ lọc ---------- */
var origDraw=window.__rvOrigDraw||window.ptDrawFunnel; window.__rvOrigDraw=origDraw;
window.ptDrawFunnel=function(){
  origDraw.apply(this,arguments);
  try{ if(!isTab()) return; drawFunnel(); fixText(document.getElementById('pt-funnote')); }catch(e){ console.warn('[rv] funnel',e); }
};
function drawFunnel(){
  var L=ptFilteredList(), fn=tdFunnel(L), n=fn.map(function(x){return x.n;}), mx=Math.max(n[0],1);
  var conv=n.map(function(x,i){return (i===0||!n[i-1])?null:pct(x,n[i-1]);}), mi=-1, mc=101;
  conv.forEach(function(c,i){ if(c!==null&&c<mc){mc=c;mi=i;} });
  ptMk('pt-funnel',{
    tooltip:ptTip({trigger:'item',formatter:function(p){ var i=p.dataIndex; if(p.seriesIndex===0) return ''; return '<b>'+E(fn[i].label)+'</b><br/>'+n[i]+' ứng viên'+(i?'<br/><span style="color:'+PTC.muted+'">'+(conv[i]==null?'—':vn(conv[i],1)+'%')+' so với bước trên · '+vn(pct(n[i],n[0]),1)+'% tổng</span>':''); }}),
    grid:{left:8,right:96,top:8,bottom:8,containLabel:true},
    xAxis:{type:'value',show:false,max:mx},
    yAxis:{type:'category',inverse:true,data:fn.map(function(x){return x.label;}),axisLine:{show:false},axisTick:{show:false},axisLabel:{color:PTC.text,fontFamily:PTFONT,fontSize:12}},
    series:[{type:'bar',stack:'f',silent:true,itemStyle:{color:'transparent'},data:n.map(function(x){return (mx-x)/2;})},
      {type:'bar',stack:'f',barWidth:'62%',data:n.map(function(x,i){return {value:x,itemStyle:{color:i===mi?PTC.rust:(PTC.ramp[i]||PTC.teal),borderRadius:3}};}),
       label:{show:true,position:'right',distance:6,fontFamily:PTFONT,formatter:function(p){var i=p.dataIndex;return '{a|'+n[i]+'}'+(i&&conv[i]!=null?'  {b|'+vn(conv[i],1)+'%}':'');},
         rich:{a:{color:PTC.ink,fontWeight:700,fontSize:12.5},b:{color:PTC.muted,fontSize:11}}}}]
  });
  /* đánh giá — không lặp ý "nghẽn nặng nhất" đã có ở dòng 💡 cũ */
  var it=[], all=T(), FN=tdFunnel(all).map(function(x){return x.n;}), fv=(document.getElementById('pt-vitri')||{}).value||'', fm=(document.getElementById('pt-month')||{}).value||'';
  if(!n[0]) it.push(['in','Không có CV nào cho lựa chọn này.']);
  else{
    var lose=[]; for(var i=1;i<6;i++) lose.push(n[i-1]-n[i]); var lm=Math.max.apply(null,lose), li=lose.indexOf(lm);
    it.push(['in','Bước <b>'+E(fn[li+1].label)+'</b> loại nhiều người nhất: <b>'+lm+'</b> ứng viên, chiếm '+vn(pc(lm,n[0]),1)+'% số CV.','Loại nhiều nhất']);
    if(fv||fm){ var d=pct(n[5],n[0])-pct(FN[5],FN[0]); it.push([d>=0?'ok':'wa','Đậu '+vn(pct(n[5],n[0]),1)+'%, '+(d>=0?'cao':'thấp')+' hơn toàn công ty <b>'+vn(Math.abs(d),1)+' điểm %</b> ('+vn(pct(FN[5],FN[0]),1)+'%).','So với công ty']); }
    var an=fv?[]:anomalies(all);
    if(an.length){ var L2=L.filter(function(c){return !an.some(function(a){return a.k===((String(c.viTri||'').trim())||'(trống)');});}), n2=tdFunnel(L2).map(function(x){return x.n;});
      var c2=[]; for(i=1;i<6;i++) c2.push(n2[i-1]?pct(n2[i],n2[i-1]):null); var mi2=-1,m2=101; c2.forEach(function(c,k){ if(c!==null&&n2[k]>=5&&c<m2){m2=c;mi2=k;} });
      if(n2[0]) it.push(['wa','Bỏ '+an.length+' vị trí nghi lỗi dữ liệu ('+an.map(function(a){return E(dn(a.k));}).join(', ')+') thì '+(mi>0&&n2[mi-1]?'<b>'+E(fn[mi].label)+'</b> qua <b>'+vn(pct(n2[mi],n2[mi-1]),1)+'%</b> ('+n2[mi]+'/'+n2[mi-1]+'), không phải '+vn(conv[mi],1)+'%. ':'')+(mi2>=0?'Bước nghẽn thật là <b>'+E(fn[mi2+1].label)+'</b> ('+vn(m2,1)+'%).':''),'Sau khi lọc nhiễu']); }
    var pend=L.filter(function(c){return tdStage(c).bucket==='xuly';}).length;
    if(pend>=10&&pc(pend,n[0])>=15) it.push(['in','<b>'+pend+'</b> CV ('+vn(pc(pend,n[0]),1)+'%) chưa xong quy trình. Tỷ lệ các bước sau còn thay đổi khi xử lý xong.','Chưa xong']);
  }
  evAfter(document.getElementById('pt-funnote'),'rv-ev-fun',it,'tự đổi theo bộ lọc');
}

/* ---------- các khung đánh giá + sửa hiển thị còn lại (chạy sau khi biểu đồ cũ vẽ xong) ---------- */
function enhance(){
  if(!isTab()) return; var all=T(); if(!all.length) return;
  var FN=tdFunnel(all).map(function(x){return x.n;}), BK={xuly:0,trung:0,loai:0}; all.forEach(function(c){BK[tdStage(c).bucket]++;});
  var pendFinal=all.filter(function(c){return !String(c.final||'').trim();}).length, POS=tdByViTri(all), content=document.getElementById('content');

  /* KPI */
  var it=[['in','Cứ <b>~'+Math.round(all.length/Math.max(FN[5],1))+' CV</b> mới ra 1 người trúng tuyển. <b>'+vn(pc(BK.loai,all.length),1)+'%</b> CV đã bị loại, <b>'+vn(pc(BK.xuly,all.length),1)+'%</b> còn đang xử lý.','Tổng quan']];
  if(pendFinal!==BK.xuly) it.push(['wa','Ô "Đang xử lý" là <b>'+BK.xuly+'</b>, còn khối Chất lượng phễu bên dưới ghi <b>'+pendFinal+' CV chưa có kết quả</b>. Lệch '+Math.abs(pendFinal-BK.xuly)+' vì 2 cách đếm khác nhau: '+BK.xuly+' = chưa bị loại ở bước nào; '+pendFinal+' = cột Final còn trống, kể cả người đã rớt ở vòng giữa nhưng chưa ghi Final. Nên chốt 1 định nghĩa.','Lệch số liệu']);
  evAfter(content.querySelector('.stat-row'),'rv-ev-kpi',it);

  /* Kết quả cuối */
  var st={},pv={}; all.forEach(function(c){ var s=tdStage(c); if(s.bucket!=='xuly') return; var k=s.label==='Mới nộp'?'Mới nộp':s.label.split(' · ')[0]; k={HR:'HR duyệt',LM:'LM duyệt'}[k]||k; st[k]=(st[k]||0)+1; var v=(String(c.viTri||'').trim())||'(trống)'; pv[v]=(pv[v]||0)+1; });
  var se=Object.keys(st).map(function(k){return [k,st[k]];}).sort(function(a,b){return b[1]-a[1];}), pe=Object.keys(pv).map(function(k){return [k,pv[k]];}).sort(function(a,b){return b[1]-a[1];});
  it=[]; if(BK.xuly){ it.push(['in','Trong <b>'+BK.xuly+'</b> CV đang xử lý, bước cuối cùng đã có kết quả của từng CV: '+se.map(function(x){return E(x[0])+' <b>'+x[1]+'</b>';}).join(' · ')+'.','Đang ở bước nào']);
    if(pc(se[0][1],BK.xuly)>=40) it.push(['wa','<b>'+vn(pc(se[0][1],BK.xuly),0)+'%</b> CV đang xử lý đang dừng sau bước <b>'+E(se[0][0])+'</b>, chưa có kết quả bước kế tiếp. Đây là chỗ cần xử lý trước để quy trình chạy tiếp.','Ứ đọng']);
    it.push(['in','Vị trí có nhiều CV đang xử lý nhất: '+pe.slice(0,3).map(function(x){return '<b>'+E(dn(x[0]))+'</b> '+x[1];}).join(', ')+'.','Theo vị trí']); }
  var don=document.getElementById('pt-donut'); evAfter(don,'rv-ev-don',it);
  try{ var dc=echarts.getInstanceByDom(don); if(dc) dc.setOption({tooltip:{formatter:function(p){return '<b>'+E(p.name)+'</b><br/>'+p.value+' CV · '+vn(p.percent,1)+'%';}}}); }catch(e){}

  /* Theo tháng — vẽ lại trục bỏ tháng trống ở đầu */
  var S=monthSeries(all), MS=S.ms;
  if(MS.length) ptMk('pt-months',{
    tooltip:ptTip({trigger:'axis',axisPointer:{type:'shadow'},formatter:function(a){var s='<b>Tháng '+E(a[0].axisValue)+'</b>';a.forEach(function(x){s+='<br/>'+x.marker+x.seriesName+': <b>'+x.value+'</b>';});var cv=a[0].value,hi=(a[1]?a[1].value:0);return s+'<br/><span style="color:'+PTC.muted+'">Tỷ lệ đậu: '+vn(cv?hi/cv*100:0,1)+'%</span>';}}),
    legend:{top:0,right:0,icon:'roundRect',itemWidth:11,itemHeight:11,textStyle:{color:PTC.text,fontFamily:PTFONT,fontSize:12}},
    grid:{left:8,right:8,top:34,bottom:4,containLabel:true},
    xAxis:{type:'category',data:MS.map(function(x){return mlab(x.k);}),axisTick:{show:false},axisLine:{lineStyle:{color:PTC.line}},axisLabel:{color:PTC.muted,fontFamily:PTFONT,fontSize:11}},
    yAxis:{type:'value',splitLine:{lineStyle:{color:PTC.line,type:'dashed'}},axisLabel:{color:PTC.faint,fontFamily:PTFONT,fontSize:11}},
    series:[{name:'CV nộp',type:'bar',data:MS.map(function(x){return x.cv;}),barWidth:11,itemStyle:{color:PTC.teal2,borderRadius:[4,4,0,0]},barGap:'20%'},
            {name:'Trúng tuyển',type:'bar',data:MS.map(function(x){return x.hire;}),barWidth:11,itemStyle:{color:PTC.clay,borderRadius:[4,4,0,0]}}]});
  it=[]; var ck=curK(), done=MS.filter(function(x){return x.k!==ck;}), tot=all.length;
  if(MS.length){ var pk=MS.slice().sort(function(a,b){return b.cv-a.cv;})[0], bp={}; pk.list.forEach(function(c){var v=(String(c.viTri||'').trim())||'(trống)'; bp[v]=(bp[v]||0)+1;});
    var bpe=Object.keys(bp).map(function(k){return [k,bp[k]];}).sort(function(a,b){return b[1]-a[1];});
    it.push(['in','Tháng <b>'+mlab(pk.k)+'</b> nhiều CV nhất: <b>'+pk.cv+'</b> CV ('+vn(pc(pk.cv,tot),1)+'% tổng), chủ yếu từ '+bpe.slice(0,2).map(function(x){return E(dn(x[0]))+' ('+x[1]+')';}).join(' và ')+'.','Đỉnh CV']);
    var bh=MS.filter(function(x){return x.cv>=10;}).sort(function(a,b){return (b.hire/b.cv)-(a.hire/a.cv)||b.hire-a.hire;})[0];
    if(bh) it.push(['ok','Tháng <b>'+mlab(bh.k)+'</b> tuyển hiệu quả nhất: <b>'+bh.hire+'</b> người từ '+bh.cv+' CV ('+vn(pc(bh.hire,bh.cv),1)+'%). Tính trên các tháng từ 10 CV trở lên.','Tháng tốt nhất']);
    if(done.length>=6){ var l3=done.slice(-3),p3=done.slice(-6,-3),a=l3.reduce(function(s,x){return s+x.cv;},0),b=p3.reduce(function(s,x){return s+x.cv;},0),d=b?(a-b)/b*100:null;
      it.push([d==null?'in':d>=0?'ok':'wa','3 tháng gần nhất đã hết tháng ('+mlab(l3[0].k)+'–'+mlab(l3[2].k)+') có <b>'+a+'</b> CV, so với <b>'+b+'</b> CV của 3 tháng trước đó'+(d==null?'':' ('+(d>=0?'+':'')+vn(d,0)+'%)')+'.','Xu hướng']); }
    var run=[],dry=[]; done.forEach(function(x){ if(x.cv>=1&&x.hire===0) run.push(x); else { if(run.length>=2) dry.push(run); run=[]; } }); if(run.length>=2) dry.push(run);
    dry.forEach(function(r){ it.push(['wa','<b>'+r.length+' tháng liền</b> ('+mlab(r[0].k)+'–'+mlab(r[r.length-1].k)+') có CV nhưng không ai trúng tuyển (tổng '+r.reduce(function(s,x){return s+x.cv;},0)+' CV).','Không tuyển được']); });
    var cm=MS.filter(function(x){return x.k===ck;})[0]; if(cm) it.push(['in','Tháng '+mlab(ck)+' đang diễn ra, mới có '+cm.cv+' CV, nên chưa dùng để so sánh.','Tháng hiện tại']);
    if(S.hidden.length) it.push(['in','Trục tháng bắt đầu từ '+mlab(MS[0].k)+'. Có '+S.hidden.reduce(function(s,x){return s+x.cv;},0)+' CV lẻ tháng '+S.hidden.map(function(x){return mlab(x.k);}).join(', ')+' không hiện trên trục (để khỏi chừa nhiều tháng trống), vẫn được tính trong mọi tổng.','Ghi chú']); }
  evAfter(document.getElementById('pt-months'),'rv-ev-mon',it);

  /* Theo vị trí (bảng) */
  var tbls=content.querySelectorAll('.table-wrap'); var posWrap=tbls[0], gWrap=tbls[1];
  it=[]; var t3=POS.slice(0,3), s3=t3.reduce(function(s,x){return s+x.total;},0);
  it.push([pc(s3,tot)>=60?'wa':'in','3 vị trí đầu ('+t3.map(function(x){return E(dn(x.viTri));}).join(', ')+') chiếm <b>'+vn(pc(s3,tot),1)+'%</b> tổng CV. Nguồn CV dồn vào vài vị trí, các vị trí còn lại ít ứng viên để chọn.','Tập trung']);
  var zero=POS.filter(function(x){return !x.trung;}); if(zero.length) it.push([zero.some(function(x){return x.total>=10;})?'er':'wa','<b>'+zero.length+' vị trí chưa tuyển được ai:</b> '+zero.map(function(x){return E(dn(x.viTri))+' ('+x.total+' CV)';}).join(', ')+'.','Chưa tuyển được']);
  var avg=pct(FN[5],tot), big=POS.filter(function(x){return x.total>=30;}), above=big.filter(function(x){return pct(x.trung,x.total)>=avg;});
  if(big.length) it.push(['in','Trong '+big.length+' vị trí có từ 30 CV, '+above.length+' vị trí đậu bằng hoặc cao hơn trung bình ('+vn(avg,1)+'%): '+(above.map(function(x){return E(dn(x.viTri));}).join(', ')||'không có')+'.','Vị trí lớn']);
  evAfter(posWrap,'rv-ev-pos',it);

  /* Điểm rớt */
  var DD={}; all.forEach(function(c){var r=ptFirstDrop(c); if(r) DD[r]=(DD[r]||0)+1;}); var DA=Object.keys(DD).map(function(k){return [k,DD[k]];}).sort(function(a,b){return a[1]-b[1];});
  it=[]; if(DA.length){ var dt=DA.reduce(function(s,x){return s+x[1];},0), top=DA[DA.length-1];
    it.push(['in','<b>'+E(top[0])+'</b> chiếm '+vn(pc(top[1],dt),0)+'% số người rớt ('+top[1]+'/'+dt+').','Rớt nhiều nhất']);
    var v1=DD['Rớt phỏng vấn V1']||0, v2=DD['Rớt phỏng vấn V2']||0;
    if(v2>v1){ var bpv={}; all.forEach(function(c){ if(ptFirstDrop(c)==='Rớt phỏng vấn V2'){ var v=(String(c.viTri||'').trim())||'(trống)'; bpv[v]=(bpv[v]||0)+1; } });
      var e=Object.keys(bpv).map(function(k){return [k,bpv[k]];}).sort(function(a,b){return b[1]-a[1];});
      it.push(['er','Rớt vòng 2 (<b>'+v2+'</b>) nhiều hơn rớt vòng 1 (<b>'+v1+'</b>). Thông thường vòng sau rớt ít hơn. <b>'+E(dn(e[0][0]))+'</b> chiếm '+e[0][1]+'/'+v2+' ca, nên nhiều khả năng con số bị đẩy lên do cách nhập dữ liệu của vị trí này.','Bất thường']); }
    var ns=(DD['No-show V1']||0)+(DD['No-show V2']||0), nsAny=all.filter(function(c){return (c.r1||'').trim()==='KHÔNG THAM GIA'||(c.r2||'').trim()==='KHÔNG THAM GIA';}).length;
    if(nsAny!==ns) it.push(['in','Biểu đồ đếm no-show <b>'+ns+'</b> người, khối đánh giá bên dưới ghi <b>'+nsAny+'</b> lượt. Hai số đều đúng: biểu đồ chỉ tính lý do rớt <i>đầu tiên</i>, nên '+(nsAny-ns)+' người có ghi "Không tham gia" nhưng đã rớt ở bước trước đó thì được tính vào bước đó.','Đối chiếu số']);
    var tc=all.filter(function(c){return (c.final||'').trim()==='TỪ CHỐI OFFER';}).length, tcd=DD['Từ chối offer']||0;
    if(tc!==tcd) it.push(['in','"Từ chối offer" ở đây là <b>'+tcd+'</b>, trong khi tổng số người có Final "Từ chối offer" là <b>'+tc+'</b>. '+(tc-tcd)+' người còn lại có vòng phỏng vấn ghi Fail / Không tham gia, nên bị tính vào bước rớt sớm hơn.','Đối chiếu số']); }
  evAfter(document.getElementById('pt-drops'),'rv-ev-drop',it);

  /* Giới tính */
  var ga=all.filter(function(c){return (c.gioiTinh||'').trim()==='Nam';}), gb=all.filter(function(c){return (c.gioiTinh||'').trim()==='Nữ';});
  var ha=ga.filter(function(c){return (c.final||'').trim()==='TRÚNG TUYỂN';}).length, hb=gb.filter(function(c){return (c.final||'').trim()==='TRÚNG TUYỂN';}).length;
  it=[]; if(ga.length&&gb.length){ var gap=Math.abs(pc(ha,ga.length)-pc(hb,gb.length));
    it.push(['in',(ga.length>gb.length?'Nam':'Nữ')+' chiếm <b>'+vn(pc(Math.max(ga.length,gb.length),all.length),1)+'%</b> CV nộp.','Cơ cấu']);
    it.push([gap<2||Math.min(ha,hb)<20?'ok':'wa','Tỷ lệ đậu chênh <b>'+vn(gap,1)+' điểm %</b>'+(Math.min(ha,hb)<20?' trên mẫu nhỏ ('+ha+' và '+hb+' người trúng tuyển), không phải khác biệt đáng kể':'')+'. Bảng chỉ để theo dõi cơ cấu, không dùng làm tiêu chí sàng lọc.','Chênh lệch']); }
  evAfter(gWrap,'rv-ev-gen',it);

  /* Khối Chất lượng phễu (insights-v3): đánh giá cho heatmap + tên không bị cắt */
  var hm=document.getElementById('ix-b1');
  if(hm){ var STEPS=['CV','HR duyệt','LM duyệt','Qua V1','Qua V2','Trúng tuyển'], an=anomalies(all), grp={}, g={};
    all.forEach(function(r){ var k=(String(r.viTri||'').trim())||'(trống)'; (g[k]=g[k]||[]).push(r); });
    var rows=Object.keys(g).map(function(k){return {k:k,f:tdFunnel(g[k]).map(function(x){return x.n;})};}).filter(function(p){return p.f[0]>=5;});
    rows.forEach(function(p){ var v=p.f,w=-1,wv=2; for(var i=1;i<v.length;i++){ if(v[i-1]>=3){ var r=v[i]/v[i-1]; if(r<wv){wv=r;w=i;} } }
      if(w>0&&!an.some(function(a){return a.k===p.k;})) (grp[STEPS[w]]=grp[STEPS[w]]||[]).push(p.k); });
    it=[]; if(Object.keys(grp).length) it.push(['in','Bỏ qua vị trí nghi lỗi dữ liệu, mỗi nhóm vị trí nghẽn ở một bước khác nhau: '+Object.keys(grp).map(function(s){return '<b>'+s+'</b>: '+grp[s].map(function(k){return E(dn(k));}).join(', ');}).join(' · ')+'. Mỗi nhóm cần cải thiện ở chỗ khác nhau, không áp chung một giải pháp.','Nghẽn theo nhóm']);
    var hr=rows.filter(function(p){return p.f[0]>=20;}).map(function(p){return {k:p.k,r:pc(p.f[1],p.f[0])};}).sort(function(a,b){return a.r-b.r;});
    if(hr[0]&&hr[0].r<pc(FN[1],FN[0])-20) it.push(['wa','<b>'+E(dn(hr[0].k))+'</b> chỉ '+vn(hr[0].r,1)+'% CV qua HR duyệt, thấp hơn nhiều so với mức chung '+vn(pc(FN[1],FN[0]),1)+'%. Nguồn CV của vị trí này có thể chưa đúng đối tượng.','HR loại nhiều']);
    evAfter(hm.parentNode,'rv-ev-heat',it); }
  ['ix-b2','ix-b3'].forEach(function(id){ var el=document.getElementById(id); if(!el) return; var c=echarts.getInstanceByDom(el); if(!c) return;
    c.setOption({grid:{left:8,containLabel:true},yAxis:{axisLabel:{formatter:function(v){return dn(v);}}}}); });

  fixText(content);
}

/* ---------- KHỐI RACE (tự chạy, tự dừng khi cuộn đi) ---------- */
function raceHtml(){
  return '<div class="rv-card" id="rv-block"><div class="rv-hd"><h2>Diễn biến theo tháng</h2><span class="rv-sub">tự chạy · cộng dồn từng tháng · bấm tên cảnh để xem ngay</span></div>'+
    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div class="rv-scs" id="rv-scs"></div><div class="rv-ctl"><span class="rv-sub" id="rv-stt"></span><button class="rv-btn" id="rv-pp">⏸ Dừng</button></div></div>'+
    '<div class="rv-prog"><div id="rv-bar"></div></div>'+
    '<div class="rv-grid"><div><div style="font-weight:600;color:#E8ECF3;font-size:15px" id="rv-t"></div><div class="rv-sub" id="rv-s"></div><div id="rv-race"></div></div>'+
    '<div><div class="rv-eval" style="border:0;margin:0;padding:0"><h4>DIỄN BIẾN TỪNG THÁNG</h4></div><div class="rv-log" id="rv-log"></div></div></div>'+
    '<div class="rv-eval"><h4>KẾT LUẬN CẢNH NÀY</h4><div class="rv-concl" id="rv-concl"><span class="rv-sub">Kết luận hiện khi chạy tới tháng cuối.</span></div></div></div>';
}
function startRace(){
  var all=T(), S0=monthSeries(all), MS=S0.ms, MR=MS.map(function(x){return x.k;}); if(MR.length<2) return;
  var P=tdByViTri(all).map(function(r){return r.viTri;});
  var REC=all.map(function(c){ return {k:monthKey(c.ngayNop),v:(String(c.viTri||'').trim())||'(trống)',f:lvOf(c),fin:!!String(c.final||'').trim()}; });
  var CU=MR.map(function(k){ var o={}; P.forEach(function(p){o[p]={cv:0,v1:0,tt:0,fin:0};}); REC.forEach(function(r){ if(!r.k||mOrd(r.k)>mOrd(k)||!o[r.v]) return; o[r.v].cv++; o[r.v].v1+=r.f[3]; o[r.v].tt+=r.f[5]; if(r.fin) o[r.v].fin++; }); return o; });
  var MO=MR.map(function(k){ var o={}; REC.forEach(function(r){ if(r.k!==k) return; o[r.v]=o[r.v]||{cv:0,v1:0,tt:0}; o[r.v].cv++; o[r.v].v1+=r.f[3]; o[r.v].tt+=r.f[5]; }); return o; });
  var SC=[{k:'cv',n:'CV nộp',t:'Vị trí nào hút nhiều CV nhất?',s:'CV nộp cộng dồn',v:function(c,p){return c[p].cv;},f:function(v){return vn(Math.round(v));},e:function(c,p){return c[p].cv>0;}},
    {k:'v1',n:'Qua phỏng vấn V1',t:'Vị trí nào đưa được nhiều người qua vòng 1?',s:'Số người qua phỏng vấn vòng 1, cộng dồn',v:function(c,p){return c[p].v1;},f:function(v){return vn(Math.round(v));},e:function(c,p){return c[p].cv>0;}},
    {k:'tt',n:'Trúng tuyển',t:'Vị trí nào tuyển được nhiều người nhất?',s:'Trúng tuyển cộng dồn, tính theo tháng nộp CV',v:function(c,p){return c[p].tt;},f:function(v){return vn(Math.round(v));},e:function(c,p){return c[p].cv>0;}},
    {k:'rate',n:'Tỷ lệ đậu',t:'Vị trí nào lọc CV hiệu quả nhất?',s:'Trúng tuyển ÷ CV, cộng dồn · chỉ vị trí đã có từ 10 CV',v:function(c,p){return c[p].cv?c[p].tt/c[p].cv*100:0;},f:function(v){return vn(v,1)+'%';},e:function(c,p){return c[p].cv>=10;}}];
  var FR=1300,HOLD=7000, el=document.getElementById('rv-race'); if(!el) return;
  if(R.chart){ try{R.chart.dispose();}catch(e){} } var rc=R.chart=echarts.init(el,null,{renderer:'canvas'});
  var sc=0,fr=0,userPause=false,inView=false,prev=null,hist=[];
  function $(id){return document.getElementById(id);}
  $('rv-scs').innerHTML=SC.map(function(s,i){return '<button class="rv-sc" data-i="'+i+'">'+(i+1)+'. '+s.n+'</button>';}).join('');
  [].forEach.call(document.querySelectorAll('.rv-sc'),function(b){ b.onclick=function(){ start(+b.getAttribute('data-i')); }; });
  $('rv-pp').onclick=function(){ userPause=!userPause; this.textContent=userPause?'▶ Chạy':'⏸ Dừng'; state(); if(!userPause&&inView){ clearTimeout(R.timer); tick(); } };
  function state(){ var s=$('rv-stt'); if(s) s.textContent=userPause?'Đã dừng':(inView?'Đang chạy':'Tạm dừng · đã cuộn khỏi khối này'); }
  if(R.io) R.io.disconnect();
  R.io=new IntersectionObserver(function(es){ es.forEach(function(e){ var was=inView; inView=e.isIntersecting; state(); if(inView&&!was&&!userPause){ clearTimeout(R.timer); tick(); } if(!inView) clearTimeout(R.timer); }); },{threshold:.35});
  R.io.observe($('rv-block'));
  function lg(m,cls,tag,h){ var L=$('rv-log'); if(!L) return; var e=document.createElement('div'); e.className='rv-lg'; e.innerHTML='<span class="m">'+mlab(m)+'</span><span class="rv-chip '+cls+'">'+tag+'</span><div>'+h+'</div>'; L.insertBefore(e,L.firstChild); while(L.children.length>9) L.removeChild(L.lastChild); }
  function rank(S,c){ return P.filter(function(p){return S.e(c,p);}).sort(function(a,b){return S.v(c,b)-S.v(c,a);}); }
  function start(i){ clearTimeout(R.timer); sc=i; fr=0; prev=null; hist=[]; var S=SC[i];
    [].forEach.call(document.querySelectorAll('.rv-sc'),function(b,k){ b.classList.toggle('on',k===i); });
    $('rv-t').textContent=S.t; $('rv-s').textContent=S.s; $('rv-log').innerHTML=''; $('rv-concl').innerHTML='<span class="rv-sub">Kết luận hiện khi chạy tới tháng cuối.</span>';
    rc.clear(); rc.setOption({grid:{left:8,right:64,top:6,bottom:24,containLabel:true},
      xAxis:{max:function(v){return S.k==='rate'?Math.ceil(v.max+1):Math.ceil(v.max*1.08);},minInterval:1,axisLabel:{showMaxLabel:false,color:'#7C879A',fontSize:11,formatter:function(v){return S.k==='rate'?v+'%':v;}},splitLine:{lineStyle:{color:'#263045',type:'dashed'}}},
      yAxis:{type:'category',inverse:true,max:9,data:[],animationDuration:300,animationDurationUpdate:300,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:'#E8ECF3',fontSize:12,fontFamily:PTFONT}},
      series:[{type:'bar',realtimeSort:true,barCategoryGap:'30%',data:[],itemStyle:{borderRadius:[0,4,4,0]},label:{show:true,position:'right',valueAnimation:true,color:'#E8ECF3',fontWeight:600,fontFamily:PTFONT,formatter:function(p){return S.f(p.value);}}}],
      graphic:[{type:'text',right:24,bottom:36,style:{text:'',fontSize:56,fontWeight:600,fontFamily:'Fraunces, Georgia, serif',fill:'rgba(167,176,194,.22)'}}],
      animationDuration:0,animationDurationUpdate:FR,animationEasing:'linear',animationEasingUpdate:'linear'});
    if(inView&&!userPause) tick(); }
  function tick(){ if(userPause||!inView||!document.getElementById('rv-block')) return; var S=SC[sc],c=CU[fr],m=MR[fr],rk=rank(S,c);
    rc.setOption({yAxis:{data:rk.map(dn)},series:[{data:rk.map(function(p,i){return {value:+S.v(c,p).toFixed(2),itemStyle:{color:i===0?'#9377E6':'#2FB59E'}};})}],graphic:[{style:{text:mlab(m)}}]});
    events(S,fr,rk); hist.push(rk[0]); prev={c:c,rk:rk};
    var b=$('rv-bar'); b.style.transition='none'; b.style.width=(fr/(MR.length-1)*80)+'%';
    if(fr<MR.length-1){ fr++; R.timer=setTimeout(tick,FR); }
    else{ concl(S,c,rk); b.style.transition='width '+HOLD+'ms linear'; requestAnimationFrame(function(){ b.style.width='100%'; }); R.timer=setTimeout(function(){ start((sc+1)%SC.length); },HOLD); } }
  function events(S,i,rk){ var m=MR[i],mo=MO[i],c=CU[i],sum=function(key){return Object.keys(mo).reduce(function(s,k){return s+mo[k][key];},0);},n=0,cur=(m===curK());
    var cv=sum('cv'); if(!cv){ lg(m,'rv-wa','Trống','Không có CV mới.'); return; }
    if(cur&&S.k!=='rate'){ lg(m,'rv-in','Đang diễn ra','Tháng chưa hết, mới có '+cv+' CV, chưa so sánh với tháng trước.'); if(S.k!=='cv') return; }
    if(S.k==='cv'){ var g=Object.keys(mo).map(function(k){return [k,mo[k]];}).sort(function(a,b){return b[1].cv-a[1].cv;}), pcv=i?Object.keys(MO[i-1]).reduce(function(s,k){return s+MO[i-1][k].cv;},0):0;
      if(i&&pcv&&!cur){ var d=(cv-pcv)/pcv*100; if(d>=100){ lg(m,'rv-ok','Tăng mạnh','Tổng CV gấp '+vn(cv/pcv,1)+' lần tháng trước ('+pcv+' → '+cv+').'); n++; } else if(d<=-50){ lg(m,'rv-er','Giảm mạnh','Tổng CV giảm '+vn(-d,0)+'% ('+pcv+' → '+cv+').'); n++; } }
      if(g[0][1].cv>=20){ lg(m,'rv-in','Bùng nổ','<b>'+E(dn(g[0][0]))+'</b> +'+g[0][1].cv+' CV ('+vn(g[0][1].cv/cv*100,0)+'% CV tháng).'); n++; }
      Object.keys(mo).forEach(function(p){ if(prev&&prev.c[p]&&!prev.c[p].cv){ lg(m,'rv-ok','Mới','Bắt đầu nhận CV <b>'+E(dn(p))+'</b> ('+mo[p].cv+').'); n++; } });
      if(prev&&prev.rk[0]&&rk[0]!==prev.rk[0]){ lg(m,'rv-wa','Đổi ngôi','<b>'+E(dn(rk[0]))+'</b> vượt <b>'+E(dn(prev.rk[0]))+'</b> lên dẫn đầu.'); n++; }
      if(!n) lg(m,'rv-in','Ổn định',cv+' CV mới, nhiều nhất <b>'+E(dn(g[0][0]))+'</b> ('+g[0][1].cv+').'); }
    if(S.k==='v1'){ var v=sum('v1'), g2=Object.keys(mo).filter(function(k){return mo[k].v1;}).sort(function(a,b){return mo[b].v1-mo[a].v1;});
      if(!v) lg(m,cv>=10?'rv-wa':'rv-in',cv>=10?'Chưa ai':'Ít CV',cv+' CV, chưa ai qua vòng 1.');
      else{ var r=v/cv*100; lg(m,r>50&&cv>=10?'rv-er':'rv-ok',r>50&&cv>=10?'Cao bất thường':'Qua V1',v+'/'+cv+' CV qua V1 ('+vn(r,0)+'%), nhiều nhất <b>'+E(dn(g2[0]))+'</b> ('+mo[g2[0]].v1+').'+(r>50&&cv>=10?' Cao hơn hẳn các tháng khác, nên kiểm tra nhập liệu.':'')); }
      if(prev&&prev.rk[0]&&rk[0]!==prev.rk[0]&&S.v(c,rk[0])>S.v(c,prev.rk[0])) lg(m,'rv-wa','Đổi ngôi','<b>'+E(dn(rk[0]))+'</b> lên dẫn đầu.'); }
    if(S.k==='tt'){ var h=Object.keys(mo).filter(function(k){return mo[k].tt;});
      if(h.length) lg(m,'rv-ok','Tuyển được',h.map(function(k){return '<b>'+E(dn(k))+'</b> +'+mo[k].tt;}).join(', ')+' (từ '+cv+' CV).'); else lg(m,cv>=10?'rv-er':'rv-wa',cv>=10?'Chưa tuyển':'Ít CV',cv+' CV, chưa ai trúng tuyển.');
      if(prev&&prev.rk[0]&&rk[0]!==prev.rk[0]&&S.v(c,rk[0])>S.v(c,prev.rk[0])) lg(m,'rv-wa','Đổi ngôi','<b>'+E(dn(rk[0]))+'</b> dẫn đầu số trúng tuyển.'); }
    if(S.k==='rate'){ Object.keys(mo).forEach(function(p){ if(!S.e(c,p)) return; if(!prev||!S.e(prev.c,p)){ lg(m,'rv-in','Vào bảng','<b>'+E(dn(p))+'</b> đủ 10 CV, đậu '+vn(S.v(c,p),1)+'%.'); n++; }
        else{ var d=S.v(c,p)-S.v(prev.c,p); if(Math.abs(d)>=1){ var why=d<0&&mo[p].cv>=10&&mo[p].tt===0?' Do '+mo[p].cv+' CV mới chưa ai trúng tuyển.':''; lg(m,d>0?'rv-ok':'rv-er',d>0?'Tăng':'Giảm','<b>'+E(dn(p))+'</b> '+(d>0?'+':'')+vn(d,1)+' điểm → '+vn(S.v(c,p),1)+'%.'+why); n++; } } });
      if(!n) lg(m,'rv-in','Ổn định',rk.length?'Dẫn đầu <b>'+E(dn(rk[0]))+'</b> '+vn(S.v(c,rk[0]),1)+'%.':'Chưa vị trí nào đủ 10 CV.'); } }
  function concl(S,c,rk){ var box=$('rv-concl'); if(!box||!rk.length) return; var tot=P.reduce(function(s,p){return s+c[p].cv;},0), tt=P.reduce(function(s,p){return s+c[p].tt;},0), L=[];
    var since=hist.length-1; while(since>0&&hist[since-1]===rk[0]) since--;
    var lead='<b>'+E(dn(rk[0]))+'</b> dẫn đầu với <b>'+S.f(S.v(c,rk[0]))+'</b>'+(since>0?', giữ ngôi từ tháng '+mlab(MR[since])+'.':', dẫn đầu suốt cả kỳ.');
    var ch=0; for(var i=1;i<hist.length;i++) if(hist[i]!==hist[i-1]) ch++;
    if(ch) L.push('Ngôi đầu đổi chủ <b>'+ch+' lần</b>: '+hist.filter(function(x,i){return !i||x!==hist[i-1];}).map(function(x){return E(dn(x));}).join(' → ')+'.');
    if(S.k==='cv'){ var t3=rk.slice(0,3).reduce(function(s,p){return s+c[p].cv;},0); L.push('3 vị trí đầu chiếm <b>'+vn(t3/tot*100,1)+'%</b> tổng CV.'); var pk=MS.slice().sort(function(a,b){return b.cv-a.cv;})[0]; L.push('Tháng nhiều CV nhất: '+mlab(pk.k)+' ('+pk.cv+' CV).'); L.push('Ít CV nhất: '+rk.slice(-3).map(function(p){return E(dn(p))+' ('+c[p].cv+')';}).join(', ')+'.'); }
    if(S.k==='v1'){ var rr=rk.filter(function(p){return c[p].cv>=10;}).map(function(p){return {p:p,r:c[p].v1/c[p].cv*100};}); if(rr.length){ var med=rr.map(function(x){return x.r;}).sort(function(a,b){return a-b;})[Math.floor(rr.length/2)], hi=rr.filter(function(x){return x.r>Math.max(50,med*3);});
      L.push('Tỷ lệ CV qua vòng 1 thường ở mức <b>'+vn(med,0)+'%</b> (trung vị các vị trí từ 10 CV).'); if(hi.length) L.push('<span class="rv-chip rv-er">Bất thường</span> '+hi.map(function(x){return '<b>'+E(dn(x.p))+'</b> '+vn(x.r,0)+'% ('+c[x.p].v1+'/'+c[x.p].cv+')';}).join(', ')+': cao gấp nhiều lần mức chung, nên kiểm tra nhập liệu.'); } }
    if(S.k==='tt'){ var z=P.filter(function(p){return c[p].cv>=5&&!c[p].tt;}); L.push('Tổng <b>'+tt+'</b> người trúng tuyển từ '+tot+' CV.'); if(z.length) L.push('<span class="rv-chip rv-er">Cần xem</span> Có từ 5 CV mà chưa tuyển được ai: '+z.map(function(p){return '<b>'+E(dn(p))+'</b> ('+c[p].cv+' CV)';}).join(', ')+'.'); var bh=MS.slice().sort(function(a,b){return b.hire-a.hire;})[0]; L.push('Tháng tuyển được nhiều nhất: '+mlab(bh.k)+' ('+bh.hire+' người).'); }
    if(S.k==='rate'){ var av=tt/tot*100, g=rk.filter(function(p){return S.v(c,p)>=av;}), b=rk.filter(function(p){return S.v(c,p)<av;}); L.push('Trung bình công ty <b>'+vn(av,1)+'%</b>.');
      if(g.length) L.push('<span class="rv-chip rv-ok">Từ TB trở lên</span> '+g.map(function(p){return E(dn(p))+' '+vn(S.v(c,p),1)+'%';}).join(', ')+'.'); if(b.length) L.push('<span class="rv-chip rv-er">Dưới TB</span> '+b.map(function(p){return E(dn(p))+' '+vn(S.v(c,p),1)+'%';}).join(', ')+'.');
      var unf=rk.filter(function(p){return c[p].cv-c[p].fin>=10;}); if(unf.length) L.push('Còn nhiều CV chưa có kết quả ở '+unf.map(function(p){return E(dn(p))+' ('+(c[p].cv-c[p].fin)+')';}).join(', ')+', nên tỷ lệ của các vị trí này sẽ còn thay đổi.'); }
    box.innerHTML='<div style="font-size:13px;color:#D2D8E3">'+lead+'</div><ul>'+L.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>'; }
  start(0); state();
}

/* ---------- bọc router: chạy go() cũ trước, rồi gắn phần mới ---------- */
var prevGo=window.__rvPrevGo||window.go; window.__rvPrevGo=prevGo;
window.go=function(id){
  clearTimeout(R.timer); if(R.io){ R.io.disconnect(); R.io=null; }
  var out=prevGo.apply(this,arguments);
  try{
    if(id!==TAB||!window.HR||!HR.loaded||!(HR.tuyendung||[]).length) return out;
    var content=document.getElementById('content'), head=content&&content.querySelector('.page-head'); if(!head) return out;
    css();
    var w=document.createElement('div'); w.innerHTML=raceHtml(); head.parentNode.insertBefore(w.firstChild,head.nextSibling);
    setTimeout(function(){ try{ startRace(); }catch(e){ console.warn('[rv] race',e); } },60);
    setTimeout(function(){ try{ enhance(); }catch(e){ console.warn('[rv] enhance',e); } },160);
  }catch(e){ console.warn('[rv]',e); }
  return out;
};
if(window.currentTab===TAB && window.HR && HR.loaded){ try{ window.go(TAB); }catch(e){} }
})();
