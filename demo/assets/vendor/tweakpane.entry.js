// Bundled by scripts/build-vendor.mjs into ./tweakpane.js (an IIFE), which is
// what demo/index.html loads. Everything the pane and its plugins need hangs
// off CARGO.tp, so demo/assets/pane.js and tp-plugins.js stay classic scripts.
import { Pane } from 'tweakpane';
import * as core from '@tweakpane/core';

globalThis.CARGO ??= {};
globalThis.CARGO.tp = { Pane, ...core };
