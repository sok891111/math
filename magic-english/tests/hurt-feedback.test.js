import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {hurtPose,hurtPush,HURT_DURATION} from '../block-world/hurt-feedback.js';import {VoxelWorld,movePlayer,collides} from '../block-world/world.js';
test('hurt camera motion starts and settles without changing the saved player view',()=>{
 assert.deepEqual(hurtPose(0),{x:0,y:0,roll:0});const pose=hurtPose(.07);assert(Math.abs(pose.roll)>0);assert(pose.y<0);for(let t=0;t<HURT_DURATION;t+=.01){const p=hurtPose(t,1.25);assert(Math.abs(p.roll)<.06);assert(Math.abs(p.x)<.05);}assert.deepEqual(hurtPose(HURT_DURATION),{x:0,y:0,roll:0});assert.deepEqual(hurtPose(.1,1,true),{x:0,y:0,roll:0});
});
test('attack pushes away from the monster and respects solid walls',()=>{
 const world=new VoxelWorld('hurt-wall').generate(),p={...world.spawn,yaw:.4,pitch:-.1};const push=hurtPush(p,{type:'player-hit',x:p.x-1,z:p.z});assert.equal(push.x,.25);assert.equal(push.z,0);assert.equal(hurtPush(p,{type:'creeper-puff',x:p.x-1,z:p.z}).x,.45);
 world.set(Math.floor(p.x)+1,Math.floor(p.y),Math.floor(p.z),3);world.set(Math.floor(p.x)+1,Math.floor(p.y)+1,Math.floor(p.z),3);movePlayer(world,p,push);assert(!collides(world,p));assert.equal(p.yaw,.4);assert.equal(p.pitch,-.1);
});
test('real damage triggers flash, hurt sound, camera motion and blinking hearts, not timer use',()=>{
 const source=fs.readFileSync(new URL('../block-world/app.js',import.meta.url),'utf8');assert(source.includes('stock=spendHearts(stock,event.damage);showHurt(event)'));assert(source.includes('view.hurt(event.damage)'));assert(source.includes("sound('hurt')"));assert(source.includes("hearts.classList.add('hurt')"));assert(source.includes("overlay.classList.add('hit')"));assert.equal(source.match(/if\(kind==='hurt'\)/g).length,1);
});
