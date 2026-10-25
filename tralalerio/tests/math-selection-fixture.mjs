// Content tests target one type deliberately; rotation/probability tests use the real history.
import {SUBTRACTION_TYPES} from '../math-levels.js';
import {subtractionShare} from '../math-schedule.js';
import {isBossMathBattle} from '../math-challenge.js';
export function rollForQuestionType(game,pool,type){
 const subtract=SUBTRACTION_TYPES.includes(type),group=pool.filter(t=>SUBTRACTION_TYPES.includes(t)===subtract),share=subtractionShare(pool,SUBTRACTION_TYPES),context=isBossMathBattle(game)?'boss':'ordinary';
 game.state.mathSchedule={version:1,contexts:{[context]:{draws:0,subtractionDraws:0,credit:subtract?1-share/2:0,lastSeen:{}}}};
 return (group.indexOf(type)+.1)/group.length;
}
