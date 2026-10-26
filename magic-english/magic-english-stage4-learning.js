// Episode 4: complete, ordered requests. Please is required in polite-request targets.
const p=(text,korean)=>({text,korean,required:text.toLowerCase().replace(/[^a-z\s]/g,' ').trim().split(/\s+/).filter(w=>!['a','an','the'].includes(w))});
export const STAGE4_PRACTICE={
 s4_open:p('Open the door, please.','문을 열어 주세요.'),
 s4_enter:p('May I come in, please?','들어가도 될까요?'),
 s4_thanks:p('Thank you!','고맙습니다!'),
 s4_drink:p('May I have a drink, please?','음료를 받을 수 있을까요?'),
 s4_water:p('I would like water, please.','물을 주세요.'),
 s4_dish:p('I would like a dish, please.','음식을 한 접시 주세요.'),
 s4_share:p('Let us share this dish.','이 음식을 함께 나눠요.'),
 s4_delicious:p('It is delicious!','아주 맛있어요!'),
 s4_smell:p('It smells delicious.','맛있는 냄새가 나요.'),
 s4_ready:p('I am ready for lunch.','점심을 먹을 준비가 됐어요.'),
 s4_meal_delicious:p('It is delicious!','아주 맛있어요!'),
 s4_meal_thanks:p('Thank you for the dish.','음식을 주셔서 고마워요.'),
 s4_meal_finish:p('Thank you very much.','정말 고맙습니다.'),
};
for(const [key,source]of Object.entries({s4_boss_water:'s4_water',s4_boss_order:'s4_drink',s4_boss_thanks:'s4_thanks'}))STAGE4_PRACTICE[key]={...STAGE4_PRACTICE[source]};
export const STAGE4_REQUIRED=['s4_open','s4_drink','s4_dish','s4_delicious','s4_boss_water','s4_boss_order','s4_boss_thanks'];
export const STAGE4_CLEAR_REQUIRED=['s4_meal_delicious','s4_meal_thanks','s4_meal_finish'];
export const STAGE4_TRAINS={
 water:{target:'s4_water',tokens:['I','would','like','water','please'],korean:'물을 정중하게 부탁해요.'},
 order:{target:'s4_drink',tokens:['May','I','have','a','drink','please'],korean:'음료를 받을 수 있는지 정중하게 물어요.'},
 dish:{target:'s4_dish',tokens:['I','would','like','a','dish','please'],korean:'음식을 한 접시 부탁해요.'},
};
