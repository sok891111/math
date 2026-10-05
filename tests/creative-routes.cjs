const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'creative-routes-'));
for(const name of ['.next','public','node_modules','package.json','next.config.js'])fs.symlinkSync(path.join(root,name),path.join(dir,name));
const server=spawn(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'start','-p','4191'],{cwd:dir,env:{...process.env,SUPABASE_URL:'',SUPABASE_ANON_KEY:'',ADMIN_SECRET:'creative-local-test',VERCEL:''},stdio:'ignore'});
const base='http://localhost:4191';
(async()=>{try{
 let ready=false;for(let i=0;i<40;i++){try{ready=(await fetch(base+'/creative')).ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,250));}assert.ok(ready);
 const response=await fetch(base+'/api/admin/users',{method:'POST',headers:{'Content-Type':'application/json','x-admin-secret':'creative-local-test'},body:JSON.stringify({name:'테스트</script><script>bad()</script>'})});assert.equal(response.status,200);const {user}=await response.json();
 const page=await fetch(base+'/'+user.id+'/creative');assert.equal(page.status,200);assert.match(page.headers.get('cache-control'),/no-store/);const html=await page.text();assert.ok(html.includes('window.__BLOCK_USER__'));assert.ok(html.includes(user.id));assert.ok(!html.includes('<script>bad()'));assert.ok(html.includes('/creative/game.js'));
 assert.equal((await fetch(base+'/zzzzzz/creative')).status,404);
 assert.equal((await fetch(base+'/'+user.id)).status,200);assert.equal((await fetch(base+'/'+user.id+'/island')).status,200);assert.equal((await fetch(base+'/admin')).status,200);
 const trace=JSON.parse(fs.readFileSync(path.join(root,'.next/server/pages/[userId]/creative.js.nft.json')));assert.ok(trace.files.some(p=>p.endsWith('public/creative/index.html')));
 console.log('PASS: personal creative URL, escaped name, unknown-user 404, existing game routes, Vercel HTML tracing.');
 }finally{server.kill();await new Promise(resolve=>{if(server.exitCode!==null)return resolve();server.once('exit',resolve);});fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
