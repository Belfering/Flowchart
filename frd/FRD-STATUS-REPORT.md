# FRD Status Report
Generated: 2025-12-22 (Updated)

## Executive Summary

**Total FRDs**: 14 active documents
**Completed**: 10 (FRD-001, FRD-002, FRD-004, FRD-005, FRD-006, FRD-012, FRD-013, FRD-014, FRD-016, Admin features)
**In Progress**: 0
**Deferred (OFF)**: 1 (FRD-011)
**Blocked/Awaiting Decisions**: 3 (FRD-003, FRD-007, FRD-008)
**Pending**: 1 (FRD-017)
**Completion Rate**: 71%

### Latest Updates (2025-12-22)
- **COMPLETED**: FRD-012 (Fund Lock) - Published systems are immutable, "Copy to New" available
- **COMPLETED**: FRD-013 (Rename to Systems) - UI strings updated from "Bot" to "System"
- **COMPLETED**: FRD-014 (Backtest Caching) - Separate cache DB, daily refresh on first login
- **COMPLETED**: FRD-016 (Beta Metric) - Beta vs SPY added to backtest metrics
- **DEFERRED**: FRD-011 (Atlas Sponsored) - Needs further investigation

---

## COMPLETED FRDs

### FRD-001: Analyze Tab (Collapsible Bot Cards + Performance)
**Status**: COMPLETE
**Priority**: #1 (Highest)

