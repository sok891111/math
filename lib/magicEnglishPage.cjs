const fs=require('node:fs'),path=require('node:path');
function magicEnglishHTML(world=false,user=null){
 let html=fs.readFileSync(path.join(process.cwd(),'public/magic-english',world?'block-world/index.html':'index.html'),'utf8');
 const context=JSON.stringify(user?{id:user.id,name:user.name}:null).replace(/</g,'\\u003c');
 html=html.replace('</head>',`<script>window.__BLOCK_USER__=${context};</script></head>`);
 if(!world){const gate=user?'/'+encodeURIComponent(user.id):'/';html=html.replace('<button id="close-menu"',`<a href="${gate}" style="display:block;padding:14px;text-align:center">🎮 게임 선택으로</a><button id="close-menu"`);}
 return html;
}
module.exports={magicEnglishHTML};
