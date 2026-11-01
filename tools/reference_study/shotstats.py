#!/usr/bin/env python3
"""Shot-by-shot motion study: cuts, shot lengths, camera zoom/pan per shot, and on-screen (non-camera) motion.
usage: shotstats.py VIDEO NAME [crop w:h:x:y] [t0 t1]  -> prints a table and writes NAME_shots.json"""
import sys, json, subprocess, numpy as np, cv2

vid, name = sys.argv[1], sys.argv[2]
crop = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != '-' else None
t0 = float(sys.argv[4]) if len(sys.argv) > 4 else 0
t1 = float(sys.argv[5]) if len(sys.argv) > 5 else None
W, H = 216, 384
vf = (f"crop={crop}," if crop else "") + f"fps=30,scale={W}:{H},format=gray"
cmd = ["ffmpeg", "-v", "error", "-ss", str(t0)] + (["-t", str(t1 - t0)] if t1 else []) + ["-i", vid, "-vf", vf, "-f", "rawvideo", "-"]
raw = subprocess.run(cmd, capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W)
n = len(F)
# --- cuts: big jump in histogram distance AND mean abs difference vs. the neighbourhood
hist = [cv2.calcHist([f], [0], None, [32], [0, 256]).ravel() / f.size for f in F]
hd = np.array([0] + [0.5 * np.abs(hist[i] - hist[i - 1]).sum() for i in range(1, n)])
md = np.array([0] + [np.abs(F[i].astype(int) - F[i - 1]).mean() for i in range(1, n)])
cuts = [0]
for i in range(1, n):
    loc = np.median(md[max(1, i - 15):i + 15]) + 1e-3
    if (md[i] > 18 and md[i] > 4 * loc) or (hd[i] > 0.35 and md[i] > 10):
        if i - cuts[-1] >= 6: cuts.append(i)
cuts.append(n)
# --- camera motion per frame: track features, fit a similarity transform; residual = things moving in the frame
feat = dict(maxCorners=300, qualityLevel=0.01, minDistance=6, blockSize=7)
zoom = np.zeros(n); pan = np.zeros(n); resid = np.zeros(n); ok = np.zeros(n, bool)
cutset = set(cuts)
for i in range(1, n):
    if i in cutset: continue
    a, b = F[i - 1], F[i]
    p0 = cv2.goodFeaturesToTrack(a, mask=None, **feat)
    if p0 is None or len(p0) < 12: continue
    p1, st, _ = cv2.calcOpticalFlowPyrLK(a, b, p0, None, winSize=(15, 15), maxLevel=3)
    g = st.ravel() == 1
    if g.sum() < 12: continue
    A, inl = cv2.estimateAffinePartial2D(p0[g], p1[g], method=cv2.RANSAC, ransacReprojThreshold=1.0)
    if A is None: continue
    s = np.hypot(A[0, 0], A[1, 0]); zoom[i] = s - 1; pan[i] = np.hypot(A[0, 2], A[1, 2]) / H * 100
    pred = (p0[g].reshape(-1, 2) @ A[:, :2].T) + A[:, 2]
    err = np.linalg.norm(p1[g].reshape(-1, 2) - pred, axis=1)
    resid[i] = np.mean(err > 1.5); ok[i] = True   # share of tracked points moving on their own (characters, effects)
shots = []
for a, b in zip(cuts, cuts[1:]):
    sl = slice(a + 1, b)
    z = zoom[sl][ok[sl]]; p = pan[sl][ok[sl]]; r = resid[sl][ok[sl]]
    shots.append(dict(t=round(t0 + a / 30, 2), len=round((b - a) / 30, 2),
                      zoom_pct=round(float(np.sum(z) * 100), 1) if len(z) else 0,
                      pan_pct=round(float(np.sum(p)), 1) if len(p) else 0,
                      move_share=round(float(np.mean(r)) * 100, 1) if len(r) else 0))
L = np.array([s['len'] for s in shots])
cam = np.array([abs(s['zoom_pct']) + s['pan_pct'] for s in shots])
print(f"{name}: {n / 30:.1f}s, {len(shots)} shots, mean {L.mean():.2f}s, median {np.median(L):.2f}s, "
      f"<=3s {np.mean(L <= 3) * 100:.0f}%, >6s {np.mean(L > 6) * 100:.0f}%, max {L.max():.1f}s")
print(f"  camera travel per shot (|zoom%|+pan%): median {np.median(cam):.1f}, per second {np.sum(cam) / L.sum():.2f}%/s; "
      f"on-screen motion (share of points moving on their own) median {np.median([s['move_share'] for s in shots]):.1f}%")
for s in shots: print(f"  {s['t']:7.2f}  {s['len']:5.2f}s  zoom {s['zoom_pct']:+6.1f}%  pan {s['pan_pct']:5.1f}%  own-motion {s['move_share']:5.1f}%")
json.dump(dict(name=name, shots=shots), open(f"{name}_shots.json", "w"), indent=1)
