# @nis2shield/angular-guard

[![npm version](https://badge.fury.io/js/@nis2shield%2Fangular-guard.svg)](https://badge.fury.io/js/@nis2shield%2Fangular-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-16%2B-red.svg)](https://angular.io/)

**Enterprise-grade Angular wrapper for NIS2 compliance — Session Guard, Secure Storage, and Security Telemetry.**

## Why this package?

Companies subject to the **NIS2 Directive** require strict session management and audit logs. This library provides:

1. **Automatic session termination** (Idle Timer) - `Nis2Service.isIdle$`
2. **Route protection** - `Nis2CanActivateGuard` blocks navigation when idle
3. **HTTP security headers** - `Nis2Interceptor` adds `X-NIS2-*` headers
4. **Encrypted local storage** (AES-256) - `getSecureStorage()`
5. **Device fingerprinting** - Session hijacking detection

## Part of the NIS2 Shield Ecosystem

- **Backend**: [django-nis2-shield](https://pypi.org/project/django-nis2-shield/), [nis2-spring-shield](https://search.maven.org/artifact/com.nis2shield/nis2-spring-shield)
- **Core SDK**: [@nis2shield/core](../core) (dependency)
- **Vue**: [@nis2shield/vue-guard](../vue)
- **Infrastructure**: [nis2shield/infrastructure](https://github.com/nis2shield/infrastructure)

## Features

- 🛡️ **Nis2Service** — RxJS observables for session state (`isIdle$`, `warning$`)
- 🔒 **Nis2CanActivateGuard** — Route protection for idle sessions
- 📡 **Nis2Interceptor** — Automatic security headers on HTTP requests
- 💾 **SecureStorage** — Encrypted localStorage via Core SDK
- ⚡ **NgZone optimized** — Timers run outside Angular for performance

```typescript
// app.module.ts
import { Nis2Module } from '@nis2shield/angular-guard';

@NgModule({
  imports: [
    Nis2Module.forRoot({
      auditEndpoint: '/api/nis2/telemetry/',
      idleTimeoutMinutes: 15,
      debug: !environment.production
    })
  ]
})
export class AppModule {}
```

### 2. Use the Service

```typescript
// app.component.ts
import { Component } from '@angular/core';
import { Nis2Service } from '@nis2shield/angular-guard';

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="warning$ | async as seconds">
      ⚠️ Session expires in {{ seconds }} seconds
    </div>
  `
})
export class AppComponent {
  warning$ = this.nis2.warning$;

  constructor(private nis2: Nis2Service) {
    this.nis2.isIdle$.subscribe(isIdle => {
      if (isIdle) {
        window.location.href = '/logout?reason=idle';
      }
    });
  }
}
```

### 3. Protect Routes

```typescript
// app-routing.module.ts
import { Nis2CanActivateGuard } from '@nis2shield/angular-guard';

const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [Nis2CanActivateGuard]
  }
];
```

### 4. Use Secure Storage

```typescript
export class ProfileComponent implements OnInit {
  constructor(private nis2: Nis2Service) {}

  async ngOnInit() {
    const storage = this.nis2.getSecureStorage();
    
    // Store encrypted data
    await storage.set('user_iban', 'IT60X0542811101000000123456');
    
    // Retrieve and decrypt
    const iban = await storage.get<string>('user_iban');
  }
}
```

### 5. Log Security Events

```typescript
async onHighValueTransaction(amount: number) {
  if (amount > 10000) {
    await this.nis2.logWarning('HIGH_VALUE_TRANSACTION', { 
      amount, 
      currency: 'EUR' 
    });
  }
}
```

## API Reference

### Nis2Service

| Property/Method | Type | Description |
|----------------|------|-------------|
| `isIdle$` | `Observable<boolean>` | Emits when user becomes idle |
| `isActive$` | `Observable<boolean>` | Emits when user becomes active |
| `warning$` | `Observable<number \| null>` | Seconds before timeout |
| `resetIdleTimer()` | `void` | Reset the idle countdown |
| `getTimeRemaining()` | `number` | Milliseconds until idle |
| `getFingerprint()` | `DeviceFingerprint` | Current device fingerprint |
| `getSecureStorage()` | `SecureStorage` | Encrypted storage instance |
| `logWarning()` | `Promise<void>` | Log warning event |
| `logCritical()` | `Promise<void>` | Log critical event |

### Configuration Options

```typescript
interface Nis2Config {
  auditEndpoint: string;      // Required
  idleTimeoutMinutes?: number; // Default: 15
  enableWarning?: boolean;     // Default: true
  debug?: boolean;             // Default: false
  headers?: Record<string, string>;
}
```

## NIS2 Compliance

| Feature | NIS2 Article |
|---------|--------------|
| Session timeout | Art. 21.2.h |
| Encrypted storage | Art. 21.2.j |
| Device fingerprinting | Art. 21.2.g |
| Incident reporting | Art. 23 |

## License

MIT License - see [LICENSE](../../LICENSE) for details.

---

**Part of the [NIS2 Shield](https://nis2shield.com) ecosystem.**
