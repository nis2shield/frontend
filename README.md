# NIS2 Shield Frontend Monorepo

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Frontend ecosystem for NIS2 compliance** — Core SDK + Framework Wrappers (React, Angular, Vue).

## 📦 Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@nis2shield/core](./packages/core) | v0.1.0 | Framework-agnostic core library |
| [@nis2shield/angular-guard](./packages/angular) | 🚧 WIP | Angular wrapper |
| [@nis2shield/vue-guard](./packages/vue) | 🚧 WIP | Vue 3 wrapper |

## 🏗️ Architecture

```
@nis2shield/core          (Pure TypeScript - Zero Dependencies)
        │
        ├── @nis2shield/react-guard    (Existing package)
        ├── @nis2shield/angular-guard  (Coming soon)
        └── @nis2shield/vue-guard      (Coming soon)
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
