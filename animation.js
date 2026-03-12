/* ══════════════════════════════════════════════════════════════
   Quality Roots — THE CUT — Animation Engine
   Canvas: 1920 × 1080 · Non-interactive video template
   Cycle: ~18s per batch · Products shown: 3 per cycle
   ══════════════════════════════════════════════════════════════ */

'use strict';

// ── Plugin Registration ──────────────────────────────────────
gsap.registerPlugin(SplitText, CustomEase, DrawSVGPlugin, ScrambleTextPlugin);

// Custom eases
CustomEase.create('dealBounce',  'M0,0 C0.2,0 0.35,1.2 0.5,1 0.65,0.8 0.8,1.05 1,1');
CustomEase.create('priceSlam',   'M0,0 C0.14,0 0.242,0.438 0.272,0.561 0.313,0.728 0.354,0.963 0.362,1');
CustomEase.create('swipeOut',    'M0,0 C0.6,0 0.8,0.6 1,1');

// ── Constants ────────────────────────────────────────────────
const PRODUCTS_PER_CYCLE = 3;
const CYCLE_DURATION     = 18;   // seconds
const ENTER_DURATION     = 2.0;
const IDLE_DURATION      = 9.0;
const EXIT_DURATION      = 2.0;

// ── State ────────────────────────────────────────────────────
let PRODUCTS     = [];
let currentBatch = 0;
let masterTL     = null;
let particleRAF  = null;

