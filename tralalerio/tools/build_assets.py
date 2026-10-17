"""Build static PNG/JSON assets from the pinned public Korean disassembly.
No ROM is needed by this builder or the browser runtime.
"""
from pathlib import Path
from PIL import Image
import re,json,subprocess,sys
R=Path(sys.argv[1] if len(sys.argv)>1 else '/private/tmp/pokemon-gold-kr-research'); O=Path(__file__).resolve().parent.parent/'assets';O.mkdir(exist_ok=True)
specs=[('PlayersHouse2F','내 방','players_room','PLAYERS_HOUSE_2F'),('PlayersHouse1F','우리 집','players_house','PLAYERS_HOUSE_1F'),('NewBarkTown','연두마을','johto','NEW_BARK_TOWN'),('ElmsLab','공박사 연구소','lab','ELMS_LAB'),('PlayersNeighborsHouse','이웃집','house','PLAYERS_NEIGHBORS_HOUSE'),('ElmsHouse','공박사의 집','house','ELMS_HOUSE'),('Route29','29번 도로','johto','ROUTE_29'),('CherrygroveCity','무궁시티','johto','CHERRYGROVE_CITY'),('CherrygroveMart','무궁 프렌들리숍','mart','CHERRYGROVE_MART'),('CherrygrovePokecenter1F','무궁 포켓몬센터','pokecenter','CHERRYGROVE_POKECENTER_1F'),('CherrygroveGymSpeechHouse','트레이너의 집','house','CHERRYGROVE_GYM_SPEECH_HOUSE'),('GuideGentsHouse','안내 할아버지의 집','house','GUIDE_GENTS_HOUSE'),('CherrygroveEvolutionSpeechHouse','진화를 연구하는 집','house','CHERRYGROVE_EVOLUTION_SPEECH_HOUSE')]
# First badge chapter: preserve original map blocks, connections and event positions.
extra={'Route29Route46Gate':'29·46번 도로 게이트','Route46':'46번 도로','Route30':'30번 도로','Route30BerryHouse':'열매 할아버지의 집','MrPokemonsHouse':'포켓몬 할아버지의 집','Route31':'31번 도로','Route31VioletGate':'도라지 게이트','VioletCity':'도라지시티','VioletMart':'도라지 프렌들리숍','VioletGym':'도라지 체육관','EarlsPokemonAcademy':'포켓몬 학원','VioletNicknameSpeechHouse':'별명 이야기의 집','VioletPokecenter1F':'도라지 포켓몬센터','VioletKylesHouse':'교환하는 집','SproutTower1F':'모다피탑 1층','SproutTower2F':'모다피탑 2층','SproutTower3F':'모다피탑 3층','DarkCaveVioletEntrance':'어둠의 동굴 · 도라지 입구'}
# Second badge main route and its interiors use the original Gold layouts.
extra.update({'Route32':'32번 도로','Route32Pokecenter1F':'32번 도로 포켓몬센터','UnionCave1F':'연결동굴 1층','UnionCaveB1F':'연결동굴 지하 1층','UnionCaveB2F':'연결동굴 지하 2층','Route33':'33번 도로','AzaleaTown':'고동마을','AzaleaGym':'고동 체육관','AzaleaMart':'고동 프렌들리숍','AzaleaPokecenter1F':'고동 포켓몬센터','KurtsHouse':'강집의 집','CharcoalKiln':'숯 굽는 집','SlowpokeWellB1F':'야돈우물 지하 1층','SlowpokeWellB2F':'야돈우물 지하 2층','IlexForestAzaleaGate':'고동·너도밤나무숲 게이트'})
mapdefs=(R/'data/maps/maps.asm').read_text();attrs_text=(R/'data/maps/attributes.asm').read_text()
for name,label in extra.items():
 tileset=re.search(r'map '+name+r', TILESET_(\w+)',mapdefs)[1].lower()
 constant=re.search(r'map_attributes '+name+r', (\w+)',attrs_text)[1]
 specs.append((name,label,tileset,constant))
const=(R/'constants/map_constants.asm').read_text()
paltext=(R/'gfx/tilesets/bg_tiles.pal').read_text().split('; day')[1].split('; nite')[0]
pals=[]
for line in paltext.splitlines():
 if 'RGB' in line:
  v=list(map(int,re.findall(r'\d+',line.split(';')[0])));pals.append([tuple(round(c*255/31) for c in v[j:j+3]) for j in range(0,12,3)])
