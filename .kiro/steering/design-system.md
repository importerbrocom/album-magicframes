# Design system (public album UI)

Source of truth: `frontend/src/index.css` (CSS variables + themes) and
`frontend/tailwind.config.js`. Reuse these tokens; do not hard-code colors or
fonts in components.

## Theming model

- Themes are set with `data-theme="<name>"` and override CSS variables:
  `--bg --surface --text --muted --accent --accent-contrast --card-radius
  --heading-font --body-font --heading-weight --letter-spacing --card-shadow`
  (`akhila` also sets `--script-font`).
- Components read `var(--accent)`, `var(--surface)`, etc. Use
  `color-mix(in srgb, var(--token) N%, transparent)` for tints/borders.
- Themes: `classic` (default), `modern`, `cinematic`, `minimal`, `luxury`,
  `traditional`, `akhila`.
- **`akhila` is the brand theme** (cinematic dark + gold): bg `#080a09`,
  surface `#17130d`, text `#f6f0e7`, muted `#c9c2b8`, **accent `#d9ad60`**,
  radius `0`, heading Cormorant Garamond 500, body Montserrat (weight 300).
  `.btn-accent` there is square, uppercase, `0.18em` tracking, `0.75rem`.
- Default (`:root`/classic) accent is `#c8a96a`; do not assume `#d9ad60`
  outside the akhila theme - always use `var(--accent)`.

## Typography

Loaded via one Google Fonts `@import` at the top of `index.css`:
Cormorant Garamond (400/500/600/italic), Great Vibes, Inter (300-600),
Montserrat (100-600), Playfair Display (400-700).

| Use | Font |
|---|---|
| Headings | `var(--heading-font)` (Cormorant Garamond by default) |
| Body | `var(--body-font)` (Inter; Montserrat on akhila) |
| Script flourishes / brand | `.font-script`, `.font-brand` (Great Vibes, line-height 1.35) |
| Header wordmark | Montserrat **weight 100**, `var(--accent)` |

Tailwind: `font-serif` = Cormorant Garamond, `font-sans` = Inter. Palette
helpers: `cream #faf6f0`, `warmwhite #fffdf9`, `beige #e9ddcc`, `blush #f3dfe0`,
`gold #c8a96a`, `charcoal #2b2824`.

## Header (`components/AlbumHeader.jsx`)

- Sticky, `backdrop-blur-md`, background = surface at 85% via `color-mix`.
- Container `max-w-6xl`, padding `px-3 py-2.5` (mobile) / `sm:px-4 sm:py-3`.
- Left: logo (`h-10` -> `sm:h-16` -> `lg:h-20`, `transparent` variant) + text
  `magicframes.co.in` (`text-sm` -> `sm:text-xl` -> `lg:text-2xl`, `tracking-wide`,
  `leading-none`, `truncate`). The whole block links to
  `https://magicframes.co.in` in a new tab (`rel="noopener noreferrer"`).
- Right: `SocialLinks`. Text uses `min-w-0 flex-1` so it never overlaps icons on
  small screens; keep `truncate`.

## Social icons (`components/SocialLinks.jsx`)

- Instagram, WhatsApp, Facebook, Pinterest; only icons with a URL render.
- Links are **global** (Settings table), not per album. Admin edits them in
  Settings.
- Circle buttons `h-8 w-8` -> `sm:h-9 sm:w-9`, 1px border, icon `h-4 w-4` ->
  `sm:h-[18px] sm:w-[18px]`. `variant="dark"` (default) uses
  `var(--accent)` icon color; `variant="light"` is white-on-dark for the cover.
- Icons are inline single-color SVGs using `currentColor`.

## Brand assets

- Favicon: `/logo2.png?v=8` (set in `frontend/index.html`). Bump `?v=` whenever
  the file changes. The wide wordmark looks small in a square slot; a square
  monogram would read better if this is revisited.
- Header logo: `components/Logo.jsx` (transparent variant `logotrans.png`).
- Dashboard (admin) shows the text "Dashboard", not the logo.
- Tagline copy: "Capture with love" (not "care").

## Public page conventions

- Gallery "Auto" view uses `preview_url` (higher quality) with 2 columns on
  mobile and **3 on larger screens**; thumbnails stay `thumb`.
- Hero film plays inline with controls and autoplays (`HeroFilm.jsx`).
- Video gallery supports uploaded files and YouTube links, each with a heading.
- Google Drive tab is removed. CATEGORY/THEME labels are not shown on the album
  detail page.
- Client enquiry box (`EnquiryForm`) is on the public album page; submissions are
  stored locally then forwarded (see `crn-leads-integration.md`).
- Images always go through the backend proxy endpoints (see `project.md`).
