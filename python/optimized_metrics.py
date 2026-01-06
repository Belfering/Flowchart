"""
Optimized Metrics Calculation with Numba JIT

This module provides high-performance metric calculations using:
- Numba JIT compilation (10-100x speedup on hot loops)
- NumPy arrays (no pandas overhead)
- Pre-allocated arrays (no dynamic allocation)

Performance target: <1ms for 252-day backtest (similar to Java system)
"""

import numpy as np
from numba import jit, prange
import sys


@jit(nopython=True, cache=True, fastmath=True)
def calculate_trades_from_signals(signals, prices):
    """
    Calculate trades from binary signal array (vectorized).

    Args:
        signals: NumPy array of 0/1 (0=cash, 1=invested)
        prices: NumPy array of close prices

    Returns:
        Tuple of (trade_returns, trade_holds, trade_count)
    """
    n = len(signals)
    trade_returns = []
    trade_holds = []

    in_trade = False
    entry_price = 0.0
    entry_idx = 0

    for i in range(n):
        if signals[i] == 1 and not in_trade:
            # Enter trade
            in_trade = True
            entry_price = prices[i]
            entry_idx = i
        elif signals[i] == 0 and in_trade:
            # Exit trade
            in_trade = False
            exit_price = prices[i]
            trade_return = (exit_price - entry_price) / entry_price
            trade_hold = i - entry_idx
            trade_returns.append(trade_return)
            trade_holds.append(trade_hold)

    # Close any open trade at end
    if in_trade:
        exit_price = prices[n - 1]
        trade_return = (exit_price - entry_price) / entry_price
        trade_hold = n - 1 - entry_idx
        trade_returns.append(trade_return)
        trade_holds.append(trade_hold)

    return (
        np.array(trade_returns),
        np.array(trade_holds),
        len(trade_returns)
    )


@jit(nopython=True, cache=True, fastmath=True)
def calculate_equity_curve(signals, returns):
    """
    Calculate equity curve from signals and returns (vectorized).

    Args:
        signals: NumPy array of 0/1 (0=cash, 1=invested)
        returns: NumPy array of daily returns

    Returns:
        NumPy array of equity values (starting at 1.0)
    """
    n = len(returns)
    equity = np.empty(n + 1, dtype=np.float64)
    equity[0] = 1.0

    for i in range(n):
        if signals[i] == 1:
            equity[i + 1] = equity[i] * (1.0 + returns[i])
        else:
            equity[i + 1] = equity[i]

    return equity


@jit(nopython=True, cache=True, fastmath=True)
def calculate_drawdown(equity):
    """
    Calculate drawdown series from equity curve (vectorized).

    Args:
        equity: NumPy array of equity values

    Returns:
        Tuple of (drawdown_array, max_drawdown)
    """
    n = len(equity)
    drawdown = np.empty(n, dtype=np.float64)
    running_max = equity[0]
    max_dd = 0.0

    for i in range(n):
        if equity[i] > running_max:
            running_max = equity[i]

        dd = (running_max - equity[i]) / running_max * 100.0
        drawdown[i] = dd

        if dd > max_dd:
            max_dd = dd

    return drawdown, max_dd


@jit(nopython=True, cache=True, fastmath=True)
def calculate_cagr(initial_value, final_value, days):
    """
    Calculate Compound Annual Growth Rate.

    Args:
        initial_value: Starting equity
        final_value: Ending equity
        days: Number of trading days

    Returns:
        CAGR as percentage
    """
    if initial_value <= 0 or final_value <= 0 or days <= 0:
        return 0.0

    years = days / 252.0
    cagr = (np.power(final_value / initial_value, 1.0 / years) - 1.0) * 100.0
    return cagr


@jit(nopython=True, cache=True, fastmath=True)
def calculate_sharpe_ratio(returns, signals):
    """
    Calculate Sharpe ratio (annualized).

    Args:
        returns: Daily returns array
        signals: Signal array (0/1)

    Returns:
        Sharpe ratio
    """
    # Get returns only when invested
    invested_returns = returns[signals == 1]

    if len(invested_returns) < 2:
        return 0.0

    mean_return = np.mean(invested_returns)
    std_return = np.std(invested_returns)

    if std_return == 0:
        return 0.0

    # Annualize
    sharpe = (mean_return / std_return) * np.sqrt(252.0)
    return sharpe


