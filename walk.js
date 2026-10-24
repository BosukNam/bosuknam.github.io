// 남보석 포트폴리오 — TIMELINE WALK: 연도별 방을 1인칭으로 걸어 통과하는 3D 입구. 콘텐츠는 data.js.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const D = window.DATA;
const $ = (id) => document.getElementById(id);
const isTouch = matchMedia('(pointer: coarse)').matches;
const isSmall = matchMedia('(max-width: 720px)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang = localStorage.getItem('lang') || (navigator.language.startsWith('ko') ? 'ko' : 'en');
const L = (o) => (o && typeof o === 'object' && (o.ko || o.en)) ? (o[lang] || o.ko || o.en) : o;

const UI = {
  ko: {
    sub: 'Backend Developer · Java / Spring · Kakao 인프라개발팀 2022 –', ver: '버전', verWalk: '3D 워크 (1인칭)', verPixel: '2D 픽셀 (이전 버전)',
    nav: { about: '소개', career: '경력', skills: '스킬', contact: '연락처' }, stage: 'STAGE', auto: '🚶 자동 투어', autoOn: '⏸ 투어 중', lang: 'EN', langLink: 'English',
    start: '▶ 시작', cont: '이어하기', tour: '🚶 자동 투어', pdf: '📄 PDF', pixel: '🕹 2D 픽셀 버전(이전 버전)으로 보기', ok: '확인 (Esc)',
    desc: '연도별로 이어진 10개의 방을 직접 걸어서 지나갑니다. 방에 들어가면 그 시절 이야기가 <b>자막</b>으로 흐릅니다. 방마다 <b>미니게임</b>이 있고, 클릭하면 <b>커밋을 발사</b>해 🐛 버그를 잡을 수 있어요. 버그 한 마리·미니게임 하나마다 발사기가 <b>레벨 업</b>하고, 떠 있는 <b>스킬 칩</b>을 먹으면 탄의 색과 성능이 바뀝니다.',
    controls: '<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동</span><span>마우스 시점</span><span><kbd>E</kbd> 상호작용</span><span>클릭 발사</span><span><kbd>Space</kbd> 점프</span><span><kbd>Esc</kbd> 마우스 해제</span>',
    skip: '계속 → 클릭 또는 Space', card: (t) => `카드 읽기 — ${t}`, chip: (n) => `스킬 획득 — ${n}`, ach: (n) => `업적 — ${n}`, door: '다음 방으로', doorLocked: (n) => `잠김 — ${n}`, rack: '유휴 서버 반납 (E)', rackDone: '반납 완료', portal: '다음 스테이지로 (연락처 · PDF)', pc: '486 PC — 명령어 입력',
    needCard: '카드 읽기', needChips: (n) => `⚡ 스킬 칩 ${n}개`, objective: (s, needs) => (needs.length ? `이 방: ${needs.join(' · ')}  |  ` : '') + `다음 → ${s}`, story: '이야기 읽기', mini: '미니게임', weaponUp: (lv, why) => `🔫 COMMIT LAUNCHER Lv.${lv} — ${why}`, wdesc: ['', '싱글 샷', '더블 샷', '트리플 샷 · 연사', '빅 샷 · 최대'],
    clear: (y) => `STAGE CLEAR · ${y}`, doorOpen: '🔓 문이 열렸습니다', jump: '점프', gotChip: (n) => `⚡ ${n} 획득`, gotAch: (n) => `🏆 ${n}`, reclaimed: (n) => `💤 유휴 서버 반납 · 누적 ${n}대`,
    bug: (n, m) => `🐛 버그 수정 ${n}/${m} → 발사기 레벨 업!`, clickToPlay: '화면을 클릭하면 마우스로 둘러볼 수 있어요 · 클릭 = 발사', tourOff: '자동 투어 해제', tourOn: '자동 투어 시작 — 아무 키나 누르면 멈춥니다', reset: '처음부터 다시 시작할까요? (진행 상황 삭제)',
    cards: { about: '소개', career: '경력', skills: '보유 스킬', contact: '연락처', summary: '요약', edu: '학력 · 자격', ach: '업적', side: '사이드 프로젝트', pdfKo: 'PDF 포트폴리오 (국문)', pdfEn: 'PDF Portfolio (English)', game: '🕹 2D 픽셀 버전', collected: '획득', locked: '아직 못 찾음', final: '여기까지 읽어주셔서 감사합니다. 대규모 인프라를 다루는 백엔드 개발자로서 다음 도전을 준비하고 있습니다.' },
    dosHelp: '명령어: help, dir, whoami, skills, career, contact, cls',
  },
  en: {
    sub: 'Backend Developer · Java / Spring · Kakao Infra Dev Team 2022 –', ver: 'Version', verWalk: '3D walk (first person)', verPixel: '2D pixel (previous)',
    nav: { about: 'ABOUT', career: 'CAREER', skills: 'SKILLS', contact: 'CONTACT' }, stage: 'STAGE', auto: '🚶 Auto tour', autoOn: '⏸ Touring', lang: '한국어', langLink: '한국어',
    start: '▶ Start', cont: 'Continue', tour: '🚶 Auto tour', pdf: '📄 PDF', pixel: '🕹 Open the 2D pixel version (previous)', ok: 'OK (Esc)',
    desc: 'Walk through 10 rooms, one per era. Each room plays its story as a <b>crawl</b> and has a <b>mini-game</b>. Click to <b>fire a commit</b> at the 🐛 bugs — each bug or mini-game <b>levels up</b> the launcher, and <b>skill chips</b> change your shots\' color and perks.',
    controls: '<span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move</span><span>mouse look</span><span><kbd>E</kbd> interact</span><span>click = fire</span><span><kbd>Space</kbd> jump</span><span><kbd>Esc</kbd> release mouse</span>',
    skip: 'Continue → click or Space', card: (t) => `Read card — ${t}`, chip: (n) => `Collect skill — ${n}`, ach: (n) => `Achievement — ${n}`, door: 'Next room', doorLocked: (n) => `Locked — ${n}`, rack: 'Reclaim idle server (E)', rackDone: 'Reclaimed', portal: 'Next stage (contact · PDF)', pc: '486 PC — type a command',
    needCard: 'read the card', needChips: (n) => `⚡ ${n} skill chip${n > 1 ? 's' : ''}`, objective: (s, needs) => (needs.length ? `This room: ${needs.join(' · ')}  |  ` : '') + `Next → ${s}`, story: 'Read the story', mini: 'Mini-game', weaponUp: (lv, why) => `🔫 COMMIT LAUNCHER Lv.${lv} — ${why}`, wdesc: ['', 'single shot', 'double shot', 'triple shot · rapid', 'big shot · max'],
    clear: (y) => `STAGE CLEAR · ${y}`, doorOpen: '🔓 Door unlocked', gotChip: (n) => `⚡ ${n}`, gotAch: (n) => `🏆 ${n}`, reclaimed: (n) => `💤 Idle server reclaimed · total ${n}`,
    bug: (n, m) => `🐛 Bug ${n}/${m} fixed → launcher level up!`, clickToPlay: 'Click the screen to look around · click = fire', tourOff: 'Auto tour off', tourOn: 'Auto tour — press any key to stop', reset: 'Restart from the beginning? (progress is deleted)',
    cards: { about: 'About', career: 'Career', skills: 'Skills', contact: 'Contact', summary: 'Summary', edu: 'Education · Certifications', ach: 'Achievements', side: 'Side projects', pdfKo: 'PDF 포트폴리오 (국문)', pdfEn: 'PDF Portfolio (English)', game: '🕹 2D pixel version', collected: 'collected', locked: 'not found yet', final: 'Thanks for reading this far. I am a backend developer who builds systems for large-scale infrastructure, getting ready for the next challenge.' },
    dosHelp: 'Commands: help, dir, whoami, skills, career, contact, cls',
  },
};
const T = () => UI[lang];

// ---------------------------------------------------------------- 상태
const S = { playing: false, locked: false, auto: false, sound: false, cardRead: new Set(), chips: new Set(), ach: new Set(), racks: new Set(), bugs: new Set(), cleared: new Set(), mini: new Set(), wlv: 1, perks: {}, wcol: 0x9fefff, servers: 0, stage: 0 };
try { const sv = JSON.parse(localStorage.getItem('walk') || 'null'); if (sv) { S.cardRead = new Set(sv.cardRead); S.chips = new Set(sv.chips); S.ach = new Set(sv.ach); S.racks = new Set(sv.racks || []); S.bugs = new Set(sv.bugs || []); S.cleared = new Set(sv.cleared || []); S.mini = new Set(sv.mini || []); S.wlv = sv.wlv || 1; S.perks = sv.perks || {}; S.wcol = sv.wcol || 0x9fefff; S.servers = sv.servers || 0; S.savePos = sv.pos; } } catch (e) { /* 저장 없음 */ }
const save = () => { try { localStorage.setItem('walk', JSON.stringify({ cardRead: [...S.cardRead], chips: [...S.chips], ach: [...S.ach], racks: [...S.racks], bugs: [...S.bugs], cleared: [...S.cleared], mini: [...S.mini], wlv: S.wlv, perks: S.perks, wcol: S.wcol, servers: S.servers, pos: { x: P.x, z: P.z, yaw: P.yaw } })); } catch (e) {} };

// ---------------------------------------------------------------- 렌더러 / 장면
const renderer = new THREE.WebGLRenderer({ antialias: !isSmall, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isSmall ? 1.5 : 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
$('world').appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070e); scene.fog = new THREE.Fog(0x05070e, 9, 30);
const camera = new THREE.PerspectiveCamera(isSmall ? 80 : 72, innerWidth / innerHeight, 0.05, 80);
scene.add(new THREE.HemisphereLight(0x9fb4e8, 0x0a0c14, 1.1));
scene.add(camera);
// 조명 예산: 방 조명 3개(현재·다음·이전)를 플레이어 위치에 따라 옮겨 쓴다 + 총구 섬광 1개
const roomLights = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffffff, 0, 16, 1.4); scene.add(l); return l; });
const muzzle = new THREE.PointLight(0x7fe7ff, 0, 6, 2); scene.add(muzzle);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), isSmall ? 0.35 : 0.45, 0.5, 0.9));
composer.addPass(new OutputPass());

// ---------------------------------------------------------------- 도우미
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0.05, ...o });
const glowMat = (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
const rbox = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 3, r);
function add(parent, geo, m, x = 0, y = 0, z = 0, rot) { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); if (rot) me.rotation.set(...rot); parent.add(me); return me; }
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function textTex(lines, { bg = '#14213d', fg = '#ffffff', font = 'bold 56px "Noto Sans KR", sans-serif', w = 1024, h = 256, sub, subFg = '#f6c400', pad = 0 } = {}) {
  font = String(font);
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle';
    const ls = Array.isArray(lines) ? lines : [lines]; let px = parseInt(font.match(/(\d+)px/)[1]);
    g.font = font; const widest = Math.max(...ls.map((l) => g.measureText(l).width)); if (widest > w - 60) { px = Math.max(18, Math.floor(px * (w - 60) / widest)); font = font.replace(/\d+px/, px + 'px'); }
    const lh = px * 1.25; const total = ls.length * lh + (sub ? px * 0.9 : 0);
    g.fillStyle = fg; g.font = font; ls.forEach((l, i) => g.fillText(l, w / 2, h / 2 - total / 2 + lh / 2 + i * lh + pad));
    if (sub) { g.fillStyle = subFg; g.font = `${Math.round(px * 0.6)}px "IBM Plex Mono", monospace`; g.fillText(sub, w / 2, h / 2 + total / 2 - px * 0.4 + pad); }
  });
}
// 항상 카메라를 보는 라벨
function makeLabel(text, { color = '#7fe7ff', bg = 'rgba(8,12,24,.85)', size = 1 } = {}) {
  const c = document.createElement('canvas'); const g = c.getContext('2d'); g.font = 'bold 40px "Noto Sans KR", sans-serif';
  const tw = Math.ceil(g.measureText(text).width) + 56; c.width = tw; c.height = 80;
  g.font = 'bold 40px "Noto Sans KR", sans-serif'; g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, tw, 80, 18); g.fill();
  g.strokeStyle = color; g.lineWidth = 3; g.stroke(); g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, tw / 2, 42);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  sp.scale.set(tw / 160 * size, 0.5 * size, 1); sp.userData.base = sp.scale.clone(); return sp;
}

