// Short everyday sentences for children learning English as a second language.
export const PRACTICE_VERSION=2;
export const SENTENCE_PRACTICE={
 airplane:{text:'I see an airplane.',korean:'비행기가 보여요.',required:['i','see','airplane']},
 apple:{text:'I want an apple.',korean:'사과를 먹고 싶어요.',required:['i','want','apple']},
 ask:{text:'Can I ask you?',korean:'물어봐도 될까요?',required:['can','i','ask']},
 bus:{text:'Here is the bus.',korean:'여기 버스가 있어요.',required:['here','is','bus']},
 bag:{text:'This is my bag.',korean:'이건 내 가방이에요.',required:['this','my','bag']},
 big:{text:'It is a big bus.',korean:'큰 버스예요.',required:['it','is','big','bus']},
};
SENTENCE_PRACTICE.big_bus=SENTENCE_PRACTICE.big;
SENTENCE_PRACTICE.my_bag=SENTENCE_PRACTICE.bag;
export function normalizePractice(text){return String(text||'').toLowerCase().replace(/[’‘]/g,"'").replace(/\bit's\b/g,'it is').replace(/\bhere's\b/g,'here is').replace(/\bthat's\b/g,'that is').replace(/\bi'm\b/g,'i am').replace(/버스|버쓰|버즈/g,'bus').replace(/배그|백/g,'bag').replace(/비그|빅/g,'big').replace(/\b(?:buss|buses|buzz|but)\b/g,'bus').replace(/\baeroplane\b/g,'airplane').replace(/\bhear is\b/g,'here is').replace(/[^a-z\s]/g,' ').replace(/\s+/g,' ').trim();}
export function sentenceAssessment(transcript,target){const practice=SENTENCE_PRACTICE[target];if(!practice)return null;const heard=normalizePractice(transcript),ideal=normalizePractice(practice.text),tokens=heard.split(' ');let cursor=0;const passed=practice.required.every(word=>{const at=tokens.indexOf(word,cursor);if(at<0)return false;cursor=at+1;return true;}),complete=heard===ideal;return {passed,quality:passed?(complete?'complete':'partial'):'unheard',quantity:passed?(complete?2:1):0,message:passed?(complete?'문장 전체를 말했네! 네 마음이 잘 전달됐어!':'문장으로 이야기했네! 가이드를 들으며 조금 더 이어 말해 볼까?'):'단어를 문장으로 이어서 이야기해 보자!',transcript:heard,target};}
export function practiceStep(page){const practice=page?.type==='speak'&&SENTENCE_PRACTICE[page.targetKey];if(!practice)return page;return {...page,targetPhrase:practice.text,guideClip:practice.text,phonetic:'',meaningKo:practice.korean,prompt:page.bossBattle?'배운 문장으로 봉인 마법을 풀어 주세요!':'가이드 음성을 듣고 문장을 따라 말해 보세요!',rewardHint:page.bossBattle?page.rewardHint:'문장 성공: 나무 1~2개 · 완전한 문장: 검 보상'};}
