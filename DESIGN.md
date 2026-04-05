# DESIGN.md — RepairDesk
> Apple-inspired premium minimalism: light, airy, typographically confident, surgically precise.

---

## Quick Start (Agent Prompt)

```
Build UI for RepairDesk using this design system.
Use ONLY the CSS variables and values defined below.
Background is near-white, not dark. Accent is Apple blue (#0071e3), not red.
Every surface is light. Depth comes from subtle shadow, not colour.
Apply all guardrails in Section 7 without exception.
Do not invent colours, radii, or shadows not listed here.
```

---

## 1. Visual Theme

Clean, premium, light-mode-first. Inspired by apple.com: vast negative space, large confident type, near-invisible borders, depth achieved through soft shadow not colour contrast. Surfaces are white or near-white with a cool undertone. The only colour is the blue CTA and semantic status indicators. Everything else is greyscale. Motion is restrained — 200ms ease, never bounce. The UI feels like it was machined, not designed.

---

## 2. Color Palette

| Token | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| App background | `#f5f5f7` | `--bg-app` | Page background (Apple site grey) |
| Surface | `#ffffff` | `--bg-surface` | Cards, panels |
| Elevated | `#f5f5f7` | `--bg-elevated` | Inputs, dropdowns, secondary bg |
| Hover | `#e8e8ed` | `--bg-hover` | Row hover, button hover |
| Text primary | `#1d1d1f` | `--text-primary` | All headings, body copy |
| Text secondary | `#6e6e73` | `--text-secondary` | Labels, captions, meta |
| Text tertiary | `#aeaeb2` | `--text-tertiary` | Placeholders, disabled |
| Accent blue | `#0071e3` | `--accent-blue` | Primary CTA, links, focus |
| Accent blue hover | `#0077ed` | `--accent-blue-hover` | Button hover state |
| Accent blue dim | `rgba(0,113,227,0.08)` | `--accent-blue-dim` | Focus ring bg, badge bg |
| Border subtle | `rgba(0,0,0,0.06)` | `--border-subtle` | Table rows, dividers |
| Border default | `rgba(0,0,0,0.12)` | `--border-default` | Input borders, card edges |
| Border strong | `rgba(0,0,0,0.22)` | `--border-strong` | Focused inputs, active states |
| Success | `#34c759` | `--accent-green` | Paid, collected, success |
| Success dim | `rgba(52,199,89,0.10)` | `--accent-green-dim` | Success badge bg |
| Warning | `#ff9f0a` | `--accent-amber` | Overdue, pending, warning |
| Warning dim | `rgba(255,159,10,0.10)` | `--accent-amber-dim` | Warning badge bg |
| Danger | `#ff3b30` | `--accent-red` | Errors, destructive |
| Danger dim | `rgba(255,59,48,0.08)` | `--accent-red-dim` | Error badge bg |
| Cyan/info | `#32ade6` | `--accent-cyan` | Issue ID, info highlights |
| Cyan dim | `rgba(50,173,230,0.10)` | `--accent-cyan-dim` | Info badge bg |

```css
:root {
  --bg-app:           #f5f5f7;
  --bg-surface:       #ffffff;
  --bg-elevated:      #f5f5f7;
  --bg-hover:         #e8e8ed;

  --text-primary:     #1d1d1f;
  --text-secondary:   #6e6e73;
  --text-tertiary:    #aeaeb2;

  --accent-blue:      #0071e3;
  --accent-blue-hover:#0077ed;
  --accent-blue-dim:  rgba(0,113,227,0.08);

  --border-subtle:    rgba(0,0,0,0.06);
  --border-default:   rgba(0,0,0,0.12);
  --border-strong:    rgba(0,0,0,0.22);

  --accent-green:     #34c759;
  --accent-green-dim: rgba(52,199,89,0.10);
  --accent-amber:     #ff9f0a;
  --accent-amber-dim: rgba(255,159,10,0.10);
  --accent-red:       #ff3b30;
  --accent-red-dim:   rgba(255,59,48,0.08);
  --accent-cyan:      #32ade6;
  --accent-cyan-dim:  rgba(50,173,230,0.10);

  --radius-sm:        6px;
  --radius-md:        10px;
  --radius-lg:        14px;
  --radius-xl:        18px;
  --radius-2xl:       24px;

  --page-pad-x:       24px;
}
```

---

## 3. Typography

**Font stack**: `"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif`
**Mono stack**: `"SF Mono", "Fira Code", ui-monospace, monospace`

