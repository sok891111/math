export const LOOT_ITEMS=Object.freeze({raw_chicken:{name:'생닭고기',emoji:'🍗',healing:1},feather:{name:'깃털',emoji:'🪶'},raw_porkchop:{name:'생돼지고기',emoji:'🥩',healing:2},rotten_flesh:{name:'썩은 살점',emoji:'🧟',healing:1},gunpowder:{name:'화약',emoji:'💥'},iron_ingot:{name:'철괴',emoji:'🔩'},carrot:{name:'당근',emoji:'🥕',healing:1},potato:{name:'감자',emoji:'🥔',healing:1}});
export function chickenDrops(random=Math.random){const drops=[{itemId:'raw_chicken',quantity:1}],feathers=Math.min(2,Math.floor(Math.max(0,random())*3));if(feathers)drops.push({itemId:'feather',quantity:feathers});return drops;}
export function collectLoot(inventory,drops){const loot={...(inventory.loot||{})};for(const drop of drops){if(!Object.hasOwn(LOOT_ITEMS,drop.itemId)||!Number.isInteger(drop.quantity)||drop.quantity<1)throw Error('드롭 아이템이 올바르지 않습니다.');loot[drop.itemId]=(loot[drop.itemId]||0)+drop.quantity;if(loot[drop.itemId]>1000000)throw Error('아이템 보관함 한도입니다.');}return {...inventory,loot};}

// Java Edition base drops: adult mobs, player kill, no Looting or fire.
export function mobDrops(type,random=Math.random){
 if(type==='chicken')return chickenDrops(random);
 const roll=()=>Math.min(.999999999,Math.max(0,random())),drops=[];
 const add=(itemId,quantity)=>{if(quantity)drops.push({itemId,quantity});};
 if(type==='pig')add('raw_porkchop',1+Math.floor(roll()*3));
 else if(type==='creeper')add('gunpowder',Math.floor(roll()*3));
 else if(type==='zombie'){add('rotten_flesh',Math.floor(roll()*3));if(roll()<.025)add(['iron_ingot','carrot','potato'][Math.floor(roll()*3)],1);}
 return drops;
}

export const heartCapacity=inventory=>Math.max(10,inventory.heartCapacity||0,inventory.hearts||0);
export function eatFood(inventory,itemId){const food=LOOT_ITEMS[itemId];if(!food?.healing||!(inventory.loot?.[itemId]>0)||!(inventory.hearts>0)||inventory.hearts>=heartCapacity(inventory))return null;return {...inventory,heartCapacity:heartCapacity(inventory),hearts:Math.min(heartCapacity(inventory),inventory.hearts+food.healing),loot:{...inventory.loot,[itemId]:inventory.loot[itemId]-1}};}