palnames=['GRAY','RED','GREEN','WATER','YELLOW','BROWN','ROOF','TEXT']
maps={}
for name,label,tileset,constant in specs:
 m=re.search(r'map_const\s+'+constant+r',\s*(\d+),\s*(\d+)',const);bw,bh=map(int,m.groups());w,h=bw*2,bh*2
 block_path=R/'maps'/f'{name}.blk'
 if not block_path.exists():
  block_source=(R/'data/maps/blocks.asm').read_text().split(name+'_Blocks:')[1]
  block_path=R/re.search(r'INCBIN \"([^\"]+)\"',block_source)[1]
 blocks=block_path.read_bytes();meta=(R/'data/tilesets'/f'{"cave" if tileset=="dark_cave" else tileset}_metatiles.bin').read_bytes();tiles=Image.open(R/'gfx/tilesets'/f'{tileset}.png').convert('L')
 palmap=[]
 palette_file=R/'gfx/tilesets'/f'{tileset}_palette_map.asm'
 if not palette_file.exists():
  aliases={'elite_four_room':'indigo_plateau','traditional_house':'house','dark_cave':'cave'}
  palette_file=R/'gfx/tilesets'/f'{aliases.get(tileset,tileset)}_palette_map.asm'
 for line in palette_file.read_text().splitlines():
  if 'tilepal' in line:palmap.extend([v.strip() for v in line.split(';')[0].split(',')[1:]])
 collision=[]
 for line in (R/'data/tilesets'/f'{"cave" if tileset=="dark_cave" else tileset}_collision.asm').read_text().splitlines():
  m=re.search(r'tilecoll\s+(.+?)(?:;|$)',line)
  if m:collision.append([x.strip() for x in m[1].split(',')])
 image=Image.new('RGB',(bw*32,bh*32));grid=[[] for _ in range(h)]
 for by in range(bh):
  for bx in range(bw):
   block=blocks[by*bw+bx]
   for ty in range(4):
    for tx in range(4):
     ti=meta[block*16+ty*4+tx];pi=palnames.index(palmap[ti]) if ti<len(palmap) and palmap[ti] in palnames else 0
     for y in range(8):
      for x in range(8):
       sy=(ti//16)*8+y;sx=(ti%16)*8+x
       v=tiles.getpixel((sx,sy)) if sy<tiles.height else 255
       image.putpixel((bx*32+tx*8+x,by*32+ty*8+y),pals[pi][(255-v)//85])
   for qy in range(2):
    for qx in range(2):
     c=collision[block][qy*2+qx];grid[by*2+qy].append(c)
 image.save(O/f'{name}.png')
 s=(R/'maps'/f'{name}.asm').read_text();warps=[];signs=[];objects=[]
 for line in s.splitlines():
  line=line.split(';')[0].strip()
  for token,dest in [('warp_event',warps),('bg_event',signs),('object_event',objects)]:
   if line.startswith(token+' '):
    a=[v.strip() for v in line[len(token):].split(',')];dest.append(a)
 texts={}
 for m in re.finditer(r'^(\w+):\s*\n((?:[ \t].*\n|\n)+)',s,re.M):
  lines=re.findall(r'^\s*(text|line|cont|para)\s+"([^"]*)"',m[2],re.M)
  if lines:
   pages=['']
   for cmd,t in lines:
    if cmd=='para' and pages[-1]:pages.append('')
    if pages[-1]:pages[-1]+='\n'
    pages[-1]+=t.replace('#','포켓몬')
   texts[m[1]]=pages
 connections=[]
 attrs=(R/'data/maps/attributes.asm').read_text().split('map_attributes '+name+',')[1].split('map_attributes')[0]
 for direction,dest,constant_name,offset in re.findall(r'connection (\w+), (\w+), (\w+), (-?\d+)',attrs):
  connections.append({'direction':direction,'map':dest,'offset':int(offset)})
 script_texts={}
 for match in re.finditer(r'^(\w+):\s*\n((?:[ \t].*\n|\n)+)',s,re.M):
  text_match=re.search(r'(?:writetext|jumptextfaceplayer|jumptext)\s+(\w+)',match[2])
  if text_match:script_texts[match[1]]=text_match[1]
 maps[name]={'connections':connections,'scriptTexts':script_texts,'id':name,'name':label,'constant':constant,'width':w,'height':h,'collision':grid,'warps':[{'x':int(a[0]),'y':int(a[1]),'map':a[2],'index':int(a[3])} for a in warps],'signs':[{'x':int(a[0]),'y':int(a[1]),'script':a[3]} for a in signs],'objects':[{'x':int(a[0]),'y':int(a[1]),'sprite':a[2].removeprefix('SPRITE_').lower(),'script':a[11],'flag':a[-1],'direction':a[3].removeprefix('SPRITEMOVEDATA_STANDING_').lower(),'kind':a[9],'range':int(a[10]) if a[10].isdigit() else 0} for a in objects], 'texts':texts}
for actor in maps.get('AzaleaTown',{}).get('objects',[]):
 if actor['sprite']=='azalea_rocket':actor['sprite']='rocket'
sprite_names={'chris'}|{o['sprite'] for m in maps.values() for o in m['objects']}
sprite_names={n for n in sprite_names if (R/'gfx/sprites'/f'{n}.png').exists()}
(O/'sprites.json').write_text(json.dumps(sorted(sprite_names)))
for name in sorted(sprite_names):
 src=Image.open(R/'gfx/sprites'/f'{name}.png').convert('L');im=Image.new('RGBA',src.size)
 colors=[(0,0,0,0),(222,164,70,255),(148,71,71,255),(42,48,49,255)]
 for y in range(src.height):
  for x in range(src.width):im.putpixel((x,y),colors[(255-src.getpixel((x,y)))//85])
 im.save(O/f'{name}.png')
(O/'maps.json').write_text(json.dumps(maps,ensure_ascii=False,separators=(',',':')))
(O/'provenance.json').write_text(json.dumps({'source':'https://github.com/Narishma-gb/pokegold-kr','commit':subprocess.check_output(['git','-C',str(R),'rev-parse','HEAD'],text=True).strip(),'note':'Static map layouts, tiles, collision declarations and sprites converted from public disassembly. Palette rendering approximated. Event logic reimplemented for this limited demo; full original script interpreter is not implemented.'},indent=2))
print('Built',len(maps),'maps; static PNG and JSON only.')
