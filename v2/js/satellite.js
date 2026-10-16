// Cena 3D do FCP-01. A malha vem do CAD da equipe (SolidWorks), convertida para GLB.
import * as THREE from 'three';
import { GLTFLoader } from '../../vendor/addons/GLTFLoader.js';
import { MeshoptDecoder } from '../../vendor/addons/meshopt_decoder.module.js';
import { RoomEnvironment } from '../../vendor/addons/RoomEnvironment.js';

// Grupos do modelo, na ordem em que a página apresenta cada subsistema.
export const CHAPTERS = [
  { id: 'inteiro',   focus: null },
  { id: 'estrutura', focus: ['estrutura_no', 'estrutura_ls', 'tampa_sup', 'tampa_inf', 'fixacao'] },
  { id: 'atitude',   focus: ['adcs'] },
  { id: 'energia',   focus: ['eps_reg', 'eps_ger'] },
  { id: 'bordo',     focus: ['obc'] },
  { id: 'payload',   focus: ['payload'] },
];

// Abertura de cada peça para cada capítulo (em metros, eixo Y para cima).
const OPEN = {
  //            inteiro  estrut.  atitude  energia  bordo   payload
  estrutura_no: [0,      1,       1,       1,       1,      1],
  estrutura_ls: [0,      1,       1,       1,       1,      1],
  tampa_sup:    [0,      0.6,     1,       1,       1,      1],
  stack:        [0,      0,       0.35,    1,       1,      1],
};

// Cores em sRGB por material: [cor, metalicidade, rugosidade]
const LOOK = {
  alu: [0x9da7b2, 0.85, 0.36], steel: [0x7d838b, 0.9, 0.3], pcb: [0x173f28, 0.05, 0.55], pcb2: [0x1b4d2e, 0.05, 0.55],
  pcbblue: [0x1d3f86, 0.05, 0.5], bluemod: [0x2350a0, 0.05, 0.5], green: [0x2d7d41, 0, 0.6], cap: [0xb3bac3, 0.8, 0.3],
  dark: [0x15171b, 0.2, 0.6], motor: [0x7c838c, 0.85, 0.32], wheelmat: [0xc0c8d2, 0.95, 0.22], cell: [0x2a5aa8, 0.25, 0.4], rtl: [0x2b2f36, 0.7, 0.4],
};

const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

