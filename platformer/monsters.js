'use strict';
// Original block sprites, shared by the world, encounter portrait and field guide.
window.MonsterArt = (() => {
  const catalog = {
    wither: {name:'위더',w:100,h:74,speed:45,flying:true,math:'hard',elite:true,color:'#454752',greeting:'세 개의 머리로 도전! 10개 묶음부터 더해 봐!',detail:'세 개의 해골 머리를 가진 공중 보스. 검은 해골탄을 날려요. 덧셈의 답은 30~50!'},
    elderguardian: {name:'엘더 가디언',w:80,h:62,speed:18,math:'hard',elite:true,color:'#c5bca6',greeting:'바다 신전의 도전! 십의 자리와 일의 자리를 나누어 더해 봐.',detail:'바다 신전의 강적을 이 섬에 초대했어요. 커다란 눈과 가시, 빛나는 광선을 찾아봐요. 덧셈의 답은 30~50!'},
    evoker: {name:'소환사',w:44,h:66,speed:23,math:'hard',elite:true,color:'#665655',greeting:'마법 대결이다! 블록으로 10을 만들면 큰 수도 쉬워져.',detail:'숲속 저택과 습격에서 만나는 마법사. 검은 로브와 황금 테두리를 두르고 있어요. 덧셈의 답은 30~50!'},
    ravager: {name:'파괴수',w:92,h:66,speed:35,math:'hard',elite:true,color:'#817b73',greeting:'쿵쿵! 서두르지 말고 10개 묶음부터 세어 봐!',detail:'습격에 나타나는 커다란 야수. 굵은 다리와 두 뿔, 넓은 코가 특징이에요. 덧셈의 답은 30~50!'},
    piglinbrute: {name:'피글린 야수',w:52,h:66,speed:32,math:'hard',elite:true,color:'#c18e79',greeting:'보루의 도전! 두 수의 10개 묶음과 낱개를 합쳐 봐!',detail:'보루 잔해를 지키는 강한 피글린. 검은 옷과 황금 도끼를 들고 있어요. 덧셈의 답은 30~50!'},
    breeze: {name:'브리즈',w:44,h:58,speed:38,color:'#a3cbd0',greeting:'휘이잉! 바람을 타고 숫자 모험을 해 볼까?',detail:'50마리 달성으로 만나는 바람 몬스터! 근처 바람 발판이나 바람탄을 타고 5~7층 하늘길로 올라가 봐.'},
    shulker: {name:'셜커',w:44,h:48,speed:10,math:'hard',color:'#9a77b3',greeting:'딱! 단단한 껍데기를 큰 덧셈으로 열어 봐!',detail:'보라색 껍데기를 열면 작은 얼굴이 나타나는 엔더 친구예요.'},
    endermite: {name:'엔더마이트',w:36,h:24,speed:42,color:'#8b6fa6',greeting:'바스락! 재빠른 숫자 마법을 보여 줘!',detail:'보라색 마디와 작은 다리로 빠르게 기어 다녀요.'},
    enderknight: {name:'엔더 기사',w:48,h:72,speed:28,math:'hard',color:'#715889',greeting:'엔더의 수호자다! 큰 덧셈으로 도전해 봐!',detail:'이 모험만의 창작 몬스터! 보라색 갑옷과 긴 검을 든 엔더 수호 기사예요.'},
    enderdragon: {name:'엔더드래곤',w:174,h:114,speed:100,flying:true,math:'hard',color:'#44364f',greeting:'크아앙! 두 자리 수를 합쳐 드래곤에게 도전해 봐!',detail:'보라색 눈, 커다란 검은 날개와 긴 꼬리로 하늘을 날아요.'},
    warden: {name:'워든',w:64,h:82,speed:18,math:'hard',color:'#24646a',greeting:'쿵쿵! 10개 묶음을 만들며 큰 덧셈을 풀어 봐!',detail:'눈 없는 얼굴, 청록색 더듬이와 빛나는 가슴을 가진 거인이에요.'},
    chicken: {name:'하얀 닭',w:30,h:36,speed:26,math:'multiply',color:'#e9e6dc',greeting:'꼬꼬! 외우지 않아도 괜찮아. 묶음을 하나씩 세어 보자!',detail:'하얀 네모 몸, 노란 부리와 빨간 턱볏이 있어요. 2~5단 친구!'},
    pig: {math:'multiply',name:'분홍 돼지',w:42,h:32,speed:21,color:'#e7a4b2',greeting:'꿀꿀! 바구니마다 같은 수의 사과가 있어. 더해서 세어 볼까?',detail:'분홍 네모 코와 짧은 네 다리로 걸어요.'},
    rabbit: {math:'multiply',name:'눈꽃 토끼',w:30,h:46,speed:29,color:'#eee2cf',greeting:'깡충! 2개 다음은 4개! 같은 수만큼 더하며 세어 보자.',detail:'긴 귀와 작은 꼬리가 있는 하얀 토끼예요.'},
    fox: {name:'단풍 여우',w:48,h:36,speed:31,color:'#d99b5d',greeting:'살금살금! 덧셈 수수께끼를 풀어 봐!',detail:'주황빛 몸과 하얀 꼬리 끝을 찾아봐요.'},
    zombie: {name:'풀빛 좀비', w:32, h:44, speed:22, color:'#8aaf72', greeting:'으어어~ 덧셈 마법으로 숲을 밝혀 줘!', detail:'초록 얼굴에 파란 옷을 입고 터벅터벅 걸어요.'},
    creeper: {name:'이끼 크리퍼', w:30, h:46, speed:25, color:'#82b64d', greeting:'쉬이익~ 숫자 마법으로 마음을 진정시켜 줘!', detail:'얼룩무늬 초록 몸과 네 개의 짧은 발을 찾아봐요.'},
    slime: {name:'말랑 슬라임', w:40, h:32, speed:27, color:'#a4cc6d', greeting:'말랑말랑! 두 수를 합치면 얼마일까?', detail:'투명한 연두색 네모 몸으로 통통 뛰어요.'},
    skeleton: {name:'달빛 스켈레톤', w:30, h:50, speed:25, color:'#b9c3b1', greeting:'달그락! 뼈다귀도 셀 수 있는 덧셈 마법!', detail:'하얀 네모 해골과 가느다란 팔다리, 작은 활이 있어요.'},
    spider: {name:'루비 거미', w:56, h:28, speed:34, color:'#946c67', greeting:'사각사각! 다리를 세듯 차근차근 풀어 봐!', detail:'빨간 눈을 반짝이며 여덟 다리로 기어가요.'},
    witch: {name:'보랏빛 마녀', w:34, h:56, speed:23, color:'#a28bbd', greeting:'보글보글! 정답을 넣으면 햇살 물약 완성!', detail:'뾰족한 보라 모자와 초록 물약을 들고 있어요.'},
    enderman: {name:'별빛 엔더맨', w:30, h:68, speed:30, color:'#9d89c1', greeting:'반짝! 먼 별에서 덧셈 마법을 만나러 왔어.', detail:'키가 크고 팔이 길어요. 보랏빛 눈과 별가루가 반짝여요.'},
    magma: {name:'노을 마그마 큐브', w:40, h:34, speed:26, color:'#d59460', greeting:'따끈따끈! 숫자 마법으로 온기를 나눠 줘!', detail:'짙은 네모 몸 사이로 주황빛 용암 줄무늬가 보여요.'},
    ghast: {flying:true,name:'구름 가스트', w:46, h:54, speed:24, color:'#b7bed0', greeting:'두둥실~ 정답을 맞히면 하늘이 맑아질 거야!', detail:'하얀 네모 몸 아래 긴 촉수가 살랑거려요.'}
  };
  const worlds = [['zombie','creeper','slime'],['skeleton','spider','witch'],['enderman','magma','ghast']];
  function draw(c,kind,x,y,w,h,time=0,face=1) {
    c.save();c.translate(Math.round(x+w/2),Math.round(y+h));c.scale(face,1);
    const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
    const step=Math.sin(time*9)*2;
    if(kind==='wither'){
      r(-35,-44,70,8,'#373944');r(-5,-43,10,35,'#373944');
      for(let i=0;i<3;i++){r(-21+i*4,-32+i*9,42-i*8,5,'#626571');}
      for(const [xx,yy,size] of [[-46,-62,25],[-16,-74,32],[22,-62,25]]){
        r(xx,yy,size,size,'#353741');r(xx+3,yy+3,size-6,5,'#626571');r(xx+5,yy+11,5,5,'#dbedf0');r(xx+size-10,yy+11,5,5,'#dbedf0');r(xx+size/2-4,yy+size-7,8,3,'#151923');
      }
      for(let i=0;i<4;i++)r(-22+i*14,-6+Math.sin(time*4+i)*4,4,4,'#7b818d');
    }else if(kind==='elderguardian'){
      r(-31,-49,59,43,'#bdb39b');r(-26,-44,48,33,'#ded4bc');
      for(const xx of [-25,-4,17]){r(xx,-61,7,14,'#8fa8a2');r(xx,-8,7,8,'#8fa8a2');}
      r(-40,-38,11,8,'#8fa8a2');r(28,-38,11,8,'#8fa8a2');r(-20,-38,37,20,'#eee5cb');r(-7,-36,13,16,'#bc795f');r(-2,-32,6,9,'#293e40');r(27,-22,9,12,'#8fa8a2');r(33,-19,7,17,'#587e79');
    }else if(kind==='evoker'){
      r(-14,-64,28,23,'#9a9c91');r(-10,-55,7,3,'#416b57');r(4,-55,7,3,'#416b57');r(-3,-52,6,14,'#757d72');
      r(-16,-39,32,36,'#393940');r(-16,-39,4,36,'#d7b55c');r(12,-39,4,36,'#d7b55c');r(-4,-38,8,22,'#9b4340');r(-22,-43,7,23,'#53515a');r(16,-43,7,23,'#53515a');r(-23,-49,8,8,'#aeb1a1');r(16,-49,8,8,'#aeb1a1');r(-12,-4,9,4,'#272b33');r(4,-4,9,4,'#272b33');
    }else if(kind==='ravager'){
      r(-42,-46,68,33,'#79766f');r(-36,-43,55,7,'#a49d90');
      for(const xx of [-36,-15,9,29])r(xx,-19,10,19+(xx%2?step:-step),'#555650');
      r(5,-55,36,33,'#969387');r(18,-36,28,15,'#b7b1a0');r(24,-30,5,5,'#555650');r(36,-30,5,5,'#555650');r(10,-49,7,5,'#7c3933');r(29,-49,7,5,'#7c3933');r(6,-66,8,15,'#ded4b8');r(30,-66,8,15,'#ded4b8');r(-22,-46,8,31,'#494a49');r(-24,-33,12,7,'#c3b89d');
    }else if(kind==='piglinbrute'){
      r(-15,-62,30,23,'#c5937d');r(-23,-59,10,13,'#d8a28a');r(15,-59,10,13,'#d8a28a');r(-11,-55,5,4,'#403936');r(6,-55,5,4,'#403936');r(-8,-48,17,10,'#dfa58a');r(-9,-42,3,7,'#f5e6c8');r(7,-42,3,7,'#f5e6c8');r(-16,-36,32,24,'#36353a');r(-16,-34,32,4,'#d7b461');r(-6,-34,5,21,'#a18446');r(-23,-35,7,23,'#c5937d');r(16,-35,7,23,'#c5937d');r(-12,-13,9,13+step,'#444149');r(4,-13,9,13-step,'#444149');r(22,-47,4,36,'#927348');r(14,-52,17,13,'#e3b64b');r(15,-51,9,5,'#ffe08a');
    }else if(kind==='breeze'){
      r(-13,-56,26,20,'#74758e');r(-16,-53,32,6,'#b4a2ba');r(-9,-46,7,3,'#fff3bd');r(4,-46,7,3,'#fff3bd');r(-8,-34,17,9,'#9196b0');
      for(let i=0;i<4;i++){const width=36-i*7,dx=Math.sin(time*7+i)*4;r(-width/2+dx,-29+i*7,width,4,i%2?'#d5f4f2':'#93c9d0');}r(-23,-37,12,5,'#bddedc');r(12,-37,12,5,'#bddedc');
    }else if(kind==='shulker'){
      const opening=5+Math.max(0,Math.sin(time*2))*11;
      r(-21,-24,42,24,'#76528e');r(-18,-21,36,17,'#a780b5');r(-11,-29-opening/2,22,18,'#e3d8a7');r(-7,-25-opening/2,4,4,'#332b42');r(4,-25-opening/2,4,4,'#332b42');r(-22,-32-opening,44,17,'#9064a6');r(-18,-30-opening,36,6,'#b78ac6');r(-15,-12,9,6,'#8a609e');r(6,-12,10,6,'#c298ce');
    }else if(kind==='endermite'){
      for(let i=0;i<4;i++){const yy=Math.sin(time*10+i)*2;r(-18+i*8,-18+yy,10,15,'#70577f');r(-16+i*8,-21+yy,7,5,'#a58ab6');r(-18+i*8,-5+yy,3,5,'#41364e');}r(10,-15,4,3,'#f49deb');r(16,-13,3,3,'#f49deb');
    }else if(kind==='enderknight'){
      r(-14,-70,28,22,'#342d44');r(-18,-72,36,7,'#a58cbf');r(-10,-60,8,3,'#e896ff');r(3,-60,8,3,'#e896ff');r(-17,-48,34,29,'#564264');r(-11,-44,22,20,'#84699b');r(-4,-41,8,11,'#bd91e5');r(-23,-47,9,25,'#4b3a59');r(16,-47,9,23,'#4b3a59');r(-13,-20,10,20+step,'#332c42');r(4,-20,10,20-step,'#332c42');r(26,-54,5,34,'#b6dfdf');r(21,-24,15,4,'#ba97df');r(27,-20,4,9,'#685074');
    }else if(kind==='enderdragon'){
      c.scale(w/116,h/76);
      const flap=Math.sin(time*5)*12;
      const wing=(side)=>{c.save();c.scale(side,1);c.fillStyle='#24212d';c.beginPath();c.moveTo(-6,-37);c.lineTo(-48,-72+flap);c.lineTo(-58,-37+flap);c.lineTo(-34,-43);c.lineTo(-22,-23);c.closePath();c.fill();c.strokeStyle='#73667c';c.lineWidth=3;c.beginPath();c.moveTo(-6,-37);c.lineTo(-48,-72+flap);c.lineTo(-34,-43);c.moveTo(-48,-72+flap);c.lineTo(-22,-23);c.stroke();c.restore();};
      wing(-1);wing(1);r(-25,-36,52,21,'#181820');r(20,-43,16,21,'#25232e');r(30,-46,21,17,'#191820');r(43,-37,15,10,'#25232e');r(35,-42,8,3,'#d476f5');r(32,-52,4,8,'#a198a9');r(44,-51,4,7,'#a198a9');
      for(let i=0;i<5;i++){r(-31-i*5,-29+i*3,10,7-i,'#292532');r(-20+i*10,-41,5,6,'#9b94a5');}for(const x of [-18,13]){r(x,-16,7,12,'#292532');r(x+2,-6,10,5,'#80768a');}
    }else if(kind==='warden'){
      r(-22,-54,44,39,'#12343b');r(-27,-49,11,34+step,'#173e43');r(17,-49,11,34-step,'#173e43');r(-19,-17,14,17+step,'#102c34');r(7,-17,14,17-step,'#102c34');r(-21,-73,42,24,'#123139');r(-14,-60,28,9,'#091d27');r(-8,-57,16,3,'#527578');
      for(const side of [-1,1]){r(side<0?-30:23,-78,7,25,'#2b8f94');r(side<0?-34:28,-82,6,11,'#8bc8b9');}
      r(-13,-46,26,25,'#1d6870');for(let i=0;i<3;i++){r(-17,-45+i*8,13,4,'#b8c6ac');r(5,-45+i*8,13,4,'#b8c6ac');}r(-4,-41,9,17,'#72d5cc');r(-2,-36,5,7,'#b7f0d9');
    }else if(kind==='chicken'){
      r(-12,-24,24,19,'#deded5');r(-8,-35,19,18,'#faf8ee');r(6,-30,4,4,'#262a30');r(10,-26,9,6,'#e5b54b');r(8,-20,5,8,'#ba4549');r(-13,-19,12,10,'#faf8ee');r(-7,-6,3,6+step,'#c49b3e');r(6,-6,3,6-step,'#c49b3e');
    }else if(kind==='pig'){
      r(-19,-25,33,19,'#e6a0ae');r(5,-32,17,22,'#f0b3bd');r(5,-35,6,7,'#d68c9f');r(18,-24,7,10,'#d8889d');r(20,-21,2,3,'#975d71');r(12,-28,4,4,'#4a454b');for(let i=0;i<3;i++)r(-15+i*13,-8,6,8+(i%2?step:-step),'#bd7f90');
    }else if(kind==='rabbit'){
      r(-11,-25,22,20,'#e9dfcd');r(-8,-36,21,18,'#f6eddc');r(-7,-46,6,14,'#eee4d1');r(4,-46,6,14,'#eee4d1');r(-5,-44,2,10,'#e5b7bd');r(6,-44,2,10,'#e5b7bd');r(7,-30,3,4,'#51505a');r(12,-24,3,3,'#d09ca8');r(-15,-15,7,8,'#fff6e6');r(-10,-6,9,6+step,'#cbbda7');r(5,-6,9,6-step,'#cbbda7');
    }else if(kind==='fox'){
      r(-15,-25,30,19,'#cf8b4e');r(5,-32,17,20,'#e5a261');r(5,-36,6,8,'#915f46');r(17,-36,5,8,'#915f46');r(13,-26,4,4,'#423f44');r(14,-18,13,7,'#f5e5ca');r(24,-19,4,4,'#423f44');r(-25,-20,15,12,'#df9b5a');r(-29,-21,8,13,'#f5e5ca');r(-12,-7,6,7+step,'#624b43');r(9,-7,6,7-step,'#624b43');
    }else if(kind==='zombie'){
      r(-14,-44,28,23,'#77945c');r(-10,-40,21,18,'#a2bf7e');r(-8,-35,5,5,'#344f38');r(5,-35,5,5,'#344f38');r(-3,-26,8,3,'#637b4b');r(-12,-21,25,13,'#6f8eae');r(-19,-20,7,7,'#a2bf7e');r(13,-21,10,7,'#a2bf7e');r(-11,-9,9,9+step,'#536a68');r(5,-9,9,9-step,'#536a68');
    }else if(kind==='creeper'){
      r(-14,-46,28,24,'#7cac4e');r(-10,-43,8,7,'#b3ce77');r(5,-44,6,5,'#547e3d');r(-12,-31,5,6,'#97c066');r(-9,-37,6,6,'#304d30');r(4,-37,6,6,'#304d30');r(-3,-32,7,9,'#304d30');r(-7,-29,4,8,'#304d30');r(4,-29,4,8,'#304d30');r(-8,-22,17,16,'#8ab859');r(-5,-19,5,6,'#b6d480');r(4,-15,4,7,'#628f41');for(let i=0;i<4;i++)r(-15+i*8,-8,7,8+(i%2?step:-step),'#648d43');
    }else if(kind==='slime'||kind==='magma'){
      const magma=kind==='magma',bounce=Math.max(0,Math.sin(time*5))*6;c.translate(0,-bounce);
      r(-20,-31,40,31,magma?'#623e39':'#7cae58');r(-17,-28,34,24,magma?'#8c4b36':'#b9dc84');
      if(magma){r(-18,-23,36,4,'#eb9b43');r(-18,-12,36,4,'#d37535');r(-12,-28,7,3,'#f6c25b');}else{r(-12,-24,25,19,'#9cc86d');r(-16,-28,6,10,'#e1efb5');r(12,-9,5,5,'#cee69f');}
      r(-11,-21,7,7,magma?'#f8ce62':'#4f783e');r(5,-21,7,7,magma?'#f8ce62':'#4f783e');r(-3,-10,7,4,magma?'#402e32':'#679849');
    }else if(kind==='skeleton'){
      r(-12,-50,25,21,'#c8ceba');r(-9,-48,20,15,'#eef0d9');r(-8,-43,6,6,'#596d63');r(4,-43,6,6,'#596d63');r(-3,-35,7,5,'#77847a');r(-2,-30,5,20,'#dce0ca');for(let i=0;i<3;i++)r(-9,-27+i*6,20,3,'#e7e8cf');r(-15,-28,4,19,'#c3cbb9');r(13,-28,4,17,'#c3cbb9');r(-9,-10,5,10+step,'#dce0ca');r(5,-10,5,10-step,'#dce0ca');r(20,-30,3,21,'#9b7956');r(17,-34,3,6,'#b99867');r(17,-10,3,6,'#b99867');r(16,-29,1,19,'#ede1b3');
    }else if(kind==='spider'){
      for(let i=0;i<4;i++){const yy=-22+i*5;for(const side of [-1,1]){r(side<0?-24:14,yy,11,3,'#584a4b');r(side<0?-28:24,yy+3,4,7+(i%2?step:-step),'#6d5956');}}
      r(-16,-24,32,19,'#6d5756');r(-11,-27,22,7,'#7e6461');r(-12,-17,24,15,'#51494d');r(-9,-15,6,5,'#e87d6b');r(4,-15,6,5,'#e87d6b');r(-6,-6,3,5,'#dccdb3');r(5,-6,3,5,'#dccdb3');
    }else if(kind==='witch'){
      r(-13,-36,27,16,'#a7b68b');r(-7,-30,4,4,'#4e5349');r(6,-30,4,4,'#4e5349');r(0,-27,5,10,'#81946e');r(-17,-41,34,6,'#5e4c77');r(-10,-51,21,11,'#75608f');r(-5,-56,10,6,'#75608f');r(-10,-44,21,4,'#bba35b');r(-13,-19,27,17,'#9277a7');r(-7,-19,6,17,'#ac93b8');r(-13,-3,9,4,'#574e67');r(7,-3,9,4,'#574e67');r(17,-21,5,6,'#d7dba9');r(14,-15,11,12,'#83bca1');r(16,-12,7,7,'#b8dfab');
    }else if(kind==='enderman'){
      r(-11,-68,23,18,'#414052');r(-8,-62,7,3,'#dba4ed');r(3,-62,7,3,'#dba4ed');r(-7,-50,15,23,'#4b475d');r(-15,-48,4,33+step,'#444154');r(13,-48,4,33-step,'#444154');r(-7,-27,5,27+step,'#393949');r(4,-27,5,27-step,'#393949');for(let i=0;i<4;i++)r(-25+i*15,-20-(i*13+time*12)%52,3,3,'#bd92d4');
    }else if(kind==='ghast'){
      c.translate(0,Math.sin(time*3)*3);r(-22,-51,44,32,'#cbd2d6');r(-19,-49,38,27,'#f4f2e7');r(-16,-44,6,7,'#ffffff');r(-12,-37,6,4,'#8b91a0');r(6,-37,6,4,'#8b91a0');r(-5,-28,10,5,'#b5b4bb');for(let i=0;i<5;i++){r(-19+i*8,-19,5,12+(i%3)*3+Math.sin(time*4+i)*3,'#e6e6de');r(-19+i*8,-9+(i%2)*3,3,5,'#c2c9d1');}
    }
    c.restore();
  }
  function portrait(canvas,kind){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;const m=catalog[kind];c.save();const scale=Math.min(2,(canvas.width-16)/m.w,(canvas.height-16)/m.h);c.translate(canvas.width/2,canvas.height/2);c.scale(scale,scale);draw(c,kind,-m.w/2,-m.h/2,m.w,m.h,0);c.restore();canvas.setAttribute('aria-label',m.name);}
  function populate(map,random=Math.random,{windUnlocked=false,allowedKinds=null}={}){
    const count=5+Math.floor(random()*4),pool=(allowedKinds||Object.keys(catalog)).filter(k=>k!=='breeze'&&catalog[k]),kinds=pool.slice();
    while(kinds.length<count)kinds.push(pool[Math.floor(random()*pool.length)]);
    for(let i=kinds.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[kinds[i],kinds[j]]=[kinds[j],kinds[i]];}
    if(windUnlocked)kinds[2+Math.floor(random()*(count-2))]='breeze';
    // Every stage includes at least one new strong opponent; keep the wind slot.
    if(pool.some(k=>catalog[k].elite)&&!kinds.slice(0,count).some(k=>catalog[k].elite)){
      const eliteIndex=kinds.findIndex(k=>catalog[k].elite),slot=kinds[count-1]==='breeze'?count-2:count-1;
      [kinds[slot],kinds[eliteIndex]]=[kinds[eliteIndex],kinds[slot]];
    }
    const ground=map.platforms.filter(p=>p.ground),start=330,end=map.length-340;
    const spawns=Array.from({length:count},(_,i)=>{
      const target=start+(end-start)*(i+.35+random()*.3)/count;
      const positions=ground.map(g=>Math.max(g.x+90,Math.min(g.x+g.w-120,target)));
      const x=positions.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target))[0];
      return {kind:kinds[i],x,supportIndex:map.platforms.findIndex(p=>p.ground&&x>=p.x&&x<p.x+p.w)};
    });
    // Populate the tops of both climbing routes: level 3 and level 2.
    const upper=(map.climbingRoutes||[]).map(route=>route.steps.at(-1));
    const walkers=spawns.filter(z=>z.kind!=='breeze'&&!catalog[z.kind].flying);
    upper.forEach((step,i)=>{
      const z=walkers[i];if(!z)return;
      const index=map.platforms.findIndex(p=>!p.ground&&p.x===step[0]&&p.y===step[1]);
      const support=map.platforms[index];if(!support||support.w<catalog[z.kind].w+24)return;
      z.supportIndex=index;z.x=support.x+12+random()*(support.w-catalog[z.kind].w-24);
    });
    return spawns;
  }
  return {catalog,worlds,draw,portrait,populate};
})();
