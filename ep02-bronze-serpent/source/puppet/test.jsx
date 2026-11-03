// placeholder puppet on the camp set: walking, stopping, reaching, ground contact, a camera with a reason
import { proj } from "../edit/shots.js";
import { TINTG, PAINTS } from "../edit/cast.jsx";
import { FRAMES, steps, camAtT, DUR, FPS, N, U, ground, LIGHT, deg, TH, SH, UA, FA, SHO } from "./puppet.js";
const kf=(property,rows)=>({property,keyframes:rows});
const tr=(prop,fn)=>kf(prop,FRAMES.map((q,i)=>({at:Math.min(DUR-.001,i/FPS),value:fn(q,i),easing:"linear"})));
const J=(x,y,anim,kids)=><frame x={x} y={y} width={2} height={2} layout="none" origin="center" animate={anim}>{kids}</frame>;
const R=(i,s=1)=>{const v=Math.sin(i*12.9898+s*78.233)*43758.5453;return v-Math.floor(v);};
const SHEAR=`vec4 pixel(vec2 uv){ vec2 P=uv*vec2(1080.0,1920.0), d=P-vec2(u_fx,u_fy); float t=d.y/u_by; if(t<-0.01||t>1.02) return vec4(0.0); float dx=d.x-t*u_bx; vec2 O=vec2(u_fx+dx,u_fy-t*u_hh)/vec2(1080.0,1920.0);
  float b=(1.5+7.0*t), a=0.0; for(int i=-1;i<=1;i++){ for(int j=-1;j<=1;j++){ a+=texture(u_src,O+vec2(float(i),float(j))*b/vec2(1080.0,1920.0)).a; } } a/=9.0; float o=a*0.56*(1.0-0.72*t); return vec4(0.075*o,0.045*o,0.08*o,o); }`;
