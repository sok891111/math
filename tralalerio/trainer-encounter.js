// Gold SeenByTrainerScript: shock (30 frames), walk to adjacent tile, face player, dialogue.
export function trainerEncounterPlan(game,o){
 if(!o?.trainer||!game.battleData?.trainers[o.trainer]||game.state.battle||game.state.flags['trainer:'+o.trainer])return null;
 const vectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]},direction=vectors[o.direction]?o.direction:'down',d=vectors[direction];
 const s=game.state,distance=(s.x-o.x)*d[0]+(s.y-o.y)*d[1];
 if(distance<1||distance>o.range||o.x+d[0]*distance!==s.x||o.y+d[1]*distance!==s.y)return null;
 for(let n=1;n<distance;n++)if(!game.passable(o.x+d[0]*n,o.y+d[1]*n))return null;
 return {version:1,map:s.map,id:o.trainer,direction,from:{x:o.x,y:o.y},to:{x:s.x-d[0],y:s.y-d[1]},player:{x:s.x,y:s.y}};
}
export function rivalEncounterPlan(game){
 const s=game.state;if(s.map==='AzaleaTown'){if(s.x!==5||![10,11].includes(s.y)||!s.flags.slowpokeWell||s.flags.azaleaRival||s.flags['trainer:AzaleaRival']||s.battle)return null;const y=s.y===10?11:10;return {version:1,kind:'rival',map:s.map,id:'AzaleaRival',direction:'left',from:{x:11,y},to:{x:5,y},player:{x:s.x,y:s.y}};}if(s.map!=='CherrygroveCity'||s.x!==33||![6,7].includes(s.y)||!s.flags.mysteryEgg||s.flags.rivalDone||s.flags['trainer:CherrygroveRival']||s.battle||!game.battleData?.trainers.CherrygroveRival)return null;
 return {version:1,kind:'rival',map:s.map,id:'CherrygroveRival',direction:'left',from:{x:39,y:s.y},to:{x:34,y:s.y},player:{x:s.x,y:s.y}};
}
export function validTrainerEncounter(game,c){
 if(c===undefined)return true;if(!c||c.version!==1||c.map!==game.state.map||!game.state.party?.some(p=>p.hp>0)||game.state.healing)return false;
 if(c.kind!==undefined&&c.kind!=='rival')return false;const o=game.objects().find(o=>o.trainer===c.id),expected=c.kind==='rival'?rivalEncounterPlan(game):trainerEncounterPlan(game,o);
 return !!expected&&['map','id','direction'].every(k=>c[k]===expected[k])&&['from','to','player'].every(k=>c[k]&&c[k].x===expected[k].x&&c[k].y===expected[k].y);
}
export function createTrainerEncounter(container){
 let running=false,view=null;
 const icon=new Image();icon.src='/tralalerio/assets/trainer-shock.png?v=20261018-test17';icon.decode().catch(()=>{});
 const emit=phase=>{container.dataset.trainerEncounter=phase;container.dispatchEvent(new CustomEvent('trainer-encounter-phase',{bubbles:true,detail:{phase,id:view.id}}))};
 async function play(marker){
  if(running)return;running=true;view={...marker,phase:'shock',started:performance.now()};
  try{emit('shock');await new Promise(r=>setTimeout(r,marker.kind==='rival'?250:500));if(marker.kind==='rival'){view.phase='pause';emit('pause');await new Promise(r=>setTimeout(r,250));}view.phase='approach';view.started=performance.now();view.duration=Math.max(1,Math.abs(marker.to.x-marker.from.x)+Math.abs(marker.to.y-marker.from.y))*(matchMedia('(prefers-reduced-motion: reduce)').matches?90:marker.kind==='rival'?120:180);emit('approach');await new Promise(r=>setTimeout(r,view.duration));view.phase='ready';emit('ready');}finally{running=false;}
 }
 function actor(o,marker,now){if(!marker||o.trainer!==marker.id)return o;const v=view?.id===marker.id?view:null;const p=['shock','pause'].includes(v?.phase)?0:v?.phase==='approach'?Math.min(1,(now-v.started)/v.duration):1;const steps=Math.abs(marker.to.x-marker.from.x)+Math.abs(marker.to.y-marker.from.y);return {...o,hidden:marker.kind==='rival'&&['shock','pause'].includes(v?.phase),x:marker.from.x+(marker.to.x-marker.from.x)*p,y:marker.from.y+(marker.to.y-marker.from.y)*p,dir:marker.id==='AzaleaRival'&&p>=1?(marker.player.y<marker.to.y?'up':'down'):marker.direction,trainerWalking:p>0&&p<1,trainerFoot:Math.floor(p*steps),trainerProgress:p*steps%1};}
 function draw(ctx,ox,oy,marker,now){if(!marker||view?.phase!=='shock')return;const anchor=marker.kind==='rival'?marker.player:marker.from;const x=Math.round(ox+anchor.x*16),y=Math.round(oy+anchor.y*16-20);if(icon.complete&&icon.naturalWidth)ctx.drawImage(icon,x,y,16,16);else{ctx.fillStyle='#fffdf0';ctx.fillRect(x+3,y+1,10,13);ctx.fillStyle='#293c32';ctx.fillRect(x+7,y+3,2,6);ctx.fillRect(x+7,y+10,2,2)}}
 return {play,actor,draw,active:()=>running,clear(){view=null;delete container.dataset.trainerEncounter;}};
}
