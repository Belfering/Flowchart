# PRD 006 — Portfolio Tab (Dashboard)

## Metadata
- ID: 006
- Title: Portfolio dashboard
- Status: draft
- Owner:
- Depends on:
- Created: 2025-12-15
- Last updated: 2025-12-15

## Summary
Build a Portfolio tab dashboard showing:
- Account value
- Current positions
- Total PnL
- Bots invested in

## Goals
- Give a quick “at a glance” portfolio status.

## Non-goals
- Brokerage integrations unless already present.
- Full transaction history/ledger unless explicitly added.

## UX / UI
- Portfolio tab shows summary tiles and simple tables/lists:
  - Account value (large)
  - Total PnL (absolute + % if available)
  - Current positions table
  - Bots invested in list/table

## Data Model / State
- Source of truth for account/positions is TBD (manual input vs broker API vs simulated).

## Acceptance Criteria
- Portfolio tab displays the four sections with placeholder data (this PRD intentionally remains placeholders-only for now).
- Layout is stable and ready to be wired to real data.

## Open Questions
- Where does portfolio data come from right now?
- What currency and formatting rules should be used?
- Do “Bots invested in” map to saved bots, live bots, or paper-trading bots?
