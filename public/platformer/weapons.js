'use strict';
// Equipment belongs to the current adventure. Only playing time advances attacks.
window.SunshineWeapons=(()=>{
 const catalog={sword:{name:'다이아 검',icon:'⚔️'},bow:{name:'엔더 활',icon:'🏹'},shield:{name:'수호 방패',icon:'🛡️'}};
 function create(){return {kind:null,cooldown:1,animation:0,attacks:0,arrows:[]};}
 function equip(state,kind){if(!catalog[kind])return;state.kind=kind;state.cooldown=1;state.animation=0;state.arrows=[];}
 function pick(current,random=Math.random){const kinds=Object.keys(catalog).filter(k=>k!==current);return kinds[Math.floor(random()*kinds.length)];}
 function roll(current,random=Math.random){return random()<.35?pick(current,random):null;}
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 function update(state,dt,player,monsters,platforms){
  if(!state.kind)return null;
  state.animation=Math.max(0,state.animation-dt);state.cooldown-=dt;
  let target=null;
  if(state.cooldown<=1e-9){state.cooldown+=1;state.animation=.3;state.attacks++;
   if(state.kind==='bow')state.arrows.push({x:player.x+player.w/2+player.face*20,y:player.y+25,w:20,h:5,vx:player.face*430,life:1.8});
   else{const reach=state.kind==='sword'?76:48,area={x:player.face>0?player.x+player.w:player.x-reach,y:player.y+4,w:reach,h:player.h-8};const wall=platforms.some(p=>overlap(area,p));if(!wall)target=monsters.find(m=>!m.defeated&&overlap(area,m))||null;}
  }
  for(const a of state.arrows){a.life-=dt;a.x+=a.vx*dt;if(platforms.some(p=>overlap(a,p))){a.life=0;continue;}const hit=monsters.find(m=>!m.defeated&&overlap(a,m));if(hit){target=target||hit;a.life=0;}}
  state.arrows=state.arrows.filter(a=>a.life>0);
  return target;
 }
 function icon(c,kind,x,y,size=1,phase=0){
  c.save();c.translate(x,y);c.scale(size,size);
  const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  if(kind==='sword'){c.rotate(phase?-.9+phase*5:.5);r(-3,-31,6,28,'#86e1db');r(-1,-29,2,24,'#d7ffec');r(-8,-4,16,4,'#9471c3');r(-2,0,4,12,'#6b4c37');}
  if(kind==='bow'){c.strokeStyle='#946047';c.lineWidth=4;c.beginPath();c.moveTo(0,-20);c.quadraticCurveTo(24,0,0,20);c.stroke();c.strokeStyle='#e8e8cd';c.lineWidth=1.5;c.beginPath();c.moveTo(0,-20);c.lineTo(phase?-7:0,0);c.lineTo(0,20);c.stroke();r(-5,-1,28,2,'#e8d5a0');}
  if(kind==='shield'){c.translate(phase?Math.sin(phase*10)*10:0,0);r(-10,-20,23,34,'#b1cbd1');r(-7,-17,17,27,'#617ba3');r(-2,-13,6,19,'#e0c275');r(-6,-7,14,6,'#e0c275');r(-6,14,15,4,'#b1cbd1');}
  c.restore();
 }
 function draw(c,state,player){
  for(const a of state.arrows){c.save();c.translate(a.x+10,a.y+2);c.scale(Math.sign(a.vx),1);c.fillStyle='#725739';c.fillRect(-10,-1,20,2);c.fillStyle='#ecf1e0';c.beginPath();c.moveTo(14,0);c.lineTo(6,-5);c.lineTo(6,5);c.fill();c.fillRect(-10,-4,4,8);c.restore();}
  if(!state.kind)return;c.save();c.translate(player.x+player.w/2,player.y+29);c.scale(player.face,1);icon(c,state.kind,20,0,1,state.animation);
  if(state.kind==='sword'&&state.animation>0){c.strokeStyle='#dcfcf2aa';c.lineWidth=5;c.beginPath();c.arc(9,-4,48,-1.4,1);c.stroke();}
  if(state.kind==='shield'&&state.animation>0){c.strokeStyle='#b9eaff99';c.lineWidth=3;c.beginPath();c.arc(20,-2,30,-1.4,1.4);c.stroke();}c.restore();
 }
 return {catalog,create,equip,pick,roll,update,draw,icon};
})();
