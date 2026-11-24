"use strict";
/* Only original fan-continuation text is served here. Imported original works remain in books/ IndexedDB. */
const $=id=>document.getElementById(id);
const STORAGE_KEY="gu-fan-continuation-reader-v1";
const DEFAULT={current:"6-369",ratios:{},bookmarks:[],theme:"paper",font:20};
let state,manifest=null,chapterById=new Map(),batchCache=new Map(),current=null,opening=false,scrollQueued=false,toastTimer;
function loadState(){try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");return {...DEFAULT,...v,ratios:v.ratios&&typeof v.ratios==="object"?v.ratios:{},bookmarks:Array.isArray(v.bookmarks)?v.bookmarks:[]};}catch{return {...DEFAULT};}}
state=loadState();
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){console.error(e);notify("当前浏览器无法保存阅读进度");}}
function notify(msg){const el=$("toast");el.textContent=msg;el.classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add("hidden"),3500);}
function theme(){document.body.dataset.theme=state.theme==="night"?"night":"paper";document.documentElement.style.setProperty("--font-size",Math.min(28,Math.max(16,Number(state.font)||20))+"px");$("theme-button").textContent=state.theme==="night"?"日间":"夜间";$("font-range").value=state.font;}
function ratio(){const max=Math.max(0,document.documentElement.scrollHeight-window.innerHeight);return max===0?0:Math.max(0,Math.min(1,window.scrollY/max));}
function recordPosition(){if(!current||opening)return;state.current=current.id;state.ratios[current.id]=ratio();save();$("reading-progress").style.width=(state.ratios[current.id]*100).toFixed(1)+"%";}
window.addEventListener("scroll",()=>{if(scrollQueued)return;scrollQueued=true;requestAnimationFrame(()=>{scrollQueued=false;recordPosition();});},{passive:true});
window.addEventListener("pagehide",recordPosition);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")recordPosition();});
function label(c){return `第${c.volume}卷 · 第${c.number}节：${c.title}${c.rewriteVersion ? "【已重写】" : ""}`;}
function isBookmarked(id){return state.bookmarks.includes(id);}
function buildList(root,items){const frag=document.createDocumentFragment();for(const c of items){const b=document.createElement("button");b.type="button";b.textContent=label(c);b.className=current?.id===c.id?"active":"";b.addEventListener("click",()=>openChapter(c.id));frag.appendChild(b);}root.replaceChildren(frag);}
function renderBookmarks(){buildList($("bookmark-list"),state.bookmarks.map(id=>chapterById.get(id)).filter(Boolean));}
function renderLists(){buildList($("home-chapters"),manifest.chapters);filterToc();renderBookmarks();$("drawer-count").textContent=`${manifest.publishedCount} 章已发布 · 规划续写 ${manifest.plannedCount} 章`;
 const first=manifest.chapters[0],last=manifest.chapters.at(-1),rewritten=manifest.chapters.filter(c=>c.rewriteVersion>0);$("library-state").textContent=`已发布 ${manifest.publishedCount} 章 · 第${first.volume}卷第${first.number}节至第${last.volume}卷第${last.number}节 · ${manifest.publishedCount}/${manifest.plannedCount} 章${last.volume===6&&last.number===468?" · 第六卷续写完结，终卷尚未发布":""}${rewritten.length?` · 已重写 ${rewritten.length} 节，最新第${rewritten.at(-1).number}节`:""}`;
 $("continue-button").disabled=false;
}

function goToChapterNumber(){
 if(!manifest){notify("章节目录尚未加载");return;}
 const raw=$("jump-number").value.trim(),number=Number(raw),volume=Number($("jump-volume").value);
 if(!/^\d+$/.test(raw)||!Number.isSafeInteger(number)||number<1){notify("请输入有效的节号");return;}
 const target=manifest.chapters.find(c=>Number(c.volume)===volume&&Number(c.number)===number);
 if(!target){notify("没有找到该节，请检查卷和节号");return;}
 openChapter(target.id);
}
function fillJumpVolumes(){
 const select=$("jump-volume");select.replaceChildren();
 for(const volume of [...new Set(manifest.chapters.map(c=>Number(c.volume)))]){
  const option=document.createElement("option");option.value=String(volume);option.textContent="第"+volume+"卷";select.append(option);
 }
}
function filterToc(){const q=$("chapter-search").value.trim().toLowerCase();const items=manifest.chapters.filter(c=>label(c).toLowerCase().includes(q));buildList($("drawer-list"),items);}
async function readBatch(i){if(batchCache.has(i))return batchCache.get(i);const batch=manifest.batches[i];if(!batch)throw Error("未找到章节文件");const res=await fetch(batch.path,{cache:"no-store"});if(!res.ok)throw Error(`HTTP ${res.status}`);const content=await res.text();const markers=[...content.matchAll(/^第(\d+)节[:：]([^\r\n]*)$/gm)],pages=new Map();
 for(let j=0;j<markers.length;j++){const m=markers[j],to=markers[j+1]?markers[j+1].index:content.length;const body=content.slice(m.index+m[0].length,to).trim();pages.set(`${batch.volume}-${Number(m[1])}`,body);}batchCache.set(i,pages);return pages;}
