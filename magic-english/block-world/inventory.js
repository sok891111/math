import {LOOT_ITEMS} from './loot.js';
import {isWeapon} from './weapons.js';
import {BLOCKS} from './block-data.js';
export const MAX_BALANCE=1000000,MAX_REWARDS=2000;
export const STARTER_COUNTS=Object.freeze({});
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const validId=id=>Number.isInteger(id)&&id>0&&id<BLOCKS.length&&!BLOCKS[id].unbreakable;
const validRewardId=id=>typeof id==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:-]{0,119}$/.test(id);
export function validateUserId(id){if(typeof id!=='string'||!id.trim()||id.length>80||/[\u0000-\u001f\u007f]/.test(id))throw Error('userId는 1~80자의 사용자 코드여야 합니다.');return id.trim();}
export function normalizeReward(input){
 if(!plain(input)||!validRewardId(input.rewardId))throw Error('유효한 rewardId가 필요합니다.');const userId=validateUserId(input.userId);
 if(!Array.isArray(input.blocks)||!input.blocks.length||input.blocks.length>32)throw Error('blocks에는 1~32개의 블록을 지정하세요.');
 const counts=new Map();let total=0;for(const block of input.blocks){if(!plain(block)||!validId(block.blockId)||!Number.isInteger(block.quantity)||block.quantity<1||block.quantity>10000)throw Error('blockId와 quantity가 올바르지 않습니다.');counts.set(block.blockId,(counts.get(block.blockId)||0)+block.quantity);total+=block.quantity;}
 if(total>10000)throw Error('한 보상에서 최대 10000개까지 지급할 수 있습니다.');
 const source=input.source??'magic-english',reason=input.reason??'';if(typeof source!=='string'||source.length>80||typeof reason!=='string'||reason.length>160)throw Error('보상 설명이 너무 깁니다.');
 const items=(input.items||[]).map(item=>{if(!plain(item)||!isWeapon(item.itemId)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>100)throw Error('무기 보상이 올바르지 않습니다.');return {itemId:item.itemId,quantity:item.quantity};}).sort((a,b)=>a.itemId.localeCompare(b.itemId));
 if(items.length>4||new Set(items.map(item=>item.itemId)).size!==items.length)throw Error('무기 보상 목록이 올바르지 않습니다.');
 return {...(items.length?{items}:{}),userId,rewardId:input.rewardId,blocks:[...counts].sort((a,b)=>a[0]-b[0]).map(([blockId,quantity])=>({blockId,quantity})),source,reason};
}
export function rewardSignature(reward){return JSON.stringify({blocks:reward.blocks,source:reward.source,reason:reward.reason,...(reward.items?.length?{items:reward.items}:{})});}
export function validateInventory(value){
 if(!plain(value)||value.version!==1||!plain(value.counts)||!plain(value.placed)||!plain(value.receipts))throw Error('블록 보관함 기록이 올바르지 않습니다.');
 if(value.loot!==undefined){if(!plain(value.loot))throw Error('아이템 보관함이 올바르지 않습니다.');for(const [id,count]of Object.entries(value.loot))if(!Object.hasOwn(LOOT_ITEMS,id)||!Number.isInteger(count)||count<0||count>MAX_BALANCE)throw Error('아이템 수량이 올바르지 않습니다.');}
 if(value.weapons!==undefined){if(!plain(value.weapons))throw Error('무기 보관함이 올바르지 않습니다.');for(const [id,count]of Object.entries(value.weapons))if(!isWeapon(id)||!Number.isInteger(count)||count<0||count>MAX_BALANCE)throw Error('무기 수량이 올바르지 않습니다.');}
 for(const [key,count]of Object.entries(value.counts))if(!/^\d+$/.test(key)||String(Number(key))!==key||!validId(Number(key))||!Number.isInteger(count)||count<0||count>MAX_BALANCE)throw Error('블록 수량이 올바르지 않습니다.');
 if(Object.keys(value.placed).length>1048576)throw Error('설치 기록이 너무 큽니다.');for(const [key,id]of Object.entries(value.placed))if(!/^\d+$/.test(key)||String(Number(key))!==key||Number(key)>=1048576||!validId(id))throw Error('설치 블록 기록이 올바르지 않습니다.');
 if(Object.keys(value.receipts).length>MAX_REWARDS)throw Error('보상 영수증이 너무 많습니다.');for(const [key,signature]of Object.entries(value.receipts)){let pair;try{pair=JSON.parse(key);}catch{throw Error('보상 영수증 ID가 올바르지 않습니다.');}if(!Array.isArray(pair)||pair.length!==2||validateUserId(pair[0])!==pair[0]||!validRewardId(pair[1])||typeof signature!=='string'||signature.length>3000)throw Error('보상 영수증이 올바르지 않습니다.');}
 return value;
}
export function createInventory(saved=null,legacyEdits=[]){
 if(saved){validateInventory(saved);return {version:1,...(saved.loot?{loot:{...saved.loot}}:{}),...(saved.weapons?{weapons:{...saved.weapons}}:{}),counts:{...saved.counts},placed:{...saved.placed},receipts:{...saved.receipts}};}
 const placed={};for(const [index,id]of legacyEdits)if(validId(id))placed[index]=id;return {version:1,counts:{...STARTER_COUNTS},placed,receipts:{}};
}
export const countBlock=(inventory,id)=>inventory.counts[id]||0;
export function planInventoryEdit(inventory,index,before,after){
 if(before===after)return null;const delta={},prior=inventory.placed[index]||0;
 if(after){if(!validId(after)||countBlock(inventory,after)<1)throw Error('블록이 없어요. 마법영어 모험에서 더 받아 와요.');delta[after]=-1;}
 if(prior&&prior===before)delta[before]=(delta[before]||0)+1;
 const next={...inventory,counts:{...inventory.counts},placed:{...inventory.placed}};for(const [id,change]of Object.entries(delta)){const count=countBlock(inventory,id)+change;if(count<0||count>MAX_BALANCE)throw Error('블록 보관함 수량을 확인해 주세요.');next.counts[id]=count;}
 if(after)next.placed[index]=after;else delete next.placed[index];return {inventory:next,resource:{index,prior,after,delta}};
}
export function reverseInventoryEdit(inventory,resource){
 if(!resource)return inventory;const next={...inventory,counts:{...inventory.counts},placed:{...inventory.placed}};
 for(const [id,change]of Object.entries(resource.delta)){const count=countBlock(inventory,id)-change;if(count<0||count>MAX_BALANCE)throw Error('블록 수량 때문에 되돌릴 수 없어요.');next.counts[id]=count;}
 if(resource.prior)next.placed[resource.index]=resource.prior;else delete next.placed[resource.index];return next;
}
export function applyRewards(inventory,items,userId){
 userId=validateUserId(userId);if(!Array.isArray(items)||items.length>MAX_REWARDS)throw Error('보상 목록이 올바르지 않습니다.');let result=inventory,applied=0;
 for(const item of items){const reward=normalizeReward(item);if(reward.userId!==userId)throw Error('다른 사용자의 보상을 받을 수 없습니다.');const key=JSON.stringify([userId,reward.rewardId]),signature=rewardSignature(reward);
  if(Object.hasOwn(result.receipts,key)){
   if(result.receipts[key]===signature)continue;
   // An older open tab may have received blocks before it understood weapon fields.
   if(reward.items?.length&&result.receipts[key]===rewardSignature({...reward,items:undefined})){
    const weapons={...(result.weapons||{})};for(const {itemId,quantity}of reward.items){weapons[itemId]=(weapons[itemId]||0)+quantity;if(weapons[itemId]>MAX_BALANCE)throw Error('무기 보관함 한도에 도달했습니다.');}
    result={...result,weapons,receipts:{...result.receipts,[key]:signature}};applied++;continue;
   }
   throw Error('같은 보상 ID의 내용이 다릅니다.');
  }
  if(Object.keys(result.receipts).length>=MAX_REWARDS)throw Error('보상 영수증 한도에 도달했습니다.');const counts={...result.counts};for(const {blockId,quantity}of reward.blocks){const total=(counts[blockId]||0)+quantity;if(total>MAX_BALANCE)throw Error('블록 보관함 한도를 초과합니다.');counts[blockId]=total;}
  const weapons={...(result.weapons||{})};for(const {itemId,quantity}of reward.items||[]){weapons[itemId]=(weapons[itemId]||0)+quantity;if(weapons[itemId]>MAX_BALANCE)throw Error('무기 보관함 한도에 도달했습니다.');}
  result={...result,...(Object.keys(weapons).length?{weapons}:{}),counts,receipts:{...result.receipts,[key]:signature}};applied++;
 }return {inventory:result,applied};
}
