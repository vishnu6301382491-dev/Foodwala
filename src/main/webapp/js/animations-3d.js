/**
 * FoodWala — 3D Parallax, Dynamic Glare & Interactive Tilt Engine
 * Hardware-accelerated 60fps 3D transforms with requestAnimationFrame throttling,
 * multi-layer hero parallax, dynamic glare calculation, and 3D confetti celebration.
 */
(function (window) {
  'use strict';

  // Check if reduced motion is preferred
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Initialize 3D Card Tilt on elements
   * @param {Element|Document} root 
   */
  function init3DCardTilt(root) {
    if (prefersReducedMotion) return;
    const scope = root || document;
    const tiltSelectors = [
      '.fw-3d-card',
      '.fw-3d-tilt-card',
      '.js-3d-tilt',
      '.category-card-3d',
      '.fw-feature-3d-card',
      '.fw-3d-restaurant-card',
      '.fw-3d-menu-card',
      '.fw-3d-deal-card',
      '.hero-image-3d-wrapper',
      '.rider-card'
    ].join(', ');

    const cards = scope.querySelectorAll(tiltSelectors);

    cards.forEach(card => {
      if (card._fw3dInitialized) return;
      card._fw3dInitialized = true;

      // Ensure glare overlay exists if card is a 3D restaurant, feature, or tilt card
      if (!card.querySelector('.fw-card-glare') && !card.classList.contains('rider-card')) {
        const glare = document.createElement('div');
        glare.className = 'fw-card-glare';
        glare.setAttribute('aria-hidden', 'true');
        card.appendChild(glare);
      }

      let bounds = null;
      let rafId = null;

      function updateBounds() {
        bounds = card.getBoundingClientRect();
      }

      card.addEventListener('mouseenter', () => {
        updateBounds();
      }, { passive: true });

      card.addEventListener('mousemove', (e) => {
        if (!bounds) updateBounds();
        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const mouseX = e.clientX - bounds.left;
          const mouseY = e.clientY - bounds.top;

          // Normalized coordinates: -0.5 to 0.5
          const xPct = (mouseX / bounds.width) - 0.5;
          const yPct = (mouseY / bounds.height) - 0.5;

          // Glare coordinates: 0% to 100%
          const glareX = ((xPct + 0.5) * 100).toFixed(1);
          const glareY = ((yPct + 0.5) * 100).toFixed(1);
          card.style.setProperty('--mouse-x', `${glareX}%`);
          card.style.setProperty('--mouse-y', `${glareY}%`);

          // Maximum tilt angles depending on element type
          let maxTiltX = 10;
          let maxTiltY = 12;
          let zElevate = 8;
          let scale = 1.02;

          if (card.classList.contains('category-card-3d')) {
            maxTiltX = 12;
            maxTiltY = 14;
            zElevate = 12;
            scale = 1.04;
          } else if (card.classList.contains('fw-feature-3d-card')) {
            maxTiltX = 8;
            maxTiltY = 10;
            zElevate = 14;
            scale = 1.03;
          } else if (card.classList.contains('fw-3d-menu-card')) {
            maxTiltX = 7;
            maxTiltY = 9;
            zElevate = 6;
            scale = 1.015;
          }

          const tiltX = -(yPct * maxTiltX * 2).toFixed(2);
          const tiltY = (xPct * maxTiltY * 2).toFixed(2);

          card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(${zElevate}px) scale3d(${scale}, ${scale}, ${scale})`;
        });
      }, { passive: true });

      card.addEventListener('mouseleave', () => {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';
      }, { passive: true });
    });
  }

  /**
   * Hero Section Multi-Layer 3D Mouse Parallax
   */
  function initHeroParallax() {
    if (prefersReducedMotion) return;
    const heroSection = document.querySelector('.hero-section-3d');
    if (!heroSection) return;

    const heroWrapper = heroSection.querySelector('.hero-image-3d-wrapper');
    const badge1 = heroSection.querySelector('.hero-badge-1');
    const badge2 = heroSection.querySelector('.hero-badge-2');
    const badge3 = heroSection.querySelector('.hero-badge-3');
    const chipPizza = heroSection.querySelector('.hero-chip-pizza');
    const chipBurger = heroSection.querySelector('.hero-chip-burger');

    let heroBounds = null;
    let ticking = false;

    function updateHeroBounds() {
      heroBounds = heroSection.getBoundingClientRect();
    }

    heroSection.addEventListener('mouseenter', updateHeroBounds, { passive: true });
    window.addEventListener('resize', updateHeroBounds, { passive: true });

    heroSection.addEventListener('mousemove', (e) => {
      if (!heroBounds) updateHeroBounds();
      if (!ticking) {
        requestAnimationFrame(() => {
          const mouseX = (e.clientX - heroBounds.left) / heroBounds.width - 0.5;
          const mouseY = (e.clientY - heroBounds.top) / heroBounds.height - 0.5;

          if (heroWrapper) {
            heroWrapper.style.transform = `rotateY(${mouseX * 18}deg) rotateX(${-mouseY * 14}deg) scale(1.025)`;
          }

          if (badge1) {
            badge1.style.transform = `translate3d(${mouseX * 25}px, ${mouseY * 20}px, 60px)`;
          }
          if (badge2) {
            badge2.style.transform = `translate3d(${-mouseX * 28}px, ${-mouseY * 22}px, 70px)`;
          }
          if (badge3) {
            badge3.style.transform = `translate3d(${mouseX * 18}px, ${-mouseY * 26}px, 55px)`;
          }
          if (chipPizza) {
            chipPizza.style.transform = `translate3d(${-mouseX * 32}px, ${mouseY * 32}px, 75px)`;
          }
          if (chipBurger) {
            chipBurger.style.transform = `translate3d(${mouseX * 35}px, ${-mouseY * 28}px, 80px)`;
          }

          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    heroSection.addEventListener('mouseleave', () => {
      if (heroWrapper) heroWrapper.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
      if (badge1) badge1.style.transform = '';
      if (badge2) badge2.style.transform = '';
      if (badge3) badge3.style.transform = '';
      if (chipPizza) chipPizza.style.transform = '';
      if (chipBurger) chipBurger.style.transform = '';
    }, { passive: true });
  }

  /**
   * Ambient Floating Food Parallax (Login, Register & Ambient Pages)
   */
  function initAmbientFoodParallax() {
    if (prefersReducedMotion) return;
    const floatingItems = document.querySelectorAll('.fw-3d-floating-food');
    if (floatingItems.length === 0) return;

    let ticking = false;
    window.addEventListener('mousemove', (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const xOffset = (e.clientX / window.innerWidth - 0.5) * 28;
          const yOffset = (e.clientY / window.innerHeight - 0.5) * 28;

          floatingItems.forEach((item, idx) => {
            const depthFactor = (idx % 2 === 0) ? 1.25 : -0.85;
            item.style.transform = `translate3d(${xOffset * depthFactor}px, ${yOffset * depthFactor}px, 45px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * 3D Confetti Celebration Engine
   * @param {Object} opts
   */
  function trigger3DConfetti(opts) {
    if (prefersReducedMotion) return;
    const options = opts || {};
    const count = options.count || 75;
    const durationMs = options.duration || 4500;

    let stage = document.querySelector('.fw-3d-confetti-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'fw-3d-confetti-stage';
      stage.setAttribute('aria-hidden', 'true');
      document.body.appendChild(stage);
    }

    const colors = [
      '#ef4444', // Red
      '#f59e0b', // Amber
      '#f97316', // Orange
      '#10b981', // Emerald
      '#8b5cf6', // Violet
      '#3b82f6', // Blue
      '#ec4899', // Pink
      '#ffffff'  // White
    ];

    const shapes = ['rect', 'circle', 'pill'];

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'fw-3d-confetti-piece';

      const color = colors[Math.floor(Math.random() * colors.length)];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const xStart = Math.random() * 100;
      const xDrift = (Math.random() - 0.5) * 35;
      const xEnd = Math.max(0, Math.min(100, xStart + xDrift));
      const zDepth = Math.floor(Math.random() * 200 - 100);
      const rotX = Math.floor(Math.random() * 1080 + 360);
      const rotY = Math.floor(Math.random() * 1080 + 360);
      const rotZ = Math.floor(Math.random() * 720 - 360);
      const fallDuration = (Math.random() * 1.8 + 2.2).toFixed(2);
      const delay = (Math.random() * 0.8).toFixed(2);

      piece.style.backgroundColor = color;
      piece.style.setProperty('--x-start', `${xStart}vw`);
      piece.style.setProperty('--x-end', `${xEnd}vw`);
      piece.style.setProperty('--z-depth', `${zDepth}px`);
      piece.style.setProperty('--rot-x', `${rotX}deg`);
      piece.style.setProperty('--rot-y', `${rotY}deg`);
      piece.style.setProperty('--rot-z', `${rotZ}deg`);
      piece.style.animationDuration = `${fallDuration}s`;
      piece.style.animationDelay = `${delay}s`;

      if (shape === 'circle') {
        piece.style.borderRadius = '50%';
        piece.style.width = '10px';
        piece.style.height = '10px';
      } else if (shape === 'pill') {
        piece.style.borderRadius = '10px';
        piece.style.width = '8px';
        piece.style.height = '18px';
      } else {
        piece.style.borderRadius = '2px';
        piece.style.width = '12px';
        piece.style.height = '14px';
      }

      stage.appendChild(piece);
    }

    setTimeout(() => {
      if (stage && stage.parentNode) {
        stage.innerHTML = '';
      }
    }, durationMs + 1000);
  }

  /**
   * Observe dynamically added cards and attach 3D tilt
   */
  function observeDynamicCards() {
    if (typeof MutationObserver === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      let needsInit = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          needsInit = true;
        }
      });
      if (needsInit) {
        init3DCardTilt(document);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Master Initializer
  function initAll() {
    init3DCardTilt(document);
    initHeroParallax();
    initAmbientFoodParallax();
    observeDynamicCards();
  }

  // Listen for global order delivery event
  window.addEventListener('foodwala:orderDelivered', () => {
    trigger3DConfetti({ count: 90 });
  });

  // Expose global methods
  window.FoodWala3D = {
    init: initAll,
    initCards: init3DCardTilt,
    triggerConfetti: trigger3DConfetti
  };
  window.trigger3DConfetti = trigger3DConfetti;
  window.init3DCardTilt = init3DCardTilt;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

})(typeof window !== 'undefined' ? window : this);
