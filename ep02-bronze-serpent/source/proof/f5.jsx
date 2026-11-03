import { readFileSync } from "node:fs";
const R=(f)=>readFileSync(new URL(f,import.meta.url),"utf8");
const GL=R("../edit/gl/lib.glsl")+R("../edit/gl/serp.glsl")+R("./objects.glsl"), PAINT=R("../edit/gl/paint.glsl");
const P={rx:0.75,ry:0.55,rz:6.2,tx:0.75,ty:1.9,tz:0,lens:1.5,cx:60,cz:0,cs:0.76,ca:0,sx:0.0,sz:0,ss:0.86};
export default async ({project})=>{ const p=await project({dir:"f5",size:"720x1280",fps:30,background:"#000000"});
  p.compose(<frame width={720} height={1280} layout="none"><rect x={0} y={0} width={720} height={1280} fill="#000000" effects={[{kind:"shader",params:{glsl:GL,...P}},{kind:"shader",params:{glsl:PAINT}}]}/></frame>,{at:0,dur:1}); };
