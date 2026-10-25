"""Export the original shock emote used by SeenByTrainerScript (30 frames)."""
from pathlib import Path
from PIL import Image
import sys,json
r=Path(sys.argv[1] if len(sys.argv)>1 else '/private/tmp/pokemon-gold-kr-research');o=Path(__file__).resolve().parent.parent/'assets'
s=(r/'engine/events/trainer_scripts.asm').read_text();assert 'showemote EMOTE_SHOCK, LAST_TALKED, 30' in s
rival=(r/'maps/CherrygroveCity.asm').read_text();movement=rival.split('CherrygroveCity_RivalWalksToYou:')[1].split('step_end')[0];assert movement.count('step LEFT')==5;assert 'showemote EMOTE_SHOCK, PLAYER, 15' in rival
src=Image.open(r/'gfx/emotes/shock.png').convert('L');out=Image.new('RGBA',src.size)
# White speech bubble and dark exclamation retain the original 16x16 pixels.
colors=[(255,253,240,255),(190,201,165,255),(92,112,78,255),(41,60,50,255)]
for y in range(src.height):
 for x in range(src.width):out.putpixel((x,y),colors[(255-src.getpixel((x,y)))//85])
# The outer corners are the original transparent color, separate from the white bubble.
from collections import deque
q=deque([(0,0),(15,0),(0,15),(15,15)]);seen=set();bg=src.getpixel((0,0))
while q:
 x,y=q.popleft()
 if not(0<=x<16 and 0<=y<16) or (x,y) in seen or src.getpixel((x,y))!=bg:continue
 seen.add((x,y));out.putpixel((x,y),(0,0,0,0));q.extend([(x+1,y),(x-1,y),(x,y+1),(x,y-1)])
out.save(o/'trainer-shock.png');(o/'trainer-encounter-source.json').write_text(json.dumps({'source':'Narishma-gb/pokegold-kr','commit':'c90f31dadef17f033a8f1bdada701b26cef18241','emoteFrames':30,'rival':{'rows':[6,7],'fromX':39,'toX':34,'stepsLeft':5,'playerShockFrames':15,'pauseFrames':15},'files':['engine/events/trainer_scripts.asm','engine/overworld/player_object.asm','gfx/emotes/shock.png','maps/CherrygroveCity.asm']},indent=2))
