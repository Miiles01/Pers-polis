gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
});

lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

const header = document.getElementById('siteHeader');
const navToggle = document.getElementById('navToggle');

navToggle?.addEventListener('click', () => {
  header.classList.toggle('nav-open');
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 });
    }
    header.classList.remove('nav-open');
  });
});

// Block reveal (fade + rise) for whole sections/cards
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Word-by-word title entrance (GSAP SplitText)
gsap.registerPlugin(SplitText);

function splitWords(el) {
  return SplitText.create(el, { type: 'words' });
}

const heroTitle = document.querySelector('.hero h1');
if (heroTitle) {
  gsap.from(splitWords(heroTitle).words, {
    opacity: 0, y: 15,
    stagger: 0.06, duration: 0.5,
    ease: 'power2.out'
  });
}

const scrollTitles = document.querySelectorAll('.section-head h2, .cta-band h2');
const titleWordsByEl = new Map();
scrollTitles.forEach(el => {
  const words = splitWords(el).words;
  gsap.set(words, { opacity: 0, y: 15 });
  titleWordsByEl.set(el, words);
});

const titleObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const words = titleWordsByEl.get(entry.target);
      if (words) {
        gsap.to(words, {
          opacity: 1, y: 0,
          stagger: 0.06, duration: 0.5,
          ease: 'power2.out'
        });
      }
      titleObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });

scrollTitles.forEach(el => titleObserver.observe(el));

// Line-by-line stagger for the info cards
const infoCards = document.querySelectorAll('.info-card');
if (infoCards.length) {
  gsap.set(infoCards, { opacity: 0, y: 30 });

  const infoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gsap.to(infoCards, {
          y: 0, opacity: 1,
          stagger: 0.2, duration: 0.8,
          ease: 'power2.out'
        });
        infoObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  infoObserver.observe(document.querySelector('.infos-grid'));
}

// Book menu — desktop/tablet CSS 3D flipbook controls
const flipChecks = Array.from(document.querySelectorAll('.flip-check'));
const flipPrev = document.getElementById('flipPrev');
const flipNext = document.getElementById('flipNext');

if (flipChecks.length && flipPrev && flipNext) {
  flipNext.addEventListener('click', () => {
    const next = flipChecks.find(cb => !cb.checked);
    if (next) next.checked = true;
  });
  flipPrev.addEventListener('click', () => {
    const last = [...flipChecks].reverse().find(cb => cb.checked);
    if (last) last.checked = false;
  });
}

// Book menu — mobile pager
const bookPages = Array.from({ length: 8 }, (_, i) => `assets/book-menu/page-${i + 1}.jpg`);
const pagerImg = document.getElementById('pagerImg');
const pagerCount = document.getElementById('pagerCount');
const pagerPrev = document.getElementById('pagerPrev');
const pagerNext = document.getElementById('pagerNext');
let pagerIndex = 0;

function renderPager() {
  if (!pagerImg) return;
  pagerImg.src = bookPages[pagerIndex];
  pagerImg.alt = `Menu Persépolis, page ${pagerIndex + 1}`;
  pagerCount.textContent = `${pagerIndex + 1} / ${bookPages.length}`;
}

pagerPrev?.addEventListener('click', () => {
  pagerIndex = (pagerIndex - 1 + bookPages.length) % bookPages.length;
  renderPager();
});
pagerNext?.addEventListener('click', () => {
  pagerIndex = (pagerIndex + 1) % bookPages.length;
  renderPager();
});

// Gallery items appear one after another as the grid scrolls into view
const galleryItems = document.querySelectorAll('.gallery-item');
if (galleryItems.length) {
  gsap.set(galleryItems, { opacity: 0, y: 30 });

  const galleryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gsap.to(galleryItems, {
          y: 0, opacity: 1,
          stagger: 0.15, duration: 0.7,
          ease: 'power2.out'
        });
        galleryObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  galleryObserver.observe(document.querySelector('.gallery-grid'));
}

// "Nos plats populaires" — GSAP scroll-pin horizontal card effect, desktop/tablet only.
// Cards travel across the viewport as the section is pinned and scrolled; each card gets
// a trailing "lag" kick (proportional to scroll speed) as it enters the frame.
// On mobile this whole block is skipped — plain native touch-scroll carousel, no motion, no arrows.
if (window.matchMedia('(min-width: 721px)').matches) {
  const dishesPin = document.getElementById('dishesPin');
  const dishCardsTrack = document.getElementById('dishCards');
  const dishCardEls = dishCardsTrack ? dishCardsTrack.querySelectorAll('.dish-card') : [];

  if (dishesPin && dishCardsTrack && dishCardEls.length) {
    const distance = dishCardsTrack.clientWidth - window.innerWidth;

    const scrollTween = gsap.to(dishCardsTrack, {
      x: -distance,
      ease: 'none',
      scrollTrigger: {
        trigger: dishesPin,
        pin: true,
        scrub: true,
        start: 'top top',
        end: '+=' + distance
      }
    });

    let transformBetweenTwoTicks = 0;
    let oldTransform = 0;
    function dishTick() {
      const currentTransform = gsap.getProperty(dishCardsTrack, 'x');
      transformBetweenTwoTicks = currentTransform - oldTransform;
      oldTransform = currentTransform;
    }

    function transformDishCard(el) {
      gsap.fromTo(el, {
        xPercent: -transformBetweenTwoTicks * 3
      }, {
        xPercent: 0,
        ease: 'power3.out',
        duration: 0.7
      });
    }

    dishCardEls.forEach(card => {
      ScrollTrigger.create({
        trigger: card,
        containerAnimation: scrollTween,
        start: 'left 100%',
        end: 'right 0%',
        onEnter: () => transformDishCard(card.children[0]),
        onEnterBack: () => transformDishCard(card.children[0])
      });
    });

    ScrollTrigger.create({
      trigger: document.getElementById('plats'),
      onEnter: () => gsap.ticker.add(dishTick),
      onLeave: () => gsap.ticker.remove(dishTick),
      onEnterBack: () => gsap.ticker.add(dishTick),
      onLeaveBack: () => gsap.ticker.remove(dishTick)
    });
  }
}

// Gallery lightbox
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

document.querySelectorAll('.gallery-item').forEach(item => {
  item.addEventListener('click', () => {
    lightboxImg.src = item.dataset.full;
    lightboxImg.alt = item.querySelector('img').alt;
    lightbox.classList.add('is-open');
    lenis.stop();
  });
});

function closeLightbox() {
  lightbox.classList.remove('is-open');
  lenis.start();
}

lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});
