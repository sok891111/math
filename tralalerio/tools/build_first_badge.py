"""Extend existing battle data from the pinned Gold disassembly; preserve Minecraft assets."""
from pathlib import Path
from PIL import Image
import json,re,sys
from gold_wild import grass_table
R=Path(sys.argv[1] if len(sys.argv)>1 else '/private/tmp/pokemon-gold-kr-research');O=Path(__file__).resolve().parent.parent/'assets'
data=json.loads((O/'battle-data.json').read_text());maps=json.loads((O/'maps.json').read_text());trainers={};needed={'pikachu','pidgeotto','onix'}
constants={};group=None;index=0
for line in (R/'constants/trainer_constants.asm').read_text().splitlines():
 m=re.search(r'trainerclass (\w+)',line)
 if m:group=m[1];index=0
 m=re.search(r'^\s*const (\w+)',line)
 if m:index+=1;constants[(group,m[1])]=index
parties=(R/'data/trainers/parties.asm').read_text()
def team(group,key):
 start=parties.index(''.join(x.title() for x in group.split('_'))+'Group:');section=parties[start:].split('\n\n',1)[0] if False else parties[start:]
 chunk=re.search(r'; '+group+r' \('+str(constants[(group,key)])+r'\)(.*?)(?:db -1)',section,re.S)[1]
 name=re.search(r'db "([^@]+)@", (\w+)',chunk)[1];result=[]
 for level,sp,rest in re.findall(r'db\s+(\d+),\s+(\w+)([^\n]*)',chunk):
  mon={'species':sp.lower(),'level':int(level)};needed.add(sp.lower())
  if 'TRAINERTYPE_MOVES' in chunk:mon['moves']=[x.strip() for x in rest.strip(', ').split(',') if x.strip()!='NO_MOVE']
  result.append(mon)
 return name,result
for id,m in maps.items():
 source=(R/'maps'/f'{id}.asm').read_text()
 for o in m['objects']:
  match=re.search(r'^'+re.escape(o['script'])+r':\s*\n(.*?)(?=^\w+:|\Z)',source,re.M|re.S)
  block=match[1] if match else ''
  item=re.search(r'itemball (\w+)',block)
  if item:o['item']=item[1]
  t=re.search(r'(?:trainer|loadtrainer) (\w+), (\w+)',block)
  if not t:continue
  group,key=t.groups()
  # Early source has rematch branches; the first original party is used.
  name,party=team(group,key);tid=id+':'+o['script'];o['trainer']=tid
  trainers[tid]={'id':tid,'name':name,'group':group,'party':party,'reward':party[-1]['level']*({'FALKNER':100,'SAGE':32,'BIRD_KEEPER':24,'YOUNGSTER':16,'BUG_CATCHER':16}.get(group,20))}
  seen=re.search(r'trainer \w+, \w+, \w+, (\w+)',block)
  intro=seen[1] if seen else {'FALKNER':'FalknerIntroText','SAGE':'SageLiSeenText'}.get(group)
  if intro and intro in m['texts']:trainers[tid]['introPages']=m['texts'][intro]
  if group=='FALKNER':trainers[tid]['badge']='zephyr'
  if group=='SAGE' and key=='LI':trainers[tid]['gift']='FLASH'
name,party=team('RIVAL1','RIVAL1_1_CHIKORITA');trainers['CherrygroveRival']={'id':'CherrygroveRival','name':'빨간 머리 친구','group':'RIVAL1','party':party,'reward':300}
wild=(R/'data/wild/johto_grass.asm').read_text()
map_attributes=(R/'data/maps/maps.asm').read_text()
mc=[s for s in data['encounters']['Route29']['day'] if s['species'].startswith('mc_')]
source_tables={}
for id,m in maps.items():
 table=grass_table(wild,m['constant'])
 if not table:continue
 slots,rates=table['slots'],table['rates'];needed.update(s['species'] for s in slots)
 attribute=re.search(r'\bmap '+re.escape(id)+r', \w+, (\w+),',map_attributes)
 terrain='floor' if attribute and attribute[1] in ['CAVE','DUNGEON'] else 'grass'
 # Integer weights preserve Gold's exact 30/30/20/10/5/4/1 relative rates within the 40% Pokemon pool.
 data['encounters'][id]={'rateByte':rates['day'],'rates':rates,'terrain':terrain,'weights':[60,60,40,20,10,8,2]+[15]*12+[10]*12}
 source_tables[id]={'constant':m['constant'],'rates':rates,'terrain':terrain}
 for n,period in enumerate(['morning','day','night']):
  original=slots[n*7:n*7+7]
  companions=[{**mon,'level':mon['level'] if id=='Route29' else original[i%7]['level']} for i,mon in enumerate(mc)]
  data['encounters'][id][period]=original+companions
  source_tables[id][period]=original
