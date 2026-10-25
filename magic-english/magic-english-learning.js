import {CONVERSATION_TARGETS} from './magic-english-conversations.js';
import {SENTENCE_PRACTICE,sentenceAssessment,assessSentencePractice} from './magic-english-practice.js';
// Recognition measures understood text, not acoustic pronunciation accuracy.
export const SPEECH_TARGETS = {
 ...Object.fromEntries(Object.entries(CONVERSATION_TARGETS).map(([key,p])=>[key,p.text])),
 full:'Excuse me. Can I ask?', excuse_me:'Excuse me.', can_i_ask:'Can I ask?',
 i_am_okay:'I am okay.', good_morning:'Good morning!', i_am_gildong:'I am Gildong.',
 yes_please:'Yes, please!', thank_you:'Thank you!', help_please:'My friend. Help, please!',
 where_bus:'Where is the bus?', my_bag:'My bag!', big_bus:'Big bus!', it_is_big:'It is big.',
 ...Object.fromEntries(Object.entries(SENTENCE_PRACTICE).map(([key,practice])=>[key,practice.text])),
};
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z\s]/g,' ').replace(/\s+/g,' ').trim();
export function assessLearningSpeech(transcript,target){
 const sentence=CONVERSATION_TARGETS[target]?assessSentencePractice(transcript,target,CONVERSATION_TARGETS[target]):sentenceAssessment(transcript,target);if(sentence)return sentence;
 const phrase=SPEECH_TARGETS[target];
 if(!phrase)return {passed:false,quality:'unheard',quantity:0,message:'친구의 질문을 듣고 문장으로 대답해 보자!',target};
 return assessSentencePractice(transcript,target,{text:phrase,required:normalize(phrase).split(' ').filter(w=>!['a','an','the'].includes(w))});
}
export function ensureLearningState(state){
 state.learning??={}; state.learning.failures??=0; state.learning.visits??={}; state.learning.sequence??=0; state.learning.pending??=[];
 return state.learning;
}
const RAW_REPEAT_DIALOGUES={
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

export const REPEAT_DIALOGUES=Object.fromEntries(Object.entries(RAW_REPEAT_DIALOGUES).map(([id,variants])=>[id,variants.map(([question,phrase,key])=>[question,SENTENCE_PRACTICE[key]?.text||phrase,key])]));
