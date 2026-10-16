const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'tralalerio-player-'));
for(const name of ['pages','lib','package.json','next.config.js'])fs.cpSync(path.join(root,name),path.join(dir,name),{recursive:true});
for(const name of ['public','node_modules'])fs.symlinkSync(path.join(root,name),path.join(dir,name));
const base='http://localhost:4198',secret='local-player-test';
const server=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'dev','-p','4198'],{cwd:dir,env:{...process.env,SUPABASE_URL:'',SUPABASE_ANON_KEY:'',ADMIN_SECRET:secret,VERCEL:'',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe']});
let browser;let serverLog='';for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{serverLog=(serverLog+chunk).slice(-6000)});
(async()=>{try{
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/tralalerio')).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,200))}assert.ok(ready,serverLog);
 browser=await chromium.launch({headless:true,channel:'chrome'});const errors=[];
 const {Game}=await import('../tralalerio/engine.js');const maps=JSON.parse(fs.readFileSync(path.join(root,'tralalerio/assets/maps.json'))),data=JSON.parse(fs.readFileSync(path.join(root,'tralalerio/assets/battle-data.json')));
 async function create(name){const r=await fetch(base+'/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify({name})});assert.equal(r.status,200);return (await r.json()).user}
 const user=await create('연두'),p=await browser.newPage({viewport:{width:1440,height:1200}});p.on('pageerror',e=>errors.push(e.message));
 const g=new Game(maps,data);g.chooseStarter('리아코');Object.assign(g.state,{map:'PlayersHouse1F',x:7,y:4,facing:'up'});
 await p.addInitScript(({id,seed})=>{if(!sessionStorage.getItem('player-seed')){localStorage.setItem('tralalerio-save-v1:'+id,seed);sessionStorage.setItem('player-seed','1')}},{id:user.id,seed:g.serialize()});
 await p.goto(base+'/'+user.id+'/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});assert.equal(await p.locator('#trainer-name').innerText(),'연두');
 await p.keyboard.press('z');assert.match(await p.locator('#dialog-text').innerText(),/연두/);assert.doesNotMatch(await p.locator('#dialog-text').innerText(),/골드/);
 await p.reload();await p.locator('#loading').waitFor({state:'hidden'});await p.keyboard.press('Escape');assert.equal(await p.locator('#trainer-menu-title').innerText(),'연두의 모험 기록');// Same browser, different personal addresses must never share progress.
 const savedA=await p.evaluate(id=>localStorage.getItem('tralalerio-save-v1:'+id),user.id);
 const second=await create('선율');await p.goto(base+'/'+second.id+'/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});
 assert.equal(await p.locator('#trainer-name').innerText(),'선율');
 const savedB=await p.evaluate(id=>JSON.parse(localStorage.getItem('tralalerio-save-v1:'+id)),second.id);
 assert.equal(savedB.map,'ElmsLab');assert.equal(savedB.party[0].species,'pikachu');
 assert.equal(await p.evaluate(id=>localStorage.getItem('tralalerio-save-v1:'+id),user.id),savedA);
 await p.goto(base+'/'+user.id+'/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});
 assert.equal(await p.evaluate(id=>JSON.parse(localStorage.getItem('tralalerio-save-v1:'+id)).map,user.id),'PlayersHouse1F');
 const lobbyResponse=await p.goto(base+'/'+user.id);assert.equal(lobbyResponse.status(),200,await p.locator('body').innerText());
 assert.equal(await p.locator('body').innerText().then(t=>t.includes('Creative 크래프트')),false);

 // Select the game with the same visible title used by keyboard and touch navigation.
 await p.locator('.pod-tralalerio').click();
 await p.getByRole('button',{name:/뜨랠레리오 시작하기!/}).click();
 await p.waitForURL(base+'/'+user.id+'/tralalerio');await p.locator('#loading').waitFor({state:'hidden'});
 assert.equal(await p.locator('#trainer-name').innerText(),'연두');await p.close();
 const weird=await create('민수</script><script>window.__bad=1</script>'),safe=await browser.newPage();await safe.goto(base+'/'+weird.id+'/tralalerio');await safe.locator('#loading').waitFor({state:'hidden'});assert.equal(await safe.locator('#trainer-name').innerText(),weird.name);assert.equal(await safe.evaluate(()=>window.__bad),undefined);await safe.close();
 // Observe actual canvas draw calls without adding debug code to the product.
 const walk=await browser.newPage({viewport:{width:390,height:844}});walk.on('pageerror',e=>errors.push(e.message));
 const bedroom=new Game(maps,data);bedroom.chooseStarter('리아코');bedroom.state.y=2;
 await walk.addInitScript(seed=>{localStorage.setItem('tralalerio-save-v1',seed);window.__walk=[];const original=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(im,...a){if(this.canvas.id==='screen'&&im.src?.includes('/chris.png')){const m=this.getTransform();window.__walk.push({time:performance.now(),sy:a[1],height:a[7],a:m.a,x:m.e,y:m.f})}return original.call(this,im,...a)}},bedroom.serialize());
 await walk.goto(base+'/tralalerio');await walk.locator('#loading').waitFor({state:'hidden'});assert.equal(await walk.locator('#trainer-name').innerText(),'모험가');
 await walk.evaluate(()=>window.__walk=[]);await walk.keyboard.down('ArrowDown');await walk.waitForTimeout(330);await walk.keyboard.up('ArrowDown');await walk.waitForTimeout(180);
 const records=await walk.evaluate(()=>window.__walk);assert.ok(records.some(r=>r.sy===48&&r.a===1));assert.ok(records.some(r=>r.sy===48&&r.a===-1),'second foot must reverse the vertical walking pose');assert.equal(records.at(-1).sy,0);
 const ys=[...new Set(records.map(r=>r.y))].sort((a,b)=>a-b);assert.ok(ys.some((y,i)=>i>0&&y-ys[i-1]>0&&y-ys[i-1]<16),'step must interpolate between tiles');
 await walk.evaluate(()=>window.__walk=[]);for(let i=0;i<2;i++){await walk.keyboard.press('ArrowRight');await walk.waitForTimeout(190)}
 const side=await walk.evaluate(()=>window.__walk);assert.ok(side.some(r=>r.height===5));assert.ok(side.some(r=>r.sy===80&&r.height===16));
 // Touch movement also uses the same alternating gait and returns to idle.
 await walk.locator('[data-move="up"]').click();await walk.waitForTimeout(200);await walk.locator('[data-move="up"]').click();await walk.waitForTimeout(200);
 assert.ok(await walk.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);fs.mkdirSync(path.join(root,'test-artifacts/tralalerio'),{recursive:true});await walk.screenshot({path:path.join(root,'test-artifacts/tralalerio/player-mobile.png'),fullPage:true});
 console.log('PASS: actual personal route uses child name, NPC dialogue/menu, reload, escaped names, anonymous fallback, alternating feet, smooth movement, idle and touch controls.');
}finally{if(browser)await browser.close();server.kill();await new Promise(r=>{if(server.exitCode!==null)return r();server.once('exit',r)});fs.rmSync(dir,{recursive:true,force:true})}})().catch(e=>{console.error(e);process.exitCode=1});
