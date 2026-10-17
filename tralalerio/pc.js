// Gold: 14 boxes, 20 monsters per box; keep the inherited flat storage for save compatibility.
export const BOX_COUNT=14,BOX_SIZE=20;
export function initializePC(s){
 s.pc??={version:1,currentBox:0,names:Array.from({length:14},(_,i)=>`박스 ${i+1}`),assignments:[],items:{},mail:[]};
 while(s.pc.assignments.length<(s.storage||[]).length){const i=s.pc.assignments.length;s.pc.assignments.push(i<280?Math.floor(i/20):-1);}
}
export function validPC(s){const p=s.pc;if(p===undefined)return true;return !!(p&&p.version===1&&Number.isInteger(p.currentBox)&&p.currentBox>=0&&p.currentBox<14&&Array.isArray(p.names)&&p.names.length===14&&p.names.every(n=>typeof n==='string'&&n.trim().length>0&&n.length<=16)&&Array.isArray(p.assignments)&&p.assignments.length===(s.storage?.length||0)&&p.assignments.every(n=>Number.isInteger(n)&&n>=-1&&n<14)&&Array.from({length:14},(_,i)=>p.assignments.filter(n=>n===i).length).every(n=>n<=20)&&p.items&&typeof p.items==='object'&&!Array.isArray(p.items)&&Object.keys(p.items).length<=50&&Object.entries(p.items).every(([id,n])=>canStoreItem(id)&&Number.isInteger(n)&&n>0&&n<=99)&&Array.isArray(p.mail)&&p.mail.length<=10&&p.mail.every(validMail));}
export const validMail=m=>!!(m&&typeof m.text==='string'&&m.text.length<=500&&typeof m.sender==='string'&&m.sender.length<=40);
export const canStoreItem=id=>/^[A-Z][A-Z0-9_]{0,39}$/.test(id)&&!['MYSTERY_EGG','POKEDEX','MAP_CARD','BICYCLE','SQUIRTBOTTLE','BASEMENT_KEY','CARD_KEY'].includes(id)&&!/^HM|^TM/.test(id);
export const itemName=id=>({POTION:'상처약',POKE_BALL:'몬스터볼',BERRY:'나무열매',PSNCUREBERRY:'해독열매',BITTER_BERRY:'쓴맛열매',PRZCUREBERRY:'마비치료열매'})[id]||id;
export function bagItems(s){return {POTION:s.potions||0,POKE_BALL:s.balls||0,...Object.fromEntries(Object.entries(s.items||{}).filter(([id])=>canStoreItem(id)))};}
function bagSet(s,id,n){if(id==='POTION')s.potions=n;else if(id==='POKE_BALL')s.balls=n;else{s.items??={};if(n)s.items[id]=n;else delete s.items[id];}}
export function boxCount(s,box=s.pc.currentBox){return s.pc.assignments.filter(n=>n===box).length;}
export function canStoreCapture(s){initializePC(s);return s.party.length<6||boxCount(s)<20;}
export function storeCapture(s,p){initializePC(s);s.storage.push(p);s.pc.assignments.push(s.pc.currentBox);}
const fail=message=>({ok:false,message});
function healStored(p,data){p.hp=p.stats.hp;p.status=null;p.sleep=0;p.moves.forEach(m=>m.pp=data.moves[m.id].pp);}
export function pcAction(game,action,index,value){
 const s=game.state;initializePC(s);const pc=s.pc;
 if(s.battle||s.healing||s.phoneCall||s.trainerEncounter||!game.map.collision.some(row=>row.includes('PC')))return fail('지금은 PC를 사용할 수 없어요.');
 const safe=i=>Number.isInteger(i)&&i>=0;
 if(action==='box'){if(!safe(index)||index>=14)return fail('박스를 확인해 주세요.');pc.currentBox=index;return {ok:true,message:`${pc.names[index]}로 바꾸었다!`};}
 if(action==='rename'){if(!safe(index)||index>=14||typeof value!=='string'||!value.trim()||value.length>16)return fail('박스 이름은 1~16자로 적어 주세요.');pc.names[index]=value.trim();return {ok:true,message:'박스 이름을 바꾸었다!'};}
 if(['deposit','withdraw','release','move','swap','order','take-mail'].includes(action)){
  const party=action==='deposit'||action==='take-mail',list=party?s.party:s.storage,p=list[index];if(!safe(index)||!p)return fail('몬스터를 다시 골라 주세요.');
  if(action==='take-mail'){if(!validMail(p.mail))return fail('지닌 메일이 없어요.');if(pc.mail.length===10)return fail('메일박스가 가득 찼어요.');pc.mail.push(p.mail);delete p.mail;return {ok:true,message:'메일을 메일박스로 옮겼다!'};}
  if(p.mail)return fail('메일을 먼저 메일박스에 맡겨 주세요.');
  if(action==='deposit'){if(s.party.length<=1||p.hp>0&&!s.party.some((m,i)=>i!==index&&m.hp>0))return fail('함께 여행할 건강한 몬스터를 한 마리 남겨 주세요.');if(boxCount(s)>=20)return fail('이 박스는 가득 찼어요. 다른 박스로 바꿔 주세요.');s.party.splice(index,1);healStored(p,game.battleData);storeCapture(s,p);}
  if(action==='withdraw'){if(s.party.length>=6)return fail('손에 있는 몬스터가 6마리예요. 먼저 한 마리를 맡겨 주세요.');healStored(p,game.battleData);s.party.push(s.storage.splice(index,1)[0]);pc.assignments.splice(index,1);}
  if(action==='release'){s.storage.splice(index,1);pc.assignments.splice(index,1);}
  if(action==='move'){if(!safe(value)||value>=14)return fail('옮길 박스를 골라 주세요.');if(pc.assignments[index]!==value&&boxCount(s,value)>=20)return fail('옮길 박스가 가득 찼어요.');pc.assignments[index]=value;}
  if(action==='order'){if(!safe(value)||!s.storage[value]||pc.assignments[value]!==pc.assignments[index]||s.storage[value].mail)return fail('같은 박스의 몬스터를 골라 주세요.');[s.storage[index],s.storage[value]]=[s.storage[value],p];}
  if(action==='swap'){if(!safe(value)||!s.party[value])return fail('교환할 동료를 골라 주세요.');if(s.party[value].mail)return fail('동료의 메일을 먼저 맡겨 주세요.');healStored(p,game.battleData);[s.party[value],s.storage[index]]=[p,s.party[value]];}
  return {ok:true,message:action==='release'?'몬스터를 놓아주었다. 잘 지내!':'몬스터를 옮겼다!'};
 }
 if(['deposit-item','withdraw-item','toss-item'].includes(action)){
  const id=index,n=value;if(!canStoreItem(id)||!Number.isInteger(n)||n<1||n>99)return fail('도구와 수량을 확인해 주세요.');const bag=bagItems(s),have=action==='deposit-item'?bag[id]||0:pc.items[id]||0;if(have<n)return fail('도구가 부족해요.');
  if(action==='deposit-item'){if((pc.items[id]||0)+n>99||!pc.items[id]&&Object.keys(pc.items).length>=50)return fail('PC 도구 보관함이 가득 찼어요.');bagSet(s,id,have-n);pc.items[id]=(pc.items[id]||0)+n;}
  else{if(action==='withdraw-item'&&(bag[id]||0)+n>99)return fail('가방에 더 넣을 수 없어요.');pc.items[id]-=n;if(!pc.items[id])delete pc.items[id];if(action==='withdraw-item')bagSet(s,id,(bag[id]||0)+n);}
  return {ok:true,message:`${itemName(id)} ${n}개를 ${action==='deposit-item'?'맡겼다':action==='withdraw-item'?'꺼냈다':'버렸다'}!`};
 }
 if(action==='give-mail'){const mail=pc.mail[index],p=s.party[value];if(!safe(index)||!mail||!safe(value)||!p||p.mail||p.heldItem)return fail('메일을 받을 동료를 다시 골라 주세요.');p.mail=pc.mail.splice(index,1)[0];return {ok:true,message:'동료에게 메일을 맡겼다!'};}
 if(action==='erase-mail'){if(!safe(index)||!pc.mail[index])return fail('메일을 다시 골라 주세요.');pc.mail.splice(index,1);return {ok:true,message:'메일을 지웠다.'};}
 return fail('다시 선택해 주세요.');
}
export function oakRating(s){const dex=s.monsterDex||{seen:[],caught:[]},n=dex.caught.length;return [`발견한 몬스터 ${dex.seen.length}종, 잡은 몬스터 ${n}종이구나!`,n<10?'아직 여행은 시작이란다. 풀숲에서 새로운 친구들을 만나 보렴.':n<30?'여러 친구들을 만나고 있구나! 시간대를 바꾸어 찾아보는 것도 좋단다.':n<60?'훌륭하구나! 여러 지역을 탐험하며 도감을 채워 보렴.':'멋진 도감이구나! 친구들과 함께한 모험이 잘 기록되어 있단다.'];}