| Role | Size | Weight | Line-height | Letter-spacing |
|------|------|--------|-------------|----------------|
| Display (hero) | 48px | 700 | 1.05 | -0.03em |
| H1 | 28px | 600 | 1.15 | -0.025em |
| H2 | 22px | 600 | 1.2 | -0.02em |
| H3 | 17px | 600 | 1.3 | -0.015em |
| Body large | 17px | 400 | 1.55 | 0 |
| Body base | 15px | 400 | 1.55 | 0 |
| Body small | 13px | 400 | 1.5 | 0 |
| Caption / label | 12px | 500 | 1.4 | 0.01em |
| Micro | 11px | 500 | 1.4 | 0.02em |
| Mono (issue ID) | 13px | 600 | 1.4 | 0.02em |

**Rules**:
- Headings: `--text-primary`, never secondary
- Body: `--text-primary` for content, `--text-secondary` for supporting text
- Labels above inputs: `--text-secondary`, 12px, weight 500, `text-transform: none`
- Monospaced values (issue IDs, amounts): SF Mono stack only

---

## 4. Components

### Button — Primary
```
background:    #0071e3
color:         #ffffff
padding:       9px 20px
border-radius: var(--radius-md)
font-size:     15px
font-weight:   400
border:        none
letter-spacing: 0
transition:    background 200ms ease, transform 80ms ease
hover:         background #0077ed
active:        transform scale(0.98)
focus-ring:    0 0 0 4px rgba(0,113,227,0.3)
disabled:      opacity 0.4, cursor not-allowed
```

### Button — Secondary
```
background:    rgba(0,0,0,0.06)
color:         var(--text-primary)
padding:       9px 20px
border-radius: var(--radius-md)
font-size:     15px
font-weight:   400
border:        none
hover:         background rgba(0,0,0,0.10)
active:        transform scale(0.98)
```

### Button — Ghost / Text
```
background:    transparent
color:         var(--accent-blue)
padding:       9px 16px
border:        none
font-size:     15px
hover:         background var(--accent-blue-dim)
border-radius: var(--radius-md)
```

### Input / Textarea
```
background:    var(--bg-surface)
border:        1px solid var(--border-default)
border-radius: var(--radius-md)
padding:       10px 14px
font-size:     15px
color:         var(--text-primary)
placeholder:   var(--text-tertiary)
transition:    border-color 150ms ease, box-shadow 150ms ease
focus:         border-color #0071e3
               box-shadow: 0 0 0 4px rgba(0,113,227,0.15)
               outline: none
```

### Card
```
background:    var(--bg-surface)
border:        1px solid var(--border-subtle)
border-radius: var(--radius-xl)
padding:       24px
box-shadow:    0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)
```

### Stat Card (KPI)
```
background:    var(--bg-surface)
border:        1px solid var(--border-subtle)
border-radius: var(--radius-xl)
padding:       20px 24px
box-shadow:    0 1px 4px rgba(0,0,0,0.05)
value-size:    28px, weight 600, color --text-primary
label-size:    13px, color --text-secondary
```

### Badge / Pill
```
border-radius: 20px (fully rounded)
padding:       3px 10px
font-size:     12px
font-weight:   500
border:        none
variants:
  paid     → bg --accent-green-dim, color --accent-green
  unpaid   → bg --accent-amber-dim, color --accent-amber
  danger   → bg --accent-red-dim,   color --accent-red
  info     → bg --accent-blue-dim,  color --accent-blue
  neutral  → bg rgba(0,0,0,0.06),   color --text-secondary
```

### Navbar
```
background:    rgba(255,255,255,0.80)
backdrop-filter: blur(20px) saturate(180%)
-webkit-backdrop-filter: blur(20px) saturate(180%)
border-bottom: 1px solid rgba(0,0,0,0.08)
height:        52px
box-shadow:    none (border-bottom only)
```

### Table
```
header-bg:     transparent
header-text:   var(--text-tertiary), 11px, weight 600, uppercase, letter-spacing 0.04em
row-border:    1px solid var(--border-subtle)
row-height:    48px (padding 12px 16px)
row-hover:     background var(--bg-hover)
cell-text:     var(--text-primary), 14px
```

### Toast / Notification
```
background:    var(--bg-surface)
border:        1px solid var(--border-subtle)
border-radius: var(--radius-lg)
padding:       12px 16px
box-shadow:    0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)
font-size:     14px
min-width:     260px
```

---

## 5. Layout

