import sys,struct,re,numpy as np,glob
PP=b'\x0c\x00\x00\x00\x64\x00\x00\x00\x02\x00\x00\x00'
IP=b'\x04\x00\x00\x00\x08\x00\x00\x00\x02\x00\x00\x00'
def faces(d):
    ints={}
    for m in re.finditer(re.escape(IP),d):
        o=m.end(); n=struct.unpack_from('<I',d,o)[0]
        if 0<n<2_000_000 and o+4+4*n<=len(d):
            ints[m.start()]=(o+4,n)
    keys=sorted(ints)
    import bisect
    out=[];stats={'ok':0,'bad':0}
    pos=[m for m in re.finditer(re.escape(PP),d)]
    i=0
    while i<len(pos)-1:
        s=pos[i].start(); o=pos[i].end(); n=struct.unpack_from('<I',d,o)[0]
        P=np.frombuffer(d,'<f4',n*3,o+4).reshape(-1,3)
        s2=pos[i+1].start(); o2=pos[i+1].end(); n2=struct.unpack_from('<I',d,o2)[0]
        if n2!=n: i+=1; continue
        N=np.frombuffer(d,'<f4',n*3,o2+4).reshape(-1,3)
        # find preceding int block with sum n
        k=bisect.bisect_left(keys,s)-1; strips=None
        for kk in range(k,max(k-4,-1),-1):
            oo,c=ints[keys[kk]]
            arr=np.frombuffer(d,'<u4',c,oo)
            if arr.sum()==n: strips=arr;break
        if strips is None: stats['bad']+=1; i+=2; continue
        stats['ok']+=1
        out.append((s,P,N,strips)); i+=2
    return out,stats
def tris(P,N,strips,mode='strip'):
    T=[];b=0
    for c in strips:
        for j in range(c-2):
            if mode=='strip':
                a,bb,cc=(b+j,b+j+1,b+j+2) if j%2==0 else (b+j+1,b+j,b+j+2)
            else: a,bb,cc=(b,b+j+1,b+j+2)
            T.append((a,bb,cc))
        b+=c
    return T
if __name__=='__main__':
    import trimesh
    mode=sys.argv[2]
    V=[];F=[];off=0
    for f in sorted(glob.glob(sys.argv[1])):
        d=open(f,'rb').read(); fs,st=faces(d); print(f,st)
        for s,P,N,strips in fs:
            t=np.array(tris(P,N,strips,mode))+off
            if len(t): F.append(t)
            V.append(P); off+=len(P)
    m=trimesh.Trimesh(np.vstack(V),np.vstack(F),process=False)
    print(m.bounds)
    m.export(sys.argv[3])
