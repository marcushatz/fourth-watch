import { readFileSync, existsSync } from "node:fs";
import { SHOTS,camAt,proj } from "./shots.js";
import { makeCast,SP,LOOK,TINTG } from "./cast.jsx";
import { makeType,tW,eW,PARCH,GOLD,EMBER,ASH } from "./type.jsx";
const fr=(v)=>v-Math.floor(v), R=(i,s=1)=>fr(Math.sin(i*12.9898+s*78.233)*43758.5453);
const kf=(property,rows)=>({property,keyframes:rows.map(([at,value,easing])=>easing?{at,value,easing}:{at,value})});
const S=(id)=>SHOTS.find(x=>x.id==id), END=58.7;
const ART="/home/user/what-if/fw-serpent/art/";
const OUT=[.16,1,.3,1],IN=[.7,0,1,.6];
export default async ({project})=>{
  const p=await project({dir:process.env.FW_DIR||"comp",size:"1080x1920",fps:30,background:"#0B0A0C"});
  const plate=await p.add(process.env.FW_PLATE||"/home/user/what-if/fw-serpent/edit/renders_plate_s.mp4");
  const insE=await p.add("/home/user/what-if/fw-serpent/edit/ins_e.mp4");
  const A={};for(const k of Object.keys(SP))A["s_"+k]=await p.add(ART+"s_"+k+".png");
  const F={cz:await p.add("/home/user/what-if/bronze-v4/fonts/Cinzel.ttf"),co:await p.add("/home/user/what-if/ink-serpent/fonts/Cormorant.ttf")};
  const {Fig,Shad}=makeCast(A), {Cap,Tag,cap,ser,shade}=makeType(F);
  // ---- the hammer meets the pole on screen whatever the camera does
  const uu=(c)=>{const w=c.ta.map((v,i)=>v-c.ro[i]),l=Math.hypot(...w),n=[w[0]/l,w[1]/l,w[2]/l],r=[-n[2],0,n[0]],rl=Math.hypot(...r);return r.map(x=>x/rl);};
  const IMPACT=[0,1.58,0],HX=0.86,HY=1.43;
  const kingAt=(sh)=>(t)=>{const c=camAt(sh,t),r=uu(c);return [IMPACT[0]-r[0]*HX,0,IMPACT[2]-r[2]*HX];};
  const crowd=(sh,at,dur,look,o={})=>[["p4m",3.1,0.9],["p2m",2.0,3.2],["p3m",3.2,3.0],["p1m",2.3,-1.1],["p3m",3.2,-2.2],["p2m",1.5,-3.0],["p2",0.4,-2.7],["p1",-2.2,-2.0],["p3",-3.2,-0.8],["p4",-3.0,-3.2]]
    .map(([n,x,z])=>({n,x,z})).sort((a,b)=>a.z-b.z).flatMap(({n,x,z})=>[process.env.FW_INT?Shad(n,[x,0,z],{shot:sh,at,dur,...o}):null,Fig(n,[x,0,z],{shot:sh,at,dur,look:look,shw:.8,...o})].filter(Boolean));
  const motes=(t0,t1,n,sd,o={})=>Array.from({length:n},(_,i)=>{const d=t1-t0,x=60+960*R(i,sd),y=(o.y0??500)+(o.h??1100)*R(i,sd+1),z=(o.size||7)*(.5+1.1*R(i,sd+2)),dy=(o.vy??-24)*d*(.5+R(i,sd+3)),dx=(R(i,sd+4)-.5)*(o.vx??30)*d;
    return <rect at={t0} duration={d} x={x} y={y} width={z} height={z*(.6+.8*R(i,sd+5))} radius={z*.3} fill={i%3==0?"#FFE9B0":GOLD} animate={[kf("offsetY",[[0,0],[d-.01,dy]]),kf("offsetX",[[0,0],[d-.01,dx]]),kf("opacity",[[0,0],[.25,.9],[d-.3,.8],[d-.01,0]])]}/>;});
  // ---- the camp's lamps: tents are in rings, a lamp sits at each tent's mouth
  const lamps=[];for(let r=0;r<4;r++){const n=9+r*4,sec=6.28318/n,Rr=5+2.9*r;for(let k=0;k<n;k++){const a=k*sec-r*.37,aa=Math.atan2(Math.sin(a),Math.cos(a));if(aa>1.35&&aa<2.85)continue;lamps.push([Rr*Math.cos(a)*.93,.08,Rr*Math.sin(a)*.93]);}}
  const lamp=(q,sh,at,dur,op,sz=1)=>{const n=Math.max(2,Math.ceil(dur*5)),X=[],Y=[],Sc=[];for(let i=0;i<=n;i++){const u=i/n,c=camAt(sh,at+u*dur*.999),w=proj(c,q),k=Math.min(dur-.001,u*dur);X.push([k,w.x-45,"linear"]);Y.push([k,w.y-45,"linear"]);Sc.push([k,Math.max(.14,w.s/120)*sz,"linear"]);}
    return <frame at={at} duration={dur} x={0} y={0} width={90} height={90} layout="none" origin="center" animate={[kf("offsetX",X),kf("offsetY",Y),kf("scale",Sc),kf("opacity",op)]}>
      <rect x={0} y={0} width={90} height={90} radius={45} fill={{kind:"radial",stops:[{offset:0,color:"#FFF2C4"},{offset:.14,color:"#FFC765"},{offset:.42,color:"#F08A2EA0"},{offset:.7,color:"#F08A2E00"}]}}/></frame>;};
  // fire comes in from the dark edge of the camp along wandering tracks and puts lamps out
  const trails=[];for(let i=0;i<8;i++){const a0=i/8*6.283+.5*R(i,3),pts=[];let rr=19+3*R(i,4),a=a0;for(let k=0;k<26;k++){const u=k/25;pts.push([rr*Math.cos(a),.05,rr*Math.sin(a),u]);rr-=.62+.2*R(k,i+5);a+=.11*Math.sin(k*.7+i)+.03*(R(k,i)-.5);}trails.push(pts);}
  const T_TR=10.96,T_TRD=.36;
  const outAt=lamps.map((q,i)=>i%6==2?1e9:10.98+.3*R(i,41));
  const trailDots=[];const shD=S("D");trails.forEach((tr,i)=>tr.forEach((pt,k)=>{const t=T_TR+pt[3]*T_TRD+R(k,i)*.03,q=proj(camAt(shD,t),pt.slice(0,3)),z=(32+22*Math.sin(k*.8+i))*q.s/95;const d=Math.min(.62,11.3-t);if(d<=.05)return;
    trailDots.push(<rect at={t} duration={d} x={q.x-z/2} y={q.y-z/2} width={z} height={z} radius={z/2} fill={{kind:"radial",stops:[{offset:0,color:"#FFE0A0"},{offset:.3,color:"#FF7A26"},{offset:.7,color:"#E0401000"}]}} animate={[kf("opacity",[[0,1],[d-.01,0]])]}/>);}));
  const shI=S("I"),poleTop=[0.25,2.5,0];
  const dist=lamps.map(q=>Math.hypot(q[0],q[2]));
  const relight=(i)=>tW(47)+.0+(dist[i]-5)/17*.55;   // "live" spreads outward
  const lineAcross=(a,b,t0,d,col,w=3,o=.9)=>{const dx=b.x-a.x,dy=b.y-a.y,L=Math.hypot(dx,dy),ang=Math.atan2(dy,dx)*57.2958;
    return <frame at={t0} duration={d} x={a.x} y={a.y} width={2} height={2} layout="none" origin="center" animate={[kf("rotation",[[0,ang],[d-.01,ang]]),kf("opacity",[[0,o],[d-.2,o],[d-.01,0]])]}>
      <frame x={0} y={0} width={2} height={2} layout="none" origin="center" animate={[kf("scaleX",[[0,0,OUT],[Math.min(.3,d*.5),1],[d-.02,1]])]}><rect x={0} y={-w/2} width={L} height={w} fill={col}/></frame></frame>;};
  // ---- the books of the Bible run past while the serpent is gone from them
  const BOOKS=["NUMBERS","DEUTERONOMY","JOSHUA","JUDGES","RUTH","1 SAMUEL","2 SAMUEL","1 KINGS","2 KINGS"],RH=250,JT=18.06,JD=2.88;
  const SERP_D="M 0 118 C 34 106 46 96 0 84 C -46 72 -46 60 0 48 C 46 36 46 24 0 12 C -46 0 -40 -30 -6 -44 C 18 -54 40 -46 58 -36 L 74 -38 L 58 -26 C 34 -34 10 -36 -8 -24 C -30 -10 -8 0 8 4";
  const serpIcon=(x,y,sz,anim,at,dur)=><frame at={at} duration={dur} x={x} y={y} width={2} height={2} layout="none" origin="center" animate={anim}><path x={0} y={0} width={1} height={1} d={SERP_D} stroke={{width:11,color:GOLD,cap:"round"}}/></frame>;
  const books=<frame at={JT} duration={JD} x={0} y={0} width={1080} height={1920} layout="none">
    <rect x={0} y={0} width={1080} height={1920} fill={{kind:"radial",stops:[{offset:0,color:"#2A1E16"},{offset:.7,color:"#120C0A"}]}}/>
    <frame x={0} y={0} width={1080} height={1920} layout="none" animate={[kf("offsetY",[[0,0,[.5,0,.25,1]],[JD-.14,-(BOOKS.length-1)*RH],[JD-.01,-(BOOKS.length-1)*RH]])]}>
      <rect x={236} y={1000-200} width={4} height={(BOOKS.length-1)*RH+420} fill="#6B4A33"/>
      {BOOKS.map((b,i)=><text x={290} y={1000+i*RH-42} width={760} {...cap(i==0||i==8?76:62,700)} letterSpacing={3} color={i==8?GOLD:(i==0?PARCH:"#8C8174")} shadow={shade}>{b}</text>)}
      {BOOKS.map((b,i)=><rect x={222} y={1000+i*RH-12} width={32} height={32} radius={16} fill={i==0||i==8?GOLD:"#3A2A20"}/>)}
    </frame>
    <rect x={0} y={0} width={1080} height={880} fill={{kind:"linear",angle:180,stops:[{offset:0,color:"#120C0A"},{offset:.68,color:"#1C1410"},{offset:1,color:"#1C141000"}]}}/>
    {serpIcon(120,1010,1,[kf("opacity",[[0,1],[tW(50)-JT,1],[tW(50)-JT+.35,0],[JD-.01,0]]),kf("scale",[[0,1],[tW(50)-JT,1],[tW(50)-JT+.35,.6],[JD-.01,.6]])],0,JD)}
    {serpIcon(120,1010,1,[kf("opacity",[[0,0],[.05,1]]),kf("scale",[[0,1.7,OUT],[.16,1],[.26,1]])],JD-.28,.28)}
    <rect at={JD-.26} duration={.26} x={0} y={0} width={1080} height={1920} fill="#FFE9B0" animate={[kf("opacity",[[0,.25],[.2,0]])]}/>
  </frame>;
  // ---- the split: an empty line rises beside the serpent
  const LX=804,POLE_B=1560,POLE_T=640;
  const liftBar=<frame at={39.24} duration={4.86} x={0} y={0} width={1080} height={1920} layout="none">
    <frame x={0} y={0} width={1080} height={1920} layout="none" animate={[kf("offsetX",[[0,1080,[.65,0,.2,1]],[.42,540],[2.72,540,[.65,0,.2,1]],[3.3,0],[4.84,0]])]}>
      <rect x={0} y={0} width={1090} height={1920} fill={{kind:"linear",angle:180,stops:[{offset:0,color:"#0B1020"},{offset:.75,color:"#141222"},{offset:1,color:"#2A1A1C"}]}}/>
      <rect x={0} y={0} width={5} height={1920} fill={GOLD}/>
      <frame x={270} y={POLE_B} width={2} height={2} layout="none" origin="center" animate={[kf("offsetX",[[0,0],[2.72,0,[.65,0,.2,1]],[3.3,270],[4.84,270]])]}>
        <frame x={0} y={0} width={2} height={2} layout="none" origin="center" animate={[kf("scaleY",[[0,0.001,"hold"],[tW(108)-39.24,0.001,OUT],[tW(108)-39.24+.7,1],[4.84,1]])]}>
          <rect x={-7} y={-(POLE_B-POLE_T)} width={14} height={POLE_B-POLE_T} fill={{kind:"linear",angle:90,stops:[{offset:0,color:"#FFF2C4"},{offset:1,color:"#F0C062"}]}} shadow={{x:0,y:0,blur:30,color:"#F0C062"}}/></frame>
        <frame at={tW(113)-39.24} x={-210} y={-(POLE_B-POLE_T)+200} width={420} height={14} layout="none" reveal={{from:"center",at:0,duration:.8}}>
          <rect x={0} y={0} width={420} height={14} fill="#FFE9B0" shadow={{x:0,y:0,blur:26,color:"#F0C062"}}/></frame>
      </frame>
    </frame>
  </frame>;
  const puff=(x,y,t,d,sz,sd)=><rect at={t} duration={d} x={x-sz/2} y={y-sz/2} width={sz} height={sz} radius={sz/2} fill={{kind:"radial",stops:[{offset:0,color:"#D9C7B0"},{offset:.7,color:"#D9C7B000"}]}} animate={[kf("offsetY",[[0,0],[d-.01,-340-160*R(sd,2)]]),kf("offsetX",[[0,0],[d*.5,50*(R(sd,3)-.5)],[d-.01,120*(R(sd,4)-.5)]]),kf("scale",[[0,.5],[d-.01,2.1]]),kf("opacity",[[0,0],[d*.2,.22],[d-.01,0]])]}/>;
  const smoke=(x,y,t0,t1,n,sd)=>Array.from({length:n},(_,i)=>{const t=t0+(t1-t0-1.2)*(i/n);return puff(x+18*(R(i,sd)-.5),y,t,1.2+.3*R(i,sd+1),70+50*R(i,sd+2),i+sd);});
  const nodes=[];
  nodes.push(<media file={plate} x={0} y={0} width={1080} height={1920} fit="fill" muted={true}/>);
  // A, B: frozen at the moment of the blow
  const H0=.84;
  for(const [id,at,dur] of [["A",0,3.64],["B",3.64,2.82]]){const sh=S(id);nodes.push(...crowd(sh,at,dur,"frozen",{}));
    if(id=="A"){nodes.push(Fig("hez2",[0,.1,.18],{shot:sh,at:0,dur:.46,look:"frozen",move:(t)=>{const q=kingAt(sh)(t);return [q[0]-.1*(1-t/.46),0,q[2]];},shw:.8}));
      nodes.push(Fig("hez3",[0,.1,.18],{shot:sh,at:.46,dur:.34,look:"frozen",move:(t)=>kingAt(sh)(t),shw:.8}));
      if(process.env.FW_INT)nodes.push(Shad("hez4",[0,.1,.18],{shot:sh,at:.8,dur:dur-.8,move:(t)=>kingAt(sh)(t)}));
      nodes.push(Fig("hez4",[0,.1,.18],{shot:sh,at:.8,dur:dur-.8,look:"frozen",move:(t)=>kingAt(sh)(t),shw:.8}));
    } else nodes.push(Fig("hez4",[0,.1,.18],{shot:sh,at,dur,look:"frozen",move:(t)=>kingAt(sh)(t),shw:.8}));}
  nodes.push(...motes(H0,6.4,46,3,{vy:-2,vx:3,size:8,y0:500,h:1000}));
  nodes.push(<rect at={H0} duration={.2} x={0} y={0} width={1080} height={1920} fill="#FFF3CE" animate={[kf("opacity",[[0,.95],[.19,0]])]}/>);
  // C: everything runs backwards
  {const sh=S("C");[["hez4",6.46,.1,-1.0],["hez3",6.56,.1,-1.5],["hez2",6.66,.1,-2.1],["hez1",6.76,.16,-3.0]].forEach(([n,at,dur,x])=>nodes.push(Fig(n,[x,0,.2],{shot:sh,at,dur,look:"frozen",shw:.8})));
   nodes.push(...crowd(sh,6.46,.5,"frozen",{opacity:[{at:0,value:1},{at:.2,value:1},{at:.49,value:0}]}));
   for(let i=0;i<14;i++){const y=120+1700*R(i,7),t=6.5+.9*R(i,8);nodes.push(<rect at={t} duration={.16} x={0} y={y} width={1080} height={3+8*R(i,9)} fill="#FFE9B0" animate={[kf("opacity",[[0,.22],[.15,0]])]}/>);}}
  // D: the camp, lamps lit, then fire on the sand
  lamps.forEach((q,i)=>{const o=outAt[i];const at=7.3,dur=Math.min(11.34,o+.1)-at;if(dur>.2)nodes.push(lamp(q,shD,at,dur,[[0,0],[.3,1],[dur-.12,1],[dur-.01,0]]));});
  const Cu=(n,o)=>{const m=SP[n],h=o.w*m.h/m.w,d=o.dur;const a=o.anim||[];return <frame at={o.at} duration={d} x={o.x} y={o.y} width={o.w} height={h} layout="none" origin="center" animate={a}><media file={A["s_"+n]} x={0} y={0} width={o.w} height={h} fit="fill" muted={true} effects={[{kind:"shader",params:{glsl:TINTG,...LOOK[o.look||"dusk"]}}]}/></frame>;};
  // the danger: serpents in the camp, a man struck, a woman over someone fallen, then the lamps go out
  const WAVE=`vec4 pixel(vec2 uv){ vec2 q=vec2(uv.x,(uv.y-0.5)*u_pad+0.5); q.y+=u_amp*sin(q.x*u_k+u_time*u_w)*smoothstep(0.0,0.1,q.x); if(q.y<=0.0||q.y>=1.0) return vec4(0.0); vec4 s=texture(u_src,q); if(s.a<0.01) return vec4(0.0); vec3 c=pow(s.rgb,vec3(u_gm))*vec3(u_r,u_g,u_b); return vec4(c*s.a,s.a); }`;
  const Snake=(n,t0,d,y,w,x0,x1,dir)=>{const m=SP[n],h=w*m.h/m.w,pad=1.9,H=h*pad;
    return <frame at={t0} duration={d} x={0} y={0} width={2} height={2} layout="none" animate={[kf("offsetX",[[0,x0,"linear"],[d-.01,x1]])]}>
      <rect x={w*.04} y={y+h*.08} width={w*.9} height={h*.26} radius={h*.13} fill="#0B070A" effects={[{kind:"blur",params:{px:10}}]} animate={[kf("opacity",[[0,.4],[d-.01,.4]])]}/>
      <media file={A["s_"+n]} x={0} y={y-H/2} width={w} height={H} fit="fill" muted={true} effects={[{kind:"shader",params:{glsl:WAVE,pad,amp:.055,k:15,w:dir*20,gm:1,r:1.06,g:.92,b:.84}}]}/>
    </frame>;};
  const BG=(at,dur,sc,dark,dr=1.05)=>{const W=1080*sc,H=1920*sc;return <frame at={at} duration={dur} x={0} y={0} width={1080} height={1920} layout="none">
      <frame x={0} y={0} width={1080} height={1920} layout="none" origin="center" animate={[kf("scale",[[0,1],[dur-.01,dr]])]}><media file={insE} x={(1080-W)/2} y={1920-H} width={W} height={H} fit="fill" muted={true}/></frame>
      <rect x={0} y={0} width={1080} height={1920} fill={dark[0]} animate={[kf("opacity",[[0,dark[1]],[dur-.01,dark[1]]])]}/></frame>;};
  const S1=9.5,S2=10.38,STRK=10.46,S3=10.76,S4=11.0;
  nodes.push(BG(S1,S2-S1,1.5,["#2A0A0C",.38]));
  nodes.push(Snake("snk1",S1,S2-S1,1215,520,-340,760,1));
  nodes.push(Snake("snk1m",S1,S2-S1,1385,980,840,-340,-1));
  nodes.push(Snake("snk1",S1,S2-S1,1640,1760,-1560,-120,1));
  nodes.push(BG(S2,S3-S2,1.9,["#260A0C",.5]));
  nodes.push(<rect at={S2} duration={S3-S2} x={40} y={1640} width={1060} height={70} radius={35} fill="#0B070A" effects={[{kind:"blur",params:{px:22}}]} animate={[kf("opacity",[[0,.6],[S3-S2-.01,.6]])]}/>);
  nodes.push(Cu("fal1",{at:S2,dur:S3-S2,x:-120,y:1010,w:1060,look:"dusk",anim:[kf("offsetX",[[0,0],[STRK-S2+.06,0],[STRK-S2+.15,-30,OUT],[S3-S2-.01,-38]])]}));
  nodes.push(Cu("snk2m",{at:S2,dur:S3-S2,x:590,y:960,w:640,look:"dusk",anim:[kf("offsetX",[[0,86],[STRK-S2-.02,92],[STRK-S2+.09,-70,OUT],[S3-S2-.01,-50]]),kf("offsetY",[[0,16],[STRK-S2-.02,20],[STRK-S2+.09,-14,OUT],[S3-S2-.01,-6]])]}));
  nodes.push(<rect at={STRK} duration={.14} x={0} y={0} width={1080} height={1920} fill="#FF7A2E" animate={[kf("opacity",[[0,.32],[.13,0]])]}/>);
  nodes.push(BG(S3,S4-S3,1.9,["#160709",.66],1.03));
  nodes.push(<rect at={S3} duration={S4-S3} x={60} y={1800} width={1040} height={60} radius={30} fill="#0B070A" effects={[{kind:"blur",params:{px:22}}]} animate={[kf("opacity",[[0,.6],[S4-S3-.01,.6]])]}/>);
  nodes.push(Cu("fal2",{at:S3,dur:S4-S3,x:-50,y:880,w:1240,look:"duskB",anim:[kf("scale",[[0,1],[S4-S3-.01,1.04]])]}));
  nodes.push(...trailDots);
  nodes.push(<rect at={S4} duration={11.34-S4} x={0} y={0} width={1080} height={1920} fill="#0A0810" animate={[kf("opacity",[[0,.1],[.32,.5]])]}/>);
  // E, G: Moses hears, points, raises the pole
  {const sh=S("E");const blue=tW(33);nodes.push(Fig("mos1",[-1.75,0,3.5],{shot:sh,at:11.34,dur:blue-11.34,look:"dusk",shw:.9,size:1}));nodes.push(Fig("mos2",[-1.75,0,3.5],{shot:sh,at:blue,dur:14.26-blue,look:"dusk",shw:.9}));}
  nodes.push(Fig("mos3",[-0.62,0.3,0.05],{shot:S("G1"),at:14.26,dur:.58,look:"dusk",shw:.9}));
  // H: he looks; I: the camp relights
  {const sh=S("H"),wp=[-3.55,0,5.5];nodes.push(Fig("p5",wp,{shot:sh,at:15.56,dur:1.64,look:"dusk",shw:.7}));
   const c=tW(43)-.04,b=proj(camAt(sh,c),[0.6,2.69,0]);
   nodes.push(Cu("cu_man",{at:c,dur:17.2-c,x:-90,y:600,w:1000,look:"dusk",anim:[kf("scale",[[0,1],[17.19-c,1.05]])]}));}
  lamps.forEach((q,i)=>{const t=relight(i),at=Math.min(t,17.9);nodes.push(lamp(q,shI,17.2,.86,[[0,0],[Math.max(.01,at-17.2),0],[Math.min(.84,at-17.2+.1),1],[.85,1]],1.1));
    if(i%2==0){const a=proj(camAt(shI,17.5),q),b=proj(camAt(shI,17.5),[0.2,2.4,0]);const t2=Math.max(17.2,t-.12);if(t2<17.9)nodes.push(lineAcross(a,b,t2,18.06-t2,"#FFD27A",2,.7));}});
  nodes.push(books);
  // K: offerings
  {const sh=S("K");[["p4",-3.1,.6,"amber"],["p3",-2.4,1.8,"amber"],["p1m",2.5,1.6,"amberL"],["p2m",2.9,.8,"amberL"],["p3m",1.9,3.0,"amberL"],["p2",-1.7,2.9,"amber"],["p1",-1.35,4.1,"amber"]].sort((a,b)=>a[2]-b[2]).forEach(([n,x,z,l])=>nodes.push(Fig(n,[x,0,z],{shot:sh,at:20.94,dur:2.92,look:l,shw:.8,sho:.65})));
   nodes.push(...motes(20.94,23.86,26,6,{vy:-34,vx:20,size:6,y0:700,h:900}));
   const th=tW(60)-.1;nodes.push(...smoke(690,1010,th+.2,23.9,14,5));
   nodes.push(Cu("cu_hands",{at:th,dur:23.86-th,x:300,y:860,w:760,look:"amber",anim:[kf("offsetY",[[0,700,OUT],[.62,0],[23.85-th,-34]])]}));}
  // L: the king comes
  {const sh=S("L"),I=tW(67);[["p1",-2.9,1.4],["p3",-2.3,.6],["p1m",2.4,1.3],["p4m",2.9,.7]].forEach(([n,x,z])=>nodes.push(Fig(n,[x,0,z],{shot:sh,at:23.86,dur:I-23.86,look:n.endsWith("m")?"amberL":"amber",shw:.8})));
   const K=[-0.98,.1,.18];
   nodes.push(Fig("hez2",K,{shot:sh,at:24.36,dur:.2,look:"amber",shw:.8}));nodes.push(Fig("hez3",K,{shot:sh,at:24.56,dur:.3,look:"amber",shw:.8}));nodes.push(Fig("hez4",K,{shot:sh,at:24.86,dur:I-24.86,look:"amber",shw:.8}));
   nodes.push(<rect at={23.86} duration={.54} x={0} y={0} width={1080} height={1920} fill="#0B0A0C" animate={[kf("opacity",[[0,.72],[.53,.72]])]}/>);
   nodes.push(Cu("cu_hez",{at:23.86,dur:.54,x:40,y:380,w:1040,look:"amberL",anim:[kf("scale",[[0,1],[.53,1.05]])]}));}
  // M: frozen again, the name
  {const sh=S("M");nodes.push(...crowd(sh,24.98,3.08,"frozen",{}));nodes.push(Fig("hez4",[0,.1,.18],{shot:sh,at:24.98,dur:3.08,look:"frozen",move:(t)=>kingAt(sh)(t),shw:.8}));nodes.push(...motes(24.98,28.0,46,9,{vy:-2,vx:3,size:8,y0:500,h:1000}));
   nodes.push(<rect at={24.98} duration={.2} x={0} y={0} width={1080} height={1920} fill="#FFF3CE" animate={[kf("opacity",[[0,.95],[.19,0]])]}/>);}
  // N: the blow is over and the people fade out of the story
  {const sh=S("N"),q=kingAt(S("M"))(28.05),K=[q[0],.1,q[2]+.18];
   nodes.push(...crowd(sh,28.06,3.24,"frozen",{opacity:[{at:0,value:1},{at:1.2,value:1},{at:2.2,value:0},{at:3.23,value:0}]}));
   nodes.push(Fig("hez4",K,{shot:sh,at:28.06,dur:.2,look:"frozen",shw:.8}));
   nodes.push(Fig("hez5",K,{shot:sh,at:28.26,dur:3.04,look:"frozen",shw:.8,opacity:[{at:0,value:1},{at:1.0,value:1},{at:2.0,value:0},{at:3.03,value:0}]}));}
  // O: the night yard
  {const sh=S("O"),nw=[1.05,0,-.1],c=tW(85);nodes.push(Fig("nic1m",nw,{shot:sh,at:31.3,dur:c-31.3,look:"night",shw:.7}));nodes.push(Fig("nic2m",nw,{shot:sh,at:c,dur:37.44-c,look:"ghostlit",shw:.7}));
   const lp=[0,.74,-.2];nodes.push(lamp(lp,sh,31.3,3.2,[[0,0],[.5,1],[1.0,.85],[1.4,1],[1.9,.9],[3.19,1]],.42));
   const OS="M -220 1330 C -60 1370 110 1450 250 1570 C 370 1670 460 1800 500 1980 L -220 1980 Z";
   nodes.push(<frame at={31.3} duration={3.2} x={0} y={0} width={1080} height={1920} layout="none" animate={[kf("offsetX",[[0,-46],[3.19,0]]),kf("opacity",[[0,0],[.5,1],[3.19,1]])]}>
     <path x={0} y={0} width={1080} height={1920} d={OS} fill={{kind:"linear",angle:135,stops:[{offset:0,color:"#2A1A16"},{offset:.6,color:"#5A3626"},{offset:1,color:"#9A6238"}]}} effects={[{kind:"blur",params:{px:13}}]}/>
     <path x={0} y={0} width={1080} height={1920} d="M -60 1560 C 60 1640 150 1760 190 1960" stroke={{width:26,color:"#21140F",cap:"round"}} effects={[{kind:"blur",params:{px:16}}]}/>
     <path x={0} y={0} width={1080} height={1920} d="M -120 1400 C 50 1440 150 1520 250 1600 C 340 1680 420 1800 470 1960" stroke={{width:10,color:"#D9994E",cap:"round"}} effects={[{kind:"blur",params:{px:9}}]}/>
   </frame>);
   const f0=tW(85)-.05,f1=tW(87)+.32;
   nodes.push(<rect at={f0} duration={f1-f0} x={0} y={0} width={1080} height={1920} fill={{kind:"linear",angle:90,stops:[{offset:0,color:"#3A2A16"},{offset:.5,color:"#0C0A12"}]}}/>);
   nodes.push(Cu("cu_nic",{at:f0,dur:f1-f0,x:-20,y:560,w:1020,look:"ghostlit",anim:[kf("scale",[[0,1],[f1-f0-.01,1.08]])]}));
   nodes.push(...motes(f0,f1,14,12,{vy:-60,vx:20,size:7,y0:300,h:900}));
   nodes.push(...motes(f1,37.4,50,13,{vy:-110,vx:30,size:8,y0:900,h:900}));}
  // P: Moses lifts it in the wilderness
  nodes.push(Fig("mos2",[-1.6,0,3.1],{shot:S("P"),at:37.44,dur:1.8,look:"dusk",shw:.9,size:1}));
  nodes.push(liftBar);
  // S: the same lamps, then far more of them
  {const sh=S("S"),X0=tW(122);lamps.forEach((q,i)=>nodes.push(lamp(q,sh,44.1,X0-44.1,[[0,0],[.3,1],[X0-44.11,1]],1.1)));
   for(let i=0;i<40;i++){const q=lamps[i%lamps.length];const a=proj(camAt(sh,44.4),q),b=proj(camAt(sh,44.4),[0.2,2.4,0]);nodes.push(lineAcross(a,b,tW(119)+.015*i,X0-tW(119)-.015*i+.1,"#FFD27A",2,.6));}
   nodes.push(<rect at={X0} duration={49.74-X0} x={0} y={0} width={1080} height={1920} fill="#0A0E1E" animate={[kf("opacity",[[0,0],[2.2,.72],[49.73-X0,.72]])]}/>);
   lamps.forEach((q)=>nodes.push(lamp(q,sh,X0,49.74-X0,[[0,1],[49.73-X0,1]],1.1)));
   for(let i=0;i<560;i++){const a=R(i,31)*6.283,rr=19+105*Math.pow(R(i,32),.6),q=[rr*Math.cos(a),.1,rr*Math.sin(a)-14],t=X0+.2+(rr-19)/105*2.3;nodes.push(lamp(q,sh,t,49.74-t,[[0,0],[.25,1],[49.74-t-.01,1]],1.5));}}
  // U: the broken pieces, before dawn
  nodes.push(...motes(49.74,52.66,30,15,{vy:30,vx:6,size:7,y0:400,h:1100}));
  // V: dawn: the sun comes up behind the cross and its shadow reaches the broken pieces
  {const sh=S("V"),hp=[.74,.0,-2.3];
   nodes.push(Fig("brz",hp,{shot:sh,at:52.66,dur:6.04,look:"brzD",size:.47,sho:.5,shw:1.0}));
   nodes.push(Fig("brz",hp,{shot:sh,at:53.5,dur:5.2,look:"brzL",size:.47,noShadow:true,opacity:[{at:0,value:0},{at:1.5,value:1},{at:5.19,value:1}]}));}
  nodes.push(<rect at={52.66} duration={6.04} x={0} y={0} width={1080} height={820} fill={{kind:"linear",angle:180,stops:[{offset:0,color:"#1E0E16"},{offset:.5,color:"#1E0E16C0"},{offset:1,color:"#1E0E1600"}]}} animate={[kf("opacity",[[0,0],[1.4,0],[2.6,.7],[6.03,.7]])]}/>);
  nodes.push(...motes(52.66,58.68,70,18,{vy:-120,vx:30,size:8,y0:900,h:1000}));
  const caps=[
    Cap({from:0,lines:[5,3,3],y:150,size:104,t1:3.62,gold:[4,6]}),
    Cap({from:11,lines:[4],y:150,size:84,t1:6.42}),Cap({from:15,lines:[5],y:262,size:112,t1:6.42,gold:[19]}),Tag(4.3,6.4,0,392,1080,"2 KINGS 18:3"),
    Cap({from:20,lines:[1],y:850,size:190,t1:7.46,font:"cap"}),
    Cap({from:21,lines:[4],y:170,size:96,t1:9.42}),Cap({from:25,lines:[2,3],y:150,size:112,t1:11.28,gold:[25,26]}),
    Cap({from:30,lines:[3],y:170,size:104,t1:12.72}),Tag(11.6,15.4,0,100,1080,"NUMBERS 21"),Cap({from:33,lines:[4],y:170,size:112,t1:14.24,gold:[35,36]}),
    Cap({from:37,lines:[5],y:170,size:112,t1:15.5}),Cap({from:42,lines:[1],y:170,size:128,t1:16.2}),Cap({from:43,lines:[5],y:170,size:112,t1:17.98,gold:[43,47]}),
    Cap({from:48,lines:[3,2,2],y:130,size:104,t1:20.9,gold:[50]}),
    Cap({from:55,lines:[3,3,3],y:130,size:100,t1:23.84,gold:[61]}),Tag(21.2,23.8,0,62,1080,"2 KINGS 18:4"),
    Cap({from:64,lines:[3,2],y:150,size:116,t1:26.1,gold:[67]}),
    Cap({from:69,lines:[3],y:170,size:92,t1:28.02}),Cap({from:72,lines:[1],y:292,size:148,t1:28.02,font:"cap",gold:[]}),Tag(tW(72)+.3,28,0,452,1080,"THE NAME APPEARS ONCE"),
    Cap({from:73,lines:[4],y:170,size:112,t1:29.7,gold:[76]}),Cap({from:77,lines:[3],y:860,size:136,t1:31.16,font:"cap",fade:.34}),
    Cap({from:80,lines:[2],y:170,size:112,t1:32.56}),Cap({from:82,lines:[3,3,3],y:140,size:100,t1:35.96,gold:[89,90]}),
    Cap({from:91,lines:[3,4,3],y:130,size:92,t1:39.2,gold:[94,95],t0:36.0}),Cap({from:101,lines:[3,3,3],y:130,size:86,t1:41.9,gold:[108,109],rx:548,rw:524}),Tag(36.3,39.2,0,62,1080,"JOHN 3:14"),Tag(39.4,41.8,548,62,524,"JOHN 3:14"),
    Cap({from:110,lines:[2,3],y:170,size:100,t1:43.98,gold:[114]}),Tag(tW(110)+.3,43.96,0,410,1080,"JOHN 12:32–33"),
    Cap({from:115,lines:[3,4],y:150,size:100,t1:46.42}),Cap({from:122,lines:[2,4,2],y:130,size:100,t1:49.72,gold:[128,129]}),Tag(tW(122)+.3,49.7,0,470,1080,"JOHN 3:15"),
    Cap({from:130,lines:[4,4],y:150,size:100,t1:52.6}),
    Cap({from:138,lines:[3],y:300,size:100,t1:58.68,fade:.02}),Cap({from:141,lines:[2],y:422,size:170,t1:58.68,font:"cap",gold:[141,142],fade:.02}),
    Tag(55.1,58.66,0,128,1080,"FOURTH WATCH",{size:44,color:PARCH}),Tag(55.2,58.66,0,194,1080,"Scripture quotations are from the ESV",{size:27,color:"#E9DCC4"}),
  ];
  const SX=[[0,0]],SY=[[0,0]],SS=[[0,1]],PX=[16,-13,10,-7,4,0],PY=[-12,10,-7,5,-3,0];
  for(const [t,a] of [[H0,1],[10.46,.5],[tW(67),1.4],[tW(141)-.02,.35]]){SX.push([t-.01,0,"linear"]);SY.push([t-.01,0,"linear"]);SS.push([t-.01,1,"linear"],[t,1.04,"linear"],[t+.22,1,"linear"]);PX.forEach((v,i)=>{SX.push([t+i*.034,v*a,"linear"]);SY.push([t+i*.034,PY[i]*a,"linear"]);});}
  p.compose(<frame width={1080} height={1920} layout="none"><frame x={0} y={0} width={1080} height={1920} layout="none" origin="center" animate={[kf("offsetX",SX),kf("offsetY",SY),kf("scale",SS)]}>{nodes}</frame>{caps}</frame>,{at:0,dur:END});
};
