// Mobile navigation toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close menu after clicking a link (mobile)
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Hero image carousel
(function () {
  const track = document.getElementById('carousel-track');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.slide'));
  const dotsWrap = document.getElementById('carousel-dots');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  let current = 0;
  let timer = null;
  const INTERVAL = 6000;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', 'Vis billede ' + (i + 1));
    if (i === 0) dot.classList.add('is-active');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.children);

  function goTo(index) {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(next, INTERVAL);
  }

  function stopAutoplay() {
    if (timer) clearInterval(timer);
  }

  if (nextBtn) nextBtn.addEventListener('click', () => { next(); startAutoplay(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { prev(); startAutoplay(); });

  const carouselEl = document.getElementById('carousel');
  if (carouselEl) {
    carouselEl.addEventListener('mouseenter', stopAutoplay);
    carouselEl.addEventListener('mouseleave', startAutoplay);
  }

  startAutoplay();
})();

// Fadøl details modal
(function () {
  const openBtn = document.getElementById('fadol-details-btn');
  const modal = document.getElementById('fadol-modal');
  const closeBtn = document.getElementById('fadol-modal-close');
  if (!openBtn || !modal || !closeBtn) return;

  function openModal() {
    modal.hidden = false;
  }

  function closeModal() {
    modal.hidden = true;
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });
})();

// Events — pulled live from Beer Here's admin-managed event list
// (data/events.json on beerhere.dk) via its public /api/events endpoint,
// so events only need to be entered once, in Beerhere's admin panel.
// Note: that data is Danish-only, so event cards stay in Danish regardless
// of the site's language toggle — only the surrounding UI text (loading/
// empty/error, "Read more") is translated.
(function () {
  const grid = document.getElementById('event-grid');
  if (!grid) return;

  const modal = document.getElementById('event-preview-modal');
  const modalClose = document.getElementById('event-preview-modal-close');
  const modalTitle = document.getElementById('event-preview-modal-title');
  const modalBody = document.getElementById('event-preview-modal-body');

  function currentLang() {
    return document.documentElement.getAttribute('lang') || 'da';
  }

  function t(key, fallback) {
    const dict = (window.translations && window.translations[currentLang()]) || {};
    return dict[key] !== undefined ? dict[key] : fallback;
  }

  function openModal(title, html) {
    if (!modal) return;
    modalTitle.textContent = title;
    modalBody.innerHTML = html;
    modal.hidden = false;
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
  });

  // Site-sprog -> BCP-47 locale til datoformatering.
  const DATE_LOCALES = { da: 'da-DK', en: 'en-GB', de: 'de-DE', pl: 'pl-PL' };

  function formatEventDate(iso) {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const d = new Date(Date.UTC(+parts[0], +parts[1] - 1, +parts[2]));
    if (isNaN(d.getTime())) return iso;
    const locale = DATE_LOCALES[currentLang()] || DATE_LOCALES.da;
    try {
      return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
    } catch (e) {
      return iso;
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function renderStatus(key, fallback) {
    const p = document.createElement('p');
    p.className = 'event-status';
    p.setAttribute('data-i18n', key);
    p.textContent = t(key, fallback);
    grid.innerHTML = '';
    grid.appendChild(p);
  }

  function renderEvents(events) {
    if (!events.length) {
      renderStatus('events.empty', 'Der er ingen kommende events lige nu.');
      return;
    }

    grid.innerHTML = '';
    events.forEach((ev) => {
      const article = document.createElement('article');
      article.className = 'event-card';

      let html = '';
      if (ev.image) {
        html += '<div class="event-image"><img src="' + escapeHtml(ev.image) + '" alt="' + escapeHtml(ev.title || '') + '" loading="lazy"></div>';
      }
      html += '<div class="event-body">';
      html += '<p class="event-date">' + escapeHtml(formatEventDate(ev.date)) + '</p>';
      html += '<h3>' + escapeHtml(ev.title || '') + '</h3>';
      if (ev.synopsis) html += '<p>' + escapeHtml(ev.synopsis) + '</p>';
      if (ev.description && ev.description.trim()) {
        html += '<p><button type="button" class="link-button event-readmore-btn" data-i18n="events.readMore">' + escapeHtml(t('events.readMore', 'Læs mere')) + '</button></p>';
      }
      html += '</div>';
      article.innerHTML = html;

      const readMoreBtn = article.querySelector('.event-readmore-btn');
      if (readMoreBtn) {
        readMoreBtn.addEventListener('click', () => openModal(ev.title || '', ev.description));
      }

      grid.appendChild(article);
    });
  }

  let lastLoadedLang = null;

  function loadEvents() {
    const source = grid.getAttribute('data-events-source');
    if (!source) return;
    const lang = currentLang();
    lastLoadedLang = lang;
    // Bed feedet om events på det aktuelle sprog (beerhere.dk oversætter med DeepL).
    const url = source + (source.indexOf('?') === -1 ? '?' : '&') + 'lang=' + encodeURIComponent(lang);
    renderStatus('events.loading', 'Indlæser events…');
    fetch(url)
      .then((res) => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then((data) => renderEvents(Array.isArray(data) ? data : []))
      .catch(() => renderStatus('events.error', 'Kunne ikke hente events lige nu.'));
  }

  // Hent events på ny når sproget skifter, så tekst og dato følger sprogvælgeren.
  document.addEventListener('penyllan:langchange', (e) => {
    const lang = (e.detail && e.detail.lang) || currentLang();
    if (lang !== lastLoadedLang) loadEvents();
  });

  loadEvents();
})();

// Opening hours + "open now" badge — pulled live from beerhere.dk/api/opening-hours
// (a server-side Google Business Profile lookup), same pattern as the events feed.
// The Google API key stays on the server; the frontend only reads clean JSON:
//   { "openNow": true|false|null,
//     "days": [ { "day": 0, "open": "11:00", "close": "21:00" }, ... ],   // day: JS getDay(), 0=Sun..6=Sat
//     "days[i].closed": true  // optional, for days the bar is closed
//   }
// If the endpoint is missing or fails, we fall back to the static 11–21 table
// baked into index.html, so the site never shows an empty section.
const HOURS_LOCALES = { da: 'da-DK', en: 'en-GB', de: 'de-DE', pl: 'pl-PL' };
const HOURS_FALLBACK = { openNow: null, days: [0, 1, 2, 3, 4, 5, 6].map((d) => ({ day: d, open: '11:00', close: '21:00' })) };

const statusEl = document.getElementById('open-status');
const hoursTableBody = document.querySelector('.hours-table tbody');

let hoursData = null; // populated once the endpoint responds; until then we use the fallback

function hoursLang() {
  return document.documentElement.getAttribute('lang') || 'da';
}

function parseHM(s) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s || '');
  return m ? { h: +m[1], m: +m[2] } : null;
}

