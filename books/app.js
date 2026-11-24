"use strict";
// All imported novel text stays in this browser's IndexedDB. No novel text is fetched from or uploaded to GitHub.
const DB_NAME="paper-books-v1", STORE_BOOKS="books", STORE_CHAPTERS="chapters";
const VOLUME_NAMES=["魔性不改","魔子出山","魔头乱世","魔君纵横","魔王雄霸","魔尊永生"];
const $=id=>document.getElementById(id);
const ui={book:null,chapter:0,reading:false,loading:false,tocOpen:false};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||a));
let toastTimer,dbPromise;
function toast(message){const el=$("toast");el.textContent=message;el.classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add("hidden"),3800);}
function status(message){$("status").textContent=message||"";}
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{if(!window.indexedDB){reject(new Error("此浏览器不支持本地书库"));return;}const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{const d=request.result;if(!d.objectStoreNames.contains(STORE_BOOKS))d.createObjectStore(STORE_BOOKS,{keyPath:"id"});if(!d.objectStoreNames.contains(STORE_CHAPTERS))d.createObjectStore(STORE_CHAPTERS,{keyPath:"key"});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return dbPromise;}
async function getBooks(){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(STORE_BOOKS,"readonly").objectStore(STORE_BOOKS).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function getChapter(id,index){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction(STORE_CHAPTERS,"readonly").objectStore(STORE_CHAPTERS).get(`${id}::${String(index).padStart(6,"0")}`);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function saveBook(book,chapters){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction([STORE_BOOKS,STORE_CHAPTERS],"readwrite");tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error("存储被取消"));const b=tx.objectStore(STORE_BOOKS),c=tx.objectStore(STORE_CHAPTERS);b.put(book);chapters.forEach((chapter,i)=>c.put({key:`${book.id}::${String(i+1).padStart(6,"0")}`,text:chapter.text}));});}
async function removeBook(id){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction([STORE_BOOKS,STORE_CHAPTERS],"readwrite");tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);const c=tx.objectStore(STORE_CHAPTERS),range=IDBKeyRange.bound(`${id}::`,`${id}::\uffff`);c.openCursor(range).onsuccess=e=>{const cur=e.target.result;if(cur){cur.delete();cur.continue();}};tx.objectStore(STORE_BOOKS).delete(id);});}
const progressKey=id=>`paper-reader-progress-v1:${id}`;
function readProgress(id){try{const obj=JSON.parse(localStorage.getItem(progressKey(id))||"{}");return {chapter:clamp(obj.chapter||1,1,100000),ratio:clamp(obj.ratio||0,0,1),bookmarks:Array.isArray(obj.bookmarks)?obj.bookmarks:[]};}catch{return {chapter:1,ratio:0,bookmarks:[]};}}
function writeProgress(id,p){try{localStorage.setItem(progressKey(id),JSON.stringify({...p,updatedAt:Date.now()}));}catch{toast("保存位置失败：浏览器空间不足");}}
function theme(){return localStorage.getItem("paper-books-theme")||"paper";}
function setTheme(t){document.body.dataset.theme=t;try{localStorage.setItem("paper-books-theme",t);}catch{}}
function titleOf(book,chapter){return book.toc[chapter-1]?.title||`第${chapter}章`;}
function card(book,kind){const el=document.createElement("article");el.className="book";const head=document.createElement("div");head.className="book-head";const cover=document.createElement("div");cover.className=`cover ${kind==="gu"?"fantasy":kind==="local"?"local":""}`;cover.textContent=kind==="seattle"?"西雅图 死亡档案":book.title;const meta=document.createElement("div");const name=document.createElement("strong");name.textContent=book.title;const author=document.createElement("p");author.textContent=(book.author||"个人藏书")+" · "+(kind==="seattle"?"在线500章":book.count?`${book.count}节`:(kind==="gu"?"待本机导入":""));const tag=document.createElement("span");tag.className="tag";tag.textContent=kind==="seattle"?"原创 · 在线":kind==="gu"?book.count?"已导入 · 未完结":"EPUB/TXT · 未完结":"本机书籍";meta.append(name,author,tag);head.append(cover,meta);const desc=document.createElement("p");desc.className="book-desc";desc.textContent=kind==="seattle"?"原创悬疑小说。沿用原阅读器、原书签和历史阅读进度。":kind==="gu"?"六卷原著。导入你的私人 EPUB/TXT 后，可离线阅读，记录独立书签。":`支持自动保存阅读位置。${book.count}节均在当前设备，不公开上传。`;const tools=document.createElement("div");tools.className="book-tools";
if(kind==="seattle"){const a=document.createElement("a");a.className="primary";a.href="../novel/";a.textContent="继续阅读";tools.append(a);}
else if(book.count){const p=readProgress(book.id),btn=document.createElement("button");btn.type="button";btn.className="primary";btn.textContent=`继续读 · ${Math.min(book.count,p.chapter)}/${book.count}`;btn.addEventListener("click",()=>openReader(book,p.chapter));tools.append(btn);const start=document.createElement("button");start.textContent="目录";start.addEventListener("click",()=>openReader(book,p.chapter,true));tools.append(start);const del=document.createElement("button");del.textContent="移除本机副本";del.className="danger";del.addEventListener("click",async()=>{if(!confirm(`仅从当前设备移除《${book.title}》的正文与阅读位置？不会删除原始文件。`))return;await removeBook(book.id);localStorage.removeItem(progressKey(book.id));await renderShelf();toast("已移除本机书籍");});tools.append(del);}
else{const btn=document.createElement("button");btn.className="primary";btn.textContent="导入原文";btn.addEventListener("click",pickFile);tools.append(btn);}
el.append(head,desc,tools);return el;}

