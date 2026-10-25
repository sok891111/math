// Pure voxel model. Rendering and browser storage are deliberately separate.
import {validateAnimalSave} from './animal-state.js';
import {validateInventory} from './inventory.js';
export const SIZE=128, HEIGHT=64, CHUNK=16, SEA=12, FORMAT=1;
import {BLOCKS,DEFAULT_BAR} from './block-data.js';
export {BLOCKS,DEFAULT_BAR} from './block-data.js';
export function hashSeed(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;}
function noise(x,z,seed){let h=Math.imul(x,374761393)^Math.imul(z,668265263)^seed;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
const smooth=t=>t*t*(3-2*t);
function valueNoise(x,z,scale,seed){x/=scale;z/=scale;const ix=Math.floor(x),iz=Math.floor(z),a=smooth(x-ix),b=smooth(z-iz);return (noise(ix,iz,seed)*(1-a)+noise(ix+1,iz,seed)*a)*(1-b)+(noise(ix,iz+1,seed)*(1-a)+noise(ix+1,iz+1,seed)*a)*b;}
export class VoxelWorld {
 constructor(seed='새로운 모험',terrain='flat') {this.seed=seed;this.terrain=terrain;this.data=new Uint8Array(SIZE*SIZE*HEIGHT);this.edits=new Map();this.dirty=new Set();this.spawn={x:64.5,y:19,z:72.5};}
 index(x,y,z){return x+SIZE*(z+SIZE*y);}
 inside(x,y,z){return Number.isInteger(x)&&Number.isInteger(y)&&Number.isInteger(z)&&x>=0&&z>=0&&y>=0&&x<SIZE&&z<SIZE&&y<HEIGHT;}
 get(x,y,z){return this.inside(x,y,z)?this.data[this.index(x,y,z)]:0;}
 solid(x,y,z){const id=this.get(x,y,z);return !!id&&!BLOCKS[id].liquid;}
 set(x,y,z,id,record=true){if(!this.inside(x,y,z)||!Number.isInteger(id)||id<0||id>=BLOCKS.length)return false;const index=this.index(x,y,z);if(this.data[index]===id)return false;this.data[index]=id;if(record)this.edits.set(index,id);this.markDirty(x,z);return true;}
 markDirty(x,z){const cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK);this.dirty.add(`${cx},${cz}`);if(x%CHUNK===0&&cx>0)this.dirty.add(`${cx-1},${cz}`);if(x%CHUNK===CHUNK-1&&cx<7)this.dirty.add(`${cx+1},${cz}`);if(z%CHUNK===0&&cz>0)this.dirty.add(`${cx},${cz-1}`);if(z%CHUNK===CHUNK-1&&cz<7)this.dirty.add(`${cx},${cz+1}`);}
 top(x,z){for(let y=HEIGHT-1;y>=0;y--)if(this.solid(x,y,z))return y;return 0;}
 generate(){
  this.data.fill(0);const seed=hashSeed(this.seed),heights=new Uint8Array(SIZE*SIZE);
  for(let z=0;z<SIZE;z++)for(let x=0;x<SIZE;x++){
   const edge=Math.min(x,z,SIZE-1-x,SIZE-1-z),d=Math.hypot(x-64,z-65);
   let h=this.terrain==='flat'?16:Math.floor(14+valueNoise(x,z,26,seed)*10+valueNoise(x,z,9,seed+1)*3);
   if(this.terrain!=='flat'){h=Math.min(h,Math.floor(6+edge*.7));const lake=Math.hypot((x-88)/1.1,z-67);if(lake<12)h=Math.min(h,Math.floor(9+lake*.26));if(d<13)h=17;else if(d<19)h=Math.round(h*(d-13)/6+17*(19-d)/6);}
   heights[x+z*SIZE]=h;
   for(let y=0;y<=Math.max(SEA,h);y++)this.set(x,y,z,y===0?32:y>h?11:y===h?(h<=SEA+1?8:1):y>h-4?2:3,false);
  }
  if(this.terrain!=='flat'){
   for(let z=6;z<SIZE-6;z++)for(let x=6;x<SIZE-6;x++){
    const y=heights[x+z*SIZE];if(y<15||Math.hypot(x-64,z-65)<20||noise(x,z,seed+9)>.016)continue;
    const trunk=4+Math.floor(noise(x,z,seed+4)*2);for(let dy=1;dy<=trunk;dy++)this.set(x,y+dy,z,5,false);
    for(let dy=trunk-2;dy<=trunk+1;dy++)for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)if(Math.abs(dx)+Math.abs(dz)+(dy===trunk+1?1:0)<=3&&!this.get(x+dx,y+dy,z+dz))this.set(x+dx,y+dy,z+dz,7,false);
   }
   // A small open doorway cabin is a discoverable starting landmark.
   for(let x=58;x<=65;x++)for(let z=54;z<=60;z++){
    this.set(x,17,z,6,false);for(let y=18;y<=21;y++)if(x===58||x===65||z===54||z===60){let id=(x===58||x===65)&&(z===54||z===60)?5:6;if(y===19&&(x===58||x===65||z===54))id=9;if(z===60&&(x===61||x===62)&&y<=20)id=0;this.set(x,y,z,id,false);}
   }
   for(let r=0;r<4;r++)for(let x=57+r;x<=66-r;x++)for(let z=53;z<=61;z++)this.set(x,22+r,z,29,false);
   this.set(59,18,55,30,false);this.set(64,20,55,25,false);
   for(let z=61;z<=80;z++)for(let x=61;x<=63;x++)this.set(x,this.top(x,z),z,12,false);
  }
  this.spawn={x:64.5,y:this.top(64,72)+1.01,z:72.5};this.edits.clear();this.dirty.clear();for(let z=0;z<8;z++)for(let x=0;x<8;x++)this.dirty.add(`${x},${z}`);return this;
 }
 applyEdits(edits){for(const [index,id]of edits){this.data[index]=id;this.edits.set(index,id);}for(let z=0;z<8;z++)for(let x=0;x<8;x++)this.dirty.add(`${x},${z}`);}
}
export function raycast(world,origin,direction,reach=6,includeLiquid=false){
 let x=Math.floor(origin.x),y=Math.floor(origin.y),z=Math.floor(origin.z),distance=0,normal={x:0,y:0,z:0};
 const step={x:Math.sign(direction.x),y:Math.sign(direction.y),z:Math.sign(direction.z)},delta={},next={};
 for(const a of ['x','y','z']){delta[a]=direction[a]===0?Infinity:Math.abs(1/direction[a]);next[a]=direction[a]===0?Infinity:((step[a]>0?Math.floor(origin[a])+1-origin[a]:origin[a]-Math.floor(origin[a]))*delta[a]);}
 for(let i=0;i<200&&distance<=reach;i++){
  const id=world.get(x,y,z);if(id&&(includeLiquid||!BLOCKS[id].liquid))return {x,y,z,id,distance,normal:{...normal}};
  const a=next.x<next.y?(next.x<next.z?'x':'z'):(next.y<next.z?'y':'z');distance=next[a];if(!Number.isFinite(distance))break;next[a]+=delta[a];normal={x:0,y:0,z:0};normal[a]=-step[a];if(a==='x')x+=step.x;else if(a==='y')y+=step.y;else z+=step.z;
 }return null;
}
export function intersectsPlayer(x,y,z,p,height=1.8){return x+1>p.x-.3&&x<p.x+.3&&z+1>p.z-.3&&z<p.z+.3&&y+1>p.y+.001&&y<p.y+height;}
export function collides(world,p,height=1.8){
 if(p.x<.3||p.z<.3||p.x>SIZE-.3||p.z>SIZE-.3||p.y<1||p.y+height>HEIGHT)return true;
 for(let y=Math.floor(p.y+.001);y<=Math.floor(p.y+height-.001);y++)for(let x=Math.floor(p.x-.3);x<=Math.floor(p.x+.3-.001);x++)for(let z=Math.floor(p.z-.3);z<=Math.floor(p.z+.3-.001);z++)if(world.solid(x,y,z))return true;return false;
}
export function movePlayer(world,p,delta,height=1.8,sneak=false){
 const count=Math.max(1,Math.ceil(Math.max(Math.abs(delta.x),Math.abs(delta.y),Math.abs(delta.z))/.2));let grounded=false,ceiling=false;
 for(let i=0;i<count;i++)for(const axis of ['x','z','y']){
  const amount=delta[axis]/count;if(!amount)continue;const next={...p,[axis]:p[axis]+amount};
  if(collides(world,next,height)){if(axis==='y'){if(amount<0)grounded=true;else ceiling=true;}continue;}
  if(sneak&&axis!=='y'&&!collides(world,{...next,y:next.y-.5},height))continue;p[axis]=next[axis];
 }return {grounded,ceiling};
}
export function validateSave(value){
 if(!value||value.format!==FORMAT||typeof value.seed!=='string'||value.seed.length>100||!['flat','meadow'].includes(value.terrain))throw Error('지원하지 않는 세계 파일입니다.');
 if(!Array.isArray(value.edits)||value.edits.length>SIZE*SIZE*HEIGHT)throw Error('블록 기록이 올바르지 않습니다.');
 const seen=new Set();for(const pair of value.edits){if(!Array.isArray(pair)||pair.length!==2||!Number.isInteger(pair[0])||pair[0]<0||pair[0]>=SIZE*SIZE*HEIGHT||!Number.isInteger(pair[1])||pair[1]<0||pair[1]>=BLOCKS.length||seen.has(pair[0]))throw Error('블록 기록이 올바르지 않습니다.');seen.add(pair[0]);}
 const p=value.player;if(!p||!['x','y','z','yaw','pitch'].every(k=>Number.isFinite(p[k]))||p.x<.3||p.x>SIZE-.3||p.z<.3||p.z>SIZE-.3||p.y<1||p.y>HEIGHT-1.8||Math.abs(p.pitch)>Math.PI/2+.01)throw Error('플레이어 위치가 올바르지 않습니다.');
 if(!Array.isArray(value.bar)||value.bar.length!==9||!value.bar.every(id=>Number.isInteger(id)&&id>0&&id<BLOCKS.length&&!BLOCKS[id].unbreakable))throw Error('핫바 기록이 올바르지 않습니다.');
 if(typeof value.name!=='string'||!value.name.trim()||value.name.length>40)throw Error('세계 이름이 올바르지 않습니다.');
 if(value.tool!==undefined&&value.tool!==null&&value.tool!=='stick')throw Error('도구 기록이 올바르지 않습니다.');
 if(value.animals!==undefined)validateAnimalSave(value.animals,SIZE,HEIGHT);
 if(value.inventory!==undefined){validateInventory(value.inventory);const edits=new Map(value.edits);for(const [index,id]of Object.entries(value.inventory.placed))if(edits.get(Number(index))!==id)throw Error('설치 블록과 보관함 기록이 다릅니다.');}
 return value;
}
