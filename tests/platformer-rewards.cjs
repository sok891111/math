const {chromium}=require('playwright');const assert=require('node:assert/strict');
const {setup,snap,walkStage,launchOptions}=require('./platformer-driver.cjs');
(async()=>{
 const browser=await chromium.launch(launchOptions),p=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await setup(p,['meadow','river']);await p.locator('#start').click();
 const final=await walkStage(p,{skipKind:'slime'});assert.equal(final.monsters.find(m=>m.kind==='slime').defeated,false);assert.ok(final.defeated>0&&final.defeated<3);assert.equal(final.progress.total,final.defeated);assert.equal(final.progress.stats.chests,final.defeated);
 const before=final.progress;await p.locator('#next').click();assert.equal((await snap(p)).map.id,'river');assert.equal((await snap(p)).progress.total,before.total);assert.equal((await snap(p)).progress.stats.gems,before.stats.gems);
 await p.locator('#open-badges').click();const frozen=(await snap(p)).player.x;await p.waitForTimeout(200);assert.equal((await snap(p)).player.x,frozen);await p.locator('[data-category="treasure"]').click();assert.ok(await p.locator('.collectible-card').count()>0);await p.locator('[data-badge="chest-1"]').click();await p.locator('#equip-badge').click();await p.locator('#close-detail').click();await p.locator('#close-badges').click();
 await p.reload();assert.equal((await snap(p)).progress.total,before.total);assert.equal((await snap(p)).progress.stats.gems,before.stats.gems);assert.equal((await snap(p)).progress.equipped,'chest-1');await p.locator('#restart').click();assert.equal((await snap(p)).progress.total,before.total);
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: uncaught monster does not block goal, only victories create drops, next-stage persistence, album pause/filter/equip and reload/restart preservation.');
})().catch(e=>{console.error(e);process.exit(1);});
