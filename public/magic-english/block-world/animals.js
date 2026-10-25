import {dropItems} from './ground-loot.js';
import {mobDrops} from './loot.js';
import {SIZE,HEIGHT,hashSeed,collides,raycast} from './world.js';
import {ANIMALS,validateAnimalSave} from './animal-state.js';
export {ANIMALS};
function random(animal){animal.rng=(Math.imul(animal.rng,1664525)+1013904223)>>>0;return animal.rng/4294967296;}
function floorAt(world,x,z,nearY=null,type='pig'){
 const start=nearY===null?world.top(Math.floor(x),Math.floor(z))+1:Math.floor(nearY+.05);
 for(const offset of nearY===null?[0]:[0,1,-1]){const y=start+offset+.01,p={x,y,z};if(y<1||y>HEIGHT-1.3||world.get(Math.floor(x),Math.floor(y),Math.floor(z))===11||!world.solid(Math.floor(x),Math.floor(y)-1,Math.floor(z))||collides(world,p,ANIMALS[type].height))continue;return y;}
 return null;
}
function boxDistance(origin,direction,animal){
 const width=ANIMALS[animal.type].width/2,min={x:animal.x-width,y:animal.y,z:animal.z-width},max={x:animal.x+width,y:animal.y+ANIMALS[animal.type].height,z:animal.z+width};let near=0,far=Infinity;
 for(const axis of ['x','y','z']){if(Math.abs(direction[axis])<1e-10){if(origin[axis]<min[axis]||origin[axis]>max[axis])return null;continue;}let a=(min[axis]-origin[axis])/direction[axis],b=(max[axis]-origin[axis])/direction[axis];if(a>b)[a,b]=[b,a];near=Math.max(near,a);far=Math.min(far,b);if(near>far)return null;}return near;
}
export class AnimalWorld {
 constructor(world,save=null){
  this.world=world;this.groundDrops=(save?.groundDrops||[]).map(d=>({...d}));this.dropSequence=0;this.entities=[];this.events=[];this.playerHitCooldown=0;const offsets=[[-.5,-2.8],[3.5,-4],[-4,-5.5],[6,-7],[-2.6,-3.5],[2.2,-2.3],[-5.5,-2],[5,-1]];
  if(save){validateAnimalSave(save,SIZE,HEIGHT);this.entities=save.entities.map(a=>({...a,rng:hashSeed(world.seed+':'+a.id),walk:0,flee:0,flash:0,phase:0}));}
  else for(let i=0;i<offsets.length;i++){const type=i<4?'pig':'chicken',animal={id:type+'-'+i,type,x:world.spawn.x,y:world.spawn.y,z:world.spawn.z,yaw:0,hp:ANIMALS[type].hp,respawn:0,wait:i===0?5:2+i*.3,rng:hashSeed(world.seed+':animal:'+i),walk:0,flee:0,flash:0,phase:0};this.relocate(animal,world.spawn.x+offsets[i][0],world.spawn.z+offsets[i][1]);animal.yaw=random(animal)*Math.PI*2;this.entities.push(animal);}
  if(!save?.hostilesInitialized){for(const [i,type,dx,dz]of [[0,'creeper',-7,-10],[1,'creeper',8,-12],[0,'zombie',-10,-6],[1,'zombie',11,-8]]){const id=type+'-'+i;if(this.entities.length>=24||this.entities.some(a=>a.id===id))continue;const animal={id,type,x:world.spawn.x,y:world.spawn.y,z:world.spawn.z,yaw:0,hp:ANIMALS[type].hp,respawn:0,wait:2,rng:hashSeed(world.seed+':'+id),walk:0,flee:0,flash:0,phase:0,fuse:0};this.relocate(animal,world.spawn.x+dx,world.spawn.z+dz);this.entities.push(animal);}}
  for(const animal of this.entities)if(animal.hp>0&&floorAt(world,animal.x,animal.z,animal.y,animal.type)===null&&!this.relocate(animal,animal.x,animal.z)){animal.hp=0;animal.respawn=3;}
 }
 relocate(animal,x,z){
  for(let radius=0;radius<=18;radius++)for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
   if(radius&&Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;const nx=Math.max(.6,Math.min(SIZE-.6,x+dx)),nz=Math.max(.6,Math.min(SIZE-.6,z+dz)),y=floorAt(this.world,nx,nz,null,animal.type);if(y!==null){Object.assign(animal,{x:nx,y,z:nz});return true;}
  }return false;
 }
 setNight(night){for(const animal of this.entities)if(ANIMALS[animal.type].hostile){animal.hidden=!night;if(!night)animal.fuse=0;}}
 update(dt,player,{night=true}={}){
  this.setNight(night);this.playerHitCooldown=Math.max(0,this.playerHitCooldown-dt);
  let changed=false;for(const a of this.entities){if(a.hidden)continue;a.flash=Math.max(0,a.flash-dt);a.phase+=dt;
   if(a.hp<=0){a.respawn=Math.max(0,a.respawn-dt);changed=true;if(a.respawn===0){if(this.relocate(a,this.world.spawn.x+(random(a)-.5)*16,this.world.spawn.z-3-random(a)*10)){a.hp=ANIMALS[a.type].hp;a.wait=3;a.flee=0;a.fuse=0;}else a.respawn=3;}continue;}
   const standing=floorAt(this.world,a.x,a.z,a.y,a.type);if(standing===null){if(!this.relocate(a,a.x,a.z)){a.hp=0;a.respawn=3;}changed=true;}else if(Math.abs(standing-a.y)>.001){a.y=standing;changed=true;}
   if(a.hp<=0)continue;
   const distance=Math.hypot(player.x-a.x,player.z-a.z),hostile=ANIMALS[a.type].hostile;
   if(hostile&&distance<12&&a.flee<=0){
    const clear=Math.abs(player.y-a.y)<1.5&&!raycast(this.world,{x:a.x,y:a.y+1,z:a.z},{x:(player.x-a.x)/(distance||1),y:0,z:(player.z-a.z)/(distance||1)},distance,true);
    if(a.type==='zombie'&&distance<1.6&&clear&&this.playerHitCooldown<=0){this.events.push({type:'player-hit',damage:1,source:'zombie',x:a.x,y:a.y,z:a.z});this.playerHitCooldown=2;}
    a.wait=0;a.walk=1;a.yaw=Math.atan2(a.x-player.x,a.z-player.z);
    if(a.type==='creeper'&&distance<2&&clear){a.fuse=(a.fuse||0)+dt;a.flash=.1;if(a.fuse>=1.8){a.hp=0;a.fuse=0;a.respawn=12;this.events.push({type:'creeper-puff',damage:2,x:a.x,y:a.y+1,z:a.z});changed=true;}continue;}
    a.fuse=0;if(distance<1.4)continue;
   }
   if(a.wait>0&&a.flee<=0){a.wait=Math.max(0,a.wait-dt);continue;}
   if(a.walk<=0&&a.flee<=0){a.yaw=random(a)*Math.PI*2;a.walk=1.5+random(a)*2;}
   const speed=a.flee>0?1.6:ANIMALS[a.type].speed,nx=a.x-Math.sin(a.yaw)*speed*dt,nz=a.z-Math.cos(a.yaw)*speed*dt,ground=floorAt(this.world,nx,nz,a.y,a.type);
   if(ground!==null&&nx>.6&&nz>.6&&nx<SIZE-.6&&nz<SIZE-.6&&Math.hypot(nx-player.x,nz-player.z)>.72){a.x=nx;a.z=nz;a.y=ground;changed=true;}else{a.yaw+=Math.PI*.7;a.walk=0;a.wait=.5;}
   a.walk-=dt;if(a.flee>0)a.flee=Math.max(0,a.flee-dt);if(a.walk<=0&&a.flee<=0)a.wait=1+random(a)*3;
  }return changed;
 }
 target(player,reach=3.6){
  const origin={x:player.x,y:player.y+1.62,z:player.z},cos=Math.cos(player.pitch),direction={x:-Math.sin(player.yaw)*cos,y:Math.sin(player.pitch),z:-Math.cos(player.yaw)*cos};const wall=raycast(this.world,origin,direction,reach,true);let selected=null;
  for(const animal of this.entities){if(animal.hp<=0||animal.hidden)continue;const distance=boxDistance(origin,direction,animal);if(distance!==null&&distance<=reach&&(!wall||distance<wall.distance-.01)&&(!selected||distance<selected.distance))selected={animal,distance};}return selected;
 }
 attack(player,damage=1){
  const target=this.target(player);if(!target)return null;const a=target.animal;a.hp=Math.max(0,a.hp-Math.max(1,Math.floor(damage)));a.flash=.22;a.flee=1.1;a.wait=0;a.walk=1.2;a.yaw=Math.atan2(player.x-a.x,player.z-a.z);
  const dx=a.x-player.x,dz=a.z-player.z,length=Math.hypot(dx,dz)||1,nx=a.x+dx/length*.35,nz=a.z+dz/length*.35,y=floorAt(this.world,nx,nz,a.y,a.type);if(y!==null){a.x=nx;a.z=nz;a.y=y;}
  if(a.hp===0){a.respawn=12;a.fuse=0;}const drops=a.hp===0?mobDrops(a.type,()=>random(a)):[];if(drops.length)this.groundDrops=dropItems(this.groundDrops,drops,a,Date.now().toString(36)+'-'+(++this.dropSequence));return {id:a.id,type:a.type,hp:a.hp,defeated:a.hp===0,drops};
 }
 snapshot(){return {version:1,groundDrops:this.groundDrops.map(d=>({...d})),hostilesInitialized:true,entities:this.entities.map(({id,type,x,y,z,yaw,hp,respawn,wait,fuse})=>({id,type,x,y,z,yaw,hp,respawn,wait,...(fuse!==undefined?{fuse}:{})}))};}
}
