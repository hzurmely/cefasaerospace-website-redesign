import numpy as np,glob,sys,re
def find(d,step=1):
    out=[]
    n=len(d)
    arr={}
    for off in range(0,8):
        a=np.frombuffer(d[off:off+((n-off)//8)*8],'<f8')
        arr[off]=a
    for off,a in arr.items():
        # candidate rotation: 9 consecutive doubles with |v|<=1 forming orthonormal
        ok=np.isfinite(a)&(np.abs(a)<=1.0000001)
        # sliding window of 9 all ok
        c=np.convolve(ok.astype(int),np.ones(9,int),'valid')==9
        for i in np.nonzero(c)[0]:
            R=a[i:i+9].reshape(3,3)
            if abs(np.linalg.det(R)-1)<1e-6 and np.allclose(R@R.T,np.eye(3),atol=1e-6):
                t=a[i+9:i+12]
                if len(t)==3 and np.all(np.abs(t)<1):
                    out.append((off+i*8,R,t))
    return sorted(out,key=lambda x:x[0])
if __name__=='__main__':
    for f in sys.argv[1:]:
        d=open(f,'rb').read(); o=find(d); print(f,len(o))
        for p,R,t in o[:15]: print(p,np.round(R,3).tolist(),np.round(t*1000,2).tolist())
