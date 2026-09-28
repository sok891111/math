'use strict';
// Persistent species counts and a shuffled deck of all 45 make-ten additions.
(() => {
 const KEY='seonyul-sunshine-progress-v1';
 const names={zombie:['🧟','좀비 햇살 친구'],creeper:['🌿','쉬이익 진정 대장'],slime:['🍮','말랑말랑 젤리 왕'],skeleton:['🦴','달그락 뼈 박사'],spider:['🕸️','여덟 다리 댄서'],witch:['🧪','보글보글 물약 달인'],enderman:['🌌','별빛 순간이동 대장'],magma:['🌋','따끈따끈 용암 요리사'],ghast:['☁️','두둥실 구름 선장']};
 const tiers=[{at:1,label:'첫 만남',mark:'🌱'},{at:3,label:'단짝 친구',mark:'⭐'},{at:5,label:'전설의 친구',mark:'👑'}];
 const pool=[];for(let a=1;a<=9;a++)for(let b=1;b<=9;b++)if(a+b>=10)pool.push([a,b]);
 const key=q=>q.join('+'),valid=q=>Array.isArray(q)&&q.length===2&&q.every(n=>Number.isInteger(n)&&n>=1&&n<=9)&&q[0]+q[1]>=10;
 function create(storage,random=Math.random){
  let saved={};try{saved=JSON.parse(storage.getItem(KEY))||{};}catch{}
  const counts={};for(const kind of Object.keys(names)){const n=saved.counts?.[kind];counts[kind]=Number.isSafeInteger(n)&&n>=0?n:0;}
  let bag=Array.isArray(saved.bag)&&saved.bag.every(valid)&&new Set(saved.bag.map(key)).size===saved.bag.length?saved.bag.map(q=>q.slice()):[];
  let last=valid(saved.last)?saved.last.slice():null;
  function save(){try{storage.setItem(KEY,JSON.stringify({counts,bag,last}));}catch{}}
  function nextQuestion(){
   if(!bag.length){bag=pool.map(q=>q.slice());for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
    if(last&&key(bag[bag.length-1])===key(last))[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
   }
   last=bag.pop();save();return last.slice();
  }
  function award(kind){if(!Object.hasOwn(names,kind))return [];const before=counts[kind];counts[kind]++;save();return tiers.filter(t=>before<t.at&&counts[kind]>=t.at).map(t=>({kind,...t,icon:names[kind][0],title:names[kind][1]}));}
  function snapshot(){return {counts:{...counts},total:Object.values(counts).reduce((a,b)=>a+b,0),badgeCount:Object.values(counts).reduce((n,c)=>n+tiers.filter(t=>c>=t.at).length,0)};}
  return {nextQuestion,award,snapshot};
 }
 const api={create,names,tiers,pool};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.SunshineProgress=api;
})();
