// Display actual HP loss after the existing battle formula has resolved.
export function hpLossMessage(name,before,after){return `${name}의 체력: ${before} - ${before-after} = ${after}. 현재 체력이 ${after} 남았다!`;}
export function isHpLossMessage(text){return /^.+의 체력: \d+ - \d+ = \d+\. 현재 체력이 \d+ 남았다!$/.test(text);}
