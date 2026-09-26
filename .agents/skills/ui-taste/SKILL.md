---
name: ui-taste
description: Give your coding agent better UI taste. Build and polish web and iOS interfaces with Uizze's anti-ui-slop playbooks and optional real-product references. Use for UI design, implementation, redesign, critique, or a final visual review in Claude Code, Codex, Cursor, or Copilot.
license: Apache-2.0; see LICENSE and NOTICE for third-party attribution
metadata:
  version: "0.1.0"
  author: "UIZZE <business@uizze.com>"
  compatibility: "Designed for Claude Code, Codex, Cursor, and GitHub Copilot; works in any agent that can read project files and fetch a URL."
  tags: "ui-design, design-system, design-review, frontend, web-ui, ios-ui"
---

![Stop Making UI Slop with UIZZE](https://uizze.com/landing/anti-ui-slop-skill-banner.png)

# UI Taste by Uizze

**Stop shipping the same AI slop.**

“Make it look better” gets old after the tenth prompt. Give your agent a workflow for choosing layouts, fixing visual hierarchy, and polishing the details you notice when you use the app.

Built on [Uizze's](https://uizze.com) anti-ui-slop workflow. Six design playbooks for web and iOS, with optional real-product references, fonts and icons through Uizze MCP.

**Free skill. No account required.** Agent-connected references and materials use the optional paid MCP.

## Prerequisites

- A screen or component to build, redesign, or review — a file path or a short description.
- Existing components, design tokens, and visual language, when available. For a new project, establish a small coherent system from the brief rather than requiring an existing one.
- Optional access to the paid Uizze MCP for focused references and hosted materials.

## Authentication

- The free skill and public catalogue work without an account, token, MCP connection, dependency, script, or executable.
- The optional full UIZZE MCP may use the host's normal connection and authentication flow. Never claim it is connected without an actual host result.

## Work from the product

Read the brief, existing UI, components, tokens, and constraints before designing. They always outrank this skill. Keep familiar interaction conventions and make the product's own objects, workflow, and priorities visually clear. Do not add novelty for its own sake.

## Load one playbook

Choose the playbook that matches the requested action:

- New interface or major redesign: `reference/new-work.md`
- Product or dashboard work: `reference/operate.md`
- Refinement and polish: `reference/polish.md`
- Simplification or distillation: `reference/distill.md`
- Explicit audit: `reference/audit.md`
- Native iOS work: `reference/ios.md`

For an iOS audit or polish request, load the action's playbook plus `reference/ios.md` for platform constraints. Otherwise use one playbook. Apply judgment rather than treating its examples as a checklist.

## Optional Uizze evidence

Read `references/uizze-reference-policy.md` before using the paid MCP. Look for `find_ui_references` and `find_ui_materials` among the host's available tools; do not invent a connection or tool. Use them only when a concrete unresolved visual or material question would benefit from evidence. They are optional, not prerequisites for completing local UI work.

## Finish

Complete the requested scope. For an audit, report findings without editing unless fixes were requested. For implementation, render and inspect the affected views when supported, fix observable breakage, and recheck the affected behavior after fixes. If rendering is unavailable, distinguish code review from visual verification. Keep the handoff concise.

<!-- Modified by Uizze for the unpublished ui-taste draft: listing, routing, audit boundaries, optional tool handling, and verification. -->
