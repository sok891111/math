// Use the user's original illustration, with a traced silhouette mask; no generated artwork.
const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const assets=path.resolve(__dirname,'../assets');
(async()=>{
 const {MINECRAFT_MOVES}=await import('../minecraft-moves.js'),data=JSON.parse(fs.readFileSync(path.join(assets,'battle-data.json'))),m=MINECRAFT_MOVES.gaddoongi,id='mc_gaddoongi';
 data.moves[m.id]={name:m.name,type:m.type,power:m.power,effect:m.effect,chance:m.chance,accuracy:m.accuracy,pp:m.pp};
 data.species[id]={name:'거뚱이',base:{hp:50,attack:45,defense:60,speed:30,specialAttack:45,specialDefense:50},types:['WATER','STEEL'],catchRate:220,baseExp:62,growth:'MEDIUM_FAST',minecraftKind:'gaddoongi',signatureMove:m.id,category:'물의 거북 몬스터',height:1.8,weight:210,description:'등껍질에 달린 네 개의 물대포로 물방울을 발사하고, 굵은 꼬리로 힘찬 물줄기를 뿜어낸다. 단단한 등껍질을 지닌 물의 거북 친구다.',artwork:'user-provided',learnset:[{level:1,move:m.id},{level:1,move:'TACKLE'},{level:7,move:'WATER_GUN'},{level:12,move:'HARDEN'},{level:20,move:'BUBBLEBEAM'}]};
 // Existing original move records are normally present; Hydro Pump can also be learned later.
 if(!data.moves.BUBBLEBEAM)data.species[id].learnset[4].move='HYDRO_PUMP';
 for(const table of Object.values(data.encounters))for(const period of ['morning','day','night'])if(!table[period].some(s=>s.species===id))table[period].push({species:id,level:6});
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{const page=await browser.newPage();await page.setContent('<canvas width="512" height="512"></canvas>');
 const source=fs.readFileSync(path.join(__dirname,'artwork/gaddoongi-reference.png')).toString('base64');
 for(const side of ['front','back']){
  const url=await page.evaluate(async({source,side})=>{
   const image=new Image();image.src='data:image/png;base64,'+source;await image.decode();const g=document.querySelector('canvas').getContext('2d');g.clearRect(0,0,512,512);g.save();if(side==='back'){g.translate(512,0);g.scale(-1,1);}g.translate(14,66);g.scale(484/1218,484/1218);g.translate(-746,-190);
   const mask=new Path2D('M839 286 C839 239 865 194 921 194 C979 194 1005 225 1016 248 L1083 271 Q1126 263 1157 293 C1247 278 1322 279 1384 292 Q1418 248 1472 245 C1532 240 1582 271 1598 325 L1627 404 Q1707 407 1767 469 Q1821 437 1818 394 L1799 356 Q1781 325 1800 309 C1833 286 1871 290 1893 307 Q1912 322 1918 354 L1918 417 Q1954 494 1955 571 C1956 631 1927 678 1894 690 Q1912 735 1885 782 Q1931 828 1911 862 L1923 958 Q1940 984 1921 1000 Q1856 1027 1787 1005 Q1764 1031 1719 1029 L1677 1041 Q1634 1072 1575 1065 L1494 1057 Q1443 1069 1385 1065 Q1332 1060 1322 1036 L1282 1018 Q1220 1037 1163 1025 L1103 1010 Q1053 1024 1009 1002 L972 1013 Q914 1029 861 1008 Q824 1009 806 989 Q796 961 810 926 L823 876 L835 823 Q826 791 846 766 L861 731 Q869 704 850 691 L797 666 Q752 650 751 608 C749 564 780 508 823 492 Q849 483 879 492 L909 505 L948 446 Q928 439 911 421 L879 396 C851 374 829 324 839 286 Z');
   mask.addPath(new Path2D('M1088 892 C1123 908 1164 921 1205 923 L1193 942 L1184 961 L1190 984 L1205 1050 L1081 1050 Z M1647 970 C1676 976 1702 971 1720 960 L1726 1000 L1707 1025 L1674 1040 L1645 1049 Z'));g.clip(mask,'evenodd');g.drawImage(image,0,0,2048,1080);g.restore();return document.querySelector('canvas').toDataURL('image/png');
  },{source,side});fs.writeFileSync(path.join(assets,'battle',`${id}-${side}.png`),Buffer.from(url.split(',')[1],'base64'));
 }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(assets,'battle-data.json'),JSON.stringify(data));console.log('Added Gaddoongi using the supplied illustration; front and mirrored party view.');
})().catch(e=>{console.error(e);process.exitCode=1});
