import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const root=document.querySelector("#game");
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8bb8d8);
scene.fog=new THREE.Fog(0x8bb8d8,80,330);

const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,700);
camera.position.set(0,7,10);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

const hemi=new THREE.HemisphereLight(0xbfe8ff,0x3a3027,2.0);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2d2,3.0);
sun.position.set(90,140,70);
sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
scene.add(sun);

const mats={
  grass:new THREE.MeshStandardMaterial({color:0x4d7046,roughness:1}),
  road:new THREE.MeshStandardMaterial({color:0x24272c,roughness:.95}),
  sidewalk:new THREE.MeshStandardMaterial({color:0x777a7d,roughness:.9}),
  white:new THREE.MeshStandardMaterial({color:0xe7e7e4,roughness:.8}),
  yellow:new THREE.MeshStandardMaterial({color:0xf4c542,roughness:.75}),
  glass:new THREE.MeshStandardMaterial({color:0x6fa9c7,metalness:.1,roughness:.25,transparent:true,opacity:.75})
};

function box(w,h,d,mat,x=0,y=h/2,z=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;
}
function flat(w,d,mat,x=0,y=.02,z=0){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,.08,d),mat);
  m.position.set(x,y,z);m.receiveShadow=true;scene.add(m);return m;
}

flat(360,360,mats.grass,0,0,0);

// Roads
for(let i=-150;i<=150;i+=30){
  flat(12,330,mats.road,i,.06,0);
  flat(330,12,mats.road,0,.065,i);
  for(let z=-155;z<155;z+=10) flat(.35,5,mats.white,i,.12,z);
  for(let x=-155;x<155;x+=10) flat(5,.35,mats.white,x,.12,i);
  flat(3,330,mats.sidewalk,i-7.5,.1,0);
  flat(3,330,mats.sidewalk,i+7.5,.1,0);
  flat(330,3,mats.sidewalk,0,.1,i-7.5);
  flat(330,3,mats.sidewalk,0,.1,i+7.5);
}

// Buildings and landmark entrances
const buildings=[];
const palette=[0x7b5b4a,0x53677a,0x665a72,0x7a765e,0x596d5c,0x6e5262];
for(let x=-135;x<=135;x+=30){
  for(let z=-135;z<=135;z+=30){
    if(Math.abs(x)%60===0 && Math.abs(z)%60===0) continue;
    const h=10+((Math.abs(x*13+z*7)%23));
    const w=17+((Math.abs(x+z)%5));
    const d=17+((Math.abs(x*2-z)%5));
    const mat=new THREE.MeshStandardMaterial({color:palette[Math.abs((x+z)/30)%palette.length|0],roughness:.82});
    const b=box(w,h,d,mat,x,h/2,z);
    buildings.push({x,z,w,d,h});
    // simple window strips
    for(let yy=4;yy<h-1;yy+=4){
      for(let xx=-w/2+2;xx<w/2-1;xx+=4){
        const win=new THREE.Mesh(new THREE.BoxGeometry(1.7,.95,.06),mats.glass);
        win.position.set(x+xx,yy,z-d/2-.04);scene.add(win);
      }
    }
  }
}

// Landmark building at city center
// Landmark storefront: built from walls so the player can actually enter the interior.
const shopMat=new THREE.MeshStandardMaterial({color:0x1f2833,roughness:.7});
box(18,.5,14,shopMat,0,.25,-15);
box(18,8,.5,shopMat,0,4,-22);
box(18,8,.5,shopMat,0,4,-8);
box(.5,8,13,shopMat,-8.75,4,-15);
box(.5,8,13,shopMat,8.75,4,-15);
box(18,.5,14,shopMat,0,8,-15);
const signMat=new THREE.MeshStandardMaterial({color:0xf4c542,emissive:0x7a5b00,emissiveIntensity:1.2});
const sign=box(10,2,.18,signMat,0,9,-22.1);
const signCanvas=document.createElement("canvas");signCanvas.width=512;signCanvas.height=128;
const ctx=signCanvas.getContext("2d");ctx.fillStyle="#f4c542";ctx.fillRect(0,0,512,128);ctx.fillStyle="#15120a";ctx.font="bold 62px Arial";ctx.textAlign="center";ctx.fillText("CLOTHES",256,78);
const signTex=new THREE.CanvasTexture(signCanvas);
sign.material=new THREE.MeshBasicMaterial({map:signTex});
const door=box(3.2,4,.2,new THREE.MeshStandardMaterial({color:0x14171b,roughness:.4}),0,2,-22.15);

const entrance={x:0,z:-25,inside:false};

