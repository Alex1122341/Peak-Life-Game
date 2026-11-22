"use strict";
const KEY = "seattle-death-file-reader-v1";
const DEFAULTS = {chapter:1, progress:{}, bookmarks:[], theme:"paper", fontSize:19, leading:1.95};
const $ = id => document.getElementById(id);
const clamp = (value,min,max) => Math.min(max,Math.max(min,Number(value)||min));
function loadState(){try{const s=JSON.parse(localStorage.getItem(KEY))||{};return {...DEFAULTS,...s,progress:typeof s.progress==="object"&&s.progress?s.progress:{},bookmarks:Array.isArray(s.bookmarks)?s.bookmarks:[]};}catch{return {...DEFAULTS};}}
let state=loadState(), chapters=[], current=0, page="shelf", opening=false, toastTimer, throttled=false;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){console.warn("无法保存阅读进度",e);}}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add("hidden"),2300);}
function cn(n){const a=["零","一","二","三","四","五","六","七","八","九","十"];if(n<=10)return a[n];if(n<20)return "十"+(n%10?a[n%10]:"");if(n<100)return a[Math.floor(n/10)]+"十"+(n%10?a[n%10]:"");return String(n);}
function titleFor(id){const ch=chapters.find(x=>x.id===id);return ch?"第"+cn(id)+"章："+ch.title:"尚未开始阅读";}
function applyTheme(){document.body.dataset.theme=["paper","sepia","night"].includes(state.theme)?state.theme:"paper";document.documentElement.style.setProperty("--font-size",clamp(state.fontSize,16,27)+"px");document.documentElement.style.setProperty("--leading",clamp(state.leading,1.7,2.3));$("font-size").value=state.fontSize;$("font-size-label").textContent=state.fontSize+"px";document.querySelectorAll("[data-theme-option]").forEach(el=>el.classList.toggle("selected",el.dataset.themeOption===state.theme));document.querySelectorAll("[data-leading]").forEach(el=>el.classList.toggle("selected",Number(el.dataset.leading)===Number(state.leading)));}
function listChapters(target){target.replaceChildren();chapters.forEach(ch=>{const button=document.createElement("button");button.className="chapter-item"+(current===ch.id?" active":"");button.type="button";const label=document.createElement("span");label.textContent=titleFor(ch.id);const tail=document.createElement("span");tail.className="chapter-tail";const p=state.progress[ch.id];tail.textContent=p&&p.ratio>0?Math.round(p.ratio*100)+"%":ch.id===state.chapter?"上次阅读":"›";button.append(label,tail);button.addEventListener("click",()=>openChapter(ch.id,true));target.appendChild(button);});}
function renderShelf(){$("shelf").classList.remove("hidden");$("reader").classList.add("hidden");page="shelf";current=0;listChapters($("shelf-chapters"));const id=Math.min(Math.max(1,state.chapter||1),chapters.length||1);$("resume-title").textContent=titleFor(id);const p=state.progress[id];$("resume-sub").textContent=p&&p.ratio>0?"已阅读 "+Math.round(p.ratio*100)+"% · 自动保存":"点击即可开始阅读，进度自动保存";$("chapter-total").textContent="共 "+chapters.length+" 章";$("count-label").textContent=chapters.length+" 章";$("reading-progress").style.width="0%";window.scrollTo(0,0);}
function parseText(raw){return String(raw).replace(/\r\n?/g,"\n").trim().split(/\n\s*\n+/).map(s=>s.trim()).filter(Boolean);}
function scrollRatio(){const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);return max>0?clamp(window.scrollY/max,0,1):0;}
function savePosition(force=false){if(page!=="reader"||!current||opening)return;const ratio=scrollRatio(),old=state.progress[current]||{};if(!force&&Math.abs(ratio-(old.ratio||0))<.002)return;state.progress[current]={ratio,at:Date.now()};state.chapter=current;persist();$("reading-progress").style.width=Math.round(ratio*1000)/10+"%";}
window.addEventListener("scroll",()=>{if(throttled)return;throttled=true;requestAnimationFrame(()=>{throttled=false;savePosition();});},{passive:true});
window.addEventListener("pagehide",()=>savePosition(true));
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")savePosition(true);});
function closeDrawer(){$("overlay").classList.add("hidden");$("overlay").setAttribute("aria-hidden","true");document.body.style.overflow="";}
function drawer(type){$("drawer-title").textContent=type==="toc"?"章节目录":"阅读设置";$("toc-panel").classList.toggle("hidden",type!=="toc");$("settings-panel").classList.toggle("hidden",type!=="settings");if(type==="toc")listChapters($("toc-chapters"));applyTheme();$("overlay").classList.remove("hidden");$("overlay").setAttribute("aria-hidden","false");document.body.style.overflow="hidden";}
function updateBookmarkButton(){const exists=state.bookmarks.some(b=>b.chapter===current);$("bookmark-btn").textContent=exists?"★ 已加书签":"☆ 加书签";}
async function openChapter(id,recordHistory=true,restore=true){
const ch=chapters.find(c=>c.id===id);if(!ch){toast("未找到章节");return;}
if(page==="reader"&&!opening)savePosition(true);
closeDrawer();opening=true;$("shelf").classList.add("hidden");$("reader").classList.remove("hidden");page="reader";current=id;
$("chapter-title").textContent=titleFor(id);$("reader-count").textContent=id+" / "+chapters.length;
$("chapter-body").replaceChildren();const loading=document.createElement("p");loading.textContent="正在加载章节…";$("chapter-body").appendChild(loading);
$("prev-btn").disabled=id===chapters[0].id;$("next-btn").disabled=id===chapters[chapters.length-1].id;
$("next-btn").textContent=id===chapters[chapters.length-1].id?"已是最新章节":"下一章 →";updateBookmarkButton();window.scrollTo({top:0,behavior:"instant"});
if(recordHistory)history.pushState({chapter:id},"","#chapter-"+id);
try{
const response=await fetch(ch.path,{cache:"no-cache"});if(!response.ok)throw Error("HTTP "+response.status);
const body=await response.text();if(current!==id)return;
const frag=document.createDocumentFragment();
for(const para of parseText(body)){const p=document.createElement("p");p.textContent=para;if(para.startsWith("【")||para==="……"||para.startsWith("（本章完")||para.startsWith("（第"))p.classList.add("no-indent");frag.appendChild(p);}
$("chapter-body").replaceChildren(frag);state.chapter=id;persist();
await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
const saved=state.progress[id]||{},ratio=restore?clamp(saved.ratio||0,0,1):0;
const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);
window.scrollTo({top:max*ratio,behavior:"instant"});$("reading-progress").style.width=(ratio*100).toFixed(1)+"%";listChapters($("shelf-chapters"));
}catch(e){const p=document.createElement("p");p.textContent="章节加载失败，请检查网络或稍后重试。";const retry=document.createElement("button");retry.className="primary";retry.textContent="重新加载";retry.addEventListener("click",()=>openChapter(id,false,restore));$("chapter-body").replaceChildren(p,retry);console.error(e);}finally{opening=false;}
}
function navHome(push=true){if(page==="reader")savePosition(true);closeDrawer();if(push)history.pushState({shelf:true},"",location.pathname);renderShelf();}
async function onNavigation(){const m=location.hash.match(/^#chapter-(\d+)$/);if(m)await openChapter(Number(m[1]),false);else navHome(false);}
$("home-btn").addEventListener("click",()=>navHome());
$("resume-btn").addEventListener("click",()=>openChapter(Math.min(clamp(state.chapter,1,chapters.length),chapters.length),true,true));
$("prev-btn").addEventListener("click",()=>openChapter(current-1,true,false));
$("next-btn").addEventListener("click",()=>openChapter(current+1,true,false));
$("toc-btn").addEventListener("click",()=>drawer("toc"));
$("settings-btn").addEventListener("click",()=>drawer("settings"));
$("close-drawer").addEventListener("click",closeDrawer);
$("overlay").addEventListener("click",e=>{if(e.target.dataset.close)closeDrawer();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDrawer();});
$("bookmark-btn").addEventListener("click",()=>{const found=state.bookmarks.findIndex(b=>b.chapter===current);if(found>=0){state.bookmarks.splice(found,1);toast("已移除书签");}else{savePosition(true);state.bookmarks.push({chapter:current,ratio:scrollRatio(),at:Date.now()});toast("书签已保存");}persist();updateBookmarkButton();});
document.querySelectorAll("[data-theme-option]").forEach(b=>b.addEventListener("click",()=>{state.theme=b.dataset.themeOption;persist();applyTheme();}));
document.querySelectorAll("[data-leading]").forEach(b=>b.addEventListener("click",()=>{state.leading=Number(b.dataset.leading);persist();applyTheme();}));
$("font-size").addEventListener("input",e=>{state.fontSize=clamp(e.target.value,16,27);persist();applyTheme();});
$("export-btn").addEventListener("click",()=>{savePosition(true);const blob=new Blob([JSON.stringify({app:"seattle-death-file-reader",version:1,exportedAt:new Date().toISOString(),state:state},null,2)],{type:"application/json"});const a=document.createElement("a"),u=URL.createObjectURL(blob);a.href=u;a.download="西雅图死亡档案-阅读进度.json";a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);toast("已导出阅读进度");});
$("import-btn").addEventListener("click",()=>$("import-file").click());
$("import-file").addEventListener("change",async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data.app!=="seattle-death-file-reader"||typeof data.state!=="object")throw Error("格式无效");state={...DEFAULTS,...data.state,progress:typeof data.state.progress==="object"&&data.state.progress?data.state.progress:{},bookmarks:Array.isArray(data.state.bookmarks)?data.state.bookmarks:[]};state.chapter=clamp(state.chapter,1,chapters.length);persist();applyTheme();closeDrawer();renderShelf();toast("阅读进度已导入");}catch(e){toast("文件格式不正确");}e.target.value="";});
window.addEventListener("popstate",onNavigation);
async function boot(){applyTheme();try{const r=await fetch("./chapters.json",{cache:"no-cache"});if(!r.ok)throw Error("chapters.json "+r.status);chapters=await r.json();if(!Array.isArray(chapters)||!chapters.length)throw Error("目录为空");renderShelf();await onNavigation();}catch(e){console.error(e);$("resume-title").textContent="目录加载失败";$("resume-sub").textContent="请检查网络并刷新页面";toast("无法加载章节目录");}if("serviceWorker" in navigator)navigator.serviceWorker.register("./service-worker.js").catch(()=>{});}
boot();