import {daylight,skyAngle,isNight} from './day-night.js';
import {WEAPONS,isWeapon} from './weapons.js';
import * as THREE from './vendor/three.module.js';
import {BLOCKS,SIZE,HEIGHT,CHUNK,hashSeed} from './world.js';
import {AnimalRenderer} from './animal-renderer.js';
import {stickSwingPose} from './stick-swing.js';

const TILE=16,COLS=16,ROWS=8;
const FACES=[
 {n:[1,0,0],v:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],shade:.78,t:0},
 {n:[-1,0,0],v:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],shade:.68,t:0},
 {n:[0,1,0],v:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],shade:1,t:1},
 {n:[0,-1,0],v:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],shade:.48,t:2},
 {n:[0,0,1],v:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],shade:.88,t:0},
 {n:[0,0,-1],v:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],shade:.73,t:0},
];
function tint(hex,n){const c=new THREE.Color(hex);c.multiplyScalar(n);return `#${c.getHexString()}`;}
export function makeAtlas(){
 const canvas=document.createElement('canvas');canvas.width=COLS*TILE;canvas.height=ROWS*TILE;const ctx=canvas.getContext('2d'),icons={};
 for(let id=1;id<BLOCKS.length;id++)for(let face=0;face<3;face++){
  const b=BLOCKS[id],tile=(id-1)*3+face,ox=tile%COLS*TILE,oy=Math.floor(tile/COLS)*TILE;let seed=hashSeed(`${id}:${face}`);const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  ctx.fillStyle=b.color;ctx.fillRect(ox,oy,TILE,TILE);
  for(let y=0;y<TILE;y++)for(let x=0;x<TILE;x++){ctx.fillStyle=tint(b.color,.77+rand()*.42);ctx.fillRect(ox+x,oy+y,1,1);}
  const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(ox+x,oy+y,w,h);};
  if(b.texture==='grass'&&face!==1){rect(0,0,16,16,'#906448');for(let j=0;j<75;j++)rect(rand()*16|0,rand()*16|0,2,1,tint('#906448',.7+rand()*.6));if(face===0)for(let x=0;x<16;x++)rect(x,0,1,3+(rand()*3|0),tint(b.color,.8+rand()*.4));}
  if(b.texture==='planks'){for(let y=3;y<16;y+=4){rect(0,y,16,1,tint(b.color,.65));rect(y%8?5:11,y-3,1,3,tint(b.color,.7));}}
  if(b.texture==='log'){if(face===0){for(let x=1;x<16;x+=3)rect(x,0,1,16,tint(b.color,.65));}else{for(let r=0;r<4;r++){ctx.strokeStyle=tint(b.color,r%2?.7:1.2);ctx.strokeRect(ox+r*2+.5,oy+r*2+.5,15-r*4,15-r*4);}}}
  if(b.texture==='brick'){for(let y=3;y<16;y+=4){rect(0,y,16,1,'#cdbda5');for(let x=(y%8?3:7);x<16;x+=8)rect(x,y-3,1,3,'#cdbda5');}}
  if(b.texture==='cobble'){for(let y=0;y<16;y+=5)for(let x=0;x<16;x+=6){rect(x+(y%2)*2,y,5,4,tint(b.color,.8+rand()*.3));rect(x+(y%2)*2,y,5,1,tint(b.color,1.17));}}
  if(b.texture==='glass'){rect(0,0,16,16,'#acd6da');rect(0,0,16,1,'#ecffff');rect(0,0,1,16,'#ecffff');rect(15,0,1,16,'#719fa9');rect(0,15,16,1,'#719fa9');for(let i=3;i<11;i++)rect(i,13-i,2,1,'#e1f3ed');}
  if(b.texture==='water'){for(let i=0;i<7;i++)rect(rand()*12|0,rand()*16|0,4,1,'#78c5db');}
  if(b.texture==='glow'){for(let i=0;i<18;i++)rect(rand()*14|0,rand()*14|0,2,2,i%2?'#fff4b5':'#bb8e42');}
  if(b.texture==='books'&&face===0){rect(0,0,16,16,'#5a4836');for(let x=1;x<15;x+=3){rect(x,2,2,5,['#b75a51','#5c8797','#a7a45e'][x%3]);rect(x,9,2,5,['#b48f46','#658e63','#9b6e8e'][x%3]);}rect(0,7,16,2,b.color);}
 }
 const texture=new THREE.CanvasTexture(canvas);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
 // Isometric inventory icons use the same authored pixel textures as the world.
 for(let id=1;id<BLOCKS.length;id++){
  const c=document.createElement('canvas');c.width=64;c.height=64;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  const draw=(face,points,dark)=>{x.save();x.beginPath();points.forEach((p,i)=>i?x.lineTo(...p):x.moveTo(...p));x.closePath();x.clip();const tile=(id-1)*3+face;const sx=tile%COLS*16,sy=Math.floor(tile/COLS)*16;x.drawImage(canvas,sx,sy,16,16,6,4,52,54);if(dark){x.fillStyle=`rgba(0,0,0,${dark})`;x.fillRect(0,0,64,64);}x.restore();};
  draw(1,[[32,3],[59,17],[32,32],[5,17]],0);draw(0,[[5,17],[32,32],[32,62],[5,47]],.08);draw(0,[[32,32],[59,17],[59,47],[32,62]],.23);icons[id]=c.toDataURL();
 }
 const stick=document.createElement('canvas');stick.width=64;stick.height=64;const pen=stick.getContext('2d');pen.translate(32,32);pen.rotate(Math.PI/4);pen.fillStyle='#553d28';pen.fillRect(-6,-29,12,58);pen.fillStyle='#a77a49';pen.fillRect(-4,-27,8,54);pen.fillStyle='#cfaa73';pen.fillRect(-3,-26,2,51);pen.fillStyle='#795531';for(let y=-22;y<25;y+=9)pen.fillRect(0,y,4,2);icons.stick=stick.toDataURL();
 return {texture,icons};
}

