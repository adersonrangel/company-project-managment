/**
 * Preservation property test — Collapsed Menu Icon Centering
 *
 * Feature (bugfix): collapsed-menu-icon-centering
 *
 * Property 2: Preservation - Non-Collapsed Rendering States Unchanged
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 *
 * Observation-first methodology:
 * These assertions capture the ACTUAL behavior observed on the current
 * (UNFIXED) `Layout.css` for every rendering state that does NOT satisfy the
 * bug condition (expanded desktop, mobile-open, active/hover, width
 * transition). They are EXPECTED TO PASS on unfixed code — establishing the
 * baseline to preserve — and MUST continue to pass after the CSS-only fix,
 * which is scoped strictly to `.layout.is-collapsed`.
 *
 * The bug condition (from design) is:
 *   isBugCondition(input) === input.isDesktop && input.collapsed &&
 *                             input.element === 'sidebar__link'
 * Every state generated here has NOT isBugCondition(input) === true.
 *
 * Why a computed model instead of getBoundingClientRect():
 * jsdom does not perform real CSS layout, so this test parses the REAL
 * `Layout.css` (the same source of truth the fix will edit) and reads the
 * declarations that define the non-collapsed layout, spacing, active/hover,
 * and width-transition behavior. If the fix ever leaks outside the collapsed
 * scope, one of these captured references will change and the test will fail.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Load the real, unmodified Layout.css
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSS_PATH = path.resolve(__dirname, '../Layout.css');
const RAW_CSS = readFileSync(CSS_PATH, 'utf8');

/**
 * Preprocess the CSS for reliable rule scanning:
 *  - strip block comments (they otherwise leak into selector preludes)
 *  - unwrap `@media (...) { ... }` blocks so their nested rules are scanned as
 *    top-level rules (we intentionally read the innermost declaration wins;
 *    mobile-open rules only live inside the media query).
 * We do NOT need media specificity here — each selector we query is unique to a
 * single rule in this stylesheet.
 */
function preprocess(css: string): string {
  // Remove /* ... */ comments.
  let out = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Unwrap @media blocks: replace the "@media (...) {" opener and its matching
  // closing brace with nothing, leaving the nested rules inline.
  let result = '';
  let i = 0;
  while (i < out.length) {
    const atMedia = out.indexOf('@media', i);
    if (atMedia === -1) {
      result += out.slice(i);
      break;
    }
    result += out.slice(i, atMedia);
    // Find the opening brace of the @media block.
    const open = out.indexOf('{', atMedia);
    // Walk to the matching close brace.
    let depth = 1;
    let j = open + 1;
    while (j < out.length && depth > 0) {
      if (out[j] === '{') depth++;
      else if (out[j] === '}') depth--;
      j++;
    }
    // Inner content is out[open+1 .. j-1] (excluding the final closing brace).
    result += out.slice(open + 1, j - 1);
    i = j;
  }
  return result;
}

const CSS = preprocess(RAW_CSS);

// ---------------------------------------------------------------------------
// Minimal CSS helpers — extract a declaration value for a selector block.
// (Mirrors the exploration test helpers so both track the same source.)
// ---------------------------------------------------------------------------

/** Collapse a selector's internal whitespace so comparisons ignore formatting. */
function normSelector(sel: string): string {
  return sel.replace(/\s+/g, ' ').trim();
}

/**
 * Returns the raw body ({ ... }) of the first rule whose selector LIST contains
 * `selector` as one of its comma-separated members. This correctly handles
 * grouped rules such as:
 *   .layout.is-mobile-open .sidebar__title,
 *   .layout.is-mobile-open .sidebar__label,
 *   .layout.is-mobile-open .sidebar__footer { opacity: 1; ... }
 * where a naive "selector immediately followed by {" match would miss the body.
 */
function ruleBody(selector: string): string | undefined {
  const target = normSelector(selector);
  // Match every rule: capture its selector list (prelude) and its body.
  const ruleRe = /([^{}]+)\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(CSS)) !== null) {
    const prelude = m[1];
    const body = m[2];
    // @media wrappers are unwrapped in preprocess(); skip any residual at-rules.
    if (prelude.trimStart().startsWith('@')) continue;
    const members = prelude.split(',').map(normSelector);
    if (members.includes(target)) return body;
  }
  return undefined;
}

