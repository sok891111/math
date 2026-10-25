import {LOOT_ITEMS} from './loot.js';
export function validateGroundLoot(drops,size,height){
 if(!Array.isArray(drops)||drops.length>512)throw Error('바닥 아이템 기록이 올바르지 않습니다.');const ids=new Set();
 for(const d of drops){if(!d||typeof d.id!=='string'||d.id.length>80||ids.has(d.id)||!Object.hasOwn(LOOT_ITEMS,d.itemId)||!Number.isInteger(d.quantity)||d.quantity<1||d.quantity>1000000||!['x','y','z','age'].every(k=>Number.isFinite(d[k]))||d.x<0||d.x>=size||d.z<0||d.z>=size||d.y<0||d.y>=height||d.age<0||d.age>300)throw Error('바닥 아이템 상태가 올바르지 않습니다.');ids.add(d.id);}return drops;
}
export function dropItems(existing,items,position,id){
 const drops=existing.map(d=>({...d}));for(const [i,item]of items.entries()){const nearby=drops.find(d=>d.itemId===item.itemId&&Math.hypot(d.x-position.x,d.z-position.z)<1.5&&d.quantity+item.quantity<=1000000);if(nearby){nearby.quantity+=item.quantity;nearby.age=0;}else if(drops.length<512)drops.push({...item,id:id+'-'+i,x:position.x+(i%2?.25:-.15),y:position.y+.25,z:position.z,age:0});}return drops;
}
export function updateGroundLoot(drops,dt,player,world){
 const remaining=[],picked=[];for(const item of drops){const d={...item,age:item.age+dt};if(d.age>=300)continue;
 if(world){while(d.y<63&&world.get(Math.floor(d.x),Math.floor(d.y),Math.floor(d.z)))d.y+=1;const below=world.get(Math.floor(d.x),Math.floor(d.y-.3),Math.floor(d.z));if(!below)d.y=Math.max(.3,d.y-dt*3);}
 const distance=Math.hypot(player.x-d.x,player.z-d.z),direction={x:(player.x-d.x)/(distance||1),y:0,z:(player.z-d.z)/(distance||1)};
 let clear=true;if(world&&distance>.1)for(let step=.15;step<distance;step+=.2)if(world.get(Math.floor(d.x+direction.x*step),Math.floor(d.y+.3),Math.floor(d.z+direction.z*step))){clear=false;break;}
 if(d.age>=.6&&distance<1.3&&Math.abs(player.y-d.y)<1.5&&clear)picked.push({itemId:d.itemId,quantity:d.quantity});else remaining.push(d);
 }return {drops:remaining,picked};
}
