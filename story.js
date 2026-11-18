/* 浮世一生：事件驱动人生 v4。所有成长与人生选择由事件产生。 */
window.__LIFE_EVENTS_FACTORY__ = function(ctx){
  'use strict';
  const {apply,ri,chance,log,JOBS,SHOPS,HOMES,RELICS,RETAINERS,NPCS}=ctx;
  const statName={wis:'智略',force:'武艺',charm:'魅力',virtue:'德望'};
  function skill(s,k,n,description){
    apply({[k]:n});log(description||('经历让你的'+statName[k]+'增加了 '+n+' 点。'),'成长');
  }
  function pathway(s,job){
    s.job=job;
    s.school='入世谋生';
    apply({fame:10,mood:8,[JOBS[job].stat]:12});
    log('十八岁成人，你选择「'+JOBS[job].name+'」，开启人生新篇。','志业');
  }
  function childOf(s){
    const names=['知远','清禾','云起','若溪','长安','行舟','乐之','思齐','明月','向晚'];
    const name=(s.name.charAt(0)||'林')+names[ri(0,names.length-1)];
    s.children.push({id:s.year+'_'+(s.children.length+1)+'_'+ri(1,999),name,age:0,gender:chance(.5)?'男':'女',wis:ri(25,55),force:ri(25,55),charm:ri(25,55),virtue:ri(25,55)});
    apply({mood:16,fame:9});
    log('家中添丁，给孩子取名「'+name+'」。','家族');
  }
  function advanceRank(s,boost=0){
    const job=JOBS[s.job],n=s.ranks[s.job]||0;
    const odds=Math.min(.92,.50+boost+(s.stats[job.stat]-35)/400+s.fame/3000);
    if(n>=5){apply({fame:24});log('你已位居此途顶峰，名声愈加显赫。','事业');return}
    if(chance(odds)){
      s.ranks[s.job]=n+1;
      apply({fame:32+n*12,silver:40+n*60,[job.stat]:8});
      log('通过评选，晋升「'+job.ranks[n+1]+'」。','事业');
    }else{
      apply({[job.stat]:12,mood:-3});
      log('评选虽未通过，你积累了宝贵经验。','事业');
    }
  }
  function milestone(age,name,kind,text,choices){
    return {id:'age_'+age,name,kind,text,age,choices};
  }
  const milestones=[
    milestone(6,'六岁 · 乡塾启蒙','入学','先生在村口开办私塾。家里决定送你入学，你希望怎样度过最初的读书时光？',[
      ['拜师识字','智略 +12，开启蒙学',s=>{s.school='乡塾蒙学';skill(s,'wis',12,'六岁入塾，识得百家姓，学问初开。')}],
      ['习射强身','武艺 +12，也在乡塾读书',s=>{s.school='乡塾蒙学';skill(s,'force',12,'习字之余勤练弓马，体魄渐长。')}],
      ['与同窗结友','魅力 +12，开启蒙学',s=>{s.school='乡塾蒙学';skill(s,'charm',12,'结交邻里学童，朋友渐多。')}]
    ]),
    milestone(10,'十岁 · 童试初阶','考试','先生说你已到了可以参加童试的年纪。第一次面对考官与数十位同龄学子，你准备如何选择？',[
      ['专心准备童试','智略 +16，可能获得名望',s=>{skill(s,'wis',16,'十岁苦读，科考试卷渐得章法。');if(chance(.6+s.stats.wis/600)){apply({fame:15});log('童试榜上有名，乡里称赞。','考试')}}],
      ['选择武馆试艺','武艺 +17，身体更强健',s=>{skill(s,'force',17,'你向武师学艺，在少年比试中崭露头角。');apply({health:4})}],
      ['随家人走访乡里','魅力 +9、德望 +9',s=>{apply({charm:9,virtue:9});log('你熟悉乡情，懂得体恤他人。','成长')}]
    ]),
    milestone(12,'十二岁 · 县学招生','升学','县学开设新班。师长认为你可以继续读书，也可以投入其他技艺学习。此后几年将影响你的志向。',[
      ['报读县学','智略 +18，进入县学',s=>{s.school='县学';skill(s,'wis',18,'升入县学，研读经史与策论。')}],
      ['进入武学','武艺 +18，学习兵书骑射',s=>{s.school='武学';skill(s,'force',18,'十二岁升入武学，习练骑射与兵法。')}],
      ['拜入商塾','魅力 +15、智略 +6',s=>{s.school='商塾';apply({charm:15,wis:6});log('你在商塾学习账簿与经营之道。','升学')}],
      ['留在家中学手艺','德望 +10、智略 +8',s=>{s.school='家传技艺';apply({virtue:10,wis:8});log('师傅耐心授艺，你渐渐精通手工。','升学')}]
    ]),
    milestone(15,'十五岁 · 州府深造','升学','州府书院招收优秀少年，地方武馆、医馆和工坊也向你伸出橄榄枝。',[
      ['参加书院选拔','智略 +22，进入州府书院',s=>{s.school='州府书院';skill(s,'wis',22,'十五岁考入州府书院，见识天下学问。')}],
      ['拜名将习武','武艺 +20，名望 +8',s=>{s.school='军武学堂';apply({force:20,fame:8});log('你进入军武学堂，精研阵法。','升学')}],
      ['去医馆做学徒','智略 +12、德望 +10',s=>{s.school='医馆学徒';apply({wis:12,virtue:10});log('你投身医馆，开始接诊与辨药。','升学')}],
      ['在商会实习','魅力 +18、银两 +70',s=>{s.school='商会学徒';apply({charm:18,silver:70});log('你通过商会实习获得第一笔工钱。','升学')}]
    ]),
    milestone(18,'十八岁 · 成年择业','成年','束发及冠，已到独当一面的年纪。家人问你：未来十年，希望走上怎样的道路？',[
      ['科举入仕','开启读书入仕的职业道路',s=>pathway(s,'scholar')],
      ['经营商号','开启经商之路',s=>pathway(s,'merchant')],
      ['治田兴农','开启耕读田园之路',s=>pathway(s,'farmer')],
      ['投身军旅','开启从军习武之路',s=>pathway(s,'soldier')],
      ['济世行医','开启医者之路',s=>pathway(s,'healer')],
      ['传承匠艺','开启工匠之路',s=>pathway(s,'artisan')]
    ]),
    milestone(22,'二十二岁 · 初试锋芒','立业','青年时光转瞬而过。第一场正式的职业考核到来，乡邻都在关注你的表现。',[
      ['争取晋升','可能晋升职业等级，同时获得名望',s=>advanceRank(s,.15)],
      ['拜访良师','职业主属性 +20',s=>skill(s,JOBS[s.job].stat,20,'拜访名师，职业本领大有精进。')],
      ['参加公益事务','德望 +15、名望 +20',s=>{apply({virtue:15,fame:20});log('你出力为乡里办事，赢得信赖。','立业')}]
    ]),
    milestone(27,'二十七岁 · 问鼎前程','事业','一次新的仕途、商路或行业机会摆在眼前，足以决定你未来数年的地位。',[
      ['把握机会升迁','高几率晋升，失败也可成长',s=>advanceRank(s,.23)],
      ['潜心深造','职业主属性 +22',s=>skill(s,JOBS[s.job].stat,22,'你决定继续深造，基础愈加扎实。')],
      ['开拓人脉','魅力 +14、名望 +18',s=>{apply({charm:14,fame:18});log('结交各方贤达，广结善缘。','事业')}]
    ]),
    milestone(35,'三十五岁 · 家业与抱负','转折','人生行至中年，家业、名声和内心的志向开始互相牵动。',[
      ['冲击更高职位','可能晋升，考验积累',s=>advanceRank(s,.20)],
      ['扩充田产','有钱可置业，否则增长经营学识',s=>{if(s.silver>=SHOPS[0].cost){s.shops.fields=(s.shops.fields||0)+1;apply({silver:-SHOPS[0].cost,fame:12});log('三十五岁购入良田，家业增厚。','家业')}else skill(s,'wis',11,'你学习经营，为将来积蓄经验。')}],
      ['以仁德为先','德望 +24，健康 +8',s=>{apply({virtue:24,health:8});log('你修桥铺路，乡里感念。','中年')}]
    ]),
    milestone(45,'四十五岁 · 盛年抉择','中年','四十五岁，功业已见轮廓。接下来是再进一层，还是悉心经营身边的人和事？',[
      ['挑战事业巅峰','再次获得晋升机会',s=>advanceRank(s,.28)],
      ['传授后辈','智略 +15、德望 +16',s=>{apply({wis:15,virtue:16});log('你把毕生经验传给后辈。','中年')}],
      ['安顿家业','银两 +250、健康 +8',s=>{apply({silver:250,health:8});log('你整理账目，家业更为稳固。','中年')}]
    ]),
    milestone(55,'五十五岁 · 岁月之重','暮年','发间渐染霜华，老友见面多谈养生与传承。你开始思考晚年的模样。',[
      ['求医养生','健康 +24，心境 +10',s=>{apply({health:24,mood:10});log('你专注养生，精神焕发。','暮年')}],
      ['编写家训','智略 +12、德望 +19',s=>{apply({wis:12,virtue:19});log('你总结家训，后人广为传读。','暮年')}],
      ['再访山河','魅力 +9、名望 +20',s=>{apply({charm:9,fame:20});log('你重游旧地，留下一段佳话。','暮年')}]
    ]),
    milestone(65,'六十五岁 · 子孙绕膝','暮年','晚辈齐聚厅堂，翻阅你多年来留下的足迹。新的故事仍在发生。',[
      ['赈济乡里','德望 +26、名望 +25',s=>{apply({virtue:26,fame:25});log('你晚年善行不辍，村中立碑致谢。','暮年')}],
      ['讲学著书','智略 +19，健康 +5',s=>{apply({wis:19,health:5});log('你设坛讲学，门生满座。','暮年')}],
      ['静享天伦','心境 +25、健康 +17',s=>{apply({mood:25,health:17});log('闲坐庭前，子孙欢笑，一生难得清闲。','暮年')}]
    ]),
    milestone(75,'七十五岁 · 回望此生','晚景','长夜点灯，你翻看自己写下的志书。远行的故人和已经完成的事，都在记忆里一一浮现。',[
      ['记下毕生所学','智略 +12、名望 +24',s=>{apply({wis:12,fame:24});log('你留下传世著作。','晚景')}],
      ['将财富用于乡里','德望 +24，银两 -200（若有）',s=>{const n=Math.min(s.silver,200);apply({silver:-Math.max(0,n),virtue:24});log('你以积蓄回馈乡里。','晚景')}],
      ['与亲眷共享晚年','心境 +20，健康 +12',s=>{apply({mood:20,health:12});log('安享晚年，亲眷常伴。','晚景')}]
    ])
  ];
  const youth=[
    {id:'y_books',name:'课桌上的旧书','kind':'童年',text:'书院角落有一本缺页古籍，同窗请你帮忙辨认文字。',when:s=>s.age>=6&&s.age<18,choices:[['查阅古籍','智略 +8',s=>skill(s,'wis',8,'你从旧书中学到新的字句。')],['讲给同窗听','魅力 +7',s=>skill(s,'charm',7,'你将古籍故事讲给朋友听。')],['将古籍送回','德望 +7',s=>skill(s,'virtue',7,'你把古籍归还藏书阁。')]]},
    {id:'y_market',name:'少年赶集',kind:'童年',text:'街市喧闹，人群拥挤。卖糖画的小贩正为缺少帮手发愁。',when:s=>s.age<18,choices:[['帮忙卖货','魅力 +8，银两 +16',s=>{apply({charm:8,silver:16});log('帮助小贩，学会与人讲价。','成长')}],['维护秩序','德望 +8',s=>skill(s,'virtue',8,'你帮大家排好队伍。')],['观察工艺','智略 +7',s=>skill(s,'wis',7,'你观察糖画手艺，增长见识。')]]},
    {id:'y_duel',name:'同窗比武',kind:'童年',text:'书院同窗邀请你到河堤比试身手。',when:s=>s.age>=7&&s.age<18,choices:[['全力应战','武艺 +9，健康 -2',s=>{apply({force:9,health:-2});log('你与同窗切磋，拳脚更熟练。','成长')}],['以和为贵','德望 +7，魅力 +4',s=>{apply({virtue:7,charm:4});log('你劝大家互相切磋，不争高低。','成长')}],['分析招式','智略 +8',s=>skill(s,'wis',8,'你仔细思考对手招式，悟出诀窍。')]]},
    {id:'y_teacher',name:'先生的难题',kind:'学业',text:'先生布置了一道难题，第二天要当众讲解，你如何准备？',when:s=>s.age>=6&&s.age<18,choices:[['熬夜钻研','智略 +11，心境 -2',s=>{apply({wis:11,mood:-2});log('你苦读至深夜，终于解出问题。','学业')}],['与朋友讨论','智略 +6、魅力 +6',s=>{apply({wis:6,charm:6});log('你与同窗互相讨论，得到启发。','学业')}],['请求先生指点','智略 +8、德望 +3',s=>{apply({wis:8,virtue:3});log('你虚心请教，学得新知。','学业')}]]},
    {id:'y_family',name:'家中小事',kind:'家事',text:'家里突然忙得不可开交，大人们请你帮着整理粮仓和书卷。',when:s=>s.age<18,choices:[['整理粮仓','德望 +8，银两 +10',s=>{apply({virtue:8,silver:10});log('你为家里分担事务。','家事')}],['清点账目','智略 +9',s=>skill(s,'wis',9,'你学会用算盘计算收支。')],['陪伴长辈','魅力 +6、心境 +9',s=>{apply({charm:6,mood:9});log('你陪伴长辈，家中其乐融融。','家事')}]]},
    {id:'y_festival',name:'元宵灯谜',kind:'童年',text:'灯火映满长街，少年们争相猜谜。你选择怎样参与？',when:s=>s.age<18,choices:[['猜灯谜','智略 +10，名望 +4',s=>{apply({wis:10,fame:4});log('你猜中了灯谜，赢得掌声。','童年')}],['表演剑舞','武艺 +9、魅力 +3',s=>{apply({force:9,charm:3});log('你上台表演剑舞，掌声不断。','童年')}],['照顾幼童','德望 +10',s=>skill(s,'virtue',10,'你帮助走失幼童找回家人。')]]},
    {id:'y_field',name:'田野远足',kind:'成长',text:'春光明媚，你和同学来到田间山坡。',when:s=>s.age<18,choices:[['攀山练体','武艺 +10，健康 +3',s=>{apply({force:10,health:3});log('你翻越山坡，脚步越发稳健。','成长')}],['写生记景','智略 +8',s=>skill(s,'wis',8,'你写下沿途见闻。')],['帮助农人','德望 +9',s=>skill(s,'virtue',9,'你帮助农人修整田埂。')]]}
  ];
  const grown=[
    {id:'ev_rank',name:'衙门与行会考核',kind:'事业',text:'本地官署与行会发来通知，邀请你参加年度考核。这个机会或许可以改变职业地位。',when:s=>s.age>=18&&(s.ranks[s.job]||0)<5,choices:[['应试争先','可能晋升职业等级',s=>advanceRank(s,.10)],['闭门研修','职业主属性 +13',s=>skill(s,JOBS[s.job].stat,13,'暂缓升迁，专心钻研本业。')],['去乡里办事','德望 +10，名望 +9',s=>{apply({virtue:10,fame:9});log('你用本领造福乡邻。','事业')}]]},
    {id:'ev_invest',name:'街市商机',kind:'经营',text:'城中新开放一片集市，商贩邀请你购买田地、开办小店。你该如何盘算？',when:s=>s.age>=18,choices:[['购置良田','240 两，可获得持续收入',s=>{s.shops.fields=(s.shops.fields||0)+1;apply({silver:-240});log('你在村外添置良田十亩。','产业')},s=>s.silver>=240],['开办茶坊','540 两，可获得持续收入',s=>{s.shops.teahouse=(s.shops.teahouse||0)+1;apply({silver:-540,fame:10});log('青竹茶坊开张，生意渐兴。','产业')},s=>s.silver>=540],['学习商道','魅力 +10，银两 +55',s=>{apply({charm:10,silver:55});log('你参与小集会，赚到一笔报酬。','经营')}]]},
    {id:'ev_big_business',name:'远方行会的合作',kind:'经营',text:'外地商会邀请你经营更大的产业。机不可失，然而风险也随之增长。',when:s=>s.age>=22,choices:[['合伙药铺','1,150 两，取得药铺',s=>{s.shops.apothecary=(s.shops.apothecary||0)+1;apply({silver:-1150,fame:15});log('你与药师合开药铺。','产业')},s=>s.silver>=1150],['投入西域商队','2,400 两，建立远方商路',s=>{s.shops.caravan=(s.shops.caravan||0)+1;apply({silver:-2400,fame:22});log('你加入西域商队，商路日渐通畅。','产业')},s=>s.silver>=2400],['观察行情','智略 +12、魅力 +8',s=>{apply({wis:12,charm:8});log('你研究商路变动，增加了阅历。','经营')}]]},
    {id:'ev_home',name:'宅院升迁',kind:'家业',text:'相邻宅院正在出售。你的家人希望有更宽敞的居所，是否改善家境？',when:s=>s.age>=19&&s.house<3,choices:[['迁入新居','支付相应费用，改善住宅',s=>{const n=s.house+1;apply({silver:-HOMES[n].cost,mood:12,fame:n*9});s.house=n;log('全家搬入「'+HOMES[n].name+'」。','家业')},s=>s.house<3&&s.silver>=HOMES[s.house+1].cost],['继续积攒银两','银两 +60',s=>{apply({silver:60});log('你决定先积累家资。','家业')}],['帮助邻里修缮','德望 +12',s=>skill(s,'virtue',12,'你帮乡亲修缮旧屋。')] ]},
    {id:'ev_love',name:'初见故人',kind:'姻缘',text:'春游时你在河畔结识了几位同道中人。彼此交谈甚欢，或许未来还会再见。',when:s=>s.age>=18&&!s.spouse,choices:[['结识书院先生','增加与沈云舒的情谊',s=>{s.relations.yun=Math.min(100,(s.relations.yun||0)+40);apply({wis:5,charm:7});log('你结识沈云舒，相谈甚欢。','姻缘')}],['结识商行掌柜','增加与林照晚的情谊',s=>{s.relations.lin=Math.min(100,(s.relations.lin||0)+40);apply({charm:10});log('你与林照晚讨论经商之道。','姻缘')}],['结识游侠','增加与陆青衡的情谊',s=>{s.relations.lu=Math.min(100,(s.relations.lu||0)+40);apply({force:7});log('与陆青衡畅谈江湖。','姻缘')}],['结识医者','增加与乔听雨的情谊',s=>{s.relations.qiao=Math.min(100,(s.relations.qiao||0)+40);apply({virtue:8});log('乔听雨与你分享治病救人之事。','姻缘')}]]},
    {id:'ev_wedding',name:'良缘将近',kind:'姻缘',text:'交往多年的故人递来一封书信，问你是否愿意在今年定下终身大事。',when:s=>s.age>=20&&!s.spouse&&Object.values(s.relations).some(v=>v>=40),choices:[['迎娶成婚','花费80两，以最高情谊者结为伴侣',s=>{const id=Object.keys(s.relations).sort((a,b)=>s.relations[b]-s.relations[a])[0];s.spouse=id;s.relations[id]=100;apply({silver:-80,mood:17,fame:13});log('你与'+NPCS.find(n=>n.id===id).name+'结为伴侣。','姻缘')},s=>s.silver>=80],['继续加深了解','魅力 +7、最高情谊 +20',s=>{const id=Object.keys(s.relations).sort((a,b)=>s.relations[b]-s.relations[a])[0];s.relations[id]=Math.min(100,s.relations[id]+20);skill(s,'charm',7,'你谨慎经营感情，让情谊更加深厚。')}],['独身亦自在','智略 +9、心境 +7',s=>{apply({wis:9,mood:7});log('你决定将时光先用于自己的志向。','姻缘')}]]},
    {id:'ev_baby',name:'家中添丁之喜',kind:'家族',text:'家人谈起未来子嗣的事情。你是否准备迎接家中的新成员？',when:s=>s.age>=20&&s.age<=50&&!!s.spouse&&s.children.length<3,choices:[['迎接新生命','银两 -110，家中添丁',s=>{apply({silver:-110});childOf(s)},s=>s.silver>=110],['顺其自然','有一定机会添丁',s=>{if(chance(.45)){childOf(s)}else{apply({mood:5});log('孩子的缘分尚需等待。','家族')}}],['暂缓此事','智略 +6，继续专注事业',s=>skill(s,'wis',6,'你先把更多时间投入本业。')]]},
    {id:'ev_treasure',name:'古玩铺中见宝',kind:'宝物',text:'旧货铺的主人出示一件传家古宝，愿意优惠出售。',when:s=>s.age>=19&&s.relics.length<RELICS.length,choices:[['购买古玉','花费380两，魅力 +15、运气 +5',s=>{s.relics.push('jade');apply({silver:-380,...RELICS[0].effect});log('获得青鸾古玉。','宝物')},s=>!s.relics.includes('jade')&&s.silver>=380],['购入藏书','花费580两，智略 +20、名望 +15',s=>{s.relics.push('book');apply({silver:-580,...RELICS[1].effect});log('获得星河书卷。','宝物')},s=>!s.relics.includes('book')&&s.silver>=580],['看看便走','德望 +6',s=>skill(s,'virtue',6,'你不贪珍宝，先行离开。')]]},
    {id:'ev_retainer',name:'贤士登门',kind:'家业',text:'一位才干出众的贤士愿意在你门下效力，问你是否需要帮手。',when:s=>s.age>=23&&s.fame>=85&&s.retainers.length<RETAINERS.length,choices:[['聘请谋士','需480两，每年支付俸禄',s=>{s.retainers.push('adviser');apply({silver:-480,fame:12});log('延请谋士温辞舟入府。','家业')},s=>!s.retainers.includes('adviser')&&s.silver>=480],['聘请管事','需630两，可提高产业收入',s=>{s.retainers.push('steward');apply({silver:-630,fame:12});log('聘请周四海料理家产。','家业')},s=>!s.retainers.includes('steward')&&s.silver>=630],['请教经世之道','智略 +11',s=>skill(s,'wis',11,'你听取贤士见解，收获良多。')]]},
    {id:'ev_new_way',name:'命运的转行邀请',kind:'机缘',text:'一位旧友建议你改换人生道路。这一次，是否愿意尝试不同的生活？',when:s=>s.age>=21,choices:[['经商致富','转入商途，魅力 +10',s=>{s.job='merchant';skill(s,'charm',10,'你改换道路，专心经营。')}],['求学入仕','转入文途，智略 +10',s=>{s.job='scholar';skill(s,'wis',10,'你重新踏上求学入仕的道路。')}],['坚持原路','当前职业属性 +9',s=>skill(s,JOBS[s.job].stat,9,'你决心坚持已有的道路。')]]},
    {id:'ev_reform',name:'兴修新政',kind:'朝局',text:'朝廷招集有识之士议论新政。你的建议或许能改变一方百姓的生活。',when:s=>s.age>=30&&s.ranks.scholar>=3&&s.reforms<4,choices:[['推行民生新政','德望 +16、名望 +70、完成一项改革',s=>{s.reforms++;apply({virtue:16,fame:70});log('你推行一项改善乡里民生的新政。','朝局')}],['请教名臣','智略 +15',s=>skill(s,'wis',15,'你向名臣请教治国理念。')],['缓步推进','德望 +9',s=>skill(s,'virtue',9,'你谨慎调查，倾听百姓心声。')]]}
  ];
  return milestones.concat(youth,grown);
};