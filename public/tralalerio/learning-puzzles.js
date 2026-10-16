// Original generated questions based on public learning objectives, not workbook pages.
export const LEARNING_LABELS={shape_match:'같은 모양 찾기',shape_complete:'모양 완성',array_rule:'배열 규칙',table_count:'표 읽기',place_value:'십 묶음과 낱개',add_single:'두 자리와 한 자리 덧셈',add_tens:'몇십 더하기',add_two:'두 자리 덧셈',add_carry_single:'받아올림 한 자리 덧셈',add_carry_two:'받아올림 두 자리 덧셈',add_story:'이야기 덧셈',calc_puzzle:'계산 탐험'};
export const LEARNING_TYPES=Object.keys(LEARNING_LABELS);
const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function learningQuestion(type,grade,r){
 const pick=n=>Math.floor(r()*n),q={type,grade,learning:true,label:LEARNING_LABELS[type],title:'조각을 모아 공격의 힘을 완성해!',instruction:'답 조각을 누르거나 빈칸으로 끌어 놓아 줘.',answer:[],hints:[]};
 const limit=grade===1?4:8;
 let a,b,result;
 if(type==='shape_match'||type==='shape_complete'){
  q.source=Array.from({length:9},()=>pick(2));q.source[4]=1;q.source[0]=0;
  if(type==='shape_match'){
   const patterns=[q.source];for(let i=0;i<3;i++){const p=q.source.slice();p[i===2?8:i]=1-p[i===2?8:i];patterns.push(p);}
   q.shapeChoices=shuffle(patterns.map((shape,id)=>({value:id,shape})),r);q.answer=[0];q.prompt='위의 빛 그림과 칸의 위치가 모두 같은 조각을 찾아 줘.';
  }else{
   q.paint=true;q.answer=q.source.slice();q.given=q.source.map((n,i)=>n&&i%2===0?1:0);q.prompt='흐린 칸을 켜서 왼쪽 그림과 똑같이 완성해 줘. 다시 누르면 꺼져.';
  }
  q.hints=[{title:'모서리부터 봐요',text:'맨 위 왼쪽 칸부터 한 줄씩 비교해 봐.'},{title:'위치가 중요해요',text:'켜진 칸의 개수뿐 아니라 같은 위치에 있는지도 확인해 봐.'},{title:'마지막 확인',text:'세 줄을 차례로 비교하고 빠진 칸과 더 켠 칸을 찾아봐.'}];
 }else if(type==='array_rule'){
  const n=grade===1?2:3,offset=pick(3);q.matrix=Array.from({length:n},(_,row)=>Array.from({length:n},(_,col)=>(row+col+offset)%3));q.answer=[q.matrix[n-1][n-1]];q.matrix[n-1][n-1]=null;q.symbols=['◆','▲','●'];q.prompt='오른쪽으로 한 칸, 아래로 한 칸 갈 때 모양이 어떻게 바뀔까?';q.choices=shuffle([0,1,2].map(value=>({value,label:q.symbols[value]})),r);
  q.hints=[{title:'한 줄씩 봐요',text:'첫째 줄을 왼쪽에서 오른쪽으로 읽어 봐.'},{title:'다음 줄과 비교해요',text:'다음 줄은 같은 순서에서 한 칸 뒤의 모양으로 시작해.'},{title:'빈칸 앞을 봐요',text:'◆ 다음 ▲, ▲ 다음 ●, ● 다음 ◆ 순서를 이어 봐.'}];
 }else if(type==='table_count'){
  q.table=Array.from({length:2},()=>[1+pick(limit),1+pick(limit)]);q.tableAxis=pick(2);q.tableIndex=pick(2);q.answer=[q.tableAxis===0?q.table[q.tableIndex][0]+q.table[q.tableIndex][1]:q.table[0][q.tableIndex]+q.table[1][q.tableIndex]];
  q.prompt=q.tableAxis===0?['숲','동굴'][q.tableIndex]+'에서 모은 보석과 열매는 모두 몇 개일까?':['보석','열매'][q.tableIndex]+'는 두 장소에서 모두 몇 개 모았을까?';q.hints=[{title:'찾을 줄을 골라요',text:'문제가 장소를 묻는지 물건을 묻는지 먼저 읽어 봐.'},{title:'두 칸을 골라요',text:'장소는 가로줄, 물건은 세로줄의 두 수를 살펴봐.'},{title:'모두 몇 개일까?',text:'고른 두 칸의 수를 더하면 돼.'}];
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
    if(mode===0){q.equation=`${a} + ? = ${result}`;result=b;q.prompt='빈칸에 들어갈 에너지 조각을 찾아 줘.';}
    if(mode===1){b=1+pick(9);a=10*tens+pick(10);q.operands=[a,b];q.equation=`${a} → ${a+b} → ?`;result=a+2*b;
     q.prompt=`화살표를 지날 때마다 ${b}만큼 늘어나.`;q.models=[];
    }
    if(mode===2){q.equation=`${a} + ${b} = ${result+1}`;q.prompt='친구의 계산에 실수가 있어! 바른 답 조각으로 고쳐 줘.';}
    if(mode===3){q.prompt=`숲에서 보석 ${a}개, 동굴에서 ${b}개를 모았어. 모두 몇 개일까?`;q.equation=null;}
   }
   const [left,right]=q.operands,onesTotal=left%10+right%10;
   q.carry=onesTotal>=10?{onesTotal,ones:onesTotal%10,tens:1}:null;
  }
  q.answer=[result];q.hints=[{title:'십과 일을 나눠요',text:'긴 막대 하나는 10개, 작은 점 하나는 1개야.'},
   {title:q.carry?'낱개 10개를 묶어요':'같은 자리끼리 생각해요',text:q.carry?`일의 자리를 더하면 ${q.carry.onesTotal}개야. 10개를 십 묶음 하나로 바꾸면 낱개는 ${q.carry.ones}개 남아. 받아올린 십 묶음도 함께 더해 줘.`:'십의 자리끼리, 일의 자리끼리 모아 봐.'},
   {title:'문제의 빈칸을 확인해요',text:q.variant==='missing'?'결과가 아니라 빠진 조각을 고르는 문제야. 식에 넣어서 확인해 봐.':q.variant==='rule'?'첫 화살표와 다음 화살표에서 같은 수만큼 늘어나. 낱개가 10개 넘으면 십 묶음으로 바꿔 줘.':'더한 수를 문제에 다시 넣어서 확인해 봐.'}];
 }

 if(!q.paint&&!q.shapeChoices&&!q.choices){const answer=q.answer[0],values=new Set([answer]);for(const step of shuffle([-10,-2,-1,1,2,10],r))if(answer+step>=0&&answer+step<=99&&values.size<4)values.add(answer+step);q.choices=shuffle([...values].map(value=>({value,label:String(value)})),r);}
 q.hint=q.hints[0].text;return q;
}
export function validateLearning(q,input){return {ok:Array.isArray(input)&&input.length===q.answer.length&&input.every((n,i)=>n===q.answer[i]),reason:q.hint};}
