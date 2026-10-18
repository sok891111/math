import {MINECRAFT_MOVE_BY_ID} from './minecraft-moves.js?v=20261018-table19';
const clamp=n=>Math.max(0,Math.min(1,n));
const mix=(a,b,t)=>a+(b-a)*t;
export function minecraftProfile(id){const m=MINECRAFT_MOVE_BY_ID[id];return m?'mc-'+m.profile:null}
export function minecraftDuration(id){return ['breath','beam','sonic','fangs'].includes(MINECRAFT_MOVE_BY_ID[id]?.profile)?1250:1050}
// Pixel geometry is drawn at 160x96. Coordinates follow the actual actor and
// defender, so the same effects work for wild enemies and captured teammates.
export function drawMinecraftMove(ctx,id,{a,t,p,reduced=false}){
 const move=MINECRAFT_MOVE_BY_ID[id];if(!move)return null;
 const kind=move.profile,color=move.color,dx=t.x-a.x,dy=t.y-a.y;
 const q=clamp((p-.12)/.44),strike=Math.sin(clamp((p-.36)/.4)*Math.PI);
 const pos={x:mix(a.x,t.x,q),y:mix(a.y,t.y,q)};
 const motion={x:0,y:0,opacity:1};
 const square=(x,y,w,h,c=color)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)};
 const line=(x,y,xx,yy,c=color,width=2)=>{ctx.strokeStyle=c;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(Math.round(x),Math.round(y));ctx.lineTo(Math.round(xx),Math.round(yy));ctx.stroke()};
 const ring=(x,y,r,c=color)=>{ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,r,r*.65,0,0,Math.PI*2);ctx.stroke()};
 const sparks=(x,y,n=9,c=color)=>{for(let i=0;i<n;i++){const angle=i*Math.PI*2/n,d=3+clamp((p-.5)/.4)*20; square(x+Math.cos(angle)*d,y+Math.sin(angle)*d,2+i%2,2+i%2,c)}};
 // Reduced motion uses a static signature icon at the target: no travel, blink,
 // screen flash or actor shake. The impact callback still follows the timeline.
 if(reduced){
  ctx.globalAlpha=.8;square(t.x-6,t.y-6,12,12,color);square(t.x-3,t.y-3,6,6,'#f3f3dc');
  if(kind==='sword'||kind==='axe')line(t.x-9,t.y+9,t.x+9,t.y-9,'#263b45',3);
  else if(kind==='breath'||kind==='sonic'||kind==='beam')ring(t.x,t.y,11);
  ctx.globalAlpha=1;return motion;
 }
 if(p<.07||p>.92)return motion;
 ctx.save();ctx.globalAlpha=Math.min(1,(p-.07)/.1,(.92-p)/.12);
 if(kind==='sword'||kind==='axe'){
  // The weapon swings across the defender rather than reusing Scratch sprites.
  motion.x=dx*.23*strike;motion.y=dy*.23*strike;
  if(p>.2&&p<.76){ctx.save();ctx.translate(t.x,t.y);ctx.rotate(-1.6+q*2.6);
   square(-2,-22,4,32,kind==='sword'?'#d2f9f5':'#9d724b');
   if(kind==='sword'){square(-1,-24,2,26,'#fff8db');square(-8,5,16,3,'#9172ab');square(-2,9,4,9,'#544260')}
   else{square(-14,-20,28,13,color);square(-14,-20,10,4,'#fff1a2')}
   ctx.restore();
   if(p>.4){ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(t.x,t.y,22,-2.2,-2.2+q*3);ctx.stroke()}
  }
 }else if(kind==='breath'){
  // Expanding purple cone, square embers and a lingering dragon-breath cloud.
  if(p>.12&&p<.83){for(let i=0;i<18;i++){const f=i/17;if(f>q)continue;
   const width=2+f*10,x=mix(a.x,t.x,f),y=mix(a.y,t.y,f);
   for(let j=-1;j<=1;j++)square(x-2,y+j*width+Math.sin(i*3+p*30)*2,4,4,j===0?'#efd0ff':color);
  }if(p>.5){ctx.globalAlpha*=.55;for(let i=0;i<13;i++)square(t.x+Math.sin(i*7)*17,t.y+Math.cos(i*3)*11,5,5,i%2?color:'#71389e')}}
 }else if(kind==='beam'||kind==='sonic'){
  if(p<.4){ring(a.x,a.y,4+p*19);square(a.x-2,a.y-2,4,4,'#f4ffe8')}
  if(p>.25&&p<.78){const end={x:mix(a.x,t.x,q),y:mix(a.y,t.y,q)};
   if(kind==='beam'){line(a.x,a.y,end.x,end.y,color,5);line(a.x,a.y,end.x,end.y,'#ebfff0',1);for(let i=0;i<4;i++){const f=i/4;ring(mix(a.x,end.x,f),mix(a.y,end.y,f),3)}}
   else for(let i=0;i<7;i++){const f=clamp(q-i*.09);if(f>0)ring(mix(a.x,t.x,f),mix(a.y,t.y,f),3+f*8)}
  }
 }else if(kind==='skull'){
  square(pos.x-7,pos.y-6,14,12,'#3e414e');square(pos.x-5,pos.y-3,3,3,'#bce5eb');square(pos.x+2,pos.y-3,3,3,'#bce5eb');square(pos.x-2,pos.y+2,4,3,'#101923');
  for(let i=1;i<5;i++)square(pos.x-dx*.025*i,pos.y-dy*.025*i+Math.sin(i+p*20)*3,3,3,color);
  if(p>.56)sparks(t.x,t.y,10,'#697b8e');
 }else if(kind==='fangs'){
  for(let i=0;i<6;i++){const f=(i+1)/6,delay=.12+i*.055,open=Math.sin(clamp((p-delay)/.38)*Math.PI);if(open<=0)continue;
   const x=mix(a.x,t.x,f),y=mix(a.y,t.y,f)+6;ring(x,y,6,'#557f69');
   for(const side of [-1,1]){square(x+side*5-2,y-open*14,4,open*14,'#e1ddba');square(x+side*5-1,y-open*14-2,2,3,'#fff3d1')}
  }
 }else if(kind==='wind'){
  for(let i=0;i<5;i++){const f=clamp(q-i*.06),x=mix(a.x,t.x,f),y=mix(a.y,t.y,f);ring(x,y,4+i*1.2,i%2?color:'#7cb2cc')}
  if(p>.52){ring(t.x,t.y,8+(p-.52)*38);sparks(t.x,t.y)}
 }else if(kind==='bullet'){
  // Shulker projectiles turn at right angles and leave a dotted homing trail.
  const x=q<.5?mix(a.x,t.x,q*2):t.x,y=q<.5?a.y:mix(a.y,t.y,(q-.5)*2);
  for(let i=0;i<7;i++)square(x-Math.sign(dx)*i*3,y-2,2,2,'#e0c8ec');square(x-4,y-4,8,8,color);square(x-2,y-2,4,4,'#fff3cc');
 }else if(kind==='arrow'){
  const angle=Math.atan2(dy,dx);ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(angle);
  square(-14,-1,26,2,'#b89462');line(12,0,5,-4,'#ede9d2');line(12,0,5,4,'#ede9d2');line(-10,0,-15,-4,'#eee');line(-10,0,-15,4,'#eee');ctx.restore();
 }else if(kind==='web'){
  if(q<1){square(pos.x-2,pos.y-2,4,4);line(a.x,a.y,pos.x,pos.y,color,1)}
  if(p>.4){const size=5+strike*15;for(let i=0;i<8;i++){const angle=i*Math.PI/4;line(t.x,t.y,t.x+Math.cos(angle)*size,t.y+Math.sin(angle)*size,color,1)}for(const r of [size*.45,size*.8]){ctx.beginPath();for(let i=0;i<=8;i++){const angle=i*Math.PI/4,x=t.x+Math.cos(angle)*r,y=t.y+Math.sin(angle)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke()}}
 }else if(kind==='potion'){
  const y=pos.y-Math.sin(q*Math.PI)*22;
  if(p<.56){ctx.save();ctx.translate(pos.x,y);ctx.rotate(q*5);square(-4,-3,8,10,'#d3e2e0');square(-3,0,6,6,color);square(-2,-7,4,5,'#a1b4ad');square(-3,-9,6,2,'#a58752');ctx.restore()}
  else{sparks(t.x,t.y,12);for(let i=0;i<8;i++)square(t.x+Math.sin(i*4)*14,t.y+Math.cos(i*5)*10-(p-.56)*14,3,3,i%2?color:'#89bd6a')}
 }else if(kind==='fireball'){
  const size=5+Math.sin(p*30);for(let i=5;i>=0;i--)square(pos.x-dx*.018*i-size/2,pos.y-dy*.018*i-size/2,size,size,i%2?'#e7723d':'#ffc06c');square(pos.x-2,pos.y-2,4,4,'#fff1a3');if(p>.56)sparks(t.x,t.y,12,'#f8b263');
 }else if(kind==='blast'){
  if(p<.5){ring(a.x,a.y,4+Math.sin(p*20)*2);motion.x=Math.sin(p*90)*.8}
  else{const size=5+clamp((p-.5)/.22)*23;ring(t.x,t.y,size,'#9fb795');for(let i=0;i<12;i++){const angle=i*Math.PI/6; square(t.x+Math.cos(angle)*size-3,t.y+Math.sin(angle)*size*.7-3,6,6,i%3?color:'#e8e7d6')}square(t.x-4,t.y-4,8,8,'#f4efcf')}
 }else if(kind==='teleport'){
  if(p<.38){motion.opacity=.3;for(let i=0;i<9;i++)square(a.x+Math.sin(i*3+p*15)*15,a.y+Math.cos(i*5)*17,2,2)}
  else if(p<.75){motion.x=dx*.72;motion.y=dy*.72;for(let i=0;i<12;i++)square(t.x+Math.sin(i*4)*17,t.y+Math.cos(i*3+p*8)*15,2,3);if(p>.5)line(t.x-9,t.y+7,t.x+10,t.y-8,'#edd2ff',3)}
 }else if(kind==='burrow'){
  motion.opacity=p<.52?.25:1;
  for(let i=0;i<8;i++){const f=clamp(q-i*.04);square(mix(a.x,t.x,f)+Math.sin(i*5)*4,mix(a.y,t.y,f)+9,4,3,i%2?'#98795b':color)}
  if(p>.5){sparks(t.x,t.y+8,8,'#a48962');line(t.x-5,t.y+5,t.x+5,t.y-6)}
 }else{
  // Body attacks each have a different silhouette, arc and impact accent.
  const hop=['bounce','magma','kick','pounce'].includes(kind)?Math.sin(clamp((p-.12)/.65)*Math.PI)*17:0;
  motion.x=dx*.65*strike;motion.y=dy*.65*strike-hop;
  const x=t.x,y=t.y;
  if(kind==='punch'&&p>.25){square(x-9,y-6,16,13,color);square(x-8,y-9,4,5,'#d2e4ac');for(let i=0;i<3;i++)line(x-16-i*4,y+i*3,x-10-i*4,y+i*3,color,1)}
  if(kind==='peck'&&p>.3){for(let i=0;i<3;i++){const yy=y-7+i*7;line(x-9,yy-3,x+3,yy,'#f1c55c');line(x+3,yy,x-9,yy+3,'#f1c55c')}}
  if(kind==='ram'&&p>.3){for(const side of [-1,1]){square(x+side*10-2,y-9,5,13,'#e1d6b6');square(x+side*10-2,y-13,3,5,'#f5e8c8')}line(x-14,y+6,x+14,y+6,color,3)}
  if(kind==='charge'&&p>.3){square(x-9,y-5,18,12,color);square(x-6,y-1,4,5,'#ad768b');square(x+3,y-1,4,5,'#ad768b')}
  if(kind==='kick'&&p>.3){ctx.save();ctx.translate(x,y);ctx.rotate(-.5);square(-12,-3,25,7,'#f2dfb8');square(7,-7,9,11,'#e7cda4');ctx.restore()}
  if(kind==='pounce'&&p>.3){for(let i=0;i<3;i++)line(x-9+i*5,y-8,x-2+i*5,y+8,color,2)}
  if(kind==='bounce'&&p>.38){const squash=1-strike*.4; square(x-13,y-7*squash,26,16*squash,color);square(x-8,y-3,3,3,'#548843');square(x+5,y-3,3,3,'#548843');for(let i=0;i<5;i++)square(x+Math.sin(i*5)*19,y+Math.cos(i*3)*10,3,3)}
  if(kind==='magma'&&p>.38){square(x-12,y-10,24,19,'#763b35');for(let i=0;i<3;i++)square(x-11,y-7+i*6,22,3,i%2?color:'#ffce65');if(p>.56)sparks(x,y,9,color)}
 }
 if(p>.53&&p<.68&&!['breath','blast','web','potion'].includes(kind))sparks(t.x,t.y,6,'#f3eed7');
 ctx.restore();return motion;
}
