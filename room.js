// 남보석 포트폴리오 — 서버룸 책상 3D 입구. 콘텐츠는 data.js, 픽셀 게임은 game.html(CRT 안 iframe).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const D = window.DATA;
const $ = (id) => document.getElementById(id);
const isMobile = matchMedia('(max-width: 720px)').matches || /Mobi|Android/i.test(navigator.userAgent);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const UI = {
  ko: {
    sub: 'Backend Developer · Java / Spring',
    hint: '모니터를 클릭하면 들어갑니다 · 책상 위 물건을 눌러 보세요',
    back: '← 방으로 (Esc)', lang: 'EN', soundOn: '🔊 SOUND', soundOff: '🔇 SOUND',
    hs: { monitor: '모니터 — 클릭해서 들어가기', books: '책 — 경력', floppy: '플로피 — 스킬', note1: '메모 — 소개', note2: '메모 — 연락처', notepad: '메모장 — 사이드 프로젝트', plant: '화분', mug: '커피', rack: '서버 랙', clock: '벽시계', plate: '명패', lamp: '스탠드', pdf: 'PDF 포트폴리오', chair: '의자', keyboard: '키보드' },
    toast: { plant: '🌱 이 화분은 유휴 상태가 아닙니다 (CPU 5% 이상)', mug: '☕ 커피 1잔 = 배치 1회 모니터링', rack: (n) => `💤 유휴 서버 ${n}대 반납 처리됨 · 담당자 알림 → 조직장 결재 → 반납`, clock: (t) => `🕒 ${t} · 면접 시간은 10분 전 도착`, lamp: '💡 야근 조명 ON', chair: '🪑 앉아서 보셔도 됩니다', keyboard: '⌨️ Vim 키맵 아님', sound: '🔊 서버룸 소음 ON', mute: '🔇 소음 OFF' },
    cards: { about: '소개', career: '경력', skills: '보유 스킬', contact: '연락처', side: '사이드 프로젝트', summary: '요약', edu: '학력 · 자격', ach: '업적', pdfKo: 'PDF 포트폴리오 (국문)', pdfEn: 'PDF Portfolio (English)', game: '▶ 픽셀 게임으로 보기' },
  },
  en: {
    sub: 'Backend Developer · Java / Spring',
    hint: 'Click the monitor to enter · Try the things on the desk',
    back: '← Back to room (Esc)', lang: '한국어', soundOn: '🔊 SOUND', soundOff: '🔇 SOUND',
    hs: { monitor: 'Monitor — click to enter', books: 'Books — career', floppy: 'Floppies — skills', note1: 'Note — about', note2: 'Note — contact', notepad: 'Notepad — side projects', plant: 'Plant', mug: 'Coffee', rack: 'Server rack', clock: 'Wall clock', plate: 'Name plate', lamp: 'Desk lamp', pdf: 'PDF portfolio', chair: 'Chair', keyboard: 'Keyboard' },
    toast: { plant: '🌱 This plant is not idle (CPU > 5%)', mug: '☕ One coffee = one batch run watched', rack: (n) => `💤 ${n} idle servers reclaimed · owner alert → org-lead approval → return`, clock: (t) => `🕒 ${t} · arrive 10 minutes early`, lamp: '💡 Late-night light ON', chair: '🪑 Feel free to sit', keyboard: '⌨️ Not a Vim keymap', sound: '🔊 Server-room hum ON', mute: '🔇 Hum OFF' },
    cards: { about: 'About', career: 'Career', skills: 'Skills', contact: 'Contact', side: 'Side projects', summary: 'Summary', edu: 'Education · Certifications', ach: 'Achievements', pdfKo: 'PDF 포트폴리오 (국문)', pdfEn: 'PDF Portfolio (English)', game: '▶ Play the pixel version' },
  },
};
let lang = localStorage.getItem('lang') || (navigator.language.startsWith('ko') ? 'ko' : 'en');
const T = () => UI[lang];

// ---------------------------------------------------------------- 렌더러 / 장면
const root = $('room');
const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070e);
scene.fog = new THREE.FogExp2(0x05070e, 0.055);

const camera = new THREE.PerspectiveCamera(isMobile ? 55 : 42, innerWidth / innerHeight, 0.05, 40);
const CAM_HOME = { pos: new THREE.Vector3(0.18, isMobile ? 1.25 : 1.36, isMobile ? 2.75 : 2.55), look: new THREE.Vector3(0, isMobile ? 0.92 : 0.98, -0.3), fov: camera.fov };
camera.position.copy(CAM_HOME.pos);
camera.lookAt(CAM_HOME.look);

// ---------------------------------------------------------------- 재질 / 텍스처 도우미
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05, ...o });
const rbox = (w, h, d, r = 0.01, s = 3) => new RoundedBoxGeometry(w, h, d, s, r);
const add = (parent, geo, m, x = 0, y = 0, z = 0, opt = {}) => {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  mesh.castShadow = opt.cast ?? true; mesh.receiveShadow = opt.receive ?? true;
  if (opt.rot) mesh.rotation.set(...opt.rot);
  parent.add(mesh); return mesh;
};
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function labelTex(text, { bg = '#fff6a8', fg = '#1c1f26', font = 'bold 44px "Noto Sans KR", sans-serif', w = 256, h = 256, lines } = {}) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
    const ls = lines || [text]; const lh = parseInt(font.match(/(\d+)px/)[1]) * 1.2;
    ls.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (ls.length - 1) / 2) * lh));
  });
}

// ---------------------------------------------------------------- 조명
scene.add(new THREE.HemisphereLight(0x25407a, 0x06070c, 0.55));
const key = new THREE.DirectionalLight(0x8fb4ff, 0.55);
key.position.set(-2.2, 3.4, 1.6); key.castShadow = !isMobile;
key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -3; key.shadow.camera.right = 3; key.shadow.camera.top = 3; key.shadow.camera.bottom = -2; key.shadow.camera.far = 10; key.shadow.bias = -0.0005;
scene.add(key);
const lampLight = new THREE.PointLight(0xffb36b, 3.2, 3.5, 2); lampLight.position.set(-0.68, 1.22, -0.12); lampLight.castShadow = !isMobile; lampLight.shadow.bias = -0.002; scene.add(lampLight);
const screenLight = new THREE.PointLight(0x7fe7ff, 0.9, 1.8, 2); screenLight.position.set(0, 1.05, 0.25); scene.add(screenLight);
const rackLight = new THREE.PointLight(0x2f6bff, 6, 6, 2); rackLight.position.set(0.6, 1.6, -1.55); scene.add(rackLight);
const ceilLight = new THREE.PointLight(0xbfe0ff, 3.5, 8, 2); ceilLight.position.set(0, 2.75, -0.4); scene.add(ceilLight);

