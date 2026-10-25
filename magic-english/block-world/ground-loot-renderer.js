import * as THREE from './vendor/three.module.js';import {LOOT_ITEMS} from './loot.js';
export class GroundLootRenderer{
 constructor(scene){this.scene=scene;this.models=new Map();this.textures=new Map();this.time=0;}
 texture(id){if(this.textures.has(id))return this.textures.get(id);const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d');ctx.font='48px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(LOOT_ITEMS[id].emoji,32,34);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.NearestFilter;this.textures.set(id,texture);return texture;}
 clear(){for(const mesh of this.models.values()){this.scene.remove(mesh);mesh.material.dispose();}this.models.clear();}
 update(drops,dt,active){if(active)this.time+=dt;const ids=new Set(drops.map(d=>d.id));for(const [id,mesh]of this.models)if(!ids.has(id)){this.scene.remove(mesh);mesh.material.dispose();this.models.delete(id);}for(const d of drops){let mesh=this.models.get(d.id);if(!mesh){mesh=new THREE.Sprite(new THREE.SpriteMaterial({map:this.texture(d.itemId),depthWrite:false}));mesh.scale.set(.65,.65,.65);this.models.set(d.id,mesh);this.scene.add(mesh);}mesh.position.set(d.x,d.y+.15+Math.sin(this.time*3+d.x)*.08,d.z);}}
}
