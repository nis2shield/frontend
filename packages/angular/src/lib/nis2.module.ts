/**
 * @nis2shield/angular-guard - Nis2Module
 * 
 * Angular module that provides NIS2 Shield functionality.
 */

import { NgModule, ModuleWithProviders } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NIS2_CONFIG, Nis2Config } from './nis2.config';
import { Nis2Service } from './nis2.service';
import { Nis2Interceptor } from './nis2.interceptor';
import { Nis2CanActivateGuard } from './nis2-can-activate.guard';

/**
 * Angular module for NIS2 Shield integration.
 * 
 * Use `Nis2Module.forRoot(config)` in your root AppModule to configure.
 * 
 * @example
 * ```typescript
 * import { Nis2Module } from '@nis2shield/angular-guard';
 * 
 * @NgModule({
 *   imports: [
 *     Nis2Module.forRoot({
 *       auditEndpoint: '/api/nis2/telemetry/',
 *       idleTimeoutMinutes: 15,
 *       debug: !environment.production
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@NgModule({})
export class Nis2Module {
    /**
     * Configure NIS2 Shield for the application root.
     * Call this once in your AppModule.
     * 
     * @param config - NIS2 Shield configuration
     */
    static forRoot(config: Nis2Config): ModuleWithProviders<Nis2Module> {
        return {
            ngModule: Nis2Module,
            providers: [
                { provide: NIS2_CONFIG, useValue: config },
                Nis2Service,
                Nis2CanActivateGuard,
                {
                    provide: HTTP_INTERCEPTORS,
                    useClass: Nis2Interceptor,
                    multi: true,
                },
            ],
        };
    }
}
