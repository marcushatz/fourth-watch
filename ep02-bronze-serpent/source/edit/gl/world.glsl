// one world: camp and court are the same ground, night yard and dawn hill are extra sets
float gSet,gWall,gTent,gShard,gSerp,gDim;
vec3 gSP; float gSS;
float dune(vec2 q){ return 0.09*noise2(q*0.35)+0.03*noise2(q*1.1); }
float sdTents(vec3 p){
  float rr=length(p.xz);
  if(rr<3.7) return 4.2-rr;
  float a=atan(p.z,p.x);
  if(a>1.35&&a<2.85) return 1.4;          // a clear corridor for the low cameras
  float ring=clamp(floor((rr-3.6)/2.9),0.0,3.0), R=5.0+2.9*ring;
  float n=9.0+ring*4.0, sec=PI2/n, al=a+ring*0.37, k=floor(al/sec+0.5); al-=k*sec;
  vec3 q=vec3(rr*cos(al)-R,p.y,rr*sin(al));
  q.xz=rot(hash1(k+ring*7.0)*1.2-0.6)*q.xz; q/=0.62;
  float h=0.95*gTent;
  float roof=h*(0.62+0.38*exp(-q.x*q.x*2.2))-0.05*sin(q.z*4.0)*sin(q.z*4.0);
  float d=max(max(abs(q.x)-1.75,abs(q.z)-1.25),q.y-roof);
  return max(d,-q.y-0.05)*0.34;
}
float sdRocks(vec3 p){
  vec2 c=floor(p.xz/3.1); vec2 f=p.xz-(c+0.5)*3.1; float h=hash2(c+3.0);
  if(h<0.55) return 1.2;
  vec2 o=(vec2(hash2(c),hash2(c+9.0))-0.5)*1.6;
  float r=0.10+0.26*hash2(c+5.0);
  return sdEllipsoid(vec3(f.x-o.x,p.y,f.y-o.y),vec3(r*1.3,r*0.8,r))-0.02*noise2(p.xz*7.0);
}
float sdCourt(vec3 p){
  float back=p.z+8.6;
  vec3 c=vec3(abs(p.x)-5.4,p.y-2.4,mod(p.z+0.7,3.4)-1.7);
  float d=min(back,sdCylinder(c,2.4,0.30));
  d=min(d,sdRoundBox(vec3(c.x,p.y-4.85,c.z),vec3(0.42,0.10,0.42),0.01));
  d=max(d,p.z-5.2);
  return max(d,p.y-5.4*gWall+0.05);
}
float sdYard(vec3 p){
  float d=min(p.z+3.6,6.2-abs(p.x));
  d=max(d,p.y-2.1);
  vec3 r=p; r.x=mod(p.x+0.9,1.8)-0.9;
  d=min(d,sdRoundBox(vec3(r.x,p.y-1.2,p.z+3.45),vec3(0.03,1.2,0.14),0.0)+0.0);
  d=min(d,sdRoundBox(p-vec3(0.0,0.32,-0.2),vec3(0.03,0.32,0.03),0.01));         // lamp stand
  d=min(d,sdCylinder(p-vec3(0.0,0.03,-0.2),0.03,0.16));
  return d;
}
float sdHills(vec3 p){
  float d=sdEllipsoid(p-vec3(1.0,-5.3,-26.0),vec3(8.5,9.2,10.0));
  d=smin(d,sdEllipsoid(p-vec3(-8.5,-4.2,-24.0),vec3(9.0,6.4,7.0)),2.0);
  d=smin(d,sdEllipsoid(p-vec3(11.5,-4.6,-25.0),vec3(8.0,6.2,7.0)),2.0);
  d+=0.32*noise2(p.xz*0.42+2.0)+0.12*noise2(p.xz*1.3);
  d=min(d,sdEllipsoid(p-vec3(-22.0,-8.0,-52.0),vec3(30.0,13.0,12.0)));
  d=min(d,sdEllipsoid(p-vec3(26.0,-8.0,-60.0),vec3(28.0,15.0,12.0)));
  return d*0.7;
}
float sdCross(vec3 p){
  vec3 q=p-vec3(1.0,5.1,-26.0);
  float d=sdRoundBox(q,vec3(0.10,1.45,0.10),0.01);
  return min(d,sdRoundBox(q-vec3(0.0,0.60,0.0),vec3(0.72,0.09,0.09),0.01));
}
// what is left of the serpent, lying on the ground
float sdRubble(vec3 p){
  float d=1e3;
  for(int n=0;n<6;n++){
    float i=float(n), y=SY0+0.25+i*0.12, a=PI2*y/SP;
    vec3 c=vec3(SR*cos(a),y,SR*sin(a));
    vec2 g=vec2(-1.05+0.46*i+0.22*(hash1(i+21.0)-0.5),0.34*sin(i*2.6+0.5));
    vec3 q=p-vec3(g.x,0.085,g.y);
    if(dot(q,q)>0.11){ d=min(d,length(q)-0.24); continue; }
    q.xy=rot(1.45+0.9*hash1(i+5.0))*q.xy; q.yz=rot(0.3+2.5*hash1(i+9.0))*q.yz;
    float bb=max(sdCoil(q+c),length(q)-0.18);
    bb=max(bb,dot(q,normalize(vec3(sin(i*1.7),0.5*cos(i*2.1),cos(i*1.7))))-0.10);
    d=min(d,bb);
  }
  vec3 h=p-vec3(0.62,0.075,0.20); h.xz=rot(-0.5)*h.xz; h.xy=rot(0.08)*h.xy;
  d=min(d,sdHeadS(h*0.72)/0.72);
  return d;
}
vec2 map(vec3 p){
  vec2 r=vec2(p.y-(gSet<0.5?dune(p.xz)*(1.0-gWall):0.0),0.0);
  if(gSet<0.5){
    if(gWall>0.01) r=opU(r,vec2(sdCourt(p),2.0));
    float pl=mix(sdEllipsoid(p,vec3(0.75,0.07,0.75)),sdCylinder(p-vec3(0.0,0.16,0.0),0.16,0.86),gWall);
    pl=min(pl,sdCylinder(p-vec3(0.0,0.04,0.0),0.04+0.02*gWall,1.15*gWall+0.01));
    r=opU(r,vec2(pl,gWall>0.5?3.0:0.0));
    if(gTent>0.01){ r=opU(r,vec2(sdTents(p),13.0)); if(length(p.xz)>3.5) r=opU(r,vec2(sdRocks(p),3.0)); }
  } else if(gSet<1.5){
    r=opU(r,vec2(sdYard(p),2.0));
  } else {
    r=opU(r,vec2(sdHills(p),1.0));
    r=opU(r,vec2(sdCross(p),5.0));
    { vec3 w=(p-vec3(0.45,0.0,-2.6))/1.15; float bd=length(w.xz*vec2(0.6,0.9))-1.5; r=opU(r,vec2(bd>0.3?bd*1.15:sdRubble(w)*1.15,4.0)); }
  }
  if(gSerp>0.0||gShard>0.0){
    vec3 s=(p-gSP)/gSS;
    if(gSerp>0.0) s.y+=(1.0-gSerp)*3.1;
    float bd=length(s-vec3(0.15,1.85-u_drop,0.0))-1.9-gShard*1.6;
    if(bd<0.25){
      if(gShard<=0.0){
        float pole=max(sdCapsule(s,vec3(0.0,-2.4,0.0),vec3(0.0,2.42,0.0),0.034),-p.y/gSS);
        r=opU(r,vec2(pole*gSS,5.0));
        r=opU(r,vec2(sdSerpent(s)*gSS,4.0));
      } else {
        if(gSerp>0.0){
          float pole=max(sdCapsule(s,vec3(0.0,-2.4,0.0),vec3(0.0,1.52,0.0),0.034),-p.y/gSS);
          r=opU(r,vec2(pole*gSS,5.0));
        }
        r=opU(r,vec2(sdShards(s+vec3(0.0,u_drop,0.0),gShard)*gSS,4.0));
      }
    } else r=opU(r,vec2(bd*gSS,5.0));
  }
  return r;
}
