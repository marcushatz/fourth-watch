import numpy as np, subprocess, wave, sys
SR=48000; END=58.7
GV=float(sys.argv[1]) if len(sys.argv)>1 else 1.55; GM=float(sys.argv[2]) if len(sys.argv)>2 else 1.0; GF=float(sys.argv[3]) if len(sys.argv)>3 else 1.0
m=np.load('st_mus.npy'); f=np.load('st_fx.npy'); N=m.shape[1]
subprocess.run("ffmpeg -y -v error -i ../voice.mp3 -ar 48000 -ac 1 -f f32le voice.raw",shell=True)
v=np.fromfile('voice.raw','float32'); v=np.pad(v,(0,max(0,N-len(v))))[:N]
e=np.sqrt(np.convolve(v**2,np.ones(2400)/2400,'same')); e/=e.max()+1e-9; s=np.clip(e*5,0,1); s=np.convolve(s,np.ones(int(.28*SR))/int(.28*SR),'same'); duck=1-.5*s
bed=np.stack([m[0]*duck*GM+f[0]*GF,m[1]*duck*GM+f[1]*GF])
from scipy.ndimage import maximum_filter1d, uniform_filter1d
h=np.clip(.84-maximum_filter1d(np.abs(v*GV),961),.1,.62); h=uniform_filter1d(h,241)   # the bed gets whatever headroom the voice leaves; the voice is never limited
bed=h*np.tanh(bed/h)
o=bed+v*GV
n=int(END*SR); o=o[:,:n]; fd=np.minimum(1,(END-np.arange(n)/SR)/1.2); o=o*fd
print('peak',np.abs(o).max())
x=(np.clip(o.T,-1,1)*32767).astype('<i2')
w=wave.open('mix.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes()); w.close()
