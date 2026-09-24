---
target: critique SkinsList
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\Victor\\Downloads\\comparateur de prix cs2\\frontend\\src\\pages\\SkinsList.jsx"
target_fingerprint: "sha256:21bcd4c235ab16d796e9656c529e4dce3a6b8a29b3590038acb13129fbfb64c6"
target_path: "C:\\Users\\Victor\\Downloads\\comparateur de prix cs2\\frontend\\src\\pages\\SkinsList.jsx"
timestamp: 2026-09-24T16-27-13Z
slug: frontend-src-pages-skinslist-jsx
---
Method: dual-agent (A: design review, desktop and 390px screenshots with real emulation · B: CLI detector plus desktop and mobile overlay).

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | System Status | 3 | Freshness line empty during cold start and silent on failure |
| 2 | Real World | 3 | "prix minimum" never explained; users learn names are English only after a failed search |
| 3 | Control | 3 | URL, Escape, replace history |
| 4 | Consistency | 3 | Mixed tu/vous ("Vouliez-vous dire"); brand name never shown |
| 5 | Error Prevention | 3 | 2-char hint, debounce, escaped wildcards |
| 6 | Recognition | 3 | Wear truncated on mobile |
| 7 | Flexibility | 2 | No sort/filter/shortcut, no total |
| 8 | Minimalism | 3 | About linked 3×; gainers are ~4 € stickers |
| 9 | Error Recovery | 3 | "glvoes" gets no suggestion (<% threshold 0.6) |
| 10 | Help | 3 | "Comment c'est construit" link is 12px |
| Total | | 29/40 | Good |

## Design Specificity Verdict
Strong identity (real rarity edge, dated period, € delta), but generic composition (title/search/2 lists); the 90-day history, the differentiator, is absent from the home page. Detector: CLI 0; overlay 2 non-issues — text-occlusion is a false positive (closed <details>, verified by geometry), side-tab is the intentional signature.

## Priority Issues
- [P1] Home page never shows the core asset (90-day curve). Fix: sparkline per mover row (aggregate in /top-movers) or a featured card with the real chart. → bolder
- [P1] Search results are an undifferentiated wall (AWP/AK/StatTrak mixed, wear truncated on mobile, identical thumbnails). Fix: base name + separate wear line, sort by base name/StatTrak/FN→BS, "14 résultats". → layout
- [P2] Typo tolerance: "glvoes" gets no suggestion (word_similarity threshold 0.6). Fix: SET LOCAL threshold 0.3 or a lower limit; tests. → harden
- [P2] Stale-data banner dominates the first impression (bright white), freshness line empty while loading. Fix: lead with what is valid, muted weight + dot, placeholder; alert on ingestion. → clarify
- [P2] Shared links have no preview (no meta description/OG/image/favicon). Fix: tags + 1200×630 card. → polish

## Persona Red Flags
- Recruteur: cold start then stale banner; no chart; 12px "how it's built" link; brand/author not named; empty preview.
- Jordan: English names discovered after failure; "prix minimum"; rarity only in a tooltip; tournament stickers.
- Riley: typos without suggestion; silent truncation; no total; row without min_price misaligned.
- Casey: 4th chip off-screen; 36px chips / 20px link; wear truncated; ~1100px movers.

## Minor Observations
"..." vs "…"; green-400 extended; "Exemples" is a span and the chips list is unnamed; no autoFocus; footer not pinned; dark thumbnails on #14161a; broken JSX indentation (:436-451, :538-598).

## Questions
- Why no curve on the first screen?
- 4 of the 5 gainers are ~4 € stickers: market or noise? Rank by € or split weapons/stickers?
- With collection stalled 21 days, confess it first or stop showing stale variations?
