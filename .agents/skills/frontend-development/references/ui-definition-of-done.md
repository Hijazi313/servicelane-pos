# UI Definition of Done

For each row, keep the box open until verified. Append the action taken and what was observed, or link directly to that evidence. For an inapplicable row, write N/A and the scope reason. For an open row, record the defect or missing evidence. Record the reviewed change, browser, viewport and data boundary (for example, mocked responses) once above the list.

- [ ] **Staff task.** Starting with representative data, complete the agreed staff task and observe the expected result.
- [ ] **Visual hierarchy and consistency.** Inspect the rendered decision point. Identify the current context, the value staff need and the next action. Compare layout, labels and controls with the agreed screen or component pattern.
- [ ] **Layout and input.** At the intended viewport, check that realistic labels and values stay readable and that frequent controls remain reachable with the intended input. Check each supported layout affected by the change. Identify any physical-device claim requiring separate evidence.
- [ ] **Touch targets.** Measure interactive controls intended for touch at each affected touch viewport. Each target must be at least 48 × 48 CSS pixels. Record measured dimensions and controls checked.
- [ ] **Cashier hot path.** For each affected common cashier action, define and record its starting state and intended result, then count taps through completion. The target is at most two taps. Include required selections and confirmations in the count. When a workflow cannot meet this target, record the observed count and product tradeoff and leave the item open for a product decision.
- [ ] **Body text.** Measure rendered body text at the intended viewport. It must be at least 16 CSS pixels. Record representative computed sizes and any smaller body text found.
- [ ] **Contrast.** Measure text against its background at a minimum 4.5:1, or 3:1 for WCAG large text. Measure visual information required to identify controls, their states and meaningful graphics against adjacent colors at a minimum 3:1. Apply the exceptions in WCAG 2.2 AA, including inactive components. Record the colors, ratios, elements and states checked. See [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- [ ] **Keyboard and focus.** Complete the affected interaction by keyboard. Observe visible focus, its order and where it goes after validation or dismissal when applicable.
- [ ] **Feedback and recovery.** Exercise the relevant correction or failure path and any state that changes the user's next action. Identify what the screen communicates and verify the supported next step.

Example evidence for keyboard and focus: “After the password error, I reached the password field with Shift+Tab, corrected it and submitted with Enter.” Record this only if actually observed.
