(function(root){
 'use strict';
 const profiles={creeper:{name:'초록 파동',style:'pulse',color:'#c8ff9c'},zombie:{name:'좀비 할퀴기',style:'swipe',color:'#bcebaa'},slime:{name:'말랑 점프',style:'bounce',color:'#b7f784'},skeleton:{name:'달빛 화살',style:'arrow',color:'#f2efd1'},spider:{name:'거미줄 덫',style:'web',color:'#efe4d6'},witch:{name:'물약 투척',style:'potion',color:'#d9b4ff'},enderman:{name:'순간이동 타격',style:'blink',color:'#d2a9ff'},magma:{name:'용암 발구르기',style:'lava',color:'#ffbf70'},ghast:{name:'가스트 화염탄',style:'fireball',color:'#ffe7a0'},wither:{name:'세 해골탄',style:'skulls',color:'#bac9d4'},elderguardian:{name:'수호자의 광선',style:'beam',color:'#a1f3e8'},evoker:{name:'소환 송곳니',style:'fangs',color:'#e6dfb3'},ravager:{name:'파괴수 돌진',style:'charge',color:'#e6cdb1'},piglinbrute:{name:'황금 도끼',style:'axe',color:'#ffdb82'},breeze:{name:'회오리 바람',style:'tornado',color:'#caf5ff'},shulker:{name:'추적 구슬',style:'homing',color:'#e6bfff'},endermite:{name:'땅속 습격',style:'burrow',color:'#bfaddf'},enderknight:{name:'엔더 검격',style:'slash',color:'#e2c6ff'},enderdragon:{name:'드래곤 브레스',style:'breath',color:'#d9a0fa'},warden:{name:'소닉 붐',style:'sonic',color:'#9df5ed'},chicken:{name:'깃털 바람',style:'feathers',color:'#fff6dd'},pig:{name:'꿀꿀 돌진',style:'rush',color:'#ffd4cf'},rabbit:{name:'깡충 킥',style:'leap',color:'#fff0ce'},fox:{name:'여우 덮치기',style:'pounce',color:'#ffce9e'}};
 const clamp=n=>Math.max(0,Math.min(1,n));
 function pose(kind,time,direction=1,reduced=false){const p=profiles[kind]||profiles.creeper,t=clamp(time/1.15),wave=Math.sin(t*Math.PI),result={x:0,y:0,sx:1,sy:1,rotation:0,opacity:1};if(reduced)return result;
  if(['charge','rush','swipe','slash','axe'].includes(p.style)){result.x=direction*wave*(p.style==='charge'?290:p.style==='rush'?220:130);result.rotation=direction*wave*.08;}
  if(['bounce','leap','pounce'].includes(p.style)){result.x=direction*wave*(p.style==='bounce'?260:300);result.y=-wave*(p.style==='leap'?110:p.style==='pounce'?75:90);result.sx=1+Math.sin(t*Math.PI*2)*.16;result.sy=1-Math.sin(t*Math.PI*2)*.16;}
  if(p.style==='blink'){result.x=direction*(t>.25&&t<.65?370:0);result.opacity=t>.16&&t<.25||t>.65&&t<.75?.15:1;}
  if(p.style==='burrow'){result.y=wave*35;result.opacity=Math.max(.12,1-wave);}
  if(p.style==='lava'||p.style==='sonic'||p.style==='pulse'){result.sx=1+wave*.12;result.sy=1-wave*.09;}
  if(['potion','fireball','skulls','beam','fangs','homing','breath','feathers','arrow','tornado'].includes(p.style)){result.y=-wave*9;result.rotation=-direction*wave*.04;}
  return result;
 }
 function draw(c,kind,time,from,to,reduced=false){const p=profiles[kind]||profiles.creeper,t=clamp(time/1.15);if(t<=.03||t>=1)return;const flight=clamp((t-.18)/.55),dx=to.x-from.x,dy=to.y-from.y,x=from.x+dx*flight,y=from.y+dy*flight,direction=Math.sign(dx)||1,color=p.color;c.save();c.strokeStyle=color;c.fillStyle=color;c.lineWidth=3;c.globalAlpha=Math.min(1,Math.sin(t*Math.PI)*1.5);
  const line=(x1,y1,x2,y2,width=3)=>{c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();};
  const ring=(x,y,r)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();};
  const dot=(x,y,size=6)=>c.fillRect(x-size/2,y-size/2,size,size);
  const impact=()=>{if(flight>.8)for(let i=0;i<9;i++){const a=i/9*Math.PI*2;dot(to.x+Math.cos(a)*(flight-.75)*120,to.y+Math.sin(a)*(flight-.75)*100,5);}};
  if(reduced){ring(to.x,to.y,24);dot(to.x,to.y,10);c.restore();return;}
  switch(p.style){
   case 'pulse':for(let i=0;i<3;i++){c.globalAlpha=(1-t)*(1-i*.15);ring(from.x+dx*t,from.y+dy*t,12+t*65+i*14);}break;
   case 'swipe':for(let i=0;i<3;i++)line(to.x-30+i*15,to.y-35,to.x-5+i*15,to.y+30,5);break;
   case 'bounce':for(let i=0;i<5;i++)dot(x-direction*i*20,y-Math.sin(flight*Math.PI)*70+i*3,12-i*2);if(flight>.75)ring(to.x,to.y+25,flight*38);break;
   case 'arrow':line(x-direction*35,y,x+direction*15,y,4);line(x+direction*15,y,x+direction*4,y-8);line(x+direction*15,y,x+direction*4,y+8);line(x-direction*29,y,x-direction*38,y-8);line(x-direction*29,y,x-direction*38,y+8);break;
   case 'web':for(let i=0;i<8;i++){const a=i*Math.PI/4;line(x,y,x+Math.cos(a)*35*flight,y+Math.sin(a)*35*flight,1);}for(let i=1;i<4;i++)ring(x,y,i*9*flight);break;
   case 'potion':{const yy=y-Math.sin(flight*Math.PI)*90;c.save();c.translate(x,yy);c.rotate(t*8);c.fillRect(-8,-9,16,21);c.fillStyle='#f6ebdc';c.fillRect(-4,-16,8,8);c.restore();if(flight>.8)for(let i=0;i<12;i++)dot(to.x+Math.cos(i*2)*35,to.y+Math.sin(i*2)*25,7);break;}
   case 'blink':ring(from.x,from.y,20+Math.sin(t*7)*12);ring(to.x-direction*70,to.y,25+Math.sin(t*8)*10);for(let i=0;i<8;i++)dot(to.x+Math.cos(i)*45,to.y+Math.sin(i)*35,5);break;
   case 'lava':for(let i=0;i<9;i++){const xx=from.x+dx*i/8,yy=235-Math.sin((t*3-i*.12)*Math.PI)*25;dot(xx,yy,12);line(xx,240,xx,yy,7);}break;
   case 'fireball':for(let i=0;i<6;i++){c.globalAlpha=1-i*.14;dot(x-direction*i*13,y+Math.sin(i+t*15)*6,25-i*3);}c.globalAlpha=1;c.fillStyle='#fff8dc';dot(x,y,12);break;
   case 'skulls':for(let i=-1;i<=1;i++){const yy=y+i*28;c.fillStyle='#586071';c.fillRect(x-11,yy-10,22,20);c.fillStyle=color;c.fillRect(x-7,yy-5,4,4);c.fillRect(x+3,yy-5,4,4);c.fillRect(x-5,yy+5,10,3);}break;
   case 'beam':ring(from.x,from.y,10+Math.sin(t*18)*8);if(t>.25){c.globalAlpha=.25;line(from.x,from.y,to.x,to.y,18);c.globalAlpha=1;line(from.x,from.y,to.x,to.y,3);}break;
   case 'fangs':for(let i=0;i<7;i++){const xx=from.x+dx*i/6,opening=Math.max(0,Math.sin((t*2-i*.13)*Math.PI))*35;c.beginPath();c.moveTo(xx-11,235);c.lineTo(xx-4,235-opening);c.lineTo(xx,235-6);c.lineTo(xx+5,235-opening);c.lineTo(xx+13,235);c.fill();}break;
   case 'charge':case 'rush':for(let i=0;i<7;i++)dot(from.x+dx*t*.6-direction*i*16,240+Math.sin(i)*6,10-i);if(t>.45)line(to.x-30,to.y-20,to.x+30,to.y+20,p.style==='charge'?7:3);break;
   case 'axe':c.save();c.translate(x,y);c.rotate(direction*t*9);c.fillStyle='#ab8452';c.fillRect(-4,-30,8,65);c.fillStyle=color;c.fillRect(-22,-29,43,21);c.fillRect(0,-33,23,28);c.restore();break;
   case 'tornado':for(let i=0;i<7;i++){c.beginPath();c.ellipse(x+Math.sin(t*20+i)*5,y+30-i*10,6+i*5,4,0,0,Math.PI*2);c.stroke();}break;
   case 'homing':{const yy=y+Math.sin(flight*Math.PI*3)*35;ring(x,yy,12);dot(x,yy,8);for(let i=1;i<8;i++)dot(x-direction*i*9,yy+Math.sin(i+t*10)*9,3);break;}
   case 'burrow':for(let i=0;i<9;i++)dot(x+Math.cos(i)*22,245+Math.sin(i)*7,6);line(x-12,244,x+12,240,4);break;
   case 'slash':for(let i=0;i<3;i++){c.beginPath();c.arc(to.x,to.y,30+i*11,-Math.PI*.6+t*.3,Math.PI*.4+t*.3);c.stroke();}break;
   case 'breath':for(let i=0;i<22;i++){const u=i/21;dot(from.x+dx*u,from.y+dy*u+Math.sin(i*1.7+t*20)*(6+u*23),6+u*12);}break;
   case 'sonic':for(let i=0;i<5;i++){const u=(flight+i*.12)%1;c.beginPath();c.ellipse(from.x+dx*u,from.y+dy*u,9,12+u*22,0,0,Math.PI*2);c.stroke();}break;
   case 'feathers':for(let i=0;i<9;i++){const xx=x+Math.sin(i*3+t*6)*30,yy=y+Math.cos(i*2+t*5)*28;line(xx-7,yy-3,xx+7,yy+3,4);line(xx,yy,xx-4,yy+7,2);}break;
   case 'leap':case 'pounce':for(let i=0;i<3;i++)line(to.x-20+i*13,to.y-20,to.x-8+i*13,to.y+15,p.style==='leap'?4:2);for(let i=0;i<5;i++)dot(from.x+dx*t-direction*i*20,from.y-Math.sin(t*Math.PI)*65+i*6,5);break;
  }
  impact();c.restore();
 }
 const api={profiles,pose,draw};if(typeof module==='object'&&module.exports)module.exports=api;else root.CreativeCombatArt=api;
})(typeof window==='undefined'?globalThis:window);
