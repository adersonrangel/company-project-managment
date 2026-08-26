/**
 * Bug condition exploration test — Collapsed Menu Icon Centering
 *
 * Feature (bugfix): collapsed-menu-icon-centering
 *
 * Property 1: Bug Condition - Collapsed Icon Centered and Contained
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3**
 *
 * CRITICAL: This test is EXPECTED TO FAIL on the current (unfixed) CSS.
 * The failure confirms the bug exists: in the collapsed desktop sidebar the
 * navigation icons for "Inicio" (🏠) and "Empresas" (🏢) are shifted off the
 * true horizontal center of their `.sidebar__link` box and overflow the box
 * bounds, because the hidden `.sidebar__label` is only faded (`opacity: 0`)
 * yet still reserves layout width, the icon-to-label `gap` still applies, and
 * the link's horizontal padding plus the icon `min-width` exceed the 72px
 * collapsed content width.
 *
 * Why a computed model instead of getBoundingClientRect():
 * jsdom does not perform real CSS layout, so `getBoundingClientRect()` returns
 * zeroed boxes and cannot reveal a layout defect. Instead this test parses the
 * REAL `Layout.css` and computes the collapsed flex-row box model (link content
 * width, icon min-width, gap, hidden-label reserved width) to measure whether
 * the icon is centered on itself alone and contained within the link box.
 * This keeps the property scoped to the concrete, deterministic failing cases
 * described in the design (Inicio 🏠 and Empresas 🏢 at a desktop viewport with
 * `.layout.is-collapsed`).
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
const CSS = readFileSync(CSS_PATH, 'utf8');

// ---------------------------------------------------------------------------
// Minimal CSS helpers — extract a declaration value for a selector block.
// These read the ACTUAL css so the test tracks the real source of truth.
// ---------------------------------------------------------------------------

/** Returns the raw body ({ ... }) of the first rule whose selector text matches exactly. */
function ruleBody(selector: string): string | undefined {
  // Escape regex special chars in the selector, allow flexible whitespace/commas.
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm');
  const m = CSS.match(re);
  return m?.[1];
}

/** Returns the value of `prop` inside the given selector's body, or undefined. */
function decl(selector: string, prop: string): string | undefined {
  const body = ruleBody(selector);
  if (!body) return undefined;
  const re = new RegExp(`(?:^|;|\\{)\\s*${prop}\\s*:\\s*([^;]+)`, 'm');
  const m = body.match(re);
  return m?.[1]?.trim();
}

/** Parses a CSS length token to px. Supports px and rem (root font-size 16px). */
function toPx(value: string | undefined, remBase = 16): number {
  if (!value) return 0;
  const token = value.trim().split(/\s+/)[0]; // first token (e.g. shorthand)
  if (token.endsWith('rem')) return parseFloat(token) * remBase;
  if (token.endsWith('px')) return parseFloat(token);
  const n = parseFloat(token);
  return Number.isNaN(n) ? 0 : n;
}

/** Parse the horizontal (left/right) padding from a `padding` shorthand value. */
function horizontalPadding(paddingValue: string | undefined, remBase = 16): number {
  if (!paddingValue) return 0;
  const parts = paddingValue.trim().split(/\s+/);
  // padding: v h  |  padding: t r b l  |  padding: all
  let horiz: string;
  if (parts.length === 1) horiz = parts[0]!;
  else horiz = parts[1]!; // right value in "v h" and "t r b l"
  return toPx(horiz, remBase);
}

// ---------------------------------------------------------------------------
// Layout geometry model for the COLLAPSED desktop sidebar.
//
// Structure (from Layout.tsx):
//   .sidebar  (width: --sidebar-width-collapsed = 72px)
//     .sidebar__nav      padding: 1rem 0.75rem      => horizontal 0.75rem each side
//       .sidebar__link   flex row, gap, padding, justify-content
//         .sidebar__icon  min-width: 22px
//         .sidebar__label (hidden via opacity:0 in collapsed — still in flow)
// ---------------------------------------------------------------------------

