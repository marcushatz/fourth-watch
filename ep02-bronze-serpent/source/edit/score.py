# the score and the sound world, synthesized: Phrygian D through the story, resolving to D major on "eternal life"
import numpy as np, json, wave
from scipy.signal import butter, sosfilt, fftconvolve
SR=48000; END=58.7; N=int(END*SR)+SR*3
r=np.random.default_rng(7)
W=json.load(open('/home/user/what-if/fw-serpent/words.json')); tw=lambda i:W[i]['s']
class Bus:
    def __init__(s): s.L=np.zeros(N); s.R=np.zeros(N)
    def add(s,t,x,g=1.,pan=0.):
        i=int(max(0,t)*SR); n=min(len(x),N-i)
        if n<=0: return
        l=np.cos((pan+1)*np.pi/4); q=np.sin((pan+1)*np.pi/4)
        s.L[i:i+n]+=x[:n]*g*l*1.41; s.R[i:i+n]+=x[:n]*g*q*1.41
mus=Bus(); fx=Bus()
def T(d): return np.arange(int(d*SR))/SR
def lp(x,f): return sosfilt(butter(2,min(f,23000)/(SR/2),'low',output='sos'),x)
def hp(x,f): return sosfilt(butter(2,f/(SR/2),'high',output='sos'),x)
def bp(x,a,b): return sosfilt(butter(2,[a/(SR/2),b/(SR/2)],'band',output='sos'),x)
def noise(d): return r.standard_normal(int(d*SR))
D=146.83
def st(n): return D*2**(n/12)
def env(t,d,a,rl): return np.minimum(1,t/a)*np.minimum(1,(d-t)/rl)
def strings(notes,t0,t1,g=.1,a=.8,rl=1.0,bright=1800,pan=0):
    d=t1-t0; t=T(d); o=np.zeros_like(t)
    for f in notes:
        for det in(-.25,.0,.3):
            vib=1+.0035*np.sin(2*np.pi*(4.6+.4*r.random())*t+r.uniform(0,6))
            ph=2*np.pi*np.cumsum(f*(1+det/100)*vib)/SR
            for h in range(1,11): o+=np.sin(ph*h+r.uniform(0,6))/h**1.15
    o=lp(o,bright)*env(t,d,a,rl)/ (len(notes)*3)
    mus.add(t0,o,g,pan)
def choir(notes,t0,t1,g=.1,a=1.2,rl=1.5):
    d=t1-t0; t=T(d); o=np.zeros_like(t)
    for f in notes:
        for det in(-.35,.15,.4):
            vib=1+.005*np.sin(2*np.pi*5.2*t+r.uniform(0,6)); ph=2*np.pi*np.cumsum(f*(1+det/100)*vib)/SR
            s=sum(np.sin(ph*h)/h for h in range(1,16)); o+=s
    f1=bp(o,520,900)*1.0+bp(o,1050,1400)*.7+bp(o,2400,2900)*.35
    mus.add(t0,f1*env(t,d,a,rl)/(len(notes)*3),g)
def ney(seq,g=.1,pan=-.2):
    for (t0,d,f0,f1) in seq:
        t=T(d); f=f0+(f1-f0)*np.minimum(1,t/(d*.35))**2; vib=1+.009*np.sin(2*np.pi*5.4*t)*np.minimum(1,t/.4)
        ph=2*np.pi*np.cumsum(f*vib)/SR; s=np.sin(ph)+.33*np.sin(2*ph)+.12*np.sin(3*ph)+bp(noise(d),f0,min(f0*4,9000))*.14
        mus.add(t0,s*env(t,d,.09,.25),g,pan)
def oud(f,t0,g=.1,pan=.2,dec=.996):
    n=int(SR/f); b=r.uniform(-1,1,n); o=np.zeros(int(1.8*SR)); y=b.copy()
    for i in range(len(o)):
        j=i%n; o[i]=y[j]; y[j]=dec*.5*(y[j]+y[(j+1)%n])
    mus.add(t0,lp(o,3200),g,pan)
