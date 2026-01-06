"""
Benchmark Script for Optimized Forge Engine

Runs a small forge job to validate performance and measure actual throughput.
"""

import sys
import json
import time
from pathlib import Path
from optimized_forge_engine import run_forge_optimized

# Get absolute paths
SCRIPT_DIR = Path(__file__).parent.absolute()
PROJECT_ROOT = SCRIPT_DIR.parent


def run_benchmark():
    """Run benchmark with realistic configuration."""

    # Test configuration: Single ticker, small range
    config = {
        'indicator': 'RSI',
        'periodMin': 10,
        'periodMax': 15,  # 6 periods
        'tickers': ['SPY'],  # Just 1 ticker
        'comparator': 'BOTH',  # 2 comparators
        'thresholdMin': 20,
        'thresholdMax': 80,
        'thresholdStep': 5,  # 13 thresholds
        'minTIM': 5.0,
        'minTIMAR': 30.0,
        'maxDD': 20.0,
        'minTrades': 50,
        'minTIMARDD': 4.0,
        'useL2': False,
        'splitStrategy': 'even_odd_month',
        'numWorkers': 4,
    }

    # Calculate expected branches
    periods = 6
    comparators = 2
    thresholds = 13
    tickers = 1
    total_branches = periods * comparators * thresholds * tickers

    print("=" * 60, file=sys.stderr)
    print("FORGE OPTIMIZATION BENCHMARK", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(f"\nConfiguration:", file=sys.stderr)
    print(f"  Indicator: {config['indicator']}", file=sys.stderr)
    print(f"  Periods: {config['periodMin']}-{config['periodMax']} ({periods} periods)", file=sys.stderr)
    print(f"  Comparators: {config['comparator']} ({comparators})", file=sys.stderr)
    print(f"  Thresholds: {config['thresholdMin']}-{config['thresholdMax']} step {config['thresholdStep']} ({thresholds} thresholds)", file=sys.stderr)
    print(f"  Tickers: {len(config['tickers'])}", file=sys.stderr)
    print(f"  Workers: {config['numWorkers']}", file=sys.stderr)
    print(f"\nExpected branches: {total_branches}", file=sys.stderr)
    print(f"\nStarting benchmark...\n", file=sys.stderr)

    # Run forge
    start_time = time.perf_counter()
    result = run_forge_optimized(config)
    elapsed = time.perf_counter() - start_time

    # Results
    print("\n" + "=" * 60, file=sys.stderr)
    print("BENCHMARK RESULTS", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    print(f"\nPerformance:", file=sys.stderr)
    print(f"  Total branches: {result['stats']['totalBranches']:,}", file=sys.stderr)
    print(f"  Passing branches: {result['stats']['passingBranches']:,}", file=sys.stderr)
    print(f"  Pass rate: {result['stats']['passingBranches']/result['stats']['totalBranches']*100:.1f}%", file=sys.stderr)
    print(f"  Elapsed time: {elapsed:.2f} seconds", file=sys.stderr)
    print(f"  Branches per second: {result['stats']['branchesPerSecond']:.1f}", file=sys.stderr)
    print(f"  Time per branch: {elapsed/result['stats']['totalBranches']*1000:.2f} ms", file=sys.stderr)

    # Comparison to Java benchmark
    java_branches_per_sec = 724.6  # From 1.38ms per 252-day backtest
    speedup = result['stats']['branchesPerSecond'] / java_branches_per_sec

    print(f"\nComparison to Java Benchmark:", file=sys.stderr)
    print(f"  Java system: ~725 branches/sec", file=sys.stderr)
    print(f"  Atlas Forge: {result['stats']['branchesPerSecond']:.1f} branches/sec", file=sys.stderr)
    print(f"  Relative performance: {speedup:.1f}x", file=sys.stderr)

    # Scaling estimate
    print(f"\nScaling Estimate:", file=sys.stderr)
    print(f"  10,000 branches: ~{10000/result['stats']['branchesPerSecond']:.1f} seconds", file=sys.stderr)
    print(f"  100,000 branches: ~{100000/result['stats']['branchesPerSecond']/60:.1f} minutes", file=sys.stderr)
    print(f"  1,000,000 branches: ~{1000000/result['stats']['branchesPerSecond']/3600:.1f} hours", file=sys.stderr)

    print("\n" + "=" * 60, file=sys.stderr)

    return result


if __name__ == '__main__':
    result = run_benchmark()

    # Output JSON result
    print(json.dumps({
        'success': result['success'],
        'stats': result['stats'],
    }))
