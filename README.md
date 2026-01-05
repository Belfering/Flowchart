# Atlas Forge

Multi-Indicator Branch Generation & Backtesting Tool

## Overview

Atlas Forge extends the RSI branch generation concept to all 57 indicators from the Flowchart app, with a powerful GUI for systematic strategy exploration.

## Features

- **Data Management**: Download and store market data from yfinance in parquet format
- **Forge Dashboard**: Configure indicators, tickers, comparators, thresholds, and pass/fail criteria
- **Results**: View, sort, and export passing trading strategy branches

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS v4 + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (Drizzle ORM) + DuckDB (Parquet queries)
- **Backtesting**: Python (pandas_ta for indicators, battle-tested metrics from RSI System)

## Project Structure

```
atlas-forge/
├── client/          # React frontend
├── server/          # Express backend
├── python/          # Python backtesting engine
└── data/            # Parquet files and SQLite databases
```

## Getting Started

### Installation

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..

# Install Python dependencies
pip install -r python/requirements.txt
```

### Development

```bash
# Run both client and server in development mode
npm run dev

# Run client only
npm run dev:client

# Run server only
npm run dev:server
```

### Building for Production

```bash
npm run build
npm start
```

## Configuration

Pass/fail criteria can be configured in the Forge Dashboard:
- Minimum TIM (Time In Market %)
- Minimum TIMAR (CAGR/TIM ratio)
- Maximum MaxDD (Max Drawdown %)
- Minimum Trades
- Minimum TIMARDD ratio

## License

MIT
