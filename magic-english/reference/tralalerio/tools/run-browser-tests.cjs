const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const gameDir=path.resolve(__dirname,'..');
const audio=spawnSync(process.execPath,[path.join(__dirname,'check-audio-browser.cjs')],{cwd:path.resolve(gameDir,'..'),stdio:'inherit'});
if(audio.error)throw audio.error;if(audio.status!==0)process.exit(audio.status||1);
const townMap=spawnSync(process.execPath,[path.join(__dirname,'check-town-map-browser.cjs')],{cwd:path.resolve(gameDir,'..'),stdio:'inherit'});if(townMap.error)throw townMap.error;if(townMap.status!==0)process.exit(townMap.status||1);
fs.mkdirSync(path.resolve(gameDir,'../test-artifacts/tralalerio'),{recursive:true});
for(const file of ['browser-third-badge.mjs','browser-second-badge.mjs','browser-gym-finisher.mjs','browser-additional-pokemon.mjs','browser-difficulty.mjs','browser-controls.mjs','browser-pc-lab.mjs','browser.mjs','browser-expansion.mjs','browser-battle.mjs','browser-animations.mjs','browser-transition.mjs','browser-minecraft-skills.mjs','browser-capture.mjs','browser-ledge.mjs','browser-sendout.mjs','browser-math.mjs','browser-healing.mjs','browser-first-badge.mjs','browser-trainer-encounter.mjs','browser-egg-mission.mjs','browser-rival-arrival.mjs','browser-ipad-touch.mjs','browser-learning.mjs','browser-hp-messages.mjs','browser-math-capture.mjs','browser-phone-call.mjs','browser-wild-areas.mjs','browser-monster-dex.mjs']){
 const result=spawnSync(process.execPath,[path.join(gameDir,'tests',file)],{cwd:gameDir,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
