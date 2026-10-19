/**
 * FoodWala — 3D Parallax & Interactive Tilt Engine
 * Enables smooth 60fps 3D mouse tracking, tilt reflection, and floating elements
 */
(function (window) {
  'use strict';

  function init3DAnimations() {
    // 1. Interactive 3D Card Tilt on elements with .fw-3d-card or .js-3d-tilt
    const tiltCards = document.querySelectorAll('.fw-3d-card, .js-3d-tilt');

    tiltCards.forEach(card => {
      let bounds = null;

      function updateBounds() {
        bounds = card.getBoundingClientRect();
      }

      window.addEventListener('resize', updateBounds, { passive: true });
      window.addEventListener('scroll', updateBounds, { passive: true });

      card.addEventListener('mouseenter', () => {
        updateBounds();
      });

      card.addEventListener('mousemove', (e) => {
        if (!bounds) updateBounds();
        const mouseX = e.clientX - bounds.left;
        const mouseY = e.clientY - bounds.top;

        const xPct = (mouseX / bounds.width) - 0.5; // -0.5 to 0.5
        const yPct = (mouseY / bounds.height) - 0.5;

        // Max tilt angles (+/- 7deg)
        const tiltX = -(yPct * 12).toFixed(2);
        const tiltY = (xPct * 14).toFixed(2);

        card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.015, 1.015, 1.015)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
      });
    });

    // 2. Parallax on ambient floating food particles
    const floatingItems = document.querySelectorAll('.fw-3d-floating-food');
    if (floatingItems.length > 0) {
      let ticking = false;
      window.addEventListener('mousemove', (e) => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const xOffset = (e.clientX / window.innerWidth - 0.5) * 25;
            const yOffset = (e.clientY / window.innerHeight - 0.5) * 25;

            floatingItems.forEach((item, idx) => {
              const depthFactor = (idx % 2 === 0) ? 1.2 : -0.8;
              item.style.transform = `translate3d(${xOffset * depthFactor}px, ${yOffset * depthFactor}px, 40px)`;
            });
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    // 3. Hero image 3D tilt
    const heroWrapper = document.querySelector('.hero-image-3d-wrapper');
    if (heroWrapper) {
      heroWrapper.addEventListener('mousemove', (e) => {
        const rect = heroWrapper.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        heroWrapper.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 14}deg) scale(1.03)`;
      });

      heroWrapper.addEventListener('mouseleave', () => {
        heroWrapper.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
      });
    }
  }

  // Auto-init on DOMContentLoaded or immediate if already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DAnimations);
  } else {
    init3DAnimations();
  }

})(typeof window !== 'undefined' ? window : this);
