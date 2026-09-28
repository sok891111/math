'use strict';
(() => {
 const KEY='seonyul-sunshine-progress-v1';
 const names={zombie:['🧟','좀비 햇살 친구'],creeper:['🌿','쉬이익 진정 대장'],slime:['🍮','말랑말랑 젤리 왕'],skeleton:['🦴','달그락 뼈 박사'],spider:['🕸️','여덟 다리 댄서'],witch:['🧪','보글보글 물약 달인'],enderman:['🌌','별빛 순간이동 대장'],magma:['🌋','따끈따끈 용암 요리사'],ghast:['☁️','두둥실 구름 선장']};
 const tiers=[{at:1,label:'첫 만남',mark:'🌱',rarity:'common'},{at:3,label:'단짝 친구',mark:'⭐',rarity:'rare'},{at:5,label:'전설의 친구',mark:'👑',rarity:'epic'},{at:10,label:'수호 기사',mark:'🛡️',rarity:'epic'},{at:20,label:'별빛 마스터',mark:'🌟',rarity:'legendary'}];
 const rarities={common:{name:'새싹',color:'#85a765'},rare:{name:'희귀',color:'#5b9ec8'},epic:{name:'영웅',color:'#a382c1'},legendary:{name:'전설',color:'#d6a443'}};
 const treasures={zombie:['🍀','햇살 클로버'],creeper:['💚','이끼 에메랄드'],slime:['🍮','말랑 젤리'],skeleton:['🦴','달빛 뼛조각'],spider:['🕸️','루비 거미줄'],witch:['🧪','반짝 물약'],enderman:['🔮','별빛 진주'],magma:['🔥','노을 불씨'],ghast:['💧','구름 눈물']};
 const badges=[];
 for(const [kind,[icon,title]] of Object.entries(names))for(const t of tiers)badges.push({id:kind+'-'+t.at,kind,category:'monster',icon,title:title+' · '+t.label,description:title+' 몬스터를 '+t.at+'마리 물리치기',metric:'kind:'+kind,target:t.at,...t});
 function add(id,category,icon,title,description,metric,target,rarity='rare'){badges.push({id,category,icon,title,description,metric,target,rarity});}
 add('first-light','math','🔥','첫 햇살 마법','15초 대결에서 처음 승리하기','total',1,'common');
 add('math-10','math','🧮','열 번의 자신감','덧셈 대결 10번 승리하기','total',10);
 add('math-30','math','🎓','수학 박사','덧셈 대결 30번 승리하기','total',30,'epic');
 add('math-100','math','👑','수학 황제','덧셈 대결 100번 승리하기','total',100,'legendary');
 add('speed-1','math','⚡','번개 마법사','5초 안에 정답으로 승리하기','fast',1);
 add('speed-10','math','☄️','혜성 집중력','5초 안에 승리 10번','fast',10,'epic');
 add('perfect-5','math','💯','정확한 마법','첫 제출 정답으로 5번 승리하기','perfect',5);
 add('streak-3','math','🔥','3연승 불꽃','대결에서 3번 연속 승리하기','bestStreak',3);
 add('streak-10','math','🐉','불꽃 드래곤','대결에서 10번 연속 승리하기','bestStreak',10,'legendary');
 add('ten-frame-5','math','🧱','열 칸 건축가','블록으로 열 칸을 완성하고 5번 승리하기','tenFrames',5);
 add('chest-1','treasure','🎁','첫 보물상자','승리 후 떨어진 보물상자 1개 줍기','chests',1,'common');
 add('chest-10','treasure','🗝️','보물 사냥꾼','몬스터 보물상자 10개 줍기','chests',10);
 add('chest-30','treasure','💎','보물섬의 주인','몬스터 보물상자 30개 줍기','chests',30,'epic');
 add('gems-30','treasure','💠','반짝 주머니','보물에서 보석 30개 모으기','gems',30);
 add('gems-100','treasure','💰','보석 왕국','보물에서 보석 100개 모으기','gems',100,'epic');
 add('relic-3','treasure','🧰','작은 보물 도감','서로 다른 몬스터 보물 3종 모으기','relicKinds',3);
 add('relic-9','treasure','🏆','아홉 보물의 전설','몬스터 보물 9종을 모두 모으기','relicKinds',9,'legendary');
 add('species-9','adventure','🌈','모두의 햇살 친구','9종의 몬스터에게 모두 승리하기','species',9,'epic');
 add('maps-3','adventure','🧭','길 찾는 탐험가','서로 다른 맵 3곳에서 승리하기','mapKinds',3);
 add('maps-6','adventure','🗺️','여섯 세계의 수호자','6개 맵에서 모두 승리하기','mapKinds',6,'legendary');
 add('clear-5','adventure','🚩','깃발 원정대','몬스터에게 승리한 단계 5번 완주','clears',5);
 add('clean-3','adventure','🌞','햇살 완벽 원정','모든 몬스터에게 승리하고 3번 완주','cleanClears',3,'epic');
 const pool=[];for(let a=1;a<=9;a++)for(let b=1;b<=9;b++)if(a+b>=10)pool.push([a,b]);
 const key=q=>q.join('+'),valid=q=>Array.isArray(q)&&q.length===2&&q.every(n=>Number.isInteger(n)&&n>=1&&n<=9)&&q[0]+q[1]>=10;
 const number=n=>Number.isSafeInteger(n)&&n>=0?n:0;
 function create(storage,random=Math.random){
  let saved={};try{saved=JSON.parse(storage.getItem(KEY))||{};}catch{}
  const counts={},relics={};for(const kind of Object.keys(names)){counts[kind]=number(saved.counts?.[kind]);relics[kind]=number(saved.relics?.[kind]);}
  const stats={};for(const name of ['fast','perfect','streak','bestStreak','tenFrames','chests','gems','clears','cleanClears'])stats[name]=number(saved.stats?.[name]);
  const maps=new Set(Array.isArray(saved.maps)?saved.maps.filter(x=>typeof x==='string'):[]);
  const claims=new Set(Array.isArray(saved.claims)?saved.claims.filter(x=>typeof x==='string'):[]);
  const earned={},seen=new Set(Array.isArray(saved.seen)?saved.seen:[]);let equipped=typeof saved.equipped==='string'?saved.equipped:'';
  for(const badge of badges)if(typeof saved.earned?.[badge.id]==='string')earned[badge.id]=saved.earned[badge.id];
  let bag=Array.isArray(saved.bag)&&saved.bag.every(valid)&&new Set(saved.bag.map(key)).size===saved.bag.length?saved.bag.map(q=>q.slice()):[];
  let last=valid(saved.last)?saved.last.slice():null;
  function metric(name){if(name.startsWith('kind:'))return counts[name.slice(5)]||0;if(name==='total')return Object.values(counts).reduce((a,b)=>a+b,0);if(name==='species')return Object.values(counts).filter(n=>n>0).length;if(name==='relicKinds')return Object.values(relics).filter(n=>n>0).length;if(name==='mapKinds')return maps.size;return stats[name]||0;}
  function unlock(migrating=false){const found=[];for(const b of badges)if(!earned[b.id]&&metric(b.metric)>=b.target){earned[b.id]=migrating?'legacy':new Date().toISOString();if(migrating)seen.add(b.id);else found.push({...b});}return found;}
  unlock(true);if(!earned[equipped])equipped='';
  function save(){try{storage.setItem(KEY,JSON.stringify({version:2,counts,relics,stats,maps:[...maps],claims:[...claims],earned,seen:[...seen],equipped,bag,last}));}catch{}}
  function nextQuestion(){if(!bag.length){bag=pool.map(q=>q.slice());for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}if(last&&key(bag.at(-1))===key(last))[bag[0],bag[bag.length-1]]=[bag.at(-1),bag[0]];}last=bag.pop();save();return last.slice();}
  function award(kind,context={}){if(!Object.hasOwn(names,kind))return [];counts[kind]++;stats.streak++;stats.bestStreak=Math.max(stats.bestStreak,stats.streak);if(context.elapsedMs>=0&&context.elapsedMs<=5000)stats.fast++;if(context.perfect)stats.perfect++;if(context.tenFrame)stats.tenFrames++;if(context.mapId)maps.add(context.mapId);const unlocked=unlock();save();return unlocked;}
  function lose(){stats.streak=0;save();}
  function claim(drop){if(!drop||typeof drop.id!=='string'||claims.has(drop.id)||!Object.hasOwn(names,drop.kind))return null;claims.add(drop.id);relics[drop.kind]++;stats.chests++;stats.gems+=number(drop.gems);const unlocked=unlock();save();return {unlocked};}
  function clear(wins,total){if(wins>0){stats.clears++;if(wins===total)stats.cleanClears++;}const unlocked=unlock();save();return unlocked;}
  function collection(){return badges.map(b=>({...b,current:Math.min(b.target,metric(b.metric)),earned:!!earned[b.id],earnedAt:earned[b.id]||null,isNew:!!earned[b.id]&&!seen.has(b.id)}));}
  function snapshot(){return {counts:{...counts},total:metric('total'),badgeCount:Object.keys(earned).length,badgeTotal:badges.length,stats:{...stats},relics:{...relics},equipped,newCount:collection().filter(b=>b.isNew).length};}
  function see(id){if(earned[id]){seen.add(id);save();}}
  function equip(id){if(!earned[id])return false;equipped=id;see(id);save();return true;}
  save();return {nextQuestion,award,lose,claim,clear,collection,snapshot,see,equip};
 }
 const api={create,names,tiers,pool,badges,rarities,treasures};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.SunshineProgress=api;
})();
