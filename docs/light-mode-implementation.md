# Light Mode Implementation Guide

Last updated: 2026-10-19

## Goal

The admin panel supports a full light theme driven by design tokens. Every
page and shared component reads colors from `data-theme`-aware CSS variables;
dark mode remains the default and keeps its original appearance.

## File layout

```
src/styles/
  index.css        Single entry point, fixed import order
  tokens.css       Dark + light token contract and legacy aliases
  base.css         Reset, body, typography, helpers, scrollbars
  components.css   Buttons, forms, cards, badges, pills, tables, alerts...
  layout.css       Page shell, header, toolbar, section primitives
  dark-mode.css    Dark-only component overrides
  light-mode.css   Light-only component overrides
```

`src/index.css` is a one-line shim:

```css
@import './styles/index.css';
```

Import order matters: tokens -> base -> components -> layout -> dark -> light.
The light file loads last so `[data-theme="light"]` overrides win without
`!important`.

## Theme switching

`src/context/ThemeContext.jsx` persists the choice in `localStorage`
(`admin_theme`) and applies `data-theme="light|dark"` plus the `.light-theme`
or `.dark-theme` class to both `<html>` and `<body>`. New CSS should target
`[data-theme="light"]`; the class selectors exist for compatibility with legacy
rules.

## Token layers

1. Spec tokens (`--color-background-*`, `--color-text-*`, `--color-border-*`,
   `--color-accent-*`, `--color-success/warning/error/info*`) are defined per
   theme in `tokens.css`.
2. Legacy aliases (`--bg-*`, `--text-*`, `--border*`, `--primary*`, `--accent-*`)
   map to the spec tokens so existing page CSS keeps working.
3. Components consume either layer. Prefer spec tokens for new code.

Important aliases:

| Alias | Maps to | Notes |
|---|---|---|
| `--bg-deep` | `--color-background-page` | App background |
| `--bg-card`, `--bg-surface-elevated` | `--color-background-card` | Cards |
| `--bg-surface`, `--bg-surface-2` | `--color-background-card-secondary` | Secondary panels |
| `--bg-input` | `--color-background-input` | Inputs |
| `--border`, `--border-subtle` | default/light border | Decorative only |
| `--border-medium`, `--border-light` | `--color-border-control` | Form/button boundaries, 3:1 |
| `--primary` | `--color-accent-primary` | Accent text/links |
| `--primary-solid` | `--color-accent-solid` | Filled buttons with white text |

`--color-accent-primary` and `--color-accent-solid` differ on purpose:

- Dark: primary `#4D77F0` (accent text) vs solid `#3B65DB` (white text).
- Light: primary and solid are both `#2563EB`.

Never put white text on `--color-accent-primary` in dark mode; use
`--primary-solid`.

## Component conventions

- **Filled buttons** (`.btn-primary`, active tabs, pills): background
  `--color-accent-solid` / semantic solid tokens; text white or
  `--color-text-inverse`.
- **Outline/secondary buttons** (`.btn-secondary`, icon buttons): background
  `--color-background-card`, border `--color-border-control`, text
  `--color-text-primary`.
- **Inputs/selects/textareas**: background `--color-background-input`, border
  `--color-border-control`; focus border `--color-accent-primary` plus a
  `--primary-glow` ring.
- **Cards**: background `--color-background-card`, border
  `--color-border-default`, radius `--radius-card`, shadow `--card-shadow`.
- **Badges**: 4px radius; tint background (`--color-*-light`) with
  `--color-*-text`; solid tokens only for filled states.
- **Pills**: `--radius-pill`; dark `#1F2937`/hover `#374151`, active
  `--color-accent-solid`, white text.
- **Tables**: `th` uses `--color-text-tertiary`, dividers
  `--color-border-default`, row hover `--color-background-hover`.
- **Modals/toasts**: overlay `--modal-overlay`; surfaces use card tokens;
  toasts use the semantic solid tokens.

## Migration summary

Hardcoded values were replaced with tokens across JSX and CSS:

| Old value | Token |
|---|---|
| `#4d77f0`, `#3b82f6`, `#2563eb` fills | `var(--primary-solid)` / `var(--color-accent-solid)` |
| `#6366f1`, `#818cf8` | `var(--primary)` or `var(--accent-purple)` per context |
| `#38bdf8` | `var(--accent-sky)` |
| `#a855f7` | `var(--accent-purple)` |
| `#34d399` | `var(--success)` / `var(--success-text)` |
| `#10b981` | `var(--success-solid)` for fills |
| `#ef4444`, `#dc2626` | `var(--danger-solid)` for fills |
| `#f59e0b` | `var(--warning-solid)` for fills |
| `rgba(239, 68, 68, 0.95)`, `rgba(16, 185, 129, 0.95)` | `var(--danger-solid)`, `var(--success-solid)` |
| Heavy black `box-shadow` literals | `var(--shadow-sm/md/lg)` |

Page-specific work:

- `AdminLayout.css`: light nav states, hover/active backgrounds, sidebar
  borders, hamburger/theme toggle, logout hover.
- `AuditPage.css`: rebuilt token-driven (filter bar, pills, event cards,
  expanded panel, pagination, record count).
- `MarketOverviewPage.css`: active tabs, badge counts, pair icons, change
  badges, ratio text, chart tab fills.
- `OrderbookPage.css`: market tab fills, view toggle, pair selector,
  empty/alert states.
- `KycQueuePage.css`: document viewer iframe background.
- `ConfirmModal.css`, `AuditReasonModal.css`, queue pages: button gradients
  now use solid semantic tokens so white text stays AA.
- `charts/Charts.css`: timeframe control, axis/tooltip light overrides.

## Intentional hardcoded values

These remain by design and are documented in the contrast audit:

- brand and chain marks (`#627EEA`, `#F7931A`, `#9945FF`, ...)
- decorative glow/tint rgba values and chart series colors
- `#E5E7EB`/`#F3F4F6` divider borders on cards and tables
- disabled-state text (`#D1D5DB`) and dark-mode subtle control borders

Do not reintroduce hardcoded accent/semantic fills in components; use the
solid tokens so both themes stay valid.

## How to add or change a color

1. Edit only `src/styles/tokens.css`.
2. Set the value in the dark block and the light block (and any alias).
3. Check the contrast against every surface the token can appear on
   (`#FFFFFF`, `#F9FAFB`, `#F3F4F6`, tinted backgrounds).
4. Add a page override only when a component needs a structural difference,
   not for color duplication.
5. Run `npm run lint` and `npm run build`.
6. Update `docs/light-mode-contrast-audit.md` if a public token changes.

## Testing checklist

- Toggle theme from the top bar; verify `<html data-theme>` and localStorage.
- Check each page in both themes: dashboard, users, KYC, deposits,
  withdrawals, orders, market overview, orderbook, audit, roles, policies,
  support tickets, wallets, treasury.
- Verify focus rings on inputs and buttons.
- Verify toasts, confirm modal, audit reason modal, and charts in light mode.
- Run `npm run lint` (pre-existing warnings are expected) and `npm run build`.

Automated visual regression needs a browser driver; the repository does not
currently include Playwright or Puppeteer. If visual sign-off is required, add
one of those tools and capture light/dark screenshots per page.
