import {createInventory,applyRewards} from './block-world/inventory.js';
import {heartCount} from './block-world/hearts.js';
// Calculate on a copy. Reading the balance must never redeem rewards or rewrite a world.
export function adventureHeartSummary(rawWorld,rewards,userId){
 const world=rawWorld?JSON.parse(rawWorld):null;
 const inventory=createInventory(world?.inventory||null,world?.edits||[]);
 const result=applyRewards(inventory,rewards,userId);
 return {available:heartCount(result.inventory),saved:heartCount(inventory),unclaimed:heartCount(result.inventory)-heartCount(inventory)};
}
