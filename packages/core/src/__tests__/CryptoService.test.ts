/**
 * CryptoService Tests
 * 
 * Tests for AES-GCM encryption/decryption and SHA-256 hashing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CryptoService } from '../CryptoService';

describe('CryptoService', () => {
    let crypto: CryptoService;

    beforeEach(async () => {
        crypto = new CryptoService();
        // Warm up the key - ensures key is generated before tests run
        await crypto.getKey();
    });

    describe('encrypt/decrypt', () => {
        it('should encrypt and decrypt a simple string', async () => {
            const plaintext = 'Hello, NIS2 Shield!';

            const encrypted = await crypto.encrypt(plaintext);

            expect(encrypted).toHaveProperty('iv');
            expect(encrypted).toHaveProperty('data');
            expect(encrypted.iv).toBeTruthy();
            expect(encrypted.data).toBeTruthy();

            const decrypted = await crypto.decrypt(encrypted);
            expect(decrypted).toBe(plaintext);
        });

        it('should encrypt and decrypt unicode characters', async () => {
            const plaintext = '🛡️ Protégé - Schutz - 保護';

            const encrypted = await crypto.encrypt(plaintext);
            const decrypted = await crypto.decrypt(encrypted);

            expect(decrypted).toBe(plaintext);
        });

        it('should encrypt and decrypt JSON objects', async () => {
            const obj = { user: 'test', iban: 'IT60X0542811101000000123456' };
            const plaintext = JSON.stringify(obj);

            const encrypted = await crypto.encrypt(plaintext);
            const decrypted = await crypto.decrypt(encrypted);

            expect(JSON.parse(decrypted!)).toEqual(obj);
        });

        it('should produce different ciphertexts for same plaintext (unique IV)', async () => {
            const plaintext = 'Same message';

            const encrypted1 = await crypto.encrypt(plaintext);
            const encrypted2 = await crypto.encrypt(plaintext);

            expect(encrypted1.iv).not.toBe(encrypted2.iv);
            expect(encrypted1.data).not.toBe(encrypted2.data);
        });

        it('should return null for corrupted ciphertext', async () => {
            const encrypted = await crypto.encrypt('test');
            encrypted.data = 'corrupted-base64-data';

            const decrypted = await crypto.decrypt(encrypted);
            expect(decrypted).toBeNull();
        });

        it('should return null for invalid IV', async () => {
            const encrypted = await crypto.encrypt('test');
            encrypted.iv = 'invalid-iv';

            const decrypted = await crypto.decrypt(encrypted);
            expect(decrypted).toBeNull();
        });
    });

    describe('sha256', () => {
        it('should produce a 64-character hex hash', async () => {
            const hash = await crypto.sha256('test input');

            expect(hash).toHaveLength(64);
            expect(hash).toMatch(/^[a-f0-9]+$/);
        });

        it('should produce consistent hashes for same input', async () => {
            const hash1 = await crypto.sha256('consistent');
            const hash2 = await crypto.sha256('consistent');

            expect(hash1).toBe(hash2);
        });

        it('should produce different hashes for different inputs', async () => {
            const hash1 = await crypto.sha256('input1');
            const hash2 = await crypto.sha256('input2');

            expect(hash1).not.toBe(hash2);
        });

        it('should handle empty string', async () => {
            const hash = await crypto.sha256('');

            expect(hash).toHaveLength(64);
            // Known SHA-256 of empty string
            expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
        });
    });

    describe('clearKey', () => {
        it('should prevent decryption after key is cleared', async () => {
            const plaintext = 'secret data';
            const encrypted = await crypto.encrypt(plaintext);

            // Clear the key
            crypto.clearKey();

            // Create new key by encrypting again
            await crypto.encrypt('new data');

            // Old encrypted data should not decrypt with new key
            const decrypted = await crypto.decrypt(encrypted);
            expect(decrypted).toBeNull();
        });
    });
});
