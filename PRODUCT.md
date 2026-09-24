# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: recruiters and tech leads** evaluating the author as a developer. They arrive from a CV, LinkedIn, or GitHub link, spend a few minutes on the live site, and have to come away convinced of the author's rigor, product sense, and technical judgment. The public About page (`frontend/src/pages/About.jsx`) speaks directly to them.

**Secondary: CS2 players and traders** who actually use the tool to check prices, follow items, and get alerts. The product must hold up as a real tool for them, because that credibility is part of what the recruiter is evaluating.

## Product Purpose

CS2 Market Tracker covers the whole Skinport catalogue (~25,000 items: skins, knives, gloves, stickers, patches, agents, music kits, graffiti, charms). It offers fuzzy search, 90-day price history for any item (including items nobody follows), top daily movers, followed items, and personal price alerts sent through Discord and email.

Success means a recruiter can explore it in a few minutes and see a finished, coherent, trustworthy product backed by deliberate engineering choices. A player should be able to use it without friction.

## Positioning

A complete, working product built alone on a free-tier architecture. It does not stop at a demo: it runs on real data refreshed every day, has resilient ingestion, and makes documented decisions about data quality. Examples include liquidity and price floors on the movers ranking, and alerts that compare against the current minimum listing price rather than a historical average. The About page explains each problem and its solution, so the reasoning is visible along with the result.

## Operating Context

- Three core flows, with no hierarchy between them: **check a price quickly** (search → detail → 90-day curve), **set and manage alerts** (threshold → Discord/email notification with a link to the listing), and **explore the market** (top 5 gainers and top 5 losers).
- Browsing is open to everyone. Alerts and followed items require an account (JWT).
- Data comes from the public Skinport API (prices) and the community dataset ByMykel/CSGO-API (images), ingested once a day through GitHub Actions (catalogue at 03:00 UTC, detailed data and alerts at 04:00 UTC).
- Visitors are likely to open it on both desktop and mobile, often from a shared link.

## Capabilities and Constraints

- Stack in place: React 18 (Vite), Tailwind CSS, Recharts, React Router. Backend is Node/Express with PostgreSQL (`pg_trgm`). Hosting is Render (free tier) plus Neon.
- **Cold start:** the Render free-tier backend sleeps after 15 minutes of inactivity, so the first load can take 30–60 s. The interface must make that wait understandable and acceptable instead of looking broken, especially for a recruiter on their first visit.
- Prices refresh once a day, not in real time. The interface must not suggest otherwise.
- 90-day rolling retention on price history.
- `price_history` (detailed sales stats) is collected for items that have alerts but is not shown in the UI yet. This is a deliberate choice to leave room for future work.
- Terminology: "prix minimum" (lowest listing), "prix médian", "quantité d'offres", "alerte", "skins suivis", "top variations".

## Brand Commitments

- Name: **CS2 Market Tracker**.
- **All interface copy is in French.**
- **Link to the game's rarity codes:** the existing identity uses CS2 rarity colors (covert red, gold). Keeping that link to the game's visual culture is a commitment.
- **No affiliation:** the site must never suggest that it is official or affiliated with Skinport or Valve. Data sources are credited as they are.

## Evidence on Hand

- Live site: https://cs2markettracker-1.onrender.com
- About page with the stack, 7 documented technical challenges (problem/solution), security measures, and containerisation.
- README and OPERATIONS.md in the repo; automated tests in `tests/`.
- Real data: ~25k items, daily prices, item images.
- There are no testimonials, user numbers, or third-party metrics. Do not invent any.

## Product Principles

1. **Show the rigor.** Every surface should show that the choices were deliberate: reliable data, handled edge cases, clean states for empty, loading, and error.
2. **Be honest about the data.** Say where the data comes from, how fresh it is, and what its limits are (daily refresh, cold start, no affiliation) rather than hiding them.
3. **Be a real tool, not a mock-up.** The three flows (check, alert, explore) must work fully and without friction for an actual player.
4. **Get the point across in minutes.** A recruiter's visit is short, so what the product does and what it demonstrates should come through quickly.
