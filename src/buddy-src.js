/* Kiko: a small clay-style fox kit that watches your cursor.
   Built from primitives with Three.js; bundled to assets/js/buddy.js. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, SphereGeometry, ConeGeometry, TorusGeometry,
  CapsuleGeometry, MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, HemisphereLight, DirectionalLight,
  CatmullRomCurve3, TubeGeometry, Vector3, SRGBColorSpace, ACESFilmicToneMapping, MathUtils,
} from 'three';

export function mountBuddy(host, { reduceMotion = false, onSleep = () => {} } = {}) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  host.prepend(canvas);

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    canvas.remove();
    return null;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0.2, 10.2);
  camera.lookAt(0, -0.25, 0);

  /* lights: warm key, cool fill, ember rim */
  scene.add(new HemisphereLight(0xfff3ea, 0x3a2a28, 1.4));
  const key = new DirectionalLight(0xffffff, 2.2); key.position.set(2.5, 4, 5); scene.add(key);
  const rim = new DirectionalLight(0xff6436, 2.4); rim.position.set(-4, 2, -3); scene.add(rim);
  const rim2 = new DirectionalLight(0xffb08f, 1.2); rim2.position.set(4, -1, -2); scene.add(rim2);

  /* soft clay materials */
  const clay = (color, extra = {}) => new MeshPhysicalMaterial({ color, roughness: 0.55, metalness: 0, sheen: 0.6, sheenRoughness: 0.5, sheenColor: 0xffffff, clearcoat: 0.15, clearcoatRoughness: 0.6, ...extra });
  const orange = clay(0xff6f3c);
  const cream = clay(0xfff1e4);
  const dark = new MeshStandardMaterial({ color: 0x1b1414, roughness: 0.15, metalness: 0.1 });
  const shine = new MeshBasicMaterial({ color: 0xffffff });
  const blush = new MeshBasicMaterial({ color: 0xff8f86, transparent: true, opacity: 0.55 });
  const pinkInner = clay(0xffc2b0);

  const S = (r, w = 48, h = 32) => new SphereGeometry(r, w, h);
  const add = (parent, geo, mat, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0]) => {
    const m = new Mesh(geo, mat);
    m.position.set(...pos); m.scale.set(...scale); m.rotation.set(...rot);
    parent.add(m);
    return m;
  };

  const root = new Group();
  root.position.y = -0.55;
  scene.add(root);

  /* body */
  const body = new Group();
  root.add(body);
  add(body, S(1), orange, [0, -0.95, 0], [1.02, 0.92, 0.9]);
  add(body, S(0.62), cream, [0, -0.9, 0.5], [1, 1.1, 0.6]);
  const pawL = add(body, new CapsuleGeometry(0.2, 0.18, 8, 16), orange, [-0.45, -1.55, 0.55], [1, 1, 1], [Math.PI / 2.4, 0, 0.2]);
  const pawR = add(body, new CapsuleGeometry(0.2, 0.18, 8, 16), orange, [0.45, -1.55, 0.55], [1, 1, 1], [Math.PI / 2.4, 0, -0.2]);
  add(pawL, S(0.17), cream, [0, 0.2, 0.02], [1, 0.7, 1]);
  add(pawR, S(0.17), cream, [0, 0.2, 0.02], [1, 0.7, 1]);

  /* fluffy tail with a cream tip */
  const tail = new Group();
  tail.position.set(0.72, -1.35, -0.45);
  body.add(tail);
  const curve = new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0.55, 0.15, -0.1), new Vector3(0.85, 0.7, -0.05), new Vector3(0.7, 1.2, 0.1)]);
  add(tail, new TubeGeometry(curve, 40, 0.26, 20, false), orange);
  add(tail, S(0.3), cream, [0.7, 1.22, 0.1], [1, 1.25, 1]);

  /* head */
  const head = new Group();
  head.position.y = 0.45;
  root.add(head);
  add(head, S(1.12, 64, 48), orange, [0, 0, 0], [1.12, 0.96, 0.98]);
  // cheek fluff
  add(head, S(0.38), orange, [-0.88, -0.36, 0.34], [0.9, 0.7, 0.8], [0, 0, 0.5]);
  add(head, S(0.38), orange, [0.88, -0.36, 0.34], [0.9, 0.7, 0.8], [0, 0, -0.5]);
  // cream mask
  add(head, S(0.7), cream, [0, -0.33, 0.62], [1.18, 0.78, 0.72]);
  add(head, S(0.34), cream, [-0.5, -0.12, 0.72], [1, 0.9, 0.6]);
  add(head, S(0.34), cream, [0.5, -0.12, 0.72], [1, 0.9, 0.6]);
  // nose
  add(head, S(0.11), dark, [0, -0.2, 1.24], [1.3, 0.85, 0.9]);
  add(head, S(0.03, 12, 8), shine, [-0.03, -0.16, 1.33]);
  // mouth: two little arcs, a cat-like "w"
  const mouthGeo = new TorusGeometry(0.075, 0.018, 8, 24, Math.PI);
  add(head, mouthGeo, dark, [-0.072, -0.35, 1.2], [1, 1, 1], [0.25, 0, Math.PI]);
  add(head, mouthGeo, dark, [0.072, -0.35, 1.2], [1, 1, 1], [0.25, 0, Math.PI]);
  // eyes (with highlights), grouped for blinking
  const eyes = [];
  for (const x of [-0.42, 0.42]) {
    const eye = new Group();
    eye.position.set(x, 0.1, 0.98);
    eye.rotation.y = x * 0.35;
    head.add(eye);
    add(eye, S(0.155), dark, [0, 0, 0], [0.92, 1.12, 0.6]);
    add(eye, S(0.05, 16, 12), shine, [0.045, 0.07, 0.09]);
    add(eye, S(0.022, 12, 8), shine, [-0.04, -0.05, 0.09]);
    eyes.push(eye);
  }
  // blush
  add(head, S(0.16), blush, [-0.7, -0.2, 0.84], [1.2, 0.55, 0.3], [0, -0.5, 0]);
  add(head, S(0.16), blush, [0.7, -0.2, 0.84], [1.2, 0.55, 0.3], [0, 0.5, 0]);
  // ears
  const ears = [];
  for (const side of [-1, 1]) {
    const ear = new Group();
    ear.position.set(side * 0.66, 0.78, -0.05);
    ear.rotation.set(-0.1, 0, side * -0.38);
    head.add(ear);
    add(ear, new ConeGeometry(0.36, 0.72, 32), orange, [0, 0.3, 0]);
    add(ear, new ConeGeometry(0.21, 0.46, 32), pinkInner, [0, 0.24, 0.13], [1, 1, 0.45]);
    add(ear, new ConeGeometry(0.1, 0.2, 16), dark, [0, 0.6, 0], [1.2, 1, 1.2]);
    ears.push(ear);
  }

  /* sizing */
  const resize = () => {
    const w = host.clientWidth || 300;
    const h = host.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(host); else window.addEventListener('resize', resize);

  /* pointer tracking: look at the cursor anywhere on the page */
  const target = { x: 0, y: 0 };
  const look = { x: 0, y: 0 };
  let lastMove = 0;
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.42;
    target.x = MathUtils.clamp((e.clientX - cx) / (window.innerWidth * 0.45), -1, 1);
    target.y = MathUtils.clamp((e.clientY - cy) / (window.innerHeight * 0.5), -1, 1);
    lastMove = performance.now();
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  // any sign of life wakes Kiko up
  const nudge = () => { lastMove = performance.now(); };
  ['wheel', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, nudge, { passive: true }));
  let sleeping = false;
  let sleepAmt = 0;

  /* a happy hop when poked */
  let hop = 0;
  const poke = () => { lastMove = performance.now(); hop = 1; ears.forEach((e, i) => { e.userData.flick = 1 + i * 0.2; }); };
  host.addEventListener('click', poke);
  host.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); poke(); } });

  /* blinking */
  let nextBlink = performance.now() + 1800;
  let blinkT = -1;

  let visible = true;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0 }) : null;
  if (io) io.observe(host);

  let raf = 0;
  let prev = performance.now();
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    if (!visible) { prev = now; return; }
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = now / 1000;

    // wander gently when the pointer has been still for a while (and on touch screens)
    let tx = target.x;
    let ty = target.y;
    const idle = now - lastMove;
    if (idle > 4000 && !reduceMotion) {
      tx = Math.sin(t * 0.5) * 0.45;
      ty = Math.sin(t * 0.33) * 0.15;
    }
    // doze off after a long quiet spell, wake on the next movement
    const shouldSleep = !reduceMotion && idle > 15000;
    if (shouldSleep !== sleeping) {
      sleeping = shouldSleep;
      onSleep(sleeping);
      if (!sleeping) ears.forEach((e, i) => { e.userData.flick = 1 + i * 0.3; });
    }
    sleepAmt += ((sleeping ? 1 : 0) - sleepAmt) * (1 - Math.pow(0.02, dt));
    tx *= 1 - sleepAmt;
    ty = ty * (1 - sleepAmt) + sleepAmt * 0.55;
    const k = 1 - Math.pow(0.0015, dt);
    look.x += (tx - look.x) * k;
    look.y += (ty - look.y) * k;

    head.rotation.y = look.x * 0.75;
    head.rotation.x = look.y * 0.45;
    head.rotation.z = -look.x * 0.12;
    body.rotation.y = look.x * 0.25;

    // idle life
    const bob = reduceMotion ? 0 : Math.sin(t * (2 - sleepAmt * 1.2)) * (0.04 + sleepAmt * 0.02);
    hop = Math.max(0, hop - dt * 1.9);
    const hopY = Math.sin((1 - hop) * Math.PI) * (hop > 0 ? 0.55 : 0);
    root.position.y = -0.55 + bob + hopY;
    const squash = 1 + (reduceMotion ? 0 : Math.sin(t * 2) * 0.012);
    body.scale.set(1 / squash, squash, 1 / squash);
    tail.rotation.z = reduceMotion ? 0 : Math.sin(t * 3.2) * 0.22 * (1 - sleepAmt * 0.85) + (hop > 0 ? Math.sin(t * 22) * 0.2 : 0);

    ears.forEach((ear, i) => {
      const side = i === 0 ? -1 : 1;
      const f = ear.userData.flick || 0;
      ear.userData.flick = Math.max(0, f - dt * 3);
      ear.rotation.z = side * -0.38 + Math.sin(f * 9) * 0.25 * f;
    });

    // blink (and happy squint mid-hop)
    if (blinkT < 0 && now > nextBlink) { blinkT = 0; }
    let lid = 1;
    if (blinkT >= 0) {
      blinkT += dt;
      lid = Math.abs(Math.cos(Math.min(1, blinkT / 0.16) * Math.PI));
      if (blinkT > 0.16) { blinkT = -1; nextBlink = now + 2200 + Math.random() * 3200; }
    }
    if (hop > 0.15) lid = Math.min(lid, 0.18);
    lid = lid * (1 - sleepAmt) + 0.06 * sleepAmt;
    eyes.forEach((e) => { e.scale.y = Math.max(0.08, lid); });

    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(tick);

  return {
    hop: poke,
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      renderer.dispose();
    },
  };
}
