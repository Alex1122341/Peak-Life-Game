/* Live town for Floating Life. Original SVG animation and real-time simulation. */
(function(){
'use strict';
var api=window.__FUSHI_BRIDGE__;if(!api)return;
var $=function(s){return document.querySelector(s)};
var esc=function(t){return String(t||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})};
var fmt=function(n){return Math.round(Number(n)||0).toLocaleString('zh-CN')};
var roll=function(a,b){return Math.floor(Math.random()*(b-a+1))+a};
var colors={scholar:['#527ba6','#dce9f1','#395d85'],merchant:['#468678','#dfd3a1','#37675a'],farmer:['#a5815b','#ece0bb','#6e543b'],soldier:['#aa5547','#e8c07b','#6d413a'],healer:['#937ab5','#efe1d2','#67518e'],artisan:['#b8794f','#e9d5b6','#88512e'],spouse:['#d9a05a','#f8e8c9','#b57365'],child:['#8fb977','#e2edc9','#527c4b']};
function doll(role){
 var c=colors[role]||colors.scholar;
 var item=role==='scholar'?'<path d="M65 95l17-11 7 10-18 11z" fill="#faf0c7" stroke="#927549" stroke-width="2"/><path d="M73 91l6 4m-9 1 7 4" stroke="#aa8a63"/>':role==='merchant'?'<rect x="67" y="79" width="20" height="23" rx="2" fill="#b58a57" stroke="#755b3b" stroke-width="2"/><path d="M71 84h12m-12 7h12m-12 6h12m-6-13v16" stroke="#65543d" stroke-width="2"/>':role==='farmer'?'<path d="M80 67l-5 42" stroke="#8b5c35" stroke-width="4"/><path d="M65 71q17-21 26 1z" fill="#a5aba5" stroke="#737a74" stroke-width="2"/>':role==='soldier'?'<path d="M77 66l-3 44" stroke="#a77a58" stroke-width="4"/><path d="M74 67h13l-8 24-7-3z" fill="#d2dddc" stroke="#69757a" stroke-width="2"/>':role==='healer'?'<path d="M78 72v-11m0 16q-12-22-17-11m18 11q12-21 17-12" stroke="#6d9d6b" stroke-width="3" fill="none"/><path d="M69 86q12-8 24 0l-4 17H72z" fill="#b99c6e" stroke="#8b7753" stroke-width="2"/>':role==='artisan'?'<path d="M80 74l-8 34m0-32 14 6" stroke="#80633f" stroke-width="5"/>':role==='child'?'<path d="M78 62l11 21-20 3z" fill="#ecc96c" stroke="#957249" stroke-width="2"/><path d="M83 83l-13 25" stroke="#957249" stroke-width="2"/>':'<path d="M75 85q10-8 15 3l-9 13-14-5z" fill="#f5d3a2" stroke="#986a54" stroke-width="2"/>';
 return '<svg viewBox="0 0 100 138" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">'+
 '<ellipse cx="51" cy="132" rx="28" ry="5" fill="#244735" opacity=".22"/>'+
 '<path d="M33 105l-3 25h20l1-24m5-1v25h19l-7-25" fill="#e5dcc9" stroke="#55504e" stroke-width="3"/>'+
 '<path d="M30 127h18v7H24q-6-4 6-7zm26 0h17q12 5 3 7H55z" fill="#55483f"/>'+
 '<path d="M28 70Q10 80 14 107l16 10 10-24m28-23q18 10 19 37l-13 11-13-26" fill="'+c[0]+'" stroke="'+c[2]+'" stroke-width="3"/>'+
 '<path d="M31 70q-11 20-4 52h49q7-35-7-52-19-9-38 0z" fill="'+c[0]+'" stroke="'+c[2]+'" stroke-width="3"/>'+
 '<path d="M40 73l11-5-6 53H32zM60 73l-9-5 5 53h18z" fill="'+c[1]+'" opacity=".9"/>'+
 '<path d="M31 96h42v9H31z" fill="'+c[2]+'"/><rect x="47" y="95" width="9" height="13" rx="2" fill="#e6b778" stroke="'+c[2]+'" stroke-width="1.5"/>'+
 '<path d="M26 103q-9 2-6 9l10 4 5-11m40 0q9 2 6 9l-10 4-5-11" fill="#f5c8a9" stroke="#9d7260" stroke-width="2"/>'+
 '<ellipse cx="50" cy="43" rx="30" ry="32" fill="#f5c6a4" stroke="#4a3532" stroke-width="3"/>'+
 '<path d="M20 45Q9 18 30 10q20-16 39 0 22 10 12 35-7-14-13-15-15 2-20-12-7 15-26 19z" fill="#3b2b2d" stroke="#35282b" stroke-width="2"/>'+
 '<path d="M33 13q12-20 29 0" fill="none" stroke="#35272c" stroke-width="8" stroke-linecap="round"/>'+
 '<ellipse cx="39" cy="47" rx="4" ry="5.5" fill="#332b2f"/><ellipse cx="62" cy="47" rx="4" ry="5.5" fill="#332b2f"/>'+
 '<circle cx="40" cy="45" r="1.5" fill="#fff"/><circle cx="63" cy="45" r="1.5" fill="#fff"/>'+
 '<ellipse cx="29" cy="58" rx="6" ry="3" fill="#ec9c96" opacity=".65"/><ellipse cx="73" cy="58" rx="6" ry="3" fill="#ec9c96" opacity=".65"/>'+
 '<path d="M44 63q7 6 14 0" stroke="#ad6c65" stroke-width="2.5" fill="none" stroke-linecap="round"/>'+
 (role==='soldier'?'<path d="M19 30l11-22h38l13 22-8 3H27z" fill="#a15b4a" stroke="#744436" stroke-width="3"/><path d="M50 8v21" stroke="#e8c380" stroke-width="4"/>':'')+
 (role==='merchant'?'<path d="M17 34q34-19 66 0l-2 10q-31-13-62 0z" fill="#476f62" stroke="#2c554a" stroke-width="2"/>':'')+
 (role==='spouse'?'<circle cx="82" cy="14" r="10" fill="#48312c"/><circle cx="84" cy="11" r="4" fill="#e7bf74"/>':'')+item+'</svg>';
}
var town=document.createElement('section');town.id='world-shell';town.className='world-shell hidden';town.setAttribute('aria-label','实时古风小镇');
town.innerHTML='<div class="world-bar"><div class="world-date" id="world-date">承和元年 · 正月<small>古风小镇</small></div>'+
 '<div class="world-controls"><button type="button" class="time-btn" data-time-speed="0">暂停</button><button type="button" class="time-btn" data-time-speed="1">1×</button><button type="button" class="time-btn" data-time-speed="2">2×</button><button type="button" class="time-btn" data-time-speed="4">4×</button></div></div>'+
 '<div class="world-progress"><div class="world-progress-fill" id="world-progress"></div></div>'+
 '<div class="scene" id="world-scene" data-season="春"><div class="sun"></div><div class="cloud"></div><div class="cloud c2"></div><div class="scene-hills back"></div><div class="scene-hills"></div><div class="scene-ground"></div>'+
 '<div class="tree" style="left:4%;bottom:82px"></div><div class="tree" style="right:1%;bottom:94px;transform:scale(.8)"></div>'+
 '<div class="house window" data-world-place="书院"><div class="house-name">书院</div></div>'+
 '<div class="house sign" data-world-place="集市"><div class="house-name">集市</div></div>'+
 '<div class="house trade" data-world-place="宅院"><div class="house-name">宅院</div></div>'+
 '<div class="world-people" id="world-people"></div><div class="butterfly"></div><div class="float-layer" id="float-layer"></div>'+
 '<div class="scene-tip" id="scene-tip">小人会自行活动 · 点击查看</div></div>'+
 '<div class="world-resources"><div class="world-resource"><strong class="money" id="world-silver">0</strong><small>银两</small></div>'+
 '<div class="world-resource"><strong id="world-fame">0</strong><small>名望</small></div>'+
 '<div class="world-resource"><strong id="world-income">0</strong><small>每月预计收入</small></div>'+
 '<div class="world-resource"><strong id="world-ap">3/3</strong><small>行动次数</small></div></div>'+
 '<div class="world-stats">'+
 ['wis','force','charm','virtue'].map(function(k,i){return '<div class="world-stat">'+['智略','武艺','魅力','德望'][i]+' <span class="number" id="world-'+k+'">0</span><div class="bar"><i id="bar-'+k+'"></i></div></div>'}).join('')+
 '</div><div class="world-ticker"><span class="dot"></span><span id="world-news">四季流转，命运不息。</span></div>';
var mast=$('.mast');if(!mast)return;mast.insertAdjacentElement('afterend',town);
var months=['','正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
var lastNow=performance.now(),saveElapsed=0,lastPersonKey='',lastLog='',lastMoney=null,lastState=null;
function getWorld(s){
 if(!s.world||!Number.isFinite(s.world.day)||s.world.day<1||s.world.day>360)
  s.world={day:1,yearKey:s.year,speed:1,elapsed:0,carry:0,incomePaid:0,globalDay:(s.year-1)*360,eventAt:(s.year-1)*360+roll(17,30)};
 var w=s.world;
 if(w.yearKey!==s.year){w.day=1;w.yearKey=s.year;w.incomePaid=0;w.carry=0;w.elapsed=0;w.eventAt=w.globalDay+roll(17,30)}
 if(![0,1,2,4].includes(Number(w.speed)))w.speed=1;
 if(!Number.isFinite(w.globalDay))w.globalDay=(s.year-1)*360+w.day-1;
 if(!Number.isFinite(w.elapsed))w.elapsed=0;
 if(!Number.isFinite(w.carry))w.carry=0;
 if(!Number.isFinite(w.incomePaid))w.incomePaid=0;
 if(!Number.isFinite(w.eventAt))w.eventAt=w.globalDay+roll(17,30);
 return w;
}
function announce(t){var n=$('#world-news');if(n)n.textContent=t}
function floater(t,bad){
 if(town.classList.contains('hidden'))return;
 var el=document.createElement('div');el.className='float-text'+(bad?' loss':'');el.textContent=t;
 el.style.left=roll(20,80)+'%';el.style.top=roll(110,166)+'px';
 $('#float-layer').appendChild(el);setTimeout(function(){el.remove()},2600);
}
function drawPeople(s){
 var key=[s.job,s.name,s.spouse,s.children.length].join('|');if(key===lastPersonKey)return;lastPersonKey=key;
 var roles=[[s.job,s.name],[s.spouse?'spouse':'merchant',s.spouse?'家人':'商贾'],[s.children.length?'child':'farmer',s.children.length?'孩童':'农人']];
 $('#world-people').innerHTML=roles.map(function(a,i){return '<div class="actor'+(i===0?' actor-main':'')+'" role="button" tabindex="0" aria-label="'+esc(a[1])+'" data-world-character="'+i+'" style="left:'+([21,53,78][i])+'%;bottom:'+([35,49,32][i])+'px;--duration:'+([7,11,9][i])+'s;--delay:-'+([2,5,1][i])+'s"><div class="actor-body">'+doll(a[0])+'</div><div class="actor-label">'+esc(a[1].slice(0,8))+'</div></div>'}).join('');
}
function refresh(s){
 town.classList.toggle('hidden',!s||s.gameOver);document.body.classList.toggle('playing',!!s&&!s.gameOver);document.body.classList.toggle('world-home',!!s&&document.querySelector('[data-tab="home"].active')!==null);
 if(!s)return;
 var w=getWorld(s),month=Math.min(12,Math.floor((w.day-1)/30)+1),dom=(w.day-1)%30+1;
 var season=['春','春','春','夏','夏','夏','秋','秋','秋','冬','冬','冬'][month-1];
 var hour=Math.floor(w.elapsed*24)%24,period=hour<6?'夜深':hour<11?'晨光':hour<17?'午后':hour<20?'黄昏':'入夜';
 $('#world-date').innerHTML='承和 '+s.year+' 年 · '+months[month]+dom+' 日<small>'+season+' · '+period+' · '+s.age+' 岁</small>';
 $('#world-scene').dataset.season=season;
 $('#world-progress').style.width=(w.day/360*100).toFixed(1)+'%';
 $('#world-silver').textContent=fmt(s.silver);$('#world-fame').textContent=fmt(s.fame);
 var econ=api.getEconomy();$('#world-income').textContent=fmt((econ.wage+econ.shops)/12);$('#world-ap').textContent=s.ap+'/3';
 ['wis','force','charm','virtue'].forEach(function(k){$('#world-'+k).textContent=fmt(s.stats[k]);$('#bar-'+k).style.width=Math.min(100,s.stats[k]/200*100)+'%'});
 town.querySelectorAll('[data-time-speed]').forEach(function(el){var on=Number(el.dataset.timeSpeed)===Number(w.speed);el.classList.toggle('selected',on);el.setAttribute('aria-pressed',String(on))});
 drawPeople(s);
 var latest=s.logs&&s.logs[0];if(latest&&latest.text!==lastLog){lastLog=latest.text;announce(latest.text)}
 if(lastMoney!==null&&lastMoney!==s.silver&&!w.justPaid){var diff=Math.round(s.silver-lastMoney);if(diff)floater((diff>0?'+':'')+fmt(diff)+' 两',diff<0)}
 lastMoney=s.silver;
}
function monthEnd(s,w){
 var econ=api.getEconomy();w.carry+=Math.max(0,(econ.wage+econ.shops)/12);
 var amount=Math.floor(w.carry);w.carry-=amount;
 if(amount){s.silver+=amount;w.incomePaid+=amount;w.justPaid=true;floater('+'+fmt(amount)+' 两');announce('岁月经营 · 俸禄与产业收入 +'+fmt(amount)+' 两')}
 if((w.day-1)%90===0){
  var stat={scholar:'wis',merchant:'charm',farmer:'virtue',soldier:'force',healer:'wis',artisan:'wis'}[s.job]||'wis';
  var names={wis:'智略',charm:'魅力',virtue:'德望',force:'武艺'};
  s.stats[stat]=Math.min(300,s.stats[stat]+1);floater('+1 '+names[stat]);announce('日积月累 · '+names[stat]+'提升 1 点');
 }
 api.save();api.render();w.justPaid=false;
}
function nextDay(s,w){
 w.day++;w.globalDay++;
 if((w.day-1)%30===0&&w.day>1)monthEnd(s,w);
 if(w.day>360){
  w.day=1;w.elapsed=0;api.annual();w.yearKey=s.year;w.eventAt=w.globalDay+roll(20,40);return true;
 }
 if(w.globalDay>=w.eventAt){
  w.eventAt=w.globalDay+roll(19,40);
  if(api.triggerEvent()){announce('新的剧情出现 · 时间暂停，等待选择');return true}
 }
 return false;
}
function decorateModal(){
 var modal=api.getModal(),el=$('#modal');if(!modal||modal.type!=='event'||!el||el.querySelector('.event-actors'))return;
 var st=document.createElement('div');st.className='event-actors';st.setAttribute('aria-hidden','true');
 st.innerHTML=doll(api.getState()?.job||'scholar')+'<span class="talk">✦</span>'+doll('spouse');
 var quote=el.querySelector('.quote');if(quote)quote.before(st);
}
function tick(){
 var now=performance.now(),delta=Math.min(700,Math.max(0,now-lastNow));lastNow=now;
 var s=api.getState();if(!s){refresh(null);return}
 var w=getWorld(s);var paused=document.hidden||s.gameOver||!!api.getModal()||w.speed===0;
 if(!paused){
  w.elapsed+=delta*w.speed/1000;
  var count=0;
  while(w.elapsed>=1&&count++<5){w.elapsed-=1;if(nextDay(s,w))break}
  saveElapsed+=delta;if(saveElapsed>=5000){api.save();saveElapsed=0}
 }
 if(s!==lastState){lastMoney=s.silver;lastState=s}
 refresh(s);decorateModal();
}
town.addEventListener('click',function(e){
 var s=api.getState();if(!s)return;
 var speed=e.target.closest('[data-time-speed]');
 if(speed){var w=getWorld(s);w.speed=Number(speed.dataset.timeSpeed);api.save();refresh(s);announce(w.speed?'时光以 '+w.speed+'× 自动流转':'时光暂停，点击速度恢复');return}
 var actor=e.target.closest('[data-world-character]');
 if(actor){var i=Number(actor.dataset.worldCharacter);
  announce(i===0?s.name+'正在'+({scholar:'研读卷宗',merchant:'经营商铺',farmer:'耕作田地',soldier:'巡视操练',healer:'采药行医',artisan:'修造器物'}[s.job]):i===1?(s.spouse?'家人来访，院中多了几分温暖':'商贾正在集市巡游'):(s.children.length?'孩子正在院中玩耍':'农人在田间忙碌'));floater('人间烟火');return}
 var house=e.target.closest('[data-world-place]');if(house)announce('这里是'+house.dataset.worldPlace+' · 在下方页面可进行相关行动');
});
town.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.closest('[data-world-character]')){e.preventDefault();e.target.click()}});
document.addEventListener('visibilitychange',function(){lastNow=performance.now();if(document.hidden)api.save()});
window.addEventListener('beforeunload',function(){api.save()});
setInterval(tick,220);tick();
window.__WORLD_TEST__={tick:tick,getWorld:function(){return api.getState()?.world},forceDays:function(n){var s=api.getState();if(!s)return;var w=getWorld(s);for(var i=0;i<n;i++){if(nextDay(s,w))break}refresh(s)},status:function(){var s=api.getState();return {playing:!!s,speed:s?.world?.speed}}};
})();