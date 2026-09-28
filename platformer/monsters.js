'use strict';
// Original block sprites, shared by the world, encounter portrait and field guide.
window.MonsterArt = (() => {
  const catalog = {
    zombie: {name:'풀빛 좀비', w:32, h:44, speed:22, color:'#8aaf72', greeting:'으어어~ 덧셈 마법으로 숲을 밝혀 줘!', detail:'초록 얼굴에 파란 옷을 입고 터벅터벅 걸어요.'},
    creeper: {name:'이끼 크리퍼', w:30, h:46, speed:25, color:'#82b64d', greeting:'쉬이익~ 숫자 마법으로 마음을 진정시켜 줘!', detail:'얼룩무늬 초록 몸과 네 개의 짧은 발을 찾아봐요.'},
    slime: {name:'말랑 슬라임', w:40, h:32, speed:27, color:'#a4cc6d', greeting:'말랑말랑! 두 수를 합치면 얼마일까?', detail:'투명한 연두색 네모 몸으로 통통 뛰어요.'},
    skeleton: {name:'달빛 스켈레톤', w:30, h:50, speed:25, color:'#b9c3b1', greeting:'달그락! 뼈다귀도 셀 수 있는 덧셈 마법!', detail:'하얀 네모 해골과 가느다란 팔다리, 작은 활이 있어요.'},
    spider: {name:'루비 거미', w:56, h:28, speed:34, color:'#946c67', greeting:'사각사각! 다리를 세듯 차근차근 풀어 봐!', detail:'빨간 눈을 반짝이며 여덟 다리로 기어가요.'},
    witch: {name:'보랏빛 마녀', w:34, h:56, speed:23, color:'#a28bbd', greeting:'보글보글! 정답을 넣으면 햇살 물약 완성!', detail:'뾰족한 보라 모자와 초록 물약을 들고 있어요.'},
    enderman: {name:'별빛 엔더맨', w:30, h:68, speed:30, color:'#9d89c1', greeting:'반짝! 먼 별에서 덧셈 마법을 만나러 왔어.', detail:'키가 크고 팔이 길어요. 보랏빛 눈과 별가루가 반짝여요.'},
    magma: {name:'노을 마그마 큐브', w:40, h:34, speed:26, color:'#d59460', greeting:'따끈따끈! 숫자 마법으로 온기를 나눠 줘!', detail:'짙은 네모 몸 사이로 주황빛 용암 줄무늬가 보여요.'},
    ghast: {name:'구름 가스트', w:46, h:54, speed:24, color:'#b7bed0', greeting:'두둥실~ 정답을 맞히면 하늘이 맑아질 거야!', detail:'하얀 네모 몸 아래 긴 촉수가 살랑거려요.'}
  };
  const worlds = [['zombie','creeper','slime'],['skeleton','spider','witch'],['enderman','magma','ghast']];
  function draw(c,kind,x,y,w,h,time=0,face=1) {
    c.save();c.translate(Math.round(x+w/2),Math.round(y+h));c.scale(face,1);
    const r=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
    const step=Math.sin(time*9)*2;
    if(kind==='zombie'){
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
  function portrait(canvas,kind){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;const m=catalog[kind];c.save();c.scale(2,2);draw(c,kind,48-m.w/2,43-m.h/2,m.w,m.h,0);c.restore();canvas.setAttribute('aria-label',m.name);}
  return {catalog,worlds,draw,portrait};
})();
