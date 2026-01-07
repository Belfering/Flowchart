#!/usr/bin/env python3
"""
Batch download script for yfinance data with progress reporting.
Outputs PROGRESS: lines for real-time tracking by Node.js parent process.
"""

import sys
import json
import yfinance as yf
import pandas as pd
from pathlib import Path
import time
from datetime import datetime

def download_batch(tickers, output_dir, start_date=None, end_date=None):
    """
    Download historical data for a batch of tickers in parallel and save to parquet.

    Args:
        tickers: List of stock symbols (e.g., ['SPY', 'QQQ', ...])
        output_dir: Directory to save parquet files
        start_date: Start date (YYYY-MM-DD) or None for max history
        end_date: End date (YYYY-MM-DD) or None for today

    Returns:
        list of dicts with success status and details for each ticker
    """
    if not tickers:
        return []

    results = []

    try:
        # Download all tickers at once (yfinance parallelizes internally)
        if len(tickers) == 1:
            # Single ticker - returns simple DataFrame
            df_batch = yf.download(
                tickers[0],
                start=start_date,
                end=end_date,
                progress=False,
                auto_adjust=True,
                threads=True
            )

            if df_batch.empty:
                results.append({
                    'success': False,
                    'ticker': tickers[0],
                    'error': 'No data returned',
                    'rows': 0
                })
            else:
                df_batch = df_batch.reset_index()
                output_path = output_dir / f"{tickers[0]}.parquet"
                df_batch.to_parquet(output_path, index=False)
                results.append({
                    'success': True,
                    'ticker': tickers[0],
                    'rows': len(df_batch),
                    'file_path': str(output_path),
                    'start_date': str(df_batch['Date'].min()),
                    'end_date': str(df_batch['Date'].max())
                })
        else:
            # Multiple tickers - returns MultiIndex DataFrame
            df_batch = yf.download(
                tickers,
                start=start_date,
                end=end_date,
                progress=False,
                auto_adjust=True,
                group_by='ticker',
                threads=True
            )

            # Extract and save each ticker from the batch
            for ticker in tickers:
                try:
                    if df_batch.empty:
                        results.append({
                            'success': False,
                            'ticker': ticker,
                            'error': 'Batch returned no data',
                            'rows': 0
                        })
                        continue

                    # Extract single ticker from MultiIndex DataFrame
                    if isinstance(df_batch.columns, pd.MultiIndex):
                        if ticker in df_batch.columns.get_level_values(0):
                            df_ticker = df_batch[ticker].copy()
                        else:
                            results.append({
                                'success': False,
                                'ticker': ticker,
                                'error': 'Ticker not in batch result',
                                'rows': 0
                            })
                            continue
                    else:
                        df_ticker = df_batch.copy()

                    if df_ticker.empty:
                        results.append({
                            'success': False,
                            'ticker': ticker,
                            'error': 'No data for ticker',
                            'rows': 0
                        })
                        continue

                    # Reset index and save
                    df_ticker = df_ticker.reset_index()
                    output_path = output_dir / f"{ticker}.parquet"
                    df_ticker.to_parquet(output_path, index=False)

                    results.append({
                        'success': True,
                        'ticker': ticker,
                        'rows': len(df_ticker),
                        'file_path': str(output_path),
                        'start_date': str(df_ticker['Date'].min()),
                        'end_date': str(df_ticker['Date'].max())
                    })

                except Exception as e:
                    results.append({
                        'success': False,
                        'ticker': ticker,
                        'error': str(e),
                        'rows': 0
                    })

    except Exception as e:
        # Batch download failed completely
        for ticker in tickers:
            results.append({
                'success': False,
                'ticker': ticker,
                'error': f'Batch download error: {str(e)}',
                'rows': 0
            })

    return results

def main():
    """Main batch download orchestrator."""
    try:
        # Parse command line arguments
        if len(sys.argv) < 2:
            print(json.dumps({
                'success': False,
                'error': 'Missing parameters JSON argument'
            }))
            sys.exit(1)

        params = json.loads(sys.argv[1])
        batch_size = params.get('batch_size', 100)
        sleep_seconds = params.get('sleep_seconds', 2)
        start_date = params.get('start_date')
        end_date = params.get('end_date')
        fill_gaps = params.get('fill_gaps', False)

        # Setup directories
        project_root = Path(__file__).parent.parent
        output_dir = project_root / 'data' / 'parquet'
        output_dir.mkdir(parents=True, exist_ok=True)

        # Read ticker registry from file
        registry_path = project_root / 'data' / 'tiingo_registry.json'
        if not registry_path.exists():
            print(json.dumps({
                'success': False,
                'error': 'Ticker registry not found. Run Tiingo sync first.'
            }))
            sys.exit(1)

        with open(registry_path, 'r') as f:
            registry_data = json.load(f)

        # Get tickers from registry
        all_tickers = [t['ticker'] for t in registry_data.get('tickers', {}).values()]

        if not all_tickers:
            print(json.dumps({
                'success': False,
                'error': 'No tickers in registry'
            }))
            sys.exit(1)

        # If fill_gaps mode, only download missing tickers
        if fill_gaps:
            existing_files = set(f.stem.upper() for f in output_dir.glob('*.parquet'))
            tickers = [t for t in all_tickers if t.upper() not in existing_files]

            if not tickers:
                print(json.dumps({
                    'success': True,
                    'completed': 0,
                    'successful': 0,
                    'failed': 0,
                    'message': 'No missing tickers to download'
                }))
                sys.exit(0)
        else:
            tickers = all_tickers

        total = len(tickers)
        completed = 0
        successful = 0
        failed = 0
        all_results = []

        # Process tickers in batches (download all tickers in batch in parallel)
        num_batches = (total + batch_size - 1) // batch_size
        for batch_idx in range(0, total, batch_size):
            batch = tickers[batch_idx:batch_idx + batch_size]
            batch_num = (batch_idx // batch_size) + 1

            # Download entire batch in parallel
            batch_results = download_batch(batch, output_dir, start_date, end_date)
            all_results.extend(batch_results)

            # Update counters
            for result in batch_results:
                completed += 1
                if result['success']:
                    successful += 1
                else:
                    failed += 1

                # Output progress update for Node.js after each ticker
                progress = {
                    'completed': completed,
                    'total': total,
                    'successful': successful,
                    'failed': failed,
                    'lastTicker': result['ticker'],
                    'lastResult': result
                }
                print(f"PROGRESS:{json.dumps(progress)}", flush=True)

            # Pause between batches (except after last batch)
            if batch_idx + batch_size < total and sleep_seconds > 0:
                time.sleep(sleep_seconds)

        # Final summary
        summary = {
            'success': True,
            'completed': completed,
            'successful': successful,
            'failed': failed,
            'results': all_results
        }
        print(json.dumps(summary))
        sys.exit(0)

    except Exception as e:
        error_output = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_output), file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
