// New story problems using additive structures; no copied workbook wording.
export const STORY_LABELS={story_compare:'친구보다 더 모으기',story_combine:'친구들과 함께 모으기',story_receive:'선물 받고 더 모으기',story_three:'세 곳에서 모으기',story_chain:'친구들의 단서 잇기',story_distance:'모험 길 이어 걷기'};
export const STORY_TYPES=Object.keys(STORY_LABELS);
const NAMES=['스티브','알렉스','피글린','엔더맨','주민','마녀','스켈레톤','좀비','크리퍼','워든','브리즈','엔더기사'];
const ITEMS=['다이아몬드','에메랄드','철괴','당근','횃불','사과','블록','씨앗'];
const PLACES=['광산','농장','마을','숲','요새','동굴'];
const particle=(name,pair)=>name+pair[(name.charCodeAt(name.length-1)-44032)%28?0:1];
const subject=name=>particle(name,['이','가']),topic=name=>particle(name,['은','는']),object=name=>particle(name,['을','를']);
function actors(index){return [NAMES[index%NAMES.length],NAMES[(index+1)%NAMES.length],NAMES[(index+2)%NAMES.length]];}
export function minecraftCombineText(a,b){
 const [first,second]=actors((a+b)%NAMES.length),item=ITEMS[a%ITEMS.length];
 return `${topic(first)} ${item} ${a}개를 모았어요.\n${subject(second)} ${item} ${b}개를 더 가져왔어요.\n두 친구가 모은 ${topic(item)} 모두 몇 개일까요?`;
}
const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function minecraftStory(type,grade,r){
 const pick=n=>Math.floor(r()*n),[first,second,third]=actors(pick(NAMES.length)),item=ITEMS[pick(ITEMS.length)],place=pick(PLACES.length);
 const a=10+pick(grade===1?40:60),b=1+pick(grade===1?9:20),c=1+pick(Math.min(9,99-a-b));
 let terms=[a,b],prompt,focus,reason;
 const q={type,grade,learning:true,story:true,label:STORY_LABELS[type],title:'이야기를 읽고 공격의 힘을 모아 줘!',instruction:'누구의 수를 묻는지 읽고, 답 조각을 누르거나 빈칸으로 끌어 놓아 줘.',models:[],equation:null,operator:'+'};
 if(type==='story_compare'){
  prompt=`${topic(first)} ${PLACES[place]}에서 ${item} ${a}개를 모았어요.\n${topic(second)} ${first}보다 ${object(item)} ${b}개 더 모았어요.\n${second}의 ${topic(item)} 모두 몇 개일까요?`;
  focus=`구하려는 것은 ${second}의 ${item} 수야.`;reason=`${first}의 ${a}개에서 ${b}개 더 많으니, 기준 수에 더 모은 수를 더해 줘.`;
 }else if(type==='story_combine'){
  prompt=`${topic(first)} ${PLACES[place]}에서 ${item} ${a}개를 모았어요.\n${subject(second)} ${PLACES[(place+1)%PLACES.length]}에서 ${item} ${b}개를 모았어요.\n두 친구가 모은 ${topic(item)} 모두 몇 개일까요?`;
  focus='두 친구가 모은 것을 한데 합친 수를 구해 봐.';reason=`첫 친구의 ${a}개와 둘째 친구의 ${b}개를 함께 세어 봐.`;
 }else if(type==='story_receive'){
  prompt=`${topic(first)} 배낭에 ${item} ${a}개를 가지고 있었어요.\n${subject(second)} ${first}에게 ${item} ${b}개를 선물했어요.\n이제 ${first}의 배낭에는 ${subject(item)} 모두 몇 개일까요?`;
  focus=`선물을 받은 뒤 ${first}의 배낭 속 수를 구해 봐.`;reason=`처음 가진 ${a}개에 새로 받은 ${b}개를 더해 줘.`;
 }else if(type==='story_three'){
  terms=[a,b,c];prompt=`${topic(first)} ${PLACES[place]}에서 ${item} ${a}개를 모았어요.\n${PLACES[(place+1)%PLACES.length]}에서 ${b}개, ${PLACES[(place+2)%PLACES.length]}에서 ${c}개를 더 모았어요.\n${subject(first)} 모은 ${topic(item)} 모두 몇 개일까요?`;
  focus='세 장소에서 모은 수를 모두 찾아봐.';reason='처음 두 수를 더하고, 셋째 장소에서 모은 수도 더해 줘.';
 }else if(type==='story_chain'){
  terms=[a,b,c];prompt=`${topic(first)} ${item} ${a}개를 모았어요.\n${topic(second)} ${first}보다 ${b}개 더, ${topic(third)} ${second}보다 ${c}개 더 모았어요.\n${third}의 ${topic(item)} 모두 몇 개일까요?`;
  focus=`마지막 친구인 ${third}의 수를 구해 봐.`;reason=`먼저 ${a}개에 ${b}개를 더해서 ${second}의 수를 구하고, 거기에 ${c}개를 더해 줘.`;
 }else{
  prompt=`${topic(first)} ${subject(second)} 있는 마을로 가고 있어요.\n출발점에서 다리까지 ${a}칸, 다리에서 마을까지 ${b}칸을 걸어야 해요.\n출발점에서 마을까지 모두 몇 칸을 걸어야 할까요?`;
  focus='처음 길과 다음 길을 이어 걸은 거리를 구해 봐.';reason=`다리까지 ${a}칸, 그다음 ${b}칸을 더 걸어.`;
 }
 const answer=terms.reduce((sum,n)=>sum+n,0),expression=terms.join(' + ');
 q.prompt=prompt;q.storyModel={kind:type,actors:[first,second,third],item,unit:type==='story_distance'?'칸':'개',terms,answer};q.answer=[answer];
 const ones=terms.reduce((sum,n)=>sum+n%10,0);
 q.hints=[{title:'무엇을 묻는지 읽어요',text:focus},{title:'주어진 수를 연결해요',text:reason},
  {title:ones>=10?'낱개 10개를 묶어요':'덧셈으로 확인해요',text:`${expression}으로 생각해 봐. `+(ones>=10?`일의 자리끼리 모으면 ${ones}개야. 낱개 10개마다 십 묶음 하나로 바꾸고 함께 더해 줘.`:'십의 자리끼리, 일의 자리끼리 더해서 확인해 봐.')}];q.hint=q.hints[0].text;
 const candidates=new Set([answer]);
 // Include the reference quantity and the difference as meaningful distractors.
 for(const n of [a,b,2*a+b,answer-1,answer+1])if(n>=0&&n<=99&&candidates.size<4)candidates.add(n);
 q.choices=shuffle([...candidates].map(value=>({value,label:String(value)})),r);return q;
}
