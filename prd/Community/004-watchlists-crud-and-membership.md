# PRD 004 — Watchlists (Create + Add Bots + Autocomplete)

## Metadata
- ID: 004
- Title: Watchlists (create + add bots + autocomplete)
- Status: draft
- Owner:
- Depends on:
- Created: 2025-12-15
- Last updated: 2025-12-15

## Summary
Introduce user watchlists that can contain bots. Provide the minimal feature set needed to:
- create a new watchlist by name
- add a bot to an existing watchlist
- choose a watchlist via a writable/searchable input with autocomplete

This PRD is primarily to support `Add to Watchlist` in Analize (PRD 003) and display in Community (PRD 005).

## Goals
- Fast “add bot to watchlist” workflow.
- Simple, reliable persistence across sessions.
- Support adding a bot to more than one watchlist.
- Support removing a bot from a watchlist anywhere watchlists are shown.

## Non-goals
- Full watchlist management UI (rename, delete, reorder, sharing) unless explicitly added.
- Community sharing/permissions model (public vs private) unless explicitly added.

## UX / UI

### Add to Watchlist control
Any place that offers “Add to Watchlist” uses:
- A menu/dialog with:
  - `Create New Watchlist`
  - Existing watchlists list
  - A writable search input that filters and autocompletes existing watchlists

### Create New Watchlist
- Prompts for name, confirms creation, then adds the selected bot to it.

## Data Model / State
- `Watchlist`:
  - `id`
  - `name`
  - `botIds[]` (or bot references)
- Storage: local persistence (e.g., localStorage) unless there is an existing backend store.
- Watchlist types:
  - **Custom watchlists**: private (user-only).
  - **System watchlists**: public (predefined Community lists).

## Acceptance Criteria
- User can type to filter watchlists and select one.
- User can create a new watchlist and immediately add a bot to it.
- Watchlists persist across reloads.
- A bot can be added to multiple watchlists.
- “Remove from watchlist” is available anywhere watchlists are presented (Analize cards and Community watchlist views).

## Open Questions
- Should watchlists store bot IDs, bot names, or full bot payload snapshots? (default: store bot IDs; resolve display from saved bot name)
- Do we need to prevent duplicate adds (same bot added twice to same watchlist)?
