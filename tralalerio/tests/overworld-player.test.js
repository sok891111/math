import {test} from 'node:test';
import assert from 'node:assert/strict';
import {trainerName,personalize,walkingPose,PlayerWalk} from '../overworld-player.js';
test('personal names replace all dialogue placeholders as plain text',()=>{
 assert.equal(trainerName({name:' 연두 '}),'연두');assert.equal(trainerName(null),'모험가');assert.equal(trainerName({name:' '}),'모험가');
 assert.equal(personalize('골드! 이곳은 <PLAYER>의 집.','민수$&<b>'),'민수$&<b>! 이곳은 민수$&<b>의 집.');
});
test('walking alternates both feet while preserving facing and returns to standing',()=>{
 for(const dir of ['up','down','left','right']){
  const first=walkingPose(dir,true,0,.3),second=walkingPose(dir,true,1,.3);
  assert.notDeepEqual(first,second);
  assert.equal(walkingPose(dir,true,1,.9).frame,walkingPose(dir,false).frame);
  if(['left','right'].includes(dir))assert.equal(first.flip,second.flip);
 }
});
test('movement interpolates only successful adjacent steps, alternating feet across taps',()=>{
 const w=new PlayerWalk(),a={map:'room',x:2,y:2},b={map:'room',x:3,y:2},c={map:'room',x:4,y:2};w.begin(a,b,100);
 const half=w.sample(b,165);assert.equal(half.x,2.5);assert.equal(half.walking,true);assert.equal(half.foot,0);
 assert.equal(w.sample(b,230).walking,false);w.begin(b,c,300);assert.equal(w.sample(c,365).foot,1);
 w.begin(c,{map:'town',x:10,y:5},400);assert.equal(w.sample({map:'town',x:10,y:5},400).walking,false);
 w.reset();assert.equal(w.sample(c,500).x,4);
});
test('ledge hops follow a continuous jump arc and land exactly on the logical destination',()=>{
 const w=new PlayerWalk(),before={map:'Route29',x:12,y:6},after={map:'Route29',x:12,y:9};w.begin(before,after,100);
 const lift=w.sample(after,180),mid=w.sample(after,260),land=w.sample(after,420);
 assert.ok(lift.y>6&&lift.y<9);assert.equal(mid.y,7.5);assert.equal(mid.elevation,14);assert.equal(mid.jumping,true);assert.equal(land.y,9);assert.equal(land.jumping,false);assert.ok(land.elevation<.001);
});
