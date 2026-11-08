// 홈 글 지도. /post-map.json 의 3D 좌표(UMAP)와 이웃(원본 임베딩 cosine top-k)을 그린다.
// 마우스: 올리면 미리보기와 이웃 연결선, 클릭하면 글로 이동.
// 터치: 첫 탭은 미리보기, 같은 점을 한 번 더 탭하면 이동.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const root = document.getElementById('post-map');

const CATEGORY_COLORS = {
  Blog: '#0d9488',
  AWS: '#ea8c00',
  Backend: '#2563eb',
  CS: '#65a30d',
  AI: '#7c3aed',
  Frontend: '#db2777',
  PM: '#64748b',
};
const FALLBACK_COLOR = '#94a3b8';
const SCALE = 10; // [-1, 1] 좌표를 월드 단위로
const BASE_EDGES_PER_POST = 3; // 배경에 옅게 깔 연결선 수
const INTRO_MS = 1600;
const PICK_RADIUS = { mouse: 18, touch: 30 };

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hoverless = matchMedia('(hover: none)').matches;

if (root) main().catch(() => { root.hidden = true; });

async function main() {
  const res = await fetch(root.dataset.src);
  if (!res.ok) throw new Error('post-map.json');
  const posts = await res.json();
  if (!posts.length) throw new Error('empty');

  const stage = root.querySelector('.post-map__stage');
  const canvas = root.querySelector('.post-map__canvas');
  const tip = root.querySelector('.post-map__tip');
  const hint = root.querySelector('.post-map__hint');
  const legend = root.querySelector('.post-map__legend');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  // ---- 데이터 정리 ----
  const indexByKey = new Map(posts.map((p, i) => [p.key, i]));
  posts.forEach((p) => {
    p.target = new THREE.Vector3(p.pos[0], p.pos[1], p.pos[2]).multiplyScalar(SCALE);
    p.current = reducedMotion ? p.target.clone() : new THREE.Vector3();
    p.near = p.neighbors
      .map((n) => ({ i: indexByKey.get(n.key), score: n.score }))
      .filter((n) => n.i !== undefined);
    p.color = new THREE.Color(CATEGORY_COLORS[p.category] || FALLBACK_COLOR);
  });

  const cloudRadius = Math.max(...posts.map((p) => p.target.length())) + 0.6;

  // ---- 장면 ----
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  camera.position.set(0, 5, 27);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9dee6, 2.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(6, 10, 8);
  scene.add(sun);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false; // 휠로 페이지를 내리다 지도가 확대되는 일을 막는다
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.7;

  // 점
  const dots = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.34, 24, 16),
    new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.05 }),
    posts.length,
  );
  scene.add(dots);

  // 배경 연결선: 글마다 가장 비슷한 몇 개. 중복 쌍은 한 번만.
  const pairs = [];
  const seen = new Set();
  posts.forEach((p, i) => {
    p.near.slice(0, BASE_EDGES_PER_POST).forEach(({ i: j }) => {
      const id = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(id)) { seen.add(id); pairs.push([i, j]); }
    });
  });
  const baseGeo = new THREE.BufferGeometry();
  baseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pairs.length * 6), 3));
  const baseColors = new Float32Array(pairs.length * 6);
  pairs.forEach(([i, j], k) => {
    posts[i].color.toArray(baseColors, k * 6);
    posts[j].color.toArray(baseColors, k * 6 + 3);
  });
  baseGeo.setAttribute('color', new THREE.BufferAttribute(baseColors, 3));
  const baseMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.22 });
  scene.add(new THREE.LineSegments(baseGeo, baseMat));

  // 강조 연결선: 선택한 글과 이웃
  const hiGeo = new THREE.BufferGeometry();
  hiGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(10 * 6), 3));
  const hiMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.95 });
  const hiLines = new THREE.LineSegments(hiGeo, hiMat);
  hiLines.visible = false;
  scene.add(hiLines);

  // ---- 상태 ----
  let active = -1; // 미리보기 중인 글
  let pinned = false; // 터치로 고정된 미리보기
  let filter = null; // 범례에서 고른 카테고리
  const white = new THREE.Color('#ffffff');
  const tmpColor = new THREE.Color();
  const tmpMat = new THREE.Matrix4();
  const tmpScale = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpVec = new THREE.Vector3();

  function isEmphasized(i) {
    if (active >= 0) return i === active || posts[active].near.some((n) => n.i === i);
    if (filter) return posts[i].category === filter;
    return true;
  }

  function refreshColors() {
    posts.forEach((p, i) => {
      tmpColor.copy(p.color);
      if (!isEmphasized(i)) tmpColor.lerp(white, 0.78);
      dots.setColorAt(i, tmpColor);
    });
    dots.instanceColor.needsUpdate = true;
    baseMat.opacity = active >= 0 || filter ? 0.07 : 0.22;
  }

  function refreshGeometry() {
    posts.forEach((p, i) => {
      let s = 1;
      if (i === active) s = 1.9;
      else if (active >= 0 && isEmphasized(i)) s = 1.3;
      else if (filter && isEmphasized(i)) s = 1.25;
      tmpMat.compose(p.current, tmpQuat, tmpScale.setScalar(s));
      dots.setMatrixAt(i, tmpMat);
    });
    dots.instanceMatrix.needsUpdate = true;

    const bp = baseGeo.attributes.position.array;
    pairs.forEach(([i, j], k) => {
      posts[i].current.toArray(bp, k * 6);
      posts[j].current.toArray(bp, k * 6 + 3);
    });
    baseGeo.attributes.position.needsUpdate = true;

    if (active >= 0) {
      const hp = hiGeo.attributes.position.array;
      const a = posts[active];
      a.near.forEach((n, k) => {
        a.current.toArray(hp, k * 6);
        posts[n.i].current.toArray(hp, k * 6 + 3);
      });
      hiGeo.setDrawRange(0, a.near.length * 2);
      hiGeo.attributes.position.needsUpdate = true;
    }
  }

  // ---- 미리보기 카드 (데이터는 전부 textContent 로 넣는다) ----
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderTip(i) {
    const p = posts[i];
    tip.replaceChildren();
    const meta = el('div', 'post-map__tip-meta');
    const chip = el('span', 'post-map__chip', p.category);
    chip.style.setProperty('--c', `#${p.color.getHexString()}`);
    meta.append(chip, el('span', 'post-map__date', p.date));
    tip.append(meta, el('strong', 'post-map__tip-title', p.title));
    if (p.excerpt) tip.append(el('p', 'post-map__tip-excerpt', p.excerpt));

    const list = el('ol', 'post-map__near');
    p.near.slice(0, 3).forEach((n) => {
      const li = el('li');
      const a = el('a', null, posts[n.i].title);
      a.href = posts[n.i].url;
      li.append(a, el('span', 'post-map__score', n.score.toFixed(2)));
      list.append(li);
    });
    tip.append(el('div', 'post-map__near-label', '비슷한 글'), list);

    if (pinned) {
      const go = el('a', 'post-map__go', '글 읽기 →');
      go.href = p.url;
      tip.append(go);
    }
    tip.classList.toggle('is-pinned', pinned);
    tip.hidden = false;
  }

  function placeTip() {
    if (active < 0) return;
    const { x, y } = toScreen(active);
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const gap = 16;
    let left = x + gap;
    if (left + tw > sw - 8) left = x - gap - tw;
    left = Math.max(8, Math.min(left, sw - tw - 8));
    let top = y - th / 2;
    top = Math.max(8, Math.min(top, sh - th - 8));
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }

  function setActive(i, pin = false) {
    if (i === active && pin === pinned) return;
    active = i;
    pinned = i >= 0 && pin;
    controls.autoRotate = !reducedMotion && active < 0;
    hiLines.visible = active >= 0;
    if (active >= 0) {
      hiMat.color.copy(posts[active].color);
      renderTip(active);
    } else {
      tip.hidden = true;
    }
    refreshColors();
    refreshGeometry();
    placeTip();
    canvas.style.cursor = active >= 0 && !pinned ? 'pointer' : '';
  }

  // ---- 화면 좌표 기준 고르기. 점이 작아서 레이캐스트보다 반경 판정이 손에 잘 맞는다. ----
  function toScreen(i) {
    tmpVec.copy(posts[i].current).project(camera);
    return {
      x: (tmpVec.x * 0.5 + 0.5) * stage.clientWidth,
      y: (-tmpVec.y * 0.5 + 0.5) * stage.clientHeight,
      z: tmpVec.z,
    };
  }

  function pick(clientX, clientY, radius) {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let best = -1;
    let bestD = radius * radius;
    let bestZ = Infinity;
    posts.forEach((_, i) => {
      const s = toScreen(i);
      const d = (s.x - px) ** 2 + (s.y - py) ** 2;
      // 비슷한 거리면 카메라에 가까운 점을 우선한다
      if (d < bestD || (d < radius * radius && Math.abs(d - bestD) < 16 && s.z < bestZ)) {
        best = i; bestD = d; bestZ = s.z;
      }
    });
    return best;
  }

  let down = null;
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY };
    hint.classList.add('is-hidden');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || e.buttons) return;
    setActive(pick(e.clientX, e.clientY, PICK_RADIUS.mouse));
  });
  canvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && !pinned) setActive(-1);
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    down = null;
    if (moved > 6) return; // 드래그로 돌린 경우
    const isMouse = e.pointerType === 'mouse';
    const i = pick(e.clientX, e.clientY, isMouse ? PICK_RADIUS.mouse : PICK_RADIUS.touch);
    if (i < 0) { setActive(-1); return; }
    if (isMouse || (pinned && i === active)) {
      window.location.href = posts[i].url;
    } else {
      setActive(i, true);
    }
  });

  // 직접 돌리면 자동 회전을 잠깐 멈췄다가 다시 이어 간다
  let resumeTimer;
  controls.addEventListener('start', () => {
    clearTimeout(resumeTimer);
    controls.autoRotate = false;
  });
  controls.addEventListener('end', () => {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      controls.autoRotate = !reducedMotion && active < 0;
    }, 3000);
  });

  // ---- 범례 겸 카테고리 필터 ----
  const counts = {};
  posts.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, n]) => {
      const li = el('li');
      const btn = el('button', 'post-map__legend-btn');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', 'false');
      btn.style.setProperty('--c', CATEGORY_COLORS[cat] || FALLBACK_COLOR);
      btn.append(el('span', 'post-map__dot'), el('span', null, cat), el('span', 'post-map__count', String(n)));
      btn.addEventListener('click', () => {
        filter = filter === cat ? null : cat;
        legend.querySelectorAll('button').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn && filter === cat));
        });
        setActive(-1);
        refreshColors();
        refreshGeometry();
      });
      li.append(btn);
      legend.append(li);
    });

  if (hoverless) hint.textContent = '점을 탭하면 미리보기, 한 번 더 탭하면 글로 이동합니다';

  // ---- 크기, 루프 ----
  function resize() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // 점 구름을 감싸는 구가 세로, 가로 시야 중 좁은 쪽에 꼭 들어오는 거리로 카메라를 둔다.
    // 어느 방향으로 돌려도 잘리지 않고, 화면 폭이 좁으면 알아서 뒤로 물러난다.
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
    camera.position.setLength((cloudRadius / Math.sin(Math.min(vFov, hFov) / 2)) * 1.08);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  refreshColors();
  refreshGeometry();

  // 화면 밖이거나 탭이 숨겨지면 루프를 멈춰 배터리를 아낀다
  let visible = true;
  let rafId = 0;
  let introStart = -1;
  let introDone = reducedMotion;

  function loop(now) {
    rafId = 0;
    if (!visible || document.hidden) return;
    if (!introDone) {
      if (introStart < 0) introStart = now;
      const t = Math.min(1, (now - introStart) / INTRO_MS);
      const k = 1 - (1 - t) ** 3; // easeOutCubic: 중심에서 퍼져 나오며 자리를 잡는다
      posts.forEach((p) => p.current.copy(p.target).multiplyScalar(k));
      refreshGeometry();
      if (t >= 1) introDone = true;
    }
    controls.update();
    renderer.render(scene, camera);
    placeTip();
    rafId = requestAnimationFrame(loop);
  }
  const kick = () => { if (!rafId) rafId = requestAnimationFrame(loop); };

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    kick();
  }).observe(stage);
  document.addEventListener('visibilitychange', kick);

  root.classList.add('is-ready');
  kick();
}
