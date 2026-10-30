const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const platformerPublicDir = path.join(publicDir, 'platformer');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(platformerPublicDir)) {
  fs.mkdirSync(platformerPublicDir, { recursive: true });
}

// Root assets to copy to public/
const rootFiles = ['index.html', 'game.js', 'style.css', 'og-image.png'];
for (const file of rootFiles) {
  const src = path.join(rootDir, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

// Platformer assets to copy to public/platformer/
const platformerDir = path.join(rootDir, 'platformer');
if (fs.existsSync(platformerDir)) {
  const files = fs.readdirSync(platformerDir);
  for (const file of files) {
    const src = path.join(platformerDir, file);
    const dest = path.join(platformerPublicDir, file);
    const stat = fs.statSync(src);
    if (stat.isFile()) {
      fs.copyFileSync(src, dest);
    }
  }
}

const creativeDir = path.join(rootDir, 'creative');
if (fs.existsSync(creativeDir)) {
  fs.cpSync(creativeDir, path.join(publicDir, 'creative'), { recursive: true });
}

const hanjaDir = path.join(rootDir, 'hanja');
if (fs.existsSync(hanjaDir)) {
  fs.cpSync(hanjaDir, path.join(publicDir, 'hanja'), { recursive: true });
}

const tralalerioDir = path.join(rootDir, 'tralalerio');
fs.cpSync(tralalerioDir, path.join(publicDir, 'tralalerio'), {
  recursive: true,
  filter: (src) => {
    const relative = path.relative(tralalerioDir, src);
    return !relative || relative === 'assets' || relative.startsWith(`assets${path.sep}`) ||
      (!relative.includes(path.sep) && /\.(html|css|js)$/.test(relative));
  },
});


const magicDir=path.join(rootDir,'magic-english');
if(fs.existsSync(magicDir)){
 const destination=path.join(publicDir,'magic-english');
 fs.rmSync(destination,{recursive:true,force:true});
 fs.cpSync(magicDir,destination,{recursive:true,filter:src=>{
  const relative=path.relative(magicDir,src),parts=relative.split(path.sep);
  if(!relative)return true;
  if(parts.some(p=>p.startsWith('.')))return false;
  if(parts[0]==='block-world')return false;
  if(['magic-english-block-world.js','magic-english-heart-summary.js'].includes(relative))return false;
  if(parts[0]==='assets')return !parts.includes('mobs');
  if(['block-world','creative'].includes(parts[0]))return fs.statSync(src).isDirectory()||/\.(js|html|css|json|png|jpg|svg|mp3|txt)$/.test(relative);
  return parts.length===1&&/\.(js|html|css)$/.test(relative);
 }});
}

console.log('✅ Synchronized public assets, including magic-english.');

fs.copyFileSync(path.join(rootDir, 'lib/central-state/keys.cjs'), path.join(publicDir, 'central-state-keys.js'));
fs.copyFileSync(path.join(rootDir, 'scripts/central-state-client.js'), path.join(publicDir, 'central-state.js'));

fs.copyFileSync(path.join(rootDir, 'scripts/learning-client.js'), path.join(publicDir, 'learning-client.js'));

fs.copyFileSync(path.join(rootDir, 'scripts/game-access-client.js'), path.join(publicDir, 'game-access.js'));
