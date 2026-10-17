import {LEVEL_LABELS} from './math-levels.js?v=20261018-facto10';
import {puzzleHintSteps} from './learning-hints.js?v=20261018-facto10';
import {renderLearning} from './learning-ui.js?v=20261018-facto10';
import {MATH_LABELS,upgradeChallenge,questionFor,emptyInput,submitMath,skipMath} from './math-challenge.js?v=20261018-facto10';
export function createMathPuzzleUI({getGame,onSave,onSolved}){
 const model=window.CreativeBattle,facto=window.FactoPuzzles;
 const dialog=document.createElement('dialog');dialog.className='math-dialog';dialog.setAttribute('aria-labelledby','math-title');
 dialog.innerHTML='<section class="math-card"><p class="math-eyebrow">강력한 공격 도전!</p><div class="math-heading"><h2 id="math-title" class="math-title" tabindex="-1"></h2><span class="math-grade">초급 · ★</span></div><p class="math-move"></p><p class="math-instruction"></p><div class="math-board"></div><div class="math-tools"></div><p class="math-feedback" role="status" aria-live="polite"></p><div class="math-hints" hidden></div><div class="math-commands"><button type="button" class="math-submit">정답 확인하고 강력한 공격!</button><button type="button" class="math-hint">힌트 보기</button><button type="button" class="math-reset">다시 놓기</button><button type="button" class="math-back">공격 넘기기</button></div><p class="math-note">맞히면 강력한 공격! 틀리거나 넘기면 내 공격 없이 상대 차례가 돼요. 시간 제한은 없어요.</p></section>';
 document.body.append(dialog);
 const $=cls=>dialog.querySelector('.math-'+cls),board=$('board'),tools=$('tools');let c,q,selected=null,cursor=0,drag=null,suppress=0;
 const button=(text,fn,cls='')=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.className=cls;b.onclick=fn;return b};
 const persist=()=>{onSave()};
 const input=()=>c.input;
 const ui=window.createFactoUI({board,tools,getQuestion:()=>q,getInput:input,setInput:n=>{c.input=n},getSelected:()=>selected,setSelected:n=>{selected=n},button,tone:()=>{},onChange:render});
 const text=(tag,copy,cls)=>{const e=document.createElement(tag);e.textContent=copy;if(cls)e.className=cls;return e};
 const rune=value=>{const e=text('span',model.runes[value].symbol,'rune');e.style.color=model.runes[value].color;e.setAttribute('aria-label',model.runes[value].name);return e};
 function complete(){return q.type==='path'?c.input.at(-1)===q.goal:q.subset?c.input.length>0:q.paint||q.type==='mirror'?true:c.input.length===q.answer.length&&c.input.every(n=>n!==null)}
 function render(){
  board.replaceChildren();tools.replaceChildren();board.dataset.type=q.type;dialog.dataset.type=q.type;dialog.dataset.grade=String(c.grade);
  if(q.type==='rotate')renderRotation();
  else if(q.learning)renderLearning({q,c,board,tools,button,render,place:ui.place});
  else if(facto.types.includes(q.type)){ui.render();if(q.type==='balance')renderBalance();}
  else if(q.type==='pattern'){
   const trace=document.createElement('div');trace.className='math-rhythm';q.shown.forEach(n=>trace.append(rune(n)));board.append(trace,text('p','다음에는 어떤 순서일까요?'));
   const slots=document.createElement('div');slots.className='math-slots';c.input.forEach((n,i)=>{const b=button(n===null?'?':model.runes[n]?.symbol||'?',()=>{c.input[i]=null;cursor=i;render()},'math-slot');b.dataset.drop='pattern';b.dataset.slot=i;b.setAttribute('aria-label',`예측 ${i+1}번째 빈칸`);if(n!==null){b.dataset.drag='pattern-slot';b.dataset.value=n;b.dataset.from=i}slots.append(b)});board.append(slots);
   model.runes.forEach((r,n)=>{const b=button(r.symbol+' '+r.name,()=>{const i=c.input[cursor]===null?cursor:c.input.indexOf(null);if(i<0)return;c.input[i]=n;cursor=c.input.indexOf(null);render()},'rune-tool');b.dataset.drag='pattern';b.dataset.value=n;b.setAttribute('aria-label',r.name+' 속성 연결');tools.append(b)});
  }else if(q.type==='mirror'){
   const wrap=document.createElement('div');wrap.className='math-mirror';
   for(const editable of [false,true]){const part=document.createElement('div');part.append(text('p',editable?'내 거울 방패':'원본의 빛'));const grid=document.createElement('div');grid.className='math-grid';grid.style.setProperty('--cols',q.cols);(editable?c.input:q.source).forEach((v,i)=>{const cell=editable?button('✦',()=>{c.input[i]=1-c.input[i];render()}):text('span','✦');cell.className='math-light'+(v?' on':'');if(editable){cell.dataset.drop='mirror';cell.dataset.slot=i;cell.setAttribute('aria-pressed',String(!!v));cell.setAttribute('aria-label',`방패 ${i+1}번째 빛`)}grid.append(cell)});part.append(grid);wrap.append(part);if(!editable)wrap.append(text('span',q.axis==='vertical'?'│':'─','math-axis'))}board.append(wrap);
   const light=button('✦ 빛 조각',()=>{},'light-tool');light.dataset.drag='mirror';light.dataset.value=1;tools.append(light);
  }else if(q.type==='path'){
   const grid=document.createElement('div');grid.className='math-path';grid.style.setProperty('--cols',q.size);
   for(let i=0;i<q.size*q.size;i++){const blocked=q.blocked.includes(i),traced=c.input.includes(i);const b=button(i===q.start?'▶':i===q.goal?'⚔':blocked?'▨':q.gems.includes(i)?'◆':traced?'●':'',()=>pathTo(i),'math-path-cell'+(traced?' traced':'')+(q.gems.includes(i)?' gem':''));b.disabled=blocked;b.dataset.cell=i;b.setAttribute('aria-label',`${Math.floor(i/q.size)+1}행 ${i%q.size+1}열 ${i===q.start?'출발':i===q.goal?'도착':blocked?'막힌 돌':q.gems.includes(i)?'보석':'길'}`);grid.append(b)}board.append(grid,text('p',`남은 이동 ${q.budget-(c.input.length-1)} · 보석 ${q.gems.filter(n=>c.input.includes(n)).length}/${q.gems.length}`));
  }else if(q.type==='logic'){
   const clues=document.createElement('ul');q.clues.forEach(clue=>clues.append(text('li',clue.text)));board.append(clues);const slots=document.createElement('div');slots.className='math-slots';c.input.forEach((n,i)=>{const b=button(n===null?'?':String(n),()=>{if(n!==null){c.input[i]=null;selected=n}else if(selected!==null&&!c.input.includes(selected)){c.input[i]=selected;selected=q.cards.find(v=>!c.input.includes(v))??null}render()},'math-slot');b.dataset.drop='logic';b.dataset.slot=i;b.setAttribute('aria-label',`${i+1}번째 룬 자리`);if(n!==null){b.dataset.drag='logic-slot';b.dataset.value=n;b.dataset.from=i}slots.append(b)});board.append(slots);
   q.cards.forEach(n=>{const b=button(String(n),()=>{selected=n;render()},'logic-rune');b.dataset.drag='logic';b.dataset.value=n;b.disabled=c.input.includes(n);b.setAttribute('aria-pressed',String(selected===n));b.setAttribute('aria-label',n+' 룬 선택');tools.append(b)});
  }
  $('submit').disabled=!complete();persist();
 }
 function renderBalance(){
  const scale=board.querySelector('.balance-scale');scale.replaceChildren();
  function weights(n){const group=text('div','','balance-weights');const dots=text('div','','weight-dots');dots.setAttribute('aria-hidden','true');for(let i=0;i<n;i++)dots.append(document.createElement('i'));group.append(dots,text('small',`추 ${n}개`));return group}
  const left=text('div','','balance-pan'),right=text('div','','balance-pan');
  const objects=text('div','','balance-objects'),gem=text('div','','balance-gem');gem.append(text('span','◆'),text('small','보석 1개'));objects.append(gem);if(q.extra)objects.append(weights(q.extra));
  left.append(text('small','왼쪽 저울판'),objects);right.append(text('small','오른쪽 저울판'),weights(q.total));scale.append(left,text('b','=','balance-equal'),right);
 }
 function rotationGuide(){
  const half=q.turns===2,left=q.turns===3,end=half?[130,124]:left?[86,80]:[174,80],sweep=left?0:1;
  const wrap=document.createElement('figure');wrap.className='rotation-guide';
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 260 160');svg.setAttribute('role','img');svg.setAttribute('aria-label',`${q.direction} 회전 안내. 위쪽 시작점에서 ${half?'아래쪽까지 반 바퀴':left?'왼쪽까지 4분의 1바퀴':'오른쪽까지 4분의 1바퀴'} 화살표를 따라가요.`);
  svg.innerHTML=`<defs><marker id="rotation-guide-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 Z" fill="#52783c"/></marker></defs>
   <circle cx="130" cy="80" r="44" fill="none" stroke="#bbc7ab" stroke-width="2" stroke-dasharray="4 5"/>
   <path d="M130 80 L130 36 A44 44 0 0 ${sweep} ${end[0]} ${end[1]} Z" fill="#dcebc9"/>
   <path d="M130 80 L130 36" stroke="#7d8875" stroke-width="2" stroke-dasharray="4 3"/>
   <path d="M130 80 L${end[0]} ${end[1]}" stroke="#52783c" stroke-width="3"/>
   <path d="M130 36 A44 44 0 0 ${sweep} ${end[0]} ${end[1]}" fill="none" stroke="#52783c" stroke-width="5" marker-end="url(#rotation-guide-arrow)"/>
   <circle cx="130" cy="80" r="4" fill="#52783c"/>
   <text x="130" y="19" text-anchor="middle">시작</text>
   <text x="${half?130:left?57:203}" y="${half?151:86}" text-anchor="middle">끝</text>`;
  wrap.append(svg,text('figcaption',`${q.direction} · ${half?'반 바퀴':'한 바퀴의 4분의 1'}`),text('p','시작에서 끝까지 굽은 화살표만큼 돌려요.'));return wrap;
 }
 function renderRotation(){
  function picture(values){const grid=document.createElement('div');grid.className='shape-preview';grid.setAttribute('aria-hidden','true');values.forEach(v=>{const cell=document.createElement('span');cell.className=v?'on':'';grid.append(cell)});return grid}
  const source=document.createElement('div');source.className='rotation-prediction-source';source.append(text('p','돌리기 전 그림'));source.append(picture(q.source),text('p',q.direction+' 돌린 뒤의 모습을 생각해 봐요.'));board.append(rotationGuide(),source);
  const choices=document.createElement('div');choices.className='rotation-prediction-choices';q.options.forEach((values,i)=>{const b=button('',()=>{c.input=[i];render()},'facto-choice');b.setAttribute('aria-label',`회전 후 모습 ${i+1}번 선택`);b.setAttribute('aria-pressed',String(c.input[0]===i));b.append(text('span',`${i+1}번`),picture(values));choices.append(b)});board.append(choices);
 }
 function pathTo(i){if(q.blocked.includes(i))return;const previous=c.input.indexOf(i);if(previous>=0)c.input=c.input.slice(0,previous+1);else{const last=c.input.at(-1),distance=Math.abs(Math.floor(last/q.size)-Math.floor(i/q.size))+Math.abs(last%q.size-i%q.size);if(distance!==1||c.input.length-1>=q.budget){$('feedback').textContent='막힌 돌을 피해 가로·세로로 한 칸씩 이어 주세요.';return}c.input.push(i)}render()}
 function showHints(){const steps=puzzleHintSteps(q,window.PuzzleHints);$('hints').hidden=c.hints===0;$('hints').replaceChildren();steps.slice(0,c.hints).forEach(step=>{const row=document.createElement('div');row.append(text('b',step.title),text('p',step.text));$('hints').append(row)});$('hint').textContent=c.hints===0?'힌트 보기':c.hints<steps.length?'다음 단계 힌트':'힌트 모두 보기'}
 function close(){if(drag&&dialog.hasPointerCapture(drag.id))dialog.releasePointerCapture(drag.id);drag?.ghost?.remove();drag=null;if(dialog.open)dialog.close()}
 function cancel(){const result=skipMath(getGame());persist();close();if(result.resolved)onSolved()}
 $('back').onclick=cancel;dialog.addEventListener('cancel',e=>{e.preventDefault();cancel()});
 $('reset').onclick=()=>{c.input=emptyInput(q);selected=q.type==='logic'?q.cards[0]:null;cursor=0;$('feedback').textContent='처음부터 다시 놓아 보세요.';render()};
 $('hint').onclick=()=>{c.hints=Math.min(3,c.hints+1);showHints();persist()};
 $('submit').onclick=()=>{const result=submitMath(getGame(),model,facto);persist();if(result.resolved){close();onSolved()}else{$('feedback').textContent='아직 맞지 않아요. '+result.reason;render()}};
 // Share Creative's drag/drop semantics while keeping the dialog node stable
 // through re-renders. Every piece is also operable by click, touch or keyboard.
 dialog.addEventListener('click',e=>{if(performance.now()<suppress){e.preventDefault();e.stopImmediatePropagation()}},true);
 dialog.addEventListener('pointerdown',e=>{const src=e.target.closest('[data-drag]');if(!src||src.disabled)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,type:src.dataset.drag,value:Number(src.dataset.value),from:src.dataset.from===undefined?null:Number(src.dataset.from),active:false,ghost:null}});
 dialog.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;if(!drag.active&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>6){drag.active=true;drag.ghost=text('div',q.type==='pattern'?model.runes[drag.value].symbol:'✦','math-drag-ghost');dialog.append(drag.ghost);dialog.setPointerCapture(e.pointerId)}if(drag.active){e.preventDefault();drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px'}});
 function drop(e){if(!drag)return;const d=drag;drag=null;if(!d.active)return;suppress=performance.now()+350;d.ghost.remove();if(dialog.hasPointerCapture(d.id))dialog.releasePointerCapture(d.id);const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-drop]');if(!target||!dialog.contains(target))return;const slot=Number(target.dataset.slot);
  if(d.type.startsWith('facto')&&target.dataset.drop==='facto'){ui.place(slot,d.value,d.from);return}
  if(d.type==='mirror'&&target.dataset.drop==='mirror')c.input[slot]=1;
  else if(d.type.startsWith('pattern')&&target.dataset.drop==='pattern'){if(d.from!==null&&d.from!==slot)c.input[d.from]=c.input[slot];c.input[slot]=d.value}
  else if(d.type.startsWith('logic')&&target.dataset.drop==='logic'){const existing=c.input.indexOf(d.value);if(existing>=0)c.input[existing]=c.input[slot];c.input[slot]=d.value;selected=q.cards.find(n=>!c.input.includes(n))??null}else return;render();
 }
 dialog.addEventListener('pointerup',drop);dialog.addEventListener('pointercancel',()=>{drag?.ghost?.remove();drag=null});
 return {open(){if(upgradeChallenge(getGame(),model,facto))onSave();c=getGame().battle?.s.mathChallenge;if(!c)return;const capture=c.kind==='capture',target=getGame().battleData.species[getGame().battle.enemy.species].name;dialog.dataset.challengeKind=capture?'capture':'attack';$('eyebrow').textContent=c.gymFinisher?'체육관 마지막 공격 도전!':capture?'수학 포획 도전!':'강력한 공격 도전!';$('submit').textContent=capture?'정답 확인하고 몬스터 잡기!':'정답 확인하고 강력한 공격!';$('back').textContent=capture?'이번 포획 넘기기':'공격 넘기기';$('note').textContent=capture?'정답을 풀면 반드시 잡아요! 틀리거나 넘기면 볼 1개를 쓰고 상대 차례가 돼요. 시간 제한은 없어요.':'맞히면 강력한 공격! 틀리거나 넘기면 내 공격 없이 상대 차례가 돼요. 시간 제한은 없어요.';q=questionFor(c,model,facto);selected=q.type==='logic'?q.cards.find(n=>!c.input.includes(n))??null:null;cursor=c.input.indexOf(null);$('title').textContent=capture?'문제를 풀고 '+target+'와 친구가 되어 보자!':q.title;$('move').textContent=capture?MATH_LABELS[q.type]+' · '+target+'와 친구 되기':MATH_LABELS[q.type]+' · '+getGame().battleData.moves[getGame().battle.s.playerFields.charge||(getGame().battle.player.moves.every(m=>m.pp===0)?'STRUGGLE':c.moveId)].name+' 준비';$('grade').textContent=`레벨 ${c.grade} · ${LEVEL_LABELS[c.grade]}`;$('instruction').textContent=(c.gymFinisher?'이 문제를 맞혀야 마지막 공격이 성공해요. 틀리거나 넘기면 상대가 회피해요. ':'')+q.instruction;$('feedback').textContent=capture?'문제를 풀어서 '+target+'와 친구가 되어 보자! 힌트를 보고 천천히 풀어도 좋아요.':'맞히면 선택한 기술로 강력한 공격! 힌트를 보고 천천히 풀어도 좋아요.';render();showHints();if(!dialog.open)dialog.showModal();dialog.querySelector('#math-title').focus()},close,isOpen:()=>dialog.open};
}
