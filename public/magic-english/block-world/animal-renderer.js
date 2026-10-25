import * as THREE from './vendor/three.module.js';
export class AnimalRenderer {
 constructor(scene){this.scene=scene;this.models=new Map();this.box=new THREE.BoxGeometry(1,1,1);}
 clear(){for(const model of this.models.values()){this.scene.remove(model.group);model.shadow.geometry.dispose();for(const material of model.materials.values())material.dispose();}this.models.clear();}
 create(animal){
  const group=new THREE.Group(),materials=new Map(),legs=[],wings=[];
  const part=(size,position,color,parent=group)=>{if(!materials.has(color)){const material=new THREE.MeshLambertMaterial({color});material.userData.base=new THREE.Color(color);materials.set(color,material);}const mesh=new THREE.Mesh(this.box,materials.get(color));mesh.scale.set(...size);mesh.position.set(...position);parent.add(mesh);return mesh;};
  if(animal.type==='pig'){
   part([.79,.5,1.02],[0,.66,0],'#e4a3a4');part([.57,.5,.5],[0,.86,-.61],'#e9b0af');part([.34,.21,.12],[0,.76,-.92],'#d48690');
   for(const x of [-.1,.1])part([.055,.055,.018],[x,.77,-.99],'#865360');for(const x of [-.2,.2]){part([.13,.13,.022],[x,.96,-.868],'#fff8e9');part([.063,.077,.026],[x,.95,-.883],'#343338');part([.16,.17,.13],[x,1.14,-.59],'#d98f9b');}
   for(const x of [-.25,.25])for(const z of [-.32,.32]){const leg=new THREE.Group();leg.position.set(x,.335,z);part([.17,.3,.18],[0,-.15,0],'#d99a9c',leg);part([.17,.07,.18],[0,-.3,0],'#78555a',leg);group.add(leg);legs.push(leg);}
   part([.12,.12,.19],[.12,.79,.6],'#d48690');part([.12,.12,.1],[.22,.86,.63],'#e9b0af');
  }else{
   part([.43,.44,.49],[0,.53,0],'#f3eee0');part([.31,.32,.3],[0,.92,-.2],'#fff8e9');part([.2,.1,.17],[0,.88,-.43],'#d9a43e');part([.09,.13,.07],[0,.75,-.39],'#be5554');part([.16,.11,.12],[0,1.13,-.2],'#c45d59');
   for(const x of [-.12,.12]){part([.065,.07,.025],[x,1,-.36],'#303a36');const leg=new THREE.Group();leg.position.set(x,.265,.03);part([.055,.24,.055],[0,-.1,0],'#d8a347',leg);part([.11,.05,.2],[0,-.23,-.06],'#d8a347',leg);group.add(leg);legs.push(leg);}
   for(const x of [-.27,.27])wings.push(part([.12,.34,.34],[x,.55,.02],'#dcdccd'));part([.24,.21,.16],[0,.7,.3],'#e7e6d7');
  }
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(animal.type==='pig'?.46:.28,12),new THREE.MeshBasicMaterial({color:'#273c2b',transparent:true,opacity:.18,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.006;group.add(shadow);materials.set('shadow',shadow.material);this.scene.add(group);const model={group,materials,legs,wings,shadow,wasAlive:animal.hp>0};this.models.set(animal.id,model);return model;
 }
 update(animals,dt,active){
  for(const animal of animals.entities){const model=this.models.get(animal.id)||this.create(animal),{group}=model;group.visible=animal.hp>0;
   if(!group.visible){model.wasAlive=false;continue;}if(!model.wasAlive||!group.userData.positioned){group.position.set(animal.x,animal.y,animal.z);group.rotation.y=animal.yaw;group.userData.positioned=true;}model.wasAlive=true;
   const blend=1-Math.exp(-dt*18);group.position.x+=(animal.x-group.position.x)*blend;group.position.y+=(animal.y-group.position.y)*blend;group.position.z+=(animal.z-group.position.z)*blend;let turn=((animal.yaw-group.rotation.y+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI;group.rotation.y+=turn*blend;
   const walking=active&&(animal.wait<=0||animal.flee>0),wave=Math.sin(animal.phase*(animal.flee>0?17:9))*(walking?.35:0);model.legs.forEach((leg,i)=>leg.rotation.x=(i%2?1:-1)*wave);model.wings.forEach((wing,i)=>wing.rotation.z=(i?1:-1)*Math.abs(wave));
   for(const material of model.materials.values())if(material.userData.base){material.color.copy(material.userData.base);if(animal.flash>0)material.color.lerp(new THREE.Color('#ff766b'),.65);}
  }
 }
}
