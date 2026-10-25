// Persisted fair rotation: overdue types first, with five percentage points more subtraction.
export const SUBTRACTION_BOOST=.05;
export function subtractionShare(types,subtractionTypes){const count=types.filter(t=>subtractionTypes.includes(t)).length;return !count?0:count===types.length?1:Math.min(1,count/types.length+SUBTRACTION_BOOST);}
export function chooseScheduledType(state,types,subtractionTypes,roll,context='ordinary'){
 if(!types.length)throw Error('No eligible math types');
 if(!state.mathSchedule||state.mathSchedule.version!==1||typeof state.mathSchedule.contexts!=='object'||!state.mathSchedule.contexts||Array.isArray(state.mathSchedule.contexts))state.mathSchedule={version:1,contexts:{}};
 const contexts=state.mathSchedule.contexts;let schedule=contexts[context];
 if(!schedule||!Number.isSafeInteger(schedule.draws)||schedule.draws<0||schedule.draws>1e9||!Number.isSafeInteger(schedule.subtractionDraws)||schedule.subtractionDraws<0||schedule.subtractionDraws>schedule.draws||!Number.isFinite(schedule.credit)||schedule.credit<0||schedule.credit>=1||!schedule.lastSeen||typeof schedule.lastSeen!=='object'||Array.isArray(schedule.lastSeen))schedule=contexts[context]={draws:0,subtractionDraws:0,credit:0,lastSeen:{}};
 const subtract=types.filter(t=>subtractionTypes.includes(t)),other=types.filter(t=>!subtractionTypes.includes(t)),share=subtractionShare(types,subtractionTypes);
 schedule.credit+=share;const isSubtraction=schedule.credit>=1;if(isSubtraction)schedule.credit-=1;
 let pool=isSubtraction?subtract:other;if(!pool.length)pool=types;
 const different=pool.filter(t=>t!==state.lastMathType);if(different.length)pool=different;
 const seen=t=>Number.isSafeInteger(schedule.lastSeen[t])&&schedule.lastSeen[t]>0&&schedule.lastSeen[t]<=schedule.draws?schedule.lastSeen[t]:0;
 const oldest=Math.min(...pool.map(seen)),candidates=pool.filter(t=>seen(t)===oldest),safeRoll=Math.max(0,Math.min(1-Number.EPSILON,Number.isFinite(roll)?roll:0)),chosen=candidates[Math.floor(safeRoll*candidates.length)];
 schedule.draws++;if(subtractionTypes.includes(chosen))schedule.subtractionDraws++;
 schedule.lastSeen=Object.fromEntries(types.filter(t=>seen(t)>0).map(t=>[t,schedule.lastSeen[t]]));schedule.lastSeen[chosen]=schedule.draws;
 return chosen;
}
