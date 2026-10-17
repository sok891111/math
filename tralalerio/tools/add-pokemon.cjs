// Checked-in metadata/sprites keep builds and offline play independent of external APIs.
const fs=require('node:fs'),path=require('node:path');
function addPokemon(data,extra){Object.assign(data.species,extra.species);Object.assign(data.moves,extra.moves);for(const table of Object.values(data.encounters))for(const period of ['morning','day','night']){table[period]=table[period].filter(p=>!Object.hasOwn(extra.species,p.species));table[period].splice(7,0,...Object.keys(extra.species).map(species=>({species,level:10})));}return data;}
module.exports=addPokemon;
if(require.main===module){const a=path.resolve(__dirname,'../assets'),f=path.join(a,'battle-data.json');fs.writeFileSync(f,JSON.stringify(addPokemon(JSON.parse(fs.readFileSync(f)),JSON.parse(fs.readFileSync(path.join(a,'additional-pokemon.json'))))));}
