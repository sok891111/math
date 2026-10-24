import {createPokemon} from './battle.js';
import {initializePC, boxCount} from './pc.js';
import {recordCaught} from './monster-dex.js';

// Receipts live in the same serialized state as the monsters: reloads cannot double-deliver.
export function applyAdminGrants(game, grants) {
 const s=game.state;
 if(s.battle||s.evolution||s.healing||s.phoneCall||s.trainerEncounter)return 0;
 initializePC(s);
 s.adminGrantReceipts??=[];
 let count=0;
 for(const grant of grants){
  if(!grant||typeof grant.id!=='string'||s.adminGrantReceipts.includes(grant.id)||!Object.hasOwn(game.battleData.species,grant.species)||!Number.isInteger(grant.level)||grant.level<1||grant.level>100||!Number.isInteger(grant.quantity)||grant.quantity<1||grant.quantity>30)continue;
  const capacity=Array.from({length:14},(_,i)=>Math.max(0,20-boxCount(s,i))).reduce((a,b)=>a+b,0);
  if(capacity<grant.quantity)continue;
  for(let i=0;i<grant.quantity;i++){
   const monster=createPokemon(game.battleData,grant.species,grant.level,game.rng);
   const box=Array.from({length:14},(_,b)=>b).find(b=>boxCount(s,b)<20);
   s.storage.push(monster);s.pc.assignments.push(box);
   recordCaught(s,grant.species);count++;
  }
  s.adminGrantReceipts.push(grant.id);
 }
 return count;
}
