import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000/tralalerio/');
 await page.waitForFunction(()=>window.CreativeBattle&&window.FactoPuzzles&&window.createFactoUI);
 await page.evaluate(async()=>{
  const {Game}=await import('/tralalerio/engine.js?v=20261026-verdict1');
  const math=await import('/tralalerio/math-challenge.js?v=20261026-verdict1');
  const {createMathPuzzleUI}=await import('/tralalerio/math-puzzle-ui.js?v=20261026-verdict1');
  const [maps,data]=await Promise.all(['maps','battle-data'].map(n=>fetch('/tralalerio/assets/'+n+'.json').then(r=>r.json())));
  window.verdictTest={callbacks:0,saves:0};
  window.openVerdictTest=()=>{const g=new Game(maps,data,{random:()=>.5});g.startAdventure();g.startEncounter('pidgey',3);g.battle.enemy.hp=1;g.battle.s.animationPending=false;math.requestCapture(g,window.CreativeBattle,window.FactoPuzzles,()=>.9);window.verdictTest.g=g;window.verdictTest.q=math.questionFor(g.battle.s.mathChallenge,window.CreativeBattle,window.FactoPuzzles);window.verdictTest.ui=createMathPuzzleUI({getGame:()=>g,onSave:()=>window.verdictTest.saves++,onSolved:()=>window.verdictTest.callbacks++});window.verdictTest.ui.open();};
 });
 for(const correct of [true,false]){
  await page.evaluate(()=>window.openVerdictTest());
  const answer=await page.evaluate(correct=>{const q=window.verdictTest.q;return correct?q.answer[0]:q.choices.find(c=>c.value!==q.answer[0]).value},correct);
  const dialog=page.locator('.math-dialog[open]');await dialog.getByRole('button',{name:`답 조각 ${answer}`,exact:true}).click();await dialog.locator('.math-submit').click();
  const mark=dialog.locator('.math-verdict');assert.equal(await mark.getAttribute('data-result'),correct?'correct':'incorrect');assert.equal(await mark.locator(correct?'circle':'path').count(),1);
  assert.equal(await dialog.getAttribute('aria-busy'),'true');
  const before=await page.evaluate(()=>({balls:window.verdictTest.g.state.balls,turn:window.verdictTest.g.battle.s.turn,callbacks:window.verdictTest.callbacks}));
  await page.keyboard.press('Escape');await dialog.locator('.math-submit').evaluate(b=>b.click());
  assert.deepEqual(await page.evaluate(()=>({balls:window.verdictTest.g.state.balls,turn:window.verdictTest.g.battle.s.turn,callbacks:window.verdictTest.callbacks})),before);
  await dialog.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.verdictTest.callbacks),correct?1:2);
 }
 assert.deepEqual(errors,[]);console.log('PASS red circle/slash, delayed close, one callback, locked double submit/Escape');
}finally{await browser.close();}