def drum(t0,f=70,g=.5,d=.7,pan=0,tone=1):
    t=T(d); s=np.sin(2*np.pi*(f*t+f*1.6*(1-np.exp(-t*34))/34))*np.exp(-t*7)*tone+lp(noise(d),900)*np.exp(-t*30)*.4
    mus.add(t0,s,g,pan)
def metal(f,d=2.4,dec=2.2):
    t=T(d); o=np.zeros_like(t)
    for i,q in enumerate([1,1.51,2.27,2.76,3.43,4.18,5.4,6.8]): o+=np.sin(2*np.pi*f*q*t+r.uniform(0,6))*np.exp(-t*dec*(1+i*.5))/(1+i*.7)
    return o*(1-np.exp(-t*900))
def chime(f,d=1.0): t=T(d); return (np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*6))*np.exp(-t*4.5)*(1-np.exp(-t*500))
def whoosh(d,lo,hi,peak=.6):
    n=noise(d); t=T(d); e=np.minimum(t/(d*peak),1)**2*np.minimum((d-t)/(d*(1-peak)),1)**1.5; m=t/d
    return (bp(n,lo,hi)*(1-m)+bp(n,hi*.7,min(hi*2.4,20000))*m)*e
def thump(f0=60,d=1.0,drop=3): t=T(d); return np.sin(2*np.pi*(f0*t+f0*drop*(1-np.exp(-t*30))/30))*np.exp(-t*6)
HIT=tw(67)
# ---- the swing lands on "smashed", then one note held in the air
H0=.84
fx.add(.28,whoosh(.56,120,5200,.95),.2); fx.add(H0,thump(46,1.8,4.4),.9); fx.add(H0,metal(147,2.6,1.4),.3); fx.add(H0,metal(233,1.8,2.2),.14,.15); fx.add(H0-.004,hp(noise(.1),1500)*np.exp(-T(.1)*36),.42)
strings([st(-24),st(-12)],0,6.4,.16,.3,.5,700); strings([st(13),st(25)],.2,6.3,.018,1.2,.6,5200,.3)
tt=T(6.4); fx.add(0,sum(np.sin(2*np.pi*f*tt+r.uniform(0,6))*a for f,a in((1174,.5),(1762,.3),(2670,.2)))*np.exp(-tt*.35)*(1-np.exp(-tt*40)),.018,.1)
fx.add(0,lp(noise(3),300)*np.exp(-T(3)*2.5),.14)
ney([(tw(15),.8,st(12),st(12)),(tw(17),1.0,st(13),st(13))],.05)
# ---- rewind
fx.add(6.3,whoosh(1.2,200,9000,.2)[::-1],.2); fx.add(6.5,thump(120,.6,-.5)[::-1],.25)
for i in range(9): fx.add(6.5+i*.1,hp(noise(.03),2600)*np.exp(-T(.03)*90),.09,(-1)**i*.5)
# ---- the camp
strings([st(-24),st(-17)],7.3,11.5,.13,.7,.6,900)
b=60/84.0
for i,t in enumerate(np.arange(7.56,11.2,b/2)):
    if i%4==0: drum(t,62,.26)
    elif i%4==2: drum(t,92,.13,.3)
    n=[0,1,0,-2,0,1,3,1][i%8]; oud(st(n-12),t,.11)
