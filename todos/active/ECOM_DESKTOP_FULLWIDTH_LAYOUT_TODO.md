## E-commerce Desktop Full-width Layout TODO (Amazon-style)

Context
- Goal: Maximize desktop viewport usage similar to Amazon/OfferUp while preserving mobile UX intact.
- Scope: Desktop-first improvements (≥ lg). Mobile and tablet (≤ lg) must remain visually unchanged.

Acceptance Criteria
- 1440px viewport: visible content width ≥ 90% of viewport
- 1920px viewport: 6 listing cards per row without overflow or CLS
- Sidebar: labels not truncated, scroll-free readability for primary sections
- Core Web Vitals: CLS ≤ 0.10, LCP stable or improved
- Mobile (≤ lg): no layout regressions

Tasks
- [ ] 1) Container & horizontal spacing
  - [ ] Increase max container width for large desktops (xl ≥ 1366, 2xl ≥ 1728, support up to 1920)
  - [ ] Reduce horizontal padding for ≥ xl (e.g., xl:px-4, 2xl:px-6)
  - [ ] Verify 1440px viewport uses ≥ 90% width

- [ ] 2) Product grid density (visibility)
  - [ ] Increase columns: lg:4 → xl:5, 2xl:6
  - [ ] Reduce gaps on big screens: gap-6 → xl:gap-5, 2xl:gap-4
  - [ ] Ensure no overflow/CLS at 1920px with 6 cards/row

- [ ] 3) Sidebar ratio & readability
  - [ ] Adjust widths: lg:w-1/3, xl:w-1/4, 2xl:w-1/5
  - [ ] Keep sticky behavior; convert filter sections into carded blocks
  - [ ] Confirm labels don’t truncate; primary controls readable without scroll

- [ ] 4) ListingCard compact variant (≥ xl only)
  - [ ] Reduce image height and inner paddings by ~10–15%
  - [ ] Tighten meta row (icon + number on one line)
  - [ ] Maintain readability and hover effects

- [ ] 5) Toolbar density & hierarchy
  - [ ] Align breadcrumb + sort + view controls on single line where possible
  - [ ] Reduce vertical spacing on ≥ xl (target 12–16px height reduction)
  - [ ] Ensure no wrapping at xl; wrap gracefully on smaller screens

- [ ] 6) Hero behavior (optional, SEO/perf safe)
  - [ ] Make background full-width; keep content within container
  - [ ] Auto-hide hero when filters are active to remove top whitespace

- [ ] 7) Performance & accessibility guards
  - [ ] Monitor CLS/LCP after changes; keep CLS ≤ 0.10
  - [ ] Preserve focus rings, keyboard nav, and color contrast
  - [ ] Keep GA/Core Web Vitals tracking intact

- [ ] 8) QA across breakpoints
  - [ ] Visual checks at: 1280 / 1366 / 1440 / 1536 / 1728 / 1920
  - [ ] Confirm no UI changes/regressions on ≤ lg (mobile/tablet)
  - [ ] Validate viewport efficiency increase on desktop

Affected Files (expected)
- `benalsam-web/src/pages/HomePage.jsx`
- `benalsam-web/src/components/ListingCard.jsx` (compact variant)
- `benalsam-web/tailwind.config.js` (screen extensions if needed)
- `benalsam-web/index.html` (critical CSS tweaks if required)

Milestones
- M1 (High impact/low risk): Tasks 1–2–3
- M2: Task 4 (ListingCard compact)
- M3: Task 5 (Toolbar) and optional Task 6 (Hero)
- M4: Task 7–8 (Perf + QA)

Notes
- Desktop-first iteration. Do not alter mobile classnames/structure.
- After each milestone: quick visual regression + Core Web Vitals check.