@jit(nopython=True, cache=True, fastmath=True)
def calculate_all_metrics(signals, prices, returns):
    """
    Calculate all core metrics in one pass (optimized).

    Args:
        signals: NumPy array of 0/1 (0=cash, 1=invested)
        prices: NumPy array of close prices
        returns: NumPy array of daily returns

    Returns:
        Dict-like tuple of metrics
    """
    # Trade analysis
    trade_returns, trade_holds, trade_count = calculate_trades_from_signals(signals, prices)

    # Time in market
    tim = np.sum(signals) / len(signals) * 100.0

    # Equity curve
    equity = calculate_equity_curve(signals, returns)

    # CAGR
    cagr = calculate_cagr(equity[0], equity[-1], len(returns))

    # TIMAR (CAGR / TIM as decimal, so multiply by 100 to convert TIM from percentage to decimal)
    timar = (cagr * 100.0 / tim) if tim > 0 else 0.0

    # Drawdown
    drawdown, max_dd = calculate_drawdown(equity)

    # Average holding period
    avg_hold = np.mean(trade_holds) if len(trade_holds) > 0 else 0.0

    # Sharpe ratio
    sharpe = calculate_sharpe_ratio(returns, signals)

    # Drawdown percentiles
    dd3 = np.percentile(drawdown, 3) if len(drawdown) > 0 else 0.0
    dd50 = np.percentile(drawdown, 50) if len(drawdown) > 0 else 0.0
    dd95 = np.percentile(drawdown, 95) if len(drawdown) > 0 else 0.0

    # TIMAR3
    timar3 = cagr / dd3 if dd3 > 0 else 0.0

    # TIMARDD
    timardd = timar / max_dd if max_dd > 0 else 0.0

    return (
        tim, timar, max_dd, cagr, trade_count, avg_hold,
        sharpe, dd3, dd50, dd95, timar3, timardd
    )


def calculate_metrics_fast(signals, prices, returns):
    """
    Python wrapper for Numba-JIT metrics calculation.

    Args:
        signals: NumPy array of 0/1
        prices: NumPy array of close prices
        returns: NumPy array of daily returns

    Returns:
        Dictionary of metrics
    """
    # Ensure NumPy arrays
    signals = np.asarray(signals, dtype=np.int32)
    prices = np.asarray(prices, dtype=np.float64)
    returns = np.asarray(returns, dtype=np.float64)

    # Calculate metrics (JIT compiled, very fast)
    (
        tim, timar, max_dd, cagr, trade_count, avg_hold,
        sharpe, dd3, dd50, dd95, timar3, timardd
    ) = calculate_all_metrics(signals, prices, returns)

    return {
        'TIM': tim,
        'TIMAR': timar,
        'MaxDD': max_dd,
        'CAGR': cagr,
        'Trades': int(trade_count),
        'AvgHold': avg_hold,
        'Sharpe': sharpe,
        'DD3': dd3,
        'DD50': dd50,
        'DD95': dd95,
        'TIMAR3': timar3,
        'TIMARDD': timardd,
    }


if __name__ == '__main__':
    # Benchmark test
    print("Benchmarking optimized metrics...", file=sys.stderr)

    # Generate test data (252 trading days)
    np.random.seed(42)
    n = 252

    signals = np.random.randint(0, 2, size=n, dtype=np.int32)
    prices = 100.0 * np.exp(np.cumsum(np.random.randn(n) * 0.01))
    returns = np.diff(prices) / prices[:-1]
    returns = np.concatenate([[0.0], returns])

    # Warmup (trigger JIT compilation)
    _ = calculate_metrics_fast(signals, prices, returns)

    # Benchmark
    import time
    iterations = 1000
    start = time.perf_counter()

    for _ in range(iterations):
        metrics = calculate_metrics_fast(signals, prices, returns)

    elapsed = (time.perf_counter() - start) / iterations * 1000

    print(f"Average time per backtest: {elapsed:.3f} ms", file=sys.stderr)
    print(f"Sample metrics: TIM={metrics['TIM']:.2f}%, TIMAR={metrics['TIMAR']:.2f}", file=sys.stderr)
