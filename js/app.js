(function(){
'use strict';
if(window.__REDEEM_APP_READY__)return;
// 远程 JSON 主、备用地址只在此处配置。
var BACKEND_CONFIG_URLS=[
 'https://gh-proxy.org/https://raw.githubusercontent.com/keluo8824-cell/xmbox/refs/heads/main/js/backend.json',
 'https://cdn.jsdelivr.net/gh/keluo8824-cell/xmbox@refs/heads/main/js/backend.json'
];
var REQUEST_TIMEOUT_MS=8000;
var API='';
var plans=[];
var freeVisible=false;
var selectedPlan=0;
var payType='alipay';
var notice='请记住兑换码，打开软件 APP，输入兑换码，升级会员。';

function el(id){return document.getElementById(id);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fetchJson(url,opt){
  opt=opt||{};
  opt.cache="no-store";
  var request=fetch(url,opt).then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.message||('HTTP '+r.status));return d;});});
  if(opt.method==='POST')return request;
  return new Promise(function(resolve,reject){var timer=setTimeout(function(){reject(new Error('连接超时'));},REQUEST_TIMEOUT_MS);request.then(function(d){clearTimeout(timer);resolve(d);},function(e){clearTimeout(timer);reject(e);});});
}
function post(path,data){
  return fetchJson(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
}
function tryBackend(list,i){
  if(i>=list.length) return Promise.reject(new Error('所有后台地址都连接失败'));
  var base=String(list[i]||'').replace(/\/+$/,'');
  return fetchJson(base+'/api/health.php?t='+Date.now())
    .then(function(){API=base;return base;})
    .catch(function(){return tryBackend(list,i+1);});
}
function loadRemoteConfig(index){
  if(index>=BACKEND_CONFIG_URLS.length)return Promise.reject(new Error('主、备用配置及后台均连接失败'));
  var url=String(BACKEND_CONFIG_URLS[index]||'');
  if(!/^https?:\/\//i.test(url))return loadRemoteConfig(index+1);
  return fetchJson(url+(url.indexOf('?')<0?'?':'&')+'t='+Date.now()).then(function(cfg){
    if(!cfg || !Array.isArray(cfg.backends) || !cfg.backends.length)throw new Error('后台配置格式无效');
    return tryBackend(cfg.backends,0);
  }).then(function(){return fetchJson(API+'/api/public_config.php?t='+Date.now());}).then(function(d){
    if(!d || d.ok===false || !Array.isArray(d.plans))throw new Error('后台配置接口不可用');
    return d;
  }).catch(function(){return loadRemoteConfig(index+1);});
}
function load(){
  loadRemoteConfig(0).then(function(d){
    el('siteName').textContent=String(d.site_name||'兑换码购买中心').replace(/兑换码/g,'兑换码');
    document.title=el('siteName').textContent;
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
    el('plans').innerHTML='<div class="muted">系统连接失败：'+esc(e.message)+'</div>';
  });
}
function flagOn(v){return v===true || v===1 || v==='1';}
function applyFreeSettings(d){
  freeVisible=flagOn(d.free_visible);
  var link=document.querySelector('nav a[data-page=free]');link.hidden=!freeVisible;link.style.display=freeVisible?'':'none';
  var enabled=flagOn(d.free_enabled);var days=Number(d.free_interval_days)||0;
  el('freeRule').textContent=enabled ? (days===0?'不限领取时间和次数，每次领取一张兑换码。':'同一 IP 或浏览器设备标识，每 '+days*24+' 小时可领取一次。') : '免费领取暂未开放';
  el('claimBtn').disabled=!freeVisible || !enabled;
  if(!freeVisible && location.hash==='#free'){location.hash='home';showPage('home');}
}
function refreshFreeSettings(){
  if(!API || document.hidden)return;
  fetchJson(API+'/api/public_config.php?t='+Date.now()).then(applyFreeSettings).catch(function(){});
}
window.addEventListener('focus',refreshFreeSettings);
document.addEventListener('visibilitychange',refreshFreeSettings);
setInterval(refreshFreeSettings,30000);
function renderPlans(){
  if(!plans.length){el('plans').innerHTML='<div class="muted">暂无可购买套餐</div>';return;}
  selectedPlan=plans[0].id;
  el('plans').innerHTML=plans.map(function(p,i){
    return '<div class="plan '+(i===0?'active':'')+'" data-id="'+p.id+'"><b>'+esc(p.name)+'</b><div class="muted">'+p.days+' 天</div><div class="price">'+Number(p.price).toFixed(2)+'</div></div>';
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
  if(!selectedPlan){alert('请选择套餐');return;}
  this.disabled=true; this.textContent='正在创建订单...';
  var btn=this;
  post('/api/create_order.php',{plan_id:selectedPlan,contact:contact,pay_type:payType})
    .then(function(d){
      if(!d.ok) throw new Error(d.message||'创建订单失败');
      try{localStorage.setItem('last_order_no',d.order_no);}catch(e){}
      alert('请保存订单号：'+d.order_no+'，查询订单时只需填写完整订单号。');
      location.href=d.pay_url;
    }).catch(function(e){alert(e.message);btn.disabled=false;btn.textContent='立即购买';});
};
function queryOrder(){
  var q=el('queryText').value.trim();
  if(!q){alert('请输入完整订单号');return;}
  post('/api/query_order.php',{q:q}).then(function(d){
    if(!d.ok)throw new Error(d.message||'查询失败');
    if(!d.orders.length){el('orders').innerHTML='<p class="muted">没有查到订单</p>';return;}
    el('orders').innerHTML=d.orders.map(function(o){
      var st=Number(o.status)===1?'已支付':'未支付';
      var card=o.card_code?'<div>兑换码：<b style="color:#62e6a5">'+esc(o.card_code)+'</b></div>':'';
      return '<div class="order"><div>订单：'+esc(o.order_no)+'</div><div>'+esc(o.plan_name)+' / '+Number(o.amount).toFixed(2)+' / '+st+'</div>'+card+'<div class="muted">'+esc(o.created_at)+'</div></div>';
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
  el('homeHero').hidden=page!=='home';
  ['home','tutorial','free','query','agent'].forEach(function(p){el('page-'+p).hidden=p!==page;});
  Array.prototype.forEach.call(document.querySelectorAll('nav a'),function(a){a.classList.toggle('active',a.getAttribute('data-page')===page);});
}
window.addEventListener('hashchange',function(){showPage(location.hash.slice(1));});
showPage(location.hash.slice(1)||'home');
function renderContent(key,data){
 data=data||{};el(key+'Text').textContent=data.text||'暂无内容，请稍后查看。';
 el(key+'Images').textContent='';
 (data.images||[]).forEach(function(url){if(!/^https?:\/\//i.test(url))return;var img=document.createElement('img');img.src=url;img.alt=key==='tutorial'?'教程图片':'代理招商图片';img.loading='lazy';el(key+'Images').appendChild(img);});
}
function deviceId(){
 var id;try{id=localStorage.getItem('free_device_id');}catch(e){}
 if(!id){var match=document.cookie.match(/(?:^|; )free_device_id=([a-f0-9]{64})(?:;|$)/);if(match)id=match[1];}
 if(!/^[a-f0-9]{64}$/.test(id||'')){
  if(!window.crypto||!crypto.getRandomValues)throw new Error('浏览器不支持设备标识，请更新浏览器');
  var bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
  id=Array.prototype.map.call(bytes,function(b){return ('0'+b.toString(16)).slice(-2);}).join('');
 }
 var stored=false;try{localStorage.setItem('free_device_id',id);stored=localStorage.getItem('free_device_id')===id;}catch(e){}
 document.cookie='free_device_id='+id+'; Max-Age=31536000; Path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
 if(!stored&&document.cookie.indexOf('free_device_id='+id)<0)throw new Error('请允许浏览器保存网站数据后再领取');
 return id;
}
el('claimBtn').onclick=function(){
 var btn=this;el('freeTitle').textContent='免费领取一天兑换码';el('freeRule').hidden=false;btn.disabled=true;btn.textContent='正在领取…';el('freeStatus').textContent='';el('freeResult').hidden=true;
 var id;try{id=deviceId();}catch(e){el('freeStatus').textContent=e.message;btn.disabled=false;btn.textContent='领取免费兑换码';return;}
 post('/api/claim_free.php',{device_id:id}).then(function(d){
  if(d.code==='ALREADY_CLAIMED'){
   el('freeStatus').textContent=d.message;
   alert('您已领取过兑换码，剩余约 '+Math.ceil(d.retry_after/3600)+' 小时可再次领取。返回首页购买套餐。');
   location.hash='home';showPage('home');return;
  }
  if(d.code==='OUT_OF_STOCK'){el('freeStatus').textContent=d.message;setTimeout(function(){location.hash='home';showPage('home');},1500);return;}
  if(!d.ok)throw new Error(d.message||'领取失败');
  el('freeCode').textContent=d.card_code;el('freeResult').hidden=false;el('freeTitle').textContent='恭喜你免费获取一兑换码';el('freeRule').hidden=true;el('freeStatus').textContent='';
 }).catch(function(e){el('freeStatus').textContent=e.message;}).then(function(){btn.disabled=false;btn.textContent='领取免费兑换码';});
};
el('copyFree').onclick=function(){
 var text=el('freeCode').textContent;
 function fallback(){var t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();var ok=false;try{ok=document.execCommand('copy');}catch(e){}t.remove();el('freeStatus').textContent=ok?'兑换码已复制，请在软件中使用。':'请长按兑换码手动复制，并保存。';}
 if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(function(){el('freeStatus').textContent='兑换码已复制，请在软件中使用。';}).catch(fallback);}else fallback();
};
window.__REDEEM_APP_READY__=true;
load();
})();
