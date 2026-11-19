# UI Definition of Done

For each row, keep the box open until verified. Append the action taken and what was observed, or link directly to that evidence. For an inapplicable row, write N/A and the scope reason. For an open row, record the defect or missing evidence. Record the reviewed change, browser, viewport and data boundary (for example, mocked responses) once above the list.

- [ ] **Staff task.** Starting with representative data, complete the agreed staff task and observe the expected result.
- [ ] **Visual hierarchy and consistency.** Inspect the rendered decision point. Identify the current context, the value staff need and the next action. Compare layout, labels and controls with the agreed screen or component pattern.
- [ ] **Layout and input.** At the intended viewport, check that realistic labels and values stay readable and that frequent controls remain reachable with the intended input. Check each supported layout affected by the change. Identify any physical-device claim requiring separate evidence.
- [ ] **Keyboard and focus.** Complete the affected interaction by keyboard. Observe visible focus, its order and where it goes after validation or dismissal when applicable.
- [ ] **Feedback and recovery.** Exercise the relevant correction or failure path and any state that changes the user's next action. Identify what the screen communicates and verify the supported next step.

Example evidence for keyboard and focus: “After the password error, I reached the password field with Shift+Tab, corrected it and submitted with Enter.” Record this only if actually observed.