const WARM=`vec4 pixel(vec2 uv){ vec4 c=texture(u_src,uv); float k=smoothstep(0.30,0.42,uv.y), m=max(c.r,c.g)*0.92; c.b=mix(c.b,min(c.b,m),k); return c; }`;
const SOFT=`vec4 pixel(vec2 uv){ vec4 c=vec4(0.0); for(int i=-3;i<=3;i++){ for(int j=-3;j<=3;j++){ c+=texture(u_src,uv+vec2(float(i),float(j))*5.0/vec2(2480.0,1920.0)); } } return c/49.0; }`;
const body=(dark)=>{const f=(c)=>dark?"#000000":c;
  const skin=f({kind:"linear",angle:90,stops:[{offset:0,color:"#C99570"},{offset:1,color:"#96674C"}]}), robe=f({kind:"linear",angle:100,stops:[{offset:0,color:"#D7C3A0"},{offset:1,color:"#9F876C"}]}), robeB=f({kind:"linear",angle:100,stops:[{offset:0,color:"#AE9878"},{offset:1,color:"#7D6752"}]}), leg=f("#8E6248"), legB=f("#6F4B39"), mantle=f({kind:"linear",angle:90,stops:[{offset:0,color:"#A86A42"},{offset:1,color:"#74432C"}]}), mantleB=f("#6B3F2B"), cloth=f("#7A4B32"), beard=f("#DAD3C6"), sole=f("#4A3226");
  const L=(a,b,c,w,h,col)=>J(0,0,[tr("rotation",(q,i)=>deg(a(q)))],[<rect x={-w/2} y={-w/2} width={w} height={TH*U+w} radius={w/2} fill={col}/>,
    J(0,TH*U,[tr("rotation",(q)=>deg(b(q)))],[<rect x={-h/2} y={-h/2} width={h} height={SH*U+h/2} radius={h/2} fill={col}/>,
      J(0,SH*U,[tr("rotation",(q)=>deg(c(q)))],[<rect x={-30} y={-14} width={128} height={46} radius={22} fill={sole}/>])])]);
  const A=(a,b,w,col,hand)=>J(0,-SHO*U,[tr("rotation",(q)=>deg(a(q)))],[<rect x={-w/2} y={-w/2} width={w} height={UA*U+w} radius={w/2} fill={col}/>,
    J(0,UA*U,[tr("rotation",(q)=>deg(b(q)))],[<rect x={-w*.42} y={-w*.42} width={w*.84} height={FA*U+w*.5} radius={w*.42} fill={col}/>,<rect x={-24} y={FA*U-20} width={48} height={66} radius={23} fill={hand}/>])]);
  const lean=[tr("rotation",(q)=>deg(q.lean))];
  return [
    J(0,0,lean,[A((q)=>q.farA,(q)=>q.farB,60,mantleB,skin)]),
    L((q)=>q.legs[1].a,(q)=>q.legs[1].b,(q)=>q.f[1].ang-q.legs[1].a-q.legs[1].b,84,60,legB),
    L((q)=>q.legs[0].a,(q)=>q.legs[0].b,(q)=>q.f[0].ang-q.legs[0].a-q.legs[0].b,88,64,leg),
    J(0,0,[tr("rotation",(q)=>deg(q.skirtF))],[<path x={0} y={0} width={1} height={1} d="M -58 -24 L 62 -24 L 122 306 Q 30 322 -96 302 Z" fill={robeB}/>]),
    J(0,0,[tr("rotation",(q)=>deg(q.skirtN))],[<path x={0} y={0} width={1} height={1} d="M -70 -24 L 66 -24 L 110 314 Q 8 332 -122 310 Z" fill={robe}/>]),
    J(0,0,lean,[
      <path x={0} y={0} width={1} height={1} d="M -72 16 C -80 -90 -74 -190 -56 -240 C -30 -270 32 -270 52 -240 C 70 -180 78 -80 70 16 Z" fill={robe}/>,
      <path x={0} y={0} width={1} height={1} d="M -60 -246 C -24 -272 34 -266 54 -238 C 40 -170 10 -60 -30 22 L -76 18 C -82 -80 -78 -190 -60 -246 Z" fill={mantle}/>,
      <rect x={-74} y={-16} width={148} height={30} radius={8} fill={cloth}/>,
      J(4,-(SHO+.03)*U,[tr("rotation",(q)=>deg(q.head))],[
        <rect x={-28} y={-30} width={56} height={60} radius={24} fill={skin}/>,
        <path x={0} y={0} width={1} height={1} d="M -46 -60 C -50 -116 -16 -150 22 -146 C 50 -142 62 -120 62 -100 L 76 -80 L 62 -74 L 60 -52 C 58 -30 40 -14 14 -10 L -30 -14 Z" fill={skin}/>,
        <path x={0} y={0} width={1} height={1} d="M 62 -60 C 66 -28 52 10 22 22 C -4 26 -26 10 -32 -18 C -4 -10 30 -28 40 -58 Z" fill={beard}/>,
        <path x={0} y={0} width={1} height={1} d="M -52 -60 C -66 -122 -26 -166 24 -156 C 52 -150 66 -132 64 -116 C 34 -126 0 -114 -14 -80 C -24 -50 -28 -10 -44 30 C -70 18 -60 -30 -52 -60 Z" fill={cloth}/>]),
      A((q)=>q.nearA,(q)=>q.nearB,66,mantle,skin)]),
  ];};
