import { readFileSync } from "node:fs";
import { P0 } from "../edit/shots.js";
const read=(f)=>readFileSync(new URL(f,import.meta.url),"utf8");
const GL=read("../edit/gl/lib.glsl").replace("vec2 map(vec3 p);","vec2 map(vec3 p);\nfloat gSet,gWall,gTent,gShard,gSerp,gDim; vec3 gSP; float gSS;")+read("../edit/gl/serp.glsl")+read("../edit/gl/world.glsl").replace("float gSet,gWall,gTent,gShard,gSerp,gDim;\nvec3 gSP; float gSS;\n","")+read("../edit/gl/shade.glsl");
const PAINT=read("../edit/gl/paint.glsl");
const LAMPS=`float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
vec4 pixel(vec2 uv){ vec2 p=(uv*u_resolution-0.5*u_resolution)/u_resolution.y; p.y=-p.y; vec3 ro=vec3(u_rx,u_ry,u_rz),ta=vec3(u_tx,u_ty,u_tz),ww=normalize(ta-ro),uu=normalize(cross(ww,vec3(0.0,1.0,0.0))),vv=cross(uu,ww),rd=normalize(p.x*uu+p.y*vv+u_lens*ww);
  float t=-ro.y/rd.y; if(rd.y>=0.0) return vec4(0.0); vec2 P=(ro+rd*t).xz; float s=u_s,g=0.0,w=0.0;
  vec2 c0=floor(P/s); for(int i=-1;i<=1;i++){ for(int j=-1;j<=1;j++){ vec2 c=c0+vec2(float(i),float(j)); if(c.x<-30.0||c.x>=30.0||c.y<-25.0||c.y>=25.0) continue; vec2 o=(c+0.5+0.7*(vec2(h(c),h(c+7.0))-0.5))*s; float d=length(P-o), edge=c.x+0.6*c.y+6.0*(h(c+3.0)-0.5);
    float lit=smoothstep(u_w-1.0,u_w+1.0,edge); g+=lit*(exp(-d*d*520.0)+0.34*exp(-d*d*42.0)); w+=(1.0-lit)*exp(-d*d*520.0)*0.10; } }
  vec3 col=vec3(1.0,0.72,0.34)*g+vec3(0.8,0.34,0.14)*0.12*g*g+vec3(0.55,0.3,0.2)*w; float a=clamp(max(col.r,max(col.g,col.b)),0.0,1.0); return vec4(clamp(col,0.0,1.0),a); }`;
export default async ({project})=>{ const p=await project({dir:"f2",size:"720x1280",fps:30,background:"#000000"});
  const c={rx:-1.6,ry:13.6,rz:14.4,tx:0.6,ty:0.0,tz:-1.0,lens:0.92};
  const base={...P0,wall:0,tent:1,serp:0,dim:0.26,night:0.45,fog:34,...c};
  p.compose(<frame width={720} height={1280} layout="none"><rect x={0} y={0} width={720} height={1280} fill="#000000" effects={[{kind:"shader",params:{glsl:GL,...base}},{kind:"shader",params:{glsl:PAINT}}]}/><rect x={0} y={0} width={720} height={1280} fill="#00000000" effects={[{kind:"shader",params:{glsl:LAMPS,s:0.62,w:-2.0,...c}}]}/></frame>,{at:0,dur:1}); };
