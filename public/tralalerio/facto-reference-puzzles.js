// New generated puzzles inspired by the reasoning in the user's three photos.
export const REFERENCE_LABELS={growing_picture:'그림이 자라는 개수 규칙',number_machine:'숫자 변환 상자의 비밀',picture_progression:'그림의 변화 규칙'};
const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function referenceQuestion(type,grade,r){
 const pick=n=>Math.floor(r()*n),hint=(title,text)=>({title,text}),q={type,grade:4,learning:true,label:REFERENCE_LABELS[type],reference:true,instruction:'앞의 그림들을 차례로 비교해 규칙을 찾고, 물음표에 들어갈 답을 골라 주세요.',hints:[],examples:[]};let answer,values;
 if(type==='growing_picture'){
  const rows=3+pick(3),growth=1+pick(2),target=6+pick(2),figure=n=>({kind:'dots',rows,cols:1+(n-1)*growth});q.examples=Array.from({length:4},(_,i)=>({label:`${i+1}번째`,diagram:figure(i+1)}));q.targetLabel=`${target}번째`;q.targetDiagram={kind:'unknown'};answer=rows+2*(target-1)*growth;
  q.title='그림이 자라면 조각은 몇 개가 될까?';q.prompt=`에메랄드 조각으로 만든 그림이 같은 규칙으로 자라요. ${target}번째 그림에는 조각이 모두 몇 개일까요? 보여 준 그림 다음에서 멈추지 말고, 물어본 차례까지 생각해 보세요.`;
  values=shuffle([-2,-1,1,2].map(d=>answer+2*growth*d).filter(n=>n>=0),r).slice(0,3);values.push(answer);
  q.hints=[hint('남아 있는 부분과 늘어난 부분을 나누어요','그림마다 그대로 있는 세로 부분과, 오른쪽으로 자라는 부분을 따로 살펴봐.'),hint('한 번 자랄 때를 비교해요','위쪽과 아래쪽에서 각각 몇 개씩 더 생기는지 찾아봐. 한 줄만 세고 끝내지 않도록 해.'),hint('물어본 차례까지 이어 봐요','마지막으로 보여 준 그림이 몇 번째인지 확인해 봐. 더 자라는 횟수를 생각하고 같은 규칙을 반복해 봐.')];
 }else if(type==='number_machine'){
  const offset=1+pick(4),sign=pick(2)?1:-1,inputs=[3+pick(3),7+pick(3),11+pick(3)],target=5+pick(10),convert=n=>2*n+sign*offset;q.examples=inputs.map(n=>({label:'변환 예',diagram:{kind:'machine',input:n,output:convert(n)}}));q.targetLabel='같은 상자';q.targetDiagram={kind:'machine',input:target,output:'?'};answer=convert(target);values=[answer,2*target,target+sign*offset,answer-sign*offset*2];
  q.title='같은 상자에 넣으면 어떤 수가 나올까?';q.prompt='상자는 먼저 넣은 수를 두 배로 만든 다음, 늘 같은 수만큼 더하거나 빼요. 세 가지 예를 비교해 상자의 비밀을 찾고 마지막에 나올 수를 골라 주세요.';
  q.hints=[hint('넣은 수와 나온 수를 짝지어요','화살표가 상자로 들어가는 쪽과 나오는 쪽을 구분해 봐. 모든 예에 같은 규칙이 쓰여 있어.'),hint('첫 단계 뒤에 무엇이 달라졌나요?','넣은 수를 두 배로 생각한 뒤, 나온 수와 비교해 봐. 더 커졌는지 작아졌는지, 얼마나 달라졌는지 찾아봐.'),hint('모든 예에서 확인해요','찾은 규칙이 다른 두 예에도 맞는지 확인해 봐. 마지막 수도 같은 순서로 두 단계를 거쳐야 해.')];
 }else{
  const shapes=pick(2)===1;q.title=shapes?'모양과 색칠의 규칙을 함께 찾아 봐!':'색칠된 조각은 다음에 어디로 갈까?';
  if(shapes){const start=pick(3),fill=pick(2),token=n=>((start+n)%3)*2+(fill+n)%2,diagram=n=>({kind:'shape',shape:Math.floor(n/2),filled:n%2});q.examples=Array.from({length:7},(_,i)=>({label:`${i+1}번째`,diagram:diagram(token(i))}));answer=token(7);q.choiceDiagram=diagram;values=[answer,...shuffle(Array.from({length:6},(_,i)=>i).filter(n=>n!==answer),r).slice(0,3)];q.prompt='모양이 바뀌는 순서와 색칠이 바뀌는 순서를 따로 살펴보세요. 두 규칙을 함께 이어 가면 다음에는 어떤 그림이 나올까요?';}
  else{const start=pick(8),step=[2,3,-2,-3][pick(4)],token=n=>(start+step*n+80)%8,diagram=n=>({kind:'sector',index:n});q.examples=Array.from({length:5},(_,i)=>({label:`${i+1}번째`,diagram:diagram(token(i))}));answer=token(5);q.choiceDiagram=diagram;values=[answer,...shuffle(Array.from({length:8},(_,i)=>i).filter(n=>n!==answer),r).slice(0,3)];q.prompt='네모 안에서 색칠된 조각이 같은 방향으로 같은 칸 수만큼 움직여요. 앞의 그림들을 차례로 비교하고, 다음에 색칠될 자리를 찾아 주세요.';}
  q.targetLabel='다음 그림';q.targetDiagram={kind:'unknown'};q.hints=[hint('한 가지씩 나누어 살펴봐요',shapes?'모양의 순서만 먼저 읽어 봐. 그다음 색칠된 그림과 빈 그림이 어떻게 이어지는지 살펴봐.':'첫 그림과 다음 그림의 색칠된 자리를 비교해 봐. 방향과 이동한 칸 수를 따로 생각해.'),hint('다른 그림에도 같은 규칙이 맞나요?',shapes?'같은 모양이 다시 나올 때 색칠도 항상 같을까? 모양 규칙과 색칠 규칙은 서로 다를 수 있어.':'두 번째에서 세 번째로 갈 때도 같은 방향, 같은 칸 수인지 확인해 봐. 마지막 칸을 지나면 처음 쪽으로 이어져.'),hint('마지막 그림에서 한 번 더 이어 봐요','찾은 규칙을 마지막 그림에 한 번 더 적용해 봐. 보기 중 조건이 전부 맞는 그림을 골라 줘.')];
 }
 const unique=[...new Set(values)];for(let n=answer+1;unique.length<4;n++)if(!unique.includes(n))unique.push(n);q.answer=[answer];q.choices=shuffle(unique.slice(0,4),r).map((value,i)=>({value,label:q.choiceDiagram?`${i+1}번`:String(value),diagram:q.choiceDiagram?.(value)}));delete q.choiceDiagram;q.hint=q.hints[0].text;return q;
}
export function referenceDiagram(d){
 const node=(tag,copy,cls)=>{const e=document.createElement(tag);if(copy!==undefined)e.textContent=copy;if(cls)e.className=cls;return e;};
 if(d.kind==='unknown')return node('div','?','reference-unknown');
 if(d.kind==='dots'){const grid=node('div',undefined,'reference-dots');grid.style.setProperty('--dot-cols',d.cols);grid.setAttribute('aria-label',`${d.rows}줄 조각 그림`);for(let row=0;row<d.rows;row++)for(let col=0;col<d.cols;col++){const dot=node('i',undefined,row===0||row===d.rows-1||col===0?'lit':'');dot.setAttribute('aria-hidden','true');grid.append(dot);}return grid;}
 if(d.kind==='machine'){const row=node('div',undefined,'reference-machine');row.append(node('b',String(d.input)),node('span','→'),node('span','변환\n상자','reference-box'),node('span','→'),node('b',String(d.output)));return row;}
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('aria-hidden','true');svg.classList.add('reference-shape');
 if(d.kind==='shape'){const fill=d.filled?'#87ac63':'none';svg.innerHTML=d.shape===0?`<path d="M50 8 L94 90 L6 90 Z" fill="${fill}" stroke="#526d43" stroke-width="3"/>`:d.shape===1?`<circle cx="50" cy="50" r="43" fill="${fill}" stroke="#526d43" stroke-width="3"/>`:`<rect x="8" y="8" width="84" height="84" fill="${fill}" stroke="#526d43" stroke-width="3"/>`;}
 else{const points=[[50,0],[100,0],[100,50],[100,100],[50,100],[0,100],[0,50],[0,0]],a=points[d.index],b=points[(d.index+1)%8];svg.innerHTML=`<rect width="100" height="100" fill="#fffdf0"/><path d="M50 50 L${a[0]} ${a[1]} L${b[0]} ${b[1]} Z" fill="#87ac63"/><rect x="1" y="1" width="98" height="98" fill="none" stroke="#526d43" stroke-width="2"/>`+points.map(p=>`<path d="M50 50 L${p[0]} ${p[1]}" stroke="#526d43" stroke-width="1.5"/>`).join('');}
 return svg;
}
export function renderReference(q,board){const row=document.createElement('div');row.className='reference-examples';for(const example of [...q.examples,{label:q.targetLabel,diagram:q.targetDiagram}]){const card=document.createElement('figure'),caption=document.createElement('figcaption');caption.textContent=example.label;card.append(referenceDiagram(example.diagram),caption);row.append(card);}board.append(row);}
