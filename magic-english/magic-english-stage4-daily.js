import {STAGE3_DAILY_TOPICS,STAGE3_DAILY_PRACTICE,createStage3Daily} from './magic-english-stage3-daily.js';
const phrase=(text,korean)=>({text,korean,required:text.toLowerCase().replace(/[^a-z\s]/g,' ').trim().split(/\s+/).filter(w=>!['a','an','the'].includes(w))});
export const STAGE4_DAILY_PRACTICE=Object.fromEntries(Object.entries(STAGE3_DAILY_PRACTICE).map(([key,p])=>[key.replace('s3_','s4_'),p]));
Object.assign(STAGE4_DAILY_PRACTICE,{
 s4_daily_lunch:phrase('I would like lunch, please.','점심을 먹고 싶어요.'),
 s4_daily_drink:phrase('May I have a drink, please?','음료를 받을 수 있을까요?'),
 s4_daily_dish:phrase('I would like a dish, please.','음식을 한 접시 주세요.'),
 s4_daily_delicious:phrase('It is delicious!','아주 맛있어요!'),
 s4_daily_line:phrase('I will wait in line.','줄을 서서 기다릴게요.'),
 s4_daily_wash:phrase('I will wash my hands.','손을 씻을게요.'),
 s4_daily_tray:phrase('I will return my tray.','식판을 반납할게요.'),
 s4_daily_please:phrase('Please and thank you.','부탁할 때와 고마울 때 하는 말이에요.'),
});
const row=(question,korean,key)=>({question,korean,key:'s4_daily_'+key});
export const STAGE4_DAILY_TOPICS=Object.fromEntries(Object.entries(STAGE3_DAILY_TOPICS).map(([id,rows])=>[id,rows.map(r=>({...r,key:r.key.replace('s3_','s4_')}))]));
Object.assign(STAGE4_DAILY_TOPICS,{
 lunch:[row('What would you like for lunch?','점심으로 무엇을 먹고 싶니?','lunch'),row('What would you like to drink?','무엇을 마시고 싶니?','drink'),row('How does the food taste?','음식 맛이 어떠니?','delicious')],
 queue:[row('What will you do before lunch?','밥 먹기 전에 무엇을 할까?','wash'),row('There are other children here. What will you do?','친구들이 기다리고 있네. 어떻게 할까?','line'),row('What will you do after eating?','식사 후에는 무엇을 할까?','tray')],
 order:[row('What would you like?','무엇을 드릴까요?','dish'),row('Would you like a drink too?','음료도 필요하니?','drink'),row('Here you are.','자, 여기 있어.','thanks'),row('How is your lunch?','점심 맛이 어때?','delicious')],
 polite:[row('Which words make a request polite?','부탁할 때와 받았을 때 무슨 말을 할까?','please'),row('Now ask for your lunch.','이번에는 점심을 정중하게 부탁해 봐.','lunch'),row('And what would you like to drink?','무엇을 마시고 싶니?','drink'),row('Here you are!','자, 여기 있어!','thanks'),row('Shall we eat together?','함께 먹을까?','friend')],
});
const profile=(speaker,...topics)=>({speaker,topics});
export const STAGE4_DAILY_PROFILES={
 s4_amy:profile('에이미','lunch','order','team'),
 s4_entrance_student:profile('학교 친구','queue','lunch','weather'),
 s4_cleaner:profile('학교 관리인','queue','supplies','goodbye'),
 s4_tommy:profile('토미','lunch','feelings','team'),
 s4_hall_student:profile('반 친구','order','queue','pet'),
 s4_hall_monitor:profile('도우미 친구','queue','team','lunch'),
 s4_daisy:profile('미즈 데이지','order','lunch','polite'),
 s4_chef:profile('조리사','lunch','supplies','queue'),
 s4_helper:profile('배식 도우미','order','queue','polite'),
 s4_ringo:profile('링고','polite','order','team'),
 s4_tutor:profile('선생님','polite','books','order'),
 s4_workshop_student:profile('학교 친구','order','team','lunch'),
 s4_hwalbin:profile('활빈','lunch','order','pet'),
};
export function createStage4Daily(options){return createStage3Daily({...options,profiles:STAGE4_DAILY_PROFILES,topics:STAGE4_DAILY_TOPICS,practice:STAGE4_DAILY_PRACTICE,memoryKey:'stage4Daily'});}