for t in (tw(25),tw(25)+.5,tw(26)): fx.add(t,bp(noise(1.4),1800,6000)*np.minimum(T(1.4)/.4,1)*np.minimum((1.4-T(1.4))/.5,1),.05,r.uniform(-.6,.6))
strings([st(1),st(4),st(8)],tw(25),11.4,.1,.3,.3,2600)
for i in range(46): fx.add(10.98+r.uniform(0,.34),hp(noise(.02),1500)*np.exp(-T(.02)*120),.07,r.uniform(-.7,.7))
fx.add(tw(25)-.04,whoosh(.82,300,7000,.5),.14,-.3); fx.add(tw(26),whoosh(.5,400,7000,.5),.12,.4)
STRK=10.46; fx.add(STRK-.14,whoosh(.2,500,7500,.9),.22); fx.add(STRK,thump(92,.4,1.4),.62); fx.add(STRK-.004,hp(noise(.06),1800)*np.exp(-T(.06)*60),.3)
fx.add(10.76,thump(64,.7,1.6),.4); fx.add(11.0,thump(50,.9,1.2),.32)
# ---- God tells Moses
strings([st(-12),st(-5),st(0),st(4)],11.3,15.8,.11,1.0,.8,2200); ney([(tw(33),1.0,st(12),st(16)),(tw(35),1.2,st(16),st(19))],.06)
fx.add(tw(41)-.02,thump(52,1.4,2.6),.8); fx.add(tw(41),metal(196,2.4,1.6),.07); strings([st(-24),st(-12),st(7)],tw(41),16.0,.13,.03,.9,1500)
# ---- look and live
ney([(15.8,1.4,st(12),st(12)),(17.2,.9,st(14),st(19))],.07); strings([st(-5),st(-2),st(2),st(7)],16.0,18.3,.08,.9,.7,2600)
for i in range(16): fx.add(tw(47)+.05*i+r.uniform(0,.02),chime(st(24+[0,4,7,12,16][i%5]),.9),.03,r.uniform(-.7,.7))
# ---- the silent centuries: pages going by
strings([st(-24)],18.0,21.0,.1,.4,.3,500)
for i in range(9): fx.add(18.2+i*.3,bp(noise(.11),900,6000)*np.exp(-T(.11)*22),.2,(i%2-.5)); drum(18.2+i*.3,60,.09,.3)
fx.add(20.72,thump(70,.8,2),.34)
# ---- offerings: the same harmony gone sour
strings([st(-24),st(-23),st(-12),st(-11)],20.9,23.9,.12,.5,.3,900); choir([st(-12),st(-11),st(-5)],20.9,23.95,.06,1.0,.4)
fx.add(20.9,lp(noise(3),2000)*.1*np.minimum(T(3)/1.0,1),.05)
for t,f in ((21.2,1046),(22.0,988),(22.7,1174)): fx.add(t,metal(f,.9,6),.018,r.uniform(-.5,.5))
# ---- the blow
for t in (23.96,24.32,24.56): fx.add(t,thump(84,.3,.8),.34)
fx.add(24.4,whoosh(.58,120,5200,.95),.26); drum(24.72,74,.3); drum(24.86,84,.3)
fx.add(HIT,thump(46,2.0,4.6),1.1); fx.add(HIT,metal(147,3.4,1.2),.42); fx.add(HIT,metal(233,2.4,2.0),.22,.15); fx.add(HIT-.004,hp(noise(.1),1500)*np.exp(-T(.1)*36),.5)
tt=T(3.0); fx.add(HIT+.1,sum(np.sin(2*np.pi*f*tt) for f in (880,1321))*np.exp(-tt*.8),.02)   # the ring that hangs while time is stopped
fx.add(26.7,thump(58,1.4,1.5),.3); strings([st(-24),st(-12)],25.2,28.2,.08,.6,.4,600)
# ---- it falls. end of story.
for i in range(40):
    t=28.06+r.uniform(0,1)**1.5*1.8; fx.add(t,metal(r.uniform(520,1900),.5,9),.055,r.uniform(-.7,.7))
