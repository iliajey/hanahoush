# Hanahoush — Brand Guidelines

> Visual identity derived from the Hanahoush logo (a stylized "ه" on a brand
> mark). The Phase 9C palette was **measured from the actual brand mark**
> (`IMG_2854.PNG`) via programmatic color analysis (k-means + median-cut
> clustering; see `docs/reports/phase-09C-report.md` §2–3): a **violet-magenta
> primary (#932990)** paired with a **deep indigo ink (#272161)** on a
> **near-white surface**, with the mark's intrinsic magenta → indigo gradient
> preserved as the identity gradient.

---

## Brand mark

- The mark is the Persian letter **ه** ("h") inside a rounded square,
  rendered on the primary gradient (`brand-600 → brand-950`).
- Wordmark: "Hanahoush" set in Vazirmatn/Inter, bold, letter-spaced tight.

## Color palette

### Light theme

| Role | Token | Value (HSL) | Hex |
|------|-------|-------------|------|
| Primary | `--primary` | `302 56% 37%` | `#932990` |
| Primary foreground | `--primary-foreground` | `0 0% 100%` | `#ffffff` |
| Secondary | `--secondary` | `288 33% 94%` | `#F3EBF5` |
| Accent | `--accent` | `309 44% 94%` | `#F6E8F4` |
| Surface (background) | `--background` | `330 33% 99%` | `#FDFBFC` |
| Surface (card) | `--card` | `0 0% 100%` | `#ffffff` |
| Text | `--foreground` | `247 55% 21%` | `#1F1853` |
| Muted text | `--muted-foreground` | `281 26% 45%` | `#7E5691` |
| Border/input | `--border` | `294 21% 90%` | `#E9DFEA` |
| Ring | `--ring` | `302 56% 37%` | `#932990` |

### Dark theme

| Role | Token | Value (HSL) | Hex |
|------|-------|-------------|------|
| Primary | `--primary` | `302 49% 57%` | `#C75BC3` |
| Primary foreground | `--primary-foreground` | `250 56% 14%` | `#171039` |
| Secondary | `--secondary` | `253 28% 20%` | `#2A2440` |
| Accent | `--accent` | `270 52% 23%` | `#3A1C58` |
| Surface (background) | `--background` | `252 43% 7%` | `#0D0A19` |
| Surface (card) | `--card` | `252 36% 11%` | `#161226` |
| Text | `--foreground` | `272 33% 92%` | `#ECE5F2` |
| Muted text | `--muted-foreground` | `269 17% 67%` | `#AB9DBA` |
| Border/input | `--border` | `254 30% 21%` | `#2C2544` |
| Ring | `--ring` | `303 56% 69%` | `#DC82D7` |

### Semantic status

Light uses darker, WCAG-safe steps for text; dark uses bright steps (they sit on
dark surfaces).

| Role | Light | Dark |
|------|-------|------|
| Success | `#15803D` (5.0:1 on white) | `#34D399` |
| Warning | `#B45309` (5.0:1 on white) | `#FBBF24` |
| Error (destructive) | `#DC2626` (4.8:1 on white) | `#F0564D` |
| Info | `#932990` (7.1:1 on white) | `#C75BC3` |

## Brand scale (violet-magenta → deep indigo)

| Step | Hex |
|------|-----|
| 50 | `#FDF6FB` |
| 100 | `#F7E8F7` |
| 200 | `#EDD1EC` |
| 300 | `#DDABDB` |
| 400 | `#C57EC2` |
| 500 | `#A652A3` |
| 600 | `#932990` |
| 700 | `#7A2477` |
| 800 | `#5D2061` |
| 900 | `#3F1C58` |
| 950 | `#272161` |

## Brand role tokens

Consumed via the single `brand` namespace in `src/design/colors` (never raw hex
in components): `brand.primary` (#932990), `brand.primaryHover` (#7A2477),
`brand.primaryActive` (#691E68), `brand.secondary` (#272161),
`brand.secondaryHover` (#1F1853), `brand.accent` (#C75BC3),
`brand.accentSoft` (#F6E8F4), `brand.onPrimary` (#FFFFFF),
`brand.onSecondary` (#FDF6FB).

## Gradient rules

- **Primary gradient:** `brand-600 → brand-950` (violet-magenta → deep indigo),
  mirroring the brand mark. Used on the logo, primary identity moments, hero
  orbs, section dividers and the footer signature hairline.
- **Text on gradient:** always `brand.onPrimary` (#fff in light, deep ink in
  dark) to keep ≥7.09:1 contrast on the magenta end and ≥14:1 on the ink end.
- **Never** put body text on gradients; gradients sit behind opaque text blocks
  or within dedicated containers.
- Dark mode gradients lower luminance (deeper indigo) and never exceed ~8% of a
  screen's area.

## Usage rules

- Do not exceed one primary gradient CTA per screen section.
- Semantic tokens only — never raw hex in components.
- Icons inherit `currentColor`; decorative icons use `muted-foreground`.
- RTL/LTR: gradient direction uses logical reading flow (start → end).
- Where a raw brand color fails WCAG, a UI-safe variant is used
  (e.g. deeper `--primary-foreground` in dark mode, darker status text in
  light) while the original is preserved as a decorative token.
