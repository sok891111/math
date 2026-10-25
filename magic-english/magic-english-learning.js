// Recognition measures understood text, not acoustic pronunciation accuracy.
export const SPEECH_TARGETS = {
 full:'Excuse me. Can I ask?', excuse_me:'Excuse me.', can_i_ask:'Can I ask?',
 i_am_okay:'I am okay.', good_morning:'Good morning!', i_am_gildong:'I am Gildong.',
 yes_please:'Yes, please!', thank_you:'Thank you!', help_please:'My friend. Help, please!',
 where_bus:'Where is the bus?', my_bag:'My bag!', big_bus:'Big bus!', it_is_big:'It is big.',
 airplane:'Airplane', apple:'Apple', ask:'Ask', bus:'Bus', bag:'Bag', big:'Big',
};
import {evaluateWordSimilarity60} from './magic-english-speech.js';
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z\s]/g,' ').replace(/\s+/g,' ').trim();
export function assessLearningSpeech(transcript,target){
 const aliases={bus:['버스','버쓰','버즈','buzz','buss','buses','b u s'],bag:['백','배그'],big:['빅','비그']};
 const raw=String(transcript||'').replace(/[.!?,]/g,'').trim();
 const ideal=normalize(SPEECH_TARGETS[target]||target), heard=aliases[target]?.includes(raw)?target:normalize(transcript);
 const words=ideal.split(' '), tokens=heard.split(' ');
 const complete=heard===ideal;
 const meaningful=words.filter(w=>!['i','am','is','the','a','can','my','it','me'].includes(w));
 const passed=complete||meaningful.some(w=>tokens.includes(w))||(words.length===1&&!!heard&&evaluateWordSimilarity60(heard,ideal).passed);
 return {passed,quality:!passed?'unheard':complete&&words.length>1?'complete':'partial',quantity:!passed?0:complete&&words.length>1?2:1,
 message:!passed?'목소리가 잘 들리지 않았어. 다음에 다시 이야기하자!':complete&&words.length>1?'문장 전체를 말했네! 네 마음이 잘 전달됐어!':'네 말이 들렸어! 이야기해 줘서 고마워!',transcript:heard,target};
}
export function ensureLearningState(state){
 state.learning??={}; state.learning.failures??=0; state.learning.visits??={}; state.learning.sequence??=0; state.learning.pending??=[];
 return state.learning;
}
export const REPEAT_DIALOGUES={
 npc_traveler:[['How are you today?','I am okay.','i_am_okay'],['Oh, you are back! Are you okay?','I am okay.','i_am_okay'],['I found the exit! Thank you!','Thank you!','thank_you']],
 npc_pilot:[['Good morning, my friend!','Good morning!','good_morning'],['A new flight today! Can you see the airplane?','Airplane','airplane'],['Thank you for visiting me again!','Thank you!','thank_you']],
 npc_guard:[['Hello! What is your name?','I am Gildong.','i_am_gildong'],['Welcome back! How are you?','I am okay.','i_am_okay'],['Good morning, Gildong!','Good morning!','good_morning']],
 npc_cafe:[['Would you like an apple?','Yes, please!','yes_please'],['What fruit would you like today?','Apple','apple'],['Here is your apple!','Thank you!','thank_you']],
 npc_kid_traveler:[['Here is a gift for you!','Thank you!','thank_you'],['Want to play with me?','Yes, please!','yes_please'],['Look up! What can you see?','Airplane','airplane']],
 npc_amy:[['Can you ask me a question?','Excuse me. Can I ask?','full'],['What do we say when a friend helps?','Thank you!','thank_you'],['Your friend needs help. What can you say?','My friend. Help, please!','help_please']],
 npc_ringo:[['Can you ask me a question?','Excuse me. Can I ask?','full'],['Which fruit did we find?','Apple','apple'],['What flies in the sky?','Airplane','airplane']],
 npc_staff:[['Welcome back! Can I help you?','Excuse me. Can I ask?','full'],['Your friend is safe now!','Thank you!','thank_you'],['Would you like some help?','Yes, please!','yes_please']],
 npc_hwalbin:[['Thank you for finding me!','Thank you!','thank_you'],['Want to travel together?','Yes, please!','yes_please'],['What is in the sky?','Airplane','airplane']],
 s2_nono:[['No! No! That is not the bus!','Where is the bus?','where_bus'],['No! Is that a small car?','Big bus!','big_bus'],['No! Do not look at the sign!','Bus','bus']],
 s2_ungeori:[['Um... where... is... it?','Where is the bus?','where_bus'],['Hmm... is that bus small?','It is big.','it_is_big'],['Mumble... what is in your hand?','My bag!','my_bag']],
 s2_copycat:[['Gab! Gab! What are you looking for?','My bag!','my_bag'],['Sub! Sub! What are we riding?','Bus','bus'],['Gib! Gib! Look at that blue bus!','Big bus!','big_bus']],
 s2_commuter:[['Good morning! Are you waiting for the bus?','Where is the bus?','where_bus'],['Look! That blue bus is coming!','Big bus!','big_bus'],['Have a safe trip today!','Thank you!','thank_you']],
 s2_student:[['Hi! I have my school bag! What about you?','My bag!','my_bag'],['Look at the big blue bus over there!','It is big.','it_is_big'],['Good morning, my friend!','Good morning!','good_morning']],
 s2_passenger:[['Excuse me! Are you looking for the big bus?','Where is the bus?','where_bus'],['Do not worry! You can ask the driver!','Excuse me. Can I ask?','full'],['Good luck finding your bag!','Thank you!','thank_you']],
};