// ---------------------------------------------------------------- 방
const room = new THREE.Group(); scene.add(room);
const floorTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#10141f'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
    const v = 14 + Math.random() * 6; g.fillStyle = `rgb(${v},${v + 3},${v + 10})`; g.fillRect(x * 256 + 3, y * 256 + 3, 250, 250);
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; g.fillRect(x * 256 + 3 + Math.random() * 250, y * 256 + 3 + Math.random() * 250, 2, 2); }
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(7, 7);
add(room, new THREE.PlaneGeometry(14, 14), mat(0xffffff, { map: floorTex, roughness: 0.42, metalness: 0.25 }), 0, 0, 0, { rot: [-Math.PI / 2, 0, 0], cast: false });
const wallMat = mat(0x0c1120, { roughness: 0.95 });
add(room, new THREE.PlaneGeometry(14, 3.2), wallMat, 0, 1.6, -2.65, { cast: false });                       // 뒷벽
add(room, new THREE.PlaneGeometry(8, 3.2), wallMat, -4.2, 1.6, 0, { rot: [0, Math.PI / 2, 0], cast: false }); // 왼벽
add(room, new THREE.PlaneGeometry(8, 3.2), wallMat, 4.2, 1.6, 0, { rot: [0, -Math.PI / 2, 0], cast: false }); // 오른벽
add(room, new THREE.PlaneGeometry(14, 14), mat(0x070a14), 0, 3.2, 0, { rot: [Math.PI / 2, 0, 0], cast: false }); // 천장
// 천장 조명 바
for (const x of [-1.4, 1.4]) add(room, new THREE.BoxGeometry(0.12, 0.04, 3.2), new THREE.MeshStandardMaterial({ color: 0xcfe6ff, emissive: 0xbfe0ff, emissiveIntensity: 0.9 }), x, 3.15, -0.6, { cast: false });
// 케이블 트레이
add(room, new THREE.BoxGeometry(6, 0.06, 0.35), mat(0x2a2f3c, { metalness: 0.7, roughness: 0.4 }), 0, 2.45, -2.1);
for (let i = 0; i < 6; i++) add(room, new THREE.CylinderGeometry(0.012, 0.012, 6, 6), mat([0x2f6bff, 0xff8c42, 0xffd43b, 0x2f6bff, 0x9aa0ad, 0xff8c42][i]), 0, 2.49, -2.22 + i * 0.045, { rot: [0, 0, Math.PI / 2], cast: false });

// ---------------------------------------------------------------- 서버 랙
const racks = new THREE.Group(); room.add(racks);
const LED_COLORS = [new THREE.Color(0x39ff6a), new THREE.Color(0x39ff6a), new THREE.Color(0x39ff6a), new THREE.Color(0xffb020), new THREE.Color(0x4fa3ff)];
const ledGeo = new THREE.BoxGeometry(0.016, 0.016, 0.01);
const ledMat = new THREE.MeshBasicMaterial({ toneMapped: false });
const RACK_N = 7, UNIT_N = 15, LED_PER = 3;
const leds = new THREE.InstancedMesh(ledGeo, ledMat, RACK_N * UNIT_N * LED_PER);
const ledState = [];
const rackFrameMat = mat(0x1a1e29, { metalness: 0.65, roughness: 0.45 });
const unitMats = [mat(0x252a3a, { metalness: 0.5, roughness: 0.55 }), mat(0x2b3042, { metalness: 0.5, roughness: 0.5 }), mat(0x1f2433, { metalness: 0.55, roughness: 0.6 })];
const grilleTex = canvasTex(128, 32, (g, w, h) => { g.fillStyle = '#141826'; g.fillRect(0, 0, w, h); g.fillStyle = '#0a0d16'; for (let x = 4; x < w; x += 8) for (let y = 4; y < h; y += 8) g.fillRect(x, y, 4, 4); });
const grilleMat = mat(0xffffff, { map: grilleTex, metalness: 0.4, roughness: 0.7 });
let li = 0; const m4 = new THREE.Matrix4();
for (let r = 0; r < RACK_N; r++) {
  const rx = (r - (RACK_N - 1) / 2) * 0.74, rz = -2.0;
  const g = new THREE.Group(); g.position.set(rx, 0, rz); racks.add(g);
  add(g, new THREE.BoxGeometry(0.62, 2.15, 0.9), rackFrameMat, 0, 1.075, 0);
  add(g, new THREE.BoxGeometry(0.66, 0.05, 0.94), rackFrameMat, 0, 2.17, 0);
  for (let u = 0; u < UNIT_N; u++) {
    const uy = 0.14 + u * 0.133, type = (r * 7 + u * 3) % 5;
    const um = type === 4 ? grilleMat : unitMats[type % 3];
    add(g, new THREE.BoxGeometry(0.56, 0.115, 0.05), um, 0, uy, 0.47);
    if (type === 4) continue;
    for (let k = 0; k < LED_PER; k++) {
      const col = LED_COLORS[(r + u + k) % LED_COLORS.length];
      m4.makeTranslation(rx - 0.2 + k * 0.03, uy + 0.03, rz + 0.497);
      leds.setMatrixAt(li, m4); leds.setColorAt(li, col);
      ledState.push({ col, rate: 0.4 + Math.random() * 2.5, phase: Math.random() * 10, i: li });
      li++;
    }
  }
  // 랙 사이 케이블
  if (r < RACK_N - 1) add(g, new THREE.CylinderGeometry(0.02, 0.02, 2.0, 6), mat([0x2f6bff, 0xff8c42][r % 2]), 0.37, 1.2, 0.3, { cast: false });
}
leds.count = li; leds.instanceMatrix.needsUpdate = true; leds.instanceColor.needsUpdate = true;
room.add(leds);
// 벽 표지판
add(room, new THREE.PlaneGeometry(0.9, 0.22), new THREE.MeshBasicMaterial({ map: labelTex('SERVER ROOM  A-01', { bg: '#0b0f1c', fg: '#ff4d4d', font: 'bold 54px "IBM Plex Mono", monospace', w: 512, h: 128 }), toneMapped: false }), -2.3, 2.75, -2.63);
const clockTex = canvasTex(256, 256, drawClock);
const clockMesh = add(room, new THREE.CylinderGeometry(0.19, 0.19, 0.03, 40), new THREE.MeshBasicMaterial({ map: clockTex }), 1.9, 2.72, -2.6, { rot: [Math.PI / 2, 0, 0] });
function drawClock(g, w, h) {
  const now = new Date();
  g.clearRect(0, 0, w, h); g.fillStyle = '#f4f1e8'; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#1c1f26'; g.lineWidth = 8; g.stroke();
  g.fillStyle = '#1c1f26'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.fillRect(128 + Math.cos(a) * 100 - 3, 128 + Math.sin(a) * 100 - 3, 6, 6); }
  const hand = (len, wdt, ang, col = '#1c1f26') => { g.strokeStyle = col; g.lineWidth = wdt; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(ang) * len, 128 + Math.sin(ang) * len); g.stroke(); };
  const s = now.getSeconds(), mnt = now.getMinutes() + s / 60, hr = (now.getHours() % 12) + mnt / 60;
  hand(60, 8, hr / 12 * Math.PI * 2 - Math.PI / 2); hand(88, 5, mnt / 60 * Math.PI * 2 - Math.PI / 2); hand(96, 2, s / 60 * Math.PI * 2 - Math.PI / 2, '#d7263d');
}

