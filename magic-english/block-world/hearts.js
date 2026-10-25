export const HEART_SECONDS=20;
export const heartCount=inventory=>inventory.hearts||0;
export const heartRewardForBlocks=quantity=>quantity/2;
export const rewardHearts=reward=>heartRewardForBlocks(reward.blocks.reduce((sum,b)=>sum+b.quantity,0));
export function spendHearts(inventory,amount=1){
 if(!Number.isInteger(amount)||amount<0)throw Error('하트 피해가 올바르지 않습니다.');
 const hearts=Math.max(0,heartCount(inventory)-amount);
 return {...inventory,hearts,heartElapsed:hearts?(inventory.heartElapsed||0):0};
}
export function tickHearts(inventory,seconds,playing=true){
 if(!playing||!heartCount(inventory)||!Number.isFinite(seconds)||seconds<=0)return inventory;
 const elapsed=(inventory.heartElapsed||0)+seconds,cost=Math.floor(elapsed/HEART_SECONDS);
 const next=spendHearts(inventory,cost);return {...next,heartElapsed:next.hearts?elapsed%HEART_SECONDS:0};
}
