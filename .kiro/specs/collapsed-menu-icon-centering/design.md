# Collapsed Menu Icon Centering Bugfix Design

## Overview

In the collapsed desktop sidebar, the navigation icons for "Inicio" and "Empresas" render off-center within their link box and appear to spill outside its rounded bounds. The collapsed state applies `justify-content: center` to `.sidebar__link`, but the text label is hidden only with `opacity: 0`, which keeps it in the layout flow. As a result, flex centering centers the *icon + gap + hidden-label* group rather than the icon alone, pushing the icon left of the true center. On top of that, the link keeps its expanded horizontal padding (`0.7rem 0.85rem`) and the icon keeps `min-width: 22px`, so within the 72px collapsed width the icon's box can exceed the available content area and visually overflow the rounded link box.

The fix is CSS-only and scoped to the collapsed desktop state (`.layout.is-collapsed`). It removes the hidden label from the layout flow, neutralizes the icon-to-label gap, and reduces the link's horizontal padding so the icon alone is centered and stays inside the box. No changes are made to the expanded desktop, mobile-open, active/hover, or width-transition behavior.

## Glossary

- **Bug_Condition (C)**: The rendering state that triggers the bug — a `.sidebar__link` rendered in the collapsed desktop sidebar (`.layout.is-collapsed`, non-mobile).
- **Property (P)**: The desired behavior for the bug condition — the navigation icon is horizontally centered within its link box and fully contained inside the link's rounded bounds.
- **Preservation**: All rendering states that are NOT the collapsed desktop link (expanded desktop, mobile-open, active/hover styling, width-transition animation) must remain byte-for-byte visually unchanged.
- **`.sidebar__link`**: The `Link` element in `frontend/src/components/Layout.tsx` that wraps an icon (`.sidebar__icon`) and a text label (`.sidebar__label`); styled in `frontend/src/components/Layout.css`.
- **`.sidebar__icon`**: The `<span>` holding the emoji glyph; a grid box with `min-width: 22px`.
- **`.sidebar__label`**: The `<span>` holding the link text; hidden via `opacity: 0` in the collapsed state.
- **`.layout.is-collapsed`**: The layout modifier applied on desktop when the sidebar is minimized to icon-only width (`--sidebar-width-collapsed: 72px`). Determines the bug context.

## Bug Details

### Bug Condition

The bug manifests when a `.sidebar__link` is rendered inside the collapsed desktop sidebar. In this state the link centers its flex content, but the label span is only made transparent (`opacity: 0`) rather than removed from layout, so it still reserves width and contributes (with the `gap`) to the centered group. Combined with the link's unchanged horizontal padding and the icon's `min-width`, the icon is shifted off-center and its box can extend beyond the visible rounded bounds of the link.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type SidebarRenderState
  OUTPUT: boolean

  RETURN input.isDesktop = true
         AND input.collapsed = true
         AND input.element = "sidebar__link"
         AND icon_is_off_center_or_overflowing(input)
