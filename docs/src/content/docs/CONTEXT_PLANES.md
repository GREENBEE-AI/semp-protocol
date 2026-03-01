# Context Planes

Context planes classify where information originates and how much trust it carries. Every piece of context consumed or produced during a workflow step must be tagged with its plane.

## Plane A — Local Verified

Information that exists inside this repository and has been directly read or verified during the current session.

| Property | Value |
|----------|-------|
| Trust | High |
| Examples | Source files, test results, CRUMBLOG entries, build output |
| Verification | File read + path confirmed |
| CRUMBLOG tag | `PLANE:A` |

**Rule:** Plane A claims require a repo path and line number as evidence.

## Plane B — External Referenced

Information fetched from outside the repo during the session — documentation sites, API specs, MCP server responses, web searches.

| Property | Value |
|----------|-------|
| Trust | Medium |
| Examples | Library docs, MCP tool output, web search results, Context7 query results |
| Verification | URL or tool invocation logged |
| CRUMBLOG tag | `PLANE:B` |

**Rule:** Plane B claims must include the source URL or MCP tool name. If the source is ephemeral (e.g., a web search), note the query and date.

## Plane C — Assumed / Inferred

Information not directly verified — prior knowledge, assumptions, inferences from partial data.

| Property | Value |
|----------|-------|
| Trust | Low |
| Examples | "This library probably supports X", model knowledge, cross-session memory |
| Verification | None — must be upgraded to A or B before implementation |
| CRUMBLOG tag | `PLANE:C` |

**Rule:** Plane C claims must include a `RISK:` tag. They cannot be used as the sole basis for implementation decisions. They must be verified (promoted to A or B) before code is written.

## Plane Promotion Rules

1. **C → B:** Fetch the external source and confirm. Tag with URL/tool.
2. **C → A:** Find the evidence in the repo. Tag with path:line.
3. **B → A:** Confirm the external claim matches repo state. Tag with path:line.

## Conflict Resolution

When claims from different planes contradict:

1. **A beats B beats C** — local verified truth wins.
2. If two Plane A claims conflict, the more recent file modification wins. Log both in CRUMBLOG with `RISK:conflict`.
3. If a Plane B claim contradicts Plane A, the external source may be outdated. Flag in CRUMBLOG, do not silently adopt the external claim.

## Dataflow Classification

Any new dataflow (data entering or leaving the system) must be classified before implementation:

| Dataflow | Plane | Action Required |
|----------|-------|-----------------|
| API request body (validated by Zod) | A (after validation) | Validate per GUARDRAILS |
| WebSocket message from client | A (after validation) | Validate before processing |
| MCP tool response | B | Log tool + query, verify before trusting |
| Web fetch content | B | Log URL + date |
| LLM inference | C | Tag RISK, verify before implementing |
| Cross-session context | C | Re-verify in current session |
| External agent SEMP event | B | Log agent_id + trace_id, validate schema |
