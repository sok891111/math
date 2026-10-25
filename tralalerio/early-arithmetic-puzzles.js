// Original seeded tasks informed by public NRICH age5–7 number investigations.
export const EARLY_ARITHMETIC_LABELS={equal_sum:'같은 합의 빈 수 찾기',sum_pyramid:'수 피라미드의 빈 수',reverse_steps:'처음을 찾는 거꾸로 연산',digit_sum:'덧셈식의 숨은 숫자',target_pairs:'목표 합을 만드는 짝 세기',heads_feet:'머리와 다리 수 추리'};
export const EARLY_ARITHMETIC_LEVELS={equal_sum:[3,4,5],sum_pyramid:[3,4,5],reverse_steps:[3,4,5],digit_sum:[3,4,5],target_pairs:[3,4],heads_feet:[3,4,5]};
const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function earlyArithmetic(type,grade,r){
 const pick=n=>Math.floor(r()*n),hint=(title,text)=>({title,text}),q={type,grade,learning:true,earlyArithmetic:true,label:EARLY_ARITHMETIC_LABELS[type],title:EARLY_ARITHMETIC_LABELS[type],instruction:'조건을 차례로 읽고 답 조각을 골라 주세요.',models:[],additionChecks:[]};let answer,distractors=[];
 if(type==='equal_sum'){
  const x=2+pick(8),a=1+pick(8),copies=grade===5?2:1,total=copies*x+a,b=1+pick(total-1),c=total-b;
  q.equation=`${copies===2?'□ + □':'□'} + ${a} = ${b} + ${c}`;q.prompt=copies===2?'양쪽의 합이 같아요. 두 □에는 같은 수를 넣어야 해요. □ 하나에 들어갈 수는 무엇일까요?':'등호 양쪽은 같은 수예요. □에 들어갈 수를 찾아 주세요.';q.reasoning={kind:type,x,a,b,c,copies};q.additionChecks=[{terms:[...Array(copies).fill(x),a],total},{terms:[b,c],total}];answer=x;distractors=[total,total-a,x+1,x-1];
  q.hints=[hint('등호의 뜻을 생각해요','등호는 양쪽의 값이 같다는 뜻이야. 빈칸이 없는 쪽부터 살펴봐.'),hint('알려진 수와 모르는 수를 나눠요','같아야 할 전체에서 이미 주어진 부분을 구분해 봐.'),hint('빈칸의 개수도 확인해요',copies===2?'같은 □가 두 번 나오니, 남은 양을 같은 크기의 두 부분으로 나누어 봐.':'고른 수를 원래 빈칸에 넣어 양쪽이 정말 같은지 확인해 봐.')];
  if(grade===5){
   const triangle=a,total=x+triangle;q.equalSumVersion=2;
   q.equation=`□ + △ = ${total}\n△ + △ = ${2*triangle}`;
   q.prompt='두 식에서 같은 모양은 같은 수예요. △의 수를 먼저 알아내고, □ 하나에 들어갈 수를 찾아 주세요.';
   q.reasoning={kind:type,linked:true,total,triangleTotal:2*triangle,x};q.additionChecks=[{terms:[x,triangle],total},{terms:[triangle,triangle],total:2*triangle}];
   distractors=[total,2*triangle,triangle,x+1,x-1];
   q.hints=[hint('같은 모양은 같은 수예요','두 식에 나온 △는 모두 같은 수야. 다른 모양인 □와 구별해 봐.'),hint('한 가지 모양만 있는 식부터 풀어요','△가 두 번 나오는 식의 전체를 같은 크기의 두 부분으로 나누어 봐.'),hint('알아낸 수를 다른 식에 넣어요','알아낸 △의 수를 첫 번째 식에 넣고 남은 □를 찾아. 두 식이 모두 맞는지 다시 확인해 봐.')];
  }
 }else if(type==='sum_pyramid'){
  const a=1+pick(grade>=4?8:5),b=1+pick(grade>=4?8:5),c=1+pick(grade>=4?8:5),top=a+2*b+c,hidden=grade===3?'top':grade===4?'right':'middle';answer=hidden==='top'?top:hidden==='right'?c:b;
  q.pyramid=[[hidden==='top'?'?':top],['…','…'],[a,hidden==='middle'?'?':b,hidden==='right'?'?':c]];q.reasoning={kind:type,a,b,c,top,hidden};q.prompt='바로 아래에서 이웃한 두 수를 더하면 위 칸의 수가 돼요. … 칸은 스스로 계산해 보세요. ? 칸의 수만 답으로 골라 주세요.';q.additionChecks=[{terms:[a,b],total:a+b},{terms:[b,c],total:b+c},{terms:[a+b,b+c],total:top}];distractors=[top-a-c,a+b,b+c,answer+1,answer-1];
  q.hints=[hint('위 칸이 만들어지는 방법을 확인해요','바로 아래에서 이웃한 두 칸을 한 쌍씩 짝지어 봐.'),hint('알려진 곳부터 이어 가요','두 수를 모두 아는 곳은 위로, 위의 수와 아래 한 수를 아는 곳은 거꾸로 생각할 수 있어.'),hint('가운데 수의 역할을 살펴봐요','맨 아래 가운데 수가 윗줄의 두 칸에 각각 영향을 준다는 점을 생각해 봐. 찾은 수를 넣어 꼭대기까지 다시 확인해.')];
 }else if(type==='reverse_steps'){
  const initial=3+pick(13),operations=[{op:'+',value:2+pick(7)}];let current=initial+operations[0].value;
  operations.push({op:'-',value:1+pick(Math.min(7,current))});current-=operations[1].value;
  if(grade>=4){const n=1+pick(7);operations.push({op:'+',value:n});current+=n;}
  if(grade>=5){const n=1+pick(Math.min(7,current));operations.push({op:'-',value:n});current-=n;}
  q.reasoning={kind:type,initial,operations,final:current};q.operationChain={operations,final:current};q.prompt='상자에 보석이 몇 개 들어 있었는지 몰라요. 아래 순서대로 보석을 넣거나 꺼냈더니 마지막 수가 되었어요. 처음에는 몇 개였을까요?';answer=initial;let n=initial;for(const action of operations){if(action.op==='+')q.additionChecks.push({terms:[n,action.value],total:n+action.value});n+=action.op==='+'?action.value:-action.value;}distractors=[current,initial+operations[0].value,initial-1,initial+1];
  q.hints=[hint('무엇을 묻는지 확인해요','마지막에 남은 수가 아니라 처음 들어 있던 수를 찾는 문제야.'),hint('마지막 행동부터 되짚어요','넣었던 행동을 되돌리려면 꺼내고, 꺼냈던 행동을 되돌리려면 다시 넣어야 해.'),hint('순서를 바꾸어 확인해요','마지막 행동부터 처음 행동까지 거꾸로 되짚은 뒤, 찾은 처음 수로 원래 순서를 다시 해 봐.')];
 }else if(type==='digit_sum'){
  const tens=1+pick(5),units=grade>=4?2+pick(7):pick(7),b=grade>=4?10-units+pick(units):1+pick(9-units),a=tens*10+units,total=a+b,place=grade===5?'tens':'ones';answer=place==='tens'?tens:units;
  q.equation=`${place==='tens'?'□'+units:tens+'□'} + ${b} = ${total}`;q.prompt='□는 숫자 한 자리가 가려진 곳이에요. 십의 자리와 일의 자리를 구별해서, 들어갈 숫자 하나를 찾아 주세요.';q.reasoning={kind:type,a,b,total,place};q.additionChecks=[{terms:[a,b],total}];distractors=shuffle(Array.from({length:10},(_,i)=>i).filter(n=>n!==answer),r);
  q.hints=[hint('가려진 자리를 찾아요','□가 십의 자리인지 일의 자리인지 먼저 확인해 봐.'),hint('일의 자리부터 비교해요','일의 자리를 더했을 때 십 묶음으로 옮겨지는 것이 있는지 살펴봐.'),hint('식 전체로 검산해요','찾은 숫자를 가려진 자리에 넣고 처음부터 더해 봐. 일의 자리뿐 아니라 십의 자리도 맞아야 해.')];
 }else if(type==='target_pairs'){
  const target=grade>=4?16+pick(10):10+pick(7),pool=Array.from({length:target-1},(_,i)=>i+1),cards=shuffle(pool,r).slice(0,grade>=4?8:6);answer=0;for(let i=0;i<cards.length;i++)for(let j=i+1;j<cards.length;j++)if(cards[i]+cards[j]===target)answer++;
  q.numberCards=cards;q.reasoning={kind:type,target,cards};q.prompt=`서로 다른 카드 2장의 합이 ${target}이 되는 짝은 모두 몇 쌍일까요? 순서만 바꾼 짝은 한 번만 세어요. 각 짝은 따로 만들며 다른 짝에서 같은 카드를 다시 살펴봐도 돼요.`;q.additionChecks=cards.flatMap((a,i)=>cards.slice(i+1).map(b=>({terms:[a,b],total:a+b})));distractors=[answer+1,Math.max(0,answer-1),answer+2,answer+3];
  q.hints=[hint('작은 카드부터 고정해요','카드 한 장을 정하고, 나머지 카드 중 어떤 수와 짝이 되어야 할지 생각해 봐.'),hint('순서만 바꾼 짝을 구분해요','두 카드를 서로 바꾸어 놓아도 같은 한 쌍이야. 같은 짝을 두 번 세지 않았는지 확인해.'),hint('빠짐없이 확인해요','각 카드보다 큰 수의 카드하고만 짝을 만들어 확인하면 같은 짝을 중복해서 세는 일을 줄일 수 있어.')];
 }else if(type==='heads_feet'){
  const heads=grade>=4?6+pick(4):3+pick(3),rabbits=1+pick(heads-1),hens=heads-rabbits,feet=4*rabbits+2*hens,arriving=grade===5?1+pick(3):0;answer=rabbits+arriving;
  q.reasoning={kind:type,heads,feet,arriving};q.prompt=`농장에 닭과 토끼가 합해서 ${heads}마리 있어요. 닭은 다리가 2개, 토끼는 다리가 4개예요. 다리를 모두 세었더니 ${feet}개였어요. ${arriving?`그 뒤 토끼 ${arriving}마리가 더 왔어요. 지금 토끼는`:'토끼는'} 몇 마리일까요?`;q.additionChecks=[{terms:[rabbits,hens],total:heads},{terms:[rabbits*4,hens*2],total:feet},{terms:[rabbits,arriving],total:answer}];distractors=[heads,hens,rabbits,answer+1,answer-1];
  q.hints=[hint('동물 수와 다리 수를 구분해요','머리는 동물마다 하나씩 있어. 닭과 토끼가 다리를 몇 개씩 갖는지 구분해 봐.'),hint('모두 닭이라고 생각해 봐요','모두 다리가 두 개라면 다리가 몇 개일까? 실제 다리 수와 비교하고, 닭 한 마리를 토끼로 바꾸면 얼마나 늘어나는지 생각해 봐.'),hint('이야기의 마지막도 읽어요',arriving?'처음 토끼 수를 알아낸 뒤 새로 온 토끼도 반영해. 처음 조건과 마지막 질문을 구분해 봐.':'찾은 토끼 수와 남은 닭 수로 동물 수와 다리 수를 모두 다시 확인해 봐.')];
 }else throw Error('Unknown early arithmetic type: '+type);
 const choices=[answer];for(const n of [...distractors,answer-1,answer+1,answer+2,answer+3,answer+4])if(Number.isInteger(n)&&n>=0&&n<=99&&!choices.includes(n)&&choices.length<4)choices.push(n);
 q.answer=[answer];q.choices=shuffle(choices,r).map(value=>({value,label:String(value)}));q.hint=q.hints[0].text;return q;
}