```
Max-width content:  980px   (text / forms)
Max-width wide:     1200px  (dashboards / tables)
Max-width full:     100%

Page padding:       --page-pad-x: 24px
                    @media < 640px → 16px

Navbar height:      52px
Content offset:     paddingTop: 52px + 24px = 76px

Spacing scale (px): 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96

Grid gaps:
  KPI cards:        16px
  Dashboard panels: 20px
  Form fields:      16px

Section spacing:    marginBottom 32px between major sections
```

---

## 6. Depth & Elevation

| Level | Usage | box-shadow |
|-------|-------|------------|
| 0 | Flat / inline | `none` |
| 1 | Stat cards, table containers | `0 1px 4px rgba(0,0,0,0.05)` |
| 2 | Cards, panels | `0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` |
| 3 | Dropdowns, popovers | `0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)` |
| 4 | Modals, toasts | `0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)` |

**Backdrop blur** (frosted glass):
- Navbar: `blur(20px) saturate(180%)`
- Modal backdrop: `rgba(0,0,0,0.4)` overlay, no blur on modal itself

**Border radius scale**:
```
--radius-sm:   6px   (badges, small tags)
--radius-md:   10px  (buttons, inputs, small cards)
--radius-lg:   14px  (panels, section cards)
--radius-xl:   18px  (main cards, dashboards)
--radius-2xl:  24px  (modals, large containers)
```

**Z-index scale**:
```
base:       0
card:       1
sticky:     10
navbar:     100
dropdown:   200
modal:      300
toast:      400
```

---

## 7. Guardrails

- **Never** use a dark background — this is a light-mode system; `--bg-app` is `#f5f5f7`
- **Never** use the old Elect red (`#E31837`) — accent is Apple blue (`#0071e3`) only
- **Never** use `backdrop-filter` aurora blobs or glowing backgrounds
- **Never** use `font-weight: 700` on body text — 400 for body, 600 for headings max
- **Never** use `border-radius > 24px` on any element
- **Never** use `box-shadow` with colour tints (no red/blue glows) — shadows are greyscale only
- **Never** use `text-transform: uppercase` on body text or buttons — only table headers
- **Never** add decorative gradients to backgrounds — solid colours only
- **Never** use more than 2 font weights on a single page section
- **Always** use `-apple-system, BlinkMacSystemFont` in font stack
- **Always** add `transition: 200ms ease` to all interactive hover states
- **Always** use `scale(0.98)` on button active/press states
- **Always** use fully-rounded pills (`border-radius: 20px`) for status badges
- **Always** derive spacing from the 4px base scale
- **Always** use `font-family: inherit` on all inputs, buttons, selects
- **Always** ensure focus states are visible: `box-shadow: 0 0 0 4px rgba(0,113,227,0.3)`

---

## 8. Responsive Behavior

| Breakpoint | Layout changes |
|-----------|----------------|
| `< 640px` (mobile) | Single column everywhere; KPI grid → 2×2; table → card list; page-pad-x → 16px; navbar hides email |
| `640px–1024px` (tablet) | KPI grid 2×2; dashboard panels stack vertically; table horizontal scroll |
| `> 1024px` (desktop) | Full layout; KPI grid 4-col; split panels side by side; table full-width |

**Navbar at mobile**: logo + sign-out only; email hidden; role pill hidden
**Tables at mobile**: `overflow-x: auto` wrapper; do not collapse to cards (too complex)
**Forms at mobile**: all fields full-width (remove 2-column grids)
**Typography at mobile**: H1 → 22px; display → 32px

---

## 9. Agent Prompts

### Generate a new page
```
Build a [page name] page for RepairDesk following DESIGN.md exactly.
Background is #f5f5f7. All surfaces are white. Accent is #0071e3.
No dark backgrounds, no glows, no gradients.
Cards use elevation Level 2. Buttons use the primary spec in Section 4.
Spacing from the 4px scale only. Typography from Section 3 only.
```

### Migrate an existing component
```
Rewrite [component] to match the Apple-style design system in DESIGN.md.
Replace all dark backgrounds with #f5f5f7 or #ffffff.
Replace all red accents (#E31837) with #0071e3.
Replace glassmorphism/blur effects with clean white cards and Level 2 elevation.
Replace aurora blobs and body::after effects with nothing — clean background only.
Keep all existing logic and props unchanged.
```

### Apply to index.css
```
Rewrite the CSS variables in src/index.css to match DESIGN.md Section 2 exactly.
Replace the dark-mode colour system with the light Apple palette.
Remove body::before and body::after aurora/gradient effects.
Set body background to #f5f5f7. Remove all glassmorphism utility classes.
Add the new elevation shadow variables from Section 6.
```