function showReader(){ $("home-view").classList.add("hidden");$("reader-view").classList.remove("hidden");}
function closeDrawer(){ $("drawer-wrap").classList.add("hidden");$("drawer-wrap").setAttribute("aria-hidden","true");document.body.style.overflow="";}
function toggleDrawer(){const e=$("drawer-wrap"),opened=!e.classList.contains("hidden");e.classList.toggle("hidden",opened);e.setAttribute("aria-hidden",String(opened));document.body.style.overflow=opened?"":"hidden";if(!opened)renderLists();}
async function openChapter(id){const c=chapterById.get(id);if(!c){notify("没有找到该节");return;}recordPosition();opening=true;current=c;showReader();closeDrawer();$("chapter-title").textContent=`第${c.number}节：${c.title}${c.rewriteVersion ? "【已重写】" : ""}`;$("reader-book").textContent=c.volume===6?"第六卷 · 魔尊永生（续）":"第七卷 · 永生之外";
 const index=manifest.chapters.findIndex(x=>x.id===id);$("reader-position").textContent=`${index+1} / ${manifest.publishedCount} 章`;
 $("previous-button").disabled=index===0;$("next-button").disabled=index===manifest.chapters.length-1;$("next-button").textContent=index===manifest.chapters.length-1?"已是最新章节":"下一节 →";
 $("bookmark-button").textContent=isBookmarked(id)?"★ 已收藏":"☆ 加书签";
 $("chapter-body").textContent="正在载入正文…";
 try{const pages=await readBatch(c.batch);const text=pages.get(id);if(!text)throw Error("文件未收录章节 "+id);const frag=document.createDocumentFragment();for(const para of text.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)){const p=document.createElement("p");p.textContent=para;frag.appendChild(p);}$("chapter-body").replaceChildren(frag);
 state.current=id;save();history.replaceState(null,"",`#v${c.volume}-${c.number}`);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const r=Math.max(0,Math.min(1,Number(state.ratios[id])||0));window.scrollTo({top:r*Math.max(0,document.documentElement.scrollHeight-window.innerHeight),behavior:"instant"});$("reading-progress").style.width=(r*100).toFixed(1)+"%";
 }catch(e){console.error(e);$("chapter-body").textContent="章节载入失败："+e.message;notify("请检查网络并重试");}finally{opening=false;}
}
$("continue-button").addEventListener("click",()=>openChapter(chapterById.has(state.current)?state.current:manifest.chapters[0].id));
$("toc-button").addEventListener("click",toggleDrawer);$("close-drawer").addEventListener("click",closeDrawer);$("drawer-scrim").addEventListener("click",closeDrawer);$("chapter-search").addEventListener("input",filterToc);$("jump-go").addEventListener("click",goToChapterNumber);$("jump-number").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();goToChapterNumber();}});$("jump-button").addEventListener("click",()=>{if($("drawer-wrap").classList.contains("hidden"))toggleDrawer();$("jump-number").focus();});
$("previous-button").addEventListener("click",()=>{const i=manifest.chapters.findIndex(x=>x.id===current?.id);if(i>0)openChapter(manifest.chapters[i-1].id);});
$("next-button").addEventListener("click",()=>{const i=manifest.chapters.findIndex(x=>x.id===current?.id);if(i>=0&&i<manifest.chapters.length-1)openChapter(manifest.chapters[i+1].id);});
$("bookmark-button").addEventListener("click",()=>{if(!current)return;const i=state.bookmarks.indexOf(current.id);if(i>=0){state.bookmarks.splice(i,1);notify("已移除书签");}else{state.bookmarks.push(current.id);notify("书签已保存");}save();$("bookmark-button").textContent=isBookmarked(current.id)?"★ 已收藏":"☆ 加书签";renderBookmarks();});
$("theme-button").addEventListener("click",()=>{state.theme=state.theme==="night"?"paper":"night";theme();save();});
$("font-range").addEventListener("input",e=>{state.font=Number(e.target.value)||20;theme();save();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDrawer();});
async function boot(){theme();try{const res=await fetch("manifest.json",{cache:"no-store"});if(!res.ok)throw Error(`HTTP ${res.status}`);manifest=await res.json();chapterById=new Map(manifest.chapters.map(c=>[c.id,c]));fillJumpVolumes();renderLists();const hash=location.hash.match(/^#v(6|7)-(\d+)$/);const id=hash?`${hash[1]}-${Number(hash[2])}`:null;if(id&&chapterById.has(id))await openChapter(id);}catch(e){console.error(e);$("library-state").textContent="目录载入失败："+e.message;notify("无法读取同人续篇目录");}}
boot();