export class WorldRenderer {
 constructor(canvas,atlas){
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setClearColor('#acd7e6');
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#acd7e6');this.scene.fog=new THREE.Fog('#acd7e6',42,105);
  this.animalRenderer=new AnimalRenderer(this.scene);
  this.camera=new THREE.PerspectiveCamera(75,1,.05,160);this.camera.rotation.order='YXZ';this.scene.add(this.camera);
  this.scene.add(new THREE.HemisphereLight('#ffffff','#b3b99a',2.3));this.sunlight=new THREE.DirectionalLight('#fff0d1',1.3);this.sunlight.position.set(-30,70,25);this.scene.add(this.sunlight);
  this.materials=[new THREE.MeshLambertMaterial({map:atlas.texture,vertexColors:true}),new THREE.MeshLambertMaterial({map:atlas.texture,vertexColors:true,transparent:true,opacity:.48,depthWrite:false}),new THREE.MeshLambertMaterial({map:atlas.texture,vertexColors:true,transparent:true,opacity:.72,depthWrite:false}),new THREE.MeshBasicMaterial({map:atlas.texture,vertexColors:true})];
  this.chunks=new Map();this.particles=[];this.atlas=atlas;this.drawDistance=96;this.time=.27;this.cycle=false;
  const edges=new THREE.EdgesGeometry(new THREE.BoxGeometry(1.006,1.006,1.006));this.outline=new THREE.LineSegments(edges,new THREE.LineBasicMaterial({color:'#192c32',transparent:true,opacity:.75}));this.scene.add(this.outline);this.outline.visible=false;
  this.buildPreview=new THREE.Group();this.buildPreview.add(new THREE.Mesh(new THREE.BoxGeometry(.99,.99,.99),new THREE.MeshBasicMaterial({color:'#b5e789',transparent:true,opacity:.22,depthWrite:false})));this.buildPreview.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01,1.01,1.01)),new THREE.LineBasicMaterial({color:'#d2ff99',transparent:true,opacity:.95})));this.buildPreview.visible=false;this.scene.add(this.buildPreview);
  this.clouds=new THREE.Group();const cloudMat=new THREE.MeshBasicMaterial({color:'#fff9ec',transparent:true,opacity:.88});const cloudGeo=new THREE.BoxGeometry(1,1,1);
  for(let i=0;i<28;i++){const mesh=new THREE.Mesh(cloudGeo,cloudMat);mesh.position.set((i*37)%180-25,42+(i%3)*3,(i*61)%180-25);mesh.scale.set(7+(i%4)*3,1.2,3+(i%3)*2);this.clouds.add(mesh);}this.scene.add(this.clouds);
  this.sun=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.MeshBasicMaterial({color:'#fff2bc',fog:false}));this.scene.add(this.sun);
  this.held=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.3),this.materials[0].clone());this.held.material.vertexColors=false;this.held.position.set(.43,-.36,-.66);this.held.rotation.set(.12,-.6,.07);this.held.renderOrder=10;this.held.material.depthTest=false;this.camera.add(this.held);this.setHeld(1);
  this.heldStick=new THREE.Group();const stickMaterial=new THREE.MeshLambertMaterial({color:'#a77a49',depthTest:false}),stick=new THREE.Mesh(new THREE.BoxGeometry(.068,.66,.068),stickMaterial);stick.renderOrder=11;this.heldStick.add(stick);const highlight=new THREE.Mesh(new THREE.BoxGeometry(.016,.64,.073),new THREE.MeshLambertMaterial({color:'#d0ac74',depthTest:false}));highlight.position.x=-.025;highlight.renderOrder=12;this.heldStick.add(highlight);this.heldStick.position.set(.44,-.3,-.7);this.heldStick.rotation.z=-.48;this.camera.add(this.heldStick);this.heldStick.visible=false;
  this.stickTrails=[.16,.08].map(opacity=>{const mesh=new THREE.Mesh(stick.geometry,new THREE.MeshBasicMaterial({color:'#e1c397',transparent:true,opacity,depthTest:false,depthWrite:false}));mesh.renderOrder=9;mesh.visible=false;this.camera.add(mesh);return mesh;});
  this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
 setHeld(id){const g=this.held.geometry;const uv=g.attributes.uv;for(let face=0;face<6;face++){const tile=(id-1)*3+(face===2?1:face===3?2:0),u=tile%COLS/COLS,v=1-Math.floor(tile/COLS)/ROWS;const corners=[[0,1],[1,1],[0,0],[1,0]];for(let j=0;j<4;j++)uv.setXY(face*4+j,u+(corners[j][0]*.98+.01)/COLS,v-(1-corners[j][1]*.98-.01)/ROWS);}uv.needsUpdate=true;}
 attach(world){this.animalRenderer.clear();for(const group of this.chunks.values()){group.traverse(o=>o.geometry?.dispose());this.scene.remove(group);}this.chunks.clear();this.world=world;this.eyeHeight=undefined;this.flush(Infinity);}
 flush(limit=3){let i=0;for(const key of this.world.dirty){this.rebuild(key);this.world.dirty.delete(key);if(++i>=limit)break;}}
 rebuild(key){
  const [cx,cz]=key.split(',').map(Number),old=this.chunks.get(key);if(old){old.traverse(o=>o.geometry?.dispose());this.scene.remove(old);}const group=new THREE.Group(),parts=Array.from({length:4},()=>({p:[],n:[],uv:[],c:[],i:[]}));const world=this.world;
  for(let y=0;y<HEIGHT;y++)for(let z=cz*CHUNK;z<(cz+1)*CHUNK;z++)for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x++){
   const id=world.get(x,y,z);if(!id)continue;const b=BLOCKS[id],part=parts[b.liquid?2:b.transparent?1:b.glow?3:0];
   for(const face of FACES){const [nx,ny,nz]=face.n,other=world.get(x+nx,y+ny,z+nz);if(other===id||other&&!BLOCKS[other].transparent)continue;
    const base=part.p.length/3,tile=(id-1)*3+face.t,u=tile%COLS/COLS,v=1-Math.floor(tile/COLS)/ROWS;
    face.v.forEach((corner,j)=>{const [dx,dy,dz]=corner;let ao=0;if(!b.transparent){for(const axis of [0,1,2])if(face.n[axis]===0){const q=[x+nx,y+ny,z+nz];q[axis]+=corner[axis]?1:-1;if(world.solid(...q))ao++;}}const shade=face.shade*(1-ao*.12);part.p.push(x+dx,y+dy,z+dz);part.n.push(nx,ny,nz);part.c.push(shade,shade,shade);part.uv.push(u+([0,1,1,0][j]*.98+.01)/COLS,v-([1,1,0,0][j]*.98+.01)/ROWS);});part.i.push(base,base+1,base+2,base,base+2,base+3);
   }
  }
  parts.forEach((p,i)=>{if(!p.p.length)return;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(p.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(p.uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(p.c,3));g.setIndex(p.i);g.computeBoundingSphere();group.add(new THREE.Mesh(g,this.materials[i]));});this.chunks.set(key,group);this.scene.add(group);
 }
 burst(hit){const color=BLOCKS[hit.id].color;for(let i=0;i<12;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,.09),new THREE.MeshLambertMaterial({color}));mesh.position.set(hit.x+.5,hit.y+.5,hit.z+.5);this.scene.add(mesh);this.particles.push({mesh,v:new THREE.Vector3((Math.random()-.5)*3,Math.random()*3,(Math.random()-.5)*3),life:.55});}}
 render(player,dt,moving,swing,selected,smoothMovement=false){
  this.flush();if(!smoothMovement||this.eyeHeight===undefined)this.eyeHeight=player.y;else this.eyeHeight+=(player.y-this.eyeHeight)*(1-Math.exp(-dt*14));this.camera.position.set(player.x,this.eyeHeight+(player.crouch?1.32:1.62),player.z);this.camera.rotation.set(player.pitch,player.yaw,0);this.outline.visible=!!selected;if(selected)this.outline.position.set(selected.x+.5,selected.y+.5,selected.z+.5);
  const wave=performance.now()*.009;this.held.position.y=-.36+(moving?Math.sin(wave)*.016:0)-Math.sin(swing*Math.PI)*.17;this.held.rotation.z=.07-Math.sin(swing*Math.PI)*.6;
  const progress=1-swing,pose=stickSwingPose(progress);this.heldStick.position.set(...pose.position);this.heldStick.rotation.set(...pose.rotation);if(!swing&&moving)this.heldStick.position.y+=Math.sin(wave)*.012;
  this.stickTrails.forEach((trail,i)=>{trail.visible=this.heldStick.visible&&swing>0&&progress>.18&&progress<.64;const prior=stickSwingPose(Math.max(0,progress-(i+1)*.07));trail.position.set(...prior.position);trail.rotation.set(...prior.rotation);});
  for(const p of this.particles){p.life-=dt;p.v.y-=dt*8;p.mesh.position.addScaledVector(p.v,dt);p.mesh.scale.setScalar(Math.max(0,p.life/.55));if(p.life<=0){this.scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();}}
  this.particles=this.particles.filter(p=>p.life>0);
  const day=daylight(this.time);const sky=new THREE.Color('#15273e').lerp(new THREE.Color('#acd7e6'),day);this.scene.background.copy(sky);this.scene.fog.color.copy(sky);this.sunlight.intensity=day*1.3;this.scene.children.find(o=>o.isHemisphereLight).intensity=.25+day*2.05;
  const angle=skyAngle(this.time);this.sun.material.color.set(isNight(this.time)?'#d6e8f6':'#fff2bc');this.sun.position.set(player.x+Math.cos(angle)*90,Math.abs(Math.sin(angle))*90,player.z-35);this.sun.lookAt(this.camera.position);this.clouds.position.x=Math.sin(performance.now()*.00002)*8;
  const water=this.world.get(Math.floor(player.x),Math.floor(player.y+1.4),Math.floor(player.z))===11;this.scene.fog.near=water?.3:this.drawDistance*.42;this.scene.fog.far=water?13:this.drawDistance;this.camera.far=this.drawDistance+30;this.camera.updateProjectionMatrix();
  for(const [key,group]of this.chunks){const [x,z]=key.split(',').map(Number);group.visible=Math.hypot(x*16+8-player.x,z*16+8-player.z)<this.drawDistance+15;}
  this.renderer.render(this.scene,this.camera);
 }
 direction(){return this.camera.getWorldDirection(new THREE.Vector3());}
 setBuildPreview(cell){this.buildPreview.visible=!!cell;if(cell)this.buildPreview.position.set(cell.x+.5,cell.y+.5,cell.z+.5);}
 setTool(tool){
  this.held.visible=!tool;this.heldStick.visible=Boolean(tool);this.weaponModels??=new Map();
  const sword=isWeapon(tool);this.heldStick.children[0].visible=!sword;this.heldStick.children[1].visible=!sword;
  if(sword&&!this.weaponModels.has(tool)){const group=new THREE.Group();const part=(w,h,d,y,color)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color,depthTest:false}));mesh.position.y=y;mesh.renderOrder=12;group.add(mesh);};part(.09,.23,.08,-.23,'#6a4933');part(.3,.07,.1,-.1,WEAPONS[tool].color);part(.11,.48,.045,.18,WEAPONS[tool].color);part(.06,.07,.045,.455,WEAPONS[tool].color);this.heldStick.add(group);this.weaponModels.set(tool,group);}
  for(const [id,model]of this.weaponModels)model.visible=id===tool;
  for(const trail of this.stickTrails)trail.material.color.set(WEAPONS[tool]?.color||'#e1c397');
 }

 renderAnimals(animals,dt,active){this.animalRenderer.update(animals,dt,active);}
 getStickPose(){return {position:this.heldStick.position.toArray(),rotation:[this.heldStick.rotation.x,this.heldStick.rotation.y,this.heldStick.rotation.z],visible:this.heldStick.visible};}
}