// ---------------------------------------------------------------- 책상
const DESK_Y = 0.74;
const desk = new THREE.Group(); room.add(desk);
const woodTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#7a4a2a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.strokeStyle = `rgba(${40 + Math.random() * 40},${20 + Math.random() * 20},10,${0.08 + Math.random() * 0.12})`; g.lineWidth = 1 + Math.random() * 3; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w / 3, y + Math.random() * 20 - 10, 2 * w / 3, y + Math.random() * 20 - 10, w, y); g.stroke(); }
});
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping; woodTex.repeat.set(2, 1);
add(desk, rbox(2.1, 0.045, 0.9, 0.012), mat(0xffffff, { map: woodTex, roughness: 0.55, metalness: 0.05 }), 0, DESK_Y - 0.0225, 0);
const legMat = mat(0x1f232c, { metalness: 0.7, roughness: 0.4 });
for (const [x, z] of [[-0.98, -0.38], [0.98, -0.38], [-0.98, 0.38], [0.98, 0.38]]) add(desk, new THREE.CylinderGeometry(0.022, 0.022, DESK_Y - 0.045, 10), legMat, x, (DESK_Y - 0.045) / 2, z);
// 서랍장
const drawer = new THREE.Group(); drawer.position.set(0.78, 0, 0.02); desk.add(drawer);
add(drawer, rbox(0.42, 0.62, 0.72, 0.01), mat(0x23272f, { metalness: 0.3, roughness: 0.6 }), 0, 0.33, 0);
for (let i = 0; i < 3; i++) { add(drawer, rbox(0.38, 0.17, 0.02, 0.006), mat(0x2d323c, { metalness: 0.3, roughness: 0.55 }), 0, 0.12 + i * 0.2, 0.37); add(drawer, new THREE.BoxGeometry(0.12, 0.014, 0.014), mat(0xc8ccd6, { metalness: 0.9, roughness: 0.3 }), 0, 0.12 + i * 0.2, 0.385, { cast: false }); }

// ---------------------------------------------------------------- 의자 (책상 뒤)
const chair = new THREE.Group(); chair.position.set(0.35, 0, -0.95); chair.rotation.y = 0.35; room.add(chair);
const chairMat = mat(0x1d2230, { roughness: 0.8 });
add(chair, new THREE.CylinderGeometry(0.03, 0.03, 0.42, 10), legMat, 0, 0.21, 0);
add(chair, new THREE.CylinderGeometry(0.3, 0.3, 0.03, 5), legMat, 0, 0.02, 0);
add(chair, rbox(0.5, 0.08, 0.5, 0.03), chairMat, 0, 0.46, 0);
add(chair, rbox(0.48, 0.62, 0.07, 0.03), chairMat, 0, 0.82, -0.24);
for (const x of [-0.26, 0.26]) add(chair, rbox(0.05, 0.03, 0.3, 0.01), chairMat, x, 0.72, -0.02);

