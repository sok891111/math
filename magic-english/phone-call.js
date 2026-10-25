// Gold: engine/phone/phone.asm RingTwice_StartCall, 20-frame waits, HangUp.
export const PHONE_FRAME_MS=1000/60;
export const LAB_CALL_PAGES=[
 '삐비빅—! 길동아, 들려? 나 에이미야! 큰일이 났어!',
 '미스터 미스스펠이 국제선 중앙 로비의 EXIT 표지판을 TIXE로 뒤섞으며 길을 막고 있어!',
 '활빈과 함께 미스터 미스스펠을 물리치고, 지금 바로 때르릉호 연구실로 돌아와 줘!'
];
export function beginLabCall(state){if(state.map!=='Route30'||!state.flags.mysteryEgg||state.flags.eggDelivered||state.flags.labCall||state.phoneCall)return false;state.flags.labTheft=true;state.phoneCall={version:1,phase:'ring',page:0};return true;}
export function finishLabCall(state){state.flags.labCall=true;delete state.phoneCall;}
export function validPhoneCall(s){const c=s.phoneCall;return c===undefined||!!(c&&c.version===1&&['ring','talk','hangup'].includes(c.phase)&&Number.isInteger(c.page)&&c.page>=0&&c.page<LAB_CALL_PAGES.length&&s.map==='Route30'&&s.flags.mysteryEgg&&!s.flags.eggDelivered&&!s.flags.labCall&&!s.battle&&!s.healing&&!s.trainerEncounter);}
export function createPhoneAnimation(container){
 let running=false,context,output,muted=false,volume=.4;
 document.addEventListener('game-audio-setting',e=>{muted=e.detail.muted;volume=e.detail.volume;if(output)output.gain.value=muted?0:volume;});
 const panel=document.createElement('div');panel.id='phone-caller';panel.hidden=true;panel.setAttribute('role','status');panel.setAttribute('aria-label','에이미와 링고에게 무전이 왔어요');
 const name=document.createElement('span');name.textContent='☎ 에이미 & 링고';panel.append(name);
 const ending=document.createElement('div');ending.className='phone-ending';ending.hidden=true;container.append(panel,ending);
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 function unlock(){try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!context){context=new Audio();output=context.createGain();output.gain.value=muted?0:volume;output.connect(context.destination);}context.resume().catch(()=>{});}catch{}}
 document.addEventListener('pointerdown',unlock,{passive:true});document.addEventListener('keydown',unlock,{passive:true});
 function tone(hangup=false){
  if(muted||!context||context.state!=='running')return;
  // Original square-note pitch registers: CALL 1952 with upward sweep; HANG_UP 1915.
  const count=hangup?2:5,base=context.currentTime;
  for(let i=0;i<count;i++){const o=context.createOscillator(),gain=context.createGain(),t=base+i/16,d=hangup&&i===1?2/64:4/64;o.type='square';o.frequency.setValueAtTime(131072/(2048-(hangup?1915:1952)),t);if(!hangup)o.frequency.exponentialRampToValueAtTime(2800,t+d);gain.gain.setValueAtTime(hangup&&i===1?.012:.055,t);gain.gain.setValueAtTime(0,t+d-.002);o.connect(gain).connect(output);o.start(t);o.stop(t+d);}
 }
 function phase(value){container.dataset.phonePhase=value;document.dispatchEvent(new CustomEvent('phone-call-phase',{detail:{phase:value}}));}
 return {active:()=>running||!panel.hidden,showCaller(){panel.hidden=false;name.hidden=false;phase('talk')},async ring(){running=true;panel.hidden=false;name.hidden=true;phase('ring');await wait(30*PHONE_FRAME_MS);for(let n=0;n<2;n++){tone();name.hidden=true;await wait(20*PHONE_FRAME_MS);name.hidden=false;await wait(20*PHONE_FRAME_MS);name.hidden=true;await wait(20*PHONE_FRAME_MS);name.hidden=false;}running=false;},async hangup(){running=true;phase('hangup');ending.hidden=false;ending.textContent='찰칵!';tone(true);await wait(20*PHONE_FRAME_MS);for(let n=0;n<3;n++){ending.textContent='… … …';await wait(20*PHONE_FRAME_MS);ending.textContent='';await wait(20*PHONE_FRAME_MS);}ending.hidden=true;panel.hidden=true;running=false;phase('done');}};
}
