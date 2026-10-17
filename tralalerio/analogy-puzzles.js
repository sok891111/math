const colors=['초록','주황','파랑'],shapes=['마름모','세모','동그라미'];
export function advancedAnalogy(grade,r){
 const pick=n=>Math.floor(r()*n),dc=1+pick(2),ds=1+pick(2),swap=pick(2),
 first=id=>((Math.floor(id/3)+dc)%3)*3+(id%3+ds)%3,
 second=id=>swap?(id%3)*3+Math.floor(id/3):((Math.floor(id/3)+2)%3)*3+(id%3+1)%3,
 source=pick(9),answer=second(first(source)),pairs=[0,4,8].map(id=>[id,first(id)]),secondPairs=[0,5,7].map(id=>[id,second(id)]);
 const choices=Array.from({length:9},(_,value)=>({value,token:value}));for(let i=8;i>0;i--){const j=pick(i+1);[choices[i],choices[j]]=[choices[j],choices[i]];}
 const hints=[{title:'장치를 따로 분석해요',text:'A 장치와 B 장치의 예를 따로 보며 색과 모양이 어떻게 바뀌는지 비교해 봐.'},{title:'바뀌는 속성을 찾아요',text:'색이 같은 입력끼리, 모양이 같은 입력끼리 비교해 봐. B에서는 입력의 모양이 출력의 색을 정할 수도 있어.'},{title:'순서대로 두 번 바꿔요',text:'문제의 조각을 A에 넣은 중간 모습을 종이에 그려 봐. 그 조각을 다시 B에 넣어야 해. 처음 조각을 곧바로 B에 넣지 않도록 해.'}];
 return {type:'analogy',grade,answer:[answer],source,pairs,secondPairs,choices,title:'두 변환 장치를 지나면 어떤 조각이 될까?',instruction:'A와 B의 예에서 각각의 규칙을 찾아요. 아래 조각을 A → B 순서로 바꾼 마지막 모습을 골라 주세요. 색과 모양이 모두 맞아야 해요.',hints,hint:hints[0].text};
}
