const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'central-state-browser-'));
for (const name of ['.next', 'public', 'node_modules', 'package.json', 'next.config.js']) fs.symlinkSync(path.join(root, name), path.join(dir, name));
const base = 'http://localhost:4194';
const server = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '-p', '4194'], {cwd: dir, env: {...process.env, SUPABASE_URL:'', SUPABASE_ANON_KEY:'', SUPABASE_SERVICE_ROLE_KEY:'', VERCEL:''}, stdio:'ignore'});
let browser;
async function waitFor(check) {for(let i=0;i<100;i++){try {if(await check())return;} catch(error) {if(!/Execution context was destroyed/.test(error.message))throw error;}await new Promise(r=>setTimeout(r,100));}throw Error('Timed out');}
(async () => {
 try {
  await waitFor(async()=>{try{return (await fetch(base)).ok;}catch{return false;}});
  const user = {id:'Sync12',name:'중앙저장테스트',createdAt:new Date().toISOString()};
  fs.writeFileSync(path.join(dir,'users.json'),JSON.stringify([user]));
  const key = 'seonyul-block-island-v1_' + user.id;
  const endpoint = base+'/api/user/'+user.id+'/state';
  const get = async()=> (await (await fetch(endpoint)).json()).games;
  browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  async function context() {
   const context = await browser.newContext();
   await context.addInitScript(()=>{const original=window.setInterval;window.setInterval=function(fn,ms,...args){if(ms===600000)window.__centralTick=fn;return original(fn,ms,...args);};});
   return context;
  }
  const a = await context(), page = await a.newPage();
  await page.goto(base);
  const original = JSON.stringify({completed:2,garden:[],badges:{'8+5':1},bonds:{},supplies:{},treasures:['old-treasure']});
  await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:original});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/'+user.id+'/island');
  await waitFor(async()=> (await get()).island?.entries[key]===original);
  await page.waitForSelector('script[src="/game.js?v=6"]', {state:'attached'});
  assert.deepEqual(errors,[]);
  // A clean browser restores the server record, rather than uploading a fresh game.
  const b = await context(), second = await b.newPage();
  await second.goto(base+'/'+user.id+'/island');
  await second.waitForSelector('script[src="/game.js?v=6"]', {state:'attached'});
  assert.equal((await get()).island.entries[key],original);
  assert.equal(await second.evaluate(key=>JSON.parse(localStorage.getItem(key)).completed,key),2);
  // The real 10-minute callback uploads the latest locally saved progress.
  const updated = JSON.stringify({completed:3,garden:[],badges:{},bonds:{},supplies:{},treasures:['kept']});
  await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:updated});
  await page.evaluate(()=>window.__centralTick());
  assert.equal((await get()).island.entries[key],updated);
  // Offline progress survives and is uploaded immediately on the online event.
  await a.setOffline(true);
  const offline = JSON.stringify({completed:3,garden:[{x:1,y:2}],badges:{},bonds:{},supplies:{},treasures:['offline']});
  await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:offline});
  await page.evaluate(()=>window.__centralTick());
  assert.equal((await get()).island.entries[key],updated);
  await a.setOffline(false);
  await waitFor(async()=> (await get()).island.entries[key]===offline);
  // Another existing browser migrates its own original record once, with a backup.
  const c = await context(), third = await c.newPage();
  await third.goto(base);
  const thirdOriginal = JSON.stringify({completed:1,garden:[],badges:{},bonds:{},supplies:{},treasures:['third']});
  await third.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:thirdOriginal});
  await third.goto(base+'/'+user.id+'/island');
  await waitFor(async()=> (await get()).island.entries[key]===thirdOriginal);
  const backups=fs.readdirSync(path.join(dir,'.central-state-data')).map(name=>JSON.parse(fs.readFileSync(path.join(dir,'.central-state-data',name)))).filter(row=>row.key.includes(':migration:'));
  assert(backups.some(row=>row.value.games.island?.[key]===original));
  assert(backups.some(row=>row.value.games.island?.[key]===thirdOriginal));
  // A clean running browser adopts changes from the same personal URL.
  await second.evaluate(()=>window.__centralTick());
  await waitFor(async()=> await second.evaluate(key=>JSON.parse(localStorage.getItem(key)).completed,key)===1);
  for(const route of ['platformer','creative','hanja','tralalerio','magic-english']) {
   const response=await fetch(base+'/'+user.id+'/'+route);assert.equal(response.status,200);
   assert.match(await response.text(),/BlockCentralState.boot\("Sync12"\)/);
  }
  const world=await fetch(base+'/magic-english/block-world?user='+user.id);assert.match(await world.text(),/BlockCentralState.boot\("Sync12"\)/);
  assert.equal((await fetch(base+'/api/user/NoUser/state')).status,404);
  assert.equal((await fetch(endpoint,{method:'POST',headers:{origin:'https://other.example','Content-Type':'application/json'},body:'{}'})).status,403);
  // React lobby also hydrates before badge effects run.
  const lobby=await b.newPage();await lobby.goto(base+'/'+user.id);await lobby.waitForFunction(()=>Boolean(window.BlockCentralState));await lobby.evaluate(()=>window.BlockCentralState.start('Sync12'));assert.equal(await lobby.locator('#central-state-status').count(),0);
  console.log('PASS: real Next API, original migration backups, fresh-browser restore, 10-minute upload, offline/reconnect, shared progress, all game routes and lobby.');
 } finally {
  await browser?.close();server.kill();await new Promise(resolve=>{if(server.exitCode!==null)return resolve();server.once('exit',resolve);});fs.rmSync(dir,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
