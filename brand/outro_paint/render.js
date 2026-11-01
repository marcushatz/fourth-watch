// node render.js stills 0.4 1.2 2.0 2.8 3.8   |   node render.js video [seconds]
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path'); const {execFileSync}=require('child_process');
const http=require('http');
const [mode,...args]=process.argv.slice(2);
const dir=__dirname;
const srv=http.createServer((q,r)=>{const f=path.join(dir,decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/,'')||'outro.html');
  if(!f.startsWith(dir)||!fs.existsSync(f)){r.writeHead(404);return r.end();}
  const ext=path.extname(f);r.writeHead(200,{'Content-Type':{'.html':'text/html','.png':'image/png','.woff2':'font/woff2'}[ext]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});
srv.listen(0,async()=>{
  const port=srv.address().port;
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const p=await b.newPage({viewport:{width:1080,height:1920}});
  await p.goto(`http://127.0.0.1:${port}/outro.html`); await p.evaluate(()=>window.ready);
  if(mode==='stills'){
    fs.mkdirSync(path.join(dir,'stills'),{recursive:true});
    for(const t of args.map(Number)){await p.evaluate(t=>window.renderAt(t),t);await p.screenshot({path:path.join(dir,'stills',`t_${t.toFixed(2)}.png`)});}
  } else {
    const dur=Number(args[0]||5.5), fps=30, fdir=path.join(dir,'frames'); fs.rmSync(fdir,{recursive:true,force:true}); fs.mkdirSync(fdir);
    for(let i=0;i<Math.round(dur*fps);i++){await p.evaluate(t=>window.renderAt(t),i/fps);await p.screenshot({path:path.join(fdir,`f_${String(i).padStart(4,'0')}.png`)});}
    const out=path.join(dir,`fw_outro_${dur}s.mp4`);
    execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(fps),'-i',path.join(fdir,'f_%04d.png'),'-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',out]);
    console.log(out);
  }
  await b.close(); srv.close();
});
