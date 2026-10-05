'use strict';
(() => {
 const layouts=[
 {id:'meadow',name:'햇살 계단 들판',theme:0,decor:'flowers',length:3220,ground:[[0,800,390],[800,650,358],[1450,730,390],[2180,600,354],[2780,440,390]],ledges:[[245,306,150],[440,248,110],[1030,278,170],[1570,310,150],[1800,252,130],[2430,274,180]],spawns:[620,1700,2910]},
 {id:'river',name:'징검다리 강변',theme:0,decor:'water',length:3400,ground:[[0,820,390],[900,710,390],[1690,720,366],[2490,910,390]],ledges:[[280,310,150],[760,306,230],[1120,306,170],[1540,294,240],[1990,280,160],[2350,284,240],[2780,304,170]],spawns:[580,1300,2870]},
 {id:'mushroom',name:'커다란 버섯 골짜기',theme:1,decor:'mushrooms',length:3300,ground:[[0,680,390],[680,620,350],[1300,680,390],[1980,630,346],[2610,690,390]],ledges:[[240,307,180],[810,272,140],[1040,218,130],[1480,305,170],[1740,248,130],[2210,265,170],[2710,303,180]],spawns:[500,1580,2960]},
 {id:'ruins',name:'달빛 성벽 유적',theme:1,decor:'ruins',length:3520,ground:[[0,900,390],[900,600,350],[1500,700,318],[2200,540,358],[2740,780,390]],ledges:[[270,306,144],[500,244,130],[1060,272,160],[1630,236,170],[2340,276,160],[2870,308,180]],spawns:[660,1840,3190]},
 {id:'crystal',name:'반짝 수정 동굴',theme:2,decor:'crystals',length:3360,ground:[[0,740,390],[740,620,350],[1360,690,390],[2140,1220,366]],ledges:[[210,310,144],[410,254,130],[860,272,170],[1510,312,150],[1710,251,140],[2020,306,220],[2490,282,190],[2750,222,150]],spawns:[550,1670,3020]},
 {id:'sky',name:'구름다리 정원',theme:2,decor:'clouds',length:3460,ground:[[0,780,390],[860,720,354],[1660,780,390],[2520,940,350]],ledges:[[250,306,170],[500,244,140],[720,285,240],[1080,274,170],[1510,276,240],[1920,307,190],[2410,306,210],[2780,266,190]],spawns:[560,1210,3030]}
 ];
 // Broad terraces and optional side platforms keep every main route beginner-friendly.
 layouts.push(
 {id:'orchard',name:'사과나무 언덕',theme:0,decor:'apples',length:3120,ground:[[0,560,390],[560,440,358],[1000,460,326],[1460,440,358],[1900,540,390],[2440,680,366]],ledges:[[200,304,160],[690,272,160],[1150,242,170],[1610,272,150],[2050,306,180],[2660,280,160]],spawns:[420,1310,2840],palette:{sky:'#d3edc1',hill:'#8fbc78',far:'#bdd9a0',grass:'#80a955'}},
 {id:'dunes',name:'황금 모래 오아시스',theme:1,decor:'cactus',length:3260,ground:[[0,620,390],[620,470,366],[1090,610,390],[1700,430,358],[2130,500,382],[2630,630,350]],ledges:[[240,304,190],[760,280,150],[1230,304,170],[1460,242,150],[1810,272,180],[2290,296,160],[2820,264,180]],spawns:[460,1530,2980],palette:{sky:'#fae4b2',hill:'#dfbc79',far:'#ebd297',grass:'#e5bf70'}},
 {id:'snow',name:'눈꽃 소나무 길',theme:2,decor:'snow',length:3180,ground:[[0,760,390],[760,400,358],[1160,420,326],[1580,420,350],[2000,400,374],[2400,780,390]],ledges:[[250,304,160],[490,248,150],[860,272,160],[1280,240,160],[1730,264,150],[2130,288,150],[2680,304,210]],spawns:[580,1390,2890],palette:{sky:'#dcebf5',hill:'#a8c9d5',far:'#c9dce5',grass:'#f3f8fa'}},
 {id:'bamboo',name:'초록 대나무 숲',theme:0,decor:'bamboo',length:3340,ground:[[0,470,390],[470,480,366],[950,550,390],[1500,470,350],[1970,550,382],[2520,820,358]],ledges:[[180,304,140],[570,280,170],[1060,304,180],[1300,244,150],[1640,264,170],[2110,296,170],[2350,236,150],[2720,272,210]],spawns:[760,1790,3020],palette:{sky:'#d5e8cf',hill:'#77a78a',far:'#abcbb3',grass:'#75a16a'}},
 {id:'lagoon',name:'조개껍질 바닷길',theme:0,decor:'water',length:3240,ground:[[0,720,390],[780,600,390],[1440,740,390],[2240,1000,390]],ledges:[[220,304,170],[950,304,170],[1650,304,180],[2500,304,180],[2750,244,150]],spawns:[520,1840,2920],palette:{sky:'#c5eced',hill:'#9dcfc4',far:'#c2e2d7',grass:'#efda9b'}},
 {id:'lantern',name:'별빛 등불 마을',theme:1,decor:'lanterns',length:3420,ground:[[0,650,390],[650,480,358],[1130,500,326],[1630,510,358],[2140,500,390],[2640,780,366]],ledges:[[230,304,180],[780,272,170],[1270,240,190],[1780,272,180],[2280,304,170],[2510,244,130],[2870,280,210]],spawns:[480,1450,3100],palette:{sky:'#d4cbe6',hill:'#a5a4c2',far:'#bfb7d2',grass:'#a5b98b'}}
 );
 // Optional climbing routes: each 80px rise requires a fresh normal jump.
 // Keep the ground route open, with coins on every landing as a climbing reward.
 function build(id){
  const m=layouts.find(m=>m.id===id);if(!m)throw Error('Unknown map');
  const ground=m.ground.map(([x,w,y])=>({x,y,w,h:550-y,ground:true}));
  const variant=layouts.indexOf(m)%3;
  const offsets=variant===1?[0,165,-20]:variant===2?[0,150,310]:[0,165,330];
  const climbingRoutes=[{name:variant===1?'지그재그 전망대':variant===2?'세 칸 구름 계단':'세 층 햇살 탑',steps:offsets.map((dx,i)=>[220+dx,ground[0].y-80*(i+1),i===2?140:120])}];
  const middle=ground[2];
  climbingRoutes.push({name:'두 층 쉼터',steps:[[middle.x+70,middle.y-80,140],[middle.x+235,middle.y-160,150]]});
  const inClimbZone=([x,,w])=>climbingRoutes.some(route=>{const left=Math.min(...route.steps.map(p=>p[0]))-40,right=Math.max(...route.steps.map(p=>p[0]+p[2]))+40;return x<right&&x+w>left;});
  const ledges=m.ledges.filter(p=>!inClimbZone(p)&&ground.some(g=>p[0]>=g.x&&p[0]+p[2]<=g.x+g.w));
  ledges.push(...climbingRoutes.flatMap(route=>route.steps));
  return {...m,ledges,climbingRoutes,platforms:[...ground,...ledges.map(([x,y,w])=>({x,y,w,h:24,ground:false}))],spawns:m.spawns.slice()};
 }

 function createPicker(storage,random=Math.random){const deckKey='seonyul-map-deck-v1'+(typeof window!=='undefined'&&window.__BLOCK_USER__?('_'+window.__BLOCK_USER__.id):'');let queue=[],last='';try{const s=JSON.parse(storage.getItem(deckKey));if(s){last=s.last;queue=Array.isArray(s.queue)?s.queue.filter(id=>layouts.some(m=>m.id===id)):[];if(new Set(queue).size!==queue.length)queue=[];}}catch{}return ()=>{if(!queue.length){queue=layouts.map(m=>m.id);for(let i=queue.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}if(queue.at(-1)===last)[queue[0],queue[queue.length-1]]=[queue.at(-1),queue[0]];}last=queue.pop();try{storage.setItem(deckKey,JSON.stringify({queue,last}));}catch{}return build(last);};}
 const api={layouts,build,createPicker};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.SunshineMaps=api;
})();