fx.add(29.92,thump(44,1.6,2),.5)
strings([st(-24)],29.9,31.2,.09,.2,.9,400)
# ---- the night yard
fx.add(31.2,lp(noise(5),600)*.05,.2)
for i in range(16): fx.add(31.3+r.uniform(0,4.6),hp(noise(.04),5000)*np.exp(-T(.04)*50),.016,r.uniform(-.6,.6))
for t,n in ((31.5,0),(32.4,3),(32.7,1)): oud(st(n),t,.12,-.2,.9975)
strings([st(-12),st(-9)],31.4,33.9,.05,1.0,.4,800)
choir([st(-14),st(-2),st(2),st(5)],tw(86)-.4,36.2,.2,1.4,.5); strings([st(-26),st(-14),st(-2),st(5),st(10)],tw(86)-.3,36.2,.14,1.3,.5,2800)
fx.add(tw(90),thump(40,2.6,3),.65); fx.add(tw(88),whoosh(1.2,150,5000,.9),.12)
# ---- as Moses lifted up... so must the Son of Man
strings([st(-26),st(-14),st(-2),st(2),st(5)],36.0,39.3,.14,.3,.3,3000); choir([st(-2),st(2),st(5)],36.0,39.3,.11,.4,.3)
strings([st(-19),st(-7),st(0),st(5),st(9)],39.2,41.9,.15,.2,.4,3200); choir([st(0),st(5),st(9)],39.2,41.9,.13,.4,.4)
for t in (tw(94),tw(108)): drum(t,58,.42,1.0); fx.add(t,whoosh(.7,200,4500,.7),.1)
# ---- his own death: nearly nothing
strings([st(12)],41.9,44.2,.03,.3,.8,1800); drum(tw(114),50,.34,1.3)
# ---- whoever believes: it opens
strings([st(-14),st(-2),st(2),st(5)],44.1,46.5,.1,.8,.5,2400); strings([st(-19),st(-7),st(0),st(5),st(9)],46.4,48.2,.13,.7,.5,3000); strings([st(-17),st(-5),st(2),st(7),st(10)],48.0,49.8,.14,.6,.5,3200)
choir([st(0),st(5),st(9)],46.4,49.8,.1,.9,.5); ney([(44.4,1.4,st(14),st(12)),(46.6,1.6,st(12),st(17)),(48.3,1.3,st(17),st(21))],.06)
for i in range(40): fx.add(tw(122)+.2+i*.075+r.uniform(0,.03),chime(st(24+[2,5,9,14,17][i%5]),.8),.016,r.uniform(-.8,.8))
# ---- back to the broken pieces, one held note, then D major
strings([st(-24),st(-12)],49.7,52.8,.1,.4,.5,700); strings([st(-5)],50.2,52.8,.04,.7,.4,1500)
for t,n in ((52.66,-24),(52.66,-12)): pass
E=tw(141)
strings([st(-24),st(-12),st(-5)],52.6,E+.6,.07,.5,.5,900)
fx.add(E-.75,whoosh(.8,200,6000,.92),.1)
strings([st(-24),st(-12),st(-5),st(0),st(4),st(7),st(12)],E-.3,60.5,.2,.5,3.0,3400); choir([st(0),st(4),st(7),st(12)],E-.25,60.5,.15,.8,3.0)
fx.add(E-.02,thump(42,3.0,2),.55); ney([(E+.1,1.4,st(16),st(19)),(E+1.7,2.2,st(19),st(24))],.05)
for i in range(30): fx.add(E+r.uniform(0,4.6),chime(st(24+[0,4,7,12][i%4]),1.2),.012,r.uniform(-.8,.8))
ir=r.standard_normal(int(2.4*SR))*np.exp(-T(2.4)*2.6); ir=hp(ir,180); ir/=np.sqrt((ir**2).sum())
def wet(b,m):
    l=b.L+m*fftconvolve(b.L,ir)[:N]; q=b.R+m*fftconvolve(b.R,np.roll(ir,311))[:N]; return l,q
ml,mr=wet(mus,.5); fl,fr_=wet(fx,.3)
np.save('st_mus.npy',np.stack([ml,mr]).astype('float32')); np.save('st_fx.npy',np.stack([fl,fr_]).astype('float32')); print('stems',np.abs(ml).max(),np.abs(fl).max())
