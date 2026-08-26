# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Collapsed Icon Centered and Contained
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the off-center / overflowing icon in the collapsed desktop sidebar
  - **Scoped PBT Approach**: The bug is deterministic and layout-based. Scope the property to the concrete failing cases: render `Layout` at a desktop viewport with `.layout.is-collapsed` and measure both nav items (Inicio 🏠, Empresas 🏢)
  - Encode the Bug Condition from design: `isBugCondition(input)` is true when `input.isDesktop = true AND input.collapsed = true AND input.element = "sidebar__link"` and the icon is off-center or overflowing
  - Test assertions matching the Expected Behavior (Property 1):
    - Assert each icon's horizontal center equals its `.sidebar__link` box center within tolerance (Req 2.1)
    - Assert the collapsed `.sidebar__label` reserves zero content width (Req 2.2) — on unfixed code `opacity: 0` leaves width intact, so this fails
    - Assert each icon's left/right edges fall within the link box bounds (no overflow) (Req 2.3)
  - Run test on UNFIXED CSS in `frontend/src/components/Layout.css`
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Inicio icon center is left of link box center because the hidden 'Inicio' label + `gap: 0.85rem` still occupy the flex row; icon box crosses the rounded link bounds within the 72px collapsed width")
  - Mark task complete when the test is written, run, and the failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Non-Collapsed Rendering States Unchanged
  - **IMPORTANT**: Follow observation-first methodology - record actual behavior on UNFIXED code, then assert it
  - Encode the non-bug domain from design: `NOT isBugCondition(input)` — expanded desktop links, mobile-open links, active/hover states, and the width-transition animation
  - Observe on UNFIXED code and capture as reference:
    - Expanded desktop: icon + visible label, left-aligned, `gap: 0.85rem`, `padding: 0.7rem 0.85rem`, label `opacity: 1` (Req 3.1)
    - Mobile-open (`.layout.is-mobile-open`): icon + visible label, left-aligned, `justify-content: flex-start`, label `opacity: 1` (Req 3.2)
    - Active (`.is-active`) background and `:hover` styling in both collapsed and expanded states (Req 3.3)
    - Sidebar width transition `transition: width 0.25s ease` on toggle (Req 3.4)
  - Write property-based tests across generated layout modes (expanded desktop, mobile-open) x both nav items x active/hover combinations, asserting the captured reference layout/spacing/styling is reproduced
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms the baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix collapsed-sidebar icon centering and containment (CSS-only, scoped to `.layout.is-collapsed`)

  - [x] 3.1 Implement the fix in `frontend/src/components/Layout.css`
    - Remove the hidden label from layout flow in the collapsed state: augment `.layout.is-collapsed .sidebar__label` with `width: 0; overflow: hidden;` (keeping existing `opacity: 0; pointer-events: none;`) so the flex row effectively contains only the icon
    - Neutralize the icon-to-label gap: set `gap: 0` on `.layout.is-collapsed .sidebar__link` (leaving the base `gap: 0.85rem` intact for expanded/mobile)
    - Reduce collapsed horizontal padding to symmetric: set `padding: 0.7rem 0` on `.layout.is-collapsed .sidebar__link` so the icon fits within the 72px collapsed width while preserving vertical padding (box height, active/hover background unchanged)
    - Keep the existing `.layout.is-collapsed .sidebar__link { justify-content: center; }` so the icon alone is centered
    - Make NO changes to `Layout.tsx` markup or to the base/expanded/mobile-open/active/hover rules
    - _Bug_Condition: isBugCondition(input) where input.isDesktop = true AND input.collapsed = true AND input.element = "sidebar__link" (from design)_
    - _Expected_Behavior: icon_horizontally_centered(result) AND icon_within_box_bounds(result) with icon centered on itself alone (from design Property 1)_
    - _Preservation: Preservation Requirements from design (expanded desktop, mobile-open, active/hover, width transition unchanged)_
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Collapsed Icon Centered and Contained
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior; when it passes it confirms the collapsed icon is centered and contained and the label reserves zero width
    - Run the bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms the bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Non-Collapsed Rendering States Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run the preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in expanded desktop, mobile-open, active/hover, or width-transition behavior)
    - Confirm all tests still pass after the fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Checkpoint - Ensure all tests pass
  - Run the full test suite and confirm the exploration test (Property 1) now passes and the preservation tests (Property 2) still pass
  - Ensure all tests pass, ask the user if questions arise
