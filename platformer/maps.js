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
 function build(id){const m=layouts.find(m=>m.id===id);if(!m)throw Error('Unknown map');return {...m,platforms:[...m.ground.map(([x,w,y])=>({x,y,w,h:550-y,ground:true})),...m.ledges.map(([x,y,w])=>({x,y,w,h:24,ground:false}))],spawns:m.spawns.slice()};}
 function createPicker(storage,random=Math.random){let queue=[],last='';try{const s=JSON.parse(storage.getItem('seonyul-map-deck-v1'));if(s){last=s.last;queue=Array.isArray(s.queue)?s.queue.filter(id=>layouts.some(m=>m.id===id)):[];if(new Set(queue).size!==queue.length)queue=[];}}catch{}return ()=>{if(!queue.length){queue=layouts.map(m=>m.id);for(let i=queue.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[queue[i],queue[j]]=[queue[j],queue[i]];}if(queue.at(-1)===last)[queue[0],queue[queue.length-1]]=[queue.at(-1),queue[0]];}last=queue.pop();try{storage.setItem('seonyul-map-deck-v1',JSON.stringify({queue,last}));}catch{}return build(last);};}
 const api={layouts,build,createPicker};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.SunshineMaps=api;
})();
