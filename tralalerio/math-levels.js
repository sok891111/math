export const LEVEL_LABELS={1:'기초',2:'중하',3:'중',4:'중상',5:'상'};
export const TYPE_LEVELS={pattern:[5],mirror:[5],logic:[2,3,4,5],sequence:[2,3,4,5],analogy:[5],rotate:[4],bond:[2,3,4],balance:[2,3,4],latin:[2,3,4,5],array_rule:[2,3,4],table_count:[1,2,3],add_single:[2,3],add_tens:[2,3],add_two:[3,4],add_carry_single:[3,4],add_carry_two:[4,5],add_story:[3,4],calc_puzzle:[3,4,5],subtract_single:[1,2,3],subtract_story:[2,3],times_table:[2,3,4],story_compare:[3,4],story_combine:[3,4],story_receive:[3,4],story_three:[4,5],story_chain:[4,5],story_distance:[3,4,5],story_spend_chain:[3,4,5],story_less_chain:[3,4,5],table_story:[3,4,5],growing_picture:[4],number_machine:[4],picture_progression:[4],number_riddle:[4],number_card_count:[4]};
export function levelForType(type,preferred){const levels=(TYPE_LEVELS[type]||[3,4]).filter(n=>n>=3);return levels.reduce((best,n)=>Math.abs(n-preferred)<Math.abs(best-preferred)?n:best,levels[0]);}
export function gymFinisherApplies(b){const t=b?.data.trainers?.[b.s.trainer];return !!(t&&(t.badge||/Gym:/.test(t.id))&&(t.badge||b.s.enemyIndex===b.s.enemyParty.length-1));}
export function planGymAttack(b,index,critical){
 if(!gymFinisherApplies(b))return null;
 const rolls=[],state=structuredClone(b.world);delete state.battle.mathChallenge;
 const preview=new b.constructor(b.data,state,()=>{const n=b.rng();rolls.push(n);return n;});
 preview.action('move',index,{forceCritical:critical,mathFinisherSolved:true});
 const lethal=preview.s.animationEvents.some(e=>e.actor==='player'&&!e.kind&&e.before.enemy.hp>0&&e.after.enemy.hp===0);
 return {rolls,lethal};
}