function originalOnlineCard(local){
 const el=document.createElement("article");el.className="book";
 const head=document.createElement("div");head.className="book-head";
 const cover=document.createElement("div");cover.className="cover fantasy";cover.textContent="蛊真人";
 const meta=document.createElement("div"),name=document.createElement("strong"),author=document.createElement("p"),tag=document.createElement("span");
 name.textContent="蛊真人";author.textContent="原著 · 六卷 · 2331个章节位置";tag.className="tag";tag.textContent="原著 · 在线 · 未完结";
 meta.append(name,author,tag);head.append(cover,meta);
 const desc=document.createElement("p");desc.className="book-desc";desc.textContent="无需导入，在线分卷阅读；支持章节跳转、书签和阅读断点。";
 const tools=document.createElement("div");tools.className="book-tools";const link=document.createElement("a");link.className="primary";link.href="./gu-original/";link.textContent="在线阅读";tools.append(link);
 if(local&&local.count){const b=document.createElement("button");b.type="button";b.textContent="旧本机进度";b.addEventListener("click",()=>openReader(local,readProgress(local.id).chapter));tools.append(b);}
 el.append(head,desc,tools);return el;
}
function fanContinuationCard(){
 const el=document.createElement("article");el.className="book";
 const head=document.createElement("div");head.className="book-head";
 const cover=document.createElement("div");cover.className="cover fantasy";cover.textContent="蛊真人 续篇";
 const meta=document.createElement("div"),name=document.createElement("strong"),author=document.createElement("p"),tag=document.createElement("span");
 name.textContent="蛊真人 · 非官方续篇";author.textContent="第六卷第369—442节 · 74章";tag.className="tag";tag.textContent="同人创作 · 在线";
 meta.append(name,author,tag);head.append(cover,meta);
 const desc=document.createElement("p");desc.className="book-desc";
 desc.textContent="最新续写已上线。与原著单独阅读，支持目录、章节书签和浏览器本机阅读断点。";
 const tools=document.createElement("div");tools.className="book-tools";
 const link=document.createElement("a");link.className="primary";link.href="./gu-sequel/";link.textContent="在线阅读续篇";
 tools.append(link);el.append(head,desc,tools);return el;
}

