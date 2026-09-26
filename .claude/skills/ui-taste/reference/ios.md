# Native iOS interfaces

Follow the product's existing iOS conventions first, then Apple platform conventions. A native interface should feel predictable before it feels distinctive.

## Structure and controls

- Use a navigation stack for hierarchy, a tab bar for a small set of top-level destinations, and sheets for self-contained tasks.
- Preserve the edge-swipe back gesture and safe-area behavior.
- Prefer native controls, materials, menus, alerts, sheets, pickers, and text behavior unless the product already has a coherent custom system.
- Keep touch targets comfortable, text scalable, labels accessible, and focus order sensible.
- Account for the keyboard, long content, dynamic type, reduced motion, dark mode, and device insets.

## States

For implementation, include the states the task requires: loading, empty, error, success, permission denied, offline, disabled, and recovery where applicable. For an audit, inspect those states without adding or changing them. Feedback should be immediate and should not depend on color alone.

When a simulator or runnable build is available, inspect the relevant device class for clipping, overlap, unsafe-area violations, unreadable text, broken navigation, or inaccessible controls. In an audit, report the evidence without edits. When fixes are requested, correct the affected behavior and check it again, including keyboard or text-size conditions that exposed the problem. Do not require extra tooling when the environment cannot provide it; state what could not be verified instead.

<!-- Modified by Uizze for ui-taste: separate audit and implementation behavior, with post-fix verification. -->
