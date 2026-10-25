// Regression-only fixture: old broad UI tests need every block to remain selectable.
async function installTestRewards(page){
 await page.route('**/api/block-world/rewards?*',async route=>{const userId=new URL(route.request().url()).searchParams.get('userId');await route.fulfill({json:{version:1,userId,rewards:[{userId,rewardId:'browser-fixture',source:'test',reason:'UI regression stock',blocks:Array.from({length:31},(_,i)=>({blockId:i+1,quantity:100}))}]}});});
}
module.exports={installTestRewards};
