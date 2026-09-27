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

// Player — detailed low-poly 3D human character
function humanCharacter(shirtColor=0x1d232b,skin=0xc58f6d){
  const g=new THREE.Group();
  const shirtMat=new THREE.MeshStandardMaterial({color:shirtColor,roughness:.75});
  const skinMat=new THREE.MeshStandardMaterial({color:skin,roughness:.85});
  const pantsMat=new THREE.MeshStandardMaterial({color:0x20252d,roughness:.9});
  const shoeMat=new THREE.MeshStandardMaterial({color:0x111318,roughness:.65});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.85,6,12),shirtMat);
  torso.position.y=1.25;torso.scale.set(.82,1,.48);torso.castShadow=true;g.add(torso);
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.18,10),skinMat);
  neck.position.y=1.88;neck.castShadow=true;g.add(neck);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.43,20,14),skinMat);
  head.position.y=2.25;head.scale.set(.9,1.08,.9);head.castShadow=true;g.add(head);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.44,18,10,0,Math.PI*2,0,Math.PI*.45),new THREE.MeshStandardMaterial({color:0x171411,roughness:1}));
  hair.position.set(0,2.42,0);hair.castShadow=true;g.add(hair);
  for(const sx of [-.3,.3]){
    const arm=new THREE.Mesh(new THREE.CapsuleGeometry(.13,.7,5,8),shirtMat);
    arm.position.set(sx*.98,1.27,0);arm.rotation.z=sx>0?-0.08:0.08;arm.castShadow=true;g.add(arm);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),skinMat);
    hand.position.set(sx*1.02,.82,0);hand.castShadow=true;g.add(hand);
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.15,.78,5,8),pantsMat);
    leg.position.set(sx*.28,.48,0);leg.castShadow=true;g.add(leg);
    const shoe=new THREE.Mesh(new THREE.BoxGeometry(.34,.16,.62),shoeMat);
    shoe.position.set(sx*.28,.08,.12);shoe.castShadow=true;g.add(shoe);
  }
  return g;
}
const player=humanCharacter(0x1d232b);
player.position.set(0,0,25);scene.add(player);

const state={moveX:0,moveZ:0,vy:0,onGround:true,speed:7,inside:false,inCar:false,carSpeed:0};
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
  if(state.inside||state.inCar)return;
  if(state.onGround){state.vy=7.5;state.onGround=false}
}

function makeCar(x,z,rot=0){
  const car=new THREE.Group();
  const paint=new THREE.MeshStandardMaterial({color:0xb31f2d,metalness:.25,roughness:.35});
  const dark=new THREE.MeshStandardMaterial({color:0x11151a,roughness:.3});
  const body=new THREE.Mesh(new THREE.BoxGeometry(2.4,.65,4.4),paint);
  body.position.y=.65;body.castShadow=true;car.add(body);
  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.8,.65,2.2),new THREE.MeshStandardMaterial({color:0x202d38,metalness:.1,roughness:.2,transparent:true,opacity:.9}));
  cabin.position.set(0,1.12,-.15);cabin.castShadow=true;car.add(cabin);
  for(const xw of [-1.25,1.25])for(const zw of [-1.35,1.35]){
    const w=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.22,16),dark);
    w.rotation.z=Math.PI/2;w.position.set(xw,.4,zw);w.castShadow=true;car.add(w);
  }
  car.position.set(x,0,z);car.rotation.y=rot;scene.add(car);
  return car;
}
const car=makeCar(0,12,Math.PI);
let carNear=false;

// NPCs + traffic + simple wanted/police system
const npcs=[];
const traffic=[];
const police=[];
const npcColors=[0x2f6f9f,0x9a4d4d,0x4f8055,0x8a6a3f,0x6d4f86];

function makeNPC(x,z){
  const colors=[0x2f6f9f,0x9a4d4d,0x4f8055,0x8a6a3f,0x6d4f86];
  const npc=humanCharacter(colors[npcs.length%colors.length],npcs.length%2?0xc58f6d:0x8f5f43);
  npc.position.set(x,0,z);scene.add(npc);
  npcs.push({group:npc,dir:new THREE.Vector3(Math.random()-.5,0,Math.random()-.5).normalize(),speed:1.1+Math.random()*.7,turn:1+Math.random()*3});
}

for(let n=0;n<18;n++){
  const x=Math.round((Math.random()*270-135)/15)*15;
  const z=Math.round((Math.random()*270-135)/15)*15;
  makeNPC(x+((n%2)*3-1.5),z+((n%3)*3-3));
}

function makeTrafficCar(x,z,rot,color){
  const c=makeCar(x,z,rot);
  c.children[0].material=new THREE.MeshStandardMaterial({color,metalness:.2,roughness:.4});
  return c;
}
for(let n=0;n<6;n++){
  const horizontal=n%2===0;
  const lane=(Math.floor(n/2)*30)-60;
  const c=makeTrafficCar(horizontal?-145:lane,horizontal?lane:-145,horizontal?0:Math.PI/2,[0x315f9a,0x2f7d4a,0xc07b2a,0x8d3b66,0x777777,0x3d6b73][n]);
  traffic.push({group:c,horizontal,speed:5+n%3});
}

