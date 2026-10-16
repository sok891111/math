# -*- coding: utf-8 -*-
"""Extract the Route 29 encounter table, seven species, moves and battle sprites.
Source is the pinned public disassembly, not a ROM. Pillow is build-only.
"""
from pathlib import Path
from PIL import Image
import re,json,sys
R=Path(sys.argv[1] if len(sys.argv)>1 else '/private/tmp/pokemon-gold-kr-research');O=Path(__file__).resolve().parent.parent/'assets';D=O/'battle';D.mkdir(exist_ok=True)
names={'chikorita':'치코리타','cyndaquil':'브케인','totodile':'리아코','pidgey':'구구','rattata':'꼬렛','sentret':'꼬리선','hoothoot':'부우부'}
move_names=dict(x.split(':') for x in 'TACKLE:몸통박치기,SCRATCH:할퀴기,GROWL:울음소리,LEER:째려보기,TAIL_WHIP:꼬리흔들기,SAND_ATTACK:모래뿌리기,SMOKESCREEN:연막,RAZOR_LEAF:잎날가르기,REFLECT:리플렉터,POISONPOWDER:독가루,SYNTHESIS:광합성,BODY_SLAM:누르기,LIGHT_SCREEN:빛의장막,SAFEGUARD:신비의부적,SOLARBEAM:솔라빔,EMBER:불꽃세례,QUICK_ATTACK:전광석화,FLAME_WHEEL:화염자동차,SWIFT:스피드스타,FLAMETHROWER:화염방사,RAGE:분노,WATER_GUN:물대포,BITE:물기,SCARY_FACE:겁나는얼굴,SLASH:베어가르기,SCREECH:싫은소리,HYDRO_PUMP:하이드로펌프,GUST:바람일으키기,WHIRLWIND:날려버리기,WING_ATTACK:날개치기,AGILITY:고속이동,MIRROR_MOVE:따라하기,HYPER_FANG:필살앞니,FOCUS_ENERGY:기충전,PURSUIT:따라가때리기,SUPER_FANG:분노의앞니,DEFENSE_CURL:웅크리기,FURY_SWIPES:마구할퀴기,SLAM:힘껏치기,REST:잠자기,AMNESIA:망각술,FORESIGHT:꿰뚫어보기,PECK:쪼기,HYPNOSIS:최면술,TAKE_DOWN:돌진,CONFUSION:염동력,DREAM_EATER:꿈먹기,STRUGGLE:발버둥'.split(','))
learntext=(R/'data/pokemon/evos_attacks.asm').read_text();species={};move_ids={'STRUGGLE'}
for id,name in names.items():
 s=(R/'data/pokemon/base_stats'/f'{id}.asm').read_text();raw=list(map(int,re.search(r'db\s+(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)',s).groups()))
 label=id[0].upper()+id[1:];learn=learntext.split(label+'EvosAttacks:')[1].split('\n\n')[0]
 learnset=[{'level':int(l),'move':m} for l,m in re.findall(r'db (\d+), (\w+)',learn)]
 move_ids.update(x['move'] for x in learnset)
 species[id]={'name':name,'base':dict(zip(['hp','attack','defense','speed','specialAttack','specialDefense'],raw)),'types':list(dict.fromkeys(re.search(r'db (\w+), (\w+) ; type',s).groups())),'catchRate':int(re.search(r'db (\d+) ; catch rate',s)[1]),'baseExp':int(re.search(r'db (\d+) ; base exp',s)[1]),'growth':re.search(r'db GROWTH_(\w+)',s)[1],'learnset':learnset}
 for side in ['front','back']:
  file=R/'gfx/pokemon'/id/(('front_gold.png' if (R/'gfx/pokemon'/id/'front_gold.png').exists() else 'front.png') if side=='front' else 'back.png')
  src=Image.open(file);im=src.convert('RGBA');bg=src.getpixel((0,0))
  for y in range(src.height):
   for x in range(src.width):
    if src.getpixel((x,y))==bg:im.putpixel((x,y),(0,0,0,0))
  im.save(D/f'{id}-{side}.png')
moves={}
for line in (R/'data/moves/moves.asm').read_text().splitlines():
 m=re.search(r'move (\w+),\s+(\w+),\s+(\d+),\s+(\w+),\s+(\d+),\s+(\d+),\s+(\d+)',line)
 if m and m[1] in move_ids:
  id,effect,power,type,accuracy,pp,chance=m.groups();moves[id]={'name':move_names[id],'effect':effect.removeprefix('EFFECT_'),'power':int(power),'type':type,'accuracy':int(accuracy),'pp':int(pp),'chance':int(chance)}
assert move_ids==set(moves),move_ids-set(moves)
wild=(R/'data/wild/johto_grass.asm').read_text().split('def_grass_wildmons ROUTE_29')[1].split('end_grass_wildmons')[0];entries=[{'level':int(l),'species':sp.lower()} for l,sp in re.findall(r'db (\d+), (\w+)',wild)]
matchups={}
for a,b,m in re.findall(r'db (\w+),\s+(\w+),\s+(NO_EFFECT|NOT_VERY_EFFECTIVE|SUPER_EFFECTIVE)',(R/'data/types/type_matchups.asm').read_text()):matchups[a+':'+b]={'NO_EFFECT':0,'NOT_VERY_EFFECTIVE':0.5,'SUPER_EFFECTIVE':2}[m]
data={'species':species,'moves':moves,'matchups':matchups,'encounters':{'Route29':{'rateByte':25,'weights':[30,30,20,10,5,4,1],'morning':entries[:7],'day':entries[7:14],'night':entries[14:21]}},'source':'https://github.com/Narishma-gb/pokegold-kr','scope':'Route 29 wild battles. Seven species, original base stats, learnsets, move records, type chart and front/back graphics. Web logic is a new implementation, not a cycle-accurate reproduction.'}
(O/'battle-data.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')))
print('Battle data:',len(species),'species,',len(moves),'moves,',len(entries),'time-of-day slots')
