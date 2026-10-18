import {TYPE_LEVELS,SUBTRACTION_TYPES,levelForType,planGymAttack} from './math-levels.js?v=20261018-subtract27';
import {rotationQuestion} from './rotation-puzzles.js?v=20261018-table19';
import {canStoreCapture} from './pc.js?v=20261018-table19';
import {advancedAnalogy} from './analogy-puzzles.js?v=20261018-table19';
import {LEARNING_TYPES,LEARNING_LABELS,learningQuestion,validateLearning} from './learning-puzzles.js?v=20261018-subtract27';
export const MATH_TYPES=['pattern','mirror','logic','sequence','analogy','rotate','bond','balance','latin',...LEARNING_TYPES.filter(type=>type!=='shape_complete')].filter(type=>!['bond','add_single','add_tens'].includes(type));
export const MATH_LABELS={pattern:'반복 규칙',mirror:'거울 대칭',path:'길 찾기',logic:'논리 배치',sequence:'수의 규칙',classify:'분류',analogy:'변환 규칙',rotate:'도형 회전',tower:'블록 세기',bond:'수 모으기',balance:'무게 비교',latin:'숫자 격자',...LEARNING_LABELS};
export const DIFFICULTY_VERSION=7;
export function mathGrade(map,level=1,species=null,data=null){return data?.challengePolicy?.rareSpecies.includes(species)?5:3;}
export function challengeGrade(game,seed){const b=game.battle;if(game.battleData.trainers?.[b.s.trainer]?.badge)return 4;const minimum=mathGrade(game.state.map,b.enemy.level,b.enemy.species,game.battleData);return minimum===5?5:seed>=3435973836?4:3;}
function selection(game,rng){const typeRoll=rng(),seed=Math.floor(rng()*4294967296)>>>0,preferred=challengeGrade(game,seed),strict=preferred===5||!!game.battleData.trainers?.[game.battle.s.trainer]?.badge;let pool=MATH_TYPES.filter(t=>t!==game.state.lastMathType&&(!strict||TYPE_LEVELS[t].includes(preferred)));const type=pool[Math.floor(typeRoll*pool.length)];return {type,seed,grade:levelForType(type,preferred)};}
export function seededRandom(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
export function questionFor(challenge,model,facto){const r=seededRandom(challenge.seed);return challenge.type==='rotate'?rotationQuestion(challenge.grade,r,facto):challenge.type==='analogy'?advancedAnalogy(challenge.grade,r):LEARNING_TYPES.includes(challenge.type)||['place_value','shape_match','shape_complete'].includes(challenge.type)?learningQuestion(challenge.type,challenge.grade,r):facto.types.includes(challenge.type)?gradedFacto(challenge.type,challenge.grade,r,facto):model.puzzle(challenge.type,challenge.grade,r)}
export function validateQuestion(q,input,model,facto){
 if(!Array.isArray(input)||input.some(n=>!Number.isInteger(n)))return {ok:false,reason:'빈칸을 모두 채워 주세요.'};
 if(q.type==='rotate'){const chosen=q.options?.[input[0]],expected=facto.rotate(q.source,q.turns);return {ok:input.length===1&&!!chosen&&chosen.every((n,i)=>n===expected[i]),reason:q.hint};}
 if(q.type==='latin'){const grid=q.grid.slice();q.holes.forEach((h,i)=>grid[h]=input[i]);const line=values=>values.length===q.n&&new Set(values).size===q.n&&values.every(n=>n>=1&&n<=q.n);return {ok:input.length===q.holes.length&&Array.from({length:q.n},(_,r)=>line(grid.slice(r*q.n,(r+1)*q.n))).every(Boolean)&&Array.from({length:q.n},(_,c)=>line(Array.from({length:q.n},(_,r)=>grid[r*q.n+c]))).every(Boolean),reason:q.hint};}
 return q.learning?validateLearning(q,input):(facto.types.includes(q.type)?facto:model).validate(q,input);
}
export function emptyInput(q){return q.given?q.given.slice():q.subset?[]:q.type==='path'?[q.start]:q.answer.map(()=>q.paint||q.type==='mirror'?0:null)}
export function requestCapture(game,model,facto,rng=Math.random){
 const b=game.battle,p=b?.player;if(!b||b.s.result||b.s.trainer||b.s.waitingSwitch||b.s.animationPending||game.state.balls<1)return null;
 if(!canStoreCapture(game.state)){b.s.logs=['현재 박스가 가득 찼다! PC에서 다른 박스로 바꾸어 주세요.'];b.s.animationEvents=[];return null;}
 if(b.s.mathChallenge)return b.s.mathChallenge.kind==='capture'?b.s.mathChallenge:null;
 const {type,seed,grade}=selection(game,rng);
 const c={version:1,kind:'capture',type,seed,grade,difficultyVersion:DIFFICULTY_VERSION,targetSpecies:b.enemy.species,playerSpecies:p.species,input:[],attempts:0,hints:0};
 if(c.type==='analogy'){c.grade=Math.max(2,c.grade);c.analogyVersion=2;}if(c.type==='rotate')c.rotationVersion=2;c.input=emptyInput(questionFor(c,model,facto));b.s.mathChallenge=c;return c;
}
export function requestMath(game,index,model,facto,rng=Math.random){
 const b=game.battle,p=b?.player;if(b?.s.mathChallenge?.kind==='capture')return null;if(!b||b.s.result||b.s.waitingSwitch||b.s.animationPending||!p.moves[index]||p.moves[index].pp===0&&p.moves.some(m=>m.pp>0))return null;
 let c=b.s.mathChallenge;
 if(!c){
  const move=game.battleData.moves[b.s.playerFields.charge||(p.moves.every(m=>m.pp===0)?'STRUGGLE':p.moves[index].id)],ordinary=move.power>0&&rng()<.5,plan=move.power>0?planGymAttack(b,index,ordinary):null;
  if(!ordinary&&!plan?.lethal){b.action('move',index,{plannedRolls:plan?.rolls});return null;}
  const {type,seed,grade}=selection(game,rng);c={version:1,type,seed,grade,difficultyVersion:DIFFICULTY_VERSION,moveIndex:index,moveId:p.moves[index].id,playerSpecies:p.species,input:[],attempts:0,hints:0};
  if(plan){c.plannedRolls=plan.rolls;c.gymFinisher=plan.lethal;}
  if(c.type==='analogy')c.analogyVersion=2;if(c.type==='rotate')c.rotationVersion=2;c.input=emptyInput(questionFor(c,model,facto));b.s.mathChallenge=c;
 }

 c.moveIndex=index;c.moveId=p.moves[index].id;c.playerSpecies=p.species;return c;
}
export function submitMath(game,model,facto){
 const b=game.battle,c=b?.s.mathChallenge;if(!c||!validMathChallenge(c,game.state,game.battleData))return {ok:false,reason:'기술을 다시 골라 주세요.'};
 const q=questionFor(c,model,facto),result=validateQuestion(q,c.input,model,facto);c.attempts++;
 if(!result.ok)return skipMath(game);
 const index=c.moveIndex;delete b.s.mathChallenge;game.state.lastMathType=c.type;
 if(c.kind==='capture')return {ok:true,resolved:b.action('ball',0,{captureAnswer:true})};
 return b.action('move',index,{forceCritical:true,mathRewardSeed:c.seed,mathFinisherSolved:true,plannedRolls:c.plannedRolls})?{ok:true,resolved:true}:{ok:false,reason:'지금은 공격할 수 없어요. 기술을 다시 골라 주세요.'};
}
export function validMathChallenge(c,state,data){
 if(c===undefined)return true;const b=state.battle,p=state.party[b?.playerIndex];
 const selection=c?.kind==='capture'?!b?.trainer&&state.balls>0&&c.targetSpecies===b?.enemy.species&&c.moveIndex===undefined&&c.moveId===undefined:c?.kind===undefined&&Number.isInteger(c.moveIndex)&&p?.moves[c.moveIndex]?.id===c.moveId;
 return !!(c&&c.version===1&&(MATH_TYPES.includes(c.type)||c.type==='place_value'||c.type==='classify'||c.type==='shape_match'||['path','tower','shape_complete','bond','add_single','add_tens'].includes(c.type))&&Number.isInteger(c.seed)&&c.seed>=0&&c.seed<=4294967295&&Number.isInteger(c.grade)&&c.grade>=(c.difficultyVersion===DIFFICULTY_VERSION&&!SUBTRACTION_TYPES.includes(c.type)?3:1)&&c.grade<=5&&[undefined,2,3,4,5,6,DIFFICULTY_VERSION].includes(c.difficultyVersion)&&(c.plannedRolls===undefined||Array.isArray(c.plannedRolls)&&c.plannedRolls.length<=256&&c.plannedRolls.every(n=>typeof n==='number'&&n>=0&&n<1))&&(c.gymFinisher===undefined||typeof c.gymFinisher==='boolean')&&selection&&c.playerSpecies===p.species&&!b.result&&!b.waitingSwitch&&!b.animationPending&&Array.isArray(c.input)&&c.input.length<=36&&c.input.every(v=>v===null||Number.isInteger(v)&&v>=0&&v<=100)&&Number.isInteger(c.attempts)&&c.attempts>=0&&Number.isInteger(c.hints)&&c.hints>=0&&c.hints<=3);
}

export function skipMath(game){const b=game.battle,c=b?.s.mathChallenge;if(!c)return {ok:false,resolved:false};delete b.s.mathChallenge;game.state.lastMathType=c.type;return {ok:false,resolved:c.kind==='capture'?b.action('ball',0,{captureAnswer:false}):b.action('math-pass',0,{gymDodge:c.gymFinisher===true})};}

// Keep valid old saves, but replace retired/easy pending questions before displaying them.
export function upgradeChallenge(game,model,facto){
 const c=game.battle?.s.mathChallenge;if(!c)return false;
 const removed=['path','tower','shape_complete','bond','add_single','add_tens'].includes(c.type),oldRotation=c.type==='rotate'&&c.rotationVersion!==2;
 const retiredShape=c.type==='shape_match',retired=c.type==='place_value',retiredClassify=c.type==='classify',analogy=retiredClassify||c.type==='analogy'&&(c.analogyVersion!==2||c.grade<2);
 const boss=!!game.battleData.trainers?.[game.battle.s.trainer]?.badge,rare=game.battleData.challengePolicy?.rareSpecies.includes(game.battle.enemy.species),minimum=boss?4:rare?5:levelForType(c.type,3),harder=c.difficultyVersion!==DIFFICULTY_VERSION||(c.type==='table_count'&&c.grade!==3||SUBTRACTION_TYPES.includes(c.type)&&c.grade!==1),version=c.difficultyVersion!==DIFFICULTY_VERSION;
 if(!removed&&!oldRotation&&!retired&&!analogy&&!retiredShape&&!harder&&!version)return false;
 c.difficultyVersion=DIFFICULTY_VERSION;
 if(!removed&&!oldRotation&&!retired&&!analogy&&!retiredShape&&!harder)return true;
 c.grade=levelForType(c.type,minimum);
 if(retired)c.type='add_carry_single';
 if(retiredShape||c.type==='shape_complete')c.type='array_rule';
 if(c.type==='path')c.type='logic';
 if(c.type==='tower'||c.type==='bond')c.type='balance';
 if(c.type==='add_single')c.type='add_carry_single';
 if(c.type==='add_tens')c.type='add_two';
 if(analogy){c.type='analogy';c.grade=Math.max(2,c.grade);c.analogyVersion=2;}
 if((boss||rare)&&!TYPE_LEVELS[c.type]?.includes(minimum))c.type='logic';c.grade=levelForType(c.type,minimum);
 if(c.type==='rotate')c.rotationVersion=2;c.input=emptyInput(questionFor(c,model,facto));c.hints=0;c.attempts=0;return true;
}

function gradedFacto(type,grade,r,facto){
 const q=facto.generate(type,grade<=2?1:grade===3?2:3,r);q.grade=grade;
 if(type==='balance')q.instruction=`왼쪽 저울판에는 보석 1개${q.extra?'와 추 '+q.extra+'개':''}가 있고, 오른쪽에는 추 ${q.total}개가 있어요. 양쪽 무게는 같아요. 보석 1개만 놓으면 추 몇 개와 같은 무게일까요?`;
 if(type==='sequence'){
  const pick=n=>Math.floor(r()*n),mode=grade>=4?pick(3):pick(2),start=2+pick(5),step=2+pick(3),values=[];
  if(mode===0){let n=start;for(let i=0;i<9;i++){values.push(n);n+=step+i;}}
  else if(mode===1){const other=start+12+pick(5);for(let i=0;i<9;i++)values.push(i%2?other+Math.floor(i/2)*(step+1):start+Math.floor(i/2)*step);}
  else{let n=start;for(let i=0;i<9;i++){values.push(n);n+=i%2?-(step-1):step*3;}}
  q.shown=values.slice(0,7);q.answer=values.slice(7);q.choices=[...new Set([...q.answer,...q.answer.flatMap(n=>[n-1,n+1,n+2])])].filter(n=>n>=0&&n<=100).map(value=>({value,label:String(value)}));for(let i=q.choices.length-1;i>0;i--){const j=pick(i+1);[q.choices[i],q.choices[j]]=[q.choices[j],q.choices[i]];}
  q.instruction=['이웃한 수 사이의 증가량도 규칙적으로 바뀌어요. 다음 두 수를 순서대로 넣어 주세요.','홀수 번째와 짝수 번째를 따로 읽으면 서로 다른 두 수열이 보여요. 두 규칙을 이어 다음 두 수를 넣어 주세요.','더하기와 빼기가 번갈아 나와요. 두 가지 변화를 찾아 다음 두 수를 순서대로 넣어 주세요.'][mode];
 }
 if(type==='latin'){q.n=3;const offset=Math.floor(r()*3);q.grid=Array.from({length:9},(_,i)=>(Math.floor(i/3)+i%3+offset)%3+1);q.holes=grade>=4?[0,1,4,8]:[0,4,8];q.answer=q.holes.map(i=>q.grid[i]);q.choices=[1,2,3].map(value=>({value,label:String(value)}));q.instruction='3행 3열 숫자 격자예요. 가로줄마다, 세로줄마다 1~3이 한 번씩만 나타나도록 빈칸을 채워 주세요.';}

 return q;
}
