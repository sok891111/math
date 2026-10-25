export const MIRROR_VERSION=2;
export const MIRROR_AXES={vertical:'세로축 │ (왼쪽↔오른쪽)',horizontal:'가로축 ─ (위↔아래)',diagonalDown:'대각선 ↘ (왼쪽 위–오른쪽 아래)',diagonalUp:'대각선 ↗ (왼쪽 아래–오른쪽 위)'};
export function reflectGrid(grid,n,axis){const out=Array(n*n);for(let r=0;r<n;r++)for(let c=0;c<n;c++){let y=r,x=c;if(axis==='vertical')x=n-1-c;else if(axis==='horizontal')y=n-1-r;else if(axis==='diagonalDown'){y=c;x=r;}else if(axis==='diagonalUp'){y=n-1-c;x=n-1-r;}else throw Error('Unknown mirror axis');out[y*n+x]=grid[r*n+c];}return out;}
export function mirrorQuestion(grade,rng){
 const n=5,pick=n=>Math.floor(rng()*n),mode=['double','reverse','repair'][pick(3)],axes=[['vertical','diagonalDown'],['horizontal','diagonalUp'],['diagonalDown','horizontal'],['diagonalUp','vertical']][pick(4)];
 const indices=Array.from({length:n*n},(_,i)=>i);for(let i=indices.length-1;i>0;i--){const j=pick(i+1);[indices[i],indices[j]]=[indices[j],indices[i]];}
 let start=Array(n*n).fill(0);indices.slice(0,7+pick(3)).forEach(i=>start[i]=1);
 // Reject patterns where an omitted reflection, swapped order or copying would also work.
 const equal=(a,b)=>a.every((v,i)=>v===b[i]);
 let target;
 for(let attempt=0;attempt<100;attempt++){
  target=reflectGrid(reflectGrid(start,n,axes[0]),n,axes[1]);
  if(![start,reflectGrid(start,n,axes[0]),reflectGrid(start,n,axes[1]),reflectGrid(reflectGrid(start,n,axes[1]),n,axes[0])].some(a=>equal(a,target)))break;
  const i=indices[attempt%indices.length];start[i]=1-start[i];
 }
 const source=mode==='reverse'?target:start,answer=mode==='reverse'?start:target;
 const q={type:'mirror',grade,mirrorVersion:MIRROR_VERSION,rows:n,cols:n,axis:'compound',mode,axes,source,answer,
 title:mode==='reverse'?'두 번 비친 빛의 처음 모습을 찾아 줘!':mode==='repair'?'두 거울을 지난 방패의 오류를 고쳐 줘!':'두 번의 거울 반사를 순서대로 예측해 줘!',
 instruction:mode==='reverse'?'왼쪽은 두 번 반사한 마지막 모습이에요. 안내에 적힌 순서를 거꾸로 되짚어 처음 모습을 오른쪽에 복원해 주세요.':mode==='repair'?'왼쪽 빛을 안내 순서대로 두 번 반사했어요. 오른쪽에는 잘못 켜지거나 꺼진 칸이 정확히 3개 있어요. 그 3칸을 고쳐 주세요.':'왼쪽 빛을 ① 거울에 비춘 뒤, 그 결과를 다시 ② 거울에 비춰요. 중간 모습은 보이지 않아요. 마지막 모습을 오른쪽에 만들어 주세요.',
 sourceLabel:mode==='reverse'?'두 번 반사한 마지막 모습':'처음 빛',targetLabel:mode==='reverse'?'처음 모습 복원':mode==='repair'?'오류 3칸 고치기':'두 번 반사한 마지막 모습',
 hint:'거울에 같은 거리에 있는 칸을 짝지으며, 한 번 반사한 결과를 다음 반사의 출발점으로 삼아 보세요.'};
 if(mode==='repair'){q.given=answer.slice();indices.slice(0,3).forEach(i=>q.given[i]=1-q.given[i]);}
 return q;
}
