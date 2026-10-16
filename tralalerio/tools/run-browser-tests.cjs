const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const gameDir=path.resolve(__dirname,'..');
fs.mkdirSync(path.resolve(gameDir,'../test-artifacts/tralalerio'),{recursive:true});
for(const file of ['browser.mjs','browser-expansion.mjs','browser-battle.mjs','browser-animations.mjs','browser-transition.mjs','browser-minecraft-skills.mjs','browser-capture.mjs','browser-ledge.mjs','browser-sendout.mjs','browser-math.mjs','browser-healing.mjs','browser-first-badge.mjs','browser-trainer-encounter.mjs','browser-egg-mission.mjs','browser-rival-arrival.mjs']){
 const result=spawnSync(process.execPath,[path.join(gameDir,'tests',file)],{cwd:gameDir,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
