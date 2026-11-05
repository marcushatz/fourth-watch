// v11 migration adapter: the native film27 SCENES[name].build/frame contract.
// It consumes 30fps VTK-evaluated, provenance-bound states and draws them as
// actual Three.js geometry via the EXISTING film27 LW.render pipeline.
// All art is schematic and unapproved. Not a second frame-compositing engine.
(function () {
  'use strict';
  const THREE=globalThis.THREE, T=globalThis.FW_STORM_TRACK;
  if (!THREE || !T || T.status!=='NOT_APPROVED_LAYOUT' || T.fps!==30)
    throw Error('storm_native: missing native Three.js runtime or invalid v11 track');
  const SCENES=globalThis.SCENES=(globalThis.SCENES||{});
  // v10 palette, written as the same display values the VTK renderer used.
  const display=(r,g,b)=>new THREE.Color().setRGB(r,g,b,THREE.SRGBColorSpace);
  const colors={robe:display(.77,.73,.65),peter:display(.55,.41,.31),crew:display(.29,.36,.27),skin:display(.76,.62,.48),
    hair:display(.20,.17,.13),wood:display(.36,.21,.13),trim:display(.52,.33,.18),
    shore:display(.28,.30,.25),loaf:display(.67,.49,.26)};
  // VTK's specular .12 at power 14, scaled for Three's normalized Blinn-Phong highlight.
  const material=(color,opts={})=>new THREE.MeshPhongMaterial({color,specular:display(.022,.022,.022),shininess:14,
    side:THREE.DoubleSide,...opts});
  const mat={};Object.keys(colors).forEach(k=>mat[k]=material(colors[k]));
  const faceted={};['robe','peter','crew'].forEach(k=>faceted[k]=material(colors[k],{flatShading:true}));
  mat.wood=material(colors.wood,{specular:display(.05,.05,.05)});
  mat.shore=material(colors.shore,{specular:0,emissive:display(.12,.125,.105)});
  const RIPPLE_SIDES=44;
  const sRGBToLinear=(c)=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4);
  const smooth=(x)=>{const q=Math.max(0,Math.min(1,x));return q*q*(3-2*q);};
  const V=(p)=>new THREE.Vector3(p[0],p[1],p[2]);
  const UP=new THREE.Vector3(0,1,0);
  const rounded=(n)=>Math.round(n*1e6)/1e6;
  function mesh(g,m=mat.crew){return new THREE.Mesh(g,m);}
  function setSegment(obj,a,b,r){
    const A=V(a),B=V(b),d=B.clone().sub(A),len=d.length();
    obj.position.copy(A.add(B).multiplyScalar(.5));
    obj.quaternion.setFromUnitVectors(UP,d.multiplyScalar(1/Math.max(len,1e-9)));
    obj.scale.set(r,len,r);
  }
  function makeFigure(kind){
    const group=new THREE.Group(), cloak=kind==='Jesus'?'robe':kind==='Peter'?'peter':'crew';
    const body=mesh(new THREE.ConeGeometry(.34,1.06,12),faceted[cloak]);group.add(body);
    const head=mesh(new THREE.SphereGeometry(.22,12,8),mat.skin);group.add(head);
    const hair=mesh(new THREE.SphereGeometry(.232,12,8),mat.hair);group.add(hair);
    const limbs=[];
    for(let i=0;i<4;i++){const v=mesh(new THREE.CylinderGeometry(1,1,1,8), i<2?mat[cloak]:mat.skin);group.add(v);limbs.push(v);}
    const legs=[];for(let i=0;i<2;i++){const v=mesh(new THREE.CylinderGeometry(1,1,1,8),mat[cloak]);group.add(v);legs.push(v);}
    const hands=[];for(let i=0;i<2;i++){const v=mesh(new THREE.SphereGeometry(.11,9,6),mat.skin);group.add(v);hands.push(v);}
    const shoes=[];for(let i=0;i<2;i++){const v=mesh(new THREE.SphereGeometry(.15,9,6),mat[cloak]);group.add(v);shoes.push(v);}
    return {group,body,head,hair,limbs,legs,hands,shoes};
  }
  function setFigure(fig,s){
    fig.group.visible=!!s.visible;
    if(!s.visible)return;
    const J=s.joints;if(!J)throw Error('visible figure without state joints');
    fig.body.position.copy(V(s.body));fig.body.rotation.set(0,0,s.body_orientation[2]*Math.PI/180);
    fig.head.position.copy(V(s.head));fig.hair.position.copy(V(s.hair));
    const offset=(x)=>new THREE.Vector3(x,-.1,-.03);
    for(let i=0;i<2;i++){
      const side=i===0?'left':'right',shoulder=J[side+'_shoulder'],hand=J[side+'_hand'];
      const elbow=V(shoulder).add(V(hand)).multiplyScalar(.5).add(offset(i===0?-.1:.1)).toArray();
      setSegment(fig.limbs[i],shoulder,elbow,i===0?.095:.09);
      setSegment(fig.limbs[i+2],elbow,hand,i===0?.09:.085);
      fig.hands[i].position.copy(V(hand));
      // VTK figure's hip is (body_root_y + .82); head is root_y + 1.88.
      const root=J.head[1]-1.88;
      const hip=[J.head[0]+(i===0?-.18:.18),root+.82,J.head[2]];
      const foot=J[side+'_foot'];setSegment(fig.legs[i],hip,foot,.105);
      fig.shoes[i].position.copy(V(foot));fig.shoes[i].scale.set(1.25,.55,1.3);
    }
  }
  function makeBoat(){
    const group=new THREE.Group(),X=[];
    for(let j=0;j<13;j++)X.push(-2.65+5.3*j/12);
    // Open sided, low-poly hull from the same stations as v10 VTK.
    const vertices=[],faces=[];
    for(const [height,width] of [[-.35,.42],[-.12,.73],[.19,1]])
      for(const sign of [-1,1])
        X.forEach(x=>{const u=(x+2.65)/5.3,taper=.34+.66*Math.pow(Math.max(0,Math.sin(Math.PI*u)),.8);
          vertices.push(x,height,sign*width*taper);});
    for(let level=0;level<2;level++)for(let side=0;side<2;side++){
      const st=level*26+side*13,top=(level+1)*26+side*13;
      for(let j=0;j<12;j++)faces.push(st+j,st+j+1,top+j+1,st+j,top+j+1,top+j);
    }
    for(const j of [0,12])faces.push(26+j,39+j,65+j,26+j,65+j,52+j);   // bow and stern, as in v10
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geo.setIndex(faces);geo.computeVertexNormals();
    group.add(mesh(geo,mat.wood));
    for(const side of [-1,1])for(let j=0;j<12;j++){
      const u=j/12,v=(j+1)/12;
      const taper=w=>.34+.66*Math.pow(Math.max(0,Math.sin(Math.PI*w)),.8);
      const a=[-2.65+5.3*u,.2,side*taper(u)],b=[-2.65+5.3*v,.2,side*taper(v)];
      const rib=mesh(new THREE.CylinderGeometry(1,1,1,7),mat.trim);setSegment(rib,a,b,.046);group.add(rib);
    }
    for(const x of [-1.4,.4,1.8]){const plank=mesh(new THREE.BoxGeometry(.16,.07,1.7),mat.trim);plank.position.set(x,-.01,0);group.add(plank);}
    return group;
  }
  function makeShore(){
    const verts=[],faces=[],cols=34,rows=121;
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
      const z=-72+144*j/(rows-1),coast=-14.8+2.2*Math.sin(z*.11)+.8*Math.sin(z*.41),
        u=i/(cols-1),x=-54+(coast+54)*u,h=.44+.9*Math.pow(1-u,2)+.11*(1-u)*Math.sin(z*.12+x*.19);
      verts.push(x,h,z);
      if(i&&j){const k=(j-1)*cols+i-1;faces.push(k,k+1,k+cols,k+1,k+cols+1,k+cols);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
    geo.setIndex(faces);geo.computeVertexNormals();
    return mesh(geo,mat.shore);
  }
  function makeSea(){
    const vertices=[],faces=[],N=81,M=60;
    for(let j=0;j<M;j++)for(let i=0;i<N;i++)vertices.push(-130+260*i/(N-1),-.02,-130+260*j/(M-1));
    for(let j=0;j<M-1;j++)for(let i=0;i<N-1;i++){
      const k=j*N+i;faces.push(k,k+1,k+N,k+1,k+N+1,k+N);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(new Array(vertices.length).fill(0),3));
    geo.setIndex(faces);geo.computeVertexNormals();
    return mesh(geo,new THREE.MeshPhongMaterial({color:0xffffff,vertexColors:true,specular:display(.32,.32,.32),shininess:48,side:THREE.DoubleSide}));
  }
  // v10 draws the ripple as a line of fixed width, so the ring keeps one width as it spreads.
  function makeRipple(){
    const pos=[],faces=[];
    for(let i=0;i<=RIPPLE_SIDES;i++){
      const a=2*Math.PI*i/RIPPLE_SIDES;pos.push(Math.cos(a),Math.sin(a),0,Math.cos(a),Math.sin(a),0);
      if(i<RIPPLE_SIDES)faces.push(2*i,2*i+1,2*i+3,2*i,2*i+3,2*i+2);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(faces);
    return mesh(geo,new THREE.MeshBasicMaterial({color:display(.72,.84,.83),transparent:true,opacity:.72,side:THREE.DoubleSide}));
  }
  function rippleUpdate(s){
    const size=s.ripple.scale[0],p=ripple.geometry.getAttribute('position'),inner=Math.max(0,1-.024/size);
    for(let i=0;i<=RIPPLE_SIDES;i++){const a=2*Math.PI*i/RIPPLE_SIDES;p.setXYZ(2*i+1,inner*Math.cos(a),inner*Math.sin(a),0);}
    p.needsUpdate=true;
    ripple.material.opacity=.74*(1-Math.max(0,Math.min(1,(size-.10)/.74)));   // v10 fades it as it spreads
  }
  function seaUpdate(sea,s){
    const a=sea.geometry.getAttribute('position'),c=sea.geometry.getAttribute('color'),time=s.frame/30,amp=s.sea_calm;
    for(let i=0;i<a.count;i++){
      const x=a.getX(i),z=a.getZ(i),y=-.02+amp*(.19*Math.sin(z*.72+time*1.4+x*.06)+
        .105*Math.sin(x*.62-z*.21+time*1.95)+.045*Math.sin(x*1.85+z*.8-time*2.7));
      a.setY(i,y);
      // Rising crests lighten, using v10's own formula.
      const w=Math.pow(Math.max(0,Math.min(1,(y-.06)/.27)),2);
      c.setXYZ(i,sRGBToLinear((13+48*w)/255),sRGBToLinear((55+69*w)/255),sRGBToLinear((72+83*w)/255));
    }
    a.needsUpdate=true;c.needsUpdate=true;
  }
  // v10's two-tone night sky, drawn behind the scene.
  function skyTexture(){
    const rows=64,data=new Uint8Array(rows*4),lo=[.045,.077,.14],hi=[.115,.17,.25];
    for(let j=0;j<rows;j++)for(let k=0;k<3;k++)data[j*4+k]=Math.round(255*(lo[k]+(hi[k]-lo[k])*j/(rows-1)));
    for(let j=0;j<rows;j++)data[j*4+3]=255;
    const tex=new THREE.DataTexture(data,1,rows);tex.colorSpace=THREE.SRGBColorSpace;
    tex.magFilter=tex.minFilter=THREE.LinearFilter;tex.needsUpdate=true;
    return tex;
  }
  // The burned-in text from v10: the S03 graphic, the S11 reference and the NOT APPROVED labels.
  const scale=3;     // v10 is 360 wide; film27's stage is 1080
  function text(ctx,value,x,y,size,color){
    ctx.font=`600 ${size}px "Inter"`;ctx.fillStyle=color;ctx.fillText(value,x*scale,y*scale);
  }
  function overlay(ctx,shot,f,W,H){
    const beat=shot.beats||{};
    ctx.save();ctx.textAlign='left';ctx.textBaseline='alphabetic';
    if(shot.id==='S03'){
      ctx.fillStyle='rgba(0,0,0,.33)';ctx.fillRect(0,0,W,H);
      text(ctx,'FOURTH WATCH',42,160,73,'rgb(189,184,148)');
      text(ctx,'3 AM - 6 AM',34,220,91,'rgb(211,220,208)');
      ctx.strokeStyle='rgb(160,169,129)';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(50*scale,260*scale);ctx.lineTo(305*scale,260*scale);ctx.stroke();
      const v=smooth((f-beat['fourth watch'])/58);
      ctx.fillStyle='rgb(203,181,124)';ctx.beginPath();ctx.arc((50+255*v)*scale,260*scale,30,0,Math.PI*2);ctx.fill();
    }
    if(shot.id==='S11'&&f>=beat['Mark 6:52']){
      ctx.fillStyle='rgb(13,21,36)';ctx.fillRect(5*scale,40*scale,350*scale,65*scale);
      text(ctx,'MARK 6:52',28,67,61,'rgb(221,189,126)');
      text(ctx,'THE LOAVES',26,94,56,'rgb(240,232,208)');
    }
    text(ctx,'FOURTH WATCH  /  LAYOUT TEST',12,23,36,'rgb(235,217,180)');
    text(ctx,`${shot.id}  -  NOT APPROVED`,12,(H/scale)-18,39,'rgb(235,217,180)');
    ctx.restore();
  }
  let world,boat,figures,shore,moon,sea,ripple,loaves,oars,W,H;
  SCENES.storm_native={
    async build(env){
      W=env.W;H=env.H;
      world=new THREE.Scene();world.background=skyTexture();
      // VTK adds ambient, diffuse and specular in display values. These intensities give the same
      // bright and dark limits in Three's linear pipeline. Three divides diffuse light by pi.
      const PI=Math.PI,linear=(r,g,b)=>new THREE.Color().setRGB(r,g,b);
      world.add(new THREE.AmbientLight(linear(1,1,1),.0516*PI));
      const key=new THREE.DirectionalLight(linear(.339,.40,.54),PI);key.position.set(-9,17,12);world.add(key);
      const amber=new THREE.DirectionalLight(linear(.215,.146,.088),PI);amber.position.set(6,8,-3);
      amber.target.position.set(1,0,-2);world.add(amber);world.add(amber.target);
      sea=makeSea();world.add(sea);
      shore=makeShore();world.add(shore);
      moon=mesh(new THREE.SphereGeometry(1,18,14),new THREE.MeshBasicMaterial({color:display(.93,.95,.97)}));moon.position.set(-17,13,-35);world.add(moon);
      boat=makeBoat();world.add(boat);
      oars=Array.from({length:2},()=>mesh(new THREE.CylinderGeometry(.058,.058,1,8),mat.trim));oars.forEach(o=>world.add(o));
      figures={};for(const k of ['Jesus','Peter','crew_0','crew_1','crew_2']){figures[k]=makeFigure(k);world.add(figures[k].group);}
      ripple=makeRipple();ripple.rotation.x=-Math.PI/2;world.add(ripple);
      loaves=Array.from({length:5},()=>mesh(new THREE.SphereGeometry(.28,12,8),mat.loaf));loaves.forEach(o=>world.add(o));
    },
    frame(t,shot,cam){
      const f=Math.max(0,Math.min(T.frames.length-1,Math.floor(t*T.fps+1e-6)));
      const s=T.frames[f];
      if(s.shot!==shot.id)throw Error('native bridge shot mismatch: '+s.shot+' vs '+shot.id);
      const C=s.camera;
      cam.position.set(...C.position);cam.lookAt(...C.look);cam.fov=C.fov;cam.near=.1;cam.far=150;cam.updateProjectionMatrix();
      boat.visible=s.boat.visible;boat.position.set(...s.boat.position);
      boat.rotation.set(...s.boat.orientation.map(v=>v*Math.PI/180),'ZXY');   // tested against VTK's own matrix: R = Rz*Rx*Ry
      for(let i=0;i<2;i++){
        const v=s.boat.oars[i];oars[i].visible=v.visible;
        oars[i].position.set(...v.position);oars[i].rotation.set(...v.orientation.map(z=>z*Math.PI/180),'ZXY');
        oars[i].scale.set(...v.scale);
      }
      Object.keys(figures).forEach(k=>setFigure(figures[k],s.figures[k]));
      shore.visible=s.shore;moon.visible=s.moon;
      ripple.visible=s.ripple.visible;ripple.position.set(...s.ripple.position);
      ripple.scale.set(...s.ripple.scale);if(s.ripple.visible)rippleUpdate(s);
      loaves.forEach((o,i)=>{const v=s.loaves[i];o.visible=v.visible;o.position.set(...v.position);o.scale.set(...v.scale);});
      seaUpdate(sea,s);
      return {scene:world,bill:[],focus:10,aperture:0,maxR:.1,exposure:1,sat:1,lift:[0,0,0],bloom:0,
        post:(ctx)=>overlay(ctx,shot,s.frame,W,H)};
    }
  };
})();
