/**
 * Intro Boxing Center — coups de poing, étincelles 2D + halo 3D (Three.js).
 * Déclenche window.__offreEteIntroDone quand la promo peut s'afficher.
 */
(function () {
  const ASSET_BASE = document.currentScript?.dataset?.assets || 'assets';
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CRAWLER = /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|applebot/i.test(
    navigator.userAgent || ''
  );

  const ASSETS = {
    gloveRightPng: `${ASSET_BASE}/glove-right.png`,
    gloveRightSvg: `${ASSET_BASE}/glove-right.svg`,
    gloveLeftPng: `${ASSET_BASE}/glove-left.png`,
    gloveLeftSvg: `${ASSET_BASE}/glove-left.svg`,
    logoPng: `${ASSET_BASE}/logo-boxing-center.png`,
    logoSvg: `${ASSET_BASE}/logo-boxing-center.svg`,
  };

  const NAVY = '#111111';
  const WHITE = '#FFFFFF';
  const GOLD = '#C9A227';
  const BLUE_SPARK = '#CCCCCC';
  const RED_SPARK = '#E30613';

  const stage = document.getElementById('intro-stage');
  const canvas2d = document.getElementById('intro-canvas');
  const canvas3d = document.getElementById('intro-three');
  const leftGlove = document.getElementById('intro-glove-left');
  const rightGlove = document.getElementById('intro-glove-right');
  const logoOverlay = document.getElementById('intro-logo');
  const logoImg = document.getElementById('intro-logo-img');
  const mainSite = document.getElementById('main-site');

  if (!stage || !canvas2d || !leftGlove || !rightGlove || !logoOverlay || !mainSite) {
    finishIntro();
    return;
  }

  const ctx = canvas2d.getContext('2d');
  let width = 0;
  let height = 0;
  let impactX = 0;
  let impactY = 0;
  let animationPhase = 'idle';
  let particles = [];
  let logoPoints = [];
  let logoRevealStarted = false;
  let logoLayout = { x: 0, y: 0, w: 0, h: 0 };
  const logoSource = new Image();

  /* ---------- Three.js 3D ---------- */
  let three = null;
  let renderer3d = null;
  let scene3d = null;
  let camera3d = null;
  let shockRings = [];
  let burstPoints = null;
  let ringMesh = null;
  let threeClock = null;

  function initThree() {
    if (REDUCED || typeof THREE === 'undefined' || !canvas3d) return;
    three = THREE;
    renderer3d = new three.WebGLRenderer({ canvas: canvas3d, alpha: true, antialias: true });
    renderer3d.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene3d = new three.Scene();
    scene3d.fog = new three.FogExp2(0x000000, 0.045);
    camera3d = new three.PerspectiveCamera(42, 1, 0.1, 100);
    camera3d.position.set(0, 0.2, 6.5);
    threeClock = new three.Clock();

    const amb = new three.AmbientLight(0x334466, 0.55);
    scene3d.add(amb);
    const key = new three.DirectionalLight(0xffffff, 1.1);
    key.position.set(2, 4, 5);
    scene3d.add(key);
    const rim = new three.PointLight(0xc8102e, 2.2, 18);
    rim.position.set(-3, 1, 2);
    scene3d.add(rim);

    const ringGeo = new three.TorusGeometry(2.15, 0.035, 12, 96);
    const ringMat = new three.MeshStandardMaterial({
      color: 0x1b2a5a,
      emissive: 0x2b4a9a,
      emissiveIntensity: 0.35,
      metalness: 0.65,
      roughness: 0.35,
    });
    ringMesh = new three.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI * 0.42;
    scene3d.add(ringMesh);

    const ropeMat = new three.MeshStandardMaterial({
      color: 0xc8102e,
      emissive: 0x5a0818,
      emissiveIntensity: 0.4,
      metalness: 0.2,
      roughness: 0.6,
    });
    [-1.55, -1.15, -0.75, 0.75, 1.15, 1.55].forEach((y) => {
      const rope = new three.Mesh(new three.TorusGeometry(2.05, 0.018, 8, 80), ropeMat);
      rope.rotation.x = Math.PI * 0.42;
      rope.position.y = y * 0.22;
      scene3d.add(rope);
    });

    resizeThree();
    requestAnimationFrame(animateThree);
  }

  function resizeThree() {
    if (!renderer3d || !camera3d) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer3d.setSize(w, h, false);
    camera3d.aspect = w / h;
    camera3d.updateProjectionMatrix();
  }

  function spawn3DImpact() {
    if (!three || !scene3d) return;
    for (let i = 0; i < 3; i++) {
      const geo = new three.RingGeometry(0.15 + i * 0.08, 0.22 + i * 0.08, 48);
      const mat = new three.MeshBasicMaterial({
        color: i === 0 ? 0xc8102e : 0x4a7cff,
        transparent: true,
        opacity: 0.85,
        side: three.DoubleSide,
        blending: three.AdditiveBlending,
      });
      const mesh = new three.Mesh(geo, mat);
      mesh.position.z = -0.4 + i * 0.05;
      mesh.userData = { born: performance.now(), delay: i * 60 };
      scene3d.add(mesh);
      shockRings.push(mesh);
    }

    const count = 420;
    const positions = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.04 + Math.random() * 0.14;
      velocities.push({
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
        z: (Math.random() - 0.5) * 0.06,
        life: 1,
      });
    }
    const geo = new three.BufferGeometry();
    geo.setAttribute('position', new three.BufferAttribute(positions, 3));
    const mat = new three.PointsMaterial({
      color: 0xffd966,
      size: 0.045,
      transparent: true,
      opacity: 1,
      blending: three.AdditiveBlending,
      depthWrite: false,
    });
    burstPoints = { mesh: new three.Points(geo, mat), velocities, born: performance.now() };
    scene3d.add(burstPoints.mesh);
  }

  function animateThree() {
    if (!renderer3d || !scene3d || !camera3d) return;
    const t = threeClock ? threeClock.getElapsedTime() : 0;
    if (ringMesh) {
      ringMesh.rotation.z = t * 0.12;
      ringMesh.position.y = Math.sin(t * 0.8) * 0.06;
    }
    camera3d.position.x = Math.sin(t * 0.35) * 0.08;
    camera3d.lookAt(0, 0, 0);

    const now = performance.now();
    shockRings = shockRings.filter((mesh) => {
      const age = (now - mesh.userData.born - mesh.userData.delay) / 1000;
      if (age < 0) return true;
      const scale = 1 + age * 5.5;
      mesh.scale.set(scale, scale, scale);
      mesh.material.opacity = Math.max(0, 0.9 - age * 1.1);
      if (mesh.material.opacity <= 0) {
        scene3d.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
        return false;
      }
      return true;
    });

    if (burstPoints) {
      const age = (now - burstPoints.born) / 1000;
      const pos = burstPoints.mesh.geometry.attributes.position.array;
      burstPoints.velocities.forEach((v, i) => {
        pos[i * 3] += v.x;
        pos[i * 3 + 1] += v.y;
        pos[i * 3 + 2] += v.z;
        v.life -= 0.012;
      });
      burstPoints.mesh.geometry.attributes.position.needsUpdate = true;
      burstPoints.mesh.material.opacity = Math.max(0, 1 - age * 1.35);
      if (burstPoints.mesh.material.opacity <= 0) {
        scene3d.remove(burstPoints.mesh);
        burstPoints.mesh.geometry.dispose();
        burstPoints.mesh.material.dispose();
        burstPoints = null;
      }
    }

    renderer3d.render(scene3d, camera3d);
    requestAnimationFrame(animateThree);
  }

  function shakeCamera3D(intensity, durationMs) {
    if (!camera3d) return;
    const start = performance.now();
    const baseX = camera3d.position.x;
    const baseY = camera3d.position.y;
    function frame(now) {
      const p = Math.min(1, (now - start) / durationMs);
      const amp = (1 - p) * intensity;
      camera3d.position.x = baseX + (Math.random() - 0.5) * amp;
      camera3d.position.y = baseY + (Math.random() - 0.5) * amp * 0.6;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- 2D particles (étincelles + logo) ---------- */
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas2d.width = width * dpr;
    canvas2d.height = height * dpr;
    canvas2d.style.width = width + 'px';
    canvas2d.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    impactX = width / 2;
    impactY = height / 2;
    resizeThree();
  }

  function setImgSrc(imgEl, path, fallback) {
    if (!imgEl) return;
    imgEl.src = path || fallback;
  }

  function loadImage(imgEl, primary, fallback) {
    return new Promise((resolve) => {
      if (!imgEl) return resolve(fallback);
      imgEl.onload = () => resolve(imgEl.src || primary);
      imgEl.onerror = () => {
        setImgSrc(imgEl, fallback, fallback);
        resolve(fallback);
      };
      setImgSrc(imgEl, primary, fallback);
      if (imgEl.complete && imgEl.naturalWidth) resolve(imgEl.src);
      setTimeout(() => resolve(imgEl.src || fallback), 3500);
    });
  }

  function gloveTravel() {
    const short = Math.min(width, height);
    return Math.min(short * 0.48, width * 0.42, 380);
  }

  function computeMeetOffset() {
    const gloveW = leftGlove?.offsetWidth || clamp(200, width * 0.52, 480);
    return Math.max(gloveW * 0.22, Math.min(gloveTravel() * 0.55, 200));
  }

  function clamp(min, val, max) {
    return Math.max(min, Math.min(val, max));
  }

  function computeLogoLayout(imgW, imgH) {
    const maxW = Math.min(width * 0.88, 720);
    const scale = maxW / imgW;
    const w = imgW * scale;
    const h = imgH * scale;
    return { x: (width - w) / 2, y: (height - h) / 2, w, h };
  }

  function sampleLogoPixels(img) {
    logoLayout = computeLogoLayout(img.naturalWidth, img.naturalHeight);
    const off = document.createElement('canvas');
    off.width = width;
    off.height = height;
    const offCtx = off.getContext('2d');
    offCtx.drawImage(img, logoLayout.x, logoLayout.y, logoLayout.w, logoLayout.h);
    const imageData = offCtx.getImageData(0, 0, width, height);
    const points = [];
    const step = 3;
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const i = (y * width + x) * 4;
        const a = imageData.data[i + 3];
        if (a < 80) continue;
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        if (r < 12 && g < 12 && b < 12) continue;
        points.push({ x, y, color: `rgb(${r},${g},${b})` });
      }
    }
    logoPoints = points;
  }

  function spawnSparks(count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 14;
      particles.push({
        x: impactX + (Math.random() - 0.5) * 18,
        y: impactY + (Math.random() - 0.5) * 18,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 3.5,
        color: Math.random() > 0.4 ? GOLD : Math.random() > 0.5 ? WHITE : Math.random() > 0.5 ? BLUE_SPARK : RED_SPARK,
        alpha: 1,
        phase: 'spark',
      });
    }
  }

  function spawnGlitter(count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 8 + Math.random() * 22;
      particles.push({
        x: impactX + (Math.random() - 0.5) * 30,
        y: impactY + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 5,
        color: Math.random() > 0.35 ? WHITE : Math.random() > 0.5 ? BLUE_SPARK : NAVY,
        alpha: 1,
        phase: 'glitter',
      });
    }
  }

  function spawnLogoParticles() {
    if (!logoPoints.length && logoSource.complete) {
      try {
        sampleLogoPixels(logoSource);
      } catch (_) {}
    }
    if (!logoPoints.length) return false;
    const shuffled = logoPoints.slice().sort(() => Math.random() - 0.5);
    shuffled.forEach((point) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 60 + Math.random() * Math.min(width, height) * 0.42;
      particles.push({
        x: impactX + Math.cos(angle) * radius,
        y: impactY + Math.sin(angle) * radius,
        targetX: point.x,
        targetY: point.y,
        size: 1.8 + Math.random() * 2.2,
        color: point.color,
        alpha: 0.25 + Math.random() * 0.55,
        phase: 'text',
        settled: false,
      });
    });
    return true;
  }

  let introFinished = false;
  let safetyTimer = null;
  let lastReportedHeight = 0;

  function getContentHeight() {
    if (stage && stage.parentNode && !introFinished) {
      return Math.ceil(window.innerHeight || document.documentElement.clientHeight || 800);
    }
    if (mainSite) {
      return Math.ceil(mainSite.getBoundingClientRect().height);
    }
    return Math.ceil(document.body.offsetHeight);
  }

  function notifyParentHeight() {
    if (window.parent === window) return;
    const h = getContentHeight();
    if (Math.abs(h - lastReportedHeight) < 4) return;
    lastReportedHeight = h;
    window.parent.postMessage({ type: 'offre-ete-resize', height: h }, '*');
  }

  function trackView() {
    const api = window.OFFRE_ETE_TRACK_API;
    if (!api) return;
    fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'view', source: 'wordpress' }),
      keepalive: true,
    }).catch(() => {});
  }

  function wakePromoAnimations() {
    document.body.classList.add('intro-done');
    const wake = mainSite.querySelectorAll(
      '.hero-eyebrow, .hero-price, .hero-desc, .hero-actions, .hero-floats, .hero-scroll, .hero-visual, .reveal, .reveal-l, .reveal-r'
    );
    wake.forEach((el) => {
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = '';
      if (el.classList.contains('reveal') || el.classList.contains('reveal-l') || el.classList.contains('reveal-r')) {
        el.classList.add('vis');
      }
    });
    mainSite.querySelectorAll('.hero-h1 .lni').forEach((el) => {
      el.style.transform = 'translateY(0)';
    });
    const banner = document.getElementById('tshirtHeroBanner');
    if (banner) {
      banner.classList.add('vis', 'tshirt-hero-banner--show');
    }
  }

  function showHeroAnnouncement() {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    try { window.parent.postMessage({ type: 'offre-ete-scroll-top' }, '*'); } catch (_) {}
    const banner = document.getElementById('tshirtHeroBanner');
    if (banner) {
      banner.classList.add('vis', 'tshirt-hero-banner--show', 'tshirt-hero-banner--pulse');
      banner.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }

  function finishIntro() {
    if (introFinished) return;
    introFinished = true;
    if (safetyTimer) window.clearTimeout(safetyTimer);
    stage.classList.add('intro-stage--out');
    mainSite.classList.remove('main-site--hidden');
    wakePromoAnimations();
    trackView();
    notifyParentHeight();
    window.setTimeout(notifyParentHeight, 500);
    window.setTimeout(notifyParentHeight, 1500);
    window.setTimeout(() => {
      stage.remove();
      lastReportedHeight = 0;
      notifyParentHeight();
      window.dispatchEvent(new CustomEvent('offre-ete-intro-done'));
      window.setTimeout(showHeroAnnouncement, 150);
    }, 500);
  }

  function revealLogo() {
    if (logoRevealStarted) return;
    logoRevealStarted = true;
    logoOverlay.style.visibility = 'visible';
    const onDone = () => {
      particles = particles.filter((p) => p.phase !== 'text');
      window.setTimeout(finishIntro, 200);
    };
    if (typeof gsap !== 'undefined') {
      gsap.to(logoOverlay, { opacity: 1, duration: 0.35, ease: 'power2.out', onComplete: onDone });
    } else {
      logoOverlay.style.transition = 'opacity 0.35s ease-out';
      logoOverlay.style.opacity = '1';
      window.setTimeout(onDone, 370);
    }
  }

  function drawParticles() {
    ctx.clearRect(0, 0, width, height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (p.phase === 'spark') {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38;
        p.vx *= 0.97;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
      } else if (p.phase === 'glitter') {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.alpha -= 0.014;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
      } else if (p.phase === 'text') {
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        p.x += dx * 0.12;
        p.y += dy * 0.12;
        p.alpha = Math.min(1, p.alpha + 0.025);
        if (Math.hypot(dx, dy) < 2.5) p.settled = true;
      }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      if (p.phase === 'glitter') {
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (animationPhase === 'text') {
      const textParticles = particles.filter((p) => p.phase === 'text');
      if (!textParticles.length) {
        revealLogo();
      } else {
        const settledRatio =
          textParticles.filter((p) => p.settled).length / textParticles.length;
        if (settledRatio > 0.78) revealLogo();
      }
    }
    requestAnimationFrame(drawParticles);
  }

  function startTimeline() {
    if (logoSource.complete && logoSource.naturalWidth) {
      try {
        sampleLogoPixels(logoSource);
      } catch (_) {}
    }

    if (REDUCED || CRAWLER) {
      finishIntro();
      return;
    }

    const meetOffset = computeMeetOffset();

    if (typeof gsap === 'undefined') {
      leftGlove.style.visibility = 'visible';
      rightGlove.style.visibility = 'visible';
      leftGlove.style.opacity = '1';
      rightGlove.style.opacity = '1';
      spawnSparks(80);
      spawn3DImpact();
      shakeCamera3D(0.12, 200);
      window.setTimeout(() => {
        spawnGlitter(200);
        window.setTimeout(() => {
          spawnLogoParticles();
          animationPhase = 'text';
          window.setTimeout(revealLogo, 700);
        }, 250);
      }, 120);
      return;
    }

    gsap.set(stage, { x: 0, y: 0 });
    const travel = gloveTravel();
    const gloveBase = {
      xPercent: -50,
      yPercent: -50,
      y: 0,
      scale: 1,
      opacity: 0,
      visibility: 'hidden',
      transformOrigin: '50% 50%',
    };
    gsap.set(leftGlove, { ...gloveBase, x: -travel, rotation: 6 });
    gsap.set(rightGlove, { ...gloveBase, x: travel, rotation: -6 });
    gsap.set(logoOverlay, { opacity: 0, visibility: 'hidden' });

    const tl = gsap.timeline({ delay: 0.05 });
    tl.set([leftGlove, rightGlove], { visibility: 'visible', opacity: 1 })
      .to(leftGlove, { x: -meetOffset, y: 0, rotation: 8, scale: 1.04, duration: 0.38, ease: 'power4.in' })
      .to(rightGlove, { x: meetOffset, y: 0, rotation: -8, scale: 1.04, duration: 0.38, ease: 'power4.in' }, '<')
      .add(() => {
        animationPhase = 'sparks';
        spawnSparks(150);
        spawn3DImpact();
        shakeCamera3D(0.16, 200);
      }, '-=0.03')
      .to(stage, { x: -14, y: 6, duration: 0.03, yoyo: true, repeat: 3, ease: 'power1.inOut', onComplete: () => gsap.set(stage, { x: 0, y: 0 }) }, '<')
      .to(leftGlove, { opacity: 0, y: 0, scale: 1.22, duration: 0.18, ease: 'power2.in' }, '-=0.06')
      .to(rightGlove, { opacity: 0, y: 0, scale: 1.22, duration: 0.18, ease: 'power2.in' }, '<')
      .add(() => {
        animationPhase = 'glitter';
        spawnGlitter(480);
      })
      .to({}, { duration: 0.4 })
      .add(() => {
        animationPhase = 'text';
        particles = particles.filter((p) => p.phase !== 'glitter');
        const hasLogoParticles = spawnLogoParticles();
        if (!hasLogoParticles) window.setTimeout(revealLogo, 150);
      })
      .to({}, { duration: 0.7, onComplete: revealLogo });
  }

  function boot() {
    if (window.parent !== window) {
      document.documentElement.classList.add('in-iframe');
    }
    resize();
    window.addEventListener('resize', resize);
    initThree();
    requestAnimationFrame(drawParticles);
    window.addEventListener('resize', notifyParentHeight);
    window.setTimeout(notifyParentHeight, 800);

    Promise.all([
      loadImage(leftGlove, ASSETS.gloveRightPng, ASSETS.gloveRightSvg),
      loadImage(rightGlove, ASSETS.gloveLeftPng, ASSETS.gloveLeftSvg),
      loadImage(logoSource, ASSETS.logoPng, ASSETS.logoSvg).then((path) => {
        setImgSrc(logoImg, path, ASSETS.logoSvg);
      }),
    ])
      .then(() => {
        safetyTimer = window.setTimeout(finishIntro, 5000);
        startTimeline();
      })
      .catch(() => {
        safetyTimer = window.setTimeout(finishIntro, 8000);
        startTimeline();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
