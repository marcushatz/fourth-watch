float sdSphere(vec3 p, float r){ return length(p)-r; }
float sdEllipsoid(vec3 p, vec3 r){ float k0=length(p/r), k1=length(p/(r*r)); return k0*(k0-1.0)/k1; }
float sdCapsule(vec3 p, vec3 a, vec3 b, float r){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h)-r; }
float sdCone2(vec3 p, vec3 a, vec3 b, float ra, float rb){ vec3 pa=p-a, ba=b-a; float h=clamp(dot(pa,ba)/dot(ba,ba),0.0,1.0); return length(pa-ba*h)-mix(ra,rb,h); }
float sdRoundBox(vec3 p, vec3 b, float r){ vec3 q=abs(p)-b; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0)-r; }
float sdCylinder(vec3 p, float h, float r){ vec2 d=abs(vec2(length(p.xz),p.y))-vec2(r,h); return min(max(d.x,d.y),0.0)+length(max(d,0.0)); }
float smin(float a, float b, float k){ float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0); return mix(b,a,h)-k*h*(1.0-h); }
vec2 opU(vec2 a, vec2 b){ return a.x<b.x ? a : b; }
mat2 rot(float a){ float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
float hash1(float n){ return fract(sin(n)*43758.5453); }
float hash2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float hash3(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
float noise2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash2(i),hash2(i+vec2(1.0,0.0)),f.x), mix(hash2(i+vec2(0.0,1.0)),hash2(i+vec2(1.0,1.0)),f.x), f.y); }
float noise3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash3(i),hash3(i+vec3(1.0,0.0,0.0)),f.x),mix(hash3(i+vec3(0.0,1.0,0.0)),hash3(i+vec3(1.0,1.0,0.0)),f.x),f.y),
             mix(mix(hash3(i+vec3(0.0,0.0,1.0)),hash3(i+vec3(1.0,0.0,1.0)),f.x),mix(hash3(i+vec3(0.0,1.0,1.0)),hash3(i+vec3(1.0,1.0,1.0)),f.x),f.y),f.z); }
float fbm2(vec2 p){ float a=0.5,s=0.0; for(int i=0;i<4;i++){ s+=a*noise2(p); p=p*2.03+vec2(7.1,3.3); a*=0.5; } return s; }
float fbm3(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<3;i++){ s+=a*noise3(p); p=p*2.03+vec3(7.1,3.3,1.7); a*=0.5; } return s; }
float ease(float a,float b,float x){ float t=clamp((x-a)/(b-a),0.0,1.0); return t*t*t*(t*(t*6.0-15.0)+10.0); }
float eout(float a,float b,float x){ float t=clamp((x-a)/(b-a),0.0,1.0); t=1.0-t; return 1.0-t*t*t; }
vec3 hex(float r,float g,float b){ return vec3(r,g,b)/255.0; }

vec2 map(vec3 p);

vec2 screenP(vec2 uv, float pad){ vec2 p=(uv*u_resolution-0.5*u_resolution)/(u_resolution.y-2.0*pad); p.y=-p.y; return p; }
vec3 camRay(vec2 p, vec3 ro, vec3 ta, float lens){
  vec3 ww=normalize(ta-ro), uu=normalize(cross(ww,vec3(0.0,1.0,0.0))), vv=cross(uu,ww);
  return normalize(p.x*uu+p.y*vv+lens*ww);
}
vec3 calcNormal(vec3 p){ vec2 e=vec2(0.0012,0.0);
  return normalize(vec3(map(p+e.xyy).x-map(p-e.xyy).x, map(p+e.yxy).x-map(p-e.yxy).x, map(p+e.yyx).x-map(p-e.yyx).x)); }
vec3 march(vec3 ro, vec3 rd, float tmax, float outlineW){
  float t=0.0, mh=1e9, mt=0.0;
  for(int i=0;i<84;i++){ vec2 h=map(ro+rd*t);
    if(h.x<0.0009+0.0004*t){ float w=outlineW*mt; float e=(mt<t-0.05) ? 1.0-smoothstep(0.5*w,w,mh) : 0.0; return vec3(t,h.y,e); }
    if(h.x<mh && h.y>0.5){ mh=h.x; mt=t; }
    t+=h.x*0.9; if(t>tmax) break; }
  float w=outlineW*max(mt,0.001); return vec3(-1.0,0.0,1.0-smoothstep(0.5*w,w,mh));
}
float softShadow(vec3 ro, vec3 rd, float k, float tmax){ float res=1.0, t=0.03;
  for(int i=0;i<18;i++){ float h=map(ro+rd*t).x; res=min(res,k*h/t); t+=clamp(h,0.05,0.5); if(h<0.001||t>tmax) break; }
  return clamp(res,0.0,1.0); }
float calcAO(vec3 p, vec3 n){ float o=0.0, s=1.0;
  for(int i=1;i<=3;i++){ float h=0.08*float(i); o+=(h-map(p+n*h).x)*s; s*=0.6; } return clamp(1.0-1.6*o,0.0,1.0); }
float grain(vec2 uv){ return hash2(floor(uv*u_resolution/1.5)+vec2(3.1,7.7))-0.5; }
