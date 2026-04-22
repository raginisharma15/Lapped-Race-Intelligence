import { LENIS_CONFIG } from './config.js';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initLenis() {
  const lenis = new Lenis(LENIS_CONFIG);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);
  return lenis;
}

/**
 * @param {object} opts
 * @param {Lenis}      opts.lenis
 * @param {object}     opts.carState
 * @param {object}     opts.camState
 * @param {HTMLElement[]} [opts.haloChars]   - individual letter spans for typewriter
 */
export function initScrollTimeline({ lenis, carState, camState, haloChars = [] }) {
  gsap.registerPlugin(ScrollTrigger);

  const networkBg = document.getElementById('data-network-bg');

  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      if (arguments.length) lenis.scrollTo(value, { immediate: true });
      return lenis.scroll;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
  });

  /* ═══════════════════════════════════════════════════════
     PHASE 1 — HERO
     Camera starts far behind the car (z=28, high up).
     Car starts off-screen RIGHT (posX = +14), moves LEFT
     across the track straight. Camera swoops from behind
     to a low side angle — like watching the car blast past.
  ═══════════════════════════════════════════════════════ */
  gsap.timeline({
    scrollTrigger: {
      trigger: '#s-hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1.4,
    },
  })
    // Camera: far-behind high → low side tracking position
    .fromTo(camState,
      { posX: 0,    posY: 4.5,  posZ: 28,  lookX: 0,   lookY: 1.2,  lookZ: 0 },
      { posX: 3.5,  posY: 1.2,  posZ: 7.5, lookX: 0,   lookY: 0.55, lookZ: 0,
        duration: 1, ease: 'power2.inOut' },
      0
    )
    // Car: enters from right edge, travels left across frame
    .fromTo(carState,
      { posX: 14,  posY: 0.4, posZ: 0, rotY: Math.PI * 0.5, rotX: 0, scale: 1 },
      { posX: -10, posY: 0.4, posZ: 0, rotY: Math.PI * 0.5, rotX: 0,
        duration: 1, ease: 'power1.inOut' },
      0
    );

  /* ═══════════════════════════════════════════════════════
     PHASE 2 — HALO PIN
     Pinned for ~300vh.
     First half (0→0.45): car slows to centre, camera zooms
     into the halo, solid → wireframe cross-fade happens.
     Second half (0.45→1): dense network bg + typewriter text.
  ═══════════════════════════════════════════════════════ */
  const haloTl = gsap.timeline({
    scrollTrigger: {
      trigger: '#s-halo',
      start: 'top top',
      end: '+=300%',
      pin: true,
      scrub: 1.2,
    },
  });

  // 0 → 0.45: car settles to centre, camera pushes into halo
  haloTl
    .to(carState, {
      posX: -0.4, posY: 0.0, posZ: 0,
      rotY: -Math.PI * 0.5,
      duration: 0.45, ease: 'power2.out',
    }, 0)
    .to(camState, {
      posX: -0.8, posY: 0.78, posZ: 2.2,
      lookX: -0.5, lookY: 0.6, lookZ: 0,
      duration: 0.45, ease: 'power2.inOut',
    }, 0)

    // Network bg ramps up as wireframe kicks in
    .to(networkBg, {
      opacity: 0.88,
      duration: 0.35,
      ease: 'none',
    }, 0.10);

  // 0.45 → 1: hold position, fade in typewriter text letter by letter
  if (haloChars.length) {
    gsap.set(haloChars, { opacity: 0, y: 8 });
    haloTl.to(haloChars, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      stagger: {
        each: 0.032,   // tight letter-by-letter stagger
        ease: 'none',
      },
      ease: 'power1.out',
    }, 0.48);
  }

  /* ═══════════════════════════════════════════════════════
     PHASE 3 — TELEMETRY
     Car shifts screen-right, camera pulls to left side overview.
  ═══════════════════════════════════════════════════════ */
  gsap.timeline({
    scrollTrigger: {
      trigger: '#s-telemetry',
      start: 'top bottom',
      end: 'center center',
      scrub: 1,
    },
  })
    .to(carState, { posX: -2.0,  rotY: -Math.PI * 0.5, duration: 1 }, 0)
    .to(camState, { posX: 0.5,  posY: 1.2, posZ: 5.5, lookX: -1.6, lookY: 0.5, lookZ: 0, duration: 1 }, 0);

  /* ═══════════════════════════════════════════════════════
     PHASE 4 — BRIDGE
  ═══════════════════════════════════════════════════════ */
  gsap.timeline({
    scrollTrigger: {
      trigger: '#s-bridge',
      start: 'top bottom',
      end: 'center center',
      scrub: 1,
    },
  })
    .to(carState, { posX: -1.8, rotY: -Math.PI * 0.5, duration: 1 }, 0)
    .to(camState, { posX: 0, posY: 0.9, posZ: 2.6, lookX: -1.9, lookY: 0.68, lookZ: 0, duration: 1 }, 0);

  /* ═══════════════════════════════════════════════════════
     PHASE 5 — DECISIONS (centred animation, not left/right)
  ═══════════════════════════════════════════════════════ */
  gsap.timeline({
    scrollTrigger: {
      trigger: '#s-decisions',
      start: 'top bottom',
      end: 'center center',
      scrub: 1,
    },
  })
    .to(carState, { posX: 0, posY: 0, rotY: -Math.PI * 0.38, duration: 1 }, 0)
    .to(camState, { posX: 0, posY: 1.4, posZ: 4.2, lookX: -0.5, lookY: 0.45, lookZ: 0, duration: 1 }, 0);

  /* ═══════════════════════════════════════════════════════
     PHASE 6 — BENEFITS
  ═══════════════════════════════════════════════════════ */
  gsap.timeline({
    scrollTrigger: {
      trigger: '#s-benefits',
      start: 'top bottom',
      end: 'center center',
      scrub: 1,
    },
  })
    .to(carState, { posX: 1.6, posY: -0.05, rotY: -Math.PI * 0.5, duration: 1 }, 0)
    .to(camState, { posX: -0.6, posY: 1.3, posZ: 4.8, lookX: 1.2, lookY: 0.4, lookZ: 0, duration: 1 }, 0);

  /* ═══════════════════════════════════════════════════════
     PHASE 7 — FINISH: car drives into distance
  ═══════════════════════════════════════════════════════ */
  gsap.timeline({
    scrollTrigger: {
      trigger: '#s-finish',
      start: 'top bottom',
      end: 'center center',
      scrub: 1,
    },
  })
    .to(carState, { posX: 0, posY: -0.6, posZ: -28, scale: 0.1, rotY: Math.PI * 0.5, duration: 1 }, 0)
    .to(camState, { posX: 0, posY: 2.8, posZ: 7.5, lookX: 0, lookY: -0.5, lookZ: -10, duration: 1 }, 0);

  ScrollTrigger.refresh();
}

export function refreshScrollTriggers() {
  ScrollTrigger.refresh();
}