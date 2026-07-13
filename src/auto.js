/**
 * CMS entry point: bundled to dist/dl-carousel.js (classic script).
 * Auto-initializes every [data-slider] on the page; exposes the class
 * as window.DLCarousel for page-level scripting.
 */
import { Slider } from './dl-carousel.js';

window.DLCarousel = Slider;

const run = () => Slider.autoInit();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
