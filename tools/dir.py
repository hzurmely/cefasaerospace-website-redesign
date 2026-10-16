import re,glob,json
d=open('main_x/16059351_FaceTessellations_Directory','rb').read()
ents=[]
for m in re.finditer(rb'\xff\xfe\xff(.)',d,re.S):
    n=m.group(1)[0]; e=m.end()+2*n; s=d[m.end():e].decode('utf-16le','replace')
    if '@' in s:
        rest=d[e:e+80]
        fm=re.search(rb'\xff\xfe\xff\x0b((?:0\x00|-\x00|[0-9]\x00){11})',rest)
        if fm:
            idb=rest[fm.start()-8:fm.start()]
            ents.append((s,idb.hex(),fm.group(1).decode('utf-16le')))
print(len(ents))
files={f.split('_')[-1]:open(f,'rb').read() for f in glob.glob('main_x/*FaceTess*0??')}
found=0;out=[]
for s,i,f in ents:
    dd=files.get(f); pos=dd.find(bytes.fromhex(i)) if dd else -1
    found+= pos>=0; out.append(dict(name=s,id=i,file=f,pos=pos))
print(found)
json.dump(out,open('dir.json','w'),ensure_ascii=False,indent=0)
for o in out[:5]: print(o)
