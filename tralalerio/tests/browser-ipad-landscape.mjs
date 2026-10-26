import {chromium,webkit,devices} from 'playwright';
import assert from 'node:assert/strict';
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{channel:'chrome'}:{})});
 try{
  const context=await browser.newContext({...devices['iPad (gen 7)']});const page=await context.newPage();
  await page.goto('http://localhost:3000/tralalerio');await page.locator('#loading').waitFor({state:'hidden'});
  for(const [width,height]of [[1024,768],[1180,820],[1366,1024],[768,1024],[1024,768]]){
   await page.setViewportSize({width,height});
   const layout=await page.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
    return {screen:rect('.screen-wrap'),pad:rect('.dpad'),actions:rect('.action-buttons'),a:rect('#touch-action'),b:rect('#touch-menu'),controls:getComputedStyle(document.querySelector('.touch-controls')).display,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   assert.equal(layout.overflow,false);
   if(width>height){
    assert.equal(layout.controls,'contents');assert.ok(layout.pad.right<=layout.screen.left);assert.ok(layout.actions.left>=layout.screen.right);
    for(const key of ['screen','pad','a','b']){const r=layout[key];assert.ok(r.left>=0&&r.right<=width&&r.top>=0&&r.bottom<=height,`${engine.name()} ${width} ${key}: ${JSON.stringify(r)}`)}
    assert.ok(Math.abs(layout.screen.width/layout.screen.height-10/9)<.01);
    assert.equal(await page.locator('#touch-action').evaluate(e=>getComputedStyle(e).width),'64px');
   }else{assert.equal(layout.controls,'flex');assert.ok(layout.pad.top>=layout.screen.bottom)}
  }
  await page.locator('#touch-menu').tap();await page.locator('#menu').waitFor({state:'visible'});await page.locator('#touch-menu').tap();await page.locator('#menu').waitFor({state:'hidden'});
  console.log(`PASS ${engine.name()}: iPad landscape sizes, portrait rotation, visible controls and B menu`);
 }finally{await browser.close()}
}
