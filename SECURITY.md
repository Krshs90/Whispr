# Security Policy

## Supported Versions

Please check the table below to see which versions of Whispr are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| v1.0.x  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Security is a top priority for Whispr. We appreciate your efforts to responsibly disclose any vulnerabilities you discover.

If you discover a security vulnerability within Whispr, please **do not open a public issue**. Instead, follow these steps:

1. Send an email to the repository owner or use the private "Report a Vulnerability" feature on the GitHub Security tab if enabled.
2. Include a detailed description of the vulnerability, including steps to reproduce it.
3. We will acknowledge receipt of your vulnerability report within 48 hours and strive to send you regular updates about our progress.
4. If a vulnerability is confirmed, we will release a patch as quickly as possible and credit you in the release notes.

## Security Practices

* **Dependency Scanning:** We use GitHub Dependabot to automatically scan and update vulnerable dependencies.
* **Secret Scanning:** Our CI pipeline automatically scans PRs and commits for accidental inclusion of hardcoded secrets, API keys, or private environment variables.
* **No Telemetry:** Whispr is designed to run 100% locally. We do not track or store any user data off-device.
