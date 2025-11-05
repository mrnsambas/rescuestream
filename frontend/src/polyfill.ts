import { Buffer } from 'buffer';

// Polyfill Buffer globally before any other code runs
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer;
}
if (typeof window !== 'undefined' && typeof (window as any).Buffer === 'undefined') {
  (window as any).Buffer = Buffer;
}

// Also set on global for older compatibility
if (typeof global !== 'undefined' && typeof (global as any).Buffer === 'undefined') {
  (global as any).Buffer = Buffer;
}

