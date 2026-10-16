// Read-only drift report. Never overwrites the game or its Minecraft expansion.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const baseline=JSON.parse(fs.readFileSync(path.join(root,'upstream/baseline.json')));
const source=path.resolve(process.argv[2]||path.join(root,'../../yeondu-town-web'));
const hash=p=>fs.existsSync(p)?crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'):null;
function walk(dir,prefix=''){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name),prefix+e.name+'/'):[prefix+e.name])}
const dist=path.join(source,'dist');
if(!fs.existsSync(dist))throw Error('Pass the yeondu-town-web project path.');
const files=new Set([...Object.keys(baseline.files),...walk(dist)]);
const changed=[...files].filter(f=>hash(path.join(dist,f))!==(baseline.files[f]||null));
console.log(JSON.stringify({source,baselineCommit:baseline.commit,upstreamChanges:changed,
 localChanges:Object.keys(baseline.files).filter(f=>hash(path.join(root,f))!==baseline.files[f]),
 note:'Merge upstreamChanges into tralalerio manually; preserve Minecraft species, 60/40 weights, routing and per-user saves. This command writes nothing.'},null,2));
