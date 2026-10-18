import {learningQuestion} from '/tralalerio/learning-puzzles.js?v=20261018-table19';
import {levelForType} from '/tralalerio/math-levels.js?v=20261018-table19';
export function questionForGate(seed){
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const types=['story_compare','story_combine','story_spend_chain','table_story','subtract_single','times_table','add_carry_single','number_riddle','number_card_count'];
 const type=types[Math.floor(random()*types.length)];return learningQuestion(type,levelForType(type,3),random);
}
