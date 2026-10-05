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
const rootFiles = ['index.html', 'game.js', 'style.css'];
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

fs.cpSync(path.join(rootDir, 'creative'), path.join(publicDir, 'creative'), { recursive: true });

console.log('✅ Synchronized public assets successfully.');
