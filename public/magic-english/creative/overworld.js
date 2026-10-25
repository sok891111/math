(function(root){
 'use strict';
 const regions={forest:{town:'새싹마을',ground:'#a6bb79',grass:'#648f55',road:'#d9c695',roof:'#719b50',wall:'#efe0b0',water:'#79b9b2',accent:'#c4e5a4'},cave:{town:'수정마을',ground:'#7b9998',grass:'#507c83',road:'#b6c4b4',roof:'#577e91',wall:'#dbe5dc',water:'#496d88',accent:'#b7ecf1'},ruins:{town:'햇살마을',ground:'#c7b477',grass:'#909460',road:'#e5d49c',roof:'#af7355',wall:'#f1deb0',water:'#9eb6a0',accent:'#ffe09a'},end:{town:'별빛마을',ground:'#9592af',grass:'#686480',road:'#c4b9d6',roof:'#736185',wall:'#d9cbe4',water:'#514967',accent:'#dec1f7'}};
 function makeMap(region){const width=96,height=24,tiles=Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>x===0||y===0||x===width-1||y===height-1?'#':'.'));
  for(let y=2;y<16;y++)for(let x=12;x<23;x++)tiles[y][x]='G';
  for(let y=1;y<17;y++){tiles[y][9]='R';tiles[y][10]='R';}for(let x=1;x<23;x++){tiles[12][x]='R';tiles[13][x]='R';}
  const layouts={forest:[[2,3,4,3],[2,8,4,3],[7,3,3,3]],cave:[[2,2,3,4],[6,7,3,3],[13,2,3,3]],ruins:[[2,2,4,3],[7,7,3,3],[15,4,3,3]],end:[[2,4,3,4],[7,2,3,4],[17,14,4,2]]};const buildings=(layouts[region]||layouts.forest).map(([x,y,w,h],i)=>({x,y,w,h,label:['도감 연구소','친구의 집','큐브볼 상점'][i]}));
  for(const b of buildings)for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)tiles[y][x]='#';
  for(let y=2;y<9;y++)tiles[y][19]='W';tiles[5][19]='R';tiles[6][19]='R';
  for(const [x,y]of [[14,3],[16,8],[21,10],[13,15],[7,16]])tiles[y][x]='#';
  // An east-west expedition: fields, river crossing, camps and a distant landmark.
  for(let x=23;x<width-1;x++){tiles[12][x]='R';tiles[13][x]='R';for(let y=3;y<height-2;y++)if(x%22<17&&y!==12&&y!==13&&(x+y*3)%13>2)tiles[y][x]='G';}
  for(const x of [30,52,74,89])for(let y=3;y<height-2;y++)tiles[y][x]='R';
  for(let y=1;y<height-1;y++)for(const x of [39,40])tiles[y][x]=y===12||y===13?'R':'W';
  const landmarkNames={forest:['나무꾼 쉼터','오래된 숲 제단','거대한 나무','숲 끝 전망대'],cave:['수정 채굴장','푸른 수정 신전','지하 호수 쉼터','빛의 동굴'],ruins:['모래빛 야영지','고대 문양 유적','돌기둥 광장','태양의 신전'],end:['별빛 관측소','엔더 중계탑','보랏빛 정원','차원의 문']};
  const landmarks=[28,49,70,88].map((x,i)=>({x,y:i%2?7:16,name:landmarkNames[region][i],kind:i}));
  for(const mark of landmarks){for(let y=mark.y-1;y<=mark.y+2;y++)for(let x=mark.x-1;x<=mark.x+3;x++)if(tiles[y]?.[x]!==undefined)tiles[y][x]='.';for(let y=Math.min(mark.y,12);y<=Math.max(mark.y,12);y++)tiles[y][mark.x]='R';}
  buildings.push({x:27,y:17,w:3,h:2,label:landmarkNames[region][0]},{x:69,y:17,w:3,h:2,label:landmarkNames[region][2]});for(const b of buildings)for(let y=b.y;y<b.y+b.h;y++)for(let x=b.x;x<b.x+b.w;x++)tiles[y][x]='#';
  return {region,width,height,tiles,buildings,landmarks,spawn:{x:4,y:12},npc:{x:7,y:11},theme:regions[region]||regions.forest};
 }
 function walkable(map,x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<map.width&&y>=0&&y<map.height&&!['#','W','H'].includes(map.tiles[y][x]);}
 function rollEncounter(random=Math.random){const n=random();return n<.55?1:n<.85?2:3;}
 function step(state,dx,dy,random=Math.random){if(Math.abs(dx)+Math.abs(dy)!==1)return {moved:false};const {map}=state,x=state.x+dx,y=state.y+dy;if(!walkable(map,x,y))return {moved:false};state.x=x;state.y=y;state.grace=Math.max(0,(state.grace||0)-1);state.steps=(state.steps||0)+1;const wild=map.tiles[y][x]==='G';if(!wild){state.wildSteps=0;return {moved:true,wild:false};}state.wildSteps=(state.wildSteps||0)+1;const encounter=state.grace===0&&(random()<.17||state.wildSteps>=14);return {moved:true,wild,encounter,grade:encounter?rollEncounter(random):null};}
 function pathfind(map,start,goal){if(!walkable(map,goal.x,goal.y))return [];const queue=[start],seen=new Set([start.x+','+start.y]),parent=new Map();for(let i=0;i<queue.length;i++){const p=queue[i];if(p.x===goal.x&&p.y===goal.y){const out=[];let cur=p;while(cur.x!==start.x||cur.y!==start.y){out.unshift(cur);cur=parent.get(cur.x+','+cur.y);}return out;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const next={x:p.x+dx,y:p.y+dy},id=next.x+','+next.y;if(walkable(map,next.x,next.y)&&!seen.has(id)){seen.add(id);parent.set(id,p);queue.push(next);}}}return [];}
 function motionPosition(motion,now){if(!motion)return null;const progress=Math.max(0,Math.min(1,(now-motion.start)/motion.duration));return {x:motion.fromX+(motion.toX-motion.fromX)*progress,y:motion.fromY+(motion.toY-motion.fromY)*progress,progress,done:progress===1};}
 const houseCost=10,houseWidth=3,houseHeight=2;
 function harvestWood(map,x,y,random=Math.random){return map.region==='forest'&&walkable(map,x,y)&&random()<.25?1:0;}
 function canBuildHouse(map,x,y,player=null){if(map.region!=='forest'||!Number.isInteger(x)||!Number.isInteger(y)||x<1||y<1||x+houseWidth>=map.width||y+houseHeight>=map.height)return false;
  for(let yy=y;yy<y+houseHeight;yy++)for(let xx=x;xx<x+houseWidth;xx++){if(!['.','G'].includes(map.tiles[yy][xx]))return false;if(player&&player.x===xx&&player.y===yy)return false;if(map.spawn.x===xx&&map.spawn.y===yy||map.npc.x===xx&&map.npc.y===yy)return false;}
  if(map.landmarks.some(m=>Math.abs(m.x-(x+1))<4&&Math.abs(m.y-y)<4))return false;
  return walkable(map,x+1,y+houseHeight);
 }
 function placeHouse(map,x,y,player=null){if(!canBuildHouse(map,x,y,player))return false;const house={region:map.region,x,y,w:houseWidth,h:houseHeight,label:'나의 나무집',built:true};map.buildings.push(house);for(let yy=y;yy<y+houseHeight;yy++)for(let xx=x;xx<x+houseWidth;xx++)map.tiles[yy][xx]='H';return house;}
 function restoreHouses(map,houses=[]){for(const h of houses)if(h&&h.region===map.region)placeHouse(map,h.x,h.y);return map;}
 const api={regions,makeMap,walkable,rollEncounter,step,pathfind,motionPosition,houseCost,houseWidth,houseHeight,harvestWood,canBuildHouse,placeHouse,restoreHouses};if(typeof module==='object'&&module.exports)module.exports=api;else root.CreativeWorld=api;
})(typeof window==='undefined'?globalThis:window);
