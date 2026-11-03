// the placeholder puppet: every joint angle for every frame. Plain numbers, nothing engine-specific.
import { readFileSync } from "node:fs";
export const FPS=30, DUR=7.0, U=500, N=Math.round(DUR*FPS);
const T=JSON.parse(readFileSync(new URL("./terrain.json",import.meta.url),"utf8"));
const RM=1.6,HM=.10;
export const ground=(x)=>{const f=(x-T.x0)/T.dx,i=Math.max(0,Math.min(T.h.length-2,Math.floor(f))),u=f-i,d=T.h[i]*(1-u)+T.h[i+1]*u,m=Math.abs(x)<RM?HM*Math.pow(1-(x/RM)**2,1.5):0;return Math.max(d,m);};
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), lerp=(a,b,t)=>a+(b-a)*t, ss=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
const deg=(r)=>r*57.29578, rad=(d)=>d/57.29578;
const TH=.42, SH=.43, HIP=.845, ANK=.066, UA=.29, FA=.28, SHO=.49;
const X0=-3.75, XS=-.62, V=1.18, TB=1.95, DEC=1.05;          // start, stop, walking speed, when braking starts, how long it takes
const sAt=(t)=>t<=TB?V*t:(t<TB+DEC?V*TB+V*((t-TB)-(t-TB)**2/(2*DEC)):V*TB+V*DEC/2);
const S=sAt(99), SCALE=(XS-X0)/S;                            // scale the walk so it lands exactly at the stop mark
export const T_STOP=TB+DEC;
const Lstep=.645, NS=Math.round((XS-X0)/Lstep), L=(XS-X0)/NS;
const TSET=3.04, TBACK=3.5, TLOOK=3.08, TREACH=3.56, THAND=4.12, TFOOT=4.44, TLAND=4.92, XREAR=-.70;  // weight back and look up, weight forward and reach, then the back foot follows
const HAND=[-.046,1.30];                                     // the grip on the pole
// two-bone reach: returns the first angle and the bend, for a limb hanging along +y
const ik=(dx,dy,a,b,sign)=>{const d=Math.min(Math.hypot(dx,dy),a+b-.001),base=Math.atan2(-dx,dy),al=Math.acos(clamp((a*a+d*d-b*b)/(2*a*d),-1,1)),be=Math.acos(clamp((a*a+b*b-d*d)/(2*a*b),-1,1));return [base+sign*al,-sign*(Math.PI-be)];};
const footAt=(s,i)=>{ // i: 0 near, 1 far. Foot position as a function of distance walked, so it can't slide
  const u0=s/L,k=Math.min(NS-1,Math.floor(u0)),u=clamp(u0-k);
  const land=(j)=>j<0?(j==-1?L/2:-L/2):(j==NS-1?(NS*L+.1):(j+1)*L+L/2);
  const sw=k%2; // foot swinging in step k
  if(i==sw){const a=land(k-2),b=land(k),e=ss(.02,.98,u);return {x:lerp(a,b,e),lift:.10*Math.sin(Math.PI*clamp(u))**1.3,u,sw:true};}
  return {x:land(k-1),lift:0,u,sw:false};};
