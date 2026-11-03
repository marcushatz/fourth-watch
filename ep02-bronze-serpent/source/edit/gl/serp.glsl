const float PI2=6.28318;
const float SR=0.098, SP=0.222, SY0=1.40, SY1=2.22;
float sdCoil(vec3 p){
  float a=atan(p.z,p.x);
  float u=p.y/SP-a/PI2, k=floor(u+0.5);
  float yy=(k+a/PI2)*SP;
  float s=clamp((yy-SY0)/(SY1-SY0),0.0,1.0);
  float r=mix(0.012,0.082,smoothstep(0.0,0.6,s));
  float d=length(vec2(length(p.xz)-SR,(p.y-yy)*0.98))-r;
  return max(d,max(SY0-0.03-p.y,p.y-SY1-0.03));
}
vec3 coilEnd(){ float a=PI2*SY1/SP; return vec3(SR*cos(a),SY1,SR*sin(a)); }
vec3 bez(vec3 a,vec3 b,vec3 c,vec3 d,float t){ float u=1.0-t; return u*u*u*a+3.0*u*u*t*b+3.0*u*t*t*c+t*t*t*d; }
float sdNeck(vec3 p){
  vec3 A=coilEnd(), B=vec3(0.40,2.34,0.10), C=vec3(-0.06,2.52,0.0), D=vec3(0.13,2.74,0.0);
  vec3 E=vec3(0.24,2.87,0.0), F=vec3(0.38,2.90,0.0), G=vec3(0.53,2.83,0.0);
  float d=1e3; vec3 q0=A;
  for(int i=1;i<=14;i++){ float t=float(i)/14.0; vec3 q=bez(A,B,C,D,t); d=min(d,sdCone2(p,q0,q,mix(0.082,0.068,t-0.0714),mix(0.082,0.068,t))); q0=q; }
  for(int i=1;i<=10;i++){ float t=float(i)/10.0; vec3 q=bez(D,E,F,G,t); d=min(d,sdCone2(p,q0,q,mix(0.068,0.054,t-0.1),mix(0.068,0.054,t))); q0=q; }
  return d;
}
float sdHeadS(vec3 h){            // +x toward the snout
  vec3 q=h; q.z=abs(q.z);
  float d=sdEllipsoid(h-vec3(0.06,0.0,0.0),vec3(0.195,0.058,0.082));
  d=smin(d,sdEllipsoid(q-vec3(-0.055,0.0,0.058),vec3(0.105,0.058,0.058)),0.04);    // jaw corners make the wedge
  d=smin(d,sdCapsule(q,vec3(-0.07,0.05,0.042),vec3(0.11,0.030,0.024),0.015),0.022);  // brow ridge
  d=max(d,-sdEllipsoid(q-vec3(0.03,0.030,0.070),vec3(0.024,0.012,0.016)));           // recessed eye
  d=max(d,-max(abs(h.y+0.024+0.03*h.x)-0.0035,h.x-0.27));                            // mouth line
  return d;
}
vec3 headSpace(vec3 p){ vec3 h=p-vec3(0.60,2.79,0.0); h.xy=rot(0.42)*h.xy; return h; }
float sdSerpent(vec3 p){
  float d=sdCoil(p);
  d=min(d,sdNeck(p));
  d=smin(d,sdHeadS(headSpace(p)),0.045);
  return d;
}
// ----- broken pieces: cut faces, not capsules
vec3 shardPos(float i,float s){
  float a=i*2.4+0.6, y=SY0+0.18+mod(i*0.23,0.60);
  vec3 c=vec3(SR*cos(a),y,SR*sin(a));
  vec3 dir=normalize(vec3(cos(a)+0.5*(hash1(i)-0.5),0.40+hash1(i+7.0)*0.8,sin(a)+0.9*(hash1(i+3.0)-0.5)));
  return c+dir*s*(0.72+0.8*hash1(i+11.0))+vec3(0.0,-0.34*s*s,0.0);
}
float sdShards(vec3 p,float s){
  float d=1e3;
  for(int n=0;n<9;n++){              // the coil itself, broken into lengths
    float i=float(n);
    float y=SY0+0.17+i*0.082, a=PI2*y/SP;
    vec3 c=vec3(SR*cos(a),y,SR*sin(a));
    vec3 dir=normalize(vec3(cos(a)+0.6*(hash1(i)-0.5),0.32+hash1(i+7.0)*0.9,sin(a)+0.9*(hash1(i+3.0)-0.5)));
    vec3 cc=c+dir*s*(0.70+0.85*hash1(i+11.0))+vec3(0.0,-0.34*s*s,0.0);
    vec3 q=p-cc;
    if(dot(q,q)>0.11){ d=min(d,length(q)-0.24); continue; }
    q.xy=rot(s*(2.2+3.0*hash1(i+5.0)))*q.xy; q.yz=rot(s*(1.6+3.5*hash1(i+9.0)))*q.yz;
    float bb=max(sdCoil(q+c),length(q)-0.17);
    vec3 n1=normalize(vec3(sin(i*1.7),0.5*cos(i*2.1),cos(i*1.7)));
    bb=max(bb,dot(q,n1)-0.085);
    bb=max(bb,dot(q,normalize(vec3(cos(i*2.3),-0.6,sin(i*2.3))))-0.10);
    d=min(d,bb);
  }
  for(int n=0;n<3;n++){              // the neck in three lengths
    float i=float(n);
    vec3 c=(n==0)?vec3(0.20,2.42,0.05):((n==1)?vec3(0.08,2.62,0.0):vec3(0.26,2.86,0.0));
    vec3 dir=normalize(vec3(0.5-i*0.9,0.5+0.3*i,0.7-1.1*hash1(i+1.0)));
    vec3 q=p-(c+dir*s*(0.8+0.5*hash1(i+2.0))+vec3(0.0,-0.34*s*s,0.0));
    if(dot(q,q)>0.20){ d=min(d,length(q)-0.34); continue; }
    q.xy=rot(s*(1.8+i))*q.xy; q.yz=rot(s*(2.4-i))*q.yz;
    d=min(d,max(sdNeck(q+c),length(q)-0.21));
  }
  vec3 c=vec3(0.60,2.79,0.0)+vec3(0.74,0.34,0.62)*s+vec3(0.0,-0.30*s*s,0.0);
  vec3 h=p-c; h.xy=rot(0.42+s*1.2)*h.xy; h.xz=rot(s*0.85)*h.xz;
  return min(d,sdHeadS(h));
}
