import {STAGE3_AUDIO_MANIFEST} from './assets/audio/stage3/manifest.js';
import {CHARACTER_AUDIO_MANIFEST} from './character-audio-manifest.js';
import {prepareSpeechSamples} from './magic-english-audio-input.js';
import {CHARACTER_VOICES, clipCharacter} from './character-voices.js';
// Magic English Stage 1 — ElevenLabs TTS Playback, 16kHz WAV Recording, Scribe v2 STT & My Voice
// Implements Funny Farming ElevenLabs architecture + STAGE-1-PLAN.md Section 4.

import { STAGE1_AUDIO_MANIFEST } from './assets/audio/stage1/manifest.js';

export const PRIVACY_NOTICE =
  'Speak 음성 확인을 위해 녹음된 음성이 서버를 통해 ElevenLabs(Scribe v2)로 전송되며, 게임 서버에는 별도 저장되지 않습니다. 「내 목소리 듣기(My voice)」는 현재 브라우저 메모리에만 보관되며 페이지를 떠나면 해제됩니다.';

// Normalize transcript: lowercase, strip punctuation, collapse whitespace
export function normalizeSpeechText(raw) {
  if (typeof raw !== 'string') return '';
  return raw
    .toLowerCase()
    .replace(/[.,?!'"`~:;()[\]{}\-_/\\]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ACCEPTED_EXCUSE_ME = [
  'excuse me',
  'exuse me',
  'scuse me',
  'excuse',
  '익스큐즈 미',
  '엑스큐즈 미',
  '익스큐즈미',
  '엑스큐즈미',
  '이큐즈 미',
];

const ACCEPTED_CAN_I_ASK = [
  'can i ask',
  'can i ask you',
  'can i ask something',
  'can i ask a question',
  'may i ask',
  'could i ask',
  'can we ask',
  '캔 아이 애스크',
  '캔 아이 에스크',
  '캔아이애스크',
  '캔아이에스크',
  '캔 아이 아스크',
];

export function matchesPartExcuseMe(normalized) {
  if (!normalized) return false;
  return ACCEPTED_EXCUSE_ME.some(expr => normalized.includes(expr));
}

export function matchesPartCanIAsk(normalized) {
  if (!normalized) return false;
  return ACCEPTED_CAN_I_ASK.some(expr => normalized.includes(expr));
}

// Section 7.3 Levenshtein edit distance & 60% similarity check
export function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

export function evaluateWordSimilarity60(transcript, targetWord) {
  const stopWords = new Set(['i', 'said', 'say', 'it', 'a', 'the']);
  const words = normalizeSpeechText(transcript)
    .split(' ')
    .filter(w => w && !stopWords.has(w));
  if (words.length !== 1) {
    return { passed: false, letterMatch: 0, message: '한 단어로 또렷하게 말해 보세요!' };
  }
  const recognized = words[0];
  const target = normalizeSpeechText(targetWord);
  const ratio = 1 - editDistance(target, recognized) / Math.max(target.length, recognized.length, 1);
  const letterMatch = Math.round(ratio * 100);
  const passed = ratio >= 0.6;
  return {
    passed,
    letterMatch,
    message: passed ? 'Good job!' : '다시 한 번 듣고 또렷하게 말해 볼까요?',
  };
}

export function evaluateStage1Speech(transcript, target = 'full') {
  const normalized = normalizeSpeechText(transcript);
  if (!normalized) {
    return {
      ok: false,
      normalized: '',
      matchedParts: { excuseMe: false, canIAsk: false },
      feedback: '목소리가 잘 들리지 않았어요. 스피커로 한 번 들어보고 천천히 다시 말해 볼까요?',
    };
  }

  const hasExcuseMe = matchesPartExcuseMe(normalized);
  const hasCanIAsk = matchesPartCanIAsk(normalized);

  if (target === 'airplane' || target === 'apple' || target === 'ask') {
    const wordRes = evaluateWordSimilarity60(transcript, target);
    const korMap = {
      airplane: ['에어플레인', '에어플래인'],
      apple: ['애플', '에플'],
      ask: ['애스크', '에스크', '아스크'],
    };
    const korMatched = (korMap[target] || []).some(k => normalized.includes(k));
    const ok = wordRes.passed || normalized.includes(target) || korMatched;
    return {
      ok,
      normalized,
      matchedParts: { excuseMe: false, canIAsk: false },
      feedback: ok ? `Good job! “${target.toUpperCase()}” 발음이 아주 좋아요!` : wordRes.message,
    };
  }

  if (target === 'i_am_okay') {
    const ok =
      normalized.includes('okay') ||
      normalized.includes('ok') ||
      normalized.includes('fine') ||
      normalized.includes('good') ||
      normalized.includes('오케이');
    return {
      ok,
      normalized,
      matchedParts: { excuseMe: false, canIAsk: false },
      feedback: ok ? 'Good job! “I am okay.” 인사가 잘 전달되었어요!' : '“I am okay.”라고 다시 한 번 말해 볼까요?',
    };
  }

  if (target === 'good_morning') {
    const ok =
      normalized.includes('morning') ||
      normalized.includes('good') ||
      normalized.includes('굿모닝') ||
      normalized.includes('굿 모닝');
    return {
      ok,
      normalized,
      matchedParts: { excuseMe: false, canIAsk: false },
      feedback: ok ? 'Good job! “Good morning!” 인사가 멋지게 전달되었어요!' : '“Good morning!”이라고 다시 말해 볼까요?',
    };
  }

  if (target === 'i_am_gildong') {
    const ok =
      normalized.includes('gildong') ||
      normalized.includes('gil dong') ||
      normalized.includes('i am') ||
      normalized.includes('my name') ||
      normalized.includes('길동');
    return {
      ok,
      normalized,
      matchedParts: { excuseMe: false, canIAsk: false },
      feedback: ok ? 'Good job! “I am Gildong.” 자기소개가 잘 전달되었어요!' : '“I am Gildong.”이라고 다시 말해 볼까요?',
    };
  }

  if (target === 'yes_please') {
    const ok =
      normalized.includes('yes') ||
      normalized.includes('please') ||
      normalized.includes('예스') ||
      normalized.includes('플리즈');
    return {
      ok,
      normalized,
      matchedParts: { excuseMe: false, canIAsk: false },
      feedback: ok ? 'Good job! “Yes, please!” 대답이 잘 전달되었어요!' : '“Yes, please!”라고 다시 말해 볼까요?',
    };
  }

  if (target === 'thank_you') {
    const ok =
      normalized.includes('thank') ||
      normalized.includes('thanks') ||
      normalized.includes('땡큐') ||
      normalized.includes('생큐');
    return {
      ok,
      normalized,
      matchedParts: { excuseMe: false, canIAsk: false },
      feedback: ok ? 'Good job! “Thank you!” 감사 인사가 잘 전달되었어요!' : '“Thank you!”라고 다시 말해 볼까요?',
    };
  }

  if (target === 'help_please') {
    const ok =
      normalized.includes('help') ||
      normalized.includes('friend') ||
      normalized.includes('please') ||
      normalized.includes('마이 프렌드') ||
      normalized.includes('헬프') ||
      normalized.includes('플리즈');
    return {
      ok,
      normalized,
      matchedParts: { excuseMe: false, canIAsk: false },
      feedback: ok
        ? 'Good job! “My friend. Help, please!”가 진심으로 전달되었어요!'
        : '조금 다르게 들렸어요. 가이드를 보고 “My friend. Help, please!”라고 말해 볼까요?',
    };
  }

  if (target === 'excuse_me') {
    if (hasExcuseMe) {
      return {
        ok: true,
        normalized,
        matchedParts: { excuseMe: true, canIAsk: hasCanIAsk },
        feedback: 'Good job! “Excuse me.”가 또렷하게 전달되었어요!',
      };
    }
    return {
      ok: false,
      normalized,
      matchedParts: { excuseMe: false, canIAsk: hasCanIAsk },
      feedback: `인식된 말: "${transcript.trim()}" — “Excuse me.”(익스큐즈 미)라고 다시 한 번 말해 볼까요?`,
    };
  }

  if (target === 'can_i_ask') {
    if (hasCanIAsk) {
      return {
        ok: true,
        normalized,
        matchedParts: { excuseMe: hasExcuseMe, canIAsk: true },
        feedback: 'Good job! “Can I ask?”가 정확하게 전달되었어요!',
      };
    }
    return {
      ok: false,
      normalized,
      matchedParts: { excuseMe: hasExcuseMe, canIAsk: false },
      feedback: `인식된 말: "${transcript.trim()}" — “Can I ask?”(캔 아이 애스크)라고 다시 한 번 말해 볼까요?`,
    };
  }

  if (hasExcuseMe && hasCanIAsk) {
    return {
      ok: true,
      normalized,
      matchedParts: { excuseMe: true, canIAsk: true },
      feedback: 'Good job! Ding! Correct! “Excuse me. Can I ask?”가 완벽하게 전달되었어요!',
    };
  }
  if (hasExcuseMe && !hasCanIAsk) {
    return {
      ok: false,
      normalized,
      matchedParts: { excuseMe: true, canIAsk: false },
      feedback: '앞부분 “Excuse me.”는 아주 좋았어요! 뒤에 “Can I ask?”까지 이어서 말하거나, 「나누어 말하기」로 2구절을 말해 보세요!',
    };
  }
  if (!hasExcuseMe && hasCanIAsk) {
    return {
      ok: false,
      normalized,
      matchedParts: { excuseMe: false, canIAsk: true },
      feedback: '뒷부분 “Can I ask?”는 잘 들렸어요! 앞에 “Excuse me.”를 붙여 말하거나 「나누어 말하기」를 이용해 보세요!',
    };
  }

  return {
    ok: false,
    normalized,
    matchedParts: { excuseMe: false, canIAsk: false },
    feedback: `인식된 말: "${transcript.trim()}" — 아직 표현이 다르게 들렸어요. 다시 들어보고 “Excuse me. Can I ask?”라고 말해 볼까요?`,
  };
}

// Lookup table mapping English text or clip ID to pre-generated ElevenLabs MP3 clip
const TEXT_TO_CLIP_ID = {
  a: 'letter_a',
  'the letter a capital a small a': 'letter_a',
  airplane: 'word_airplane',
  'a is for airplane': 'sentence_airplane',
  'airplane a is for airplane': 'sentence_airplane',
  apple: 'word_apple',
  'a is for apple': 'sentence_apple',
  'apple a is for apple': 'sentence_apple',
  ask: 'word_ask',
  'excuse me can i ask': 'sentence_ask',
  'ask excuse me can i ask': 'sentence_ask',
  'excuse me': 'phrase_excuse_me',
  'can i ask': 'phrase_can_i_ask',
  'are you okay what happened': 'traveler_are_you_okay',
  'hehe upside down let s change exit to t i x e': 'misspell_exit_tixe',
  'it s okay welcome to america i am amy let s find your friend together': 'amy_hello_gildong',
  'beep today s alphabet is a a is for airplane a is for apple': 'ringo_intro_a',
  'when you don t know just ask say excuse me can i ask': 'amy_teach_ask',
  'it s okay to make mistakes try again excuse me can i ask': 'amy_try_again',
  'hello can i help you': 'staff_hello_help',
  'sure how can i help you': 'staff_sure_help',
  'sure how can i help you oh your friend is over there': 'staff_sure_help',
  'excuse me can i ask my friend help please': 'gildong_my_friend_help',
  'oh your friend is in the lost and found room right over there': 'staff_friend_over_there',
  'ding correct you got the letter a piece good job': 'ringo_ding_correct',
  'help wow thank you gildong': 'hwalbin_help_thank_you',
  'hehe next time i will change bus into sub': 'misspell_bus_sub',
  'haha nice to meet you welcome to america': 'traveler_reply_welcome',
  'great excellent you did an amazing job': 'amy_praise_great_excellent',
};

let activeAudio = null;
let characterAudioContext = null;

export function cancelActiveVoice() {
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudio = null;
  }
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // ignore
  }
}

