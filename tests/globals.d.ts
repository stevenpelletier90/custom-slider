// Test-only globals a page is given by an init script. Types only.
declare global {
  interface Window {
    /** builder.test.mjs: the tabbed bar's height, one sample per animation frame. */
    __h?: number[];
  }
}

export {};
