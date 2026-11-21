# Illustrative frontend feature layout

Use this as a placement example for an authorized workflow, not a scaffold. Names and behavior below are fictional; no feature or endpoint is implied. Add only the files the actual work needs. Follow [naming and ownership](../references/ownership.md), the owning feature contract and the current code.

```text
apps/web/src/features/<workflow>/
  <workflow>-screen.tsx       # workflow composition, if needed
  <component>.tsx             # workflow-specific interaction, if needed
  use-<purpose>.ts            # coherent owned behavior, if needed
  <operation>.ts              # feature-specific HTTP operation, if needed
  <component>.test.tsx        # focused behavior check, when justified
  public.ts                   # explicit cross-feature interface, if a consumer needs it
```

Good: a fictional cashier workflow keeps `order-summary.tsx`, `use-order-draft.ts` and `submit-order.ts` together when each has a real responsibility; `SubmitOrderInput` can live in `submit-order.ts`. An app route consumes its screen. If another feature needs a supported capability, the owner explicitly exports it from `public.ts` and the consumer imports through that interface.

Avoid: creating all these files for a simple screen; placing a cashier-specific component in shared UI; importing another feature's private component; or copying a server persistence type into frontend code. Shared UI and transport are separate owners, added only for actual common needs.
