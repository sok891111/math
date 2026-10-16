import {WOBBLE_PROBABILITIES} from './capture-source.js?v=20261016-capture3';
// Gold decides success before the animation. Successful throws always wobble
// three times. Failed throws independently pass up to three cosmetic checks.
export function captureWobbles(caught,threshold,rng=Math.random){
 if(caught)return 3;
 const probability=WOBBLE_PROBABILITIES.find(([limit])=>threshold<=limit)[1];
 let shakes=0;while(shakes<3&&Math.min(255,Math.max(0,Math.floor(rng()*256)))<probability)shakes++;
 return shakes;
}
export const ESCAPE_TEXT=[
 '이런! 포켓몬이 볼에서 튀어 나와버렸다!',
 '으으! 잡았다고 생각했는데!',
 '분하다! 조금만 더하면 잡을 수 있었는데!',
 '아까워라! 이제 곧 잡을 수 있었는데!',
];
