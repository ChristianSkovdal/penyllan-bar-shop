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

// Oktoberfest details modal
(function () {
  const openBtn = document.getElementById('oktoberfest-details-btn');
  const modal = document.getElementById('oktoberfest-modal');
  const closeBtn = document.getElementById('oktoberfest-modal-close');
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
