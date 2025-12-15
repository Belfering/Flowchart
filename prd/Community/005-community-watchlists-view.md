# PRD 005 — Community Tab (Watchlists View)

## Metadata
- ID: 005
- Title: Community tab watchlists view
- Status: draft
- Owner:
- Depends on: PRD 004 (watchlists data model), PRD 007 (backtest metrics)
- Created: 2025-12-15
- Last updated: 2025-12-15

## Summary
Add a watchlists section to the Community tab with predefined lists:
- `BrianE`
- `Best CAGR`
- `Best CAGR/DD`
- `Best Sharpe`
and also include any custom watchlists created by the user.

Predefined lists are public and should be computed from the list of saved bots (not placeholders). Custom lists are private and must display bot name(s) contained.

## Goals
- Provide a predictable navigation area for curated and user-created lists.

## Non-goals
- Social features (comments, likes, follows) unless explicitly added.

## UX / UI
- Community tab shows a watchlists panel/section.
- Predefined watchlists appear even if empty (but v1 should attempt to compute them).
- Custom watchlists appear and list contained bots by name.
- Each list supports removing a bot from that watchlist.

## Data Model / State
- Uses watchlists from PRD 004.
- Predefined lists are “system lists” derived from saved bots + backtest results.

## Acceptance Criteria
- Community tab displays the 4 predefined watchlists.
- Predefined watchlists are computed from saved bots using backtest metrics:
  - `Best CAGR`: sort descending by CAGR.
  - `Best Sharpe`: sort descending by Sharpe (definition TBD in PRD 007).
  - `Best CAGR/DD`: sort descending by `CAGR / MaxDrawdownAbs` (definition TBD in PRD 007).
- Community tab also lists user-created watchlists and shows bot names for each.

## Open Questions
- Should the predefined lists be clickable (navigating to a list detail view) or just visible sections?
- How many bots per list are shown in v1 (e.g., top 10)?
