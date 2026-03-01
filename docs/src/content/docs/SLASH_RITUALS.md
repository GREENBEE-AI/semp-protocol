---
title: Slash Rituals
---

# Slash Rituals

Slash rituals are structured checkpoints in the Ant-Digest v2 workflow. Each ritual maps to one or more ANTROUTE steps and produces a specific, traceable output. They are called "rituals" because they must be performed in order, every time, without shortcuts.

## /crumbs — Read the Trail

**When:** Before any work begins. First action in every session.
**ANTROUTE step:** Pre-step (before `scope`)

**Actions:**
1. Read `CRUMBLOG.md` — understand all prior decisions
2. Read `GUARDRAILS.md` — load constraints into working memory
3. Read `CLAUDE.md` — load project conventions
4. Read `ANTROUTE.yaml` — confirm workflow steps

**Output:** Mental model of project state. No file changes.

**Abort if:** Any of the four files is missing or unreadable.

## /preflight — Classify the Change

**When:** After receiving a task, before planning.
**ANTROUTE step:** `scope`

**Actions:**
1. Write a scope statement: what changes, what does not
2. Identify all context sources needed (Plane A, B, or C)
3. Check if any new dataflows are introduced
4. Flag any Plane C assumptions that need verification

**Output:** Scope statement written to the conversation (not a file).

**Template:**
```
SCOPE: [one-line description]
IN:    [what changes]
OUT:   [what does not change]
SOURCES: [Plane A: files | Plane B: URLs/tools | Plane C: assumptions]
NEW DATAFLOWS: [yes/no — if yes, classify per CONTEXT_PLANES.md]
RISK: [any Plane C items that must be verified]
```

## /plan — Design Before Building

**When:** After scope is confirmed, before implementation.
**ANTROUTE step:** `plan`

**Actions:**
1. List files to create, modify, or delete
2. Describe the approach with trade-offs
3. Identify which subagents are needed (per SUBAGENTS.md)
4. Run MCP policy gate (per MCP_POLICY.md) if tools are needed
5. Check for conflicting CRUMBLOG entries

**Output:** Plan documented in conversation or plan file.

**Abort if:** Conflicting crumbs found without resolution path.

## /verify — Prove It Works

**When:** After implementation is complete.
**ANTROUTE step:** `verify`

**Actions:**
1. Run `npm run check` — TypeScript type checking must pass
2. Run `npm run build` — Vite + esbuild build must succeed
3. If UI changes: confirm pages load and function at http://localhost:5000
4. Check that no unintended files were modified
5. Verify all Plane C assumptions were promoted to A or B

**Output:** Build log + test results. Pass/fail determination.

**Abort if:** Type check fails, build fails, or unpromoted Plane C items remain.

## /guard — Enforce the Rails

**When:** After verification passes, before documenting.
**ANTROUTE step:** `guard`

**Actions:**
1. Review all changes against every rule in `GUARDRAILS.md`
2. Check for PII in code, comments, sample data
3. Check for secrets or connection strings
4. Check for swallowed exceptions
5. Check that Zod validation is used on all API inputs
6. Verify signal strength stays in [0, 1] range
7. Check i18n keys exist in both en/ and de/ locales
8. If a GUARDRAIL is violated: stop, fix, re-verify

**Output:** Compliance confirmation or violation report.

**Abort if:** Any GUARDRAIL violation cannot be resolved.

## /federate — Import External Context

**When:** When external information is needed at any step.
**ANTROUTE step:** `federate` (new in v2)

**Actions:**
1. Identify the external source (URL, MCP tool, documentation)
2. Check source against `MCP_POLICY.md` allowed list
3. Fetch the information
4. Classify the result as Plane B
5. Log the source, query, and date
6. If the external info contradicts Plane A: flag conflict in CRUMBLOG

**Output:** Classified Plane B content with source attribution.

**Abort if:** Source is not in the MCP policy allowed list, or data classification is unclear.

## Ritual Sequence for a Typical Change

```
/crumbs          → Load context
/preflight       → Scope the change
/federate        → (if needed) Gather external context
/plan            → Design the approach
  implement      → Write the code
/verify          → npm run check + npm run build
/guard           → Check constraints
  update         → Write CRUMBLOG entry
```

The `implement` and `update` steps are actions, not rituals — they do not have their own slash command because they are the work itself, not checkpoints around the work.
