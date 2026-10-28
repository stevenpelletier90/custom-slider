// Ambient types for what the engine hangs on the page at runtime, so the type
// check (npm run typecheck) reads them instead of guessing. Types only: nothing
// here ships, and no .js file imports it.
import type { DealerOnSlider as Engine } from '../src/dealeron-slider.js';

declare global {
  interface Element {
    /** The live instance, set on its root by the constructor (`root._dos = this`). */
    _dos?: Engine;
  }

  interface Window {
    /**
     * Set by src/auto.js. The pattern scripts that build-patterns.mjs appends to
     * dist add `wirePatterns` when they load after the engine.
     */
    DealerOnSlider: typeof Engine & { wirePatterns?: () => void };
  }
}

export {};