// ---------------------------------------------------------------- CRT 모니터
const monitor = new THREE.Group(); monitor.position.set(0.02, DESK_Y, -0.2); room.add(monitor);
const beigeMat = mat(0xd9d3c2, { roughness: 0.85 });
const beigeDark = mat(0xc4beaa, { roughness: 0.9 });
add(monitor, new THREE.CylinderGeometry(0.17, 0.2, 0.03, 32), beigeDark, 0, 0.015, 0.02);
add(monitor, rbox(0.2, 0.06, 0.18, 0.01), beigeDark, 0, 0.06, 0.02);
const crtBody = new THREE.Group(); crtBody.position.set(0, 0.31, 0); crtBody.rotation.x = -0.06; monitor.add(crtBody);
add(crtBody, rbox(0.5, 0.44, 0.42, 0.025), beigeMat, 0, 0, -0.05);          // 본체
add(crtBody, rbox(0.42, 0.36, 0.3, 0.02), beigeDark, 0, 0, -0.24);          // 뒤 튜브
add(crtBody, rbox(0.5, 0.44, 0.04, 0.02), beigeMat, 0, 0, 0.17);            // 베젤
add(crtBody, new THREE.BoxGeometry(0.4, 0.3, 0.02), mat(0x0a0a0a, { roughness: 0.3 }), 0, 0.01, 0.185, { cast: false }); // 스크린 프레임
// 뒤 환기구
for (let i = 0; i < 7; i++) add(crtBody, new THREE.BoxGeometry(0.3, 0.008, 0.01), mat(0x8e8878), 0, -0.12 + i * 0.04, -0.39, { cast: false });
// 화면 (캔버스 텍스처)
const SCR = { w: 512, h: 384 }; const scrCanvas = document.createElement('canvas'); scrCanvas.width = SCR.w; scrCanvas.height = SCR.h; const sg = scrCanvas.getContext('2d');
const screenTex = new THREE.CanvasTexture(scrCanvas); screenTex.colorSpace = THREE.SRGBColorSpace;
const screenGeo = new THREE.PlaneGeometry(0.37, 0.275, 24, 18);
{ const p = screenGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 0.185, y = p.getY(i) / 0.1375; p.setZ(i, (1 - (x * x + y * y) * 0.5) * 0.012); } screenGeo.computeVertexNormals(); }
const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
const screen = add(crtBody, screenGeo, screenMat, 0, 0.01, 0.196, { cast: false, receive: false });
add(crtBody, new THREE.PlaneGeometry(0.37, 0.275), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, roughness: 0.45, metalness: 0, clearcoat: 0.3 }), 0, 0.01, 0.212, { cast: false, receive: false }); // 유리
add(crtBody, new THREE.SphereGeometry(0.006, 8, 8), new THREE.MeshBasicMaterial({ color: 0x39ff6a, toneMapped: false }), 0.19, -0.185, 0.19, { cast: false });
add(crtBody, new THREE.PlaneGeometry(0.1, 0.018), new THREE.MeshBasicMaterial({ map: labelTex('BOSUK', { bg: '#d9d3c2', fg: '#4b4538', font: 'bold 60px "IBM Plex Mono", monospace', w: 512, h: 96 }) }), -0.14, -0.185, 0.191, { cast: false });
// 화면 글로우 판 (블룸용)
const glow = add(crtBody, new THREE.PlaneGeometry(0.44, 0.34), new THREE.MeshBasicMaterial({ color: 0x7fe7ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.01, 0.2, { cast: false, receive: false });

// 화면 내용: 가짜 터미널
const LOG_LINES = [
  '[batch] idle-check  2h/5h/1d  ... OK', '[batch] metric sync (PromQL) 230,114 hosts', '[alert] SLO 3σ within range', '[approval] org-lead sign-off  12 pending',
  '[reclaim] 7 idle servers returned', '[api] /servers?limit=50  cursor=ok', '[k8s] argocd sync  app=governance  Synced', '[n8n] retry failed job #4821 ... done',
  '[cache] redis hit 98.7%  caffeine 71%', '[kafka] consumer lag 0  group=infra-sync', '[envers] revision 90213 written', '[health] node-red standby OK',
];
let logBuf = [], logT = 0, logI = 0, screenMode = 'idle';
function drawScreen(t) {
  const w = SCR.w, h = SCR.h; const g = sg;
  g.fillStyle = '#0d2a8f'; g.fillRect(0, 0, w, h);
  const grd = g.createRadialGradient(w / 2, h / 2, 60, w / 2, h / 2, 360); grd.addColorStop(0, 'rgba(70,120,255,.25)'); grd.addColorStop(1, 'rgba(0,0,40,.55)'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.font = '22px "VT323", monospace'; g.fillStyle = '#cfe3ff'; g.textBaseline = 'top'; g.textAlign = 'left';
  g.fillText('BOSUK-OS  v2.6', 16, 10); g.textAlign = 'right'; g.fillText('CH 01', w - 16, 10);
  g.fillStyle = '#9fc0ff'; g.fillRect(16, 38, w - 32, 2);
  // 로그
  g.textAlign = 'left'; g.font = '19px "VT323", monospace';
  logBuf.forEach((l, i) => { g.fillStyle = i === logBuf.length - 1 ? '#ffffff' : '#a9c4ff'; g.fillText(l, 18, 50 + i * 20); });
  // 중앙 박스
  g.fillStyle = 'rgba(0,10,60,.75)'; g.fillRect(56, 196, w - 112, 128);
  g.strokeStyle = '#cfe3ff'; g.lineWidth = 2; g.strokeRect(56, 196, w - 112, 128);
  g.textAlign = 'center'; g.font = 'bold 40px "VT323", monospace'; g.fillStyle = Math.floor(t * 1.6) % 2 ? '#ffffff' : '#9fc0ff';
  g.fillText(lang === 'ko' ? 'CLICK TO ENTER' : 'CLICK TO ENTER', w / 2, 210);
  g.font = '22px "VT323", monospace'; g.fillStyle = '#cfe3ff';
  g.fillText(lang === 'ko' ? '남보석 · Backend Developer' : 'Bosuk Nam · Backend Developer', w / 2, 256);
  const pct = Math.min(100, Math.floor((t * 60) % 130)); g.fillStyle = '#1b3fb5'; g.fillRect(96, 292, w - 192, 14); g.fillStyle = '#9fe8ff'; g.fillRect(96, 292, (w - 192) * pct / 100, 14);
  g.textAlign = 'left'; g.fillStyle = '#cfe3ff'; g.fillText(`PORTFOLIO ${pct}%`, 96, 300 + 14);
  g.textAlign = 'center'; g.font = '18px "VT323", monospace'; g.fillStyle = '#9fc0ff';
  g.fillText('230,000 SERVERS · 4,000+ USERS · KAKAO INFRA', w / 2, h - 30);
  // 스캔라인
  g.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < h; y += 3) g.fillRect(0, y, w, 1);
  screenTex.needsUpdate = true;
}

// ---------------------------------------------------------------- 키보드 / 마우스
const kb = new THREE.Group(); kb.position.set(0.02, DESK_Y, 0.22); kb.rotation.y = 0.03; room.add(kb);
add(kb, rbox(0.47, 0.024, 0.165, 0.008), mat(0x262a33, { roughness: 0.6 }), 0, 0.012, 0);
const keyGeo = rbox(0.024, 0.012, 0.024, 0.004, 2), keyMat = mat(0x3a3f4b, { roughness: 0.55 });
const keysN = 14 * 5; const keys = new THREE.InstancedMesh(keyGeo, keyMat, keysN);
{ let i = 0; for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { if (r === 4 && c > 3 && c < 10) continue; m4.makeTranslation(-0.2 + c * 0.03 + r * 0.006, 0.03, -0.06 + r * 0.03); keys.setMatrixAt(i++, m4); } keys.count = i; }
keys.castShadow = true; kb.add(keys);
add(kb, rbox(0.17, 0.012, 0.024, 0.004, 2), keyMat, 0.0, 0.03, 0.06);
const mouse = add(room, rbox(0.062, 0.034, 0.105, 0.016), mat(0x2b2f3a, { roughness: 0.5 }), 0.42, DESK_Y + 0.017, 0.2, { rot: [0, -0.3, 0] });
{ const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.42, DESK_Y + 0.01, 0.15), new THREE.Vector3(0.45, DESK_Y + 0.005, -0.05), new THREE.Vector3(0.35, DESK_Y + 0.005, -0.3), new THREE.Vector3(0.2, DESK_Y + 0.02, -0.4)]); add(room, new THREE.TubeGeometry(curve, 24, 0.004, 6), mat(0x1a1d25), 0, 0, 0, { cast: false }); }

