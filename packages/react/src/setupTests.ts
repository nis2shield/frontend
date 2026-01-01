import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';

// Polyfill Web Crypto API for Node.js (needed for GitHub Actions CI)
if (typeof window !== 'undefined' && !window.crypto?.subtle) {
    Object.defineProperty(window, 'crypto', {
        value: webcrypto,
        writable: true,
    });
}

