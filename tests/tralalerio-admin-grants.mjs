// Run against an isolated Next server containing only user TestGrant.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.GRANTS_TEST_URL||'http://localhost:3011';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const denied=await page.request.post(base+'/api/admin/tralalerio',{data:{userId:'TestGrant',species:'mew',level:50,quantity:1}});assert.equal(denied.status(),401);
 const invalid=await page.request.post(base+'/api/admin/tralalerio',{headers:{'x-admin-secret':'admin'},data:{userId:'TestGrant',species:'mew',level:101,quantity:1}});assert.equal(invalid.status(),400);
 await page.goto(base+'/admin');await page.locator('input[type=password]').fill('admin');await page.locator('button[type=submit]').click();
 await page.getByText('포켓몬·몬스터 추가 / 복구',{exact:true}).click();
 await page.getByLabel('추가할 몬스터',{exact:true}).selectOption('mew');await page.getByLabel('몬스터 레벨',{exact:true}).fill('50');await page.getByLabel('몬스터 마릿수',{exact:true}).fill('10');
 await page.getByRole('button',{name:'복구테스트에게 추가',exact:true}).click();await page.getByRole('status').filter({hasText:'지급 등록 완료'}).waitFor();
 const list=await page.request.get(base+'/api/user/TestGrant/tralalerio-grants');const {grants}=await list.json();assert.equal(grants.length,1);assert.equal(grants[0].quantity,10);
 await page.goto(base+'/TestGrant/tralalerio');await page.locator('#loading').waitFor({state:'hidden'});
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1:TestGrant'))?.adminGrantReceipts?.length===1);
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('tralalerio-save-v1:TestGrant')));
 let save=await read();assert.equal(save.party.length,1);assert.equal(save.storage.length,10);assert.equal([...save.party,...save.storage].filter(p=>p.species==='mew'&&p.level===50).length,10);
 await page.reload();await page.locator('#loading').waitFor({state:'hidden'});await page.waitForTimeout(500);save=await read();assert.equal(save.party.length+save.storage.length,11);
 // Walk up to the real center PC and collect a registered monster through its UI.
 await page.evaluate(()=>{const key='tralalerio-save-v1:TestGrant',s=JSON.parse(localStorage.getItem(key));Object.assign(s,{map:'VioletPokecenter1F',x:9,y:2,facing:'up'});localStorage.setItem(key,JSON.stringify(s));});
 await page.reload();await page.locator('#loading').waitFor({state:'hidden'});await page.locator('#touch-action').click();
 const pc=page.locator('#center-pc');await pc.waitFor({state:'visible'});
 await pc.getByRole('button',{name:'누군가의 컴퓨터',exact:true}).click();
 await pc.getByRole('button',{name:'포켓몬을 데리고 간다',exact:true}).click();
 await pc.getByRole('button',{name:'데리고 가기',exact:true}).first().click();
 save=await read();assert.equal(save.party.length,2);assert.equal(save.party[1].species,'mew');assert.equal(save.storage.length,9);
 await page.evaluate(()=>localStorage.setItem('tralalerio-save-v1:TestGrant','broken-save'));
 await page.reload();await page.waitForFunction(()=>document.querySelector('#loading').textContent.includes('記録')||document.querySelector('#loading').textContent.includes('기록 보호'));
 assert.equal(await page.evaluate(()=>localStorage.getItem('tralalerio-save-v1:TestGrant')),'broken-save');
 assert.deepEqual(errors.filter(e=>!e.includes('기존 저장 기록을 읽지 못했어요')),[]);
 console.log('PASS: admin authentication, validation, UI grant, durable API history, personal-game receipt, PC-only delivery, center PC withdrawal, reload deduplication and unreadable-save protection');
}finally{await browser.close();}