function makePolice(x,z){
  const p=makeTrafficCar(x,z,0,0x202a45);
  const light=new THREE.Mesh(new THREE.BoxGeometry(1.2,.18,.5),new THREE.MeshStandardMaterial({color:0x3d8cff,emissive:0x174cff,emissiveIntensity:1.5}));
  light.position.y=1.55;light.castShadow=true;p.add(light);
  scene.add(p);police.push(p);return p;
}
function spawnPolice(){
  if(police.length>=3)return;
  for(let n=police.length;n<Math.min(3,wanted);n++){
    const a=Math.random()*Math.PI*2,d=22+Math.random()*12;
    makePolice(car.position.x+Math.cos(a)*d,car.position.z+Math.sin(a)*d);
  }
}

let wanted=0,wantedTimer=0;

// Missions, shops, hospital, gym and player stats
const missions=[
  {name:"FIRST RIDE",target:car,done:false,reward:500,description:"Get into your car."},
  {name:"CITY RUN",done:false,reward:750,description:"Drive to the yellow clothes store."}
];
let activeMission=0;
let health=100,money=2500;
function syncStats(){
  document.querySelector("#health").textContent=Math.max(0,Math.round(health));
  document.querySelector("#money").textContent=Math.round(money);
}
function missionMessage(){
  const m=missions[activeMission];
  if(!m){setMessage("All prototype missions complete!");return}
  setMessage("MISSION: "+m.name+" • "+m.description);
}
function completeMission(){
  const m=missions[activeMission];
  if(!m||m.done)return;
  m.done=true;money+=m.reward;syncStats();
  setMessage("MISSION COMPLETE • +$"+m.reward);
  activeMission++;
  setTimeout(missionMessage,1200);
}
function resetPlayer(){
  state.inCar=false;player.visible=true;car.position.set(0,12,Math.PI);car.rotation.y=Math.PI;
  player.position.set(0,0,25);health=100;wanted=0;wantedTimer=0;
  document.querySelector("#wanted").textContent="";syncStats();setMessage("Hospital: recovered");
}
function checkWorldLocations(){
  if(state.inCar && !missions[0].done) completeMission();
  if(!missions[1].done && car.position.distanceTo(new THREE.Vector3(0,0,-25))<9) completeMission();
  const dShop=Math.hypot(player.position.x,player.position.z+55);
  if(!state.inCar && dShop<7) setMessage("GYM • Training area nearby");
  if(!state.inCar && Math.hypot(player.position.x-45,player.position.z)<8) setMessage("HOSPITAL • Press interact");
}

function addWanted(level=1){
  wanted=Math.min(3,wanted+level);wantedTimer=18;spawnPolice();
  setMessage("WANTED • Police are searching");
  document.querySelector("#wanted").textContent="⭐".repeat(wanted);
}
function updateNPCs(dt){
  for(const p of npcs){
    p.turn-=dt;
    if(p.turn<=0){p.turn=1+Math.random()*3;p.dir.set(Math.random()-.5,0,Math.random()-.5).normalize()}
    p.group.position.addScaledVector(p.dir,p.speed*dt);
    if(Math.abs(p.group.position.x)>150||Math.abs(p.group.position.z)>150)p.dir.multiplyScalar(-1);
    p.group.position.x=THREE.MathUtils.clamp(p.group.position.x,-150,150);
    p.group.position.z=THREE.MathUtils.clamp(p.group.position.z,-150,150);
  }
  for(const t of traffic){
    const s=t.speed*dt;
    if(t.horizontal){t.group.position.x+=s;if(t.group.position.x>155)t.group.position.x=-155}
    else{t.group.position.z+=s;if(t.group.position.z>155)t.group.position.z=-155}
  }
  if(state.inCar){
    for(const p of npcs){
      if(p.group.position.distanceTo(car.position)<2.1){
        p.group.position.x+=car.position.x-p.group.position.x;
        p.group.position.z+=car.position.z-p.group.position.z;
        addWanted(1);
      }
    }
  }
  if(wanted>0){
    wantedTimer-=dt;
    spawnPolice();
    for(const p of police){
      const dx=car.position.x-p.position.x,dz=car.position.z-p.position.z;
      const len=Math.hypot(dx,dz)||1;
      p.position.x+=dx/len*(5.5+wanted)*dt;
      p.position.z+=dz/len*(5.5+wanted)*dt;
      p.rotation.y=Math.atan2(dx,dz);
      if(len<3.2){
        state.carSpeed*=.92;
        health=Math.max(0,health-8*dt);
        setMessage("POLICE • Lose them!");
        if(health<=0)resetPlayer();
      }
    }
    if(wantedTimer<=0 && police.every(p=>p.position.distanceTo(car.position)>28)){
      wanted=0;document.querySelector("#wanted").textContent="";setMessage("Wanted level cleared");
    }
  }
}

