// Add new companions without changing the inherited platformer artwork/catalog.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const assets=path.resolve(__dirname,'../assets');
(async()=>{
 const {MINECRAFT_MOVES}=await import('../minecraft-moves.js');
 const data=JSON.parse(fs.readFileSync(path.join(assets,'battle-data.json')));
 const profiles={blaze:['블레이즈','hoothoot','FIRE','불꽃 막대가 몸 주위를 떠다니며 작은 화염구를 쏘는 네더의 몬스터.'],irongolem:['철 골렘','sentret','STEEL','마을을 지키는 철의 수호자. 긴 팔과 덩굴이 감긴 몸이 특징이다.'],snowgolem:['눈 골렘','hoothoot','ICE','호박 머리와 눈덩이 몸을 가진 친구. 눈덩이를 던져 상대를 견제한다.'],wolf:['늑대','rattata','NORMAL','뾰족한 귀와 네모난 코를 가진 재빠른 친구. 날카로운 이빨로 공격한다.']};
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{const page=await browser.newPage();await page.setContent('<canvas width="96" height="96"></canvas>');
 for(const [kind,[name,template,type,description]] of Object.entries(profiles)){
  const id='mc_'+kind,m=MINECRAFT_MOVES[kind];
  data.moves[m.id]={name:m.name,type:m.type,power:m.power,effect:m.effect,chance:m.chance,accuracy:m.accuracy,pp:m.pp};
  data.species[id]={...structuredClone(data.species[template]),name,types:[type],catchRate:220,baseExp:57,growth:'MEDIUM_FAST',minecraftKind:kind,signatureMove:m.id,description,learnset:[{level:1,move:m.id},{level:1,move:'GROWL'},{level:7,move:'QUICK_ATTACK'},{level:20,move:'SLAM'}]};
  for(const side of ['front','back']){
   const url=await page.evaluate(({kind,side})=>{
    const c=document.querySelector('canvas'),g=c.getContext('2d'),front=side==='front';g.clearRect(0,0,96,96);
    const box=(x,y,w,h,color)=>{g.fillStyle='#303735';g.fillRect(x-2,y-2,w+4,h+4);g.fillStyle=color;g.fillRect(x,y,w,h);};
    const pixel=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
    if(kind==='blaze'){
     [[20,37],[65,35],[13,58],[71,60],[29,72],[57,74]].forEach(([x,y])=>{box(x,y,7,16,'#d79d27');pixel(x+2,y+1,3,11,'#ffe36b');});
     box(32,17,32,29,'#e3b438');box(38,48,21,16,'#b9681c');pixel(35,19,25,5,'#ffe66c');
     if(front){pixel(37,29,7,5,'#4b2719');pixel(52,29,7,5,'#4b2719');pixel(43,39,10,3,'#6b371b');}
     [[25,16],[67,24],[22,67]].forEach(([x,y])=>{pixel(x,y,4,7,'#f07827');pixel(x+1,y,2,3,'#ffe382');});
    }else if(kind==='irongolem'){
     box(27,39,42,35,'#cfcebb');box(35,10,26,28,'#dcd9c8');box(15,41,10,36,'#bebfae');box(71,41,10,36,'#bebfae');box(29,76,14,14,'#c1c4b3');box(53,76,14,14,'#c1c4b3');
     pixel(31,45,5,21,'#597d43');pixel(36,57,9,4,'#77944d');pixel(60,41,5,25,'#708947');pixel(57,54,4,4,'#bf5553');
     if(front){pixel(38,19,6,4,'#a84437');pixel(53,19,6,4,'#a84437');box(45,22,7,11,'#aaa38f');}
    }else if(kind==='snowgolem'){
     box(24,62,48,25,'#e7eee3');box(31,39,34,22,'#f3f4e8');box(31,9,34,28,'#d38829');pixel(36,12,4,22,'#e9a53d');pixel(57,12,4,22,'#b96c21');
     pixel(9,48,23,4,'#795734');pixel(65,48,23,4,'#795734');pixel(12,40,4,12,'#795734');pixel(81,40,4,12,'#795734');
     if(front){pixel(37,19,7,6,'#453d26');pixel(53,19,7,6,'#453d26');pixel(42,29,14,4,'#453d26');[46,55,69,79].forEach(y=>pixel(46,y,4,4,'#4c5149'));}
    }else{
     box(24,46,47,25,'#c5c6bd');box(24,72,10,16,'#b0b4ab');box(59,72,10,16,'#b0b4ab');box(26,20,39,29,'#d7d8d0');box(27,9,10,16,'#c5c7bf');box(55,9,10,16,'#c5c7bf');box(72,38,8,24,'#b5b9b2');
     if(front){pixel(32,29,6,5,'#303735');pixel(54,29,6,5,'#303735');box(36,37,19,13,'#eeeee2');pixel(41,37,10,5,'#303735');}else pixel(30,25,30,7,'#b5b9b2');
    }
    return c.toDataURL('image/png');
   },{kind,side});fs.writeFileSync(path.join(assets,'battle',`${id}-${side}.png`),Buffer.from(url.split(',')[1],'base64'));
  }
 }
 for(const table of Object.values(data.encounters))for(const period of ['morning','day','night']){
  const slots=table[period];for(const [i,kind] of Object.keys(profiles).entries())if(!slots.some(s=>s.species==='mc_'+kind))slots.push({species:'mc_'+kind,level:slots[0].level+i%2});
 }
 fs.writeFileSync(path.join(assets,'battle-data.json'),JSON.stringify(data));console.log('Added 4 Minecraft companions and 8 original block sprites.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
