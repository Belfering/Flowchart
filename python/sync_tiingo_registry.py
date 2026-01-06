"""
Sync Tiingo Ticker Registry

Downloads and filters Tiingo's master ticker list for US stocks and ETFs.
Stores ticker metadata in JSON file for use by download scripts.

Based on Flowchart's sync_tickers.py implementation.
"""

import sys
import json
import urllib.request
import zipfile
import io
import csv
from pathlib import Path
from typing import Dict, List
from datetime import datetime

# Tiingo supported tickers URL
TIINGO_TICKERS_URL = "https://apimedia.tiingo.com/docs/tiingo/daily/supported_tickers.zip"

# US exchanges to include
US_EXCHANGES = frozenset([
    "NYSE", "NASDAQ", "AMEX", "ARCA", "BATS",
    "NYSE ARCA", "NYSE MKT", "NYSE AMERICAN",
    "NASDAQ GM", "NASDAQ GS", "NASDAQ CM",
])

# Only include Stock and ETF asset types (exclude Mutual Funds)
ALLOWED_ASSET_TYPES = frozenset(["Stock", "ETF"])


def sanitize_ticker_for_filename(ticker: str) -> str:
    """Sanitize ticker symbol for use in filenames."""
    return ticker.replace('/', '-').replace('\\', '-').upper()


def filter_us_tickers(tickers: List[Dict]) -> List[Dict]:
    """
    Filter to US exchanges with USD currency and allowed asset types.

    Args:
        tickers: List of ticker dictionaries from Tiingo

    Returns:
        Filtered list of US stocks and ETFs
    """
    filtered = []
    for t in tickers:
        exchange = (t.get('exchange') or '').upper()
        currency = (t.get('priceCurrency') or '').upper()
        asset_type = t.get('assetType') or ''
        start_date = t.get('startDate') or ''

        # Check if it's a US exchange
        is_us = any(us_ex in exchange for us_ex in US_EXCHANGES)

        # Check if it's allowed asset type
        is_allowed_type = asset_type in ALLOWED_ASSET_TYPES

        # Only include tickers with historical data
        has_data = bool(start_date)

        if is_us and currency == 'USD' and is_allowed_type and has_data:
            filtered.append(t)

    return filtered


def download_tiingo_tickers() -> List[Dict]:
    """
    Download and parse Tiingo's supported tickers ZIP file.

    Returns:
        List of ticker dictionaries
    """
    print("Downloading Tiingo supported tickers...", file=sys.stderr)

    # Download ZIP file
    with urllib.request.urlopen(TIINGO_TICKERS_URL) as response:
        zip_data = response.read()

    print(f"Downloaded {len(zip_data):,} bytes", file=sys.stderr)

    # Extract CSV from ZIP
    with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
        # Should contain supported_tickers.csv
        csv_filename = zf.namelist()[0]
        print(f"Extracting {csv_filename}...", file=sys.stderr)

        with zf.open(csv_filename) as csv_file:
            # Read CSV with UTF-8 encoding
            text_data = io.TextIOWrapper(csv_file, encoding='utf-8')
            reader = csv.DictReader(text_data)
            tickers = list(reader)

    print(f"Loaded {len(tickers):,} total tickers", file=sys.stderr)
    return tickers


def sync_ticker_registry(output_path: str = None) -> Dict:
    """
    Sync Tiingo ticker registry and save to JSON file.

    Args:
        output_path: Path to save registry JSON (default: data/tiingo_registry.json)

    Returns:
        Dictionary with registry stats
    """
    # Default output path
    if not output_path:
        script_dir = Path(__file__).parent
        data_dir = script_dir.parent / 'data'
        data_dir.mkdir(exist_ok=True)
        output_path = str(data_dir / 'tiingo_registry.json')

    # Download and filter tickers
    all_tickers = download_tiingo_tickers()
    us_tickers = filter_us_tickers(all_tickers)

    print(f"Filtered to {len(us_tickers):,} US stocks and ETFs", file=sys.stderr)

    # Organize by asset type for stats
    stocks = [t for t in us_tickers if t.get('assetType') == 'Stock']
    etfs = [t for t in us_tickers if t.get('assetType') == 'ETF']

    print(f"  - Stocks: {len(stocks):,}", file=sys.stderr)
    print(f"  - ETFs: {len(etfs):,}", file=sys.stderr)

    # Build registry structure
    registry = {
        'metadata': {
            'syncedAt': datetime.now().isoformat(),
            'source': 'tiingo',
            'url': TIINGO_TICKERS_URL,
            'totalTickers': len(us_tickers),
            'stocks': len(stocks),
            'etfs': len(etfs),
        },
        'tickers': {}
    }

    # Add each ticker with sanitized key
    for ticker in us_tickers:
        symbol = ticker.get('ticker', '')
        sanitized = sanitize_ticker_for_filename(symbol)

        registry['tickers'][sanitized] = {
            'ticker': symbol,
            'name': ticker.get('name', ''),
            'description': ticker.get('description', ''),
            'assetType': ticker.get('assetType', ''),
            'exchange': ticker.get('exchange', ''),
            'priceCurrency': ticker.get('priceCurrency', ''),
            'startDate': ticker.get('startDate', ''),
            'endDate': ticker.get('endDate', ''),
        }

    # Save to file
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(registry, f, indent=2)

    print(f"Saved registry to {output_file}", file=sys.stderr)

    # Return stats as JSON to stdout (for Node.js to parse)
    stats = {
        'success': True,
        'totalTickers': len(us_tickers),
        'stocks': len(stocks),
        'etfs': len(etfs),
        'registryPath': str(output_file),
        'syncedAt': registry['metadata']['syncedAt'],
    }

    return stats


if __name__ == '__main__':
    try:
        # Parse command line args if provided
        params = {}
        if len(sys.argv) > 1:
            params = json.loads(sys.argv[1])

        output_path = params.get('output_path')
        stats = sync_ticker_registry(output_path)

        # Output JSON result to stdout
        print(json.dumps(stats))

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
        }
        print(json.dumps(error_result))
        sys.exit(1)
