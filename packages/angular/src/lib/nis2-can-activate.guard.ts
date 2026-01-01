/**
 * @nis2shield/angular-guard - Nis2CanActivateGuard
 * 
 * Route guard that prevents navigation when the session is idle.
 */

import { Injectable, Inject } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Nis2Service } from './nis2.service';
import { NIS2_CONFIG, Nis2Config } from './nis2.config';

/**
 * Route guard that blocks navigation when the user session is idle.
 * 
 * @example
 * ```typescript
 * // In your routes configuration
 * const routes: Routes = [
 *   {
 *     path: 'dashboard',
 *     component: DashboardComponent,
 *     canActivate: [Nis2CanActivateGuard]
 *   }
 * ];
 * ```
 */
@Injectable()
export class Nis2CanActivateGuard implements CanActivate, CanActivateChild {
    constructor(
        private nis2Service: Nis2Service,
        private router: Router,
        @Inject(NIS2_CONFIG) private config: Nis2Config
    ) { }

    canActivate(): Observable<boolean | UrlTree> {
        return this.checkSession();
    }

    canActivateChild(): Observable<boolean | UrlTree> {
        return this.checkSession();
    }

    private checkSession(): Observable<boolean | UrlTree> {
        return this.nis2Service.isIdle$.pipe(
            take(1),
            map(isIdle => {
                if (isIdle) {
                    if (this.config.debug) {
                        console.log('[NIS2 Guard] Session idle, blocking navigation');
                    }

                    // Log the blocked navigation
                    this.nis2Service.logWarning('NAVIGATION_BLOCKED_IDLE');

                    // Redirect to logout or login page
                    return this.router.createUrlTree(['/logout'], {
                        queryParams: { reason: 'idle' },
                    });
                }
                return true;
            })
        );
    }
}
