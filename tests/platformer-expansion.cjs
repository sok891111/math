const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
const {setup,snap,walkStage,launchOptions}=require('./platformer-driver.cjs');
(async()=>{
 const browser=await chromium.launch(launchOptions),p=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await setup(p);await p.locator('#start').click();
 const visited=new Set(),species=new Set(),claims=new Set();let wins=0,screens=0;
 for(let stage=0;stage<6;stage++){
  const initial=await snap(p);assert.equal(visited.has(initial.map.id),false);visited.add(initial.map.id);console.log('Walking '+initial.map.id);
  await p.screenshot({path:path.join(__dirname,'../test-artifacts/map-'+initial.map.id+'.png')});
  const clear=await walkStage(p,{onWin:async s=>{wins++;const d=s.drops.at(-1);assert.ok(d&&!d.got);assert.equal(s.progress.total,wins);assert.equal(s.progress.stats.chests,claims.size);assert.ok(s.monsters.some(m=>m.id===d.id&&m.defeated));species.add(d.kind);},onLoot:async s=>{const d=s.drops.find(d=>d.got&&!claims.has(d.id));assert.ok(d,'Each loot overlay represents a new claim');claims.add(d.id);assert.equal(s.progress.stats.chests,claims.size);if(!screens++){await p.waitForTimeout(450);await p.screenshot({path:path.join(__dirname,'../test-artifacts/treasure-reveal.png')});}}});
  assert.ok(clear.defeated>0);console.log('Cleared '+clear.map.id+' / wins '+clear.defeated+' / total '+clear.progress.total);
  await p.keyboard.up('ArrowRight');await p.keyboard.up('Space');await p.locator('#next').click();
 }
 assert.equal(visited.size,6);assert.equal(species.size,9);assert.ok(wins>=12);assert.equal(claims.size,wins);const before=await snap(p);assert.ok(before.progress.stats.gems>=wins*3);
 await p.locator('#fullscreen-game').click();await p.locator('#open-badges').click();assert.equal(await p.locator('.collectible-card').count(),67);await p.locator('#badge-ownership').selectOption('earned');assert.equal(await p.locator('.collectible-card').count(),before.progress.badgeCount);
 await p.locator('[data-badge="first-light"]').click();await p.locator('#equip-badge').click();await p.locator('#close-detail').click();await p.locator('#badge-ownership').selectOption('locked');assert.ok(await p.locator('.collectible-card.locked').count()>0);await p.locator('.collectible-card.locked').first().click();assert.equal(await p.locator('#equip-badge').isDisabled(),true);await p.locator('#close-detail').click();await p.locator('#badge-ownership').selectOption('all');await p.screenshot({path:path.join(__dirname,'../test-artifacts/collection-room.png')});await p.locator('#close-badges').click();
 await p.locator('#fullscreen-game').click();await p.reload();const restored=await snap(p);assert.equal(restored.progress.total,before.progress.total);assert.equal(restored.progress.stats.gems,before.progress.stats.gems);assert.equal(restored.progress.equipped,'first-light');assert.equal(restored.progress.badgeCount,before.progress.badgeCount);
 await p.setViewportSize({width:390,height:844});await p.locator('#open-badges').click();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:path.join(__dirname,'../test-artifacts/collection-room-mobile.png')});
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: all six maps physically completed, nine species, real victory-position drops, pickup-only gems, reward queues, 67-card album, filters, detail/equip, save restoration, fullscreen and mobile.');
})().catch(e=>{console.error(e);process.exit(1);});
