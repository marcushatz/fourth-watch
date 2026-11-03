import { readFileSync } from "node:fs";
import { SHOTS,P0 } from "./shots.js";
const read=(f)=>readFileSync(new URL(f,import.meta.url),"utf8");
const GL=read("./gl/lib.glsl").replace("vec2 map(vec3 p);","vec2 map(vec3 p);\nfloat gSet,gWall,gTent,gShard,gSerp,gDim; vec3 gSP; float gSS;")+read("./gl/serp.glsl")+read("./gl/world.glsl").replace("float gSet,gWall,gTent,gShard,gSerp,gDim;\nvec3 gSP; float gSS;\n","")+read("./gl/shade.glsl");
const PAINT=read("./gl/paint.glsl");
const SMALL=!!process.env.FW_SMALL, W=SMALL?540:720, H=SMALL?960:1280, RATE=10;
export default async ({project})=>{
  const p=await project({dir:SMALL?"plates_s15":"plates30",size:`${W}x${H}`,fps:SMALL?15:30,background:"#000000"});
  const nodes=SHOTS.map((s)=>{const d=s.b-s.a,n=Math.max(2,Math.ceil(d*RATE)),T=[...Array(n+1).keys()].map(i=>i/n);
    const smp=T.map(u=>{const c=s.cam(u);return {...P0,...s.par(u),rx:c.ro[0],ry:c.ro[1],rz:c.ro[2],tx:c.ta[0],ty:c.ta[1],tz:c.ta[2],lens:c.lens};});
    const keys=Object.keys(P0), anim=[];
    for(const k of keys){const vals=smp.map(q=>q[k]); if(vals.every(v=>Math.abs(v-vals[0])<1e-6))continue;
      anim.push({property:"effectParam",effectIndex:0,effectParam:k,keyframes:T.map((u,i)=>({at:Math.min(d-0.001,u*d),value:vals[i],easing:"linear"}))});}
    return <rect at={s.a} duration={d} x={0} y={0} width={W} height={H} fill="#000000" effects={[{kind:"shader",params:{glsl:GL,...smp[0]}},{kind:"shader",params:{glsl:PAINT}}]} animate={anim}/>;});
  p.compose(<frame width={W} height={H} layout="none">{nodes}</frame>,{at:0,dur:58.7});
};
