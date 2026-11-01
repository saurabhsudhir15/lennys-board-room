---
name: Dependency lockfile ownership
description: Keep the frontend's Bun dependency resolution separate from the root pnpm workspace.
---

Keep one authoritative lockfile per dependency tree: Bun for the board frontend, pnpm for the root workspace, and uv for Python. Do not reintroduce an npm lockfile in the frontend.

**Why:** The frontend production build uses Bun; parallel npm and Bun lockfiles had diverged and retained different vulnerable versions.

**How to apply:** Update each dependency tree with its own package manager and verify frozen installs after security updates.