export const steps=[];for(let k=0;k<NS;k++){const b=k==NS-1?(NS*L+.1):(k+1)*L+L/2;let t=0;while(sAt(t)*SCALE<(k+1)*L-.0005&&t<9)t+=1/240;steps.push({t,x:X0+b,foot:k%2});}
steps.push({t:TLAND-.03,x:XREAR,foot:1});
const poseAt=(t)=>{
  const s=clamp(sAt(t)*SCALE,0,XS-X0),px=X0+s,sp=clamp((sAt(t+.02)-sAt(t))/(.02*V));
  const f=[footAt(s,0),footAt(s,1)].map((q,n)=>{let x=X0+q.x,lift=q.lift,extra=0,peel=0;const beh=px-x,heel=!q.sw?ss(.10,.30,beh)*sp:0,toe=q.sw?(1-ss(0,.35,q.u))*.9-ss(.65,.95,q.u)*.45+ss(.95,1,q.u)*.45:0;
    if(n==0) extra=-.26*ss(3.12,TBACK,t)*(1-ss(TREACH,TREACH+.3,t));      // the front toe goes light as his weight rocks back
    if(n==1){const e=ss(TFOOT,TLAND,t),v=(t-TFOOT)/(TLAND-TFOOT);x=lerp(x,XREAR,e);lift+=.07*Math.sin(Math.PI*clamp(v))**1.2;     // the back foot follows once his weight has crossed
      peel=.70*ss(TREACH+.04,THAND+.04,t)*(1-ss(TFOOT+.08,TLAND-.1,t));x+=.196*(1-Math.cos(peel));}                            // the heel peels up around a planted toe
    const ang=(heel*.42+toe*.42)*(sp>.02?1:0)+extra+peel;
    return {x,y:ground(x)+ANK+lift+Math.max(0,Math.sin(Math.max(0,ang-peel))*.14)+Math.sin(peel)*.196,lift,ang,gy:ground(x)};});
  const u=(s/L)%1, bob=(-.016*Math.cos(2*Math.PI*u))*sp;
  const rest=(f[0].gy+f[1].gy)/2, after=Math.max(0,t-T_STOP);
  const dip=-.022*Math.exp(-after*7)*Math.sin(after*11)*(after>0?1:0), rock=.045*Math.exp(-after*5)*Math.sin(after*8)*(after>0?1:0), grip=t>THAND?Math.exp(-(t-THAND)*6)*Math.sin((t-THAND)*12):0;   // he carries forward, then settles
  const reach=ss(TREACH-.05,THAND,t), chest=-rad(5)*ss(TSET,TBACK,t)*(1-ss(TREACH,TREACH+.3,t)), lean0=rad(5)*sp+rad(6)*Math.exp(-after*5)*Math.cos(after*9)*(after>0?1:0)*(1-sp), ant=-rad(3)*ss(TREACH-.22,TREACH,t)*(1-ss(TREACH,TREACH+.3,t));
  const breath=Math.sin(t*2.1)*ss(4.9,5.5,t);
  const lean=lean0+ant+chest+rad(11)*reach-rad(3)*ss(TFOOT,TLAND,t)+rad(.8)*breath+rad(1.2)*grip;
  const shift=-.085*ss(TSET,TBACK,t)+.15*ss(TREACH-.04,THAND,t)+.02*ss(TFOOT,TLAND,t)+rock;   // weight back over the rear foot, forward over the front foot, then settled between
  const hx=px+shift, hy=rest+HIP+bob+dip-.012*ss(TREACH,THAND,t)-.012*grip-.018*Math.sin(Math.PI*clamp((t-TFOOT)/(TLAND-TFOOT)))+.004*breath;
  const legs=f.map((q)=>{const [a,b]=ik(q.x-hx,hy-q.y,TH,SH,-1);return {a,b};});
  // shoulder position in the world, from the leaning torso
  const sx=hx+Math.sin(lean)*SHO, sy=hy+Math.cos(lean)*SHO;
  const ph=2*Math.PI*(s/L)/2, sw=sp*.62*Math.sin(ph+Math.PI/2);
  const swing=(k)=>rad(4)+k*sw, bend=(k)=>-rad(14)-rad(18)*sp*(.5+.5*k*Math.sin(ph+Math.PI/2));
  let nearA=swing(1)-lean, nearB=bend(1), farA=swing(-1)-lean+rad(14)*reach*(1-.5*ss(TFOOT,TLAND,t)), farB=bend(-1)-rad(8)*reach;
  // the near arm hands over from the swing to reaching the pole
  const r0=ss(TREACH,THAND,t), over=rad(5)*Math.exp(-Math.max(0,t-THAND)*9)*Math.sin(Math.max(0,t-THAND)*16);
  if(r0>0){const e=(()=>{const w=r0;const hx0=sx+(-Math.sin(swing(1)))*UA,hy0=sy-Math.cos(swing(1))*UA;return w;})(),arc=Math.sin(Math.PI*e)*.07,tx=lerp(sx+.1,HAND[0],e),ty=lerp(sy-.45,HAND[1],e)+arc;const [a,b]=ik(tx-sx,sy-ty,UA,FA,1);nearA=lerp(nearA,a-lean,clamp(r0*2.2))+over;nearB=lerp(nearB,b,clamp(r0*2.2));}
  const look=-rad(32)*ss(TLOOK,TLOOK+.42,t)-rad(3)*Math.sin(clamp((t-TLOOK-.42)*4,0,Math.PI))-rad(4)*ss(4.6,5.6,t);
  return {t,px:hx,py:hy,lean,f,legs,nearA,nearB,farA,farB,head:-lean*.6+look+rad(3)*sp,sp,
    skirtN:0,skirtF:0};
};
export const FRAMES=[...Array(N+1).keys()].map(i=>poseAt(i/FPS));
FRAMES.forEach((q,i)=>{const p=FRAMES[Math.max(0,i-3)];q.skirtN=(p.legs[0].a)*.5-q.lean*.4;q.skirtF=(p.legs[1].a)*.5-q.lean*.4;});
// the camera: follows him with a little lag, settles after he stops, then rises with his look to the serpent
const cxs=[];{let c=X0+.1;for(let i=0;i<=N;i++){const q=FRAMES[i],tg=q.px+.18;c+=(tg-c)*(1-Math.exp(-(1/FPS)/.33));cxs.push(c);}}
export const camAtT=(t)=>{const i=Math.max(0,Math.min(N,Math.round(t*FPS))),c=cxs[i],k=ss(3.75,5.75,t);
  return {ro:[lerp(c+.1,.28,k*.8),lerp(.92,.66,k),lerp(7.0,5.7,k)],ta:[lerp(c+.72,-.12,k),lerp(1.22,1.8,k),0],lens:1.28};};
export const LIGHT={dx:.70/.94,dz:-.62/.94,k:.94/.34};
export {deg,HIP,TH,SH,UA,FA,SHO};
