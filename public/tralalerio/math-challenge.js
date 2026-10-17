import {advancedAnalogy} from './analogy-puzzles.js?v=20261017-pool2';
import {LEARNING_TYPES,LEARNING_LABELS,learningQuestion,validateLearning} from './learning-puzzles.js?v=20261017-pool2';
export const MATH_TYPES=['pattern','mirror','path','logic','sequence','analogy','rotate','tower','bond','balance','latin',...LEARNING_TYPES];
export const MATH_LABELS={pattern:'반복 규칙',mirror:'거울 대칭',path:'길 찾기',logic:'논리 배치',sequence:'수의 규칙',classify:'분류',analogy:'변환 규칙',rotate:'도형 회전',tower:'블록 세기',bond:'수 모으기',balance:'무게 비교',latin:'숫자 격자',...LEARNING_LABELS};
const STARTER_MAPS=new Set(['Route29Route46Gate','Route46','Route30','Route30BerryHouse','MrPokemonsHouse','Route31','Route31VioletGate','VioletCity','VioletMart','VioletGym','EarlsPokemonAcademy','VioletNicknameSpeechHouse','VioletPokecenter1F','VioletKylesHouse','SproutTower1F','SproutTower2F','SproutTower3F','DarkCaveVioletEntrance','PlayersHouse2F','PlayersHouse1F','NewBarkTown','ElmsLab','PlayersNeighborsHouse','ElmsHouse','Route29','CherrygroveCity','CherrygroveMart','CherrygrovePokecenter1F','CherrygroveGymSpeechHouse','GuideGentsHouse','CherrygroveEvolutionSpeechHouse']);
export function mathGrade(map,level=1){return STARTER_MAPS.has(map)?1:Math.min(3,1+Math.floor(Math.max(0,level-5)/10))}
export function seededRandom(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
export function questionFor(challenge,model,facto){const r=seededRandom(challenge.seed);return challenge.type==='analogy'?advancedAnalogy(challenge.grade,r):LEARNING_TYPES.includes(challenge.type)||['place_value','shape_match'].includes(challenge.type)?learningQuestion(challenge.type,challenge.grade,r):facto.types.includes(challenge.type)?facto.generate(challenge.type,challenge.grade,r):model.puzzle(challenge.type,challenge.grade,r)}
export function validateQuestion(q,input,model,facto){return q.learning?validateLearning(q,input):(facto.types.includes(q.type)?facto:model).validate(q,input)}
export function emptyInput(q){return q.given?q.given.slice():q.subset?[]:q.type==='path'?[q.start]:q.answer.map(()=>q.paint||q.type==='mirror'?0:null)}
export function requestCapture(game,model,facto,rng=Math.random){
 const b=game.battle,p=b?.player;if(!b||b.s.result||b.s.trainer||b.s.waitingSwitch||b.s.animationPending||game.state.balls<1)return null;
 if(b.s.mathChallenge)return b.s.mathChallenge.kind==='capture'?b.s.mathChallenge:null;
 const pool=MATH_TYPES.filter(t=>t!==game.state.lastMathType),type=pool[Math.floor(rng()*pool.length)],seed=Math.floor(rng()*4294967296)>>>0;
 const c={version:1,kind:'capture',type,seed,grade:Math.min(3,mathGrade(game.state.map,b.enemy.level)+(seed>=2147483648?1:0)),targetSpecies:b.enemy.species,playerSpecies:p.species,input:[],attempts:0,hints:0};
 if(c.type==='analogy'){c.grade=Math.max(2,c.grade);c.analogyVersion=2;}c.input=emptyInput(questionFor(c,model,facto));b.s.mathChallenge=c;return c;
}
export function requestMath(game,index,model,facto,rng=Math.random){
 const b=game.battle,p=b?.player;if(b?.s.mathChallenge?.kind==='capture')return null;if(!b||b.s.result||b.s.waitingSwitch||b.s.animationPending||!p.moves[index]||p.moves[index].pp===0&&p.moves.some(m=>m.pp>0))return null;
 let c=b.s.mathChallenge;
 if(!c&&((game.battleData.moves[b.s.playerFields.charge||(p.moves.every(m=>m.pp===0)?'STRUGGLE':p.moves[index].id)].power||0)===0||rng()>=.5)){b.action('move',index);return null;}
 if(!c){const pool=MATH_TYPES.filter(t=>t!==game.state.lastMathType);const type=pool[Math.floor(rng()*pool.length)],seed=Math.floor(rng()*4294967296)>>>0;c={version:1,type,seed,grade:Math.min(3,mathGrade(game.state.map,b.enemy.level)+(seed>=2147483648?1:0)),moveIndex:index,moveId:p.moves[index].id,playerSpecies:p.species,input:[],attempts:0,hints:0};if(c.type==='analogy'){c.grade=Math.max(2,c.grade);c.analogyVersion=2;}c.input=emptyInput(questionFor(c,model,facto));b.s.mathChallenge=c;}
 c.moveIndex=index;c.moveId=p.moves[index].id;c.playerSpecies=p.species;return c;
}
export function submitMath(game,model,facto){
 const b=game.battle,c=b?.s.mathChallenge;if(!c||!validMathChallenge(c,game.state,game.battleData))return {ok:false,reason:'기술을 다시 골라 주세요.'};
 const q=questionFor(c,model,facto),result=validateQuestion(q,c.input,model,facto);c.attempts++;
 if(!result.ok)return skipMath(game);
 const index=c.moveIndex;delete b.s.mathChallenge;game.state.lastMathType=c.type;
 if(c.kind==='capture')return {ok:true,resolved:b.action('ball',0,{captureAnswer:true})};
 return b.action('move',index,{forceCritical:true,mathRewardSeed:c.seed})?{ok:true,resolved:true}:{ok:false,reason:'지금은 공격할 수 없어요. 기술을 다시 골라 주세요.'};
}
export function validMathChallenge(c,state,data){
 if(c===undefined)return true;const b=state.battle,p=state.party[b?.playerIndex];
 const selection=c?.kind==='capture'?!b?.trainer&&state.balls>0&&c.targetSpecies===b?.enemy.species&&c.moveIndex===undefined&&c.moveId===undefined:c?.kind===undefined&&Number.isInteger(c.moveIndex)&&p?.moves[c.moveIndex]?.id===c.moveId;
 return !!(c&&c.version===1&&(MATH_TYPES.includes(c.type)||c.type==='place_value'||c.type==='classify'||c.type==='shape_match')&&Number.isInteger(c.seed)&&c.seed>=0&&c.seed<=4294967295&&Number.isInteger(c.grade)&&c.grade>=mathGrade(state.map,b.enemy.level)&&c.grade<=Math.min(3,mathGrade(state.map,b.enemy.level)+1)&&selection&&c.playerSpecies===p.species&&!b.result&&!b.waitingSwitch&&!b.animationPending&&Array.isArray(c.input)&&c.input.length<=36&&c.input.every(v=>v===null||Number.isInteger(v)&&v>=0&&v<=100)&&Number.isInteger(c.attempts)&&c.attempts>=0&&Number.isInteger(c.hints)&&c.hints>=0&&c.hints<=3);
}

export function skipMath(game){const b=game.battle,c=b?.s.mathChallenge;if(!c)return {ok:false,resolved:false};delete b.s.mathChallenge;game.state.lastMathType=c.type;return {ok:false,resolved:c.kind==='capture'?b.action('ball',0,{captureAnswer:false}):b.action('math-pass')};}

// Keep valid old saves, but replace retired/easy pending questions before displaying them.
export function upgradeChallenge(game,model,facto){
 const c=game.battle?.s.mathChallenge;if(!c)return false;
 const retiredShape=c.type==='shape_match',retired=c.type==='place_value',retiredClassify=c.type==='classify',analogy=retiredClassify||c.type==='analogy'&&(c.analogyVersion!==2||c.grade<2);
 if(!retired&&!analogy&&!retiredShape)return false;
 if(retired)c.type='add_carry_single';
 if(retiredShape)c.type='shape_complete';
 if(analogy){c.type='analogy';c.grade=Math.max(2,c.grade);c.analogyVersion=2;}
 c.input=emptyInput(questionFor(c,model,facto));c.hints=0;c.attempts=0;return true;
}
