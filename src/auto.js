/**
 * CMS entry point: bundled to dist/slider.min.js (classic script).
 * Auto-initializes every [data-slider] on the page; exposes the class
 * as window.CustomSlider for page-level scripting.
 */
import { Slider } from './slider.js';

window.CustomSlider = Slider;

const run = () => Slider.autoInit();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