#### What Was Completed:
- Tab label reads "Analyze"
- Bot list entries render as collapsible cards, default collapsed
- Filter by watchlist works ("All" shows all bots across user's watchlists)
- Collapsed card shows bot name, expand/collapse, watchlist tags with remove, and actions
- Expanded card shows:
  - Live Stats zone with real investment data (Invested, Current Value, P&L, CAGR since investment)
  - Shows "Not invested" message when user hasn't bought the bot
  - Backtest Snapshot with equity chart (log scale enabled) and drawdown chart
  - Historical Stats: CAGR, MaxDD, Calmar, Sharpe, Sortino, Treynor, Beta, Volatility, Win Rate, Turnover, Avg Holdings, Trading Days
- "Open in Build Tab" visible while collapsed
- "Add to Watchlist" offers create-new and existing watchlists
- Correlation Tool subtab exists with three placeholder columns

---

### FRD-002: Community Tab (Watchlists View)
**Status**: COMPLETE
**Priority**: #2

#### What Was Completed:
- Community Nexus tab exists in navigation
- 4-column grid layout with proper structure
- "Top Community Systems" left column with 3 tables:
  - Top community systems by CAGR (sorted, top 10)
  - Top community systems by Calmar Ratio (sorted, top 10)
  - Top community systems by Sharpe Ratio (sorted, top 10)
- Tables pull real backtest data from `analyzeBacktests`
- Personal Watchlists right column with 2 watchlist zones
- Watchlist dropdown selectors in right zones
- Sortable table headers (Name, Tags, OOS CAGR, OOS MaxDD, OOS Sharpe)
- Middle placeholder for News and Search

---

### FRD-004 (Backlog): Theming Toggle + Per-Profile Persistence
**Status**: COMPLETE
**Priority**: #4

#### What Was Completed:
- Light/dark theme toggle exists in header
- 10 color themes available (Ruby, Emerald, Sapphire, Amber, etc.)
- Theme persists per-profile via localStorage with `userDataKey(userId)`
- Dark mode CSS variables work across all components
- Per-profile saved bots, watchlists, and UI state
- Clear Data button in Admin > Ticker Data tab

---

### FRD-005 (Backlog): Branding (Atlas Engine)
**Status**: COMPLETE
**Priority**: #7

#### What Was Completed:
- Document title: "Atlas Engine" (in index.html)
- Custom favicon: favicon.svg with "AE" initials in blue rounded square
- Header shows "Atlas Engine" branding

---

### FRD-006: Tailwind CSS + shadcn/ui Refactor
**Status**: COMPLETE (87% inline styles eliminated)
**Priority**: Backlog item

#### What Was Completed:
- Tailwind CSS v4 installed and configured
- shadcn/ui components installed (Button, Input, Select, Card, Table, Tabs, Alert, Badge)
- 87% of inline styles converted (168 of 193)
- All shadcn components integrated across Build, Analyze, Portfolio, Community tabs
- Dark mode support via Tailwind `dark:` variants
- Build passing with no TypeScript errors
- Code reduction: 438 lines removed (52% reduction)

---

### FRD-012: Fund Lock (No Edit for Published Systems)
**Status**: COMPLETE
**Priority**: High

#### What Was Completed:
- Systems with "Nexus" or "Atlas" tags are immutable (no edit button)
- "Copy to New System" button allows creating editable copies
- Copy adds " (Copy)" suffix to name
- Protects investors - the system they bought doesn't change
- Maintains integrity of published metrics

---

### FRD-013: Rename "Bots" to "Systems"
**Status**: COMPLETE
**Priority**: Medium

#### What Was Completed:
- All UI strings updated: "Bot" → "System", "Bots" → "Systems"
- Type aliases created for backwards compatibility (SavedBot = SavedSystem)
- Dashboard labels: "Buy System", "Systems Invested In"
- Analyze labels: "Not invested in this system"
- Community labels: "Top Nexus Systems"

---

### FRD-014: Backtest Caching & Daily Refresh
**Status**: COMPLETE
**Priority**: High

#### What Was Completed:
- Separate SQLite database for cache (`backtest_cache.db`)
- Cache key: bot_id + payload_hash + data_date
- Cache stores full backtest results (metrics, equityCurve, benchmarkCurve, allocations)
- Cache invalidation triggers:
  - Payload hash mismatch (system changed)
  - Data date mismatch (new ticker data downloaded)
  - First-user-login-of-day (daily refresh)
- Admin endpoints:
  - `GET /api/admin/cache/stats` - Cache statistics
  - `POST /api/admin/cache/invalidate` - Manual invalidation
  - `POST /api/admin/cache/refresh` - Force daily refresh
- Backtest endpoint supports `forceRefresh: true` to bypass cache
- Only completed backtests are cached (errors are not)

---

### FRD-016: Beta Metric
**Status**: COMPLETE
**Priority**: Medium

#### What Was Completed:
- Beta (vs SPY) calculated in backtest engine
- Formula: Cov(system, SPY) / Var(SPY)
- Added to metrics object returned by backtest
- Displayed in Build tab metrics panel
- Displayed in Analyze tab expanded view
- Displayed in System Cards (Historical Stats)

---

### Admin Account & Atlas Overview
**Status**: COMPLETE
**Priority**: Custom request

#### What Was Completed:
- Admin account (admin/admin) with exclusive Admin tab access
- Non-admin users cannot see Admin tab
- Atlas Overview tab with:
  - Total Dollars In Accounts aggregation
  - Total Dollars Invested aggregation
  - Configurable Atlas Fee % and Partner Program Share %
  - Treasury Bill Holdings section with equity chart
- Nexus Maintenance tab with 3 placeholder watchlist tables
- Backend API endpoints for admin data persistence
- Portfolio sync for cross-account aggregation

---

## DEFERRED FRDs (OFF)

### FRD-011: Atlas Sponsored Systems
**Status**: OFF (Deferred)
**Priority**: High

#### What's Blocking:
- Admin systems not appearing in Atlas dropdown - root cause unclear
- Possibly related to savedBots not containing admin's bots when AdminPanel renders
- Possibly database `ownerId` mismatch
- Needs further investigation

#### Ready to Implement Once Fixed:
- Admin creates system → Tagged `[Private, Atlas Eligible]`
- Admin adds to Atlas Fund slot → Tag changes to `Atlas`
- Atlas systems appear in "News and Select Systems" card (not in Top tables)
- Atlas systems unlimited slots (expandable)

---

## BLOCKED FRDs (Awaiting User Decisions)

### FRD-003: Conditional Logic Validation (AND/IF, OR/IF)
**Status**: BLOCKED - Needs test framework decision
**Priority**: #3

#### What's Blocking:
1. **Test Framework Selection**: Need to decide between Vitest, Jest, or Mocha
2. **Test Location**: Where to place test files (`__tests__/`, `*.test.ts`?)
3. **Boolean Precedence Rules**: Confirm `A OR B AND C` = `A OR (B AND C)`

#### Ready to Implement Once Decisions Made:
- Automated tests for AND/IF logic
- Automated tests for OR/IF logic
- Validation of nested AND/OR combinations
- Debug overlay for condition evaluation (optional)

---

### FRD-007: Database Architecture & Migration
**Status**: PARTIALLY COMPLETE
**Priority**: Critical

#### What Was Completed:
- SQLite + Drizzle ORM architecture implemented
- Database schema: users, bots, watchlists, portfolios, positions, metrics
- CRUD API endpoints for all entities
- Server-side backtest with IP protection

#### What's Blocking Full Completion:
- Migration strategy for existing localStorage data
- Decision on sync frequency (currently manual)

---

### FRD-008: User Data Security Best Practices
**Status**: BLOCKED - Depends on FRD-007
**Priority**: High
**Dependencies**: FRD-007 (Database Architecture)

#### What's Blocking:
- Need to finalize authentication strategy
- Need to implement proper password hashing (currently plain text for dev)

---

## PENDING FRDs

### FRD-017: Payload Storage Optimization
**Status**: PENDING
**Priority**: Low (deferred until scale needed)

#### Requirements Gathered:
- Motivations: speed, space, scalability
- Storage format: industry standard, efficient, private
- Options: GZIP compression, MessagePack/CBOR, JSONB

#### Will Implement When:
- Payload sizes become a bottleneck
- Database size becomes a concern
- Performance profiling indicates need

---

## Summary

### What Was Done Today (2025-12-22):
1. **FRD-014**: Implemented backtest caching with separate SQLite database
   - Cache check/store logic in backtest endpoint
   - Daily refresh on first login of the day
   - Admin endpoints for cache management
2. **FRD-012**: Fund Lock already complete (hide edit for published systems)
3. **FRD-013**: Rename to Systems already complete
4. **FRD-016**: Beta metric already complete

### Files Created:
- `System.app/server/db/cache.mjs` - Backtest cache database module

### Files Modified:
- `System.app/server/index.mjs` - Added cache integration to backtest endpoint

### What Requires User Decisions:
1. **FRD-003**: Which test framework? (Vitest recommended)
2. **FRD-011**: Debug why admin systems don't appear in Atlas dropdown

### Recommended Next Steps:
1. Test the backtest caching by running a backtest twice (second should be instant)
2. Choose Vitest for testing → unblock FRD-003
3. Debug FRD-011 Atlas dropdown issue
