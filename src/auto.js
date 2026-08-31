/**
 * CMS entry point: bundled to dist/custom-slider.js (classic script).
 * Auto-initializes every [data-cs] on the page; exposes the class
 * as window.CustomSlider for page-level scripting.
 */
import { CustomSlider } from './custom-slider.js';

window.CustomSlider = CustomSlider;

const run = () => CustomSlider.autoInit();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
