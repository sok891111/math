import {TYPE_LEVELS,levelForType,planGymAttack} from './math-levels.js?v=20261017-azalea8';
import {rotationQuestion} from './rotation-puzzles.js?v=20261017-azalea8';
import {canStoreCapture} from './pc.js?v=20261017-azalea8';
import {advancedAnalogy} from './analogy-puzzles.js?v=20261017-azalea8';
import {LEARNING_TYPES,LEARNING_LABELS,learningQuestion,validateLearning} from './learning-puzzles.js?v=20261017-azalea8';
export const MATH_TYPES=['pattern','mirror','logic','sequence','analogy','rotate','bond','balance','latin',...LEARNING_TYPES.filter(type=>type!=='shape_complete')];
export const MATH_LABELS={pattern:'반복 규칙',mirror:'거울 대칭',path:'길 찾기',logic:'논리 배치',sequence:'수의 규칙',classify:'분류',analogy:'변환 규칙',rotate:'도형 회전',tower:'블록 세기',bond:'수 모으기',balance:'무게 비교',latin:'숫자 격자',...LEARNING_LABELS};
export const DIFFICULTY_VERSION=4;
export function mathGrade(map,level=1,species=null,data=null){return data?.challengePolicy?.rareSpecies.includes(species)?5:3;}
export function challengeGrade(game,seed){const b=game.battle;if(game.battleData.trainers?.[b.s.trainer]?.badge)return 4;const minimum=mathGrade(game.state.map,b.enemy.level,b.enemy.species,game.battleData);return minimum===5?5:seed>=3435973836?4:3;}
function selection(game,rng){const typeRoll=rng(),seed=Math.floor(rng()*4294967296)>>>0,preferred=challengeGrade(game,seed),strict=preferred===5||!!game.battleData.trainers?.[game.battle.s.trainer]?.badge;let pool=MATH_TYPES.filter(t=>t!==game.state.lastMathType&&(!strict||TYPE_LEVELS[t].includes(preferred)));const type=pool[Math.floor(typeRoll*pool.length)];return {type,seed,grade:levelForType(type,preferred)};}
export function seededRandom(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
export function questionFor(challenge,model,facto){const r=seededRandom(challenge.seed);return challenge.type==='rotate'?rotationQuestion(challenge.grade,r,facto):challenge.type==='analogy'?advancedAnalogy(challenge.grade,r):LEARNING_TYPES.includes(challenge.type)||['place_value','shape_match','shape_complete'].includes(challenge.type)?learningQuestion(challenge.type,challenge.grade,r):facto.types.includes(challenge.type)?gradedFacto(challenge.type,challenge.grade,r,facto):model.puzzle(challenge.type,challenge.grade,r)}
export function validateQuestion(q,input,model,facto){return q.learning?validateLearning(q,input):(facto.types.includes(q.type)?facto:model).validate(q,input)}
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
 return !!(c&&c.version===1&&(MATH_TYPES.includes(c.type)||c.type==='place_value'||c.type==='classify'||c.type==='shape_match'||['path','tower','shape_complete'].includes(c.type))&&Number.isInteger(c.seed)&&c.seed>=0&&c.seed<=4294967295&&Number.isInteger(c.grade)&&c.grade>=(c.difficultyVersion===DIFFICULTY_VERSION?3:1)&&c.grade<=5&&[undefined,2,3,DIFFICULTY_VERSION].includes(c.difficultyVersion)&&(c.plannedRolls===undefined||Array.isArray(c.plannedRolls)&&c.plannedRolls.length<=256&&c.plannedRolls.every(n=>typeof n==='number'&&n>=0&&n<1))&&(c.gymFinisher===undefined||typeof c.gymFinisher==='boolean')&&selection&&c.playerSpecies===p.species&&!b.result&&!b.waitingSwitch&&!b.animationPending&&Array.isArray(c.input)&&c.input.length<=36&&c.input.every(v=>v===null||Number.isInteger(v)&&v>=0&&v<=100)&&Number.isInteger(c.attempts)&&c.attempts>=0&&Number.isInteger(c.hints)&&c.hints>=0&&c.hints<=3);
}

export function skipMath(game){const b=game.battle,c=b?.s.mathChallenge;if(!c)return {ok:false,resolved:false};delete b.s.mathChallenge;game.state.lastMathType=c.type;return {ok:false,resolved:c.kind==='capture'?b.action('ball',0,{captureAnswer:false}):b.action('math-pass',0,{gymDodge:c.gymFinisher===true})};}

// Keep valid old saves, but replace retired/easy pending questions before displaying them.
export function upgradeChallenge(game,model,facto){
 const c=game.battle?.s.mathChallenge;if(!c)return false;
 const removed=['path','tower','shape_complete'].includes(c.type),oldRotation=c.type==='rotate'&&c.rotationVersion!==2;
 const retiredShape=c.type==='shape_match',retired=c.type==='place_value',retiredClassify=c.type==='classify',analogy=retiredClassify||c.type==='analogy'&&(c.analogyVersion!==2||c.grade<2);
 const boss=!!game.battleData.trainers?.[game.battle.s.trainer]?.badge,rare=game.battleData.challengePolicy?.rareSpecies.includes(game.battle.enemy.species),minimum=boss?4:rare?5:levelForType(c.type,3),harder=c.difficultyVersion===DIFFICULTY_VERSION?false:true,version=c.difficultyVersion!==DIFFICULTY_VERSION;
 if(!removed&&!oldRotation&&!retired&&!analogy&&!retiredShape&&!harder&&!version)return false;
 c.difficultyVersion=DIFFICULTY_VERSION;
 if(!removed&&!oldRotation&&!retired&&!analogy&&!retiredShape&&!harder)return true;
 c.grade=levelForType(c.type,minimum);
 if(retired)c.type='add_carry_single';
 if(retiredShape||c.type==='shape_complete')c.type='array_rule';
 if(c.type==='path')c.type='logic';
 if(c.type==='tower')c.type='balance';
 if(analogy){c.type='analogy';c.grade=Math.max(2,c.grade);c.analogyVersion=2;}
 if((boss||rare)&&!TYPE_LEVELS[c.type]?.includes(minimum))c.type='pattern';c.grade=levelForType(c.type,minimum);
 if(c.type==='rotate')c.rotationVersion=2;c.input=emptyInput(questionFor(c,model,facto));c.hints=0;c.attempts=0;return true;
}

function gradedFacto(type,grade,r,facto){
 const q=facto.generate(type,grade<=2?1:grade===3?2:3,r);q.grade=grade;
 if(type==='balance')q.instruction=`왼쪽 저울판에는 보석 1개${q.extra?'와 추 '+q.extra+'개':''}가 있고, 오른쪽에는 추 ${q.total}개가 있어요. 양쪽 무게는 같아요. 보석 1개만 놓으면 추 몇 개와 같은 무게일까요?`;
 if(grade===5&&type==='sequence'){let n=1+Math.floor(r()*5);const increments=[2,3,4],values=[n];for(let i=0;i<8;i++){n+=increments[i%3];values.push(n);}q.shown=values.slice(0,7);q.answer=values.slice(7);}
 if(grade===5&&type==='latin'){q.n=4;const offset=Math.floor(r()*4);q.grid=Array.from({length:16},(_,i)=>(Math.floor(i/4)+i%4+offset)%4+1);q.holes=[0,1,5,6,10,15];q.answer=q.holes.map(i=>q.grid[i]);q.choices=[1,2,3,4].map(value=>({value,label:String(value)}));q.instruction='가로줄과 세로줄에 1~4가 한 번씩만 나타나도록 빈칸을 채워요.';}
 return q;
}
