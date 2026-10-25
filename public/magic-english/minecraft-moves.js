// Shared by the data builder and Canvas renderer. Signature attacks are available
// from level 1 so every grass encounter and captured companion can use them.
const skill=(kind,name,type,profile,power=35,effect='NORMAL_HIT',chance=0,color='#b98ce8')=>({
 id:'MC_'+kind.toUpperCase(),kind,name,type,profile,power,effect,chance,color,accuracy:100,pp:25,
});
export const MINECRAFT_MOVES={
 megaply:skill('megaply','메가 윈드','FLYING','wind',35,'NORMAL_HIT',0,'#96dfff'),
 giantfly:skill('giantfly','거대 폭풍','FLYING','storm',35,'NORMAL_HIT',0,'#79d9ff'),
 gaddoongi:skill('gaddoongi','네 갈래 물대포','WATER','water-cannons',35,'NORMAL_HIT',0,'#74d8f4'),
 blaze:skill('blaze','블레이즈 화염구','FIRE','fireball',30,'BURN_HIT',10,'#ffc34e'),
 irongolem:skill('irongolem','철 골렘 강타','STEEL','punch',35,'NORMAL_HIT',0,'#d2d6bd'),
 snowgolem:skill('snowgolem','눈덩이 던지기','ICE','bullet',30,'NORMAL_HIT',0,'#dceef5'),
 wolf:skill('wolf','늑대 덮치기','NORMAL','pounce',35,'NORMAL_HIT',0,'#cbd0c3'),
 wither:skill('wither','위더 해골탄','DARK','skull',35,'NORMAL_HIT',0,'#788296'),
 elderguardian:skill('elderguardian','가디언 레이저','WATER','beam',35,'NORMAL_HIT',0,'#70d7cd'),
 evoker:skill('evoker','송곳니 소환','PSYCHIC_TYPE','fangs',35,'NORMAL_HIT',0,'#c3a86c'),
 ravager:skill('ravager','파괴수 돌진','NORMAL','ram',35,'NORMAL_HIT',0,'#b7b0a1'),
 piglinbrute:skill('piglinbrute','황금 도끼찍기','NORMAL','axe',35,'NORMAL_HIT',0,'#f5cf65'),
 breeze:skill('breeze','윈드 차지','FLYING','wind',35,'NORMAL_HIT',0,'#b9f2ef'),
 shulker:skill('shulker','셜커 유도탄','PSYCHIC_TYPE','bullet',30,'CONFUSE_HIT',10,'#d1b3f3'),
 endermite:skill('endermite','엔더 파고들기','BUG','burrow',35,'NORMAL_HIT',0,'#b397cc'),
 enderknight:skill('enderknight','소드 베기','NORMAL','sword',40,'NORMAL_HIT',0,'#bfebee'),
 enderdragon:skill('enderdragon','드래곤 브레스','DRAGON','breath',40,'NORMAL_HIT',0,'#c77df0'),
 warden:skill('warden','소닉 붐','NORMAL','sonic',35,'NORMAL_HIT',0,'#77e9e4'),
 chicken:skill('chicken','부리 콕콕','FLYING','peck',30,'NORMAL_HIT',0,'#ffe3a3'),
 pig:skill('pig','네모 코 돌진','NORMAL','charge',35,'NORMAL_HIT',0,'#f3abbc'),
 rabbit:skill('rabbit','깡충 발차기','NORMAL','kick',35,'NORMAL_HIT',0,'#f3e1bc'),
 fox:skill('fox','여우 덮치기','NORMAL','pounce',35,'NORMAL_HIT',0,'#eda660'),
 zombie:skill('zombie','좀비 펀치','NORMAL','punch',35,'NORMAL_HIT',0,'#a3c67b'),
 creeper:skill('creeper','크리퍼 블록폭발','NORMAL','blast',35,'NORMAL_HIT',0,'#a9d778'),
 slime:skill('slime','슬라임 바운스','NORMAL','bounce',35,'NORMAL_HIT',0,'#b9e47f'),
 skeleton:skill('skeleton','스켈레톤 화살','NORMAL','arrow',35,'NORMAL_HIT',0,'#e2dcc2'),
 spider:skill('spider','거미줄 덫','BUG','web',30,'SPEED_DOWN_HIT',20,'#deddd2'),
 witch:skill('witch','독 물약 투척','POISON','potion',30,'POISON_HIT',10,'#b482da'),
 enderman:skill('enderman','순간이동 타격','DARK','teleport',35,'NORMAL_HIT',0,'#d29af2'),
 magma:skill('magma','마그마 점프','FIRE','magma',30,'BURN_HIT',10,'#f9aa4d'),
 ghast:skill('ghast','가스트 화염구','FIRE','fireball',30,'BURN_HIT',10,'#ffb16b'),
};
export const MINECRAFT_MOVE_BY_ID=Object.fromEntries(Object.values(MINECRAFT_MOVES).map(m=>[m.id,m]));
