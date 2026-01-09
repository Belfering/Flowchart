# FRD-044: Polars Vectorized Backtest Engine

## Overview

Replace the per-day tree-walking backtest engine with a vectorized columnar approach using Polars, achieving 50-100x performance improvement.

## Problem Statement

The current backtest engine evaluates the FlowNode tree **per-day**:

```
for each day (4,700 iterations):
    for each node (N iterations):
        for each condition (M iterations):
            evaluate condition
```

**Result**: 1,000 indicators × 10 conditions × 4,700 days = 47M evaluations = **65 seconds**

## Solution: Polars + Tree Flattening

Compile the FlowNode tree to Polars LazyFrame operations, pre-computing all conditions as columnar arrays.

```
FlowNode Tree → Extract Conditions → Polars Columns → Vectorized Execution
```

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React) - UNCHANGED                │
│        POST /api/backtest { payload: "...", mode: "CC" }        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STRATEGY COMPILER                            │
│                                                                 │
│  1. Parse FlowNode tree from JSON                               │
│  2. Check if strategy can be vectorized (no AltExit/branch refs)│
│  3. Extract unique conditions                                   │
│  4. Generate Polars expressions                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    POLARS EXECUTION ENGINE                      │
│                                                                 │
│  LazyFrame                                                      │
│    .scan_parquet("*.parquet")           // Lazy read            │
│    .with_columns([indicators...])       // Compute all at once  │
│    .with_columns([conditions...])       // Boolean arrays       │
│    .with_columns([signals...])          // Combine per node     │
│    .collect()                           // Execute with SIMD    │
│                                                                 │
│  Automatic Optimizations:                                       │
│  • Predicate pushdown                                           │
│  • Common subexpression elimination                             │
│  • Parallel column computation                                  │
│  • SIMD vectorization (AVX2/AVX-512)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ALLOCATION BUILDER                           │
│                                                                 │
│  Use pre-computed signal columns to build allocations           │
│  (Simple iteration over boolean arrays - very fast)             │
└─────────────────────────────────────────────────────────────────┘
```

## Expected Performance

| Scenario | Current (V1) | Polars (V2) | Speedup |
|----------|--------------|-------------|---------|
| Simple (10 indicators) | 75ms | ~10ms | 7x |
| Medium (100 indicators) | 550ms | ~30ms | 18x |
| Complex (1000 × 10 conditions) | 65s | ~500ms | **130x** |
| Stress (10K conditions) | ~10 min | ~2s | **300x** |

## Implementation Plan

### Phase 1: Core Infrastructure (3 days)
- [x] Add Polars dependency to Cargo.toml
- [x] Create `polars_engine.rs` module
- [ ] Implement `can_vectorize()` strategy checker
- [ ] Implement parquet loading into Polars LazyFrame

### Phase 2: Indicator Compilation (3 days)
- [ ] Map all 77 indicators to Polars expressions
- [ ] Implement indicator column generation
- [ ] Cache indicator columns for reuse

### Phase 3: Condition Compilation (2 days)
- [ ] Simple conditions: `ticker metric > threshold`
- [ ] Expanded conditions: `ticker1 metric1 > ticker2 metric2`
- [ ] Crossing conditions: `crossAbove`, `crossBelow`
- [ ] forDays: rolling window on boolean

### Phase 4: Node Compilation (3 days)
- [ ] Basic node: weighted combination
- [ ] Indicator node: then/else with `when().then().otherwise()`
- [ ] Position node: ticker selection
- [ ] Function node: ranking (more complex)
- [ ] Numbered node: any/all/exactly N

### Phase 5: Allocation & Metrics (2 days)
- [ ] Build allocations from signal columns
- [ ] Vectorized equity curve calculation
- [ ] Vectorized metrics (CAGR, Sharpe, Sortino, etc.)

### Phase 6: Hybrid Fallback (2 days)
- [ ] Detect unsupported nodes (AltExit, branch refs)
- [ ] Route to V1 engine for complex strategies
- [ ] Ensure API compatibility

## Supported vs Unsupported Features

### Fully Supported (Vectorizable)
| Feature | Implementation |
|---------|----------------|
| Simple conditions | `col("rsi").gt(30)` |
| AND/OR logic | `.and()`, `.or()` |
| Crossing | `col.gt(x).and(col.shift(1).lt(x))` |
| forDays | `rolling_sum` on boolean |
| Date conditions | `col("date").dt.month()` |
| Ratio tickers | `col("SPY") / col("AGG")` |
| Basic nodes | Column selection |
| Indicator nodes | `when().then().otherwise()` |
| Position nodes | Direct allocation |
| Equal weighting | Trivial division |

### Requires Hybrid Approach
| Feature | Reason | Fallback |
|---------|--------|----------|
| AltExit nodes | Stateful (enter/exit tracking) | Use V1 engine |
| Branch references | Recursive dependency | Multi-pass or V1 |
| Call nodes | External strategy refs | Load and compile |
| Inverse/Pro volatility | Depends on allocations | Post-process |

## API Contract

**No changes to API** - same request/response format:

```json
// Request
{
  "payload": "{...FlowNode JSON...}",
  "mode": "CC",
  "costBps": 10
}

// Response (unchanged)
{
  "equityCurve": [...],
  "benchmarkCurve": [...],
  "metrics": {...},
  "allocations": [...],
  ...
}
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/backtest/polars_engine.rs` | Created | Main Polars engine |
| `src/backtest/mod.rs` | Modify | Export polars_engine |
| `src/bin/backtest_server.rs` | Modify | Route to Polars or V1 |
| `Cargo.toml` | Modified | Add polars dependency |

## Testing Strategy

1. **Unit Tests**: Each indicator expression matches V1 output
2. **Integration Tests**: Full backtest results match V1 within tolerance
3. **Performance Tests**: Benchmark against V1 at various scales
4. **Stress Tests**: 10K conditions, verify correctness and speed

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Floating point differences | Allow 1e-6 tolerance in tests |
| Edge cases in conditions | Comprehensive test suite |
| Polars API changes | Pin version, document usage |
| Memory usage for large strategies | Monitor, add streaming if needed |

## Success Criteria

- [ ] 1000 × 10 conditions backtest completes in <1 second
- [ ] Results match V1 engine within tolerance
- [ ] All simple/medium strategies use Polars path
- [ ] Complex strategies gracefully fall back to V1
- [ ] No breaking changes to API

## Dependencies

```toml
[dependencies]
polars = { version = "0.52", features = ["lazy", "parquet", "dtype-datetime", "simd"] }
```

## References

- [Polars Documentation](https://docs.pola.rs/)
- [Polars Lazy API](https://docs.pola.rs/user-guide/concepts/lazy-api/)
- [rust-indicators/docs/ARCHITECTURE_V2.md](../rust-indicators/docs/ARCHITECTURE_V2.md)
- [rust-indicators/docs/PERFORMANCE.md](../rust-indicators/docs/PERFORMANCE.md)