export async function createSatellite(canvas, { url, interactive = true, onReady, autoLoop = true, hero = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.75;

  const key = new THREE.DirectionalLight(0xdfe9ff, 2.2); key.position.set(0.6, 1.2, 0.9); scene.add(key);
  const rim = new THREE.DirectionalLight(0x699ddb, 2.6); rim.position.set(-1.2, 0.4, -0.8); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xbfd4f2, 0x050d1a, 0.6));

  const camera = new THREE.PerspectiveCamera(26, 1, 0.01, 10);
  const pivot = new THREE.Group(); scene.add(pivot);

  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  const root = gltf.scene;
  root.position.set(0, -0.0985, 0); // centro da estrutura na origem
  pivot.add(root);

  // Agrupa os nós por subsistema (nome do nó: grupo__material).
  const groups = {}; const base = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.name.split('__')[0];
    (groups[g] ||= []).push(o);
    base.set(o, o.position.clone());
    const look = LOOK[o.name.split('__')[1]] || [0x888888, 0.2, 0.5];
    o.material = new THREE.MeshStandardMaterial({ color: look[0], metalness: look[1], roughness: look[2], side: THREE.DoubleSide });
    o.material.userData.color = o.material.color.clone();
  });

  // Estado animado
  const state = { chapter: 0, from: 0, to: 0, k: 1, yaw: 0.65, pitch: 0.32, userYaw: 0, userPitch: 0, spin: 0, auto: true, dim: {} };
  let target = 0; // capítulo contínuo, ex. 2.4

  const wheel = groups.adcs?.find((m) => m.name.includes('wheelmat'));
  const wheelCenter = new THREE.Vector3(0, 0.0253, 0);

  function layout(c) {
    // c: posição contínua entre capítulos
    const i = Math.floor(c), f = smooth(Math.min(1, Math.max(0, c - i)));
    const j = Math.min(i + 1, CHAPTERS.length - 1);
    const val = (row) => lerp(OPEN[row][i] ?? 0, OPEN[row][j] ?? 0, f);
    const open = val('estrutura_no'), lid = val('tampa_sup'), stack = val('stack');
    const d = 0.055 * open;
    const set = (g, x, y, z) => groups[g]?.forEach((m) => m.position.set(base.get(m).x + x, base.get(m).y + y, base.get(m).z + z));
    set('estrutura_no', -d, 0, -d);
    set('estrutura_ls', d, 0, d);
    set('tampa_sup', 0, 0.07 * lid, 0);
    set('tampa_inf', 0, -0.02 * stack, 0);
    set('fixacao', 0, 0, 0);
    set('adcs', 0, -0.02 * stack, 0);
    set('eps_reg', 0, 0.0 * stack, 0);
    set('obc', 0, 0.035 * stack, 0);
    set('eps_ger', 0, 0.07 * stack, 0);
    set('payload', 0, 0.105 * stack, 0);
    groups.fixacao?.forEach((m) => { m.visible = open < 0.5; });

    // Destaque do capítulo
    const fa = CHAPTERS[i].focus, fb = CHAPTERS[j].focus;
    for (const [g, ms] of Object.entries(groups)) {
      const inA = !fa || fa.some((x) => g.startsWith(x)), inB = !fb || fb.some((x) => g.startsWith(x));
      const lit = lerp(inA ? 1 : 0, inB ? 1 : 0, f);
      for (const m of ms) {
        const mat = m.material;
        mat.transparent = lit < 0.999;
        mat.opacity = lerp(0.12, 1, lit);
        mat.depthWrite = lit > 0.5;
        mat.color.copy(mat.userData.color).lerp(new THREE.Color(0x1b2c45), (1 - lit) * 0.6);
      }
    }
  }

  // Interação: arrastar gira o satélite.
  let drag = null;
  if (interactive) {
    canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: state.userYaw, pitch: state.userPitch }; canvas.setPointerCapture(e.pointerId); state.auto = false; canvas.classList.add('is-dragging'); });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      state.userYaw = drag.yaw + (e.clientX - drag.x) * 0.008;
      state.userPitch = Math.max(-0.6, Math.min(0.6, drag.pitch + (e.clientY - drag.y) * 0.005));
    });
    const end = () => { drag = null; canvas.classList.remove('is-dragging'); setTimeout(() => { if (!drag) state.auto = true; }, 2500); };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  }

  let w = 0, h = 0, frame = 0, visible = true, last = performance.now(), cur = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (r.width === w && r.height === h) return;
    w = r.width; h = r.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function render(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    resize();
    cur += (target - cur) * (reduce ? 1 : 1 - Math.exp(-dt * 6));
    layout(cur);
    if (state.auto && !reduce) state.yaw += dt * 0.16;
    if (wheel && !reduce) { state.spin += dt * (Math.abs(cur - 2) < 0.6 ? 7 : 1.2); wheel.rotation.y = state.spin; }
    pivot.rotation.y = state.yaw + state.userYaw;
    pivot.rotation.x = state.userPitch * 0.6;
    const open = Math.min(1, cur);
    const stack = Math.max(0, Math.min(1, cur - 2));
    const tall = camera.aspect < 0.8;
    const dist = hero ? 0.6 * Math.max(1, 0.82 / camera.aspect) : (0.62 + 0.12 * open + 0.1 * stack) * (tall ? 1.55 : 1);
    const ly = hero ? 0.006 : 0.012 + 0.03 * stack - (tall ? 0.045 + 0.02 * open : 0);
    camera.position.set(0, Math.sin(state.pitch) * dist + ly + 0.008, Math.cos(state.pitch) * dist);
    camera.lookAt(0, ly, 0);
    renderer.render(scene, camera);
  }
  function loop(now) { frame = 0; if (!visible) return; render(now); frame = requestAnimationFrame(loop); }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !frame) { last = performance.now(); frame = requestAnimationFrame(loop); } });
  if (autoLoop) { io.observe(canvas); frame = requestAnimationFrame(loop); }
  onReady?.();

  return {
    setChapter(c) { target = c; },
    jump(c) { target = c; cur = c; },
    renderOnce(c, yaw, pitch, dist) { target = cur = c; state.auto = false; state.yaw = yaw; state.pitch = pitch ?? state.pitch; resize(); layout(c); pivot.rotation.y = yaw; const D = dist ?? 0.7; camera.position.set(0, Math.sin(state.pitch) * D, Math.cos(state.pitch) * D); camera.lookAt(0, 0.02, 0); renderer.render(scene, camera); },
    camera, renderer, scene, groups,
  };
}
