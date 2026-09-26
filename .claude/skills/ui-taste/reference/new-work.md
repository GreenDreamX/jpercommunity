# New interface or major redesign

Start from the product, not from a style trend. Read the brief, existing components, content, constraints, and any current interface before choosing a direction.

## Decide the interface

- Identify the primary user, their main task, and the one action that matters most on this surface.
- Choose one coherent visual direction that fits the product. Do not present style menus or invent novelty for its own sake.
- Establish a clear reading order: orientation, primary content, primary action, then secondary detail.
- Reuse the existing design system when one exists. Extend it only where the requested work genuinely needs something new.
- Keep familiar controls familiar. Distinction should come from the product's content, structure, typography, imagery, and interaction—not from making standard controls strange.

## Resolve the layout before decorating it

Use the actual primary object—a transaction, conversation, document, or other product content—to decide the layout. A dashboard is not automatically a row of metric cards. Establish the main content region and action placement before adding surface treatments. Keep these decisions lightweight; do not create a separate planning document unless requested.

## Build the complete state

- Use real or clearly marked placeholder content that exercises the layout.
- Include the states required by the task: loading, empty, error, success, disabled, or recovery when they can actually occur.
- Define responsive behavior structurally. Decide what stacks, collapses, scrolls, or remains fixed instead of merely shrinking the desktop layout.
- Keep typography, spacing, color, radius, icon style, and motion internally consistent.
- Use motion only to explain a transition, reveal state, or provide feedback.

Exercise the layout with a long title, missing optional media, and the densest realistic content available. Placeholder text must not hide a layout that fails with real data.

## Verify the result

Render the result at the relevant sizes when the environment supports it. Fix observable clipping, overlap, distorted media, inaccessible controls, broken focus, unreadable hierarchy, or inert interactions, then recheck the changed area. Stop when the requested interface works and feels coherent; do not add a separate ceremony around the work.

<!-- Modified by Uizze for ui-taste: content-led layout decisions and realistic-content verification. -->
