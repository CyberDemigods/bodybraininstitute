// ===== NAV =====
const navbar = document.getElementById('navbar');
if (navbar) window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 40));

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
  navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => navLinks.classList.remove('active')));
}

// ===== HERO PANEL SLIDE =====
(function() {
  const body = document.querySelector('.hero-body');
  const brain = document.querySelector('.hero-brain');
  if (!body || !brain) return;

  const DEFAULT = 55;   // body domyślnie 55%
  const EXPAND  = 62;   // rozszerzony panel
  const SHRINK  = 38;   // skurczony panel
  const SPEED   = 0.06; // 0–1, im mniej tym wolniej (lerp factor)

  let target = DEFAULT;
  let current = DEFAULT;
  let raf = null;

  function apply(bodyPct) {
    // Body w flow (clip-path + margin-right:-8% obsługuje overlap)
    body.style.width = bodyPct + '%';
    // Brain absolutny od prawej, pokrywa resztę + zachodzi pod diagonalę body
    // body zajmuje bodyPct% ale margin-right:-8% przesuwa granicę, więc brain sięga od ~(bodyPct-8-5)% do 100%
    brain.style.width = (100 - bodyPct + 13) + '%';
  }

  function animate() {
    current += (target - current) * SPEED;
    if (Math.abs(target - current) < 0.05) current = target;

    apply(current);

    if (current !== target) {
      raf = requestAnimationFrame(animate);
    } else {
      raf = null;
    }
  }

  function setTarget(val) {
    target = val;
    if (!raf) raf = requestAnimationFrame(animate);
  }

  body.addEventListener('mouseenter', () => setTarget(EXPAND));
  brain.addEventListener('mouseenter', () => setTarget(SHRINK));

  const split = document.querySelector('.hero-split');
  if (split) split.addEventListener('mouseleave', () => setTarget(DEFAULT));

  // init
  apply(DEFAULT);
})();

// ===== FORM MOCK =====
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-submit');
    const orig = btn.textContent;
    btn.textContent = 'Wysłano!';
    btn.style.background = '#1e3264';
    setTimeout(() => { btn.textContent = orig; btn.style.background = ''; form.reset(); }, 2500);
  });
}

// ===== STAGGERED SCROLL REVEAL =====
const staggerGroups = [
  '.about-dual .about-card',
  '.courses-column .card-dark',
  '.stats-row .stat',
  '.blog-grid .blog-card',
  '.instructors-row .instructor-card',
  '.instructors-list .instructor-card-full',
];
staggerGroups.forEach(selector => {
  const items = document.querySelectorAll(selector);
  if (!items.length) return;
  items.forEach((el, i) => {
    el.classList.add('reveal-stagger');
    el.style.transitionDelay = (i * 150) + 'ms';
  });
});
// Also reveal single elements
document.querySelectorAll('.featured-quote, .trust-bar').forEach(el => {
  el.classList.add('reveal-stagger');
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal-stagger').forEach(el => revealObserver.observe(el));

// ===== ANIMATED STAT COUNTERS =====
const statNumbers = document.querySelectorAll('.stat-number[data-target]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.5 });

statNumbers.forEach(el => counterObserver.observe(el));

// ===== MATRIX RAIN — ambient, slow =====
function initMatrix(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let raf;

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width = r.width;
    canvas.height = r.height;
  }
  resize();
  window.addEventListener('resize', resize);

  const chars = '01{}[]<>|=+-*&^%$#@!?;:アカサタナハマヤラワ0123456789';
  const fontSize = 14;
  let cols = Math.floor(canvas.width / fontSize);
  let drops = Array.from({ length: cols }, () => Math.random() * -120);

  function draw() {
    // Slow fade — trails linger
    ctx.fillStyle = 'rgba(18, 10, 32, 0.025)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    cols = Math.floor(canvas.width / fontSize);
    while (drops.length < cols) drops.push(Math.random() * -80);

    ctx.font = fontSize + 'px monospace';

    for (let i = 0; i < cols; i++) {
      // Only some columns active at a time
      if (drops[i] < 0) {
        drops[i] += 0.05;
        continue;
      }

      const y = drops[i] * fontSize;
      const ch = chars[Math.floor(Math.random() * chars.length)];
      const b = Math.random();

      if (b > 0.94) {
        ctx.fillStyle = '#b48cff';
        ctx.shadowColor = '#b48cff';
        ctx.shadowBlur = 10;
      } else if (b > 0.65) {
        ctx.fillStyle = 'rgba(155, 125, 207, 0.35)';
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = 'rgba(92, 61, 153, 0.15)';
        ctx.shadowBlur = 0;
      }

      ctx.fillText(ch, i * fontSize, y);
      ctx.shadowBlur = 0;

      // Very slow descent
      drops[i] += 0.08 + Math.random() * 0.06;

      // Reset — rare, keeps it sparse
      if (y > canvas.height && Math.random() > 0.997) {
        drops[i] = Math.random() * -40;
      }
    }

    raf = requestAnimationFrame(draw);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { if (!raf) draw(); }
      else { cancelAnimationFrame(raf); raf = null; }
    });
  }, { threshold: 0.05 });
  io.observe(canvas);
}

