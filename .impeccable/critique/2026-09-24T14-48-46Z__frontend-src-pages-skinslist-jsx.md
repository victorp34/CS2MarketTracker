---
target: critique SkinsList
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:C:\\Users\\Victor\\Downloads\\comparateur de prix cs2\\frontend\\src\\pages\\SkinsList.jsx"
target_fingerprint: "sha256:ff8af684b33b9e4cf9dbd6dadfcf49502d65c027b98938ff21c2804d9552f9a9"
target_path: "C:\\Users\\Victor\\Downloads\\comparateur de prix cs2\\frontend\\src\\pages\\SkinsList.jsx"
timestamp: 2026-09-24T14-48-46Z
slug: frontend-src-pages-skinslist-jsx
closed: true
---
Method: dual-agent (A: design review with real screenshots, desktop plus 390px layout only · B: CLI detector plus headless Chrome overlay).

## Design Health Score
| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | System Status | 3 | Good wake notice, stale-while-typing results, freshness line; no staleness flag; freshness line silent on failure |
| 2 | Real World | 3 | "variations du jour" but rows compare 30 Aug → 3 Sept |
| 3 | Control/Freedom | 3 | Query in URL, Escape, Back; no-results is a dead end |
| 4 | Consistency | 3 | Freshness sentence in mono; Secret-tier edge #eb4b4b ≈ brand red |
| 5 | Error Prevention | 2 | 1-char query ignored silently; % and _ not escaped in ILIKE |
| 6 | Recognition | 2 | No suggestions or category shortcuts |
| 7 | Flexibility | 2 | No /, no sort/filter, no result count |
| 8 | Minimalism | 3 | Per-row date and "prix minimum" repeated 10×; methodology paragraph before data |
| 9 | Error Recovery | 3 | ErrorNotice + retry; load-more error is grey text only |
| 10 | Help | 2 | Alerts not explained before login; no demo account |
| Total | | 26/40 | Acceptable |

## Design Specificity Verdict
More specific than before (real rarity, images, mono prices), but the composition is still generic: title/paragraph/search/10 cards; no signature moment; the 90-day curve never appears on the home page. Detector: CLI 0; browser overlay 3 — low-contrast btn-primary white on #e0473e 4.1:1 (real, index.css:41), line-length ~139ch methodology paragraph (real, SkinsList.jsx:417), side-tab rarity edge (false positive: intentional signature).

## Priority Issues
- [P1] Movers look like noise (stickers +111–259%) and the period is misstated ("du jour" vs a 4-day gap). Fix: state the period in the section header, drop per-row dates, say "depuis le relevé précédent", show the absolute € change, optionally raise the floor. → clarify + route
- [P1] No staleness guard: "mis à jour chaque jour" next to a date that can be 3 weeks old. Fix: warning when last_recorded_date is more than 1 day old. → harden
- [P1] Alerts flow invisible to recruiters (login required, no demo). Fix: demo account reset daily, or a static preview of an alert and its Discord message. → onboard
- [P2] Weak above-the-fold hierarchy on mobile (first data at ~640px, 12px labels < 14px paragraph, 139ch line, unbalanced navbar). Fix: 1–2 line pitch, search as the focal point with suggestion chips, methodology in <details> with max-width. → layout
- [P2] btn-primary contrast 4.1:1; dead-end search states; % and _ not escaped. Fix: darker fill (~#c83a31, check ≥4.5), 2-character hint, pg_trgm suggestions, escape wildcards. → polish/harden

## Persona Red Flags
- Recruteur: 12px link as the hook; data that looks absurd; alerts untestable; no GitHub/author.
- Jordan: why stickers dominate; "prix minimum" unexplained; tier only in a title tooltip; alerts unknown.
- Riley: ?q=__ returns everything; 1-character query silent; no length cap; a 401 forces a full reload.
- Casey: truncated placeholder; unbalanced 2-line navbar; methodology before data; no sticky search; cold start again with no cache.

## Minor Observations
Mono sentence; green-400 on a heading; red Secret edge on a gainer row; skeleton without a price column; no footer credits (Skinport, CSGO-API); nothing announced to screen readers for 0–3 s; IDLE_SEARCH spacing typo.

## Questions
- Why does the first ranked data look like the noise the filters claim to remove?
- Why no 90-day curve (sparkline) on the home page?
- Does the alerts flow exist for a recruiter who will never sign up?
