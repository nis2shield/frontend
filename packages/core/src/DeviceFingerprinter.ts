/**
 * @nis2shield/core - DeviceFingerprinter
 * 
 * Passive device fingerprint collection for session hijacking detection.
 * Collects hardware and browser characteristics without user interaction.
 * 
 * @example
 * ```typescript
 * const fingerprinter = new DeviceFingerprinter();
 * 
 * const fingerprint = await fingerprinter.collect();
 * console.log(fingerprint.canvasHash); // SHA-256 hash
 * 
 * // Compare with stored fingerprint
 * const result = fingerprinter.compare(fingerprint, storedFingerprint);
 * if (result.similarity < 0.8) {
 *   console.warn('Possible session hijacking!', result.mismatches);
 * }
 * ```
 */

import { CryptoService } from './CryptoService';
import type { DeviceFingerprint, FingerprintComparisonResult } from './types';

/**
 * Collects and compares device fingerprints for session validation.
 * Implements NIS2 Art. 21.2.g incident detection capabilities.
 */
export class DeviceFingerprinter {
    private crypto: CryptoService;

    constructor(crypto?: CryptoService) {
        this.crypto = crypto ?? new CryptoService();
    }

    /**
     * Collect all device fingerprint data.
     */
    async collect(): Promise<DeviceFingerprint> {
        const canvasHash = await this.getCanvasFingerprint();
        const webglInfo = this.getWebGLInfo();

        return {
            screenResolution: `${screen.width}x${screen.height}`,
            colorDepth: screen.colorDepth,
            timezoneOffset: new Date().getTimezoneOffset(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            languages: [...navigator.languages],
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
            deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
            touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            canvasHash,
            webglRenderer: webglInfo.renderer,
            webglVendor: webglInfo.vendor,
            collectedAt: new Date().toISOString(),
        };
    }

    /**
     * Compare two fingerprints and return similarity score.
     * 
     * @param current - Current device fingerprint
     * @param previous - Previously stored fingerprint
     * @returns Similarity score (0-1) and list of mismatched fields
     */
    compare(current: DeviceFingerprint, previous: DeviceFingerprint): FingerprintComparisonResult {
        const fieldsToCompare: (keyof DeviceFingerprint)[] = [
            'screenResolution',
            'colorDepth',
            'timezone',
            'language',
            'platform',
            'hardwareConcurrency',
            'canvasHash',
            'webglRenderer',
        ];

        const mismatches: string[] = [];
        let matches = 0;

        for (const field of fieldsToCompare) {
            if (current[field] === previous[field]) {
                matches++;
            } else {
                mismatches.push(field);
            }
        }

        return {
            similarity: matches / fieldsToCompare.length,
            mismatches,
        };
    }

    /**
     * Generate a canvas fingerprint hash.
     * Different browsers/GPUs render slightly differently, creating a unique signature.
     */
    private async getCanvasFingerprint(): Promise<string | null> {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 50;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            // Draw text with specific font
            ctx.textBaseline = 'top';
            ctx.font = "14px 'Arial'";
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText('NIS2 Shield', 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText('Canvas FP', 4, 17);

            // Get data URL and hash it
            const dataUrl = canvas.toDataURL();
            return await this.crypto.sha256(dataUrl);
        } catch {
            return null;
        }
    }

    /**
     * Get WebGL renderer information.
     * Useful for detecting GPU and driver details.
     */
    private getWebGLInfo(): { renderer: string | null; vendor: string | null } {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) return { renderer: null, vendor: null };

            const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
            if (!debugInfo) return { renderer: null, vendor: null };

            return {
                renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
                vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
            };
        } catch {
            return { renderer: null, vendor: null };
        }
    }
}
