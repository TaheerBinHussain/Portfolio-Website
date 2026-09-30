/* Taheer Bin Hussain portfolio interactions.
   Plain JS. Optional helpers: js/lenis.min.js (smooth scrolling) and js/buddy.js (Kiko, loaded on demand).
   Everything degrades to readable static content without JavaScript. */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- smooth, weighted scrolling (desktop pointers only) ---------- */
  let lenis = null;
  if (!reduceMotion && finePointer && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 0.95, autoRaf: true, anchors: { offset: -84 } });
  }
  const scrollToEl = (el, smooth = true) => {
    if (lenis && smooth) lenis.scrollTo(el, { offset: -96, duration: 1.4 });
    else el.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
  };

  /* ---------- split display type into letters, headings into words ---------- */
  $$('.monument').forEach((m) => {
    let i = 0;
    $$('.m-line > span', m).forEach((line) => {
      const text = line.textContent;
      line.textContent = '';
      [...text].forEach((c) => {
        const ch = document.createElement('span');
        ch.className = 'ch';
        ch.textContent = c;
        ch.style.setProperty('--i', i++);
        line.appendChild(ch);
      });
    });
  });
  $$('.h-section').forEach((h) => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute('aria-label', h.textContent.trim());
    h.textContent = '';
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      outer.setAttribute('aria-hidden', 'true');
      const inner = document.createElement('span');
      inner.textContent = w;
      inner.style.setProperty('--i', i);
      outer.appendChild(inner);
      h.appendChild(outer);
      if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
  });

  /* ---------- hero entrance ---------- */
  const hero = $('.hero');
  requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('ready')));
  setTimeout(() => hero.classList.add('settled'), 2600);

  /* ---------- monitor follows the pointer a little ---------- */
  const tilt = $('.monitor-tilt');
  if (tilt && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    let frame = 0;
    hero.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
        tilt.style.setProperty('--rx', `${(-y * 6).toFixed(2)}deg`);
      });
    });
    hero.addEventListener('pointerleave', () => {
      tilt.style.setProperty('--ry', '0deg');
      tilt.style.setProperty('--rx', '0deg');
    });
  }

  /* ---------- numbers count up when seen ---------- */
  const counters = $$('.count');
  const runCount = (el) => {
    const to = parseFloat(el.dataset.to);
    const from = parseFloat(el.dataset.from || '0');
    const decimals = (el.dataset.to.split('.')[1] || '').length;
    const dur = 1400;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (from + (to - from) * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (hasIO && !reduceMotion) {
    counters.forEach((el) => { el.textContent = parseFloat(el.dataset.from || '0').toFixed((el.dataset.to.split('.')[1] || '').length); });
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  }

  /* contact headline letters */
  const contactTitle = $('.monument-contact');
  if (contactTitle && hasIO) {
    const mio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { contactTitle.classList.add('in'); mio.disconnect(); } }, { threshold: 0.3 });
    mio.observe(contactTitle);
  } else if (contactTitle) {
    contactTitle.classList.add('in');
  }

  /* ---------- local time in Faisalabad ---------- */
  const clock = $('.clock');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: clock.dataset.tz });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 15000);
  }

  /* ---------- header: solid once the hero headline has scrolled away ---------- */
  const header = $('.site-header');
  if (hasIO) {
    const sentinel = $('.hero .monument');
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('solid', !entry.isIntersecting);
    }, { rootMargin: '-64px 0px 0px 0px' }).observe(sentinel);
    // switch the bar to its dark style while it sits over the dark contact section
    new IntersectionObserver(([entry]) => {
      header.classList.toggle('dark', entry.isIntersecting);
    }, { rootMargin: '0px 0px -93% 0px' }).observe($('#contact'));
  } else {
    header.classList.add('solid');
  }

  /* ---------- mobile menu ---------- */
  const menuBtn = $('.menu-btn');
  const nav = $('#site-nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.sr', menuBtn).textContent = open ? 'Close menu' : 'Open menu';
    $('use', menuBtn).setAttribute('href', open ? '#i-close' : '#i-menu');
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false);
  });

  /* ---------- sliding highlight behind the active nav item ---------- */
  const ind = $('.nav-ind');
  let indLink = null;
  const moveInd = (link) => {
    indLink = link;
    if (!ind) return;
    const menuMode = getComputedStyle(nav).position === 'fixed';
    nav.classList.toggle('has-ind', !menuMode);
    if (!link || menuMode || link.classList.contains('nav-cta')) { ind.style.opacity = '0'; return; }
    ind.style.opacity = '1';
    ind.style.width = `${link.offsetWidth}px`;
    ind.style.transform = `translateX(${link.offsetLeft}px)`;
  };
  window.addEventListener('resize', () => moveInd(indLink));

  /* ---------- active section in nav ---------- */
  const navLinks = $$('.site-nav a');
  const linkFor = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  if (hasIO) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
        const link = linkFor.get(entry.target.id);
        if (link) { link.classList.add('active'); link.setAttribute('aria-current', 'true'); }
        moveInd(link || null);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach((s) => spy.observe(s));
  }

  $$('.t-year').forEach((y) => $$('.ev', y).forEach((e, i) => e.style.setProperty('--i', i)));

  /* ---------- scroll reveals ---------- */
  const reveals = $$('.reveal');
  if (hasIO && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        // stagger siblings that enter together
        const siblings = $$('.reveal', e.target.parentElement).filter((el) => !el.classList.contains('in'));
        const i = Math.max(0, siblings.indexOf(e.target));
        e.target.style.transitionDelay = `${Math.min(i, 4) * 70}ms`;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- hero stack: pick a layer ---------- */
  const layers = $$('.layer');
  const details = $$('.layer-detail');
  const selectLayer = (key) => {
    layers.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layer === key)));
    details.forEach((d) => { d.hidden = d.dataset.for !== key; });
  };
  layers.forEach((btn) => btn.addEventListener('click', () => selectLayer(btn.dataset.layer)));

  // The screen keeps one height whichever layer is showing, so nothing below it shifts.
  const layerPanel = $('.layer-panel');
  const lockLayerPanel = () => {
    if (!layerPanel) return;
    layerPanel.style.minHeight = '';
    let max = 0;
    details.forEach((d) => { const was = d.hidden; d.hidden = false; max = Math.max(max, d.offsetHeight); d.hidden = was; });
    layerPanel.style.minHeight = `${max + parseFloat(getComputedStyle(layerPanel).paddingTop)}px`;
  };
  lockLayerPanel();
  window.addEventListener('resize', lockLayerPanel);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockLayerPanel);

  /* ---------- hero intro: the screen powers on, a mouse arrives and drives the screen ---------- */
  const screen = $('.monitor-screen');
  const cursor = $('.screen-cursor');
  const ring = $('.click-ring');
  const deskMouse = $('.desk-mouse');
  const mouseMove = $('.mouse-move');
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let demoRunning = false;
  let demoCancelled = false;

  // Position of an element inside the screen, in the screen's own (untransformed) layout space.
  const posIn = (el, fx = 0.5, fy = 0.6) => {
    let x = 0; let y = 0; let n = el;
    while (n && n !== screen) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x + el.offsetWidth * fx, y: y + el.offsetHeight * fy };
  };
  // The desk mouse moves a little in the same direction as the cursor on screen.
  const driveMouse = (x, y, dur) => {
    const nx = x / screen.clientWidth - 0.5;
    const ny = y / screen.clientHeight - 0.5;
    mouseMove.style.transitionDuration = `${dur}ms`;
    mouseMove.style.transform = `translate(${(nx * 96).toFixed(1)}px, ${(ny * 20).toFixed(1)}px) rotate(${(nx * 10).toFixed(1)}deg)`;
  };
  const cursorTo = async (pt, dur = 900) => {
    if (demoCancelled) return;
    cursor.style.transitionDuration = `${dur}ms`;
    cursor.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`;
    driveMouse(pt.x, pt.y, dur);
    await sleep(dur);
  };
  const pressMouse = () => {
    deskMouse.classList.add('press');
    setTimeout(() => deskMouse.classList.remove('press'), 180);
  };
  const clickAt = async (el) => {
    if (demoCancelled) return;
    el.classList.add('sim-hover');
    await sleep(260);
    if (demoCancelled) { el.classList.remove('sim-hover'); return; }
    pressMouse();
    el.classList.add('sim-press');
    const p = posIn(el);
    ring.style.left = `${p.x}px`; ring.style.top = `${p.y}px`;
    ring.classList.remove('go'); void ring.offsetWidth; ring.classList.add('go');
    await sleep(140);
    el.classList.remove('sim-press');
    if (el.dataset.layer) selectLayer(el.dataset.layer);
    await sleep(200);
    el.classList.remove('sim-hover');
  };
  const hoverOver = async (el, ms) => {
    if (demoCancelled) return;
    el.classList.add('sim-hover');
    await sleep(ms);
    el.classList.remove('sim-hover');
  };
  const stopDemo = () => {
    if (!demoRunning || demoCancelled) return;
    demoCancelled = true;
    screen.classList.remove('demo');
    $$('.sim-hover', screen).forEach((e) => e.classList.remove('sim-hover'));
  };

  const runIntro = async () => {
    screen.classList.add('boot');
    await sleep(1650);                      // monitor has risen into place
    screen.classList.add('power');          // flicker on
    await sleep(700);
    screen.classList.remove('boot');
    await sleep(500);
    deskMouse.classList.add('in');          // the mouse slides onto the desk
    await sleep(700);
    demoRunning = true;
    const layerBy = (k) => $(`.layer[data-layer="${k}"]`);
    const start = { x: screen.clientWidth * 0.5, y: screen.clientHeight * 0.82 };
    cursor.style.transitionDuration = '0ms';
    cursor.style.transform = `translate(${start.x}px, ${start.y}px)`;
    driveMouse(start.x, start.y, 0);
    screen.classList.add('demo');           // cursor appears
    await sleep(450);

    await cursorTo(posIn(layerBy('k8s')), 950);
    await clickAt(layerBy('k8s'));
    await sleep(700);
    const link = $('.layer-detail[data-for="k8s"] li:nth-child(2) a');
    if (link) { await cursorTo(posIn(link, 0.35, 0.7), 700); await hoverOver(link, 750); }
    await cursorTo(posIn(layerBy('cloud')), 800);
    await clickAt(layerBy('cloud'));
    await sleep(900);
    await cursorTo(posIn(layerBy('obs')), 750);
    await clickAt(layerBy('obs'));
    await sleep(900);
    await cursorTo(posIn(layerBy('agents')), 850);
    await clickAt(layerBy('agents'));
    await sleep(600);
    // park the cursor and hand over
    await cursorTo({ x: screen.clientWidth * 0.86, y: screen.clientHeight * 0.9 }, 900);
    if (!demoCancelled) { screen.classList.remove('demo'); }
    demoRunning = false;
  };

  if (screen) {
    if (reduceMotion) {
      deskMouse.classList.add('in', 'still');
    } else {
      screen.classList.add('boot');
      runIntro();
      // any sign of the visitor taking over ends the demo right away
      screen.addEventListener('pointerenter', stopDemo);
      screen.addEventListener('pointerdown', stopDemo);
      window.addEventListener('keydown', stopDemo);
      window.addEventListener('wheel', stopDemo, { passive: true, once: true });
      window.addEventListener('touchstart', stopDemo, { passive: true, once: true });
    }
    // afterwards the desk mouse mirrors the visitor's own pointer on the screen
    if (window.matchMedia('(pointer: fine)').matches) {
      screen.addEventListener('pointermove', (e) => {
        if (demoRunning && !demoCancelled) return;
        const r = screen.getBoundingClientRect();
        driveMouse(((e.clientX - r.left) / r.width) * screen.clientWidth, ((e.clientY - r.top) / r.height) * screen.clientHeight, 120);
      });
      screen.addEventListener('pointerdown', pressMouse);
      screen.addEventListener('pointerleave', () => driveMouse(screen.clientWidth / 2, screen.clientHeight / 2, 700));
    }
  }

  /* ---------- featured work: accessible tabs ---------- */
  const tabs = $$('.track [role="tab"]');
  const panels = $$('.panels [role="tabpanel"]');
  const panelIds = new Set(panels.map((p) => p.id));

  let currentTab = null;
  const activate = (tab, { focus = false, animate = true } = {}) => {
    const dir = currentTab ? Math.sign(tabs.indexOf(tab) - tabs.indexOf(currentTab)) : 0;
    currentTab = tab;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => {
      const on = p.id === tab.getAttribute('aria-controls');
      p.hidden = !on;
      if (on && animate && !reduceMotion) {
        p.style.setProperty('--dir', dir);
        p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter');
      }
    });
    runPacket();
    if (focus) tab.focus();
    // keep the selected tab visible in the horizontal strip on small screens (scroll only the strip)
    const track = tab.parentElement;
    if (track.scrollWidth > track.clientWidth) {
      const left = tab.offsetLeft - track.clientWidth / 2 + tab.offsetWidth / 2;
      track.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };

  panels.forEach((p) => { p.tabIndex = 0; });

  /* A glowing packet travels through the active pipeline diagram, lighting each stage as it arrives. */
  let packetRun = 0;
  let workVisible = false;
  const runPacket = async () => {
    const run = ++packetRun;
    $$('.packet').forEach((pk) => pk.remove());
    if (reduceMotion || !workVisible) return;
    const panel = panels.find((p) => !p.hidden);
    const flow = panel && $('.flow', panel);
    if (!flow) return;
    const nodes = $$('.node', flow);
    const pk = document.createElement('span');
    pk.className = 'packet';
    pk.setAttribute('aria-hidden', 'true');
    flow.appendChild(pk);
    const centre = (n) => ({ x: n.offsetLeft + n.offsetWidth / 2, y: n.offsetTop + n.offsetHeight / 2 });
    await sleep(700);
    while (run === packetRun) {
      for (let i = 0; i < nodes.length; i++) {
        if (run !== packetRun) return;
        const c = centre(nodes[i]);
        const prev = i === 0 ? { x: c.x - 40, y: c.y } : centre(nodes[i - 1]);
        const anim = pk.animate([
          { transform: `translate(${prev.x}px, ${prev.y}px) scale(${i === 0 ? 0 : 1})`, opacity: i === 0 ? 0 : 1 },
          { transform: `translate(${c.x}px, ${c.y}px) scale(1)`, opacity: 1 },
        ], { duration: i === 0 ? 400 : 620, easing: 'cubic-bezier(0.45, 0.05, 0.2, 1)', fill: 'forwards' });
        await anim.finished.catch(() => {});
        if (run !== packetRun) return;
        nodes[i].classList.remove('hit'); void nodes[i].offsetWidth; nodes[i].classList.add('hit');
        await sleep(260);
      }
      const last = centre(nodes[nodes.length - 1]);
      await pk.animate([{ transform: `translate(${last.x}px, ${last.y}px) scale(1)`, opacity: 1 }, { transform: `translate(${last.x}px, ${last.y}px) scale(2.6)`, opacity: 0 }], { duration: 500, fill: 'forwards' }).finished.catch(() => {});
      await sleep(900);
    }
  };
  if (hasIO) {
    new IntersectionObserver(([e]) => {
      const was = workVisible;
      workVisible = e.isIntersecting;
      if (workVisible && !was) runPacket();
      if (!workVisible) { packetRun++; $$('.packet').forEach((pk) => pk.remove()); }
    }, { threshold: 0.15 }).observe($('.explorer'));
  }
  window.addEventListener('resize', () => { if (workVisible) { clearTimeout(window.__pk); window.__pk = setTimeout(runPacket, 200); } });
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => {
      activate(tab);
      // Only on narrow screens, where the tab strip is a sticky horizontal bar, and only if the new
      // case study would start hidden behind it. On desktop the page never moves.
      const track = tab.parentElement;
      if (getComputedStyle(track).flexDirection !== 'row') return;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      const stripBottom = track.getBoundingClientRect().bottom;
      const top = panel.getBoundingClientRect().top;
      if (top < stripBottom - 1) window.scrollBy({ top: top - stripBottom - 12, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    tab.addEventListener('keydown', (e) => {
      const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
      let next = null;
      if (e.key in keys) next = tabs[(i + keys[e.key] + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); activate(next, { focus: true }); }
    });
  });
  activate(tabs[0], { animate: false });

  // Keep the panel area as tall as the tallest case study, so switching never shifts the page below.
  const panelBox = $('.panels');
  const lockPanelHeight = () => {
    panelBox.style.minHeight = '';
    const current = panels.find((p) => !p.hidden);
    let max = 0;
    panels.forEach((p) => {
      const was = p.hidden;
      p.hidden = false;
      max = Math.max(max, p.offsetHeight);
      p.hidden = was;
    });
    if (current) current.hidden = false;
    panelBox.style.minHeight = `${max}px`;
  };
  lockPanelHeight();
  let lockTimer;
  window.addEventListener('resize', () => { clearTimeout(lockTimer); lockTimer = setTimeout(lockPanelHeight, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(lockPanelHeight);

  // Links such as #p-agents (from the hero stack) open the right case study.
  const openCaseFromHash = (hash, smooth = true) => {
    const id = hash.replace('#', '');
    if (!panelIds.has(id)) return false;
    const tab = tabs.find((t) => t.getAttribute('aria-controls') === id);
    activate(tab);
    scrollToEl(window.innerWidth > 960 ? $('.explorer') : $('#work .section-head'), smooth);
    return true;
  };
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#p-"]');
    if (a && openCaseFromHash(a.getAttribute('href'))) {
      e.preventDefault();
      history.replaceState(null, '', a.getAttribute('href'));
    }
  });
  if (location.hash) openCaseFromHash(location.hash, false);

  /* ---------- research bars: grow once when seen ---------- */
  const bars = $$('.bars');
  if (hasIO) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    bars.forEach((b) => io.observe(b));
  } else {
    bars.forEach((b) => b.classList.add('in'));
  }

  /* ---------- timeline filter ---------- */
  const filters = $$('.filter');
  const events = $$('.timeline .ev');
  filters.forEach((f) => f.addEventListener('click', () => {
    const type = f.dataset.filter;
    filters.forEach((b) => b.setAttribute('aria-pressed', String(b === f)));
    events.forEach((ev) => ev.classList.toggle('dim', type !== 'all' && ev.dataset.type !== type));
  }));

  /* ---------- copy email ---------- */
  const toast = $('.toast');
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  $$('.copy').forEach((btn) => btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without the async clipboard API
      const ta = Object.assign(document.createElement('textarea'), { value: text });
      ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
    }
    if (!ok) { showToast('Copy failed. Select the address instead.'); return; }
    btn.classList.add('done');
    $('.copy-label', btn).textContent = 'Copied';
    showToast('Email address copied');
    buddySay('copied!', true);
    setTimeout(() => { btn.classList.remove('done'); $('.copy-label', btn).textContent = 'Copy email'; }, 2200);
  }));

  /* ---------- Kiko the fox: loads only when the contact section gets close ---------- */
  const buddyHost = $('.buddy');
  const bubble = $('.buddy-bubble');
  let buddyApi = null;
  let bubbleTimer;
  const buddySay = (text, hop = false) => {
    if (!buddyHost || !buddyHost.classList.contains('on')) return;
    bubble.textContent = text;
    buddyHost.classList.add('greet');
    if (hop && buddyApi && buddyApi.hop) buddyApi.hop();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { buddyHost.classList.remove('greet'); bubble.textContent = 'hi there!'; }, 2200);
  };
  const emailLink = $('.email');
  if (emailLink) {
    emailLink.addEventListener('pointerenter', () => buddySay('write to him!'));
  }
  const loadBuddy = () => {
    import('./buddy.js').then(({ mountBuddy }) => {
      const api = mountBuddy(buddyHost, { reduceMotion, onSleep: (z) => buddyHost.classList.toggle('sleeping', z) });
      if (!api) return;
      buddyApi = api;
      buddyHost.classList.add('on');
      // say hi once when it first comes into view
      if (hasIO) {
        const hio = new IntersectionObserver(([e]) => {
          if (!e.isIntersecting) return;
          buddyHost.classList.add('greet');
          setTimeout(() => buddyHost.classList.remove('greet'), 2600);
          hio.disconnect();
        }, { threshold: 0.6 });
        hio.observe(buddyHost);
      }
    }).catch(() => { /* no WebGL or module support: the page simply goes without Kiko */ });
  };
  if (buddyHost) {
    if (hasIO) {
      const lio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { loadBuddy(); lio.disconnect(); } }, { rootMargin: '900px 0px' });
      lio.observe($('#contact'));
    } else {
      loadBuddy();
    }
  }

  /* ---------- cursor spotlight on cards ---------- */
  if (finePointer && !reduceMotion) {
    let spotFrame = 0;
    document.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(spotFrame);
      spotFrame = requestAnimationFrame(() => {
        const card = e.target.closest && e.target.closest('.spot');
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    }, { passive: true });

    /* ---------- magnetic calls to action ---------- */
    $$('.magnetic').forEach((el) => {
      const strength = parseFloat(el.dataset.magnet || '0.3');
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength * 1.2;
        el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = '0px 0px'; });
    });
  }

  /* ---------- the orange tools strip reacts to scroll speed ---------- */
  const band = $('.band');
  const bandTrack = $('.band-track');
  if (lenis && band && bandTrack && bandTrack.getAnimations) {
    let targetRate = 1;
    let rate = 1;
    let looping = false;
    const loop = () => {
      const anim = bandTrack.getAnimations()[0];
      targetRate += (1 - targetRate) * 0.06;
      rate += (targetRate - rate) * 0.12;
      if (anim) anim.playbackRate = rate;
      band.style.setProperty('--skew', `${Math.max(-4, Math.min(4, (rate - 1) * -0.9)).toFixed(2)}deg`);
      if (Math.abs(rate - 1) > 0.01 || Math.abs(targetRate - 1) > 0.01) requestAnimationFrame(loop);
      else { looping = false; if (anim) anim.playbackRate = 1; band.style.setProperty('--skew', '0deg'); }
    };
    lenis.on('scroll', ({ velocity }) => {
      targetRate = 1 + Math.max(-6, Math.min(6, velocity / 6));
      if (!looping) { looping = true; requestAnimationFrame(loop); }
    });
  }

  /* ---------- live details from GitHub (language, last update, stars) ---------- */
  const GH_USER = 'TaheerBinHussain';
  const LANG_COLORS = {
    Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#663399', HCL: '#844FBA',
    Shell: '#89e051', Dockerfile: '#384d54', 'C++': '#f34b7d', C: '#555555', 'Jupyter Notebook': '#DA5B0B', Go: '#00ADD8',
    Java: '#b07219', Smarty: '#f0c040', Makefile: '#427819', Mustache: '#724b3b', 'Go Template': '#00ADD8',
  };
  const repoLinks = $$(`a[href^="https://github.com/${GH_USER}/"]`);
  const fmtMonth = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
  const showRepoMeta = (repos) => {
    const byName = new Map(repos.map((r) => [String(r.name).toLowerCase(), r]));
    repoLinks.forEach((a) => {
      const name = a.getAttribute('href').split('/')[4];
      const repo = name && byName.get(name.toLowerCase());
      if (!repo || a.dataset.gh) return;
      a.dataset.gh = '1';
      const meta = document.createElement('span');
      meta.className = 'gh-meta';
      const bits = [];
      if (repo.language) bits.push(`<span class="gh-lang"><i style="background:${LANG_COLORS[repo.language] || '#a2a2a2'}"></i>${repo.language}</span>`);
      if (repo.pushed_at) bits.push(`<span>Updated ${fmtMonth.format(new Date(repo.pushed_at))}</span>`);
      if (repo.stargazers_count > 0) bits.push(`<span class="gh-stars">&#9733; ${repo.stargazers_count}</span>`);
      if (!bits.length) return;
      meta.innerHTML = bits.join('');
      meta.title = 'Live from GitHub';
      const row = a.closest('.row');
      if (row) $('.row-main', row).appendChild(meta);
      else a.insertAdjacentElement('beforebegin', meta);
      requestAnimationFrame(() => meta.classList.add('in'));
    });
  };
  const loadRepos = async () => {
    const KEY = 'gh-repos-v1';
    try {
      const cached = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (cached && Date.now() - cached.t < 3600000) { showRepoMeta(cached.d); return; }
    } catch { /* storage unavailable: fetch instead */ }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(`https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=pushed`, { signal: ctrl.signal, headers: { Accept: 'application/vnd.github+json' } });
      clearTimeout(timer);
      if (!res.ok) return;
      const data = (await res.json()).map((r) => ({ name: r.name, language: r.language, pushed_at: r.pushed_at, stargazers_count: r.stargazers_count }));
      try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: data })); } catch { /* ignore */ }
      showRepoMeta(data);
    } catch { /* offline, rate-limited or blocked: the page simply shows no live details */ }
  };
  if (repoLinks.length) {
    if (hasIO) {
      const gio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { gio.disconnect(); loadRepos(); } }, { rootMargin: '600px 0px' });
      gio.observe($('#work'));
    } else {
      loadRepos();
    }
  }

  /* ---------- command palette: Ctrl/Cmd + K or "/" ---------- */
  const palette = $('#palette');
  const pInput = $('.palette-input');
  const pList = $('#palette-list');
  const pEmpty = $('.palette-empty');
  const cmdkBtn = $('.cmdk-btn');
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  if (cmdkBtn && isMac) $('.cmdk-key', cmdkBtn).textContent = '⌘ K';

  const flash = (el) => {
    if (!el) return;
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1800);
  };
  const jump = (el, highlight = el) => { scrollToEl(el); setTimeout(() => flash(highlight), lenis ? 900 : 500); };
  const items = [];
  $$('.site-nav a').forEach((a) => {
    const label = a.textContent.replace('+', '').trim();
    items.push({ label: label.charAt(0) + label.slice(1).toLowerCase(), group: 'Section', run: () => jump($(a.getAttribute('href'))) });
  });
  tabs.forEach((t) => {
    items.push({ label: $('.track-name', t).textContent, hint: $('.track-kind', t).textContent, group: 'Internship', run: () => { openCaseFromHash(`#${t.getAttribute('aria-controls')}`); setTimeout(() => flash($('.panels')), 900); } });
  });
  $$('.row').forEach((r) => {
    items.push({ label: $('h3', r).firstChild.textContent.trim(), group: 'Project', run: () => jump(r) });
  });
  $$('.acad-item').forEach((c) => {
    items.push({ label: $('h4', c).textContent, hint: $('.acad-tech', c).textContent, group: 'Academic', run: () => jump(c) });
  });
  items.push(
    { label: 'Predictive autoscaling research', hint: 'ARIMA vs HPA', group: 'Research', run: () => jump($('#research')) },
    { label: 'AWS Solutions Architect certification', hint: '915 / 1000', group: 'Credential', run: () => jump($('.cert-main')) },
    { label: 'Copy email address', hint: 'taheerbinhussain@gmail.com', group: 'Action', run: () => $('.copy').click() },
    { label: 'Write an email', group: 'Action', run: () => { location.href = 'mailto:taheerbinhussain@gmail.com'; } },
    { label: 'Open GitHub profile', group: 'Link', run: () => window.open('https://github.com/TaheerBinHussain', '_blank', 'noopener') },
    { label: 'Open LinkedIn profile', group: 'Link', run: () => window.open('https://www.linkedin.com/in/taheer-bin-hussain-1a5714327/', '_blank', 'noopener') },
    { label: 'Say hi to Kiko', hint: 'the fox', group: 'Fun', run: () => { jump($('#contact')); setTimeout(() => buddySay('hi hi!', true), 1400); } },
    { label: 'Back to top', group: 'Section', run: () => jump($('#top')) },
  );

  let shown = [];
  let activeIdx = 0;
  const render = () => {
    const q = pInput.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    shown = items.filter((it) => {
      const hay = `${it.label} ${it.hint || ''} ${it.group}`.toLowerCase();
      return q.every((w) => hay.includes(w));
    });
    activeIdx = Math.min(activeIdx, Math.max(0, shown.length - 1));
    pList.innerHTML = '';
    shown.forEach((it, i) => {
      const li = document.createElement('li');
      li.id = `pal-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === activeIdx));
      li.innerHTML = `<span class="pal-group">${it.group}</span><span class="pal-label"></span><span class="pal-hint"></span><svg class="pal-go" aria-hidden="true"><use href="#i-return"/></svg>`;
      $('.pal-label', li).textContent = it.label;
      $('.pal-hint', li).textContent = it.hint || '';
      li.addEventListener('pointermove', () => { if (activeIdx !== i) { activeIdx = i; mark(); } });
      li.addEventListener('click', () => choose(i));
      pList.appendChild(li);
    });
    pEmpty.hidden = shown.length > 0;
    pInput.setAttribute('aria-activedescendant', shown.length ? `pal-${activeIdx}` : '');
  };
  const mark = () => {
    $$('[role="option"]', pList).forEach((li, i) => li.setAttribute('aria-selected', String(i === activeIdx)));
    pInput.setAttribute('aria-activedescendant', shown.length ? `pal-${activeIdx}` : '');
    const cur = $(`#pal-${activeIdx}`);
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  };
  const closePalette = () => { if (palette.open) palette.close(); };
  let chose = false;
  const choose = (i) => { const it = shown[i]; if (!it) return; chose = true; closePalette(); setTimeout(it.run, 60); };
  const openPalette = () => {
    if (!palette || palette.open) return;
    pInput.value = '';
    activeIdx = 0;
    render();
    palette.showModal();
    if (lenis) lenis.stop();
    pInput.focus();
  };
  if (palette && palette.showModal) {
    palette.addEventListener('close', () => {
      if (lenis) lenis.start();
      if (chose) { chose = false; if (document.activeElement) document.activeElement.blur(); }
      else if (cmdkBtn) cmdkBtn.focus({ preventScroll: true });
    });
    palette.addEventListener('click', (e) => { if (e.target === palette) closePalette(); });
    pInput.addEventListener('input', () => { activeIdx = 0; render(); });
    pInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = (activeIdx + 1) % Math.max(1, shown.length); mark(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = (activeIdx - 1 + shown.length) % Math.max(1, shown.length); mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(activeIdx); }
    });
    cmdkBtn.addEventListener('click', openPalette);
    document.addEventListener('keydown', (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (palette.open) closePalette(); else openPalette(); }
      else if (e.key === '/' && !typing && !palette.open) { e.preventDefault(); openPalette(); }
    });
  } else if (cmdkBtn) {
    cmdkBtn.hidden = true;
  }
})();
