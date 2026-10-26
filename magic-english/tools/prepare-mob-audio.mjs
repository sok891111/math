// Uses the local server key. Identical voice settings/text share one recording across roles.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {MOB_SCRIPTS,MOB_CAST,mobPractice} from '../block-world/mob-conversations.js';
import {CHARACTER_VOICES} from '../character-voices.js';
import {CHARACTER_AUDIO_MANIFEST} from '../character-audio-manifest.js';
import {STAGE3_AUDIO_MANIFEST} from '../assets/audio/stage3/manifest.js';
import {STAGE4_AUDIO_MANIFEST} from '../assets/audio/stage4/manifest.js';
const root=new URL('../',import.meta.url),entries=new Map();
function add(character,text){entries.set(JSON.stringify([character,text]),{character,text});}
for(const script of MOB_SCRIPTS){const cast=MOB_CAST[script.type];for(const row of script.rows){add(cast.character,row.question);add('amy',mobPractice(row.target).text);}add(cast.character,script.ending);}
add('ringo','Well done!');
const out=new URL('assets/audio/mobs/',root),index={},known=new Map();await fs.mkdir(out,{recursive:true});
const signature=(character,text)=>{const c=CHARACTER_VOICES[character];return JSON.stringify([c.voiceId,c.settings,text]);};
for(const [key,asset]of Object.entries({...CHARACTER_AUDIO_MANIFEST,...STAGE3_AUDIO_MANIFEST,...STAGE4_AUDIO_MANIFEST})){const [character,text]=JSON.parse(key);if(CHARACTER_VOICES[character])known.set(signature(character,text),Promise.resolve(asset));}
let generated=0,completed=0;
async function resolveAsset(character,text){
 const sig=signature(character,text);
 if(known.has(sig))return known.get(sig);
 const pending=(async()=>{
  const name=crypto.createHash('sha256').update(sig).digest('hex').slice(0,24)+'.mp3',file=new URL(name,out);
  try{await fs.access(file);}catch{
   const r=await fetch((process.env.MAGIC_VOICE_ORIGIN||'http://localhost:3000')+'/api/magic-english/character-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,text})});
   if(!r.ok)throw Error('Monster voice generation failed: '+r.status+' / '+character);
   await fs.writeFile(file,Buffer.from(await r.arrayBuffer()));generated++;
  }
  return 'assets/audio/mobs/'+name;
 })();known.set(sig,pending);return pending;
}
const jobs=[...entries];
async function worker(){for(;;){const job=jobs.shift();if(!job)return;const [key,{character,text}]=job;index[key]=await resolveAsset(character,text);completed++;if(completed%40===0)console.log(JSON.stringify({prepared:completed,total:entries.size,newlyGenerated:generated}));}}
await Promise.all([worker(),worker()]);
await fs.writeFile(new URL('manifest.js',out),'// Fixed ElevenLabs monster questions, endings and familiar guides.\nexport const MOB_AUDIO_MANIFEST='+JSON.stringify(Object.fromEntries(Object.entries(index).sort(([a],[b])=>a.localeCompare(b))),null,2)+';\n');
console.log(JSON.stringify({lines:entries.size,newlyGenerated:generated}));