interface CollapsedGeometry {
  /** Inner content width available inside the link box (link width minus its padding). */
  linkContentWidth: number;
  /** Width the link box occupies (nav content width). */
  linkBoxWidth: number;
  /** The icon's own laid-out width. */
  iconWidth: number;
  /** Reserved width of the hidden label (0 when removed from flow). */
  labelReservedWidth: number;
  /** Flex gap applied between icon and label. */
  gap: number;
  /** Horizontal padding on the link (each side). */
  linkPadX: number;
  /** justify-content used for the collapsed link. */
  justify: string;
}

const SIDEBAR_COLLAPSED_WIDTH = toPx(decl('.layout', '--sidebar-width-collapsed')) || 72;

/**
 * Approximate the reserved intrinsic width of the (hidden) label text.
 * In the unfixed CSS the label keeps `opacity: 0` and stays in flow, so it
 * reserves roughly text.length * per-char width at the link font-size.
 * We only need this to be > 0 to model "reserves layout space".
 */
function estimateLabelWidth(text: string): number {
  const fontPx = toPx(decl('.sidebar__link', 'font-size')) || 14; // 0.9rem
  return text.length * fontPx * 0.55; // rough average glyph advance
}

function computeCollapsedGeometry(labelText: string): CollapsedGeometry {
  const navPadX = horizontalPadding(decl('.sidebar__nav', 'padding'));
  const linkBoxWidth = SIDEBAR_COLLAPSED_WIDTH - 2 * navPadX;

  const linkPadX = horizontalPadding(decl('.layout.is-collapsed .sidebar__link', 'padding')) ||
    horizontalPadding(decl('.sidebar__link', 'padding'));

  // gap: collapsed override if present, else base link gap.
  const collapsedGap = decl('.layout.is-collapsed .sidebar__link', 'gap');
  const gap = collapsedGap !== undefined
    ? toPx(collapsedGap)
    : toPx(decl('.sidebar__link', 'gap'));

  const iconWidth = toPx(decl('.sidebar__icon', 'min-width')) || 22;

  // Is the collapsed label removed from flow?
  // It is removed only if the collapsed label rule sets width:0 or display:none.
  const collapsedLabelWidth = decl('.layout.is-collapsed .sidebar__label', 'width');
  const collapsedLabelDisplay = decl('.layout.is-collapsed .sidebar__label', 'display');
  const removedFromFlow =
    collapsedLabelDisplay === 'none' || toPx(collapsedLabelWidth) === 0 && collapsedLabelWidth !== undefined;

  const labelReservedWidth = removedFromFlow ? 0 : estimateLabelWidth(labelText);

  const justify =
    decl('.layout.is-collapsed .sidebar__link', 'justify-content') || 'flex-start';

  return {
    linkContentWidth: linkBoxWidth - 2 * linkPadX,
    linkBoxWidth,
    iconWidth,
    labelReservedWidth,
    gap,
    linkPadX,
    justify,
  };
}

/**
 * Given the collapsed geometry, compute the icon's horizontal box within the
 * LINK BOX coordinate space (0 = left edge of the link box).
 *
 * The flex row lays out: [icon][gap][label] centered (justify-content: center)
 * within the content area. The content area starts at linkPadX inside the box.
 */
function iconBoxWithinLink(g: CollapsedGeometry): { left: number; right: number; center: number } {
  const groupWidth = g.iconWidth + (g.labelReservedWidth > 0 ? g.gap + g.labelReservedWidth : 0);
  const contentStart = g.linkPadX;

  let groupLeft: number;
  if (g.justify === 'center') {
    groupLeft = contentStart + (g.linkContentWidth - groupWidth) / 2;
  } else {
    // flex-start
    groupLeft = contentStart;
  }

  const iconLeft = groupLeft;
  const iconRight = groupLeft + g.iconWidth;
  return { left: iconLeft, right: iconRight, center: (iconLeft + iconRight) / 2 };
}

