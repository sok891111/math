export const BALANCE_VERSION=2;
const shuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function balanceQuestion(grade,r){
 const pick=n=>Math.floor(r()*n),gem=3+pick(7),star=2+((gem+pick(5))%8),q={type:'balance',grade,balanceVersion:BALANCE_VERSION,count:1,extra:0,total:0,answer:[gem],targetSymbol:'gem',title:grade>=5?'두 저울의 단서를 연결해 보석의 무게를 찾아 줘!':'양쪽의 보석을 함께 비교해 무게를 찾아 줘!',instruction:'추 1개가 무게 1이에요. 같은 모양은 어느 저울에 놓여도 무게가 같아요. 보석 ◆ 1개의 무게를 구해 주세요.'};
 if(grade>=5){const a=2+pick(2),b=2+pick(2);q.balanceClues=[{left:{gem:a,star:1,weight:0},right:{gem:0,star:0,weight:a*gem+star}},{left:{gem:1,star:b,weight:0},right:{gem:0,star:0,weight:gem+b*star}}];q.instruction+=' 두 저울을 모두 사용해야 풀 수 있어요. 별 ★과 보석 ◆은 서로 다른 모양이에요.';}
 else{const remaining=2+pick(2),same=1+pick(2),extra=2+pick(6);q.balanceClues=[{left:{gem:remaining+same,star:0,weight:extra},right:{gem:same,star:0,weight:remaining*gem+extra}}];}
 const wrong=grade>=5?[gem+q.balanceClues[1].left.star,gem-1,gem-2]:[gem+1,gem-1,q.balanceClues[0].right.weight-q.balanceClues[0].left.weight];
 q.choices=shuffle([gem,...[...new Set(wrong)].slice(0,3)],r).map(value=>({value,label:String(value)}));
 q.hint='저울이 기울지 않으려면 양쪽에 같은 만큼 더하거나 빼야 해요. 같은 모양끼리 묶어 단서를 연결해 보세요.';return q;
}
