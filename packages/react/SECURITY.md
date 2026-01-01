# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within React NIS2 Guard, please follow these steps:

1. **Do NOT** create a public GitHub issue
2. **Email** the security team at: fabrizio.di.priamo@gmail.com
3. **Include** in your report:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution Target**: Within 30 days (depending on severity)

## Security Best Practices

When using this library:

1. **Always use HTTPS** for the `auditEndpoint`
2. **Validate backend responses** - don't trust client-side security alone
3. **Keep dependencies updated** - run `npm audit` regularly
4. **Use Content Security Policy** headers in your application

## Scope

This security policy covers:

- The `@nis2shield/react-guard` npm package
- Security issues in the library code itself

Out of scope:

- Issues in your application code
- Third-party dependencies (report to their maintainers)

## Recognition

We appreciate responsible disclosure and will acknowledge security researchers in our release notes (with permission).

---

Part of the [NIS2 Shield](https://nis2shield.com) ecosystem.
