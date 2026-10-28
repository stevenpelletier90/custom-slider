/**
 * CMS entry point: bundled to dist/dealeron-slider.js (classic script).
 * Auto-initializes every [data-dos] on the page; exposes the class
 * as window.DealerOnSlider for page-level scripting.
 */
import { DealerOnSlider } from './dealeron-slider.js';

window.DealerOnSlider = DealerOnSlider;

const run = () => DealerOnSlider.autoInit();
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run);
} else {
  run();
}
