import {SPEECH_BLOCK_POOL} from './speech-rewards.js';
// Keep owned reward blocks in the five touch-accessible building slots.
export function rewardHotbar(bar,inventory){const next=[...bar];for(const id of SPEECH_BLOCK_POOL){if(!(inventory.counts[id]>0)||next.slice(0,5).includes(id))continue;let index=next.slice(0,5).findIndex(block=>!(inventory.counts[block]>0));if(index<0)index=next.slice(0,5).findIndex(block=>!SPEECH_BLOCK_POOL.includes(block));if(index>=0)next[index]=id;}return next;}
