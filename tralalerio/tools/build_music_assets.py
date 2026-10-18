"""Compile Gold ASM scores (not ROM/audio recordings) into browser sequencer data."""
from pathlib import Path
import re,json,sys,subprocess
r=Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/pokemon-gold-kr-research');out=Path(__file__).resolve().parent.parent/'assets/audio';out.mkdir(exist_ok=True)
program=[];labels={};files={};scope=''
for p in sorted((r/'audio/music').glob('*.asm')):
 for raw in p.read_text().splitlines():
  line=raw.split(';')[0].strip()
  if not line:continue
  if line.endswith(':'):
   label=line.rstrip(':');label=scope+label if label.startswith('.') else label
   if not line.startswith('.'):scope=label
   labels[label]=len(program);files[label]=str(p.relative_to(r));continue
  parts=line.split(None,1);op=parts[0];args=[a.strip() for a in parts[1].split(',')] if len(parts)>1 else []
  args=[scope+a if a.startswith('.') else a for a in args];program.append((op,args))
constants=re.findall(r'^\s*const (MUSIC_\w+)',(r/'constants/music_constants.asm').read_text(),re.M)
pointers=re.findall(r'^\s*dba (Music_\w+)',(r/'audio/music_pointers.asm').read_text(),re.M)
assert len(constants)==len(pointers)
lookup=dict(zip(constants,pointers));maps={};wanted=set()
mapids=json.loads((out.parent/'maps.json').read_text())
for line in (r/'data/maps/maps.asm').read_text().splitlines():
 m=re.search(r'^\s*map (\w+),.*?\b(MUSIC_\w+)',line)
 if m and m[1] in mapids:maps[m[1]]=lookup[m[2]];wanted.add(lookup[m[2]])
assert len(maps)==len(mapids),(set(mapids)-set(maps))
extra=['MUSIC_JOHTO_WILD_BATTLE','MUSIC_JOHTO_WILD_BATTLE_NIGHT','MUSIC_JOHTO_TRAINER_BATTLE','MUSIC_JOHTO_GYM_LEADER_BATTLE','MUSIC_RIVAL_BATTLE','MUSIC_ROCKET_BATTLE','MUSIC_WILD_VICTORY','MUSIC_TRAINER_VICTORY','MUSIC_GYM_VICTORY','MUSIC_YOUNGSTER_ENCOUNTER','MUSIC_LASS_ENCOUNTER','MUSIC_SAGE_ENCOUNTER','MUSIC_HIKER_ENCOUNTER','MUSIC_ROCKET_ENCOUNTER','MUSIC_RIVAL_ENCOUNTER']
encounterGroups={group.upper():music for music,group in re.findall(r'db (MUSIC_\w+)\s*; (\w+)',(r/'data/trainers/encounter_music.asm').read_text())}
used={t['group'] for t in json.loads((out.parent/'battle-data.json').read_text())['trainers'].values()}
extra=list(dict.fromkeys(extra+[encounterGroups[g] for g in sorted(used)]))
for id in extra:wanted.add(lookup[id])
def number(n):return int(n.replace('$','0x').replace('%','0b'),0) if n.startswith(('$','%')) else int(n)
notes={'C_':0,'C#':1,'D_':2,'D#':3,'E_':4,'F_':5,'F#':6,'G_':7,'G#':8,'A_':9,'A#':10,'B_':11}
# Original pulse frequencies, including the game's small register detunings.
freqs=[int(x,16) for x in re.findall(r'dw \$([0-9a-f]+)',(r/'audio/notes.asm').read_text())]
waves=[[int(n) for n in line.split('dn ')[1].split(',')] for line in (r/'audio/wave_samples.asm').read_text().splitlines() if '\tdn ' in line]
drumtext=(r/'audio/drumkits.asm').read_text();kits={};drums={}
for i in range(6):
 block=drumtext.split(f'Drumkit{i}:')[1].split('\n\n')[0];kits[i]=re.findall(r'dw (\w+)',block)
