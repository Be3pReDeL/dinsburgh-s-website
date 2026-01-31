# AGENTS.md

## Purpose
- Project-specific guidance for Codex in this repo.
- Full system rules live in `agent/rules/system-rules.md` and should be respected.

## Goals
- Production-ready, fast, accessible, SEO-friendly site.
- Clean architecture, modular code, minimal duplication.
- Responsive layout (mobile-first) with meaningful content.

## Stack & Dependencies
- Follow existing stack and patterns found in the repo.
- Do not introduce new frameworks/libraries unless necessary and explicitly justified.
- If unsure, inspect `package.json` and existing code for conventions.

## UI/UX & Content
- Use semantic HTML and accessible components (focus states, labels, aria as needed).
- Avoid placeholder text; write concise, meaningful copy.
- Keep typography and spacing consistent; use a simple scale.

## Performance
- Minimize JS and heavy assets.
- Optimize images (proper sizing, lazy-load below the fold).
- Prevent layout shifts by fixing media dimensions.

## Workflow
- Prefer small, readable changes over large rewrites.
- After significant changes, run available checks (lint/build/tests) if present.
- Update docs/README when new scripts or workflows are introduced.

## Commands
- Check `package.json` for scripts.
- Common defaults (if present): `npm run dev`, `npm run build`, `npm run lint`, `npm run test`.
