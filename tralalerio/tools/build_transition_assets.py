# -*- coding: utf-8 -*-
"""Export the original outdoor SpinToBlack tile masks, no ROM required."""
from pathlib import Path
import re,json,sys
r=Path(sys.argv[1] if len(sys.argv)>1 else '/private/tmp/pokemon-gold-kr-research');s=(r/'engine/battle/battle_transition.asm').read_text();s=s.split('StartTrainerBattle_SpinToBlack:')[1].split('StartTrainerBattle_SetUpForRandomScatterOutro:')[0]
wedges={k:list(map(int,re.findall(r'-?\d+',v))) for k,v in re.findall(r'\.wedge(\d): db ([^\n]+)',s)}
frames=[];covered=set()
for quadrant,wedge,x,y in re.findall(r'spin_quadrant (\w+),\s+\.wedge(\d),\s+(\d+),\s+(\d+)',s):
 x,y=int(x),int(y);right='RIGHT' in quadrant;lower='LOWER' in quadrant;values=wedges[wedge];i=0;tiles=[]
 while i<len(values):
  count=values[i];i+=1
  for t in range(count):
   address=y*20+x+(t if right else -t)
   assert 0<=address<360,(quadrant,x,y,address)
   tiles.append(address);covered.add(address)
  offset=values[i];i+=1
  if offset==-1:break
  y+=-1 if lower else 1;x+=-offset if right else offset
 frames.append({'quadrant':quadrant,'tiles':tiles})
assert len(frames)==20
out=Path(__file__).resolve().parent.parent/'assets/transition-spin.json'
out.write_text(json.dumps({'width':20,'height':18,'tileSize':8,'frames':frames,'source':'https://github.com/Narishma-gb/pokegold-kr/blob/c90f31dadef17f033a8f1bdada701b26cef18241/engine/battle/battle_transition.asm','routine':'StartTrainerBattle_SpinToBlack','note':'Original ordered tile wedges. Palette pulse and overall timing adapted for web; reduced motion uses a fade.'},separators=(',',':')))
print('Spin frames:',len(frames),'covered tiles:',len(covered),'/360')
