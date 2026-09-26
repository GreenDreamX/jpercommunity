# Audit an implemented interface

Review only what can be observed in the implementation or rendered result. Do not invent missing requirements or turn personal taste into a defect.

Inspect:

- task clarity and hierarchy;
- consistency with the product's existing system;
- layout, overflow, media treatment, and responsive behavior;
- interaction feedback and necessary loading, empty, error, success, disabled, and recovery states;
- labels, focus, keyboard access, target size, and contrast;
- obvious performance problems visible in the experience.

Lead with the highest-impact findings, grouping repeated instances of the same cause. Do not omit a material defect to meet a finding limit. For each finding, identify the affected view or control, the observed behavior, its user impact, and the smallest concrete correction. Separate verified defects from checks that could not be completed; source inspection alone does not establish that a screen renders correctly.

An audit is read-only unless the user also requested fixes. This boundary applies when combining this playbook with platform guidance: instructions there to build or fix describe implementation work, not permission to edit during a review. If nothing material is visible, say so briefly and identify any meaningful verification limitation.

<!-- Modified by Uizze for ui-taste: complete evidence-backed findings and explicit read-only platform reviews. -->
