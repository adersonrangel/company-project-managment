# Bugfix Requirements Document

## Introduction

When the desktop sidebar navigation is collapsed (minimized to its icon-only width), the navigation icons for "Inicio" (Home) and "Empresas" (Companies) are not centered within their link container. Instead they are shifted and appear to spill outside the bounds of the link's rounded box.

This happens because, in the collapsed state, each navigation link still reserves horizontal space for its (now visually hidden) text label and the gap between the icon and that label, and because the link's own horizontal padding plus the icon's minimum width can exceed the reduced sidebar width. The label is hidden with `opacity: 0`, which keeps it in the layout flow, so centering the flex content centers the icon-plus-hidden-label group rather than the icon alone. The result is off-center icons that break out of their containing box in the collapsed sidebar.

The bug affects only the collapsed desktop sidebar. The expanded desktop sidebar and the mobile/open sidebar (where labels are meant to be visible) should be unaffected.

## Bug Analysis

### Current Behavior (Defect)

When the sidebar is collapsed on desktop, the navigation icons are misaligned relative to their link container.

1.1 WHEN the sidebar is collapsed on desktop THEN the system renders the Home and Empresas navigation icons off-center within their link container
1.2 WHEN the sidebar is collapsed on desktop THEN the system reserves layout space for the hidden text label (and the icon-to-label gap), so the icon is shifted from the true horizontal center of the link box
1.3 WHEN the sidebar is collapsed on desktop THEN the system allows the icon to overflow the visible bounds of the link's rounded box because the link's horizontal padding plus the icon minimum width exceed the collapsed sidebar width

### Expected Behavior (Correct)

When the sidebar is collapsed on desktop, each navigation icon should sit centered within its link container and stay inside the box.

2.1 WHEN the sidebar is collapsed on desktop THEN the system SHALL render each navigation icon horizontally centered within its link container
2.2 WHEN the sidebar is collapsed on desktop THEN the system SHALL NOT reserve layout space for the hidden text label so the icon is centered based on the icon alone
2.3 WHEN the sidebar is collapsed on desktop THEN the system SHALL keep each navigation icon fully within the visible bounds of the link's rounded box

### Unchanged Behavior (Regression Prevention)

Existing behavior outside the collapsed desktop state must be preserved.

3.1 WHEN the sidebar is expanded on desktop THEN the system SHALL CONTINUE TO display each navigation icon followed by its visible text label, left-aligned, with the existing spacing
3.2 WHEN the sidebar is open on mobile THEN the system SHALL CONTINUE TO display each navigation icon and its visible text label, left-aligned, with the existing spacing
3.3 WHEN a navigation link is active or hovered THEN the system SHALL CONTINUE TO apply its existing active and hover styling in both collapsed and expanded states
3.4 WHEN the user toggles the sidebar between expanded and collapsed THEN the system SHALL CONTINUE TO animate the width transition as it currently does
```

## Deriving the Bug Condition

**Bug Condition Function** — identifies the rendering state that triggers the bug:

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type SidebarRenderState
  OUTPUT: boolean

  // Bug occurs only for the collapsed desktop sidebar navigation links
  RETURN X.isDesktop = true AND X.collapsed = true AND X.element = "sidebar__link"
END FUNCTION
```

**Property Specification — Fix Checking** (icon centered and contained for buggy state):

```pascal
// Property: Fix Checking - Collapsed icon centering
FOR ALL X WHERE isBugCondition(X) DO
  result ← renderLink'(X)
  ASSERT icon_horizontally_centered(result) AND icon_within_box_bounds(result)
END FOR
```

**Preservation Goal — Preservation Checking** (non-collapsed states unchanged):

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT renderLink(X) = renderLink'(X)
END FOR
```

- **F**: The current `renderLink` styling (collapsed link centers icon-plus-hidden-label group, allowing overflow).
- **F'**: The fixed styling (collapsed link removes the hidden label from flow / neutralizes gap and padding so the icon alone is centered and contained).
