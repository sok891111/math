// Original Minecraft stories: understand the subject and order before calculating.
export const ANALYSIS_LABELS={story_spend_chain:'두 번 쓰고 남기기',story_less_chain:'친구들의 적은 수 잇기',table_story:'표와 이야기로 남은 수 찾기'};
const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function analysisQuestion(type,grade,r){
 grade=1;
 const pick=n=>Math.floor(r()*n),names=['스티브','알렉스','엔더맨','피글린'],start=pick(4),first=names[start],second=names[(start+1)%4],third=names[(start+2)%4],item=['에메랄드','다이아몬드','당근','사과'][pick(4)];
 const q={type,grade,learning:true,story:true,label:ANALYSIS_LABELS[type],title:'이야기의 단서를 차례로 풀어 봐!',instruction:'누구의 수를 묻는지 먼저 읽어요. 필요한 수만 찾아 계산하고 답 조각을 골라 주세요.',models:[],hints:[]};let answer;
 const hint=(title,text)=>({title,text});
 if(type==='table_story'){
  q.title='표에서 필요한 정보를 찾아 문제를 풀어 봐!';q.tableHeaders=['장소','모은 수','쓴 수'];q.tableRowLabels=['숲','동굴','마을'];q.tableLabel='장소별로 모으고 쓴 물건의 수';q.table=Array.from({length:3},()=>(()=>{const total=2+pick(4);return [total,1+pick(total)];})());
  const row=pick(3),other=(row+1+pick(2))%3,gift=grade>=5?1+pick(9):0;q.analysis={rows:grade>=4?[row,other]:[row],gift};
  answer=q.analysis.rows.reduce((n,i)=>n+q.table[i][0]-q.table[i][1],0)-gift;
  const places=q.analysis.rows.map(i=>q.tableRowLabels[i]).join('과 ');
  q.prompt=`${first}의 ${item} 기록이에요. 표의 ‘쓴 수’는 그 장소에서 모은 것 중 이미 사용한 수예요.\n${places}에서 쓰고 남은 것을${grade>=4?' 한데 모았어요.':' 세어 보세요. 남은 수는 몇 개일까요?'}${gift?` 그중 ${gift}개를 친구에게 주었어요. 지금 가지고 있는 것은 몇 개일까요?`:grade>=4?' 모두 몇 개일까요?':''}`;
  q.hints=[hint('문장에서 찾는 장소를 표시해요','물어보는 장소의 가로줄만 찾아봐. 표에 다른 장소가 있어도 전부 더하는 것은 아니야.'),hint('열 제목을 읽어요','‘모은 수’와 ‘쓴 수’를 구분해 봐. 각 장소에서 남은 수를 알려면 같은 줄의 두 수를 어떻게 계산해야 할까?'),hint('이야기 순서대로 확인해요',grade>=4?'먼저 장소마다 남은 수를 구하고 합쳐 봐. 그 뒤에 친구에게 준 것이 있는지도 다시 읽어 봐.':'구한 수가 처음 모은 수가 아니라, 이미 쓴 것을 제외하고 남은 수인지 확인해 봐.')];
 }else{
  const a=3+pick(3),b=1+pick(a-1),c=1+pick(a-b);answer=a-b-c;q.analysis={terms:[a,b,c]};
  if(type==='story_spend_chain'){
   q.prompt=`${first}의 상자에 ${item} ${a}개가 있었어요.\n먼저 ${second}에게 ${b}개를 주고, 그 뒤 ${third}에게 ${c}개를 더 주었어요.\n${first}의 상자에는 몇 개가 남았을까요?`;
   q.hints=[hint('처음 수와 준 수를 찾아요','처음 가진 수와 두 번 나누어 준 수를 구분해 봐. 물어보는 것은 모두 준 뒤 남은 수야.'),hint('첫 번째 일을 먼저 생각해요','처음 가진 수에서 먼저 친구에게 준 수를 빼 봐. 중간에 남은 수를 기억해.'),hint('두 번째 일까지 이어 봐요','중간에 남은 수에서 다음 친구에게 준 수를 다시 빼 봐. 두 번째 수만 빼고 끝내지 않았는지 확인해.')];
  }else{
   q.prompt=`${first}의 ${item}은 ${a}개예요.\n${second}의 ${item}은 ${first}보다 ${b}개 적어요.\n${third}의 ${item}은 ${second}보다 ${c}개 적어요.\n${third}의 ${item}은 몇 개일까요?`;
   q.hints=[hint('마지막에 누구의 수를 묻나요?',`구하려는 것은 ${third}의 수야. 처음 나온 친구의 수를 바로 고르지 않도록 해.`),hint('첫 번째 비교를 풀어요',`${second}의 수를 먼저 찾아봐. ‘적다’는 말은 기준이 되는 수보다 줄어든다는 뜻이야.`),hint('기준이 바뀌는 것을 확인해요',`${third}의 기준은 ${first}이 아니라 ${second}야. 앞에서 구한 수를 기준으로 다음 단서를 이어 봐.`)];
  }
 }
 q.answer=[answer];const values=new Set([answer]);for(const d of shuffle([-10,-2,-1,1,2,10],r))if(answer+d>=0&&answer+d<=99&&values.size<4)values.add(answer+d);q.choices=shuffle([...values].map(value=>({value,label:String(value)})),r);q.hint=q.hints[0].text;return q;
}
