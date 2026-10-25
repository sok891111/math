(function(root){
 'use strict';
 const runes=[{id:'leaf',name:'풀',symbol:'◆',color:'#96df83'},{id:'fire',name:'불',symbol:'▲',color:'#ffaf76'},{id:'water',name:'물',symbol:'●',color:'#80dcee'}];
 const tiers=[{name:'새싹',rate:.80,hits:2,power:25,hp:150,wildHp:50},{name:'희귀',rate:.68,hits:3,power:40,hp:180,wildHp:100},{name:'영웅',rate:.56,hits:3,power:60,hp:225,wildHp:180},{name:'전설',rate:.43,hits:4,power:75,hp:250,wildHp:240},{name:'신화',rate:.30,hits:4,power:90,hp:280,wildHp:300}];
 const habitats=[
  {id:'forest',name:'메아리 숲',type:'pattern',skill:'규칙 예측',move:'리듬 브레이크',mark:'🌿',color:'#a8df92',story:'몬스터의 공격에는 반복되는 리듬이 있어. 다음 공격을 읽어 반격하자!',brief:'다음 공격의 속성을 맞춰 연속 반격!',kinds:['creeper','zombie','slime','pig','chicken','rabbit','fox']},
  {id:'cave',name:'거울 동굴',type:'mirror',skill:'대칭과 공간',move:'미러 카운터',mark:'💎',color:'#95dce9',story:'거울 방패를 완성하면 몬스터의 마법이 그대로 되돌아가!',brief:'빛을 거울처럼 뒤집어 방패 완성!',kinds:['skeleton','witch','ghast','shulker','endermite']},
  {id:'ruins',name:'돌진 유적',type:'path',skill:'길 찾기',move:'루트 대시',mark:'⚡',color:'#ffcf83',story:'돌길을 이어 친구의 돌진 경로를 만들어 줘. 보석도 놓치지 마!',brief:'보석을 지나 몬스터까지 돌진!',kinds:['spider','breeze','ravager','magma','elderguardian','piglinbrute']},
  {id:'end',name:'엔더 신전',type:'logic',skill:'조건과 배치',move:'룬 봉인',mark:'🔮',color:'#c5b3f3',story:'룬의 조건을 모두 맞추면 엔더의 보호막을 깨뜨릴 수 있어!',brief:'단서를 조합해 봉인 룬을 배치!',kinds:['enderman','warden','wither','enderdragon','evoker','enderknight']}
 ];
 const shuffle=(a,random)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 function puzzle(type,grade,random=Math.random){
  const pick=n=>Math.floor(random()*n);
  if(type==='pattern'){
   const order=shuffle([0,1,2],random),patterns=[[0,1],[0,0,1],[0,1,2],[0,1,0,2],[0,1,2,0,2,1]],base=patterns[grade-1].map(i=>order[i]);
   const shown=base.concat(base),count=grade>=3?3:2;
   return {type,grade,shown,answer:Array.from({length:count},(_,i)=>base[i%base.length]),count,title:'다음 공격을 읽고 반격 속성을 연결해!',instruction:`속성 조각을 빈칸으로 끌어 다음 ${count}개의 공격을 연결해 봐.`,hint:'같은 묶음이 두 번 반복되고 있어. 처음 묶음을 다시 살펴봐.'};
  }
  if(type==='mirror'){
   const rows=grade===1?2:grade<=3?3:4,cols=grade<=2?2:3,axis=grade===5&&pick(2)?'horizontal':'vertical';
   const source=Array(rows*cols).fill(0);shuffle(Array.from({length:source.length},(_,i)=>i),random).slice(0,Math.min(grade,3)).forEach(i=>source[i]=1);
   const answer=source.map((_,i)=>axis==='vertical'?source[Math.floor(i/cols)*cols+(cols-1-i%cols)]:source[(rows-1-Math.floor(i/cols))*cols+i%cols]);
   return {type,grade,rows,cols,axis,source,answer,title:'거울 방패를 만들어 마법을 되돌려 줘!',instruction:axis==='vertical'?'빛 조각을 오른쪽 방패로 끌어 거울에 비친 빛을 켜 줘.':'빛 조각을 아래 방패로 끌어 거울에 비친 빛을 켜 줘.',hint:axis==='vertical'?'거울 가까운 칸은 반대쪽에서도 가까워. 왼쪽과 오른쪽의 순서가 뒤집혀.':'거울 가까운 줄은 반대쪽에서도 가까워. 위와 아래의 순서가 뒤집혀.'};
  }
  if(type==='path'){
   const size=grade===1?3:4,start=(size-1)*size,goal=size-1;
   let solution=[start],pos=start;while(pos!==goal){const row=Math.floor(pos/size),col=pos%size;pos+=row>0&&(col===size-1||random()<.5)?-size:1;solution.push(pos);}
   const gems=grade>=3?[solution[Math.floor(solution.length/3)],solution[Math.floor(solution.length*2/3)]]:[solution[Math.floor(solution.length/2)]];
   const blocked=[];for(let i=0;i<size*size;i++)if(!solution.includes(i)&&random()<.3+grade*.06)blocked.push(i);
   return {type,grade,size,start,goal,blocked,gems,budget:solution.length-1,solution,title:'돌길을 이어 몬스터에게 돌진해!',instruction:`보석 ${gems.length}개를 지나 ${solution.length-1}칸 안에 도착! 가로·세로로만 이동해.`,hint:'먼저 보석을 지나는 길을 찾아봐. 대각선으로 갈 수 없고, 돌이 있는 칸은 막혀 있어.'};
  }
  const count=grade<=3?3:4,cards=shuffle(Array.from({length:count},(_,i)=>i+1),random),target=shuffle(cards,random),clues=[];
  const ordinal=['첫째','둘째','셋째','넷째'];
  if(grade===1){for(let i=0;i<count-1;i++)clues.push({kind:'at',index:i,value:target[i],text:`${ordinal[i]} 룬은 ${target[i]}이야.`});}
  else if(grade===2){const minIndex=target.indexOf(1);clues.push({kind:'at',index:minIndex,value:1,text:`${ordinal[minIndex]} 룬이 가장 작아.`});const remaining=target.filter(n=>n!==1);clues.push({kind:'before',a:remaining[0],b:remaining[1],text:`${remaining[0]} 룬은 ${remaining[1]} 룬보다 왼쪽이야.`});}
  else if(grade===3){for(let i=0;i<count-1;i++)clues.push({kind:'before',a:target[i],b:target[i+1],text:`${target[i]} 룬은 ${target[i+1]} 룬보다 왼쪽이야.`});}
  else{const perms=permutations(cards);if(grade===4){const index=pick(count);clues.push({kind:'at',index,value:target[index],text:`${ordinal[index]} 룬은 ${target[index]}이야.`});}for(let i=0;i<count-1;i++)clues.push({kind:'sum',i,j:i+1,value:target[i]+target[i+1],text:`${ordinal[i]}와 ${ordinal[i+1]} 룬의 합은 ${target[i]+target[i+1]}이야.`});for(let i=0;i<count-1&&perms.filter(p=>fits(p,clues)).length!==1;i++)clues.push({kind:'before',a:target[i],b:target[i+1],text:`${target[i]} 룬은 ${target[i+1]} 룬보다 왼쪽이야.`});}
  return {type,grade,cards,count,clues,answer:target,title:'단서를 조합해 보호막의 봉인을 풀어!',instruction:'룬을 빈 자리로 끌어 배치해. 눌러서 선택·배치할 수도 있어.',hint:grade<=2?'위치가 정해진 룬부터 놓아 봐. 각 룬은 한 번씩만 사용할 수 있어.':grade===3?'“왼쪽” 단서를 차례로 이어 보면 룬의 순서를 알 수 있어.':grade===4?'위치가 정해진 룬을 먼저 놓고, 이웃한 두 룬의 합으로 나머지를 찾아봐.':'이웃한 두 룬의 합에 맞는 짝을 찾아봐. 가운데 룬은 양옆의 합 조건을 모두 만족해야 해.'};
 }
 function permutations(a){if(!a.length)return [[]];return a.flatMap((v,i)=>permutations(a.filter((_,j)=>j!==i)).map(p=>[v,...p]));}
 function fits(a,clues){return clues.every(c=>c.kind==='at'?a[c.index]===c.value:c.kind==='before'?a.indexOf(c.a)<a.indexOf(c.b):a[c.i]+a[c.j]===c.value);}
 function validate(q,input){
  if(!Array.isArray(input))return {ok:false,reason:'아직 연결되지 않은 곳이 있어.'};
  if(q.type==='pattern'||q.type==='mirror'){const ok=input.length===q.answer.length&&input.every((n,i)=>n===q.answer[i]);return {ok,reason:q.type==='pattern'?'공격 리듬이 달라. 반복되는 묶음을 다시 읽어 봐.':'거울 가까운 칸부터 양쪽을 비교해 봐.'};}
  if(q.type==='logic')return {ok:input.length===q.count&&new Set(input).size===q.count&&q.cards.every(n=>input.includes(n))&&fits(input,q.clues),reason:'모든 단서를 동시에 만족하는지 살펴봐.'};
  const adjacent=input.every((n,i)=>i===0||Math.abs(Math.floor(n/q.size)-Math.floor(input[i-1]/q.size))+Math.abs(n%q.size-input[i-1]%q.size)===1);
  const ok=input[0]===q.start&&input.at(-1)===q.goal&&input.length-1<=q.budget&&new Set(input).size===input.length&&input.every(n=>n>=0&&n<q.size*q.size&&!q.blocked.includes(n))&&q.gems.every(n=>input.includes(n))&&adjacent;
  return {ok,reason:!q.gems.every(n=>input.includes(n))?'보석을 모두 지나가는 길이 필요해.':input.length-1>q.budget?'돌진 에너지가 부족해. 더 짧은 길을 찾아봐.':'막힌 돌을 피해서 가로·세로로 길을 이어 줘.'};
 }
 function captureRate(grade,{perfect=false,combo=0,companion=false}={}){return Math.min(.94,tiers[grade-1].rate+(perfect?.10:0)+Math.min(combo,3)*.02+(companion?.03:0));}
 function capture(grade,options={},random=Math.random){return random()<captureRate(grade,options);}
 function attackPower(grade,combo=0){const tier=tiers[Math.max(0,Math.min(4,grade-1))];return tier.power+(combo>=2?10:0);}
 const api={attackPower,runes,tiers,habitats,puzzle,validate,fits,permutations,captureRate,capture};if(typeof module==='object'&&module.exports)module.exports=api;else root.CreativeBattle=api;
})(typeof window==='undefined'?globalThis:window);
