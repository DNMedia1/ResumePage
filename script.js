/* ==============================================
   script.js – clean, performant, professional
   ============================================== */

(function () {
  /* ---------- 1. Reduced motion detection ---------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    console.warn('[Performance] Prefers-reduced-motion enabled → disabling heavy animations');
  }

  /* ---------- 1b. ScrollTrigger einmalig global registrieren ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* ---------- 2. Utility helpers ---------- */
  const $qs  = (s) => document.querySelector(s);
  const $qsa = (s) => document.querySelectorAll(s);
  const debounce = (fn, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  /* ---------- 3. Hero canvas particle system ----------
     FIX B2: init inside DOMContentLoaded + rAF so getBoundingClientRect
             has real layout dimensions (never returns 0×0).
     FIX canvas-resize: W/H are kept in closure and updated on resize.    */
  const initCanvas = () => {
    if (prefersReduced) return;
    const particleCanvas = $qs('#hero-canvas');
    if (!particleCanvas) return;

    requestAnimationFrame(() => {
      const ctx = particleCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const rect = particleCanvas.getBoundingClientRect();
      let W = rect.width;
      let H = rect.height;
      particleCanvas.width  = W * dpr;
      particleCanvas.height = H * dpr;
      ctx.scale(dpr, dpr);

      const NUM_PARTICLES = 30;
      const particles = [];
      for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push({
          x:       Math.random() * W,
          y:       Math.random() * H,
          size:    Math.random() * 1.5 + 0.5,
          speedX:  (Math.random() - 0.5),
          speedY:  (Math.random() - 0.5),
          opacity: Math.random() * 0.4 + 0.1,
        });
      }

      let animActive = true;

      const draw = () => {
        ctx.clearRect(0, 0, W, H);
        particles.forEach(p => {
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.x < 0 || p.x > W) p.speedX *= -1;
          if (p.y < 0 || p.y > H) p.speedY *= -1;
          ctx.fillStyle = `rgba(56, 189, 248, ${p.opacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
        if (animActive) requestAnimationFrame(draw);
      };

      const heroEl = $qs('.hero');
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !animActive) {
          animActive = true;
          requestAnimationFrame(draw);
        } else if (!entry.isIntersecting) {
          animActive = false;
        }
      }, { threshold: 0 }).observe(heroEl || particleCanvas);

      requestAnimationFrame(draw);

      // Resize: keep W/H in sync so particles bounce at correct edges
      window.addEventListener('resize', debounce(() => {
        const r = particleCanvas.getBoundingClientRect();
        W = r.width;
        H = r.height;
        particleCanvas.width  = W * dpr;
        particleCanvas.height = H * dpr;
        ctx.scale(dpr, dpr);
      }, 200));
    });
  };

  /* ---------- 4. Hero animation
     FIX B8: guard against missing GSAP (CDN failure)              ---------- */
  const initHeroAnimation = () => {
    if (prefersReduced || !window.gsap) return;

    const heroContent = $qs('.hero-content');
    if (!heroContent) return;

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
    tl.from('.hero-content .hero-kicker',  { opacity: 0, y: 12, duration: 0.35 })
      .from('.hero-content h1',            { opacity: 0, y:  8, duration: 0.45 }, '-=0.2')
      .from('.hero-content p',             { opacity: 0, y:  6, duration: 0.45 }, '-=0.25')
      .from('.hero-content .hero-actions', { opacity: 0, y: 10, duration: 0.4, stagger: 0.1 }, '-=0.2')
      .from('.identity-card',              { opacity: 0, scale: 0.98, duration: 0.35 }, '-=0.3');

    tl.play();
  };

  /* ---------- 5. Section reveals
     FIX B4: removed orphaned '.section-reveal' selector (class doesn't
             exist in index.html — only in reference-design.html).
     FIX B8: guard against missing GSAP.                           ---------- */
  const initSectionReveals = () => {
    if (prefersReduced || !window.gsap) return;

    gsap.utils.toArray(
      '.about-section, .tech-section, .projects-section, .experience-section, .workflow-section, .contact-section'
    ).forEach(section => {
      gsap.from(section, {
        opacity: 0,
        y: 24,
        duration: 0.65,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });
  };

  /* ---------- 6. Staggered card reveals
     FIX B7: delay capped at 300 ms — last card was delayed 1 s+.
     FIX B8: guard against missing GSAP.                           ---------- */
  const initCardReveals = () => {
    if (prefersReduced || !window.gsap) return;

    const cards = $qsa('.project-card, .tech-category, .timeline-item, .workflow-item');
    cards.forEach((card, index) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: Math.min(index * 0.05, 0.3), // cap at 300 ms
          ease: 'power2.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
        }
      );
    });
  };

  /* ---------- 7. Navigation scroll effect
     FIX B3: removed dead variable 'ticking' (declared, never used).
     Matching CSS rule '.topbar.scrolled' added in styles.css (B1).  ---------- */
  const initNavState = () => {
    if (prefersReduced) return;
    window.addEventListener('scroll', debounce(() => {
      requestAnimationFrame(() => {
        const nav = $qs('.topbar');
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
      });
    }, 16));
  };

  /* ---------- 8. Image fallback
     FIX B6: replace the entire .portrait-wrap instead of inserting
             the fallback div *inside* it (which caused ::after overlay
             and unwanted margin stacking).                         ---------- */
  const initImageFallback = () => {
    $qsa('img').forEach(img => {
      img.addEventListener('error', () => {
        img.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'portrait-fallback';
        fallback.textContent = 'DN';
        const wrap = img.closest('.portrait-wrap');
        if (wrap) {
          wrap.parentNode.replaceChild(fallback, wrap);
        } else {
          img.parentNode.insertBefore(fallback, img);
        }
      });
    });
  };

  /* ---------- 9. Kapitel-Navigation ----------
     Jeder deutliche Wheel-/Pfeiltasten-Impuls springt auf Desktop ein Kapitel weiter.
     Auf Mobile bleibt normales Lesen/Scrollen erhalten, weil die Karten dort
     bewusst untereinander stehen. */
  const initTourNavigation = () => {
    const sections = Array.from($qsa(
      '.hero, .about-section, .tech-section, .projects-section, .experience-section, .workflow-section, .contact-section'
    ));
    if (!sections.length) return;

    const navLinks = new Map([['top', $qs('.brand')]]);
    const navItems = Array.from($qsa('.brand, .navlinks a[href^="#"]'));
    $qsa('.navlinks a[href^="#"]').forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      if (id) navLinks.set(id, a);
    });

    let activeIndex = 0;
    let isChapterScrolling = false;
    let touchStartY = 0;
    const chapterWheelEnabled = () => window.matchMedia('(width > 900px)').matches;

    const sectionId = (section, index) => index === 0 ? 'top' : section.id;

    const activeSectionIndex = () => {
      const viewportAnchor = window.scrollY + window.innerHeight * 0.42;
      return sections.reduce((current, section, index) => {
        return section.offsetTop <= viewportAnchor ? index : current;
      }, 0);
    };

    const setActive = (index) => {
      activeIndex = Math.max(0, Math.min(index, sections.length - 1));
      sections.forEach((section, sectionIndex) => {
        section.classList.toggle('chapter-active', sectionIndex === activeIndex);
        section.classList.toggle('chapter-before', sectionIndex < activeIndex);
      });

      navLinks.forEach((a) => a?.classList.remove('active'));
      const activeLink = navLinks.get(sectionId(sections[activeIndex], activeIndex));
      activeLink?.classList.add('active');
    };

    const scrollToChapter = (index) => {
      const nextIndex = Math.max(0, Math.min(index, sections.length - 1));
      const nextSection = sections[nextIndex];
      if (!nextSection) return;

      setActive(nextIndex);
      const stickyOffset = nextIndex === 0 ? 0 : (($qs('.topbar')?.offsetHeight || 72) + 22);
      window.scrollTo({
        top: Math.max(0, nextSection.offsetTop - stickyOffset),
        behavior: prefersReduced ? 'auto' : 'smooth',
      });
    };

    const startChapterScroll = (index) => {
      if (isChapterScrolling) return;
      isChapterScrolling = true;
      scrollToChapter(index);
      window.setTimeout(() => {
        isChapterScrolling = false;
        setActive(activeSectionIndex());
      }, prefersReduced ? 120 : 720);
    };

    navItems.forEach((item) => {
      item.addEventListener('click', (event) => {
        const href = item.getAttribute('href');
        if (!href?.startsWith('#')) return;

        const target = href === '#top' ? sections[0] : $qs(href);
        const targetIndex = sections.indexOf(target);
        if (targetIndex < 0) return;

        event.preventDefault();
        window.history.pushState(null, '', href);
        scrollToChapter(targetIndex);
      });
    });

    document.addEventListener('keydown', (event) => {
      const activeElement = document.activeElement;
      const isTyping = activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName);
      if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'ArrowDown' || event.key === 'PageDown') {
        event.preventDefault();
        startChapterScroll(activeSectionIndex() + 1);
      }

      if (event.key === 'ArrowUp' || event.key === 'PageUp') {
        event.preventDefault();
        startChapterScroll(activeSectionIndex() - 1);
      }
    });

    const handleWheel = (event) => {
      if (!chapterWheelEnabled()) return;
      if (event.target.closest?.('.navlinks') || Math.abs(event.deltaY) < 16) return;
      event.preventDefault();
      startChapterScroll(activeSectionIndex() + (event.deltaY > 0 ? 1 : -1));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    window.addEventListener('touchstart', (event) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    }, { passive: true });

    window.addEventListener('touchend', (event) => {
      const touchEndY = event.changedTouches[0]?.clientY ?? touchStartY;
      const deltaY = touchStartY - touchEndY;
      if (!chapterWheelEnabled()) return;
      if (Math.abs(deltaY) < 52) return;
      startChapterScroll(activeSectionIndex() + (deltaY > 0 ? 1 : -1));
    }, { passive: true });

    let activeTicking = false;
    window.addEventListener('scroll', () => {
      if (isChapterScrolling || activeTicking) return;
      activeTicking = true;
      requestAnimationFrame(() => {
        setActive(activeSectionIndex());
        activeTicking = false;
      });
    }, { passive: true });

    const alignCurrentHash = () => {
      if (!window.location.hash) return false;
      const hashTarget = window.location.hash === '#top' ? sections[0] : $qs(window.location.hash);
      const hashIndex = sections.indexOf(hashTarget);
      if (hashIndex < 0) return false;

      scrollToChapter(hashIndex);
      return true;
    };

    if (alignCurrentHash()) {
      requestAnimationFrame(alignCurrentHash);
      window.setTimeout(alignCurrentHash, 260);
    } else {
      setActive(activeSectionIndex());
    }

    window.addEventListener('load', () => window.setTimeout(alignCurrentHash, 0));
    window.addEventListener('hashchange', () => window.setTimeout(alignCurrentHash, 0));
  };

  /* ---------- 10. Init ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    initCanvas();           // B2: moved here so layout is ready
    initHeroAnimation();
    initSectionReveals();
    initCardReveals();
    initNavState();
    initImageFallback();
    initTourNavigation();
  });
})();
