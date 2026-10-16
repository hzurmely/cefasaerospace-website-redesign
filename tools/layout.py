import sys,re,json,pickle,numpy as np,trimesh,fast_simplification as fs
sys.path.insert(0,'.')
from xf import find
import warnings;warnings.filterwarnings('ignore')
comps=pickle.load(open('comps.pkl','rb'))  # (fullname, leaf, V, F)
def path(n): return [p.split('@')[0] for p in n.split('/')]
def mesh(V,F): return trimesh.Trimesh(np.asarray(V,float),np.asarray(F),process=False)
def simp(m,target):
    if len(m.faces)<=target: return m
    v,f=fs.simplify(m.vertices.astype(np.float32),m.faces.astype(np.int32),target_reduction=1-target/len(m.faces))
    return mesh(v,f)
def group(prefix_levels):
    out={}
    for n,l,V,F in comps:
        p=path(n); k=' > '.join(p[:prefix_levels])
        out.setdefault(k,[]).append(mesh(V,F))
    return out
def by_leaf(sub):
    for n,l,V,F in comps:
        if sub in l: return mesh(V,F)
    raise KeyError(sub)
def by_prefix(pref):
    ms=[mesh(V,F) for n,l,V,F in comps if ' > '.join(path(n)).startswith(pref)]
    return trimesh.util.concatenate(ms)
# transforms from Config-0
d=open('main_x/58011_Contents_Config-0','rb').read()
names=[(m.start(),d[m.end():m.end()+2*m.group(1)[0]].decode('utf-16le','replace')) for m in re.finditer(rb'\xff\xfe\xff(.)',d,re.S)]
XF=[]
for p,R,t in find(d):
    nb=[s for q,s in names if q<p and s]; last=nb[-1] if nb else ''
    if last.startswith('*') or not last: continue
    XF.append((last,R,t))
def apply(m,R,t):
    m=m.copy(); m.vertices=m.vertices@R+t; return m
def flat(m, x, z, y0, rot=0, flip=False, axis=None):
    """rotate thinnest axis to +Y, rotate about Y by rot deg, place min y at y0 and center xz at (x,z) mm"""
    m=m.copy(); ext=m.extents; a=int(np.argmin(ext)) if axis is None else axis
    if a==0: M=trimesh.transformations.rotation_matrix(np.pi/2,[0,0,1])
    elif a==2: M=trimesh.transformations.rotation_matrix(-np.pi/2,[1,0,0])
    else: M=np.eye(4)
    m.apply_transform(M)
    if flip: m.apply_transform(trimesh.transformations.rotation_matrix(np.pi,[1,0,0]))
    if rot: m.apply_transform(trimesh.transformations.rotation_matrix(np.radians(rot),[0,1,0]))
    b=m.bounds; c=(b[0]+b[1])/2
    m.apply_translation([x/1000-c[0], y0/1000-b[0][1], z/1000-c[2]]); return m
nodes={}
def add(node,mat,m,target=None):
    if target: m=simp(m,target)
    nodes.setdefault(node,[]).append((mat,m))
# ---- estrutura (world coords already)
for leaf,node in [('parte 1 (NO)','estrutura_no'),('parte 2 (LS)','estrutura_ls'),('(tampa-superior)','tampa_sup'),('(tampa_inferior)','tampa_inf')]:
    add(node,'alu',by_leaf(leaf))
# ---- fixação: spacers/screws/nuts with transforms
proto={'Espaçador macho femea':simp(by_leaf('Espaçador macho femea'),300),
       'Espaçador femea femea':simp(by_leaf('Espaçador femea femea'),300),
       'Parafuso allen M2.5':simp(by_leaf('Parafuso allen M2.5'),300),
       'Rosca M3':simp(by_leaf('Rosca M3'),200)}
wheelR=None
for name,R,t in XF:
    for k,m in proto.items():
        if name.startswith(k): add('fixacao','steel',apply(m,R,t))
    if name.startswith('FCP01_Roda'): wheelR=(R,t)
# ---- ADCS
wheel=trimesh.util.concatenate(list(trimesh.load('wheel_step.glb').geometry.values()))
add('adcs','wheelmat',flat(wheel,0,0,20.3,axis=2))
sup=by_leaf('suporte para motor'); sup.apply_translation([0,0.003,0]); add('adcs','dark',sup)
mot=by_leaf('motor satélite'); mot.apply_translation([0,0.0203-mot.bounds[1][1]+0.0,0]); add('adcs','motor',mot,8000)
# ---- boards
BY={'eps_reg':73,'obc':98.5,'eps_ger':124,'payload':161.5}
def board(node,leaf,y):
    b=by_leaf(leaf); b.apply_translation([0,y/1000-b.bounds[0][1],0]); add(node,'pcb',b); return y+1.6
