// Seen and caught are separate, permanent species records, independent of party slots.
function record(state,id,caught){
 state.monsterDex??={version:1,seen:[],caught:[]};
 if(!state.monsterDex.seen.includes(id))state.monsterDex.seen.push(id);
 const fresh=caught&&!state.monsterDex.caught.includes(id);
 if(fresh)state.monsterDex.caught.push(id);
 return fresh;
}
export const recordSeen=(state,id)=>record(state,id,false);
export const recordCaught=(state,id)=>record(state,id,true);
export function validMonsterDex(dex,data){
 if(dex===undefined)return true;
 return !!(dex&&dex.version===1&&['seen','caught'].every(key=>Array.isArray(dex[key])&&dex[key].length<=Object.keys(data.species).length&&new Set(dex[key]).size===dex[key].length&&dex[key].every(id=>typeof id==='string'&&!!data.species[id]))&&dex.caught.every(id=>dex.seen.includes(id)));
}
export function initializeMonsterDex(state,data){
 const legacy=!state.monsterDex;state.monsterDex??={version:1,seen:[],caught:[]};
 for(const p of [...(state.party||[]),...(state.storage||[])])recordCaught(state,p.species);
 const b=state.battle;if(b){recordSeen(state,b.enemy.species);for(const p of b.enemyParty?.slice(0,b.enemyIndex+1)||[])recordSeen(state,p.species);if(b.result==='caught')recordCaught(state,b.enemy.species);}
 if(legacy){for(const t of Object.values(data.trainers||{}))if(state.flags['trainer:'+t.id])for(const p of t.party)recordSeen(state,p.species);if(state.flags.onixTrade){recordCaught(state,'bellsprout');recordCaught(state,'onix');}}
}
export function dexHabitats(id,data,maps){
 return Object.entries(data.encounters).flatMap(([map,table])=>{const periods=['morning','day','night'].filter(time=>table[time].some(p=>p.species===id));return periods.length?[{map,name:maps[map]?.name||map,periods,levels:[...new Set(periods.flatMap(time=>table[time].filter(p=>p.species===id).map(p=>p.level)))].sort((a,b)=>a-b)}]:[];});
}

export function validDexIntro(marker,state,data){
 if(marker===undefined)return true;
 return !!(marker&&marker.version===1&&data.species[marker.species]&&state.monsterDex?.caught.includes(marker.species)&&Number.isInteger(marker.level)&&marker.level>=1&&marker.level<=100&&['hp','attack','defense','specialAttack','specialDefense','speed'].every(k=>Number.isInteger(marker.stats?.[k])&&marker.stats[k]>0&&marker.stats[k]<10000));
}