async function renderShelf(){
 const grid=$("book-grid"),seattle={title:"西雅图死亡档案",author:"原创小说"};
 // Fixed titles must remain visible while the local database is being read or if Safari blocks it.
 grid.replaceChildren(card(seattle,"seattle"),originalOnlineCard(),fanContinuationCard());
 let books=[],dbError=null;
 try{
   books=await getBooks();
   // Metadata only, used to show imported titles on the site's game homepage.
   try{localStorage.setItem("paper-books-index-v1",JSON.stringify(books.map(b=>({id:b.id,title:b.title,count:b.count,updatedAt:b.updatedAt}))))}catch(e){console.warn("书架首页索引未保存",e);}
 }catch(e){
   dbError=e;console.error("本机书库读取失败",e);
   status("书架入口已显示，但当前浏览器无法读取本机小说：" +(e?.message||"请检查 Safari 网站数据设置"));
 }
 const gu=books.find(b=>b.id==="gu-zhen-ren");
 grid.replaceChildren(card(seattle,"seattle"),originalOnlineCard(gu),fanContinuationCard());
 for(const b of books.filter(x=>x.id!=="gu-zhen-ren").sort((a,b)=>b.updatedAt-a.updatedAt))grid.appendChild(card(b,"local"));
 const add=document.createElement("article");add.className="book add-book";
 const btn=document.createElement("button");btn.textContent="＋ 添加下一本";btn.addEventListener("click",pickFile);
 const p=document.createElement("p");p.textContent="不限书籍数量 · 支持 EPUB / TXT\n每本独立保存断点与书签";
 add.append(btn,p);grid.append(add);
 $("book-count").textContent=(3+books.filter(x=>x.id!=="gu-zhen-ren").length)+" 本可读 · 可继续添加";
}
function pickFile(){$("file-picker").click();}
function parseXML(s,type="application/xml"){return new DOMParser().parseFromString(s,type);}
function xmlText(doc,name){return doc.getElementsByTagNameNS("*",name)[0]?.textContent?.trim()||doc.getElementsByTagName(name)[0]?.textContent?.trim()||"";}
const utf8=bytes=>new TextDecoder("utf-8").decode(bytes);
function safePath(path){const arr=[];for(const part of path.split("/")){if(!part||part===".")continue;if(part==="..")arr.pop();else arr.push(part);}return arr.join("/");}
function volumeTitle(path){const match=path.match(/(?:^|\/)v([1-6])s\d+\./i);if(!match)return "正文";const n=Number(match[1]);return `第${n}卷 · ${VOLUME_NAMES[n-1]}`;}
function chapterFromXHTML(source,href,position){const doc=parseXML(source,"application/xhtml+xml");const body=doc.getElementsByTagNameNS("*","body")[0]||doc.getElementsByTagName("body")[0];if(!body)return null;const headings=Array.from(body.getElementsByTagNameNS("*","h1"));const title=headings[0]?.textContent?.trim()||xmlText(doc,"title")||`第${position}章`;let paras=Array.from(body.querySelectorAll("p,blockquote,li"));if(!paras.length)paras=Array.from(body.children);const lines=paras.map(p=>(p.textContent||"").trim()).filter(Boolean);return {title,volume:volumeTitle(href),text:lines.join("\n\n")};}
function zipIndex(bytes){
 const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),u16=o=>dv.getUint16(o,true),u32=o=>dv.getUint32(o,true);
 let eocd=-1;for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65558);p--){if(u32(p)===0x06054b50){eocd=p;break;}}
 if(eocd<0)throw Error("不是有效的 EPUB/ZIP 文件");const count=u16(eocd+10),end=u32(eocd+16),map=new Map();let p=end;
 if(count>20000)throw Error("EPUB 文件条目数量过多");
 for(let i=0;i<count;i++){
  if(p+46>bytes.length||u32(p)!==0x02014b50)throw Error("EPUB ZIP 目录已损坏");
  const method=u16(p+10),length=u32(p+20),nameLen=u16(p+28),extraLen=u16(p+30),commentLen=u16(p+32),offset=u32(p+42);
  const name=utf8(bytes.subarray(p+46,p+46+nameLen));
  if(offset+30>bytes.length||u32(offset)!==0x04034b50)throw Error("EPUB ZIP 内容已损坏");
  const body=offset+30+u16(offset+26)+u16(offset+28);
  if(body+length>bytes.length)throw Error("EPUB ZIP 数据不完整");
  map.set(name,{method,start:body,length});p+=46+nameLen+extraLen+commentLen;
 }
 return map;
}
async function parseEPUB(file){
 if(typeof DecompressionStream!=="function")throw Error("当前浏览器不支持 EPUB 解压，请升级 Safari");
 const buffer=await file.arrayBuffer();if(buffer.byteLength>70_000_000)throw Error("EPUB 文件过大（上限 70MB）");
 const bytes=new Uint8Array(buffer),entries=zipIndex(bytes);
 async function read(path){const e=entries.get(path);if(!e)return null;const chunk=bytes.subarray(e.start,e.start+e.length);if(e.method===0)return utf8(chunk);if(e.method!==8)throw Error("不支持的 ZIP 压缩格式");const raw=new Blob([chunk]).stream().pipeThrough(new DecompressionStream("deflate-raw"));return utf8(new Uint8Array(await new Response(raw).arrayBuffer()));}
 const container=await read("META-INF/container.xml");if(!container)throw Error("EPUB 缺少 META-INF/container.xml");
 const root=parseXML(container),opfPath=root.getElementsByTagNameNS("*","rootfile")[0]?.getAttribute("full-path");
 const opf=opfPath&&await read(opfPath);if(!opf)throw Error("未找到 EPUB 书籍目录");
 const doc=parseXML(opf),dir=opfPath.slice(0,opfPath.lastIndexOf("/")+1),items={};
 for(const item of Array.from(doc.getElementsByTagNameNS("*","item"))){const id=item.getAttribute("id"),href=item.getAttribute("href");if(id&&href)items[id]=safePath(dir+decodeURIComponent(href.split("#")[0]));}
 const chapters=[],spine=Array.from(doc.getElementsByTagNameNS("*","itemref"));
 for(let i=0;i<spine.length;i++){
  const path=items[spine[i].getAttribute("idref")],chapterText=path&&await read(path);
  if(!chapterText)continue;const ch=chapterFromXHTML(chapterText,path,chapters.length+1);
  if(ch&&ch.text.length>15)chapters.push(ch);
  if(i%50===0){status(`正在分析 EPUB：${i+1}/${spine.length} 节…`);await new Promise(resolve=>setTimeout(resolve,0));}
 }
 if(!chapters.length)throw Error("EPUB 中未找到可阅读的正文");
 return {title:xmlText(doc,"title")||file.name.replace(/\.epub$/i,""),author:xmlText(doc,"creator")||"未知作者",chapters};
}
function decodeTXT(bytes){const text=utf8(bytes);const failed=(text.match(/\ufffd/g)||[]).length;if(failed<=3)return text;try{return new TextDecoder("gb18030").decode(bytes);}catch{return text;}}

