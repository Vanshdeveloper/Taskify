/**
 * TASKIFY HIGH-END PRODUCT LANDING PAGE SCRIPT (gpt-taste)
 * Motion Architecture: GSAP 3.12 + ScrollTrigger Engine
 * Dynamic Scroll Physics, Mobile Parallax & Plain-English Micro-Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure GSAP and ScrollTrigger are loaded
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('GSAP or ScrollTrigger not loaded from CDN. Interactive animations disabled.');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // -------------------------------------------------------------------------
  // 1. TOP SCROLL PROGRESS BAR
  // -------------------------------------------------------------------------
  const progressBar = document.getElementById('scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    }, { passive: true });
  }

  // -------------------------------------------------------------------------
  // 2. HERO ENTRANCE & 3D PARALLAX TILT
  // -------------------------------------------------------------------------
  const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  heroTl
    .fromTo(
      '.hero-headline',
      { y: 35, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.0, delay: 0.1 }
    )
    .fromTo(
      '.hero-subtext',
      { y: 25, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 },
      '-=0.6'
    )
    .fromTo(
      '.hero-cta-group',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7 },
      '-=0.5'
    )
    .fromTo(
      '.hero-frame-wrapper',
      { scale: 0.94, opacity: 0, y: 40 },
      { scale: 1, opacity: 1, y: 0, duration: 1.1 },
      '-=0.6'
    )
    .fromTo(
      '.app-task-item',
      { x: -15, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.12, duration: 0.6 },
      '-=0.7'
    );

  // Hero 3D Parallax Tilt on Scroll
  const heroFrame = document.querySelector('.hero-frame-outer');
  if (heroFrame) {
    gsap.to(heroFrame, {
      y: 40,
      rotationX: 6,
      scale: 0.97,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
    });
  }

  // -------------------------------------------------------------------------
  // 3. WORD-BY-WORD SCRUBBING REVEAL (Our Promise Section)
  // -------------------------------------------------------------------------
  const manifestoContainer = document.getElementById('manifesto-text');

  if (manifestoContainer) {
    const rawText = manifestoContainer.innerText.trim();
    const words = rawText.split(/\s+/);

    manifestoContainer.innerHTML = words
      .map((word) => `<span class="scrub-word">${word}</span>`)
      .join(' ');

    const scrubWords = manifestoContainer.querySelectorAll('.scrub-word');

    gsap.fromTo(
      scrubWords,
      { opacity: 0.15 },
      {
        opacity: 1,
        stagger: 0.05,
        ease: 'none',
        scrollTrigger: {
          trigger: '.manifesto-section',
          start: 'top 75%',
          end: 'bottom 45%',
          scrub: 0.8,
        },
      }
    );
  }

  // -------------------------------------------------------------------------
  // 4. GAPLESS BENTO GRID STAGGERED ZOOM & FADE-UP
  // -------------------------------------------------------------------------
  const bentoCards = gsap.utils.toArray('.bento-card');

  if (bentoCards.length > 0) {
    gsap.fromTo(
      bentoCards,
      { opacity: 0, y: 50, scale: 0.94 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.85,
        stagger: 0.14,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.bento-grid',
          start: 'top 82%',
          end: 'bottom 60%',
          toggleActions: 'play none none reverse',
        },
      }
    );
  }

  // -------------------------------------------------------------------------
  // 5. OPERATIONAL PILLARS STAGGERED SLIDE-IN
  // -------------------------------------------------------------------------
  const pillarCards = document.querySelectorAll('.pillar-card');

  if (pillarCards.length > 0) {
    gsap.fromTo(
      pillarCards,
      { opacity: 0, x: 30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.pillars-cards-col',
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    pillarCards.forEach((card) => {
      card.addEventListener('click', () => {
        const isAlreadyActive = card.classList.contains('active');
        pillarCards.forEach((c) => c.classList.remove('active'));
        if (!isAlreadyActive) {
          card.classList.add('active');
        }

        // Refresh ScrollTrigger calculations after accordion DOM dimension changes
        ScrollTrigger.refresh();
      });
    });
  }

  // -------------------------------------------------------------------------
  // 6. HERO INTERACTIVE CHECKLIST TOGGLE
  // -------------------------------------------------------------------------
  const taskItems = document.querySelectorAll('.app-task-item');
  taskItems.forEach((item) => {
    item.addEventListener('click', () => {
      item.classList.toggle('completed');
      const circle = item.querySelector('.task-check-circle');
      if (circle) {
        if (item.classList.contains('completed')) {
          circle.classList.add('checked');
          circle.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        } else {
          circle.classList.remove('checked');
          circle.innerHTML = '';
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // 7. FOOTER AMBIENT GLOW EXPANSION
  // -------------------------------------------------------------------------
  const footerSection = document.querySelector('.footer-section');
  if (footerSection) {
    gsap.fromTo(
      footerSection,
      { backgroundPosition: '50% 100%' },
      {
        boxShadow: 'inset 0 100px 100px -50px rgba(242, 106, 54, 0.08)',
        ease: 'none',
        scrollTrigger: {
          trigger: footerSection,
          start: 'top 85%',
          end: 'bottom bottom',
          scrub: 0.8,
        },
      }
    );
  }

  // -------------------------------------------------------------------------
  // 8. WINDOW RESIZE RECALCULATION & MOBILE VIEWPORT ADAPTATION
  // -------------------------------------------------------------------------
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);
  });
});