// ---------------------------------------------------------------------------
// Bug condition (from design): the collapsed desktop sidebar link.
// ---------------------------------------------------------------------------

interface SidebarRenderState {
  isDesktop: boolean;
  collapsed: boolean;
  element: string;
  labelText: string;
}

function isBugCondition(input: SidebarRenderState): boolean {
  return input.isDesktop === true && input.collapsed === true && input.element === 'sidebar__link';
}

// Concrete nav items rendered by Layout.tsx.
const NAV_ITEMS = [
  { label: 'Inicio', icon: '🏠' },
  { label: 'Empresas', icon: '🏢' },
];

// Tolerance for "centered" (px). The link box is 72 - 2*12 = 48px wide;
// a 1px tolerance is generous for detecting a real off-center defect.
const CENTER_TOLERANCE_PX = 1;

// ---------------------------------------------------------------------------
// Property 1: collapsed icon centered & contained (EXPECTED TO FAIL on unfixed CSS)
// ---------------------------------------------------------------------------

describe('Feature: collapsed-menu-icon-centering, Property 1: Bug Condition - Collapsed Icon Centered and Contained', () => {
  const collapsedStateArb: fc.Arbitrary<SidebarRenderState> = fc
    .constantFrom(...NAV_ITEMS)
    .map((item) => ({
      isDesktop: true,
      collapsed: true,
      element: 'sidebar__link',
      labelText: item.label,
    }));

  /**
   * Req 2.1 — each icon's horizontal center equals its link box center within tolerance.
   *
   * On unfixed code the hidden label + gap remain in flow, so the centered
   * flex group is (icon + gap + label); the icon lands LEFT of the box center.
   *
   * **Validates: Requirements 1.1, 1.2, 2.1**
   */
  it('centers each collapsed nav icon within its link box (icon alone)', () => {
    fc.assert(
      fc.property(collapsedStateArb, (input) => {
        // scope: only the bug condition
        fc.pre(isBugCondition(input));

        const g = computeCollapsedGeometry(input.labelText);
        const icon = iconBoxWithinLink(g);
        const boxCenter = g.linkBoxWidth / 2;

        expect(Math.abs(icon.center - boxCenter)).toBeLessThanOrEqual(CENTER_TOLERANCE_PX);
      }),
      { numRuns: NAV_ITEMS.length }
    );
  });

  /**
   * Req 2.2 — the collapsed label reserves ZERO content width.
   *
   * On unfixed code `opacity: 0` leaves the intrinsic width intact, so this
   * reserved width is > 0 and the assertion fails.
   *
   * **Validates: Requirements 1.2, 2.2**
   */
  it('reserves zero content width for the hidden collapsed label', () => {
    fc.assert(
      fc.property(collapsedStateArb, (input) => {
        fc.pre(isBugCondition(input));

        const g = computeCollapsedGeometry(input.labelText);
        expect(g.labelReservedWidth).toBe(0);
      }),
      { numRuns: NAV_ITEMS.length }
    );
  });

  /**
   * Req 2.3 — each icon's left/right edges fall within the link box bounds (no overflow).
   *
   * On unfixed code the shifted (icon + gap + hidden-label) group pushes the
   * icon's box past the link box bounds within the 72px collapsed width.
   *
   * **Validates: Requirements 1.3, 2.3**
   */
  it('keeps each collapsed nav icon fully within the link box bounds', () => {
    fc.assert(
      fc.property(collapsedStateArb, (input) => {
        fc.pre(isBugCondition(input));

        const g = computeCollapsedGeometry(input.labelText);
        const icon = iconBoxWithinLink(g);

        expect(icon.left).toBeGreaterThanOrEqual(0);
        expect(icon.right).toBeLessThanOrEqual(g.linkBoxWidth);
      }),
      { numRuns: NAV_ITEMS.length }
    );
  });
});
