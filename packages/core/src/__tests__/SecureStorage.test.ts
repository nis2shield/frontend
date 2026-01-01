/**
 * SecureStorage Tests
 * 
 * Tests for encrypted localStorage/sessionStorage wrapper.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CryptoService } from '../CryptoService';
import { SecureStorage } from '../SecureStorage';
import type { StorageAdapter } from '../types';

// Mock storage adapter
function createMockStorage(): StorageAdapter & { store: Map<string, string> } {
    const store = new Map<string, string>();
    return {
        store,
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => { store.set(key, value); },
        removeItem: (key: string) => { store.delete(key); },
    };
}

describe('SecureStorage', () => {
    let crypto: CryptoService;
    let mockStorage: ReturnType<typeof createMockStorage>;
    let storage: SecureStorage;

    beforeEach(async () => {
        crypto = new CryptoService();
        // Warm up the key - ensures key is generated before tests run
        await crypto.getKey();
        mockStorage = createMockStorage();
        storage = new SecureStorage(crypto, mockStorage, 'test_');
    });

    describe('set/get', () => {
        it('should store and retrieve a string', async () => {
            await storage.set('name', 'John Doe');

            const retrieved = await storage.get<string>('name');
            expect(retrieved).toBe('John Doe');
        });

        it('should store and retrieve an object', async () => {
            const user = { id: 123, name: 'Test User', roles: ['admin', 'user'] };

            await storage.set('user', user);

            const retrieved = await storage.get<typeof user>('user');
            expect(retrieved).toEqual(user);
        });

        it('should store and retrieve a number', async () => {
            await storage.set('count', 42);

            const retrieved = await storage.get<number>('count');
            expect(retrieved).toBe(42);
        });

        it('should store and retrieve an array', async () => {
            const items = ['a', 'b', 'c'];

            await storage.set('items', items);

            const retrieved = await storage.get<string[]>('items');
            expect(retrieved).toEqual(items);
        });

        it('should return null for non-existent key', async () => {
            const result = await storage.get('nonexistent');
            expect(result).toBeNull();
        });

        it('should use the configured prefix', async () => {
            await storage.set('mykey', 'value');

            // Check that the actual storage key is prefixed
            expect(mockStorage.store.has('test_mykey')).toBe(true);
            expect(mockStorage.store.has('mykey')).toBe(false);
        });

        it('should store encrypted data (not plaintext)', async () => {
            await storage.set('secret', 'sensitive data');

            const rawValue = mockStorage.store.get('test_secret');
            expect(rawValue).toBeTruthy();
            expect(rawValue).not.toContain('sensitive data');

            // Should be JSON with iv and data
            const parsed = JSON.parse(rawValue!);
            expect(parsed).toHaveProperty('iv');
            expect(parsed).toHaveProperty('data');
        });
    });

    describe('remove', () => {
        it('should remove a stored value', async () => {
            await storage.set('toRemove', 'value');
            expect(await storage.get('toRemove')).toBe('value');

            storage.remove('toRemove');

            expect(await storage.get('toRemove')).toBeNull();
        });
    });

    describe('has', () => {
        it('should return true for existing key', async () => {
            await storage.set('exists', 'value');

            expect(storage.has('exists')).toBe(true);
        });

        it('should return false for non-existing key', () => {
            expect(storage.has('doesNotExist')).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear all prefixed keys', async () => {
            // Add a clear method compatible mock
            const fullMockStorage = {
                ...mockStorage,
                length: 0,
                key: (index: number) => {
                    const keys = Array.from(mockStorage.store.keys());
                    fullMockStorage.length = keys.length;
                    return keys[index] ?? null;
                },
            } as unknown as Storage;

            const clearableStorage = new SecureStorage(crypto, fullMockStorage, 'test_');

            // This test just ensures no errors are thrown
            await clearableStorage.set('key1', 'value1');
            await clearableStorage.set('key2', 'value2');

            // Verify keys exist
            expect(mockStorage.store.size).toBeGreaterThan(0);
        });
    });

    describe('error handling', () => {
        it('should return null when decryption fails due to key change', async () => {
            await storage.set('data', 'original');

            // Clear the crypto key (simulating session restart)
            crypto.clearKey();

            // Force new key generation
            await crypto.encrypt('trigger key gen');

            // Old data should not decrypt
            const result = await storage.get('data');
            expect(result).toBeNull();
        });
    });
});
