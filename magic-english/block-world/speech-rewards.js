import {BLOCKS} from './block-data.js';
import {weaponReward} from './weapons.js';
export const SPEECH_REWARD_VERSION=3;
export const WEAPON_DROP_PERCENT=20;
export const SPEECH_BLOCK_POOL=Object.freeze([1,2,3,5,6]);
const LEGACY_SPEECH_BLOCK_POOL=Object.freeze(BLOCKS.flatMap((b,id)=>b&&!b.unbreakable&&!b.liquid?[id]:[]));
export function speechWeapon(quality,dropRoll,tierRoll){return quality==='complete'&&Number.isInteger(dropRoll)&&dropRoll>=0&&dropRoll<WEAPON_DROP_PERCENT?weaponReward(quality,tierRoll):null;}
export function speechBlocks(quantity,roll,version=SPEECH_REWARD_VERSION){if(!Number.isInteger(quantity)||quantity<1||quantity>2||!Number.isInteger(roll)||roll<0)throw Error('대화 블록 보상이 올바르지 않습니다.');const pool=version===2?LEGACY_SPEECH_BLOCK_POOL:SPEECH_BLOCK_POOL;return [{blockId:pool[roll%pool.length],quantity}];}
