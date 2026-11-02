import numpy as np, wave
sr=48000; D=31.64; N=int(sr*D); rs=np.random.RandomState(7)
L=np.zeros(N); R=np.zeros(N)
def lp(x,fc):
    a=np.exp(-2*np.pi*fc/sr); y=np.empty_like(x); s=0.0
    for i in range(len(x)): s=(1-a)*x[i]+a*s; y[i]=s
    return y
def hp(x,fc): return x-lp(x,fc)
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*sr); n=min(len(sig),N-i)
    if n<=0: return
    L[i:i+n]+=sig[:n]*g*(1-max(pan,0)); R[i:i+n]+=sig[:n]*g*(1+min(pan,0))
def tt(d): return np.arange(int(d*sr))/sr
def clang(d=2.6,base=1.0):
    t=tt(d); s=np.zeros_like(t)
    for f,a,k in [(211,1,2.2),(347,.7,2.8),(563,.8,3.4),(911,.55,4.5),(1423,.42,6),(2231,.3,8),(3517,.2,11)]:
        s+=a*np.sin(2*np.pi*f*base*t+rs.rand()*6)*np.exp(-k*t)
    n=hp(rs.randn(len(t)),1800)*np.exp(-t*34)*0.9
    th=np.sin(2*np.pi*(52*t+18/9*(1-np.exp(-9*t))))*np.exp(-t*7)*1.5
    return (s/3+n+th)
def boom(d=1.8,f=44):
    t=tt(d); return np.sin(2*np.pi*(f*t+30/10*(1-np.exp(-10*t))))*np.exp(-t*3.2)
def whoosh(d=.5,fc=900):
    t=tt(d); e=np.sin(np.pi*np.clip(t/d,0,1))**2; return lp(hp(rs.randn(len(t)),fc*.3),fc*2)*e*.6
def hiss(d):
    t=tt(d); e=np.minimum(t/.3,1)*np.minimum((d-t)/.4,1); m=.7+.3*np.sin(2*np.pi*5.5*t); return hp(rs.randn(len(t)),4200)*e*m*.5
def tink(f):
    t=tt(.5); return (np.sin(2*np.pi*f*t)+.5*np.sin(2*np.pi*f*2.76*t))*np.exp(-t*16)
def riser(d):
    t=tt(d); e=(t/d)**2.4; return lp(hp(rs.randn(len(t)),500),6000)*e*.5
# Bed: dark drone that resolves into a warm major pad when the cross appears.
t=np.arange(N)/sr
drone=(np.sin(2*np.pi*55*t)+.6*np.sin(2*np.pi*82.6*t+1)+.35*np.sin(2*np.pi*110.3*t+2))
wind=lp(rs.randn(N),320)*2.6
env=np.interp(t,[0,.7,24.4,25.2,D-1.6,D],[.55,.8,1,.5,.42,0])
L+=drone*env*.045+wind*env*.05; R+=drone*env*.045+wind[::-1]*env*.05
pad=np.zeros(N)
for f,a in [(110,1),(164.8,.8),(220,.7),(277.2,.6),(329.6,.42),(440,.22)]:
    pad+=a*np.sin(2*np.pi*f*t+.0015*f*np.sin(2*np.pi*.17*t))
penv=np.interp(t,[0,22.3,24.7,27.4,29.5,D-1.2,D],[0,0,.45,.6,1,1,0])
L+=pad*penv*.03; R+=pad*penv*.03
# Hits
add(clang(),.90,.34); add(boom(),.90,.34)
add(boom(1.6,38),3.56,.34); add(whoosh(.5,700),3.3,.2)
add(whoosh(.45,1100),4.42,.18,-.3); add(hiss(1.8),4.55,.06,.3); add(hiss(1.6),4.7,.05,-.4)
add(whoosh(.3,1500),5.42,.2,.5); add(boom(.8,60),5.7,.18)
add(riser(1.0),5.5,.0)
add(whoosh(1.2,500),6.5,.16); add(boom(1.2,48),8.34,.3); add(tink(1760),7.4,.05); add(tink(2349),7.46,.04)
add(tink(880),10.56,.05); add(tink(1320),10.62,.05); add(tink(1760),10.7,.04)
add(riser(1.25),11.34,.2); add(boom(1.4,40),12.68,.22)
add(riser(.62),14.86,.16); add(clang(2.4,.92),15.50,.36); add(boom(),15.50,.36)
for tm,f,g in [(16.22,1980,.09),(16.31,2640,.08),(16.38,1480,.1),(16.45,3100,.06),(16.52,1760,.08),(16.6,2350,.05),(16.7,1320,.06)]: add(tink(f),tm,g,(f%7-3)/5)
add(boom(1.3,42),18.08,.26); add(whoosh(.34,1800),18.84,.26)
add(whoosh(.3,900),19.14,.12); add(boom(1.5,46),22.38,.24); add(riser(.5),23.3,.14); add(boom(1.6,50),23.82,.28)
add(whoosh(.5,800),24.2,.2); add(riser(1.0),28.6,.09)
m=np.stack([L,R],1); m/=max(1,np.abs(m).max()/.95)
w=wave.open('sfx.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((m*32767).astype('<i2').tobytes()); w.close(); print('sfx ok',np.abs(m).max())
