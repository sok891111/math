import {STAGE3_DAILY_PRACTICE,STAGE3_DAILY_PROFILES,STAGE3_DAILY_TOPICS} from '../magic-english-stage3-daily.js';
import {STAGE4_DAILY_PROFILES,STAGE4_DAILY_TOPICS} from '../magic-english-stage4-daily.js';
export const MOB_CAST={zombie:{name:'졸린 좀비',emoji:'🧟',character:'mob_zombie',color:'#64896a'},creeper:{name:'수줍은 크리퍼',emoji:'💚',character:'mob_creeper',color:'#719f48'},pig:{name:'꿀꿀 카페 사장님',emoji:'🐷',character:'mob_pig',color:'#bf8791'},chicken:{name:'꼬꼬 발표왕',emoji:'🐔',character:'mob_chicken',color:'#b89c53'}};
const r=(key,question,korean)=>({target:'s3_daily_'+key,question,korean});
const s=(id,type,title,intro,ending,...rows)=>({id,type,title,intro,ending,rows});
export const MOB_SCRIPTS=[
 s('zombie-school','zombie','좀비의 늦잠 등교','좀비가 하품하며 가방을 뒤적여요. 밤인데 아침 인사를 하려나 봐요!','Good morning... or good night! You are my friend!',r('greet','Yaaawn! Is it morning already? Say good morning!','하아암! 벌써 아침이야? 아침 인사를 해 줄래?'),r('name','My name is Zzzombie. What is your name?','내 이름은 즈으으좀비. 네 이름은 뭐니?'),r('fine','I am sleepy, but friendly! How are you today?','나는 졸리지만 친절한 좀비야! 오늘 기분이 어때?'),r('friend','My legs are slow. Shall we go together?','다리가 느릿느릿해. 우리 함께 갈까?')),
 s('zombie-book','zombie','좀비 독서 클럽','좀비가 책을 거꾸로 들고 있어요. 무서운 책 대신 고양이 책이래요.','A cat book! Much better than chasing people. Thank you!',r('book','I found a book! Which book do you like?','책을 찾았어! 어떤 책이 마음에 드니?'),r('cat_book','Is this a scary book? What is it about?','이거 무서운 책이야? 무엇에 관한 책이지?'),r('read','Phew! A cat! Shall we read together?','휴! 고양이구나! 우리 함께 읽을까?')),
 s('creeper-calm','creeper','펑 대신 부탁하기','크리퍼가 폭발 버튼 대신 작은 손수건을 꺼내요. 오늘은 말이 펑 터질 차례예요!','Sss... success! Polite words, no explosion!',r('shy','Sss... I get nervous too. How do you feel?','스스… 나도 긴장돼. 너는 어떤 기분이야?'),r('help','My words got stuck! How can you ask for help?','말문이 막혔어! 도움을 부탁하려면 어떻게 말할까?'),r('together','We can use words instead of a big boom. Can we try together?','큰 폭발 대신 말을 쓰자. 우리 함께 해 볼까?'),r('thanks','Here is a calm little smile. What can you say?','마음을 가라앉히는 미소를 줄게. 뭐라고 말할까?')),
 s('creeper-art','creeper','폭발적인 그림 발표','크리퍼의 작품 제목은 「폭발하지 않은 하루」예요. 종이가 필요하대요!','Your picture is a real blast! A happy blast!',r('paper','I used my paper for confetti! What do you need?','종이를 모두 꽃가루로 써 버렸어! 무엇이 필요하니?'),r('draw','No explosions today. What would you like to draw?','오늘은 폭발 금지! 무엇을 그리고 싶니?'),r('show','My hands are shaking. Can you show me your picture?','손이 떨려. 네 그림을 보여 줄래?'),r('like_picture','Look! I drew a cat with square ears. Do you like my picture?','봐! 네모난 귀의 고양이를 그렸어. 내 그림이 마음에 드니?'),r('try','Oops! My cat looks like a potato. What can we do?','앗! 고양이가 감자처럼 보여. 어떻게 하면 될까?')),
 s('pig-cafe','pig','꿀꿀 카페 물 한 잔','돼지가 작은 카페 간판을 세워요. 메뉴판에는 꿀꿀, 꿀꿀꿀만 적혀 있어요!','Oink! One happy customer. Come back to my cafe!',r('water','Welcome to Oink Cafe! What would you like to drink?','꿀꿀 카페에 오신 걸 환영해요! 무엇을 마시고 싶나요?'),r('thanks','Here is your water. I carried it with my snout!','여기 물이 있어요. 코로 조심조심 옮겼답니다!'),r('friend','My cafe is tiny. Shall we go to a bigger one together?','카페가 너무 작네요. 함께 더 큰 카페로 갈까요?')),
 s('pig-picnic','pig','진흙 없는 소풍','돼지가 진흙 목욕 대신 소풍을 준비해요. 도시락 가방을 코에 걸었어요!','Oink! A slow walk and a sunny picnic. Perfect!',r('sunny','My mud puddle is sparkling! How is the weather?','내 진흙 웅덩이가 반짝여! 날씨가 어때?'),r('outside','I want a mud-free adventure. What would you like to do?','이번엔 진흙 없는 모험이 좋아. 무엇을 하고 싶니?'),r('bag','I packed three apples. Do you have your school bag?','사과 세 개를 챙겼어. 학교 가방은 가지고 있니?'),r('safe','My tiny legs cannot run fast. Will you walk safely?','짧은 다리로는 빨리 못 뛰어. 천천히 걸어 줄래?')),
 s('chicken-school','chicken','알 대신 숙제','닭이 둥지에서 공책을 꺼내요. 오늘 낳은 건 알이 아니라 숙제였대요!','Cluck! Sharing pencils is easier than laying homework!',r('notebook','Cluck! I put an egg in my school bag. What do you need?','꼬꼬! 가방에 달걀을 넣어 버렸네. 무엇이 필요하니?'),r('pencil','I only brought a feather. How can you ask for a pencil?','깃털만 가져왔어. 연필을 정중하게 부탁해 볼까?'),r('share','One pencil, two little wings! Can we share?','연필 하나에 작은 날개 둘! 함께 쓸 수 있을까?'),r('tidy','Feathers everywhere! What will you do with your desk?','깃털이 사방에 날렸네! 책상을 어떻게 할까?')),
 s('chicken-stage','chicken','꼬꼬의 첫 발표','닭이 가슴을 펴고 무대에 올라요. 꼬끼오 대신 영어 발표를 해 보고 싶대요!','Cluck cluck! We spoke English. See you tomorrow!',r('name','Cock-a-doodle... hello! What is your name?','꼬끼… 안녕! 네 이름은 뭐니?'),r('shy','My knees are wobbling like jelly. How do you feel?','무릎이 젤리처럼 흔들려. 너는 어떤 기분이야?'),r('try','Oops, I said cluck again! What can we do?','앗, 또 꼬꼬라고 했어! 어떻게 하면 될까?'),r('speak','We found our brave voices! What can you do with your friends?','용기 있는 목소리를 찾았어! 친구들과 무엇을 할 수 있니?'),r('bye','The rooster show is over! What will you say before we go?','꼬꼬 공연 끝! 가기 전에 무슨 인사를 할까?')),
];
for(const [type,cast]of Object.entries(MOB_CAST))MOB_SCRIPTS.push(s(type+'-hello',type,'처음 만난 '+cast.name,cast.name+'도 친구가 되고 싶대요. 배운 인사로 이야기를 시작해 봐요!',type==='zombie'?'Yaaawn! A friend is better than a chase!':type==='creeper'?'Sss... a new friend! No boom needed!':type==='pig'?'Oink! A new friend for my cafe!':'Cluck! We are brave friends now!',r('greet',type==='zombie'?'Yaaawn! I slept all day. Can you say good morning?':type==='creeper'?'Sss... that is my hello! Can you say good morning?':type==='pig'?'Oink oink! Welcome to my cafe. Good morning!':'Cock-a-doodle-doo! Can you say good morning?','친구에게 좋은 아침 인사를 해 줘요.'),r('fine','I am happy to meet you! How are you today?','만나서 반가워! 오늘 기분이 어때?'),r('friend','Shall we go together, my new friend?','새 친구야, 우리 함께 갈까?')));
export function learnedDailyTargets(adventure){
 const targets=new Set(Object.keys(adventure?.learning?.practicedTargets||{}).map(key=>key.replace(/^s4_/,'s3_')));
 for(const [memory,profiles,topics]of [['stage3Daily',STAGE3_DAILY_PROFILES,STAGE3_DAILY_TOPICS],['stage4Daily',STAGE4_DAILY_PROFILES,STAGE4_DAILY_TOPICS]]){
  const data=adventure?.learning?.[memory];if(!data)continue;
  for(const [id,count]of Object.entries(data.visits||{})){const p=profiles[id];if(!p)continue;for(let i=0;i<Math.min(count,p.topics.length);i++)for(const row of topics[p.topics[i]])targets.add(row.key.replace(/^s4_/,'s3_'));}
  for(const [id,active]of Object.entries(data.active||{})){const p=profiles[id];if(!p)continue;for(const row of (topics[p.topics[active.variant]]||[]).slice(0,active.next))targets.add(row.key.replace(/^s4_/,'s3_'));}
 }
 return targets;
}
export const mobScript=id=>MOB_SCRIPTS.find(s=>s.id===id);
export const mobPractice=target=>STAGE3_DAILY_PRACTICE[target];
export function newMobLearning(){return {version:1,serial:0,counts:{},recent:[],queue:[]};}
export function validateMobLearning(value){
 if(value===undefined)return;
 if(!value||value.version!==1||!Number.isSafeInteger(value.serial)||value.serial<0||!value.counts||Array.isArray(value.counts)||Object.entries(value.counts).some(([k,v])=>!MOB_CAST[k]||!Number.isSafeInteger(v)||v<0)||!Array.isArray(value.recent)||value.recent.length>32||value.recent.some(x=>typeof x!=='string'||x.length>100)||!Array.isArray(value.queue)||value.queue.length>24)throw Error('몬스터 대화 기록이 올바르지 않습니다.');
 const ids=new Set();for(const item of value.queue){const script=mobScript(item?.script);if(!script||typeof item.id!=='string'||item.id.length>100||ids.has(item.id)||!Number.isInteger(item.next)||item.next<0||item.next>=script.rows.length)throw Error('몬스터 대화 차례가 올바르지 않습니다.');ids.add(item.id);}
}
export function enqueueMobConversation(state,type,id,learned=new Set()){
 validateMobLearning(state);if(!MOB_CAST[type]||state.recent.includes(id)||state.queue.some(s=>s.id===id))return false;
 if(state.queue.length>=24)throw Error('먼저 기다리는 친구와 대화해 주세요.');
 const candidates=MOB_SCRIPTS.filter(s=>s.type===type),score=s=>s.rows.filter(r=>learned.has(r.target)).length/s.rows.length;
 const max=Math.max(...candidates.map(score)),best=max?candidates.filter(s=>score(s)===max):candidates.filter(s=>s.id===type+'-hello');
 const index=state.counts[type]||0,script=best[index%best.length];state.counts[type]=index+1;state.serial++;state.queue.push({id,script:script.id,next:0});return true;
}
export function advanceMobConversation(state,id,turn){
 const item=state.queue[0];if(!item||item.id!==id||item.next!==turn)return false;
 item.next++;if(item.next===mobScript(item.script).rows.length){state.queue.shift();state.recent=[...state.recent,id].slice(-32);}return true;
}
