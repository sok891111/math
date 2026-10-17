export const MATH_REWARDS=[
 '수학 문제를 풀어 강력한 공격에 성공했다!',
 '정답의 힘이 전해졌다! 강력한 공격에 성공했다!',
 '수학 문제를 해결한 힘으로 강력한 공격에 성공했다!',
 '차근차근 구한 정답이 힘이 됐다! 강력한 공격에 성공했다!',
 '수학의 힘이 폭발했다! 강력한 공격에 성공했다!',
 '문제를 풀어 모은 힘으로 강력한 공격에 성공했다!',
 '멋지게 찾은 정답이 공격을 강화했다! 강력한 공격에 성공했다!',
 '문제 해결의 힘이 빛났다! 강력한 공격에 성공했다!',
];
export function mathRewardIndex(seed=0,last){const index=(seed>>>0)%MATH_REWARDS.length;return index===last?(index+1)%MATH_REWARDS.length:index;}
// Includes the previous message so in-flight saved animations retain their pause.
export function isMathReward(text){return text==='강력한 공격에 성공했다!'||MATH_REWARDS.includes(text);}

export function captureReward(name){const last=name.charCodeAt(name.length-1),particle=last>=44032&&last<=55203&&(last-44032)%28?'을':'를';return `수학 문제를 풀어서 ${name}${particle} 잡았다!`;}
export function isCaptureReward(text){return /^수학 문제를 풀어서 .+[을를] 잡았다!$/.test(text);}

export const CAPTURE_MATH_FAILURE='수학 문제를 풀지 못해 잡지 못했다. 다음에는 꼭 풀어보자!';
