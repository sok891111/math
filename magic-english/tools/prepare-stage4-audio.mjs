// Uses the local server key. Identical voice settings/text share one recording across roles.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {STAGE4_DIALOGUES} from '../magic-english-stage4-controller.js';
import {STAGE4_PRACTICE} from '../magic-english-stage4-learning.js';
import {STAGE4_DAILY_PROFILES,STAGE4_DAILY_TOPICS,STAGE4_DAILY_PRACTICE} from '../magic-english-stage4-daily.js';
import {dialogueCharacter,CHARACTER_VOICES} from '../character-voices.js';
import {CHARACTER_AUDIO_MANIFEST} from '../character-audio-manifest.js';
import {STAGE3_AUDIO_MANIFEST} from '../assets/audio/stage3/manifest.js';
import {DAILY_FAREWELL} from '../magic-english-stage3-daily.js';
const root=new URL('../',import.meta.url),entries=new Map();
function add(character,text){entries.set(JSON.stringify([character,text]),{character,text});}
for(const rows of Object.values(STAGE4_DIALOGUES))for(const [speaker,,english,key]of rows){add(dialogueCharacter(speaker),english);add('amy',STAGE4_PRACTICE[key].text);}
for(const p of Object.values(STAGE4_PRACTICE))add('amy',p.text);
for(const p of Object.values(STAGE4_DAILY_PRACTICE))add('amy',p.text);
for(const profile of Object.values(STAGE4_DAILY_PROFILES)){
 const character=dialogueCharacter(profile.speaker);
 for(const topic of profile.topics)for(const row of STAGE4_DAILY_TOPICS[topic])add(character,row.question);
 add(character,DAILY_FAREWELL);
}
const source=await fs.readFile(new URL('magic-english-stage4-controller.js',root),'utf8');
for(const match of source.matchAll(/npc\('([^']*)','[^']*','([^']*)'/g))add(dialogueCharacter(match[1]),match[2]);
for(const [character,text]of [['misspell','Your words cannot stay in order!'],['daisy','What would you like to drink?'],['daisy','Here you are.'],['ringo','You got the letter D piece!'],['ringo','Now say the whole sentence.'],['amy','The letter D.'],['amy','Well done!']])add(character,text);
const out=new URL('assets/audio/stage4/',root),index={},known=new Map();await fs.mkdir(out,{recursive:true});
const signature=(character,text)=>{const c=CHARACTER_VOICES[character];return JSON.stringify([c.voiceId,c.settings,text]);};
for(const [key,asset]of Object.entries({...CHARACTER_AUDIO_MANIFEST,...STAGE3_AUDIO_MANIFEST})){const [character,text]=JSON.parse(key);if(CHARACTER_VOICES[character])known.set(signature(character,text),Promise.resolve(asset));}
let generated=0,completed=0;
async function resolveAsset(character,text){
 const sig=signature(character,text);
 if(known.has(sig))return known.get(sig);
 const pending=(async()=>{
  const name=crypto.createHash('sha256').update(sig).digest('hex').slice(0,24)+'.mp3',file=new URL(name,out);
  try{await fs.access(file);}catch{
   const r=await fetch((process.env.MAGIC_VOICE_ORIGIN||'http://localhost:3000')+'/api/magic-english/character-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,text})});
   if(!r.ok)throw Error('Stage 4 voice generation failed: '+r.status+' / '+character);
   await fs.writeFile(file,Buffer.from(await r.arrayBuffer()));generated++;
  }
  return 'assets/audio/stage4/'+name;
 })();known.set(sig,pending);return pending;
}
const jobs=[...entries];
async function worker(){for(;;){const job=jobs.shift();if(!job)return;const [key,{character,text}]=job;index[key]=await resolveAsset(character,text);completed++;if(completed%40===0)console.log(JSON.stringify({prepared:completed,total:entries.size,newlyGenerated:generated}));}}
await Promise.all([worker(),worker()]);
await fs.writeFile(new URL('manifest.js',out),'// Fixed ElevenLabs Stage 4 lines.\nexport const STAGE4_AUDIO_MANIFEST='+JSON.stringify(Object.fromEntries(Object.entries(index).sort(([a],[b])=>a.localeCompare(b))),null,2)+';\n');
console.log(JSON.stringify({lines:entries.size,newlyGenerated:generated}));
