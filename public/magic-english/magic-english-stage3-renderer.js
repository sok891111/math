import {SCHOOL_DESKS} from './magic-english-stage3-layout.js';

const INK='#33434b', WOOD='#815638', LIGHT_WOOD='#d6a666';
const FONT={
 '?':['110','001','010','000','010'],
 A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['011','100','100','100','011'],D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],G:['011','100','101','101','011'],H:['101','101','111','101','101'],I:['111','010','010','010','111'],J:['001','001','001','101','010'],K:['101','101','110','101','101'],L:['100','100','100','100','111'],M:['101','111','111','101','101'],N:['101','111','111','111','101'],O:['010','101','101','101','010'],P:['110','101','110','100','100'],Q:['010','101','101','111','011'],R:['110','101','110','101','101'],S:['011','100','010','001','110'],T:['111','010','010','010','010'],U:['101','101','101','101','111'],V:['101','101','101','101','010'],W:['101','101','111','111','101'],X:['101','101','010','101','101'],Y:['101','101','010','010','010'],Z:['111','001','010','100','111'],1:['010','110','010','010','111'],2:['110','001','010','100','111'],3:['110','001','010','001','110'],0:['111','101','101','101','111'],_ :['000','000','000','000','111'], ' ':['000','000','000','000','000'],
};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function text(c,value,x,y,color='#fff5d3',scale=1){for(const [i,char]of [...value].entries())for(const [dy,row]of (FONT[char]||FONT[' ']).entries())for(let dx=0;dx<3;dx++)if(row[dx]==='1')rect(c,x+i*4*scale+dx*scale,y+dy*scale,scale,scale,color);}
function sign(c,label,x,y,w=label.length*4+8,color='#315a68'){
 rect(c,x+1,y+2,w,12,'#47504c');rect(c,x,y,w,11,WOOD);rect(c,x+1,y+1,w-2,8,color);text(c,label,x+Math.floor((w-label.length*4+1)/2),y+3);
}
function shadow(c,x,y,w,h=3){rect(c,x+2,y,w,h,'rgba(35,45,42,.20)');}
function windowPanel(c,x,y,w=22,h=18){
 shadow(c,x,y+h,w);rect(c,x,y,w,h,'#586c76');rect(c,x+1,y+1,w-2,h-2,'#e8eadb');rect(c,x+3,y+3,w-6,h-6,'#7bb5cb');rect(c,x+4,y+4,w-8,3,'#a8d6df');rect(c,x+4,y+h-6,w-8,2,'#6695ac');rect(c,x+Math.floor(w/2),y+2,2,h-4,'#eef3df');rect(c,x+2,y+Math.floor(h/2),w-4,1,'#d2e5dc');rect(c,x-1,y+h-2,w+2,2,'#839a9d');
}
function brick(c,x,y,w,h,base='#b8795f'){
 rect(c,x,y,w,h,base);for(let row=0;row<h;row+=5){rect(c,x,y+row,w,1,'#d69e7c');for(let col=(row/5%2)*5;col<w;col+=10)rect(c,x+col,y+row,1,5,'#935e50');}
}
function door(c,x,y,w=26,h=34,{glass=true,open=false,locked=false,label}={}){
 shadow(c,x,y+h,w+1,4);rect(c,x-2,y-2,w+4,h+4,'#57616a');rect(c,x-1,y-1,w+2,h+1,'#d7c8a5');rect(c,x,y,w,h,open?'#344951':'#5d4433');
 if(!open){rect(c,x+2,y+2,w-4,h-5,locked?'#665b78':'#b18a58');rect(c,x+3,y+3,w-6,Math.floor(h/2),glass?'#99c3cc':'#d5b281');if(glass){rect(c,x+4,y+4,w-8,3,'#c4e0dc');rect(c,x+Math.floor(w/2),y+3,1,Math.floor(h/2),'#dee5d2');}rect(c,x+4,y+h-12,w-8,7,locked?'#534e67':'#8c6546');rect(c,x+w-5,y+h-15,2,3,'#f5d580');rect(c,x+w-6,y+h-13,4,1,'#d8b361');}
 else{rect(c,x+2,y+2,w-5,h-4,'#435966');rect(c,x+2,y+2,4,h-4,'#aa7c4d');rect(c,x+w-6,y+2,4,h-4,'#aa7c4d');}
 rect(c,x-2,y+h-2,w+4,3,'#bcb2a0');if(label)sign(c,label,x-1,y-12,w+2);
}
function plant(c,x,y){shadow(c,x,y+13,11);rect(c,x+2,y+9,8,6,'#8f583c');rect(c,x+1,y+8,10,2,'#cc9060');rect(c,x+5,y+1,2,8,'#46714c');rect(c,x+1,y+3,5,4,'#5d8c54');rect(c,x+6,y,5,5,'#759e61');rect(c,x+7,y+5,5,3,'#426c48');}
function tree(c,x,y){
 shadow(c,x+1,y+25,29,5);rect(c,x+13,y+17,6,13,'#845c39');rect(c,x+14,y+20,2,9,'#b5864a');
 const layers=[[6,0,20,6],[2,5,28,8],[0,12,32,9],[3,20,26,5]];for(const [dx,dy,w,h]of layers)rect(c,x+dx,y+dy,w,h,'#406c4b');rect(c,x+6,y+4,17,6,'#78a263');rect(c,x+3,y+11,19,6,'#658f55');rect(c,x+7,y+18,18,3,'#527c4e');rect(c,x+12,y+5,3,2,'#9abd70');
}
function bench(c,x,y,w=44){shadow(c,x,y+13,w);rect(c,x+4,y+7,3,9,INK);rect(c,x+w-7,y+7,3,9,INK);for(const yy of [0,4,8]){rect(c,x,y+yy,w,3,WOOD);rect(c,x+1,y+yy,w-2,1,'#d0a06b');}rect(c,x-1,y+5,2,7,INK);rect(c,x+w-1,y+5,2,7,INK);}
function desk(c,x,y,w=28,{teacher=false}={}){
 shadow(c,x,y+13,w,4);rect(c,x+3,y+8,3,8,'#5e6263');rect(c,x+w-6,y+8,3,8,'#5e6263');rect(c,x,y+1,w,10,WOOD);rect(c,x+1,y,w-2,8,LIGHT_WOOD);rect(c,x+2,y+1,w-4,1,'#f0cd8c');rect(c,x+2,y+7,w-4,2,'#ac7747');
 // Open workbook and spine.
 rect(c,x+5,y+2,10,5,'#5c7990');rect(c,x+5,y+1,4,5,'#faf2d4');rect(c,x+10,y+1,4,5,'#e4dfbf');rect(c,x+9,y+2,1,5,'#b2b09e');rect(c,x+17,y+4,6,1,'#edcd65');rect(c,x+22,y+4,1,1,INK);
 if(teacher){rect(c,x+w-12,y+1,7,3,'#d57858');rect(c,x+w-13,y+4,8,2,'#779276');rect(c,x+1,y-3,3,5,'#516c7d');rect(c,x+2,y-5,1,3,'#e4bd5a');}else{rect(c,x+7,y+12,14,3,'#507b93');rect(c,x+8,y+11,12,2,'#7da5b4');rect(c,x+8,y+15,2,2,INK);rect(c,x+18,y+15,2,2,INK);}
}
function books(c,x,y,count=7){const colors=['#cc7055','#668c9a','#d4af5e','#6f9565','#8e7395'];for(let i=0;i<count;i++){const h=7+(i%3);rect(c,x+i*4,y+10-h,3,h,colors[i%colors.length]);rect(c,x+i*4,y+11-h,3,1,'#e4cfaa');rect(c,x+i*4+1,y+8,1,1,'#eddfc1');}}
function shelf(c,x,y,w=44,h=27){shadow(c,x,y+h,w);rect(c,x,y,w,h,'#634731');rect(c,x+2,y+2,w-4,h-3,'#9d7a4e');for(let row=0;row<2;row++){books(c,x+4,y+3+row*12,Math.floor((w-7)/4));rect(c,x+1,y+13+row*12,w-2,2,'#c4965d');}rect(c,x,y,2,h,'#c09662');rect(c,x+w-2,y,2,h,'#785238');}
function notice(c,x,y,w=30,h=23){rect(c,x+1,y+1,w,h,'#7e775f');rect(c,x,y,w,h,'#8f6344');rect(c,x+2,y+2,w-4,h-4,'#c4a875');for(const [dx,dy,col]of [[4,4,'#f3e6bc'],[15,3,'#c1d6cc'],[7,12,'#d1dfeb']]){rect(c,x+dx,y+dy,9,7,col);rect(c,x+dx+3,y+dy,1,1,'#b45d53');rect(c,x+dx+2,y+dy+3,5,1,'#9b9b86');}}
function arrow(c,x,y,color='#fff2b1',direction='up'){c.save();c.translate(x,y);if(direction==='right'){c.translate(8,0);c.rotate(Math.PI/2);}rect(c,3,2,2,9,color);rect(c,2,2,4,2,color);rect(c,1,4,6,2,color);rect(c,0,6,2,2,color);rect(c,6,6,2,2,color);c.restore();}

