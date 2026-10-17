const fs=require('node:fs'),path=require('node:path');
function applyPolicy(data,policy){
const rare=new Set(policy.rareSpecies);for(const id of rare)if(!data.species[id])throw Error('Unknown rare monster: '+id);
for(const table of Object.values(data.encounters)){
 const slots=table.day,mc=slots.map((mon,i)=>({mon,i})).filter(({mon})=>mon.species.startsWith('mc_'));
 if(mc.length!==24||slots.length!==33)throw Error('Expected 7 Gold + 2 additional Pokemon + 24 Minecraft slots');
 const weights=[570,570,380,190,95,76,19,50,50,...mc.map(({mon},i)=>rare.has(mon.species)?policy.rareEncounterWeight:i<12?15:10)];
 let remainder=300-weights.slice(9).reduce((a,b)=>a+b,0);const common=mc.filter(({mon})=>!rare.has(mon.species));
 for(let i=0;remainder>0;i++,remainder--)weights[common[i%common.length].i]++;
 for(let i=9;i<weights.length;i++)weights[i]*=10;
 if(weights.reduce((a,b)=>a+b,0)!==policy.totalEncounterWeight)throw Error('Encounter weights must preserve 60/40');
 table.weights=weights;
 for(const period of ['morning','day','night'])for(const mon of table[period])if(rare.has(mon.species))mon.level=Math.max(policy.rareMinLevel,mon.level);
}
data.challengePolicy=policy;return data;
}
module.exports=applyPolicy;
if(require.main===module){
 const assets=path.resolve(__dirname,'../assets'),policy=JSON.parse(fs.readFileSync(path.join(assets,'challenge-policy.json'))),file=path.join(assets,'battle-data.json'),data=JSON.parse(fs.readFileSync(file));
 fs.writeFileSync(file,JSON.stringify(applyPolicy(data,policy)));
 console.log('Applied middle/hard math policy, rare level-10 monsters and 1% encounter slots.');
}
