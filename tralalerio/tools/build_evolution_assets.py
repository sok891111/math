"""Extend playable species through their complete Gold evolution chains (no encounter changes)."""
from pathlib import Path
from PIL import Image
import re,json,sys
r=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/pokemon-gold-kr-research');out=Path(__file__).resolve().parent.parent/'assets'
data=json.loads((out/'battle-data.json').read_text());text=(r/'data/pokemon/evos_attacks.asm').read_text()
blocks={name.lower():body for name,body in re.findall(r'^(\w+)EvosAttacks:\n(.*?)(?=^\w+EvosAttacks:|\Z)',text,re.M|re.S)}
ids=re.findall(r'^\s*const (\w+)',(r/'constants/pokemon_constants.asm').read_text(),re.M)[:251]
names=dict(zip([s.lower() for s in ids],re.findall(r'dname "([^"]+)"',(r/'data/pokemon/names.asm').read_text())[:251]))
def block(id):return blocks[id.replace('_','')]
def rules(id):
 return [{'method':'level','level':int(level),'species':target.lower()} for level,target in re.findall(r'db EVOLVE_LEVEL, (\d+), (\w+)',block(id))]
needed=set(id for id in data['species'] if id in names)
while True:
 expanded=needed|{e['species'] for id in needed for e in rules(id)}
 if expanded==needed:break
 needed=expanded
for id in sorted(needed):
 if id not in data['species']:
  s=(r/'data/pokemon/base_stats'/f'{id}.asm').read_text();raw=list(map(int,re.search(r'db\s+(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)',s).groups()))
  data['species'][id]={'name':names[id],'base':dict(zip(['hp','attack','defense','speed','specialAttack','specialDefense'],raw)),'types':list(dict.fromkeys(re.search(r'db (\w+), (\w+) ; type',s).groups())),'catchRate':int(re.search(r'db (\d+) ; catch rate',s)[1]),'baseExp':int(re.search(r'db (\d+) ; base exp',s)[1]),'growth':re.search(r'db GROWTH_(\w+)',s)[1],'learnset':[{'level':int(l),'move':m} for l,m in re.findall(r'db (\d+), (\w+)',block(id))]}
 data['species'][id]['evolutions']=rules(id)
 for side in ['front','back']:
  folder=r/'gfx/pokemon'/id;file=folder/(('front_gold.png' if (folder/'front_gold.png').exists() else 'front.png') if side=='front' else 'back.png');im=Image.open(file).convert('RGBA');bg=im.getpixel((0,0));im.putdata([(0,0,0,0) if p==bg else p for p in im.getdata()]);im.save(out/'battle'/f'{id}-{side}.png')
moveids={l['move'] for sp in data['species'].values() for l in sp['learnset']}
source_moves=re.findall(r'^\s*move (\w+),\s+(\w+),\s+(\d+),\s+(\w+),\s+(\d+),\s+(\d+),\s+(\d+)',(r/'data/moves/moves.asm').read_text(),re.M)
labels=dict(zip([m[0] for m in source_moves],re.findall(r'li "([^"]+)"',(r/'data/moves/names.asm').read_text())))
for id,effect,power,typ,acc,pp,chance in source_moves:
 if id in moveids and id not in data['moves']:data['moves'][id]={'name':labels[id],'effect':effect.removeprefix('EFFECT_'),'power':int(power),'type':typ,'accuracy':int(acc),'pp':int(pp),'chance':int(chance)}
data['evolutionSource']={'repository':'https://github.com/Narishma-gb/pokegold-kr','commit':'c90f31dadef17f033a8f1bdada701b26cef18241','files':['data/pokemon/evos_attacks.asm','engine/pokemon/evolve.asm']}
(out/'battle-data.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print('Gold evolution chains:',len(needed),'playable Pokemon,',sum(len(data['species'][s]['evolutions']) for s in needed),'evolution branches')
