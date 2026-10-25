import {solveMath} from './math-test-helper.mjs';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../engine.js';
import {createPokemon} from '../battle.js';
import {MINECRAFT_MOVES} from '../minecraft-moves.js';
const data=JSON.parse(fs.readFileSync('assets/battle-data.json')),maps=JSON.parse(fs.readFileSync('assets/maps.json'));
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
fs.mkdirSync('../test-artifacts/tralalerio',{recursive:true});
function seed(kind,{enemy=false,playback=true}={}){
 const g=new Game(maps,data,{random:()=>.5});g.chooseStarter('치코리타');
 g.state.party=[createPokemon(data,enemy?'chikorita':'mc_'+kind,5,()=>.5)];g.startEncounter(enemy?'mc_'+kind:'hoothoot',5);
 if(playback){const b=g.battle;b.s.logs=[];b.s.animationEvents=[];b.s.visualBefore=b.visual();b.use(enemy?'enemy':'player',0);b.s.visualAfter=b.visual();b.s.animationPending=true;}
 return g.serialize();
}
async function setup(kind,options={}){
 const page=await browser.newPage({viewport:options.mobile?{width:390,height:844}:{width:1440,height:1200},reducedMotion:options.reduced?'reduce':'no-preference'});
 page.on('pageerror',e=>errors.push(e.message));if(options.failAssets)await page.route('**/assets/animations/frames.json?*',r=>r.abort());
 await page.addInitScript(seed=>{
  if(!sessionStorage.getItem('mc-seed')){localStorage.setItem('tralalerio-save-v1',seed);sessionStorage.setItem('mc-seed','1')}
  Math.random=()=>.5;window.__skillEvents=[];
  for(const type of ['start','impact','end'])document.addEventListener('battle-animation-'+type,e=>window.__skillEvents.push({type,...e.detail}));
 },seed(kind,options));
 await page.goto('http://localhost:3000/tralalerio');await page.locator('#loading').waitFor({state:'hidden'});return page;
}
async function done(p){await p.waitForFunction(()=>document.querySelector('#battle-screen').getAttribute('aria-busy')==='false')}
try{
 const sheet=await browser.newPage();await sheet.goto('http://localhost:3000/tralalerio');
 const rendered=await sheet.evaluate(async()=>{
  const {MINECRAFT_MOVES}=await import('/tralalerio/minecraft-moves.js?v=20261016-skills1');
  const {drawMinecraftMove}=await import('/tralalerio/minecraft-animation.js?v=20261016-skills1');
  document.querySelectorAll('style,link[rel=stylesheet]').forEach(el=>el.remove());
  document.body.replaceChildren();document.body.style.cssText='display:grid;grid-template-columns:repeat(4,320px);gap:8px;background:#172220;padding:16px;color:#e8ebcf';
  const results=[];
  for(const m of Object.values(MINECRAFT_MOVES)){
   const card=document.createElement('div');card.style.cssText='background:#f0efda;color:#263a35;padding:8px';const label=document.createElement('p');label.textContent=m.name;card.append(label);document.body.append(card);
   for(const enemy of [false,true]){
    const c=document.createElement('canvas');c.width=160;c.height=96;c.style.cssText='width:300px;image-rendering:pixelated';const ctx=c.getContext('2d');
    const a=enemy?{x:116,y:30}:{x:38,y:70},t=enemy?{x:38,y:70}:{x:116,y:30};drawMinecraftMove(ctx,m.id,{a,t,p:.56});
    const pixels=ctx.getImageData(0,0,160,96).data;let count=0,hash=0;for(let i=0;i<pixels.length;i++){if(i%4===3&&pixels[i])count++;hash=(hash*31+pixels[i])|0}results.push({id:m.id,enemy,count,hash});
    ctx.globalCompositeOperation='destination-over';ctx.fillStyle='#e9e9d4';ctx.fillRect(0,0,160,96);card.append(c);
   }
  }
  return results;
 });
 assert.equal(rendered.length,48);assert.ok(rendered.every(r=>r.count>10));assert.equal(new Set(rendered.filter(r=>!r.enemy).map(r=>r.hash)).size,24);
 await sheet.setViewportSize({width:1340,height:1900});await sheet.screenshot({path:'../test-artifacts/tralalerio/minecraft-skills-contact.png',fullPage:true});await sheet.close();
 for(const [kind,options] of [['enderknight',{}],['enderdragon',{}],['warden',{enemy:true,mobile:true}],['skeleton',{enemy:true}],['witch',{failAssets:true}],['creeper',{reduced:true,mobile:true}]]){
  const p=await setup(kind,options),id=MINECRAFT_MOVES[kind].id;
  if(!options.reduced){await p.waitForFunction(id=>document.querySelector('.battle-scene')?.dataset.move===id,id);await p.waitForTimeout(340);
   assert.ok(await p.locator('.battle-fx').evaluate(c=>c.getContext('2d').getImageData(0,0,160,96).data.some((v,i)=>i%4===3&&v>0)),kind+' effect missing');
   await p.locator('.screen-wrap').screenshot({path:`../test-artifacts/tralalerio/skill-${kind}.png`});}
  await done(p);const events=await p.evaluate(()=>window.__skillEvents);assert.deepEqual(events.map(e=>e.type),['start','impact','end']);assert.equal(events[1].move,id);assert.equal(await p.locator('.battle-fx').count(),0);
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const state=await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')));assert.equal(state.battle.animationPending,false);await p.close();
 }
 const p=await setup('enderknight',{playback:false});while(await p.getByRole('button',{name:'다음 ▼',exact:true}).isVisible())await p.getByRole('button',{name:'다음 ▼',exact:true}).click();
 await p.getByRole('button',{name:/^싸운다/}).click();await p.getByRole('button',{name:/^소드 베기/}).click();await solveMath(p);await p.waitForFunction(()=>document.querySelector('.battle-scene')?.dataset.move==='MC_ENDERKNIGHT');
 const snapshot=await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')));await p.reload();await p.locator('#loading').waitFor({state:'hidden'});await done(p);
 const restored=await p.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1')));assert.equal(restored.party[0].moves[0].pp,snapshot.party[0].moves[0].pp);assert.equal(restored.battle.enemy.hp,snapshot.battle.enemy.hp);assert.equal(restored.battle.turn,1);await p.close();
 assert.deepEqual(errors,[]);console.log('PASS: 24 distinct effects / both directions, signature UI, sword/breath/sonic/arrow/potion, mobile/reduced motion, missing legacy effects fallback, reload without double damage or PP.');
}finally{await browser.close()}
