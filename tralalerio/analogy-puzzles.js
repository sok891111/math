// Both attributes change; shared FACTO rendering and validation still use token IDs 0..8.
const colors=['초록','주황','파랑'],shapes=['마름모','세모','동그라미'];
const name=id=>colors[Math.floor(id/3)]+' '+shapes[id%3];
export function advancedAnalogy(grade,r){
 const pick=n=>Math.floor(r()*n),dc=1+pick(2),ds=1+pick(2),convert=id=>((Math.floor(id/3)+dc)%3)*3+(id%3+ds)%3,source=pick(9),answer=convert(source),pairs=[0,4,8].map(id=>[id,convert(id)]);
 const candidates=[answer,Math.floor(answer/3)*3+source%3,Math.floor(source/3)*3+answer%3];
 while(candidates.length<(grade>=3?6:5)){const n=pick(9);if(!candidates.includes(n))candidates.push(n);}
 for(let i=candidates.length-1;i>0;i--){const j=pick(i+1);[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
 const hints=[{title:'색과 모양을 따로 살펴봐요',text:'이번에는 색도 모양도 바뀌어. 위의 세 예에서 색의 규칙부터 찾아봐.'},{title:'두 가지 규칙을 찾아요',text:`색: ${pairs.map(([a,b])=>colors[Math.floor(a/3)]+' → '+colors[Math.floor(b/3)]).join(', ')}. 모양: ${pairs.map(([a,b])=>shapes[a%3]+' → '+shapes[b%3]).join(', ')}.`},{title:'두 규칙을 함께 적용해요',text:`지금 조각은 ${name(source)}이야. 예시에서 같은 색이 어떻게 바뀌었는지, 같은 모양이 어떻게 바뀌었는지 각각 찾아봐. 두 조건이 모두 맞는 조각을 골라 줘.`}];
 return {type:'analogy',grade:Math.max(2,grade),answer:[answer],source,pairs,choices:candidates.map(value=>({value,token:value})),title:'색과 모양의 변환 규칙을 함께 찾아 줘!',instruction:'색도 모양도 바뀌어요! 두 가지 규칙을 함께 적용해서 빈칸을 채워 봐요.',hints,hint:hints[0].text};
}