// ── Particle System ──────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = 1920;
  canvas.height = 1080;

  const count = 90;
  const particles = Array.from({ length: count }, (_, i) => ({
    x:        Math.random() * 1920,
    y:        Math.random() * 1080 + (i < count * 0.4 ? 1080 : 0),
    size:     Math.random() * 2.5 + 0.8,
    speed:    Math.random() * 0.55 + 0.2,
    opacity:  Math.random() * 0.45 + 0.1,
    // Gold (60%) or green (40%)
    color:    Math.random() > 0.4 ? '#f5c842' : '#7dcc68',
    wobble:   Math.random() * Math.PI * 2,
    wobbleAmp: Math.random() * 1.5 + 0.3,
    wobbleSpd: (Math.random() - 0.5) * 0.025,
  }));

  function tick() {
    ctx.clearRect(0, 0, 1920, 1080);
    particles.forEach(p => {
      p.y      -= p.speed;
      p.wobble += p.wobbleSpd;
      p.x      += Math.sin(p.wobble) * p.wobbleAmp * 0.4;

      // Wrap when off-screen
      if (p.y < -10) { p.y = 1095; p.x = Math.random() * 1920; }
      if (p.x < -10) p.x = 1930;
      if (p.x > 1930) p.x = -10;

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    particleRAF = requestAnimationFrame(tick);
  }
  tick();
}

// ── Spark Burst ───────────────────────────────────────────────
function burstSparks(originEl, count = 10) {
  if (!originEl) return;
  const rect = originEl.getBoundingClientRect();
  const scene = document.getElementById('scene');
  const sceneRect = scene.getBoundingClientRect();
  const cx = rect.left - sceneRect.left + rect.width  * 0.5;
  const cy = rect.top  - sceneRect.top  + rect.height * 0.5;

  const colors = ['#f5c842', '#ffda6b', '#7dcc68', '#fff'];

  for (let i = 0; i < count; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    spark.style.left = cx + 'px';
    spark.style.top  = cy + 'px';
    spark.style.background = colors[i % colors.length];
    scene.appendChild(spark);

    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist  = 40 + Math.random() * 80;

    gsap.fromTo(spark,
      { x: 0, y: 0, scale: 1.2, opacity: 1 },
      {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        scale: 0,
        opacity: 0,
        duration: 0.7 + Math.random() * 0.4,
        ease: 'power2.out',
        onComplete: () => spark.remove()
      }
    );
  }
}

// ── Product Card HTML Builder ─────────────────────────────────
function buildCardHTML(product, index) {
  const strainRaw   = (product.strain || 'Hybrid').toLowerCase();
  const strainClass = strainRaw.includes('indica') ? 'strain-indica'
                    : strainRaw.includes('sativa') ? 'strain-sativa'
                    : 'strain-hybrid';
  const strainLabel = product.strain || 'Hybrid';
  const brand       = product.brand    || '';
  const category    = product.category || '';
  const thc         = product.thc      || '';
  const name        = product.name     || 'Unknown Product';
  const origPrice   = product.price    || '';
  const salePrice   = product.discounted_price || '';

  return `
    <div class="product-card" data-index="${index}" data-strain="${strainRaw}">
      <div class="card-glow"></div>
      <div class="card-inner">

        <!-- Top badges -->
        <div class="card-top">
          <span class="brand-pill">${brand}</span>
          <span class="strain-pill ${strainClass}">${strainLabel}</span>
        </div>

        <!-- Image -->
        <div class="image-container">
          <div class="image-glow"></div>
          <img class="product-img" src="${product.image_url}" alt="${name}"
               loading="eager" crossorigin="anonymous">
        </div>

        <!-- Info body -->
        <div class="card-body">
          <div class="category-label">${category}</div>
          <h3 class="p-name">${name}</h3>
          <div class="thc-bar">
            <span class="thc-dot"></span>
            <span class="thc-text">${thc}</span>
          </div>
        </div>

        <!-- Price row -->
        <div class="price-area">
          <div class="orig-price-wrap">
            <span class="orig-price">${origPrice}</span>
            <div class="price-strike"></div>
          </div>
          <div class="sale-price">${salePrice}</div>
        </div>

        <!-- Deal badge -->
        <div class="deal-tag">
          <div class="deal-tag-shine"></div>
          <span class="deal-pct">50%</span>
          <span class="deal-off">OFF</span>
        </div>

      </div><!-- .card-inner -->
    </div><!-- .product-card -->
  `;
}

// ── Render Batch ──────────────────────────────────────────────
function renderBatch(products) {
  const container = document.getElementById('products-container');
  container.innerHTML = products.map((p, i) => buildCardHTML(p, i)).join('');
}

// ── Get Batch ─────────────────────────────────────────────────
function getBatch(batchIndex) {
  if (!PRODUCTS.length) return [];
  const total = PRODUCTS.length;
  const batch = [];
  const start = (batchIndex * PRODUCTS_PER_CYCLE) % total;
  for (let i = 0; i < PRODUCTS_PER_CYCLE; i++) {
    batch.push(PRODUCTS[(start + i) % total]);
  }
  return batch;
}

// ══════════════════════════════════════════════════════════════
//  MAIN ANIMATION CYCLE
// ══════════════════════════════════════════════════════════════
function animateCycle(batchIndex) {
  const batch = getBatch(batchIndex);
  if (!batch.length) {
    // Retry after short delay if products not loaded yet
    gsap.delayedCall(0.5, () => animateCycle(batchIndex));
    return;
  }

  renderBatch(batch);

  const cards     = document.querySelectorAll('.product-card');
  const cardInners = document.querySelectorAll('.card-inner');

  // ── Hard reset all card elements + persistent elements ────
  gsap.set('#ticker-text', { opacity: 1 });
  // Reset card containers — NOT hiding them so children are visible when animated
  gsap.set(cards, {
    y: 120, opacity: 0, scale: 0.94, x: 0, rotation: 0,
    rotateX: 8, transformPerspective: 1200, clearProps: false
  });
  // Reset individual child elements (containers stay opacity:1)
  gsap.set('.card-top, .card-body, .price-area', { opacity: 1 });
  gsap.set('.product-img', { filter: 'grayscale(80%) brightness(0.6)', scale: 1.04 });
  gsap.set('.p-name', { opacity: 0 });
  gsap.set('.brand-pill, .strain-pill', { opacity: 0, y: -8 });
  gsap.set('.category-label', { opacity: 0 });
  gsap.set('.thc-bar', { opacity: 0, x: -10 });
  gsap.set('.orig-price', { opacity: 0 });
  gsap.set('.price-strike', { scaleX: 0 });
  gsap.set('.sale-price', { scale: 0, opacity: 0, rotation: -12 });
  gsap.set('.deal-tag', { scale: 0, rotation: -18, opacity: 0 });
  gsap.set('.deal-tag-shine', { x: '-100%' });
  gsap.set('.card-glow', { boxShadow: '0 0 0px rgba(245,200,66,0)' });

  // ── Build timeline ──────────────────────────────────────
  const tl = gsap.timeline({
    onComplete: () => animateCycle(batchIndex + 1),
    defaults: { ease: 'power3.out' }
  });

  // ─────────────────────────────────────────────────────────
  // PHASE 1: Card Entrances (0 → ~2.4s)
  // ─────────────────────────────────────────────────────────

  // Cards rise from below with stagger
  tl.to(cards, {
    y: 0, opacity: 1, scale: 1, rotateX: 0,
    duration: 0.85,
    stagger: 0.18,
    ease: 'back.out(1.5)',
    clearProps: 'rotateX,transformPerspective'
  }, 0);

  // Image: grayscale dissolves to full colour
  tl.to('.product-img', {
    filter: 'grayscale(0%) brightness(1)',
    scale: 1,
    duration: 1.4,
    stagger: 0.15,
    ease: 'power2.out'
  }, 0.3);

  // Top badges drop in
  tl.to('.brand-pill', {
    opacity: 1, y: 0, duration: 0.45, stagger: 0.15, ease: 'power2.out'
  }, 0.55);
  tl.to('.strain-pill', {
    opacity: 1, y: 0, duration: 0.45, stagger: 0.15, ease: 'power2.out'
  }, 0.65);

  // Category label
  tl.to('.category-label', {
    opacity: 1, duration: 0.4, stagger: 0.15, ease: 'power2.out'
  }, 0.9);

  // Product names — SplitText char animation per card
  cards.forEach((card, i) => {
    const nameEl = card.querySelector('.p-name');
    if (!nameEl) return;
    const split = SplitText.create(nameEl, { type: 'chars,words' });
    gsap.set(nameEl, { opacity: 1 });
    tl.from(split.chars, {
      opacity: 0,
      y: 18,
      rotateX: -90,
      transformOrigin: '0% 50% -20',
      duration: 0.38,
      stagger: { each: 0.018, from: 'start' },
      ease: 'back.out(2.5)'
    }, 1.05 + i * 0.14);
  });

  // THC bar slides in
  tl.to('.thc-bar', {
    opacity: 1, x: 0, duration: 0.45, stagger: 0.12, ease: 'power2.out'
  }, 1.5);

  // ─────────────────────────────────────────────────────────
  // PHASE 2: Price Reveal — "THE CUT" (2.6 → 4.2s)
  // ─────────────────────────────────────────────────────────

  const priceStart = 2.6;

  // Original prices appear
  tl.to('.price-area', {
    opacity: 1, duration: 0.35, stagger: 0.1, ease: 'power2.out'
  }, priceStart);

  tl.to('.orig-price', {
    opacity: 1, duration: 0.3, stagger: 0.1, ease: 'power2.out'
  }, priceStart + 0.1);

  // Strike-lines draw across (staggered left→right)
  tl.to('.price-strike', {
    scaleX: 1,
    duration: 0.32,
    stagger: 0.13,
    ease: 'power2.inOut'
  }, priceStart + 0.45);

  // Sale price SLAMS in with elastic overshoot
  cards.forEach((card, i) => {
    const sp = card.querySelector('.sale-price');
    tl.fromTo(sp,
      { scale: 0, opacity: 0, rotation: -12, y: 20 },
      { scale: 1, opacity: 1, rotation: 0, y: 0,
        duration: 0.65,
        ease: 'elastic.out(1.3, 0.48)'
      },
      priceStart + 0.82 + i * 0.11
    );
    // Spark burst at sale price position
    tl.call(() => burstSparks(sp, 12), null, priceStart + 1.05 + i * 0.11);
  });

  // Deal badge: rubber-band pop-in
  tl.fromTo('.deal-tag',
    { scale: 0, rotation: -18, opacity: 0 },
    {
      scale: 1, rotation: 0, opacity: 1,
      duration: 0.7,
      stagger: 0.1,
      ease: 'elastic.out(1.6, 0.45)'
    },
    priceStart + 1.2
  );

  // Deal badge shine sweep
  tl.to('.deal-tag-shine', {
    x: '200%',
    duration: 0.6,
    stagger: 0.1,
    ease: 'power2.inOut'
  }, priceStart + 1.5);

  // Card glow: gold outer glow activates
  tl.to('.card-glow', {
    boxShadow: '0 0 45px rgba(245,200,66,0.18), 0 0 90px rgba(245,200,66,0.06)',
    duration: 0.8,
    stagger: 0.1,
    ease: 'power2.out'
  }, priceStart + 1.1);

  // ─────────────────────────────────────────────────────────
  // PHASE 3: Living Moment — idle float (4.5 → 13.5s)
  // ─────────────────────────────────────────────────────────

  const idleStart = 4.5;

  // Gentle card float (different phase per card)
  cards.forEach((card, i) => {
    const floatY    = 10 + i * 2;
    const floatDur  = 2.8 + i * 0.35;
    const floatReps = Math.floor(IDLE_DURATION / (floatDur * 2)) + 1;

    tl.to(card, {
      y: `-=${floatY}`,
      duration: floatDur,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: floatReps
    }, idleStart + i * 0.6);
  });

  // Deal badge gentle pulse-scale
  tl.to('.deal-tag', {
    scale: 1.06,
    duration: 0.9,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: 8,
    stagger: 0.2
  }, idleStart + 0.5);

  // Sale price subtle glow pulse
  tl.to('.sale-price', {
    textShadow: '0 0 40px rgba(245,200,66,0.9), 0 0 80px rgba(245,200,66,0.4)',
    duration: 1.2,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: 6,
    stagger: 0.15
  }, idleStart + 1.0);

  // Half-price banner subtle pulse
  tl.to('#half-price-banner', {
    textShadow: '0 0 35px rgba(245,200,66,0.8)',
    duration: 1.5,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: 5
  }, idleStart);

  // Ticker text scramble (cycling product names)
  const tickerMsg = batch.map(p =>
    `${p.name.slice(0, 28).trim()}... NOW ${p.discounted_price}`
  ).join('  ·  ');
  tl.to('#ticker-text', {
    duration: 2,
    scrambleText: { text: tickerMsg, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', speed: 0.5 },
    ease: 'none'
  }, idleStart);

  // ─────────────────────────────────────────────────────────
  // PHASE 4: Exit — staggered cascade out (13.5 → 16s)
  // ─────────────────────────────────────────────────────────

  const exitStart = idleStart + IDLE_DURATION;

  // Each card exits in alternating directions
  const exitDirs = [
    { x: -180, rotation: -6 },  // card 0 → left
    { y:  180, rotation:  0 },  // card 1 → down
    { x:  180, rotation:  6 },  // card 2 → right
  ];

  cards.forEach((card, i) => {
    const dir = exitDirs[i % exitDirs.length];
    tl.to(card, {
      ...dir,
      opacity: 0,
      scale: 0.88,
      duration: 0.75,
      ease: 'swipeOut'
    }, exitStart + i * 0.12);
  });

  // Card glows fade
  tl.to('.card-glow', {
    boxShadow: '0 0 0px rgba(245,200,66,0)',
    duration: 0.5,
    stagger: 0.08
  }, exitStart);

  // Ticker text wipes out
  tl.to('#ticker-text', {
    opacity: 0, duration: 0.4, ease: 'power2.out'
  }, exitStart + 0.5);

  // Brief pause, then reset
  // (onComplete fires animateCycle with next batch)

  masterTL = tl;
}

// ── Header Intro (runs once) ──────────────────────────────────
function introAnimation(onComplete) {
  const tl = gsap.timeline({ onComplete });

  // Initial states
  gsap.set('#header-wrap', { y: -110, opacity: 0 });
  gsap.set('#sub-header', { y: -40, opacity: 0 });
  gsap.set('#ui-layer',   { y: 60, opacity: 0 });
  gsap.set('#bg-watermark', { opacity: 0, scale: 1.06 });
  gsap.set('.root-path', { drawSVG: '0% 0%' });
  gsap.set(['#div-left','#div-right','#div-gold-left','#div-gold-right'], { drawSVG: '50% 50%' });
  gsap.set('#half-price-banner', { opacity: 0 });

  // Background colour wash fade in
  tl.fromTo('#bg-color-wash',
    { opacity: 0 },
    { opacity: 1, duration: 1.2, ease: 'power2.out' },
    0
  );

  // Watermark drifts in
  tl.to('#bg-watermark', {
    opacity: 1, scale: 1, duration: 2, ease: 'power3.out'
  }, 0.2);

  // Root lines draw outward from bottom centre
  tl.to('.root-path', {
    drawSVG: '0% 100%',
    duration: 2.2,
    stagger: { each: 0.08, from: 'center' },
    ease: 'power1.inOut'
  }, 0.3);

  // Header slides down
  tl.to('#header-wrap', {
    y: 0, opacity: 1, duration: 0.9, ease: 'back.out(1.3)'
  }, 0.6);

  // Divider lines draw from centre
  tl.to(['#div-left', '#div-right'], {
    drawSVG: '0% 100%',
    duration: 0.7,
    ease: 'power2.out',
    stagger: 0
  }, 0.9);
  tl.to(['#div-gold-left', '#div-gold-right'], {
    drawSVG: '0% 100%',
    duration: 0.6,
    ease: 'power2.out'
  }, 1.1);

  // Sub-header slides down
  tl.to('#sub-header', {
    y: 0, opacity: 1, duration: 0.7, ease: 'power3.out'
  }, 1.0);

  // Half-price banner
  tl.to('#half-price-banner', {
    opacity: 1, duration: 0.6, ease: 'power2.out'
  }, 1.3);

  // Bottom bar slides up
  tl.to('#ui-layer', {
    y: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.2)'
  }, 0.9);

  return tl;
}

// ── Product Data Loader ───────────────────────────────────────
async function loadProducts() {
  try {
    const res  = await fetch('./products.json', { cache: 'no-store' });
    const data = await res.json();
    PRODUCTS = (data.products || []).map(p => ({
      ...p,
      // Normalise prices to strings with $ sign
      price: typeof p.price === 'number'
        ? `$${p.price.toFixed(2)}`
        : (String(p.price).startsWith('$') ? p.price : `$${parseFloat(p.price).toFixed(2)}`),
      discounted_price: typeof p.discounted_price === 'number'
        ? `$${p.discounted_price.toFixed(2)}`
        : (String(p.discounted_price).startsWith('$')
            ? p.discounted_price
            : `$${parseFloat(p.discounted_price).toFixed(2)}`)
    }));
  } catch (err) {
    console.error('[QR Template] Could not load products.json:', err);
    PRODUCTS = [];
  }
  startTemplate();
}

// ── Bootstrap ─────────────────────────────────────────────────
function startTemplate() {
  // Kick particles
  initParticles();

  // Intro → then start first cycle
  introAnimation(() => {
    animateCycle(0);
  });
}

window.addEventListener('DOMContentLoaded', loadProducts);
