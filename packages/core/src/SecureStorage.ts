/**
 * @nis2shield/core - SecureStorage
 * 
 * Encrypted storage wrapper for localStorage/sessionStorage.
 * All data is encrypted with AES-GCM before being stored.
 * 
 * @example
 * ```typescript
 * const crypto = new CryptoService();
 * const storage = new SecureStorage(crypto, localStorage);
 * 
 * // Store encrypted data
 * await storage.set('user_iban', 'IT60X0542811101000000123456');
 * 
 * // Retrieve and decrypt
 * const iban = await storage.get<string>('user_iban');
 * console.log(iban); // 'IT60X0542811101000000123456'
 * 
 * // Even if someone looks in localStorage, they see encrypted gibberish
 * ```
 */

import { CryptoService } from './CryptoService';
import type { StorageAdapter, EncryptedData } from './types';

/**
 * Encrypted key-value storage for sensitive data.
 * Implements NIS2 Art. 21.2.j cryptographic protection requirements.
 */
export class SecureStorage {
    private crypto: CryptoService;
    private storage: StorageAdapter;
    private prefix: string;

    /**
     * Create a new SecureStorage instance.
     * 
     * @param crypto - CryptoService instance for encryption/decryption
     * @param storage - Storage backend (localStorage, sessionStorage, or custom)
     * @param prefix - Optional prefix for all keys (default: 'nis2_')
     */
    constructor(crypto: CryptoService, storage: StorageAdapter, prefix: string = 'nis2_') {
        this.crypto = crypto;
        this.storage = storage;
        this.prefix = prefix;
    }

    /**
     * Store a value encrypted.
     * 
     * @param key - Storage key (will be prefixed)
     * @param value - Value to encrypt and store (will be JSON serialized)
     */
    async set<T>(key: string, value: T): Promise<void> {
        try {
            const jsonStr = JSON.stringify(value);
            const encrypted = await this.crypto.encrypt(jsonStr);
            this.storage.setItem(this.prefix + key, JSON.stringify(encrypted));
        } catch (error) {
            console.error('[NIS2 SecureStorage] Write error:', error);
            throw error;
        }
    }

    /**
     * Retrieve and decrypt a value.
     * 
     * @param key - Storage key (will be prefixed)
     * @returns The decrypted value, or null if not found or decryption fails
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const item = this.storage.getItem(this.prefix + key);
            if (!item) return null;

            const parsed: EncryptedData = JSON.parse(item);
            if (!parsed.data || !parsed.iv) return null;

            const decryptedJson = await this.crypto.decrypt(parsed);
            if (!decryptedJson) return null;

            return JSON.parse(decryptedJson) as T;
        } catch (error) {
            console.warn('[NIS2 SecureStorage] Read error:', error);
            return null;
        }
    }

    /**
     * Remove a value from storage.
     * 
     * @param key - Storage key (will be prefixed)
     */
    remove(key: string): void {
        this.storage.removeItem(this.prefix + key);
    }

    /**
     * Check if a key exists in storage.
     * 
     * @param key - Storage key (will be prefixed)
     */
    has(key: string): boolean {
        return this.storage.getItem(this.prefix + key) !== null;
    }

    /**
     * Clear all NIS2 prefixed keys from storage.
     * Useful for logout cleanup.
     */
    clear(): void {
        // For web storage, we need to iterate and find our prefixed keys
        if ('length' in this.storage && typeof (this.storage as Storage).key === 'function') {
            const storage = this.storage as Storage;
            const keysToRemove: string[] = [];

            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                if (key?.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => storage.removeItem(key));
        }
    }
}