// ---------------------------------------------------------------- 월드 데이터
const H_ROOM = 4.2, ROOM_W = 9, LEN = { default: 13, lgcns: 16, kakao: 19, goal: 11, pc: 12 };
const EXTRA_COINS = { tmax: ['mysql'] };
const THEMES = {
  seoul:    { floor: 0x3b2f3a, wall: 0x5a3f55, ceil: 0x2a1e2a, light: 0xffb3a7, i: 2.2, sky: ['#2b1b3d', '#ff8c6b', '#ffd59e'] },
  israel:   { floor: 0xc9a46a, wall: 0xd9b57a, ceil: 0x6aa6d8, light: 0xffd9a0, i: 2.6, sky: ['#3b7dd8', '#9fc8f0', '#f1d9a8'] },
  pc:       { floor: 0x2a2630, wall: 0x3a3447, ceil: 0x1a1720, light: 0x9fc0ff, i: 1.1, sky: null },
  univ:     { floor: 0x3f7a3c, wall: 0x8c8f99, ceil: 0x7cb8e8, light: 0xfff2cc, i: 2.4, sky: ['#4a90e2', '#a8d4f5', '#dff1ff'] },
  kunhwa:   { floor: 0x5b5f6b, wall: 0x8a94a6, ceil: 0xd8dbe2, light: 0xeef2ff, i: 2.0, sky: null },
  alphago:  { floor: 0x14161f, wall: 0x1e2130, ceil: 0x0c0d14, light: 0x6b9cff, i: 1.0, sky: null },
  bootcamp: { floor: 0x7a5c46, wall: 0xe8dcc8, ceil: 0xfff3dd, light: 0xffe0b0, i: 2.2, sky: null },
  tmax:     { floor: 0x2d3748, wall: 0x3b6fd6, ceil: 0xe6eefc, light: 0xdfeaff, i: 2.0, sky: null },
  lgcns:    { floor: 0x2b2b30, wall: 0x9a2a33, ceil: 0x1b1b20, light: 0xffd6d6, i: 2.2, sky: null },
  kakao:    { floor: 0x10141f, wall: 0x0c1120, ceil: 0x070a14, light: 0xfff0a0, i: 1.4, sky: null },
  goal:     { floor: 0xf4f1e8, wall: 0xffffff, ceil: 0xffffff, light: 0xffffff, i: 3.2, sky: ['#ffffff', '#ffe9a8', '#ffd1a1'] },
};
let CHEV_TEX = null;
function chevronTex() { if (CHEV_TEX) return CHEV_TEX; CHEV_TEX = canvasTex(128, 96, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#fff'; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(16, 70); g.lineTo(64, 22); g.lineTo(112, 70); g.stroke(); }); return CHEV_TEX; }
function frameTex(r) {
  return canvasTex(512, 372, (g, w, h) => {
    g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h); g.fillStyle = '#14213d'; g.fillRect(22, 22, w - 44, h - 44);
    g.fillStyle = '#7fe7ff'; g.font = '600 22px "IBM Plex Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(`STAGE ${r.i + 1} · ${r.st.year}`, w / 2, 70);
    g.fillStyle = '#fff'; let fs = 40; g.font = `900 ${fs}px "Noto Sans KR", sans-serif`; const t = L(r.st.title); const tw = g.measureText(t).width; if (tw > w - 80) { fs = Math.floor(fs * (w - 80) / tw); g.font = `900 ${fs}px "Noto Sans KR", sans-serif`; } g.fillText(t, w / 2, h / 2 - 10);
    g.fillStyle = '#ffd84d'; g.font = '700 24px "Noto Sans KR", sans-serif'; g.fillText(lang === 'ko' ? '📖 눌러서 이야기 읽기' : '📖 Press to read the story', w / 2, h - 72);
  });
}
function storyTex(r) {
  const lines = crawlLines(r.st); return canvasTex(1152, 640, (g, w, h) => {
    g.fillStyle = '#0e1630'; g.fillRect(0, 0, w, h); g.fillStyle = '#f6c400'; g.fillRect(0, 0, w, 10);
    g.fillStyle = '#7fe7ff'; g.font = '600 26px "IBM Plex Mono", monospace'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(`STAGE ${r.i + 1} · ${r.st.year} · STORY`, 44, 36);
    g.fillStyle = '#ffffff'; g.font = 'bold 40px "Noto Sans KR", sans-serif'; g.fillText(L(r.st.title), 44, 76);
    g.fillStyle = '#ffd84d'; let fs = 31; g.font = `700 ${fs}px "Noto Sans KR", sans-serif`; const widest = Math.max(1, ...lines.map((l) => g.measureText(l).width)); if (widest > w - 88) { fs = Math.max(20, Math.floor(fs * (w - 88) / widest)); g.font = `700 ${fs}px "Noto Sans KR", sans-serif`; }
    const lh = Math.min(fs * 1.55, (h - 160) / Math.max(1, lines.length)); lines.forEach((l, i) => g.fillText(l, 44, 150 + i * lh));
  });
}
// 방별 스토리 자막 (한 문장 = 한 줄)
const STORY = {
  seoul: { ko: ['1990년, 서울에서 태어났습니다.', '이름은 남보석 — 보석처럼 흔치 않은 이름입니다.', 'ⓘ 이름의 뜻은 문 옆 액자에서 볼 수 있습니다.'], en: ['Born in Seoul, 1990.', 'My name is Bosuk Nam — bosuk means "jewel".', 'ⓘ The story behind the name is in the frame by the door.'] },
  israel: { ko: ['이스라엘에서의 4년.', '말이 통하지 않아 놀림도 받았지만', '11개월 만에 히브리어로 농담을 하게 됐습니다.', '그때 배운 끈기가 지금도 남아 있습니다.', 'שלום — 지금도 인사 정도는 합니다.'], en: ['Four years in Israel.', 'Teased at first for not understanding a word,', 'within 11 months I was joking in Hebrew.', 'That stubbornness never left me.', 'שלום — I can still say hello.'] },
  pc: { ko: ['다섯 살, 처음 만진 486 컴퓨터.', 'C:\\> 프롬프트에서 시작해 Windows 3.1까지.', '초등학생 때는 플래시로 애니메이션을 만들며', '컴퓨터로 무언가를 만드는 일에 빠졌습니다.', '책상 위 PC에 명령어를 입력해 보세요.'], en: ['Age five: my first 486 PC.', 'From the C:\\> prompt to Windows 3.1.', 'In elementary school I made Flash animations', 'and fell for making things with a computer.', 'Try typing a command on the desk PC.'] },
  univ: { ko: ['2009년, 한양대학교 도시공학과에 입학했습니다.', '도시를 설계하는 법을 배우고, 군 복무를 마치고,', '2014년 도시계획기사 자격을 땄습니다.', '아직 개발자는 아니었습니다.'], en: ['2009: Urban Planning at Hanyang University.', 'I learned to design cities, served in the army,', "and earned the urban planner's license in 2014.", 'Not a developer yet.'] },
  kunhwa: { ko: ['첫 직장, (주)건화 도시계획부.', '파주 운정, 주안, 안양의 도시 계획을 그렸습니다.', '열심히 일했지만 매일 같은 생각이 들었습니다.', '"이건 내 적성이 아니다."'], en: ['First job: urban planning at Kunhwa Engineering.', 'I drew plans for Paju, Juan and Anyang.', 'I worked hard, but one thought came every day:', '"This is not what I\'m meant to do."'] },
  alphago: { ko: ['2016년 3월, 회사 점심시간.', '알파고가 이세돌을 이겼다는 뉴스를 봤습니다.', '무의식중에 말이 나왔습니다.', '"개발자가 돼야겠네요."', '그해 4월, 회사를 그만뒀습니다.'], en: ['March 2016, lunch break at the office.', 'The news: AlphaGo had beaten Lee Sedol.', 'The words slipped out on their own:', '"I should become a developer."', 'That April, I quit.'] },
  bootcamp: { ko: ['독학과 형의 과외로 프로그래밍을 시작했습니다.', '부트캠프에서 6개월, C/C++부터 Java와 Spring까지.', '팀으로 스터디 플래너와 이력서 도우미를 만들었습니다.', '프로그래밍이 언어보다 수학에 가깝다는 걸 깨닫자', '정말 재미있어졌습니다.'], en: ['Self-study, plus weekly lessons from my brother.', 'Six months of bootcamp: C/C++ to Java and Spring.', 'We built a study planner and a résumé helper as a team.', 'Once I saw that code is closer to math than language,', 'it became genuinely fun.'] },
  tmax: { ko: ['2017년 4월, 첫 IT 회사 티맥스소프트.', '미들웨어 기술지원을 맡았습니다.', '석 달 뒤, LG CNS에서 연락이 왔습니다.'], en: ['April 2017: TmaxSoft, my first IT company.', 'Middleware technical support.', 'Three months later, LG CNS called.'] },
  lgcns: { ko: ['LG CNS에서의 4년 9개월.', '스마트팩토리 솔루션으로 시작해', '자사 Spring 프레임워크 DevOn 개발팀으로 옮겼습니다.', '신한은행 SOL, KB국민은행 전자지갑 —', '금융권 MSA 프로젝트의 개발 환경과 표준을 책임졌습니다.', '신입 프로젝트 대상, 그리고 사내 Java 강사.'], en: ['Four years and nine months at LG CNS.', 'Started on smart-factory solutions,', 'moved to the in-house Spring framework team, DevOn.', 'Shinhan SOL, KB e-wallet —', 'I owned the dev environment and standards for banking MSA.', 'New-hire project grand prize, and internal Java instructor.'] },
  kakao: { ko: ['2022년 3월, 카카오 인프라개발팀.', '서버 23만 대, 사용자 4,000명의 사내 시스템을 맡았습니다.', '쓰지 않는 서버를 사람 대신 시스템이 찾아내도록', '유휴 서버 관리 시스템을 혼자 설계하고 만들었습니다.', '알림에서 조직장 결재로 — 반납은 조직의 결정이 됐습니다.', '요즘은 n8n과 AI 에이전트를 매일의 개발에 녹이고 있습니다.', '💤 표시된 랙을 쏴서 유휴 서버를 반납해 보세요.'], en: ['March 2022: Kakao, Infra Development Team.', 'Internal systems for 230,000 servers and 4,000 users.', 'I built the idle-server system alone,', 'so the system, not people, finds unused servers.', 'From alerts to org-lead approval — returns became a decision.', 'These days I fold n8n and AI agents into daily development.', 'Shoot the 💤 racks to reclaim idle servers.'] },
  goal: { ko: ['여기까지 읽어 주셔서 감사합니다.', '대규모 인프라를 다루는 백엔드 개발자로서', '다음 도전을 준비하고 있습니다.', '포털을 지나면 연락처와 PDF가 있습니다.'], en: ['Thank you for walking this far.', 'A backend developer for large-scale infrastructure,', 'getting ready for the next challenge.', 'Contact and PDF are beyond the portal.'] },
};
const NAME_INFO = { ko: ['남보석은 사파이어를 뜻하는 말입니다. (성은 남녘 남)', '출애굽기 28장, 대제사장의 흉패에 박힌 열두 보석 가운데 하나에서 따온 이름입니다.', '흔치 않은 이름 덕분에 한 번 들으면 잘 잊히지 않는다고들 합니다.'], en: ['Bosuk means sapphire.', 'It comes from one of the twelve stones on the high priest\'s breastplate in Exodus 28.', 'People say the unusual name is hard to forget once heard.'] };
function crawlLines(st) { return (STORY[st.id] || {})[lang] || (STORY[st.id] || {}).ko || []; }
// 방별 미니게임 (퀴즈 / 타이핑 / 유휴 서버 사냥)
const MINIGAMES = {
  israel: { kind: 'memory', title: { ko: '히브리어 짝 맞추기', en: 'Hebrew memory match' } },
  univ: { kind: 'simon', title: { ko: '캠퍼스 길 외우기', en: 'Campus path memory' } },
  kunhwa: { kind: 'slide', title: { ko: '도시계획도 퍼즐', en: 'City-plan slide puzzle' } },
  alphago: { kind: 'ttt', title: { ko: '알파고와 삼목(OX)', en: 'Tic-tac-toe vs AlphaGo' } },
  bootcamp: { kind: 'typing', title: { ko: 'hello, world 타이핑', en: 'Type hello, world' }, text: 'printf("hello, world\\n");' },
  tmax: { kind: 'reaction', title: { ko: '서버 재시작 반응속도', en: 'Server restart reaction' } },
  lgcns: { kind: 'logs', title: { ko: '로그에서 ERROR 찾기', en: 'Find the ERRORs in the log' } },
  kakao: { kind: 'whack', title: { ko: '유휴 서버 두더지', en: 'Idle-server whack-a-mole' } },
};
const FLOOR_TEX = {};
function floorTex(kind, base) {
  if (FLOOR_TEX[kind]) return FLOOR_TEX[kind];
  const t = canvasTex(512, 512, (g, w, h) => {
    const hex = '#' + base.toString(16).padStart(6, '0'); g.fillStyle = hex; g.fillRect(0, 0, w, h);
    const rnd = (a) => `rgba(0,0,0,${a})`;
    if (kind === 'tile') { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = rnd(0.05 + Math.random() * 0.1); g.fillRect(x * 128 + 3, y * 128 + 3, 122, 122); } g.strokeStyle = rnd(0.45); g.lineWidth = 4; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(w, i * 128); g.stroke(); } }
    else if (kind === 'wood') { for (let y = 0; y < 8; y++) { g.fillStyle = rnd(0.08 + (y % 2) * 0.08); g.fillRect(0, y * 64, w, 60); for (let i = 0; i < 12; i++) { g.fillStyle = rnd(Math.random() * 0.15); g.fillRect(Math.random() * w, y * 64 + Math.random() * 60, 60 + Math.random() * 120, 2); } } }
    else if (kind === 'grass') { for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(${40 + Math.random() * 60},${120 + Math.random() * 80},${40 + Math.random() * 40},.5)`; g.fillRect(Math.random() * w, Math.random() * h, 3, 5 + Math.random() * 6); } }
    else if (kind === 'sand') { for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${150 + Math.random() * 100},${120 + Math.random() * 80},${60 + Math.random() * 40},.35)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } for (let y = 0; y < h; y += 40) { g.strokeStyle = rnd(0.07); g.lineWidth = 6; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w / 3, y + 20, 2 * w / 3, y - 20, w, y); g.stroke(); } }
    else if (kind === 'metal') { g.strokeStyle = rnd(0.5); g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; g.fillRect(x * 64 + 4, y * 64 + 4, 56, 56); } }
    else if (kind === 'carpet') { for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.25})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; FLOOR_TEX[kind] = t; return t;
}
const FLOOR_KIND = { seoul: 'tile', israel: 'sand', pc: 'carpet', univ: 'grass', kunhwa: 'carpet', alphago: 'wood', bootcamp: 'wood', tmax: 'carpet', lgcns: 'tile', kakao: 'metal', goal: 'tile' };
const CAT_COLOR = { lang: 0xf6c400, back: 0x6db33f, data: 0x4fa3ff, infra: 0xff8c42, ai: 0xd36bff };

const world = new THREE.Group(); scene.add(world);
const allRacks = []; const storyPanels = []; const rooms = []; const interact = []; const colliders = []; const spinners = []; const ledSets = []; const bugs = []; const shots = []; const bursts = [];
let z0 = 0, TOTAL_LEN = 0;
function buildWorld() {
  D.stages.forEach((st, i) => {
    const len = LEN[st.id] || (st.company ? LEN[st.company] : LEN.default);
    const r = { st, i, z0, z1: z0 - len, cx: 0, w: ROOM_W, len, chips: [], door: null, needs: [] };
    rooms.push(r); buildRoom(r); z0 -= len;
  });
  TOTAL_LEN = -z0;
}

function buildRoom(r) {
  const th = THEMES[r.st.id] || THEMES.kunhwa; const zc = (r.z0 + r.z1) / 2; const g = new THREE.Group(); world.add(g); r.g = g;
  const H = 4.2, W = r.w;
  // 바닥 / 천장 / 벽
  { const ft = floorTex(FLOOR_KIND[r.st.id] || 'tile', th.floor).clone(); ft.needsUpdate = true; ft.repeat.set(W / 2, r.len / 2); add(g, new THREE.PlaneGeometry(W, r.len), mat(0xffffff, { map: ft, roughness: 0.8 }), 0, 0, zc, [-Math.PI / 2, 0, 0]); }
  // 걸레받이 + 문틀 쪽 기둥
  for (const sx of [-1, 1]) add(g, new THREE.BoxGeometry(0.06, 0.18, r.len), mat(0x1a1f2b), sx * (W / 2 - 0.03), 0.09, zc);
  add(g, new THREE.PlaneGeometry(W, r.len), mat(th.ceil), 0, H, zc, [Math.PI / 2, 0, 0]);
  const wm = mat(th.wall, { roughness: 0.9 });
  add(g, new THREE.PlaneGeometry(r.len, H), wm, -W / 2, H / 2, zc, [0, Math.PI / 2, 0]);
  add(g, new THREE.PlaneGeometry(r.len, H), wm, W / 2, H / 2, zc, [0, -Math.PI / 2, 0]);
  // 벽화(하늘) — 양쪽 벽 윗부분
  if (th.sky) { const sky = canvasTex(1024, 256, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, th.sky[0]); gr.addColorStop(0.6, th.sky[1]); gr.addColorStop(1, th.sky[2]); c.fillStyle = gr; c.fillRect(0, 0, w, h); }); for (const sx of [-1, 1]) add(g, new THREE.PlaneGeometry(r.len - 0.4, 1.6), new THREE.MeshBasicMaterial({ map: sky }), sx * (W / 2 - 0.02), 2.2, zc, [0, -sx * Math.PI / 2, 0]); }
  // 입구 간판 (방 시작 부분, 플레이어가 -z 방향으로 보며 진입)
  const sz = r.z0 - 4.5;
  add(g, new THREE.PlaneGeometry(3.0, 0.75), new THREE.MeshBasicMaterial({ map: textTex([L(r.st.title)], { bg: '#14213d', fg: '#ffffff', font: 'bold 54px "Noto Sans KR", sans-serif', sub: `${r.st.year} · STAGE ${r.i + 1} / ${D.stages.length}` }), toneMapped: false }), 0, 3.35, sz, [-0.22, 0, 0]);
  add(g, new THREE.BoxGeometry(3.15, 0.9, 0.06), mat(0x0b1020), 0, 3.35, sz - 0.04, [-0.22, 0, 0]);
  for (const sx of [-1.4, 1.4]) add(g, new THREE.CylinderGeometry(0.015, 0.015, 0.5, 6), mat(0x888), sx, H - 0.25, sz - 0.1);
  // 천장 조명 바
  for (const sx of [-1.6, 1.6]) add(g, new THREE.BoxGeometry(0.14, 0.04, r.len - 3), new THREE.MeshStandardMaterial({ color: th.light, emissive: th.light, emissiveIntensity: 0.7 }), sx, H - 0.03, zc);
  if (r.st.goal) add(g, new THREE.PlaneGeometry(W, H), wm, 0, H / 2, r.z1 + 0.02);
  // 진행 방향 표시: 바닥 화살표(문 쪽으로 흐름)
  if (!r.st.goal) { const chevMat = new THREE.MeshBasicMaterial({ map: chevronTex(), transparent: true, opacity: 0.35, depthWrite: false, color: 0x7fe7ff }); r.chevrons = []; for (let z = r.z0 - 2.5; z > r.z1 + 2.5; z -= 2.6) { const c = add(g, new THREE.PlaneGeometry(0.7, 0.5), chevMat.clone(), 0, 0.012, z, [-Math.PI / 2, 0, 0]); r.chevrons.push(c); } }
  // 스토리 패널 (자막 내용을 벽에 적어 둠) — 오른쪽 벽, 입구 근처
  { const fz = r.z1 + 0.2, fx = -3.0; const fr = new THREE.Group(); fr.position.set(fx, 1.75, fz); g.add(fr);
    add(fr, new THREE.BoxGeometry(1.25, 0.95, 0.06), mat(0x6b4a2b, { roughness: 0.6 }), 0, 0, 0); const pic = add(fr, new THREE.PlaneGeometry(1.1, 0.8), new THREE.MeshBasicMaterial({ map: frameTex(r), toneMapped: false }), 0, 0, 0.035);
    const lab = makeLabel('📖 STORY', { color: '#ffd84d', size: 0.8 }); lab.position.set(0, 0.8, 0.1); fr.add(lab); storyPanels.push({ r, panel: pic });
    interact.push({ kind: 'story', r, obj: fr, lab, pos: new THREE.Vector3(fx, 1.75, fz), rad: 3.8, label: () => '📖 ' + T().story, action: () => openStoryCard(r) }); }
  // 테마 소품
  (PROPS[r.st.id] || PROPS.office)(g, r, th);
  // 스킬 칩
  const coins = [...(r.st.coins || []), ...(EXTRA_COINS[r.st.id] || [])];
  coins.forEach((id, k) => {
    const sk = D.skills[id]; const n = coins.length; let x, z;
    if (n > 4) { const sp = (r.len - 7) / Math.ceil(n / 2); x = k % 2 ? 2.7 : -2.7; z = r.z0 - 3.8 - Math.floor(k / 2) * sp; }
    else { const ang = (k / n) * Math.PI * 2; x = Math.cos(ang) * 1.5; z = zc - 1.2 + Math.sin(ang) * 1.5; }
    const chip = new THREE.Group(); chip.position.set(x, 0, z); g.add(chip);
    const col = CAT_COLOR[sk.cat] || 0xffffff;
    const core = add(chip, new THREE.OctahedronGeometry(0.22, 0), new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.9, roughness: 0.3 }), 0, 1.2, 0);
    add(chip, new THREE.TorusGeometry(0.34, 0.02, 8, 32), glowMat(col), 0, 1.2, 0, [Math.PI / 2, 0, 0]);
    add(chip, new THREE.CircleGeometry(0.35, 24), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.25 }), 0, 0.01, 0, [-Math.PI / 2, 0, 0]);
    const lab = makeLabel(`${sk.ic} ${sk.n}`, { color: '#' + col.toString(16).padStart(6, '0'), size: r.st.id === 'kakao' ? 0.65 : 0.85 }); lab.position.set(0, 1.85, 0); chip.add(lab);
    spinners.push({ m: core, bob: 1.2, spin: 1.6 });
    const it = { kind: 'chip', id, r, obj: chip, mesh: core, lab, pos: new THREE.Vector3(x, 1.2, z), rad: 2.2, near: 1.0, label: () => '⚡ ' + T().chip(sk.n), action: () => collectChip(it) };
    interact.push(it); r.chips.push(it); r.needs.push(id);
    if (S.chips.has(id)) chip.visible = false;
  });
  // 업적 트로피
  (r.st.achievements || []).forEach((id, k) => {
    const a = D.achievements[id]; const x = -1.2 - k * 0.9, z = r.z0 - 2.0;
    const tr = new THREE.Group(); tr.position.set(x, 0, z); g.add(tr);
    add(tr, new THREE.CylinderGeometry(0.18, 0.22, 0.7, 10), mat(0x2a2f3a), 0, 0.35, 0);
    add(tr, new THREE.CylinderGeometry(0.12, 0.06, 0.2, 12), new THREE.MeshStandardMaterial({ color: 0xffc83c, emissive: 0xffa500, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.3 }), 0, 0.85, 0);
    add(tr, new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), mat(0xffc83c, { metalness: 0.8, roughness: 0.3 }), 0, 0.72, 0);
    const lab = makeLabel(`${a.ic} ${L(a.n)}`, { color: '#ffd166', size: 0.8 }); lab.position.set(0, 1.35, 0); tr.add(lab);
    const it = { kind: 'ach', id, r, obj: tr, lab, pos: new THREE.Vector3(x, 0.9, z), rad: 2.0, near: 1.0, label: () => '🏆 ' + T().ach(L(a.n)), action: () => collectAch(it) };
    interact.push(it);
    if (S.ach.has(id)) tr.visible = false;
  });
  // 버그 (쏴서 잡는 표적)
  if (!r.st.goal) for (let k = 0; k < (r.len > 14 ? 2 : 1); k++) {
    const id = `${r.st.id}-${k}`; const b = new THREE.Group(); g.add(b);
    const body = add(b, new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2020, emissiveIntensity: 0.9, roughness: 0.4 }), 0, 0, 0); body.scale.set(1, 0.8, 1.3);
    add(b, new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0x550000 }), 0, 0.03, 0.15);
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xffd6d6, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const w1 = add(b, new THREE.PlaneGeometry(0.22, 0.12), wingMat, -0.14, 0.08, 0, [-Math.PI / 2, 0, 0.3]), w2 = add(b, new THREE.PlaneGeometry(0.22, 0.12), wingMat, 0.14, 0.08, 0, [-Math.PI / 2, 0, -0.3]);
    for (const sx of [-1, 1]) for (let l = 0; l < 3; l++) add(b, new THREE.CylinderGeometry(0.008, 0.008, 0.14, 4), mat(0x330000), sx * 0.12, -0.08, -0.06 + l * 0.06, [0, 0, sx * 0.9]);
    const bug = { id, r, g: b, w1, w2, cx: (k % 2 ? 1.3 : -1.3) + Math.random() * 0.8, cz: zc + (k - 0.5) * (r.len / 4), a: 0.6 + Math.random() * 0.5, b: 0.4 + Math.random() * 0.4, c: 1 + Math.random(), ph: Math.random() * 9, dead: S.bugs.has(id) };
    b.visible = !bug.dead; bugs.push(bug);
  }
  // 문 (방 끝). 마지막 방은 포털
  if (!r.st.goal) {
    const dz = r.z1; const frame = mat(0x1a1f2b, { metalness: 0.5, roughness: 0.5 });
    add(g, new THREE.BoxGeometry((W - 2.6) / 2, H, 0.3), wm, -(W / 4 + 0.65), H / 2, dz);
    add(g, new THREE.BoxGeometry((W - 2.6) / 2, H, 0.3), wm, (W / 4 + 0.65), H / 2, dz);
    add(g, new THREE.BoxGeometry(2.6, H - 2.7, 0.3), wm, 0, H - (H - 2.7) / 2, dz);
    add(g, new THREE.BoxGeometry(2.9, 0.12, 0.4), frame, 0, 2.72, dz); for (const sx of [-1.36, 1.36]) add(g, new THREE.BoxGeometry(0.12, 2.7, 0.4), frame, sx, 1.35, dz);
    const door = new THREE.Group(); door.position.set(0, 0, dz); g.add(door);
    const panel = add(door, new THREE.BoxGeometry(2.5, 2.6, 0.1), mat(0x27304a, { metalness: 0.6, roughness: 0.35 }), 0, 1.3, 0);
    const lamp = add(door, new THREE.BoxGeometry(0.5, 0.08, 0.06), glowMat(0xff4d4d), 0, 2.78, 0.22);
    add(door, new THREE.PlaneGeometry(1.2, 0.34), new THREE.MeshBasicMaterial({ map: textTex([`${rooms[r.i + 1] ? rooms[r.i + 1].st.year : ''} ▶`], { bg: '#0b1020', fg: '#7fe7ff', font: 'bold 70px "IBM Plex Mono", monospace', w: 512, h: 144 }), toneMapped: false }), 0, 3.15, 0.22);
    const lab = makeLabel('🚪', { color: '#9fefb0', size: 0.7 }); lab.position.set(0, 2.1, 0.3); door.add(lab); lab.visible = false;
    r.door = { g: door, panel, lamp, lab, open: true, t: 0 }; lamp.material.color.setHex(0x39ff6a); panel.position.y = 1.3 + 2.55;
    interact.push({ kind: 'door', r, obj: door, lab, pos: new THREE.Vector3(0, 1.3, dz), rad: 3.0, label: () => '🚪 ' + T().door, action: () => {} });
  }
}

// ---------------------------------------------------------------- 테마 소품
function tree(g, x, z, s = 1) { add(g, new THREE.CylinderGeometry(0.08 * s, 0.12 * s, 1.2 * s, 7), mat(0x5a3a1e), x, 0.6 * s, z); add(g, new THREE.ConeGeometry(0.7 * s, 1.4 * s, 8), mat(0x2f8f4e), x, 1.8 * s, z); add(g, new THREE.ConeGeometry(0.5 * s, 1.1 * s, 8), mat(0x3fa85f), x, 2.4 * s, z); colliders.push({ x, z, rad: 0.35 * s }); }
function desk(g, x, z, rotY = 0, withPC = true) { const d = new THREE.Group(); d.position.set(x, 0, z); d.rotation.y = rotY; g.add(d); add(d, rbox(1.4, 0.05, 0.7), mat(0x8a5a36, { roughness: 0.6 }), 0, 0.74, 0); for (const [lx, lz] of [[-0.62, -0.3], [0.62, -0.3], [-0.62, 0.3], [0.62, 0.3]]) add(d, new THREE.CylinderGeometry(0.02, 0.02, 0.72, 6), mat(0x222), lx, 0.36, lz); if (withPC) { add(d, rbox(0.4, 0.32, 0.03), mat(0x1a1d25), 0, 1.0, -0.1); add(d, new THREE.PlaneGeometry(0.36, 0.26), glowMat(0x2456c4), 0, 1.0, -0.08); add(d, new THREE.CylinderGeometry(0.05, 0.1, 0.1, 10), mat(0x1a1d25), 0, 0.81, -0.1); add(d, rbox(0.4, 0.02, 0.14), mat(0x2a2d35), 0, 0.78, 0.15); } colliders.push({ x, z, rad: 0.7 }); return d; }
function lampPost(g, x, z) { add(g, new THREE.CylinderGeometry(0.04, 0.05, 2.6, 8), mat(0x333), x, 1.3, z); add(g, new THREE.SphereGeometry(0.14, 12, 12), glowMat(0xfff1b8), x, 2.65, z); colliders.push({ x, z, rad: 0.15 }); }
function building(g, x, z, w, h, d, color, lit = true) { const b = new THREE.Group(); b.position.set(x, 0, z); g.add(b); add(b, new THREE.BoxGeometry(w, h, d), mat(color, { roughness: 0.9 }), 0, h / 2, 0); if (lit) { const win = canvasTex(128, 256, (c) => { c.fillStyle = color === 0x2b2f44 ? '#171a28' : '#1f2233'; c.fillRect(0, 0, 128, 256); for (let yy = 8; yy < 256; yy += 24) for (let xx = 8; xx < 128; xx += 24) { c.fillStyle = Math.random() < 0.6 ? '#ffe9a0' : '#2a2d3a'; c.fillRect(xx, yy, 14, 14); } }); add(b, new THREE.PlaneGeometry(w * 0.98, h * 0.98), new THREE.MeshBasicMaterial({ map: win }), 0, h / 2, d / 2 + 0.01); } colliders.push({ x, z, rad: Math.max(w, d) / 2 + 0.2 }); }
function wallText(g, r, side, lines, opt = {}, y = 1.9, w = 5, h = 1.6, zOff = 0) { const zc = (r.z0 + r.z1) / 2 + zOff; const m = add(g, new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: textTex(lines, { w: 1024, h: Math.round(1024 * h / w), ...opt }), toneMapped: false }), side * (r.w / 2 - 0.03), y, zc, [0, -side * Math.PI / 2, 0]); return m; }
function rackRow(g, r, zStart, count, idleIdx = []) {
  const ledGeo = new THREE.BoxGeometry(0.016, 0.016, 0.01); const leds = new THREE.InstancedMesh(ledGeo, new THREE.MeshBasicMaterial({ toneMapped: false }), count * 2 * 12 * 2); let li = 0; const m4 = new THREE.Matrix4(); const state = []; const racks = [];
  const frame = mat(0x1a1e29, { metalness: 0.65, roughness: 0.45 }), unit = mat(0x252a3a, { metalness: 0.5, roughness: 0.55 });
  for (let side = -1; side <= 1; side += 2) for (let k = 0; k < count; k++) {
    const x = side * (r.w / 2 - 0.55), z = zStart - k * 0.74; const rk = new THREE.Group(); rk.position.set(x, 0, z); rk.rotation.y = -side * Math.PI / 2; g.add(rk);
    add(rk, new THREE.BoxGeometry(0.62, 2.15, 0.9), frame, 0, 1.075, 0);
    const idle = idleIdx.includes((side + 1) * count + k); const col = idle ? new THREE.Color(0xff3b3b) : new THREE.Color(0x39ff6a);
    for (let u = 0; u < 12; u++) { add(rk, new THREE.BoxGeometry(0.56, 0.115, 0.05), unit, 0, 0.2 + u * 0.16, 0.47); for (let c2 = 0; c2 < 2; c2++) { const lp = new THREE.Vector3(-0.2 + c2 * 0.05, 0.23 + u * 0.16, 0.497).applyMatrix4(rk.matrixWorld.identity().compose(rk.position, rk.quaternion, rk.scale)); m4.makeTranslation(lp.x, lp.y, lp.z); leds.setMatrixAt(li, m4); leds.setColorAt(li, col); state.push({ col, rate: 0.5 + Math.random() * 2, phase: Math.random() * 9, i: li, rack: racks.length }); li++; } }
    colliders.push({ x, z, rad: 0.6, h: 2.2 });
    const id = `${r.st.id}-${side}-${k}`; const lab = makeLabel('💤 IDLE', { color: '#ff8080', size: 0.75 }); lab.position.set(0, 2.5, 0); rk.add(lab); const labOk = makeLabel('✅ NORMAL', { color: '#9fefb0', size: 0.7 }); labOk.position.set(0, 2.5, 0); rk.add(labOk); labOk.visible = false;
    const rackObj = { g: rk, id, idle: idle && !S.racks.has(id), state: [], x, z, side, lab, labOk }; racks.push(rackObj); lab.visible = rackObj.idle; labOk.visible = idle && S.racks.has(id);
    const it = { kind: 'rack', id, r, obj: rk, lab, pos: new THREE.Vector3(x, 1.2, z), rad: 2.4, label: () => (rackObj.idle ? '💤 ' + T().rack : '✅ ' + T().rackDone), action: () => reclaimRack(it, rackObj) }; if (!rackObj.idle && S.racks.has(id)) it.lab = labOk; interact.push(it); rackObj.it = it; it.rack = rackObj;
  }
  leds.count = li; leds.instanceMatrix.needsUpdate = true; leds.instanceColor.needsUpdate = true; g.add(leds);
  state.forEach((s) => racks[s.rack].state.push(s)); racks.forEach((rk) => { rk.state.forEach((s) => s.col.setHex(rk.idle ? 0xff3b3b : 0x39ff6a)); });
  allRacks.push(...racks);
  ledSets.push({ leds, state });
}
// ---------------------------------------------------------------- GLB 모델 (Kenney CC0, assets/models)
const gltfLoader = new GLTFLoader(); const modelCache = {}; const pendingModels = [];
function loadModel(name) {
  if (!modelCache[name]) modelCache[name] = new Promise((res, rej) => gltfLoader.load(`assets/models/${name}.glb`, (gl) => { const sc = gl.scene; sc.traverse((o) => { if (o.isMesh) { o.castShadow = false; if (o.material) { o.material.roughness = Math.min(1, (o.material.roughness ?? 0.8) + 0.1); } } }); res(sc); }, undefined, rej));
  return modelCache[name];
}
// M(group, 모델, x, z, { ry: 회전, h: 목표 높이(m) 또는 w: 목표 폭, col: 충돌 반경(false면 없음), y })
function M(g, name, x, z, o = {}) {
  const holder = new THREE.Group(); holder.position.set(x, o.y || 0, z); holder.rotation.y = o.ry || 0; g.add(holder);
  const pr = loadModel(name).then((src) => {
    const m = src.clone(true); const box = new THREE.Box3().setFromObject(m); const size = box.getSize(new THREE.Vector3());
    const k = o.h ? o.h / size.y : o.w ? o.w / Math.max(size.x, size.z) : 1; m.scale.setScalar(k);
    m.position.set(-(box.min.x + size.x / 2) * k, -box.min.y * k, -(box.min.z + size.z / 2) * k); holder.add(m);
    if (o.col !== false) colliders.push({ x, z, rad: o.col || Math.max(size.x, size.z) * k * 0.45, h: (o.y || 0) + size.y * k });
    holder.userData.size = size.multiplyScalar(k);
  }).catch(() => {});
  pendingModels.push(pr); return holder;
}
// 미니게임 스테이션: 사이드테이블 + 노트북 + 라벨
function station(g, r, x, z, ry = 0) {
  const mg = MINIGAMES[r.st.id]; if (!mg) return; const st = new THREE.Group(); st.position.set(x, 0, z); g.add(st);
  M(st, 'sideTable', 0, 0, { h: 0.75, col: 0.45 }); M(st, 'laptop', 0, 0, { w: 0.42, y: 0.75, ry, col: false });
  const lab = makeLabel('🎮 ' + L(mg.title), { color: '#ff9ad5', size: 0.85 }); lab.position.set(0, 1.5, 0); st.add(lab);
  colliders.push({ x, z, rad: 0.45, h: 0.75 });
  interact.push({ kind: 'mini', r, obj: st, lab, pos: new THREE.Vector3(x, 1.0, z), rad: 2.6, label: () => '🎮 ' + T().mini + ' — ' + L(mg.title) + (S.mini.has(r.st.id) ? ' ✅' : ''), action: () => startMini(r) });
}
// 사무실 세트: 책상 + 의자 + 모니터/키보드/마우스
function workstation(g, x, z, ry = 0, laptop = false) {
  const ws = new THREE.Group(); ws.position.set(x, 0, z); ws.rotation.y = ry; g.add(ws);
  const d = M(ws, 'desk', 0, 0, { w: 1.5, col: false });
  M(ws, 'chairDesk', 0, 0.75, { h: 0.95, ry: Math.PI, col: false });
  loadModel('desk').then(() => { const top = d.userData.size?.y || 0.75; if (laptop) M(ws, 'laptop', 0, -0.05, { w: 0.42, y: top, col: false }); else { M(ws, 'computerScreen', 0, -0.2, { h: 0.45, y: top, col: false }); M(ws, 'computerKeyboard', 0, 0.15, { w: 0.42, y: top, col: false }); M(ws, 'computerMouse', 0.35, 0.15, { w: 0.08, y: top, col: false }); } });
  colliders.push({ x, z, rad: 0.85, h: 0.8 }); return ws;
}
const PROPS = {
  seoul(g, r, th) { const zc = (r.z0 + r.z1) / 2;
    [['building-skyscraper-a', -3.6, zc - 3.5, 3.4], ['building-c', -3.6, zc + 1.2, 2.6], ['low-detail-building-a', -3.6, zc + 4.2, 2.3], ['building-skyscraper-c', 3.6, zc - 1.5, 3.4], ['building-e', 3.6, zc + 3.2, 2.7], ['building-a', 3.6, zc - 5, 2.5]].forEach(([n, x, z, h]) => M(g, n, x, z, { h, ry: x < 0 ? Math.PI / 2 : -Math.PI / 2 }));
    lampPost(g, 2.3, zc - 4); lampPost(g, -2.3, zc + 3.5); M(g, 'bench', -2.2, zc - 1, { w: 1.3, ry: Math.PI / 2 }); M(g, 'trashcan', 2.3, zc + 1, { h: 0.6 });
    wallText(g, r, 1, ['서울 · 1990', '🏥'], { bg: '#2b1b3d', fg: '#ffd59e', font: 'bold 80px "Noto Sans KR", sans-serif' }, 3.3, 3, 1.2, 0); },
  israel(g, r, th) { const zc = (r.z0 + r.z1) / 2;
    [['tree_palmDetailedTall', -3.3, zc - 3.5, 3.8], ['tree_palmBend', 3.2, zc + 2, 3.2], ['tree_palmDetailedShort', -3.0, zc + 3.8, 2.6], ['tree_palmDetailedTall', 3.4, zc - 4.5, 3.9]].forEach(([n, x, z, h]) => M(g, n, x, z, { h, col: 0.35 }));
    [['cactus_tall', 2.6, zc - 1, 1.4], ['cactus_short', -2.4, zc + 1.2, 0.8], ['cactus_short', 3.3, zc + 4.5, 0.9]].forEach(([n, x, z, h]) => M(g, n, x, z, { h, col: 0.3 }));
    [['rock_largeA', -2.6, zc - 0.5, 1.0], ['rock_largeC', 2.8, zc + 3.6, 0.8], ['rock_smallA', -1.2, zc + 4.6, 0.4], ['stone_largeB', 1.6, zc - 5, 0.7]].forEach(([n, x, z, h]) => M(g, n, x, z, { h }));
    add(g, new THREE.SphereGeometry(0.5, 16, 16), glowMat(0xfff1b8), 0, 3.6, zc - 2); M(g, 'sign', 1.6, zc + 1.5, { h: 1.2 }); station(g, r, 0.8, zc - 2.5, 0.3);
    wallText(g, r, 1, ['שלום', 'Israel · 1994'], { bg: '#3b7dd8', fg: '#ffffff', font: 'bold 92px "Noto Sans KR", sans-serif' }, 1.3, 3.4, 1.4, 1); },
  pc(g, r, th) { const zc = (r.z0 + r.z1) / 2;
    const d = M(g, 'desk', 0, r.z0 - 7.2, { w: 1.5, col: 0.8 }); M(g, 'chairDesk', 0, r.z0 - 6.3, { h: 0.95, ry: Math.PI, col: false });
    dos = { c: document.createElement('canvas'), lines: ['C:\\> _'] }; dos.c.width = 320; dos.c.height = 240; dos.tex = new THREE.CanvasTexture(dos.c); dos.tex.colorSpace = THREE.SRGBColorSpace;
    loadModel('desk').then(() => { const top = d.userData.size?.y || 0.75; const crt = new THREE.Group(); crt.position.set(0, top, r.z0 - 7.35); g.add(crt); add(crt, rbox(0.5, 0.45, 0.48), mat(0xd9d3c2, { roughness: 0.85 }), 0, 0.24, 0); add(crt, rbox(0.52, 0.14, 0.5), mat(0xc9c3b2), 0, -0.07 + 0.07, 0.0); add(crt, new THREE.PlaneGeometry(0.38, 0.28), new THREE.MeshBasicMaterial({ map: dos.tex, toneMapped: false }), 0, 0.26, 0.245); M(g, 'computerKeyboard', 0, r.z0 - 6.95, { w: 0.42, y: top, col: false }); });
    M(g, 'bedSingle', -3.0, zc - 1.5, { w: 2.0, ry: Math.PI / 2 }); M(g, 'bookcaseOpen', 3.5, zc - 3.5, { h: 1.9, ry: -Math.PI / 2 }); M(g, 'lampSquareFloor', 3.4, zc + 1.5, { h: 1.5 }); M(g, 'rugRectangle', 0, zc + 1.5, { w: 2.6, col: false }); M(g, 'cardboardBoxClosed', -3.2, zc + 3.5, { h: 0.5 }); M(g, 'cardboardBoxOpen', -2.4, zc + 3.8, { h: 0.45 }); M(g, 'speaker', 1.2, r.z0 - 7.3, { h: 0.5 }); M(g, 'books', -1.1, r.z0 - 7.2, { w: 0.35, col: false });
    add(g, new THREE.PlaneGeometry(1.4, 1.0), new THREE.MeshBasicMaterial({ map: textTex(['FLASH', 'ANIMATION'], { bg: '#c0392b', fg: '#fff', font: 'bold 90px "IBM Plex Mono", monospace', w: 700, h: 500 }) }), r.w / 2 - 0.04, 2.2, zc - 1, [0, -Math.PI / 2, 0]);
    interact.push({ kind: 'pc', r, obj: d, pos: new THREE.Vector3(0, 1.2, r.z0 - 7.2), rad: 2.6, label: () => '💾 ' + T().pc, action: () => openDos(r) }); const lab = makeLabel('💾 486 PC', { color: '#9fc0ff', size: 0.85 }); lab.position.set(0, 1.9, 0); d.add(lab); },
  univ(g, r, th) { const zc = (r.z0 + r.z1) / 2;
    [['tree_oak', -3.3, zc - 3.5, 3.6], ['tree_detailed', 3.3, zc - 1, 3.4], ['tree_default', -3.2, zc + 3, 3.0], ['tree_pineRoundA', 3.2, zc + 4.2, 3.2]].forEach(([n, x, z, h]) => M(g, n, x, z, { h, col: 0.4 }));
    [['plant_bushDetailed', -2.2, zc - 1.2, 0.8], ['plant_bushDetailed', 2.4, zc + 2.5, 0.7], ['flower_redA', -1.6, zc + 1.5, 0.4], ['flower_yellowA', 1.8, zc - 3.5, 0.4], ['grass_large', 0.8, zc + 4, 0.35], ['rock_smallA', -2.8, zc + 5, 0.4]].forEach(([n, x, z, h]) => M(g, n, x, z, { h, col: false }));
    M(g, 'bench', 2.6, zc + 1, { w: 1.6, ry: -Math.PI / 2 }); M(g, 'bench', -2.6, zc + 5, { w: 1.6, ry: Math.PI / 2 }); lampPost(g, 0.9, zc - 5); station(g, r, -1.0, zc - 3.5);
    wallText(g, r, -1, ['HANYANG UNIVERSITY', '도시공학과 · 2009 – 2015'], { bg: '#1b3f8f', fg: '#ffffff', font: 'bold 64px "Noto Sans KR", sans-serif' }, 1.3, 5, 1.5, -1); },
  kunhwa(g, r, th) { const zc = (r.z0 + r.z1) / 2;
    for (const [x, z] of [[-2.8, zc - 2.5], [-2.8, zc + 0.5], [2.8, zc - 2.5], [2.8, zc + 0.5]]) workstation(g, x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2);
    M(g, 'bookcaseClosedWide', 2.8, zc + 4.2, { h: 1.9, ry: -Math.PI / 2 }); M(g, 'pottedPlant', -3.3, zc + 4, { h: 1.1 }); M(g, 'trashcan', -2.0, zc - 4.6, { h: 0.6 }); M(g, 'kitchenCoffeeMachine', 3.3, zc - 5, { h: 0.45, y: 0.75, col: false }); M(g, 'sideTable', 3.3, zc - 5, { h: 0.75 }); station(g, r, 0, zc + 3.5);
    const map = canvasTex(1024, 768, (c, w, h) => { c.fillStyle = '#eef1e6'; c.fillRect(0, 0, w, h); c.strokeStyle = '#8a94a6'; c.lineWidth = 6; for (let x = 60; x < w; x += 140) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 40, h); c.stroke(); } for (let y = 60; y < h; y += 120) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + 30); c.stroke(); } c.fillStyle = '#c6d9a8'; for (let i = 0; i < 14; i++) c.fillRect(Math.random() * w, Math.random() * h, 90, 60); c.fillStyle = '#1c1f26'; c.font = 'bold 54px "Noto Sans KR", sans-serif'; c.fillText('파주운정3지구 택지개발 · 도시계획도', 40, 70); });
    add(g, new THREE.PlaneGeometry(5, 3.75 * 0.75), new THREE.MeshBasicMaterial({ map }), -r.w / 2 + 0.03, 2.2, zc, [0, Math.PI / 2, 0]);
    wallText(g, r, 1, ['(주)건화', '도시계획부 · 2015 – 2016'], { bg: '#8a94a6', fg: '#1c1f26', font: 'bold 72px "Noto Sans KR", sans-serif' }, 2.3, 4, 1.4, -1); },
  alphago(g, r, th) { const zc = (r.z0 + r.z1) / 2;
    const tv = canvasTex(1024, 640, (c, w, h) => { c.fillStyle = '#0a0d14'; c.fillRect(0, 0, w, h); c.fillStyle = '#d9b36a'; c.fillRect(60, 60, 520, 520); c.strokeStyle = '#1c1f26'; c.lineWidth = 2; for (let i = 0; i < 19; i++) { const p = 80 + i * 26.6; c.beginPath(); c.moveTo(p, 80); c.lineTo(p, 560); c.stroke(); c.beginPath(); c.moveTo(80, p); c.lineTo(560, p); c.stroke(); } for (let i = 0; i < 120; i++) { c.fillStyle = i % 2 ? '#111' : '#f3f3f3'; c.beginPath(); c.arc(80 + Math.floor(Math.random() * 19) * 26.6, 80 + Math.floor(Math.random() * 19) * 26.6, 11, 0, 7); c.fill(); } c.fillStyle = '#fff'; c.font = 'bold 60px "Noto Sans KR", sans-serif'; c.fillText('AlphaGo  4 : 1  이세돌', 620, 200); c.font = '40px "IBM Plex Mono", monospace'; c.fillStyle = '#9fc0ff'; c.fillText('2016.03.15 · BREAKING', 620, 270); c.fillStyle = '#f6c400'; c.font = 'bold 44px "Noto Sans KR", sans-serif'; c.fillText('"개발자가 돼야겠네요."', 620, 400); });
    add(g, new THREE.BoxGeometry(4.2, 2.7, 0.15), mat(0x111), r.w / 2 - 0.12, 2.0, zc, [0, -Math.PI / 2, 0]); add(g, new THREE.PlaneGeometry(4, 2.5), new THREE.MeshBasicMaterial({ map: tv, toneMapped: false }), r.w / 2 - 0.2, 2.0, zc, [0, -Math.PI / 2, 0]);
    M(g, 'cabinetTelevision', r.w / 2 - 0.5, zc, { w: 2.0, ry: -Math.PI / 2 }); M(g, 'loungeSofa', 0.6, zc, { w: 2.2, ry: -Math.PI / 2 }); M(g, 'tableCoffee', 1.9, zc, { w: 1.0, ry: Math.PI / 2 }); M(g, 'rugRound', 1.4, zc, { w: 3.0, col: false }); M(g, 'lampRoundTable', -1.0, zc - 2.5, { h: 0.6, y: 0.5, col: false }); M(g, 'sideTable', -1.0, zc - 2.5, { h: 0.5 }); M(g, 'pottedPlant', -3.3, zc + 3, { h: 1.2 }); M(g, 'kitchenCoffeeMachine', -3.2, zc - 3.5, { h: 0.45, y: 0.75, col: false }); M(g, 'table', -3.2, zc - 3.5, { w: 1.2 }); M(g, 'radio', -3.0, zc - 3.3, { w: 0.35, y: 0.75, col: false }); station(g, r, -1.6, zc + 3, 0.4); },
  bootcamp(g, r, th) { const zc = (r.z0 + r.z1) / 2;
    for (const z of [zc - 2.5, zc - 0.3, zc + 1.9]) for (const x of [-2.6, 2.6]) workstation(g, x, z, Math.PI, true);
    const wb = canvasTex(1024, 512, (c, w, h) => { c.fillStyle = '#fbfbf6'; c.fillRect(0, 0, w, h); c.fillStyle = '#1c1f26'; c.font = 'bold 40px "IBM Plex Mono", monospace'; ['#include <stdio.h>', 'int main() {', '  printf("hello, world\\n");', '  return 0;', '}', '', 'C/C++ → 자료구조 → Java → Android → Spring'].forEach((l, i) => c.fillText(l, 40, 70 + i * 56)); c.fillStyle = '#c0392b'; c.font = 'bold 36px "Noto Sans KR", sans-serif'; c.fillText('프로그래밍은 언어보다 수학에 가깝다', 40, 470); });
    add(g, new THREE.PlaneGeometry(5, 2.5), new THREE.MeshBasicMaterial({ map: wb }), -r.w / 2 + 0.08, 2.1, zc - 1, [0, Math.PI / 2, 0]); add(g, new THREE.BoxGeometry(0.06, 2.7, 5.2), mat(0x6b6b6b), -r.w / 2 + 0.04, 2.1, zc - 1);
    M(g, 'coatRackStanding', 3.6, r.z0 - 5.5, { h: 1.8 }); M(g, 'trashcan', -3.6, r.z0 - 5.5, { h: 0.6 }); M(g, 'bookcaseOpen', -3.6, zc + 4.5, { h: 1.9, ry: Math.PI / 2 }); station(g, r, 0, zc + 4.3, Math.PI); },
  office(g, r, th) { const zc = (r.z0 + r.z1) / 2;
    for (const [x, z] of [[-2.8, zc - 2], [-2.8, zc + 1], [2.8, zc - 2], [2.8, zc + 1]]) workstation(g, x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2);
    M(g, 'bookcaseClosedWide', -2.8, zc + 4.2, { h: 1.9, ry: Math.PI / 2 }); M(g, 'pottedPlant', 3.3, zc + 4, { h: 1.1 }); M(g, 'kitchenCoffeeMachine', 3.3, zc - 5, { h: 0.45, y: 0.75, col: false }); M(g, 'sideTable', 3.3, zc - 5, { h: 0.75 }); station(g, r, 0, zc + 3.8);
    const o = r.st.objects?.[0] || {}; wallText(g, r, 1, [o.sign || L(r.st.title), L(r.st.title)], { bg: o.color || '#3b6fd6', fg: '#fff', font: 'bold 80px "Noto Sans KR", sans-serif' }, 2.3, 4.5, 1.4, -1); },
  lgcns(g, r, th) { const zc = (r.z0 + r.z1) / 2;
    add(g, rbox(2.6, 1.0, 0.7, 0.04), mat(0xc8323c, { roughness: 0.5 }), 0, 0.5, r.z0 - 4); add(g, new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: textTex(['LG CNS'], { bg: '#c8323c', fg: '#fff', font: 'bold 120px "Noto Sans KR", sans-serif', w: 800, h: 200 }), toneMapped: false }), 0, 0.55, r.z0 - 3.64); colliders.push({ x: 0, z: r.z0 - 4, rad: 1.4 });
    M(g, 'computerScreen', 0.5, r.z0 - 4.1, { h: 0.45, y: 1.0, col: false }); M(g, 'pottedPlant', -1.8, r.z0 - 4, { h: 1.2 }); M(g, 'pottedPlant', 1.8, r.z0 - 4, { h: 1.2 });
    const dia = canvasTex(1280, 640, (c, w, h) => { c.fillStyle = '#fbfbf6'; c.fillRect(0, 0, w, h); const box = (x, y, t, col = '#2456c4') => { c.fillStyle = col; c.fillRect(x, y, 240, 90); c.fillStyle = '#fff'; c.font = 'bold 34px "IBM Plex Mono", monospace'; c.textAlign = 'center'; c.fillText(t, x + 120, y + 56); }; const arrow = (x1, y1, x2, y2) => { c.strokeStyle = '#1c1f26'; c.lineWidth = 5; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }; box(60, 60, 'SOL App', '#1b4f9c'); box(60, 420, 'KB E-Wallet', '#f6c400'); box(520, 240, 'DevOn Boot F/W', '#c8323c'); box(980, 60, 'Redis'); box(980, 240, 'Kafka'); box(980, 420, 'K8S / AWS'); arrow(300, 105, 520, 270); arrow(300, 465, 520, 300); arrow(760, 270, 980, 105); arrow(760, 285, 980, 285); arrow(760, 300, 980, 465); c.fillStyle = '#1c1f26'; c.textAlign = 'left'; c.font = 'bold 40px "Noto Sans KR", sans-serif'; c.fillText('금융권 MSA · 프레임워크 개발자 2017 – 2022', 60, 600); });
    add(g, new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ map: dia }), -r.w / 2 + 0.03, 2.2, zc - 1, [0, Math.PI / 2, 0]);
    wallText(g, r, 1, ['신한은행 SOL · KB국민은행 · DevOn', 'Java 사내강사 · 신입 프로젝트 대상'], { bg: '#9a2a33', fg: '#fff', font: 'bold 56px "Noto Sans KR", sans-serif' }, 2.3, 6, 1.6, -1);
    station(g, r, 0, zc + 1.0); M(g, 'loungeDesignSofa', 3.4, zc + 2.5, { w: 1.8, ry: -Math.PI / 2 }); M(g, 'tableCoffee', 2.4, zc + 2.5, { w: 0.8 }); M(g, 'loungeDesignSofa', 3.4, zc + 5, { w: 1.8, ry: -Math.PI / 2 }); for (const z of [zc + 2.5, zc + 5]) workstation(g, -3.3, z, Math.PI / 2); },
  kakao(g, r, th) { const zc = (r.z0 + r.z1) / 2;
    rackRow(g, r, r.z0 - 3.5, 9, [1, 4, 7, 19, 22, 25]);
    wallText(g, r, 1, ['kakao', '인프라개발팀 · 2022 –'], { bg: '#f6c400', fg: '#1c1f26', font: 'bold 110px "Noto Sans KR", sans-serif' }, 3.4, 3.2, 1.0, 7.5);
    add(g, new THREE.PlaneGeometry(3.2, 1.0), new THREE.MeshBasicMaterial({ map: textTex(['230,000 SERVERS', '4,000+ USERS'], { bg: '#0b0f1c', fg: '#39ff6a', font: 'bold 70px "IBM Plex Mono", monospace', w: 1024, h: 320 }), toneMapped: false }), 0, 3.3, r.z1 + 0.2);
    station(g, r, 0, zc + 0.5, Math.PI); M(g, 'kitchenCoffeeMachine', 1.6, r.z1 + 3.4, { h: 0.45, y: 0.75, col: false }); M(g, 'sideTable', 1.6, r.z1 + 3.4, { h: 0.75 }); M(g, 'cardboardBoxClosed', -1.8, r.z1 + 3.6, { h: 0.5 }); M(g, 'cardboardBoxOpen', -2.3, r.z1 + 2.9, { h: 0.45 }); },
  goal(g, r, th) { const zc = (r.z0 + r.z1) / 2; const portal = new THREE.Group(); portal.position.set(0, 0, r.z1 + 1.0); g.add(portal); add(portal, new THREE.TorusGeometry(1.3, 0.08, 12, 48), glowMat(0xf6c400), 0, 1.5, 0); add(portal, new THREE.CircleGeometry(1.25, 48), new THREE.MeshBasicMaterial({ color: 0xfff3c4, transparent: true, opacity: 0.85, toneMapped: false }), 0, 1.5, 0); const lab = makeLabel('🚩 2026 · NEXT STAGE', { color: '#f6c400' }); lab.position.set(0, 3.0, 0); portal.add(lab); for (let i = 0; i < 6; i++) { const col = Object.values(CAT_COLOR)[i % 5]; const p = add(g, new THREE.OctahedronGeometry(0.12, 0), glowMat(col), Math.cos(i) * 2.5, 1.0 + i * 0.3, zc + Math.sin(i * 2) * 2); spinners.push({ m: p, bob: p.position.y, spin: 1 + i * 0.2 }); } M(g, 'pottedPlant', -3.2, zc, { h: 1.3 }); M(g, 'pottedPlant', 3.2, zc, { h: 1.3 }); interact.push({ kind: 'portal', r, obj: portal, lab, pos: new THREE.Vector3(0, 1.5, r.z1 + 1.0), rad: 3.0, label: () => '🚩 ' + T().portal, action: () => openCard('final') }); },
};
PROPS.tmax = PROPS.office;
let dos = null;
buildWorld();

// ---------------------------------------------------------------- 플레이어
const P = { x: 0, z: -0.9, y: 0, vy: 0, yaw: 0, pitch: 0, vx: 0, vz: 0, bob: 0 };
if (S.savePos) { P.x = S.savePos.x; P.z = S.savePos.z; P.yaw = S.savePos.yaw || 0; }
const EYE = 1.6, SPEED = 3.0, RADIUS = 0.35;
const keys = {};
addEventListener('keydown', (e) => { if (e.repeat) return; keys[e.code] = true; if (S.crawl && ['Space', 'Enter', 'KeyE', 'Escape'].includes(e.code)) { e.preventDefault(); endCrawl(); return; } if (e.code === 'Space' && S.playing && $('modal').hidden) { e.preventDefault(); jump(); } if (S.auto && !['Escape', 'KeyE'].includes(e.code)) stopAuto(); if (e.code === 'KeyE' || e.code === 'Enter') { if (!$('modal').hidden) closeCard(); else if (S.playing) doInteract(); } if (e.code === 'Escape') { if (!$('modal').hidden) closeCard(); } if (e.code === 'KeyR' && e.shiftKey) resetAll(); });
addEventListener('keyup', (e) => { keys[e.code] = false; });
const canvas = renderer.domElement;
canvas.addEventListener('click', () => { if (S.crawl) { endCrawl(); return; } if (!S.playing || !$('modal').hidden) return; if (S.locked) { fire(); return; } if (!isTouch && canvas.requestPointerLock) canvas.requestPointerLock().catch?.(() => {}); });
document.addEventListener('pointerlockchange', () => { S.locked = document.pointerLockElement === canvas; document.body.classList.toggle('locked', S.locked); if (!S.locked && S.playing && $('modal').hidden && !S.auto) toast(T().clickToPlay); });
document.addEventListener('mousemove', (e) => { if (S.locked) { P.yaw -= e.movementX * 0.0022; P.pitch = Math.max(-1.3, Math.min(1.3, P.pitch - e.movementY * 0.0022)); } });
// 드래그 시점 (포인터락 없을 때 / 터치)
let drag = null;
canvas.addEventListener('pointerdown', (e) => { if (S.locked) return; drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: 0 }; });
canvas.addEventListener('pointermove', (e) => { if (!drag || drag.id !== e.pointerId) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy); P.yaw -= dx * 0.004; P.pitch = Math.max(-1.3, Math.min(1.3, P.pitch - dy * 0.004)); if (S.auto && drag.moved > 20) stopAuto(); });
canvas.addEventListener('pointerup', (e) => { if (drag && drag.id === e.pointerId) { if (drag.moved < 6 && isTouch && S.playing && $('modal').hidden) fire(); drag = null; } });
canvas.addEventListener('pointercancel', () => { drag = null; });
// 조이스틱
const joy = { dx: 0, dy: 0, id: null };
const joyEl = $('joy'), knob = $('joy-knob');
joyEl.addEventListener('pointerdown', (e) => { joy.id = e.pointerId; joyEl.setPointerCapture(e.pointerId); joyMove(e); });
joyEl.addEventListener('pointermove', (e) => { if (joy.id === e.pointerId) joyMove(e); });
const joyEnd = (e) => { if (joy.id === e.pointerId) { joy.id = null; joy.dx = joy.dy = 0; knob.style.transform = ''; } };
joyEl.addEventListener('pointerup', joyEnd); joyEl.addEventListener('pointercancel', joyEnd);
function joyMove(e) { const r = joyEl.getBoundingClientRect(); let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2); const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } joy.dx = dx; joy.dy = dy; knob.style.transform = `translate(${dx * 36}px, ${dy * 36}px)`; if (S.auto) stopAuto(); }
$('btn-e').addEventListener('pointerdown', (e) => { e.preventDefault(); doInteract(); });

function jump() { if (P.y <= 0.001 && P.vy === 0) { P.vy = 5.6; tone(260, 0, 0.06, 'triangle', 0.02); } }
function roomAt(z) { return rooms.find((r) => z <= r.z0 && z > r.z1) || rooms[rooms.length - 1]; }
function movePlayer(dt) {
  let fx = 0, fz = 0;
  if (S.crawl) { /* 자막 재생 중엔 멈춤 */ }
  else if (!S.auto) {
    const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0), s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    fx = s - joy.dx * -1; fz = f + joy.dy * -1; fx = s + joy.dx; fz = f - joy.dy;
    const m = Math.hypot(fx, fz); if (m > 1) { fx /= m; fz /= m; }
  } else if (auto) { const a = autoStep(dt); fx = a.x; fz = a.z; }
  // 로컬 → 월드 (yaw 0 = -z 방향)
  const sin = Math.sin(P.yaw), cos = Math.cos(P.yaw);
  const wx = fx * cos - fz * sin, wz = -fz * cos - fx * sin;
  const sp = SPEED * (keys.ShiftLeft ? 1.6 : 1);
  P.vx += (wx * sp - P.vx) * Math.min(1, dt * 9); P.vz += (wz * sp - P.vz) * Math.min(1, dt * 9);
  let nx = P.x + P.vx * dt, nz = P.z + P.vz * dt;
  // 벽
  const lim = ROOM_W / 2 - RADIUS; nx = Math.max(-lim, Math.min(lim, nx));
  // 문: 잠긴 문은 통과 불가, 열린 문은 가운데(폭 2.5)만 통과
  for (const r of rooms) { if (!r.door) continue; const dz = r.z1; const crossing = (P.z > dz && nz <= dz + RADIUS) || (P.z <= dz && nz > dz - RADIUS); const inGap = Math.abs(nx) < 1.1; if (crossing && (!r.door.open || !inGap)) { nz = P.z > dz ? dz + RADIUS + 0.01 : dz - RADIUS - 0.01; P.vz = 0; } else if (Math.abs(nz - dz) < RADIUS + 0.2 && !inGap) { nz = P.z > dz ? Math.max(nz, dz + RADIUS + 0.21) : Math.min(nz, dz - RADIUS - 0.21); P.vz = 0; } }
  nz = Math.min(-0.6, Math.max(-TOTAL_LEN + 0.8, nz));
  // 소품 충돌
  for (const c of colliders) { if (P.y > (c.h ?? 3.5) - 0.05) continue; const dx = nx - c.x, dz = nz - c.z, d = Math.hypot(dx, dz), min = c.rad + RADIUS; if (d < min && d > 0.0001) { nx = c.x + dx / d * min; nz = c.z + dz / d * min; } }
  P.x = nx; P.z = nz;
  // 점프 / 중력: 낮은 가구 위에 올라설 수 있다
  if (P.y > 0 || P.vy !== 0) { P.vy -= 16 * dt; P.y += P.vy * dt; let floor = 0; for (const c of colliders) { const h = c.h ?? 3.5; if (h < 1.3 && Math.hypot(P.x - c.x, P.z - c.z) < c.rad + RADIUS * 0.6) floor = Math.max(floor, h); } if (P.y <= floor) { P.y = floor; P.vy = 0; } }
  else { let floor = 0; for (const c of colliders) { const h = c.h ?? 3.5; if (h < 1.3 && Math.hypot(P.x - c.x, P.z - c.z) < c.rad + RADIUS * 0.6) floor = Math.max(floor, h); } if (P.y < floor - 0.01) P.y = floor; else if (P.y > 0 && floor === 0) P.vy = -0.01; }
  const speed = Math.hypot(P.vx, P.vz), moving = speed > 0.3; P.bob += dt * (moving ? 8 + speed : 2);
  const lat = P.vx * Math.cos(P.yaw) + P.vz * Math.sin(P.yaw); // 좌우 속도 → 살짝 기울임
  P.roll = (P.roll || 0) + ((reduceMotion ? 0 : -lat * 0.012) - (P.roll || 0)) * Math.min(1, dt * 6);
  camera.position.set(P.x, EYE + P.y + (moving && !reduceMotion && P.vy === 0 ? Math.sin(P.bob) * 0.03 : 0), P.z);
  camera.rotation.set(0, 0, 0); camera.rotateY(P.yaw); camera.rotateX(P.pitch); camera.rotateZ(P.roll);
  const wantFov = (isSmall ? 80 : 72) + (keys.ShiftLeft && moving ? 6 : 0); if (Math.abs(camera.fov - wantFov) > 0.05) { camera.fov += (wantFov - camera.fov) * Math.min(1, dt * 6); camera.updateProjectionMatrix(); }
  if (moving) { P.step = (P.step || 0) + dt * speed; if (P.step > 1.9) { P.step = 0; tone(90 + Math.random() * 30, 0, 0.05, 'sine', 0.035); } }
  // 무기 흔들림
  weapon.position.x = 0.3 + Math.sin(P.bob) * (moving ? 0.008 : 0.002); weapon.position.y = -0.26 + Math.abs(Math.cos(P.bob)) * (moving ? 0.01 : 0.003); weapon.position.z += (-0.55 - weapon.position.z) * Math.min(1, dt * 10); weapon.rotation.z = -P.roll * 2;
  const r = roomAt(P.z); if (r.i !== S.stage) { S.stage = r.i; onEnterRoom(r); }
}

// ---------------------------------------------------------------- 상호작용
const ray = new THREE.Raycaster(); const fwd = new THREE.Vector3(); let focus = null;
function findFocus() {
  camera.getWorldDirection(fwd); let best = null, bestScore = 1e9; const ppos = new THREE.Vector3(P.x, EYE, P.z);
  for (const it of interact) {
    if (!it.obj.visible) continue; const d = it.pos.distanceTo(ppos); if (d > it.rad) continue;
    const to = it.pos.clone().sub(ppos).normalize(); const dot = to.dot(fwd); if (dot < 0.72) continue;
    const score = d * (1.3 - dot); if (score < bestScore) { bestScore = score; best = it; }
  }
  focus = best;
  // 라벨: 거리 비례 크기(화면에서 일정하게 보이도록), 멀면 숨김, 포커스는 강조
  for (const it of interact) { if (!it.lab || !it.obj.visible) continue; const d = it.pos.distanceTo(ppos); it.lab.visible = d < 12; if (!it.lab.visible) continue; const k = Math.min(1.9, Math.max(0.45, d / 4.2)) * (it === focus ? 1.25 : 1); it.lab.scale.copy(it.lab.userData.base).multiplyScalar(k); it.lab.material.opacity = Math.min(1, (12 - d) / 3); }
  const pr = $('prompt'); if (focus && $('modal').hidden) { pr.hidden = false; $('prompt-text').textContent = focus.label(); $('btn-e').classList.add('hot'); } else { pr.hidden = true; $('btn-e').classList.remove('hot'); }
  // 근접 자동 획득 (칩/업적)
  for (const it of interact) if (it.near && it.obj.visible && it.pos.distanceTo(ppos) < it.near + 0.3) it.action();
}
function doInteract() { if (focus && $('modal').hidden) { blip(); focus.action(); } }
const PERK = { lang: { ko: '탄속 +2', en: 'shot speed +2' }, back: { ko: '동시 발사 +1 (2개마다)', en: '+1 shot per 2 chips' }, data: { ko: '탄 크기 +', en: 'bigger shots' }, infra: { ko: '연사 속도 +', en: 'faster fire' }, ai: { ko: '유도탄 (버그를 따라감)', en: 'homing shots' } };
function collectChip(it) { if (!it.obj.visible) return; it.obj.visible = false; S.chips.add(it.id); const sk = D.skills[it.id]; S.perks[sk.cat] = (S.perks[sk.cat] || 0) + 1; S.wcol = CAT_COLOR[sk.cat]; applyWeaponLook(); chime(); toast(`⚡ ${sk.n} — ${L(PERK[sk.cat])}`); checkRoom(it.r); updateHud(); save(); }
function wstats() { const lv = S.wlv, pk = S.perks; return { n: Math.min(5, 1 + (lv >= 3 ? 1 : 0) + (lv >= 7 ? 1 : 0) + Math.floor((pk.back || 0) / 2)), rate: Math.max(0.06, 0.16 - (lv - 1) * 0.006 - (pk.infra || 0) * 0.012), speed: 26 + (lv - 1) * 1.2 + (pk.lang || 0) * 2, size: 1 + (lv - 1) * 0.05 + (pk.data || 0) * 0.15, homing: (pk.ai || 0) > 0 || lv >= 10 }; }
function applyWeaponLook() { if (!window.weapon) return; weapon.emitter.material.color.setHex(S.wcol); weapon.scale.setScalar(Math.min(0.95, 0.72 + (S.wlv - 1) * 0.015)); }
function collectAch(it) { if (!it.obj.visible) return; it.obj.visible = false; S.ach.add(it.id); chime(); toast(T().gotAch(L(D.achievements[it.id].n))); updateHud(); save(); }
function reclaimRack(it, rack) { if (!rack.idle) { toast(lang === 'ko' ? '✅ 정상 가동 중인 서버입니다' : '✅ This server is healthy'); return; } S.racks.add(it.id); S.servers += 1; rack.idle = false; rack.lab.visible = false; rack.labOk.visible = true; it.lab = rack.labOk; rack.state.forEach((s) => s.col.setHex(0x39ff6a)); chime(); burst(new THREE.Vector3(rack.x, 2.3, rack.z), 0x9fefb0, 12, 2); toast(T().reclaimed(S.servers)); $('hud-servers-box').hidden = false; updateHud(); save(); }

// ---------------------------------------------------------------- 미니게임 (각각 별도 창에서 집중해서 플레이)
const K = () => lang === 'ko';
function miniShell(r, mg, body, sub) { show(`<h2>🎮 ${esc(L(mg.title))}</h2><div class="sub">${esc(sub || (K() ? '클리어하면 발사기가 업그레이드됩니다' : 'Clear it to upgrade your launcher'))}</div><div class="mini" id="mini">${body}</div><p class="sub" id="mini-msg"></p>`); pendingRoom = null; return $('mini'); }
function miniMsg(t) { const m = $('mini-msg'); if (m) m.textContent = t; }
function miniWin(r, t) { miniMsg(t); finishMini(r); }
function startMini(r) {
  const mg = MINIGAMES[r.st.id]; if (!mg) return;
  const G = { typing: miniTyping, ttt: miniTTT, memory: miniMemory, simon: miniSimon, slide: miniSlide, reaction: miniReaction, logs: miniLogs, whack: miniWhack }[mg.kind];
  if (G) G(r, mg);
}
function finishMini(r) { if (S.mini.has(r.st.id)) { toast(K() ? '이미 클리어한 미니게임이에요 (재도전 환영)' : 'Already cleared — play again anyway'); return; } S.mini.add(r.st.id); chime(true); setTimeout(() => weaponUp(K() ? '미니게임 클리어' : 'mini-game cleared'), 600); showObjective(r); save(); }
// 타이핑
function miniTyping(r, mg) {
  miniShell(r, mg, `<pre class="code">${esc(mg.text)}</pre><input id="type-in" class="minput" autocomplete="off" spellcheck="false" placeholder="${K() ? '여기에 입력 후 Enter' : 'type here, then Enter'}">`, K() ? '아래 코드를 그대로 입력하세요' : 'Type the code exactly');
  const inp = $('type-in'); const t0 = performance.now(); setTimeout(() => inp.focus(), 50);
  inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { closeCard(); return; } if (e.key !== 'Enter') return; if (inp.value.trim() === mg.text) { miniWin(r, (K() ? `컴파일 성공! ${((performance.now() - t0) / 1000).toFixed(1)}초 🎉` : `Compiled in ${((performance.now() - t0) / 1000).toFixed(1)}s 🎉`)); } else { miniMsg(K() ? '컴파일 에러 — 오타를 확인하세요' : 'Compile error — check typos'); tone(150, 0, 0.15, 'sawtooth', 0.04); } });
}
// 삼목: 내가 X, 알파고 O (미니맥스, 가끔 실수)
function miniTTT(r, mg) {
  const el = miniShell(r, mg, `<div class="grid3" id="ttt">${Array.from({ length: 9 }, (_, i) => `<button data-i="${i}"></button>`).join('')}</div><div class="mrow"><button class="pbtn" id="ttt-reset">${K() ? '다시' : 'Reset'}</button></div>`, K() ? '당신은 X, 알파고는 O. 이기면 클리어' : 'You are X, AlphaGo is O. Win to clear');
  let b = Array(9).fill(''); let over = false; const cells = [...el.querySelectorAll('#ttt button')];
  const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const win = (bd, p) => lines.some((l) => l.every((i) => bd[i] === p));
  const minimax = (bd, p) => { if (win(bd, 'O')) return { s: 1 }; if (win(bd, 'X')) return { s: -1 }; if (!bd.includes('')) return { s: 0 }; let best = { s: p === 'O' ? -2 : 2 }; bd.forEach((c, i) => { if (c) return; bd[i] = p; const sc = minimax(bd, p === 'O' ? 'X' : 'O').s; bd[i] = ''; if (p === 'O' ? sc > best.s : sc < best.s) best = { s: sc, i }; }); return best; };
  const draw = () => cells.forEach((c, i) => { c.textContent = b[i]; c.className = b[i] ? 'on ' + b[i] : ''; });
  const end = (t, w) => { over = true; if (w) miniWin(r, t); else miniMsg(t); };
  cells.forEach((c) => { c.onclick = () => { const i = +c.dataset.i; if (over || b[i]) return; b[i] = 'X'; blip(); if (win(b, 'X')) { draw(); return end(K() ? '이겼습니다! 알파고도 가끔은 집니다 🎉' : 'You win! 🎉', true); } if (!b.includes('')) { draw(); return end(K() ? '무승부 — 다시 해 보세요' : 'Draw — try again'); }
    const easy = Math.random() < 0.35; const free = b.map((v, k) => v ? -1 : k).filter((k) => k >= 0); const mv = easy ? free[Math.floor(Math.random() * free.length)] : minimax(b.slice(), 'O').i; b[mv] = 'O'; draw();
    if (win(b, 'O')) end(K() ? '알파고 승 — 다시 도전!' : 'AlphaGo wins — again!'); else if (!b.includes('')) end(K() ? '무승부 — 다시 해 보세요' : 'Draw — try again'); }; });
  $('ttt-reset').onclick = () => { b = Array(9).fill(''); over = false; draw(); miniMsg(''); }; draw();
}
// 짝 맞추기 (히브리어 글자)
function miniMemory(r, mg) {
  const letters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו']; const deck = [...letters, ...letters].sort(() => Math.random() - 0.5);
  const el = miniShell(r, mg, `<div class="grid4" id="mem">${deck.map((l, i) => `<button data-i="${i}" data-l="${l}">?</button>`).join('')}</div>`, K() ? '같은 히브리어 글자 두 장을 찾으세요 (6쌍)' : 'Find the matching Hebrew letters (6 pairs)');
  const cards = [...el.querySelectorAll('button')]; let open = []; let lock = false; let found = 0; let moves = 0;
  cards.forEach((c) => { c.onclick = () => { if (lock || c.classList.contains('ok') || open.includes(c)) return; c.textContent = c.dataset.l; c.classList.add('flip'); open.push(c); blip(); if (open.length === 2) { moves++; lock = true; const [a, b2] = open; setTimeout(() => { if (a.dataset.l === b2.dataset.l) { a.classList.add('ok'); b2.classList.add('ok'); found++; if (found === 6) miniWin(r, K() ? `완료! ${moves}번 만에 🎉  (שלום = 안녕·평화)` : `Done in ${moves} moves 🎉`); } else { a.textContent = '?'; b2.textContent = '?'; a.classList.remove('flip'); b2.classList.remove('flip'); } open = []; lock = false; }, 650); } }; });
}
// 순서 기억 (사이먼)
function miniSimon(r, mg) {
  const el = miniShell(r, mg, `<div class="grid2" id="simon">${['🏫', '📚', '🌳', '☕'].map((e, i) => `<button class="pad p${i}" data-i="${i}">${e}</button>`).join('')}</div><div class="mrow"><button class="pbtn primary" id="simon-go">${K() ? '시작' : 'Start'}</button></div>`, K() ? '길 순서를 보고 그대로 따라 누르세요 (5단계)' : 'Watch the path, repeat it (5 rounds)');
  const pads = [...el.querySelectorAll('.pad')]; let seq = [], idx = 0, showing = false;
  const flash = (i, d = 420) => new Promise((res) => { pads[i].classList.add('lit'); tone(300 + i * 120, 0, 0.25, 'triangle', 0.05); setTimeout(() => { pads[i].classList.remove('lit'); setTimeout(res, 140); }, d); });
  const play = async () => { showing = true; idx = 0; miniMsg(K() ? `${seq.length}단계 — 보세요` : `Round ${seq.length} — watch`); for (const i of seq) await flash(i); showing = false; miniMsg(K() ? '따라 누르세요' : 'Your turn'); };
  const next = () => { seq.push(Math.floor(Math.random() * 4)); play(); };
  $('simon-go').onclick = () => { seq = []; next(); };
  pads.forEach((p) => { p.onclick = () => { if (showing || !seq.length) return; const i = +p.dataset.i; flash(i, 160); if (i !== seq[idx]) { miniMsg(K() ? '틀렸어요 — 시작을 눌러 다시' : 'Wrong — press Start'); seq = []; tone(150, 0, 0.2, 'sawtooth', 0.05); return; } idx++; if (idx === seq.length) { if (seq.length >= 5) miniWin(r, K() ? '길을 다 외웠습니다 🎉' : 'Path memorized 🎉'); else setTimeout(next, 700); } }; });
}
// 3x3 슬라이드 퍼즐
function miniSlide(r, mg) {
  let t = [1, 2, 3, 4, 5, 6, 7, 8, 0]; const nb = (i) => [i - 3, i + 3, i % 3 ? i - 1 : -1, i % 3 !== 2 ? i + 1 : -1].filter((k) => k >= 0 && k < 9);
  for (let k = 0; k < 60; k++) { const e = t.indexOf(0); const c = nb(e); const m = c[Math.floor(Math.random() * c.length)]; [t[e], t[m]] = [t[m], t[e]]; }
  miniShell(r, mg, `<div class="grid3 slide" id="slide"></div>`, K() ? '타일을 밀어 1~8 순서로 맞추세요' : 'Slide the tiles into 1–8 order');
  const box = $('slide'); let moves = 0;
  const draw = () => { box.innerHTML = t.map((v, i) => `<button data-i="${i}" class="${v ? 'tile t' + v : 'hole'}">${v || ''}</button>`).join(''); box.querySelectorAll('button').forEach((bt) => { bt.onclick = () => { const i = +bt.dataset.i; const e = t.indexOf(0); if (!nb(e).includes(i)) return; [t[e], t[i]] = [t[i], t[e]]; moves++; blip(); draw(); if (t.join() === '1,2,3,4,5,6,7,8,0') miniWin(r, K() ? `도시계획도 완성! ${moves}수 🎉` : `Plan complete in ${moves} moves 🎉`); }; }); };
  draw();
}
// 반응속도
function miniReaction(r, mg) {
  miniShell(r, mg, `<button id="react" class="react">${K() ? '클릭해서 시작' : 'Click to start'}</button>`, K() ? '서버가 초록불이 되는 순간 클릭! (3번 평균 400ms 이하)' : 'Click the moment it turns green (avg ≤ 400ms over 3 tries)');
  const b = $('react'); let state = 'idle', t0 = 0, times = [], timer = null;
  const arm = () => { state = 'wait'; b.className = 'react wait'; b.textContent = K() ? '재시작 중… 기다리세요' : 'Restarting… wait'; timer = setTimeout(() => { if (!document.getElementById('react')) return; state = 'go'; b.className = 'react go'; b.textContent = K() ? '지금 클릭!' : 'CLICK!'; t0 = performance.now(); tone(880, 0, 0.1, 'square', 0.04); }, 1000 + Math.random() * 2200); };
  b.onclick = () => { if (state === 'idle') return arm(); if (state === 'wait') { clearTimeout(timer); state = 'idle'; b.className = 'react bad'; b.textContent = K() ? '너무 빨라요! 클릭해서 다시' : 'Too early! click to retry'; tone(150, 0, 0.2, 'sawtooth', 0.05); return; } if (state === 'go') { const ms = Math.round(performance.now() - t0); times.push(ms); state = 'idle'; b.className = 'react'; b.textContent = `${ms} ms` + (times.length < 3 ? (K() ? ' · 클릭해서 계속' : ' · click to continue') : ''); if (times.length === 3) { const avg = Math.round(times.reduce((a, c) => a + c) / 3); if (avg <= 400) miniWin(r, K() ? `평균 ${avg}ms — 서버 정상 기동 🎉` : `Average ${avg}ms — server up 🎉`); else { miniMsg(K() ? `평균 ${avg}ms — 조금 더 빠르게! 클릭해서 재도전` : `Average ${avg}ms — faster! click to retry`); times = []; } } } };
}
// 로그에서 ERROR 찾기
function miniLogs(r, mg) {
  const base = ['INFO  batch idle-check started', 'INFO  metric sync 230,114 hosts', 'DEBUG cache hit 98.7%', 'WARN  retry #2 node-red webhook', 'INFO  approval queue 12 pending', 'INFO  kafka lag 0 group=infra', 'DEBUG envers revision written', 'INFO  jwt issued for api-key', 'WARN  slow query 1.2s servers', 'INFO  argocd sync Synced'];
  const errs = ['ERROR utf8mb4 incorrect string value', 'ERROR NullPointerException at ServerMapper', 'ERROR connection refused redis:6379', 'ERROR batch step failed step=reclaim', 'ERROR 502 upstream timeout /servers'];
  const lines = [...base, ...base.slice(0, 5), ...errs].sort(() => Math.random() - 0.5);
  const el = miniShell(r, mg, `<div class="logs" id="logs">${lines.map((l, i) => `<div data-e="${l.startsWith('ERROR') ? 1 : 0}" data-i="${i}">${esc(l)}</div>`).join('')}</div><div class="mrow"><span id="logs-t" class="sub"></span></div>`, K() ? 'ERROR 5줄을 모두 클릭하세요 (20초)' : 'Click all 5 ERROR lines (20s)');
  let left = 5, t = 20, over = false; const show_t = () => { const e = $('logs-t'); if (e) e.textContent = `⏱ ${t}s · ${K() ? '남은 ERROR' : 'left'} ${left}`; };
  const tm = setInterval(() => { if (!document.getElementById('logs') || over) return clearInterval(tm); t--; show_t(); if (t <= 0) { over = true; clearInterval(tm); miniMsg(K() ? '시간 초과 — 다시 열어 재도전' : 'Time up — reopen to retry'); } }, 1000); show_t();
  el.querySelectorAll('#logs div').forEach((d) => { d.onclick = () => { if (over || d.classList.contains('hit')) return; if (d.dataset.e === '1') { d.classList.add('hit'); left--; blip(); show_t(); if (left === 0) { over = true; clearInterval(tm); miniWin(r, K() ? `장애 원인 5건 모두 발견 🎉 (${t}초 남음)` : `All 5 errors found 🎉`); } } else { d.classList.add('miss'); t -= 2; show_t(); tone(150, 0, 0.15, 'sawtooth', 0.04); } }; });
}
// 유휴 서버 두더지
function miniWhack(r, mg) {
  const el = miniShell(r, mg, `<div class="grid4 whack" id="whack">${Array.from({ length: 12 }, (_, i) => `<button data-i="${i}"><span class="led"></span>SRV-${String(i + 1).padStart(2, '0')}</button>`).join('')}</div><div class="mrow"><button class="pbtn primary" id="whack-go">${K() ? '시작 (30초)' : 'Start (30s)'}</button><span id="whack-t" class="sub"></span></div>`, K() ? '💤 로 바뀌는 서버를 재빨리 클릭해 반납하세요 — 15대 이상이면 클리어' : 'Click servers the moment they go 💤 — 15+ to clear');
  const cells = [...el.querySelectorAll('#whack button')]; let score = 0, t = 30, run = false, timers = [];
  const alive = () => !!document.getElementById('whack');
  const spawn = () => { if (!run || !alive()) return; const free = cells.filter((c) => !c.classList.contains('idle') && !c.classList.contains('ok')); if (free.length) { const c = free[Math.floor(Math.random() * free.length)]; c.classList.add('idle'); c.querySelector('.led').textContent = '💤'; timers.push(setTimeout(() => { c.classList.remove('idle'); c.querySelector('.led').textContent = ''; }, 900 + Math.random() * 600)); } timers.push(setTimeout(spawn, 450 + Math.random() * 350)); };
  const hud = () => { const e = $('whack-t'); if (e) e.textContent = `⏱ ${t}s · 💤 ${score}`; };
  $('whack-go').onclick = () => { if (run) return; run = true; score = 0; t = 30; hud(); cells.forEach((c) => { c.classList.remove('idle', 'ok'); c.querySelector('.led').textContent = ''; }); spawn(); const tick = setInterval(() => { if (!alive()) { clearInterval(tick); run = false; timers.forEach(clearTimeout); return; } t--; hud(); if (t <= 0) { clearInterval(tick); run = false; timers.forEach(clearTimeout); cells.forEach((c) => { c.classList.remove('idle'); c.querySelector('.led').textContent = ''; }); S.servers += score; updateHud(); save(); if (score >= 15) miniWin(r, K() ? `${score}대 반납 — 비용 절감 성공 🎉` : `${score} reclaimed 🎉`); else miniMsg(K() ? `${score}대 — 15대 이상이면 클리어, 다시 시작!` : `${score} — need 15+, try again!`); } }, 1000); };
  cells.forEach((c) => { c.onclick = () => { if (!run || !c.classList.contains('idle')) return; c.classList.remove('idle'); c.classList.add('ok'); c.querySelector('.led').textContent = '✅'; score++; hud(); tone(880, 0, 0.05, 'square', 0.03); setTimeout(() => { c.classList.remove('ok'); c.querySelector('.led').textContent = ''; }, 500); }; });
}
function needsText(r) { const n = []; const c = r.chips.filter((c) => !S.chips.has(c.id)).length; if (c) n.push(T().needChips(c)); return n.join(' + '); }
function checkRoom(r) { if (!r.chips.length || S.cleared.has(r.st.id)) return; if (r.chips.every((c) => S.chips.has(c.id))) { S.cleared.add(r.st.id); bigToast(T().clear(r.st.year)); chime(true); weaponUp(lang === 'ko' ? '방의 스킬 칩을 모두 모음' : 'all chips in the room'); save(); } }
function openDoor(r, announce) { r.door.open = true; r.door.lamp.material.color.setHex(0x39ff6a); r.door.lab.visible = false; if (announce) { bigToast(T().clear(r.st.year)); setTimeout(() => toast(T().doorOpen), 1400); chime(true); } showObjective(r); }
function showObjective(r) { const needs = []; const c = r.chips.filter((c) => !S.chips.has(c.id)).length; if (c) needs.push(T().needChips(c)); const mg = MINIGAMES[r.st.id]; if (mg && !S.mini.has(r.st.id)) needs.push('🎮 ' + L(mg.title)); const next = rooms[r.i + 1]; $('objective').textContent = r.st.goal ? '🚩 ' + T().portal : T().objective(next ? `${next.st.year} ${L(next.st.title)}` : '', needs); }
function onEnterRoom(r) { updateHud(); showObjective(r); showCrawl(r); }

// ---------------------------------------------------------------- 입장 자막 (스타워즈식 크롤)
let crawlTimer = null, crawlHide = null, crawlRoom = null;
function showCrawl(r) {
  if (!S.playing || S.cardRead.has(r.st.id) || crawlRoom === r) return;
  crawlRoom = r; S.crawl = true; $('prompt').hidden = true;
  const st = r.st; const lines = crawlLines(st);
  const el = $('crawl-text'); const c = $('crawl');
  el.innerHTML = `<div class="c-ep">STAGE ${r.i + 1} · ${esc(st.year)}</div><h1>${esc(L(st.title))}</h1>` + lines.map((l) => `<p>${esc(l)}</p>`).join('');
  clearTimeout(crawlHide); c.hidden = false; c.classList.remove('show', 'done'); $('crawl-skip').textContent = T().skip;
  // 한 문장 = 한 줄: 가장 긴 줄이 폭에 맞도록 글자 크기 조정
  el.style.fontSize = ''; el.style.transition = 'none'; el.style.transform = 'translate(-50%, 60vh) rotateX(14deg)';
  const maxW = el.clientWidth; let widest = 0; el.querySelectorAll('p, h1').forEach((n) => { widest = Math.max(widest, n.scrollWidth); });
  if (widest > maxW) el.style.fontSize = Math.max(0.55, maxW / widest * 0.98) + 'em';
  void el.offsetWidth;
  const dur = Math.min(7, 1.4 + lines.length * 0.7);
  setTimeout(() => { c.classList.add('show'); el.style.transition = `transform ${dur}s cubic-bezier(.2,.7,.3,1)`; el.style.transform = 'translate(-50%, -50%) rotateX(14deg)'; }, 20);
  clearTimeout(crawlTimer); crawlTimer = setTimeout(() => { c.classList.add('done'); if (S.auto) crawlTimer = setTimeout(endCrawl, 2500); }, dur * 1000 + 50);
}
function endCrawl() {
  if (!S.crawl) return; clearTimeout(crawlTimer); S.crawl = false;
  const c = $('crawl'); c.classList.remove('show'); clearTimeout(crawlHide); crawlHide = setTimeout(() => { if (!S.crawl) c.hidden = true; }, 350);
  const r = crawlRoom; crawlRoom = null; if (r) { S.cardRead.add(r.st.id); save(); checkRoom(r); showObjective(r); }
}
$('crawl-skip').onclick = endCrawl; $('crawl').addEventListener('click', endCrawl);

// ---------------------------------------------------------------- 카드
const modal = $('modal'), modalBody = $('modal-body');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let pendingRoom = null;
function show(html) { modalBody.innerHTML = html; modal.hidden = false; $('prompt').hidden = true; if (S.locked) document.exitPointerLock(); }
function openStageCard(r) {
  const st = r.st; pendingRoom = r; let html = `<h2>${esc(L(st.title))}</h2><div class="sub">${esc(st.year)} · STAGE ${r.i + 1} / ${D.stages.length}${st.period ? ' · ' + esc(L(st.period)) : ''}</div>`;
  if (st.intro) html += `<p>${esc(L(st.intro))}</p>`;
  if (st.card) html += L(st.card).map((p) => `<p>${p}</p>`).join('');
  if (st.projects) html += st.projects.map((p) => `<div class="proj"><b>${esc(L(p.n))}</b><div class="meta">${esc(p.p)} · ${esc(L(p.r))}</div><ul>${L(p.b).map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>`).join('');
  const coins = [...(st.coins || []), ...(EXTRA_COINS[st.id] || [])];
  if (coins.length) html += `<div class="cat">${T().cards.skills.toUpperCase()} · ${lang === 'ko' ? '이 방에서 모을 수 있는 칩' : 'chips in this room'}</div><div class="chips">${coins.map((id) => `<span class="chip ${S.chips.has(id) ? '' : 'off'}">${D.skills[id].ic} ${esc(D.skills[id].n)}</span>`).join('')}</div>`;
  show(html);
}
function openStoryCard(r) {
  const lines = crawlLines(r.st); let html = `<h2>${esc(L(r.st.title))}</h2><div class="sub">STAGE ${r.i + 1} · ${esc(r.st.year)}</div>` + lines.filter((l) => !l.startsWith('ⓘ')).map((l) => `<p>${esc(l)}</p>`).join('');
  if (r.st.id === 'seoul') html += `<div class="cat">ⓘ ${lang === 'ko' ? '이름의 뜻' : 'About the name'}</div>` + NAME_INFO[lang].map((l) => `<p>${esc(l)}</p>`).join('');
  if (r.st.projects) html += `<div class="cat">${lang === 'ko' ? '주요 프로젝트' : 'Key projects'}</div><ul>` + r.st.projects.map((p) => `<li><b style="display:inline">${esc(L(p.n))}</b> <span style="color:var(--muted)">(${esc(p.p)})</span></li>`).join('') + `</ul><p class="sub">${lang === 'ko' ? '자세한 내용은 상단 "경력"에서' : 'Details: "CAREER" at the top'}</p>`;
  if (!S.cardRead.has(r.st.id)) { S.cardRead.add(r.st.id); save(); }
  pendingRoom = null; show(html);
}
function openDos(r) { pendingRoom = r; show(`<h2>C:\\&gt; 486 · DOS</h2><div class="sub">1995</div><pre id="dos-out" style="background:#000;color:#9fc0ff;font-family:var(--mono);font-size:13px;padding:12px;min-height:160px;max-height:40vh;overflow:auto;white-space:pre-wrap">${esc(T().dosHelp)}\n</pre><input id="dos-in" style="width:100%;font-family:var(--mono);font-size:14px;padding:8px;border:2px solid var(--navy)" placeholder="C:\\> help" autocomplete="off">`); const inp = $('dos-in'), out = $('dos-out'); setTimeout(() => inp.focus(), 50); inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { closeCard(); return; } if (e.key !== 'Enter') return; const c = inp.value.trim().toLowerCase(); inp.value = ''; const say = (t) => { out.textContent += `C:\\> ${c}\n${t}\n`; out.scrollTop = 1e9; }; if (c === 'help') say(T().dosHelp); else if (c === 'dir') say(D.stages.map((s) => `${s.year}  ${L(s.title)}`).join('\n')); else if (c === 'whoami') say(`${L(D.meta.name)} — ${L(D.meta.title)}`); else if (c === 'skills') say(Object.values(D.skills).map((s) => `${s.n} ${'*'.repeat(s.lv)}`).join('\n')); else if (c === 'career') say(D.stages.filter((s) => s.company).map((s) => `${L(s.title)} (${L(s.period)})`).join('\n')); else if (c === 'contact') say(`${D.meta.email}\n${D.meta.github}`); else if (c === 'cls') out.textContent = ''; else if (c) say(`'${c}' is not recognized`); }); }
function openCard(kind) {
  const c = T().cards; let html = '';
  if (kind === 'about') html = `<h2>${esc(L(D.meta.name))}</h2><div class="sub">${esc(L(D.meta.title))} · Kakao Infra Dev Team · 2022 –</div>` + L(D.summary).map((p) => `<p>${esc(p)}</p>`).join('') + `<div class="cat">${c.ach}</div><ul>` + Object.entries(D.achievements).map(([id, a]) => `<li>${a.ic} ${esc(L(a.n))} — ${esc(L(a.d))} ${S.ach.has(id) ? `<span class="chip">${c.collected}</span>` : ''}</li>`).join('') + `</ul><div class="cat">${c.edu}</div><ul>` + L(D.education).map((e) => `<li>${esc(e)}</li>`).join('') + `</ul>`;
  else if (kind === 'career') html = `<h2>${c.career}</h2><div class="sub">1990 → 2026</div>` + D.stages.filter((s) => !s.goal).map((s) => `<div class="row"><div class="yr">${esc(s.year)}</div><div><b>${esc(L(s.title))}</b>${s.company ? `<span>${esc(L(s.period))}<br>${esc(L(s.intro))}</span><ul>${s.projects.map((p) => `<li>${esc(L(p.n))} <span>(${esc(p.p)})</span></li>`).join('')}</ul>` : `<span>${(L(s.card) || [])[0] || ''}</span>`}</div></div>`).join('');
  else if (kind === 'skills') { html = `<h2>${c.skills}</h2><div class="sub">${S.chips.size} / ${Object.keys(D.skills).length} ${c.collected} · ${lang === 'ko' ? '레벨은 1~5 자기 평가' : 'levels self-assessed 1–5'}</div>`; for (const [cat, name] of Object.entries(D.skillCats)) html += `<div class="cat">${esc(L(name)).toUpperCase()}</div><div class="chips">` + Object.entries(D.skills).filter(([, s]) => s.cat === cat).map(([id, s]) => `<span class="chip ${S.chips.has(id) ? '' : 'off'}" title="${S.chips.has(id) ? c.collected : c.locked}">${s.ic} ${esc(s.n)}<i>${'★'.repeat(s.lv)}</i></span>`).join('') + `</div>`; }
  else if (kind === 'contact' || kind === 'final') html = `<h2>${kind === 'final' ? '🚩 STAGE CLEAR — 2026' : c.contact}</h2><div class="sub">${esc(D.meta.email)}</div>${kind === 'final' ? `<p>${c.final}</p><p class="sub">⚡ ${S.chips.size}/${Object.keys(D.skills).length} · 🏆 ${S.ach.size}/${Object.keys(D.achievements).length} · 💤 ${S.servers} · 🐛 ${S.bugs.size}/${bugs.length}</p>` : ''}<div class="links"><a href="mailto:${esc(D.meta.email)}">✉ Email</a><a href="${esc(D.meta.linkedin)}" target="_blank" rel="noopener">LinkedIn</a><a href="${esc(D.meta.github)}" target="_blank" rel="noopener">GitHub</a><a href="${esc(D.meta.pdf.ko)}" download>${c.pdfKo}</a><a href="${esc(D.meta.pdf.en)}" download>${c.pdfEn}</a><a href="game.html">${c.game}</a></div><div class="cat">${c.side}</div>` + D.sideProjects.map((p) => `<div class="row"><div class="yr">${esc(p.l)}</div><div><b><a href="${esc(p.u)}" target="_blank" rel="noopener" style="color:var(--navy)">${esc(p.n)}</a></b><span>${esc(L(p.d))}</span></div></div>`).join('') + `<div class="row"><div class="yr">Games</div><div><b>${lang === 'ko' ? '직접 만든 학습 게임' : 'Learning games I built'}</b><span><a href="https://bosuknam.github.io/oidc-quest/" target="_blank" rel="noopener">OIDC Quest</a> · <a href="https://bosuknam.github.io/kafka-quest/" target="_blank" rel="noopener">Kafka Quest</a> · <a href="https://bosuknam.github.io/grpc-quest/" target="_blank" rel="noopener">gRPC Tunnel Run</a></span></div></div>`;
  pendingRoom = null; show(html);
}
function closeCard() { modal.hidden = true; if (pendingRoom) { const r = pendingRoom; pendingRoom = null; if (!S.cardRead.has(r.st.id)) { S.cardRead.add(r.st.id); save(); checkRoom(r); showObjective(r); } } if (S.playing && !isTouch && !S.auto) toast(T().clickToPlay); }
$('modal-x').onclick = closeCard; $('modal-ok').onclick = closeCard; modal.addEventListener('click', (e) => { if (e.target === modal) closeCard(); });
document.querySelectorAll('#nav button').forEach((b) => { b.onclick = () => { blip(); openCard(b.dataset.card); }; });

// ---------------------------------------------------------------- 자동 투어
let auto = null;
function startAuto() { S.auto = true; $('btn-auto').classList.add('on'); $('btn-auto').textContent = T().autoOn; toast(T().tourOn); if (S.locked) document.exitPointerLock(); auto = { wait: 0 }; }
function stopAuto() { S.auto = false; $('btn-auto').classList.remove('on'); $('btn-auto').textContent = T().auto; toast(T().tourOff); auto = null; }
function autoStep(dt) {
  if (!$('modal').hidden || S.crawl) return { x: 0, z: 0 };
  if (auto.wait > 0) { auto.wait -= dt; return { x: 0, z: 0 }; }
  const r = roomAt(P.z); const ppos = new THREE.Vector3(P.x, EYE, P.z);
  let target = null; let act = null;
  const achs = interact.filter((it) => it.kind === 'ach' && it.r === r && it.obj.visible); const racks = interact.filter((it) => it.kind === 'rack' && it.r === r && it.rack && it.rack.idle);
  auto.skip = auto.skip || new Set();
  const ok = (it) => !auto.skip.has(it);
  const chipT = r.chips.find((c) => c.obj.visible && ok(c)), achT = achs.find(ok), rackT = racks.find(ok);
  let cur;
  if (chipT) { target = chipT.pos.clone(); cur = chipT; }
  else if (achT) { target = achT.pos.clone(); cur = achT; }
  else if (rackT) { target = rackT.pos.clone(); act = () => rackT.action(); cur = rackT; }
  else if (r.door) { target = new THREE.Vector3(0, EYE, r.z1 - 1.2); cur = r.door; }
  else { const pt = interact.find((it) => it.kind === 'portal'); target = pt.pos.clone(); act = () => { openCard('final'); stopAuto(); }; cur = pt; }
  if (cur !== auto.cur) { auto.cur = cur; auto.lastD = undefined; auto.stuck = 0; auto.detours = 0; auto.detour = null; }
  // 우회 중이면 우회점으로
  if (auto.detour) {
    auto.detour.t -= dt; const dd = Math.hypot(auto.detour.x - P.x, auto.detour.z - P.z);
    if (dd < 0.5 || auto.detour.t <= 0) { auto.detour = null; auto.lastD = undefined; auto.stuck = 0; }
    else target = new THREE.Vector3(auto.detour.x, EYE, auto.detour.z);
  }
  const to = target.clone().sub(ppos); to.y = 0; const d = to.length();
  if (!auto.detour) {
    if (auto.lastD !== undefined && d > auto.lastD - 0.012) auto.stuck = (auto.stuck || 0) + dt; else auto.stuck = 0;
    auto.lastD = d;
    if (auto.stuck > 0.9) { // 막힘: 가장 가까운 장애물 반대쪽으로 우회점을 잡는다
      auto.stuck = 0; auto.detours = (auto.detours || 0) + 1;
      if (auto.detours > 3) { if (cur && !cur.panel) auto.skip.add(cur); (window.__walkSkipped ||= []).push((cur?.kind || 'door') + '@' + P.x.toFixed(1) + ',' + P.z.toFixed(1)); auto.detours = 0; return { x: 0, z: 0 }; }
      const fwd = to.clone().normalize(); const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      let best = null, bd = 2.4; for (const c of colliders) { const dc = Math.hypot(c.x - P.x, c.z - P.z) - c.rad; if (dc < bd) { bd = dc; best = c; } }
      let side = 1; if (best) side = ((best.x - P.x) * right.x + (best.z - P.z) * right.z) > 0 ? -1 : 1; // 장애물이 오른쪽이면 왼쪽으로
      let dx = P.x + right.x * side * 1.8 + fwd.x * 0.6, dz = P.z + right.z * side * 1.8 + fwd.z * 0.6;
      if (Math.abs(dx) > ROOM_W / 2 - 0.7) { side = -side; dx = P.x + right.x * side * 1.8 + fwd.x * 0.6; dz = P.z + right.z * side * 1.8 + fwd.z * 0.6; }
      dx = Math.max(-ROOM_W / 2 + 0.7, Math.min(ROOM_W / 2 - 0.7, dx));
      auto.detour = { x: dx, z: dz, t: 2.2 }; return { x: 0, z: 0 };
    }
  }
  const wantYaw = Math.atan2(-to.x, -to.z); let dy = wantYaw - P.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); P.yaw += dy * Math.min(1, dt * 4); P.pitch += (0 - P.pitch) * dt * 3;
  const stopDist = auto.detour ? 0.45 : act ? 1.6 : 0.5;
  if (d < stopDist) { if (act && !auto.detour) { act(); if (auto) auto.wait = Math.max(auto.wait, 0.8); } return { x: 0, z: 0 }; }
  if (Math.abs(dy) > 0.6) return { x: 0, z: 0 };
  return { x: 0, z: 0.75 };
}
$('btn-auto').onclick = () => (S.auto ? stopAuto() : startAuto());

// ---------------------------------------------------------------- HUD / 토스트 / 사운드 / 언어
function updateHud() { const r = roomAt(P.z); $('hud-stage').textContent = r.i + 1; $('hud-stage-n').textContent = D.stages.length; $('hud-year').textContent = r.st.year; $('hud-skills').textContent = S.chips.size; $('hud-skills-n').textContent = Object.keys(D.skills).length; $('hud-ach').textContent = S.ach.size; $('hud-ach-n').textContent = Object.keys(D.achievements).length; $('hud-servers').textContent = S.servers; $('hud-wlv').textContent = S.wlv; $('hud-bugs').textContent = S.bugs.size; $('hud-bugs-n').textContent = bugs.length; if (S.servers) $('hud-servers-box').hidden = false; }
{ const marks = $('progress-marks'); marks.innerHTML = ''; rooms.forEach((r) => { const i = document.createElement('i'); i.style.left = (-r.z0 / TOTAL_LEN * 100) + '%'; i.dataset.y = r.st.year; marks.appendChild(i); }); }
let toastT; function toast(msg) { const t = $('toast'); t.className = ''; t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2400); }
function bigToast(msg) { const t = $('toast'); t.className = 'big'; t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }
let ac = null;
function ensureAC() { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); ac.resume(); }
function tone(f, t0, dur, type = 'square', vol = 0.04) { if (!S.sound) return; ensureAC(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, ac.currentTime + t0); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t0 + dur); o.connect(g).connect(ac.destination); o.start(ac.currentTime + t0); o.stop(ac.currentTime + t0 + dur + 0.02); }
function blip() { tone(880, 0, 0.07); }
function chime(big) { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.08, 0.18, 'triangle', 0.05)); if (big) [1319, 1568].forEach((f, i) => tone(f, 0.4 + i * 0.1, 0.3, 'triangle', 0.05)); }
$('btn-sound').onclick = () => { S.sound = !S.sound; $('btn-sound').textContent = S.sound ? '🔊' : '🔇'; if (S.sound) { ensureAC(); blip(); } };
function applyLang() {
  document.documentElement.lang = lang; localStorage.setItem('lang', lang); const t = T();
  $('brand-name').textContent = L(D.meta.name); $('brand-sub').textContent = t.sub; $('ver-label').textContent = t.ver; $('ver').options[0].text = t.verWalk; $('ver').options[1].text = t.verPixel;
  document.querySelectorAll('#nav button').forEach((b) => { b.textContent = t.nav[b.dataset.card]; });
  $('hud-stage-k').textContent = t.stage; $('btn-auto').textContent = S.auto ? t.autoOn : t.auto; $('btn-lang').textContent = t.lang;
  $('title-name').textContent = L(D.meta.name); $('title-sub').textContent = L(D.meta.title); $('title-desc').innerHTML = t.desc; $('title-controls').innerHTML = t.controls;
  $('btn-start').textContent = t.start; $('btn-continue').textContent = t.cont; $('btn-tour').textContent = t.tour; $('btn-pdf').textContent = t.pdf; $('btn-pdf').href = D.meta.pdf[lang]; $('btn-pixel').textContent = t.pixel; $('btn-lang2').textContent = t.langLink; $('modal-ok').textContent = t.ok;
  updateHud(); if (S.playing) showObjective(roomAt(P.z));
  for (const { r, panel } of storyPanels) { panel.material.map?.dispose(); panel.material.map = frameTex(r); panel.material.needsUpdate = true; }
}
$('btn-lang').onclick = $('btn-lang2').onclick = () => { lang = lang === 'ko' ? 'en' : 'ko'; applyLang(); };
$('ver').onchange = (e) => { if (e.target.value === 'pixel') location.href = 'game.html'; };
function resetAll() { if (!confirm(T().reset)) return; localStorage.removeItem('walk'); location.reload(); }
$('btn-reset').onclick = resetAll;
applyLang();

// ---------------------------------------------------------------- 시작
function startGame(tour) {
  $('title').hidden = true; S.playing = true; document.body.classList.add('playing'); if (isTouch) $('touch').hidden = false;
  updateHud(); showObjective(roomAt(P.z)); S.stage = roomAt(P.z).i; setTimeout(() => showCrawl(roomAt(P.z)), 300);
  if (tour) startAuto(); else if (!isTouch) { canvas.requestPointerLock?.()?.catch?.(() => {}); }
}
$('btn-start').onclick = () => { if (S.savePos) { localStorage.removeItem('walk'); location.reload(); return; } startGame(false); };
$('btn-continue').onclick = () => startGame(false);
$('btn-tour').onclick = () => startGame(true);
if (S.savePos && (S.cardRead.size || S.chips.size)) { $('btn-continue').hidden = false; $('btn-start').textContent = lang === 'ko' ? '처음부터' : 'New game'; }

// ---------------------------------------------------------------- 무기 / 발사 / 버그
const weapon = new THREE.Group(); camera.add(weapon); weapon.position.set(0.3, -0.26, -0.55); weapon.scale.setScalar(0.72);
{
  const body = mat(0x1e2433, { metalness: 0.6, roughness: 0.35 }), accent = mat(0xf6c400, { metalness: 0.4, roughness: 0.4 });
  add(weapon, rbox(0.09, 0.09, 0.32, 0.02), body, 0, 0, 0); add(weapon, rbox(0.06, 0.12, 0.08, 0.015), body, 0, -0.08, 0.1, [0.35, 0, 0]);
  add(weapon, new THREE.CylinderGeometry(0.028, 0.034, 0.2, 12), body, 0, 0.01, -0.24, [Math.PI / 2, 0, 0]);
  add(weapon, new THREE.TorusGeometry(0.036, 0.008, 8, 20), accent, 0, 0.01, -0.3, [0, 0, 0]);
  weapon.emitter = add(weapon, new THREE.SphereGeometry(0.02, 10, 10), glowMat(0x7fe7ff), 0, 0.01, -0.34);
  add(weapon, new THREE.PlaneGeometry(0.07, 0.025), new THREE.MeshBasicMaterial({ map: textTex(['COMMIT'], { bg: '#0b1020', fg: '#7fe7ff', font: 'bold 60px "IBM Plex Mono", monospace', w: 256, h: 96 }), toneMapped: false }), 0, 0.046, -0.02, [-Math.PI / 2, 0, 0]);
}
window.weapon = weapon; applyWeaponLook();
const shotGeo = new THREE.SphereGeometry(0.06, 10, 10); const SHOT_MATS = {}, TRAIL_MATS = {}; const shotMatFor = (c) => SHOT_MATS[c] || (SHOT_MATS[c] = glowMat(c)); const trailMatFor = (c) => TRAIL_MATS[c] || (TRAIL_MATS[c] = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
const trailGeo = new THREE.CylinderGeometry(0.012, 0.03, 0.5, 6); const trailMat = new THREE.MeshBasicMaterial({ color: 0x7fe7ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
let lastFire = 0;
function fire() {
  const st = wstats(); if (!S.playing || S.crawl || !$('modal').hidden || tAcc - lastFire < st.rate) return; lastFire = tAcc;
  if (S.auto) stopAuto();
  const dir = camera.getWorldDirection(new THREE.Vector3());
  const start = camera.position.clone().addScaledVector(dir, 0.35).add(new THREE.Vector3(0.09, -0.07, 0).applyQuaternion(camera.quaternion));
  const aim = camera.position.clone().addScaledVector(dir, 40); dir.copy(aim.sub(start).normalize()); // 조준점으로 수렴
  const n = st.n; const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion); const sm = shotMatFor(S.wcol);
  for (let i = 0; i < n; i++) {
    const off = n === 1 ? 0 : (i - (n - 1) / 2) * 0.07; const d2 = dir.clone().addScaledVector(right, off).normalize();
    const m = new THREE.Mesh(shotGeo, sm); m.position.copy(start); m.scale.setScalar(st.size); scene.add(m);
    const tr = new THREE.Mesh(trailGeo, trailMatFor(S.wcol)); tr.position.copy(start); tr.scale.set(st.size, 1, st.size); tr.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d2.clone().negate()); scene.add(tr);
    shots.push({ m, tr, v: d2.multiplyScalar(st.speed), life: 1.1, hit: false, size: st.size, homing: st.homing, speed: st.speed });
  }
  weapon.position.z = -0.47; muzzle.position.copy(start); muzzle.intensity = 6;
  tone(1320, 0, 0.05, 'square', 0.03); tone(660, 0.02, 0.08, 'sawtooth', 0.02);
  if (focus && focus.kind !== 'door') { /* 조준 중인 대상은 즉시 반응 */ }
}
const burstGeo = new THREE.BufferGeometry(); burstGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
function burst(pos, color = 0x7fe7ff, n = 14, speed = 3) {
  const geo = burstGeo.clone(); const vel = []; const arr = geo.attributes.position.array;
  for (let i = 0; i < n; i++) { arr[i * 3] = pos.x; arr[i * 3 + 1] = pos.y; arr[i * 3 + 2] = pos.z; vel.push(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.2), (Math.random() - 0.5)).normalize().multiplyScalar(speed * (0.5 + Math.random()))); }
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.09, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(pts);
  bursts.push({ pts, vel, life: 0.55, n });
}
function squash(bug, pos) { if (bug.dead) return; bug.dead = true; bug.g.visible = false; S.bugs.add(bug.id); burst(pos, 0xff5050, 18, 4); tone(220, 0, 0.12, 'sawtooth', 0.05); tone(110, 0.05, 0.15, 'square', 0.04); weaponUp(T().bug(S.bugs.size, bugs.length)); updateHud(); save(); }
function weaponUp(why) { if (S.wlv >= 20) { toast(why); return; } S.wlv++; const st = wstats(); const d = `${st.n}${lang === 'ko' ? '연발' : 'x'} · ${Math.round(1 / st.rate)}${lang === 'ko' ? '발/초' : '/s'}${st.homing ? (lang === 'ko' ? ' · 유도' : ' · homing') : ''}`; toast(why); setTimeout(() => { bigToast(T().weaponUp(S.wlv, d)); chime(true); }, 350); applyWeaponLook(); updateHud(); save(); }
function updateShots(dt) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const sh = shots[i]; if (sh.homing) { let best = null, bd = 6; for (const b of bugs) { if (b.dead || !b.g.visible) continue; const d = b.g.position.distanceTo(sh.m.position); if (d < bd) { bd = d; best = b; } } if (best) { const want = best.g.position.clone().sub(sh.m.position).normalize().multiplyScalar(sh.speed); sh.v.lerp(want, Math.min(1, dt * 6)); } }
    const prev = sh.m.position.clone(); sh.m.position.addScaledVector(sh.v, dt); sh.life -= dt; sh.tr.position.lerpVectors(prev, sh.m.position, 0.5);
    const p = sh.m.position; let done = sh.life <= 0 || Math.abs(p.x) > ROOM_W / 2 - 0.05 || p.y < 0.02 || p.y > H_ROOM - 0.05 || p.z > -0.05 || p.z < -TOTAL_LEN + 0.05;
    if (!done) {
      for (const b of bugs) if (!b.dead && b.g.visible && b.g.position.distanceTo(p) < 0.42 * (sh.size || 1)) { squash(b, p.clone()); done = true; break; }
      if (!done) for (const it of interact) {
        if (!it.obj.visible) continue; const hitR = it.kind === 'door' ? 1.3 : (it.kind === 'mini' || it.kind === 'story' || it.kind === 'pc') ? 0.8 : it.kind === 'rack' ? 0.6 : 0.55;
        if (it.pos.distanceTo(p) < hitR) { if (it.kind === 'door') { if (!it.r.door.open) { burst(p, 0xff6060, 10, 2); toast('🔒 ' + T().doorLocked(needsText(it.r))); } else done = false; } else { burst(p, 0xffffff, 12, 2.5); it.action(); } if (!(it.kind === 'door' && it.r.door.open)) { done = true; break; } }
      }
      if (!done) for (const r of rooms) if (r.door && !r.door.open && prev.z > r.z1 && p.z <= r.z1) { burst(new THREE.Vector3(p.x, p.y, r.z1 + 0.2), 0xff6060, 10, 2); done = true; break; }
    } else if (sh.life > 0) burst(p, 0x7fe7ff, 8, 1.5);
    if (done) { scene.remove(sh.m); scene.remove(sh.tr); shots.splice(i, 1); }
  }
  for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.life -= dt; const arr = b.pts.geometry.attributes.position.array; for (let k = 0; k < b.n; k++) { arr[k * 3] += b.vel[k].x * dt; arr[k * 3 + 1] += b.vel[k].y * dt; arr[k * 3 + 2] += b.vel[k].z * dt; b.vel[k].y -= 6 * dt; } b.pts.geometry.attributes.position.needsUpdate = true; b.pts.material.opacity = Math.max(0, b.life / 0.55); if (b.life <= 0) { scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); bursts.splice(i, 1); } }
  muzzle.intensity *= Math.max(0, 1 - dt * 14);
}
function updateBugs(t, dt) {
  for (const b of bugs) { if (b.dead || !b.r.g.visible) continue; const x = b.cx + Math.sin(t * b.a + b.ph) * 1.6, z = b.cz + Math.sin(t * b.b + b.ph * 2) * Math.min(2.2, b.r.len / 5), y = 1.3 + Math.sin(t * b.c + b.ph) * 0.45; const dx = x - b.g.position.x, dz = z - b.g.position.z; b.g.position.set(x, y, z); if (dx * dx + dz * dz > 1e-6) b.g.rotation.y = Math.atan2(dx, dz); const f = Math.sin(t * 28 + b.ph) * 0.8; b.w1.rotation.z = 0.3 + f; b.w2.rotation.z = -0.3 - f; }
}
function updateLights() {
  const cur = roomAt(P.z); const picks = [cur, rooms[cur.i + 1], rooms[cur.i - 1]];
  picks.forEach((r, i) => { const l = roomLights[i]; if (!r) { l.intensity = 0; return; } const th = THEMES[r.st.id] || THEMES.kunhwa; l.color.setHex(th.light); l.position.set(0, 2.6, (r.z0 + r.z1) / 2); l.intensity = th.i * 7; l.distance = r.len * 1.1; });
  // 보이는 방만 그린다 (현재 ± 1)
  for (const r of rooms) r.g.visible = Math.abs(r.i - cur.i) <= 1;
}

// ---------------------------------------------------------------- 루프
let tAcc = 0, saveAcc = 0; const clock = new THREE.Clock(); const tmpC = new THREE.Color();
function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); }
addEventListener('resize', resize);
function update(dt, render = true) {
  tAcc += dt; const t = tAcc;
  if (S.playing) movePlayer(dt); else { camera.position.set(0, EYE, -0.9 + Math.sin(t * 0.3) * 0.2); camera.rotation.set(0, Math.sin(t * 0.2) * 0.08, 0); }
  updateLights(); updateBugs(t, dt); updateShots(dt);
  for (const s of spinners) { if (!s.m.parent?.visible && !s.m.visible) continue; s.m.rotation.y += dt * s.spin; s.m.position.y = s.bob + Math.sin(t * 2 + s.bob) * 0.06; }
  for (const r of rooms) if (r.chevrons && r.g.visible) r.chevrons.forEach((c, k) => { c.material.opacity = (r.door && r.door.open ? 0.3 : 0.12) + 0.3 * Math.max(0, Math.sin(t * 2.5 - k * 0.9)); });
  for (const r of rooms) if (r.door) { const want = r.door.open ? 2.55 : 0; r.door.panel.position.y += (1.3 + want - r.door.panel.position.y) * Math.min(1, dt * 3); }
  for (const { leds, state } of ledSets) { if (!leds.parent.visible) continue; for (const s of state) { const on = Math.sin(t * s.rate + s.phase) > -0.3; tmpC.copy(s.col).multiplyScalar(on ? 1.6 : 0.1); leds.setColorAt(s.i, tmpC); } leds.instanceColor.needsUpdate = true; }
  if (dos && Math.floor(t * 2) % 2 === 0 !== dos.blink) { dos.blink = !dos.blink; const g = dos.c.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 320, 240); g.fillStyle = '#9fc0ff'; g.font = '20px "VT323", monospace'; ['MS-DOS 6.22', 'C:\\> dir', 'FLASH    <DIR>', 'GAMES    <DIR>', 'WIN31    <DIR>', '', 'C:\\> ' + (dos.blink ? '_' : '')].forEach((l, i) => g.fillText(l, 10, 26 + i * 24)); dos.tex.needsUpdate = true; }
  if (S.playing) { findFocus(); $('progress-bar').style.width = Math.min(100, (-P.z / TOTAL_LEN) * 100) + '%'; saveAcc += dt; if (saveAcc > 3) { saveAcc = 0; save(); } }
  if (render) composer.render();
}
function frame() { requestAnimationFrame(frame); update(Math.min(clock.getDelta(), 0.05)); }
Promise.allSettled(pendingModels).then(() => $('loading').classList.add('done')); setTimeout(() => $('loading').classList.add('done'), 6000);
frame();
window.__walk = { P, S, rooms, bugs, shots, fire, allRacks, startMini, auto: () => auto, tick: (n = 1, dt = 1 / 60, render = true) => { for (let i = 0; i < n; i++) update(dt, render && i === n - 1); }, startGame, openCard, keys };
