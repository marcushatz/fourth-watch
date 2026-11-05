// Structural JS contract execution only. This is NOT a WebGL render.
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
class V{
 constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
 set(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return this;}
 copy(a){return this.set(a.x,a.y,a.z);}
 clone(){return new V(this.x,this.y,this.z);}
 sub(a){this.x-=a.x;this.y-=a.y;this.z-=a.z;return this;}
 add(a){this.x+=a.x;this.y+=a.y;this.z+=a.z;return this;}
 multiplyScalar(t){this.x*=t;this.y*=t;this.z*=t;return this;}
 length(){return Math.hypot(this.x,this.y,this.z);}
 toArray(){return [this.x,this.y,this.z];}
}
class R{set(){return this;}}
class Col{setRGB(){return this;}}
class O{
 constructor(){this.position=new V();this.rotation=new R();this.scale=new V(1,1,1);this.quaternion={setFromUnitVectors(){}};
   this.children=[];this.visible=true;}
 add(...args){this.children.push(...args);}
 lookAt(...args){this.look=args;}
 updateProjectionMatrix(){}
}
class A{
 constructor(arr,itemSize){this.array=Float32Array.from(arr);this.itemSize=itemSize;this.count=this.array.length/itemSize;}
 getX(i){return this.array[i*this.itemSize];}
 getZ(i){return this.array[i*this.itemSize+2];}
 setY(i,y){this.array[i*this.itemSize+1]=y;}
 setXYZ(i,x,y,z){this.array.set([x,y,z],i*this.itemSize);}
}
class GEO{
 constructor(){this.attrs={};}
 setAttribute(k,v){this.attrs[k]=v;}
 getAttribute(k){return this.attrs[k];}
 setIndex(i){this.indices=i;}
 computeVertexNormals(){}
}
class Light extends O{constructor(){super();this.target=new O();}}
class Mat{constructor(){this.opacity=1;}}
const THREE={Vector3:V,Color:Col,SRGBColorSpace:'srgb',LinearFilter:1,DataTexture:class{},Scene:O,Group:O,Mesh:class extends O {constructor(geo,mat){super();this.geometry=geo;this.material=mat}},
  SphereGeometry:GEO,CylinderGeometry:GEO,ConeGeometry:GEO,BoxGeometry:GEO,
  BufferGeometry:GEO,Float32BufferAttribute:A,MeshPhongMaterial:Mat,MeshBasicMaterial:Mat,DirectionalLight:Light,AmbientLight:O,
  DoubleSide:2};
globalThis.THREE=THREE;globalThis.SCENES={};
function load(p){vm.runInThisContext(fs.readFileSync(path.join(root,p),'utf8'),{filename:p});}
load('native_three/storm_track.js');
load('native_three/storm_native.js');
const API=globalThis.SCENES.storm_native;
if(!API || !API.build || !API.frame)throw Error('SCENES native contract missing');
(async()=>{
 const camera=new O();await API.build({W:1080,H:1920,cam:camera});
 for(const s of globalThis.FW_STORM_TRACK.shots){
   for(const f of [s.start_frame,Math.floor((s.start_frame+s.end_frame)/2),s.end_frame-1]){
     const out=API.frame(f/30,{id:s.id},camera);
     if(!out?.scene || !out.scene.children.length) throw Error('No 3D scene '+s.id);
     if(!Number.isFinite(camera.fov))throw Error('Invalid native camera fov '+s.id);
   }
 }
 console.log('Native scene API structural runtime: 36 contract frames executed (no WebGL)');
})().catch(e=>{console.error(e);process.exit(1)});