// ---------------------------------------------------------------- 램프
const lamp = new THREE.Group(); lamp.position.set(-0.7, DESK_Y, -0.2); room.add(lamp);
const lampMat = mat(0xb5533c, { roughness: 0.5, metalness: 0.2 });
add(lamp, new THREE.CylinderGeometry(0.08, 0.09, 0.025, 24), lampMat, 0, 0.012, 0);
const arm1 = add(lamp, new THREE.CylinderGeometry(0.012, 0.012, 0.42, 10), lampMat, 0.08, 0.22, 0, { rot: [0, 0, -0.4] });
const arm2 = add(lamp, new THREE.CylinderGeometry(0.012, 0.012, 0.3, 10), lampMat, 0.12, 0.48, 0.08, { rot: [0.5, 0, 0.9] });
const shade = add(lamp, new THREE.ConeGeometry(0.13, 0.17, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0xb5533c, roughness: 0.5, side: THREE.DoubleSide }), 0.02, 0.5, 0.1, { rot: [0.35, 0, 0.0] });
const bulb = add(lamp, new THREE.SphereGeometry(0.03, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }), 0.02, 0.45, 0.12, { cast: false });

// ---------------------------------------------------------------- 머그 / 화분 / 책 / 플로피 / 메모 / 메모장 / 명패
const mug = new THREE.Group(); mug.position.set(0.5, DESK_Y, -0.05); room.add(mug);
add(mug, new THREE.CylinderGeometry(0.042, 0.038, 0.095, 24), mat(0xf2efe6, { roughness: 0.4 }), 0, 0.0475, 0);
add(mug, new THREE.CylinderGeometry(0.043, 0.043, 0.02, 24), mat(0x14213d, { roughness: 0.4 }), 0, 0.03, 0);
add(mug, new THREE.CylinderGeometry(0.036, 0.036, 0.004, 24), mat(0x2b1a10, { roughness: 0.2, metalness: 0.1 }), 0, 0.09, 0, { cast: false });
add(mug, new THREE.TorusGeometry(0.028, 0.008, 10, 24, Math.PI), mat(0xf2efe6, { roughness: 0.4 }), 0.045, 0.05, 0, { rot: [0, 0, -Math.PI / 2] });
const steamTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 30); r.addColorStop(0, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const steam = []; for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0.35, depthWrite: false })); s.scale.setScalar(0.05); s.position.set(0, 0.12, 0); mug.add(s); steam.push({ s, o: i * 0.9 }); }

const plant = new THREE.Group(); plant.position.set(-0.86, DESK_Y, 0.2); room.add(plant);
add(plant, new THREE.CylinderGeometry(0.075, 0.058, 0.12, 20), mat(0xb0603f, { roughness: 0.8 }), 0, 0.06, 0);
add(plant, new THREE.CylinderGeometry(0.068, 0.068, 0.01, 20), mat(0x2a1e14), 0, 0.118, 0, { cast: false });
const leafMat = mat(0x2f8f4e, { roughness: 0.7 }), leafMat2 = mat(0x3fa85f, { roughness: 0.7 });
for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2, r = 0.03 + (i % 3) * 0.02; const st = add(plant, new THREE.CylinderGeometry(0.004, 0.005, 0.16 + (i % 2) * 0.08, 6), leafMat, Math.cos(a) * r, 0.19 + (i % 2) * 0.04, Math.sin(a) * r, { rot: [Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35] }); const lf = add(plant, new THREE.SphereGeometry(0.045, 10, 8), i % 2 ? leafMat : leafMat2, Math.cos(a) * (r + 0.07), 0.3 + (i % 2) * 0.06, Math.sin(a) * (r + 0.07)); lf.scale.set(1.4, 0.35, 1); lf.rotation.set(Math.sin(a) * 0.5, -a, Math.cos(a) * 0.3); }

const books = new THREE.Group(); books.position.set(-0.62, DESK_Y, 0.22); books.rotation.y = -0.15; room.add(books);
const BOOKS = [['KAKAO  2022 —', '#f6c400', '#1c1f26'], ['LG CNS  2017 — 2022', '#a50034', '#fff'], ['TMAXSOFT  2017', '#1b4f9c', '#fff'], ['SPRING BOOT', '#6db33f', '#fff']];
BOOKS.forEach(([t, bg, fg], i) => {
  const h = 0.035, w = 0.22 - i * 0.012, d = 0.15;
  const b = add(books, rbox(w, h, d, 0.004, 2), mat(bg, { roughness: 0.7 }), (i % 2) * 0.01, h / 2 + i * h, 0, { rot: [0, (i % 2 ? -1 : 1) * 0.06, 0] });
  add(b, new THREE.PlaneGeometry(d * 0.9, h * 0.8), new THREE.MeshBasicMaterial({ map: labelTex(t, { bg, fg, font: 'bold 40px "IBM Plex Mono", monospace', w: 512, h: 96 }) }), 0, 0, d / 2 + 0.0005, { cast: false });
  add(b, new THREE.BoxGeometry(w * 0.96, h * 0.86, d * 0.98), mat(0xf4efe0, { roughness: 0.9 }), 0, 0, -0.004, { cast: false });
});

const floppies = new THREE.Group(); floppies.position.set(0.73, DESK_Y, 0.25); floppies.rotation.y = 0.4; room.add(floppies);
[['JAVA', '#1c1f26', '#ffffff'], ['K8S', '#2456c4', '#ffffff'], ['KAFKA', '#111', '#f6c400']].forEach(([t, bg, fg], i) => {
  const f = add(floppies, rbox(0.09, 0.0035, 0.093, 0.002, 2), mat(bg, { roughness: 0.6 }), i * 0.006, 0.002 + i * 0.0036, -i * 0.004, { rot: [0, i * 0.12, 0] });
  add(f, new THREE.PlaneGeometry(0.06, 0.03), new THREE.MeshBasicMaterial({ map: labelTex(t, { bg: '#fdfbf2', fg, font: 'bold 56px "IBM Plex Mono", monospace', w: 256, h: 128 }) }), 0, 0.0018, 0.025, { rot: [-Math.PI / 2, 0, 0], cast: false });
  add(f, new THREE.BoxGeometry(0.035, 0.004, 0.02), mat(0xc8ccd6, { metalness: 0.9, roughness: 0.3 }), 0, 0.0015, -0.03, { cast: false });
});

