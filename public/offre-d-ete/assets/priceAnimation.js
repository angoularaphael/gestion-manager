(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const pBigOldText = document.getElementById('pBigOldText');
    const chars = document.querySelectorAll('#pBigOldText .c');
    const pBigSlash = document.getElementById('pBigSlash');
    const pBigNewText = document.getElementById('pBigNewText');
    const pOldFinal = document.getElementById('pOldFinal');
    const pFlash = document.getElementById('pFlash');
    const pBadgeText = document.getElementById('pBadgeText');

    if (!pBigOldText || typeof gsap === 'undefined') return;

    // Set initial states
    gsap.set(pBigSlash, { width: 0 });
    gsap.set(pBigNewText, { opacity: 0, scale: 0.5 });
    gsap.set(pOldFinal, { opacity: 0, x: -20 });
    gsap.set(pFlash, { opacity: 0, scale: 0 });
    gsap.set(pBadgeText, { opacity: 0, y: 10 });

    let hasPlayed = false;

    function playPriceAnimation() {
      if (hasPlayed) return;
      hasPlayed = true;
      
      // Give the user time to read "150€" (Anchor effect)
      const tl = gsap.timeline({ delay: 1.6 });

      // 1. The Slash (BAM!) - Fast but readable
      tl.to(pBigSlash, {
        width: '110%',
        duration: 0.2,
        ease: 'power4.out'
      })

      // 2. The Shatter - Wait a tiny fraction so the slash is seen
      .addLabel('shatter', '+=0.15')
      .to(chars, {
        x: () => (Math.random() - 0.5) * 250,
        y: () => (Math.random() - 0.5) * 250 - 50,
        rotation: () => (Math.random() - 0.5) * 360,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.02
      }, 'shatter')
      .to(pBigSlash, {
        opacity: 0,
        y: 80,
        rotation: 25,
        duration: 0.7,
        ease: 'power2.in'
      }, 'shatter')

      // 3. The Golden Flash & New Price Pop (wait for shatter to disperse slightly)
      .addLabel('pop', '-=0.25')
      .to(pFlash, {
        opacity: 1,
        scale: 1.8,
        duration: 0.2,
        ease: 'power2.out'
      }, 'pop')
      .to(pFlash, {
        opacity: 0,
        scale: 2,
        duration: 0.5,
        ease: 'power2.in'
      }, 'pop+=0.2')
      .to(pBigNewText, {
        opacity: 1,
        scale: 1.15,
        duration: 0.5,
        ease: 'back.out(1.5)'
      }, 'pop')
      .to(pBigNewText, {
        scale: 1,
        duration: 0.25,
        ease: 'power1.inOut'
      }, 'pop+=0.5')

      // 4. Confetti and Badge
      .addLabel('confetti', '+=0')
      .to(pBadgeText, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      }, 'confetti')
      .call(() => {
        if (typeof confetti !== 'undefined') {
          const rect = pBigNewText.getBoundingClientRect();
          const x = (rect.left + rect.width / 2) / window.innerWidth;
          const y = (rect.top + rect.height / 2) / window.innerHeight;
          
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { x, y },
            colors: ['#FFD700', '#FFA500', '#FFFFFF', '#E30613'],
            disableForReducedMotion: true,
            zIndex: 100
          });
        }
      }, [], 'confetti')

      // 5. Final Old Price Fade In
      .addLabel('final', '+=1.0')
      .to(pOldFinal, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: function () {
          if (typeof window.__offreEteNotifyParentHeight === 'function') {
            window.__offreEteNotifyParentHeight();
            window.setTimeout(window.__offreEteNotifyParentHeight, 400);
          }
        }
      }, 'final');
    }

    // Listen to intro done event
    window.addEventListener('offre-ete-intro-done', playPriceAnimation);

    // Fallback
    setTimeout(playPriceAnimation, 4500);
  });
})();
