// the 3D render is repainted: every edge wanders with the brush, and the paint boils eight times a second
float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h2(i),h2(i+vec2(1.0,0.0)),f.x),mix(h2(i+vec2(0.0,1.0)),h2(i+vec2(1.0,1.0)),f.x),f.y); }
vec4 pixel(vec2 uv){
  float bo=floor(u_time*8.0);
  vec2 s=uv*vec2(1.0,1.778)*7.0+vec2(mod(bo,5.0)*3.1,mod(bo,3.0)*5.7);
  vec2 q=uv*vec2(1.0,1.778);
  float a=n2(s*vec2(1.0,0.45))*6.283;
  vec2 d=vec2(cos(a),sin(a))*(0.5*n2(s*2.3)+0.5*n2(s*5.7));
  vec2 w=d*0.0058*vec2(1.0,0.5625);
  vec3 c0=texture(u_src,uv+w).rgb, c1=texture(u_src,uv+w*0.45+vec2(0.0011,-0.0007)).rgb, c2=texture(u_src,uv-w*0.6+vec2(-0.0013,0.0009)).rgb;
  vec3 c=(c0*2.0+c1+c2)/4.0;
  float L=dot(c,vec3(0.3,0.59,0.11));
  c=mix(c,floor(c*11.0+0.5)/11.0,0.45);
  float pig=n2(q*vec2(160.0,240.0))*0.5+n2(q*vec2(320.0,110.0))*0.5;
  c*=0.955+0.09*pig;
  c=pow(c,vec3(0.96));
  return vec4(c,1.0);
}