const noteMat = (t, bg) => new THREE.MeshStandardMaterial({ map: labelTex(t, { bg, fg: '#1c1f26', font: 'bold 46px "Noto Sans KR", sans-serif', lines: t.split('\n') }), roughness: 0.9 });
const note1 = add(crtBody, new THREE.PlaneGeometry(0.075, 0.075), noteMat('ABOUT\nME', '#fff6a8'), 0.215, 0.145, 0.192, { rot: [0, 0, -0.12], cast: false });
const note2 = add(crtBody, new THREE.PlaneGeometry(0.075, 0.075), noteMat('CONTACT\n✉', '#ffd1dc'), -0.215, -0.12, 0.192, { rot: [0, 0, 0.1], cast: false });
const notePdf = add(room, new THREE.PlaneGeometry(0.08, 0.08), noteMat('PDF\n↓', '#c9f0ff'), 0.98, DESK_Y + 0.001, -0.1, { rot: [-Math.PI / 2, 0, 0.3], cast: false });

const notepad = new THREE.Group(); notepad.position.set(-0.38, DESK_Y, 0.26); notepad.rotation.y = 0.25; room.add(notepad);
add(notepad, rbox(0.17, 0.012, 0.22, 0.003, 2), mat(0xfbfaf4, { roughness: 0.95 }), 0, 0.006, 0);
add(notepad, new THREE.PlaneGeometry(0.16, 0.21), new THREE.MeshStandardMaterial({ map: canvasTex(256, 336, (g, w, h) => { g.fillStyle = '#fbfaf4'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9d4e8'; for (let y = 40; y < h; y += 24) { g.beginPath(); g.moveTo(16, y); g.lineTo(w - 16, y); g.stroke(); } g.fillStyle = '#2b3a67'; g.font = '22px "Caveat", "Noto Sans KR", cursive'; ['side projects', '- lottery (rust)', '- kis-trading', '- childcare-talk', '- oidc / kafka / grpc quest'].forEach((l, i) => g.fillText(l, 22, 34 + i * 24)); }), roughness: 0.95 }), 0, 0.0125, 0, { rot: [-Math.PI / 2, 0, 0], cast: false });
add(notepad, new THREE.CylinderGeometry(0.005, 0.005, 0.15, 8), mat(0x14213d, { roughness: 0.4 }), 0.1, 0.018, 0, { rot: [Math.PI / 2, 0, 0.3] });

const plate = add(room, rbox(0.24, 0.05, 0.02, 0.004, 2), mat(0x14213d, { roughness: 0.4, metalness: 0.3 }), -0.1, DESK_Y + 0.025, 0.4, { rot: [-0.25, 0, 0] });
add(plate, new THREE.PlaneGeometry(0.22, 0.035), new THREE.MeshBasicMaterial({ map: labelTex('남보석 · Backend Developer', { bg: '#14213d', fg: '#f6c400', font: 'bold 40px "Noto Sans KR", sans-serif', w: 768, h: 128 }) }), 0, 0, 0.011, { cast: false });

// 먼지 입자
const dustN = isMobile ? 120 : 320; const dustPos = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) { dustPos[i * 3] = (Math.random() - 0.5) * 5; dustPos[i * 3 + 1] = Math.random() * 2.8; dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4 - 0.5; }
const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xbfd8ff, size: 0.012, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(dust);

// ---------------------------------------------------------------- 후처리
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), isMobile ? 0.35 : 0.45, 0.5, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- 핫스팟
const hotspots = [];
function hotspot(obj, key, action) {
  const h = { obj, key, action, mats: [] };
  obj.traverse((o) => { if (o.isMesh) { o.userData.hs = h; if (o.material && o.material.isMeshStandardMaterial) h.mats.push(o.material); } });
  hotspots.push(h); return h;
}
let reclaimed = 0;
hotspot(crtBody, 'monitor', () => enterCRT());
hotspot(books, 'books', () => openCard('career'));
hotspot(floppies, 'floppy', () => openCard('skills'));
hotspot(note1, 'note1', () => openCard('about'));
hotspot(note2, 'note2', () => openCard('contact'));
hotspot(notePdf, 'pdf', () => { window.open(D.meta.pdf[lang], '_blank'); });
hotspot(notepad, 'notepad', () => openCard('side'));
hotspot(plant, 'plant', () => toast(T().toast.plant));
hotspot(mug, 'mug', () => toast(T().toast.mug));
hotspot(racks, 'rack', () => { const n = 3 + Math.floor(Math.random() * 9); reclaimed += n; toast(T().toast.rack(reclaimed)); blinkStorm(); });
hotspot(clockMesh, 'clock', () => toast(T().toast.clock(new Date().toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' }))));
hotspot(plate, 'plate', () => openCard('about'));
hotspot(lamp, 'lamp', () => { lampOn = !lampOn; toast(T().toast.lamp); });
hotspot(chair, 'chair', () => toast(T().toast.chair));
hotspot(kb, 'keyboard', () => toast(T().toast.keyboard));
const pickables = []; hotspots.forEach((h) => h.obj.traverse((o) => { if (o.isMesh) pickables.push(o); }));

const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2(-9, -9); let hovered = null; let lampOn = true;
const label = $('label');
function setHover(h, ev) {
  if (hovered && hovered !== h) hovered.mats.forEach((m) => m.emissive.setHex(0x000000));
  hovered = h; root.classList.toggle('hot', !!h);
  if (h) { h.mats.forEach((m) => m.emissive.setHex(0x1a2a55)); label.textContent = T().hs[h.key]; label.hidden = false; if (ev) { label.style.left = ev.clientX + 'px'; label.style.top = ev.clientY + 'px'; } }
  else label.hidden = true;
}
function pick(ev) {
  ptr.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const hit = ray.intersectObjects(pickables, false)[0];
  return hit ? hit.object.userData.hs : null;
}
let mouseNX = 0, mouseNY = 0, inCRT = false, moving = false;
renderer.domElement.addEventListener('pointermove', (ev) => {
  mouseNX = (ev.clientX / innerWidth) * 2 - 1; mouseNY = (ev.clientY / innerHeight) * 2 - 1;
  if (inCRT || moving || ev.pointerType === 'touch') return;
  setHover(pick(ev), ev);
});
renderer.domElement.addEventListener('pointerleave', () => setHover(null));
let downAt = null;
renderer.domElement.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY]; });
renderer.domElement.addEventListener('click', (ev) => {
  if (inCRT || moving) return;
  if (downAt) { const dx = ev.clientX - downAt[0], dy = ev.clientY - downAt[1]; downAt = null; if (dx * dx + dy * dy > 100) return; }
  const h = pick(ev); if (h) { blip(); h.action(); }
});

// ---------------------------------------------------------------- CRT 진입 / 복귀
const camAnim = { active: false, t: 0, dur: 1, from: null, to: null, onDone: null };
function flyTo(pos, look, fov, dur, onDone) {
  camAnim.from = { pos: camera.position.clone(), look: curLook.clone(), fov: camera.fov };
  camAnim.to = { pos, look, fov }; camAnim.t = 0; camAnim.dur = dur; camAnim.active = true; camAnim.onDone = onDone; moving = true; setHover(null);
}
const curLook = CAM_HOME.look.clone();
const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
function enterCRT() {
  if (inCRT || moving) return;
  const center = new THREE.Vector3(), normal = new THREE.Vector3(0, 0, 1);
  screen.getWorldPosition(center); normal.applyQuaternion(crtBody.getWorldQuaternion(new THREE.Quaternion()));
  const dist = isMobile ? 0.62 : 0.5;
  const pos = center.clone().addScaledVector(normal, dist);
  flyTo(pos, center, 32, reduceMotion ? 0.01 : 1.0, () => {
    if (isMobile) { location.href = 'game.html'; return; } // 모바일은 게임을 전체 화면으로
    inCRT = true; document.body.classList.add('in-crt');
    const fr = $('crt-frame'); if (!fr.src) fr.src = 'game.html';
    const crt = $('crt'); crt.hidden = false; setTimeout(() => crt.classList.add('show'), 20);
    setTimeout(() => fr.focus(), 500);
  });
}
function leaveCRT() {
  if (!inCRT) return;
  const crt = $('crt'); crt.classList.remove('show'); setTimeout(() => { crt.hidden = true; }, 450);
  inCRT = false; document.body.classList.remove('in-crt');
  flyTo(CAM_HOME.pos.clone(), CAM_HOME.look.clone(), CAM_HOME.fov, reduceMotion ? 0.01 : 0.9);
}
$('crt-back').onclick = leaveCRT;
addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('modal').hidden) closeCard(); else leaveCRT(); } });
addEventListener('message', (e) => { if (e.data === 'crt:back') leaveCRT(); });