function chineseNumber(raw){
 if(/^\d+$/.test(raw))return Number(raw);
 const digits={"零":0,"〇":0,"一":1,"二":2,"两":2,"三":3,"四":4,"五":5,"六":6,"七":7,"八":8,"九":9};
 const units={"十":10,"百":100,"千":1000,"万":10000};let total=0,part=0,digit=0;
 for(const char of raw){if(Object.prototype.hasOwnProperty.call(digits,char)){digit=digits[char];continue;}const v=units[char];if(!v)return null;if(v===10000){total+=(part+digit)*v;part=0;digit=0;}else{part+=(digit||1)*v;digit=0;}}
 return total+part+digit;
}
function sectionNumber(title){const m=String(title||"").match(/第([一二三四五六七八九十百千万零〇两\d]+)[章节回]/);return m?chineseNumber(m[1]):null;}
async function parseTXT(file){
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.byteLength>120_000_000)throw new Error("TXT 文件过大（上限 120MB）");
 const text=decodeTXT(bytes).replace(/^\ufeff/,"").replace(/\r\n?/g,"\n"),looksGu=/蛊真人/.test(file.name)||/蛊真人/.test(text.slice(0,1500));
 let chapters=[],match,last=0,volume=1,previous=0;
 const headings=/^[ \t　]*(第([一二三四五六七八九十百千万零〇两\d]+)[章节回][ \t　]*[:：]?[^\n]{0,90})[ \t　]*$/gm;
 while((match=headings.exec(text))!==null){
  if(chapters.length)chapters[chapters.length-1].text=text.slice(last,match.index).trim();
  const number=sectionNumber(match[1]);
  if(looksGu&&number===1&&previous>=20&&volume<VOLUME_NAMES.length)volume++;
  const volumeName=looksGu?("第"+volume+"卷 · "+VOLUME_NAMES[volume-1]):"正文";
  chapters.push({title:match[1].trim(),volume:volumeName,number,text:""});
  if(number)previous=number;last=headings.lastIndex;
  if(chapters.length>12000)throw new Error("章节数量异常，已停止解析");
 }
 if(chapters.length)chapters[chapters.length-1].text=text.slice(last).trim();
 // Keep empty chapter headings, so later chapter numbers do not shift silently.
 if(!chapters.length){
  const sections=text.split(/\n\s*\n/g).filter(x=>x.trim());let buffer="",i=1;
  for(const p of sections){if(buffer.length>4500){chapters.push({title:"第"+i+++"部分",volume:"正文",text:buffer});buffer="";}buffer+=p.trim()+"\n\n";}
  if(buffer.trim())chapters.push({title:"第"+i+"部分",volume:"正文",text:buffer.trim()});
 }
 if(!chapters.length)throw new Error("文件没有有效正文");
 return {title:file.name.replace(/\.txt$/i,""),author:"本机导入",chapters};
}
async function importFile(file){if(!file)return;const ext=(file.name.split(".").pop()||"").toLowerCase();if(!["epub","txt"].includes(ext))throw new Error("请选择 EPUB 或 TXT 文件");status(`正在读取 ${file.name}，请保持页面打开…`);await new Promise(r=>setTimeout(r,50));const parsed=ext==="epub"?await parseEPUB(file):await parseTXT(file);const name=parsed.title.trim(),isGu=/蛊真人/.test(name)||/蛊真人/.test(file.name);let id=isGu?"gu-zhen-ren":`imported-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;if(isGu&&(await getBooks()).some(b=>b.id===id)){if(!confirm("这会替换当前设备已导入的《蛊真人》正文。继续？")){status("");return;}await removeBook(id);}const toc=parsed.chapters.map((c,i)=>({index:i+1,title:c.title,volume:c.volume||"正文",sectionNo:c.number||sectionNumber(c.title)||null}));const book={id,title:isGu?"蛊真人":name,author:parsed.author,count:toc.length,toc,source:"local",updatedAt:Date.now()};status(`正在保存 ${book.count} 节到本机…`);await saveBook(book,parsed.chapters);status(`已导入《${book.title}》，共 ${book.count} 节。正文仅在当前设备。`);await renderShelf();toast("导入完成，点击书籍即可阅读");}
function currentProgress(){return ui.book?readProgress(ui.book.id):null;}
function ratio(){const max=document.documentElement.scrollHeight-window.innerHeight;return max>0?Math.min(1,Math.max(0,scrollY/max)):0;}
function recordPosition(){if(!ui.reading||ui.loading||!ui.book)return;const p=currentProgress();p.chapter=ui.chapter;p.ratio=ratio();writeProgress(ui.book.id,p);$("progressline").style.width=(p.ratio*100).toFixed(1)+"%";}
async function openReader(book,ch=1,showToc=false){if(ui.reading)recordPosition();ui.book=book;ui.reading=true;ui.chapter=clamp(ch,1,book.count);$("shelf-view").classList.add("hidden");$("reader-view").classList.remove("hidden");$("reader-meta").textContent=book.title;await openChapter(ui.chapter);if(showToc)toggleToc(true);}
async function openChapter(n){if(!ui.book||n<1||n>ui.book.count)return;ui.loading=true;ui.chapter=n;const p=currentProgress();const restore=p.chapter===n?p.ratio:0;$("chapter-heading").textContent=titleOf(ui.book,n);$("book-heading").textContent=`${ui.book.title} · ${ui.book.toc[n-1]?.volume||"正文"}`;$("position-label").textContent=`${n} / ${ui.book.count}`;$("prev-chapter").disabled=n===1;$("next-chapter").disabled=n===ui.book.count;$("chapter-text").textContent="加载中…";$("toc-panel").classList.add("hidden");ui.tocOpen=false;const record=await getChapter(ui.book.id,n);if(!record){$("chapter-text").textContent="未找到该节正文，可尝试重新导入原文件。";ui.loading=false;return;}const frag=document.createDocumentFragment();const pars=(record.text.trim()?record.text.split(/\n\s*\n|\n/g).filter(x=>x.trim()):["原始文件中此章只有标题，未提供正文。"]);for(const line of pars){const el=document.createElement("p");el.textContent=line.trim();frag.appendChild(el);}$("chapter-text").replaceChildren(frag);p.chapter=n;p.ratio=restore;writeProgress(ui.book.id,p);updateBookmark();await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const max=document.documentElement.scrollHeight-window.innerHeight;window.scrollTo({top:max*restore,behavior:"instant"});ui.loading=false;$("progressline").style.width=(restore*100).toFixed(1)+"%";}

function updateJumpHint(){
 if(!ui.book)return;
 const global=$("toc-jump-mode").value==="all",vol=$("toc-volume").value;
 const relevant=ui.book.toc.filter(c=>c.volume===vol),highest=Math.max(1,...relevant.map(c=>c.sectionNo||sectionNumber(c.title)||0));
 $("toc-jump-number").min="1";$("toc-jump-number").max=String(global?ui.book.count:highest);
 $("toc-jump-number").placeholder=global?("1 - "+ui.book.count):("本卷节号 1 - "+highest);
 $("toc-jump-hint").textContent=global?"按全书目录位置跳转（1 - "+ui.book.count+"）":"按本卷的原始节号跳转；跳号或缺失章节不会被改写。";
}
function jumpToChapter(){
 if(!ui.book)return;
 const raw=$("toc-jump-number").value.trim(),num=Number(raw);
 if(!/^\d+$/.test(raw)||!Number.isSafeInteger(num)||num<1){toast("请输入有效的章节编号");return;}
 const global=$("toc-jump-mode").value==="all",volume=$("toc-volume").value;
 const target=global?ui.book.toc[num-1]:ui.book.toc.find(c=>c.volume===volume&&(c.sectionNo||sectionNumber(c.title))===num);
 if(!target){toast(global?"全书没有这个序号":"当前卷没有这个节号；可以切换卷或改用全书序号");return;}
 recordPosition();openChapter(target.index).catch(err=>{console.error(err);toast("打开章节失败");});
}
function toggleToc(force){ui.tocOpen=typeof force==="boolean"?force:!ui.tocOpen;$("toc-panel").classList.toggle("hidden",!ui.tocOpen);if(ui.tocOpen){const select=$("toc-volume");const vols=[...new Set(ui.book.toc.map(c=>c.volume))];select.replaceChildren();for(const v of vols){const opt=document.createElement("option");opt.value=v;opt.textContent=v;select.append(opt);}select.value=ui.book.toc[ui.chapter-1]?.volume||vols[0];$("toc-search").value="";renderToc();updateJumpHint();}}
function renderToc(){if(!ui.book)return;const filter=$("toc-search").value.trim().toLowerCase(),volume=$("toc-volume").value;const results=ui.book.toc.filter(c=>(filter?(`${c.index} ${c.title} ${c.volume}`).toLowerCase().includes(filter):c.volume===volume));const root=$("toc-list");root.replaceChildren();const frag=document.createDocumentFragment();for(const ch of results.slice(0,1200)){const el=document.createElement("button");el.type="button";el.className=ch.index===ui.chapter?"active":"";el.textContent=`${ch.index}. ${ch.title}`;el.addEventListener("click",()=>{recordPosition();openChapter(ch.index);});frag.append(el);}root.append(frag);if(results.length>1200){const msg=document.createElement("p");msg.textContent=`当前显示前1200节，可通过搜索定位剩余 ${results.length-1200} 节。`;root.append(msg);}}
function updateBookmark(){const p=currentProgress();$("bookmark-toggle").textContent=p?.bookmarks.includes(ui.chapter)?"★":"☆";}
function backShelf(){if(ui.reading)recordPosition();ui.reading=false;ui.book=null;ui.chapter=0;$("reader-view").classList.add("hidden");$("shelf-view").classList.remove("hidden");$("progressline").style.width="0";window.scrollTo(0,0);renderShelf();}
let throttled=false;window.addEventListener("scroll",()=>{if(throttled)return;throttled=true;requestAnimationFrame(()=>{throttled=false;recordPosition();});},{passive:true});window.addEventListener("pagehide",recordPosition);document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")recordPosition();});
$("import-top").addEventListener("click",pickFile);$("import-hero").addEventListener("click",pickFile);$("file-picker").addEventListener("change",async e=>{const f=e.target.files?.[0];e.target.value="";if(!f)return;try{await importFile(f);}catch(err){console.error(err);status("导入失败："+err.message);toast("导入失败，请检查格式或可用存储空间");}});$("back-shelf").addEventListener("click",backShelf);$("prev-chapter").addEventListener("click",()=>{recordPosition();openChapter(ui.chapter-1);});$("next-chapter").addEventListener("click",()=>{recordPosition();openChapter(ui.chapter+1);});$("toc-toggle").addEventListener("click",()=>toggleToc());$("toc-volume").addEventListener("change",()=>{renderToc();updateJumpHint();});$("toc-search").addEventListener("input",renderToc);$("toc-jump-mode").addEventListener("change",updateJumpHint);$("toc-jump-go").addEventListener("click",jumpToChapter);$("toc-jump-number").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();jumpToChapter();}});$("jump-toggle").addEventListener("click",()=>{toggleToc(true);$("toc-jump-number").focus();});$("bookmark-toggle").addEventListener("click",()=>{if(!ui.book)return;const p=currentProgress();const i=p.bookmarks.indexOf(ui.chapter);if(i>=0)p.bookmarks.splice(i,1);else p.bookmarks.push(ui.chapter);writeProgress(ui.book.id,p);updateBookmark();toast(i>=0?"书签已移除":"书签已保存");});$("theme-toggle").addEventListener("click",()=>setTheme(theme()==="night"?"paper":"night"));const fsize=()=>clamp(localStorage.getItem("paper-books-font")||20,16,29);function font(v){const size=clamp(fsize()+v,16,29);document.documentElement.style.setProperty("--font-size",size+"px");localStorage.setItem("paper-books-font",size);}$("font-down").addEventListener("click",()=>font(-1));$("font-up").addEventListener("click",()=>font(1));
setTheme(theme());document.documentElement.style.setProperty("--font-size",fsize()+"px");renderShelf().catch(err=>{console.error(err);status("无法打开本机书库："+err.message);});if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
window.addEventListener("pageshow",()=>{if(!ui.reading)renderShelf().catch(console.error);});