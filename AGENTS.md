<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Mandatory: Project Context & Development Log

**Before writing ANY code**, read `CONTEXT.md` in the project root. It contains:
- Complete architecture, database schema, and business rules
- Known gotchas and constraints
- A **Development Log** that tracks every change ever made

**After making ANY code change** (no matter how small), you MUST:
1. Append a new entry to the `## Development Log` section in `CONTEXT.md`
2. Use the format: `### YYYY-MM-DD HH:MM — [Summary]` followed by bullet points describing what changed
3. Include: files modified, why, and any new constraints or decisions made
4. Commit `CONTEXT.md` together with your code changes

This is non-negotiable. The log ensures continuity across devices, agents, and sessions.
