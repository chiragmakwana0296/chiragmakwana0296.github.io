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

      // Meta tags and titles
      if (hero.page_title) {
        document.title = hero.page_title;
        const ogTitle = $('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', hero.page_title);
      }
      if (hero.page_description) {
        const metaDesc = $('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', hero.page_description);
        const ogDesc = $('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', hero.page_description);
      }

      // Top announcement bar
      const topbarEl = $('#topbar p');
      if (topbarEl && hero.announcement) topbarEl.innerHTML = formatText(hero.announcement);

      // Nav brand and preloader mark
      if (hero.eyebrow) {
        const brandMark = $('.nav__brand-mark');
        const brandText = $('.nav__brand-text');
        const preloaderMark = $('.preloader__mark');
        const initials = hero.eyebrow.split(' ').map(n => n[0]).join('');
        
        if (hero.photo) {
          const imgHTML = `<img src="${hero.photo.replace(/^@/, '')}" alt="${hero.eyebrow}" style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit; display: block;" />`;
          if (brandMark) brandMark.innerHTML = imgHTML;
          if (preloaderMark) {
            preloaderMark.innerHTML = imgHTML;
            preloaderMark.style.width = '64px';
            preloaderMark.style.height = '64px';
            preloaderMark.style.borderRadius = '50%';
          }
        } else {
          if (brandMark) brandMark.textContent = initials;
          if (preloaderMark) preloaderMark.textContent = initials;
        }
        
        if (brandText) brandText.innerHTML = hero.eyebrow.replace(/\s+/g, '&nbsp;');
      }

      // Update Favicon and OG Image
      if (hero.photo) {
        const faviconEl = $('link[rel="icon"]');
        if (faviconEl) {
          faviconEl.href = hero.photo.replace(/^@/, '');
          faviconEl.type = '';
        }
        const ogImage = $('meta[property="og:image"]');
        if (ogImage) ogImage.setAttribute('content', hero.photo.replace(/^@/, ''));
      }

      // Marquee Track
      const marqueeTrack = $('.marquee__track');
      if (marqueeTrack && hero.marquee) {
        const items = hero.marquee.split(',').map(item => `<span>${item.trim()}</span><i>✦</i>`).join('');
        marqueeTrack.innerHTML = items + items; // repeat to fill track width
      }
    }

    // 2. About Section
    const hasAbout = !!(data.about && data.about.fields && Object.keys(data.about.fields).length > 0);
    toggleSection('about', hasAbout);
    if (hasAbout) {
      const about = data.about.fields;
      const sigEl = $('#aboutSignature');
      if (sigEl && about.signature) sigEl.textContent = about.signature;
      const akaEl = $('#aboutAccumulator'); // Wait, the original was #aboutAkamono
      const akaOriginalEl = $('#aboutAkamono');
      const targetAkaEl = akaOriginalEl || akaEl;
      if (targetAkaEl && about.akamono) targetAkaEl.textContent = about.akamono;
      const leadEl = $('#aboutLead');
      if (leadEl && about.lead) leadEl.innerHTML = formatText(about.lead);
      const p1El = $('#aboutParagraph1');
      if (p1El && about.paragraph1) p1El.innerHTML = formatText(about.paragraph1);
      const p2El = $('#aboutParagraph2');
      if (p2El && about.paragraph2) p2El.innerHTML = formatText(about.paragraph2);

      // Render photo and photo badge
      const photoEl = $('.about__photo img');
      if (photoEl && about.photo) {
        photoEl.src = about.photo.replace(/^@/, '');
      }

      if (about.photo_badge) {
        const badgeK = $('.about__badge-k');
        const badgeV = $('.about__badge-v');
        const badgeEl = $('.about__badge');
        let kText = '';
        let vText = '';
        const match = about.photo_badge.match(/^\*\*(.*?)\*\*(.*)$/);
        if (match) {
          kText = match[1].trim();
          vText = match[2].trim();
        } else {
          const parts = about.photo_badge.split('|');
          kText = parts[0] ? parts[0].trim() : '';
          vText = parts.slice(1).join(' | ').trim();
        }
        if (badgeK) badgeK.textContent = kText;
        if (badgeV) badgeV.innerHTML = formatText(vText).replace(/\|/g, '<br/>');
        if (badgeEl) badgeEl.style.display = '';
      } else {
        const badgeEl = $('.about__badge');
        if (badgeEl) badgeEl.style.display = 'none';
      }

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
      const subEl = $('#work .section__sub');
      if (subEl && data.work.fields && data.work.fields.subtitle) {
        subEl.textContent = data.work.fields.subtitle;
      }
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
      const subEl = $('#experience .section__sub');
      if (subEl && data.experience.fields && data.experience.fields.subtitle) {
        subEl.textContent = data.experience.fields.subtitle;
      }
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
      const subEl = $('#toolkit .section__sub');
      if (subEl && data.skills.fields && data.skills.fields.subtitle) {
        subEl.textContent = data.skills.fields.subtitle;
      }
      const container = $('.toolkit__cols');
      if (container) {
        container.innerHTML = '';
        Object.entries(data.skills.fields).forEach(([category, listStr]) => {
          if (category === 'subtitle') return; // skip subtitle field
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

    // 6. Research Section
    const hasResearch = !!(data.research && data.research.items && data.research.items.length > 0);
    toggleSection('research', hasResearch);
    if (hasResearch) {
      const subEl = $('#research .section__sub');
      if (subEl && data.research.fields && data.research.fields.subtitle) {
        subEl.textContent = data.research.fields.subtitle;
      }
      const container = $('#research .pub-list');
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

    // 6b. Education Section
    const hasEducation = !!(data.education && data.education.items && data.education.items.length > 0);
    toggleSection('education', hasEducation);
    if (hasEducation) {
      const subEl = $('#education .section__sub');
      if (subEl && data.education.fields && data.education.fields.subtitle) {
        subEl.textContent = data.education.fields.subtitle;
      }
      const container = $('#education .timeline');
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

    // 7. Contact Section
    const hasContact = !!(data.contact && data.contact.fields && Object.keys(data.contact.fields).length > 0);
    toggleSection('contact', hasContact);
    if (hasContact) {
      const contact = data.contact.fields;

      const cGithub = $('#contactGithub');
      if (cGithub) {
        if (contact.github) {
          cGithub.href = contact.github;
          cGithub.style.display = '';
        } else {
          cGithub.style.display = 'none';
        }
      }

      const cLinkedin = $('#contactLinkedin');
      if (cLinkedin) {
        if (contact.linkedin) {
          cLinkedin.href = contact.linkedin;
          cLinkedin.style.display = '';
        } else {
          cLinkedin.style.display = 'none';
        }
      }

      const cPhone = $('#contactPhone');
      if (cPhone) {
        if (contact.phone) {
          cPhone.href = `tel:${contact.phone.replace(/\s+/g, '')}`;
          cPhone.textContent = `Call ${contact.phone}`;
          cPhone.style.display = '';
        } else {
          cPhone.style.display = 'none';
        }
      }

      const cEmail = $('#contactEmail');
      if (cEmail) {
        if (contact.email) {
          cEmail.href = `mailto:${contact.email}`;
          cEmail.style.display = '';
        } else {
          cEmail.style.display = 'none';
        }
      }

      const cEmailLink = $('#contactEmailLink');
      if (cEmailLink) {
        if (contact.email) {
          cEmailLink.href = `mailto:${contact.email}`;
          cEmailLink.textContent = contact.email;
          cEmailLink.style.display = '';
        } else {
          cEmailLink.style.display = 'none';
        }
      }

      // Contact Headings
      const contactTitle = $('.contact__title');
      if (contactTitle && contact.title) contactTitle.innerHTML = formatText(contact.title).replace(/\./, '.<br/>');
      const contactSub = $('.contact__sub');
      if (contactSub && contact.sub) contactSub.textContent = contact.sub;

      // Footer brand name, copyright name, location
      const footerMid = $('.footer__mid');
      if (footerMid && contact.location) footerMid.textContent = contact.location;
      const footerLeft = $('.footer__left');
      const eyebrowName = (data.hero && data.hero.fields && data.hero.fields.eyebrow) || 'Chirag Makwana';
      if (footerLeft) {
        footerLeft.innerHTML = `© <span id="year">${new Date().getFullYear()}</span> ${eyebrowName}`;
      }

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

      // Update JSON-LD
      let ldJsonEl = $('script[type="application/ld+json"]');
      if (ldJsonEl) {
        try {
          const ld = JSON.parse(ldJsonEl.textContent);
          if (eyebrowName) ld.name = eyebrowName;
          const heroJob = (data.hero && data.hero.fields && data.hero.fields.status) ? data.hero.fields.status.split('·')[0].trim() : 'Senior Robotics Engineer';
          ld.jobTitle = heroJob;
          if (contact.email) ld.email = `mailto:${contact.email}`;
          if (contact.phone) ld.telephone = contact.phone;
          if (contact.github) ld.url = contact.github;
          if (contact.github || contact.linkedin) {
            ld.sameAs = [];
            if (contact.github) ld.sameAs.push(contact.github);
            if (contact.linkedin) ld.sameAs.push(contact.linkedin);
          }
          ldJsonEl.textContent = JSON.stringify(ld, null, 2);
        } catch (e) {
          console.error('Error updating JSON-LD:', e);
        }
      }
    }

    // First, remove any previously created dynamic sections to prevent duplicates on reload/re-render
    $$('.dynamic-section').forEach(el => el.remove());

    const SECTION_ORDER = [];
    
    // Standard section mappings
    const standardMap = {
      hero: { id: 'hero', label: 'Top' },
      about: { id: 'about', label: 'About' },
      work: { id: 'work', label: 'My Work' },
      experience: { id: 'experience', label: 'Experience' },
      skills: { id: 'toolkit', label: 'Skills' },
      research: { id: 'research', label: 'Research' },
      education: { id: 'education', label: 'Education' },
      contact: { id: 'contact', label: 'Contact' }
    };

    // We can iterate over the keys of data in order
    Object.keys(data).forEach(key => {
      if (standardMap[key]) {
        SECTION_ORDER.push({
          key: key,
          id: standardMap[key].id,
          label: standardMap[key].label,
          isStandard: true
        });
      } else {
        // Custom dynamic section!
        const id = key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const label = key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        SECTION_ORDER.push({
          key: key,
          id: id,
          label: label,
          isStandard: false
        });
      }
    });

    // Render custom dynamic sections
    SECTION_ORDER.forEach(item => {
      if (item.isStandard) return; // Standard sections are already in HTML

      const secData = data[item.key];
      const title = item.label;
      const subtitle = secData.fields.subtitle || '';
      const items = secData.items || [];

      const sectionEl = document.createElement('section');
      sectionEl.className = 'section dynamic-section reveal';
      sectionEl.id = item.id;

      const headEl = document.createElement('div');
      headEl.className = 'section__head';
      
      const indexEl = document.createElement('span');
      indexEl.className = 'section__index';
      headEl.appendChild(indexEl);

      const titleEl = document.createElement('h2');
      titleEl.className = 'section__title reveal';
      titleEl.textContent = title;
      headEl.appendChild(titleEl);

      if (subtitle) {
        const subEl = document.createElement('p');
        subEl.className = 'section__sub reveal';
        subEl.textContent = subtitle;
        headEl.appendChild(subEl);
      }
      sectionEl.appendChild(headEl);

      // Body container
      const bodyEl = document.createElement('div');
      bodyEl.className = 'dynamic-section__body';
      bodyEl.style.display = 'grid';
      bodyEl.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
      bodyEl.style.gap = '2rem';
      bodyEl.style.marginTop = '3rem';

      items.forEach(itemData => {
        const itemEl = document.createElement('div');
        itemEl.className = 'pcard reveal';
        itemEl.dataset.cursor = 'hover';

        let innerHTML = '';
        innerHTML += `<h3>${itemData.title}</h3>`;

        const descVal = itemData.fields.description || itemData.fields.discription || '';
        if (descVal) {
          innerHTML += `<p>${formatText(descVal)}</p>`;
        }

        if (itemData.bullets && itemData.bullets.length > 0) {
          innerHTML += `<ul style="margin: 1rem 0; padding-left: 1.2rem; color: var(--muted); line-height: 1.6;">`;
          itemData.bullets.forEach(b => {
            innerHTML += `<li>${formatText(b)}</li>`;
          });
          innerHTML += `</ul>`;
        }

        let fieldsHTML = '';
        Object.entries(itemData.fields).forEach(([fKey, fVal]) => {
          if (['description', 'discription', 'tags', 'subtitle'].includes(fKey)) return;
          fieldsHTML += `<div><strong>${fKey.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}:</strong> ${fVal}</div>`;
        });
        if (fieldsHTML) {
          innerHTML += `<div style="font-size: 0.85rem; color: var(--muted); margin-top: 1rem; display: flex; flex-direction: column; gap: 0.25rem;">${fieldsHTML}</div>`;
        }

        if (itemData.fields.tags) {
          const tagsHTML = itemData.fields.tags.split(',').map(t => `<span>${t.trim()}</span>`).join('');
          innerHTML += `<div class="pcard__stack" style="margin-top: 1rem;">${tagsHTML}</div>`;
        }

        itemEl.innerHTML = innerHTML;
        bodyEl.appendChild(itemEl);
      });

      sectionEl.appendChild(bodyEl);

      // Insert before contact section
      const contactSection = $('#contact');
      if (contactSection && contactSection.parentNode) {
        contactSection.parentNode.insertBefore(sectionEl, contactSection);
      }
    });

    // Re-index all visible sections dynamically
    let sectionIdx = 1;
    $$('main section[id]').forEach(sec => {
      if (sec.id === 'hero') return;
      if (sec.style.display !== 'none') {
        const indexEl = $('.section__index', sec);
        if (indexEl) {
          indexEl.textContent = String(sectionIdx++).padStart(2, '0');
        }
      }
    });

    // Build Header Nav links
    const navLinksContainer = $('#navLinks');
    if (navLinksContainer) {
      navLinksContainer.innerHTML = '';
      SECTION_ORDER.forEach(item => {
        // Skip hero link in the header menu (just like original index.html)
        if (item.id === 'hero') return;

        // Skip sections that are hidden
        const el = $('#' + item.id);
        if (el && el.style.display === 'none') return;

        const a = document.createElement('a');
        a.href = '#' + item.id;
        a.dataset.cursor = 'hover';
        a.textContent = item.label;
        navLinksContainer.appendChild(a);
      });
    }

    // Build Rail Indicators
    const railContainer = $('#rail');
    if (railContainer) {
      railContainer.innerHTML = '';
      let isFirst = true;
      SECTION_ORDER.forEach(item => {
        // Skip sections that are hidden
        const el = $('#' + item.id);
        if (el && el.style.display === 'none') return;

        const a = document.createElement('a');
        a.href = '#' + item.id;
        a.dataset.label = item.label;
        a.dataset.cursor = 'hover';
        a.innerHTML = '<span></span>';
        if (isFirst) {
          a.className = 'is-active';
          isFirst = false;
        }
        railContainer.appendChild(a);
      });
    }
  }

  // Fetch portfolio data
  fetch('portfolio.md?t=' + Date.now())
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
      $$('.nav__links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Mobile menu ---------- */
    const burger = $('#navBurger');
    burger && burger.addEventListener('click', () => nav.classList.toggle('open'));
    const navLinks = $('#navLinks');
    navLinks && navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        const nav = $('#nav');
        nav && nav.classList.remove('open');
      }
    });

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
    function syncRail() {
      let cur = '';
      sections.forEach(sec => { if (window.scrollY >= sec.offsetTop - innerHeight * 0.4) cur = sec.id; });
      if (!cur) cur = 'hero';
      const rail = $('#rail');
      const railLinks = rail ? $$('a', rail) : [];
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
