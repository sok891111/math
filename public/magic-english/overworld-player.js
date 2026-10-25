export const MOVEMENT_TIMING=Object.freeze({step:260,holdDelay:450,repeat:300});
export function trainerName(user){return typeof user?.name==='string'&&user.name.trim()?user.name.trim():'모험가'}
export function personalize(text,name){return String(text).replace(/골드|<PLAYER>/g,()=>name)}
const FRAMES={down:0,up:1,left:2,right:2};
// The original sheet contains three standing and three walking poses. Mirror
// vertical walking poses to alternate feet; for side views mirror only the legs
// so the face, cap and backpack continue pointing in the correct direction.
export function walkingPose(direction,walking,foot=0,progress=0){
 const stride=walking&&progress<.78;
 return {frame:FRAMES[direction]+(stride?3:0),flip:direction==='right'||(stride&&foot%2===1&&['up','down'].includes(direction)),mirrorLegs:stride&&foot%2===1&&['left','right'].includes(direction)};
}
export class PlayerWalk {
 constructor(duration=MOVEMENT_TIMING.step){this.duration=duration;this.reset()}
 reset(){this.step=null;this.foot=0}
 begin(before,after,now){
  const distance=Math.abs(before.x-after.x)+Math.abs(before.y-after.y);
  if(before.map!==after.map||distance<1||distance>3||(before.x!==after.x&&before.y!==after.y)){this.reset();return}
  // Preserve continuity if a rapid tap arrives before the previous step ends.
  const start=this.sample(before,now);this.step={map:after.map,x:start.x,y:start.y,toX:after.x,toY:after.y,started:now,foot:this.foot++,jump:distance>1,duration:distance>1?320:this.duration};
 }
 sample(state,now){
  const s=this.step;if(!s||s.map!==state.map||s.toX!==state.x||s.toY!==state.y)return {x:state.x,y:state.y,walking:false,foot:0,progress:1,jumping:false,elevation:0};
  const progress=Math.max(0,Math.min(1,(now-s.started)/s.duration));
  return {x:s.x+(s.toX-s.x)*progress,y:s.y+(s.toY-s.y)*progress,walking:progress<1,foot:s.foot,progress,jumping:s.jump&&progress<1,elevation:s.jump?Math.sin(progress*Math.PI)*14:0};
 }
}
