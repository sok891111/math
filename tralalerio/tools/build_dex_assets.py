# -*- coding: utf-8 -*-
"""Gold's full 251-entry New Pokedex order, plus the game's Minecraft companions."""
from pathlib import Path
from PIL import Image
import re,json,sys
r=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/pokemon-gold-kr-research');out=Path(__file__).resolve().parent.parent/'assets';(out/'dex').mkdir(exist_ok=True)
ids=re.findall(r'^\s*const (\w+)',(r/'constants/pokemon_constants.asm').read_text(),re.M)[:251]
names=re.findall(r'dname "([^"]+)"',(r/'data/pokemon/names.asm').read_text())[:251]
order=re.findall(r'^\s*db (\w+)',(r/'data/pokemon/dex_order_new.asm').read_text(),re.M)
assert len(ids)==len(names)==len(order)==251
national={id:i+1 for i,id in enumerate(ids)};labels=dict(zip(ids,names));entries=[]
for n,id in enumerate(order,1):
 key=id.lower();text=(r/'data/pokemon/dex_entries/gold'/f'{key}.asm').read_text();stats=(r/'data/pokemon/base_stats'/f'{key}.asm').read_text()
 strings=re.findall(r'(?:db|next|page)\s+"([^"]+)"',text)
 height=int(re.search(r'db (\d+) ; height',text)[1]);weight=int(re.search(r'dw (\d+) ; weight',text)[1]);types=list(dict.fromkeys(re.search(r'db (\w+), (\w+) ; type',stats).groups()))
 entries.append({'id':key,'number':n,'national':national[id],'name':labels[id],'kind':'pokemon','category':strings[0].strip('@')+'포켓몬','height':height/10,'weight':weight/10,'types':types,'description':' '.join(s.strip('@').replace('<.>','.') for s in strings[1:]),'image':f'assets/dex/{key}.png'})
 folder=r/'gfx/pokemon'/('unown_a' if key=='unown' else key);src=Image.open(folder/('front_gold.png' if (folder/'front_gold.png').exists() else 'front.png')).convert('RGBA');bg=src.getpixel((0,0));src.putdata([(0,0,0,0) if pixel==bg else pixel for pixel in src.getdata()]);src.save(out/'dex'/f'{key}.png')
data=json.loads((out/'battle-data.json').read_text())
entries.extend(json.loads((out/'additional-pokemon.json').read_text())['dex'])
traits=dict(zip(['wither','elderguardian','evoker','ravager','piglinbrute','breeze','shulker','endermite','enderknight','enderdragon','warden','chicken','pig','rabbit','fox','zombie','creeper','slime','skeleton','spider','witch','enderman','magma','ghast'],[
 '세 개의 머리에서 해골 탄환을 날린다.', '바닷속 신전을 지키며 눈에서 광선을 쏜다.', '마법으로 땅에서 날카로운 송곳니를 불러낸다.', '단단한 몸과 뿔로 힘껏 돌진한다.', '황금 도끼를 휘두르는 요새의 전사.', '바람을 모아 튀어 오르고 회오리를 날린다.', '단단한 껍질에 숨어 있다가 탄환을 쏜다.', '작은 몸으로 재빠르게 움직이며 빈틈을 노린다.', '엔더의 힘이 깃든 검으로 날카롭게 벤다.', '엔드의 하늘을 날며 보랏빛 숨결을 내뿜는다.', '어둠 속에서 진동을 듣고 강력한 음파를 보낸다.', '작은 날개를 파닥이며 빠르게 쪼아 공격한다.', '분홍빛 코로 냄새를 맡고 몸을 낮추어 돌진한다.', '눈 위를 가볍게 뛰어다니는 재빠른 친구.', '조용히 다가가 날쌘 몸놀림으로 공격한다.', '씩씩하게 다가와 힘껏 팔을 휘두른다.', '가까이 다가가 폭발하는 힘으로 상대를 놀라게 한다.', '말랑한 몸으로 통통 뛰어올라 몸통을 부딪친다.', '어두운 곳에서도 활을 겨누어 화살을 날린다.', '벽을 타고 움직이며 날카로운 독니로 공격한다.', '여러 재료로 만든 신비한 물약을 던진다.', '순간이동으로 위치를 바꾸어 빈틈을 노린다.', '뜨거운 몸을 높이 튀어 올려 불꽃을 흩뿌린다.', '하늘을 둥둥 떠다니며 커다란 불덩이를 내보낸다.'
]))
for id,s in data['species'].items():
 if not id.startswith('mc_'):continue
 move=data['moves'][s['signatureMove']]['name'];n=sum(e['kind']=='minecraft' for e in entries)+1
 entries.append({'id':id,'number':n,'name':s['name'],'kind':'minecraft','category':s.get('category','마인크래프트 몬스터'),'types':s['types'],'description':traits.get(id.removeprefix('mc_'),s.get('description','마인크래프트 세계에서 찾아온 친구.')),**({'height':s['height'],'weight':s['weight']} if 'height' in s else {}),'skill':move,'image':f'assets/battle/{id}-front.png'})
assert len(entries)==252+sum(id.startswith('mc_') for id in data['species'])
(out/'monster-dex.json').write_text(json.dumps({'version':1,'source':{'repository':'https://github.com/Narishma-gb/pokegold-kr','commit':'c90f31dadef17f033a8f1bdada701b26cef18241','files':['data/pokemon/dex_order_new.asm','data/pokemon/names.asm','data/pokemon/dex_entries/gold/','gfx/pokemon/']},'entries':entries},ensure_ascii=False,separators=(',',':')))
print('Built Gold 251 + Koraidon + Minecraft companions dex entries and 251 front sprites.')
