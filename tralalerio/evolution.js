import {statsFor} from './battle.js?v=20261025-reasoning5';
import {recordCaught} from './monster-dex.js?v=20261018-gaddoongi30';
// Only Gold's ordinary level evolution is enabled in this game.
export function evolutionFor(data,p){
 return data.species[p.species]?.evolutions?.find(e=>e.method==='level'&&data.species[e.species]&&p.level>=e.level)||null;
}
export function queueEvolution(game,index){
 const s=game.state,p=s.party[index];if(!p||s.evolution||s.battle&&!s.battle.result)return false;
 const rule=evolutionFor(game.battleData,p);if(!rule)return false;
 s.evolution={version:1,index,from:p.species,to:rule.species,trigger:'level',phase:'intro',learn:[],cancelled:false};return true;
}
export function queueBattleEvolutions(game){
 const b=game.state.battle;if(!b||b.result==='lost')return false;
 for(const index of [...(b.evolvable||[])].sort((a,b)=>a-b))if(!b.evolutionDone?.includes(index)&&queueEvolution(game,index))return true;
 return false;
}
export function commitEvolution(game){
 const s=game.state,m=s.evolution,p=s.party[m?.index];if(!m||!p||m.phase!=='intro'||p.species!==m.from)return false;
 const rule=evolutionFor(game.battleData,p);
 if(!rule||rule.species!==m.to)return false;

 const oldMax=p.stats.hp;p.species=m.to;p.stats=statsFor(game.battleData.species[m.to],p.level,p.dvs,p.effort);p.hp=Math.max(0,Math.min(p.stats.hp,p.hp+p.stats.hp-oldMax));
 recordCaught(s,m.to);m.phase='done';
 for(const learn of game.battleData.species[m.to].learnset.filter(l=>l.level===p.level)){
  if(p.moves.some(x=>x.id===learn.move)||m.learn.includes(learn.move))continue;
  if(p.moves.length<4)p.moves.push({id:learn.move,pp:game.battleData.moves[learn.move].pp});else m.learn.push(learn.move);
 }
 return true;
}
export function cancelEvolution(game){const m=game.state.evolution;if(!m||m.phase!=='intro'||m.trigger!=='level')return false;m.cancelled=true;m.phase='done';return true;}
export function learnEvolutionMove(game,slot){const m=game.state.evolution,p=game.state.party[m?.index];if(!m||m.phase!=='done'||!m.learn.length||!Number.isInteger(slot)||slot< -1||slot>=p.moves.length)return false;const id=m.learn.shift();if(slot>=0){p.moves[slot]={id,pp:game.battleData.moves[id].pp};}return true;}
export function finishEvolution(game){const s=game.state,m=s.evolution;if(!m||m.phase!=='done'||m.learn.length)return false;if(s.battle){s.battle.evolutionDone??=[];s.battle.evolutionDone.push(m.index);}delete s.evolution;return true;}
export function validEvolution(s,data){const m=s.evolution;if(m===undefined)return true;const p=s.party?.[m.index],rule=data.species[m.from]?.evolutions?.find(e=>e.species===m.to);return !!(m.version===1&&Number.isInteger(m.index)&&p&&rule&&rule.method==='level'&&['intro','done'].includes(m.phase)&&m.trigger==='level'&&typeof m.cancelled==='boolean'&&(m.trigger==='level'||!m.cancelled)&&p.species===(m.phase==='intro'||m.cancelled?m.from:m.to)&&Array.isArray(m.learn)&&m.learn.length<=10&&m.learn.every(id=>data.moves[id])&&(!s.battle||!!s.battle.result));}
