import {FAREWELLS,NPC_FAREWELL_LABELS,farewellRole} from '../magic-english-farewells.js';
import {CONVERSATION_FOLLOWUPS} from '../magic-english-conversations.js';
// Export fixed ElevenLabs lines before deployment; no API key is written to game assets.
import fs from 'node:fs/promises';import crypto from 'node:crypto';
import {STAGE1_AUDIO_MANIFEST} from '../assets/audio/stage1/manifest.js';
import {REPEAT_DIALOGUES,SPEECH_TARGETS} from '../magic-english-learning.js';
import {OPTIONAL_NPC_PRAISE} from '../magic-english-airport-life.js';
import {STAGE1_WORDS} from '../magic-english-story.js';
import {STAGE2_WORDS} from '../magic-english-stage2.js';
import {clipCharacter,dialogueCharacter} from '../character-voices.js';
const root=new URL('../',import.meta.url),entries=new Map();
function add(character,text){text=STAGE1_AUDIO_MANIFEST[text]?.text||text;if(!text||/[^\x20-\x7e\n‘’“”…]/.test(text))return;const key=JSON.stringify([character,text]);entries.set(key,{character,text});}
for(const clip of Object.values(STAGE1_AUDIO_MANIFEST))add(clipCharacter(clip),clip.text);
for(const [id,variants]of Object.entries(REPEAT_DIALOGUES)){const character=id==='npc_kid_traveler'?'kid':dialogueCharacter(id.replace('npc_','').replace('s2_',''));for(const [question,phrase]of variants){add(character,question);add('amy',phrase);}}
for(const [id,variants] of Object.entries(REPEAT_DIALOGUES)){
 const labels={npc_traveler:'여행객',npc_pilot:'기장',npc_guard:'심사관',npc_cafe:'카페',npc_kid_traveler:'꼬마',npc_amy:'에이미',npc_ringo:'링고',npc_staff:'안내 직원',npc_hwalbin:'활빈',s2_nono:'노노',s2_ungeori:'웅얼이',s2_copycat:'따라쟁이',s2_commuter:'승객',s2_student:'꼬마',s2_passenger:'승객'};
 for(const [, ,key]of variants)for(const [question]of CONVERSATION_FOLLOWUPS[key]||CONVERSATION_FOLLOWUPS.thank_you)add(dialogueCharacter(labels[id]||'에이미'),question);
}
for(const rows of Object.values(CONVERSATION_FOLLOWUPS))for(const [question]of rows)add('amy',question);
for(const [id,label] of Object.entries(NPC_FAREWELL_LABELS))for(const [text]of FAREWELLS[farewellRole(id)]||FAREWELLS.traveler)add(dialogueCharacter(label),text);
for(const variants of Object.values(OPTIONAL_NPC_PRAISE))for(const [english]of variants)add('amy',english);
for(const phrase of Object.values(SPEECH_TARGETS))add('amy',phrase);
for(const info of Object.values({...STAGE1_WORDS,...STAGE2_WORDS}))add('ringo',info.sentence);
const source=await fs.readFile(new URL('magic-english-stage1.js',root),'utf8');
for(const match of source.matchAll(/voiceClip:\s*'([^'\n]+)'/g)){const text=match[1];const before=source.slice(Math.max(0,match.index-1300),match.index);const speaker=[...before.matchAll(/speaker:\s*'([^']+)'/g)].at(-1)?.[1]||'amy';add(dialogueCharacter(speaker),text);}
const out=new URL('assets/audio/characters/',root);await fs.mkdir(out,{recursive:true});const index={};let completed=0,generated=0;
async function worker(){for(;;){const item=tasks.shift();if(!item)return;const [key,{character,text}]=item;const hash=crypto.createHash('sha256').update(key).digest('hex').slice(0,24),file=new URL(hash+'.mp3',out);try{await fs.access(file);}catch{const existing=Object.values(STAGE1_AUDIO_MANIFEST).find(c=>c.text===text&&c.voice===(character==='misspell'||['staff','traveler','pilot','guard'].includes(character)?'Bill':'Fena'));if(existing)await fs.copyFile(new URL(existing.src,root),file);else{const response=await fetch((process.env.MAGIC_VOICE_ORIGIN||'http://localhost:3000')+(process.env.MAGIC_VOICE_ENDPOINT||'/api/magic-english/character-voice'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({character,text})});if(!response.ok)throw Error('Voice export failed: '+character+' / '+response.status+' / '+text);await fs.writeFile(file,Buffer.from(await response.arrayBuffer()));generated++;}}index[key]='assets/audio/characters/'+hash+'.mp3';completed++;}}
const tasks=[...entries];await Promise.all([worker(),worker()]);await fs.writeFile(new URL('character-audio-manifest.js',root),'// Pre-rendered ElevenLabs lines for immediate playback.\nexport const CHARACTER_AUDIO_MANIFEST='+JSON.stringify(index,null,2)+';\n');console.log(JSON.stringify({lines:completed,newlyGenerated:generated}));
