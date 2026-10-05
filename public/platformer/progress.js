'use strict';
(() => {
 const getKey=()=>'seonyul-sunshine-progress-v1'+(typeof window!=='undefined'&&window.__BLOCK_USER__?('_'+window.__BLOCK_USER__.id):'');
 const KEY=getKey();
 const eliteKinds=['wither','elderguardian','evoker','ravager','piglinbrute'];
 const names={wither:['💀','위더 정복자'],elderguardian:['🔱','바다 신전 수호자'],evoker:['📜','소환 마법 박사'],ravager:['🦏','파괴수 친구'],piglinbrute:['🪓','보루 탐험 대장'],breeze:['🌪️','바람 타는 브리즈 친구'],shulker:['🟪','셜커 껍데기 박사'],endermite:['🐛','엔더마이트 친구'],enderknight:['⚔️','엔더 기사 정복자'],enderdragon:['🐉','엔더드래곤 정복자'],warden:['🩵','워든 수호자'],chicken:['🐔','꼬꼬 곱셈 친구'],pig:['🐷','꿀꿀 사과 친구'],rabbit:['🐰','깡충 토끼 친구'],fox:['🦊','살금 여우 친구'],zombie:['🧟','좀비 햇살 친구'],creeper:['🌿','쉬이익 진정 대장'],slime:['🍮','말랑말랑 젤리 왕'],skeleton:['🦴','달그락 뼈 박사'],spider:['🕸️','여덟 다리 댄서'],witch:['🧪','보글보글 물약 달인'],enderman:['🌌','별빛 순간이동 대장'],magma:['🌋','따끈따끈 용암 요리사'],ghast:['☁️','두둥실 구름 선장']};
 const tiers=[{at:1,label:'첫 만남',mark:'🌱',rarity:'common'},{at:3,label:'단짝 친구',mark:'⭐',rarity:'rare'},{at:5,label:'전설의 친구',mark:'👑',rarity:'epic'},{at:10,label:'수호 기사',mark:'🛡️',rarity:'epic'},{at:20,label:'별빛 마스터',mark:'🌟',rarity:'legendary'}];
 const rarities={common:{name:'새싹',color:'#85a765'},rare:{name:'희귀',color:'#5b9ec8'},epic:{name:'영웅',color:'#a382c1'},legendary:{name:'전설',color:'#d6a443'}};
 const treasures={wither:['🌟','네더의 별'],elderguardian:['🔱','신전의 프리즈머린'],evoker:['🪬','불사의 토템'],ravager:['🐎','파괴수의 안장'],piglinbrute:['🪓','황금 도끼'],breeze:['🌀','브리즈 바람 막대'],shulker:['🟪','셜커 껍데기'],endermite:['✨','엔더 가루'],enderknight:['🛡️','엔더 문장'],enderdragon:['🥚','전설의 드래곤 알'],warden:['💠','스컬크 결정'],chicken:['🪶','하얀 깃털'],pig:['🍎','분홍 사과'],rabbit:['🥕','황금 당근'],fox:['🍂','단풍 부적'],zombie:['🍀','햇살 클로버'],creeper:['💚','이끼 에메랄드'],slime:['🍮','말랑 젤리'],skeleton:['🦴','달빛 뼛조각'],spider:['🕸️','루비 거미줄'],witch:['🧪','반짝 물약'],enderman:['🔮','별빛 진주'],magma:['🔥','노을 불씨'],ghast:['💧','구름 눈물']};
 const badges=[];
 for(const [kind,[icon,title]] of Object.entries(names))for(const t of tiers)badges.push({id:kind+'-'+t.at,kind,category:'monster',icon,title:title+' · '+t.label,description:title+' 몬스터를 '+t.at+'마리 물리치기',metric:'kind:'+kind,target:t.at,...t});
 function add(id,category,icon,title,description,metric,target,rarity='rare'){badges.push({id,category,icon,title,description,metric,target,rarity});}
 add('wind-unlock','adventure','🌪️','바람 모험의 문','몬스터 50마리를 잡아 브리즈와 바람 점프 열기','total',50,'epic');
 add('first-light','math','🔥','첫 햇살 마법','15초 대결에서 처음 승리하기','total',1,'common');
 add('math-10','math','🧮','열 번의 자신감','수학 대결 10번 승리하기','total',10);
 add('math-30','math','🎓','수학 박사','수학 대결 30번 승리하기','total',30,'epic');
 add('math-100','math','👑','수학 황제','수학 대결 100번 승리하기','total',100,'legendary');
 add('speed-1','math','⚡','번개 마법사','5초 안에 정답으로 승리하기','fast',1);
 add('speed-10','math','☄️','혜성 집중력','5초 안에 승리 10번','fast',10,'epic');
 add('perfect-5','math','💯','정확한 마법','첫 제출 정답으로 5번 승리하기','perfect',5);
 add('streak-3','math','🔥','3연승 불꽃','대결에서 3번 연속 승리하기','bestStreak',3);
 add('streak-10','math','🐉','불꽃 드래곤','대결에서 10번 연속 승리하기','bestStreak',10,'legendary');
 add('ten-frame-5','math','🧱','열 칸 건축가','블록으로 열 칸을 완성하고 5번 승리하기','tenFrames',5);
 add('big-math-1','math','🌟','첫 큰 수 정복','두 자리 수 큰 수 덧셈 첫 승리하기','bigMath',1,'common');
 add('big-math-5','math','⚡','큰 수 탐험가','두 자리 수 큰 수 덧셈 5번 승리하기','bigMath',5,'rare');
 add('big-math-15','math','🔥','큰 수 계산왕','두 자리 수 큰 수 덧셈 15번 승리하기','bigMath',15,'epic');
 add('big-math-30','math','👑','큰 수 대마법사','두 자리 수 큰 수 덧셈 30번 승리하기','bigMath',30,'legendary');
 add('sum-20','math','🥉','합 20 돌파','합이 20 이상인 큰 수 덧셈 문제 정복하기','sum20',1,'rare');
 add('sum-30','math','🥈','합 30 돌파','합이 30 이상인 큰 수 덧셈 문제 정복하기','sum30',1,'rare');
 add('sum-40','math','🥇','합 40 돌파','합이 40 이상인 큰 수 덧셈 문제 정복하기','sum40',1,'epic');
 add('sum-50','math','🏆','합 50 전설 정복','합이 50인 최고 난이도 보스 큰 수 덧셈 정복하기','sum50',1,'legendary');
 add('big-tens','math','🧱','십의 자리 마스터','10개 묶음 두 자리 수 덧셈 3번 해결하기','bigTens',3,'rare');
 add('big-fast','math','⚡','번개 큰 수 마법','두 자리 수 큰 수 덧셈을 10초 안에 빠르게 정답 맞추기','bigFast',1,'epic');
 add('big-carry','math','🌈','받아올림 마법사','일의 자리 합이 10 이상인 두 자리 수 덧셈 3번 해결하기','bigCarry',3,'epic');
 add('chest-1','treasure','🎁','첫 보물상자','승리 후 떨어진 보물상자 1개 줍기','chests',1,'common');
 add('chest-10','treasure','🗝️','보물 사냥꾼','몬스터 보물상자 10개 줍기','chests',10);
 add('chest-30','treasure','💎','보물섬의 주인','몬스터 보물상자 30개 줍기','chests',30,'epic');
 add('gems-30','treasure','💠','반짝 주머니','보물에서 보석 30개 모으기','gems',30);
 add('gems-100','treasure','💰','보석 왕국','보물에서 보석 100개 모으기','gems',100,'epic');
 add('relic-3','treasure','🧰','작은 보물 도감','서로 다른 몬스터 보물 3종 모으기','relicKinds',3);
 add('relic-9','treasure','🏆','아홉 보물의 전설','서로 다른 몬스터 보물 9종 모으기','relicKinds',9,'legendary');
 add('species-9','adventure','🌈','모두의 햇살 친구','서로 다른 몬스터 9종에게 승리하기','species',9,'epic');
 add('maps-3','adventure','🧭','길 찾는 탐험가','서로 다른 맵 3곳에서 승리하기','mapKinds',3);
 add('maps-6','adventure','🗺️','여섯 세계의 수호자','서로 다른 맵 6곳에서 승리하기','mapKinds',6,'legendary');
 add('clear-5','adventure','🚩','깃발 원정대','몬스터에게 승리한 단계 5번 완주','clears',5);
 add('clean-3','adventure','🌞','햇살 완벽 원정','모든 몬스터에게 승리하고 3번 완주','cleanClears',3,'epic');
 const pool=[];for(let a=1;a<=9;a++)for(let b=1;b<=9;b++)if(a+b>=10)pool.push([a,b]);
 const key=q=>q.join('+'),valid=q=>Array.isArray(q)&&q.length===2&&q.every(n=>Number.isInteger(n)&&n>=1&&n<=9)&&q[0]+q[1]>=10;
 const number=n=>Number.isSafeInteger(n)&&n>=0?n:0;
 function create(storage,random=Math.random){
  let saved={};try{saved=JSON.parse(storage.getItem(KEY))||{};}catch{}
  let superWins=number(saved.superWins)%6,superCharges=number(saved.superCharges);
  const counts={},relics={};for(const kind of Object.keys(names)){counts[kind]=number(saved.counts?.[kind]);relics[kind]=number(saved.relics?.[kind]);}
  const stats={};for(const name of ['fast','perfect','streak','bestStreak','tenFrames','chests','gems','clears','cleanClears','bigMath','sum20','sum30','sum40','sum50','bigTens','bigFast','bigCarry'])stats[name]=number(saved.stats?.[name]);
  const maps=new Set(Array.isArray(saved.maps)?saved.maps.filter(x=>typeof x==='string'):[]);
  const claims=new Set(Array.isArray(saved.claims)?saved.claims.filter(x=>typeof x==='string'):[]);
  const earned={},seen=new Set(Array.isArray(saved.seen)?saved.seen:[]);let equipped=typeof saved.equipped==='string'?saved.equipped:'';
  for(const badge of badges)if(typeof saved.earned?.[badge.id]==='string')earned[badge.id]=saved.earned[badge.id];
  let bag=Array.isArray(saved.bag)&&saved.bag.every(valid)&&new Set(saved.bag.map(key)).size===saved.bag.length?saved.bag.map(q=>q.slice()):[];
  let last=valid(saved.last)?saved.last.slice():null;
  function metric(name){if(name.startsWith('kind:'))return counts[name.slice(5)]||0;if(name==='total')return Object.values(counts).reduce((a,b)=>a+b,0);if(name==='species')return Object.values(counts).filter(n=>n>0).length;if(name==='relicKinds')return Object.values(relics).filter(n=>n>0).length;if(name==='mapKinds')return maps.size;return stats[name]||0;}
  function unlock(migrating=false){const found=[];for(const b of badges)if(!earned[b.id]&&metric(b.metric)>=b.target){earned[b.id]=migrating?'legacy':new Date().toISOString();if(migrating)seen.add(b.id);else found.push({...b});}return found;}
  unlock(true);if(!earned[equipped])equipped='';
  function save(){try{storage.setItem(KEY,JSON.stringify({version:2,superWins,superCharges,counts,relics,stats,maps:[...maps],claims:[...claims],earned,seen:[...seen],equipped,bag,last}));}catch{}}
  function nextQuestion(kind=''){
   if(eliteKinds.includes(kind)){
    const candidates=[];
    for(let a=10;a<=40;a++)for(let b=10;b<=40;b++)if(a+b>=30&&a+b<=50&&(!last||key([a,b])!==key(last)))candidates.push([a,b]);
    const q=candidates[Math.floor(random()*candidates.length)];last=q.slice();save();return q.slice();
   }
   if(['enderdragon','warden','shulker','enderknight','pig','chicken','rabbit'].includes(kind)){
    const candidates=[];
    if(['enderdragon','warden','shulker','enderknight'].includes(kind)){for(let a=10;a<=30;a++)for(let b=10;b<=30;b++)if(a+b<=40)candidates.push([a,b]);}
    else {
     // Grow from small groups to the full 2–5 tables after successful practice.
     const wins=counts.pig+counts.chicken+counts.rabbit;
     const maxA=wins<5?2:wins<12?3:5,maxB=wins<5?3:wins<12?5:9;
     for(let a=2;a<=maxA;a++)for(let b=1;b<=maxB;b++)candidates.push([a,b]);
    }
    const options=candidates.filter(q=>!last||key(q)!==key(last));const q=options[Math.floor(random()*options.length)];last=q.slice();save();return q.slice();
   }
   // Higher-tier monsters draw from increasingly large sums. The normal
   // no-kind deck remains the full 45-question collection for compatibility.
   const tier=kind==='enderman'||kind==='magma'||kind==='ghast'||kind==='breeze'?2:kind==='skeleton'||kind==='spider'||kind==='witch'?1:0;
   if(kind){const min=[10,12,14][tier],max=[14,17,18][tier];const candidates=pool.filter(q=>q[0]+q[1]>=min&&q[0]+q[1]<=max);let q=candidates[Math.floor(random()*candidates.length)];if(last&&key(q)===key(last)){q=candidates[(candidates.indexOf(q)+1)%candidates.length];}last=q.slice();save();return q.slice();}
   if(!bag.length){bag=pool.map(q=>q.slice());for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(last&&key(bag.at(-1))===key(last))[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];}last=bag.pop();save();return last.slice();}
  function award(kind,context={}){
   if(!Object.hasOwn(names,kind))return [];
   counts[kind]++;superWins++;if(superWins===6){superWins=0;superCharges++;}
   stats.streak++;stats.bestStreak=Math.max(stats.bestStreak,stats.streak);
   if(context.elapsedMs>=0&&context.elapsedMs<=5000)stats.fast++;
   if(context.perfect)stats.perfect++;
   if(context.tenFrame)stats.tenFrames++;
   if(context.mapId)maps.add(context.mapId);
   const isHardKind=eliteKinds.includes(kind)||['enderdragon','warden','shulker','enderknight'].includes(kind);
   const isHard=context.hardAddition!==undefined?!!context.hardAddition:isHardKind;
   if(isHard){
    stats.bigMath++;
    const sum=context.sum!==undefined?context.sum:(kind==='wither'?50:kind==='evoker'?40:kind==='piglinbrute'?30:25);
    if(sum>=20)stats.sum20++;
    if(sum>=30)stats.sum30++;
    if(sum>=40)stats.sum40++;
    if(sum>=50)stats.sum50++;
    if(context.bigTens||(context.bigTens===undefined&&['wither','evoker'].includes(kind)))stats.bigTens++;
    if(context.bigCarry||(context.bigCarry===undefined&&['elderguardian','ravager'].includes(kind)))stats.bigCarry++;
    if(context.bigFast||(context.bigFast===undefined&&(context.elapsedMs>=0&&context.elapsedMs<=10000)))stats.bigFast++;
   }
   const unlocked=unlock();save();return unlocked;
  }
  function recordExamMath(q){
   if(!q||q.operator!=='+')return [];
   const sum=q.a+q.b;
   if(q.a>=10||q.b>=10||sum>=20){
    stats.bigMath++;
    if(sum>=20)stats.sum20++;
    if(sum>=30)stats.sum30++;
    if(sum>=40)stats.sum40++;
    if(sum>=50)stats.sum50++;
    if(q.a%10===0&&q.b%10===0)stats.bigTens++;
    if((q.a%10)+(q.b%10)>=10)stats.bigCarry++;
    stats.bigFast++;
    const unlocked=unlock();save();return unlocked;
   }
   return [];
  }
  function useSuperJump(){if(!superCharges)return false;superCharges--;save();return true;}
  function lose(){stats.streak=0;save();}
  function claim(drop){if(!drop||typeof drop.id!=='string'||claims.has(drop.id)||!Object.hasOwn(names,drop.kind))return null;claims.add(drop.id);relics[drop.kind]++;stats.chests++;stats.gems+=number(drop.gems);const unlocked=unlock();save();return {unlocked};}
  function clear(wins,total){if(wins>0){stats.clears++;if(wins===total)stats.cleanClears++;}const unlocked=unlock();save();return unlocked;}
  function collection(){return badges.map(b=>({...b,current:Math.min(b.target,metric(b.metric)),earned:!!earned[b.id],earnedAt:earned[b.id]||null,isNew:!!earned[b.id]&&!seen.has(b.id)}));}
  function snapshot(){return {windUnlocked:metric('total')>=50,superWins,superCharges,counts:{...counts},total:metric('total'),badgeCount:Object.keys(earned).length,badgeTotal:badges.length,stats:{...stats},relics:{...relics},equipped,newCount:collection().filter(b=>b.isNew).length};}
  function see(id){if(earned[id]){seen.add(id);save();}}
  function equip(id){if(!earned[id])return false;equipped=id;see(id);save();return true;}
  save();return {superJumpState:()=>({superWins,superCharges}),useSuperJump,nextQuestion,award,recordExamMath,lose,claim,clear,collection,snapshot,see,equip};
 }
 const api={create,eliteKinds,names,tiers,pool,badges,rarities,treasures};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.SunshineProgress=api;
})();
