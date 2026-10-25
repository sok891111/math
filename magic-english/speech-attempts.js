export const MAX_SPEECH_ATTEMPTS=3;
export function hasRecognizedWords(text){return /\p{L}+/u.test(String(text||'').replace(/\[[^\]]*\]|<[^>]*>/g,' '));}
export function speechAttemptOutcome(assessment,priorFailures=0){if(assessment?.passed)return {action:'success',failures:priorFailures};const text=assessment?.recognizedText??assessment?.transcript??'';if(!hasRecognizedWords(text))return {action:'unheard',failures:priorFailures};const failures=priorFailures+1;return {action:failures<MAX_SPEECH_ATTEMPTS?'retry':'exhausted',failures,remaining:Math.max(0,MAX_SPEECH_ATTEMPTS-failures)};}
export const npcVoiceLocked=dialog=>!!dialog&&dialog.voicePlayingIndex===dialog.index;
