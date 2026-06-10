/* =================================================================
   Chirag Makwana — Portfolio interactions
   Vanilla JS · no dependencies
   ================================================================= */
(() => {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Preloader ---------- */
  const preloader = $('#preloader');
  const bar = $('#preloader .preloader__bar span');
  const pct = $('#preloaderPct');
  let p = 0;
  const tick = setInterval(() => {
    p += Math.random() * 18;
    if (p >= 100) { p = 100; clearInterval(tick); }
    if (bar) bar.style.width = p + '%';
    if (pct) pct.textContent = Math.floor(p);
    if (p === 100) setTimeout(finish, 280);
  }, 130);
  function finish() {
    preloader && preloader.classList.add('done');
    document.body.style.overflow = '';
    startHero();
  }
  document.body.style.overflow = 'hidden';
  window.addEventListener('load', () => { p = 100; });

  /* ---------- Year ---------- */
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Top announcement bar ---------- */
  const topbarClose = $('#topbarClose');
  topbarClose && topbarClose.addEventListener('click', () => {
    document.body.classList.add('topbar-off');
  });

  /* ---------- Custom cursor ---------- */
  const dot = $('#cursorDot'), ring = $('#cursorRing');
  if (dot && ring && window.matchMedia('(hover: hover)').matches) {
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', e => {
      if (e.target.closest('[data-cursor="hover"], a, button')) ring.classList.add('is-hover');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest('[data-cursor="hover"], a, button')) ring.classList.remove('is-hover');
    });
  }

  /* ---------- Glow follows pointer ---------- */
  const glow = $('#glow');
  if (glow && !prefersReduced) {
    addEventListener('mousemove', e => {
      glow.style.left = e.clientX + 'px';
      glow.style.top  = e.clientY + 'px';
    });
  }

  /* ---------- Nav: scroll state, progress, active link ---------- */
  const nav = $('#nav');
  const progress = $('#scrollProgress');
  const sections = $$('main section[id]');
  const navLinkEls = $$('.nav__links a');
  function onScroll() {
    const y = window.scrollY;
    nav && nav.classList.toggle('scrolled', y > 40);
    document.body.classList.toggle('topbar-scrolled', y > 30);
    if (progress) {
      const h = document.documentElement.scrollHeight - innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    let current = '';
    sections.forEach(sec => { if (y >= sec.offsetTop - innerHeight * 0.35) current = sec.id; });
    navLinkEls.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const burger = $('#navBurger');
  burger && burger.addEventListener('click', () => nav.classList.toggle('open'));
  navLinkEls.forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  /* ---------- Theme toggle ---------- */
  const toggle = $('#themeToggle');
  const stored = localStorage.getItem('theme');
  if (stored) document.documentElement.setAttribute('data-theme', stored);
  toggle && toggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', cur);
    localStorage.setItem('theme', cur);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', cur === 'light' ? '#F3F4F7' : '#07080B');
  });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (el.style.transitionDelay || (i % 6) * 0.05 + 's'); io.observe(el); });

  /* ---------- Stat counters ---------- */
  const counted = new WeakSet();
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting || counted.has(en.target)) return;
      counted.add(en.target);
      const el = en.target;
      const target = parseFloat(el.dataset.count);
      const dec = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1400; const t0 = performance.now();
      (function run(now) {
        const k = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = (target * eased).toFixed(dec) + (k === 1 ? suffix : '');
        if (k < 1) requestAnimationFrame(run);
        else el.textContent = target.toFixed(dec) + suffix;
      })(t0);
    });
  }, { threshold: 0.6 });
  $$('.stat__num').forEach(el => countIO.observe(el));

  /* ---------- Project filter ---------- */
  const chips = $$('.chip');
  const cards = $$('.pcard');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    const f = chip.dataset.filter;
    cards.forEach(card => {
      const show = f === 'all' || card.dataset.cat === f;
      card.classList.toggle('hide', !show);
    });
  }));

  /* ---------- Magnetic buttons ---------- */
  if (!prefersReduced && window.matchMedia('(hover: hover)').matches) {
    $$('.btn, .nav__brand-mark, .theme-toggle').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.22}px, ${y * 0.30}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Card tilt ---------- */
  if (!prefersReduced && window.matchMedia('(hover: hover)').matches) {
    $$('.pcard, .rcard').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `translateY(-8px) rotateX(${py * -5}deg) rotateY(${px * 6}deg)`;
        card.style.transformStyle = 'preserve-3d';
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ---------- Back to top ---------- */
  const toTop = $('#toTop');
  toTop && toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));

  /* =================================================================
     Project animated scenes (category-aware SVG motifs)
     ================================================================= */
  const motion = !prefersReduced;
  const PATHS = {
    flight: 'M8,84 C64,18 120,92 188,44 C232,14 270,30 292,52',
    a1: 'M6,30 C40,70 90,20 140,60 C180,92 230,40 296,72'
  };
  function mover(path, dur, cls) {
    if (!motion) return '';
    return `<circle r="3.4" class="${cls}"><animateMotion dur="${dur}s" repeatCount="indefinite" path="${path}"/></circle>`;
  }
  const SCENES = {
    flight: () => `
      <svg viewBox="0 0 300 104" preserveAspectRatio="xMidYMid slice">
        <path class="stroke soft" d="${PATHS.flight}"/>
        <path class="stroke sc-draw" style="--len:360" d="${PATHS.flight}"/>
        <circle class="fill-2 sc-pulse" cx="292" cy="52" r="4.5"/>
        ${mover(PATHS.flight, 4.6, 'fill-a')}
      </svg>`,
    coverage: () => {
      let rows = '';
      for (let i = 0; i < 5; i++) { const y = 22 + i * 15; rows += `<path class="stroke sc-draw soft" style="--len:300;animation-delay:${i*0.18}s" d="M24,${y} H276"/>`; }
      return `<svg viewBox="0 0 300 104" preserveAspectRatio="xMidYMid slice">
        <path class="stroke-2 sc-draw" style="--len:560" d="M24,16 H276 V92 H24 Z"/>
        ${rows}
        ${mover('M28,22 H272 M272,37 H28 M28,52 H272 M272,67 H28 M28,82 H272', 5.5, 'fill-a')}
      </svg>`;
    },
    vision: () => `
      <svg viewBox="0 0 300 104" preserveAspectRatio="xMidYMid slice">
        <rect class="stroke soft" x="20" y="16" width="260" height="72" rx="6"/>
        <rect class="stroke-2 sc-pulse" x="48" y="34" width="52" height="40" rx="3"/>
        <rect class="stroke sc-pulse" x="150" y="26" width="74" height="54" rx="3"/>
        <g class="sc-scan"><line class="stroke" x1="150" y1="12" x2="150" y2="92"/></g>
        <circle class="fill-a" cx="150" cy="52" r="2.4"/>
      </svg>`,
    points: () => {
      let pts = '', lines = '';
      const P = [[40,60],[70,38],[96,72],[130,30],[150,58],[186,44],[210,70],[244,34],[268,60],[120,80],[200,22]];
      P.forEach((p,i)=>{ pts += `<circle class="fill-a sc-pt" cx="${p[0]}" cy="${p[1]}" r="2.6" style="animation-delay:${(i%5)*0.3}s"/>`; });
      lines = `<path class="stroke soft sc-draw" style="--len:420" d="M40,60 70,38 130,30 150,58 186,44 244,34 268,60"/>`;
      return `<svg viewBox="0 0 300 104" preserveAspectRatio="xMidYMid slice">${lines}${pts}</svg>`;
    },
    grid: () => {
      let dots = '';
      for (let r=0;r<4;r++) for (let c=0;c<10;c++){ dots += `<circle class="fill-2 sc-pt" cx="${30+c*26}" cy="${24+r*18}" r="1.7" style="animation-delay:${((r+c)%5)*0.25}s"/>`; }
      const path = 'M30,24 56,24 56,42 82,42 82,60 134,60 134,78 212,78 212,42 264,42';
      return `<svg viewBox="0 0 300 104" preserveAspectRatio="xMidYMid slice">
        ${dots}
        <path class="stroke sc-draw" style="--len:420" d="${path}"/>
        ${mover(path, 4, 'fill-a')}
      </svg>`;
    },
    tokens: () => {
      let bars = '';
      const hs = [26,40,18,52,34,46,22,38,30,48,24,42];
      hs.forEach((h,i)=>{ bars += `<rect class="fill-a sc-pulse" x="${22+i*22}" y="${88-h}" width="11" height="${h}" rx="2" style="animation-delay:${i*0.12}s"/>`; });
      return `<svg viewBox="0 0 300 104" preserveAspectRatio="xMidYMid slice">
        <line class="stroke soft" x1="14" y1="88" x2="286" y2="88"/>
        ${bars}
      </svg>`;
    },
    caption: () => `
      <svg viewBox="0 0 300 104" preserveAspectRatio="xMidYMid slice">
        <rect class="stroke soft" x="20" y="20" width="86" height="64" rx="6"/>
        <path class="stroke-2 sc-draw" style="--len:160" d="M28,70 L48,48 L62,60 L78,40 L98,66"/>
        <circle class="fill-2" cx="86" cy="36" r="5"/>
        <rect class="fill-a sc-token" x="126" y="34" width="150" height="6" rx="3"/>
        <rect class="fill-a sc-token" x="126" y="50" width="120" height="6" rx="3" style="animation-delay:.5s"/>
        <rect class="fill-a sc-token" x="126" y="66" width="146" height="6" rx="3" style="animation-delay:1s"/>
      </svg>`
  };

  $$('.pcard[data-scene]').forEach(card => {
    const type = card.dataset.scene;
    const host = $('.pcard__scene', card);
    if (host && SCENES[type]) {
      try { host.innerHTML = SCENES[type](); } catch (e) { /* leave empty */ }
    }
  });

  const sceneIO = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in-view'); sceneIO.unobserve(en.target); } });
  }, { threshold: 0.2 });
  $$('.pcard').forEach(c => sceneIO.observe(c));

  /* ---------- Spotlight on project cards ---------- */
  if (motion && window.matchMedia('(hover: hover)').matches) {
    $$('.pcard').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Right rail active sync ---------- */
  const rail = $('#rail');
  const railLinks = rail ? $$('a', rail) : [];
  function syncRail() {
    let cur = '';
    sections.forEach(sec => { if (window.scrollY >= sec.offsetTop - innerHeight * 0.4) cur = sec.id; });
    if (!cur) cur = 'hero';
    railLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + cur));
  }

  /* ---------- Parallax (hero + about photo) ---------- */
  const heroInner = $('.hero__inner');
  let ticking = false;
  function parallax() {
    const y = window.scrollY;
    if (heroInner && y < innerHeight) {
      heroInner.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
      heroInner.style.opacity = String(Math.max(0, 1 - y / (innerHeight * 0.75)));
    }
    ticking = false;
  }
  if (motion) {
    addEventListener('scroll', () => { syncRail(); if (!ticking) { requestAnimationFrame(parallax); ticking = true; } }, { passive: true });
  } else {
    addEventListener('scroll', syncRail, { passive: true });
  }
  syncRail();

  /* ---------- Text scramble (decode) ---------- */
  function scramble(el) {
    if (!motion) return;
    const text = el.dataset.original || el.textContent;
    el.dataset.original = text;
    const chars = '!<>-_\\/[]{}—=+*^?#________';
    let frame = 0;
    const queue = [...text].map((c, i) => ({ c, start: Math.floor(i * 1.4), end: Math.floor(i * 1.4) + 14 + Math.random() * 10 }));
    function run() {
      let out = '', done = 0;
      for (const q of queue) {
        if (frame >= q.end) { out += q.c; done++; }
        else if (frame >= q.start) { out += `<span class="scram">${chars[Math.floor(Math.random() * chars.length)]}</span>`; }
        else { out += q.c === ' ' ? ' ' : ''; }
      }
      el.innerHTML = out;
      if (done < queue.length) { frame++; requestAnimationFrame(run); }
      else { el.textContent = text; }
    }
    run();
  }
  const scramIO = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { scramble(en.target); scramIO.unobserve(en.target); } });
  }, { threshold: 0.6 });
  $$('[data-scramble]').forEach(el => scramIO.observe(el));

  /* ---------- Hero title reveal ---------- */
  function startHero() {
    const title = $('.hero__title');
    title && title.classList.add('in');
    $$('.hero .reveal').forEach(el => el.classList.add('in'));
  }

  /* =================================================================
     Swarm canvas — agents + links (multi-robot motif)
     ================================================================= */
  const canvas = $('#swarm');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, nodes = [];
    const COUNT = () => Math.min(72, Math.floor(innerWidth / 22));

    function accentRGB() {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const m = v.replace('#', '');
      const r = parseInt(m.substring(0, 2), 16), g = parseInt(m.substring(2, 4), 16), b = parseInt(m.substring(4, 6), 16);
      return [r || 87, g || 227, b || 201];
    }
    let rgb = accentRGB();

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = COUNT();
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.6 + 0.6
      }));
    }
    resize();
    addEventListener('resize', resize);

    const mouse = { x: -999, y: -999 };
    addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });

    let raf;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const [cr, cg, cb] = rgb;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        // mouse attraction
        const dxm = mouse.x - a.x, dym = mouse.y - a.y;
        const dm = Math.hypot(dxm, dym);
        if (dm < 160) { a.x += dxm / dm * 0.5; a.y += dym / dm * 0.5; }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < 130) {
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${(1 - d / 130) * 0.22})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.8)`;
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    new MutationObserver(() => { rgb = accentRGB(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const heroEl = $('#hero');
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!raf) draw(); }
      else { cancelAnimationFrame(raf); raf = null; }
    }, { threshold: 0 }).observe(heroEl);
  }

  /* =================================================================
     Drone + LiDAR point cloud — a single quad-rotor that follows the
     cursor anywhere across the hero, sensing a live point cloud as it goes
     ================================================================= */
  const dCanvas = $('#droneCanvas');
  if (dCanvas && !prefersReduced) {
    const dctx = dCanvas.getContext('2d');
    let W, H, DPR;

    function accent() {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim().replace('#', '');
      const r = parseInt(v.substring(0, 2), 16), g = parseInt(v.substring(2, 4), 16), b = parseInt(v.substring(4, 6), 16);
      return [r || 87, g || 227, b || 201];
    }
    let RGB = accent();
    new MutationObserver(() => { RGB = accent(); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    function size() {
      DPR = Math.min(devicePixelRatio || 1, 2);
      W = dCanvas.clientWidth; H = dCanvas.clientHeight;
      dCanvas.width = W * DPR; dCanvas.height = H * DPR;
      dctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    size();
    addEventListener('resize', size);

    const drone = { x: W * 0.5, y: H * 0.45, vx: 0, vy: 0, tilt: 0, bob: 0 };
    const target = { x: W * 0.5, y: H * 0.45, active: false };

    addEventListener('mousemove', e => {
      const r = dCanvas.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      if (mx >= 0 && my >= 0 && mx <= W && my <= H) { target.x = mx; target.y = my; target.active = true; }
      else { target.active = false; }
    });
    addEventListener('mouseleave', () => { target.active = false; });

    function field(x, y) {
      return Math.sin(x * 0.018 + Math.cos(y * 0.013) * 1.7)
           + Math.sin(y * 0.021 - Math.cos(x * 0.011) * 1.4)
           + Math.sin((x + y) * 0.012);
    }
    const SENSE = 250, STEP = 9, THRESH = 1.15;
    function rayHit(ox, oy, ang) {
      const c = Math.cos(ang), s = Math.sin(ang);
      for (let d = 26; d < SENSE; d += STEP) {
        if (field(ox + c * d, oy + s * d) > THRESH) return d;
      }
      return -1;
    }

    let pts = [];
    const MAXPTS = 1700;
    let beam = 0, roamT = 0, rx = drone.x, ry = drone.y;
    let raf2;

    function frame() {
      if (!target.active) {
        roamT += 0.005;
        rx = W * (0.5 + 0.34 * Math.cos(roamT * 0.9));
        ry = H * (0.45 + 0.26 * Math.sin(roamT * 1.3));
      }
      const tx = target.active ? target.x : rx;
      const ty = target.active ? target.y : ry;

      drone.vx = (drone.vx + (tx - drone.x) * 0.0065) * 0.92;
      drone.vy = (drone.vy + (ty - drone.y) * 0.0065) * 0.92;
      const sp = Math.hypot(drone.vx, drone.vy), MAX = 7.5;
      if (sp > MAX) { drone.vx = drone.vx / sp * MAX; drone.vy = drone.vy / sp * MAX; }
      drone.x += drone.vx; drone.y += drone.vy;
      drone.tilt += ((-drone.vx * 0.045) - drone.tilt) * 0.1;
      drone.bob += 0.08;
      const cy = drone.y + Math.sin(drone.bob) * 2.2;

      beam += 0.18;
      for (let k = 0; k < 9; k++) {
        const ang = beam + k * 0.045;
        const d = rayHit(drone.x, cy, ang);
        if (d > 0) pts.push({ x: drone.x + Math.cos(ang) * d, y: cy + Math.sin(ang) * d, life: 1, r: Math.random() * 1.4 + 0.8 });
      }
      for (let k = 0; k < 5; k++) {
        const ang = Math.random() * Math.PI * 2;
        const d = rayHit(drone.x, cy, ang);
        if (d > 0) pts.push({ x: drone.x + Math.cos(ang) * d, y: cy + Math.sin(ang) * d, life: 1, r: Math.random() * 1.1 + 0.5 });
      }
      if (pts.length > MAXPTS) pts.splice(0, pts.length - MAXPTS);

      dctx.clearRect(0, 0, W, H);
      const [r, g, b] = RGB;

      dctx.strokeStyle = `rgba(${r},${g},${b},0.06)`; dctx.lineWidth = 1;
      dctx.beginPath(); dctx.arc(drone.x, cy, SENSE, 0, Math.PI * 2); dctx.stroke();
      const bx = drone.x + Math.cos(beam) * SENSE, by = cy + Math.sin(beam) * SENSE;
      const grad = dctx.createLinearGradient(drone.x, cy, bx, by);
      grad.addColorStop(0, `rgba(${r},${g},${b},0.28)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      dctx.strokeStyle = grad; dctx.lineWidth = 2;
      dctx.beginPath(); dctx.moveTo(drone.x, cy); dctx.lineTo(bx, by); dctx.stroke();

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.life -= 0.0045;
        if (p.life <= 0) continue;
        dctx.fillStyle = `rgba(${r},${g},${b},${p.life * 0.85})`;
        dctx.beginPath(); dctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); dctx.fill();
      }
      pts = pts.filter(p => p.life > 0);

      drawDrone(drone.x, cy, drone.tilt, r, g, b);
      raf2 = requestAnimationFrame(frame);
    }

    function roundRect(c, x, y, w, h, rr) {
      c.beginPath(); c.moveTo(x + rr, y);
      c.arcTo(x + w, y, x + w, y + h, rr); c.arcTo(x + w, y + h, x, y + h, rr);
      c.arcTo(x, y + h, x, y, rr); c.arcTo(x, y, x + w, y, rr); c.closePath();
    }
    function drawDrone(x, y, tilt, r, g, b) {
      const stroke = `rgba(${r},${g},${b},0.95)`, soft = `rgba(${r},${g},${b},0.5)`;
      const spin = performance.now() * 0.02, S = 1.5;
      const arm = 17 * S, armY = 11 * S, rot = 7 * S;
      dctx.save();
      dctx.translate(x, y); dctx.rotate(tilt);
      dctx.strokeStyle = soft; dctx.lineWidth = 2.4;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
        dctx.beginPath(); dctx.moveTo(0, 0); dctx.lineTo(sx * arm, sy * armY); dctx.stroke();
      });
      [[-arm, -armY], [arm, -armY], [-arm, armY], [arm, armY]].forEach(([cx, cy2], i) => {
        dctx.save(); dctx.translate(cx, cy2); dctx.rotate(spin * (i % 2 ? 1 : -1));
        dctx.strokeStyle = soft; dctx.lineWidth = 1.8;
        dctx.beginPath(); dctx.arc(0, 0, rot, 0, Math.PI * 2); dctx.stroke();
        dctx.fillStyle = stroke;
        dctx.beginPath(); dctx.ellipse(0, 0, rot, 1.8, 0, 0, Math.PI * 2); dctx.fill();
        dctx.restore();
      });
      dctx.fillStyle = `rgba(${r},${g},${b},0.16)`; dctx.strokeStyle = stroke; dctx.lineWidth = 2.4;
      roundRect(dctx, -9 * S, -6 * S, 18 * S, 12 * S, 5 * S); dctx.fill(); dctx.stroke();
      dctx.fillStyle = stroke; dctx.beginPath(); dctx.arc(0, 7 * S, 2.4 * S, 0, Math.PI * 2); dctx.fill();
      dctx.restore();
    }

    frame();

    const heroD = $('#hero');
    if (heroD) new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!raf2) frame(); }
      else { cancelAnimationFrame(raf2); raf2 = null; }
    }, { threshold: 0 }).observe(heroD);
  }
})();
