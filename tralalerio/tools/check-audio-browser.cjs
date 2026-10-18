const {chromium,webkit}=require('playwright');
(async()=>{for(const [name,type,options] of [['Chrome',chromium,{channel:'chrome'}],['Safari WebKit',webkit,{}]]){
 const browser=await type.launch({headless:true,...options});try{const context=await browser.newContext({hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const Native=window.AudioContext||window.webkitAudioContext;window.testAudioContexts=[];window.AudioContext=class extends Native{constructor(...args){super(...args);window.testAudioContexts.push(this)}}});
 await page.goto('http://localhost:3000/tralalerio/?start=violet');await page.waitForFunction(()=>document.querySelector('#loading').hidden);await page.locator('#screen').tap();await page.waitForFunction(()=>document.querySelector('#sound-toggle')?.dataset.track==='Music_VioletCity');
 const running=await page.evaluate(()=>testAudioContexts.some(c=>c.state==='running'));if(!running)throw Error(name+' audio did not unlock');
 await page.locator('#menu-button').tap();await page.locator('#sound-toggle').tap();if(await page.locator('#sound-toggle').textContent()!=='소리 켜기')throw Error('mute label');await page.reload();await page.waitForFunction(()=>document.querySelector('#loading').hidden);if(await page.locator('#sound-toggle').textContent()!=='소리 켜기')throw Error('mute not saved');await page.locator('#menu-button').tap();await page.locator('#sound-toggle').tap();await page.waitForFunction(()=>document.querySelector('#sound-toggle')?.dataset.track==='Music_VioletCity');
 if(await page.locator('#sound-volume').count()||await page.locator('.game-audio-controls').count())throw Error('outside audio controls remain');if(!await page.locator('#menu #sound-toggle').count())throw Error('audio toggle missing from menu');
 if(name==='Chrome'){
 const fs=require('node:fs'),path=require('node:path'),{Game}=await import('../engine.js');const dir=path.resolve(__dirname,'../assets');const maps=JSON.parse(fs.readFileSync(path.join(dir,'maps.json'))),data=JSON.parse(fs.readFileSync(path.join(dir,'battle-data.json')));
 for(const kind of ['field','wild','trainer','leader','rival']){const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.configureVioletTest();g.startVioletTest();let expected;
 if(kind==='field'){g.enter(maps.Route30,0,0);let spot;for(let y=1;y<g.map.height-1&&!spot;y++)for(let x=1;x<g.map.width-1&&!spot;x++)if(g.passable(x,y))spot={x,y};g.enter(maps.Route30,spot.x,spot.y);expected='Music_Route30';}
 else if(kind==='wild'){g.startEncounter('pidgey',3);expected=new Date().getHours()>=18||new Date().getHours()<4?'Music_JohtoWildBattleNight':'Music_JohtoWildBattle';}
 else {const id=kind==='rival'?'CherrygroveRival':Object.values(data.trainers).find(t=>kind==='leader'?t.badge:t.group==='YOUNGSTER').id;g.startTrainer(id);expected=kind==='leader'?'Music_JohtoGymBattle':kind==='rival'?'Music_RivalBattle':'Music_JohtoTrainerBattle';}
 if(g.state.battle){g.state.battle.animationPending=false;expected='';}if(!new Game(maps,data).restore(g.serialize()))throw Error('Invalid audio fixture '+kind);
 await page.evaluate(raw=>localStorage.setItem('tralalerio-save-v1:violet-test',raw),g.serialize());await page.reload();await page.waitForFunction(()=>document.querySelector('#loading').hidden);await page.keyboard.press('Shift');await page.waitForFunction(expected=>document.querySelector('#sound-toggle')?.dataset.track===expected,expected,{timeout:5000}).catch(async e=>{console.log(kind,expected,await page.evaluate(()=>({track:document.querySelector('#sound-toggle')?.dataset.track,contexts:testAudioContexts.map(c=>c.state),location:document.querySelector('#location').textContent,save:localStorage.getItem('tralalerio-save-v1:violet-test')?.slice(0,500)})));throw e});
 }
 console.log('Field music and silent wild / trainer / leader / rival battle screens passed.');
 }
 if(errors.length)throw Error(errors.join('\n'));console.log(name+': first-touch unlock, original Violet music, menu-only mute/reload and clean load passed.');
 await context.close();}finally{await browser.close();}}
})().catch(e=>{console.error(e);process.exitCode=1});
