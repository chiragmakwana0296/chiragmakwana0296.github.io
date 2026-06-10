/* =================================================================
   Chirag Makwana — Hero Interactions & Swarm/Drone Canvas
   ================================================================= */
(() => {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  window.startHero = function() {
    const title = $('.hero__title');
    title && title.classList.add('in');
    $$('.hero .reveal').forEach(el => el.classList.add('in'));
  };

  window.initHero = function() {
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
  };
})();
