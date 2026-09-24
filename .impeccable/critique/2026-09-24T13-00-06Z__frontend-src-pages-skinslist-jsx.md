---
target: critique SkinsList
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:C:\\Users\\Victor\\Downloads\\comparateur de prix cs2\\frontend\\src\\pages\\SkinsList.jsx"
target_fingerprint: "sha256:f398faa825bf3e9a679aa95d28fab714204e00b989a918d57e025a159a0dd633"
target_path: "C:\\Users\\Victor\\Downloads\\comparateur de prix cs2\\frontend\\src\\pages\\SkinsList.jsx"
timestamp: 2026-09-24T13-00-06Z
slug: frontend-src-pages-skinslist-jsx
closed: true
---
Method: dual-agent (A: design review · B: detector). No browser access (Claude in Chrome not connected); source-only review.

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 1 | Silent 30–60 s cold start (skeletons only), no data-freshness indicator |
| 2 | Match System / Real World | 3 | "(min)" is cryptic; straight quotes instead of French guillemets |
| 3 | User Control and Freedom | 2 | Search held in component state only, lost on Back; no clear button or Escape |
| 4 | Consistency and Standards | 2 | Search and followed rows show no price; green label; .btn-secondary has no disabled style |
| 5 | Error Prevention | 3 | Debounce and 2-char minimum; stale requests not cancelled |
| 6 | Recognition Rather Than Recall | 2 | Placeholder is the only hint |
| 7 | Flexibility and Efficiency | 1 | No shortcut, no filter, no shareable URL |
| 8 | Aesthetic and Minimalist Design | 3 | Calm and disciplined |
| 9 | Error Recovery | 1 | Movers error swallowed and shown as "Pas encore assez de données"; search error never cleared; no retry |
| 10 | Help and Documentation | 2 | Home never points to About |
| Total | | 20/40 | Acceptable |

## Design Specificity Verdict
Skin specific, composition generic (title/search/top gainers/top losers = any price tracker). The gradient edge is the same on every card whatever the item's rarity, so it is decoration rather than signal. H1 "Skins" is a category label. Detector: 0 findings (exit 0) on SkinsList.jsx, components/, App.jsx. No overlay (no browser).

## Priority Issues
- [P0] Invisible cold start + failure presented as missing data (SkinsList.jsx:123-132, 219-228). Fix: wake-up notice after ~3 s with a counter and a link to /about; separate error state with "Réessayer"; optional /health ping from index.html. → harden
- [P1] Home doesn't say what the product is (L171-174). Fix: H1 stating scale, mono freshness line (needs last_ingested_at), "Comment c'est construit →" link. → clarify, layout
- [P1] Fragile search state (L113, 134-164, 184). Fix: ?q= via useSearchParams, AbortController, clear error, type=search + aria-label, Escape. → harden
- [P2] Search and followed rows without price or truncate (L81, L201). Fix: MoverRow anatomy everywhere (needs min_price from API). → layout
- [P2] Followed error hidden by the empty state (L52 vs L72); .btn-secondary has no disabled style (index.css:30). → polish

## Persona Red Flags
- Recruteur pressé: skeletons for up to a minute; no scale or freshness; About only reachable via a small grey link; false "not enough data" text.
- Jordan: is this Skinport itself?; "(min)"; no price in results; search lost on Back.
- Riley: out-of-order responses; error persists; load-more mixes queries; long names not truncated.
- Casey: crowded logged-in navbar at 390px; followed list pushes movers down; no search key on the keyboard.

## Minor Observations
Covert red as text ≈4.0:1 on surface (below AA for small text) → text variant ~#ec6259. Loading→loaded layout shift. Skeleton flicker on every keystroke. change_pct unformatted. Redundant alt text. Toast covers the navbar button. No focus-visible style on card links. Missing gstatic preconnect.

## Questions
- Should the gradient edge show the item's real rarity?
- Make the cold-start wait the showcase?
- Is top 5/top 5 the strongest first screen, or would one 90-day curve prove more?
