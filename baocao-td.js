/* ============================================================
   BigX HR — baocao-td.js  (tab Báo cáo: chỉ còn TUYỂN DỤNG — mockup đã duyệt 12/10/2026)
   - Thay phần hiển thị của tab Báo cáo bằng báo cáo tuyển dụng chi tiết (7 phần) + xuất PDF A4 chuẩn.
   - KHÔNG sửa app.js: bản gốc vẫn còn ở window.__bcOrigRender / window.__bcOrigPDF (gỡ file này là về như cũ).
   - Dùng lại state/hàm sẵn có: window.__bc, bcPeriod, bcLabel, bcDMY, bcSetMode, bcStep, bcStyle, parseDMY.
   - Chỉ đọc HR.tuyendung. Mọi số và câu đánh giá tự tính lại theo kỳ đang chọn.
   ============================================================ */
(function(){
'use strict';
if(window.__btLoaded) return; window.__btLoaded=true;
window.__bcOrigRender=window.__bcOrigRender||window.renderBaoCao;
window.__bcOrigPDF=window.__bcOrigPDF||window.bcExportPDF;

/* ---------------- tiện ích ---------------- */
var DN={'Custormer Account Manager':'Customer Account Manager','Marketing excu':'Marketing Executive'}; // chỉ đổi tên HIỂN THỊ
function dn(v){ return DN[v]||v; }
function E(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function vn(x,d){ if(x==null||isNaN(x)) return '—'; return Number(x).toLocaleString('vi-VN',{minimumFractionDigits:d==null?0:d,maximumFractionDigits:d==null?1:d}); }
function pc(a,b){ return b?a/b*100:null; }
var PASS=['SCAN CV PASS','PHÙ HỢP','PASS','PASS','TRÚNG TUYỂN'], KEYS=['hrReview','lmReview','r1','r2','final'];
var STEP=['CV nộp','HR duyệt CV','Line Manager duyệt','Phỏng vấn vòng 1','Phỏng vấn vòng 2','Trúng tuyển'];
var WS=['Chờ HR duyệt','Chờ LM duyệt','Chờ phỏng vấn V1','Chờ phỏng vấn V2','Chờ kết quả cuối'];
var AG=[[0,3,'≤3 ngày'],[4,7,'4–7 ngày'],[8,14,'8–14 ngày'],[15,1e9,'>14 ngày']];
function tv(c,k){ return String(c[k]||'').trim(); }
function lv(c){ var m=0; KEYS.forEach(function(k,i){ if(tv(c,k)===PASS[i]) m=i+1; }); return m; }      // = cách đếm tdFunnel
function fn(l){ var a=[l.length,0,0,0,0,0]; l.forEach(function(c){ var m=lv(c); for(var i=1;i<=m;i++) a[i]++; }); return a; }
function closed(c){ if(tv(c,'final')) return true; return ['hrReview','lmReview','r1','r2'].some(function(k){ return /FAIL|KHÔNG PHÙ HỢP|KHÔNG THAM GIA/.test(tv(c,k)); }); }
function waitStep(c){ if(closed(c)) return null; var hr=tv(c,'hrReview'),lm=tv(c,'lmReview'),r1=tv(c,'r1'),r2=tv(c,'r2');
  if(hr!=='SCAN CV PASS'&&lm!=='PHÙ HỢP'&&r1!=='PASS') return WS[0]; if(lm!=='PHÙ HỢP'&&r1!=='PASS') return WS[1];
  if(r1!=='PASS') return WS[2]; if(r2!=='PASS') return WS[3]; return WS[4]; }
function posOf(c){ return tv(c,'viTri')||'(trống)'; }
function anomalies(list){ var g={}; list.forEach(function(r){ (g[posOf(r)]=g[posOf(r)]||[]).push(r); }); var out=[];
  Object.keys(g).forEach(function(k){ var f=fn(g[k]),hit=false;
    for(var i=2;i<6;i++){ var r=f[i-1]?f[i]/f[i-1]:null, rp=f[i-2]?f[i-1]/f[i-2]:null; if(r!=null&&rp!=null&&f[i]>0&&f[i-1]>=10&&rp>0.8&&r<0.05){hit=true;break;} }
    if(!hit&&f[3]>=5&&f[4]===0) hit=true; if(hit) out.push(k); });
  return out; }
function DMY(d){ return (typeof bcDMY==='function')?bcDMY(d):d.toLocaleDateString('vi-VN'); }

/* ---------------- TÍNH TOÀN BỘ SỐ LIỆU + ĐÁNH GIÁ cho 1 kỳ ---------------- */
function compute(){
  var mode=window.__bc.mode, off=window.__bc.off, W=mode==='week';
  var p=bcPeriod(mode,off), pv=bcPeriod(mode,off-1), today=new Date(); today.setHours(0,0,0,0);
  var ALL=(HR.tuyendung||[]).map(function(c){ return {c:c,d:parseDMY(c.ngayNop)}; }).filter(function(x){return x.d;});
  var inP=function(x,q){ return x.d>=q.start&&x.d<=q.end; };
  var L=ALL.filter(function(x){return inP(x,p);}).map(function(x){return x.c;}), Lp=ALL.filter(function(x){return inP(x,pv);}).map(function(x){return x.c;});
  var all=ALL.map(function(x){return x.c;}), f=fn(L), fp=fn(Lp), FA=fn(all);
  var pend=L.filter(waitStep).length, hrR=pc(f[1],f[0]), hrAll=pc(FA[1],FA[0]);
  var cv=f.map(function(x,i){return i&&f[i-1]?x/f[i-1]*100:null;}), cvp=fp.map(function(x,i){return i&&fp[i-1]?x/fp[i-1]*100:null;});
  /* xu hướng */
  var hist=[]; for(var i=(W?7:5);i>=0;i--){ var q=bcPeriod(mode,off-i); var l=ALL.filter(function(x){return inP(x,q);}).map(function(x){return x.c;}), ff=fn(l);
    hist.push({lab:W?DMY(q.start).slice(0,5):'T'+(q.start.getMonth()+1)+'/'+String(q.start.getFullYear()).slice(2),cv:ff[0],hr:ff[1],tt:ff[5],cur:i===0}); }
  var prevH=hist.slice(0,-1), avg=prevH.reduce(function(s,x){return s+x.cv;},0)/Math.max(prevH.length,1);
  /* theo vị trí */
  var pos={}; L.forEach(function(c){ (pos[posOf(c)]=pos[posOf(c)]||[]).push(c); }); var posP={}; Lp.forEach(function(c){ posP[posOf(c)]=(posP[posOf(c)]||0)+1; });
  var PR=Object.keys(pos).map(function(k){ return {k:k,f:fn(pos[k]),pend:pos[k].filter(waitStep).length,prev:posP[k]||0}; }).sort(function(a,b){return b.f[0]-a.f[0];});
  var recent={}; ALL.forEach(function(x){ var a=(p.end-x.d)/864e5; if(a>=0&&a<=60) recent[posOf(x.c)]=1; }); var silent=Object.keys(recent).filter(function(k){return !pos[k];});
  var anomIn=anomalies(L);
  /* theo ngày */
  var labs,vals; if(W){ labs=['T2','T3','T4','T5','T6','T7','CN']; vals=[0,0,0,0,0,0,0]; L.forEach(function(c){ vals[(parseDMY(c.ngayNop).getDay()+6)%7]++; }); }
  else{ var nd=p.end.getDate(); labs=[]; vals=[]; for(var k=1;k<=nd;k++){labs.push(String(k));vals.push(0);} L.forEach(function(c){ vals[parseDMY(c.ngayNop).getDate()-1]++; }); }
  /* tồn đọng (ảnh chụp hiện tại, toàn bộ) */
  var BL={},BP={}; ALL.forEach(function(x){ var w=waitStep(x.c); if(!w) return; var age=Math.max(0,Math.floor((today-x.d)/864e5)); var gi=0; AG.forEach(function(a,j){ if(age>=a[0]&&age<=a[1]) gi=j; });
    (BL[w]=BL[w]||[0,0,0,0,0])[gi]++; BL[w][4]++; if(age>7) BP[posOf(x.c)]=(BP[posOf(x.c)]||0)+1; });
  var old7=0; WS.forEach(function(w){ if(BL[w]) old7+=BL[w][2]+BL[w][3]; }); var totBL=WS.reduce(function(s,w){return s+(BL[w]?BL[w][4]:0);},0);
  var bpe=Object.keys(BP).map(function(k){return [k,BP[k]];}).sort(function(a,b){return b[1]-a[1];});

  var R={pendP:Lp.filter(waitStep).length,W:W,mode:mode,off:off,p:p,pv:pv,f:f,fp:fp,cv:cv,cvp:cvp,pend:pend,hrR:hrR,hrAll:hrAll,hist:hist,avg:avg,PR:PR,silent:silent,anomIn:anomIn,labs:labs,vals:vals,BL:BL,old7:old7,totBL:totBL,bpe:bpe,ev:{}};
  var it;
  /* 1. tóm tắt */
  var sm=[]; if(!f[0]) sm.push('Kỳ '+bcLabel(mode,p)+' <b>chưa có CV mới</b>'+(off===0?' (kỳ đang diễn ra).':'.'));
  else{ var dd=fp[0]?(f[0]-fp[0])/fp[0]*100:null;
    sm.push('Kỳ này nhận <b>'+f[0]+' CV</b>'+(dd==null?'':' ('+(dd>200?'gấp '+vn(f[0]/fp[0],1)+' lần':(dd>=0?'tăng ':'giảm ')+vn(Math.abs(dd),0)+'%')+' so với kỳ trước)')+', chủ yếu từ <b>'+E(dn(PR[0].k))+'</b> ('+PR[0].f[0]+' CV).');
    sm.push('<b>'+f[1]+'</b> CV qua HR duyệt ('+vn(hrR,1)+'%, mức chung là '+vn(hrAll,1)+'%), '+f[3]+' người qua phỏng vấn vòng 1, <b>'+f[5]+'</b> người trúng tuyển.');
    if(pend) sm.push('<b>'+pend+'</b> CV ('+vn(pc(pend,f[0]),0)+'%) vẫn chưa có kết quả.'); }
  if(old7) sm.push('Toàn hệ thống đang có <b>'+old7+' CV tồn quá 7 ngày</b> chưa xử lý xong.');
  /* [CTV] gộp CTV Booking KOC vào cùng báo cáo (22/10/2026) */
  R.ctv=(typeof window.ctvReport==='function')?window.ctvReport(p,pv):null;
  if(sm.length) sm[0]='<b>Inhouse:</b> '+sm[0];
  if(R.ctv&&R.ctv.sum) sm.push('<br>'+R.ctv.sum.replace(/^CTV Booking KOC:/,'<b>CTV Booking KOC:</b>'));
  R.summary=sm.join(' ');
  /* 2. phễu */
  it=[]; if(f[0]){ var waitAt=function(j){ return L.filter(function(c){return waitStep(c)===WS[j-1];}).length; }; var mi=-1,mm=1e9,sk=0;
    for(var j=1;j<6;j++){ if(f[j-1]>=5&&cv[j]!=null){ if(waitAt(j)>=f[j-1]*0.5){sk++;continue;} if(cv[j]<mm){mm=cv[j];mi=j;} } }
    if(mi<0&&sk) it.push(['in','Phần lớn CV kỳ này còn đang chờ xử lý nên chưa đủ kết quả để xác định bước nghẽn.','Chưa đánh giá được']);
    if(mi>0) it.push([mm<10?'er':mm<35?'wa':'in','Bước rơi nhiều nhất là <b>'+STEP[mi]+'</b>: '+f[mi]+'/'+f[mi-1]+' người qua ('+vn(mm,1)+'%).'+(cvp[mi]!=null&&fp[mi-1]>=5?' Kỳ trước bước này là '+vn(cvp[mi],1)+'%.':''),'Nghẽn']);
    if(hrR!=null){ var dh=hrR-hrAll; it.push([Math.abs(dh)<10?'in':dh>0?'ok':'wa','Tỷ lệ qua HR duyệt <b>'+vn(hrR,1)+'%</b>, '+(dh>=0?'cao':'thấp')+' hơn mức chung '+vn(Math.abs(dh),1)+' điểm %. '+(dh<-10?'CV kỳ này kém phù hợp hơn thường lệ, nên xem lại nội dung tin đăng hoặc kênh nhận CV.':dh>10?'Chất lượng CV đầu vào tốt hơn thường lệ.':'Chất lượng CV đầu vào ở mức bình thường.'),'Chất lượng CV']); }
    if(pend&&pc(pend,f[0])>=30) it.push(['wa','<b>'+vn(pc(pend,f[0]),0)+'%</b> CV kỳ này chưa có kết quả, nên các tỷ lệ ở bước sau còn thay đổi.','Chưa xong']);
    if(anomIn.length) it.push(['er','Dữ liệu bất thường ở <b>'+anomIn.map(function(k){return E(dn(k));}).join(', ')+'</b> (gần như tất cả qua 1 vòng rồi rớt hết ở vòng sau). Cần kiểm tra lại file trước khi đọc phễu.','Dữ liệu']); }
  R.ev.fun=it;
  /* 3. theo ngày */
  it=[]; if(f[0]){ var mx=Math.max.apply(null,vals), mxi=vals.indexOf(mx), sh=mx/f[0]*100;
    it.push([sh>=50?'wa':'in',(W?'<b>'+labs[mxi]+'</b>':'Ngày <b>'+labs[mxi]+'</b>')+' nhận nhiều CV nhất: '+mx+' CV ('+vn(sh,0)+'% cả kỳ).'+(sh>=50?' CV dồn vào một ngày, thường là ngày đăng tin hoặc nạp CV theo lô.':''),'Ngày cao điểm']);
    var zero=vals.filter(function(v,i){return !v&&i<5;}).length; if(W&&zero>=3) it.push(['in',zero+'/5 ngày làm việc không có CV mới.','Ngày trống']); }
  R.ev.day=it;
  /* 4. xu hướng */
  var nz=prevH.filter(function(h){return h.cv;}).length;
  it=[[f[0]>=avg*1.5&&f[0]>=5?'ok':f[0]<avg*0.5?'wa':'in','Kỳ này <b>'+f[0]+'</b> CV, trung bình '+prevH.length+(W?' tuần':' tháng')+' trước là <b>'+vn(avg,1)+'</b> CV/kỳ'+(nz<prevH.length?' ('+(prevH.length-nz)+' kỳ không có CV nào)':'')+'.','So với trung bình']];
  var last3=hist.slice(-3).reduce(function(s,h){return s+h.tt;},0); it.push([last3?'in':'wa',last3?'3 kỳ gần nhất có '+last3+' người trúng tuyển (tính theo kỳ nộp CV).':'<b>3 kỳ gần nhất chưa có ai trúng tuyển</b> (tính theo kỳ nộp CV).','Kết quả tuyển']);
  R.ev.tr=it;
  /* 5. vị trí */
  it=[]; if(PR.length){ var top=PR[0]; if(PR.length>1&&pc(top.f[0],f[0])>=60) it.push(['in','<b>'+E(dn(top.k))+'</b> chiếm '+vn(pc(top.f[0],f[0]),0)+'% CV kỳ này.','Tập trung']);
    PR.filter(function(r){return r.f[0]>=5&&!r.f[1]&&r.pend<r.f[0];}).forEach(function(r){ it.push(['wa','<b>'+E(dn(r.k))+'</b>: '+r.f[0]+' CV nhưng không ai qua HR duyệt. Nguồn CV có thể chưa đúng đối tượng.','Không đạt']); });
    var cand=PR.filter(function(r){return r.f[0]>=5&&anomIn.indexOf(r.k)<0;}); var best=cand.length>=2&&cand.sort(function(a,b){return (b.f[1]/b.f[0])-(a.f[1]/a.f[0]);})[0];
    if(best&&best.f[1]) it.push(['ok','<b>'+E(dn(best.k))+'</b> có tỷ lệ qua HR cao nhất: '+best.f[1]+'/'+best.f[0]+' ('+vn(best.f[1]/best.f[0]*100,0)+'%).','Tốt nhất']);
    var hires=PR.filter(function(r){return r.f[5];}); if(hires.length) it.push(['ok','Trúng tuyển: '+hires.map(function(r){return '<b>'+E(dn(r.k))+'</b> '+r.f[5];}).join(', ')+'.','Tuyển được']); }
  if(silent.length) it.push(['wa','Có CV trong 60 ngày qua nhưng <b>kỳ này không có CV mới</b>: '+silent.map(function(k){return E(dn(k));}).join(', ')+'. Nếu vẫn đang tuyển, nên đăng tin lại.','Không có CV']);
  R.ev.pos=it;
  /* 6. tồn đọng */
  it=[]; if(old7) it.push([BL[WS[0]]&&BL[WS[0]][3]>=10?'er':'wa','<b>'+old7+'/'+totBL+'</b> CV tồn quá 7 ngày, nhiều nhất ở '+bpe.slice(0,3).map(function(x){return '<b>'+E(dn(x[0]))+'</b> ('+x[1]+')';}).join(', ')+'. Ứng viên chờ lâu dễ nhận việc nơi khác.','Tồn lâu']);
  var wmax=WS.filter(function(w){return BL[w];}).sort(function(a,b){return BL[b][4]-BL[a][4];})[0];
  if(wmax) it.push(['in','Nhiều CV đang dừng ở bước <b>'+wmax.replace('Chờ ','')+'</b> nhất: '+BL[wmax][4]+' CV ('+vn(pc(BL[wmax][4],totBL),0)+'% số tồn).','Ứ ở bước']);
  if(!totBL) it.push(['ok','Không có CV tồn đọng.']); R.ev.age=it;
  /* 7. việc cần làm */
  var td=[], g=function(w){ return BL[w]||[0,0,0,0,0]; };
  var n7=g(WS[0])[2]+g(WS[0])[3]; if(n7) td.push([0,'Duyệt <b>'+n7+' CV</b> đã chờ HR quá 7 ngày'+(bpe[0]?', ưu tiên <b>'+E(dn(bpe[0][0]))+'</b>':'')+'.','HR']);
  anomIn.forEach(function(k){ td.push([0,'Kiểm tra lại dữ liệu phỏng vấn của <b>'+E(dn(k))+'</b> trong file Tuyển dụng.','HR']); });
  if(g(WS[1])[4]) td.push([1,'Nhắc Line Manager duyệt <b>'+g(WS[1])[4]+' CV</b> HR đã chuyển.','Line Manager']);
  if(g(WS[2])[4]) td.push([1,'Xếp lịch phỏng vấn vòng 1 cho <b>'+g(WS[2])[4]+' ứng viên</b> đã qua LM.','HR']);
  var n2=g(WS[3])[4]+g(WS[4])[4]; if(n2) td.push([1,'Chốt kết quả vòng 2 / offer cho <b>'+n2+' ứng viên</b>.','HR + Quản lý']);
  if(silent.length) td.push([2,'Xem lại tin tuyển của '+silent.length+' vị trí kỳ này không có CV mới: <b>'+silent.map(function(k){return E(dn(k));}).join(', ')+'</b>. Đăng lại nếu vẫn đang tuyển, hoặc đánh dấu đã đóng.','HR']);
  PR.filter(function(r){return r.f[0]>=5&&!r.f[1]&&r.pend<r.f[0];}).forEach(function(r){ td.push([2,'Đổi kênh hoặc sửa tin đăng <b>'+E(dn(r.k))+'</b>: chưa có CV đạt HR.','HR']); });
  if(R.ctv) R.ctv.todo.forEach(function(x){ td.push(x); }); // [CTV]
  td.sort(function(a,b){return a[0]-b[0];}); R.todo=td;
  return R;
}

/* ---------------- dựng HTML (dùng chung cho màn hình & PDF) ---------------- */
var CH={er:['er','Nghiêm trọng'],wa:['wa','Cảnh báo'],ok:['ok','Tốt'],in:['in','Lưu ý']};
function evHtml(items){ var o={er:0,wa:1,ok:2,in:3}; items=items.slice().sort(function(a,b){return o[a[0]]-o[b[0]];});
  return '<div class="bt-ev"><h4>ĐÁNH GIÁ</h4>'+(items.length?items.map(function(x){ return '<div class="bt-evi"><span class="bt-chip '+CH[x[0]][0]+'">'+(x[2]||CH[x[0]][1])+'</span><div>'+x[1]+'</div></div>'; }).join(''):'<div class="bt-mute">Chưa đủ dữ liệu để đánh giá.</div>')+'</div>'; }
function dlt(cur,prev,goodUp){ var d=cur-prev; if(d===0) return '<span class="bt-d fl">— bằng kỳ trước</span>'; var up=d>0, good=up===goodUp;
  return '<span class="bt-d '+(good?'up':'dn')+'">'+(up?'▲':'▼')+' '+Math.abs(d)+'</span> <span class="bt-mute">vs '+prev+'</span>'; }
function kpiHtml(R){ var f=R.f,fp=R.fp;
  return [['CV mới nhận',f[0],dlt(f[0],fp[0],true)],['Qua HR duyệt',f[1],(f[0]?vn(R.hrR,1)+'% số CV · ':'')+dlt(f[1],fp[1],true)],['Qua phỏng vấn V1',f[3],dlt(f[3],fp[3],true)],['Trúng tuyển',f[5],dlt(f[5],fp[5],true)],['Chưa có kết quả',R.pend,f[0]?vn(pc(R.pend,f[0]),0)+'% CV kỳ này':'']]
    .map(function(k){ return '<div class="bt-kpi"><div class="t">'+k[0]+'</div><div class="v">'+k[1]+'</div><div class="s">'+k[2]+'</div></div>'; }).join(''); }
function posTable(R){ var f=R.f;
  var th='<tr><th>Vị trí</th><th>CV</th><th>HR duyệt</th><th>LM duyệt</th><th>Qua V1</th><th>Qua V2</th><th>Trúng tuyển</th><th>Chưa có KQ</th><th>vs kỳ trước</th></tr>';
  var rows=R.PR.map(function(r){ var cells=[1,2,3,4,5].map(function(i){ var x=r.f[i], pr=r.f[i-1]?x/r.f[i-1]*100:null; var cls=pr!=null&&r.f[i-1]>=5&&pr<20&&r.pend<r.f[0]*0.5?'bad':'';
      return '<td class="'+cls+'">'+x+(pr!=null&&r.f[i-1]?'<small>'+vn(pr,0)+'%</small>':'')+'</td>'; }).join(''); var d=r.f[0]-r.prev;
    return '<tr><td>'+E(dn(r.k))+'</td><td><b>'+r.f[0]+'</b></td>'+cells+'<td class="'+(r.pend&&r.pend>=r.f[0]*0.5?'warn':'')+'">'+r.pend+'</td><td>'+(r.prev?'<span class="bt-d '+(d>=0?'up':'dn')+'">'+(d>=0?'▲':'▼')+' '+Math.abs(d)+'</span>':'<span class="bt-d fl">mới</span>')+'</td></tr>'; }).join('');
  if(R.PR.length) rows+='<tr class="tot"><td>Tổng</td><td>'+f[0]+'</td>'+[1,2,3,4,5].map(function(i){return '<td>'+f[i]+(f[i-1]?'<small>'+vn(f[i]/f[i-1]*100,0)+'%</small>':'')+'</td>';}).join('')+'<td>'+R.pend+'</td><td>'+(R.fp[0]?'<span class="bt-d '+(f[0]>=R.fp[0]?'up':'dn')+'">'+(f[0]>=R.fp[0]?'▲':'▼')+' '+Math.abs(f[0]-R.fp[0])+'</span>':'—')+'</td></tr>';
  return '<table class="bt-t">'+th+(rows||'<tr><td colspan="9" class="bt-mute">Không có CV mới trong kỳ.</td></tr>')+'</table>'; }
function ageTable(R){ var BL=R.BL, cls=['a0','a1','a2','a3'];
  var h='<tr><th>Đang chờ</th>'+AG.map(function(a){return '<th>'+a[2]+'</th>';}).join('')+'<th>Tổng</th></tr>';
  h+=WS.filter(function(w){return BL[w];}).map(function(w){ return '<tr><td>'+w+'</td>'+BL[w].slice(0,4).map(function(x,i){ return '<td>'+(x?'<span class="bt-age '+cls[i]+'">'+x+'</span>':'<span class="bt-zero">0</span>')+'</td>'; }).join('')+'<td><b>'+BL[w][4]+'</b></td></tr>'; }).join('');
  h+='<tr class="tot"><td>Tổng</td>'+[0,1,2,3].map(function(i){ return '<td>'+WS.reduce(function(s,w){return s+(BL[w]?BL[w][i]:0);},0)+'</td>'; }).join('')+'<td>'+R.totBL+'</td></tr>';
  return R.totBL?'<table class="bt-t">'+h+'</table>':'<div class="bt-mute">Không có CV tồn đọng.</div>'; }
function todoHtml(R){ return R.todo.length?'<ol class="bt-todo">'+R.todo.map(function(x){ return '<li><div>'+x[1]+'</div><span class="who">'+x[2]+'</span></li>'; }).join('')+'</ol>':'<div class="bt-mute">Không có việc tồn.</div>'; }
function sec(n,title,cap,body){ return '<div class="bt-sec"><div class="bt-sh"><span class="n">'+n+'</span><h3>'+title+'</h3></div>'+(cap?'<div class="bt-cap">'+cap+'</div>':'')+body+'</div>'; }
var NOTE='Cách tính: phễu đếm theo bước xa nhất đã qua (giống tab Hiệu quả tuyển dụng). CV được gán vào kỳ theo <b>ngày nộp</b>. Dữ liệu chưa có ngày của từng bước (ngày HR duyệt, ngày phỏng vấn…), nên báo cáo theo dõi "các CV nộp trong kỳ đã đi tới đâu", chưa đếm được "trong kỳ đã phỏng vấn bao nhiêu người".';
function sections(R,charts){ // charts: {fun,day,tr} = html (div cho màn hình / img cho PDF)
  /* [28/10/2026] Kỳ không có CV inhouse → ẩn toàn bộ phần inhouse, chỉ còn CTV (mockup duyệt 28/10) */
  if(!R.f[0]) return ['<div class="bt-hid">Tuyển dụng inhouse: kỳ này không có CV mới, phần này được ẩn.</div>'].concat(R.ctv?[R.ctv.html(sec,evHtml,1)]:[]);
  return [
    sec(1,'Tóm tắt kỳ','', '<div class="bt-sum">'+R.summary+'</div>'),
    '<div class="bt-kpis">'+kpiHtml(R)+'</div>',
    sec(2,'Phễu của CV nộp trong kỳ','Kết quả tính đến hôm nay của các CV nộp trong kỳ, so với CV nộp kỳ trước · % = tỷ lệ qua bước',charts.fun+evHtml(R.ev.fun)),
    '<div class="bt-g2">'+sec(3,'CV mới theo ngày','Số CV nộp theo '+(R.W?'ngày trong tuần':'ngày trong tháng'),charts.day+evHtml(R.ev.day))
      +sec(4,'Xu hướng','CV mới '+(R.W?'8 tuần':'6 tháng')+' gần nhất (cột tím = kỳ đang xem) · đường: % qua HR duyệt',charts.tr+evHtml(R.ev.tr))+'</div>',
    sec(5,'Theo vị trí','CV nộp trong kỳ và kết quả hiện tại theo từng bước · cột cuối so lượng CV với kỳ trước','<div class="bt-scroll">'+posTable(R)+'</div>'+evHtml(R.ev.pos)),
    sec(6,'CV tồn đọng (tính đến hôm nay)','Tất cả CV chưa có kết quả, không riêng kỳ này · chia theo bước đang chờ và số ngày từ lúc nộp','<div class="bt-scroll">'+ageTable(R)+'</div>'+evHtml(R.ev.age)),
  ].concat(R.ctv?[R.ctv.html(sec,evHtml,7)]:[]).concat([ // [CTV] phần 7–10 = CTV (4 khối), Việc cần làm inhouse xuống cuối
    sec(R.ctv?11:7,'Việc cần làm (inhouse)','Tự đề xuất từ các đánh giá ở trên, sắp theo mức ưu tiên',todoHtml(R))
  ]);
}

/* ---------------- biểu đồ (theme tối cho màn hình, sáng cho PDF) ---------------- */
var TH={dark:{ink:'#E8ECF3',ink2:'#D2D8E3',mute:'#A7B0C2',faint:'#8A93A7',line:'#323D57',grid:'#263045',teal:'#2FB59E',prev:'#4A556E',cur:'#9377E6',gold:'#E0A84A',tipBg:'#0B0F17',tipInk:'#D5DAE3'},
        light:{ink:'#1A2433',ink2:'#2D3748',mute:'#5A6577',faint:'#7A8496',line:'#CBD2DC',grid:'#E6EAF0',teal:'#1F8A78',prev:'#B5BECC',cur:'#6E54C9',gold:'#B7791F',tipBg:'#fff',tipInk:'#1A2433'}};
var FONT="'Be Vietnam Pro',sans-serif";
function optFun(R,t,anim){ var f=R.f,fp=R.fp,cv=R.cv,cvp=R.cvp;
  return {animation:anim,textStyle:{fontFamily:FONT},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:t.tipBg,borderWidth:0,textStyle:{color:t.tipInk,fontFamily:FONT,fontSize:12},
      formatter:function(a){var i=a[0].dataIndex;return '<b>'+STEP[i]+'</b><br>Kỳ này: <b>'+f[i]+'</b>'+(i&&cv[i]!=null?' ('+vn(cv[i],1)+'% qua bước)':'')+'<br>Kỳ trước: <b>'+fp[i]+'</b>'+(i&&cvp[i]!=null?' ('+vn(cvp[i],1)+'%)':'');}},
    legend:{top:0,right:0,itemWidth:10,itemHeight:10,textStyle:{color:t.mute,fontFamily:FONT}},grid:{left:8,right:76,top:28,bottom:4,containLabel:true},xAxis:{type:'value',show:false},
    yAxis:{type:'category',inverse:true,data:STEP,axisLine:{show:false},axisTick:{show:false},axisLabel:{color:t.ink2,fontSize:12,fontFamily:FONT}},
    series:[{name:'Kỳ này',type:'bar',barWidth:11,barGap:'30%',data:f,itemStyle:{color:t.teal,borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:t.ink,fontSize:11.5,fontWeight:600,fontFamily:FONT,formatter:function(q){return q.value+(q.dataIndex&&cv[q.dataIndex]!=null?' · '+vn(cv[q.dataIndex],0)+'%':'');}}},
      {name:'Kỳ trước',type:'bar',barWidth:11,data:fp,itemStyle:{color:t.prev,borderRadius:[0,4,4,0]},label:{show:true,position:'right',color:t.faint,fontSize:11,fontFamily:FONT}}]}; }
function optDay(R,t,anim){ return {animation:anim,textStyle:{fontFamily:FONT},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:t.tipBg,borderWidth:0,textStyle:{color:t.tipInk,fontFamily:FONT,fontSize:12},formatter:function(a){return (R.W?a[0].name:'Ngày '+a[0].name)+': <b>'+a[0].value+'</b> CV';}},
  grid:{left:6,right:8,top:20,bottom:4,containLabel:true},xAxis:{type:'category',data:R.labs,axisLine:{lineStyle:{color:t.line}},axisTick:{show:false},axisLabel:{color:t.mute,fontSize:11,fontFamily:FONT,interval:R.W?0:2}},
  yAxis:{type:'value',minInterval:1,splitLine:{lineStyle:{color:t.grid,type:'dashed'}},axisLabel:{color:t.faint,fontSize:11,fontFamily:FONT}},
  series:[{type:'bar',data:R.vals,barWidth:'56%',itemStyle:{color:t.teal,borderRadius:[4,4,0,0]},label:{show:R.W,position:'top',color:t.mute,fontSize:11,fontFamily:FONT}}]}; }
function optTr(R,t,anim){ var h=R.hist, labs=h.map(function(x){return x.lab;});
  return {animation:anim,textStyle:{fontFamily:FONT},tooltip:{trigger:'axis',axisPointer:{type:'shadow'},backgroundColor:t.tipBg,borderWidth:0,textStyle:{color:t.tipInk,fontFamily:FONT,fontSize:12},formatter:function(a){var x=h[a[0].dataIndex];return '<b>'+x.lab+'</b><br>CV: <b>'+x.cv+'</b><br>Qua HR: '+x.hr+(x.cv?' ('+vn(x.hr/x.cv*100,0)+'%)':'')+'<br>Trúng tuyển: '+x.tt;}},
    grid:[{left:6,right:8,top:16,height:'50%',containLabel:true},{left:6,right:8,top:'72%',bottom:4,containLabel:true}],
    xAxis:[{type:'category',data:labs,gridIndex:0,axisLabel:{show:false},axisLine:{lineStyle:{color:t.line}},axisTick:{show:false}},{type:'category',data:labs,gridIndex:1,axisLine:{lineStyle:{color:t.line}},axisTick:{show:false},axisLabel:{color:t.mute,fontSize:10.5,fontFamily:FONT}}],
    yAxis:[{type:'value',gridIndex:0,minInterval:1,splitLine:{lineStyle:{color:t.grid,type:'dashed'}},axisLabel:{color:t.faint,fontSize:10.5,fontFamily:FONT}},{type:'value',gridIndex:1,max:100,splitNumber:2,splitLine:{lineStyle:{color:t.grid,type:'dashed'}},axisLabel:{color:t.faint,fontSize:10,fontFamily:FONT,formatter:'{value}%'}}],
    series:[{type:'bar',xAxisIndex:0,yAxisIndex:0,barWidth:'50%',data:h.map(function(x){return {value:x.cv,itemStyle:{color:x.cur?t.cur:t.teal,borderRadius:[4,4,0,0]}};}),label:{show:true,position:'top',color:t.mute,fontSize:10.5,fontFamily:FONT}},
      {type:'line',xAxisIndex:1,yAxisIndex:1,connectNulls:true,symbolSize:6,data:h.map(function(x){return x.cv?Math.round(x.hr/x.cv*100):null;}),lineStyle:{color:t.gold,width:2},itemStyle:{color:t.gold}}]}; }

/* ---------------- CSS ---------------- */
function css(){
  return '<style id="bt-style">'
  +'#baocao .bt-sec{background:#1C2436;border:1px solid #323D57;border-radius:14px;padding:16px 18px;margin-top:16px;min-width:0}'
  +'#baocao .bt-sh{display:flex;align-items:center;gap:8px}#baocao .bt-sh h3{margin:0;font-size:16px;color:#E8ECF3;font-weight:600}'
  +'#baocao .bt-sh .n{width:22px;height:22px;border-radius:6px;background:#2A3349;color:#A7B0C2;font-size:11px;font-weight:700;display:grid;place-items:center}'
  +'#baocao .bt-cap{color:#8A93A7;font-size:12.5px;margin:2px 0 10px}#baocao .bt-sum{font-size:14.5px;line-height:1.65;color:#D2D8E3;margin-top:8px}#baocao .bt-sum b{color:#E8ECF3}'
  +'#baocao .bt-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:16px}'
  +'#baocao .bt-kpi{background:#1C2436;border:1px solid #323D57;border-radius:12px;padding:12px 14px}#baocao .bt-kpi .t{color:#A7B0C2;font-size:12.5px}'
  +'#baocao .bt-kpi .v{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:28px;color:#E8ECF3;line-height:1.25}#baocao .bt-kpi .s{font-size:11.5px;color:#8A93A7}'
  +'#baocao .bt-d{font-size:11.5px;font-weight:600}#baocao .bt-d.up{color:#4FBF8F}#baocao .bt-d.dn{color:#E36B6B}#baocao .bt-d.fl{color:#8A93A7}#baocao .bt-mute{color:#8A93A7}'
  +'#baocao .bt-g2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px}#baocao .bt-g2>.bt-sec{margin-top:16px}'
  +'#baocao .bt-ch{width:100%;height:280px}#baocao .bt-ch.sm{height:230px}#baocao .bt-scroll{overflow-x:auto}'
  +'#baocao table.bt-t{width:100%;border-collapse:collapse;font-size:12.8px}#baocao table.bt-t th{color:#8A93A7;font-weight:500;font-size:10.8px;text-transform:uppercase;letter-spacing:.04em;text-align:right;padding:8px;border-bottom:1px solid #323D57;white-space:nowrap}'
  +'#baocao table.bt-t th:first-child,#baocao table.bt-t td:first-child{text-align:left}#baocao table.bt-t td{padding:8px;border-bottom:1px solid #263045;text-align:right;white-space:nowrap;color:#D2D8E3}'
  +'#baocao table.bt-t tr.tot td{font-weight:700;color:#E8ECF3;border-top:1px solid #323D57}#baocao table.bt-t td small{color:#8A93A7;font-size:11px;margin-left:4px}'
  +'#baocao .bad{color:#E36B6B!important;font-weight:600}#baocao .warn{color:#E0A84A!important;font-weight:600}'
  +'#baocao .bt-age{display:inline-block;min-width:30px;text-align:center;padding:1px 6px;border-radius:6px;font-weight:600;color:#E8ECF3}#baocao .bt-zero{color:#4A556E}'
  +'#baocao .a0{background:rgba(47,181,158,.16)}#baocao .a1{background:rgba(224,168,74,.12)}#baocao .a2{background:rgba(224,168,74,.22)}#baocao .a3{background:rgba(227,107,107,.2)}'
  +'#baocao .bt-ev{margin-top:12px;border-top:1px dashed #263045;padding-top:12px}#baocao .bt-ev h4{margin:0 0 8px;font-size:11px;letter-spacing:.08em;color:#A99BEF;font-weight:700}'
  +'#baocao .bt-evi{display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.55;margin:6px 0;color:#D2D8E3}#baocao .bt-evi b{color:#E8ECF3}'
  +'#baocao .bt-chip{flex:none;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;margin-top:1px}'
  +'#baocao .bt-chip.er{background:rgba(227,107,107,.14);color:#E36B6B}#baocao .bt-chip.wa{background:rgba(224,168,74,.14);color:#E0A84A}#baocao .bt-chip.ok{background:rgba(47,181,158,.14);color:#4FBF8F}#baocao .bt-chip.in{background:rgba(106,128,219,.16);color:#8FA0F0}'
  +'#baocao .bt-todo{counter-reset:td;list-style:none;padding:0;margin:0}#baocao .bt-todo li{counter-increment:td;display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-bottom:1px solid #263045;font-size:13.3px;color:#D2D8E3}'
  +'#baocao .bt-todo li:before{content:counter(td);flex:none;width:22px;height:22px;border-radius:50%;background:rgba(147,119,230,.18);color:#A99BEF;font-weight:700;font-size:12px;display:grid;place-items:center}'
  +'#baocao .bt-todo b{color:#E8ECF3}#baocao .bt-todo .who{margin-left:auto;color:#8A93A7;font-size:12px;white-space:nowrap}'
  +'#baocao .bt-note{color:#8A93A7;font-size:12px;font-style:italic;margin-top:16px;line-height:1.6}'
  +'@media(max-width:900px){#baocao .bt-g2{grid-template-columns:1fr}#baocao .bt-kpis{grid-template-columns:1fr 1fr}}'
  +'</style>';
}

/* ---------------- RENDER MÀN HÌNH ---------------- */
window.renderBaoCao=function(){
  if(window.HR&&HR.error) return window.errorBox?window.errorBox():'<div class="ns-note">Lỗi tải dữ liệu</div>';
  if(!(window.HR&&HR.loaded)) return (window.loadingBox?window.loadingBox():'<div class="ns-note">Đang tải…</div>');
  var R=compute(), mode=R.mode, off=R.off;
  var offLbl=off===0?(mode==='week'?'Tuần này':'Tháng này'):(mode==='week'?(off===-1?'Tuần trước':Math.abs(off)+' tuần trước'):(off===-1?'Tháng trước':Math.abs(off)+' tháng trước'));
  var head='<div class="page-head"><div class="page-h1">Báo cáo tuyển dụng</div><div class="page-lead">Đánh giá chi tiết tuyển dụng inhouse và CTV Booking KOC theo tuần hoặc tháng: lượng CV, phễu, từng vị trí, CV tồn đọng, đơn CTV và việc cần làm. Số liệu lấy trực tiếp từ dữ liệu web, có so sánh với kỳ liền trước.</div></div>';
  var controls='<div class="bc-controls"><div class="bc-seg"><button class="'+(mode==='week'?'on':'')+'" onclick="bcSetMode(\'week\')">Tuần</button><button class="'+(mode==='month'?'on':'')+'" onclick="bcSetMode(\'month\')">Tháng</button></div>'
    +'<div class="bc-step"><span class="arw" onclick="bcStep(-1)">‹</span><span class="lbl">'+bcLabel(mode,R.p)+'<small>'+offLbl+'</small></span><span class="arw'+(off>=0?' dis':'')+'" onclick="bcStep(1)">›</span></div>'
    +'<span class="bc-cmp">so với kỳ trước · '+bcLabel(mode,R.pv)+'</span><button class="bc-pdf" onclick="bcExportPDF()">⬇&nbsp; Xuất PDF</button></div>'
    +'<div class="bc-cad">◷&nbsp; Tự phát hành: <b>Thứ 2 hằng tuần</b> (báo cáo tuần trước) · <b>Ngày 1 hằng tháng</b> (báo cáo tháng trước) — gửi email brian.pham@bigx.vn</div>';
  var body=sections(R,{fun:'<div id="bt-fun" class="bt-ch"></div>',day:'<div id="bt-day" class="bt-ch sm"></div>',tr:'<div id="bt-tr" class="bt-ch sm"></div>'}).join('');
  setTimeout(function(){ try{ drawScreen(R); }catch(e){ console.warn('[bt] chart',e); } },30);
  return head+(typeof bcStyle==='function'?bcStyle():'')+css()+'<div id="baocao">'+controls+body+'<div class="bt-note">'+NOTE+'</div></div>';
};
window.__btCharts=window.__btCharts||{};
function drawScreen(R){ if(typeof echarts==='undefined') return; var t=TH.dark;
  [['bt-fun',optFun],['bt-day',optDay],['bt-tr',optTr]].forEach(function(x){ var el=document.getElementById(x[0]); if(!el) return;
    var old=echarts.getInstanceByDom(el); if(old) old.dispose(); var c=echarts.init(el); c.setOption(x[1](R,t,true)); window.__btCharts[x[0]]=c; }); }
if(!window.__btResize){ window.__btResize=true; window.addEventListener('resize',function(){ Object.keys(window.__btCharts).forEach(function(k){ try{ var c=window.__btCharts[k]; if(c&&!c.isDisposed()) c.resize(); }catch(e){} }); }); }

/* ---------------- XUẤT PDF A4 (nền trắng, chia trang theo từng khối — không cắt ngang khối) ---------------- */
function loadScript(src){ return new Promise(function(ok,no){ var s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=no; document.head.appendChild(s); }); }
function chartImg(opt,w,h){ var d=document.createElement('div'); d.style.cssText='position:fixed;left:-20000px;top:0;width:'+w+'px;height:'+h+'px'; document.body.appendChild(d);
  var c=echarts.init(d,null,{renderer:'canvas',width:w,height:h}); c.setOption(opt); var url=c.getDataURL({type:'png',pixelRatio:2,backgroundColor:'#FFFFFF'}); c.dispose(); d.remove();
  return '<img src="'+url+'" style="width:'+w+'px;height:'+h+'px;display:block">'; }
var PW=794, PH=1123, PAD=40; // A4 @96dpi, lề 40px (~10,6mm)
function pdfCss(){ return '<style>'+scopeBp(pdfRules())+'</style>'; }
function scopeBp(c){ return c.split('}').map(function(r){ if(!r.trim()) return ''; var i=r.indexOf('{'); var sel=r.slice(0,i).split(',').map(function(x){x=x.trim(); return /^\.bp(\b|-)/.test(x)?x:'.bp '+x;}).join(','); return sel+r.slice(i)+'}'; }).join(''); }
function pdfRules(){
  return ''
  +'.bp{width:'+PW+'px;height:'+PH+'px;background:#fff;color:#1A2433;font-family:"Be Vietnam Pro",sans-serif;font-variant-numeric:tabular-nums;position:relative;box-sizing:border-box;padding:'+PAD+'px '+PAD+'px 0;overflow:hidden}'
  +'.bp *{box-sizing:border-box}.bp b{color:#111827}'
  +'.bp-hd{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #202D38;padding-bottom:12px;margin-bottom:14px}'
  +'.bp-hl{display:flex;align-items:center;gap:12px}.bp-logo{width:42px;height:42px;border-radius:10px;background:#202D38;color:#fff;font-family:Fraunces,Georgia,serif;font-weight:600;font-size:16px;display:flex;align-items:center;justify-content:center}'
  +'.bp-t{font-family:Fraunces,Georgia,serif;font-size:21px;font-weight:600;color:#202D38;letter-spacing:.2px}.bp-s{font-size:12px;color:#5A6577;margin-top:2px}.bp-hr{text-align:right;font-size:11.5px;color:#5A6577;line-height:1.6}'
  +'.bp-mini{display:flex;justify-content:space-between;font-size:10.5px;color:#7A8496;border-bottom:1px solid #E3E7EE;padding-bottom:6px;margin-bottom:12px}'
  +'.bp-ft{position:absolute;left:'+PAD+'px;right:'+PAD+'px;bottom:18px;display:flex;justify-content:space-between;font-size:10px;color:#7A8496;border-top:1px solid #E3E7EE;padding-top:6px}'
  +'.bt-sec{border:1px solid #E3E7EE;border-radius:10px;padding:12px 14px;margin-bottom:12px;background:#fff}'
  +'.bt-sh{display:flex;align-items:center;gap:8px}.bt-sh h3{margin:0;font-family:Fraunces,Georgia,serif;font-size:15px;color:#202D38;font-weight:600}'
  +'.bt-sh .n{width:20px;height:20px;border-radius:5px;background:#202D38;color:#fff;font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center}'
  +'.bt-cap{color:#7A8496;font-size:10.8px;margin:2px 0 8px}.bt-sum{font-size:12.5px;line-height:1.65;color:#2D3748;margin-top:6px}'
  +'.bt-kpis{display:flex;gap:8px;margin-bottom:12px}.bt-kpi{flex:1;border:1px solid #E3E7EE;border-radius:10px;padding:9px 11px;background:#F7F9FB}'
  +'.bt-kpi .t{color:#5A6577;font-size:10.8px}.bt-kpi .v{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:23px;color:#202D38;line-height:1.25}.bt-kpi .s{font-size:9.8px;color:#7A8496;line-height:1.4}'
  +'.bt-d{font-weight:600}.bt-d.up{color:#2F855A}.bt-d.dn{color:#C53030}.bt-d.fl{color:#7A8496}.bt-mute{color:#7A8496}'
  +'.bt-g2{display:flex;gap:12px}.bt-g2>.bt-sec{flex:1;min-width:0}'
  +'table.bt-t{width:100%;border-collapse:collapse;font-size:10.8px}table.bt-t th{color:#5A6577;font-weight:600;font-size:9.3px;text-transform:uppercase;letter-spacing:.03em;text-align:right;padding:6px 5px;border-bottom:1.5px solid #CBD2DC;white-space:nowrap;background:#F7F9FB}'
  +'table.bt-t th:first-child,table.bt-t td:first-child{text-align:left}table.bt-t td{padding:6px 5px;border-bottom:1px solid #EDF0F4;text-align:right;white-space:nowrap;color:#2D3748}'
  +'table.bt-t tr.tot td{font-weight:700;color:#111827;border-top:1.5px solid #CBD2DC;background:#F7F9FB}table.bt-t td small{color:#7A8496;font-size:9.5px;margin-left:3px}'
  +'.bad{color:#C53030!important;font-weight:600}.warn{color:#B7791F!important;font-weight:600}'
  +'.bt-age{display:inline-block;min-width:26px;text-align:center;padding:1px 5px;border-radius:5px;font-weight:600;color:#1A2433}.bt-zero{color:#B5BECC}'
  +'.a0{background:#DDF3EE}.a1{background:#FBF0DA}.a2{background:#F6E1B8}.a3{background:#F8D7D7}'
  +'.bt-ev{margin-top:8px;border-top:1px dashed #D9DEE6;padding-top:8px}.bt-ev h4{margin:0 0 5px;font-size:9.5px;letter-spacing:.08em;color:#6E54C9;font-weight:700}'
  +'.bt-evi{display:flex;gap:8px;align-items:flex-start;font-size:11px;line-height:1.5;margin:4px 0;color:#2D3748}'
  +'.bt-chip{flex:none;font-size:9.2px;font-weight:700;padding:1px 7px;border-radius:999px;white-space:nowrap;margin-top:1px}'
  +'.bt-chip.er{background:#FDE2E2;color:#B42318}.bt-chip.wa{background:#FDF0D5;color:#8A5A00}.bt-chip.ok{background:#DDF3EE;color:#1F6F5C}.bt-chip.in{background:#E6E9FA;color:#3B4BA8}'
  +'.bt-todo{counter-reset:td;list-style:none;padding:0;margin:0}.bt-todo li{counter-increment:td;display:flex;gap:9px;align-items:flex-start;padding:7px 0;border-bottom:1px solid #EDF0F4;font-size:11.3px;color:#2D3748}'
  +'.bt-todo li:before{content:counter(td);flex:none;width:19px;height:19px;border-radius:50%;background:#EEEAFB;color:#6E54C9;font-weight:700;font-size:10.5px;display:flex;align-items:center;justify-content:center}'
  +'.bt-todo .who{margin-left:auto;color:#7A8496;font-size:10.5px;white-space:nowrap;padding-left:10px}'
  +'.bt-note{color:#7A8496;font-size:10px;font-style:italic;line-height:1.55;margin-top:4px}'
  +'';
}
window.bcExportPDF=function(){
  var btn=document.querySelector('#baocao .bc-pdf'), old=btn?btn.innerHTML:'';
  function done(){ if(btn){ btn.disabled=false; btn.innerHTML=old; } }
  function fail(m){ done(); alert(m||'Không tạo được PDF, thử lại giúp em.'); }
  if(btn){ btn.disabled=true; btn.innerHTML='⏳&nbsp; Đang tạo PDF…'; }
  var need=[]; if(!window.html2canvas) need.push(loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'));
  if(!(window.jspdf&&window.jspdf.jsPDF)) need.push(loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'));
  Promise.all(need).then(function(){ return (document.fonts&&document.fonts.ready)||Promise.resolve(); }).then(function(){
    var R=compute(), t=TH.light, W2=Math.floor((PW-2*PAD-12)/2)-30;
    var charts={fun:chartImg(optFun(R,t,false),PW-2*PAD-30,250),day:chartImg(optDay(R,t,false),W2,190),tr:chartImg(optTr(R,t,false),W2,190)};
    var blocks=sections(R,charts).concat(['<div class="bt-note">'+NOTE+'</div>']);
    var lbl=bcLabel(R.mode,R.p), now=new Date(), stamp=DMY(now)+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
    var host=document.createElement('div'); host.style.cssText='position:fixed;left:-30000px;top:0;z-index:-1'; host.innerHTML=pdfCss(); document.body.appendChild(host);
    var hdr1='<div class="bp-hd"><div class="bp-hl"><div class="bp-logo">BigX</div><div><div class="bp-t">BÁO CÁO TUYỂN DỤNG</div><div class="bp-s">Kỳ: '+lbl+' · so với kỳ trước: '+bcLabel(R.mode,R.pv)+'</div></div></div>'
      +'<div class="bp-hr">BigX Agency · Phòng Nhân sự<br>Ngày xuất: '+stamp+'</div></div>';
    var hdrN='<div class="bp-mini"><span><b style="color:#202D38">BigX</b> · Báo cáo tuyển dụng · Kỳ '+lbl+'</span><span>Ngày xuất: '+DMY(now)+'</span></div>';
    /* đo chiều cao từng khối rồi xếp vào trang, không cắt ngang khối */
    var pages=[], cur=null, FOOT=46;
    function newPage(){ var pg=document.createElement('div'); pg.className='bp'; pg.innerHTML=(pages.length?hdrN:hdr1); host.appendChild(pg); pages.push(pg); cur=pg; }
    newPage();
    blocks.forEach(function(h){ var w=document.createElement('div'); w.innerHTML=h; var el=w.firstChild; cur.appendChild(el);
      var bottom=el.offsetTop+el.offsetHeight+parseFloat(getComputedStyle(el).marginBottom||0);
      if(bottom>PH-FOOT && cur.children.length>2){ cur.removeChild(el); newPage(); cur.appendChild(el); } });
    var total=pages.length; pages.forEach(function(pg,i){ var ft=document.createElement('div'); ft.className='bp-ft'; ft.innerHTML='<span>Số liệu lấy trực tiếp từ dữ liệu tuyển dụng trên hệ thống HR BigX</span><span>Trang '+(i+1)+'/'+total+'</span>'; pg.appendChild(ft); });
    var pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait'}), chain=Promise.resolve();
    pages.forEach(function(pg,i){ chain=chain.then(function(){ return window.html2canvas(pg,{scale:2,backgroundColor:'#FFFFFF',useCORS:true,logging:false,width:PW,height:PH,windowWidth:PW}); })
      .then(function(cv){ if(i) pdf.addPage(); pdf.addImage(cv.toDataURL('image/jpeg',0.95),'JPEG',0,0,210,297); }); });
    return chain.then(function(){
      var slug=(R.mode==='week'?(DMY(R.p.start)+'_'+DMY(R.p.end)):('Thang_'+(R.p.start.getMonth()+1)+'-'+R.p.start.getFullYear())).replace(/\//g,'-');
      pdf.save('BaoCao_TuyenDung_'+slug+'.pdf'); host.remove(); done(); }, function(e){ host.remove(); throw e; });
  }).catch(function(e){ console.warn('[bt] pdf',e); fail(); });
};

/* ================================================================
   [PDF BẢNG CHỈ SỐ] 1 trang A4 — inhouse + CTV Booking KOC — mockup duyệt 22/10/2026
   Thay mẫu "Xuất PDF" cũ (bản cũ vẫn giữ ở window.__btOldPDF, không xoá).
   Đèn: so với kỳ trước (xanh tốt hơn · vàng bằng/thay đổi nhỏ · đỏ kém hơn · xám chưa đủ dữ liệu).
   ================================================================ */
window.__btOldPDF=window.__btOldPDF||window.bcExportPDF;
function scWaitCtv(){ var S=window.__ctv; if(!S||S.loaded) return Promise.resolve();
  if(typeof window.__ctvLoad==='function') window.__ctvLoad();
  return new Promise(function(ok){ var n=0; (function w(){ if(S.loaded||S.error||++n>40) return ok(); setTimeout(w,200); })(); }); }
function scRow(name,sub,cur,prev,kind,better){
  /* kind: 'n' số đếm · 'r' tỷ lệ % · 'd' số ngày · 's' ảnh chụp hiện tại (không có kỳ trước) */
  var fmt=function(v){ if(v==null||isNaN(v)) return '—'; return kind==='r'?vn(v,0)+'%':kind==='d'?vn(v,1):String(v); };
  var dot='n', ch='<span class="fl">—</span>';
  if(kind==='s'){ dot=cur?'r':'g'; }
  else if(cur!=null&&prev!=null&&!isNaN(cur)&&!isNaN(prev)){
    var d=cur-prev, small=kind==='r'?Math.abs(d)<5:kind==='d'?Math.abs(d)<0.5:d===0;
    var good=better>0?d>0:d<0;
    dot=small?'y':good?'g':'r';
    if(d!==0){ var a=Math.abs(d); ch='<span class="'+(good?'up':'dn')+'">'+(d>0?'▲ ':'▼ ')+(kind==='r'?vn(a,0)+' điểm':kind==='d'?vn(a,1):a)+'</span>'; }
  }
  return '<tr><td>'+name+(sub?'<small>'+sub+'</small>':'')+'</td><td><b>'+fmt(cur)+'</b></td><td>'+(kind==='s'?'—':fmt(prev))+'</td><td>'+ch+'</td><td class="c"><span class="dot '+dot+'"></span></td></tr>';
}
function scHtml(R){
  /* [28/10/2026] mockup duyệt 28/10: inhouse chỉ hiện khi kỳ có CV; CTV = 4 khối số liệu (chỉ số · theo tuần đăng ký · phỏng vấn theo host · cần xử lý) */
  var f=R.f, fp=R.fp, r=function(a,b){ return b?a/b*100:null; }, C=R.ctv, IN=f[0]>0;
  var lbl=bcLabel(R.mode,R.p), now=new Date(), stamp=DMY(now)+' '+String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  var tile=function(t,v,d){ return '<div class="ti"><div class="l">'+t+'</div><div class="v">'+v+'</div><div class="d">'+d+'</div></div>'; };
  var dl=function(v,p){ var d=v-p; return d?'<span class="'+(d>0?'up':'dn')+'">'+(d>0?'▲ ':'▼ ')+Math.abs(d)+'</span> vs '+p:'<span class="fl">— bằng kỳ trước</span>'; };
  var h='<div class="hd"><div class="hl"><div class="lg">BigX</div><div><div class="t">BÁO CÁO TUYỂN DỤNG</div><div class="s">Kỳ: '+(R.W?'Tuần ':'Tháng ')+lbl+' · so với '+bcLabel(R.mode,R.pv)+'</div></div></div>'
    +'<div class="hr">BigX Agency · Phòng Nhân sự<br>Ngày xuất: '+stamp+'</div></div>';
  var n=0, H=function(t,sub){ n++; return '<div class="h2"><span>'+n+' · '+t+'</span>'+(sub?'<small>'+sub+'</small>':'')+'</div>'; };
  if(IN){
    h+=H('Tuyển dụng inhouse','CV nộp trong kỳ · kết quả đến hôm nay');
    h+='<table><tr><th>Chỉ số</th><th>Kỳ này</th><th>Kỳ trước</th><th>Thay đổi</th><th class="c">Đánh giá</th></tr>'
      +scRow('CV mới nhận','',f[0],fp[0],'n',1)
      +scRow('Tỷ lệ qua HR duyệt','CV qua HR / CV nộp',r(f[1],f[0]),r(fp[1],fp[0]),'r',1)
      +scRow('Qua phỏng vấn vòng 1','',f[3],fp[3],'n',1)
      +scRow('Trúng tuyển','',f[5],fp[5],'n',1)
      +scRow('CV kỳ này chưa có kết quả','',R.pend,R.pendP,'n',-1)
      +scRow('CV tồn quá 7 ngày','toàn hệ thống, tại ngày xuất',R.old7,null,'s',-1)+'</table>';
  } else h+='<div class="hid">Tuyển dụng inhouse: kỳ này không có CV mới, phần này được ẩn.</div>';
  if(C){
    h+=H('CTV Booking KOC','chỉ số kỳ')+'<div class="tiles six">'+C.K.map(function(x){ return tile(x[0],x[1],x[2]); }).join('')+'</div>';
    h+=H('Chuyển đổi theo tuần đăng ký','kỳ này + kỳ trước · đến hôm nay')+C.weekTable('wk');
    h+=H('Phỏng vấn theo host','số buổi theo lịch HR BIGX')+C.hostTable('ht');
    h+=H('Cần xử lý','')+(C.todoList.length?'<ul class="cx">'+C.todoList.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':'<div class="fl" style="font-size:11px">Không có việc tồn.</div>');
  } else h+='<div class="hid">Chưa tải được dữ liệu CTV — mở tab CTV Booking KOC rồi xuất lại.</div>';
  if(IN && (R.todo||[]).length) h+=H('Việc cần làm (inhouse)','')+'<ol class="cx">'+R.todo.slice(0,5).map(function(x){ return '<li>'+x[1]+' <i>'+x[2]+'</i></li>'; }).join('')+'</ol>';
  h+='<div class="ft"><span>Nguồn: file Tuyển dụng · form Đăng ký CTV · sheet Theo dõi Group · lịch HR BIGX. Không hiển thị tên ứng viên.</span><span>Trang 1/1</span></div>';
  return h;
}
function scCss(){ return '<style>'
  +'.sc{width:'+PW+'px;height:'+PH+'px;background:#fff;color:#1A2433;font-family:"Be Vietnam Pro",sans-serif;font-variant-numeric:tabular-nums;position:relative;box-sizing:border-box;padding:34px 38px 0;overflow:hidden}'
  +'.sc *{box-sizing:border-box}.sc b{color:#111827}'
  +'.sc .hd{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #202D38;padding-bottom:12px}'
  +'.sc .hl{display:flex;gap:12px;align-items:center}.sc .lg{width:42px;height:42px;border-radius:10px;background:#202D38;color:#fff;font-family:Fraunces,Georgia,serif;font-weight:600;font-size:15px;display:flex;align-items:center;justify-content:center}'
  +'.sc .t{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:21px;color:#202D38}.sc .s{font-size:12px;color:#5A6577;margin-top:2px}.sc .hr{text-align:right;font-size:11px;color:#5A6577;line-height:1.6}'
  +'.sc .tiles{display:flex;gap:8px;margin:14px 0}.sc .ti{flex:1;border:1px solid #E3E7EE;border-radius:10px;padding:9px 12px;background:#F7F9FB;min-height:74px}'
  +'.sc .ti .l{font-size:10.5px;color:#5A6577;text-transform:uppercase;letter-spacing:.05em}.sc .ti .v{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:26px;color:#202D38;line-height:1.2}.sc .ti .d{font-size:10.5px;color:#7A8496}'
  +'.sc .up{color:#2F855A;font-weight:600}.sc .dn{color:#C53030;font-weight:600}.sc .fl{color:#7A8496;font-weight:600}'
  +'.sc table{width:100%;border-collapse:collapse;font-size:11.5px}.sc th{font-size:9.5px;letter-spacing:.05em;text-transform:uppercase;color:#5A6577;text-align:right;padding:6px 8px;border-bottom:1.5px solid #CBD2DC;background:#F7F9FB;font-weight:600}'
  +'.sc th:first-child,.sc td:first-child{text-align:left}.sc td{padding:5px 8px;border-bottom:1px solid #EDF0F4;text-align:right;color:#2D3748}.sc .c{text-align:center!important}'
  +'.sc tr.grp td{background:#202D38;color:#fff;font-weight:700;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;padding:5px 8px}'
  +'.sc td small{display:block;font-size:9.5px;color:#7A8496}'
  +'.sc .dot{display:inline-block;width:10px;height:10px;border-radius:50%}.sc .g{background:#2F9E6E}.sc .y{background:#E0A84A}.sc .r{background:#D64545}.sc .n{background:#C5CCD6}'
  +'.sc .leg{font-size:10px;color:#7A8496;margin-top:6px}.sc .leg .dot{width:8px;height:8px}'
  +'.sc .two{display:flex;gap:12px;margin-top:12px}.sc .box{flex:1;min-width:0;border:1px solid #E3E7EE;border-radius:10px;padding:10px 12px}'
  +'.sc .box h4{margin:0 0 6px;font-family:Fraunces,Georgia,serif;font-weight:600;font-size:14px;color:#202D38}.sc .box ul,.sc .box ol{margin:0;padding-left:16px}'
  +'.sc .box li{font-size:11px;line-height:1.5;margin:3px 0;color:#2D3748}.sc .box ol li::marker{color:#6E54C9;font-weight:700}.sc .box i{color:#7A8496;font-style:normal;font-size:10px}'
  +'.sc .ti,.sc .ti *{font-family:"Be Vietnam Pro",sans-serif!important;font-style:normal}.sc .ti .v{font-family:Fraunces,Georgia,serif!important}'
  +'.sc .h2{display:flex;gap:8px;align-items:baseline;margin:14px 0 6px;font-family:Fraunces,Georgia,serif;font-weight:600;font-size:14px;color:#202D38}.sc .h2 small{font-family:"Be Vietnam Pro",sans-serif;font-weight:400;font-size:10px;color:#7A8496}'
  +'.sc .hid{font-size:10.5px;color:#7A8496;border:1px dashed #D5DAE2;border-radius:6px;padding:6px 10px;margin-top:12px}'
  +'.sc .tiles.six{margin:6px 0}.sc .tiles.six .ti{min-height:62px;padding:7px 9px}.sc .tiles.six .v{font-size:20px}.sc .tiles.six .l{font-size:9px}'
  +'.sc table.wk td,.sc table.wk th,.sc table.ht td,.sc table.ht th{text-align:center}.sc table.wk td:first-child,.sc table.wk th:first-child{text-align:left}'
  +'.sc table.ht .ov{color:#C53030;font-weight:700}.sc table.ht .z{color:#C5CCD6}.sc table.ht tr.tt td,.sc table.wk tr:last-child td{border-top:1.5px solid #CBD2DC}'
  +'.sc .nt{font-size:9.5px;color:#7A8496;margin-top:3px}.sc ul.cx,.sc ol.cx{margin:0;padding-left:18px}.sc .cx li{font-size:11px;line-height:1.55;margin:2px 0;color:#2D3748}.sc .cx i{color:#7A8496;font-style:normal;font-size:10px}'
  +'.sc .ft{position:absolute;left:38px;right:38px;bottom:18px;display:flex;justify-content:space-between;font-size:10px;color:#7A8496;border-top:1px solid #E3E7EE;padding-top:6px}'
  +'</style>'; }
window.bcExportPDF=function(){
  var btn=document.querySelector('#baocao .bc-pdf'), old=btn?btn.innerHTML:'';
  function done(){ if(btn){ btn.disabled=false; btn.innerHTML=old; } }
  if(btn){ btn.disabled=true; btn.innerHTML='⏳&nbsp; Đang tạo PDF…'; }
  var need=[]; if(!window.html2canvas) need.push(loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'));
  if(!(window.jspdf&&window.jspdf.jsPDF)) need.push(loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'));
  Promise.all(need).then(scWaitCtv).then(function(){ var R0=compute(); return window.__ctvRepWait?window.__ctvRepWait(R0.p,R0.pv):null; }).then(function(){ return (document.fonts&&document.fonts.ready)||Promise.resolve(); }).then(function(){
    var R=compute();
    var host=document.createElement('div'); host.style.cssText='position:fixed;left:-30000px;top:0;z-index:-1';
    host.innerHTML=scCss()+'<div class="sc">'+scHtml(R)+'</div>'; document.body.appendChild(host);
    var pg=host.querySelector('.sc');
    return window.html2canvas(pg,{scale:2,backgroundColor:'#FFFFFF',useCORS:true,logging:false,width:PW,height:PH,windowWidth:PW}).then(function(cv){
      var pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait'}); pdf.addImage(cv.toDataURL('image/jpeg',0.95),'JPEG',0,0,210,297);
      var slug=(R.mode==='week'?(DMY(R.p.start)+'_'+DMY(R.p.end)):('Thang_'+(R.p.start.getMonth()+1)+'-'+R.p.start.getFullYear())).replace(/\//g,'-');
      pdf.save('BaoCao_ChiSo_TuyenDung_'+slug+'.pdf'); host.remove(); done(); }, function(e){ host.remove(); throw e; });
  }).catch(function(e){ console.warn('[sc] pdf',e); done(); alert('Không tạo được PDF, thử lại giúp em.'); });
};
window.__scPreview=function(){ var R=compute(); return scCss()+'<div class="sc">'+scHtml(R)+'</div>'; }; // để kiểm tra bố cục

/* nếu đang mở sẵn tab Báo cáo thì vẽ lại bằng bản mới */
if(window.currentTab==='bao-cao' && window.go){ try{ window.go('bao-cao'); }catch(e){} }
})();
