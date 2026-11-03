// words land on the voice. Display text comes from the locked script; timing comes from the real take.
import { readFileSync } from "node:fs";
export const WORDS=JSON.parse(readFileSync("/home/user/what-if/fw-serpent/words.json","utf8"));
export const SCRIPT="What if a king smashed something God told Moses to make? And the Bible says he did what was right. Rewind. Israel spoke against God. Fiery serpents are killing them. God tells Moses: make a fiery serpent. Set it on a pole. Bitten? Look at it, and live. Then it vanishes from Scripture for centuries. When it returns, people are making offerings to it. So King Hezekiah smashes it. It was called Nehushtan. The serpent is gone. End of story. Centuries later, Jesus brings up a serpent that no longer exists. “And as Moses lifted up the serpent in the wilderness, so must the Son of Man be lifted up.” He's describing his own death. Just as the dying looked and lived, “…whoever believes in him may have eternal life.” The story doesn't end with a broken serpent. It ends with eternal life.".split(" ");
export const tW=(i)=>WORDS[i].s, eW=(i)=>WORDS[i].e;
export const PARCH="#F4E9D2", GOLD="#F0C062", EMBER="#E5825A", ASH="#B8AC9A";
const kf=(property,rows)=>({property,keyframes:rows.map(([at,value,easing])=>easing?{at,value,easing}:{at,value})});
export const makeType=(F)=>{
  const ser=(s,w=700)=>({typography:{fontAssetId:F.co.id,axes:{wght:w}},fontFamily:"Cormorant Garamond",fontSize:s,fontWeight:w,lineHeight:1.05});
  const cap=(s,w=700)=>({typography:{fontAssetId:F.cz.id,axes:{wght:w}},fontFamily:"Cinzel",fontSize:s,fontWeight:w,lineHeight:1.05});
  const shade={x:0,y:4,blur:26,color:"#000000D8"};
  // lines: [[count of words, opts]...] consumed from word index `from`
  const Cap=({from,lines,y,t1,t0,size=100,lh,gold=[],font="ser",fade=.14,color=PARCH,goldSize,rx=40,rw=1000})=>{
    const st=Math.max(0,t0??tW(from)-.08), d=t1-st, H=lh||size*1.14; let idx=from;
    const rows=lines.map((n,li)=>{const ws=[];for(let k=0;k<n;k++,idx++){const i=idx,at=Math.max(.001,tW(i)-st-.02),g=gold.includes(i),sz=g&&goldSize?goldSize:size,sty=(g&&goldSize)||font=="cap"?cap(sz*.82,600):ser(sz);
        const a=[kf("opacity",[[0,0,"hold"],[at-.0005,0],[at+.07,1]]),kf("offsetY",[[0,20,"hold"],[at-.0005,20,[.16,1,.3,1]],[at+.28,0]])];
        if(g)a.push(kf("scale",[[0,1.16,"hold"],[at-.0005,1.16,[.16,1,.3,1]],[at+.3,1]]));
        ws.push(<text {...sty} color={g?GOLD:color} strokeColor="#120C08" strokeWidth={3} shadow={shade} animate={a}>{SCRIPT[i]}</text>);}
      return <row x={rx} y={li*H} width={rw} gap={size*.26} justify="center" align="end">{ws}</row>;});
    return <frame at={st} duration={d} x={0} y={y} width={1080} height={H*lines.length+40} layout="none" animate={[kf("opacity",[[0,1],[Math.max(.01,d-fade),1],[d-.01,0]])]}>{rows}</frame>;};
  const Tag=(t0,t1,x,y,w,txt,o={})=>{const d=t1-t0;return <text at={t0} duration={d} x={x} y={y} width={w} align={o.align||"center"} {...cap(o.size||34,600)} letterSpacing={6} color={o.color||ASH} strokeColor="#120C08" strokeWidth={2} shadow={shade} animate={[kf("opacity",[[0,0],[.25,1],[d-.25,1],[d-.01,0]])]}>{txt}</text>;};
  return {Cap,Tag,ser,cap,shade};
};