// Player
const player=new THREE.Group();
const body=box(1.15,1.8,.65,new THREE.MeshStandardMaterial({color:0x1d232b}),0,0,0); // temporary, re-parent below
scene.remove(body);player.add(body);
body.position.y=.9;body.position.x=0;body.position.z=0;
const head=new THREE.Mesh(new THREE.SphereGeometry(.46,16,12),new THREE.MeshStandardMaterial({color:0xc58f6d}));
head.position.y=2.05;head.castShadow=true;player.add(head);
const legMat=new THREE.MeshStandardMaterial({color:0x20252d});
for(const sx of [-.3,.3]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.28,1.0,.38),legMat);leg.position.set(sx,-.35,0);leg.castShadow=true;player.add(leg);}
player.position.set(0,0,25);scene.add(player);

const state={moveX:0,moveZ:0,vy:0,onGround:true,speed:7,inside:false};
const clock=new THREE.Clock();

function setMessage(t){document.querySelector("#message").textContent=t}
function nearEntrance(){
  if(state.inside)return true;
  const dx=player.position.x-entrance.x,dz=player.position.z-entrance.z;
  return Math.hypot(dx,dz)<6;
}
function enterBuilding(){
  if(!nearEntrance())return;
  if(!state.inside){
    state.inside=true;
    player.position.set(0,0,-14);
    scene.background=new THREE.Color(0x18202a);
    scene.fog=new THREE.Fog(0x18202a,35,110);
    setMessage("CLOTHES STORE • Interior");
  }else{
    state.inside=false;
    player.position.set(0,0,-25);
    scene.background=new THREE.Color(0x8bb8d8);
    scene.fog=new THREE.Fog(0x8bb8d8,80,330);
    setMessage("Back outside");
  }
}
function jump(){
  if(state.inside)return;
  if(state.onGround){state.vy=7.5;state.onGround=false}
}
document.querySelector("#jump").addEventListener("pointerdown",e=>{e.preventDefault();jump()});
document.querySelector("#interactBtn").addEventListener("pointerdown",e=>{e.preventDefault();enterBuilding()});

// Joystick
const joy=document.querySelector("#joystick"),stick=document.querySelector("#stick");
let joyId=null;
function joyMove(e){
  const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy;
  const max=44,len=Math.hypot(dx,dy);
  if(len>max){dx=dx/len*max;dy=dy/len*max}
  stick.style.transform=`translate(${dx}px,${dy}px)`;
  state.moveX=dx/max;state.moveZ=dy/max;
}
joy.addEventListener("pointerdown",e=>{joyId=e.pointerId;joy.setPointerCapture(joyId);joyMove(e)});
joy.addEventListener("pointermove",e=>{if(e.pointerId===joyId)joyMove(e)});
function joyEnd(e){if(e.pointerId!==joyId)return;joyId=null;state.moveX=0;state.moveZ=0;stick.style.transform="translate(0,0)"}
joy.addEventListener("pointerup",joyEnd);joy.addEventListener("pointercancel",joyEnd);

// Desktop fallback
const keys={};
addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="Space")jump();if(e.code==="KeyE")enterBuilding()});
addEventListener("keyup",e=>keys[e.code]=false);

function update(dt){
  let mx=state.moveX,mz=state.moveZ;
  if(keys.KeyA||keys.ArrowLeft)mx=-1;
  if(keys.KeyD||keys.ArrowRight)mx=1;
  if(keys.KeyW||keys.ArrowUp)mz=-1;
  if(keys.KeyS||keys.ArrowDown)mz=1;

  const dir=new THREE.Vector3(mx,0,mz);
  if(dir.lengthSq()>1)dir.normalize();
  const speed=state.inside?4.5:state.speed;
  player.position.x+=dir.x*speed*dt;
  player.position.z+=dir.z*speed*dt;

  if(!state.inside){
    player.position.x=THREE.MathUtils.clamp(player.position.x,-155,155);
    player.position.z=THREE.MathUtils.clamp(player.position.z,-155,155);
    state.vy-=20*dt;player.position.y+=state.vy*dt;
    if(player.position.y<=0){player.position.y=0;state.vy=0;state.onGround=true}
  }

  if(dir.lengthSq()>0.01){
    const target=Math.atan2(dir.x,dir.z);
    player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,target,.18);
  }

  const target=new THREE.Vector3(player.position.x,player.position.y+1.1,player.position.z);
  const camOffset=new THREE.Vector3(0,5.8,9.2);
  camOffset.applyAxisAngle(new THREE.Vector3(0,1,0),player.rotation.y);
  camera.position.lerp(target.clone().add(camOffset),1-Math.pow(.001,dt));
  camera.lookAt(target);

  document.querySelector("#interact").style.display=(!state.inside&&nearEntrance())||state.inside?"block":"none";
  document.querySelector("#interact").textContent=state.inside?"EXIT BUILDING":"ENTER BUILDING";
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  update(dt);
  renderer.render(scene,camera);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setTimeout(()=>{document.querySelector("#loading").style.opacity="0";setTimeout(()=>document.querySelector("#loading").remove(),500)},700);
setMessage("Explore the city • Find the yellow CLOTHES building");
animate();