// ---------------------------------------------------------------- 카드
const modal = $('modal'), modalBody = $('modal-body');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function openCard(kind) {
  const c = T().cards; let html = '';
  if (kind === 'about') {
    html = `<h2>${esc(D.meta.name[lang])}</h2><div class="sub">${esc(D.meta.title[lang])} · Kakao Infra Dev Team · 2022 –</div>` + D.summary[lang].map((p) => `<p>${esc(p)}</p>`).join('') +
      `<div class="cat">${c.ach}</div><ul>` + Object.values(D.achievements).map((a) => `<li>${a.ic} ${esc(a.n[lang])} — ${esc(a.d[lang])}</li>`).join('') + `</ul>` +
      `<div class="cat">${c.edu}</div><ul>` + D.education[lang].map((e) => `<li>${esc(e)}</li>`).join('') + `</ul>`;
  } else if (kind === 'career') {
    html = `<h2>${c.career}</h2><div class="sub">1990 → 2026</div>` + D.stages.filter((s) => !s.goal).map((s) => {
      const body = s.company ? `<span>${esc(s.period?.[lang] || '')}<br>${esc(s.intro?.[lang] || '')}</span>` + (s.projects ? `<ul>${s.projects.map((p) => `<li><b style="display:inline">${esc(p.n[lang])}</b> <span>(${esc(p.p)} · ${esc(p.r[lang])})</span></li>`).join('')}</ul>` : '')
        : `<span>${esc((s.card?.[lang] || [])[0] || '')}</span>`;
      return `<div class="row"><div class="yr">${esc(s.year)}</div><div><b>${esc(s.title[lang])}</b>${body}</div></div>`;
    }).join('');
  } else if (kind === 'skills') {
    html = `<h2>${c.skills}</h2><div class="sub">${lang === 'ko' ? '레벨은 1~5 자기 평가' : 'Levels are self-assessed 1–5'}</div>`;
    for (const [cat, name] of Object.entries(D.skillCats)) {
      html += `<div class="cat">${esc(name[lang]).toUpperCase()}</div><div class="chips">` + Object.values(D.skills).filter((s) => s.cat === cat).map((s) => `<span class="chip">${s.ic} ${esc(s.n)}<i>${'★'.repeat(s.lv)}</i></span>`).join('') + `</div>`;
    }
  } else if (kind === 'contact') {
    html = `<h2>${c.contact}</h2><div class="sub">${esc(D.meta.email)}</div><div class="links"><a href="mailto:${esc(D.meta.email)}">✉ Email</a><a href="${esc(D.meta.linkedin)}" target="_blank" rel="noopener">LinkedIn</a><a href="${esc(D.meta.github)}" target="_blank" rel="noopener">GitHub</a><a href="${esc(D.meta.pdf.ko)}" download>${c.pdfKo}</a><a href="${esc(D.meta.pdf.en)}" download>${c.pdfEn}</a><a href="game.html">${c.game}</a></div>`;
  } else if (kind === 'side') {
    html = `<h2>${c.side}</h2><div class="sub">github.com/bosuknam</div>` + D.sideProjects.map((p) => `<div class="row"><div class="yr">${esc(p.l)}</div><div><b><a href="${esc(p.u)}" target="_blank" rel="noopener" style="color:var(--navy)">${esc(p.n)}</a></b><span>${esc(p.d[lang])}</span></div></div>`).join('') +
      `<div class="row"><div class="yr">Games</div><div><b>${lang === 'ko' ? '직접 만든 학습 게임' : 'Learning games I built'}</b><span><a href="https://bosuknam.github.io/oidc-quest/" target="_blank" rel="noopener">OIDC Quest</a> · <a href="https://bosuknam.github.io/kafka-quest/" target="_blank" rel="noopener">Kafka Quest</a> · <a href="https://bosuknam.github.io/grpc-quest/" target="_blank" rel="noopener">gRPC Tunnel Run</a></span></div></div>`;
  }
  modalBody.innerHTML = html; modal.hidden = false;
}
function closeCard() { modal.hidden = true; }
$('modal-x').onclick = closeCard; modal.addEventListener('click', (e) => { if (e.target === modal) closeCard(); });
document.querySelectorAll('#nav button').forEach((b) => { b.onclick = () => { blip(); openCard(b.dataset.card); }; });

