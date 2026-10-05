'use strict';
(() => {
 const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 function step(d,dt,platforms){
  if(d.settled)return;
  d.age+=dt;d.vy+=1050*dt;
  d.x+=d.vx*dt;
  for(const p of platforms)if(overlaps(d,p)){d.x=d.vx>0?p.x-d.w:p.x+p.w;d.vx*=-.45;}
  const oldBottom=d.y+d.h;d.y+=d.vy*dt;
  for(const p of platforms)if(overlaps(d,p)){
   if(d.vy>0&&oldBottom<=p.y+1){
    d.y=p.y-d.h;d.baseY=p.y;
    if(!d.bounced){d.bounced=true;d.vy=-115;d.vx*=.35;}
    else{d.vx=d.vy=0;d.settled=true;}
   }else if(d.vy<0){d.y=p.y+p.h;d.vy=0;}
  }
 }
 function launch(monster,player,platforms,random=Math.random){
  const x=monster.x+monster.w/2-18,y=monster.baseY-32;
  const candidates=[];
  // Preview the same collision physics, rejecting pits and launches that land
  // within reach of the stationary player. Pick randomly among safe throws.
  for(const direction of [-1,1])for(const speed of [190,240,290,340])for(const lift of [300,390,480]){
   const initial={x,y,w:36,h:32,baseY:monster.baseY,vx:direction*speed,vy:-lift,age:0,bounced:false,settled:false};
   const probe={...initial};for(let n=0;n<720&&!probe.settled&&probe.y<600;n++)step(probe,1/120,platforms);
   const distance=Math.abs(probe.x-x),fromPlayer=Math.abs(probe.x+18-player.x-player.w/2);
   if(probe.settled&&distance>=100&&distance<=310&&fromPlayer>=105&&platforms.some(p=>probe.x>=p.x+4&&probe.x+36<=p.x+p.w-4&&Math.abs(probe.baseY-p.y)<1))candidates.push(initial);
  }
  if(!candidates.length)throw Error('No reachable treasure landing for monster');
  return {...candidates[Math.floor(random()*candidates.length)],originX:x};
 }
 function canCollect(d,player){return d.settled&&overlaps(player,{x:d.x-6,y:d.y-6,w:d.w+12,h:d.h+12});}
 const api={step,launch,canCollect};if(typeof module!=='undefined'&&module.exports)module.exports=api;else window.SunshineLoot=api;
})();
