export const ANIMALS={pig:{name:'돼지',hp:3,width:1.02,height:1.15,speed:.48},chicken:{name:'닭',hp:2,width:.64,height:1.12,speed:.62},creeper:{name:'크리퍼',hp:4,width:.65,height:1.8,speed:.65,hostile:true},zombie:{name:'좀비',hp:6,width:.65,height:1.9,speed:.85,hostile:true}};
export function validateAnimalSave(value,size,height){
 if(!value||value.version!==1||!Array.isArray(value.entities)||value.entities.length>24)throw Error('동물 기록이 올바르지 않습니다.');
 if(value.hostilesInitialized!==undefined&&typeof value.hostilesInitialized!=='boolean')throw Error('몬스터 이관 기록이 올바르지 않습니다.');
 const ids=new Set();for(const animal of value.entities){
  if(!animal||typeof animal.id!=='string'||animal.id.length>40||ids.has(animal.id)||!Object.hasOwn(ANIMALS,animal.type))throw Error('동물 종류가 올바르지 않습니다.');ids.add(animal.id);if(animal.fuse!==undefined&&(!Number.isFinite(animal.fuse)||animal.fuse<0||animal.fuse>3))throw Error('크리퍼 상태가 올바르지 않습니다.');
  if(!['x','y','z','yaw','hp','respawn','wait'].every(key=>Number.isFinite(animal[key]))||animal.x<.5||animal.x>size-.5||animal.z<.5||animal.z>size-.5||animal.y<1||animal.y>height-1.2||!Number.isInteger(animal.hp)||animal.hp<0||animal.hp>ANIMALS[animal.type].hp||animal.respawn<0||animal.respawn>30||animal.wait<0||animal.wait>30)throw Error('동물 위치나 체력 기록이 올바르지 않습니다.');
 }return value;
}
