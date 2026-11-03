// identity proof: five moments, five visual languages, one hand. Stills only.
import { PAINTS } from "../edit/cast.jsx";
const NIGHT="#14100D",UMBER="#2A1E16",CLAY="#6B4A33",GOLD="#E3B25C",PARCH="#F2E6CF",EMBER="#C2502E",ASH="#A89B8A";
const here="/home/user/what-if/fw-serpent/proof/";
export default async ({project})=>{ const p=await project({dir:"proof_c",size:"1080x1920",fps:30,background:NIGHT});
  const F={cz:await p.add("/home/user/what-if/bronze-v4/fonts/Cinzel.ttf"),it:await p.add("/home/user/what-if/bronze-v4/fonts/CormorantGaramond-Italic.ttf")};
  const I={a:await p.add(here+"f1.png"),b:await p.add(here+"f2.png"),d:await p.add(here+"f4.png"),e:await p.add(here+"f5.png")};
  const it=(s,w=600)=>({typography:{fontAssetId:F.it.id,axes:{wght:w}},fontFamily:"Cormorant Garamond",fontSize:s,fontWeight:w,lineHeight:1.05});
  const cz=(s,w=600)=>({typography:{fontAssetId:F.cz.id,axes:{wght:w}},fontFamily:"Cinzel",fontSize:s,fontWeight:w,lineHeight:1.05});
  const shade={x:0,y:3,blur:22,color:"#000000C0"};
  const Line=(words,y,size,col=PARCH,mark={},x=60,w=960,just="center")=><row x={x} y={y} width={w} gap={size*.26} justify={just} align="end">{words.split(" ").map((t,i)=><text {...it(size)} color={mark[i]||col} shadow={shade}>{t}</text>)}</row>;
  const Tag=(t,y,x=0,w=1080,c=ASH,s=30,align="center")=><text x={x} y={y} width={w} align={align} {...cz(s,500)} letterSpacing={6} color={c} shadow={shade}>{t}</text>;
  const Slot=(i,kids)=><frame at={i} duration={1} x={0} y={0} width={1080} height={1920} layout="none">{kids}</frame>;
  const Img=(a)=><media file={a} x={0} y={0} width={1080} height={1920} fit="fill" muted={true}/>;
  const Ring=(x,y,r,c,w=7)=>{const k=r*.5523;return <path x={x} y={y} width={1} height={1} d={`M 0 ${-r} C ${k} ${-r} ${r} ${-k} ${r} 0 C ${r} ${k} ${k} ${r} 0 ${r} C ${-k} ${r} ${-r} ${k} ${-r} 0 C ${-r} ${-k} ${-k} ${-r} 0 ${-r} Z`} stroke={{width:w,color:c}}/>;};
  const SERP="M 0 118 C 34 106 46 96 0 84 C -46 72 -46 60 0 48 C 46 36 46 24 0 12 C -46 0 -40 -30 -6 -44 C 18 -54 40 -46 58 -36 L 74 -38 L 58 -26 C 34 -34 10 -36 -8 -24 C -30 -10 -8 0 8 4";
  const GRAIN=`float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h2(i),h2(i+vec2(1.0,0.0)),f.x),mix(h2(i+vec2(0.0,1.0)),h2(i+vec2(1.0,1.0)),f.x),f.y); }
vec4 pixel(vec2 uv){ vec4 c=texture(u_src,uv); float g=n2(uv*vec2(1080.0,1920.0)/2.2)*0.5+n2(uv*vec2(1080.0,1920.0)/1.1)*0.5, v=n2(uv*vec2(6.0,10.0)); c.rgb*=(0.93+0.14*g)*(0.90+0.20*v); return c; }`;
  const paper=<frame x={0} y={0} width={1080} height={1920} layout="none" effects={[{kind:"shader",params:{glsl:GRAIN}}]}><rect x={0} y={0} width={1080} height={1920} fill={{kind:"linear",angle:180,stops:[{offset:0,color:"#120D0A"},{offset:.5,color:"#20160F"},{offset:1,color:"#100B09"}]}}/><rect x={0} y={1140} width={1080} height={520} radius={260} fill={{kind:"radial",stops:[{offset:0,color:"#E3B25C2E"},{offset:.28,color:"#E3B25C12"},{offset:.5,color:"#E3B25C00"},{offset:1,color:"#E3B25C00"}]}}/></frame>;
  const RX=90,RW=900,rule=(y)=><rect x={RX} y={y} width={RW} height={2} fill={CLAY}/>;
  const dots=(x0,x1,y,c)=>Array.from({length:Math.floor((x1-x0)/30)},(_,i)=><rect x={x0+i*30} y={y} width={16} height={4} radius={2} fill={c}/>);
  const ledger=<frame x={0} y={0} width={1080} height={1920} layout="none">{paper}<frame x={0} y={0} width={1080} height={1920} layout="none" effects={[{kind:"shader",params:{glsl:PAINTS,res:1080,ao:1}}]}>
    {rule(600)}{rule(910)}{rule(1220)}{rule(1560)}
    {Array.from({length:7},(_,i)=>Ring(RX+38+i*62,830,23,GOLD))}
    {dots(RX+24,RX+560,1144,"#B57B46")}
  </frame></frame>;
  const srp=<frame x={RX+640} y={1046} width={2} height={2} layout="none" origin="center" animate={[{property:"scale",keyframes:[{at:0,value:.72},{at:.9,value:.72}]}]}><path x={0} y={0} width={1} height={1} d={SERP} stroke={{width:11,color:"#B57B46",cap:"round"}}/></frame>;
  const splitLine=<frame x={0} y={0} width={1080} height={1920} layout="none"><rect x={728} y={840} width={120} height={930} radius={60} fill={{kind:"linear",angle:90,stops:[{offset:0,color:"#E3B25C00"},{offset:.5,color:"#E3B25C30"},{offset:1,color:"#E3B25C00"}]}}/><rect x={784} y={860} width={8} height={910} radius={4} fill={{kind:"linear",angle:180,stops:[{offset:0,color:"#FFF0C8"},{offset:1,color:GOLD}]}} shadow={{x:0,y:0,blur:24,color:GOLD}}/></frame>;
  p.compose(<frame width={1080} height={1920} layout="none">
    {Slot(0,[Img(I.a),Line("Moses and his brother Aaron",170,84),Line("each made a metal animal.",264,84,PARCH,{3:GOLD,4:GOLD})])}
    {Slot(1,[Img(I.b),Line("Israel worshiped Aaron's golden calf,",170,70),Line("and about three thousand men",256,84,PARCH,{2:"#E5825A",3:"#E5825A"}),Line("were put to death for it.",350,84)])}
    {Slot(2,[ledger,Line("For God so loved the world,",170,84),Line("that he gave his only Son.",264,84,PARCH,{4:GOLD,5:GOLD}),Tag("JOHN 3:16",380,0,1080,ASH,30),
      Tag("THE CALF",640,RX,RW,ASH,34,"left"),Line("their gold rings",690,92,PARCH,{},RX,RW,"start"),
      Tag("THE SERPENT",950,RX,RW,ASH,34,"left"),Line("a look",1000,92,PARCH,{},RX,RW,"start"),srp,
      Tag("HIS DEATH",1262,RX,RW,GOLD,34,"left"),Line("his only Son",1320,128,GOLD,{},RX,RW,"start"),])}
    {Slot(3,[Img(I.d),Line("People dying of snakebite",170,84),Line("looked at Moses' bronze serpent",264,76),Line("and lived.",350,84,GOLD)])}
    {Slot(4,[Img(I.e),splitLine,Tag("JOHN 3:14",120,0,1080,ASH,30),<rect x={539} y={190} width={2} height={1590} fill={CLAY}/>,
      Line("so must",200,84,PARCH,{},560,500),Line("the Son of Man",300,84,PARCH,{},560,500),Line("be lifted up",400,84,GOLD,{},560,500),
      Line("As Moses",300,84,PARCH,{},20,500),Line("lifted up",400,84,GOLD,{},20,500),Line("the serpent",500,84,PARCH,{},20,500),Line("in the wilderness,",600,72,PARCH,{},20,500),])}
  </frame>,{at:0,dur:5});
};