// ===== ORGANIC VEINS — pulsating slow =====
function initVeins(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let raf;
  let time = 0;

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width = r.width;
    canvas.height = r.height;
    generateVeins();
  }
  resize();
  window.addEventListener('resize', resize);

  const veins = [];

  function generateVeins() {
    veins.length = 0;
    for (let i = 0; i < 14; i++) {
      const pts = [];
      let x = Math.random() * canvas.width;
      let y = Math.random() * -100;
      const numPts = 5 + Math.floor(Math.random() * 5);
      for (let j = 0; j < numPts; j++) {
        pts.push({ x, y });
        x += (Math.random() - 0.5) * 180;
        y += 40 + Math.random() * 100;
      }
      veins.push({
        pts,
        w: 0.6 + Math.random() * 2,
        speed: 0.3 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2,
        alpha: 0.08 + Math.random() * 0.14,
        warm: Math.random() > 0.4, // more warm tones
      });
    }
  }

  const particles = Array.from({ length: 25 }, () => ({
    vi: Math.floor(Math.random() * 14),
    t: Math.random(),
    speed: 0.0003 + Math.random() * 0.0008,
    size: 1 + Math.random() * 2,
    bright: 0.4 + Math.random() * 0.5,
  }));

  function ptOnVein(v, t) {
    const idx = t * (v.pts.length - 1);
    const i = Math.floor(idx);
    const f = idx - i;
    if (i >= v.pts.length - 1) return v.pts[v.pts.length - 1];
    const a = v.pts[i], b = v.pts[Math.min(i + 1, v.pts.length - 1)];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
  }

  function draw() {
    time += 0.012;
    ctx.fillStyle = 'rgba(11, 18, 37, 0.03)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    veins.forEach(v => {
      const pulse = Math.sin(time * v.speed + v.offset) * 0.5 + 0.5;
      const a = v.alpha * (0.5 + pulse * 0.5);

      ctx.beginPath();
      ctx.strokeStyle = v.warm
        ? `rgba(200, 164, 110, ${a})`
        : `rgba(90, 126, 192, ${a})`;
      ctx.lineWidth = v.w * (0.6 + pulse * 0.4);
      ctx.lineCap = 'round';

      v.pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();

      // Subtle glow
      ctx.strokeStyle = v.warm
        ? `rgba(200, 164, 110, ${a * 0.25})`
        : `rgba(90, 126, 192, ${a * 0.25})`;
      ctx.lineWidth = v.w * 4;
      ctx.stroke();
    });

    particles.forEach(p => {
      p.t += p.speed;
      if (p.t > 1) { p.t = 0; p.vi = Math.floor(Math.random() * veins.length); }
      if (p.vi >= veins.length) return;
      const pos = ptOnVein(veins[p.vi], p.t);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 164, 110, ${p.bright * 0.5})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 164, 110, ${p.bright * 0.1})`;
      ctx.fill();
    });

    raf = requestAnimationFrame(draw);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { if (!raf) draw(); }
      else { cancelAnimationFrame(raf); raf = null; }
    });
  }, { threshold: 0.05 });
  io.observe(canvas);
}

// ===== INIT =====
initVeins('veinsCanvas');
initMatrix('matrixCanvas');
