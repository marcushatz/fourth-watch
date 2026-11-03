// every plate in the film: time window, camera path, world state
export const lerp=(a,b,t)=>a+(b-a)*t, v3=(a,b,t)=>a.map((x,i)=>lerp(x,b[i],t));
const io=(t)=>t*t*(3-2*t), o3=(t)=>1-Math.pow(1-t,3), i3=(t)=>t*t*t, seg=(u,a,b)=>Math.max(0,Math.min(1,(u-a)/(b-a)));
export const P0={set:0,wall:1,tent:0,shard:0,serp:1,dim:1,sx:0,sy:-0.1,sz:0,ss:1,night:0,dawn:0,ghost:0,amber:0,fog:7,drop:0,rx:0,ry:1.2,rz:6,tx:0,ty:1.6,tz:0,lens:1.4};
const cam=(ro,ta,lens=1.3)=>({ro,ta,lens});
const A0=[-4.1,0.62,4.3],A1=[-2.9,0.62,5.0],AT=[-0.3,1.55,0], FROZ={wall:1,shard:0.55,dim:0.95,amber:0.45,sy:-0.35};
const CAMPHI=[0,17,12.5], CAMP={wall:0,tent:1,dim:0.95,night:0.1,fog:34};
export const SHOTS=[
 {id:"A",a:0,b:3.64,cam:(u)=>cam(v3(A0,A1,u),AT,1.28),par:(u)=>{const t=u*3.64;return t<0.84?{...FROZ,shard:0,sy:-0.1,amber:0.2}:{...FROZ,shard:0.05+0.5*o3(seg(t,0.84,1.2))+0.02*seg(t,1.2,3.64)};}},
 {id:"B",a:3.64,b:6.46,cam:(u)=>{const k=io(seg(u,0,0.9));return cam(v3(A1,[-1.2,7.6,8.8],k),v3(AT,[0,0.9,0],k),lerp(1.28,1.18,k));},par:()=>FROZ},
 {id:"C",a:6.46,b:7.56,cam:(u)=>cam(v3([-1.2,7.6,8.8],CAMPHI,io(u)),[0,0.6*(1-u),0],lerp(1.18,0.86,u)),par:(u)=>{const s=seg(u,0,0.45),w=seg(u,0.4,1);return {wall:1-w,tent:w,shard:0.55*(1-o3(s)),dim:0.95,sy:lerp(-0.35,-0.1,s),night:0.1*w+0.5*Math.abs(Math.sin(u*25))*(1-w)*w*4*(w>0?1:0),dawn:0.6*Math.abs(Math.sin(u*19))*w*(1-w)*4,fog:lerp(7,34,w),amber:0.45*(1-s)};}},
 {id:"D",a:7.56,b:11.34,cam:(u)=>cam(v3(CAMPHI,[0,14.6,10.4],u),[0,0,0],0.86),par:(u)=>({...CAMP,serp:0,dim:lerp(0.95,0.74,seg(u,0.4,1))})},
 {id:"E",a:11.34,b:14.26,cam:(u)=>cam(v3([-3.6,0.42,7.8],[-3.1,0.46,6.9],u),[-0.7,2.0,1.2],1.1),par:()=>({wall:0,tent:1,serp:0,dim:0.98,fog:16})},
 {id:"G1",a:14.26,b:14.84,cam:(u)=>cam(v3([-3.4,0.5,3.6],[-3.3,0.45,3.2],u),[-0.7,1.2,0.0],1.25),par:()=>({wall:0,tent:1,serp:0,dim:0.98,fog:16})},
 {id:"G2",a:14.84,b:15.56,cam:(u)=>cam(v3([-1.7,0.25,3.2],[-1.7,0.25,3.05],u),[0,lerp(1.6,1.95,o3(u)),0],0.95),par:(u)=>({wall:0,tent:1,serp:0.7+0.3*o3(seg(u,0,0.22)),dim:1,fog:16,amber:0.5})},
 {id:"H",a:15.56,b:17.2,cam:(u)=>cam(v3([-6.2,0.42,9.4],[-5.7,0.42,8.8],u),[-1.7,1.5,3.0],1.08),par:()=>({wall:0,tent:1,dim:0.86,fog:18,amber:0.7})},
 {id:"I",a:17.2,b:18.06,cam:(u)=>cam(v3([0,14.6,10.4],[0,15.6,11.2],u),[0,0,0],0.86),par:()=>({...CAMP,dim:0.86})},
 {id:"K",a:20.94,b:23.86,cam:(u)=>cam(v3([-3.6,0.55,7.0],[-1.5,0.62,6.1],io(u)),v3([0.1,1.35,0],[0,2.15,0],io(u)),1.2),par:()=>({wall:1,dim:0.36,night:0.45,amber:1.3,fog:9})},
 {id:"L",a:23.86,b:24.98,cam:(u)=>cam(v3([-0.9,0.8,6.8],[-0.75,0.8,6.2],u),[-0.5,1.42,0],1.3),par:()=>({wall:1,dim:0.46,night:0.35,amber:1.0,fog:9})},
 {id:"M",a:24.98,b:28.06,cam:(u)=>cam(v3(A0,[-2.2,0.66,5.3],u),AT,1.28),par:()=>FROZ},
 {id:"N",a:28.06,b:31.3,cam:(u)=>cam(v3([-2.2,0.66,5.3],[-1.5,1.0,6.0],io(seg(u,0,0.7))),v3(AT,[0,0.45,0],io(seg(u,0,0.6))),1.28),par:(u)=>{const f=seg(u,0,0.5);return {wall:1,sy:-0.35,shard:0.55+0.5*f,drop:2.4*f*f,dim:lerp(0.95,0.5,seg(u,0,0.8)),amber:0.45*(1-f),serp:0.999};}},
 {id:"O",a:31.3,b:37.44,cam:(u)=>{const t=31.3+u*6.14,k=io(seg(t,34.5,36.1));return cam(v3([-2.3,0.82,1.55],[-0.9,0.35,9.4],k),v3([0.9,0.95,-0.1],[0.1,5.3,-0.4],k),lerp(1.35,0.8,k));},par:(u)=>{const t=31.3+u*6.14;return {set:1,night:1,wall:0,serp:0,ghost:0.0001+io(seg(t,34.4,35.5)),sy:1.1+1.6*o3(seg(t,36.82,37.44)),ss:2.5,fog:16,dim:1};}},
 {id:"P",a:37.44,b:42.1,cam:(u)=>{const t=37.44+u*4.66,k=io(seg(t,39.1,39.75));return cam(v3([-2.9,0.3,8.6],[-3.1,0.3,8.2],u),[lerp(-0.2,3.05,k),lerp(1.95,2.3,u),0],0.92);},par:()=>({wall:0,tent:1,dim:0.92,fog:18,amber:0.6})},
 {id:"S",a:44.1,b:49.74,cam:(u)=>{const k=i3(seg(u,0.40,1));return cam(v3([0,15,10.8],[0,86,46],k),[0,0,0],lerp(0.86,1.0,k));},par:(u)=>({...CAMP,dim:0.84,fog:lerp(34,120,seg(u,0.4,1))})},
 {id:"U",a:49.74,b:52.66,cam:(u)=>cam(v3(A0,A1,u*0.5),AT,1.28),par:(u)=>({wall:1,sy:-0.35,shard:0.55+0.05*u,dim:0.62,night:0.42,dawn:0.25,drop:0.25*u*u,fog:7})},
 {id:"V",a:52.66,b:58.7,cam:(u)=>{const k=io(seg(u,0.02,0.92));return cam(v3([0.1,0.46,4.7],[0.35,1.35,5.0],k),[0.7,lerp(2.5,3.85,k),-26],1.55);},par:(u)=>{const k=io(seg(u,0.11,0.66));return {set:2,dawn:lerp(0.1,1,k),night:0.45*(1-k),tent:k,serp:0,wall:0,fog:60};}},
];
export const shotAt=(t)=>SHOTS.find(s=>t>=s.a&&t<s.b);
export const camAt=(s,t)=>s.cam(Math.max(0,Math.min(1,(t-s.a)/(s.b-s.a))));
const norm=(v)=>{const l=Math.hypot(...v);return v.map(x=>x/l);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
// a world point becomes a screen position (1080x1920) and pixels per metre
export const proj=(c,P)=>{const ww=norm(c.ta.map((v,i)=>v-c.ro[i])),uu=norm(cross(ww,[0,1,0])),vv=cross(uu,ww),d=P.map((v,i)=>v-c.ro[i]),z=dot(d,ww);return {x:540+dot(d,uu)/z*c.lens*1920,y:960-dot(d,vv)/z*c.lens*1920,s:c.lens/z*1920,z};};
