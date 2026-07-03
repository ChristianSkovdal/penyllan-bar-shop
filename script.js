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

if (statusEl) {
  const now = new Date();
  const hour = now.getHours();
  const isOpen = hour >= OPEN_HOUR && hour < CLOSE_HOUR;

  if (isOpen) {
    statusEl.textContent = 'Åbent nu · 11-21';
    statusEl.classList.add('open');
  } else {
    statusEl.textContent = 'Lukket nu · Åbner kl. 11';
    statusEl.classList.add('closed');
  }
}
