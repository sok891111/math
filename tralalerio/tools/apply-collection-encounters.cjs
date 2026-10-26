// Keep existing slot weights/levels and special encounters; replace ordinary species at runtime.
const fs=require('node:fs'),path=require('node:path');
function applyCollectionEncounters(data,dex){
 const entries=dex.entries.filter(e=>e.kind==='pokemon'&&e.national>=10&&e.national<=100).sort((a,b)=>a.national-b.national);
 if(entries.length!==91||entries.some((e,i)=>e.national!==10+i||!data.species[e.id]))throw Error('Collection requires all National Dex 10–100 species');
 for(const table of Object.values(data.encounters))table.collectionSpecies=entries.map(e=>e.id);
 data.collectionEncounters={version:1,numbering:'national',first:10,last:100,slots:7};
 return data;
}
module.exports=applyCollectionEncounters;
if(require.main===module){const dir=path.resolve(__dirname,'../assets'),file=path.join(dir,'battle-data.json');fs.writeFileSync(file,JSON.stringify(applyCollectionEncounters(JSON.parse(fs.readFileSync(file)),JSON.parse(fs.readFileSync(path.join(dir,'monster-dex.json'))))));console.log('Enabled National Dex 10–100 collection encounters in all wild habitats.');}
