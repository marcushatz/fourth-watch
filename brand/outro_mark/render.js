const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path'); const {execFileSync}=require('child_process');
const [mode,which,...rest]=process.argv.slice(2); const dir=__dirname;
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto('file://'+path.join(dir,'mark.html')+'?m='+which); await p.evaluate(()=>window.ready);
 if(mode==='still'){await p.evaluate(()=>window.renderAt(9)); await p.screenshot({path:path.join(dir,`mark_${which}.png`)});}
 else { const dur=Number(rest[0]||3.6), fps=30, fd=path.join(dir,'fr_'+which); fs.rmSync(fd,{recursive:true,force:true}); fs.mkdirSync(fd);
  for(let i=0;i<Math.round(dur*fps);i++){await p.evaluate(t=>window.renderAt(t),i/fps); await p.screenshot({path:path.join(fd,`f_${String(i).padStart(4,'0')}.png`)});}
  execFileSync('ffmpeg',['-y','-loglevel','error','-framerate','30','-i',path.join(fd,'f_%04d.png'),'-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',path.join(dir,`fw_outro_mark_${which}.mp4`)]); }
 await b.close();})();
