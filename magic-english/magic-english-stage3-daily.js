// Ordinary school conversations share targets with server assessment and use the normal speech rewards.
const phrase=(text,korean)=>({text,korean,required:text.toLowerCase().replace(/[^a-z\s]/g,' ').trim().split(/\s+/).filter(w=>!['a','an','the'].includes(w))});
export const STAGE3_DAILY_TARGETS={
 greet:phrase('Good morning!','좋은 아침이에요!'),
 fine:phrase('I am happy today.','오늘 기분이 좋아요.'),
 name:phrase('My name is Gildong.','내 이름은 길동이에요.'),
 school:phrase('I like my school.','나는 우리 학교가 좋아요.'),
 class:phrase('This is my class.','여기는 우리 반이에요.'),
 ready:phrase('I am ready to learn.','배울 준비가 됐어요.'),
 friend:phrase('Let us go together.','함께 가요.'),
 thanks:phrase('Thank you for helping me.','도와줘서 고마워요.'),
 sunny:phrase('It is sunny today.','오늘은 날씨가 맑아요.'),
 outside:phrase('I want to play outside.','밖에서 놀고 싶어요.'),
 water:phrase('I would like some water, please.','물을 마시고 싶어요.'),
 bus:phrase('I came by bus.','버스를 타고 왔어요.'),
 bag:phrase('I have my school bag.','학교 가방을 가지고 있어요.'),
 safe:phrase('I will walk slowly.','천천히 걸을게요.'),
 bye:phrase('See you tomorrow.','내일 만나요.'),
 book:phrase('I like this book.','이 책이 좋아요.'),
 cat_book:phrase('It is about a cat.','고양이에 관한 책이에요.'),
 read:phrase('Let us read together.','함께 읽어요.'),
 return:phrase('I will put it back.','제자리에 둘게요.'),
 cat:phrase('I can see Coco.','코코가 보여요.'),
 cute:phrase('Coco is a cute cat.','코코는 귀여운 고양이예요.'),
 care:phrase('Let us give Coco some water.','코코에게 물을 줘요.'),
 shy:phrase('I feel a little shy.','조금 부끄러워요.'),
 try:phrase('I will try again.','다시 해 볼게요.'),
 together:phrase('We can do it together.','우리는 함께 할 수 있어요.'),
 help:phrase('Can you help me, please?','나를 도와줄 수 있나요?'),
 with_me:phrase('Please come with me.','나와 함께 와 주세요.'),
 notebook:phrase('I need my notebook.','공책이 필요해요.'),
 pencil:phrase('May I have a pencil, please?','연필을 받을 수 있나요?'),
 share:phrase('We can share the pencils.','연필을 함께 쓸 수 있어요.'),
 tidy:phrase('I will tidy my desk.','책상을 정리할게요.'),
 draw:phrase('I want to draw a cat.','고양이를 그리고 싶어요.'),
 orange:phrase('My cat is orange.','내 고양이는 주황색이에요.'),
 paper:phrase('I need some paper, please.','종이가 필요해요.'),
 show:phrase('Here is my picture.','여기 내 그림이 있어요.'),
 like_picture:phrase('I like your picture.','네 그림이 마음에 들어요.'),
 class_c:phrase('Class starts with C.','Class는 C로 시작해요.'),
 cat_c:phrase('Cat starts with C.','Cat은 C로 시작해요.'),
 come:phrase('Please come here.','이리 와 주세요.'),
 speak:phrase('I can speak with my friends.','친구들과 이야기할 수 있어요.'),
};
// Prefixes keep optional daily speech from satisfying the C story/boss prerequisites.
export const STAGE3_DAILY_PRACTICE=Object.fromEntries(Object.entries(STAGE3_DAILY_TARGETS).map(([key,p])=>['s3_daily_'+key,p]));
const row=(question,korean,key)=>({question,korean,key:'s3_daily_'+key});
export const STAGE3_DAILY_TOPICS={
 welcome:[row('Good morning! What is your name?','좋은 아침! 네 이름은 뭐니?','name'),row('Nice to meet you! How are you today?','만나서 반가워! 오늘 기분이 어때?','fine'),row('I am glad! Shall we go together?','잘됐다! 함께 갈까?','friend')],
 school:[row('Do you like our school?','우리 학교가 마음에 드니?','school'),row('Yes! Where is your class?','그래! 우리 교실을 소개해 볼까?','class'),row('That is right. Are you ready to learn?','맞아. 배울 준비가 됐니?','ready'),row('I can help you.','내가 도와줄게.','thanks')],
 weather:[row('Look outside. How is the weather?','밖을 봐. 날씨가 어때?','sunny'),row('Yes, it is! What would you like to do?','정말 그래! 무엇을 하고 싶니?','outside'),row('After playing, what would you like to drink?','놀고 나면 무엇을 마시고 싶니?','water')],
 bus:[row('How did you come to school?','학교에는 무엇을 타고 왔니?','bus'),row('Great! Do you have your bag?','좋아! 네 가방은 가지고 있니?','bag'),row('Please walk safely near the bus.','버스 근처에서는 조심히 걸어 줘.','safe')],
 books:[row('Which book would you like?','어떤 책을 보고 싶니?','book'),row('What is the book about?','무엇에 관한 책이니?','cat_book'),row('That sounds fun! Shall we read together?','재미있겠다! 함께 읽을까?','read'),row('What will you do when you finish?','다 읽고 나면 어떻게 할까?','return')],
 pet:[row('Who can you see in our classroom?','교실에서 누가 보이니?','cat'),row('Yes! What do you think of Coco?','그래! 코코는 어떤 고양이니?','cute'),row('Coco is thirsty. How can we help?','코코가 목이 마르대. 어떻게 도와줄까?','care')],
 feelings:[row('How do you feel when you speak in class?','교실에서 말할 때 어떤 기분이야?','shy'),row('It is okay. What will you do if you make a mistake?','괜찮아. 실수하면 어떻게 할 거니?','try'),row('I will stay with you. Can we try together?','내가 곁에 있을게. 함께 해 볼까?','together')],
 team:[row('What can you say when you need help?','도움이 필요할 때 어떻게 말할까?','help'),row('Of course! Where shall we go?','물론이지! 함께 가자고 말해 볼래?','with_me'),row('Yes, I will come. Can we do it?','응, 함께 갈게. 우리가 해낼 수 있을까?','together'),row('Thank you for asking me!','함께하자고 말해 줘서 고마워!','thanks')],
 supplies:[row('What do you need for our lesson?','수업에 무엇이 필요하니?','notebook'),row('You have your notebook. What else do you need?','공책이 있구나. 또 무엇이 필요하니?','pencil'),row('We have enough pencils. How can we use them?','연필이 충분해. 어떻게 함께 쓸까?','share'),row('Good idea! What will you do after class?','좋아! 수업 후에는 어떻게 할까?','tidy')],
 art:[row('What would you like to draw?','무엇을 그리고 싶니?','draw'),row('What color is your cat?','네 고양이는 무슨 색이니?','orange'),row('What do you need for your picture?','그림을 그리려면 무엇이 필요하니?','paper'),row('Here is your paper. Can you show me your picture?','여기 종이가 있어. 그림을 보여 줄래?','show'),row('Thank you! Here is my picture too.','고마워! 내 그림도 보여 줄게.','like_picture')],
 sounds:[row('We found our classroom. What does Class start with?','교실을 찾았어. Class는 어떤 글자로 시작하지?','class_c'),row('Correct! What does Cat start with?','맞아! Cat은 어떤 글자로 시작하지?','cat_c'),row('Good! How can you call a friend?','좋아! 친구를 어떻게 부를까?','come'),row('What can you do with your friends?','친구들과 무엇을 할 수 있니?','speak'),row('And if speaking feels hard?','말하기가 어렵게 느껴지면 어떻게 할까?','try')],
 goodbye:[row('It was nice to talk with you.','너와 이야기해서 즐거웠어.','thanks'),row('Will you walk safely?','조심히 걸어갈 거지?','safe'),row('Have a lovely day!','즐거운 하루 보내!','bye')],
};
const profile=(speaker,...topics)=>({speaker,topics});
export const STAGE3_DAILY_PROFILES={
 s3_yard_keeper:profile('학교 관리인','school','weather','welcome'),
 s3_bus_driver:profile('스쿨버스 기사','bus','school','goodbye'),
 s3_yard_student:profile('등교하는 친구','welcome','feelings','team'),
 s3_librarian:profile('도서 선생님','books','school','goodbye'),
 s3_hall_teacher:profile('담임 선생님','school','feelings','team'),
 s3_hall_nurse:profile('보건 선생님','feelings','weather','goodbye'),
 s3_class_lily:profile('릴리','books','pet','art'),
 s3_class_art:profile('미술 선생님','art','supplies','pet'),
 s3_class_helper:profile('보조 선생님','supplies','school','team'),
 s3_room_amy:profile('에이미','pet','supplies','team'),
 s3_room_monitor:profile('도우미 친구','supplies','pet','team'),
 s3_room_caretaker:profile('준비실 선생님','supplies','books','goodbye'),
 s3_hall_student:profile('학교 친구','welcome','school','feelings'),
 s3_class_student:profile('반 친구','pet','books','team'),
 s3_amy:profile('에이미','school','pet','team'),
 s3_teacher:profile('선생님','school','books','art'),
 s3_tommy:profile('토미','feelings','team','pet'),
 s3_ringo:profile('링고','sounds','pet','team'),
 s3_hwalbin:profile('활빈','pet','team','weather'),
 s3_coco_rescued:profile('에이미 · 코코와 함께','pet','art','team'),
};
export const DAILY_FAREWELL='Nice talking with you. See you soon!';
export function createStage3Daily({getState,say,save,update,profiles=STAGE3_DAILY_PROFILES,topics=STAGE3_DAILY_TOPICS,practice=STAGE3_DAILY_PRACTICE,memoryKey='stage3Daily'}){
 function memory(){const state=getState();state.learning??={};state.learning[memoryKey]??={visits:{},active:{},serial:0};return state.learning[memoryKey];}
 function open(id,intro){
  const profile=profiles[id];if(!profile)return false;
  const mem=memory();let session=mem.active[id];
  if(!session){session={serial:++mem.serial,variant:(mem.visits[id]||0)%profile.topics.length,next:0};mem.active[id]=session;save();}
  const rows=topics[profile.topics[session.variant]],pages=[];
  if(intro)pages.push({type:'npc',speaker:profile.speaker,...(typeof intro==='string'?{text:intro}:intro)});
  for(let index=session.next;index<rows.length;index++){
   const row=rows[index],p=practice[row.key];
   pages.push({type:'npc',speaker:profile.speaker,text:`${row.question}\n${row.korean}`,voiceClip:row.question},{type:'speak',speaker:'홍길동 · 내 대답 차례',targetKey:row.key,targetPhrase:p.text,guideClip:p.text,meaningKo:p.korean,noFollowup:true,conversationTurn:index+1,conversationTotal:rows.length,rewardHint:'친구의 말을 듣고 영어 문장으로 대답해 보세요.',onPass:()=>{
    const current=memory().active[id];if(!current||current.serial!==session.serial||current.next!==index)return;
    current.next=index+1;
    if(current.next===rows.length){memory().visits[id]=(memory().visits[id]||0)+1;delete memory().active[id];}
    save();update();
   }});
  }
  pages.push({type:'npc',speaker:profile.speaker,text:'이야기해 줘서 고마워! 다음에 또 만나자.',voiceClip:DAILY_FAREWELL,rewardBanner:'잘했어요! 친구와 마음을 나눴어요.'});
  say(profile.speaker+' · 일상 대화',pages);return true;
 }
 return {open};
}
