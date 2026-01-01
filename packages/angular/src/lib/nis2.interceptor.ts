/**
 * @nis2shield/angular-guard - Nis2Interceptor
 * 
 * HTTP Interceptor that adds NIS2 security headers to outgoing requests.
 */

import { Injectable, Inject } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Nis2Service } from './nis2.service';
import { NIS2_CONFIG, Nis2Config } from './nis2.config';

const CLIENT_VERSION = '0.1.0';

/**
 * HTTP Interceptor that automatically adds NIS2 security headers.
 * 
 * Headers added:
 * - X-NIS2-Client-Version: Library version
 * - X-NIS2-Fingerprint: Device fingerprint hash (if available)
 * 
 * @example
 * ```typescript
 * // In your app.module.ts
 * import { HTTP_INTERCEPTORS } from '@angular/common/http';
 * import { Nis2Interceptor } from '@nis2shield/angular-guard';
 * 
 * @NgModule({
 *   providers: [
 *     { provide: HTTP_INTERCEPTORS, useClass: Nis2Interceptor, multi: true }
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Injectable()
export class Nis2Interceptor implements HttpInterceptor {
    constructor(
        private nis2Service: Nis2Service,
        @Inject(NIS2_CONFIG) private config: Nis2Config
    ) { }

    intercept(
        request: HttpRequest<unknown>,
        next: HttpHandler
    ): Observable<HttpEvent<unknown>> {
        // Get current fingerprint
        const fingerprint = this.nis2Service.getFingerprint();

        // Build headers
        const headers: Record<string, string> = {
            'X-NIS2-Client-Version': CLIENT_VERSION,
        };

        if (fingerprint?.canvasHash) {
            headers['X-NIS2-Fingerprint'] = fingerprint.canvasHash;
        }

        // Clone request with new headers
        const modifiedRequest = request.clone({
            setHeaders: headers,
        });

        if (this.config.debug) {
            console.log('[NIS2 Interceptor] Adding headers to request:', request.url, headers);
        }

        return next.handle(modifiedRequest);
    }
}
