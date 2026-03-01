---
title: Federated Content
---

# Federated Content

Federated content is any information imported from outside this repository. This document defines how to classify, validate, and integrate external context into the Ant-Digest workflow.

## Why Federate?

AI-assisted development often pulls in external knowledge: library docs, API references, Stack Overflow answers, MCP tool outputs, or prior session context. Without classification, external claims silently become "facts" that drive implementation — leading to hallucinated APIs, outdated patterns, and untraceable decisions.

Federation makes external context explicit, classified, and auditable.

## Classification Process

When importing external content, follow these steps:

### Step 1: Identify the Source

| Source Type | Plane | Trust |
|-------------|-------|-------|
| Official library documentation (fetched live) | B | Medium |
| MCP tool output (Context7, Greptile, etc.) | B | Medium |
| Web search result | B | Medium — verify recency |
| Prior session context / memory | C | Low — re-verify |
| LLM general knowledge | C | Low — verify before use |
| User-provided specification | B | Medium — treat as requirements |
| This repo's own files | A | High |

### Step 2: Tag the Content

Every piece of federated content must carry these tags in CRUMBLOG or inline:

```
SOURCE:{origin}
PLANE:{A|B|C}
DATE:{when fetched}
CONF:{high|medium|low}
RISK:{description if Plane C, or "none"}
```

### Step 3: Validate Before Use

| Plane | Validation Required |
|-------|---------------------|
| A | Already verified (in-repo) |
| B | Cross-reference with repo state. Does the external claim match what the code actually does? |
| C | Must be promoted to A or B before implementation. Find the source or verify in-repo. |

### Step 4: Integrate

Once validated:
- Use the content in planning or implementation
- Record the source in the CRUMBLOG entry for the decision it informs
- If the content later proves incorrect, add a correction entry with `RISK:stale-external-ref`

## Common Federation Scenarios

### Scenario: Using a library feature you are not sure exists

1. **Before:** `PLANE:C` — "I think React TanStack Query supports X"
2. **Federate:** Use Context7 or web search to find documentation
3. **After:** `PLANE:B` — "TanStack Query docs confirm X" + SOURCE URL
4. **Implement:** Write code using the confirmed feature
5. **Verify:** `npm run check` + `npm run build` confirms it works → `PLANE:A`

### Scenario: Adding a new SEMP event type based on research

1. **Before:** `PLANE:C` — "Stigmergy literature suggests event type Z"
2. **Federate:** Fetch research paper or documentation
3. **After:** `PLANE:B` — "Paper confirms pattern Z" + SOURCE URL
4. **Verify in-repo:** Check if existing signal engine supports it per `server/routes.ts`
5. **If compatible:** Promote to `PLANE:A` with file references, implement

### Scenario: MCP tool returns unexpected data

1. **Receive:** MCP tool output tagged `PLANE:B`
2. **Validate:** Does output match repo state? Check key claims against actual files.
3. **If mismatch:** Log as `RISK:mcp-mismatch` in CRUMBLOG. Prefer Plane A (repo) over Plane B (tool output).

## Source List Template

For any change that involves external context, include a source list in the `/preflight` scope statement:

```
FEDERATED SOURCES:
- [B] Context7: React TanStack Query docs (fetched 2026-02-04)
- [B] GitHub issue #42: discussion of signal decay approach (URL)
- [C] Assumption: WebSocket reconnection is handled by browser (RISK: verify behavior)
```

## Stale Content

External content has a shelf life:

| Source Type | Considered Stale After |
|-------------|----------------------|
| Library docs (major version match) | 6 months |
| Web search results | 1 month |
| MCP tool output | Same session only |
| Prior session context | Always stale — re-verify |

When using stale content, add `RISK:stale-source` and re-fetch if possible.
