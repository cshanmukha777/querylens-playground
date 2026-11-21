# Interface design brief

QueryLens opens on a SQL workspace. The layout gives the editor room, keeps the analysis panel adjacent, and puts profile output below the action that produced it. Navigation stays compact and supports Workspace, Query history, and Recommendations.

The visual system uses neutral surfaces, one teal accent, IBM Plex Sans and Mono (SIL Open Font License, bundled locally), thin borders, and compact text suited to query tooling. Severity is shown with text and a marker, never color alone. There are no decorative charts or invented performance values.

## UI quality checklist

- Use semantic buttons, labels, navigation, and ordered headings.
- Keep visible keyboard focus and support keyboard navigation.
- Keep touch controls at least 44px where practical; preserve reduced-motion preferences.
- Put errors next to the action that failed and make empty states actionable.
- Use one accent color and solid surfaces; remove decorative gradients, glows, stock filler, and unsupported claims.
- Use motion only for meaningful state feedback; no entrance animation.
- At narrow widths, stack the editor and result panel; keep code and result text from forcing page overflow.
- Static analysis, measured profiling, and execution plans must remain distinct in labels and copy.

This checklist reflects the constraints in [UnsLoP UI](https://github.com/andrasp/unslop-ui), especially its semantic controls, focus visibility, restraint, reduced motion, inline errors, and warnings against fake dashboards. The result is an original workspace layout, not a copied interface.
