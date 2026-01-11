import anime from 'animejs/lib/anime.es.js';

// Page load animation
export const animatePageLoad = (targets) => {
  anime({
    targets,
    opacity: [0, 1],
    translateY: [30, 0],
    duration: 800,
    easing: 'easeOutExpo',
  });
};

// Card hover animation
export const animateCardHover = (target, isEntering) => {
  anime({
    targets: target,
    scale: isEntering ? 1.03 : 1,
    boxShadow: isEntering
      ? '0 20px 60px rgba(37, 204, 247, 0.3)'
      : '0 8px 32px rgba(31, 38, 135, 0.37)',
    duration: 400,
    easing: 'easeOutQuad',
  });
};

// Button ripple effect
export const animateButtonRipple = (button, event) => {
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    pointer-events: none;
    transform: scale(0);
  `;

  button.style.position = 'relative';
  button.style.overflow = 'hidden';
  button.appendChild(ripple);

  anime({
    targets: ripple,
    scale: [0, 2],
    opacity: [0.5, 0],
    duration: 600,
    easing: 'easeOutExpo',
    complete: () => ripple.remove(),
  });
};

// Modal animation
export const animateModal = (modal, backdrop, isOpening) => {
  if (isOpening) {
    anime({
      targets: backdrop,
      opacity: [0, 1],
      backdropFilter: ['blur(0px)', 'blur(8px)'],
      duration: 400,
      easing: 'easeOutQuad',
    });

    anime({
      targets: modal,
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: 500,
      easing: 'easeOutExpo',
      delay: 100,
    });
  } else {
    anime({
      targets: modal,
      scale: [1, 0.8],
      opacity: [1, 0],
      duration: 300,
      easing: 'easeInQuad',
    });

    anime({
      targets: backdrop,
      opacity: [1, 0],
      backdropFilter: ['blur(8px)', 'blur(0px)'],
      duration: 300,
      delay: 150,
    });
  }
};

// Counter animation
export const animateCounter = (target, start, end, duration = 2000) => {
  anime({
    targets: { value: start },
    value: end,
    duration,
    easing: 'easeOutExpo',
    update: (anim) => {
      target.textContent = Math.floor(anim.animatables[0].target.value);
    },
  });
};

// Floating blobs animation
export const animateFloatingBlobs = (blobs) => {
  blobs.forEach((blob, index) => {
    anime({
      targets: blob,
      translateX: [
        { value: anime.random(-100, 100) },
        { value: anime.random(-100, 100) },
      ],
      translateY: [
        { value: anime.random(-100, 100) },
        { value: anime.random(-100, 100) },
      ],
      scale: [
        { value: anime.random(0.8, 1.2) },
        { value: anime.random(0.8, 1.2) },
      ],
      duration: anime.random(8000, 12000),
      easing: 'easeInOutQuad',
      delay: index * 500,
      loop: true,
      direction: 'alternate',
    });
  });
};

// Text reveal animation
export const animateTextReveal = (targets) => {
  anime({
    targets,
    opacity: [0, 1],
    translateY: [20, 0],
    duration: 800,
    delay: (el, i) => i * 100,
    easing: 'easeOutExpo',
  });
};

// Shimmer animation for skeleton loaders
export const animateShimmer = (targets) => {
  anime({
    targets,
    backgroundPosition: ['-200% 0', '200% 0'],
    duration: 2000,
    easing: 'linear',
    loop: true,
  });
};

// Glow pulse animation
export const animateGlowPulse = (targets) => {
  anime({
    targets,
    boxShadow: [
      '0 0 20px rgba(37, 204, 247, 0.5)',
      '0 0 40px rgba(37, 204, 247, 0.8)',
      '0 0 20px rgba(37, 204, 247, 0.5)',
    ],
    duration: 2000,
    easing: 'easeInOutQuad',
    loop: true,
  });
};

// Navbar underline slide
export const animateUnderline = (target, isActive) => {
  anime({
    targets: target.querySelector('.underline'),
    scaleX: isActive ? 1 : 0,
    duration: 400,
    easing: 'easeOutExpo',
  });
};
