// reads the real ground height of the camp set along the walking line
import { readFileSync } from "node:fs";
const GL=readFileSync("../edit/gl/lib.glsl","utf8").split("vec2 map(vec3 p);")[0]+`
float dune(vec2 q){ return 0.09*noise2(q*0.35)+0.03*noise2(q*1.1); }
vec4 pixel(vec2 uv){ float x=-6.0+uv.x*8.0; float h=dune(vec2(x,0.0))/0.2; float a=floor(h*255.0)/255.0; float b=fract(h*255.0); return vec4(a,b,0.0,1.0); }`;
export default async ({project})=>{ const p=await project({dir:"hm",size:"800x8",fps:30,background:"#000000"});
  p.compose(<frame width={800} height={8} layout="none"><rect x={0} y={0} width={800} height={8} fill="#000000" effects={[{kind:"shader",params:{glsl:GL}}]}/></frame>,{at:0,dur:1}); };