function toggleCar(){
  const dx=player.position.x-car.position.x,dz=player.position.z-car.position.z;
  if(!state.inCar && Math.hypot(dx,dz)<4){
    state.inCar=true;state.inside=false;
    player.visible=false;carNear=false;
    setMessage("DRIVING • Use joystick to drive");
  }else if(state.inCar){
    state.inCar=false;player.visible=true;
    player.position.set(car.position.x+2.5,0,car.position.z);
    setMessage("On foot");
  }
}
document.querySelector("#jump").addEventListener("pointerdown",e=>{e.preventDefault();jump()});
document.querySelector("#interactBtn").addEventListener("pointerdown",e=>{e.preventDefault();if(state.inCar||Math.hypot(player.position.x-car.position.x,player.position.z-car.position.z)<4)toggleCar();else enterBuilding()});

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
addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="Space")jump();if(e.code==="KeyE"){if(state.inCar||Math.hypot(player.position.x-car.position.x,player.position.z-car.position.z)<4)toggleCar();else enterBuilding()}});
addEventListener("keyup",e=>keys[e.code]=false);

function update(dt){
  updateNPCs(dt);
  checkWorldLocations();
  syncStats();
  let mx=state.moveX,mz=state.moveZ;
  if(keys.KeyA||keys.ArrowLeft)mx=-1;
  if(keys.KeyD||keys.ArrowRight)mx=1;
  if(keys.KeyW||keys.ArrowUp)mz=-1;
  if(keys.KeyS||keys.ArrowDown)mz=1;

  const dir=new THREE.Vector3(mx,0,mz);
  if(dir.lengthSq()>1)dir.normalize();
  if(state.inCar){
    const steer=dir.x;
    const throttle=-dir.z;
    state.carSpeed=THREE.MathUtils.lerp(state.carSpeed,throttle*13,.08);
    car.rotation.y-=steer*state.carSpeed*dt*.075;
    const forward=new THREE.Vector3(Math.sin(car.rotation.y),0,Math.cos(car.rotation.y));
    car.position.addScaledVector(forward,state.carSpeed*dt);
    car.position.x=THREE.MathUtils.clamp(car.position.x,-155,155);
    car.position.z=THREE.MathUtils.clamp(car.position.z,-155,155);
  }else{
    const speed=state.inside?4.5:state.speed;
    player.position.x+=dir.x*speed*dt;
    player.position.z+=dir.z*speed*dt;
  }

  if(!state.inside && !state.inCar){
    player.position.x=THREE.MathUtils.clamp(player.position.x,-155,155);
    player.position.z=THREE.MathUtils.clamp(player.position.z,-155,155);
    state.vy-=20*dt;player.position.y+=state.vy*dt;
    if(player.position.y<=0){player.position.y=0;state.vy=0;state.onGround=true}
  }
  if(state.inCar){
    const target=new THREE.Vector3(car.position.x,1.2,car.position.z);
    const camOffset=new THREE.Vector3(0,5.8,9.8).applyAxisAngle(new THREE.Vector3(0,1,0),car.rotation.y);
    camera.position.lerp(target.clone().add(camOffset),1-Math.pow(.001,dt));
    camera.lookAt(target);
  }

  if(dir.lengthSq()>0.01){
    const target=Math.atan2(dir.x,dir.z);
    player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,target,.18);
  }

  if(state.inCar){
    document.querySelector("#interact").style.display="block";
    document.querySelector("#interact").textContent="EXIT CAR";
    return;
  }
  const target=new THREE.Vector3(player.position.x,player.position.y+1.1,player.position.z);
  const camOffset=new THREE.Vector3(0,5.8,9.2);
  camOffset.applyAxisAngle(new THREE.Vector3(0,1,0),player.rotation.y);
  camera.position.lerp(target.clone().add(camOffset),1-Math.pow(.001,dt));
  camera.lookAt(target);

  const dcar=Math.hypot(player.position.x-car.position.x,player.position.z-car.position.z);
  if(dcar<4 && !state.inCar){
    document.querySelector("#interact").style.display="block";
    document.querySelector("#interact").textContent="ENTER CAR";
  }else{
    document.querySelector("#interact").style.display=(!state.inside&&nearEntrance())||state.inside?"block":"none";
    document.querySelector("#interact").textContent=state.inside?"EXIT BUILDING":"ENTER BUILDING";
  }
}

function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  update(dt);
  renderer.render(scene,camera);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setTimeout(()=>{document.querySelector("#loading").style.opacity="0";setTimeout(()=>document.querySelector("#loading").remove(),500)},700);
syncStats();
missionMessage();
animate();