(O/'encounter-source.json').write_text(json.dumps({'repository':'https://github.com/Narishma-gb/pokegold-kr','commit':'c90f31dadef17f033a8f1bdada701b26cef18241','file':'data/wild/johto_grass.asm','version':'Gold','originalWeights':[30,30,20,10,5,4,1],'tables':source_tables},ensure_ascii=False,indent=2)+'\n')
learntext=(R/'data/pokemon/evos_attacks.asm').read_text()
labels={'onix':'롱스톤','mankey':'망키','ponyta':'포니타','pikachu':'피카츄','pidgeotto':'피죤','caterpie':'캐터피','metapod':'단데기','weedle':'뿔충이','kakuna':'딱충이','bellsprout':'모다피','spinarak':'페이검','ledyba':'레디바','pol iwag':'발챙이','poliwag':'발챙이','spearow':'깨비참','geodude':'꼬마돌','zubat':'주뱃','gastly':'고오스','dunsparce':'노고치','phanpy':'코코리','jigglypuff':'푸린'}
for id,label in labels.items():
 if id in data['species']:data['species'][id]['name']=label
moveids=set()
for id in sorted(needed):
 if id in data['species']:continue
 s=(R/'data/pokemon/base_stats'/f'{id}.asm').read_text();raw=list(map(int,re.search(r'db\s+(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)',s).groups()))
 label=id[0].upper()+id[1:];learn=learntext.split(label+'EvosAttacks:')[1].split('\n\n')[0];learnset=[{'level':int(l),'move':m} for l,m in re.findall(r'db (\d+), (\w+)',learn)]
 data['species'][id]={'name':labels.get(id,id),'base':dict(zip(['hp','attack','defense','speed','specialAttack','specialDefense'],raw)),'types':list(dict.fromkeys(re.search(r'db (\w+), (\w+) ; type',s).groups())),'catchRate':int(re.search(r'db (\d+) ; catch rate',s)[1]),'baseExp':int(re.search(r'db (\d+) ; base exp',s)[1]),'growth':re.search(r'db GROWTH_(\w+)',s)[1],'learnset':learnset}
 for side in ['front','back']:
  folder=R/'gfx/pokemon'/id;file=folder/(('front_gold.png' if (folder/'front_gold.png').exists() else 'front.png') if side=='front' else 'back.png');src=Image.open(file).convert('RGBA');bg=src.getpixel((0,0));src.putdata([(0,0,0,0) if p==bg else p for p in src.getdata()]);src.save(O/'battle'/f'{id}-{side}.png')
for sp in data['species'].values():moveids.update(x['move'] for x in sp['learnset'])
for t in trainers.values():
 for p in t['party']:moveids.update(p.get('moves',[]))
move_labels={'THUNDERSHOCK':'전기쇼크','THUNDER_WAVE':'전기자석파','THUNDERBOLT':'10만볼트','THUNDER':'번개','DOUBLE_TEAM':'그림자분신','VINE_WHIP':'덩굴채찍','STRING_SHOT':'실뿜기','POISON_STING':'독침','MUD_SLAP':'진흙뿌리기','HARDEN':'단단해지기','LICK':'핥기','NIGHT_SHADE':'나이트헤드','LEECH_LIFE':'흡혈','SUPERSONIC':'초음파','ROCK_THROW':'돌떨구기','WRAP':'김밥말이','GROWTH':'성장','SLEEP_POWDER':'수면가루','STUN_SPORE':'저리가루','FLASH':'플래시'}
source_move_ids=re.findall(r'^\s*move (\w+),', (R/'data/moves/moves.asm').read_text(),re.M)
source_move_names=re.findall(r'li "([^"]+)"',(R/'data/moves/names.asm').read_text())
move_labels.update(dict(zip(source_move_ids,source_move_names)))
for id in moveids:
 if id in data['moves'] and id in move_labels:data['moves'][id]['name']=move_labels[id]
for line in (R/'data/moves/moves.asm').read_text().splitlines():
 m=re.search(r'move (\w+),\s+(\w+),\s+(\d+),\s+(\w+),\s+(\d+),\s+(\d+),\s+(\d+)',line)
 if not m or m[1] not in moveids or m[1] in data['moves']:continue
 id,effect,power,typ,acc,pp,chance=m.groups();data['moves'][id]={'name':move_labels.get(id,id.replace('_',' ').title()),'effect':effect.removeprefix('EFFECT_'),'power':int(power),'type':typ,'accuracy':int(acc),'pp':int(pp),'chance':int(chance)}
assert all(x['move'] in data['moves'] for sp in data['species'].values() for x in sp['learnset'])
# Original trainer class DVs and class reward multipliers.
dvs={group:dict(zip(['attack','defense','speed','special'],map(int,values))) for *values,group in re.findall(r'dn\s+(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\s*; (\w+)',(R/'data/trainers/dvs.asm').read_text())}
rewards={};current=''
for line in (R/'data/trainers/attributes.asm').read_text().splitlines():
 if line.startswith('; '):current=re.sub(r'[^A-Z0-9]','',line[2:].upper())
 match=re.search(r'db (\d+) ; base reward',line)
 if match:rewards[current]=int(match[1])
for trainer in trainers.values():
 trainer['dvs']=dvs[trainer['group']]
 key=trainer['group'].replace('_','')
 if key in rewards:trainer['reward']=rewards[key]*4*trainer['party'][-1]['level']
data['trainers']=trainers;data['scope']='First badge maps and source trainer teams; original Gold base stats and wild slots with 60% Minecraft encounters.'
(O/'battle-data.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')));(O/'maps.json').write_text(json.dumps(maps,ensure_ascii=False,separators=(',',':')))
print('First badge:',len(maps),'maps,',len(trainers),'trainers,',len(needed),'original species referenced')
