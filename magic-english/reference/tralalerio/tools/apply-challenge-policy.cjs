const fs=require('node:fs'),path=require('node:path');
function applyPolicy(data,policy){
 const rare=new Set(policy.rareSpecies);for(const id of rare)if(!data.species[id])throw Error('Unknown rare monster: '+id);
 const legendary=new Set(policy.legendarySpecies||[]);for(const id of legendary){if(!data.species[id])throw Error('Unknown legendary: '+id);data.species[id].legendary=true;data.species[id].boss=true;}if(data.species.koraidon)data.species.koraidon.name='코라이돈';
 const featured=new Map((policy.featuredSpecies||[]).map(s=>[s.id,s]));
 for(const [id,s] of featured)if(!data.species[id]||rare.has(id)||!Number.isInteger(s.weight)||s.weight<0||!Array.isArray(s.maps)||s.maps.some(map=>!data.encounters[map]))throw Error('Invalid featured monster: '+id);
 for(const [map,table] of Object.entries(data.encounters)){
  const slots=table.day,mc=slots.map((mon,i)=>({mon,i})).filter(({mon})=>mon.species.startsWith('mc_'));
  const extras=slots.map((mon,i)=>({mon,i})).filter(({mon,i})=>i>=7&&!mon.species.startsWith('mc_'));
  if(slots.length!==7+extras.length+mc.length||mc.length<24)throw Error('Expected 7 Gold slots, additional Pokemon and Minecraft slots');
  for(const period of ['morning','day','night'])if(table[period].some((mon,i)=>i>=7&&mon.species!==slots[i].species)||table[period].length!==slots.length)throw Error('Encounter slot order mismatch');
  const pokemonRareWeight=policy.legendaryEncounterWeight??50,originalTotal=policy.totalEncounterWeight*policy.pokemonShare-extras.length*pokemonRareWeight;
  const weights=Array(slots.length).fill(0);[30,30,20,10,5,4,1].forEach((w,i)=>weights[i]=w*originalTotal/100);
  for(const {i} of extras)weights[i]=pokemonRareWeight;
  for(const {mon,i} of mc)weights[i]=legendary.has(mon.species)?policy.legendaryEncounterWeight:rare.has(mon.species)?policy.rareEncounterWeight:featured.get(mon.species)?.maps.includes(map)?featured.get(mon.species).weight:0;
  const common=mc.filter(({mon})=>!rare.has(mon.species)&&!legendary.has(mon.species)&&!featured.has(mon.species)),remaining=policy.totalEncounterWeight*policy.minecraftShare-mc.reduce((sum,{i})=>sum+weights[i],0);
  if(remaining<0||!common.length)throw Error('Featured monsters exceed Minecraft encounter budget');
  for(let i=0;i<common.length;i++)weights[common[i].i]=Math.floor(remaining/common.length)+(i<remaining%common.length?1:0);
  if(weights.reduce((a,b)=>a+b,0)!==policy.totalEncounterWeight||mc.reduce((sum,{i})=>sum+weights[i],0)!==policy.totalEncounterWeight*policy.minecraftShare)throw Error('Encounter weights must preserve Pokemon 60 / Minecraft 40');
  if(weights.some(w=>!Number.isInteger(w)||w<0))throw Error('Encounter weights must be nonnegative integers');
  for(const id of legendary)for(const period of ['morning','day','night'])if(table[period].filter(p=>p.species===id).length!==1)throw Error('Expected exactly one legendary slot: '+id);
  table.weights=weights;
  for(const period of ['morning','day','night'])for(const mon of table[period])if(rare.has(mon.species)&&!legendary.has(mon.species))mon.level=Math.max(policy.rareMinLevel,mon.level);
  if(legendary.size){let weightedLevels=0,totalWeight=0;for(const period of ['morning','day','night'])table[period].forEach((mon,i)=>{if(!legendary.has(mon.species)){weightedLevels+=mon.level*weights[i];totalWeight+=weights[i];}});if(!totalWeight)throw Error('Missing ordinary encounter population');table.legendaryBaseLevel=weightedLevels/totalWeight;table.legendaryLevel=Math.min(100,Math.round(table.legendaryBaseLevel)+policy.legendaryLevelOffset);for(const period of ['morning','day','night'])for(const mon of table[period])if(legendary.has(mon.species))mon.level=table.legendaryLevel;}
 }
 data.challengePolicy=policy;return data;
}
module.exports=applyPolicy;
if(require.main===module){
 const assets=path.resolve(__dirname,'../assets'),policy=JSON.parse(fs.readFileSync(path.join(assets,'challenge-policy.json'))),file=path.join(assets,'battle-data.json'),data=JSON.parse(fs.readFileSync(file));
 fs.writeFileSync(file,JSON.stringify(applyPolicy(data,policy)));console.log('Applied Pokemon 60 / Minecraft 40, five legendary monsters 0.5% each, map weighted mean +10, and unchanged Wither 1%.');
}
