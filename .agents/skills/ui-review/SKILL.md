---
name: ui-review
description: Independently audit a new or materially changed ServiceLane POS screen against the shared UI Definition of Done. Use for a builder handoff or an explicit UI audit.
metadata:
  author: "Repository contributors"
  version: "1.0.0"
  project: "ServiceLane POS"
  scope: "Independent frontend UI review; feature and deployment authorization remain separate"
  created: "2026-11-20"
  updated: "2026-11-20"
  compatibility: "React, TypeScript, Vite and Ant Design; repository guidance and owning specifications required; guidance only, no runtime enforcement"
  short-description: "Independently review POS UI workflows"
---

# Independent UI review

Work as a separate, read-only reviewer. If you built the change, delegate the audit to a different agent. If independent review is unavailable, report the gate pending. An assigned reviewer performs the audit directly.

1. Identify the exact change, intended staff task, acceptance criteria, reference pattern, supported viewport and authorized browser target from the handoff. Follow the [frontend testing workflow](../../../docs/quality/frontend-testing.md) for safe targets and evidence.
2. Inspect the rendered result and independently exercise the staff task and relevant correction path. Compare observations with the [UI Definition of Done](../frontend-development/references/ui-definition-of-done.md). Reuse attributable evidence for supporting details and distinguish it from your observations. Flag any discrepancy.
3. Return the completed checklist with a verdict. Pass only when every applicable row has supporting evidence. For defects, report the staff impact, reproduction step and expected result. For missing evidence, identify what is blocked. Leave implementation fixes to the builder. After a fix, recheck the affected rows against the revised change before issuing a pass.
