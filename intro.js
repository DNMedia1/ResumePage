/* ==============================================
   intro.js – Three.js 3D particle "DN" intro
   ============================================== */

(function () {
  'use strict';

  /* ---------- Guards ---------- */
  var overlay = document.getElementById('intro-overlay');
  if (!overlay) return;
  if (typeof THREE === 'undefined') { overlay.remove(); return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { overlay.remove(); return; }
  if (sessionStorage.getItem('intro-played')) { overlay.remove(); return; }

  /* ---------- Config ---------- */
  var isMobile = window.innerWidth < 640;
  var SCALE    = isMobile ? 0.006 : 0.008;
  var STEP     = isMobile ? 5 : 3;
  var CAM_Z    = isMobile ? 5 : 6;

  /* ---------- Sample "DN" text into pixel positions ---------- */
  var sampleCanvas = document.createElement('canvas');
  var SIZE = 512;
  sampleCanvas.width = SIZE;
  sampleCanvas.height = SIZE;
  var sCtx = sampleCanvas.getContext('2d');
  sCtx.fillStyle = '#fff';
  sCtx.font = 'bold ' + Math.round(SIZE * 0.55) + 'px Inter, system-ui, sans-serif';
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.fillText('DN', SIZE / 2, SIZE / 2);

  var imageData = sCtx.getImageData(0, 0, SIZE, SIZE).data;
  var textPositions = [];
  for (var y = 0; y < SIZE; y += STEP) {
    for (var x = 0; x < SIZE; x += STEP) {
      if (imageData[(y * SIZE + x) * 4 + 3] > 128) {
        textPositions.push({
          x: (x - SIZE / 2) * SCALE,
          y: (SIZE / 2 - y) * SCALE,
          z: 0
        });
      }
    }
  }

  var NUM = textPositions.length;

  /* ---------- Three.js setup ---------- */
  var canvas   = document.getElementById('intro-canvas');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = CAM_Z;

  /* ---------- Particle texture (soft circle) ---------- */
  var texCanvas = document.createElement('canvas');
  texCanvas.width = 32;
  texCanvas.height = 32;
  var tCtx = texCanvas.getContext('2d');
  var grad = tCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  tCtx.fillStyle = grad;
  tCtx.fillRect(0, 0, 32, 32);
  var particleTexture = new THREE.CanvasTexture(texCanvas);

  /* ---------- Geometry ---------- */
  var positions  = new Float32Array(NUM * 3);
  var targets    = new Float32Array(NUM * 3);
  var startPos   = new Float32Array(NUM * 3);
  var colors     = new Float32Array(NUM * 3);

  var palette = [
    new THREE.Color(0x38bdf8), // cyan
    new THREE.Color(0x3b82f6), // blue
    new THREE.Color(0x8fffba)  // green
  ];

  for (var i = 0; i < NUM; i++) {
    // Random scattered start positions
    var sx = (Math.random() - 0.5) * 12;
    var sy = (Math.random() - 0.5) * 8;
    var sz = (Math.random() - 0.5) * 6 + 2;
    startPos[i * 3]     = sx;
    startPos[i * 3 + 1] = sy;
    startPos[i * 3 + 2] = sz;
    positions[i * 3]     = sx;
    positions[i * 3 + 1] = sy;
    positions[i * 3 + 2] = sz;

    // Target = text position
    targets[i * 3]     = textPositions[i].x;
    targets[i * 3 + 1] = textPositions[i].y;
    targets[i * 3 + 2] = textPositions[i].z;

    // Color
    var c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var material = new THREE.PointsMaterial({
    size: isMobile ? 0.035 : 0.03,
    map: particleTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  var points = new THREE.Points(geometry, material);
  scene.add(points);

  /* ---------- Easing functions ---------- */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /* ---------- Animation timeline ---------- */
  var PHASE_FADEIN    = 400;
  var PHASE_CONVERGE  = 1600;
  var PHASE_HOLD      = 1200;
  var PHASE_SCATTER   = 900;
  var TOTAL = PHASE_FADEIN + PHASE_CONVERGE + PHASE_HOLD + PHASE_SCATTER;

  var startTime = performance.now();
  var subtitle  = document.getElementById('intro-subtitle');
  var subtitleShown = false;
  var done = false;

  function animate() {
    if (done) return;
    requestAnimationFrame(animate);

    var elapsed = performance.now() - startTime;
    var posAttr = geometry.attributes.position;

    if (elapsed < PHASE_FADEIN) {
      /* Phase 1: Fade in */
      material.opacity = elapsed / PHASE_FADEIN;

    } else if (elapsed < PHASE_FADEIN + PHASE_CONVERGE) {
      /* Phase 2: Converge to text */
      material.opacity = 1;
      var t = easeInOutCubic((elapsed - PHASE_FADEIN) / PHASE_CONVERGE);
      for (var i = 0; i < NUM; i++) {
        posAttr.array[i * 3]     = startPos[i * 3]     + (targets[i * 3]     - startPos[i * 3])     * t;
        posAttr.array[i * 3 + 1] = startPos[i * 3 + 1] + (targets[i * 3 + 1] - startPos[i * 3 + 1]) * t;
        posAttr.array[i * 3 + 2] = startPos[i * 3 + 2] + (targets[i * 3 + 2] - startPos[i * 3 + 2]) * t;
      }
      posAttr.needsUpdate = true;

    } else if (elapsed < PHASE_FADEIN + PHASE_CONVERGE + PHASE_HOLD) {
      /* Phase 3: Hold with subtle breathing */
      if (!subtitleShown && subtitle) {
        subtitle.style.opacity = '1';
        subtitleShown = true;
      }
      var breathT = (elapsed - PHASE_FADEIN - PHASE_CONVERGE) / PHASE_HOLD;
      var breathScale = 1 + Math.sin(breathT * Math.PI * 2) * 0.008;
      points.scale.set(breathScale, breathScale, breathScale);

    } else if (elapsed < TOTAL) {
      /* Phase 4: Scatter toward camera + fade overlay */
      var t2 = easeOutCubic((elapsed - PHASE_FADEIN - PHASE_CONVERGE - PHASE_HOLD) / PHASE_SCATTER);
      for (var j = 0; j < NUM; j++) {
        posAttr.array[j * 3]     = targets[j * 3]     + (Math.random() - 0.5) * t2 * 4;
        posAttr.array[j * 3 + 1] = targets[j * 3 + 1] + (Math.random() - 0.5) * t2 * 4;
        posAttr.array[j * 3 + 2] = targets[j * 3 + 2] + t2 * 8;
      }
      posAttr.needsUpdate = true;
      material.opacity = 1 - t2;
      overlay.style.opacity = String(1 - t2);

    } else {
      /* Done */
      cleanup();
      return;
    }

    renderer.render(scene, camera);
  }

  function cleanup() {
    done = true;
    sessionStorage.setItem('intro-played', '1');
    overlay.remove();
    geometry.dispose();
    material.dispose();
    particleTexture.dispose();
    renderer.dispose();
  }

  /* ---------- Skip on click/tap ---------- */
  overlay.addEventListener('click', function () {
    cleanup();
  });

  /* ---------- Resize ---------- */
  window.addEventListener('resize', function () {
    if (done) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  /* ---------- Start ---------- */
  requestAnimationFrame(animate);
})();
