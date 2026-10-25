"""Render Gold's original town map tiles and export landmark metadata."""
from pathlib import Path
from PIL import Image
import re,json,sys,subprocess
r=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/pokemon-gold-kr-research');out=Path(__file__).resolve().parent.parent/'assets/town-map';out.mkdir(exist_ok=True)
gfx=r/'gfx/pokegear';tiles=Image.open(gfx/'town_map.png').convert('L')
colors=[tuple(round(int(n)*255/31) for n in rgb) for rgb in re.findall(r'RGB\s+(\d+),\s*(\d+),\s*(\d+)',(gfx/'pokegear.pal').read_text())]
pals=[];names=['BORDER','EARTH','MOUNTAIN','CITY','POI','POI_MTN']
for line in (gfx/'town_map_palette_map.asm').read_text().splitlines():
 if line.strip().startswith('townmappals '):pals.extend(names.index(n.strip()) for n in line.split('townmappals ')[1].split(','))
for region in ['johto','kanto']:
 data=(gfx/(region+'.bin')).read_bytes();assert len(data)==361 and data[-1]==255
 im=Image.new('RGB',(160,144))
 for i,tile in enumerate(data[:-1]):
  for y in range(8):
   for x in range(8):
    c=(255-tiles.getpixel(((tile%16)*8+x,(tile//16)*8+y)))//85;im.putpixel(((i%20)*8+x,(i//20)*8+y),colors[pals[tile]*4+c])
 im.save(out/(region+'.png'))
text=(r/'data/maps/landmarks.asm').read_text();constants=re.findall(r'^\s*const (LANDMARK_\w+)',(r/'constants/landmark_constants.asm').read_text(),re.M);rows=re.findall(r'^\s*landmark\s+(-?\d+),\s*(-?\d+),\s*(\w+)',text,re.M);labels=dict(re.findall(r'^(\w+):\s*db "([^"@]+)@"',text,re.M));assert len(rows)==len(constants)
kanto=constants.index('LANDMARK_PALLET_TOWN');landmarks=[]
for i,(x,y,label) in enumerate(rows):
 if i==0:continue
 landmarks.append({'id':constants[i],'name':labels[label],'x':int(x),'y':int(y),'region':'johto' if i<kanto else 'kanto'})
mapids=json.loads((out.parent/'maps.json').read_text());mapping={}
for line in (r/'data/maps/maps.asm').read_text().splitlines():
 m=re.search(r'^\s*map (\w+),.*?\b(LANDMARK_\w+)',line)
 if m and m[1] in mapids:mapping[m[1]]=m[2]
assert len(mapping)==len(mapids)
# Gold's cursor arrow, using the original transparent monochrome sprite.
arrow=Image.open(gfx/'pokegear_sprites.png').convert('RGBA').crop((0,0,16,16));arrow.putdata([(0,0,0,0) if p[0]>240 else (237,241,222,255) if p[0]>80 else (50,65,49,255) for p in arrow.getdata()]);arrow.save(out/'cursor.png')
(out/'map.json').write_text(json.dumps({'version':1,'maps':mapping,'landmarks':landmarks,'source':{'repository':'https://github.com/Narishma-gb/pokegold-kr','commit':subprocess.check_output(['git','-C',str(r),'rev-parse','HEAD'],text=True).strip(),'files':['gfx/pokegear/town_map.png','gfx/pokegear/johto.bin','gfx/pokegear/kanto.bin','gfx/pokegear/pokegear.pal','gfx/pokegear/town_map_palette_map.asm','data/maps/landmarks.asm','data/maps/maps.asm']}},ensure_ascii=False,indent=2)+'\n');print('Built original Johto/Kanto maps and',len(landmarks),'landmarks for',len(mapping),'playable maps.')