// Original Coco is an orange tabby with a white chest, pointed ears and a long tail.
// Pixel masks preserve a cat silhouette at the game's native 16px resolution.
const CAT_PALETTE={o:'#63432f',a:'#c7793c',g:'#edac5b',h:'#f7c77f',s:'#9a572f',w:'#fff1d3',p:'#db998d',e:'#344c46',i:'#e7eee1'};
const CAT=[
 '....o......o....',
 '...oao....oao...',
 '...opaoooopao...',
 '...oaggggggao...',
 '...oggs gsggo...'.replace(' ', 'g'),
 '...oggegggego...',
 '...ogeiwige go..'.replaceAll(' ',''),
 '...oawwppwwao...',
 '..ooawwwwwwao...',
 '.oaooagwwgao....',
 'oaaooagwwgao....',
 'oao.oaswwsao....',
 'oao.oagwwgao....',
 '.oaooaawwaao....',
 '..ooogwwwwgo....',
 '....owwoowwo....',
 '.....oo..oo.....',
];
export function drawSchoolAnimal(c,x,y,now=0){
 shadow(c,x+2,y+15,11,2);
 for(let yy=0;yy<CAT.length;yy++)for(let xx=0;xx<CAT[yy].length;xx++){const color=CAT_PALETTE[CAT[yy][xx]];if(color)rect(c,x+xx,y+yy-2,1,1,color);}
 // Fine whiskers extend outside the muzzle instead of a square face outline.
 rect(c,x+2,y+5,3,1,'#f7e6c6');rect(c,x+11,y+5,3,1,'#f7e6c6');rect(c,x+1,y+7,4,1,'#b77b49');rect(c,x+11,y+7,4,1,'#b77b49');
 if(Math.floor(now/900)%3===0)rect(c,x+1,y+9,1,2,'#edac5b');
}
function catPicture(c,x,y,{missing=false,easel=false}={}){
 if(easel){rect(c,x+2,y+12,2,7,WOOD);rect(c,x+14,y+12,2,7,WOOD);rect(c,x+1,y+15,16,2,WOOD);}
 rect(c,x,y,18,15,WOOD);rect(c,x+1,y+1,16,12,'#f3e7c3');
 c.save();c.translate(x+4,y+1);c.scale(.5,.5);drawSchoolAnimal(c,0,0,500);c.restore();
 rect(c,x+3,y+10,12,4,'#f7efd8');text(c,missing?'_AT':'CAT',x+3,y+10,'#685339');
}
function locker(c,x,y){
 shadow(c,x,y+16,15,2);rect(c,x,y,16,16,'#3e5e75');rect(c,x+1,y,14,14,'#7098b1');rect(c,x+2,y+1,12,1,'#a3c2ce');rect(c,x+3,y+3,7,1,'#416780');rect(c,x+3,y+5,7,1,'#416780');rect(c,x+3,y+7,7,1,'#416780');rect(c,x+11,y+8,2,3,'#e7d394');rect(c,x+2,y+11,6,2,'#dbe2d4');rect(c,x+3,y+11,1,1,'#65879a');rect(c,x+6,y+11,1,1,'#65879a');
}
function outdoor(c){
 // School building: roof cornice, brick wings, clock tower, classroom windows and glass entry.
 const x=48,y=0,w=224;
 shadow(c,x-2,79,w+4,6);brick(c,x,15,w,62);rect(c,x-4,y+7,w+8,8,'#445a65');rect(c,x-2,y+6,w+4,3,'#72818a');rect(c,x,y+14,w,3,'#d9bc8e');
 rect(c,146,0,44,34,'#d4bb91');rect(c,144,0,48,4,'#516471');rect(c,150,4,36,25,'#e8d6b3');
 c.fillStyle='#566a70';c.beginPath();c.arc(168,16,9,0,Math.PI*2);c.fill();c.fillStyle='#faf2d9';c.beginPath();c.arc(168,16,7,0,Math.PI*2);c.fill();rect(c,167,10,2,7,'#394b53');rect(c,168,15,5,2,'#394b53');rect(c,167,15,2,2,'#c68e4c');
 for(const wx of [62,94,210,242]){windowPanel(c,wx,22,20,17);windowPanel(c,wx,48,20,19);}
 rect(c,x,43,w,3,'#d9b187');rect(c,x,72,w,5,'#987454');sign(c,'SCHOOL',136,33,64,'#2e5967');
 door(c,153,49,30,29,{glass:true});rect(c,168,51,1,24,'#e7dcc4');rect(c,146,78,44,3,'#e5d9bd');rect(c,142,81,52,2,'#b5b3a3');
 // Entrance canopy and columns clearly frame the school entrance.
 rect(c,145,45,46,4,'#496b76');rect(c,147,49,3,28,'#d5c9aa');rect(c,187,49,3,28,'#d5c9aa');
 // Flag, playground planting and a school bell beside the entry.
 rect(c,33,25,2,42,'#728084');rect(c,35,26,14,9,'#658c9d');rect(c,35,26,14,2,'#e9d8a8');rect(c,36,31,9,2,'#e9d8a8');rect(c,30,65,8,3,'#8d9986');
 tree(c,32,96);tree(c,256,96);bench(c,64,161,44);
 for(const [fx,fy]of [[24,144],[286,143],[28,173],[122,91],[204,91]]){rect(c,fx+1,fy+2,1,4,'#638752');rect(c,fx,fy,4,3,'#e7bd6b');rect(c,fx+1,fy+1,2,1,'#f5e1a8');}
 // Full school bus: tyres, mirrors, grille, doors and passenger windows.
 const bx=208,by=177;shadow(c,bx+1,by+29,93,4);rect(c,bx+3,by,87,3,'#a87031');rect(c,bx,by+3,96,23,'#d49b3a');rect(c,bx+2,by+3,91,19,'#f0c452');rect(c,bx+3,by+17,89,2,'#89673e');rect(c,bx+7,by+26,13,5,'#35464a');rect(c,bx+73,by+26,13,5,'#35464a');rect(c,bx+10,by+27,7,2,'#83938e');rect(c,bx+76,by+27,7,2,'#83938e');for(let i=0;i<5;i++)windowPanel(c,bx+5+i*14,by+5,11,10);rect(c,bx+79,by+4,12,20,'#7b6f4e');rect(c,bx+81,by+5,8,15,'#a3cbd1');rect(c,bx+85,by+5,1,15,'#637d82');rect(c,bx+94,by+14,3,5,'#a9b3a1');rect(c,bx+91,by+7,3,3,'#f7edd3');
 // Small painted ball court and pavement seams, away from the entrance path.
 c.strokeStyle='#e6e1c0';c.lineWidth=1;c.strokeRect(22,186,74,32);c.beginPath();c.arc(59,202,10,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(59,186);c.lineTo(59,218);c.stroke();
 for(let xx=142;xx<=190;xx+=8)rect(c,xx,219,5,8,'#f2e5bb');
}
function hall(c,state){
 for(let y=3;y<12;y++)for(let x=2;x<4;x++)locker(c,x*16,y*16);
 // A real classroom frontage rather than a floating rectangle in the corridor.
 brick(c,256,32,48,160,'#d6c9ad');rect(c,256,118,48,42,'#b2c0b3');rect(c,256,116,48,3,'#748d85');
 door(c,257,77,28,33,{label:'ROOM C'});notice(c,241,48,30,22);text(c,'C',252,54,'#456f80');
 windowPanel(c,274,39,23,22);
 // A freestanding directory on the centre approach: its solid plinth stops the child
 // at (10,6), facing the interaction tile (10,5), away from the classroom door.
 shadow(c,144,95,47,5);rect(c,147,89,5,8,'#4e625f');rect(c,182,89,5,8,'#4e625f');
 rect(c,144,92,48,4,'#8f9c90');rect(c,146,91,44,2,'#bac3ac');
 rect(c,144,66,48,27,WOOD);rect(c,146,68,44,22,'#e9dfbd');
 rect(c,147,69,42,14,'#3e7182');text(c,'CLASS',149,71,'#fff5d3',2);
 text(c,'C',152,85,'#53766c');arrow(c,172,82,'#53766c','right');
 // Two little footprints show where to stop and face the board.
 rect(c,163,101,3,5,'#648c80');rect(c,171,101,3,5,'#648c80');
 door(c,145,5,46,29,{label:'CAFE',open:state.stage3?.completed});
 // School notices, clock, a drinking fountain, library display and hanging plants.
 notice(c,73,27,32,23);sign(c,'READ',113,19,35,'#4c795f');shelf(c,110,32,32,24);windowPanel(c,19,20,27,17);plant(c,224,181);
 rect(c,74,174,18,17,'#6e979f');rect(c,72,172,22,4,'#a9c2bd');rect(c,80,168,3,5,'#6e8588');rect(c,80,168,8,2,'#a2b7b6');rect(c,75,180,15,1,'#486e77');
 rect(c,153,40,30,15,'#d1d6b9');arrow(c,164,42,'#5d8579');
 // South vestibule with framed glazing and a ribbed entrance mat.
 door(c,145,202,46,28,{glass:true,open:true});for(let x=147;x<189;x+=4)rect(c,x,206,2,11,'#9cad9e');
}
function classroom(c,state){
 const s=state.stage3||{},dark=s.incidentSeen&&!s.rescue?.completed;
 // Windows, curtains and a pale north wall give the classroom a clear orientation.
 windowPanel(c,5,49,19,28);windowPanel(c,5,117,19,28);for(const y of [48,116]){rect(c,3,y,3,29,'#859c8b');rect(c,23,y,3,29,'#859c8b');}
 // Long framed chalkboard, chalk ledge, worked examples and a classroom clock.
 rect(c,62,16,134,30,WOOD);rect(c,65,18,128,24,'#376b59');rect(c,67,20,124,2,'#487d68');text(c,dark&&!s.restored?.class?'_LASS':'CLASS',94,24,'#f4ebc7',2);rect(c,63,43,132,3,'#c19865');rect(c,71,42,8,2,'#d5dfc9');rect(c,175,41,10,3,'#67756b');text(c,'C',178,25,'#b7d5b1',2);
 c.fillStyle='#8a7657';c.beginPath();c.arc(213,22,9,0,Math.PI*2);c.fill();c.fillStyle='#f3edda';c.beginPath();c.arc(213,22,7,0,Math.PI*2);c.fill();rect(c,212,17,1,6,INK);rect(c,213,22,4,1,INK);
 desk(c,129,65,45,{teacher:true});
 for(const d of SCHOOL_DESKS)desk(c,d.x*16+1,d.y*16+1,29);
 // Learning corner: mounted cat artwork, an easel and word/gesture cards.
 notice(c,222,32,32,26);catPicture(c,229,37,{missing:dark&&!s.restored?.cat});catPicture(c,223,155,{easel:true,missing:dark&&!s.restored?.cat});

 // A presentation rug with footprints replaces the unexplained yellow trigger tile.
 rect(c,151,81,34,13,'#6b8b8f');rect(c,153,83,30,9,'#a9c0b6');rect(c,158,86,3,4,'#6e8e88');rect(c,174,86,3,4,'#6e8e88');
 // East wall and the supply-room door, with a visible window, handle and jamb.
 rect(c,272,16,32,192,'#d2c8af');rect(c,272,116,32,77,'#a9b9ad');rect(c,272,114,32,3,'#6d8a81');
 door(c,272,63,29,46,{label:'STORE',open:!!s.rescue?.completed,locked:dark});
 // The door window shows the trapped cat instead of only a text label.
 if(dark){c.save();c.beginPath();c.rect(277,68,17,15);c.clip();drawSchoolAnimal(c,279,70);c.restore();rect(c,282,67,1,16,'#b8c4c2');}
 shelf(c,31,184,48,26);plant(c,21,178);rect(c,257,116,30,23,WOOD);rect(c,258,117,28,20,'#dae4cf');sign(c,dark&&!s.restored?.come?'_OME':'COME',257,116,30,'#486d69');arrow(c,269,127,'#5e8b72','right');
 // Carpet threshold leading back to the school corridor.
 door(c,147,204,43,26,{open:true});
 if(dark){const restored=Object.values(s.restored||{}).filter(Boolean).length;rect(c,16,16,288,208,`rgba(26,24,51,${Math.max(.06,.26-restored*.045-(s.boss?.round||0)*.025)})`);}
}
function supplyRoom(c){
 windowPanel(c,165,19,50,20);sign(c,'ART',217,19,33,'#647b65');
 shelf(c,48,31,93,29);shelf(c,240,32,62,46);
 // Art table with paint pots, brushes and paper, not a plain chest.
 desk(c,97,80,29,{teacher:true});for(const [i,color]of ['#b85b48','#dabd61','#689ea0'].entries()){rect(c,101+i*6,81,4,5,color);rect(c,101+i*6,80,4,1,'#e9d7b3');}rect(c,118,75,2,7,'#637987');
 // Wicker cat basket with cushion, sleeping blanket, water bowl and toy mouse.
 shadow(c,190,105,39,5);rect(c,190,83,38,24,'#9c7248');rect(c,193,80,32,5,'#b88c58');for(let yy=85;yy<104;yy+=4){rect(c,191,yy,36,1,'#d0ab72');for(let xx=193+(yy%3);xx<227;xx+=5)rect(c,xx,yy-1,1,3,'#785c40');}rect(c,195,84,28,17,'#ddd9b9');rect(c,198,87,22,12,'#91a6b0');rect(c,198,88,20,2,'#b8c8c7');
 rect(c,230,112,13,4,'#6f94a6');rect(c,231,110,11,3,'#b3d8dc');rect(c,233,111,7,1,'#e3f0e3');rect(c,180,119,6,3,'#90929a');rect(c,179,118,2,2,'#c8b7ad');rect(c,185,120,4,1,'#b08476');
 // Labelled storage drawers, paper rolls and supply crates.
 rect(c,257,145,29,46,'#90754f');for(let yy=147;yy<189;yy+=10){rect(c,259,yy,25,8,'#c4a36e');rect(c,269,yy+3,5,2,'#6e6650');}rect(c,260,138,5,8,'#efe5c8');rect(c,267,136,5,10,'#d7dac4');rect(c,274,139,5,7,'#e3c9a6');
 notice(c,57,110,31,23);plant(c,22,173);door(c,17,89,29,40,{label:'CLASS',open:true});
}
export function renderSchoolScene(ctx,ox,oy,state,map,now=0){
 ctx.save();ctx.translate(Math.round(ox),Math.round(oy));
 const yard=map.id==='SchoolYard';
 for(let y=0;y<15;y++)for(let x=0;x<20;x++){
  const px=x*16,py=y*16;
  if(yard){const path=x>=8&&x<=11;rect(ctx,px,py,16,16,y>=13?'#7c8989':path?'#d6cdb5':'#99b482');if(path){rect(ctx,px,py+15,16,1,'#bdb8a0');if(y%2===0)rect(ctx,px+7,py,1,15,'#ccc2aa');}else if(y<13){const n=(x*37+y*19)%13;rect(ctx,px+2+n%9,py+4,2,1,'#83a174');rect(ctx,px+8,py+11,1,2,'#afc28e');}else if(y===14&&x%3===0)rect(ctx,px+3,py+7,10,2,'#e1d6ac');}
  else{const wooden=map.id==='Classroom';rect(ctx,px,py,16,16,wooden?'#ddc59b':'#e0ddc9');if(wooden){for(let yy=3;yy<16;yy+=4)rect(ctx,px,py+yy,16,1,'#cfb58d');rect(ctx,px+(y%2?4:12),py,1,15,'#d2ba91');}else{rect(ctx,px+15,py,1,16,'#d2d3c1');rect(ctx,px,py+15,16,1,'#d2d3c1');if((x+y)%5===0)rect(ctx,px+3,py+3,5,1,'#e9e7d5');}}
  if(!yard&&(x===0||x===19||y===0||y===14)){rect(ctx,px,py,16,16,'#607b80');rect(ctx,px+1,py+1,14,10,'#a9b9af');rect(ctx,px,py+12,16,3,'#526d71');}
 }
 if(!yard){rect(ctx,16,13,288,18,'#e4dbc0');rect(ctx,16,30,288,3,'#718f88');}
 if(map.id==='SchoolYard')outdoor(ctx);
 if(map.id==='SchoolHall'){rect(ctx,145,51,46,145,'#8faeab');rect(ctx,148,53,40,141,'#b5c8b9');for(let yy=57;yy<190;yy+=12)rect(ctx,149,yy,38,1,'#a2bdb1');hall(ctx,state);}
 if(map.id==='Classroom')classroom(ctx,state);
 if(map.id==='CocoRoom')supplyRoom(ctx);
 ctx.restore();
}

export const schoolArt={rect,text,sign,shadow,windowPanel,brick,door,plant,desk,books,shelf,notice,arrow};
