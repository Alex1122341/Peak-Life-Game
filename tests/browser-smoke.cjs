/* Browser-DOM smoke test for the real-time playable site. */
const fs=require('fs');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {JSDOM}=require('jsdom');
const html=fs.readFileSync('index.html','utf8');
const visual=fs.readFileSync('visual.js','utf8');
const core=html.match(/<script>([\s\S]*?)<\/script>/);
assert(core&&core[1],'core game script must be present');
new vm.Script(core[1],{filename:'core.js'});
new vm.Script(visual,{filename:'visual.js'});
const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.org/Peak-Life-Game/'});
const w=dom.window,d=w.document;
w.scrollTo=()=>{};
w.eval(core[1]);
w.eval(visual);
const click=s=>{const x=d.querySelector(s);assert(x,'missing '+s);x.click()};
assert(d.querySelector('[data-cmd="start"]'),'character creation should open');
click('[data-cmd="start"]');
w.__WORLD_TEST__.tick();
let state=w.__FUSHI_BRIDGE__.getState();
assert(state&&state.age===18,'character was created');
assert(!d.querySelector('#world-shell').classList.contains('hidden'),'town should appear');
assert.equal(d.querySelectorAll('#world-people .actor').length,3,'town should show animated figures');
assert(d.querySelector('#world-silver').textContent.length>0,'live silver HUD should render');
assert(d.querySelector('body').classList.contains('world-home'),'home should have compact HUD');
click('[data-time-speed="4"]');
assert.equal(state.world.speed,4,'4x speed should work');
click('[data-time-speed="0"]');
assert.equal(state.world.speed,0,'pause should work');
click('[data-time-speed="1"]');
assert.equal(state.world.speed,1,'resume should work');
const startDay=state.world.globalDay;
let eventCount=0;
for(let i=0;i<55;i++){
 if(state.event){
   const choices=[...d.querySelectorAll('[data-event-choice]')].filter(x=>!x.disabled);
   assert(choices.length>0,'event must have playable choices');
   choices[choices.length-1].click();eventCount++;
 }
 w.__WORLD_TEST__.forceDays(1);
}
if(state.event){
 const choice=[...d.querySelectorAll('[data-event-choice]')].filter(x=>!x.disabled).at(-1);
 assert(choice,'event choices required');choice.click();eventCount++;
}
assert(state.world.globalDay>startDay+30,'time must advance autonomously');
assert(state.world.incomePaid>0,'monthly silver must be credited');
assert(eventCount>0,'a random story event should fire');
assert(d.querySelector('#world-date').textContent.includes('承和'),'world date should render');
click('[data-tab="career"]');
w.__WORLD_TEST__.tick();
assert(!d.querySelector('body').classList.contains('world-home'),'career must not hide its content');
assert(d.querySelector('#screen').textContent.includes('六业皆可修'),'career view is available');
click('[data-tab="estate"]');
assert(d.querySelector('#screen').textContent.includes('坊市置业'),'business view is available');
click('[data-tab="family"]');
assert(d.querySelector('#screen').textContent.includes('红尘姻缘'),'family view is available');
w.close();
console.log('PASS: character, animated town, time controls, monthly silver, random events, career, estate, family, syntax');