"""Select Gold's conditional wild table instead of accidentally counting both versions."""
import re

def gold_only(source):
    out=[];active=True;stack=[]
    for line in source.splitlines():
        m=re.match(r'\s*(IF|ELIF) DEF\(_(GOLD|SILVER)\)',line)
        if m:
            command,version=m.groups()
            if command=='IF':stack.append((active,version=='GOLD'))
            else:
                parent,taken=stack[-1];stack[-1]=(parent,taken or version=='GOLD')
            parent,taken=stack[-1]
            active=parent and version=='GOLD'
        elif re.match(r'\s*ENDC\b',line):active=stack.pop()[0]
        else:
            if active:out.append(line)
    if stack:raise ValueError('Unclosed version conditional')
    return '\n'.join(out)

def grass_table(source,constant):
    match=re.search(r'def_grass_wildmons '+re.escape(constant)+r'\s*\n(.*?)end_grass_wildmons',gold_only(source),re.S)
    if not match:return None
    slots=[{'level':int(level),'species':species.lower()} for level,species in re.findall(r'db\s+(\d+),\s+(\w+)',match[1])]
    rates=[int(n)*255//100 for n in re.findall(r'(\d+) percent',match[1])]
    if len(slots)!=21 or len(rates)!=3:raise ValueError('Malformed Gold wild table: '+constant)
    return {'slots':slots,'rates':dict(zip(['morning','day','night'],rates))}
