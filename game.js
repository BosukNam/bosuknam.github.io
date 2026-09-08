/* 남보석 포트폴리오 — 횡스크롤 픽셀 이력서 엔진 (의존성 없음) */
(function () {
  'use strict';
  const D = window.DATA;
  const W = 960, H = 540, GROUND = 432, SCALE = 3;
  const cv = document.getElementById('game');
  const cx = cv.getContext('2d');
  cx.imageSmoothingEnabled = false;

  // ------------------------------------------------------------------ 상태
  const S = {
    lang: localStorage.getItem('lang') || (navigator.language.startsWith('ko') ? 'ko' : 'en'),
    started: false, auto: false, paused: false, sound: false,
    t: 0, cam: 0,
    coins: new Set(), ach: new Set(), servers: 0, visited: new Set(),
    keys: {}, touch: false,
    konami: [], rainbow: false,
  };
  try {
    const sv = JSON.parse(localStorage.getItem('save') || 'null');
    if (sv) { S.coins = new Set(sv.coins); S.ach = new Set(sv.ach); S.servers = sv.servers || 0; S.visited = new Set(sv.visited); S.saveX = sv.x; }
  } catch (e) { /* 저장 없음 */ }
  const save = () => { try { localStorage.setItem('save', JSON.stringify({ coins: [...S.coins], ach: [...S.ach], servers: S.servers, visited: [...S.visited], x: P.x })); } catch (e) {} };
  const T = (k) => D.ui[S.lang][k] || k;
  const L = (o) => (o && typeof o === 'object' && (o.ko || o.en)) ? (o[S.lang] || o.ko || o.en) : o;

  // ------------------------------------------------------------------ 월드 배치
  const STAGE_W = { default: 1150, lgcns: 1500, kakao: 1700, goal: 900, pc: 1200 };
  const stages = [];
  let wx = 0;
  D.stages.forEach((st, i) => {
    const w = STAGE_W[st.id] || (st.company ? STAGE_W[st.company] : STAGE_W.default);
    const s = { ...st, x: wx, w, i, objs: [], coins: [], servers: [] };
    // 오브젝트 (건물 등) — 스테이지 중앙~우측
    st.objects.forEach((o, j) => {
      const ox = wx + (st.goal ? 520 : 560) + j * 300;
      s.objs.push({ ...o, x: ox, st: s, id: st.id + ':' + j });
    });
    // 코인
    (st.coins || []).forEach((id, j) => {
      const n = st.coins.length; const spread = Math.min(w - 420, n * 110);
      const cxp = wx + 200 + (spread / Math.max(n - 1, 1)) * j;
      const high = j % 3 === 1; // 일부는 점프해야 닿음
      s.coins.push({ id, x: cxp, y: GROUND - (high ? 150 : 70), got: S.coins.has(id) });
    });
    // 유휴 서버 (카카오)
    if (st.idle) for (let j = 0; j < 6; j++) s.servers.push({ x: wx + 220 + j * 180 + (j % 2) * 40, y: GROUND - 14, got: false, wob: j * 1.3 });
    stages.push(s); wx += w;
  });
  const WORLD_W = wx;
  const totalCoins = D.stages.reduce((a, s) => a + (s.coins ? s.coins.length : 0), 0);

  // ------------------------------------------------------------------ 플레이어
  const P = { x: 120, y: GROUND, vx: 0, vy: 0, w: 30, h: 60, ground: true, face: 1, frame: 0, jumpHold: 0 };
  if (S.saveX && S.saveX > 200) P.x = Math.min(S.saveX, WORLD_W - 300);

  // 픽셀 스프라이트 (12x20)
  const PAL = { h: '#2b2b2b', s: '#f2c9a0', g: '#1b1b1b', b: '#2456c4', p: '#2b3a55', k: '#1b1b1b', w: '#fff', y: '#f6c400', r: '#e74c3c', e: '#141414' };
  const HERO = [
    ['....hhhh....', '...hhhhhh...', '..hhhhhhhh..', '..hsssssh...', '..gsgsgsg...', '..sssssss...', '...sssss....', '..bbbbbbb...', '.bbbbbbbbb..', '.bsbbbbbsb..', '.bsbbybbsb..', '..bbbbbbb...', '..ppppppp...', '..ppp.ppp...', '..ppp.ppp...', '..kkk.kkk...'],
    ['....hhhh....', '...hhhhhh...', '..hhhhhhhh..', '..hsssssh...', '..gsgsgsg...', '..sssssss...', '...sssss....', '..bbbbbbb...', '.bbbbbbbbb..', '.bsbbbbbsb..', '.bsbbybbsb..', '..bbbbbbb...', '..ppppppp...', '.ppp...ppp..', 'ppp.....ppp.', 'kkk.....kkk.'],
    ['....hhhh....', '...hhhhhh...', '..hhhhhhhh..', '..hsssssh...', '..gsgsgsg...', '..sssssss...', '...sssss....', '.sbbbbbbbs..', 'sbbbbbbbbbs.', '.bbbbbbbbb..', '..bbbybbb...', '..bbbbbbb...', '..ppppppp...', '..pp...pp...', '.kk.....kk..', '............'],
  ];
  const SERVER = ['eeeeeeeeee', 'ewwwwwwwwe', 'eeeeeeeeee', 'ewwwwwwwwe', 'eeeeeeeeee', 'eyyeeeeeee', 'eeeeeeeeee'];
  const COIN = ['..yyyy..', '.yyyyyy.', 'yyywwyyy', 'yyywwyyy', 'yyyyyyyy', 'yyyyyyyy', '.yyyyyy.', '..yyyy..'];
  function sprite(rows, x, y, sc, flip) {
    const h = rows.length, w = rows[0].length;
    for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
      const ch = rows[r][c]; if (ch === '.') continue;
      cx.fillStyle = (S.rainbow && ch === 'b') ? `hsl(${(S.t * 4 + r * 20) % 360},90%,55%)` : PAL[ch];
      const px = flip ? x + (w - 1 - c) * sc : x + c * sc;
      cx.fillRect(px, y + r * sc, sc, sc);
    }
  }

  // ------------------------------------------------------------------ 배경 테마
  const THEMES = {
    dawn:    { sky: ['#ffb88c', '#ffe3c8'], far: '#c48a8a', mid: '#e0a9a0', ground: '#7a9b5a', dirt: '#5a4634' },
    desert:  { sky: ['#7fb7e8', '#fde7b3'], far: '#d9b072', mid: '#e7c88c', ground: '#dcb76e', dirt: '#a5834a' },
    room:    { sky: ['#3b3a63', '#5a4f7a'], far: '#4a4470', mid: '#6b5f8f', ground: '#8b6b4a', dirt: '#5b4430' },
    campus:  { sky: ['#8ec9ff', '#eaf6ff'], far: '#7aa6c9', mid: '#8fc48f', ground: '#6fae5c', dirt: '#5a4634' },
    city:    { sky: ['#9fb4c8', '#e6ecf2'], far: '#6b7d91', mid: '#93a4b6', ground: '#8e8e8e', dirt: '#5a5a5a' },
    night:   { sky: ['#0b1030', '#26305e'], far: '#161c3f', mid: '#2b3564', ground: '#3d4a6b', dirt: '#252c45' },
    dusk:    { sky: ['#4b3b7a', '#f39b6a'], far: '#5d4b8a', mid: '#8a6aa8', ground: '#6e8f57', dirt: '#5a4634' },
    day:     { sky: ['#6fb6ff', '#dff1ff'], far: '#7d9fc4', mid: '#a4c7e8', ground: '#7bb765', dirt: '#5a4634' },
    kakao:   { sky: ['#ffd84d', '#fff3b8'], far: '#e5b800', mid: '#f0cc2f', ground: '#6b4f2e', dirt: '#3d2d1a' },
    sunrise: { sky: ['#ff9a6a', '#ffe9a8'], far: '#d67c6a', mid: '#f0a98a', ground: '#7bb765', dirt: '#5a4634' },
  };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  function themeAt(x) {
    let i = stages.findIndex(s => x < s.x + s.w); if (i < 0) i = stages.length - 1;
    const s = stages[i], n = stages[Math.min(i + 1, stages.length - 1)];
    const t = Math.max(0, Math.min(1, (x - (s.x + s.w - 300)) / 300));
    const A = THEMES[s.theme], B = THEMES[n.theme];
    const o = {}; for (const k in A) o[k] = Array.isArray(A[k]) ? A[k].map((c, j) => mix(c, B[k][j], t)) : mix(A[k], B[k], t);
    o.stage = s; return o;
  }

  // ------------------------------------------------------------------ 그리기 유틸
  const R = (x, y, w, h, c) => { cx.fillStyle = c; cx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function text(s, x, y, size, color, align, bold) {
    cx.font = `${bold ? '800' : '600'} ${size}px "Apple SD Gothic Neo","Pretendard","Noto Sans KR",system-ui,sans-serif`;
    cx.fillStyle = color; cx.textAlign = align || 'left'; cx.textBaseline = 'alphabetic'; cx.fillText(s, Math.round(x), Math.round(y));
  }
  function label(s, x, y) { // 말풍선 라벨
    cx.font = '700 12px "Apple SD Gothic Neo","Pretendard",system-ui,sans-serif';
    const w = cx.measureText(s).width + 16;
    R(x - w / 2, y - 18, w, 22, '#14213d'); R(x - w / 2 + 2, y - 16, w - 4, 18, '#fffdf5');
    text(s, x, y - 2, 12, '#14213d', 'center', true);
  }

  // 배경 레이어
  function drawBackground(th) {
    const g = cx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    cx.fillStyle = g; cx.fillRect(0, 0, W, GROUND);
    // 별 (밤/방)
    const st = th.stage.theme;
    if (st === 'night' || st === 'room') for (let i = 0; i < 40; i++) { const sx = (i * 173 + 37) % W, sy = (i * 97 + 11) % (GROUND - 200); if (((S.t / 8 + i) | 0) % 5) R(sx, sy, 2, 2, '#ffffffaa'); }
    // 해/달
    if (st === 'night') R(820, 70, 40, 40, '#f4f1d0'); else if (st !== 'room') { R(800 - (S.cam * 0.02 % 40), 60, 46, 46, '#fff3b0'); }
    // 원경: 산/스카이라인/사구 (패럴랙스 0.2)
    const px = -(S.cam * 0.2) % 480;
    for (let i = -1; i < 4; i++) {
      const bx = px + i * 480;
      if (st === 'desert') { cx.fillStyle = th.far; cx.beginPath(); cx.moveTo(bx, GROUND); cx.quadraticCurveTo(bx + 120, GROUND - 90, bx + 240, GROUND - 30); cx.quadraticCurveTo(bx + 360, GROUND - 120, bx + 480, GROUND); cx.fill(); }
      else if (st === 'city' || st === 'day' || st === 'kakao' || st === 'campus') { for (let k = 0; k < 6; k++) { const h = 60 + ((k * 53 + i * 17) % 90); R(bx + k * 80, GROUND - h, 60, h, th.far); for (let wy = 0; wy < h - 12; wy += 14) for (let wxx = 6; wxx < 50; wxx += 14) if ((wy + wxx + k) % 3) R(bx + k * 80 + wxx, GROUND - h + 6 + wy, 6, 8, '#ffffff33'); } }
      else { cx.fillStyle = th.far; cx.beginPath(); cx.moveTo(bx, GROUND); cx.lineTo(bx + 120, GROUND - 140); cx.lineTo(bx + 240, GROUND - 60); cx.lineTo(bx + 340, GROUND - 170); cx.lineTo(bx + 480, GROUND); cx.fill(); }
    }
    // 중경: 구름/나무 (0.5)
    const mx = -(S.cam * 0.5) % 400;
    for (let i = -1; i < 4; i++) {
      const bx = mx + i * 400;
      if (st === 'room') { R(bx + 60, 120, 120, 90, '#7a6ea6'); R(bx + 70, 130, 100, 70, '#bfd7ff'); R(bx + 250, 140, 80, 60, '#7a6ea6'); } // 창문
      else if (st === 'night') { R(bx + 40, GROUND - 220, 90, 220, th.mid); R(bx + 200, GROUND - 160, 120, 160, th.mid); for (let k = 0; k < 8; k++) if ((k * 7 + i) % 3) R(bx + 52 + (k % 3) * 24, GROUND - 200 + ((k / 3) | 0) * 40, 10, 14, '#ffe27a'); }
      else if (st === 'desert') { R(bx + 100, GROUND - 40, 8, 40, '#7a5c2e'); R(bx + 80, GROUND - 60, 48, 14, '#3f8a3f'); R(bx + 260, GROUND - 70, 60, 70, th.mid); R(bx + 275, GROUND - 90, 30, 20, '#d0d8ff'); } // 야자수 + 돔
      else { cx.fillStyle = '#ffffffcc'; const cy = 100 + (i * 37) % 60; R(bx + 40, cy, 90, 22, '#ffffffcc'); R(bx + 60, cy - 14, 50, 16, '#ffffffcc'); R(bx + 260, cy + 40, 70, 18, '#ffffffbb');
        if (st === 'campus' || st === 'day' || st === 'dusk' || st === 'sunrise' || st === 'dawn') { R(bx + 180, GROUND - 60, 12, 60, '#6b4a2b'); R(bx + 160, GROUND - 100, 52, 48, th.mid); R(bx + 330, GROUND - 46, 10, 46, '#6b4a2b'); R(bx + 315, GROUND - 78, 40, 36, th.mid); } }
    }
    // 지면
    R(0, GROUND, W, H - GROUND, th.dirt); R(0, GROUND, W, 10, th.ground);
    const gx = -(S.cam) % 32; for (let i = -1; i < W / 32 + 1; i++) { R(gx + i * 32, GROUND + 14, 16, 4, '#00000022'); R(gx + i * 32 + 8, GROUND + 30, 12, 4, '#00000022'); }
  }

  // 오브젝트 그리기
  function drawObject(o) {
    const x = o.x - S.cam, gy = GROUND; const lb = L(o.label);
    switch (o.type) {
      case 'hospital': R(x - 70, gy - 120, 140, 120, '#f4f4f4'); R(x - 70, gy - 128, 140, 10, '#d8d8d8'); R(x - 12, gy - 150, 24, 8, '#e74c3c'); R(x - 4, gy - 158, 8, 24, '#e74c3c'); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) R(x - 58 + c * 34, gy - 108 + r * 34, 18, 20, '#9ed0ff'); R(x - 14, gy - 36, 28, 36, '#6b4a2b'); break;
      case 'israel': R(x - 80, gy - 90, 160, 90, '#e8d8b0'); cx.fillStyle = '#c9a25e'; cx.beginPath(); cx.arc(x, gy - 90, 44, Math.PI, 0); cx.fill(); R(x - 14, gy - 40, 28, 40, '#6b4a2b'); R(x - 60, gy - 70, 20, 24, '#7cb7e8'); R(x + 40, gy - 70, 20, 24, '#7cb7e8');
        R(x + 120, gy - 130, 8, 130, '#7a5c2e'); for (let k = 0; k < 5; k++) { cx.save(); cx.translate(x + 124, gy - 130); cx.rotate(-1.2 + k * 0.6); R(0, -4, 60, 10, '#3f8a3f'); cx.restore(); } break;
      case 'pc': R(x - 90, gy - 60, 180, 12, '#8a6b4a'); R(x - 84, gy - 48, 10, 48, '#6b4a2b'); R(x + 74, gy - 48, 10, 48, '#6b4a2b'); R(x - 40, gy - 130, 90, 70, '#d8d0b8'); R(x - 32, gy - 122, 74, 54, '#0b1a0b'); text('C:\\>_', x - 26, gy - 96, 12, '#4cff4c', 'left', true); text('DOS 6.22', x - 26, gy - 80, 9, '#4cff4c'); R(x - 40, gy - 60, 90, 6, '#bdb59d'); R(x + 56, gy - 120, 30, 60, '#d8d0b8'); R(x + 60, gy - 110, 22, 6, '#555'); R(x - 88, gy - 70, 44, 10, '#d8d0b8'); break;
      case 'univ': R(x - 110, gy - 130, 220, 130, '#e9e2cf'); cx.fillStyle = '#c9bfa5'; cx.beginPath(); cx.moveTo(x - 120, gy - 130); cx.lineTo(x, gy - 175); cx.lineTo(x + 120, gy - 130); cx.fill(); for (let k = 0; k < 5; k++) R(x - 96 + k * 46, gy - 120, 14, 100, '#f7f2e4'); R(x - 20, gy - 40, 40, 40, '#6b4a2b'); break;
      case 'office': { const w = 170, h = 150; R(x - w / 2, gy - h, w, h, o.color); for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) R(x - w / 2 + 16 + c * 38, gy - h + 16 + r * 32, 22, 18, ((r + c) % 3) ? '#fff9d6' : '#ffffff55'); R(x - 18, gy - 34, 36, 34, '#2a2a2a'); R(x - w / 2, gy - h - 10, w, 10, '#00000033'); label(o.sign, x, gy - h - 22); break; }
      case 'tower': { const w = 220, h = 40 + o.floors * 30; R(x - w / 2, gy - h, w, h, o.color); R(x - w / 2, gy - h - 12, w, 12, o.dark ? '#3a2e00' : '#00000044'); for (let r = 0; r < o.floors; r++) for (let c = 0; c < 6; c++) R(x - w / 2 + 14 + c * 34, gy - h + 18 + r * 30, 22, 18, ((r * 3 + c + o.floors) % 4) ? (o.dark ? '#3a2e00' : '#fff9d6') : '#ffffff77'); R(x - 24, gy - 40, 48, 40, o.dark ? '#3a2e00' : '#2a2a2a'); label(o.sign, x, gy - h - 26); break; }
      case 'tv': R(x - 70, gy - 40, 140, 40, '#4a3b2e'); R(x - 60, gy - 130, 120, 90, '#222'); R(x - 52, gy - 122, 104, 74, '#e9d7a8'); for (let k = 0; k < 7; k++) { R(x - 44 + k * 14, gy - 116, 1, 62, '#8a7a55'); R(x - 44, gy - 116 + k * 10, 86, 1, '#8a7a55'); } const st = [[1, 1, 0], [2, 3, 1], [3, 2, 0], [4, 4, 1], [2, 5, 0], [5, 3, 1], [1, 4, 0]]; st.forEach(([a, b, c]) => { cx.fillStyle = c ? '#111' : '#fff'; cx.beginPath(); cx.arc(x - 44 + a * 14, gy - 116 + b * 10, 5, 0, 7); cx.fill(); }); text('AlphaGo 4 : 1', x, gy - 44, 10, '#fff', 'center', true); break;
      case 'school': R(x - 90, gy - 110, 180, 110, '#d47a4a'); R(x - 90, gy - 118, 180, 8, '#8a4a2a'); for (let c = 0; c < 4; c++) R(x - 74 + c * 42, gy - 96, 26, 26, '#bfe1ff'); R(x - 18, gy - 44, 36, 44, '#6b4a2b'); label('렉토피아', x, gy - 128); break;
      case 'flag': { const fx = x; R(fx, gy - 240, 6, 240, '#d8d8d8'); R(fx + 6, gy - 240, 70, 44, '#f6c400'); text('★', fx + 41, gy - 208, 24, '#14213d', 'center', true); R(fx + 120, gy - 120, 140, 120, '#8a8a8a'); for (let k = 0; k < 4; k++) R(fx + 120 + k * 38, gy - 136, 22, 16, '#8a8a8a'); R(fx + 172, gy - 50, 36, 50, '#2a2a2a'); label(L({ ko: '2026 · NEXT STAGE', en: '2026 · NEXT STAGE' }), fx + 40, gy - 254); break; }
    }
    if (lb && o.type !== 'flag') { const near = Math.abs(P.x - o.x) < 110; if (near) label(S.touch ? T('hintTouch') : T('hint'), x, gy - (o.type === 'tower' ? 60 + o.floors * 30 + 28 : 190) - 30); }
  }

  function drawSign(s) { // 스테이지 시작 표지판
    const x = s.x + 60 - S.cam; if (x < -200 || x > W + 100) return;
    R(x, GROUND - 90, 8, 90, '#6b4a2b'); R(x - 46, GROUND - 120, 100, 34, '#d9a066'); R(x - 42, GROUND - 116, 92, 26, '#f3d3a3');
    text(s.year, x + 4, GROUND - 99, 15, '#14213d', 'center', true);
    label(L(s.title), x + 4, GROUND - 130);
  }

  // ------------------------------------------------------------------ 입력
  const KEY = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', ' ': 'jump', Enter: 'act', e: 'act', i: 'inv', Escape: 'esc' };
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    const k = KEY[e.key]; if (!k) return; e.preventDefault();
    if (!S.started) { if (k === 'act' || k === 'jump') start(); return; }
    S.konami.push(e.key); S.konami = S.konami.slice(-10); if (S.konami.join() === KONAMI.join()) godMode();
    if (modalOpen()) { if (k === 'esc' || k === 'act' || k === 'up') closeModal(); return; }
    if (k === 'inv') { openInventory(); return; }
    if (k === 'esc') return;
    if ((k === 'up' || k === 'act') && !S.keys[k]) { if (!tryInteract()) if (k === 'up') jump(); }
    if (k === 'jump' && !S.keys.jump) jump();
    S.keys[k] = true; if (k !== 'act') S.auto = false, syncAuto();
  });
  addEventListener('keyup', (e) => { const k = KEY[e.key]; if (k) S.keys[k] = false; });
  // 터치 버튼
  document.querySelectorAll('.tbtn').forEach(b => {
    const k = b.dataset.k;
    const on = (e) => { e.preventDefault(); S.touch = true; if (k === 'act' || k === 'up') { if (!tryInteract()) jump(); } else S.keys[k] = true; S.auto = false; syncAuto(); };
    const off = (e) => { e.preventDefault(); S.keys[k] = false; };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
  });
  // 캔버스 클릭: 오브젝트 클릭 → 카드
  cv.addEventListener('click', (e) => {
    if (!S.started || modalOpen()) return;
    const r = cv.getBoundingClientRect(); const mx = (e.clientX - r.left) * (W / r.width) + S.cam;
    for (const s of stages) for (const o of s.objs) if (Math.abs(mx - o.x) < 120) { if (Math.abs(P.x - o.x) < 140) openObject(o); else { S.target = o.x; S.auto = false; syncAuto(); } return; }
  });
  if (matchMedia('(pointer: coarse)').matches) { S.touch = true; document.getElementById('touch').hidden = false; }

  function jump() { if (P.ground) { P.vy = -13.5; P.ground = false; beep(660, .06); } }
  function tryInteract() { for (const s of stages) for (const o of s.objs) if (Math.abs(P.x - o.x) < 110) { openObject(o); return true; } return false; }

  // ------------------------------------------------------------------ 게임 루프
  function update() {
    if (!S.started || S.paused || modalOpen()) return;
    S.t++;
    const acc = 0.9, max = 4.2;
    let dir = 0;
    if (S.keys.left) dir = -1; if (S.keys.right) dir = 1;
    if (S.target != null) { dir = Math.sign(S.target - P.x); if (Math.abs(S.target - P.x) < 6) { S.target = null; dir = 0; } }
    if (S.auto) dir = 1;
    if (dir) { P.vx += dir * acc; P.face = dir; } else P.vx *= 0.7;
    P.vx = Math.max(-max, Math.min(max, P.vx));
    P.x += P.vx; P.x = Math.max(40, Math.min(WORLD_W - 60, P.x));
    P.vy += 0.75; P.y += P.vy;
    if (P.y >= GROUND) { P.y = GROUND; P.vy = 0; P.ground = true; }
    if (Math.abs(P.vx) > 0.5 && P.ground) P.frame = ((S.t / 6) | 0) % 2; else P.frame = 0;
    // 자동 진행: 높은 코인 앞에서 점프, 오브젝트에서 카드
    if (S.auto) {
      const st = stageAt(P.x);
      for (const c of st.coins) if (!c.got && c.y < GROUND - 100 && c.x - P.x > 20 && c.x - P.x < 70 && P.ground) jump();
      for (const o of st.objs) if (!S.visited.has(o.id) && Math.abs(P.x - o.x) < 20) { openObject(o); P.vx = 0; }
      if (P.x > WORLD_W - 260 && !S.goalShown) { S.goalShown = true; S.auto = false; syncAuto(); openGoal(); }
    }
    // 코인/서버 충돌
    const st = stageAt(P.x);
    for (const c of st.coins) if (!c.got && Math.abs(c.x - P.x) < 26 && Math.abs(c.y - (P.y - 30)) < 40) { c.got = true; S.coins.add(c.id); toast(`+ ${D.skills[c.id].ic} ${D.skills[c.id].n}`); beep(880, .08); beep(1320, .1, .08); save(); }
    for (const sv of st.servers) if (!sv.got && Math.abs(sv.x - P.x) < 30 && P.y > GROUND - 40) { sv.got = true; S.servers++; toast(L({ ko: `💤 → ✅ 서버 반납 ${S.servers}/6`, en: `💤 → ✅ server reclaimed ${S.servers}/6` })); beep(520, .08); if (S.servers === 6) { S.ach.add('idle'); toast(L({ ko: '업적: 유휴 서버 전부 회수!', en: 'Achievement: all idle servers reclaimed!' })); } save(); }
    // 업적 (스테이지 진입)
    if (st.achievements) st.achievements.forEach(a => { if (!S.ach.has(a) && P.x > st.x + 400) { S.ach.add(a); toast(`🏅 ${L(D.achievements[a].n)}`); save(); } });
    // 골
    if (P.x > WORLD_W - 200 && !S.goalShown) { S.goalShown = true; openGoal(); }
    // 카메라
    const tcam = P.x - W * 0.38; S.cam += (tcam - S.cam) * 0.12; S.cam = Math.max(0, Math.min(WORLD_W - W, S.cam));
    if (S.t % 90 === 0) save();
    hud();
  }
  function stageAt(x) { return stages.find(s => x < s.x + s.w) || stages[stages.length - 1]; }

  function draw() {
    const th = themeAt(S.cam + W / 2);
    drawBackground(th);
    for (const s of stages) {
      if (s.x + s.w < S.cam - 300 || s.x > S.cam + W + 300) continue;
      drawSign(s);
      s.objs.forEach(drawObject);
      s.coins.forEach(c => { if (c.got) return; const bob = Math.sin(S.t / 10 + c.x) * 4; sprite(COIN, c.x - S.cam - 12, c.y + bob - 12, 3); text(D.skills[c.id].n, c.x - S.cam, c.y + bob - 18, 10, '#14213d', 'center', true); });
      s.servers.forEach(sv => { if (sv.got) { sprite(SERVER, sv.x - S.cam - 15, sv.y - 10, 3); text('✅', sv.x - S.cam, sv.y - 16, 12, '#fff', 'center'); return; } sprite(SERVER, sv.x - S.cam - 15, sv.y - 10, 3); text('💤', sv.x - S.cam + 12, sv.y - 16 + Math.sin(S.t / 12 + sv.wob) * 3, 12, '#fff', 'center'); });
    }
    // 플레이어
    const fr = P.ground ? P.frame : 2;
    sprite(HERO[fr], P.x - S.cam - 18, P.y - 48, SCALE, P.face < 0);
    // 그림자
    R(P.x - S.cam - 14, GROUND + 2, 28, 3, '#00000033');
    if (!S.started) return;
    // 시작 안내
    if (P.x < 300 && S.t < 600) text(S.touch ? '▶ ▶ ▶' : L({ ko: '→ 키로 오른쪽으로 이동하세요', en: 'Press → to walk right' }), P.x - S.cam + 70, P.y - 70, 13, '#14213d', 'left', true);
  }
  // 고정 타임스텝(60Hz): 120Hz 디스플레이에서도 같은 속도
  let last = 0, acc = 0; const STEP = 1000 / 60;
  function loop(ts) { if (!last) last = ts; acc += Math.min(ts - last, 100); last = ts; while (acc >= STEP) { update(); acc -= STEP; } draw(); requestAnimationFrame(loop); }

  // ------------------------------------------------------------------ HUD/모달
  const $ = (id) => document.getElementById(id);
  function hud() {
    const st = stageAt(P.x); $('hud-year').textContent = st.year; $('hud-coins').textContent = S.coins.size; $('hud-coins-max').textContent = totalCoins;
    $('hud-servers-box').hidden = !st.idle; $('hud-servers').textContent = S.servers + '/6';
    $('progress-bar').style.width = (P.x / WORLD_W * 100) + '%';
  }
  function modalOpen() { return !$('modal').hidden; }
  function openModal(html) { $('modal-body').innerHTML = html; $('modal').hidden = false; $('modal').scrollTop = 0; }
  function closeModal() { $('modal').hidden = true; S.keys = {}; }
  $('modal-x').onclick = closeModal; $('modal').addEventListener('click', (e) => { if (e.target === $('modal')) closeModal(); });

  function openObject(o) {
    const s = o.st; S.visited.add(o.id); save();
    if (s.goal) return openGoal();
    let h = `<span class="yr">${s.year}</span><h2>${L(s.title)}</h2>`;
    if (s.period) h += `<div class="period">${L(s.period)}</div>`;
    if (s.intro) h += `<div class="intro">${L(s.intro)}</div>`;
    if (s.card) h += L(s.card).map(p => `<p>${p}</p>`).join('');
    if (s.projects) h += s.projects.map((p, i) => `<details class="proj" ${i === 0 ? 'open' : ''}><summary><span>${L(p.n)}</span><span class="p">${p.p}</span></summary><div class="r">${L(p.r)}</div><ul>${L(p.b).map(b => `<li>${b}</li>`).join('')}</ul></details>`).join('');
    if (s.idle) h += `<div class="intro" style="margin-top:10px"><b>🎮 ${T('idleTitle')}</b><br>${T('idleBody')}</div>`;
    if (s.dos) h += dosHtml();
    openModal(h);
    if (s.dos) initDos();
  }
  function openGoal() {
    const m = D.meta; const pdfMain = S.lang === 'ko' ? m.pdf.ko : m.pdf.en, pdfOther = S.lang === 'ko' ? m.pdf.en : m.pdf.ko;
    openModal(`<span class="yr">2026</span><h2>🏁 ${T('goalTitle')}</h2><p>${T('goalBody')}</p>
      <p>🪙 ${S.coins.size}/${totalCoins} ${T('coins')} · 🏅 ${S.ach.size}/${Object.keys(D.achievements).length} · 💤 ${S.servers}/6 ${T('servers')}</p>
      <div class="btns"><a class="pbtn primary" href="${pdfMain}" download>📄 ${T('download')}</a><a class="pbtn" href="${pdfOther}" download>📄 ${T('downloadEn')}</a>
      <a class="pbtn" href="mailto:${m.email}">✉ ${T('contact')}: ${m.email}</a><a class="pbtn" href="${m.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a class="pbtn" href="${m.github}" target="_blank" rel="noopener">GitHub</a>
      <button class="pbtn" id="btn-inv3">${T('inventory')}</button><button class="pbtn" id="btn-reset">🔄 ${T('newGame')}</button></div>`);
    $('btn-inv3').onclick = openInventory; $('btn-reset').onclick = () => { localStorage.removeItem('save'); location.reload(); };
  }
  function openInventory() {
    const cats = D.skillCats; let h = `<h2>${T('inventory').replace(/\s*\(I\)/, '')}</h2><div class="inv">`;
    for (const c in cats) {
      h += `<h3>${L(cats[c])}</h3><div class="inv-grid">`;
      for (const id in D.skills) { const sk = D.skills[id]; if (sk.cat !== c) continue; const got = S.coins.has(id) || S.rainbow;
        h += `<div class="slot ${got ? '' : 'locked'}"><div class="ic">${sk.ic}</div><div><div class="n">${got ? sk.n : '🔒 ' + sk.n}</div><div class="lv">${[1, 2, 3, 4, 5].map(l => `<i class="${got && l <= sk.lv ? 'on' : ''}"></i>`).join('')}</div></div></div>`; }
      h += '</div>';
    }
    h += `<h3>🏅 ${T('achievements')}</h3><div class="ach">`;
    for (const id in D.achievements) { const a = D.achievements[id]; const got = S.ach.has(id) || S.rainbow; h += `<div class="slot ${got ? '' : 'locked'}"><div class="ic">${a.ic}</div><div><div class="n">${got ? L(a.n) : '🔒 ' + L(a.n)}</div><div class="d">${L(a.d)}</div></div></div>`; }
    h += '</div></div>'; openModal(h);
  }
  function openText() {
    const m = D.meta, lg = S.lang; const co = D.stages.filter(s => s.company);
    let h = `<h2>📄 ${T('textResume')} — ${L(m.name)}</h2><div class="period">${L(m.title)} · ${m.email}</div><div class="resume">`;
    h += `<h3>${T('summary')}</h3><ul>${D.summary[lg].map(p => `<li>${p}</li>`).join('')}</ul>`;
    h += `<h3>${T('career')}</h3>`;
    co.forEach(s => { h += `<div class="co">${L(s.title)}<small>${L(s.period)}</small></div><ul>${s.projects.map(p => `<li><b>${L(p.n)}</b> (${p.p}, ${L(p.r)}) — ${L(p.b).join(' / ')}</li>`).join('')}</ul>`; });
    h += `<div class="co">${L(D.stages.find(s => s.id === 'tmax').title)}<small>2017.04 – 2017.06</small></div><ul><li>${L(D.stages.find(s => s.id === 'tmax').card)[0]}</li></ul>`;
    h += `<div class="co">${L(D.stages.find(s => s.id === 'kunhwa').title)}<small>2015.01 – 2016.04</small></div><ul><li>${L(D.stages.find(s => s.id === 'kunhwa').card)[1]}</li></ul>`;
    h += `<h3>${T('skills')}</h3><ul>`; for (const c in D.skillCats) h += `<li><b>${L(D.skillCats[c])}</b>: ${Object.values(D.skills).filter(s => s.cat === c).map(s => s.n).join(' · ')}</li>`; h += '</ul>';
    h += `<h3>${T('education')}</h3><ul>${D.education[lg].map(e => `<li>${e}</li>`).join('')}</ul>`;
    h += `<h3>${T('side')}</h3><ul>${D.sideProjects.map(p => `<li><a href="${p.u}" target="_blank" rel="noopener"><b>${p.n}</b></a> (${p.l}) — ${L(p.d)}</li>`).join('')}</ul></div>`;
    h += `<div class="btns"><a class="pbtn primary" href="${m.pdf.ko}" download>📄 PDF 국문</a><a class="pbtn" href="${m.pdf.en}" download>📄 PDF English</a><a class="pbtn" href="${m.linkedin}" target="_blank" rel="noopener">LinkedIn</a><a class="pbtn" href="${m.github}" target="_blank" rel="noopener">GitHub</a></div>`;
    openModal(h);
  }

  // ------------------------------------------------------------------ DOS 이스터에그
  function dosHtml() { return `<div class="dos" id="dos"><div id="dos-out">Microsoft(R) MS-DOS(R) Version 6.22\n(C)Copyright 1990-1994.\n\n${T('dosHelp')}\n</div><div class="prompt">C:\\BOSUK&gt;&nbsp;<input id="dos-in" autocomplete="off" spellcheck="false"></div></div><div id="win31"></div>`; }
  function initDos() {
    const out = $('dos-out'), inp = $('dos-in'); setTimeout(() => inp.focus(), 50); $('dos').onclick = () => inp.focus();
    const m = D.meta, ko = S.lang === 'ko';
    const CMD = {
      help: () => T('dosHelp'),
      dir: () => ` Volume in drive C is BOSUK_NAM\n Directory of C:\\BOSUK\n\nKAKAO     <DIR>   2022-03-28  ${ko ? '인프라개발팀' : 'Infra Dev Team'}\nLGCNS     <DIR>   2017-07-01  DevOn Solution\nTMAX      <DIR>   2017-04-01\nKUNHWA    <DIR>   2015-01-01\nHANYANG   <DIR>   2009-03-01\nPORTFOLIO PDF     ${ko ? m.pdf.ko : m.pdf.en}\n        6 File(s)`,
      whoami: () => `${L(m.name)} — ${L(m.title)}\n${ko ? '인프라개발팀 · Kakao Corp' : 'Infra Development Team · Kakao Corp'}`,
      skills: () => Object.values(D.skills).map(s => `${s.ic} ${s.n.padEnd(18)} ${'█'.repeat(s.lv)}${'░'.repeat(5 - s.lv)}`).join('\n'),
      career: () => D.stages.filter(s => s.company || s.id === 'tmax' || s.id === 'kunhwa').map(s => `${s.year}  ${L(s.title)}`).join('\n'),
      contact: () => `EMAIL    ${m.email}\nLINKEDIN ${m.linkedin}\nGITHUB   ${m.github}`,
      cls: () => { out.textContent = ''; return ''; },
      exit: () => { closeModal(); return ''; },
      win: () => { $('win31').innerHTML = `<div class="win31"><div class="bar"><span>Program Manager</span><span>▼ ▲</span></div><div class="body"><div>🗂<br>Main</div><div>🎮<br>Games</div><div>🖊<br>Write</div><div>🎨<br>Paintbrush</div><div>☕<br>Java</div><div>🍃<br>Spring</div><div>☸<br>K8S</div><div>🧠<br>AI</div></div></div>`; return 'Starting Windows 3.1...'; },
      sudo: () => ko ? '남보석 is not in the sudoers file. This incident will be reported. (농담입니다)' : 'bosuk is not in the sudoers file. This incident will be reported. (kidding)',
      ls: () => CMD.dir(), cat: () => CMD.whoami(), hello: () => 'שלום! 안녕하세요!',
    };
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeModal(); return; }
      if (e.key !== 'Enter') return;
      const raw = inp.value.trim(); inp.value = ''; const c = raw.toLowerCase().split(/\s+/)[0];
      out.textContent += `C:\\BOSUK> ${raw}\n`;
      if (!c) { $('dos').scrollTop = 1e6; return; }
      const r = CMD[c] ? CMD[c]() : `Bad command or file name: ${c}`;
      if (r) out.textContent += r + '\n\n'; $('dos').scrollTop = 1e6; beep(440, .03);
    });
  }

  // ------------------------------------------------------------------ 기타
  function toast(msg) { const d = document.createElement('div'); d.textContent = msg; $('toast').appendChild(d); setTimeout(() => d.remove(), 2300); }
  let AC; function beep(f, dur, delay) { if (!S.sound) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); o.type = 'square'; o.frequency.value = f; g.gain.value = 0.04; o.connect(g); g.connect(AC.destination); const t0 = AC.currentTime + (delay || 0); o.start(t0); g.gain.setValueAtTime(0.04, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur); o.stop(t0 + dur); } catch (e) {} }
  function godMode() { S.rainbow = true; Object.keys(D.skills).forEach(k => S.coins.add(k)); stages.forEach(s => s.coins.forEach(c => c.got = true)); toast('🌈 KONAMI! GOD MODE — all skills unlocked'); save(); }
  function syncAuto() { $('btn-auto').classList.toggle('on', S.auto); $('btn-auto').textContent = S.auto ? T('autoOn') : T('auto'); }
  function setLang(l) {
    S.lang = l; localStorage.setItem('lang', l); document.documentElement.lang = l;
    document.querySelectorAll('[data-ui]').forEach(el => { el.textContent = T(el.dataset.ui); });
    $('btn-lang').textContent = l === 'ko' ? 'EN' : '한국어'; $('btn-lang2').textContent = l === 'ko' ? 'English' : '한국어';
    $('title-name').textContent = L(D.meta.name); $('title-title').textContent = L(D.meta.title);
    $('title-tag').textContent = l === 'ko' ? '인프라개발팀 · Kakao Corp · 2022 –' : 'Infra Development Team · Kakao Corp · 2022 –';
    syncAuto(); if (S.started) hud();
  }
  function start(auto) { S.started = true; $('title').hidden = true; $('hud').hidden = false; S.auto = !!auto; syncAuto(); S.t = 0; hud(); if (S.sound) beep(523, .08), beep(659, .08, .09), beep(784, .12, .18); }

  // 버튼
  $('btn-start').onclick = () => start(false);
  $('btn-continue').onclick = () => start(false);
  $('btn-auto2').onclick = () => start(true);
  $('btn-text2').onclick = () => { if (!S.started) start(false); openText(); };
  $('btn-auto').onclick = () => { S.auto = !S.auto; S.target = null; syncAuto(); };
  $('btn-inv').onclick = openInventory; $('btn-text').onclick = openText;
  $('btn-skip').onclick = () => { P.x = WORLD_W - 240; S.cam = WORLD_W - W; S.goalShown = true; openGoal(); };
  $('btn-sound').onclick = () => { S.sound = !S.sound; $('btn-sound').textContent = S.sound ? '🔊' : '🔇'; if (S.sound) beep(880, .08); };
  $('btn-lang').onclick = () => setLang(S.lang === 'ko' ? 'en' : 'ko'); $('btn-lang2').onclick = () => setLang(S.lang === 'ko' ? 'en' : 'ko');
  if (S.saveX && S.saveX > 200) { $('btn-continue').hidden = false; $('btn-start').onclick = () => { localStorage.removeItem('save'); location.reload(); }; $('btn-start').dataset.ui = 'newGame'; }

  // 진행바 마커
  $('progress-marks').innerHTML = stages.map(s => `<i style="left:${(s.x / WORLD_W * 100).toFixed(1)}%" title="${s.year}"></i>`).join('');
  // 타이틀 스프라이트
  (function () { const c = document.getElementById('title-sprite').getContext('2d'); c.imageSmoothingEnabled = false; const save = cx; const rows = HERO[0]; for (let r = 0; r < rows.length; r++) for (let k = 0; k < rows[r].length; k++) { const ch = rows[r][k]; if (ch === '.') continue; c.fillStyle = PAL[ch]; c.fillRect(k * 6, r * 6, 6, 6); } })();
  // 리사이즈: 비율 유지
  function fit() { const r = Math.min(innerWidth / W, innerHeight / H); cv.style.width = (W * r) + 'px'; cv.style.height = (H * r) + 'px'; }
  addEventListener('resize', fit); fit();

  window.__game = { P, S, stages, openObject, start };
  setLang(S.lang);
  requestAnimationFrame(loop);
})();
