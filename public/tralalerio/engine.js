import {initializePC,validPC} from './pc.js?v=20261017-pc1';
import {initializeMonsterDex,validMonsterDex,validDexIntro,recordCaught} from './monster-dex.js?v=20261017-pc1';
import {validPhoneCall} from './phone-call.js?v=20261017-pc1';
import {trainerEncounterPlan,validTrainerEncounter} from './trainer-encounter.js?v=20261017-rival1';
import {Battle,createPokemon,pickEncounter,validPokemon,validateBattle,byte,periodFor} from './battle.js?v=20261017-pc1';
export const DIRECTIONS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
const WALKABLE=/^(FLOOR|TALL_GRASS|LADDER|STAIRCASE|DOOR|WARP_CARPET|CAVE|ENTRANCE|HOP_|00)/;
export class Game {
 constructor(maps,battleData=null,options={}){this.maps=maps;this.battleData=battleData;this.rng=options.random||Math.random;this.now=options.now||(()=>new Date());this.state={version:1,map:'PlayersHouse2F',x:3,y:4,facing:'down',flags:{},starter:null,steps:0,money:3000,potions:0};this.lock=null;this.lastEvent=null;if(battleData)this.initializeParty();}
 startAdventure(){if(this.state.starter)return false;this.chooseStarter('피카츄');this.enter(this.maps.ElmsLab,4,6);this.state.facing='down';this.state.flags.easyStart=true;return true;}
 get map(){return this.maps[this.state.map]}
 objects(){const id=this.state.map;return this.map.objects.filter(o=>{
 if(id==='PlayersHouse2F')return false;
 if(id==='PlayersHouse1F')return o.x===7&&o.y===3&&o.flag==='EVENT_PLAYERS_HOUSE_MOM_1';
 if(id==='ElmsLab'&&o.sprite==='officer'&&(!this.state.flags.labTheft||this.state.flags.eggDelivered))return false;
 if(id==='ElmsLab'&&o.sprite==='poke_ball'&&this.state.starter)return false;
 if(o.kind==='OBJECTTYPE_ITEMBALL'&&this.state.flags['item:'+id+':'+o.script])return false;
 if(id==='Route30'&&['EVENT_ROUTE_30_BATTLE'].includes(o.flag)&&this.state.flags.eggDelivered)return false;
 if(id==='Route30'&&o.script==='TrainerYoungsterJoey'&&!this.state.flags.eggDelivered)return false;
 if(id==='MrPokemonsHouse'&&o.sprite==='oak'&&this.state.flags.pokedex)return false;
 if(id==='SproutTower3F'&&o.sprite==='rival')return false;
 if(id==='VioletPokecenter1F'&&o.sprite==='scientist'&&!this.state.flags.zephyr)return false;
 if(id==='Route29'&&o.script==='TuscanyScript')return false;
 if(id==='Route29'&&o.script==='Route29Potion'&&this.state.flags.routePotion)return false;
 if(id==='CherrygroveCity'&&o.sprite==='rival')return false;
 if(id==='CherrygroveCity'&&o.sprite==='gramps'&&this.state.flags.mapCard)return false;
 if(id==='GuideGentsHouse'&&!this.state.flags.mapCard)return false;
 return true;
 });}
 passable(x,y,ignoreObjects=false){if(x<0||y<0||x>=this.map.width||y>=this.map.height)return false;
 if(!ignoreObjects&&this.objects().some(o=>o.x===x&&o.y===y))return false;
 if(this.map.warps.some(w=>w.x===x&&w.y===y))return true;
 return WALKABLE.test(this.map.collision[y]?.[x]||'WALL');}
 enter(map,x,y){this.state.map=map.id;this.state.x=x;this.state.y=y;this.lock=`${map.id}:${x}:${y}`;if(map.id==='NewBarkTown')this.state.flags.town=true;if(map.id==='Route29')this.state.flags.route=true;if(map.id==='CherrygroveCity')this.state.flags.city=true;if(map.id==='VioletCity')this.state.flags.violet=true;return {type:'warp',map:map.id};}
 move(direction){if(this.state.phoneCall)return {type:'phone-call-active'};if(this.state.trainerEncounter)return {type:'trainer-encounter-active'};if(this.state.healing)return {type:'healing'};if(this.state.battle)return {type:'battle-active'};const d=DIRECTIONS[direction];if(!d)return {type:'invalid'};this.state.facing=direction;
 let x=this.state.x+d[0],y=this.state.y+d[1];const edge=x<0?'west':x>=this.map.width?'east':y<0?'north':y>=this.map.height?'south':null;
 if(edge){const c=this.map.connections?.find(c=>c.direction===edge),dest=c&&this.maps[c.map];if(!dest)return {type:'boundary'};
 if(this.state.map==='NewBarkTown'&&dest.id==='Route29'&&!this.state.starter)return {type:'partner-required'};
 let nx=x,ny=y;if(edge==='west'){nx=dest.width-1;ny=y-c.offset*2}else if(edge==='east'){nx=0;ny=y-c.offset*2}else if(edge==='north'){ny=dest.height-1;nx=x-c.offset*2}else{ny=0;nx=x-c.offset*2}
 const old=this.state.map;this.state.map=dest.id;const valid=this.passable(nx,ny);this.state.map=old;if(!valid)return {type:'blocked'};this.state.steps++;return this.enter(dest,nx,ny);}
 const current=this.map.collision[this.state.y]?.[this.state.x],destination=this.map.collision[y]?.[x];const ledge=current?.startsWith('HOP_')&&current.slice(4).split('_').includes(direction.toUpperCase())?current:destination;if(ledge?.startsWith('HOP_')){if(!ledge.slice(4).split('_').includes(direction.toUpperCase())){const opposite={up:'DOWN',down:'UP',left:'RIGHT',right:'LEFT'}[direction];if(ledge.includes(opposite)||!this.passable(x,y))return {type:'blocked'};}else{x+=d[0];y+=d[1];if(this.map.collision[y]?.[x]==='WALL'){x+=d[0];y+=d[1];}if(!this.passable(x,y))return {type:'blocked'};}}else if(!this.passable(x,y))return {type:'blocked'};
 const warp=this.map.warps.find(w=>w.x===x&&w.y===y);if(warp&&!Object.values(this.maps).some(m=>m.constant===warp.map))return {type:'boundary'};
 this.state.x=x;this.state.y=y;this.state.steps++;let result={type:'step'};
 if(this.lock!==`${this.state.map}:${x}:${y}`&&warp){const destination=Object.values(this.maps).find(m=>m.constant===warp.map);const target=destination?.warps[warp.index-1];if(target)result=this.enter(destination,target.x,target.y);
 }else if(!warp)this.lock=null;if(result.type==='step'){const trainer=this.trainerInSight();if(trainer){this.state.trainerEncounter=trainerEncounterPlan(this,trainer);return {type:'trainer-spotted',trainer:trainer.trainer};}}if(result.type==='step'&&this.battleData){const table=this.battleData.encounters[this.state.map],tile=this.map.collision[this.state.y]?.[this.state.x],hour=this.now().getHours();if(table&&(tile==='TALL_GRASS'||table.terrain==='floor'&&tile==='FLOOR')){if(this.state.grassGrace>0)this.state.grassGrace--;else if(this.state.party.some(p=>p.hp>0)&&byte(this.rng)<(table.rates?.[periodFor(hour)]??table.rateByte)){const wild=pickEncounter(table,hour,this.rng);this.startEncounter(wild.species,wild.level);result={type:'encounter'};}}}this.lastEvent=result;return result;}
 target(){const d=DIRECTIONS[this.state.facing];const x=this.state.x+d[0],y=this.state.y+d[1];const find=(x,y)=>this.objects().find(o=>o.x===x&&o.y===y)||this.map.signs.find(o=>o.x===x&&o.y===y);return (this.map.collision[y]?.[x]==='PC'?{x,y,pc:true}:null)||find(x,y)||(this.map.collision[y]?.[x]==='COUNTER'?find(x+d[0],y+d[1]):null);}
 chooseStarter(name){if(this.state.starter||!['치코리타','브케인','리아코','피카츄'].includes(name))return false;this.state.starter=name;this.state.flags.starter=true;if(this.battleData)this.initializeParty();return true;}
 tradeOnix(){if(this.state.battle||this.state.flags.onixTrade||!this.battleData?.species.onix)return false;const index=this.state.party.findIndex(p=>p.species==='bellsprout');if(index<0)return false;this.state.party[index]=createPokemon(this.battleData,'onix',this.state.party[index].level,this.rng);this.state.flags.onixTrade=true;recordCaught(this.state,'bellsprout');recordCaught(this.state,'onix');return true;}
 buyPotion(){if(this.state.money<300)return false;this.state.money-=300;this.state.potions++;return true;}
 initializeParty(){const s=this.state;if(s.flags.mysteryEgg&&!s.flags.eggDelivered){s.items??={};s.items.MYSTERY_EGG=1;}else if(s.flags.eggDelivered&&s.items)delete s.items.MYSTERY_EGG;s.party??=[];s.storage??=[];s.balls??=0;s.grassGrace??=0;if(s.starter&&!s.party.length){const species=Object.keys(this.battleData.species).find(id=>this.battleData.species[id].name===s.starter);s.party.push(createPokemon(this.battleData,species,5,this.rng));}if(s.starter&&!s.flags.battleSupplies){s.balls+=5;s.flags.battleSupplies=true;}initializeMonsterDex(s,this.battleData);initializePC(s);}
 get battle(){return this.state.battle&&this.battleData?new Battle(this.battleData,this.state,this.rng):null;}
 startEncounter(species,level){if(!this.battleData||this.state.battle)return false;return !!Battle.start(this.battleData,this.state,createPokemon(this.battleData,species,level,this.rng),this.rng);}
 startTrainer(id){const t=this.battleData?.trainers?.[id];if(!t||this.state.battle||this.state.flags['trainer:'+id])return false;const started=!!Battle.startTrainer(this.battleData,this.state,t,this.rng);if(started)delete this.state.trainerEncounter;return started;}
 trainerInSight(){if(!this.battleData||this.state.battle||!this.state.party.some(p=>p.hp>0))return null;for(const o of this.objects()){if(!o.trainer||!o.range||this.state.flags['trainer:'+o.trainer])continue;const d=DIRECTIONS[o.direction]||DIRECTIONS.down;for(let n=1;n<=o.range;n++){const x=o.x+d[0]*n,y=o.y+d[1]*n;if(x===this.state.x&&y===this.state.y)return o;if(!this.passable(x,y))break;}}return null;}
 healParty(){if(!this.battleData)return;for(const p of this.state.party){p.hp=p.stats.hp;p.status=null;p.sleep=0;for(const m of p.moves)m.pp=this.battleData.moves[m.id].pp;}}
 finishBattle(){const b=this.battle;if(!b||!b.s.result||b.s.learn.length)return false;const lost=b.s.result==='lost';if(b.s.trainer==='CherrygroveRival')this.state.flags.rivalDone=true;if(b.s.result==='won'&&b.s.trainer){const t=this.battleData.trainers[b.s.trainer];if(!this.state.flags['trainer:'+t.id]){this.state.flags['trainer:'+t.id]=true;this.state.money+=t.reward;if(t.badge){this.state.flags.zephyr=true;this.state.flags.tmMudSlap=true;this.state.items??={};this.state.items.TM31=1;for(const a of Object.values(this.battleData.trainers).filter(a=>a.id.startsWith('VioletGym:')))this.state.flags['trainer:'+a.id]=true;}if(t.gift){this.state.flags.flash=true;this.state.items??={};this.state.items.HM05=1;}}}delete this.state.battle;this.upgradeMinecraftMoves();this.state.grassGrace=3;if(lost){this.healParty();this.state.money=Math.floor(this.state.money/2);const home=this.state.lastCenter||(this.state.flags.healed?'CherrygrovePokecenter1F':this.state.flags.easyStart?'ElmsLab':'PlayersHouse1F');this.enter(this.maps[home],home==='PlayersHouse1F'?7:home==='ElmsLab'?4:3,home==='PlayersHouse1F'?4:6);}return true;}
 buyBall(){if(!this.battleData||this.state.money<200)return false;this.state.money-=200;this.state.balls++;return true;}
 upgradeMinecraftMoves(){
  // Never rewrite a pending turn's visual snapshots or spent PP. Upgrade old
  // companions only outside battle; learned/replaced modern moves stay intact.
  if(this.state.battle||!this.battleData)return;
  for(const p of [...this.state.party,...this.state.storage]){
   const signature=this.battleData.species[p.species]?.signatureMove;
   if(!signature||p.minecraftMovesVersion>=1)continue;
   if(!p.moves.some(m=>m.id===signature)){
    const slot=p.moves.findIndex(m=>m.id==='TACKLE');
    if(slot>=0){const old=p.moves[slot],maximum=this.battleData.moves[signature].pp;p.moves[slot]={id:signature,pp:Math.floor(old.pp/this.battleData.moves.TACKLE.pp*maximum)};}
    else if(p.moves.length<4)p.moves.unshift({id:signature,pp:this.battleData.moves[signature].pp});
   }
   p.minecraftMovesVersion=1;
  }
 }
 beginHealing(){if(this.state.battle||this.state.healing||!['CherrygrovePokecenter1F','VioletPokecenter1F'].includes(this.state.map)||!this.state.party?.length)return false;this.healParty();this.state.flags.healed=true;this.state.lastCenter=this.state.map;this.state.healing={version:1,map:this.state.map,count:this.state.party.length};return true;}
 finishHealing(){delete this.state.healing;}
 serialize(){if(this.battleData){initializeMonsterDex(this.state,this.battleData);initializePC(this.state);}return JSON.stringify(this.state)}
 restore(raw){const previous=this.state;try{const s=JSON.parse(raw);if(!s||s.version!==1||!this.maps[s.map]||!Number.isInteger(s.x)||!Number.isInteger(s.y)||!DIRECTIONS[s.facing]||!s.flags||Array.isArray(s.flags)||typeof s.flags!=='object'||!Number.isInteger(s.steps)||s.steps<0||!(s.starter===null||['치코리타','브케인','리아코','피카츄'].includes(s.starter)))return false;
 s.money??=3000;s.potions??=0;if(!Number.isSafeInteger(s.money)||s.money<0||!Number.isSafeInteger(s.potions)||s.potions<0)return false;
 if(this.battleData&&(!validPC(s)||!validMonsterDex(s.monsterDex,this.battleData)||!validDexIntro(s.dexIntro,s,this.battleData)))return false;
 if(!validPhoneCall(s))return false;
 if(s.healing&&(!s.healing||s.healing.version!==1||!['CherrygrovePokecenter1F','VioletPokecenter1F'].includes(s.healing.map)||s.map!==s.healing.map||s.battle||!Number.isInteger(s.healing.count)||s.healing.count<1||s.healing.count>6||s.healing.count!==s.party?.length))return false;
 if(s.lastCenter&&!['CherrygrovePokecenter1F','VioletPokecenter1F'].includes(s.lastCenter))return false;
 const map=this.maps[s.map];if(s.x<0||s.y<0||s.x>=map.width||s.y>=map.height)return false;
 const old=this.state;this.state=s;if(this.battleData){this.initializeParty();if(!Array.isArray(s.party)||s.party.length>6||!Array.isArray(s.storage)||s.storage.length>1000||s.party.some(p=>!validPokemon(this.battleData,p))||s.storage.some(p=>!validPokemon(this.battleData,p))||!Number.isSafeInteger(s.balls)||s.balls<0||!Number.isInteger(s.grassGrace)||s.grassGrace<0||s.grassGrace>3||!validateBattle(this.battleData,s)){this.state=old;return false;}}if(!this.passable(s.x,s.y)){this.state=old;return false;}if(!validTrainerEncounter(this,s.trainerEncounter)){this.state=old;return false;}this.upgradeMinecraftMoves();this.lock=`${s.map}:${s.x}:${s.y}`;return true;}catch{this.state=previous;return false}}
}
