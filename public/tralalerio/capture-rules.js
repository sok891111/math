// Escape lines retained for legacy saved animations. New capture outcomes come from math answers.
export const ESCAPE_TEXT=[
 '이런! 포켓몬이 볼에서 튀어 나와버렸다!',
 '으으! 잡았다고 생각했는데!',
 '분하다! 조금만 더하면 잡을 수 있었는데!',
 '아까워라! 이제 곧 잡을 수 있었는데!',
];

export const LEGENDARY_CAPTURE_SPECIES=['mc_enderdragon','mew','koraidon','zamazenta','eternatus','mewtwo','articuno','zapdos','moltres','raikou','entei','suicune','lugia','ho_oh','celebi'];
export const LEGENDARY_HP_MESSAGE='체력이 너무 높아 잡을 수 없어요! 공격해서 체력을 절반(50%) 미만으로 낮춘 뒤 몬스터볼을 던져 주세요.';
export function legendaryCaptureBlocked(enemy,data){return !!(enemy&&(LEGENDARY_CAPTURE_SPECIES.includes(enemy.species)||data?.species?.[enemy.species]?.legendary===true)&&enemy.hp*2>=enemy.stats.hp);}
