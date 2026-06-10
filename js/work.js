/* =================================================================
   Chirag Makwana — Work Section Interactions (SVG scenes, filters, tilt, spotlights)
   ================================================================= */
(() => {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  window.initWork = function() {
    const motion = !prefersReduced;

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

    /* ---------- Card tilt ---------- */
    if (motion && window.matchMedia('(hover: hover)').matches) {
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

    /* =================================================================
       Project animated scenes (category-aware SVG motifs)
       ================================================================= */
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
        for (let i = 0; i < 5; i++) { const y = 22 + i * 15; rows += `<path class="stroke sc-draw soft" style="--len:300;animation-delay:${i * 0.18}s" d="M24,${y} H276"/>`; }
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
        const P = [[40, 60], [70, 38], [96, 72], [130, 30], [150, 58], [186, 44], [210, 70], [244, 34], [268, 60], [120, 80], [200, 22]];
        P.forEach((p, i) => { pts += `<circle class="fill-a sc-pt" cx="${p[0]}" cy="${p[1]}" r="2.6" style="animation-delay:${(i % 5) * 0.3}s"/>`; });
        lines = `<path class="stroke soft sc-draw" style="--len:420" d="M40,60 70,38 130,30 150,58 186,44 244,34 268,60"/>`;
        return `<svg viewBox="0 0 300 104" preserveAspectRatio="xMidYMid slice">${lines}${pts}</svg>`;
      },
      grid: () => {
        let dots = '';
        for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) { dots += `<circle class="fill-2 sc-pt" cx="${30 + c * 26}" cy="${24 + r * 18}" r="1.7" style="animation-delay:${((r + c) % 5) * 0.25}s"/>`; }
        const path = 'M30,24 56,24 56,42 82,42 82,60 134,60 134,78 212,78 212,42 264,42';
        return `<svg viewBox="0 0 300 104" preserveAspectRatio="xMidYMid slice">
          ${dots}
          <path class="stroke sc-draw" style="--len:420" d="${path}"/>
          ${mover(path, 4, 'fill-a')}
        </svg>`;
      },
      tokens: () => {
        let bars = '';
        const hs = [26, 40, 18, 52, 34, 46, 22, 38, 30, 48, 24, 42];
        hs.forEach((h, i) => { bars += `<rect class="fill-a sc-pulse" x="${22 + i * 22}" y="${88 - h}" width="11" height="${h}" rx="2" style="animation-delay:${i * 0.12}s"/>`; });
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
  };
})();