/** Returns the value of `prop` inside the given selector's body, or undefined. */
function decl(selector: string, prop: string): string | undefined {
  const body = ruleBody(selector);
  if (!body) return undefined;
  const re = new RegExp(`(?:^|;|\\{)\\s*${prop}\\s*:\\s*([^;]+)`, 'm');
  const m = body.match(re);
  return m?.[1]?.trim();
}

/** Normalize whitespace in a declaration value for stable comparison. */
function norm(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// Bug condition (from design) and its negation (the preservation domain).
// ---------------------------------------------------------------------------

type LayoutMode = 'expanded-desktop' | 'mobile-open';

interface SidebarRenderState {
  isDesktop: boolean;
  collapsed: boolean;
  element: string;
  mode: LayoutMode;
  labelText: string;
  active: boolean;
  hover: boolean;
}

function isBugCondition(input: SidebarRenderState): boolean {
  return input.isDesktop === true && input.collapsed === true && input.element === 'sidebar__link';
}

// Concrete nav items rendered by Layout.tsx.
const NAV_ITEMS = [
  { label: 'Inicio', icon: '🏠' },
  { label: 'Empresas', icon: '🏢' },
];

// ---------------------------------------------------------------------------
// Reference behaviors captured from the UNFIXED Layout.css.
//
// These constants are the observed baseline. They are read from the real CSS
// so the test is self-checking: if the source diverges from the documented
// baseline (Req 3.1-3.4), the corresponding assertion fails.
// ---------------------------------------------------------------------------

// Req 3.1 — expanded desktop link: icon + visible label, left-aligned, existing spacing.
const REF_BASE_LINK_DISPLAY = 'flex';
const REF_BASE_LINK_ALIGN_ITEMS = 'center';
const REF_BASE_LINK_GAP = '0.85rem';
const REF_BASE_LINK_PADDING = '0.7rem 0.85rem';
// Expanded desktop label is visible (no opacity override outside collapsed).
const REF_EXPANDED_LABEL_OPACITY = undefined; // base .sidebar__label has no opacity decl (=> visible)

// Req 3.2 — mobile-open link: icon + visible label, left-aligned.
const REF_MOBILE_OPEN_LINK_JUSTIFY = 'flex-start';
const REF_MOBILE_OPEN_LABEL_OPACITY = '1';

// Req 3.3 — active / hover styling (applies in both collapsed and expanded).
const REF_ACTIVE_BG = 'rgba(59, 130, 246, 0.18)';
const REF_ACTIVE_COLOR = '#fff';
const REF_HOVER_BG = 'rgba(255, 255, 255, 0.06)';
const REF_HOVER_COLOR = '#e2e8f0';

// Req 3.4 — sidebar width transition on toggle.
const REF_SIDEBAR_TRANSITION = 'width 0.25s ease, transform 0.25s ease';

// ---------------------------------------------------------------------------
// Property 2: Preservation (EXPECTED TO PASS on unfixed CSS).
// ---------------------------------------------------------------------------

describe('Feature: collapsed-menu-icon-centering, Property 2: Preservation - Non-Collapsed Rendering States Unchanged', () => {
  // Generator: every non-bug rendering state.
  //  - expanded-desktop: isDesktop=true, collapsed=false
  //  - mobile-open:      isDesktop=false, collapsed=false
  // crossed with both nav items and all active/hover combinations.
  const preservedStateArb: fc.Arbitrary<SidebarRenderState> = fc
    .record({
      mode: fc.constantFrom<LayoutMode>('expanded-desktop', 'mobile-open'),
      item: fc.constantFrom(...NAV_ITEMS),
      active: fc.boolean(),
      hover: fc.boolean(),
    })
    .map(({ mode, item, active, hover }) => ({
      isDesktop: mode === 'expanded-desktop',
      collapsed: false,
      element: 'sidebar__link',
      mode,
      labelText: item.label,
      active,
      hover,
    }));

  /**
   * Req 3.1 / 3.2 — the base link layout (icon + label, left-aligned, existing
   * spacing) is preserved for every non-collapsed state. The fix must not touch
   * the base `.sidebar__link` rule, so display/align/gap/padding stay as observed.
   *
   * **Validates: Requirements 3.1, 3.2**
   */
  it('preserves the base link layout, spacing, and left-alignment for all non-collapsed states', () => {
    fc.assert(
      fc.property(preservedStateArb, (input) => {
        // scope: only NON-bug states
        fc.pre(!isBugCondition(input));

        expect(norm(decl('.sidebar__link', 'display'))).toBe(REF_BASE_LINK_DISPLAY);
        expect(norm(decl('.sidebar__link', 'align-items'))).toBe(REF_BASE_LINK_ALIGN_ITEMS);
        expect(norm(decl('.sidebar__link', 'gap'))).toBe(REF_BASE_LINK_GAP);
        expect(norm(decl('.sidebar__link', 'padding'))).toBe(REF_BASE_LINK_PADDING);
      }),
      { numRuns: 40 }
    );
  });

  /**
   * Req 3.1 — expanded desktop: the label remains visible (no collapsed-style
   * fade applies), so the base label rule carries no opacity override.
   *
   * **Validates: Requirements 3.1**
   */
  it('keeps the expanded desktop label visible (icon followed by visible label)', () => {
    fc.assert(
      fc.property(preservedStateArb, (input) => {
        fc.pre(!isBugCondition(input) && input.mode === 'expanded-desktop');

        // Base label rule has no opacity declaration => fully visible.
        expect(decl('.sidebar__label', 'opacity')).toBe(REF_EXPANDED_LABEL_OPACITY);
        // The label is only faded under the collapsed scope, not here.
        expect(decl('.layout.is-collapsed .sidebar__label', 'opacity')).toBe('0');
      }),
      { numRuns: 40 }
    );
  });

  /**
   * Req 3.2 — mobile-open: link is left-aligned and its label is fully visible.
   *
   * **Validates: Requirements 3.2**
   */
  it('preserves mobile-open left-alignment and visible label', () => {
    fc.assert(
      fc.property(preservedStateArb, (input) => {
        fc.pre(!isBugCondition(input) && input.mode === 'mobile-open');

        expect(norm(decl('.layout.is-mobile-open .sidebar__link', 'justify-content'))).toBe(
          REF_MOBILE_OPEN_LINK_JUSTIFY
        );
        expect(norm(decl('.layout.is-mobile-open .sidebar__label', 'opacity'))).toBe(
          REF_MOBILE_OPEN_LABEL_OPACITY
        );
      }),
      { numRuns: 40 }
    );
  });

  /**
   * Req 3.3 — active and hover styling is preserved (applies in every layout
   * mode, collapsed and expanded alike). Assert whenever a generated state is
   * active and/or hovered.
   *
   * **Validates: Requirements 3.3**
   */
  it('preserves active and hover styling across non-collapsed states', () => {
    fc.assert(
      fc.property(preservedStateArb, (input) => {
        fc.pre(!isBugCondition(input));

        if (input.active) {
          expect(norm(decl('.sidebar__link.is-active', 'background-color'))).toBe(REF_ACTIVE_BG);
          expect(norm(decl('.sidebar__link.is-active', 'color'))).toBe(REF_ACTIVE_COLOR);
        }
        if (input.hover) {
          expect(norm(decl('.sidebar__link:hover', 'background-color'))).toBe(REF_HOVER_BG);
          expect(norm(decl('.sidebar__link:hover', 'color'))).toBe(REF_HOVER_COLOR);
        }
      }),
      { numRuns: 40 }
    );
  });

  /**
   * Req 3.4 — the sidebar width transition on toggle is preserved.
   *
   * **Validates: Requirements 3.4**
   */
  it('preserves the sidebar width-transition animation on toggle', () => {
    fc.assert(
      fc.property(preservedStateArb, (input) => {
        fc.pre(!isBugCondition(input));

        expect(norm(decl('.sidebar', 'transition'))).toBe(REF_SIDEBAR_TRANSITION);
      }),
      { numRuns: 40 }
    );
  });
});
