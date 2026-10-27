import {mobScript,mobPractice,MOB_CAST,advanceMobConversation} from './mob-conversations.js';
import {createSpeechRecognizer,playCharacterVoice,cancelActiveVoice} from '../magic-english-speech.js';
import {assessLearningSpeech} from '../magic-english-learning.js';
export function createMobConversationUI({profile,getLearning,saveLearning,onResume,onReturn}){
 const root=document.createElement('section');root.id='mob-conversation-panel';root.className='panel mob-talk-panel';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','mob-talk-title');
 root.innerHTML='<div class="mob-talk-heading"><div id="mob-talk-face" aria-hidden="true"></div><div><div class="eyebrow">MONSTER FRIENDS · ENGLISH TIME</div><h2 id="mob-talk-title"></h2><p id="mob-talk-progress"></p></div></div><p id="mob-talk-scene"></p><div class="mob-talk-question"><strong id="mob-talk-name"></strong><p id="mob-talk-question"></p><p id="mob-talk-translation"></p><button id="mob-talk-listen" type="button">🔊 친구 목소리 듣기</button></div><div id="mob-talk-answer"><span>내 대답</span><p id="mob-talk-phrase"></p><p id="mob-talk-meaning"></p><button id="mob-talk-guide" type="button">🔊 대답 가이드</button></div><p id="mob-talk-status" role="status" aria-live="polite"></p><div class="mob-talk-actions"><button id="mob-talk-speak" class="primary" type="button">🎙️ Speak · 내 차례</button><button id="mob-talk-stop" type="button" hidden>⏹️ 다 말했어요</button><button id="mob-talk-next" class="primary" type="button" hidden>다음 이야기 →</button><button id="mob-talk-save" type="button" hidden>다시 저장하기</button></div><p class="mob-talk-footnote">친구와 차례대로 이야기하면 다시 모험할 수 있어요. 대화 중에는 하트가 줄지 않아요.</p><button id="mob-talk-return" class="text-button" type="button">📖 마법영어 모험으로 돌아가기</button>';
 document.querySelector('#overlay').append(root);
 const $=id=>root.querySelector('#mob-talk-'+id),speech=createSpeechRecognizer();let generation=0,current=null;
 function status(text){$('status').textContent=text;}
 function ready(){for(const id of ['speak','listen','guide'])$(id).disabled=false;$('stop').hidden=true;}
 function cancel(){generation++;speech.cancel();cancelActiveVoice();ready();}
 async function voice(text,character){const ticket=generation;try{await playCharacterVoice(text,character);}catch{if(ticket!==generation||root.hidden)return;status('목소리를 불러오지 못했어요. 인터넷 연결을 확인하고 듣기를 다시 눌러 주세요.');}}
 function show(){
  cancel();const item=getLearning().queue[0];$('next').hidden=true;$('save').hidden=true;$('speak').hidden=false;$('answer').hidden=false;$('question').hidden=false;
  if(!item){current=null;$('title').textContent='친구와 이야기 완료!';$('face').dataset.mob='';$('face').textContent='🌟';$('progress').textContent='모든 대답을 차례대로 마쳤어요.';$('scene').textContent='이제 다시 걷고 만들며 모험해 봐요!';$('name').textContent='링고';$('question').textContent='Well done!';$('translation').textContent='잘했어!';$('answer').hidden=true;$('speak').hidden=true;$('listen').onclick=()=>voice('Well done!','ringo');$('next').hidden=false;$('next').textContent='🧱 게임 계속하기';$('next').onclick=()=>{cancel();onResume();};status('');return;}
  const script=mobScript(item.script),row=script.rows[item.next],practice=mobPractice(row.target),cast=MOB_CAST[script.type];
  current={id:item.id,turn:item.next,row,cast};root.style.setProperty('--mob-color',cast.color);$('face').dataset.mob=script.type;$('face').textContent=cast.emoji;$('title').textContent=script.title;$('progress').textContent=`${item.next+1} / ${script.rows.length} TURN · ${'★'.repeat(item.next)}${'☆'.repeat(script.rows.length-item.next)}`;$('scene').textContent=script.intro;$('name').textContent=cast.name;$('question').textContent=row.question;$('translation').textContent=row.korean;$('phrase').textContent=practice.text;$('meaning').textContent=practice.korean;
  $('listen').onclick=()=>voice(row.question,cast.character);$('guide').onclick=()=>voice(practice.text,'amy');status('친구의 말을 듣고 내 차례에 대답해 주세요.');void voice(row.question,cast.character);
 }
 function checkpoint(capture){
  const next=structuredClone(getLearning());if(!advanceMobConversation(next,capture.id,capture.turn))return;
  if(!saveLearning(next)){status('대답은 잘 들었어요! 저장 공간을 확인한 뒤 다시 저장해 주세요.');$('save').hidden=false;$('save').onclick=()=>checkpoint(capture);$('speak').hidden=true;return;}
  $('save').hidden=true;$('speak').hidden=true;$('stop').hidden=true;
  const script=mobScript(capture.script);status('🌟 대답 성공! 잘 이야기했어요.');$('next').hidden=false;$('next').textContent=getLearning().queue.length?'다음 이야기 →':'친구의 마지막 인사 →';$('next').onclick=()=>{
   if(getLearning().queue.length)show();else{show();$('scene').textContent=script.ending;void voice(script.ending,capture.cast.character);}
  };
 }
 $('speak').onclick=()=>{
  if(!current||speech.isBusy())return;const capture={...current,script:getLearning().queue[0].script},ticket=++generation;
  $('speak').disabled=true;$('listen').disabled=$('guide').disabled=true;
  void speech.start({target:capture.row.target,targetPhrase:mobPractice(capture.row.target).text,userId:profile,attemptId:crypto.randomUUID(),onPreparing:()=>status('마이크를 준비하고 있어요…'),onStart:()=>{if(ticket!==generation)return;$('stop').hidden=false;status('🎙️ 듣고 있어요. 다 말했으면 멈춤 버튼을 눌러 주세요.');},onProcessing:()=>{if(ticket!==generation)return;$('stop').hidden=true;status('링고가 대답을 확인하고 있어요…');},onResult:(text,_alternatives,assessment)=>{
   if(ticket!==generation)return;ready();const result=assessment||assessLearningSpeech(text,capture.row.target);
   if(!result.passed){status('조금 다르게 들렸어요. 대답 가이드를 듣고 다시 말해 봐요! '+(text?'들린 말: '+text:''));return;}
   checkpoint(capture);
  },onError:error=>{if(ticket!==generation)return;ready();status(error.message+' 대화는 같은 차례에서 기다리고 있어요.');}});
 };
 $('stop').onclick=()=>speech.stop();$('return').onclick=()=>{cancel();onReturn();};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&speech.isBusy()){cancel();status('같은 차례에서 기다리고 있어요. 준비되면 다시 Speak를 눌러 주세요.');}});
 return {show,cancel,root};
}
