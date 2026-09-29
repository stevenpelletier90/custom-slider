// Ambient types for what the engine hangs on the page at runtime, so the type
// check (npm run typecheck) reads them instead of guessing. Types only: nothing
// here ships, and no .js file imports it.
import type { CustomSlider as Engine } from '../src/custom-slider.js';

declare global {
  interface Element {
    /** The live instance, set on its root by the constructor (`root._cs = this`). */
    _cs?: Engine;
  }

  interface Window {
    /**
     * Set by src/auto.js. The pattern scripts that build-patterns.mjs appends to
     * dist add `wirePatterns` when they load after the engine.
     */
    CustomSlider: typeof Engine & { wirePatterns?: () => void };
  }
}

export {};
