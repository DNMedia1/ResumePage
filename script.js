import * as THREE from "https://unpkg.com/three@0.164.1/build/three.module.js";

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Subtle 3D scroll transitions for the static portfolio page.
// The hero section is intentionally excluded so the first viewport stays stable.
const canUseGsap =
  window.gsap &&
  window.ScrollTrigger &&
  !prefersReducedMotion;

if (canUseGsap) {
  const gsapLib = window.gsap;
  gsapLib.registerPlugin(window.ScrollTrigger);

  gsapLib.utils.toArray(
    '.about-section, .tech-section, .projects-section, .experience-section, .workflow-section, .contact-section'
  ).forEach((section) => {
    gsapLib.fromTo(
      section,
      {
        opacity: 0,
        y: 72,
        rotateX: 6,
        scale: 0.97,
        transformOrigin: 'center top'
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 88%',
          end: 'top 45%',
          scrub: 0.6
        }
      }
    );
  });
}


// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Hero canvas - cinematic particle effect (replacing the heavy Three.js)
const canvas = document.querySelector('#hero-canvas');
if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.z = 8;

  const group = new THREE.Group();
  scene.add(group);

  // Subtle glowing sphere
  const geometry = new THREE.IcosahedronGeometry(2.2, 1);
  const material = new THREE.MeshStandardMaterial({
    color: 0x3f86ff,
    roughness: 0.4,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
  });
  const core = new THREE.Mesh(geometry, material);
  group.add(core);

  // Thin wireframe
  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.3, 1),
    new THREE.MeshBasicMaterial({ color: 0x5df3ff, wireframe: true, transparent: true, opacity: 0.18 })
  );
  group.add(wire);

  // Particle system
  const count = 30; // further reduced for performance
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = 3 + Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * Math.PI;
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({ color: 0x9befff, size: 0.02, transparent: true, opacity: 0.6 })
  );
  group.add(particles);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const key = new THREE.DirectionalLight(0x9befff, 1.8);
  key.position.set(4, 4, 5);
  scene.add(key);

  let pointerX = 0;
  let pointerY = 0;
  window.addEventListener('pointermove', (e) => {
    pointerX = (e.clientX / window.innerWidth - 0.5) * 0.3;
    pointerY = (e.clientY / window.innerHeight - 0.5) * 0.2;
  });

  let canvasWidth = 0;
  let canvasHeight = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    if (nextWidth === canvasWidth && nextHeight === canvasHeight) {
      return;
    }

    canvasWidth = nextWidth;
    canvasHeight = nextHeight;
    renderer.setSize(canvasWidth, canvasHeight, false);
    camera.aspect = canvasWidth / canvasHeight;
    camera.updateProjectionMatrix();
  }

  function animate(time) {
    const t = time * 0.001;
    group.rotation.y = t * 0.12 + pointerX;
    group.rotation.x = -0.15 + Math.sin(t * 0.4) * 0.05 + pointerY;
    core.rotation.y = t * 0.15;
    wire.rotation.y = -t * 0.15;
    particles.rotation.y = t * 0.03;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  renderer.render(scene, camera);
  window.addEventListener('resize', () => {
    resize();
    renderer.render(scene, camera);
  }, { passive: true });

  if (!prefersReducedMotion) {
    animate(0);
  }
}

// Scroll reveal animations – optimized with visibility check
if (canUseGsap) {
  const cardSelectors = '.tech-category, .project-card, .timeline-item, .workflow-item';
  const cards = window.gsap.utils.toArray(cardSelectors);
  cards.forEach((card) => {
    window.gsap.from(card, {
      opacity: 0,
      y: 48,
      rotateX: 0,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 90%',
        duration: 0.6,
        once: true
      }
    });
  });
}

let isHidden = false;
document.addEventListener('visibilitychange', () => {
  isHidden = document.hidden;
  if (isHidden && !prefersReducedMotion) {
    cancelAnimationFrame(animate_id);
  } else if (!isHidden && !prefersReducedMotion) {
    animate_id = requestAnimationFrame(animate);
  }
});

// Enhanced button interactions
document.querySelectorAll('.button').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'translateY(-2px)';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translateY(0)';
  });
});

// Parallax effect on hero
let scrollY = 0;
if (!prefersReducedMotion) {
  let ticking = false;
  window.addEventListener('scroll', () => {
    scrollY = window.scrollY;
    if (ticking) {
      return;
    }

    ticking = true;
    requestAnimationFrame(() => {
      const heroCopy = document.querySelector('.hero-copy');
      if (heroCopy) {
        heroCopy.style.transform = `translateY(${scrollY * 0.12}px)`;
        heroCopy.style.opacity = Math.max(0.45, 1 - scrollY * 0.001);
      }
      ticking = false;
    });
  }, { passive: true });
}

// Staggered reveal for timeline items
const timelineItems = document.querySelectorAll('.timeline-item');
timelineItems.forEach((item, index) => {
  item.style.transitionDelay = `${index * 100}ms`;
});

// Tech category stagger
const techCategories = document.querySelectorAll('.tech-category');
techCategories.forEach((cat, index) => {
  cat.style.transitionDelay = `${index * 80}ms`;
});

// Project cards stagger
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach((card, index) => {
  card.style.transitionDelay = `${index * 100}ms`;
});

// Hero 3D animations
const canUseHeroGsap =
  window.gsap &&
  window.ScrollTrigger &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canUseHeroGsap) {
  const gsapLib = window.gsap;
  gsapLib.registerPlugin(window.ScrollTrigger);

  const hero = document.querySelector('.hero');
  const heroCopy = document.querySelector('.hero-copy');
  const identityCard = document.querySelector('.identity-card');
  const tags = document.querySelectorAll('.tag-strip span');

  if (hero && heroCopy && identityCard) {
    const heroIntro = gsapLib.timeline({
      defaults: {
        ease: 'power3.out',
        duration: 1
      }
    });

    heroIntro
      .from(heroCopy, {
        opacity: 0,
        y: 44,
        scale: 0.98
      })
      .from(identityCard, {
        opacity: 0,
        y: 48,
        rotateX: 8,
        rotateY: -6,
        scale: 0.96,
        transformOrigin: 'center center'
      }, '-=0.65')
      .from(tags, {
        opacity: 0,
        y: 12,
        scale: 0.94,
        stagger: 0.045,
        duration: 0.5
      }, '-=0.45');

    gsapLib.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.8
      }
    })
      .to(heroCopy, {
        y: -56,
        opacity: 0.72,
        ease: 'none'
      }, 0)
      .to(identityCard, {
        y: 36,
        rotateX: -4,
        scale: 0.94,
        opacity: 0.78,
        ease: 'none'
      }, 0);
  }
}
