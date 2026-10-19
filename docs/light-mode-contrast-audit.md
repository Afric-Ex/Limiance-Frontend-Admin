# Light Mode Contrast Audit

Last updated: 2026-10-19

## Scope and method

This audit covers the token layers and shared components used by the Limiance
Admin application:

- `src/styles/tokens.css`
- `src/styles/base.css`
- `src/styles/components.css`
- `src/styles/layout.css`
- `src/styles/light-mode.css`
- global page shells in `src/components/AdminLayout.css`
- shared page components (audit, market overview, orderbook, KYC, support,
  deposit/withdrawal queues, modals, charts, toasts)

Contrast ratios use the WCAG 2.x relative-luminance formula:

```
contrast = (L1 + 0.05) / (L2 + 0.05)
```

Targets:

- 4.5:1 for normal text (WCAG AA 1.4.3)
- 3:1 for large text (>= 18.66px bold or >= 24px regular)
- 3:1 for user-interface components and graphical objects (WCAG AA 1.4.11)

The audit was completed with a PowerShell luminance calculator against the
final token values. Browser screenshots were not part of this pass because the
project does not include Playwright/Puppeteer; see "Verification limits".

## Core light palette

| Token | Value | On `#FFFFFF` | On `#F9FAFB` | On `#F3F4F6` | Use |
|---|---|---:|---:|---:|---|
| `--color-text-primary` | `#0F172A` | 17.85 | 17.08 | 16.22 | Headings, body, table cells |
| `--color-text-secondary` | `#4B5563` | 7.56 | 7.26 | 6.87 | Labels, secondary copy |
| `--color-text-tertiary` | `#5F6773` | 5.72 | 5.47 | 5.19 | Table headers, metadata |
| `--color-text-muted` | `#5F6773` | 5.72 | 5.47 | 5.19 | Muted labels |
| `--color-text-faint` | `#5F6773` | 5.72 | 5.47 | 5.19 | Least emphasis text |
| `--color-text-placeholder` | `#6B7280` | 4.83 | 4.63 | 4.39 | Placeholders inside white inputs |
| `--color-accent-primary` | `#2563EB` | 5.17 | 4.95 | 4.70 | Links, active text, focus |
| `--color-accent-primary-hover` | `#1D4ED8` | 6.70 | 6.41 | 6.09 | Active nav text, hover |
| `--color-border-control` | `#7E889A` | 3.57 | 3.42 | 3.25 | Input/button boundaries |
| `--color-border-default` | `#E5E7EB` | 1.24 | 1.19 | 1.12 | Decorative dividers only |

The supplied spec used `#9CA3AF` for tertiary text and placeholders. That value
is 2.54:1 on white and fails AA, so the application uses `#5F6773` for text and
`#6B7280` for input placeholders. Placeholders always render on
`--color-background-input` (`#FFFFFF`), where `#6B7280` measures 4.83:1.

## Semantic colors

Tinted badges use the darker semantic text token on the matching light tint.
Solid buttons use the solid token with white text.

| Role | Text token | Value | Tint | Ratio | Solid token | White on solid |
|---|---|---|---:|---:|---|---:|
| Success | `--color-success-text` | `#047857` | `#D1FAE5` | 4.84 | `#047857` | 5.48 |
| Warning | `--color-warning-text` | `#B45309` | `#FEF3C7` | 4.51 | `#B45309` | 5.02 |
| Danger | `--color-error-text` | `#B91C1C` | `#FEE2E2` | 5.30 | `#B91C1C` | 6.47 |
| Info | `--color-info-text` | `#1E40AF` | `#DBEAFE` | 7.15 | `#1E40AF` | 8.72 |
| Purple | `--color-accent-purple` | `#6D28D9` | - | 7.10 | `#7C3AED` | 5.70 |

The spec's `#059669` and `#D97706` are retained as decorative accents but are
not used as text on their tints: those combinations measure about 3.4:1 and
fail normal-text AA.

