(function(){
'use strict';
if(window.__REDEEM_APP_READY__)return;
window.__REDEEM_APP_VERSION__='classic-short-v1';
// 杩滅▼ JSON 涓汇€佸鐢ㄥ湴鍧€鍙湪姝ゅ閰嶇疆銆�
var BACKEND_CONFIG_URLS=[
 'https://gh-proxy.org/https://raw.githubusercontent.com/keluo8824-cell/xmbox/refs/heads/main/js2/backend.json',
 'https://cdn.jsdelivr.net/gh/keluo8824-cell/xmbox@main/js2/backend.json',
 'https://lq520.cn/var/Typecho/Http/backend.json'
];
var REQUEST_TIMEOUT_MS=5000;
var API='';
var SITE=new URLSearchParams(location.search).get('site')||'';
if(!/^(?:[a-f0-9]{24}|[a-z][0-9]{2})$/.test(SITE))return;
function unavailable(){document.title='404';document.body.innerHTML='<main style="padding:15vh 20px;text-align:center"><h1>404</h1><p>椤甸潰涓嶅瓨鍦�</p></main>';}

var plans=[];
var freeVisible=false;
var selectedPlan=0;
var payType='wxpay';
var notice='璇疯浣忓厬鎹㈢爜锛屾墦寮€杞欢 APP锛岃緭鍏ュ厬鎹㈢爜锛屽崌绾т細鍛樸€�';

function el(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fetchJson(url,opt){
  opt=opt||{};
  opt.cache="no-store";
  var request=fetch(url,opt).then(function(r){return r.json().then(function(d){if(!r.ok){var err=new Error(d.message||('HTTP '+r.status));err.code=d.code;throw err;}return d;});});
  if(opt.method==='POST')return request;
  return new Promise(function(resolve,reject){var timer=setTimeout(function(){reject(new Error('杩炴帴瓒呮椂'));},REQUEST_TIMEOUT_MS);request.then(function(d){clearTimeout(timer);resolve(d);},function(e){clearTimeout(timer);reject(e);});});
}
function post(path,data){
  data.site=SITE;
  return fetchJson(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
}
// Resolve with the first complete, valid response; losing GET requests never change API.
function firstSuccess(tasks){
 return new Promise(function(resolve,reject){
  var left=tasks.length,lastError=null,siteError=null;
  if(!left){reject(new Error('娌℃湁鍙敤鍦板潃'));return;}
  tasks.forEach(function(task){Promise.resolve().then(task).then(resolve,function(e){
   lastError=e;if(e.code==='SITE_NOT_FOUND')siteError=e;
   if(--left===0)reject(siteError||lastError);
  });});
 });
}
function loadRemoteConfig(){
 var seen={};
 return firstSuccess(BACKEND_CONFIG_URLS.map(function(url){return function(){
  return fetchJson(url+(url.indexOf('?')<0?'?':'&')+'t='+Date.now()).then(function(cfg){
   if(!cfg||!Array.isArray(cfg.backends)||!cfg.backends.length)throw new Error('鍚庡彴閰嶇疆鏍煎紡鏃犳晥');
   return firstSuccess(cfg.backends.map(function(base){return function(){
    base=String(base||'').replace(/\/+$/,'');
    if(!/^https?:\/\//i.test(base)||/\.example\.com(?:[/:]|$)/i.test(base))throw new Error('鍚庡彴鍦板潃鏈厤缃�');
    if(location.protocol==='https:'&&/^http:/i.test(base))throw new Error('HTTPS鍓嶅彴闇€瑕丠TTPS鍚庡彴鍏ュ彛');
    if(!seen[base])seen[base]=fetchJson(base+'/api/public_config.php?site='+encodeURIComponent(SITE)+'&t='+Date.now()).then(function(d){
     if(!d||d.ok!==true||!Array.isArray(d.plans))throw new Error('鍒嗙珯鍐呭鏃犳晥');
     return {base:base,data:d};
    });
    return seen[base];
   };}));
  });
 };})).then(function(result){API=result.base;return result.data;});
}
function load(){
  loadRemoteConfig().then(function(d){
    document.documentElement.classList.add('site-valid');
    document.title=String(d.site_name||'鍏戞崲鐮佽喘涔颁腑蹇�');
    el('homeNotice').textContent=d.home_notice||'';
    el('homeNoticeBox').hidden=!d.home_notice;
    notice=d.notice||notice;
    plans=d.plans||[];
    renderPlans();
    renderContent('tutorial',d.tutorial);renderContent('agent',d.agent);
    applyFreeSettings(d);
    showPage(location.hash.slice(1)||'home');
    var qs=new URLSearchParams(location.search);
    var order=qs.get('order');
    if(order){location.hash='query';showPage('query');el('queryText').value=order;}
  }).catch(function(e){
    if(e.code==='SITE_NOT_FOUND'){unavailable();return;}
    document.getElementById('site-gate').textContent='鍒嗙珯鍔犺浇澶辫触锛�'+e.message;
  });
}
function flagOn(v){return v===true || v===1 || v==='1';}
function applyFreeSettings(d){
  freeVisible=flagOn(d.free_visible);
  var link=document.querySelector('nav a[data-page=free]');link.hidden=!freeVisible;link.style.display=freeVisible?'':'none';
  var enabled=flagOn(d.free_enabled);var days=Number(d.free_interval_days)||0;
  el('freeRule').textContent=enabled ? (days===0?'涓嶉檺棰嗗彇鏃堕棿鍜屾鏁帮紝姣忔棰嗗彇涓€寮犲厬鎹㈢爜銆�':'鍚屼竴 IP 鎴栨祻瑙堝櫒璁惧鏍囪瘑锛屾瘡 '+days*24+' 灏忔椂鍙鍙栦竴娆°€�') : '鍏嶈垂棰嗗彇鏆傛湭寮€鏀�';
  el('claimBtn').disabled=!freeVisible || !enabled;
  if(!freeVisible && location.hash==='#free'){location.hash='home';showPage('home');}
}
function refreshFreeSettings(){
  if(!API || document.hidden)return;
  fetchJson(API+'/api/public_config.php?site='+encodeURIComponent(SITE)+'&t='+Date.now()).then(applyFreeSettings).catch(function(e){if(e.code==='SITE_NOT_FOUND')unavailable();});
}
window.addEventListener('focus',refreshFreeSettings);
document.addEventListener('visibilitychange',refreshFreeSettings);
setInterval(refreshFreeSettings,30000);
function renderPlans(){
  if(!plans.length){el('plans').innerHTML='<div class="muted">鏆傛棤鍙喘涔板椁�</div>';return;}
  selectedPlan=plans[0].id;
  el('plans').innerHTML=plans.map(function(p,i){
    return '<div class="plan '+(i===0?'active':'')+'" data-id="'+p.id+'"><b>'+esc(p.name)+'</b><div class="muted">'+p.days+' 澶�</div><div class="price">'+Number(p.price).toFixed(2)+'</div></div>';
  }).join('');
  Array.prototype.forEach.call(document.querySelectorAll('.plan'),function(n){
    n.onclick=function(){
      selectedPlan=parseInt(this.getAttribute('data-id'),10);
      Array.prototype.forEach.call(document.querySelectorAll('.plan'),function(x){x.classList.remove('active');});
      this.classList.add('active');
    };
  });
}
Array.prototype.forEach.call(document.querySelectorAll('.pay'),function(n){
  n.onclick=function(){
    payType=this.getAttribute('data-type');
    Array.prototype.forEach.call(document.querySelectorAll('.pay'),function(x){x.classList.remove('active');});
    this.classList.add('active');
  };
});
el('buyBtn').onclick=function(){
  var contact=el('contact').value.trim();
  if(!selectedPlan){alert('璇烽€夋嫨濂楅');return;}
  this.disabled=true; this.textContent='姝ｅ湪鍒涘缓璁㈠崟...';
  var btn=this;
  post('/api/create_order.php',{plan_id:selectedPlan,contact:contact,pay_type:payType})
    .then(function(d){
      if(!d.ok) throw new Error(d.message||'鍒涘缓璁㈠崟澶辫触');
      try{localStorage.setItem('last_order_no_'+SITE,d.order_no);}catch(e){}
      alert('璇蜂繚瀛樿鍗曞彿锛�'+d.order_no+'锛屾煡璇㈣鍗曟椂鍙渶濉啓瀹屾暣璁㈠崟鍙枫€�');
      location.href=d.pay_url;
    }).catch(function(e){alert(e.message);btn.disabled=false;btn.textContent='绔嬪嵆璐拱';});
};
function queryOrder(){
  var q=el('queryText').value.trim();
  if(!q){alert('璇疯緭鍏ュ畬鏁磋鍗曞彿');return;}
  post('/api/query_order.php',{q:q}).then(function(d){
    if(!d.ok)throw new Error(d.message||'鏌ヨ澶辫触');
    if(!d.orders.length){el('orders').innerHTML='<p class="muted">娌℃湁鏌ュ埌璁㈠崟</p>';return;}
    el('orders').innerHTML=d.orders.map(function(o){
      var st=Number(o.status)===1?'宸叉敮浠�':'鏈敮浠�';
      var card=o.card_code?'<div>鍏戞崲鐮侊細<b style="color:#62e6a5">'+esc(o.card_code)+'</b></div>':'';
      return '<div class="order"><div>璁㈠崟锛�'+esc(o.order_no)+'</div><div>'+esc(o.plan_name)+' / '+Number(o.amount).toFixed(2)+' / '+st+'</div>'+card+'<div class="muted">'+esc(o.created_at)+'</div></div>';
    }).join('');
    if(d.orders[0].card_code){
      el('cardCode').textContent=d.orders[0].card_code;
      el('notice').textContent=notice;
      el('successBox').style.display='block';
    }
  }).catch(function(e){alert(e.message);});
}
el('queryBtn').onclick=queryOrder;
function showPage(page){
  if(['home','tutorial','free','query','agent'].indexOf(page)<0 || (page==='free' && !freeVisible))page='home';
  // 鏍囬鍖哄煙宸叉敼涓哄叏绔欏叕鍛娿€�
  ['home','tutorial','free','query','agent'].forEach(function(p){el('page-'+p).hidden=p!==page;});
  Array.prototype.forEach.call(document.querySelectorAll('nav a'),function(a){a.classList.toggle('active',a.getAttribute('data-page')===page);});
}
window.addEventListener('hashchange',function(){showPage(location.hash.slice(1));});
showPage(location.hash.slice(1)||'home');
function renderContent(key,data){
 data=data||{};el(key+'Text').textContent=data.text||'鏆傛棤鍐呭锛岃绋嶅悗鏌ョ湅銆�';
 el(key+'Images').textContent='';
 (data.images||[]).forEach(function(url){if(!/^https?:\/\//i.test(url))return;var img=document.createElement('img');img.src=url;img.alt=key==='tutorial'?'鏁欑▼鍥剧墖':'浠ｇ悊鎷涘晢鍥剧墖';img.loading='lazy';el(key+'Images').appendChild(img);});
}
function deviceId(){
 var id;try{id=localStorage.getItem('free_device_id');}catch(e){}
 if(!id){var match=document.cookie.match(/(?:^|; )free_device_id=([a-f0-9]{64})(?:;|$)/);if(match)id=match[1];}
 if(!/^[a-f0-9]{64}$/.test(id||'')){
  if(!window.crypto||!crypto.getRandomValues)throw new Error('娴忚鍣ㄤ笉鏀寔璁惧鏍囪瘑锛岃鏇存柊娴忚鍣�');
  var bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  id=Array.prototype.map.call(bytes,function(b){return ('0'+b.toString(16)).slice(-2);}).join('');
 }
 var stored=false;try{localStorage.setItem('free_device_id',id);stored=localStorage.getItem('free_device_id')===id;}catch(e){}
 document.cookie='free_device_id='+id+'; Max-Age=31536000; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
 if(!stored&&document.cookie.indexOf('free_device_id='+id)<0)throw new Error('璇峰厑璁告祻瑙堝櫒淇濆瓨缃戠珯鏁版嵁鍚庡啀棰嗗彇');
 return id;
}
el('claimBtn').onclick=function(){
 var btn=this;el('freeTitle').textContent='鍏嶈垂棰嗗彇涓€澶╁厬鎹㈢爜';el('freeRule').hidden=false;btn.disabled=true;btn.textContent='姝ｅ湪棰嗗彇鈥�';el('freeStatus').textContent='';el('freeResult').hidden=true;
 var id;try{id=deviceId();}catch(e){el('freeStatus').textContent=e.message;btn.disabled=false;btn.textContent='棰嗗彇鍏嶈垂鍏戞崲鐮�';return;}
 post('/api/claim_free.php',{device_id:id}).then(function(d){
  if(d.code==='ALREADY_CLAIMED'){
   el('freeStatus').textContent=d.message;
   alert('鎮ㄥ凡棰嗗彇杩囧厬鎹㈢爜锛屽墿浣欑害 '+Math.ceil(d.retry_after/3600)+' 灏忔椂鍙啀娆￠鍙栥€傝繑鍥為椤佃喘涔板椁愩€�');
   location.hash='home';showPage('home');return;
  }
  if(d.code==='OUT_OF_STOCK'){el('freeStatus').textContent=d.message;setTimeout(function(){location.hash='home';showPage('home');},1500);return;}
  if(!d.ok)throw new Error(d.message||'棰嗗彇澶辫触');
  el('freeCode').textContent=d.card_code;el('freeResult').hidden=false;el('freeTitle').textContent='鎭枩浣犲厤璐硅幏鍙栦竴鍏戞崲鐮�';el('freeRule').hidden=true;el('freeStatus').textContent='';
 }).catch(function(e){el('freeStatus').textContent=e.message;}).then(function(){btn.disabled=false;btn.textContent='棰嗗彇鍏嶈垂鍏戞崲鐮�';});
};
el('copyFree').onclick=function(){
 var text=el('freeCode').textContent;
 function fallback(){var t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}t.remove();el('freeStatus').textContent=ok?'鍏戞崲鐮佸凡澶嶅埗锛岃鍦ㄨ蒋浠朵腑浣跨敤銆�':'璇烽暱鎸夊厬鎹㈢爜鎵嬪姩澶嶅埗锛屽苟淇濆瓨銆�';}
 if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(function(){el('freeStatus').textContent='鍏戞崲鐮佸凡澶嶅埗锛岃鍦ㄨ蒋浠朵腑浣跨敤銆�';}).catch(fallback);}else fallback();
};
window.__REDEEM_APP_READY__=true;
load();
})();
