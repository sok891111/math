# -*- coding: utf-8 -*-
"""Reconstruct original battle-animation OAM frames from public disassembly.
Only static PNG/JSON is shipped. Game Boy sprite placement/flips and frame waits
are decoded here; web trajectories are implemented separately.
"""
from pathlib import Path
from PIL import Image,ImageOps
import re,json,sys
R=Path(sys.argv[1] if len(sys.argv)>1 else '/private/tmp/pokemon-gold-kr-research');O=Path(__file__).resolve().parent.parent/'assets/animations';O.mkdir(exist_ok=True)
oam=(R/'data/battle_anims/oam.asm').read_text();frames=(R/'data/battle_anims/framesets.asm').read_text()
sets={}
for base,count,label,name in re.findall(r'battleanimoam \$([0-9a-f]+),\s*(\d+), (\.\w+) ; (BATTLE_ANIM_OAMSET_\w+)',oam):sets[name]=(int(base,16),int(count),label)
palettes={'gray':[(255,255,255,0),(206,206,206,255),(107,107,107,255),(0,0,0,255)],'yellow':[(255,255,255,0),(255,255,58,255),(255,132,8,255),(0,0,0,255)],'red':[(255,255,255,0),(255,156,197,255),(247,82,49,255),(0,0,0,255)],'blue':[(255,255,255,0),(66,99,255,255),(8,33,255,255),(0,0,0,255)],'green':[(255,255,255,0),(99,206,8,255),(41,115,0,255),(0,0,0,255)]}
spec={'scratch':('CutDownLeft','cut','gray'),'slash':('CutLongDownLeft','cut','gray'),'hit':('HitBig','hit','gray'),'smallHit':('Hit','hit','gray'),'leer':('Leer','beam','yellow'),'leerTip':('BeamTip','beam','yellow'),'fire':('Ember','fire','red'),'water':('WaterGun1','water','blue'),'water2':('WaterGun2','water','blue'),'sound':('Sound1','noise','gray'),'sound2':('Sound2','noise','gray'),'sound3':('Sound3','noise','gray'),'wind':('Gust','wind','gray'),'sand':('Sand','sand','gray'),'powder':('Powder','powder','green'),'leaf':('RazorLeaf1','plant','green'),'screen':('Reflect','reflect','yellow'),'bite':('Bite1','hit','gray'),'shine':('ForesightShine','shine','yellow'),'ball':('PokeBall1','pokeball','red'),'ballOpen':('PokeBall2','pokeball','red'),'ballContact':('PokeBall3','pokeball','red'),'ballClosed':('PokeBall4','pokeball','red'),'ballWobble':('PokeBall5','pokeball','red'),'ballPoof':('BallPoof','smoke','gray')}
manifest={}
for key,(label,gfx,palette) in spec.items():
 block=frames.split('.Frameset_'+label+':')[1].split('\n.')[0];timeline=[]
 src=Image.open(R/'gfx/battle_anims'/f'{gfx}.png').convert('L')
 tiles=[src.crop((x,y,x+8,y+8)) for y in range(0,src.height,8) for x in range(0,src.width,8)]
 if gfx=='pokeball':
  # Makefile: tools/gfx --remove-xflip --keep-whitespace. OAM indexes
  # refer to this packed tile stream, not the unprocessed PNG tile grid.
  packed=[]
  for tile in tiles:
   mirrored=ImageOps.mirror(tile).tobytes()
   whitespace=tile.getextrema()==(255,255)
   if not whitespace and any(old.tobytes()==mirrored for old in packed):continue
   packed.append(tile)
  tiles=packed

 def build_frame(setname,flags):
  base,count,ptr=sets[setname];s=oam.split(ptr+':')[1];pixels=Image.new('RGBA',(128,128));rows=re.findall(r'dbsprite\s+(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*(-?\d+),\s*\$([0-9a-f]+),\s*(.+)',s)[:count]
  assert len(rows)==count,(setname,len(rows),count)
  for xt,yt,xp,yp,tile,flag in rows:
   index=base+int(tile,16)
   assert index<len(tiles),(key,index,len(tiles))
   raw=tiles[index]
   im=Image.new('RGBA',(8,8))
   for y in range(8):
    for x in range(8):im.putpixel((x,y),palettes[palette][(255-raw.getpixel((x,y)))//85])
   if 'OAM_XFLIP' in flag:im=ImageOps.mirror(im)
   if 'OAM_YFLIP' in flag:im=ImageOps.flip(im)
   pixels.alpha_composite(im,(64+int(xt)*8+int(xp),64+int(yt)*8+int(yp)))
  if 'B_OAM_XFLIP' in flags:pixels=ImageOps.mirror(pixels)
  if 'B_OAM_YFLIP' in flags:pixels=ImageOps.flip(pixels)
  return pixels
 images=[]
 for line in block.splitlines():
  m=re.search(r'oamframe (\w+),\s*(\d+)(.*)',line)
  if m:images.append(build_frame(m[1],m[3]));timeline.append({'index':len(images)-1,'frames':int(m[2])})
  m=re.search(r'oamwait (\d+)',line)
  if m:timeline.append({'index':-1,'frames':int(m[1])})
 assert images,key
 sheet=Image.new('RGBA',(len(images)*128,128))
 for i,im in enumerate(images):sheet.alpha_composite(im,(128*i,0))
 sheet.save(O/(key+'.png'));manifest[key]={'image':key+'.png','cell':128,'anchor':[64,64],'timeline':timeline,'loop':'oamrestart' in block,'sourceFrameset':label,'gfx':gfx,'packing':'remove-xflip,keep-whitespace' if gfx=='pokeball' else 'raw'}
manifest['_source']={'repository':'https://github.com/Narishma-gb/pokegold-kr','commit':'c90f31dadef17f033a8f1bdada701b26cef18241','note':'Original OAM tile offsets, flips, palettes and frame durations. JS motion paths and screen effects approximate original routines.'}
(O/'frames.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':')))
print('Built',len(spec),'original animation framesets')
