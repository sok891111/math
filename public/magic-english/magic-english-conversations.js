import {practiceStep} from './magic-english-practice.js';
// Each row is an NPC reaction/question followed by a new player utterance.
export const CONVERSATION_FOLLOWUPS={
 airplane:[['Yes, it is flying! Where do you want to go?','I want to go to school.','go_school','학교에 가고 싶어요.'],['I can help you. Shall we go together?','Let us go together.','go_together','함께 가요.']],
 apple:[['An apple sounds good! What color is it?','The apple is red.','apple_red','사과는 빨간색이에요.'],['Yes, it is! Would you like some water too?','I would like some water, please.','want_water','물도 마시고 싶어요.']],
 ask:[['Of course! What do you want to know?','Where is the exit?','where_exit','출구가 어디에 있나요?'],['It is over there. Can you see the green sign?','I can see the green sign.','green_sign','초록색 표지판이 보여요.'],['That is the way! Do you need a friend to come?','Please come with me.','come_with_me','나와 함께 가 주세요.']],
 bus:[['Yes, our bus is here! What color is it?','The bus is blue.','bus_blue','버스는 파란색이에요.'],['That is our bus. Are you ready to get on?','I am ready to go.','ready_go','갈 준비가 됐어요.']],
 bag:[['Let us look for your bag. What color is it?','My bag is brown.','bag_brown','내 가방은 갈색이에요.'],['I see a brown bag. What is inside yours?','I have some food in my bag.','bag_food','가방에 음식이 있어요.'],['Then this must be yours. Can you carry it?','Please help me carry my bag.','carry_bag','가방 드는 것을 도와주세요.']],
 big:[['Yes, it is! Can you see the door?','Please open the door.','open_door','문을 열어 주세요.']],
 i_am_okay:[['I am glad! What would you like to do?','I want to find my friend.','find_friend','친구를 찾고 싶어요.'],['Let us look together. What can I do?','Please come with me.','come_with_me','나와 함께 가 주세요.']],
 good_morning:[['Good morning! What can you see outside?','I can see a big airplane.','big_airplane','큰 비행기가 보여요.']],
 i_am_gildong:[['Nice to meet you! What are you looking for?','I am looking for my friend.','looking_friend','친구를 찾고 있어요.'],['I will help you. Where shall we look first?','Let us look near the exit.','look_exit','출구 근처를 찾아봐요.'],['Good idea! Shall we walk together?','Please come with me.','come_with_me','나와 함께 가 주세요.']],
 yes_please:[['Here you are! What else would you like?','I would like some water, please.','want_water','물을 마시고 싶어요.'],['Here is your water. Where will you sit?','I want to sit here.','sit_here','여기에 앉고 싶어요.'],['This seat is free. Do you need any help?','Can you help me, please?','help_me','나를 도와줄 수 있나요?'],['Of course! I will stay with you.','Thank you for helping me.','thanks_help','도와줘서 고마워요.']],
 thank_you:[['You are welcome! What shall we do next?','Let us go together.','go_together','함께 가요.']],
 full:[['Of course! What are you looking for?','I am looking for my friend.','looking_friend','친구를 찾고 있어요.'],['Let us find your friend. Where shall we look?','Let us look near the exit.','look_exit','출구 근처를 찾아봐요.']],
 help_please:[['I will help! Where should we look?','Let us look near the exit.','look_exit','출구 근처를 찾아봐요.']],
 where_bus:[['The bus is over there. Which one do you want?','I want to take the blue bus.','take_blue_bus','파란 버스를 타고 싶어요.'],['That is the right bus. Do you have your bag?','I have my bag with me.','have_bag','가방을 가지고 있어요.']],
};
CONVERSATION_FOLLOWUPS.big_bus=CONVERSATION_FOLLOWUPS.big;
CONVERSATION_FOLLOWUPS.my_bag=CONVERSATION_FOLLOWUPS.bag;
CONVERSATION_FOLLOWUPS.it_is_big=CONVERSATION_FOLLOWUPS.big;
export const CONVERSATION_TARGETS=Object.fromEntries(Object.values(CONVERSATION_FOLLOWUPS).flat().map(([,text,key,korean])=>[key,{text,korean,required:text.toLowerCase().replace(/[^a-z\s]/g,'').split(' ').filter(w=>!['a','an','the','some','please'].includes(w))}]));
export function conversationPages(pages,speaker='에이미'){
 let result=pages.map(practiceStep),count=result.filter(p=>p?.type==='speak').length;
 if(count===1&&!result.some(p=>p?.noFollowup)){const index=result.findIndex(p=>p?.type==='speak'),first=result[index],rows=CONVERSATION_FOLLOWUPS[first.targetKey]||CONVERSATION_FOLLOWUPS.thank_you;
 const prior=result.slice(0,index).findLast(p=>p?.type==='npc');let partner=prior?.speaker||speaker;if(/홍길동|단서|발견|말하기|조사/.test(partner))partner='에이미';
 const {onPass,...start}=first,extra=[];
 for(const [question,phrase,key,korean]of rows){extra.push({type:'npc',speaker:partner,text:question,voiceClip:question},{type:'speak',speaker:'홍길동 · 영어로 답하기',prompt:'친구의 질문을 듣고 영어로 대답해 보세요!',targetPhrase:phrase,targetKey:key,guideClip:phrase,meaningKo:korean,rewardHint:'친구의 말을 듣고 영어 문장으로 대답해 보세요.',conversationGenerated:true});}
 extra.at(-1).onPass=onPass;
 result.splice(index,1,start,...extra);count=1+rows.length;
 }
 let turn=0;return result.map(p=>{if(p?.type!=='speak')return p;turn++;return {...p,conversationTurn:p.conversationTurn??turn,conversationTotal:p.conversationTotal??count};});
}
