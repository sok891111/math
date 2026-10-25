export const WEAPONS=Object.freeze({
 wood_sword:{name:'나무 검',damage:2,color:'#ad8051',weight:45},
 stone_sword:{name:'돌 검',damage:3,color:'#939da5',weight:30},
 iron_sword:{name:'철 검',damage:4,color:'#e5edf0',weight:20},
 diamond_sword:{name:'다이아몬드 검',damage:6,color:'#49d9d2',weight:5},
});
export const isWeapon=id=>Object.hasOwn(WEAPONS,id);
export function weaponReward(quality,roll){if(quality!=='complete')return null;let value=Math.max(0,Math.min(99,Math.floor(roll)));for(const [itemId,weapon]of Object.entries(WEAPONS)){if(value<weapon.weight)return {itemId,quantity:1};value-=weapon.weight;}return null;}
export function validEquipment(tool,inventory){return tool==='stick'||tool===null||isWeapon(tool)&&(inventory?.weapons?.[tool]||0)>0;}
