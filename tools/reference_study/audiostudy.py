import sys, subprocess, numpy as np
def load(path, t0=0, t1=None):
    cmd=["ffmpeg","-v","error","-ss",str(t0)]+(["-t",str(t1-t0)] if t1 else [])+["-i",path,"-ac","1","-ar","16000","-f","f32le","-"]
    return np.frombuffer(subprocess.run(cmd,capture_output=True).stdout,np.float32)
def study(name, path, t1):
    a=load(path,0,t1); sr=16000; n=800  # 50 ms frames
    fr=a[:len(a)//n*n].reshape(-1,n); win=np.hanning(n)
    S=np.abs(np.fft.rfft(fr*win,axis=1))**2; f=np.fft.rfftfreq(n,1/sr)
    band=lambda lo,hi: 10*np.log10(S[:,(f>=lo)&(f<hi)].sum(1)+1e-12)
    voice=band(300,3400); low=band(30,180); air=band(4000,8000); tot=10*np.log10(S.sum(1)+1e-12)
    hi_v=np.percentile(voice,90)
    speech=voice>hi_v-12
    # gaps: runs of >=4 frames (200 ms) well below speech level
    gap=voice<hi_v-22
    runs=[];i=0
    while i<len(gap):
        if gap[i]:
            j=i
            while j<len(gap) and gap[j]: j+=1
            if j-i>=4: runs.append((i,j))
            i=j
        else: i+=1
    gi=np.concatenate([np.arange(a_,b_) for a_,b_ in runs]) if runs else np.array([],int)
    sp=np.where(speech)[0]
    def med(x,idx): return float(np.median(x[idx])) if len(idx) else float('nan')
    # onset rate in gaps (SFX/percussion): spectral flux peaks
    flux=np.r_[0,np.maximum(0,np.diff(np.log(S[:,f>1500].sum(1)+1e-9)))]
    onset=(flux>np.percentile(flux,97))
    total_gap=len(gi)*0.05
    print(f"{name}: speech frames {len(sp)*0.05:.0f}s, gaps {total_gap:.1f}s in {len(runs)} pauses (mean {total_gap/max(1,len(runs)):.2f}s)")
    print(f"  in pauses vs speech (dB): total {med(tot,gi)-med(tot,sp):+.1f}, voice band {med(voice,gi)-med(voice,sp):+.1f}, low 30-180 {med(low,gi)-med(low,sp):+.1f}, air 4-8k {med(air,gi)-med(air,sp):+.1f}")
    print(f"  bed level in pauses relative to speech voice band: {med(tot,gi)-med(voice,sp):+.1f} dB;  low band in pauses vs speech voice band {med(low,gi)-med(voice,sp):+.1f} dB")
    print(f"  sharp onsets (top 3% flux) per minute: overall {onset.sum()/ (len(onset)*0.05/60):.0f}, inside pauses {onset[gi].sum()/max(1e-6,total_gap/60):.0f}")
study('LINTEL suffering', '/home/claude/fourth-watch/research/lintel_ref/ref2.mov', 113)
print('--- floor between words (percentiles of 50 ms levels, dB relative to the 90th percentile of the voice band)')
for name,path,t1 in [('LINTEL suffering','/home/claude/fourth-watch/research/lintel_ref/ref2.mov',113)]:
    a=load(path,0,t1); sr=16000; n=800; fr=a[:len(a)//n*n].reshape(-1,n); S=np.abs(np.fft.rfft(fr*np.hanning(n),axis=1))**2; f=np.fft.rfftfreq(n,1/sr)
    b=lambda lo,hi: 10*np.log10(S[:,(f>=lo)&(f<hi)].sum(1)+1e-12)
    v=b(300,3400); tot=10*np.log10(S.sum(1)+1e-12); low=b(30,180); ref=np.percentile(v,90)
    print(f"{name}: voice band p10 {np.percentile(v,10)-ref:+.1f}, p25 {np.percentile(v,25)-ref:+.1f}; total p10 {np.percentile(tot,10)-ref:+.1f}; low-band median {np.median(low)-ref:+.1f}, p90 {np.percentile(low,90)-ref:+.1f}")
