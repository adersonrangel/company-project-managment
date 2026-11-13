# Design system

Synced from project sources:

- `frontend/src/styles/theme.css`
- `frontend/src/styles/global.css`

This file records only values found in the sources. The project uses HSL channel custom properties and exposes them through Tailwind v4.

## Color

| Token | Value | Usage | Source |
| --- | --- | --- | --- |
| `--background` | `210 40% 98%` | Page background, light theme. | `frontend/src/styles/theme.css` |
| `--foreground` | `222 47% 11%` | Primary text and dark surfaces. | `frontend/src/styles/theme.css` |
| `--card` | `0 0% 100%` | Card and surface background. | `frontend/src/styles/theme.css` |
| `--card-foreground` | `222 47% 11%` | Text on cards. | `frontend/src/styles/theme.css` |
| `--muted` | `210 40% 96%` | Subtle backgrounds. | `frontend/src/styles/theme.css` |
| `--muted-foreground` | `215 16% 47%` | Secondary text and helper copy. | `frontend/src/styles/theme.css` |
| `--border` | `214 32% 91%` | Default border color. | `frontend/src/styles/theme.css` |
| `--input` | `214 32% 91%` | Input border color. | `frontend/src/styles/theme.css` |
| `--primary` | `243 75% 54%` | Main action color, verified for white text. | `frontend/src/styles/theme.css` |
| `--primary-hover` | `243 70% 47%` | Primary hover state. | `frontend/src/styles/theme.css` |
| `--primary-foreground` | `0 0% 100%` | Text on primary actions. | `frontend/src/styles/theme.css` |
| `--ring` | `243 75% 54%` | Focus ring color. | `frontend/src/styles/theme.css` |
| `--success` | `142 71% 45%` | Success actions and strong positive states. | `frontend/src/styles/theme.css` |
| `--success-foreground` | `0 0% 100%` | Text on success actions. | `frontend/src/styles/theme.css` |
| `--success-soft` | `142 71% 92%` | Soft success background. | `frontend/src/styles/theme.css` |
| `--success-soft-foreground` | `142 64% 24%` | Text on soft success background. | `frontend/src/styles/theme.css` |
| `--danger` | `0 72% 51%` | Destructive actions and errors. | `frontend/src/styles/theme.css` |
| `--danger-hover` | `0 74% 42%` | Destructive hover state. | `frontend/src/styles/theme.css` |
| `--danger-foreground` | `0 0% 100%` | Text on destructive actions. | `frontend/src/styles/theme.css` |
| `--danger-soft` | `0 86% 95%` | Soft error background. | `frontend/src/styles/theme.css` |
| `--danger-soft-foreground` | `0 70% 35%` | Text on soft error background. | `frontend/src/styles/theme.css` |
| `--warning` | `38 92% 50%` | Warning accents. | `frontend/src/styles/theme.css` |
| `--warning-foreground` | `0 0% 100%` | Text on warning surfaces. | `frontend/src/styles/theme.css` |
| `--sidebar` | `222 47% 11%` | Dark sidebar and high-contrast brand panels. | `frontend/src/styles/theme.css` |
| `--sidebar-foreground` | `210 40% 96%` | Text on dark sidebar panels. | `frontend/src/styles/theme.css` |
| `--sidebar-muted` | `215 20% 65%` | Muted text on dark surfaces. | `frontend/src/styles/theme.css` |
| `--sidebar-active` | `243 75% 59%` | Active state on dark surfaces. | `frontend/src/styles/theme.css` |
| `--chart-1` | `243 75% 59%` | Primary chart data color. | `frontend/src/styles/theme.css` |
| `--chart-2` | `142 71% 45%` | Positive or secondary chart data color. | `frontend/src/styles/theme.css` |
| `--chart-3` | `215 16% 55%` | Neutral chart data color. | `frontend/src/styles/theme.css` |
| `--chart-4` | `38 92% 50%` | Warning or highlight chart data color. | `frontend/src/styles/theme.css` |
| `--chart-grid` | `214 32% 91%` | Chart grid lines. | `frontend/src/styles/theme.css` |

Dark theme variants are present in `[data-theme='dark']` in `frontend/src/styles/theme.css`. Use them only when the artboard intentionally renders the dark theme.

## Typography

- Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif` (`frontend/src/styles/global.css`).
- Base line height: `1.6` (`frontend/src/styles/global.css`).
- Headings: `h1, h2, h3` reset top/bottom with `margin: 0 0 0.5rem` (`frontend/src/styles/global.css`).
- Control and table text commonly use `0.875rem` in `global.css`.
- Page toolbar title uses `1.4rem` and `font-weight: 700` in `global.css`.
- No numeric type scale is explicitly defined in the sources; keep hierarchy through existing control/table/heading sizes and layout.

## Spacing

No global spacing scale token file was found. The sources use practical component spacing:

- Buttons: `padding: 0.5rem 1rem` (`frontend/src/styles/global.css`).
- Inputs and selects: `padding: 0.55rem 0.75rem` (`frontend/src/styles/global.css`).
- Table cells: `padding: 0.85rem 1rem` (`frontend/src/styles/global.css`).
- Page toolbar margin: `1.5rem` (`frontend/src/styles/global.css`).

## Radius

| Token | Value | Source |
| --- | --- | --- |
| `--radius-sm` | `0.375rem` | `frontend/src/styles/theme.css` |
| `--radius-md` | `0.625rem` | `frontend/src/styles/theme.css` |
| `--radius-lg` | `0.875rem` | `frontend/src/styles/theme.css` |
| `--radius-xl` | `1.125rem` | `frontend/src/styles/theme.css` |

## Shadows

| Token | Value | Source |
| --- | --- | --- |
| `--shadow-sm` | `0 1px 2px hsl(222 47% 11% / 0.06)` | `frontend/src/styles/theme.css` |
| `--shadow-md` | `0 4px 16px hsl(222 47% 11% / 0.08)` | `frontend/src/styles/theme.css` |
| `--shadow-lg` | `0 12px 32px hsl(222 47% 11% / 0.12)` | `frontend/src/styles/theme.css` |

Dark theme shadows use black alpha in `frontend/src/styles/theme.css`.

## Component rules

### Buttons

- Base buttons: `cursor: pointer`, transparent border, `border-radius: var(--radius)`, `padding: 0.5rem 1rem`, `font-size: 0.875rem`, `font-weight: 500`.
- Hover: border uses `--border`, shadow uses `--shadow-sm`.
- Active: `transform: translateY(1px)`.
- Focus: visible focus ring with `box-shadow: 0 0 0 3px hsl(var(--ring) / 0.35)`.
- `.primary`: background and border use `--primary`, text uses `#fff`; hover uses `--primary-hover`.
- `.danger`: background and border use `--danger`, text uses `#fff`; hover uses `--danger-hover`.
- `.ghost`: transparent background and border, text uses `--primary`, hover uses `hsl(var(--primary) / 0.1)`.
- Source: `frontend/src/styles/global.css`.

### Inputs and selects

- Padding: `0.55rem 0.75rem`.
- Border: `1px solid var(--color-border)`.
- Radius: `var(--radius)`.
- Font size: `0.875rem`.
- Width: `100%`.
- Background: `var(--color-surface)`.
- Text: `var(--color-text)`.
- Focus: border `--primary`, ring `0 0 0 3px hsl(var(--ring) / 0.2)`.
- Source: `frontend/src/styles/global.css`.

### Cards and surfaces

- Background: `var(--color-surface)`.
- Border: `1px solid var(--color-border)`.
- Radius: `var(--radius-lg)`.
- Shadow: `var(--shadow-sm)`.
- Source: `frontend/src/styles/global.css`.

### Tables

- Table background: `var(--color-surface)` through `.table-card`.
- Table container radius: `var(--radius-lg)`.
- Cell padding: `0.85rem 1rem`.
- Borders: `1px solid var(--color-border)` between rows.
- Last row removes bottom border.
- Source: `frontend/src/styles/global.css`.

## Compatibility aliases

`global.css` maps legacy `--color-*` aliases to semantic tokens:

- `--color-primary` -> `--primary`
- `--color-primary-hover` -> `--primary-hover`
- `--color-danger` -> `--danger`
- `--color-danger-hover` -> `--danger-hover`
- `--color-bg` -> `--background`
- `--color-surface` -> `--card`
- `--color-text` -> `--foreground`
- `--color-text-muted` -> `--muted-foreground`
- `--color-border` -> `--border`
- `--color-success-bg` -> `--success-soft`
- `--color-success-text` -> `--success-soft-foreground`
- `--color-danger-bg` -> `--danger-soft`
- `--color-danger-text` -> `--danger-soft-foreground`
- `--radius` -> `--radius-md`

Use semantic tokens in new artboards where possible.