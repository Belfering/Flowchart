# Changelog

All notable changes to System Block Chain are documented here.

## [Unreleased]

### Added
- Dashboard as default landing page for logged-in users
- Changelog visible in Help/Support tab
- Contact information for support
- QuantNexus logo in header with theme-reactive styling
- Logo container spans multiple rows when Model tab is active
- Backtest mode dropdown now shows tooltips explaining each timing mode (CC, OO, OC, CO)
- Ticker search modal with search by ticker or company name, ETF/Stock filter checkboxes
- Popular tickers shown first when modal opens (SPY, QQQ, IWM, etc.)
- Save button for theme/color scheme preferences in Help/Support tab
- Number inputs now auto-select content on focus for easier editing

### Changed
- "Run" buttons renamed to "Re-run" in Benchmarks for consistency
- Header layout uses CSS grid for better organization
- Ticker selection now uses modal dialog instead of dropdown/datalist for all ticker inputs
- TradingView charts now match app theme (dark/light mode)
- Indicator dropdowns now use consistent expanded format across all node types
- Monthly Returns heatmap now respects dark/light theme
- Time period selector (RangeNavigator) now respects dark/light theme
- Allocation over time chart Y-axis now shows proper percentages (10%, 20%) instead of decimals
- Monthly Returns and Allocations (recent) are now equal-width cards side by side
- Hidden TradingView/lightweight-charts watermark from all charts
- Updated header logo to new QuantNexus branding with improved scaling
- Removed rate limiting entirely for uninterrupted workflow
- Admin Systems database now shows all bots saved to any user's watchlist with owner info
- Number input spinner arrows hidden for cleaner UI

### Fixed
- Save to Watchlist button now shows visual feedback
- Call node copy/paste functionality restored
- Partner Program page now displays correct fee percentages
- Orphaned systems can now be deleted from Admin panel
- Header logo now properly fills container while maintaining aspect ratio
- Ticker search modal now displays exchange information from database
- User preferences (theme/color scheme) now persist correctly after login
- Last login timestamp now properly recorded on user login
- Nexus eligibility auto-tagging now works for all users (was only for non-admin)
- Builder tags in watchlists now show display name instead of UUID
- Ticker search modal now works for nested position nodes (was missing prop passthrough)
- Model tab flowchart container now expands to fill available height (no longer cut off)
- Builder name in Nexus/Community tabs now shows display name instead of UUID

---

## Coming Soon

- Position Node (adding Tickers) rework to be less click intensive
- API/Backtest Speed up
- Correlation matrix/portfolio builder tool
- Variable Library (allowing the creation of custom indicators)

---

## [1.0.0] - 2025-12-30

### Features
- Visual flowchart-based trading algorithm builder
- Multiple node types: Basic, Function, Indicator, Position, Call
- Backtesting with equity curves and performance metrics
- Benchmark comparisons (SPY, QQQ, VTI, etc.)
- Robustness analysis with bootstrap simulations
- User authentication and preferences
- Watchlists for organizing trading systems
- Admin panel for ticker data management
- Dark/Light theme support with multiple color schemes
