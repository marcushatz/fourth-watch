vec3 tone(vec3 dk,vec3 md,vec3 lt,float v){ float a=smoothstep(0.10,0.17,v),b=smoothstep(0.46,0.53,v); return mix(mix(dk,md,a),lt,b); }
vec3 skyC(vec3 rd,vec2 uv,float dawn,float night){
  float y=rd.y;
  vec3 h=mix(vec3(0.96,0.56,0.27),vec3(1.0,0.80,0.52),dawn), m=mix(vec3(0.62,0.26,0.20),vec3(0.86,0.56,0.42),dawn), z=mix(vec3(0.13,0.15,0.25),vec3(0.36,0.46,0.62),dawn);
  vec3 c=mix(h,m,smoothstep(0.0,0.16,y)); c=mix(c,z,smoothstep(0.10,0.62,y));
  c=mix(c,vec3(0.035,0.05,0.095)*(1.0+0.4*smoothstep(0.5,-0.1,y)),night);
  float az=atan(rd.x,-rd.z);
  float sun=pow(clamp(dot(rd,normalize(vec3(-0.62,0.06,-0.78))),0.0,1.0),24.0);
  c+=mix(vec3(1.0,0.55,0.25),vec3(1.0,0.86,0.6),dawn)*sun*0.55*(1.0-night);
  float cl=fbm2(vec2(az*5.0,y*22.0)+3.0);
  c=mix(c,c*vec3(0.78,0.66,0.72)+vec3(0.05,0.02,0.0),smoothstep(0.52,0.7,cl)*smoothstep(0.02,0.1,y)*(1.0-smoothstep(0.3,0.5,y))*(1.0-night));
  if(night>0.6){ vec2 sg=vec2(az*150.0,y*230.0), g=floor(sg); float st=step(0.982,hash2(g))*smoothstep(0.42,0.12,length(fract(sg)-0.5)); c+=vec3(0.9,0.92,1.0)*st*night*(0.35+0.65*hash2(g+3.0))*smoothstep(0.03,0.3,y); }
  float r1=0.035+0.05*fbm2(vec2(az*2.2,1.0)), r2=0.012+0.03*fbm2(vec2(az*4.1,4.0));
  vec3 hz=mix(h,vec3(0.05,0.06,0.10),night);
  if(gSet<1.5){ if(y<r1) c=mix(hz*vec3(0.62,0.42,0.42),c,0.25);
  if(y<r2) c=hz*vec3(0.42,0.27,0.28); }
  return c;
}
vec4 pixel(vec2 uv){
  gSet=u_set; gWall=u_wall; gTent=u_tent; gShard=u_shard; gSerp=u_serp; gDim=u_dim;
  gSP=vec3(u_sx,u_sy,u_sz); gSS=u_ss;
  vec2 p=screenP(uv,0.0);
  vec3 ro=vec3(u_rx,u_ry,u_rz), ta=vec3(u_tx,u_ty,u_tz);
  vec3 rd=camRay(p,ro,ta,u_lens);
  vec3 L=normalize(vec3(-0.70,0.34,0.62));
  if(gSet>1.5) L=normalize(vec3(0.05,0.20,-1.0));
  vec3 sky=skyC(rd,uv,u_dawn,u_night);
  vec3 m=march(ro,rd,90.0,0.0); vec3 col=sky;
  if(gSet>1.5&&m.x<0.0&&rd.y<0.0){ m.x=-ro.y/rd.y; m.y=0.0; }
  float tt=m.x;
  if(m.x>0.0){
    vec3 pos=ro+rd*m.x,n=calcNormal(pos);
    float key=clamp(dot(n,L),0.0,1.0);
    float sh=softShadow(pos+n*0.012,L,9.0,14.0);
    float v=key*sh, ao=calcAO(pos,n), hemi=0.5+0.5*n.y;
    float mat=m.y;
    if(u_night>0.5){ vec3 lp=(gSet>0.5&&gSet<1.5)?vec3(0.0,0.72,-0.2):vec3(0.0,1.2,1.2); vec3 d=lp-pos; float l=length(d); float k=clamp(dot(n,d/l),0.0,1.0)/(1.0+l*l*0.9); v=max(v*0.15,k*3.8*softShadow(pos+n*0.012,d/l,9.0,l)); }
    if(mat<0.5){
      float sand=noise2(pos.xz*vec2(9.0,2.0))*0.5+noise2(pos.xz*3.0)*0.5;
      if(gWall>0.5){ vec2 g=abs(fract(pos.xz*vec2(0.62,0.5))-0.5); float ln=smoothstep(0.47,0.495,max(g.x,g.y)); sand=0.55-0.3*ln+0.1*noise2(pos.xz*2.0); }
      col=tone(vec3(0.13,0.10,0.16),vec3(0.42,0.26,0.19),vec3(0.82,0.54,0.31),v+0.10*(sand-0.5));
      col*=0.92+0.16*sand;
      if(gWall<0.5&&gSet<0.5) col*=0.84+0.32*fbm2(pos.xz*0.23+4.0);
      if(gSet>1.5){
        float sun=gTent, fr=mix(-38.0,10.0,sqrt(sun)), lit=1.0-smoothstep(fr-3.0,fr+3.0,pos.z);
        float az=clamp((pos.z+17.0)/15.0,0.0,1.0), dx=abs(pos.x-mix(1.0,0.45,az)), w=0.24+0.16*az;
        float sh=1.0-smoothstep(w,w+0.10,dx);
        sh=max(sh,(1.0-smoothstep(1.75,1.9,dx))*smoothstep(-11.8,-11.5,pos.z)*(1.0-smoothstep(-8.6,-8.3,pos.z)));
        sh*=smoothstep(-19.5,-18.5,pos.z)*(1.0-smoothstep(-2.4,-1.9,pos.z));
        vec3 gd=mix(vec3(0.74,0.45,0.25),vec3(0.98,0.70,0.38),sand);
        col=mix(vec3(0.15,0.105,0.155)+0.05*sand,gd,lit*(1.0-0.88*sh));
      }
    } else if(mat<1.5){ col=tone(vec3(0.17,0.125,0.19),vec3(0.40,0.27,0.26),vec3(0.80,0.56,0.40),v);
      float rimH=pow(1.0-clamp(dot(n,-rd),0.0,1.0),2.2); col=mix(col,vec3(0.50,0.27,0.27),0.38*gTent); col+=vec3(1.0,0.62,0.30)*rimH*0.8*gTent;
    } else if(mat<2.5){
      float bk=noise2(pos.xy*vec2(2.0,5.0)+pos.z); vec2 g=abs(fract(vec2(pos.x+pos.z+floor(pos.y*0.9)*0.5,pos.y*0.9)*vec2(0.5,1.0))-0.5); float j=smoothstep(0.47,0.495,max(g.x,g.y));
      col=tone(vec3(0.07,0.06,0.10),vec3(0.22,0.155,0.15),vec3(0.50,0.33,0.235),v); col*=(0.80+0.40*bk)*(1.0-0.14*j);
    } else if(mat<3.5){ col=tone(vec3(0.15,0.13,0.17),vec3(0.42,0.33,0.29),vec3(0.84,0.66,0.48),v)*(0.92+0.16*noise2(pos.xz*4.0+pos.y*4.0));
    } else if(mat<4.5){
      vec3 s=(pos-gSP)/gSS; float bands=gShard>0.0?0.5:0.5+0.5*sin(atan(s.z,s.x)*7.0+s.y*46.0);
      vec3 rf=reflect(rd,n); float sp=pow(clamp(dot(rf,L),0.0,1.0),18.0), fr=pow(1.0-clamp(dot(n,-rd),0.0,1.0),3.0);
      col=tone(vec3(0.20,0.11,0.06),vec3(0.62,0.40,0.15),vec3(0.98,0.76,0.36),key*0.9+0.12);
      col*=0.86+0.14*smoothstep(0.2,0.6,bands);
      col+=vec3(1.0,0.86,0.55)*sp*1.1+vec3(0.9,0.55,0.28)*fr*0.55;
    } else if(mat<5.5){ col=mix(vec3(0.05,0.035,0.03),vec3(0.46,0.27,0.15),smoothstep(0.1,0.6,v+0.1));
    } else { float wv=noise2(vec2(pos.x+pos.z,pos.y*5.0)*3.0);
      col=tone(vec3(0.10,0.07,0.09),vec3(0.28,0.19,0.16),vec3(0.50,0.35,0.255),v)*(0.90+0.20*wv); }
    col*=mix(0.62,1.0,ao);
    col*=mix(1.0,u_dim,1.0);
    float hz=clamp((m.x-u_fog)*0.045,0.0,0.88);
    vec3 hzC=mix(mix(vec3(0.90,0.56,0.33),vec3(1.0,0.82,0.62),u_dawn),vec3(0.05,0.065,0.11),u_night);
    col=mix(col,hzC,hz);
  }
  if(u_amber>0.0){ vec3 c0=gSP+vec3(0.0,2.0,0.0)*gSS; vec3 q=ro-c0; float bb=dot(q,rd),d2=dot(q,q)-bb*bb; col+=vec3(1.0,0.60,0.20)*u_amber*exp(-d2*1.1)*0.30; }
  if(u_ghost>0.0){
    vec3 r0=(ro-gSP)/gSS; float t=0.0,glow=0.0,hit=-1.0; vec3 q; float bs=dot(r0-vec3(0.15,1.85,0.0),rd), dd=length(r0-vec3(0.15,1.85,0.0)-rd*bs);
    if(dd<2.5){ t=max(0.0,-bs-2.3);
      for(int i=0;i<56;i++){ q=r0+rd*t; float d=min(sdSerpent(q),sdCapsule(q,vec3(0.0,-4.0,0.0),vec3(0.0,2.42,0.0),0.03)); glow+=0.02/(0.03+d*d*60.0); if(d<0.003){ hit=t; break; } t+=d; if(t>-bs+3.0) break; } }
    vec3 gc=vec3(1.0,0.74,0.34);
    float nz=fbm3(q*5.0+vec3(0.0,u_time*0.3,0.0));
    float rv=smoothstep(u_ghost*1.25-0.25,u_ghost*1.25-0.05,nz);
    col+=gc*glow*0.14*u_ghost;
    if(hit>0.0){ vec3 e=vec2(0.003,0.0).xyy; vec3 pp=q; vec3 nn=normalize(vec3(sdSerpent(pp+e.xyy)-sdSerpent(pp-e.xyy),sdSerpent(pp+e.yxy)-sdSerpent(pp-e.yxy),sdSerpent(pp+e.yyx)-sdSerpent(pp-e.yyx)));
      float rim=pow(1.0-clamp(dot(nn,-rd),0.0,1.0),1.7); float bands=0.5+0.5*sin(atan(pp.z,pp.x)*7.0+pp.y*46.0);
      col=mix(col,col+gc*(0.18+1.7*rim+0.5*bands*rim),(1.0-rv)*u_ghost); }
  }
  if(gSet>1.5){
    float sun=gTent; vec3 sc=vec3(1.0,3.55+sun*2.2,-26.0), sd=normalize(sc-ro); float an=acos(clamp(dot(rd,sd),-1.0,1.0));
    vec3 gl=vec3(1.0,0.76,0.42);
    if(m.x<0.0){
      col=mix(col,vec3(1.0,0.96,0.82),smoothstep(0.034,0.027,an)*smoothstep(0.0,0.15,sun));
      vec3 t1=normalize(cross(sd,vec3(0.0,1.0,0.0))),t2=cross(t1,sd); float th=atan(dot(rd,t2),dot(rd,t1));
      float ry=0.7*smoothstep(0.50,0.72,noise2(vec2(th*5.0,u_time*0.12)))+0.3*smoothstep(0.45,0.7,noise2(vec2(th*13.0+4.0,u_time*0.2)));
      col+=gl*ry*exp(-an*3.2)*0.34*sun;
    }
    col+=gl*(exp(-an*an*420.0)*1.0+exp(-an*an*40.0)*0.42+exp(-an*an*5.0)*0.10)*sun*(m.x>0.0?0.28:1.0);
  }
  col*=1.0-0.42*pow(length(p*vec2(1.5,1.0)),2.2);
  col+=(hash2(uv*u_resolution+fract(u_time)*91.0)-0.5)*0.022;
  return vec4(clamp(col,0.0,1.0),1.0);
}
