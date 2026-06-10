/* =================================================================
   Chirag Makwana — About Section Interactions (Scramble, Stat Counters)
   ================================================================= */
(() => {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  window.initAbout = function() {
    const motion = !prefersReduced;

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
  };
})();
