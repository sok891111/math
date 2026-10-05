'use strict';
window.SunshineEnemyCombat=(()=>{
 const attacks={
  wither:{type:'skull',color:'#7c8697',speed:195,interval:4.3,range:530},
  elderguardian:{type:'beam',color:'#e6bd78',speed:290,interval:4.5,range:420},
  evoker:{type:'spell',color:'#d4dfad',speed:180,interval:4.1,range:390},
  breeze:{type:'wind',color:'#c4f8fc',speed:210,interval:3.6,range:450},
  skeleton:{type:'arrow',color:'#e5d3a1',speed:235,interval:3.2,range:440},
  witch:{type:'potion',color:'#af78df',speed:195,interval:3.8,range:360},
  ghast:{type:'fireball',color:'#f5a04d',speed:170,interval:4,range:540},
  shulker:{type:'homing',color:'#dfb0f3',speed:125,interval:4.2,range:420},
  enderdragon:{type:'dragonfire',color:'#c27af3',speed:195,interval:4.5,range:600},
  warden:{type:'sonic',color:'#78e4df',speed:310,interval:4.6,range:370}
 };
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 function create(){return {projectiles:[]};}
 function update(state,dt,player,monsters,platforms){
  let impact=null;
  for(const [i,m] of monsters.entries()){
   const spec=attacks[m.kind];if(!spec||m.defeated)continue;
   m.attackFlash=Math.max(0,(m.attackFlash||0)-dt);
   const x=m.x+m.w/2,y=m.y+m.h*.45,dx=player.x+player.w/2-x,dy=player.y+player.h/2-y,distance=Math.hypot(dx,dy);
   m.attackCooldown=Math.max(0,(m.attackCooldown??(1.6+i*.23))-dt);
   if(m.attackCharge>0){
    m.attackCharge=Math.max(0,m.attackCharge-dt);
    if(!m.attackCharge){
     m.attackCooldown=spec.interval;m.attackFlash=.25;
     if(distance>spec.range+80)continue;
     const travel=Math.max(.4,distance/spec.speed),gravity=spec.type==='potion'?340:0;
     state.projectiles.push({owner:m.id,type:spec.type,color:spec.color,x:x-6,y:y-6,w:12,h:12,vx:dx/travel,vy:dy/travel-gravity*travel/2,gravity,life:4,age:0});
    }
   }else if(!m.attackCooldown&&distance<spec.range&&distance>55){m.attackCharge=.65;m.attackFacing=dx>=0?1:-1;}
  }
  for(const p of state.projectiles){
   p.life-=dt;p.age+=dt;
   if(!monsters.some(m=>m.id===p.owner&&!m.defeated)){p.life=0;continue;}
   if(p.type==='homing'&&p.age<1.6){const dx=player.x+player.w/2-p.x,dy=player.y+player.h/2-p.y,n=Math.hypot(dx,dy)||1;p.vx+=(dx/n*125-p.vx)*dt*3;p.vy+=(dy/n*125-p.vy)*dt*3;}
   p.vy+=p.gravity*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.type!=='sonic'&&platforms.some(r=>overlap(p,r))){p.life=0;continue;}
   if(overlap(p,player)){p.life=0;if(!player.hurtTime&&!impact)impact={direction:p.vx>=0?1:-1,type:p.type};}
  }
  state.projectiles=state.projectiles.filter(p=>p.life>0).slice(-32);
  return impact;
 }
 function draw(c,state,monsters){
  for(const m of monsters){if(m.defeated||(!(m.attackCharge>0)&&!(m.attackFlash>0)))continue;const spec=attacks[m.kind];if(!spec)continue;
   c.save();c.translate(m.x+m.w/2,m.y+m.h*.45);c.scale(m.attackFacing||1,1);const charge=m.attackCharge>0;
   c.strokeStyle=spec.color;c.fillStyle=spec.color;c.lineWidth=3;
   c.beginPath();c.arc(0,0,charge?12+(1-m.attackCharge/.65)*15:32,-1.3,1.3);c.stroke();
   if(spec.type==='arrow'){c.strokeStyle='#ad8255';c.beginPath();c.moveTo(18,-20);c.quadraticCurveTo(38,0,18,20);c.stroke();c.strokeStyle='#eee5c5';c.beginPath();c.moveTo(18,-20);c.lineTo(charge?7:18,0);c.lineTo(18,20);c.stroke();c.fillRect(8,-1,24,2);}
   else if(spec.type==='potion'){c.fillRect(17,-28,12,15);c.fillStyle='#e8dcc9';c.fillRect(20,-34,6,6);}
   else if(spec.type==='homing'){c.fillRect(-13,-17,26,5);c.fillRect(10,-4,8,8);}
   else if(spec.type==='wind'){for(let i=0;i<3;i++){c.beginPath();c.arc(15,0,8+i*5,-1.5,1.5);c.stroke();}}
   else if(spec.type==='sonic'){c.fillRect(-7,-9,14,18);}
   else{c.beginPath();c.arc(m.w*.35,0,charge?8:14,0,Math.PI*2);c.fill();}
   c.restore();
  }
  for(const p of state.projectiles){c.save();c.translate(p.x+6,p.y+6);c.rotate(Math.atan2(p.vy,p.vx));c.fillStyle=p.color;c.strokeStyle=p.color;c.lineWidth=3;
   if(p.type==='skull'){c.fillRect(-8,-8,16,16);c.fillStyle='#e3eff2';c.fillRect(0,-5,4,4);c.fillRect(0,2,4,4);c.fillStyle='#303844';c.fillRect(5,-3,4,6);}
   else if(p.type==='beam'){c.fillRect(-22,-2,40,4);c.fillStyle='#fff2c7';c.fillRect(-12,-1,28,2);}
   else if(p.type==='spell'){for(let i=0;i<3;i++){c.fillRect(-10+i*8,-8+i*3,4,16-i*3);}c.fillStyle='#fff9d9';c.fillRect(-3,-3,6,6);}
   else if(p.type==='arrow'){c.fillRect(-12,-1,24,2);c.beginPath();c.moveTo(13,0);c.lineTo(5,-5);c.lineTo(5,5);c.fill();}
   else if(p.type==='wind'){c.beginPath();c.arc(0,0,10,p.age*8,p.age*8+5);c.stroke();c.beginPath();c.arc(0,0,5,-p.age*8,-p.age*8+5);c.stroke();}
   else if(p.type==='sonic'){for(let i=0;i<3;i++){c.beginPath();c.arc(-i*9,0,9+i*3,-1.2,1.2);c.stroke();}}
   else{c.fillRect(-7,-7,14,14);c.fillStyle='#fff0db';c.fillRect(-3,-3,6,6);if(p.type==='potion'){c.fillStyle='#e4d5b7';c.fillRect(-3,-12,6,5);}else{c.globalAlpha=.4;c.fillStyle=p.color;c.fillRect(-17,-4,7,8);}}
   c.restore();
  }
 }
 return {attacks,create,update,draw};
})();
