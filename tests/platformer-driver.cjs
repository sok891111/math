const assert=require('node:assert/strict');
const maps=require('../platformer/maps.js');
const launchOptions={headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})};
async function setup(page,ids=maps.layouts.map(m=>m.id)){
 await page.addInitScript(ids=>{if(!sessionStorage.getItem('map-test-seeded')){localStorage.setItem('seonyul-map-deck-v1',JSON.stringify({queue:ids.slice().reverse(),last:''}));sessionStorage.setItem('map-test-seeded','1');}},ids);
 await page.goto('http://localhost:4173/platformer/');
}
const snap=page=>page.evaluate(()=>sunshine.snapshot());
async function solve(page){const n=Number(await page.locator('#a').textContent())+Number(await page.locator('#b').textContent());await page.keyboard.type(String(n));await page.locator('#submit').click();assert.equal((await snap(page)).battle.outcome,'won');await page.locator('#continue').click();}
async function walkStage(page,{capture,onWin,onLoot,skipKind}={}){
 let jumpAt=0,previousX=-1,stuck=0;const deadline=Date.now()+70000;
 while(Date.now()<deadline){let s=await snap(page);if(s.mode==='clear')return s;
  if(s.mode==='quiz'){await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowLeft');await page.keyboard.up('Space');jumpAt=0;const n=Number(await page.locator('#a').textContent())+Number(await page.locator('#b').textContent());await page.keyboard.type(String(n));await page.locator('#submit').evaluate(e=>{e.click();e.click();});assert.equal((await snap(page)).battle.outcome,'won');if(onWin)await onWin(await snap(page));await page.locator('#continue').click();await page.waitForTimeout(220);continue;}
  if(s.mode==='loot'){await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowLeft');await page.keyboard.up('Space');jumpAt=0;if(onLoot)await onLoot(s);while(await page.locator('#loot-dialog').isVisible())await page.locator('#loot-next').click();continue;}
  assert.equal(s.mode,'play');
  const drop=s.drops.find(d=>!d.got),p=s.player;
  if(drop){const delta=drop.x+18-(p.x+p.w/2);await page.keyboard.up('Space');jumpAt=0;if(Math.abs(delta)<35){await page.keyboard.up('ArrowRight');await page.keyboard.up('ArrowLeft');}else{await page.keyboard.up(delta>0?'ArrowLeft':'ArrowRight');await page.keyboard.down(delta>0?'ArrowRight':'ArrowLeft');}await page.waitForTimeout(60);continue;}
  await page.keyboard.up('ArrowLeft');await page.keyboard.down('ArrowRight');
  const support=s.platforms.find(r=>Math.abs(r.y-p.y-p.h)<2&&p.x+p.w>r.x&&p.x<r.x+r.w);
  const obstacle=s.platforms.some(r=>r!==support&&r.x>=p.x+p.w-2&&r.x-(p.x+p.w)<75&&r.y<p.y+p.h-3&&r.y+r.h>p.y);
  const gap=support?.ground&&support.x+support.w-(p.x+p.w)<85&&!s.platforms.some(r=>r.ground&&r.x===support.x+support.w&&r.y>=support.y);
  if(Math.abs(p.x-previousX)<.3)stuck++;else stuck=0;previousX=p.x;
  if(jumpAt&&Date.now()-jumpAt>550){await page.keyboard.up('Space');jumpAt=0;}
  const skip=s.monsters.some(m=>!m.defeated&&m.kind===skipKind&&m.x-p.x-p.w>0&&m.x-p.x-p.w<95);
  if(p.grounded&&!jumpAt&&(obstacle||gap||stuck>3||skip)){await page.keyboard.down('Space');jumpAt=Date.now();}
  if(capture)await capture(s);
  await page.waitForTimeout(45);
 }
 throw Error('Traversal timed out: '+JSON.stringify(await snap(page)));
}
module.exports={setup,snap,solve,walkStage,launchOptions};
