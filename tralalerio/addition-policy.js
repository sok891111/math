import {EARLY_ARITHMETIC_LABELS} from './early-arithmetic-puzzles.js?v=20261025-reasoning5';
export const ADDITION_MAX=99,ADDITION_VERSION=2;
export function additionType(type){return type.startsWith('add_')||['calc_puzzle','table_count','story_compare','story_combine','story_receive','story_three','story_chain','story_distance','number_machine'].includes(type)||Object.hasOwn(EARLY_ARITHMETIC_LABELS,type);}
export function additionChecks(q){
 if(q.additionChecks)return q.additionChecks;
 if(q.storyModel){let total=0;return q.storyModel.terms.map(term=>{const before=total;total+=term;return {terms:[before,term],total};});}
 if(q.operator==='+'&&q.operands){const [a,b]=q.operands;if(q.variant==='rule')return [{terms:[a,b],total:a+b},{terms:[a+b,b],total:a+2*b}];return [{terms:[a,b],total:a+b}];}
 if(q.type==='table_count'){const parts=q.tableAxis===0?q.table[q.tableIndex]:q.table.map(row=>row[q.tableIndex]);return [{terms:parts,total:parts.reduce((a,b)=>a+b,0)}];}
 return [];
}
export function additionWithinLimit(q){if(!additionType(q.type))return true;return q.answer.every(n=>n>=0&&n<=ADDITION_MAX)&&additionChecks(q).every(({terms,total})=>terms.every(n=>n>=0&&n<=ADDITION_MAX)&&total>=0&&total<=ADDITION_MAX&&terms.reduce((a,b)=>a+b,0)===total)&&(!q.equation||!(q.equation.match(/\d+/g)||[]).some(n=>Number(n)>ADDITION_MAX));}
