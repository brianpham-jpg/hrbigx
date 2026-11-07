/* ============================================================
   BigX HR — topnav-v6.js  (thanh công cụ ngang — phương án B, Brian duyệt 07/11/2026)
   - Thay thanh icon dọc bên trái bằng thanh ngang trên cùng:
     Bảng điều khiển · Vận hành ▾ · Phân tích ▾  (menu xổ xuống, có icon + mô tả ngắn)
   - Dựng từ NAV có sẵn → thêm tab mới vào NAV là tự hiện trong menu.
   - KHÔNG sửa logic cũ: chỉ ẩn #sidebar bằng CSS và gọi go(id) như cũ.
   - Gỡ 2 dòng topnav-v6.css / topnav-v6.js khỏi index.html là web về y như cũ.
   ============================================================ */
(function(){
'use strict';

var ICON={ 'overview':'ti-layout-dashboard','tuyen-dung':'ti-clipboard-list','kho-cv':'ti-folders','ctv-koc':'ti-user-star',
  'bot-tin':'ti-robot','pt-tuyen-dung':'ti-trending-up','bao-cao':'ti-report-analytics' };
var TONE={ 'tuyen-dung':'norm','kho-cv':'high','ctv-koc':'ok','bot-tin':'acc','pt-tuyen-dung':'norm','bao-cao':'high' };
var DESC={ 'tuyen-dung':'Danh sách CV & trạng thái ứng viên','kho-cv':'Nạp CV · chấm CV theo JD',
  'ctv-koc':'Tiến độ phỏng vấn · theo dõi 7 ngày','bot-tin':'Lịch đăng · nhật ký · hiệu quả group',
  'pt-tuyen-dung':'Phễu, tỷ lệ chuyển đổi theo vị trí','bao-cao':'Báo cáo tuần / tháng · xuất PDF' };
var GROUP={ 'Vận hành — dữ liệu gốc':{label:'Vận hành',icon:'ti-briefcase-2'}, 'Phân tích':{label:'Phân tích',icon:'ti-chart-histogram'} };

function E(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function icon(it){ return ICON[it.id]||it.icon||'ti-point'; }
function groupMeta(g){ return GROUP[g.group]||{label:String(g.group).split('—')[0].trim(),icon:'ti-layout-grid'}; }

/* NAV khai báo bằng const trong app.js → không nằm trên window, phải đọc trực tiếp */
function getNav(){ try{ return NAV; }catch(e){ return window.NAV||null; } }

function build(){
  var main=document.getElementById('main'), NAVL=getNav();
  if(!main||!NAVL||document.getElementById('bx-topnav')) return;
  var nav='', mob='';
  NAVL.forEach(function(g,gi){
    if(g.items.length===1 && gi===0){
      var it=g.items[0];
      nav+='<button type="button" class="tn-it" data-id="'+it.id+'"><i class="ti '+icon(it)+'"></i><span>'+E(it.label)+'</span></button>';
      mob+='<button type="button" class="tn-mi" data-id="'+it.id+'"><span class="tn-ico tone-acc"><i class="ti '+icon(it)+'"></i></span><span class="tn-tx"><b>'+E(it.label)+'</b></span></button>';
      return;
    }
    var m=groupMeta(g), ids=g.items.map(function(x){return x.id;}).join(' ');
    var items=g.items.map(function(it){
      return '<button type="button" class="tn-mi" data-id="'+it.id+'"><span class="tn-ico tone-'+(TONE[it.id]||'acc')+'"><i class="ti '+icon(it)+'"></i></span>'+
        '<span class="tn-tx"><b>'+E(it.label)+(it.badge==='new'?'<em>Mới</em>':'')+'</b>'+(DESC[it.id]?'<small>'+E(DESC[it.id])+'</small>':'')+'</span></button>';
    }).join('');
    nav+='<div class="tn-dd" data-ids="'+ids+'"><button type="button" class="tn-it tn-grp"><i class="ti '+m.icon+'"></i><span>'+E(m.label)+'</span><i class="ti ti-chevron-down tn-chev"></i></button>'+
      '<div class="tn-menu" role="menu">'+items+'</div></div>';
    mob+='<div class="tn-mgrp">'+E(m.label)+'</div>'+items;
  });
  var email=String(window.BX_USER||'brian.pham@bigx.vn'), ini=email==='brian.pham@bigx.vn'?'BP':email.slice(0,2).toUpperCase();
  var bar=document.createElement('header'); bar.id='bx-topnav';
  bar.innerHTML='<div class="tn-brand" data-go="overview"><div class="tn-logo">B</div><div><b>BigX HR</b><small>Tuyển dụng CTV</small></div></div>'+
    '<nav class="tn-nav">'+nav+'</nav>'+
    '<div class="tn-right"><span class="tn-theme-slot"></span>'+
      (window.BX_ROLE==='viewer'?'<span class="tn-ro">Chỉ xem</span>':'')+
      '<span class="tn-av" title="'+E(email)+'">'+E(ini)+'</span>'+
      '<button type="button" class="tn-burger" aria-label="Mở menu"><i class="ti ti-menu-2"></i></button></div>'+
    '<div class="tn-mob">'+mob+'</div>';
  main.insertBefore(bar, main.firstChild);
  document.body.classList.add('bx-topnav-on');
  wire(bar); moveTheme(); mark(window.currentTab||'overview');
}

function closeAll(except){ [].forEach.call(document.querySelectorAll('#bx-topnav .tn-dd.open'),function(d){ if(d!==except) d.classList.remove('open'); }); }
function wire(bar){
  bar.addEventListener('click',function(ev){
    var t=ev.target.closest('[data-id],[data-go],.tn-grp,.tn-burger'); if(!t) return;
    if(t.classList.contains('tn-burger')){ bar.classList.toggle('mob-open'); return; }
    if(t.classList.contains('tn-grp')){ var dd=t.parentNode; closeAll(dd); dd.classList.toggle('open'); return; }
    var id=t.getAttribute('data-id')||t.getAttribute('data-go');
    closeAll(); bar.classList.remove('mob-open');
    if(id && typeof window.go==='function') window.go(id);
  });
  document.addEventListener('click',function(ev){ if(!ev.target.closest('#bx-topnav')){ closeAll(); bar.classList.remove('mob-open'); } });
  document.addEventListener('keydown',function(ev){ if(ev.key==='Escape'){ closeAll(); bar.classList.remove('mob-open'); } });
}
function mark(id){
  var bar=document.getElementById('bx-topnav'); if(!bar) return;
  [].forEach.call(bar.querySelectorAll('[data-id]'),function(el){ el.classList.toggle('on',el.getAttribute('data-id')===id); });
  [].forEach.call(bar.querySelectorAll('.tn-dd'),function(d){ d.classList.toggle('on',(' '+d.getAttribute('data-ids')+' ').indexOf(' '+id+' ')>=0); });
}
/* nút Sáng/Tối của theme-v5 → chuyển lên thanh ngang */
function moveTheme(){ var b=document.getElementById('bx-v5-theme'), slot=document.querySelector('#bx-topnav .tn-theme-slot');
  if(b&&slot&&b.parentNode!==slot){ slot.appendChild(b); return true; } return !!(b&&slot); }

var prevGo=window.go;
if(typeof prevGo==='function'){ window.go=function(id){ var r=prevGo.apply(this,arguments); try{ mark(id); }catch(e){} return r; }; }

/* tài khoản đăng nhập (có sau khi qua cổng Google) → cập nhật chữ viết tắt + nhãn Chỉ xem */
function syncUser(){ var av=document.querySelector('#bx-topnav .tn-av'); if(!av||!window.BX_USER) return false;
  var email=String(window.BX_USER); av.title=email; av.textContent=email==='brian.pham@bigx.vn'?'BP':email.slice(0,2).toUpperCase();
  var right=av.parentNode; if(window.BX_ROLE==='viewer' && !right.querySelector('.tn-ro')){ var r=document.createElement('span'); r.className='tn-ro'; r.textContent='Chỉ xem'; right.insertBefore(r,av); }
  return true; }

var n=0;(function tick(){ build(); var a=moveTheme(), b=syncUser(); if(!(a&&b) && n++<300) setTimeout(tick,100); })();
})();
