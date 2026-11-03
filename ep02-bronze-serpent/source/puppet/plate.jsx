import { readFileSync } from "node:fs";
import { P0 } from "../edit/shots.js";
import { camAtT, DUR, FPS, N } from "./puppet.js";
const read=(f)=>readFileSync(new URL(f,import.meta.url),"utf8");
const GL=read("../edit/gl/lib.glsl").replace("vec2 map(vec3 p);","vec2 map(vec3 p);\nfloat gSet,gWall,gTent,gShard,gSerp,gDim; vec3 gSP; float gSS;")+read("../edit/gl/serp.glsl")+read("../edit/gl/world.glsl").replace("float gSet,gWall,gTent,gShard,gSerp,gDim;\nvec3 gSP; float gSS;\n","")+read("../edit/gl/shade.glsl");
const GL2=GL.replace("sdEllipsoid(p,vec3(0.75,0.07,0.75))","((p.y-0.10*pow(max(1.0-dot(p.xz,p.xz)/2.56,0.0),1.5))*0.8)");   // a wider, gentler rise he visibly climbs
const PAINT=read("../edit/gl/paint.glsl");
const SMALL=!!process.env.FW_SMALL,W=SMALL?360:720,H=SMALL?640:1280;
export default async ({project})=>{
  const p=await project({dir:SMALL?"pl_s":"pl_f",size:`${W}x${H}`,fps:FPS,background:"#000000"});
  const base={...P0,wall:0,tent:1,serp:1,dim:.98,fog:16,amber:.28};
  const smp=[...Array(N+1).keys()].map(i=>{const c=camAtT(i/FPS);return {...base,rx:c.ro[0],ry:c.ro[1],rz:c.ro[2],tx:c.ta[0],ty:c.ta[1],tz:c.ta[2],lens:c.lens};});
  const anim=[];for(const k of ["rx","ry","rz","tx","ty","tz"])anim.push({property:"effectParam",effectIndex:0,effectParam:k,keyframes:smp.map((q,i)=>({at:Math.min(DUR-.001,i/FPS),value:q[k],easing:"linear"}))});
  p.compose(<frame width={W} height={H} layout="none"><rect at={0} duration={DUR} x={0} y={0} width={W} height={H} fill="#000000" effects={[{kind:"shader",params:{glsl:GL2,...smp[0]}},{kind:"shader",params:{glsl:PAINT}}]} animate={anim}/></frame>,{at:0,dur:DUR});
};
