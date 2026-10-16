import sys, zlib, struct, re, os
d=open(sys.argv[1],'rb').read()
out=sys.argv[2]; os.makedirs(out,exist_ok=True)
def rol(b,n): return ((b<<n)|(b>>(8-n)))&0xff
idx=[m.start() for m in re.finditer(b'\x14\x00\x06\x00\x08\x00',d)]
print(len(idx),'markers')
for i in idx[:400]:
    h=d[i:i+40]
    # try to find fields
    try:
        csize,usize,nlen=struct.unpack('<III',d[i+14:i+26])
    except: continue
    if nlen>200 or csize>len(d): 
        continue
    nm=d[i+26:i+26+nlen]
    best=None
    for r in range(8):
        s=bytes(rol(b,r) for b in nm)
        if all(32<=c<127 for c in s): best=s.decode(); break
    data=d[i+26+nlen:i+26+nlen+csize]
    try: u=zlib.decompress(data,-15)
    except Exception as e: u=None
    print(i,csize,usize,nlen,best, len(u) if u else None)
    if u and best:
        fn=re.sub(r'[^A-Za-z0-9_.-]','_',best)
        open(f'{out}/{i}_{fn}','wb').write(u)
