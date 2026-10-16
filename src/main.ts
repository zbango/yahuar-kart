import * as THREE from 'three';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `<div id="hud"><strong>🏁 YAHUAR KART</strong><span id="laps">Vuelta 1 / 3</span><span id="time">00:00.0</span><span id="speed">0 km/h</span><button id="reset">Reiniciar (R)</button></div><div id="help">W / ↑ Acelerar · S / ↓ Frenar · A D / ← → Girar · R Reiniciar</div><div id="message"></div>`;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x90d6f4);
scene.fog = new THREE.Fog(0x90d6f4, 110, 240);
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 400);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
app.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x548543, 2));
const sun = new THREE.DirectionalLight(0xfff6da, 2.7);
sun.position.set(-35, 65, 35);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -100; sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100; sun.shadow.camera.bottom = -100;
scene.add(sun);

const mat = (color: number, roughness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat(0x65ac50));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const RX = 48, RZ = 31, HALF_WIDTH = 7;
const roadShape = new THREE.Shape();
roadShape.absellipse(0, 0, RX + HALF_WIDTH, RZ + HALF_WIDTH, 0, Math.PI * 2, false, 0);
const hole = new THREE.Path();
hole.absellipse(0, 0, RX - HALF_WIDTH, RZ - HALF_WIDTH, 0, Math.PI * 2, true, 0);
roadShape.holes.push(hole);
const roadGeo = new THREE.ShapeGeometry(roadShape, 160);
roadGeo.rotateX(-Math.PI / 2);
const road = new THREE.Mesh(roadGeo, mat(0x343943));
road.position.y = 0.035;
road.receiveShadow = true;
scene.add(road);

function trackPoint(theta: number, offset = 0) {
  const x = RX * Math.cos(theta), z = RZ * Math.sin(theta);
  const nx = Math.cos(theta) / RX, nz = Math.sin(theta) / RZ;
  const n = Math.hypot(nx, nz);
  return new THREE.Vector3(x + offset * nx / n, 0, z + offset * nz / n);
}
function addBox(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
for (let i = 0; i < 100; i++) {
  const a = i * Math.PI * 2 / 100;
  if (i % 2 === 0) {
    const p = trackPoint(a);
    const stripe = addBox(2.5, .035, .28, mat(0xf5e7bd), p.x, .07, p.z);
    stripe.rotation.y = -Math.atan2(RZ * Math.cos(a), -RX * Math.sin(a));
  }
  for (const side of [-1, 1]) {
    const p = trackPoint(a, side * 7.3);
    const block = addBox(3.5, .55, .65, mat(i % 2 ? 0xffffff : 0xe95145), p.x, .31, p.z);
    block.rotation.y = -Math.atan2(RZ * Math.cos(a), -RX * Math.sin(a));
  }
}
for (let j = -6; j < 7; j++) {
  const p = trackPoint(0, j);
  addBox(.8, .055, 1.0, mat(j % 2 ? 0xffffff : 0x161616), p.x, .09, p.z);
}
const trunkMat = mat(0x81542d), leafMat = mat(0x267c43);
for (let i = 0; i < 65; i++) {
  const a = i * 2.39996;
  const r = 65 + (i % 7) * 6;
  const x = Math.cos(a) * r * 1.2, z = Math.sin(a) * r;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.4, .55, 3.8, 7), trunkMat);
  trunk.position.set(x, 1.9, z); trunk.castShadow = true; scene.add(trunk);
  const crown = new THREE.Mesh(new THREE.ConeGeometry(2.5 + (i % 3) * .35, 7, 8), leafMat);
  crown.position.set(x, 6.3, z); crown.castShadow = true; scene.add(crown);
}

