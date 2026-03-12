const { gsap } = require('gsap');
try {
  gsap.to({}, { clearProps: false, duration: 1 });
  // wait, we need to register a fake plugin for clearProps or just trigger the tick
} catch(e) {}
