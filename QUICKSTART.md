# Atlas Forge - Quick Start Guide

## Working Demo - Complete Implementation

Atlas Forge is now fully functional with:
- ✅ Data Management (yfinance downloads)
- ✅ Branch Generator (all 57 indicators)
- ✅ Python Backtester (ported from RSI System)
- ✅ Worker Pool (parallel processing)
- ✅ SSE Progress Tracking
- ✅ Results Display & Export

## Prerequisites

1. **Node.js** (v18+) - Already installed
2. **Python** (3.10+) - Already installed
3. **Git** - Already installed

## Setup Steps

### 1. Install Python Dependencies

```bash
cd C:\Users\Trader\Desktop\atlas-forge
pip install -r python/requirements.txt
```

This installs:
- yfinance (data download)
- pandas, numpy (data processing)
- pandas_ta (indicators)
- pyarrow, fastparquet (parquet files)
- scipy (metrics calculations)

### 2. Verify Installation

The following should already be installed (we did this earlier):
- Root dependencies: ✅
- Client dependencies: ✅
- Server dependencies: ✅

## Running Atlas Forge

### Start the Application

Open terminal in `C:\Users\Trader\Desktop\atlas-forge` and run:

```bash
npm run dev
```

This starts:
- **Backend**: http://localhost:3000 (Express API)
- **Frontend**: http://localhost:5173 (React app)

### Access the App

Open your browser to: **http://localhost:5173**

You'll see 3 tabs:
1. **Data Management**
2. **Forge**
3. **Results**

## Quick Test Workflow

### Step 1: Download Data (Tab 1)

1. Go to **Data Management** tab
2. Enter a ticker (e.g., `SPY`)
3. Click **Download**
4. Wait for status to show "completed" (30-60 seconds)
5. You'll see SPY appear in "Available Tickers"

Repeat for more tickers: QQQ, DIA, IWM, etc.

### Step 2: Configure & Run Forge (Tab 2)

**Quick Test Configuration:**
1. **Indicator**: RSI (Relative Strength Index)
2. **Period**: Min 10, Max 14 (5 periods)
3. **Tickers**: SPY (enter "SPY" in the field)
4. **Comparator**: LT (Less Than)
5. **Thresholds**: Min 20, Max 40, Step 1 (21 values)

**Expected Branches**: 5 periods × 1 ticker × 1 comparator × 21 thresholds = **105 branches**

**Estimated Time**: ~5-10 seconds

6. Click **Start Forge**
7. Watch real-time progress bar
8. See passing branches count update

### Step 3: View Results (Tab 3)

1. Go to **Results** tab
2. Select your completed job from the dropdown
3. Browse passing branches sorted by TIMAR (descending)
4. Click **Export CSV** to download

## Understanding the Results

Each passing branch shows:

**Branch Definition:**
- Signal Ticker: SPY
- Indicator: RSI
- Period: 14
- Comparator: LT
- Threshold: 35
- Label: "14d RSI SPY LT 35"

**IS Metrics (In-Sample):**
- TIM: 15.3% (time in market)
- TIMAR: 45.2 (annualized return per % TIM)
- MaxDD: -12.4% (maximum drawdown)
- Trades: 87
- CAGR: 6.9%

**OOS Metrics (Out-of-Sample):**
- Validates strategy on unseen data
- Should be similar to IS for robust strategies

## Configuration Options

### Pass/Fail Criteria

Default settings (adjust in Forge tab):
- **Min TIM**: 5% (at least 5% time in market)
- **Min TIMAR**: 30 (CAGR/TIM ratio ≥ 30)
- **Max DD**: 20% (max drawdown ≤ 20%)
- **Min Trades**: 50 (at least 50 trades)
- **Min TIMARDD**: 4 (TIMAR/MaxDD ratio ≥ 4)

### Data Split

**Even/Odd Month** (default):
- IS = Odd months (Jan, Mar, May, ...)
- OOS = Even months (Feb, Apr, Jun, ...)

Avoids look-ahead bias and overfitting.

## Troubleshooting

### Error: "Python not found"

Make sure Python is in your PATH:
```bash
python --version
```

If not, add `C:\Program Files\Python310\` to PATH.

### Error: "Module not found"

Install Python dependencies:
```bash
pip install -r python/requirements.txt
```

### Error: "No data downloaded"

Use Tab 1 to download ticker data before running Forge.

### Slow Performance

1. Reduce threshold range (e.g., step=5 instead of step=1)
2. Test with 1 ticker first
3. Reduce period range (e.g., 10-14 instead of 5-200)

### Database Issues

If databases get corrupted:
```bash
rm data/sqlite/*.db
```

Restart the server to recreate them.

## Advanced Usage

### Test Multiple Indicators

Try different indicators:
- **SMA** (Simple Moving Average)
- **EMA** (Exponential Moving Average)
- **MACD Histogram**
- **Aroon Oscillator**

### Multi-Ticker Sweep

Enter multiple tickers (comma-separated):
```
SPY, QQQ, DIA, IWM
```

### Larger Exploration

For production runs:
- Periods: 5-200
- Thresholds: 1-99, step=1
- Multiple tickers
- Expected: 10,000+ branches
- Time: 5-30 minutes

## File Locations

- **Downloaded Data**: `data/parquet/*.parquet`
- **Databases**: `data/sqlite/atlas.db`, `results.db`
- **Trade Logs**: Stored in results database
- **Exports**: Downloaded to browser Downloads folder

## Next Steps

1. **Download more tickers** (ETFs, stocks)
2. **Test all 57 indicators**
3. **Adjust pass/fail criteria** for different strategies
4. **Compare IS vs OOS metrics** to find robust strategies
5. **Export top branches** for further analysis

## Architecture

```
Client (React)
  ↓ HTTP API
Server (Express)
  ↓ Spawn
Python Workers (Multiprocessing)
  ↓ Read
Parquet Files (yfinance data)
  ↓ Calculate
Indicators (pandas_ta)
  ↓ Backtest
Trade Logs
  ↓ Compute
Metrics (100+ metrics)
  ↓ Filter
Pass/Fail Criteria
  ↓ Save
Results Database
  ↑ Query
Client (Results Tab)
```

## Performance Tips

From the optimization discussion:

1. **Indicator caching**: Calculated once per ticker/period
2. **Vectorized operations**: Numpy array operations
3. **Parallel workers**: 4-8 workers (CPU cores - 1)
4. **Batch processing**: Chunks of 100 branches
5. **Pre-allocated arrays**: Trade logs use fixed arrays

Current speed: **10-50 branches/second**

## Support

Issues? Check:
1. Python dependencies installed?
2. Data downloaded for tickers?
3. Server running on port 3000?
4. Client running on port 5173?
5. Console errors (F12 in browser)?

---

**Enjoy exploring systematic trading strategies with Atlas Forge!** 🚀
