// Original randomized questions based on the two supplied number-reasoning photos.
export const NUMBER_REASONING_LABELS={number_riddle:'대화로 숨은 수 찾기',number_card_count:'숫자 카드 조건 세기'};
const shuffle=(items,r)=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function numberReasoningQuestion(type,grade,r){
 if(typeof grade==='function'){r=grade;grade=4;}
 const pick=n=>Math.floor(r()*n),hint=(title,text)=>({title,text}),q={type,grade,learning:true,label:NUMBER_REASONING_LABELS[type],instruction:'이야기 속 조건을 하나씩 읽고, 모든 조건에 맞는 답을 골라 주세요.'};let answer,options;
 if(grade===5&&type==='number_riddle'){
  const tens=2+pick(6),units=2+pick(7);answer=10*tens+units;
  const low=answer-11,high=answer+7,parity=answer%2,digitSum=tens+units;
  q.numberConditions={low,high,parity,digitSum};q.title='대화 속 단서를 모두 연결해 비밀 수를 찾아 줘!';
  q.prompt=`스티브가 두 자리 수 하나를 생각했어요.\n알렉스: “어떤 범위에 있어?”\n스티브: “${low}보다 크고 ${high}보다 작아.”\n알렉스: “또 다른 단서는?”\n스티브: “${parity?'홀수':'짝수'}이고, 십의 자리 숫자와 일의 자리 숫자를 더하면 ${digitSum}이 돼!”\n모든 단서에 맞는 비밀 수는 무엇일까요?`;
  options=[answer,answer-9,answer+2,answer+18];
  q.hints=[hint('단서를 따로 정리해요','범위, 홀짝, 두 자리 숫자의 합이라는 세 가지 조건을 각각 정리해 봐.'),hint('후보를 줄여 가요','범위 안의 수 중 홀짝 조건이 맞는 수만 남기고, 각 수의 십의 자리와 일의 자리를 더해 봐.'),hint('세 조건을 다시 확인해요','자리 숫자의 합이 같아도 범위나 홀짝이 다를 수 있어. 고른 수가 모든 조건을 만족하는지 확인해.')];
 }else if(grade===5){
  const low=10+pick(30),high=low+20+pick(10),parity=pick(2),pool=Array.from({length:90},(_,i)=>i+10);
  const ruleA=n=>n>low&&n<high&&n%2===parity,ruleB=n=>Math.floor(n/10)<n%10;
  const groups=[[],[],[],[]];for(const n of pool)groups[(ruleA(n)?1:0)+(ruleB(n)?2:0)].push(n);
  const cards=shuffle(groups.flatMap(group=>shuffle(group,r).slice(0,1+pick(3))),r);
  const countA=cards.filter(ruleA).length,countB=cards.filter(ruleB).length,both=cards.filter(n=>ruleA(n)&&ruleB(n)).length;
  answer=countA+countB-both;q.cardRules={low,high,parity,operation:'union',comparison:'tensLessThanOnes'};
  q.numberCards=cards;q.title='두 친구가 고른 카드는 모두 몇 장일까?';
  q.prompt=`알렉스는 ${low}보다 크고 ${high}보다 작은 ${parity?'홀수':'짝수'} 카드를 골라요.\n스티브는 십의 자리 숫자보다 일의 자리 숫자가 큰 카드를 골라요.\n두 친구 중 한 명이라도 고른 카드는 모두 몇 장일까요? 둘 다 고른 카드도 한 장으로만 세어요.`;
  options=[answer,countA+countB,both,countA];
  q.hints=[hint('두 친구의 규칙을 구분해요','알렉스의 범위·홀짝 규칙과 스티브의 자리 숫자 비교 규칙을 따로 적용해 봐.'),hint('겹치는 카드를 찾아요','알렉스만 고른 카드, 스티브만 고른 카드, 둘 다 고른 카드로 나누면 빠뜨리거나 두 번 세는 일을 줄일 수 있어.'),hint('한 장은 한 번만 세어요','둘 다 고른 카드를 두 번 더하지 않았는지 확인해. 어느 쪽도 고르지 않은 카드는 세지 않아.')];
 }else if(type==='number_riddle'){
  answer=12+pick(76);const low=answer-2,high=answer+2,parity=answer%2?'홀수':'짝수';
  q.title='친구들의 대화에서 비밀 숫자를 찾아 줘!';
  q.prompt=`스티브가 비밀 숫자 하나를 생각했어요.\n알렉스: “${high}보다 작은 수야?”\n스티브: “응, ${high}보다 작아.”\n알렉스: “${low}보다 큰 수야?”\n스티브: “응, ${low}보다 커. 그리고 ${parity}야!”\n스티브가 생각한 수는 무엇일까요?`;
  options=[answer,low+1,high-1,pick(2)?low:high];
  q.hints=[hint('큰 수와 작은 수 사이를 찾아요','두 대답을 모두 만족하는 범위를 찾아봐. “보다 크다”와 “보다 작다”에서는 말한 경계 숫자 자체는 들어가지 않아.'),hint('가능한 수를 적어 봐요','범위 안의 정수를 작은 순서대로 적어 봐. 숫자를 하나씩 빠뜨리지 않았는지 확인해.'),hint('마지막 단서도 확인해요','두 개씩 짝지었을 때 하나가 남으면 홀수, 남지 않으면 짝수야. 범위와 홀짝 단서가 모두 맞는지 확인해 봐.')];
 }else{
  const low=10+pick(50),high=low+12+pick(9),parity=pick(2),parityName=parity?'홀수':'짝수';
  const matching=Array.from({length:high-low-1},(_,i)=>low+i+1).filter(n=>n%2===parity),nonmatching=Array.from({length:90},(_,i)=>i+10).filter(n=>!(n>low&&n<high&&n%2===parity));
  const cards=shuffle([...shuffle(matching,r).slice(0,2+pick(4)),...shuffle(nonmatching,r).slice(0,4)],r);answer=cards.filter(n=>n>low&&n<high&&n%2===parity).length;
  q.numberCards=cards;q.title='조건에 맞는 숫자 카드는 모두 몇 장일까?';
  q.prompt=`알렉스가 에메랄드 상자에 붙일 숫자 카드를 골라요.\n아래 카드 중 ${low}보다 크고 ${high}보다 작은 ${parityName} 카드만 골라야 해요.\n세 조건을 모두 만족하는 카드는 모두 몇 장일까요?`;
  options=[answer,answer-1,answer+1,answer+2];
  q.hints=[hint('세 조건을 나누어요','먼저 범위의 아래쪽과 위쪽 경계를 확인하고, 마지막으로 홀수인지 짝수인지 살펴봐.'),hint('카드를 한 장씩 확인해요','일의 자리를 보면 홀짝을 알 수 있어. 홀짝이 맞아도 정해진 범위 밖에 있으면 고르지 않아.'),hint('고른 카드만 세어요','조건이 모두 맞는 카드에만 표시한 뒤 표시한 장수를 세어 봐. 카드에 적힌 숫자를 더하는 문제가 아니야.')];
 }
 const unique=[...new Set(options)];for(let n=0;unique.length<4;n++)if(!unique.includes(n))unique.push(n);
 q.answer=[answer];q.choices=shuffle(unique.slice(0,4),r).map(value=>({value,label:String(value)}));q.hint=q.hints[0].text;return q;
}
