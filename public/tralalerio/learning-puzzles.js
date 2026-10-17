import {NUMBER_REASONING_LABELS,numberReasoningQuestion} from './number-reasoning-puzzles.js?v=20261018-violet15';
import {REFERENCE_LABELS,referenceQuestion} from './facto-reference-puzzles.js?v=20261018-violet15';
import {ANALYSIS_LABELS,analysisQuestion} from './story-analysis-puzzles.js?v=20261018-violet15';
import {learningHints} from './learning-hints.js?v=20261018-violet15';
import {STORY_LABELS,STORY_TYPES,minecraftStory,minecraftCombineText} from './minecraft-stories.js?v=20261018-violet15';
// Original generated questions based on public learning objectives, not workbook pages.
export const LEARNING_LABELS={shape_match:'같은 모양 찾기',shape_complete:'모양 완성',array_rule:'배열 규칙',table_count:'표 읽기',place_value:'십 묶음과 낱개',add_single:'두 자리와 한 자리 덧셈',add_tens:'몇십 더하기',add_two:'두 자리 덧셈',add_carry_single:'받아올림 한 자리 덧셈',add_carry_two:'받아올림 두 자리 덧셈',add_story:'이야기 덧셈',subtract_single:'한 자리 뺄셈',subtract_story:'한 자리 이야기 뺄셈',times_table:'구구단 · 2~6단',calc_puzzle:'계산 탐험',...STORY_LABELS,...ANALYSIS_LABELS,...REFERENCE_LABELS,...NUMBER_REASONING_LABELS};
export const LEARNING_TYPES=Object.keys(LEARNING_LABELS).filter(type=>!['place_value','shape_match','shape_complete'].includes(type));
const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function learningQuestion(type,grade,r){
 if(Object.hasOwn(NUMBER_REASONING_LABELS,type))return numberReasoningQuestion(type,r);
 if(Object.hasOwn(REFERENCE_LABELS,type))return referenceQuestion(type,grade,r);
 if(Object.hasOwn(ANALYSIS_LABELS,type))return analysisQuestion(type,grade,r);
 if(STORY_TYPES.includes(type))return minecraftStory(type,grade,r);
 const pick=n=>Math.floor(r()*n),q={type,grade,learning:true,label:LEARNING_LABELS[type],title:'조각을 모아 공격의 힘을 완성해!',instruction:'답 조각을 누르거나 빈칸으로 끌어 놓아 줘.',answer:[],hints:[]};
 const limit=grade===1?4:8;
 let a,b,result;
 if(type==='subtract_single'||type==='subtract_story'){
  a=grade===1?1+pick(5):grade>=3?6+pick(4):1+pick(9);b=1+pick(a);result=a-b;q.operands=[a,b];q.operator='-';q.answer=[result];
  q.title=type==='subtract_story'?'이야기를 읽고 남은 수를 찾아 줘!':'덜어 내면 몇 개가 남을까?';
  q.instruction='처음 수에서 없어진 수만큼 빼 보세요. 남은 수를 골라 빈칸에 넣어 주세요.';
  if(type==='subtract_single'){q.prompt=`${a}개에서 ${b}개를 덜어 내면 몇 개가 남을까요?`;q.equation=`${a} - ${b} = ?`;}
  else{const actor=['스티브','알렉스','엔더맨','피글린','주민'][pick(5)],item=['사과','다이아몬드','당근','에메랄드','쿠키'][pick(5)],stories=[`${actor}의 상자에 ${item} ${a}개가 있었어요. 친구에게 ${b}개를 주었어요. 상자에는 몇 개가 남았을까요?`,`${actor}의 가방에 ${item} ${a}개가 있었어요. 집에 ${b}개를 놓고 왔어요. 가방에는 몇 개가 남았을까요?`,`${actor}의 창고에 ${item} ${a}개가 있었어요. 모험에 쓸 ${b}개를 꺼냈어요. 창고에는 몇 개가 남았을까요?`];q.prompt=stories[pick(stories.length)];q.story=true;}
  if(type==='subtract_single'&&grade>=3){q.missingSubtrahend=true;q.title='빈칸에 들어갈 수를 찾아 줘!';q.instruction='처음 수와 남은 수를 읽고, 몇 개를 덜어 냈는지 생각해 보세요. 빈칸에 들어갈 수를 골라 주세요.';q.remaining=result;q.answer=[b];q.prompt=`${a}개에서 몇 개를 덜어 내면 ${result}개가 남을까요? 빈칸에 들어갈 수를 찾아보세요.`;q.equation=`${a} - ? = ${result}`;result=b;}
  q.choices=shuffle([result,...shuffle(Array.from({length:10},(_,i)=>i).filter(n=>n!==result),r).slice(0,3)].map(value=>({value,label:String(value)})),r);
 }else if(type==='times_table'){
  a=grade>=4?4+pick(3):2+pick(grade===2?2:5);b=grade>=4?6+pick(4):1+pick(grade===2?5:9);result=a*b;q.operands=[a,b];q.operator='×';q.answer=[result];q.title='같은 수씩 모으면 모두 몇 개일까?';
  q.instruction=`${a}단 문제예요. 한 묶음에 ${a}개씩 있는 것이 ${b}묶음이면 모두 몇 개인지 생각해 보세요. 답을 골라 빈칸에 넣어 주세요.`;
  q.prompt=`상자 하나에 에메랄드가 ${a}개씩 들어 있어요. 상자가 ${b}개라면 에메랄드는 모두 몇 개일까요?`;q.equation=`${a} × ${b} = ?`;
 }else if(type==='shape_match'||type==='shape_complete'){
  q.source=Array.from({length:9},()=>pick(2));q.source[4]=1;q.source[0]=0;
  if(type==='shape_match'){
   const patterns=[q.source];for(let i=0;i<3;i++){const p=q.source.slice();p[i===2?8:i]=1-p[i===2?8:i];patterns.push(p);}
   q.shapeChoices=shuffle(patterns.map((shape,id)=>({value:id,shape})),r);q.answer=[0];q.prompt='위의 빛 그림과 칸의 위치가 모두 같은 조각을 찾아 줘.';
  }else{
   q.paint=true;q.answer=q.source.slice();q.given=q.source.map((n,i)=>n&&i%2===0?1:0);q.prompt='흐린 칸을 켜서 왼쪽 그림과 똑같이 완성해 줘. 다시 누르면 꺼져.';
  }

 }else if(type==='array_rule'){
  const n=3,offset=pick(3),step=pick(2)?1:2;q.matrix=Array.from({length:n},(_,row)=>Array.from({length:n},(_,col)=>(row*step+col+offset)%3));q.answer=[q.matrix[2][2]];q.matrix[2][2]=null;q.symbols=['◆','▲','●'];q.prompt='3행 3열 배열이에요. 가로로 이어지는 세 모양의 순서와, 다음 줄에서 시작 위치가 바뀌는 규칙을 함께 찾아 마지막 빈칸을 채워 주세요.';q.choices=shuffle([0,1,2].map(value=>({value,label:q.symbols[value]})),r);

 }else if(type==='table_count'){
  q.table=Array.from({length:2},()=>[1+pick(limit),1+pick(limit)]);q.tableAxis=pick(2);q.tableIndex=pick(2);q.answer=[q.tableAxis===0?q.table[q.tableIndex][0]+q.table[q.tableIndex][1]:q.table[0][q.tableIndex]+q.table[1][q.tableIndex]];
  q.prompt=q.tableAxis===0?['숲','동굴'][q.tableIndex]+'에서 모은 보석과 열매는 모두 몇 개일까?':['보석','열매'][q.tableIndex]+'는 두 장소에서 모두 몇 개 모았을까?';
 }else{
  const tens=1+pick(Math.min(limit,7));a=10*tens+1+pick(9);
  if(type==='place_value'){q.models=[a];q.prompt='긴 막대는 10개 묶음, 작은 점은 1개야. 모두 몇 개일까?';result=a;}
  else{
   q.prompt='두 수를 더한 답 조각을 찾아 줘.';
   const carry=type.startsWith('add_carry')||pick(2)===1;
   const single=type==='add_single'||type==='add_carry_single';
   if(type==='add_tens'){a=10*(1+pick(8));b=10*(1+pick(9-a/10));}
   else{
    const units=a%10,otherUnits=carry?10-units+pick(units):pick(10-units);
    const otherTens=single?0:1+pick(9-tens-(carry?1:0));
    b=10*otherTens+otherUnits;
   }
   result=a+b;q.operands=[a,b];q.operator='+';q.models=grade===1?[a,b]:[];q.equation=`${a} + ${b} = ?`;
   if(type==='calc_puzzle'||type==='add_story'){
    const mode=type==='add_story'?3:pick(4);q.variant=['missing','rule','error','story'][mode];
    if(mode===0){q.models=[];q.equation=`${a} + ? = ${result}`;result=b;q.prompt='빈칸에 들어갈 에너지 조각을 찾아 줘.';}
    if(mode===1){b=1+pick(9);a=10*tens+pick(10);q.operands=[a,b];q.equation=`${a} → ${a+b} → ?`;result=a+2*b;
     q.prompt=`화살표를 지날 때마다 ${b}만큼 늘어나.`;q.models=[];
    }
    if(mode===2){q.equation=`${a} + ${b} = ${result+1}`;q.prompt='친구의 계산에 실수가 있어! 바른 답 조각으로 고쳐 줘.';}
    if(mode===3){q.prompt=minecraftCombineText(a,b);q.story=true;q.equation=null;q.models=[];}
   }
   const [left,right]=q.operands,onesTotal=left%10+right%10;
   q.carry=onesTotal>=10?{onesTotal,ones:onesTotal%10,tens:1}:null;
  }
  q.answer=[result];
 }

 if(!q.paint&&!q.shapeChoices&&!q.choices){const answer=q.answer[0],values=new Set([answer]);for(const step of shuffle([-10,-2,-1,1,2,10],r))if(answer+step>=0&&answer+step<=99&&values.size<4)values.add(answer+step);q.choices=shuffle([...values].map(value=>({value,label:String(value)})),r);}
 q.hints=learningHints(q);q.hint=q.hints[0].text;return q;
}
export function validateLearning(q,input){return {ok:Array.isArray(input)&&input.length===q.answer.length&&input.every((n,i)=>n===q.answer[i]),reason:q.hint};}
