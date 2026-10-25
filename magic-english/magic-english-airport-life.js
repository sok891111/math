// Short, bounded walks for visitors; functional NPCs and doors stay in place.
const STAGE2_RESERVED_TILES = new Set([
  '4,4', '10,6', '15,4', '10,3', '10,12', '3,12', '5,9', '7,9',
  '4,5', '9,5', '14,5', '14,10', '16,10', '15,9',
]);

export class AirportLife {
  constructor(random=Math.random){this.random=random;this.positions=new Map();this.nextAt=0;}
  objects(objects){return objects.map(o=>({...o,...(this.positions.get(o.id)||{})}));}
  update(now,{paused,objects,collision,player,follower}){
    if(paused){this.nextAt=now+900;return;}
    if(now<this.nextAt)return;
    this.nextAt=now+1200+this.random()*800;
    const roamingIds=[
      'npc_traveler','npc_pilot','npc_kid_traveler','npc_cafe','npc_guard',
      's3_hall_student','s3_class_student','s3_yard_student','s3_coco',
      's2_nono','s2_ungeori','s2_copycat','s2_commuter','s2_student',
    ];
    const roamers=objects.filter(o=>roamingIds.includes(o.id));
    const actual=this.objects(objects);
    const dirs=[['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]];
    const facing=dirs.find(([direction])=>direction===player.facing);
    for(const home of roamers){
      const pos=this.positions.get(home.id)||{x:home.x,y:home.y,direction:home.direction||'down'};
      // Only the person directly being approached for a conversation waits.
      // Nearby passers-by keep walking, even when the child stands still.
      if(facing&&pos.x===player.x+facing[1]&&pos.y===player.y+facing[2])continue;
      const isStage2=home.id.startsWith('s2_');
      const candidates=dirs.filter(([,dx,dy])=>{
        const x=pos.x+dx,y=pos.y+dy;
        const radius=isStage2||home.id==='npc_cafe'||home.id==='npc_guard'?1:2;
        if(Math.abs(x-home.x)>radius||Math.abs(y-home.y)>1||collision[y]?.[x]!=='FLOOR')return false;
        if(actual.some(o=>o.id!==home.id&&o.x===x&&o.y===y))return false;
        if(player.x===x&&player.y===y||follower?.x===x&&follower?.y===y)return false;
        if(home.id.startsWith('s3_'))return !objects.some(o=>o.id!==home.id&&Math.abs(o.x-x)+Math.abs(o.y-y)<=1)&&!(x>=15||y<=3||y>=12);
        if(isStage2)return !STAGE2_RESERVED_TILES.has(x+','+y);
        // Reserve the exit, locked room and information-desk approach.
        return !(y<=2&&x>=8||x>=13&&y<=8);
      });
      if(!candidates.length)continue;
      const [direction,dx,dy]=candidates[Math.floor(this.random()*candidates.length)];
      const x=pos.x+dx,y=pos.y+dy;
      this.positions.set(home.id,{x,y,direction,fromX:pos.x,fromY:pos.y,movedAt:now});
      const item=actual.find(o=>o.id===home.id);Object.assign(item,{x,y});
    }
  }

  sample(actor,now){const pos=this.positions.get(actor.id);if(!pos)return actor;const progress=Math.min(1,(now-pos.movedAt)/520);return {...actor,x:pos.fromX+(pos.x-pos.fromX)*progress,y:pos.fromY+(pos.y-pos.fromY)*progress,walking:progress<1,progress};}
}
export const OPTIONAL_NPC_PRAISE={
 npc_traveler:[['You made a new friend!','네 이야기를 듣고 여행객이 안심했어.'],['Nice to meet you, too!','먼저 인사하니까 친구가 생겼네.']],
 npc_pilot:[['A friendly hello!','네 인사에 기장님도 반갑게 웃으시네.'],['Ready for the journey!','영어로 인사하며 여행을 시작했네.']],
 npc_guard:[['Now he knows your name!','이제 안내원이 네 이름을 알게 됐어.'],['Hello, Gildong!','직접 네 이름을 소개했네.']],
 npc_cafe:[['An apple for you!','원하는 걸 직접 말해서 주문했네.'],['Here you go!','네 부탁이 점원에게 전해졌어.']],
 npc_kid_traveler:[['A gift and a new friend!','고맙다는 마음을 전했네.'],['You made her smile!','네 인사를 듣고 친구가 웃고 있어.']],
};
