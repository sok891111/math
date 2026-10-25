import {BLOCKS,HEIGHT,collides,raycast,intersectsPlayer,movePlayer} from './world.js';

export function groundPlayer(world,player){
 const x=player.x,z=player.z;
 // Keep precise horizontal position and view when restoring old airborne saves.
 for(let y=Math.min(HEIGHT-2,Math.floor(player.y+.05));y>=1;y--){const p={x,y:y+.01,z};if(!collides(world,p)&&hasSupport(world,p)){Object.assign(player,p,{crouch:false,flying:false});return true;}}
 for(let radius=0;radius<=12;radius++)for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
  if(radius&&Math.max(Math.abs(dx),Math.abs(dz))!==radius)continue;const sx=Math.floor(world.spawn.x)+dx,sz=Math.floor(world.spawn.z)+dz,y=world.top(sx,sz)+1,p={x:sx+.5,y:y+.01,z:sz+.5};
  if(y<HEIGHT-2&&!collides(world,p)&&world.get(sx,y,sz)!==11){Object.assign(player,p,{crouch:false,flying:false});return true;}
 }return false;
}
function hasSupport(world,p){
 const y=Math.floor(p.y+.05)-1;
 if(world.get(Math.floor(p.x),y+1,Math.floor(p.z))===11)return false;
 return [[0,0],[-.301,-.301],[.301,-.301],[-.301,.301],[.301,.301]].some(([dx,dz])=>world.solid(Math.floor(p.x+dx),y,Math.floor(p.z+dz)));
}
function onGround(world,p){return Math.abs(p.y-(Math.floor(p.y+.05)+.01))<.045&&hasSupport(world,p);}
function walkAxis(world,player,axis,amount){
 if(Math.abs(amount)<.000001)return false;
 const horizontal={...player,[axis]:player[axis]+amount},feet=Math.floor(player.y+.05);
 for(const offset of [0,1,-1]){
  const next={...horizontal,y:feet+offset+.01};if(collides(world,next)||!hasSupport(world,next))continue;
  if(offset>0){let clear=true;for(let y=player.y+.15;y<next.y+.001;y+=.15)if(collides(world,{...player,y})){clear=false;break;}if(!clear)continue;}
  if(offset<0&&collides(world,{...horizontal,y:player.y}))continue;
  Object.assign(player,{x:next.x,y:next.y,z:next.z});return true;
 }return false;
}
export class EasyControls {
 constructor(){this.inputs=new Map();this.pulses=new Map();this.vx=0;this.vz=0;this.vy=0;this.airborne=false;this.lastSafe=null;}
 get busy(){return this.airborne||Math.hypot(this.vx,this.vz)>.06;}
 release(source=null,cancel=false){
  if(source===null){this.inputs.clear();this.pulses.clear();this.vx=this.vz=0;return;}
  const direction=this.inputs.get(source);this.inputs.delete(source);if(cancel&&direction&&!Array.from(this.inputs.values()).includes(direction))this.pulses.delete(direction);
  if(cancel&&!this.inputs.size){this.vx=this.vz=0;}
 }
 reset(){this.release();this.vy=0;this.airborne=false;this.lastSafe=null;}
 jump(world,player){if(this.airborne||!onGround(world,player))return false;this.lastSafe={x:player.x,y:player.y,z:player.z};this.vy=7.6;this.airborne=true;return true;}
 press(world,player,direction,hold=true,source=direction){
  if(!['up','down','left','right'].includes(direction))return false;
  if(hold)this.inputs.set(source,direction);this.pulses.set(direction,.09);return true;
 }
 update(world,player,dt){
  let moved=false;const steps=Math.max(1,Math.ceil(dt/.02)),slice=dt/steps;
  for(let i=0;i<steps;i++){
   const directions=new Set([...this.inputs.values(),...this.pulses.keys()]);let side=(directions.has('right')?1:0)-(directions.has('left')?1:0),forward=(directions.has('up')?1:0)-(directions.has('down')?1:0);const length=Math.hypot(side,forward);if(length>1){side/=length;forward/=length;}
   const speed=2.15,tx=(Math.cos(player.yaw)*side-Math.sin(player.yaw)*forward)*speed,tz=(-Math.sin(player.yaw)*side-Math.cos(player.yaw)*forward)*speed,blend=1-Math.exp(-slice*(length?15:34));
   this.vx+=(tx-this.vx)*blend;this.vz+=(tz-this.vz)*blend;if(!length&&Math.hypot(this.vx,this.vz)<.006)this.vx=this.vz=0;
   if(!this.airborne&&!onGround(world,player))this.airborne=true;
   if(this.airborne){
    const before={x:player.x,y:player.y,z:player.z};movePlayer(world,player,{x:this.vx*slice,y:0,z:this.vz*slice});this.vy=Math.max(-20,this.vy-22*slice);const vertical=movePlayer(world,player,{x:0,y:this.vy*slice,z:0});
    if(vertical.ceiling)this.vy=0;if(vertical.grounded){this.vy=0;this.airborne=false;groundPlayer(world,player);}
    if(world.get(Math.floor(player.x),Math.floor(player.y),Math.floor(player.z))===11&&this.lastSafe){Object.assign(player,this.lastSafe);this.vy=0;this.airborne=false;this.release();}
    moved=Math.hypot(player.x-before.x,player.y-before.y,player.z-before.z)>.00001||moved;
   }else{
    moved=walkAxis(world,player,'x',this.vx*slice)||moved;moved=walkAxis(world,player,'z',this.vz*slice)||moved;this.lastSafe={x:player.x,y:player.y,z:player.z};
   }
   for(const [direction,remaining]of this.pulses){if(remaining<=slice)this.pulses.delete(direction);else this.pulses.set(direction,remaining-slice);}
  }return moved;
 }
}
export function easyTarget(world,player){
 const origin={x:player.x,y:player.y+1.62,z:player.z},cos=Math.cos(player.pitch),direction={x:-Math.sin(player.yaw)*cos,y:Math.sin(player.pitch),z:-Math.cos(player.yaw)*cos};
 const hit=raycast(world,origin,direction,6,true);if(!hit)return {hit:null,place:null,canPlace:false,canBreak:false,reason:'화면을 밀어 블록을 바라봐요.'};
 const place={x:hit.x+hit.normal.x,y:hit.y+hit.normal.y,z:hit.z+hit.normal.z},feet=Math.floor(player.y+.05);
 const canPlace=world.inside(place.x,place.y,place.z)&&place.y>0&&place.y<=feet+3&&!intersectsPlayer(place.x,place.y,place.z,player)&&(!world.get(place.x,place.y,place.z)||world.get(place.x,place.y,place.z)===11);
 const canBreak=!BLOCKS[hit.id].unbreakable&&hit.y>=feet-2&&!intersectsPlayer(hit.x,hit.y,hit.z,{...player,y:player.y-.08});
 return {hit,place,canPlace,canBreak,reason:canPlace?'초록 테두리에 A로 놓아요.':'조금 물러나서 블록을 바라봐요.'};
}
export class EditHistory {
 constructor(){this.entries=[];}
 clear(){this.entries=[];}
 record(x,y,z,before,after,resource=null){this.entries.push({x,y,z,before,after,resource});if(this.entries.length>50)this.entries.shift();}
 undo(world,player){const entry=this.entries.at(-1);if(!entry)return false;if(world.get(entry.x,entry.y,entry.z)!==entry.after)return false;
  if(entry.before&&intersectsPlayer(entry.x,entry.y,entry.z,player))return false;
  if(!entry.before&&intersectsPlayer(entry.x,entry.y,entry.z,{...player,y:player.y-.08}))return false;
  world.set(entry.x,entry.y,entry.z,entry.before);this.entries.pop();return true;
 }
}
