import json,glob,numpy as np,trimesh,sys
sys.path.insert(0,'.')
from tess2 import faces,tris
ents=json.load(open('dir.json'))
files={f.split('_')[-1]:open(f,'rb').read() for f in glob.glob('main_x/*FaceTess*0??')}
# chunk boundaries per file
byfile={}
for e in ents: byfile.setdefault(e['file'],[]).append(e)
res=[]
for f,es in byfile.items():
    d=files[f]; es.sort(key=lambda e:e['pos'])
    fs,_=faces(d)
    for k,e in enumerate(es):
        a=e['pos']; b=es[k+1]['pos'] if k+1<len(es) else len(d)
        V=[];F=[];off=0
        for s,P,N,st in fs:
            if a<=s<b:
                t=np.array(tris(P,N,st))
                if len(t): F.append(t+off)
                V.append(P); off+=len(P)
        if not F: continue
        m=trimesh.Trimesh(np.vstack(V),np.vstack(F),process=False)
        leaf=e['name'].split('/')[-1].split('@')[0]
        res.append((e['name'],leaf,m))
for n,l,m in res: print(len(m.faces), l, np.round(m.bounds*1000).astype(int).tolist())
import pickle; pickle.dump([(n,l,m.vertices,m.faces) for n,l,m in res],open('comps.pkl','wb'))