t=board('eps_reg','placa PCB-1',BY['eps_reg'])
add('eps_reg','bluemod',flat(by_leaf('XL4015_MODELO_PISTAS'),-4,-18,t),15000)
mt=trimesh.util.concatenate([by_leaf(k) for k in ['MT3608_PCB','MT3608_pad','MT3608_silkscreen','MT3608_soldermask.step']]); add('eps_reg','bluemod',flat(mt,-10,20,t,rot=90),3000)
add('eps_reg','green',flat(by_prefix('Montagem placa EPS reguladores-1 > TBlock2vias'),28,24,t,rot=90))
add('eps_reg','cap',flat(by_leaf('CAP_ALU_THT2SMD'),27,-8,t,axis=1))
add('eps_reg','dark',flat(by_leaf('JACK_KRE'),-30,28,t))
t=board('obc','placa PCB (OBC e TT&C)',BY['obc'])
add('obc','dark',flat(by_leaf('esp32_Wroom'),-14,0,t),12000)
add('obc','pcbblue',flat(by_leaf('Acelerômetro-e-Giroscópio'),18,4,t))
add('obc','pcbblue',flat(by_leaf('microSD module'),18,27,t,rot=90))
t=board('eps_ger','placa PCB (EPS geração)',BY['eps_ger'])
hold=flat(by_leaf('keystone-PN1124'),-12,0,t,axis=1); add('eps_ger','dark',hold,15000)
cell=by_leaf('21700'); cell=flat(cell,-12,0,t+1.5,axis=1); 
add('eps_ger','cell',cell,4000)
add('eps_ger','pcbblue',flat(by_leaf('HW-391'),24,-20,t,rot=90),12000)
ina=by_leaf('Printed Circuit Board.step'); st=by_leaf('Screw Terminal'); st.apply_translation([0.0,-0.006,0.002]); add('eps_ger','pcbblue',flat(ina,26,18,t,axis=2)); add('eps_ger','green',flat(st,26,10,t+1.6,axis=1),2000)
t=board('payload','placa PCB (Payload)',BY['payload'])
rb=by_leaf('Board.step'); hd=by_leaf('HDRV40'); hd.apply_translation([0.0085,0.028,0.002])
cm=flat(trimesh.util.concatenate([rb,hd]),0,-16,t,axis=2); nb=len(rb.faces)
add('payload','pcb2',cm.submesh([np.arange(nb)],append=True)); add('payload','dark',cm.submesh([np.arange(nb,len(cm.faces))],append=True),2000)
rtl=[mesh(V,F) for n,l,V,F in comps if 'RTL_SDR' in n and l.split('.')[0] in ('main_body','face_sma')]
add('payload','rtl',flat(trimesh.util.concatenate(rtl),2,20,t),4000)
# export
MATS={'alu':([0.78,0.80,0.83,1],0.85,0.38),'steel':([0.6,0.62,0.65,1],0.9,0.35),'pcb':([0.10,0.30,0.20,1],0.1,0.6),
'pcb2':([0.12,0.40,0.22,1],0.1,0.6),'pcbblue':([0.10,0.25,0.62,1],0.1,0.55),'bluemod':([0.12,0.30,0.70,1],0.1,0.55),
'green':([0.16,0.55,0.25,1],0.0,0.6),'cap':([0.75,0.77,0.8,1],0.8,0.3),'dark':([0.08,0.09,0.10,1],0.2,0.6),
'motor':([0.55,0.57,0.6,1],0.8,0.35),'wheelmat':([0.70,0.72,0.75,1],0.95,0.25),'cell':([0.15,0.35,0.70,1],0.2,0.4),'rtl':([0.2,0.21,0.23,1],0.7,0.4)}
sc=trimesh.Scene()
tot=0
for node,items in nodes.items():
    bymat={}
    for mat,m in items: bymat.setdefault(mat,[]).append(m)
    for mat,ms in bymat.items():
        m=trimesh.util.concatenate(ms); m.merge_vertices(); m=m.smooth_shaded if False else trimesh.graph.smooth_shade(m,angle=np.radians(35))
        c,met,rough=MATS[mat]
        m.visual=trimesh.visual.TextureVisuals(material=trimesh.visual.material.PBRMaterial(name=mat,baseColorFactor=c,metallicFactor=met,roughnessFactor=rough,doubleSided=True))
        sc.add_geometry(m,node_name=f'{node}__{mat}',geom_name=f'{node}__{mat}')
        tot+=len(m.faces); print(node,mat,len(m.faces))
print('total',tot, sc.bounds)
sc.export('fcp01_raw.glb',include_normals=True)
