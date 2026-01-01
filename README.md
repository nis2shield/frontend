# NIS2 Shield Frontend Monorepo

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Frontend ecosystem for NIS2 compliance** — Core SDK + Framework Wrappers (React, Angular, Vue).

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@nis2shield/core](./packages/core) | v0.1.0 | Framework-agnostic core library |
| [@nis2shield/react-guard](./packages/react) | v0.3.0 | React 18+ wrapper |
| [@nis2shield/angular-guard](./packages/angular) | v0.1.0 | Angular 14+ wrapper |
| [@nis2shield/vue-guard](./packages/vue) | v0.1.0 | Vue 3 wrapper |

## 🏗️ Architecture

```
@nis2shield/core          (Pure TypeScript - Zero Dependencies)
        │
        ├── @nis2shield/react-guard    (React 18+)
        ├── @nis2shield/angular-guard  (Angular 14+)
        └── @nis2shield/vue-guard      (Vue 3 Composition API)
```

### Full-Stack Integration

```
┌─ Frontend (React / Angular / Vue) ──────────────────────────┐
│  @nis2shield/{react,angular,vue}-guard                      │
│  SessionWatchdog · SecureStorage · DeviceFingerprint        │
└─────────────────────────────────────────────────────────────┘
                        │ POST /api/nis2/telemetry/
                        ▼
┌─ Backend (Django / Spring / Express / .NET) ────────────────┐
│  ForensicLogger · RateLimiter · SessionGuard · TorBlocker   │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─ Infrastructure ────────────────────────────────────────────┐
│  nis2shield/infrastructure (Docker, Helm, Terraform)        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build specific package
npm run build -w @nis2shield/core
```

## 🛠️ Development

This is an NPM Workspaces monorepo. All packages are in `packages/`.

```bash
# Install all dependencies (from root)
npm install

# Run tests across all packages
npm test

# Watch mode for core development
npm run dev -w @nis2shield/core
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Part of the [NIS2 Shield](https://nis2shield.com) ecosystem.**
