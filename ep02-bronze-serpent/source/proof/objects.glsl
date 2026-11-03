// two metal animals in the dark. Uses lib.glsl and serp.glsl. gold calf: mat 1, bronze serpent: mat 2, pole: mat 3, ground: mat 0
float sdCalf(vec3 p){ vec3 q=p; q.z=abs(q.z);
  float d=sdEllipsoid(p-vec3(-0.08,0.68,0.0),vec3(0.54,0.235,0.205));
  d=smin(d,sdEllipsoid(p-vec3(0.27,0.74,0.0),vec3(0.25,0.285,0.215)),0.14);
  d=smin(d,sdEllipsoid(p-vec3(-0.43,0.72,0.0),vec3(0.215,0.235,0.195)),0.12);
  d=smin(d,sdCone2(p,vec3(0.38,0.86,0.0),vec3(0.66,1.02,0.0),0.20,0.12),0.10);
  vec3 h=p-vec3(0.775,1.03,0.0); h.xy=rot(0.42)*h.xy;
  d=smin(d,sdEllipsoid(h,vec3(0.16,0.098,0.092)),0.05);
  d=smin(d,sdEllipsoid(h-vec3(0.155,-0.022,0.0),vec3(0.085,0.066,0.07)),0.035);
  d=max(d,-sdEllipsoid(q-vec3(0.815,1.09,0.083),vec3(0.018,0.012,0.012)));
  d=smin(d,sdCapsule(q,vec3(0.72,1.135,0.055),vec3(0.71,1.18,0.135),0.024),0.02);
  d=smin(d,sdCapsule(q,vec3(0.71,1.18,0.135),vec3(0.775,1.28,0.165),0.016),0.012);
  d=smin(d,sdCapsule(q,vec3(0.775,1.28,0.165),vec3(0.855,1.325,0.13),0.009),0.008);
  d=smin(d,sdEllipsoid(q-vec3(0.635,1.10,0.135),vec3(0.042,0.018,0.062)),0.018);
  d=smin(d,sdCone2(q,vec3(0.33,0.52,0.11),vec3(0.35,0.27,0.115),0.082,0.046),0.05);
  d=smin(d,sdCone2(q,vec3(0.35,0.27,0.115),vec3(0.335,0.03,0.115),0.044,0.04),0.02);
  d=smin(d,sdCone2(q,vec3(-0.46,0.54,0.11),vec3(-0.53,0.29,0.115),0.098,0.05),0.05);
  d=smin(d,sdCone2(q,vec3(-0.53,0.29,0.115),vec3(-0.47,0.03,0.115),0.046,0.04),0.02);
  d=smin(d,sdCapsule(p,vec3(-0.61,0.86,0.0),vec3(-0.73,0.44,0.03),0.014),0.03);
  d=min(d,sdEllipsoid(p-vec3(-0.74,0.40,0.03),vec3(0.026,0.055,0.026)));
  return d; }
vec2 map(vec3 p){ vec2 r=vec2(p.y,0.0);
  vec3 c=p-vec3(u_cx,0.11,u_cz); c.xz=rot(u_ca)*c.xz; r=opU(r,vec2(sdCalf(c/u_cs)*u_cs,1.0));
  r=opU(r,vec2(sdRoundBox(p-vec3(u_cx,0.05,u_cz),vec3(0.70*u_cs,0.05,0.34*u_cs),0.012),4.0));
  vec3 s=(p-vec3(u_sx,0.0,u_sz))/u_ss;
  r=opU(r,vec2(sdCapsule(s,vec3(0.0,0.0,0.0),vec3(0.0,2.42,0.0),0.03)*u_ss,3.0));
  r=opU(r,vec2(sdSerpent(s)*u_ss,2.0));
  return r; }
