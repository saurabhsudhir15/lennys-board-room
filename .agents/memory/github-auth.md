---
name: GitHub remote authentication
description: Embedded credentials can bypass working managed Git authentication.
---

Use a credential-free HTTPS GitHub remote with Replit’s managed authentication.

**Why:** An embedded credential in the remote caused askpass/password failures even though a dry-run push to the same repository's clean HTTPS URL succeeded.

**How to apply:** When sync reports an authentication failure, compare a dry-run against the clean URL before requesting account reconnection. Never print remote credentials during diagnostics.
