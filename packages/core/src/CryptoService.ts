/**
 * @nis2shield/core - CryptoService
 * 
 * Cryptography utilities using the Web Crypto API.
 * Uses AES-GCM 256-bit for symmetric encryption.
 * 
 * @example
 * ```typescript
 * const crypto = new CryptoService();
 * 
 * const encrypted = await crypto.encrypt('sensitive data');
 * const decrypted = await crypto.decrypt(encrypted);
 * console.log(decrypted); // 'sensitive data'
 * ```
 */

import type { EncryptedData } from './types';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Provides AES-GCM encryption/decryption and SHA-256 hashing.
 * 
 * The encryption key is generated once per instance and stored in memory.
 * This means encrypted data becomes inaccessible if the page is reloaded,
 * which is a security feature for NIS2 compliance (session-bound encryption).
 */
export class CryptoService {
    private key: CryptoKey | null = null;
    private keyPromise: Promise<CryptoKey> | null = null;

    /**
     * Gets or generates the encryption key.
     * Uses lazy initialization with caching.
     */
    async getKey(): Promise<CryptoKey> {
        if (this.key) return this.key;

        // Prevent multiple concurrent key generations
        if (this.keyPromise) return this.keyPromise;

        this.keyPromise = crypto.subtle.generateKey(
            {
                name: ALGORITHM,
                length: KEY_LENGTH,
            },
            false, // not extractable for higher security
            ['encrypt', 'decrypt']
        );

        this.key = await this.keyPromise;
        return this.key;
    }

    /**
     * Encrypts a plaintext string using AES-GCM.
     * 
     * @param plaintext - The string to encrypt
     * @returns Object containing base64-encoded IV and ciphertext
     */
    async encrypt(plaintext: string): Promise<EncryptedData> {
        const key = await this.getKey();
        const encoded = new TextEncoder().encode(plaintext);

        // IV must be unique for every encryption
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        const encrypted = await crypto.subtle.encrypt(
            {
                name: ALGORITHM,
                iv: iv,
            },
            key,
            encoded
        );

        return {
            iv: this.arrayBufferToBase64(iv.buffer as ArrayBuffer),
            data: this.arrayBufferToBase64(encrypted),
        };
    }

    /**
     * Decrypts an encrypted data object.
     * 
     * @param encrypted - The encrypted data object with IV and ciphertext
     * @returns The decrypted plaintext, or null if decryption fails
     */
    async decrypt(encrypted: EncryptedData): Promise<string | null> {
        try {
            const key = await this.getKey();
            const iv = this.base64ToArrayBuffer(encrypted.iv);
            const data = this.base64ToArrayBuffer(encrypted.data);

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: ALGORITHM,
                    iv: new Uint8Array(iv),
                },
                key,
                data
            );

            return new TextDecoder().decode(decrypted);
        } catch (error) {
            // Decryption failed - likely key mismatch or corrupted data
            console.warn('[NIS2 Core] Decryption failed:', error);
            return null;
        }
    }

    /**
     * Computes SHA-256 hash of a string.
     * 
     * @param input - The string to hash
     * @returns Hex-encoded hash string
     */
    async sha256(input: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Converts an ArrayBuffer to a base64 string.
     */
    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Converts a base64 string to an ArrayBuffer.
     */
    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Clears the cached encryption key.
     * Call this on logout to ensure old encrypted data can't be decrypted.
     */
    clearKey(): void {
        this.key = null;
        this.keyPromise = null;
    }
}
