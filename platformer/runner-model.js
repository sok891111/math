'use strict';
(function(root){
 const LENGTH=18000,SPEED=210,GATES=[3600,9500,15500];
 const companions={slime:{name:'말랑 슬라임',unlock:0,skill:'공중에서 한 번 더! 3단 점프'},fox:{name:'단풍 여우',unlock:1,skill:'수학 자석 시간이 5초 더 길어져요'},warden:{name:'워든',unlock:3,skill:'달리기 시작부터 보호막 3개'}};
 const themes=[{name:'햇살 에메랄드 숲',sky:'#c7efe6',far:'#a3cba5',ground:'#54875e',accent:'#ffe49e'},{name:'수정빛 동굴',sky:'#283856',far:'#405e79',ground:'#486d84',accent:'#a7f3ed'},{name:'노을 구름 성',sky:'#f4c9b6',far:'#be9eb6',ground:'#8b779c',accent:'#ffe7aa'}];
 const clone=x=>JSON.parse(JSON.stringify(x));const fresh=()=>({version:1,gems:0,clears:0,mathWins:0,best:0,companion:'slime',active:null});
 function create(storage,key,random=Math.random){
  let state=fresh();try{const raw=JSON.parse(storage.getItem(key));if(raw?.version===1){for(const k of ['gems','clears','mathWins','best'])if(Number.isSafeInteger(raw[k])&&raw[k]>=0)state[k]=raw[k];if(companions[raw.companion]?.unlock<=state.clears)state.companion=raw.companion;const a=raw.active;if(a&&typeof a.id==='string'&&Number.isFinite(a.x)&&a.x>=0&&a.x<=LENGTH&&Array.isArray(a.gates)&&a.gates.length===3&&a.gates.every(g=>g&&typeof g.solved==='boolean'&&Number.isInteger(g.seed)&&g.seed>=0&&g.seed<=4294967295)&&Number.isInteger(a.score)&&a.score>=0&&Number.isInteger(a.coins)&&a.coins>=0&&Number.isInteger(a.stage)&&a.stage>=0&&a.stage<3&&Array.isArray(a.picked)&&a.picked.every(Number.isInteger)&&Array.isArray(a.hit)&&a.hit.every(Number.isInteger)&&[a.rush,a.magnet,a.hurt,a.shields,a.combo].every(n=>Number.isFinite(n)&&n>=0))state.active=clone(a);}}catch{}
  function save(){try{storage.setItem(key,JSON.stringify(state));}catch{}}
  function start(stage=0){if(state.active)return false;if(stage>Math.min(2,state.clears)||stage<0)return false;state.active={id:Date.now()+'-'+Math.floor(random()*1e9),stage,x:0,score:0,coins:0,combo:0,picked:[],hit:[],gates:GATES.map(()=>({seed:Math.floor(random()*4294967296)>>>0,solved:false})),rush:0,magnet:0,shields:state.companion==='warden'?3:1,hurt:0};save();return true;}
  function pending(){const a=state.active;if(!a)return -1;return a.gates.findIndex((g,i)=>!g.solved&&a.x>=GATES[i]);}
  function tick(dt){const a=state.active;if(!a||pending()>=0)return;dt=Math.max(0,Math.min(.05,dt));a.rush=Math.max(0,a.rush-dt);a.magnet=Math.max(0,a.magnet-dt);a.hurt=Math.max(0,a.hurt-dt);const next=a.gates.findIndex(g=>!g.solved);a.x=Math.min(next<0?LENGTH:GATES[next],a.x+(a.rush>0?360:a.hurt>0?125:SPEED)*dt);}
  function solve(index){const a=state.active;if(!a||index!==pending()||a.gates[index].solved)return false;a.gates[index].solved=true;state.mathWins++;state.gems+=10;a.score+=300;a.shields++;if(index===0||index===2)a.rush=8;else a.magnet=state.companion==='fox'?17:12;save();return true;}
  function collect(id,bonus=1){const a=state.active;if(!a||a.picked.includes(id))return false;a.picked.push(id);a.coins+=bonus;a.combo++;a.score+=10+Math.min(20,a.combo);return true;}
  function hit(id){const a=state.active;if(!a||a.hit.includes(id))return null;a.hit.push(id);if(a.rush>0){a.score+=50;return 'smash';}if(a.hurt>0)return 'safe';a.combo=0;if(a.shields>0){a.shields--;return 'shield';}a.hurt=1.3;return 'bump';}
  function finish(){const a=state.active;if(!a||a.x<LENGTH||a.gates.some(g=>!g.solved))return null;const reward={stage:a.stage,coins:a.coins,score:a.score+1000,gems:20+Math.floor(a.coins/5),unlocked:[]};const before=state.clears;state.clears++;state.gems+=reward.gems;state.best=Math.max(state.best,reward.score);reward.unlocked=Object.entries(companions).filter(([,v])=>v.unlock>before&&v.unlock<=state.clears).map(([id])=>id);state.active=null;save();return reward;}
  function equip(id){if(!companions[id]||companions[id].unlock>state.clears||state.active)return false;state.companion=id;save();return true;}
  return {get state(){return state},start,tick,pending,solve,collect,hit,finish,equip,save,snapshot:()=>clone(state)};
 }
 const api={create,LENGTH,SPEED,GATES,companions,themes};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MathRunner=api;
})(typeof window==='undefined'?globalThis:window);
