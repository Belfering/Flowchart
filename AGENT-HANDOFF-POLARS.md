# Agent Handoff: Polars Vectorized Backtest Engine

## Project Context

**System Block Chain** - A flowchart-based trading strategy builder. Users visually create trading strategies as trees of nodes (indicators, conditions, positions). The backtest engine evaluates these trees against historical data.

## Current State

### What's Been Done

1. **Rust backtest engine exists** (`rust-indicators/`) - Works but slow for large strategies
2. **Polars added** - `polars v0.52` in Cargo.toml with lazy, parquet, simd features
3. **Initial polars_engine.rs created** - Basic scaffolding, not complete
4. **Documentation created**:
   - `frd/FRD-044-Polars-Vectorized-Backtest.md` - Full implementation plan
   - `rust-indicators/docs/ARCHITECTURE_V2.md` - Technical architecture
   - `rust-indicators/docs/PERFORMANCE.md` - Performance analysis
   - `rust-indicators/docs/TECH_COMPARISON.md` - Technology options evaluated

### Performance Problem

| Strategy | Current Time | Target |
|----------|--------------|--------|
| 10 indicators | 75ms | 10ms |
| 100 indicators | 550ms | 30ms |
| 1000 × 10 conditions | **65 seconds** | **<1 second** |

**Root cause**: Tree evaluated per-day (47M condition evaluations)

## The Solution: Polars + Tree Flattening

Instead of evaluating the tree per-day, compile it to Polars columnar operations:

```
Current (slow):
for day in 0..4700:
    for node in nodes:
        for condition in conditions:
            evaluate()  // 47 million times

Polars (fast):
lf.with_column(rsi(close, 14).gt(30).alias("cond_1"))  // Vectorized!
lf.with_column(sma(close, 20).gt(ema).alias("cond_2"))  // SIMD parallel!
lf.collect()  // ~500 operations total
```

## Key Files

```
rust-indicators/
├── Cargo.toml                      # Has polars dependency
├── src/
│   ├── lib.rs                      # 77 indicators implemented
│   ├── backtest/
│   │   ├── mod.rs                  # Module exports
│   │   ├── types.rs                # FlowNode, Condition types
│   │   ├── runner.rs               # Current V1 engine (slow)
│   │   ├── indicators.rs           # Indicator computation
│   │   ├── conditions.rs           # Condition evaluation
│   │   ├── polars_engine.rs        # NEW - Polars V2 (incomplete)
│   │   └── nodes/                  # Node type handlers
│   └── bin/
│       └── backtest_server.rs      # Axum server on port 3030
└── docs/
    ├── ARCHITECTURE_V2.md          # Polars architecture plan
    ├── PERFORMANCE.md              # Benchmarks and analysis
    └── TECH_COMPARISON.md          # Why Polars was chosen
```

## What Needs to Be Done

### Phase 1: Complete polars_engine.rs (3 days)

The file exists but is incomplete. Need to:

1. **Fix `load_price_data()`** - Currently basic, needs to handle all tickers properly
2. **Implement `indicator_expr()`** - Map all 77 indicators to Polars expressions
   - Currently has: SMA, EMA, RSI, ROC, StdDev, Bollinger, PriceVsSMA, MaxDD, Momentum
   - Missing: ATR, MACD, Stochastic, Williams %R, CCI, OBV, and 60+ more
3. **Implement `condition_expr()`** - Handle all condition types
   - Done: gt, lt, crossAbove, crossBelow, forDays, expanded mode
   - Missing: Some edge cases
4. **Implement `compile_node_signals()`** - Handle all node types
   - Done: Basic structure for Indicator nodes
   - Missing: Function (ranking), Numbered (any/all/N), proper tree traversal

### Phase 2: Integration (2 days)

1. **Modify `backtest_server.rs`** to route to Polars engine:
```rust
async fn run_full_backtest(...) {
    let node = parse_strategy(&request.payload)?;

    if polars_engine::can_vectorize(&node) {
        polars_engine::run_backtest_polars(parquet_dir, request)
    } else {
        // Fall back to V1 for complex strategies
        runner::run_backtest(parquet_dir, request)
    }
}
```

2. **Build allocation arrays** from signal columns
3. **Calculate equity curve** using Polars vectorized operations

### Phase 3: Testing (2 days)

1. Compare V1 vs V2 outputs for same strategies
2. Allow small floating point tolerance
3. Benchmark performance improvements

## Node Types Reference

| Kind | Description | Vectorizable |
|------|-------------|--------------|
| `position` | Leaf node with tickers | Yes |
| `basic` | Passthrough with weighted children | Yes |
| `indicator` | Conditional (if RSI > 30 then X else Y) | Yes |
| `function` | Rank and pick (bottom 2 by RSI) | Yes (complex) |
| `scaling` | Blend branches by metric | Yes |
| `numbered` | Multi-condition (any/all/exactly N) | Yes |
| `altExit` | Stateful enter/exit | **No** - needs V1 |
| `call` | Reference saved strategy | **No** - needs loading |

## Testing Commands

```bash
# Start Rust server
cd rust-indicators
cargo run --release --bin backtest_server

# Test simple strategy
curl -X POST http://localhost:3030/api/backtest \
  -H "Content-Type: application/json" \
  -d '{"payload": "{...}", "mode": "CC", "costBps": 10}'

# Run stress test (7K conditions - under 1.5MB limit)
# File: /Users/carter/Code/Flowchart/stress_test_7k_import.json
```

## Environment

- **Rust**: Latest stable
- **Polars**: v0.52
- **Parquet files**: `app/ticker-data/data/ticker_data_parquet/*.parquet`
- **Server port**: 3030 (Rust), 8787 (Node.js), 5173 (Vite)

## Success Criteria

- [ ] `stress_test_7k_import.json` completes in <1 second (currently ~45s)
- [ ] Results match V1 engine within 1e-6 tolerance
- [ ] All simple strategies use Polars path
- [ ] Complex strategies (AltExit) fall back to V1 gracefully

## Key Insight

The FlowNode tree is a **custom DSL**. The job is to **compile** it to Polars expressions, not interpret it. Think of it like a query optimizer - analyze the tree once, generate optimized columnar operations, execute with SIMD.

## Questions? Check These Files

1. `frd/FRD-044-Polars-Vectorized-Backtest.md` - Full plan
2. `rust-indicators/docs/ARCHITECTURE_V2.md` - Architecture details
3. `rust-indicators/src/backtest/types.rs` - All type definitions
4. `rust-indicators/src/backtest/runner.rs` - How V1 works (reference)