function fmtTime(s, lang) {
  const p = parseHM(s);
  if (!p) return s || '';
  const locale = HOURS_LOCALES[lang] || HOURS_LOCALES.da;
  const d = new Date();
  d.setHours(p.h, p.m, 0, 0);
  try {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: p.m ? '2-digit' : undefined }).format(d);
  } catch (e) {
    return s;
  }
}

function weekdayLabel(jsDay, lang) {
  const locale = HOURS_LOCALES[lang] || HOURS_LOCALES.da;
  // 2024-01-07 (UTC) is a Sunday; add jsDay to land on the right weekday name.
  const d = new Date(Date.UTC(2024, 0, 7 + jsDay));
  const label = new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function activeHours() {
  return hoursData && Array.isArray(hoursData.days) && hoursData.days.length ? hoursData : HOURS_FALLBACK;
}

function allDaysEqual(days) {
  return days.every((d) => d.open === days[0].open && d.close === days[0].close && !d.closed === !days[0].closed);
}

function todayEntry(data) {
  const day = new Date().getDay();
  return data.days.find((d) => d.day === day) || null;
}

function isOpenNow(data) {
  if (typeof data.openNow === 'boolean') return data.openNow; // backend is authoritative (handles special hours + timezone)
  const today = todayEntry(data);
  if (!today || today.closed) return false;
  const o = parseHM(today.open), c = parseHM(today.close);
  if (!o || !c) return false;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= o.h * 60 + o.m && mins < c.h * 60 + c.m;
}

function renderHoursTable(lang) {
  if (!hoursTableBody) return;
  const data = activeHours();
  const dict = (window.translations && window.translations[lang]) || {};
  const byDay = {};
  data.days.forEach((d) => { byDay[d.day] = d; });
  const ordered = [1, 2, 3, 4, 5, 6, 0].map((i) => byDay[i]).filter(Boolean); // Mon..Sun

  const rangeText = (d) => d.closed
    ? (dict['hours.closed'] || 'Lukket')
    : fmtTime(d.open, lang) + ' – ' + fmtTime(d.close, lang);
  const row = (label, value) => '<tr><th>' + label + '</th><td>' + value + '</td></tr>';

  hoursTableBody.innerHTML = allDaysEqual(data.days)
    ? row(dict['hours.everyday'] || 'Hver dag', rangeText(data.days[0]))
    : ordered.map((d) => row(weekdayLabel(d.day, lang), rangeText(d))).join('');
}

function updateOpenStatus(lang) {
  renderHoursTable(lang);
  if (!statusEl) return;
  const dict = (window.translations && window.translations[lang]) || {};
  const data = activeHours();
  const today = todayEntry(data);
  const tmpl = (key, fallback, time) => (dict[key] || fallback).replace('{time}', time);

  statusEl.classList.remove('open', 'closed');

  if (isOpenNow(data) && today) {
    statusEl.textContent = tmpl('status.openUntil', 'Åbent nu · lukker {time}', fmtTime(today.close, lang));
    statusEl.classList.add('open');
  } else if (today && !today.closed) {
    statusEl.textContent = tmpl('status.closedOpensAt', 'Lukket nu · åbner {time}', fmtTime(today.open, lang));
    statusEl.classList.add('closed');
  } else {
    statusEl.textContent = dict['status.closedToday'] || 'Lukket i dag';
    statusEl.classList.add('closed');
  }
}

// Fetch the live hours once on load. Priority:
//   1. Manual override (opening-hours-override.json) if "active": true — a staff
//      backup that wins over Google, editable via admin-hours.html.
//   2. Live hours from the /api/opening-hours endpoint (Google).
//   3. Static fallback table baked into index.html.
// Language re-rendering is handled by the language switcher calling updateOpenStatus().
(function () {
  const el = document.querySelector('[data-hours-source]');
  const source = el ? el.getAttribute('data-hours-source') : null;
  const overrideSrc = el ? el.getAttribute('data-hours-override') : null;

  function loadFromApi() {
    if (!source) { updateOpenStatus(hoursLang()); return; }
    fetch(source)
      .then((res) => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then((data) => { if (data && Array.isArray(data.days)) hoursData = data; })
      .catch(() => { /* keep the static fallback */ })
      .finally(() => updateOpenStatus(hoursLang()));
  }

  if (!overrideSrc) { loadFromApi(); return; }

  fetch(overrideSrc, { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((ov) => {
      if (ov && ov.active && Array.isArray(ov.days) && ov.days.length) {
        hoursData = ov; // manual override wins
        updateOpenStatus(hoursLang());
      } else {
        loadFromApi();
      }
    })
    .catch(loadFromApi);
})();

// Language switcher (dropdown)
(function () {
  const STORAGE_KEY = 'penyllan-lang';
  const DEFAULT_LANG = 'da';
  const FLAGS = { da: '🇩🇰', en: '🇬🇧', de: '🇩🇪', pl: '🇵🇱' };

  const dropdown = document.getElementById('lang-dropdown');
  const trigger = document.getElementById('lang-current-btn');
  const flagEl = document.getElementById('lang-current-flag');
  const menu = document.getElementById('lang-menu');

  function closeDropdown() {
    if (!dropdown) return;
    dropdown.classList.remove('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function toggleDropdown() {
    if (!dropdown) return;
    const isOpen = dropdown.classList.toggle('is-open');
    if (trigger) trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  function applyLanguage(lang) {
    const dict = (window.translations && window.translations[lang]) || (window.translations && window.translations[DEFAULT_LANG]);
    if (!dict) return;

    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });

    document.querySelectorAll('[data-i18n-alt]').forEach((el) => {
      const key = el.getAttribute('data-i18n-alt');
      if (dict[key] !== undefined) el.setAttribute('alt', dict[key]);
    });

    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      const key = el.getAttribute('data-i18n-aria');
      if (dict[key] !== undefined) el.setAttribute('aria-label', dict[key]);
    });

    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-lang') === lang);
    });

    if (flagEl) flagEl.textContent = FLAGS[lang] || FLAGS[DEFAULT_LANG];

    updateOpenStatus(lang);
    localStorage.setItem(STORAGE_KEY, lang);

    // Lad andre moduler (fx event-listen) reagere på sprogskift.
    document.dispatchEvent(new CustomEvent('penyllan:langchange', { detail: { lang } }));
  }

  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown();
    });
  }

  if (menu) {
    menu.querySelectorAll('.lang-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyLanguage(btn.getAttribute('data-lang'));
        closeDropdown();
      });
    });
  }

  document.addEventListener('click', (e) => {
    if (dropdown && !dropdown.contains(e.target)) closeDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown();
  });

  let savedLang = DEFAULT_LANG;
  try {
    savedLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  } catch (e) {
    savedLang = DEFAULT_LANG;
  }

  applyLanguage(savedLang);
})();
