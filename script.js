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

  const DA_MONTHS = ['januar', 'februar', 'marts', 'april', 'maj', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'december'];

  function formatEventDate(iso) {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    const day = parseInt(parts[2], 10);
    const month = DA_MONTHS[parseInt(parts[1], 10) - 1];
    if (!month || !day) return iso;
    return day + '. ' + month + ' ' + parts[0];
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

  function loadEvents() {
    const source = grid.getAttribute('data-events-source');
    if (!source) return;
    renderStatus('events.loading', 'Indlæser events…');
    fetch(source)
      .then((res) => { if (!res.ok) throw new Error('HTTP ' + res.status); return res.json(); })
      .then((data) => renderEvents(Array.isArray(data) ? data : []))
      .catch(() => renderStatus('events.error', 'Kunne ikke hente events lige nu.'));
  }

  loadEvents();
})();

// Simple "open now" indicator based on daily 11-21 opening hours.
// Note: this does not account for Facebook-announced exceptions.
const OPEN_HOUR = 11;
const CLOSE_HOUR = 21;

const statusEl = document.getElementById('open-status');

function updateOpenStatus(lang) {
  if (!statusEl) return;
  const dict = (window.translations && window.translations[lang]) || {};
  const now = new Date();
  const hour = now.getHours();
  const isOpen = hour >= OPEN_HOUR && hour < CLOSE_HOUR;

  statusEl.classList.remove('open', 'closed');

  if (isOpen) {
    statusEl.textContent = dict['status.open'] || 'Åbent nu · 11-21';
    statusEl.classList.add('open');
  } else {
    statusEl.textContent = dict['status.closed'] || 'Lukket nu · Åbner kl. 11';
    statusEl.classList.add('closed');
  }
}

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
