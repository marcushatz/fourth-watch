const {chromium}=require('playwright'); const fs=require('fs'); const M=require('./marks.js');
const uri=s=>'data:image/svg+xml;base64,'+Buffer.from(s).toString('base64');
const items=[['A · Cross on the water',M.crossOnWater()],['C · Lantern cross',M.lanternCross()]];
fs.writeFileSync('A_cross_on_water.svg',items[0][1]); fs.writeFileSync('C_lantern_cross.svg',items[1][1]);
let cells='';
for (const [n,s] of items){
 cells+=`<div class="cell"><div class="t">${n}</div><img class="big" src="${uri(s)}">
 <div class="ig light"><img src="${uri(s)}" class="p"><div><b>fourthwatchbible</b><br><span>Fourth Watch | Bible Stories</span></div></div>
 <div class="ig dark"><img src="${uri(s)}" class="p"><div><b>fourthwatchbible</b><br><span>Fourth Watch | Bible Stories</span></div></div>
 <div class="tiny"><img src="${uri(s)}" style="width:56px"><img src="${uri(s)}" style="width:40px"><img src="${uri(s)}" style="width:28px"><span>feed / comments size</span></div></div>`;
}
const html=`<html><head><style>body{margin:0;background:#e9e9e9;font-family:Inter,sans-serif;display:flex;gap:40px;padding:30px}.cell{background:#fff;padding:24px;border-radius:16px;width:560px}.t{font-weight:700;font-size:22px;margin-bottom:16px}.big{width:340px;border-radius:50%;display:block;margin:0 auto 20px}.ig{display:flex;align-items:center;gap:18px;padding:16px;border-radius:12px;margin-bottom:12px;font-size:17px}.ig span{opacity:.7}.light{background:#fff;border:1px solid #ddd;color:#111}.dark{background:#000;color:#f5f5f5}.p{width:110px;border-radius:50%}.tiny{display:flex;align-items:center;gap:14px;font-size:14px;color:#666}.tiny img{border-radius:50%}</style></head><body>${cells}</body></html>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:900}});await p.setContent(html);await p.waitForTimeout(300);await p.screenshot({path:'marks_r2_profile.png',fullPage:true});await b.close();})();
