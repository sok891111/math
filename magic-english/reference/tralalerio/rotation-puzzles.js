// Predict a rotation mentally, then select a whole picture; no rotation demo.
export function rotationQuestion(grade,r,facto){
 const patterns=[[1,0,0,1,0,0,1,1,0],[1,1,1,0,1,0,0,0,0],[1,0,1,1,1,0,0,1,0]],pick=n=>Math.floor(r()*n);
 const source=facto.rotate(patterns[pick(patterns.length)],pick(4)),turns=grade>=3?1+pick(3):1;
 const direction=turns===3?'왼쪽으로 90도':turns===2?'오른쪽으로 180도':'오른쪽으로 90도';
 const explanation=turns===3?'시계바늘과 반대 방향으로 4분의 1바퀴 돌려요. 종이를 왼쪽으로 눕히듯 돌리는 거예요.':turns===2?'시계바늘 방향으로 반 바퀴 돌려요.':'시계바늘 방향으로 4분의 1바퀴 돌려요. 종이를 오른쪽으로 눕히듯 돌리는 거예요.';
 const rotations=[0,1,2,3];for(let i=3;i>0;i--){const j=pick(i+1);[rotations[i],rotations[j]]=[rotations[j],rotations[i]];}
 return {type:'rotate',grade,source,turns,direction,options:rotations.map(n=>facto.rotate(source,n)),answer:[rotations.indexOf(turns)],title:'그림을 돌리면 어떤 모습이 될까?',instruction:`위의 그림 전체를 ${direction} 돌린다고 생각해 봐요. ${explanation} 초록 칸은 그대로 붙어 있고 그림 전체의 방향만 바뀌어요. 아래 네 보기 중 돌린 뒤의 모습을 하나 골라 주세요.`,hint:'그림 전체가 함께 돌아가는 것을 상상하고, 모서리와 가운데 칸의 위치를 비교해 봐요.'};
}