const FGX=-2.75,FGZ=3.3;
export default async ({project})=>{
  const p=await project({dir:process.env.PT_DIR||"pt",size:"1080x1920",fps:FPS,background:"#0B0A0C"});
  const plate=await p.add(process.env.PT_PLATE);
  const Q=FRAMES.map((q,i)=>{const c=camAtT(i/FPS),pv=proj(c,[q.px,q.py,0]),fx=(q.f[0].x+q.f[1].x)/2,fy=(q.f[0].gy+q.f[1].gy)/2,F=proj(c,[fx,fy,0]),H=1.74,tip=proj(c,[fx+LIGHT.dx*LIGHT.k*H,fy,LIGHT.dz*LIGHT.k*H]);return {pv,F,tip,s:F.s,c};});
  const root=(dark)=><frame x={0} y={0} width={2} height={2} layout="none" origin="center" animate={[tr("offsetX",(q,i)=>Q[i].pv.x),tr("offsetY",(q,i)=>Q[i].pv.y),tr("scale",(q,i)=>Q[i].pv.s/U)]}>{body(dark)}</frame>;
  const ep=(k,fn)=>({property:"effectParam",effectIndex:0,effectParam:k,keyframes:FRAMES.map((q,i)=>({at:Math.min(DUR-.001,i/FPS),value:fn(i),easing:"linear"}))});
  const shadow=<frame x={0} y={0} width={1080} height={1920} layout="none" effects={[{kind:"shader",params:{glsl:SHEAR,fx:Q[0].F.x,fy:Q[0].F.y,bx:Q[0].tip.x-Q[0].F.x,by:Q[0].tip.y-Q[0].F.y,hh:1.74*Q[0].s}}]} animate={[ep("fx",(i)=>Q[i].F.x),ep("fy",(i)=>Q[i].F.y),ep("bx",(i)=>Q[i].tip.x-Q[i].F.x),ep("by",(i)=>Q[i].tip.y-Q[i].F.y),ep("hh",(i)=>1.74*Q[i].s)]}>{root(true)}</frame>;
  const contact=[0,1].flatMap((n)=>{const pos=(i)=>{const q=FRAMES[i],a=Math.max(0,q.f[n].ang);return proj(Q[i].c,[q.f[n].x+.08+a*.05,q.f[n].gy,0]);},up=(q)=>Math.max(.08,1-q.f[n].lift*9-Math.max(0,q.f[n].ang)*.9);
    const one=(w,h,b,o)=><rect x={-w/2} y={-h/2} width={w} height={h} radius={h/2} fill="#120A0C" effects={[{kind:"blur",params:{px:b}}]} animate={[tr("offsetX",(q,i)=>pos(i).x),tr("offsetY",(q,i)=>pos(i).y),tr("scale",(q,i)=>Q[i].s/343),tr("opacity",(q)=>o*up(q))]}/>;
    return [one(132,22,8,.5),one(92,9,2.5,.75)];});
  const dust=[];steps.forEach((st,k)=>{for(let j=0;j<5;j++){const d=.45+.25*R(j,k+2),t0=st.t+.01*j,dx=(R(j,k+3)-.5)*.3,sz=44+40*R(j,k+4),vy=.10+.14*R(j,k+5),n=Math.floor((d-.005)*FPS);const rows=[...Array(n+1).keys()].map(i=>{const t=t0+i/FPS*.999,c=camAtT(t),u=i/n,w=proj(c,[st.x+dx*(1+u),ground(st.x)+.02+vy*u,0]);return {u,w,k:i/FPS};});
      dust.push(<rect at={t0} duration={d} x={-sz/2} y={-sz/2} width={sz} height={sz} radius={sz/2} fill={{kind:"radial",stops:[{offset:0,color:"#B8966F"},{offset:.75,color:"#B8966F00"}]}} animate={[kf("offsetX",rows.map(r=>({at:r.k,value:r.w.x,easing:"linear"}))),kf("offsetY",rows.map(r=>({at:r.k,value:r.w.y,easing:"linear"}))),kf("scale",[{at:0,value:.5},{at:d-.01,value:1.5}]),kf("opacity",[{at:0,value:0},{at:d*.15,value:.42},{at:d-.01,value:0}])]}/>);}});
  const lock=(X,Y,Z,kids,ox=0,dur=DUR)=>{const tt=(prop,fn)=>kf(prop,FRAMES.map((q,i)=>({at:i/FPS,value:fn(i),easing:"linear"})).filter(r=>r.at<dur-.02));return <frame x={0} y={0} width={2} height={2} layout="none" origin="center" animate={[tt("offsetX",(i)=>proj(Q[i].c,[X,Y,Z]).x+ox),tt("offsetY",(i)=>proj(Q[i].c,[X,Y,Z]).y),tt("scale",(i)=>proj(Q[i].c,[X,Y,Z]).s/U)]}>{kids}</frame>;};
  const OX=700,wide=(kids,fx,at,dur)=><frame at={at} duration={dur} x={-OX} y={0} width={2480} height={1920} layout="none" effects={fx}>{kids}</frame>;
  const stone=(w,h,lit,mid,dk)=>{const a=w/360,b=h/150;const P=(d)=>d.replace(/(-?\d+) (-?\d+)/g,(m,x,y)=>`${(+x*a).toFixed(1)} ${(+y*b).toFixed(1)}`);return [
    <path x={0} y={0} width={1} height={1} d={P("M -180 12 L -158 -46 L -96 -118 L -12 -150 L 66 -130 L 142 -72 L 180 14 Q 0 34 -180 12 Z")} fill={mid}/>,
    <path x={0} y={0} width={1} height={1} d={P("M -180 12 L -158 -46 L -96 -118 L -12 -150 L -34 -84 L -86 -34 L -112 22 Q -150 18 -180 12 Z")} fill={lit}/>,
    <path x={0} y={0} width={1} height={1} d={P("M 66 -130 L 142 -72 L 180 14 Q 120 26 56 28 L 74 -48 Z")} fill={dk}/>];};
  const SX=-2.17,SZ=.62,SY=ground(SX)-.012,S2X=-1.42,S2Z=-.5,S2Y=ground(S2X)-.02;
  const sshadow=(X,Y,Z,len,h)=>{const a=proj(Q[0].c,[X,Y,Z]),b=proj(Q[0].c,[X+LIGHT.dx*len,Y,Z+LIGHT.dz*len]),ang=Math.atan2(b.y-a.y,b.x-a.x)*57.3,l=Math.hypot(b.x-a.x,b.y-a.y)*U/a.s;return lock(X,Y,Z,[<rect x={-30} y={-h/2} width={l+60} height={h} radius={h/2} rotation={ang} fill="#120A0C" opacity={.5}/>]);};
  const PNT=[{kind:"shader",params:{glsl:PAINTS,res:1080,ao:1}}];
  const near=wide([lock(SX,SY,SZ,stone(236,126,"#8E6A52","#6C4C3E","#40291F"),OX,2.6)],PNT,0,2.6);
  const far=wide([lock(S2X,S2Y,S2Z,stone(260,120,"#7C5C48","#5C4236","#38251D"),OX,4.2)],PNT,0,4.2);
  const fg=wide([lock(FGX,ground(FGX)-.1,FGZ,stone(470,170,"#3A2826","#2A1D1F","#1C1417"),OX,1.7)],[{kind:"shader",params:{glsl:SOFT}}],0,1.7);
  p.compose(<frame width={1080} height={1920} layout="none"><frame x={0} y={0} width={1080} height={1920} layout="none" effects={[{kind:"shader",params:{glsl:WARM}}]}><media file={plate} x={0} y={0} width={1080} height={1920} fit="fill" muted={true}/></frame>{sshadow(SX,SY,SZ,.5,30)}{sshadow(S2X,S2Y,S2Z,.45,26)}{far}{shadow}{contact}{dust}<frame x={0} y={0} width={1080} height={1920} layout="none" effects={[{kind:"shader",params:{glsl:TINTG,r:.93,g:.83,b:.76,gm:1.1,hr:.72,hg:.42,hb:.28,hz:.07,er:1,eg:.66,eb:.36,rm:.5,lx:-1,ly:-.25,rw:6}},{kind:"shader",params:{glsl:PAINTS,res:1080,ao:1}}]}>{root(false)}</frame>{near}{fg}</frame>,{at:0,dur:DUR});
};
