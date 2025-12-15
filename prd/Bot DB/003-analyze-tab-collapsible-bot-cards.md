# PRD 003 — Analyze Tab (Collapsible Bot Cards + Performance)

## Metadata
- ID: 003
- Title: Analyze tab (collapsible bot cards + performance)
- Status: draft
- Owner:
- Depends on: PRD 004 (watchlists), PRD 007 (backtesting)
- Created: 2025-12-15
- Last updated: 2025-12-15

## Summary
Rename the current `Bot Database` tab to `Analyze` and change the bot list interaction from “click name to open in Build” to a collapsible/expandable bot card. Cards start collapsed; expanding shows historical performance metrics and a visual backtest equity curve. Keep a dedicated `Open in Build Tab` button always visible, plus an `Add to Watchlist` action.

## Goals
- Make it easy to scan many bots quickly (collapsed cards).
- Make it easy to evaluate a bot without leaving the tab (expanded metrics + chart).
- Keep “Open in Build Tab” a clear, always-available action.
- Add “Add to Watchlist” with searchable selection and create-new.

## Non-goals
- Building the backtesting engine itself (see PRD 007).
- Full watchlist management UI (create/rename/delete/list editing) beyond what’s required for “Add to Watchlist” (see PRD 004).

## UX / UI

### Tab name (exact copy)
- Tab label: `Analyze`

### Bot list layout
Each bot row becomes a “card” with:
- Left: collapse/expand control (chevron)
- Title: bot name
- Actions (always visible):
  - `Open in Build Tab`
  - `Add to Watchlist`

### Default state
- Cards start collapsed.
- Collapsed/expanded state persists across sessions.

### Expanded content
When expanded, show:
- **Performance metrics**: CAGR, Max Drawdown, OOS date (and room for more later).
- **Visual backtest**: equity curve.
- Backtest results must reflect correct strategy execution (conditions, tickers, and dates) and not be “mock” numbers.
- Expansion may automatically trigger a backtest run for that bot (if no cached results exist for the currently-selected inputs).

### Watchlist add flow
Click `Add to Watchlist` opens a small menu/dialog with:
- `Create New Watchlist`
- Existing watchlists (searchable/writable input with autocomplete).

## Data Model / State
- Saved bots already exist; this PRD adds:
  - `collapsed` UI state per bot in the Analize view (persisted or session-only: TBD).
  - Watchlist membership (see PRD 004).
  - Performance summary + timeseries source (local compute vs stored: TBD).

## Acceptance Criteria
- The tab label reads `Analyze` instead of `Bot Database`.
- Bot list entries render as collapsible cards, default collapsed.
- Expanding a card shows: CAGR, Max Drawdown, OOS date, and a backtest chart placeholder at minimum.
- `Open in Build Tab` is visible even while collapsed and opens that bot in Build.
- `Add to Watchlist` offers create-new and existing watchlists with type-to-filter autocomplete.

## Open Questions
- Equity curve inputs: what benchmark (if any) should be shown alongside it (none for v1 unless requested)?
- Should auto-run-on-expand be debounced/throttled when rapidly expanding multiple bots?
