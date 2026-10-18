const fs=require('node:fs'),path=require('node:path');
function applyPolicy(data,policy){
 const rare=new Set(policy.rareSpecies);for(const id of rare)if(!data.species[id])throw Error('Unknown rare monster: '+id);
 const featured=new Map((policy.featuredSpecies||[]).map(s=>[s.id,s]));
 for(const [id,s] of featured)if(!data.species[id]||rare.has(id)||!Number.isInteger(s.weight)||s.weight<0||!Array.isArray(s.maps)||s.maps.some(map=>!data.encounters[map]))throw Error('Invalid featured monster: '+id);
 for(const [map,table] of Object.entries(data.encounters)){
  const slots=table.day,mc=slots.map((mon,i)=>({mon,i})).filter(({mon})=>mon.species.startsWith('mc_'));
  if(slots.length!==9+mc.length||mc.length<24)throw Error('Expected 7 Gold + 2 additional Pokemon + Minecraft slots');
  for(const period of ['morning','day','night'])if(table[period].some((mon,i)=>i>=7&&mon.species!==slots[i].species)||table[period].length!==slots.length)throw Error('Encounter slot order mismatch');
  const weights=[870,870,580,290,145,116,29,50,50,...mc.map(({mon})=>rare.has(mon.species)?policy.rareEncounterWeight:featured.get(mon.species)?.maps.includes(map)?featured.get(mon.species).weight:0)];
  const common=mc.filter(({mon})=>!rare.has(mon.species)&&!featured.has(mon.species)),remaining=policy.totalEncounterWeight*policy.minecraftShare-weights.slice(9).reduce((sum,n)=>sum+n,0);
  if(remaining<0||!common.length)throw Error('Featured monsters exceed Minecraft encounter budget');
  for(let i=0;i<common.length;i++)weights[common[i].i]=Math.floor(remaining/common.length)+(i<remaining%common.length?1:0);
  if(weights.reduce((a,b)=>a+b,0)!==policy.totalEncounterWeight||weights.slice(9).reduce((a,b)=>a+b,0)!==policy.totalEncounterWeight*policy.minecraftShare)throw Error('Encounter weights must preserve Pokemon 60 / Minecraft 40');
  table.weights=weights;
  for(const period of ['morning','day','night'])for(const mon of table[period])if(rare.has(mon.species))mon.level=Math.max(policy.rareMinLevel,mon.level);
 }
 data.challengePolicy=policy;return data;
}
module.exports=applyPolicy;
if(require.main===module){
 const assets=path.resolve(__dirname,'../assets'),policy=JSON.parse(fs.readFileSync(path.join(assets,'challenge-policy.json'))),file=path.join(assets,'battle-data.json'),data=JSON.parse(fs.readFileSync(file));
 fs.writeFileSync(file,JSON.stringify(applyPolicy(data,policy)));console.log('Applied Pokemon 60 / Minecraft 40, rare monsters 1% each and level 10 minimum.');
}