export function resolveElevenLabsClip(textOrClipId) {
  if (!textOrClipId) return null;
  if (STAGE1_AUDIO_MANIFEST[textOrClipId]) {
    return STAGE1_AUDIO_MANIFEST[textOrClipId];
  }
  const norm = normalizeSpeechText(textOrClipId);
  const clipId = TEXT_TO_CLIP_ID[norm];
  return clipId ? STAGE1_AUDIO_MANIFEST[clipId] : null;
}

const preparedVoices=new Map(),voiceBytes=new Map();
function voiceContext(){const Context=window.AudioContext||window.webkitAudioContext;if(!characterAudioContext||characterAudioContext.state==='closed')characterAudioContext=new Context();return characterAudioContext;}
function prepareVoiceBytes(textOrClipId,character='amy'){
 const clip=resolveElevenLabsClip(textOrClipId),text=clip?.text||textOrClipId,key=JSON.stringify([character,text]);
 if(voiceBytes.has(key))return voiceBytes.get(key);
 const cast=CHARACTER_VOICES[character],asset=STAGE3_AUDIO_MANIFEST[key]||CHARACTER_AUDIO_MANIFEST[key]||(clip?.voice===cast?.voice?clip.src:null);
 const promise=(async()=>{const response=asset?await fetch(asset):await fetch('/api/magic-english/character-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,text})});if(!response.ok)throw Error('배역 음성을 재생할 수 없어요.');return response.arrayBuffer();})();
 voiceBytes.set(key,promise);promise.catch(()=>voiceBytes.delete(key));return promise;
}
export function preloadCharacterVoice(textOrClipId,character='amy'){
 const clip=resolveElevenLabsClip(textOrClipId),key=JSON.stringify([character,clip?.text||textOrClipId]);
 if(preparedVoices.has(key))return preparedVoices.get(key);
 const promise=prepareVoiceBytes(textOrClipId,character).then(bytes=>voiceContext().decodeAudioData(bytes.slice(0)));
 preparedVoices.set(key,promise);promise.catch(()=>preparedVoices.delete(key));return promise;
}
export function warmCharacterVoices(){
 const entries=Object.keys(CHARACTER_AUDIO_MANIFEST);let next=0;
 const worker=async()=>{while(next<entries.length){const [character,text]=JSON.parse(entries[next++]);try{await prepareVoiceBytes(text,character);}catch{/* Retry unavailable audio on interaction. */}}};
 void worker();void worker();
}

// Native media playback preserves pitch when slowing a guide and avoids DSP artifacts.
export const voicePlaybackRate=options=>Math.min(1.1,Math.max(.7,Number.isFinite(options?.playbackRate)?options.playbackRate:1));
async function playCleanVoice(text,character,options){
 let stopped=false,url=null;const audio=new window.Audio();
 const cleanup=()=>{if(url){URL.revokeObjectURL(url);url=null;}};
 const handle={pause:()=>{stopped=true;audio.pause();audio.removeAttribute?.('src');cleanup();}};
 activeAudio=handle;
 const finish=()=>{if(stopped)return;stopped=true;cleanup();if(activeAudio===handle)activeAudio=null;options.onEnd?.();};
 audio.onended=finish;
 try{
  const bytes=await prepareVoiceBytes(text,character);if(stopped||activeAudio!==handle)return false;
  url=URL.createObjectURL(new Blob([bytes],{type:'audio/mpeg'}));audio.src=url;audio.volume=.8;audio.playbackRate=voicePlaybackRate(options);audio.preservesPitch=true;audio.webkitPreservesPitch=true;
  await new Promise((resolve,reject)=>{audio.onerror=()=>reject(Error('가이드 음성을 재생할 수 없어요.'));Promise.resolve(audio.play()).then(resolve,reject);});
  audio.onerror=()=>{if(!stopped){options.onError?.(Error('가이드 음성을 재생할 수 없어요.'));finish();}};
  return !stopped;
 }catch(error){
  if(stopped||activeAudio!==handle)return false;handle.pause();if(activeAudio===handle)activeAudio=null;
  // Safari may reject native autoplay after async loading; retain the unlocked audio context.
  return playCharacterVoice(text,character,{...options,nativePlayback:false});
 }
}

// Character dialogue never falls back to a device-selected voice.
export async function playCharacterVoice(textOrClipId,character,options={}){
 cancelActiveVoice();const cast=CHARACTER_VOICES[character];if(!cast)return false;
 if(cast.effect==='none'&&options.nativePlayback!==false&&typeof window.Audio==='function'){if(characterAudioContext)void characterAudioContext.resume().catch(()=>{});return playCleanVoice(textOrClipId,character,options);}
 const clip=resolveElevenLabsClip(textOrClipId),controller=new AbortController();
 const Context=window.AudioContext||window.webkitAudioContext;let context,source,oscillator,master,stopped=false;
 const stop=()=>{if(stopped)return;stopped=true;controller.abort();if(master&&context){const t=context.currentTime||0;master.gain.cancelScheduledValues?.(t);master.gain.setValueAtTime?.(master.gain.value,t);master.gain.linearRampToValueAtTime?.(0,t+.025);}setTimeout(()=>{try{source?.stop();}catch{}try{oscillator?.stop();}catch{}source?.disconnect();oscillator?.disconnect();master?.disconnect();},30);};
 const handle={pause:stop};activeAudio=handle;
 const done=()=>{stop();if(activeAudio===handle)activeAudio=null;options.onEnd?.();};
 try{
 context=voiceContext();void context.resume().catch(()=>{});
 const audio=await preloadCharacterVoice(textOrClipId,character);if(stopped||activeAudio!==handle)return false;
 source=context.createBufferSource();source.buffer=audio;source.playbackRate.value=voicePlaybackRate(options);
 master=context.createGain();const t=context.currentTime||0;master.gain.value=.85;master.gain.setValueAtTime?.(0,t);master.gain.linearRampToValueAtTime?.(.85,t+.015);master.connect(context.destination);
 let destination=master;
 if(cast.effect!=='none'&&context.createDynamicsCompressor){const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=18;limiter.ratio.value=4;limiter.attack.value=.003;limiter.release.value=.12;limiter.connect(master);destination=limiter;}
 if(cast.effect==='robot'){
 const filter=context.createBiquadFilter();filter.type='bandpass';filter.frequency.value=1600;filter.Q.value=.5;
 const gain=context.createGain();gain.gain.value=.75;oscillator=context.createOscillator();oscillator.frequency.value=45;oscillator.type='sine';const modulation=context.createGain();modulation.gain.value=.23;
 oscillator.connect(modulation);modulation.connect(gain.gain);source.connect(filter);filter.connect(gain);gain.connect(destination);oscillator.start();
 }else if(cast.effect==='villain'){
 source.playbackRate.value=.94;const bass=context.createBiquadFilter();bass.type='lowshelf';bass.frequency.value=240;bass.gain.value=4;source.connect(bass);bass.connect(destination);
 }else source.connect(destination);
 source.onended=()=>{if(!stopped)done();};source.start();return true;
 }catch(error){if(!stopped){options.onError?.(error);done();}return false;}
}

/** All words, first conversations and repeat conversations use fixed ElevenLabs casting. */
export function speakEnglishPhrase(textOrClipId,options={}){
 const clip=resolveElevenLabsClip(textOrClipId);
 const character=options.character||clipCharacter(clip);
 return playCharacterVoice(textOrClipId,character,options);
}


// Convert decoded AudioBuffer to 16 kHz / mono / 16-bit PCM WAV Blob (Section 6)
async function convertBlobTo16kWav(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  try {
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    const targetRate = 16000;
    const offline = new OfflineAudioContext(1,Math.max(1,Math.ceil(decoded.duration*targetRate)),targetRate);
    const source=offline.createBufferSource();source.buffer=decoded;source.connect(offline.destination);source.start(0);
    const rendered=await offline.startRendering();
    const {samples,rms}=prepareSpeechSamples(rendered.getChannelData(0),targetRate);

    const wavBuffer = encodePcm16Wav(samples, targetRate);
    return { wavBlob: new Blob([wavBuffer], { type: 'audio/wav' }), rms };
  } finally {
    audioCtx.close().catch(() => {});
  }
}

function encodePcm16Wav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, 1, true);  // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/**
 * Creates the Speak / My voice controller following Funny Farming Sections 6 & 7:
 * - Records via MediaRecorder (max 7 seconds)
 * - Keeps in-memory Blob URL for "My voice" playback
 * - Converts to 16kHz mono 16-bit PCM WAV and checks RMS >= 0.008
 * - Sends to POST /api/magic-english/assess-pronunciation (ElevenLabs Scribe v2)
 */
export function createSpeechRecognizer(dependencies={}) {
  let phase='idle',sequence=0,session=null,myVoiceUrl=null;
  const getMedia=dependencies.getUserMedia||((options)=>navigator.mediaDevices.getUserMedia(options));
  const convert=dependencies.convertAudio||convertBlobTo16kWav;
  const request=dependencies.fetch||((...args)=>fetch(...args));
  const makeRecorder=dependencies.createRecorder||((stream,options)=>new MediaRecorder(stream,options));
  const supported=()=>Boolean(dependencies.getUserMedia||typeof navigator!=='undefined'&&navigator.mediaDevices?.getUserMedia&&typeof MediaRecorder!=='undefined');
  const current=run=>session===run&&sequence===run.id&&!run.finished;
  function release(run){clearTimeout(run.timer);for(const track of run.stream?.getTracks()||[])track.stop();run.stream=null;}
  function cancel(){const run=session;sequence++;session=null;phase='idle';if(!run)return;run.finished=true;run.controller?.abort();release(run);try{if(run.recorder?.state!=='inactive')run.recorder?.stop();}catch{}}
  function finish(run,error,assessment,transcript=''){
    if(!current(run))return;release(run);run.finished=true;phase='idle';session=null;
    if(error)run.callbacks.onError?.(error);else run.callbacks.onResult?.(assessment?.recognizedText??assessment?.transcript??transcript,[],assessment);
    run.callbacks.onEnd?.();
  }
  function processing(run){if(!current(run)||run.processing)return;run.processing=true;phase='processing';run.callbacks.onProcessing?.();}
  function stop(){const run=session;if(!run||phase!=='recording')return false;processing(run);try{run.recorder?.stop();return true;}catch(error){finish(run,{code:'recording-error',message:'녹음을 마치지 못했어요. 다시 이야기해 주세요.'});return false;}}
  async function start(callbacks={}){
    if(phase!=='idle')return false;
    cancelActiveVoice();const run={id:++sequence,callbacks,finished:false,processing:false,stream:null,recorder:null};session=run;phase='requesting';callbacks.onPreparing?.();
    if(typeof window!=='undefined'&&typeof window.__MOCK_SPEECH_RECOGNIZER__==='function'){
      phase='recording';callbacks.onStart?.();window.__MOCK_SPEECH_RECOGNIZER__({emitResult:(transcript,assessment)=>finish(run,null,assessment,transcript),emitError:(code,message)=>finish(run,{code,message})});return true;
    }
    if(!supported()){finish(run,{code:'not-supported',message:'마이크를 사용할 수 없어요. HTTPS 주소와 마이크 권한을 확인해 주세요.'});return false;}
    try{
      const stream=await getMedia({audio:{echoCancellation:true,noiseSuppression:true,channelCount:1}});
      if(!current(run)){for(const track of stream.getTracks())track.stop();return false;}
      run.stream=stream;
      const mimeCandidates=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'];
      const mime=mimeCandidates.find(value=>typeof MediaRecorder!=='undefined'&&MediaRecorder.isTypeSupported?.(value));
      const recorder=run.recorder=makeRecorder(stream,mime?{mimeType:mime}:undefined),chunks=[];
      recorder.ondataavailable=event=>{if(current(run)&&event.data?.size)chunks.push(event.data);};
      recorder.onerror=()=>finish(run,{code:'recording-error',message:'마이크 녹음이 중단됐어요. 다음에 다시 이야기하자!'});
      recorder.onstop=async()=>{
        if(!current(run))return;processing(run);release(run);
        try{
          const blob=new Blob(chunks,{type:recorder.mimeType||'audio/webm'});
          if(blob.size<200){finish(run,{code:'no-speech',message:'목소리가 잘 들리지 않았어. 다음에 다시 이야기하자!'});return;}
          if(myVoiceUrl)URL.revokeObjectURL(myVoiceUrl);myVoiceUrl=URL.createObjectURL(blob);
          const {wavBlob,rms}=await convert(blob);if(!current(run))return;
          if(rms<.003){finish(run,{code:'low-volume',message:'목소리가 작게 들렸어. 마이크를 확인해 볼래?'});return;}
          run.controller=new AbortController();const timeout=setTimeout(()=>run.controller.abort(),50000);
          let response;
          try{response=await request(`/api/magic-english/assess-pronunciation?word=${encodeURIComponent(callbacks.target||'full')}&userId=${encodeURIComponent(callbacks.userId||'demo')}&attemptId=${encodeURIComponent(callbacks.attemptId||'')}`,{method:'POST',headers:{'Content-Type':'audio/wav'},body:wavBlob,signal:run.controller.signal});}finally{clearTimeout(timeout);}
          if(!current(run))return;
          if(!response.ok){const data=await response.json().catch(()=>({}));finish(run,{code:'server-error',message:data.error||'링고가 목소리를 확인하지 못했어. 잠시 후 다시 이야기하자!'});return;}
          const assessment=await response.json();finish(run,null,assessment);
        }catch(error){if(current(run))finish(run,{code:'stt-error',message:'링고에게 목소리가 전해지지 않았어. 잠시 후 다시 이야기하자!'});}
      };
      recorder.start();phase='recording';callbacks.onStart?.();run.timer=setTimeout(()=>{if(current(run))stop();},7000);return true;
    }catch(error){if(current(run))finish(run,{code:'not-allowed',message:'마이크를 켤 수 없어요. 브라우저의 마이크 권한을 확인해 주세요.'});return false;}
  }
  function playMyVoice(){if(!myVoiceUrl||phase!=='idle')return false;cancelActiveVoice();const audio=new Audio(myVoiceUrl);activeAudio=audio;audio.play().catch(()=>{});return true;}
  if(typeof window!=='undefined')window.addEventListener('beforeunload',()=>{cancel();if(myVoiceUrl)URL.revokeObjectURL(myVoiceUrl);});
  return {isSupported:supported,isRecording:()=>phase==='recording',isBusy:()=>phase!=='idle',getPhase:()=>phase,hasMyVoice:()=>Boolean(myVoiceUrl),playMyVoice,start,stop,cancel};
}
