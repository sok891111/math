// Reuse the platformer's original Canvas artwork; no external artwork is needed.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
(async () => {
 const {MINECRAFT_MOVES}=await import('../minecraft-moves.js');
 const browser = await chromium.launch({headless:true,channel:'chrome'});
 try {
  const page = await browser.newPage();
  await page.setContent('<canvas width="96" height="96"></canvas>');
  await page.addScriptTag({content:fs.readFileSync(path.join(root,'platformer/monsters.js'),'utf8')});
  const catalog = await page.evaluate(()=>window.MonsterArt.catalog);
  const dataPath=path.join(root,'tralalerio/assets/battle-data.json');
  const data=JSON.parse(fs.readFileSync(dataPath));
  const profiles={
   wither:['hoothoot','DARK','CONFUSION'],elderguardian:['sentret','WATER','WATER_GUN'],
   evoker:['hoothoot','PSYCHIC_TYPE','CONFUSION'],ravager:['rattata','NORMAL','BITE'],
   piglinbrute:['rattata','NORMAL','BITE'],breeze:['pidgey','FLYING','GUST'],
   shulker:['sentret','PSYCHIC_TYPE','CONFUSION'],endermite:['rattata','BUG','BITE'],
   enderknight:['sentret','DARK','PURSUIT'],enderdragon:['pidgey','FLYING','GUST'],
   warden:['hoothoot','DARK','CONFUSION'],chicken:['pidgey','NORMAL','PECK'],
   pig:['sentret','NORMAL','TACKLE'],rabbit:['rattata','NORMAL','QUICK_ATTACK'],
   fox:['rattata','NORMAL','BITE'],zombie:['sentret','NORMAL','BITE'],
   creeper:['sentret','GRASS','RAZOR_LEAF'],slime:['hoothoot','NORMAL','BODY_SLAM'],
   skeleton:['rattata','NORMAL','SWIFT'],spider:['rattata','BUG','BITE'],
   witch:['hoothoot','POISON','CONFUSION'],enderman:['rattata','DARK','PURSUIT'],
   magma:['sentret','FIRE','EMBER'],ghast:['hoothoot','FIRE','EMBER']
  };
  for(const [kind,art] of Object.entries(catalog)){
   const [template,type,move]=profiles[kind],id='mc_'+kind;
   const signature=MINECRAFT_MOVES[kind];
   data.moves[signature.id]={name:signature.name,type:signature.type,power:signature.power,effect:signature.effect,chance:signature.chance,accuracy:signature.accuracy,pp:signature.pp};
   data.species[id]={...structuredClone(data.species[template]),name:art.name,types:[type],catchRate:220,baseExp:57,growth:'MEDIUM_FAST',minecraftKind:kind,signatureMove:signature.id,
    learnset:[{level:1,move:signature.id},{level:1,move:'GROWL'},{level:7,move},{level:13,move:'QUICK_ATTACK'},{level:20,move:'SLAM'}]};
   for(const side of ['front','back']){
    const url=await page.evaluate(({kind,side})=>{
     const c=document.querySelector('canvas'),ctx=c.getContext('2d'),m=MonsterArt.catalog[kind];
     ctx.clearRect(0,0,96,96);ctx.save();ctx.imageSmoothingEnabled=false;
     const scale=Math.min(1,78/m.w,78/m.h);ctx.translate(48,87);ctx.scale(scale,scale);
     MonsterArt.draw(ctx,kind,-m.w/2,-m.h,m.w,m.h,0,side==='back'?-1:1);ctx.restore();return c.toDataURL('image/png');
    },{kind,side});
    fs.writeFileSync(path.join(root,`tralalerio/assets/battle/${id}-${side}.png`),Buffer.from(url.split(',')[1],'base64'));
   }
  }
  const table=data.encounters.Route29;
  // Preserve original Pokemon at 40%, and share 60% among all 24 Minecraft species.
  const originalWeights=[60,60,40,20,10,8,2];
  table.weights=[...originalWeights,...Object.keys(catalog).map((_,i)=>i<12?15:10)];
  for(const period of ['morning','day','night'])table[period]=[...table[period].filter(s=>!s.species.startsWith('mc_')), ...Object.keys(catalog).map((kind,i)=>({species:'mc_'+kind,level:2+i%3}))];
  data.scope='Original starters and Route29 wild Pokemon, plus 24 platformer Minecraft companions.';
  fs.writeFileSync(dataPath,JSON.stringify(data,null,2)+'\n');
  console.log('Built 24 Minecraft species and 48 battle sprites.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