const kart = new THREE.Group();
scene.add(kart);
const red = mat(0xe9423c, .4), dark = mat(0x1c2430), yellow = mat(0xffd450), metal = mat(0xb8c5d0, .35);
addBox(2.3, .5, 3.4, red, 0, .78, 0, kart);
addBox(1.75, .65, 1.4, red, 0, 1.13, .65, kart);
addBox(1.85, .18, .7, yellow, 0, 1.05, -1.55, kart);
addBox(2.5, .2, .55, dark, 0, .64, 1.85, kart);
addBox(1.35, .18, .4, metal, 0, 1.35, -.45, kart);
const driver = new THREE.Mesh(new THREE.SphereGeometry(.55, 16, 12), mat(0xffd9a3));
driver.position.set(0, 1.85, .4); driver.castShadow = true; kart.add(driver);
const helmet = new THREE.Mesh(new THREE.SphereGeometry(.58, 16, 12, 0, Math.PI * 2, 0, Math.PI * .58), yellow);
helmet.position.set(0, 1.92, .4); kart.add(helmet);
const wheels: THREE.Mesh[] = [];
for (const x of [-1.35, 1.35]) for (const z of [-1.12, 1.15]) {
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.53, .53, .42, 16), dark);
  wheel.rotation.z = Math.PI / 2;
  wheel.position.set(x, .55, z);
  wheel.castShadow = true;
  kart.add(wheel);
  wheels.push(wheel);
}
const keys = new Set<string>();
const handled = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'r', ' ']);
window.addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (handled.has(k)) e.preventDefault(); keys.add(k); if (k === 'r') reset(); });
window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
const down = (...names: string[]) => names.some(n => keys.has(n));

let angle = 0, speed = 0, elapsed = 0, lap = 1, progress = 0, finished = false;
const maxSpeed = 29, maxReverse = -10;
const lapEl = document.querySelector('#laps')!, timeEl = document.querySelector('#time')!, speedEl = document.querySelector('#speed')!, msgEl = document.querySelector('#message')!;
function reset() {
  kart.position.set(RX, .02, -5);
  angle = Math.PI / 2; speed = 0; elapsed = 0; lap = 1; progress = 0; finished = false;
  msgEl.textContent = '';
  camera.position.set(RX - 9, 6, -5);
}
document.querySelector('#reset')!.addEventListener('click', reset);
reset();
const clock = new THREE.Clock();
const cameraTarget = new THREE.Vector3();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .05);
  if (!finished) {
    elapsed += dt;
    const forward = down('w', 'arrowup'), backward = down('s', 'arrowdown');
    if (forward) speed += 19 * dt;
    if (backward) speed -= (speed > 0 ? 27 : 12) * dt;
    if (!forward && !backward) speed *= Math.exp(-1.35 * dt);
    speed = THREE.MathUtils.clamp(speed, maxReverse, maxSpeed);
    if (Math.abs(speed) < .035) speed = 0;
    const steering = Number(down('d', 'arrowright')) - Number(down('a', 'arrowleft'));
    angle += steering * Math.min(Math.abs(speed) / 9, 1) * 1.85 * dt * Math.sign(speed);
    const prev = kart.position.clone();
    kart.position.x += Math.cos(angle) * speed * dt;
    kart.position.z += Math.sin(angle) * speed * dt;
    const norm = Math.hypot(kart.position.x / RX, kart.position.z / RZ);
    const trackDistance = Math.abs(norm - 1) * Math.min(RX, RZ);
    if (trackDistance > HALF_WIDTH - 1.2) speed *= Math.exp(-3 * dt);
    if (trackDistance > HALF_WIDTH + 1.5) { kart.position.copy(prev); speed *= -.22; }
    const theta = (Math.atan2(kart.position.z / RZ, kart.position.x / RX) + Math.PI * 2) % (Math.PI * 2);
    if (theta > .4 && theta < Math.PI * 2 - .4) progress = Math.max(progress, theta);
    if (progress > Math.PI * 1.8 && theta < .15 && kart.position.z >= -1 && speed > 0) {
      lap++; progress = 0;
      if (lap > 3) { finished = true; speed = 0; msgEl.textContent = `🏆 ¡Carrera completada en ${elapsed.toFixed(1)} s! Pulsa R para repetir.`; }
    }
  }
  kart.rotation.y = Math.PI / 2 - angle;
  for (const wheel of wheels) wheel.rotation.x -= speed * dt / .53;
  const behind = new THREE.Vector3(-Math.cos(angle) * 10, 6.5, -Math.sin(angle) * 10);
  const desired = kart.position.clone().add(behind);
  camera.position.lerp(desired, 1 - Math.exp(-4 * dt));
  cameraTarget.copy(kart.position).add(new THREE.Vector3(Math.cos(angle) * 6, 1.3, Math.sin(angle) * 6));
  camera.lookAt(cameraTarget);
  lapEl.textContent = `Vuelta ${Math.min(lap, 3)} / 3`;
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toFixed(1).padStart(4, '0');
  timeEl.textContent = `${minutes}:${seconds}`;
  speedEl.textContent = `${Math.round(Math.abs(speed) * 3.6)} km/h`;
  renderer.render(scene, camera);
}
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
frame();
