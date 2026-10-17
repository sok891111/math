// A level-3 wild win pays 60; level 10 pays 200. Capture/run/loss never pays.
export const wildVictoryMoney=level=>Math.max(40,Math.floor(level)*20);
export function awardWildVictory(state){const b=state.battle;if(!b||b.result!=='won'||b.trainer||b.wildPrize!==undefined)return 0;const amount=wildVictoryMoney(b.enemy.level);b.wildPrize=amount;state.money+=amount;b.logs.push(`야생 몬스터와의 대결에서 이겼다! 상금 ${amount}원을 받았다!`);return amount;}