END FUNCTION
```

Where `icon_is_off_center_or_overflowing` is true whenever the hidden label reserves layout width (`opacity: 0` in flow), the icon-to-label `gap` is applied, or the link horizontal padding plus icon `min-width` exceed the collapsed content width — any of which displaces the icon from the true horizontal center or pushes it past the box bounds.

### Examples

- **Inicio (🏠), collapsed desktop** — Expected: icon centered in the 72px-wide link box. Actual: icon shifted left of center and overflowing the rounded box, because the hidden "Inicio" label + `gap` still occupy the right side of the flex row.
- **Empresas (🏢), collapsed desktop** — Expected: icon centered and contained. Actual: same off-center/overflow displacement from the reserved "Empresas" label width and gap.
- **Active link collapsed (e.g. Inicio on `/`)** — Expected: centered icon within the highlighted (`is-active`) box. Actual: the active background box is correctly sized but the icon is off-center inside it, making the misalignment more visible.
- **Edge case — expanded desktop link** — Expected (and correct today): icon + visible label, left-aligned; NOT part of the bug condition and must be unaffected.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Expanded desktop links must continue to show the icon followed by the visible text label, left-aligned, with the current spacing (`gap: 0.85rem`, `padding: 0.7rem 0.85rem`). (Req 3.1)
- Mobile-open links (`.layout.is-mobile-open`) must continue to show the icon and visible label, left-aligned, with current spacing (`justify-content: flex-start`, label `opacity: 1`). (Req 3.2)
- Active (`.is-active`) and hover styling must continue to apply in both collapsed and expanded states. (Req 3.3)
- The sidebar width transition (`transition: width 0.25s ease`) between expanded and collapsed must continue to animate as it does today. (Req 3.4)

**Scope:**
All rendering states that do NOT satisfy the bug condition must be completely unaffected by this fix. This includes:
- Expanded desktop sidebar links (label visible, left-aligned)
- Mobile-open sidebar links (label visible, left-aligned)
- Active/hover visual states in any layout mode
- The width-transition animation when toggling collapse

**Note:** The expected correct behavior for the collapsed state (centered, contained icon) is defined in the Correctness Properties section (Property 1).

## Hypothesized Root Cause

Based on the requirements analysis and inspection of `Layout.css`, the most likely contributing causes are:

1. **Hidden label still occupies layout flow**: In `.layout.is-collapsed`, the label is hidden with `opacity: 0` and `pointer-events: none` but is NOT removed from flow (no `display: none` / zero width). The flex row therefore lays out `icon + gap + label`, and `justify-content: center` centers that whole group, so the icon lands left of the box center.
   - `.layout.is-collapsed .sidebar__label { opacity: 0; pointer-events: none; }` leaves intrinsic width intact.

2. **Icon-to-label gap is not neutralized**: `.sidebar__link` sets `gap: 0.85rem`. In the collapsed state this gap sits between the icon and the (invisible but still present) label, further shifting the centered group.

3. **Link horizontal padding too large for collapsed width**: `.sidebar__link` uses `padding: 0.7rem 0.85rem`. Within the 72px collapsed sidebar (minus nav padding `0 0.75rem`), the horizontal padding plus the icon `min-width: 22px` can exceed the available content width, letting the icon box reach or cross the rounded link bounds.

4. **Icon `min-width` interaction**: `.sidebar__icon { min-width: 22px; }` combined with the reserved label width and padding contributes to the content overflowing the constrained collapsed box.

The dominant cause is (1) reinforced by (2); (3) and (4) explain the overflow beyond the rounded box. The fix addresses all four, scoped strictly to `.layout.is-collapsed`.

## Correctness Properties

Property 1: Bug Condition - Collapsed Icon Centered and Contained

_For any_ input where the bug condition holds (`isBugCondition` returns true — a `.sidebar__link` in the collapsed desktop sidebar), the fixed styling SHALL render the navigation icon horizontally centered within its link box and fully within the visible bounds of the link's rounded box, with the icon centered based on the icon alone (no reserved space for the hidden label).

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Non-Collapsed Rendering States Unchanged

_For any_ input where the bug condition does NOT hold (`isBugCondition` returns false — expanded desktop links, mobile-open links, active/hover states, and the width-transition animation), the fixed styling SHALL produce the same visual result as the original styling, preserving the icon-plus-visible-label left-aligned layout, the existing spacing, the active/hover styling, and the width transition.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming the root cause analysis is correct, the fix is CSS-only and confined to selectors already scoped to `.layout.is-collapsed` in `frontend/src/components/Layout.css`. No changes to `Layout.tsx` markup are needed.

**File**: `frontend/src/components/Layout.css`

**Selectors**: `.layout.is-collapsed .sidebar__link`, `.layout.is-collapsed .sidebar__label`, and (as needed) `.layout.is-collapsed .sidebar__icon`

**Specific Changes**:

1. **Remove the hidden label from layout flow (collapsed only)**: Change the collapsed label so it no longer reserves width. Prefer collapsing its box rather than only fading it — e.g. add `width: 0; overflow: hidden;` to the existing collapsed label rule (keeping `opacity: 0; pointer-events: none;`), or move the label to `display: none` in the collapsed state. This ensures the flex row contains effectively only the icon, so `justify-content: center` centers the icon alone.
   - Applies to the collapsed branch only, so the expanded/mobile label (visible, in flow) is untouched.

2. **Neutralize the icon-to-label gap (collapsed only)**: Set `gap: 0` on `.layout.is-collapsed .sidebar__link` so the (now zero-width) label cannot introduce residual horizontal offset. This is scoped to collapsed and leaves the expanded/mobile `gap: 0.85rem` intact.

3. **Reduce link horizontal padding for the collapsed width (collapsed only)**: Reduce the horizontal padding on `.layout.is-collapsed .sidebar__link` (e.g. symmetric small padding such as `padding: 0.7rem 0`) so the icon box fits comfortably inside the 72px collapsed width and stays within the rounded box bounds. Vertical padding is preserved so the box height and active/hover background remain unchanged.

4. **Ensure icon width does not force overflow (collapsed only, if needed)**: Verify `.sidebar__icon` `min-width: 22px` plus the reduced padding fits within the collapsed content width. If necessary, ensure the icon is centered by keeping the link `justify-content: center` (already present) with the label removed from flow. No change to the base `.sidebar__icon` rule unless testing shows residual overflow.

5. **Keep existing collapsed rules intact**: The existing `.layout.is-collapsed .sidebar__link { justify-content: center; }` and the collapsed `opacity`/`pointer-events` on title/label/footer remain; the fix augments these rather than replacing them, keeping the change minimal and reversible.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the off-center/overflow behavior on the unfixed CSS, then verify the fix centers and contains the icon in the collapsed state while preserving all other rendering states. Because the defect is visual/layout-based, checks are expressed in terms of computed geometry (bounding boxes) of the icon relative to its link box.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis (hidden label reserves width, gap and padding contribute to offset/overflow). If refuted, re-hypothesize.

**Test Plan**: Render `Layout` with the desktop viewport and the sidebar in the collapsed state (`.layout.is-collapsed`). Measure the icon's bounding box against its link's bounding box and assert horizontal centering and containment. Run against the UNFIXED CSS to observe the failures and confirm the label still occupies flow.

**Test Cases**:
1. **Inicio icon centered (collapsed)**: Assert the Inicio icon's horizontal center equals the link box center within tolerance (will fail on unfixed code).
2. **Empresas icon centered (collapsed)**: Assert the Empresas icon's horizontal center equals its link box center within tolerance (will fail on unfixed code).
3. **Icon contained (collapsed)**: Assert the icon's left/right edges fall within the link box's rounded bounds (will fail on unfixed code).
4. **Hidden label reserves no width (collapsed)**: Assert the collapsed label's measured content width is 0 (will fail on unfixed code, where `opacity: 0` leaves width intact).

**Expected Counterexamples**:
- The icon's center is shifted left of the link box center; the icon's box overflows the link bounds.
- Possible causes: hidden label still in flow, non-zero `gap`, link horizontal padding + icon `min-width` exceeding collapsed content width.

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed styling produces the expected behavior (centered and contained icon).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderLink_fixed(input)
  ASSERT icon_horizontally_centered(result) AND icon_within_box_bounds(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed styling produces the same result as the original styling.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderLink_original(input) = renderLink_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many rendering states automatically across the input domain (layout mode, active/hover, per nav item).
- It catches edge cases that manual unit tests might miss (e.g., active + expanded, hover + mobile-open).
- It provides strong guarantees that behavior is unchanged for all non-collapsed inputs.

**Test Plan**: Observe behavior on the UNFIXED code first for the expanded desktop, mobile-open, active/hover, and toggle-animation states, capture the reference layout/appearance, then write property-based tests that assert the fixed code reproduces the same reference for all non-bug states.

**Test Cases**:
1. **Expanded desktop preservation**: Observe icon + visible label, left-aligned, with `gap: 0.85rem` and `padding: 0.7rem 0.85rem` on unfixed code, then verify unchanged after fix.
2. **Mobile-open preservation**: Observe icon + visible label, left-aligned (`justify-content: flex-start`, label `opacity: 1`) on unfixed code, then verify unchanged after fix.
3. **Active/hover preservation**: Observe `is-active` background and hover styling in collapsed and expanded states on unfixed code, then verify unchanged after fix.
4. **Width-transition preservation**: Observe the `transition: width 0.25s ease` animation on toggle on unfixed code, then verify the transition still applies after fix.

### Unit Tests

- Collapsed state: assert icon horizontal center matches link box center for both nav items.
- Collapsed state: assert icon box stays within link box bounds (no overflow).
- Collapsed state: assert the hidden label reserves zero content width and `pointer-events: none` remains.
- Expanded/mobile-open states: assert icon + visible label remain left-aligned with existing spacing.

### Property-Based Tests

- Across generated layout modes (expanded desktop, collapsed desktop, mobile-open) and both nav items, verify: collapsed => centered/contained icon; non-collapsed => label visible and left-aligned.
- Across generated active/hover combinations, verify active/hover styling is preserved in every layout mode.
- Across generated toggle sequences, verify the width transition remains present and non-collapsed layouts are byte-for-byte equivalent to the reference.

### Integration Tests

- Full layout flow: toggle from expanded to collapsed on desktop and verify icons become centered and contained without disturbing content margin behavior.
- Context switching: switch between expanded, collapsed, and mobile-open and verify each state renders its expected alignment.
- Visual feedback: verify active link highlight and hover feedback render correctly around the centered icon in the collapsed state.
