const assert=require('node:assert/strict'),M=require('../platformer/runner-model.js');
const store=()=>{const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}};
function reach(m,index){for(let i=0;i<10000&&m.pending()!==index;i++)m.tick(.05);assert.equal(m.pending(),index);}
{
 const storage=store(),m=M.create(storage,'child-a',()=>.4);assert.ok(m.start());reach(m,0);const x=m.state.active.x;m.tick(.05);assert.equal(m.state.active.x,x);assert.equal(m.finish(),null);assert.ok(m.solve(0));assert.equal(m.state.mathWins,1);assert.equal(m.state.gems,10);assert.equal(m.state.active.rush,8);assert.equal(m.solve(0),false);const n=M.create(storage,'child-a');assert.equal(n.state.mathWins,1);assert.equal(n.solve(0),false);assert.equal(n.state.gems,10);const before=n.state.active.x;n.tick(.05);assert.ok(n.state.active.x-before>M.SPEED*.05);assert.equal(n.hit(1),'smash');assert.equal(n.collect(8),true);assert.equal(n.collect(8),false);
 reach(n,1);assert.ok(n.solve(1));assert.equal(n.state.active.magnet,12);reach(n,2);assert.ok(n.solve(2));for(let i=0;i<500;i++)n.tick(.05);const result=n.finish();assert.ok(result);assert.deepEqual(result.unlocked,['fox']);assert.equal(n.state.clears,1);assert.equal(n.finish(),null);const gems=n.state.gems;assert.equal(M.create(storage,'child-a').state.gems,gems);assert.equal(M.create(storage,'child-b').state.gems,0);assert.ok(n.equip('fox'));assert.equal(n.equip('warden'),false);assert.ok(n.start(1));reach(n,0);n.solve(0);reach(n,1);n.solve(1);assert.equal(n.state.active.magnet,17);
}
{
 const s=store();s.setItem('old-campaign','keep');s.setItem('runner','{bad');const m=M.create(s,'runner');assert.equal(m.state.clears,0);m.start();m.save();assert.equal(s.getItem('old-campaign'),'keep');assert.equal(m.equip('fox'),false);assert.equal(m.solve(2),false);
}
console.log('PASS: mandatory math gates, tangible powers, exact-once rewards/clear, companion unlocks, save/resume, isolation and old save preservation.');
