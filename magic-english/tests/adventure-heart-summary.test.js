import test from 'node:test';
import assert from 'node:assert/strict';
import {adventureHeartSummary} from '../magic-english-heart-summary.js';
import {createInventory,applyRewards} from '../block-world/inventory.js';
const reward={userId:'heart001',rewardId:'speech:one',source:'magic-english',reason:'말하기:s4_open',blocks:[{blockId:5,quantity:2}]};
test('menu counts remaining saved hearts and unclaimed rewards without counting receipts twice or changing the save',()=>{
 const stock=applyRewards(createInventory(),[reward],'heart001').inventory;stock.hearts=.5;
 const raw=JSON.stringify({inventory:stock,edits:[]});const second={...reward,rewardId:'speech:two'};
 assert.deepEqual(adventureHeartSummary(raw,[reward,second],'heart001'),{available:1.5,saved:.5,unclaimed:1});assert.equal(JSON.parse(raw).inventory.hearts,.5);
 assert.deepEqual(adventureHeartSummary(null,[reward],'heart001'),{available:1,saved:0,unclaimed:1});
 assert.deepEqual(adventureHeartSummary(raw,[],'heart001'),{available:.5,saved:.5,unclaimed:0});
 assert.throws(()=>adventureHeartSummary(raw,[{...reward,userId:'other001'}],'heart001'),/사용자/);
 assert.throws(()=>adventureHeartSummary('broken',[],'heart001'));
});
