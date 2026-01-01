/**
 * @nis2shield/vue-guard - Plugin
 * 
 * Vue 3 plugin for NIS2 Shield integration.
 */

import type { App, Plugin } from 'vue';
import {
    SessionGuardian,
    TelemetryReporter,
    CryptoService,
    SecureStorage,
    DeviceFingerprinter,
} from '@nis2shield/core';
import { NIS2_KEY, type Nis2Config, type Nis2Instance } from './config';

/**
 * Create the NIS2 Shield Vue plugin.
 * 
 * @example
 * ```typescript
 * import { createApp } from 'vue';
 * import { createNis2Plugin } from '@nis2shield/vue-guard';
 * 
 * const app = createApp(App);
 * 
 * app.use(createNis2Plugin({
 *   auditEndpoint: '/api/nis2/telemetry/',
 *   idleTimeoutMinutes: 15
 * }));
 * 
 * app.mount('#app');
 * ```
 */
export function createNis2Plugin(config: Nis2Config): Plugin {
    return {
        install(app: App) {
            // Initialize core services
            const crypto = new CryptoService();
            const fingerprinter = new DeviceFingerprinter(crypto);
            const reporter = new TelemetryReporter({
                endpoint: config.auditEndpoint,
                debug: config.debug,
                headers: config.headers,
            });
            const storage = new SecureStorage(
                crypto,
                typeof window !== 'undefined' ? localStorage : ({} as Storage),
                'nis2_'
            );
            const guardian = new SessionGuardian({
                idleTimeoutMinutes: config.idleTimeoutMinutes ?? 15,
                debug: config.debug,
            });

            // Create instance
            const instance: Nis2Instance = {
                guardian,
                reporter,
                crypto,
                storage,
                fingerprinter,
                config,
            };

            // Provide to all components
            app.provide(NIS2_KEY, instance);

            // Start session monitoring
            guardian.start();

            if (config.debug) {
                console.log('[NIS2 Vue] Plugin installed', config);
            }

            // Cleanup on unmount (for SSR safety)
            app.config.globalProperties.$nis2 = instance;
        },
    };
}
