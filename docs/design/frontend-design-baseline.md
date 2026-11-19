# Frontend design baseline — review draft

Status: proposed for review, 2026-11-01. This defines a candidate baseline, not approved product behavior or proof of accessibility. Desktop/POS and tablet are equal targets by user direction; exact devices, viewport sizes, operating systems and browsers remain unconfirmed. The [illustrative cashier layout](cashier-layout-review.html) uses fictional data and has no ordering, payment or API behavior. It is a visual review artifact, not a claim that a screen or backend endpoint exists.

## Outcome and phase boundary

Phase P0: agree enough visual and interaction direction for a first real cashier slice: token ownership, legible hierarchy, usable controls and responsive layout, with clear limits and review evidence. Without this, screens can adopt conflicting styles before their shared needs are understood. Use installed Ant Design and a small set of semantic choices rather than a new design system. Observable outcome: reviewers can inspect desktop and tablet layouts, understand what is configurable and identify missing states; implementation follows a separately scoped feature.

P1: a standalone component catalogue, arbitrary tenant theme editor, dark mode, custom icon set, translations and automatic RTL support. Reconsider each when an authorized workflow requires it; none is implied by a theme input. Physical device testing and accessibility conformance are acceptance work, not optional decoration.

## Tokens and brand ownership

- Ant Design's `ConfigProvider` is the primary source for component tokens; use its derived semantic tokens rather than maintaining a parallel color palette. The current [theme](../../apps/web/src/app/theme.ts) supplies a neutral product-default primary color, font and radius in code.
- Treat primary brand color and eventual display name/logo as candidate business inputs. Current code has only a code-configured color; it does not retrieve business settings. No admin editor, tenant theme store or branding API exists. A future external source needs an approved schema, trusted scope, validation, safe fallback and contrast checks before use. Do not accept arbitrary CSS or URLs without a defined policy.
- Semantic text, surface, border, focus, error, warning and success colors belong to the theme, not individual screens. A brand color is not automatically a safe text, focus or status color. Preserve readable contrast and never use color as the only signal.
- The current global [stylesheet](../../apps/web/src/styles.css) independently defines background and foreground colors. Align it with the chosen theme when implementing the first layout; the review artifact does not prove that it has been corrected. Avoid broad component overrides.

## Typography, spacing and layout

- Initial candidate: system sans-serif and Ant Design typography defaults. Use one clear page heading, labels and normal reading sizes; do not shrink prices, controls or errors to fit. Verify actual font rendering and text resize on target devices before selecting exact values.
- Candidate spacing rhythm: 4 px increments, with 8/16/24 px as common gaps and page padding. These are review starting points, not fixed tokens or a mandate to wrap every element. Prefer Ant Design spacing/tokens where they fit.
- Desktop and tablet receive equal attention. In the mockup, wide screens show a sidebar, catalogue and order side by side; a compact navigation rail appears at intermediate widths, and a narrower viewport stacks the order below the catalogue. Navigation and toggle indicators are nonfunctional illustrations; 1150 px and 800 px breakpoints are exploratory, not supported-device guarantees. Real checkout behavior, keyboard navigation, reach and scrolling must be evaluated on actual target devices.
- Avoid a hard-coded content width for every workflow. A cashier may need room for selection and order summary while forms may benefit from a narrower reading measure. Make prices and order totals visually distinct without obscuring their meaning.

## Components and interaction

- Use Ant Design forms, tables, buttons, dialogs and feedback directly as the default. Name repeated patterns when at least two actual uses share behavior; extract reusable UI only when it has a clear owner. The mockup intentionally does not implement these components.
- Candidate touch target: aim for at least 44 × 44 CSS px for primary cashier actions where practical; this is a design goal for review, not a claim of a legal requirement. Assess spacing and physical reach on actual devices. Keyboard focus must be visible; labels, errors and statuses must remain understandable without color. Test keyboard use, contrast, text resize and touch with the actual implementation.
- Define loading, empty, unavailable, validation, denied, success and conflict states when applicable. Confirm destructive or financial actions only when the approved workflow calls for it. A timeout does not establish a write outcome; recovery belongs to the endpoint contract and feature integration guide.

## Formatting and content

- Use business-configured currency and timezone from a validated source when available; format exact server-provided monetary values without introducing floating-point rounding or hardcoded PKR assumptions. The example uses placeholder amounts and does not calculate totals.
- Keep strings and layout adaptable to translation and longer text; no translation framework, supported language list or RTL behavior is selected. Language and locale are distinct from currency and timezone. Render untrusted names and instructions as text.

## Review and evidence

The mockup shows the proposed information hierarchy and sample desktop/tablet layout, not an approved order flow, complete component specification or production implementation. Review representative viewport sizes, then test actual keyboard and touch interactions, contrast and text resizing in the implemented workflow. Library choice, static source review and a browser screenshot alone do not establish WCAG conformance. See [W3C accessibility principles](https://www.w3.org/WAI/fundamentals/accessibility-principles/) and [Ant Design theme documentation](https://ant.design/docs/react/customize-theme/).

Open decisions: device models and input methods; supported browsers and smallest viewport; exact visual direction and accessible contrast targets; branding fields and source; language/locale requirements; and acceptance method. Feature specifications and trackers own actual behavior and evidence; this document does not authorize a payment flow, deployment or backend change.
