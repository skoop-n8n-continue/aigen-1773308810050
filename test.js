const { gsap } = require('gsap');
try {
  gsap.set({}, { clearProps: false });
  console.log('success clearProps');
} catch (e) { console.error('error clearProps', e.message); }

try {
  gsap.set({}, { drawSVG: '0% 0%' });
  console.log('success drawSVG');
} catch (e) { console.error('error drawSVG', e.message); }
