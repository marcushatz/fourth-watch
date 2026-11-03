import { readFileSync } from "node:fs";
const R=(f)=>readFileSync(new URL(f,import.meta.url),"utf8");
const GL=R("../edit/gl/lib.glsl")+R("../edit/gl/serp.glsl")+R("./objects.glsl"), PAINT=R("../edit/gl/paint.glsl");
const P={rx:-0.3,ry:0.62,rz:7.3,tx:0.16,ty:1.5,tz:0,lens:1.5,cx:-0.46,cz:0.95,cs:0.74,ca:-0.24,sx:0.66,sz:-0.55,ss:1.0};
export default async ({project})=>{ const p=await project({dir:"f1",size:"720x1280",fps:30,background:"#000000"});
  p.compose(<frame width={720} height={1280} layout="none"><rect x={0} y={0} width={720} height={1280} fill="#000000" effects={[{kind:"shader",params:{glsl:GL,...P}},{kind:"shader",params:{glsl:PAINT}}]}/></frame>,{at:0,dur:1}); };