float spot(vec3 pos,vec3 a,vec3 dir,float c0,float c1){ vec3 d=normalize(pos-a); return smoothstep(c0,c1,dot(d,dir)); }
vec4 pixel(vec2 uv){ vec2 p=screenP(uv,0.0); vec3 ro=vec3(u_rx,u_ry,u_rz),ta=vec3(u_tx,u_ty,u_tz); vec3 rd=camRay(p,ro,ta,u_lens);
  vec3 col=mix(vec3(0.030,0.022,0.020),vec3(0.085,0.055,0.045),smoothstep(-0.25,0.35,rd.y));
  vec3 m=march(ro,rd,40.0,0.0);
  if(m.x>0.0){ vec3 pos=ro+rd*m.x,n=calcNormal(pos); float mat=m.y;
    vec3 Lc=normalize(vec3(u_cx+0.5,3.6,u_cz+1.5)-pos), Ls=normalize(vec3(u_sx-1.3,5.0,u_sz+1.8)-pos);
    float sc=spot(pos,vec3(u_cx+0.5,3.6,u_cz+1.5),normalize(vec3(-0.5,-3.5,-1.5)),0.90,0.985), ss=spot(pos,vec3(u_sx-1.3,5.0,u_sz+1.8),normalize(vec3(1.3,-3.1,-1.8)),0.875,0.965);
    float kc=clamp(dot(n,Lc),0.0,1.0)*sc*softShadow(pos+n*0.01,Lc,10.0,5.0), ks=clamp(dot(n,Ls),0.0,1.0)*ss*softShadow(pos+n*0.01,Ls,10.0,6.0);
    float ao=calcAO(pos,n), fr=pow(1.0-clamp(dot(n,-rd),0.0,1.0),3.0); vec3 rf=reflect(rd,n);
    float spc=pow(clamp(dot(rf,Lc),0.0,1.0),26.0)*sc, sps=pow(clamp(dot(rf,Ls),0.0,1.0),22.0)*ss;
    if(mat<0.5){ float g=0.5*noise2(pos.xz*5.0)+0.5*noise2(pos.xz*17.0); col=vec3(0.052,0.038,0.033)+vec3(0.30,0.20,0.145)*(kc*0.9)*(0.8+0.4*g)+vec3(0.15,0.11,0.11)*ks*(0.8+0.4*g); }
    else if(mat<1.5){ float v=kc*0.95+0.05; col=mix(mix(vec3(0.15,0.06,0.02),vec3(0.70,0.37,0.08),smoothstep(0.08,0.30,v)),vec3(1.0,0.74,0.26),smoothstep(0.42,0.60,v)); col+=vec3(1.0,0.84,0.46)*spc*0.9+vec3(0.85,0.42,0.14)*fr*0.34*sc; col+=vec3(0.28,0.13,0.05)*pow(clamp(0.5+0.5*rf.y,0.0,1.0),2.0)*0.5; }
    else if(mat<2.5){ vec3 q=(pos-vec3(u_sx,0.0,u_sz))/u_ss; float bd=0.5+0.5*sin(atan(q.z,q.x)*7.0+q.y*46.0), v=ks*0.95+0.05; col=mix(mix(vec3(0.07,0.04,0.03),vec3(0.36,0.20,0.10),smoothstep(0.08,0.30,v)),vec3(0.74,0.47,0.24),smoothstep(0.42,0.62,v)); col*=0.82+0.18*smoothstep(0.2,0.7,bd); col+=vec3(0.95,0.72,0.42)*sps*0.8+vec3(0.60,0.34,0.18)*fr*0.4*ss; }
    else if(mat<3.5){ col=mix(vec3(0.03,0.022,0.02),vec3(0.27,0.16,0.09),smoothstep(0.05,0.5,ks+kc*0.3)); }
    else { col=mix(vec3(0.05,0.04,0.038),vec3(0.26,0.20,0.17),smoothstep(0.05,0.5,kc)); }
    col*=mix(0.6,1.0,ao); }
  col*=1.0-0.46*pow(length(p*vec2(1.5,1.0)),2.2);
  col+=(hash2(uv*u_resolution+fract(u_time)*91.0)-0.5)*0.018;
  return vec4(clamp(col,0.0,1.0),1.0); }
