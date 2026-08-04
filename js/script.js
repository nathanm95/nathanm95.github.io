// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Scroll-reveal
const revealEls = document.querySelectorAll('.reveal');

// Count-up numbers: capture the final text now, blank to 0 while hidden,
// animate up when the element scrolls into view.
function initCountUps() {
  document.querySelectorAll('.count-up').forEach((el) => {
    const match = el.textContent.trim().match(/^([\d,]+)(.*)$/);
    if (!match) return;
    el.dataset.target = match[1].replace(/,/g, '');
    el.dataset.suffix = match[2];
    el.dataset.comma = match[1].includes(',') ? '1' : '0';
    el.textContent = '0' + match[2];
  });
}

function animateCount(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix;
  const useComma = el.dataset.comma === '1';
  const duration = 1100;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = (useComma ? value.toLocaleString('en-GB') : value) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

initCountUps();

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          const counter = entry.target.querySelector('.count-up');
          if (counter) animateCount(counter);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();
