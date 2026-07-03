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

// Language switcher
(function () {
  const STORAGE_KEY = 'penyllan-lang';
  const DEFAULT_LANG = 'da';
  const switcher = document.getElementById('lang-switcher');

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

    if (switcher) {
      switcher.querySelectorAll('.lang-btn').forEach((btn) => {
        btn.classList.toggle('is-active', btn.getAttribute('data-lang') === lang);
      });
    }

    updateOpenStatus(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }

  if (switcher) {
    switcher.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => applyLanguage(btn.getAttribute('data-lang')));
    });
  }

  let savedLang = DEFAULT_LANG;
  try {
    savedLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
  } catch (e) {
    savedLang = DEFAULT_LANG;
  }

  applyLanguage(savedLang);
})();
