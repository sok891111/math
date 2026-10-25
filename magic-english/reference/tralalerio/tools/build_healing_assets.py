"""Extract Gold healing machine graphics, OAM, timing and music; no ROM required."""
from pathlib import Path
from PIL import Image
import re,json,sys,subprocess,wave,math,struct
r=Path(sys.argv[1] if len(sys.argv)>1 else '/private/tmp/pokemon-gold-kr-research');o=Path(__file__).resolve().parent.parent/'assets/healing';o.mkdir(parents=True,exist_ok=True)
s=(r/'engine/events/heal_machine_anim.asm').read_text();
assert re.search(r'ld c, 30\s+call DelayFrames',s)
assert re.search(r'FlashPalettes8Times:\s+ld c, 8',s)
assert re.search(r'call \.FlashPalettes\s+ld c, 10',s)
pal=[tuple(round(int(c)*255/31) for c in rgb) for rgb in re.findall(r'RGB\s+(\d+),\s*(\d+),\s*(\d+)',(r/'gfx/overworld/heal_machine.pal').read_text())]
src=Image.open(r/'gfx/overworld/heal_machine.png').convert('L')
for cycle in range(4):
 im=Image.new('RGBA',src.size)
 for y in range(src.height):
  for x in range(src.width):
   index=(255-src.getpixel((x,y)))//85;im.putpixel((x,y),(*pal[(index+cycle)%4],0 if index==0 else 255))
 im.save(o/f'machine-{cycle}.png')
block=s.split('.PC_ElmsLab_OAM:')[1].split('.HealMachineGFX:')[0]
rows=re.findall(r'dbsprite\s+(\d+),\s*(\d+),\s*(\d+),\s*(\d+),\s*\$([0-9a-f]+),([^\n]+)',block)
oam=[{'x':int(x)*8+int(xp)-8,'y':int(y)*8+int(yp)-16,'tile':int(tile,16)-0x7c,'flip':'OAM_XFLIP' in flags} for x,y,xp,yp,tile,flags in rows]
assert len(oam)==8
music=(r/'audio/music/healpokemon.asm').read_text();tempo=int(re.search(r'tempo (\d+)',music)[1]);channels=[]
notes={'C_':0,'C#':1,'D_':2,'D#':3,'E_':4,'F_':5,'F#':6,'G_':7,'G#':8,'A_':9,'A#':10,'B_':11}
for index in range(1,4):
 section=music.split(f'Music_HealPokemon_Ch{index}:')[1].split('Music_HealPokemon_Ch')[0];octave=4;volume=8;cursor=0;events=[];slide=None;length=12
 for line in section.splitlines():
  m=re.search(r'note_type (\d+), (\d+), (\d+)',line)
  if m:length,volume,_=map(int,m.groups())
  m=re.search(r'octave (\d+)',line)
  if m:octave=int(m[1])
  m=re.search(r'pitch_slide (\d+), (\d+), (\w[#_]?)',line)
  if m:slide={'octave':int(m[2]),'pitch':m[3]}
  m=re.search(r'^\s*(note|rest)\s+(?:(\w[#_]?)[, ]+)?(\d+)',line)
  if not m:continue
  kind,pitch,duration=m.groups();seconds=int(duration)*length*tempo/256/60
  if kind=='note':events.append({'start':cursor,'duration':seconds,'midi':12*(octave+1)+notes[pitch],'volume':volume,'slide':slide})
  cursor+=seconds;slide=None
 channels.append(events)
sample_rate=22050;duration=max(e['start']+e['duration'] for ch in channels for e in ch);buffer=[0.0]*int((duration+.12)*sample_rate)
for ch,events in enumerate(channels):
 for event in events:
  frequency=440*2**((event['midi']-69)/12);phase=0
  for i in range(int(event['duration']*sample_rate)):
   at=int(event['start']*sample_rate)+i
   if at>=len(buffer):break
   t=i/sample_rate;env=min(1,t/.008)*max(0,1-t/event['duration'])**.35;f=frequency
   if event['slide']:
    slide=event['slide'];target=440*2**((12*(slide['octave']+1)+notes[slide['pitch']]-69)/12);f=frequency+(target-frequency)*min(1,t/.04)
   phase+=f/sample_rate;waveform=(1 if phase%1<.5 else -1) if ch<2 else (1-4*abs(phase%1-.5));buffer[at]+=waveform*env*(.07 if ch==2 else event['volume']/12*.09)
with wave.open(str(o/'heal.wav'),'wb') as w:w.setparams((1,2,sample_rate,0,'NONE','not compressed'));w.writeframes(b''.join(struct.pack('<h',int(max(-1,min(1,v))*32767)) for v in buffer))
meta={'source':{'repository':'https://github.com/Narishma-gb/pokegold-kr','commit':subprocess.check_output(['git','-C',str(r),'rev-parse','HEAD'],text=True).strip(),'files':['engine/events/heal_machine_anim.asm','engine/events/std_scripts.asm','gfx/overworld/heal_machine.png','gfx/overworld/heal_machine.pal','audio/music/healpokemon.asm']},'oam':oam,'frames':{'take':20,'turn':10,'perBall':30,'flashes':8,'perFlash':10,'return':30,'face':10,'bowUp':10,'bowDown':10},'music':{'tempo':tempo,'duration':duration,'channels':channels},'anchor':{'x':8,'y':8},'note':'Original graphic palette, OAM and frame sequence. WAV synthesizes the original three note tracks with web-compatible envelopes; it is not an emulated hardware recording.'}
(o/'source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');print('Built healing tiles, OAM, frame waits and three-track melody.')