## Components

### Navigation

| Element | Foreground | Background | Ratio |
|---|---|---|---:|
| Inactive nav item | `#4B5563` | `#FFFFFF` | 7.56 |
| Active nav item | `#1D4ED8` | `#E0E7FF` | 5.44 |
| Active nav icon | `#2563EB` | `#E0E7FF` | 4.19 (UI object, passes 3:1) |
| Logout hover | `#B91C1C` | `#FEF2F2` | 5.91 |

The active item background is `#E0E7FF`. `#2563EB` on that background is 4.19:1,
which is valid for icons (3:1) but not for text, so active text uses
`--color-accent-primary-hover` (`#1D4ED8`, 5.44:1).

### Forms and secondary buttons

- Control borders use `#7E889A`: 3.57:1 on white, 3.42:1 on `#F9FAFB`,
  3.25:1 on `#F3F4F6`.
- Focus rings use `#2563EB` at 5.17:1 on white.
- Disabled controls are exempt from 1.4.3; `--color-text-disabled` is
  `#D1D5DB` and is never used for enabled text.
- `.btn-secondary` uses the control border plus `--color-text-primary`.

### Buttons, pills and badges

| Combination | Ratio |
|---|---:|
| White on primary `#2563EB` | 5.17 |
| White on primary hover `#1D4ED8` | 6.70 |
| White on success solid `#047857` | 5.48 |
| White on warning solid `#B45309` | 5.02 |
| White on danger solid `#B91C1C` | 6.47 |
| White on purple solid `#7C3AED` | 5.70 |
| White on pill `#1F2937` | 14.68 |
| White on pill hover `#374151` | 10.31 |
| White on active pill `#2563EB` | 5.17 |

Badge text uses the semantic text tokens above. Badge and pill radii follow the
spec: pills are fully rounded; badges use 4px.

### Tables

- Header text uses `--color-text-tertiary` (`#5F6773`): 5.19:1 on the page
  background, 5.72:1 on white cards.
- Body text uses `--color-text-primary` or `--color-text-secondary`, both above
  4.5:1.
- Row separators and table borders are decorative and use
  `--color-border-default` (`#E5E7EB`). They do not define a control boundary.

### Modals and toasts

- Modal overlay: `rgba(15, 23, 42, 0.55)`; modal surface `#FFFFFF`.
- Modal title `#0F172A`, message `#4B5563`; ratios 17.85 and 7.56 on white.
- Toast success/error backgrounds use `--color-success-solid` and
  `--color-error-solid` with white text (5.48 and 6.47).

## Known exceptions and documentation

| Item | Status | Rationale |
|---|---|---|
| Disabled text (`#D1D5DB`) | Exempt | WCAG 1.4.3 exempts inactive controls. |
| Decorative dividers (`#E5E7EB`, `#F3F4F6`) | Exempt | Not controls and not required to understand content; control borders use `#7E889A`. |
| Chart series colors | Exception | Brand/data-series colors are visual encoding, not text. Tooltips and axes use text tokens. |
| Chain/brand marks | Exception | Third-party brand colors are preserved; labels next to them use AA text tokens. |
| Decorative glow tints | Exception | Colored `rgba()` shadows and icon tints are not text and do not carry meaning. |
| Dark-mode control borders | Preserved | The dark theme was not re-palettized; its control borders remain subtle and rely on background contrast plus focus rings. |

## Verification limits

- Ratios were calculated directly from the token hex values.
- The application was built successfully after the final token changes.
- Automated screenshots and pixel-level spot checks require a browser driver.
  Add Playwright or Puppeteer if visual evidence is required for sign-off.

## Re-checking

1. Update values in `src/styles/tokens.css` only.
2. Recompute ratios for text against its actual surface (card, page, tint).
3. Run `npm run lint` and `npm run build`.
4. Update this document whenever a token value changes.
