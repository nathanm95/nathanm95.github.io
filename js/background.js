// Interactive constellation background.
// Dots drift slowly and link to their neighbours; the cursor pulls nearby dots
// toward it and lights up the links it touches. Purely decorative — the canvas
// is aria-hidden and never takes pointer events.

const canvas = document.getElementById('bgCanvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (canvas && canvas.getContext) {
  const ctx = canvas.getContext('2d');

  // Layout is asserted here as well as in the stylesheet. A visitor holding a
  // cached copy of the old CSS would otherwise get an unstyled canvas sitting
  // in the page flow, pushing the header down.
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';

  // Tuning
  const DENSITY = 14000; // one particle per this many CSS pixels of viewport
  const MAX_PARTICLES = 90;
  const LINK_DIST = 132; // dot-to-dot link range
  const POINTER_DIST = 190; // how far the cursor reaches
  const PULL = 0.28; // how hard the cursor tugs
  const MAX_SPEED = 0.42;

  let particles = [];
  let width = 0;
  let height = 0;
  let frame = null;
  const pointer = { x: 0, y: 0, active: false };

  // Colours follow the page theme so this works in light and dark mode.
  const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
  function palette() {
    return darkMode.matches
      ? { dot: '140, 170, 255', line: '120, 155, 255', dotAlpha: 0.55, lineAlpha: 0.22 }
      : { dot: '0, 90, 190', line: '0, 100, 200', dotAlpha: 0.45, lineAlpha: 0.2 };
  }
  let colors = palette();

  // The canvas's layout size comes from its box (100% of the viewport); we only
  // match the backing store to it, so the drawing always covers the whole screen.
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = rect.width || window.innerWidth;
    height = rect.height || window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  }

  function build() {
    const count = Math.min(Math.round((width * height) / DENSITY), MAX_PARTICLES);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 1.6
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      // Cursor attraction, easing off with distance.
      if (pointer.active) {
        const dx = pointer.x - p.x;
        const dy = pointer.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < POINTER_DIST && dist > 1) {
          const force = (1 - dist / POINTER_DIST) * PULL;
          p.vx += (dx / dist) * force * 0.06;
          p.vy += (dy / dist) * force * 0.06;
        }
      }

      // Gentle drag, so the cursor never flings anything off screen.
      p.vx *= 0.985;
      p.vy *= 0.985;
      const speed = Math.hypot(p.vx, p.vy);
      if (speed > MAX_SPEED) {
        p.vx = (p.vx / speed) * MAX_SPEED;
        p.vy = (p.vy / speed) * MAX_SPEED;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around the edges.
      if (p.x < -20) p.x = width + 20;
      else if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      else if (p.y > height + 20) p.y = -20;

      // Links to later particles only, so each pair is drawn once.
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.hypot(dx, dy);
        if (dist > LINK_DIST) continue;
        const alpha = (1 - dist / LINK_DIST) * colors.lineAlpha;
        ctx.strokeStyle = 'rgba(' + colors.line + ', ' + alpha + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }

      // Link to the cursor itself, brighter than the dot-to-dot lines.
      if (pointer.active) {
        const dist = Math.hypot(pointer.x - p.x, pointer.y - p.y);
        if (dist < POINTER_DIST) {
          const alpha = (1 - dist / POINTER_DIST) * colors.lineAlpha * 2.4;
          ctx.strokeStyle = 'rgba(' + colors.line + ', ' + alpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = 'rgba(' + colors.dot + ', ' + colors.dotAlpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    frame = requestAnimationFrame(step);
  }

  function start() {
    if (frame === null) frame = requestAnimationFrame(step);
  }

  function stop() {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  }

  // One static frame, for anyone who asked for reduced motion.
  function renderOnce() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (dist > LINK_DIST) continue;
        ctx.strokeStyle =
          'rgba(' + colors.line + ', ' + (1 - dist / LINK_DIST) * colors.lineAlpha + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(' + colors.dot + ', ' + colors.dotAlpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function apply() {
    if (reduceMotion.matches) {
      stop();
      pointer.active = false;
      renderOnce();
    } else {
      start();
    }
  }

  // Pointer tracking. A coarse pointer (touch) gets the drift but no attraction.
  const finePointer = window.matchMedia('(pointer: fine)');
  window.addEventListener(
    'pointermove',
    (e) => {
      if (!finePointer.matches || reduceMotion.matches) return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = true;
    },
    { passive: true }
  );
  window.addEventListener('pointerleave', () => {
    pointer.active = false;
  });
  document.addEventListener('mouseleave', () => {
    pointer.active = false;
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      apply();
    }, 150);
  });

  // Don't burn frames on a tab nobody is looking at.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else apply();
  });

  if (darkMode.addEventListener) {
    darkMode.addEventListener('change', () => {
      colors = palette();
      if (reduceMotion.matches) renderOnce();
    });
  }
  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', apply);
  }

  resize();
  apply();
}
