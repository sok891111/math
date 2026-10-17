import {renderReference,referenceDiagram} from './facto-reference-puzzles.js?v=20261018-facto10';
export function renderLearning({q,c,board,tools,button,render,place}){
 const node=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;return el;};
 const grid=shape=>{const el=node('div','','shape-preview');shape.forEach(v=>el.append(node('span','',v?'on':'')));return el;};
 board.append(node('p',q.prompt,'learning-prompt'));
 if(q.reference)renderReference(q,board);
 if(q.source){
  const row=node('div','','learning-shapes');row.append(grid(q.source));
  if(q.paint){row.append(node('span','→'));const editable=node('div','','shape-preview editable');c.input.forEach((v,i)=>{const b=button('',()=>{c.input[i]=1-c.input[i];render()},v?'on':'');b.dataset.drop='facto';b.dataset.slot=i;b.setAttribute('aria-label',`모양 ${i+1}번째 칸`);b.setAttribute('aria-pressed',String(!!v));editable.append(b)});row.append(editable)}board.append(row);
 }
 if(q.matrix){const el=node('div','','learning-matrix');el.style.setProperty('--cols',q.matrix.length);q.matrix.flat().forEach(v=>el.append(node('span',v===null?'?':q.symbols[v])));board.append(el);}
 if(q.table){const table=document.createElement('table');table.className='learning-table';table.setAttribute('aria-label',q.tableLabel||'장소별 모은 물건');const head=document.createElement('tr');(q.tableHeaders||['장소','보석','열매']).forEach(t=>head.append(node('th',t)));table.append(head);q.table.forEach((values,i)=>{const tr=document.createElement('tr');tr.append(node('th',(q.tableRowLabels||['숲','동굴'])[i]));values.forEach(n=>tr.append(node('td',n)));table.append(tr)});board.append(table);}
 if(q.models?.length){const row=node('div','','learning-models');q.models.forEach((value,i)=>{
  if(i)row.append(node('b',q.operator));const group=node('div','','learning-number');group.setAttribute('aria-label',`${Math.floor(value/10)}십 묶음과 ${value%10}낱개`);
  group.append(node('small',`${Math.floor(value/10)}십 · ${value%10}일`));const pieces=node('div','','learning-pieces');
  for(let t=0;t<Math.floor(value/10);t++)pieces.append(node('span','','learning-ten'));
  for(let u=0;u<value%10;u++)pieces.append(node('span','','learning-one'));group.append(pieces);row.append(group);
 });board.append(row);}
 if(q.equation)board.append(node('p',q.equation,'learning-equation'));
 if(!q.paint){const row=node('div','','math-slots');c.input.forEach((v,i)=>{const b=button(v===null?'?':q.symbols?q.symbols[v]:String(v),()=>{c.input[i]=null;render()},'math-slot');b.dataset.drop='facto';b.dataset.slot=i;b.setAttribute('aria-label',`풀이 ${i+1}번째 빈칸`);if(v!==null){b.dataset.drag='facto-slot';b.dataset.value=v;b.dataset.from=i;}row.append(b)});board.append(row);
  for(const choice of q.shapeChoices||q.choices){const b=button(choice.label||'',()=>{place(0,choice.value)},'facto-choice');b.dataset.drag='facto';b.dataset.value=choice.value;b.setAttribute('aria-label',`답 조각 ${choice.value}`);if(choice.shape)b.append(grid(choice.shape));if(choice.diagram){b.classList.add('reference-choice');b.append(referenceDiagram(choice.diagram));}tools.append(b);}
 }
}
