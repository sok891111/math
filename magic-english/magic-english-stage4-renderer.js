import {schoolArt} from './magic-english-stage3-renderer.js';
const {rect,text,sign,shadow,windowPanel,door,plant,desk,shelf,notice,arrow}=schoolArt;
function plate(c,x,y,food=false){rect(c,x,y+2,18,9,'#81979a');rect(c,x+1,y+1,16,9,'#ede8d3');rect(c,x+3,y+2,12,6,'#faf6e1');if(food){rect(c,x+4,y+3,6,4,'#c7824e');rect(c,x+10,y+2,4,4,'#80a15f');rect(c,x+4,y+6,9,1,'#e1bf6b');}}
function cup(c,x,y){rect(c,x+1,y,9,2,'#d7e8de');rect(c,x+2,y+2,7,9,'#91bec9');rect(c,x+3,y+3,2,6,'#c8e1df');rect(c,x+8,y+1,1,9,'#6e9eac');}
function steam(c,x,y,now){for(let i=0;i<3;i++){const dy=Math.floor((now/350+i*2)%6);rect(c,x+i*5+(i%2),y-dy,2,3,'#e6e1cb');rect(c,x+i*5-1,y-dy-2,2,2,'#f4edd8');}}
function mealTable(c,x,y,w=44,served=false){shadow(c,x,y+25,w,4);rect(c,x+4,y+16,3,14,'#667977');rect(c,x+w-7,y+16,3,14,'#667977');rect(c,x,y,w,21,'#866146');rect(c,x+1,y,w-2,17,'#caa274');rect(c,x+2,y+1,w-4,2,'#e1c195');for(let side=0;side<2;side++){rect(c,x+4+side*(w-15),y+22,10,4,'#547f89');rect(c,x+4+side*(w-15),y-5,10,4,'#547f89');}plate(c,x+3,y+4,served);cup(c,x+w-12,y+3);}
function menu(c,x,y,scrambled=false){rect(c,x,y,45,36,'#8b6546');rect(c,x+2,y+2,41,32,'#315b53');text(c,scrambled?'UEMN':'MENU',x+13,y+5,'#f6e2b1');for(const [i,color]of ['#dba55d','#8dac69','#c07b56'].entries()){rect(c,x+5,y+14+i*6,6,4,color);rect(c,x+14,y+15+i*6,23-i*4,1,'#d8d8b9');}}
function trainMachine(c,x,y,label,done=false){
 shadow(c,x,y+28,45,4);rect(c,x,y,45,28,'#707f92');rect(c,x+2,y+2,41,23,'#afc7ca');rect(c,x+4,y+4,37,17,done?'#bdd9ab':'#476f88');sign(c,label,x+4,y-10,37,done?'#56806b':'#466e80');
 for(let i=0;i<3;i++){rect(c,x+6+i*11,y+8,9,8,done?'#f2d27a':'#9fc8d0');rect(c,x+7+i*11,y+16,2,2,'#34515e');rect(c,x+12+i*11,y+16,2,2,'#34515e');if(i<2)rect(c,x+15+i*11,y+12,2,2,'#f3dc95');}
 rect(c,x+3,y+25,39,2,'#486373');rect(c,x+6,y+28,3,3,'#566b74');rect(c,x+36,y+28,3,3,'#566b74');
}
export function renderCafeteriaScene(c,ox,oy,state,map,now=0){
 const s=state.stage4||{};c.save();c.translate(Math.round(ox),Math.round(oy));
 for(let y=0;y<15;y++)for(let x=0;x<20;x++){rect(c,x*16,y*16,16,16,(x+y)%2?'#e0d9bd':'#e7e1c9');rect(c,x*16+15,y*16,1,16,'#cdd0b9');rect(c,x*16,y*16+15,16,1,'#cdd0b9');if(x===0||x===19||y===0||y===14){rect(c,x*16,y*16,16,16,'#5a7679');rect(c,x*16+1,y*16+1,14,10,'#b3beb0');}}
 rect(c,16,16,288,17,'#e8dbbb');rect(c,16,31,288,3,'#7d9787');
 if(map.id==='CafeteriaEntrance'){
  windowPanel(c,37,17,48,24);windowPanel(c,234,17,48,24);door(c,145,20,45,36,{open:s.doorOpened});sign(c,'CAFETERIA',139,4,57,'#4c778a');text(c,'DOOR',160,47,'#f1e1b9');menu(c,49,64,!!s.incidentSeen&&!s.boss?.completed);notice(c,225,64,45,29);text(c,'D',241,71,'#406d78',2);plant(c,111,48);plant(c,200,48);
  rect(c,144,62,48,11,'#9fb6ab');for(let x=147;x<189;x+=5)rect(c,x,64,2,7,'#71998f');door(c,146,204,43,26,{open:true});sign(c,'CLASS',143,198,48,'#657f77');
 }
 if(map.id==='CafeteriaHall'){
  // Water station and tray stack give Drink and Dish actual physical counterparts.
  rect(c,49,37,45,25,'#829a9a');rect(c,51,39,41,20,'#c1d1c7');rect(c,56,27,15,19,'#b5d9dc');rect(c,58,30,11,9,'#83b4c1');rect(c,64,44,3,7,'#567f8e');cup(c,76,45);sign(c,'DRINK',48,24,46,'#4a7b86');
  shelf(c,209,34,45,26);for(let i=0;i<3;i++)plate(c,212+i*4,45-i*3);sign(c,'DISH',207,24,47,'#7c7556');
  mealTable(c,97,81,43,s.boss?.completed);mealTable(c,97,146,43,s.boss?.completed);mealTable(c,177,161,43,s.boss?.completed);
  rect(c,241,81,46,27,'#8d7352');rect(c,243,83,42,20,'#e5cf9a');plate(c,246,86,true);cup(c,270,86);steam(c,250,83,now);sign(c,'DELICIOUS',235,70,58,'#7a6f4b');
  door(c,145,4,46,28,{open:true});sign(c,'ORDER',144,4,48,'#4c778a');door(c,17,65,28,41,{label:'WORDS',open:true});door(c,146,203,44,27,{open:true});plant(c,278,182);
 }
 if(map.id==='SentenceCorner'){
  notice(c,18,18,29,21);sign(c,'WORD TRAIN',102,16,110,'#4b7686');
  trainMachine(c,49,49,'WATER',s.trains?.water);trainMachine(c,145,49,'DRINK',s.trains?.order);trainMachine(c,225,49,'DISH',s.trains?.dish);
  for(const [i,word]of ['I','WOULD','LIKE','WATER'].entries()){rect(c,70+i*44,116,39,18,'#709eaf');rect(c,72+i*44,118,35,12,'#dce7cd');text(c,word,75+i*44,121,'#456e76');if(i<3)rect(c,109+i*44,124,5,2,'#c29b55');}
  rect(c,65,135,183,2,'#6f7e79');for(let x=68;x<247;x+=12)rect(c,x,137,3,3,'#8d7958');shelf(c,18,173,37,30);door(c,147,204,43,26,{open:true});
 }
 if(map.id==='ServingCounter'){
  // Kitchen cupboards, cooktop, serving rail and steam pans.
  for(let x=49;x<270;x+=31){rect(c,x,34,29,26,'#c8c8b1');rect(c,x+2,37,25,17,'#9daaa0');rect(c,x+20,43,3,2,'#5b7777');}
  rect(c,48,59,224,5,'#647c7c');rect(c,49,56,221,5,'#e0dfc6');menu(c,117,12,!!s.incidentSeen&&!s.boss?.completed);
  for(const x of [112,176]){rect(c,x,81,47,15,'#799293');rect(c,x+2,81,43,9,'#d3d8c3');plate(c,x+5,80,true);cup(c,x+31,80);steam(c,x+11,78,now);}
  rect(c,49,100,32,23,'#b3b7a2');plate(c,54,102,true);windowPanel(c,254,92,44,25);
  sign(c,'MS DAISY',131,73,74,'#5b876e');
  if(!s.boss?.completed&&s.incidentSeen){rect(c,153,96,31,11,'#7e638f');text(c,'?',165,99,'#f2daa1');}else{plate(c,157,97,!!s.boss?.completed);}
  plant(c,23,183);door(c,146,204,43,26,{open:true});
 }
 c.restore();
}
// Daisy: hair bun, warm face, green dress, white apron and a ladle.
export function drawDaisy(c,x,y){
 c.save();c.translate(Math.round(x),Math.round(y));
 const colors={h:'#67503b',f:'#e7b678',s:'#cc925c',a:'#e8e8ce',g:'#608a76',d:'#3f625b',e:'#344b43',m:'#b8765e'};
 const mask=['.....hhh........','....hhhhh.......','...hhhhhhh......','...hfffffh......','..hfffffffh.....','..hfefffefh.....','..hfffffffh.....','...ffmmmff......','..ggfaaaafgg....','.gggaaaaaaggg...','.gggaaaaaaggg...','..gdaaaaadg.....','..gdaaaaadg.....','...ddddddd......','...dd...dd......'];
 for(let yy=0;yy<mask.length;yy++)for(let xx=0;xx<mask[yy].length;xx++){const color=colors[mask[yy][xx]];if(color)rect(c,xx,yy,1,1,color);}
 rect(c,14,5,1,8,'#a1b6b1');rect(c,13,4,3,3,'#c3d4cb');rect(c,13,4,3,1,'#e0e8d7');c.restore();
}
