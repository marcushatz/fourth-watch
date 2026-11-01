const {chromium}=require('playwright'); const fs=require('fs'); const M=require('./marks.js');
const items=[['A · Cross on the water',M.crossOnWater()],['B · Figure on the water',M.figureOnWater()],['C · Lantern cross',M.lanternCross()]];
for (const [n,s] of items) fs.writeFileSync(n[0]+'.svg',s);
const uri=s=>'data:image/svg+xml;base64,'+Buffer.from(s).toString('base64');
const font='data:font/woff2;base64,'+fs.readFileSync('cinzel-latin-700-normal.woff2').toString('base64');
let rows='';
for (const bg of ['#111','#fafafa']){
  rows+=`<div class="row" style="background:${bg};color:${bg=='#111'?'#ddd':'#333'}">`;
  for (const [n,s] of items){ rows+=`<div class="cell"><div class="t">${n}</div><div class="sz"><img src="${uri(s)}" style="width:300px"><img src="${uri(s)}" style="width:110px"><img src="${uri(s)}" style="width:48px"></div></div>`; }
  rows+='</div>';
}
const html=`<html><head><style>@font-face{font-family:Cinzel;src:url(${font})}body{margin:0;font-family:Inter,sans-serif}.row{display:flex;gap:36px;padding:28px 36px}.cell{width:520px}.t{font-size:22px;margin-bottom:14px;font-weight:600}.sz{display:flex;align-items:flex-end;gap:22px}img{border-radius:50%;display:block}</style></head><body>${rows}</body></html>`;
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1700,height:900},deviceScaleFactor:1});await p.setContent(html);await p.waitForTimeout(300);await p.screenshot({path:'marks_r1.png',fullPage:true});await b.close();})();