// ---------------------------------------------------------------- 토스트 / 사운드 / 언어
let toastT; function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }
let ac = null, hum = null, soundOn = false;
function blip() { if (!soundOn || !ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = 880; g.gain.setValueAtTime(0.03, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.08); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.09); }
function toggleSound() {
  if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); const n = ac.sampleRate * 2, buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; const src = ac.createBufferSource(); src.buffer = buf; src.loop = true; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260; const g = ac.createGain(); g.gain.value = 0; src.connect(lp).connect(g).connect(ac.destination); src.start(); const o = ac.createOscillator(); o.frequency.value = 60; const og = ac.createGain(); og.gain.value = 0; o.connect(og).connect(g); o.start(); hum = { g, og }; }
  soundOn = !soundOn; ac.resume(); hum.g.gain.linearRampToValueAtTime(soundOn ? 0.09 : 0, ac.currentTime + 0.4); hum.og.gain.linearRampToValueAtTime(soundOn ? 0.25 : 0, ac.currentTime + 0.4);
  $('btn-sound').textContent = soundOn ? T().soundOn : T().soundOff; toast(soundOn ? T().toast.sound : T().toast.mute);
}
$('btn-sound').onclick = toggleSound;
function applyLang() {
  document.documentElement.lang = lang; localStorage.setItem('lang', lang);
  $('brand-name').textContent = D.meta.name[lang]; $('brand-sub').textContent = T().sub; $('hint').textContent = T().hint; $('crt-back').textContent = T().back; $('btn-lang').textContent = T().lang; $('btn-sound').textContent = soundOn ? T().soundOn : T().soundOff;
  const n = { about: 'ABOUT', career: 'CAREER', skills: 'SKILLS', contact: 'CONTACT' }; document.querySelectorAll('#nav button').forEach((b) => { b.textContent = lang === 'ko' ? { about: '소개', career: '경력', skills: '스킬', contact: '연락처' }[b.dataset.card] : n[b.dataset.card]; });
}
$('btn-lang').onclick = () => { lang = lang === 'ko' ? 'en' : 'ko'; applyLang(); if (!modal.hidden) { const k = modalBody.querySelector('h2') ? null : null; } };
applyLang();

// ---------------------------------------------------------------- 루프
let stormT = 0; function blinkStorm() { stormT = 1.2; }
const clock = new THREE.Clock(); let acc = 0, clockAcc = 0;
function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); }
addEventListener('resize', resize);
const tmpC = new THREE.Color();
let tAcc = 0;
function frame() { requestAnimationFrame(frame); update(Math.min(clock.getDelta(), 0.05)); }
function update(dt) {
  tAcc += dt; const t = tAcc;
  // 카메라
  if (camAnim.active) {
    camAnim.t += dt; const k = ease(Math.min(1, camAnim.t / camAnim.dur));
    camera.position.lerpVectors(camAnim.from.pos, camAnim.to.pos, k); curLook.lerpVectors(camAnim.from.look, camAnim.to.look, k);
    camera.fov = camAnim.from.fov + (camAnim.to.fov - camAnim.from.fov) * k; camera.updateProjectionMatrix(); camera.lookAt(curLook);
    if (k >= 1) { camAnim.active = false; moving = false; camAnim.onDone && camAnim.onDone(); }
  } else if (!inCRT) {
    const px = CAM_HOME.pos.x + mouseNX * (reduceMotion ? 0 : 0.16), py = CAM_HOME.pos.y - mouseNY * (reduceMotion ? 0 : 0.08) + Math.sin(t * 0.6) * 0.006;
    camera.position.x += (px - camera.position.x) * 0.05; camera.position.y += (py - camera.position.y) * 0.05;
    camera.lookAt(curLook);
  }
  // 화면
  acc += dt; if (acc > 0.12) { acc = 0; drawScreen(t); }
  logT += dt; if (logT > 1.4) { logT = 0; logBuf.push(LOG_LINES[logI++ % LOG_LINES.length]); if (logBuf.length > 6) logBuf.shift(); }
  glow.material.opacity = 0.025 + Math.sin(t * 7) * 0.008 + (Math.random() < 0.02 ? 0.03 : 0);
  screenLight.intensity = 0.85 + Math.sin(t * 9) * 0.08;
  // 램프
  const lampTarget = lampOn ? 3.2 + Math.sin(t * 30) * 0.04 : 0; lampLight.intensity += (lampTarget - lampLight.intensity) * 0.2; bulb.material.color.setHex(lampOn ? 0xffd9a0 : 0x3a3328);
  // LED
  if (stormT > 0) stormT -= dt;
  for (const s of ledState) {
    const on = stormT > 0 ? Math.random() < 0.5 : (Math.sin(t * s.rate + s.phase) > -0.2 || s.rate < 0.8);
    tmpC.copy(s.col).multiplyScalar(on ? 1.6 : 0.12); leds.setColorAt(s.i, tmpC);
  }
  leds.instanceColor.needsUpdate = true;
  // 김 / 먼지 / 시계
  for (const { s, o } of steam) { const k = ((t * 0.35 + o) % 1); s.position.y = 0.11 + k * 0.16; s.position.x = Math.sin((t + o) * 2) * 0.012; s.material.opacity = 0.35 * (1 - k); s.scale.setScalar(0.04 + k * 0.05); }
  dust.rotation.y = t * 0.01; const dp = dust.geometry.attributes.position; for (let i = 0; i < dustN; i++) { dp.array[i * 3 + 1] += Math.sin(t * 0.5 + i) * 0.0003; } dp.needsUpdate = true;
  clockAcc += dt; if (clockAcc > 1) { clockAcc = 0; drawClock(clockTex.image.getContext('2d'), 256, 256); clockTex.needsUpdate = true; }
  composer.render();
}

document.fonts.ready.then(() => { logBuf = []; });
setTimeout(() => $('loading').classList.add('done'), 900);
frame();
window.__room = { scene, camera, enterCRT, leaveCRT, openCard, tick: (n = 1, dt = 1 / 60) => { for (let i = 0; i < n; i++) update(dt); }, dbg: () => ({ moving, inCRT, active: camAnim.active, t: camAnim.t, dur: camAnim.dur, to: camAnim.to && camAnim.to.pos.toArray() }) };
