# Contributing — Steal Your Stats

This doc defines the workflow and verification steps for working on this repo.  
It applies to both human contributors and Cursor agents.

---

## Setup

```bash

# Create a new branch per slice:
git checkout -b feat/<slice-kebab>

# Install dependencies
pnpm install

# Run local dev server
pnpm dev

# Run unit tests
pnpm test

# Lint & typecheck
pnpm lint
pnpm typecheck

# commit template
# feat: task <##> <short title>

# - What changed (bullet list)
# - Verification steps run
# - Any risks/next steps






