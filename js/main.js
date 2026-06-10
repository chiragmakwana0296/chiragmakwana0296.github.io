/* =================================================================
   Chirag Makwana — Core Coordinator & Markdown Loader
   ================================================================= */
(() => {
  'use strict';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Preloader ---------- */
  const preloader = $('#preloader');
  const bar = $('#preloader .preloader__bar span');
  const pct = $('#preloaderPct');
  let p = 0;
  let contentLoaded = false;
  let appReady = false;

  const tick = setInterval(() => {
    p += Math.random() * 18;
    if (p >= 100) { p = 100; clearInterval(tick); }
    if (bar) bar.style.width = p + '%';
    if (pct) pct.textContent = Math.floor(p);
    if (p === 100) setTimeout(finish, 280);
  }, 130);

  function finish() {
    if (!contentLoaded) {
      setTimeout(finish, 50);
      return;
    }
    preloader && preloader.classList.add('done');
    document.body.style.overflow = '';
    if (typeof window.startHero === 'function') window.startHero();
  }
  document.body.style.overflow = 'hidden';
  window.addEventListener('load', () => { p = 100; });

  // Formatting helpers
  function formatText(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/&rsquo;/g, '’');
  }

  function formatHeroTitle(title) {
    if (!title) return '';
    let line1 = '';
    let line2 = '';
    if (title.includes('|')) {
      const parts = title.split('|');
      line1 = parts[0].trim();
      line2 = parts[1] ? parts[1].trim() : '';
    } else {
      const idx = title.toLowerCase().indexOf(' for ');
      if (idx !== -1) {
        line1 = title.substring(0, idx).trim();
        line2 = title.substring(idx).trim();
      } else {
        const words = title.split(' ');
        const mid = Math.ceil(words.length / 2);
        line1 = words.slice(0, mid).join(' ');
        line2 = words.slice(mid).join(' ');
      }
    }

    const wrapWords = (text, isSecondLine) => {
      const words = text.split(/\s+/);
      return words.map((w, idx) => {
        let isGrad = false;
        if (isSecondLine) {
          if (words[0].toLowerCase() === 'for') {
            isGrad = idx > 0;
          } else {
            isGrad = idx > 0;
          }
        }
        return `<span class="word ${isGrad ? 'grad' : ''}">${w}</span>`;
      }).join(' ');
    };

    return `
      <span class="line">${wrapWords(line1, false)}</span>
      <span class="line">${wrapWords(line2, true)}</span>
    `;
  }

  function parseMarkdown(mdText) {
    const lines = mdText.split(/\r?\n/);
    const data = {};
    let currentSection = null;
    let currentItem = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('## ')) {
        currentSection = line.substring(3).trim().toLowerCase();
        data[currentSection] = {
          _type: 'section',
          fields: {},
          items: []
        };
        currentItem = null;
        continue;
      }

      if (line.startsWith('### ')) {
        if (!currentSection) continue;
        currentItem = {
          title: line.substring(4).trim(),
          fields: {},
          bullets: []
        };
        data[currentSection].items.push(currentItem);
        continue;
      }

      const match = line.match(/^[-*]\s*([^:]+)\s*:\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (currentItem) {
          if (key.startsWith('bullet')) {
            currentItem.bullets.push(value);
          } else {
            currentItem.fields[key] = value;
          }
        } else if (currentSection) {
          data[currentSection].fields[key] = value;
        }
      }
    }
    return data;
  }

  function toggleSection(id, exists) {
    const sectionEl = $('#' + id);
    if (sectionEl) {
      sectionEl.style.display = exists ? '' : 'none';
    }
    // Also toggle nav links
    const navLinks = $$(`a[href="#${id}"]`);
    navLinks.forEach(link => {
      link.style.display = exists ? '' : 'none';
    });
  }

  function updateDOM(data) {
    if (!data) return;

    // 1. Hero Section
    const hasHero = !!(data.hero && data.hero.fields && Object.keys(data.hero.fields).length > 0);
    toggleSection('hero', hasHero);
    if (hasHero) {
      const hero = data.hero.fields;
      const statusEl = $('#heroStatus');
      if (statusEl && hero.status) statusEl.innerHTML = `<span class="pulse"></span>${hero.status}`;
      const eyebrowEl = $('#heroEyebrow');
      if (eyebrowEl && hero.eyebrow) eyebrowEl.textContent = hero.eyebrow;
      const titleEl = $('.hero__title');
      if (titleEl && hero.title) titleEl.innerHTML = formatHeroTitle(hero.title);
      const ledeEl = $('.hero__lede');
      if (ledeEl && hero.lede) ledeEl.innerHTML = formatText(hero.lede);
    }

    // 2. About Section
    const hasAbout = !!(data.about && data.about.fields && Object.keys(data.about.fields).length > 0);
    toggleSection('about', hasAbout);
    if (hasAbout) {
      const about = data.about.fields;
      const sigEl = $('#aboutSignature');
      if (sigEl && about.signature) sigEl.textContent = about.signature;
      const akaEl = $('#aboutAkamono');
      if (akaEl && about.akamono) akaEl.textContent = about.akamono;
      const leadEl = $('#aboutLead');
      if (leadEl && about.lead) leadEl.innerHTML = formatText(about.lead);
      const p1El = $('#aboutParagraph1');
      if (p1El && about.paragraph1) p1El.innerHTML = formatText(about.paragraph1);
      const p2El = $('#aboutParagraph2');
      if (p2El && about.paragraph2) p2El.innerHTML = formatText(about.paragraph2);

      const toggleStat = (id, val) => {
        const el = $('#' + id);
        if (el) {
          const parent = el.closest('.stat');
          if (parent) {
            parent.style.display = val !== undefined ? '' : 'none';
          }
          if (val !== undefined) {
            el.dataset.count = val.replace(/\+/, '');
          }
        }
      };
      toggleStat('statExperience', about.stat_experience);
      toggleStat('statCompanies', about.stat_companies);
      toggleStat('statPublications', about.stat_publications);
      toggleStat('statDegrees', about.stat_degrees);
    }

    // 3. Work Section (Projects)
    const hasWork = !!(data.work && data.work.items && data.work.items.length > 0);
    toggleSection('work', hasWork);
    if (hasWork) {
      const container = $('.work__grid');
      if (container) {
        container.innerHTML = '';
        data.work.items.forEach(item => {
          const cat = item.fields.category || 'navigation';
          const scene = item.fields.scene || 'grid';
          const company = item.fields.company || '';
          const desc = item.fields.description || '';
          const stack = item.fields.stack ? item.fields.stack.split(',').map(s => `<span>${s.trim()}</span>`).join('') : '';

          const card = document.createElement('div');
          card.className = 'pcard reveal';
          card.dataset.cat = cat;
          card.dataset.scene = scene;
          card.dataset.cursor = 'hover';
          card.innerHTML = `
            <div class="pcard__scene"></div>
            <div class="pcard__top">
              <span class="pcard__tag">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              <span class="pcard__arrow">↗</span>
            </div>
            <h3>${item.title}</h3>
            <p>${desc}</p>
            <div class="pcard__stack">${stack}</div>
            <span class="pcard__link">${company}</span>
          `;
          container.appendChild(card);
        });
      }
    }

    // 4. Experience Section
    const hasExperience = !!(data.experience && data.experience.items && data.experience.items.length > 0);
    toggleSection('experience', hasExperience);
    if (hasExperience) {
      const container = $('#experience .timeline');
      if (container) {
        container.innerHTML = '';
        data.experience.items.forEach(item => {
          const date = item.fields.date || '';
          const org = item.fields.organization || '';
          const desc = item.fields.description || '';
          const bullets = item.bullets ? item.bullets.map(b => `<li>${formatText(b)}</li>`).join('') : '';

          const tlItem = document.createElement('div');
          tlItem.className = 'tl-item reveal';
          tlItem.dataset.cursor = 'hover';
          tlItem.innerHTML = `
            <div class="tl-dot"></div>
            <div class="tl-time">${date}</div>
            <div class="tl-body">
              <h3>${item.title}</h3>
              <span class="tl-org">${org}</span>
              <p>${desc}</p>
              <ul>${bullets}</ul>
            </div>
          `;
          container.appendChild(tlItem);
        });
      }
    }

    // 5. Skills Section
    const hasSkills = !!(data.skills && data.skills.fields && Object.keys(data.skills.fields).length > 0);
    toggleSection('toolkit', hasSkills);
    if (hasSkills) {
      const container = $('.toolkit__cols');
      if (container) {
        container.innerHTML = '';
        Object.entries(data.skills.fields).forEach(([category, listStr]) => {
          const items = listStr.split(',').map(s => `<li>${s.trim()}</li>`).join('');
          const tk = document.createElement('div');
          tk.className = 'tk reveal';
          tk.innerHTML = `
            <h4>${category}</h4>
            <ul>${items}</ul>
          `;
          container.appendChild(tk);
        });
      }
    }

    // 6. Research Section & Education Section
    const hasResearch = !!(data.research && data.research.items && data.research.items.length > 0);
    const hasEducation = !!(data.education && data.education.items && data.education.items.length > 0);

    const resList = $('.pub-list');
    const resLabel = resList ? resList.previousElementSibling : null;
    if (resList) resList.style.display = hasResearch ? '' : 'none';
    if (resLabel) resLabel.style.display = hasResearch ? '' : 'none';

    if (hasResearch) {
      const container = $('.pub-list');
      if (container) {
        container.innerHTML = '';
        data.research.items.forEach(item => {
          const date = item.fields.date || '';
          const authors = item.fields.authors || '';
          const venue = item.fields.venue || '';
          const abs = item.fields.abstract || '';
          const tags = item.fields.tags ? item.fields.tags.split(',').map(t => `<span>${t.trim()}</span>`).join('') : '';

          const li = document.createElement('li');
          li.className = 'pub reveal';
          li.dataset.cursor = 'hover';
          li.innerHTML = `
            <div class="pub__year">${date.match(/\b\d{4}\b/)?.[0] || date}</div>
            <div class="pub__main">
              <h3>${item.title}</h3>
              <p class="pub__authors"><b>${authors}</b></p>
              <p class="pub__venue">${venue}</p>
              <p class="pub__abs">${abs}</p>
              <div class="pub__tags">${tags}</div>
            </div>
            <div class="pub__links">
              <span style="font-family:var(--mono); font-size:.85rem; color:var(--muted)">Published (${venue.split('·')[0].trim()})</span>
            </div>
          `;
          container.appendChild(li);
        });
      }
    }

    const eduList = $('#publications .timeline');
    const eduLabel = eduList ? eduList.previousElementSibling : null;
    if (eduList) eduList.style.display = hasEducation ? '' : 'none';
    if (eduLabel) eduLabel.style.display = hasEducation ? '' : 'none';

    if (hasEducation) {
      const container = $('#publications .timeline');
      if (container) {
        container.innerHTML = '';
        data.education.items.forEach(item => {
          const date = item.fields.date || '';
          const org = item.fields.organization || '';
          const desc = item.fields.description || '';

          const tlItem = document.createElement('div');
          tlItem.className = 'tl-item reveal';
          tlItem.dataset.cursor = 'hover';
          tlItem.innerHTML = `
            <div class="tl-dot"></div>
            <div class="tl-time">${date}</div>
            <div class="tl-body">
              <h3>${item.title}</h3>
              <span class="tl-org">${org}</span>
              <p>${desc}</p>
            </div>
          `;
          container.appendChild(tlItem);
        });
      }
    }

    toggleSection('publications', hasResearch || hasEducation);

    // 7. Contact Section
    const hasContact = !!(data.contact && data.contact.fields && Object.keys(data.contact.fields).length > 0);
    toggleSection('contact', hasContact);
    if (hasContact) {
      const contact = data.contact.fields;
      const cGithub = $('#contactGithub'); if (cGithub && contact.github) cGithub.href = contact.github;
      const cLinkedin = $('#contactLinkedin'); if (cLinkedin && contact.linkedin) cLinkedin.href = contact.linkedin;
      const cPhone = $('#contactPhone'); if (cPhone && contact.phone) { cPhone.href = `tel:${contact.phone.replace(/\s+/g, '')}`; cPhone.textContent = `Call ${contact.phone}`; }
      const cEmail = $('#contactEmail'); if (cEmail && contact.email) cEmail.href = `mailto:${contact.email}`;
      const cEmailLink = $('#contactEmailLink'); if (cEmailLink && contact.email) { cEmailLink.href = `mailto:${contact.email}`; cEmailLink.textContent = contact.email; }

      // Also update Hero Meta links if present
      const heroMetaEl = $('#heroMeta');
      if (heroMetaEl) {
        let html = '';
        if (contact.github) {
          html += `<a href="${contact.github}" target="_blank" rel="noopener" data-cursor="hover">GitHub</a>`;
        }
        if (contact.linkedin) {
          if (html) html += ' <span>/</span> ';
          html += `<a href="${contact.linkedin}" target="_blank" rel="noopener" data-cursor="hover">LinkedIn</a>`;
        }
        if (contact.email) {
          if (html) html += ' <span>/</span> ';
          html += `<a href="mailto:${contact.email}" data-cursor="hover">Email</a>`;
        }
        if (contact.phone) {
          if (html) html += ' <span>/</span> ';
          html += `<a href="tel:${contact.phone.replace(/\s+/g, '')}" data-cursor="hover">Phone</a>`;
        }
        heroMetaEl.innerHTML = html;
      }
    }
  }

  // Fetch portfolio data
  fetch('portfolio.md')
    .then(r => r.text())
    .then(text => {
      const data = parseMarkdown(text);
      updateDOM(data);
    })
    .catch(err => {
      console.error('Error loading portfolio.md, using fallback HTML:', err);
    })
    .finally(() => {
      contentLoaded = true;
      startApp();
    });

  function startApp() {
    if (appReady) return;
    appReady = true;

    /* ---------- Year ---------- */
    const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

    /* ---------- Top announcement bar ---------- */
    const topbarClose = $('#topbarClose');
    topbarClose && topbarClose.addEventListener('click', () => {
      document.body.classList.add('topbar-off');
    });

    const CURSOR_CONFIG = {
      // Themes: 'default', 'crosshair', 'spotlight', 'invert', 'trail', 'none'
      theme: 'crosshair'
    };

    /* ---------- Custom cursor ---------- */
    const dot = $('#cursorDot'), ring = $('#cursorRing');
    if (window.matchMedia('(hover: hover)').matches) {
      document.body.classList.add(`cursor-theme-${CURSOR_CONFIG.theme}`);

      if (CURSOR_CONFIG.theme === 'crosshair' && ring) {
        ring.innerHTML = '<div class="cursor-ring-inner"></div>';
      }

      if (CURSOR_CONFIG.theme === 'trail') {
        const trailLength = 6;
        const dots = [];
        for (let i = 0; i < trailLength; i++) {
          const d = document.createElement('div');
          d.className = 'cursor-trail-dot';
          d.style.setProperty('--op', (1 - i / (trailLength + 1)).toFixed(2));
          const size = Math.max(3, 11 - i * 1.5);
          d.style.width = size + 'px';
          d.style.height = size + 'px';
          document.body.appendChild(d);
          dots.push({ el: d, x: innerWidth / 2, y: innerHeight / 2 });
        }

        let mx = innerWidth / 2, my = innerHeight / 2;
        addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
        document.addEventListener('mouseover', e => {
          if (e.target.closest('[data-cursor="hover"], a, button')) {
            dots.forEach(dot => {
              dot.el.style.width = '14px';
              dot.el.style.height = '14px';
              dot.el.style.background = 'var(--accent-3)';
            });
          }
        });
        document.addEventListener('mouseout', e => {
          if (e.target.closest('[data-cursor="hover"], a, button')) {
            dots.forEach((dot, i) => {
              const size = Math.max(3, 11 - i * 1.5);
              dot.el.style.width = size + 'px';
              dot.el.style.height = size + 'px';
              dot.el.style.background = 'var(--accent)';
            });
          }
        });

        (function trailLoop() {
          let cx = mx, cy = my;
          dots.forEach((dot, index) => {
            dot.x += (cx - dot.x) * 0.38;
            dot.y += (cy - dot.y) * 0.38;
            dot.el.style.transform = `translate(${dot.x}px, ${dot.y}px) translate(-50%,-50%)`;
            cx = dot.x;
            cy = dot.y;
          });
          requestAnimationFrame(trailLoop);
        })();
      } else if (dot && ring && CURSOR_CONFIG.theme !== 'none' && CURSOR_CONFIG.theme !== 'spotlight') {
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
    }

    /* ---------- Glow follows pointer ---------- */
    const glow = $('#glow');
    if (glow && !prefersReduced) {
      addEventListener('mousemove', e => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
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

    /* ---------- Back to top ---------- */
    const toTop = $('#toTop');
    toTop && toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }));

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
    const motion = !prefersReduced;
    if (motion) {
      addEventListener('scroll', () => { syncRail(); if (!ticking) { requestAnimationFrame(parallax); ticking = true; } }, { passive: true });
    } else {
      addEventListener('scroll', syncRail, { passive: true });
    }
    syncRail();

    // Call Section-wise Init functions from other scripts
    if (typeof window.initHero === 'function') window.initHero();
    if (typeof window.initAbout === 'function') window.initAbout();
    if (typeof window.initWork === 'function') window.initWork();
  }
})();
