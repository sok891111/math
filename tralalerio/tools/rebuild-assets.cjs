// Run the inherited builders, then reapply Minecraft additions before publishing assets.
const {spawnSync}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
function run(command,args){const result=spawnSync(command,args,{cwd:root,stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1)}
for(const file of ['build_assets.py','build_battle_assets.py','build_animation_assets.py','build_transition_assets.py','build_capture_assets.py','build_healing_assets.py','build_trainer_assets.py'])run('python3',[path.join(__dirname,file),...process.argv.slice(2)]);
run(process.execPath,[path.join(__dirname,'build-minecraft.cjs')]);
run('python3',[path.join(__dirname,'build_first_badge.py'),...process.argv.slice(2)]);
run(process.execPath,[path.join(__dirname,'add-pokemon.cjs')]);
run(process.execPath,[path.join(__dirname,'add-minecraft.cjs')]);
run(process.execPath,[path.join(__dirname,'apply-challenge-policy.cjs')]);
run('python3',[path.join(__dirname,'build_dex_assets.py'),...process.argv.slice(2)]);
run(process.execPath,[path.join(root,'scripts/sync-public.cjs')]);