for m in re.finditer(r'^(\w+):\n((?:\s+noise_note[^\n]*\n)+)',drumtext,re.M):drums[m[1]]=[[number(a.strip()) for a in row.split(',')] for row in re.findall(r'noise_note ([^\n]+)',m[2])]
ignored={'volume','channel_count','channel','db'}
def compile_channel(label,ch,tempo):
 pc=labels[label];stack=[];loops={};seen={};events=[];clock=0.;length=12;octave=4;vol=10;env=0;duty=2;pan=0;transpose=0;kit=0;vibrato=[0,0,0];offset=0;loopStart=None
 for iteration in range(100000):
  seen.setdefault(pc,clock);op,args=program[pc];site=pc;pc+=1
  if op=='sound_call':stack.append(pc);pc=labels[args[0]];continue
  if op=='sound_ret':
   if not stack:break
   pc=stack.pop();continue
  if op=='sound_loop':
   count=number(args[0]);target=labels[args[1]]
   if count==0:
    if target not in seen:pc=target;continue
    loopStart=seen[target];break
   key=(site,tuple(stack));loops[key]=loops.get(key,0)+1
   if loops[key]<count:pc=target
   else:del loops[key]
   continue
  if op=='tempo':tempo=number(args[0])
  elif op=='note_type':length=number(args[0]);vol=number(args[1]);env=number(args[2]) if len(args)>2 else 0
  elif op=='drum_speed':length=number(args[0])
  elif op=='volume_envelope':vol=number(args[0]);env=number(args[1])
  elif op=='octave':octave=number(args[0])
  elif op=='duty_cycle':duty=number(args[0])
  elif op=='stereo_panning':pan=0 if args[0]==args[1] else -1 if args[0]=='TRUE' else 1
  elif op=='vibrato':vibrato=list(map(number,args))
  elif op=='transpose':transpose=number(args[0])*12+number(args[1])
  elif op=='pitch_offset':offset=number(args[0])
  elif op=='toggle_noise':kit=number(args[0]) if args else 0
  elif op in ['note','rest','drum_note']:
   duration=number(args[-1])*length*tempo/256/59.7275
   if op=='note':
    index=notes[args[0]]+transpose%12;raw=freqs[index]-65536;register=((raw >> max(0,octave-1-transpose//12))+offset)&2047;freq=131072/(2048-register)
    events.append([round(clock,6),round(duration,6),round(freq,5),vol,env,duty,pan,*vibrato])
   elif op=='drum_note':
    which=number(args[0]);name=kits[kit][which];events.append([round(clock,6),round(duration,6),drums[name],pan])
   clock+=duration
  elif op not in ignored:raise ValueError((label,op,args))
 else:raise ValueError('Unbounded score '+label)
 assert clock>0,label
 return {'channel':ch,'events':events,'duration':round(clock,6),'loopStart':None if loopStart is None else round(loopStart,6)}
manifest={'version':1,'encounterGroups':{g:encounterGroups[g] for g in sorted(used)},'maps':maps,'ids':{k:lookup[k] for k in extra},'tracks':{},'source':{'repository':'https://github.com/Narishma-gb/pokegold-kr','commit':subprocess.check_output(['git','-C',str(r),'rev-parse','HEAD'],text=True).strip()},'note':'Original score and map assignments; Web Audio pulse/wave/LFSR synthesis, not cycle-accurate Game Boy audio.'}
for name in sorted(wanted):
 pc=labels[name];chs=[]
 while program[pc][0] in ['channel_count','channel']:
  op,args=program[pc];pc+=1
  if op=='channel':chs.append((number(args[0]),args[1]))
 tempo=next((number(args[0]) for op,args in program[labels[chs[0][1]]:] if op=='tempo'),160)
 channels=[compile_channel(label,ch,tempo) for ch,label in chs]
 (out/(name+'.json')).write_text(json.dumps({'id':name,'channels':channels,'waves':waves},separators=(',',':')))
 manifest['tracks'][name]={'file':name+'.json','source':files[name],'duration':max(c['duration'] for c in channels)}
sfx=(r/'audio/sfx.asm').read_text();effects={}
for key,label,ch in [('confirm','Sfx_ReadText2_Ch5',1),('menu','Sfx_Menu_Ch8',4),('door','Sfx_EnterDoor_Ch8',4),('exit','Sfx_ExitBuilding_Ch8',4)]:
 block=sfx.split(label+':')[1].split('sound_ret')[0];events=[];clock=0.;duty=2
 for line in block.splitlines():
  line=line.strip()
  if line.startswith('duty_cycle'):duty=number(line.split()[1])
  m=re.match(r'(square_note|noise_note) (.*)',line)
  if not m:continue
  length,vol,env,freq=[number(x.strip()) for x in m[2].split(',')];duration=(length+1)/59.7275
  events.append([round(clock,6),round(duration,6),[[length,vol,env,freq]],0] if ch==4 else [round(clock,6),round(duration,6),131072/(2048-freq),vol,env,duty,0,0,0,0]);clock+=duration
 effects[key]={'channel':ch,'events':events,'duration':clock,'loopStart':None}
(out/'effects.json').write_text(json.dumps({'effects':effects,'waves':waves},separators=(',',':')))
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print(f'Compiled {len(wanted)} Gold scores for {len(maps)} maps plus battle, encounter and victory themes.')
