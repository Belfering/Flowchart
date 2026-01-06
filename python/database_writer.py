"""
Batch Database Writer for Results

Writes branch results to the Atlas Forge database in batches for optimal performance.
"""

import json
from pathlib import Path
import sys


class AtlasDatabase:
    """
    Simple interface to Atlas Forge JSON database.

    Provides batch write operations for branch results.
    """

    def __init__(self, db_path='../data/json/db.json'):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def load_db(self):
        """Load database from disk."""
        if not self.db_path.exists():
            return {
                'db': {
                    'downloads': [],
                    'tickers': [],
                    'jobs': [],
                    'results': [],
                    'tickerRegistry': [],
                },
                'nextId': {
                    'downloads': 1,
                    'jobs': 1,
                    'results': 1,
                },
            }

        with open(self.db_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def save_db(self, data):
        """Save database to disk."""
        with open(self.db_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

    def batch_insert_results(self, job_id, results, batch_size=100):
        """
        Insert results in batches for better performance.

        Args:
            job_id: Job ID to associate results with
            results: List of branch result dictionaries
            batch_size: Number of results to insert per batch

        Returns:
            Number of results inserted
        """
        data = self.load_db()

        next_id = data['nextId']['results']
        created_at = None  # Will use ISO format

        for i in range(0, len(results), batch_size):
            batch = results[i:i + batch_size]

            for result in batch:
                # Create result record
                record = {
                    'id': next_id,
                    'jobId': job_id,
                    'signalTicker': result['ticker'],
                    'investTicker': result['ticker'],  # Same for now (TODO: support alt invest ticker)
                    'indicator': result['indicator'],
                    'period': result['period'],
                    'comparator': result['comparator'],
                    'threshold': result['threshold'],
                    # IS metrics
                    'isTim': result.get('TIM'),
                    'isTimar': result.get('TIMAR'),
                    'isMaxdd': result.get('MaxDD'),
                    'isCagr': result.get('CAGR'),
                    'isTrades': result.get('Trades'),
                    'isAvgHold': result.get('AvgHold'),
                    'isSharpe': result.get('Sharpe'),
                    'isDd3': result.get('DD3'),
                    'isDd50': result.get('DD50'),
                    'isDd95': result.get('DD95'),
                    'isTimar3': result.get('TIMAR3'),
                    # OOS metrics (TODO: implement data split)
                    'oosTim': None,
                    'oosTimar': None,
                    'oosMaxdd': None,
                    'oosCagr': None,
                    'oosTrades': None,
                    'oosAvgHold': None,
                    'oosSharpe': None,
                    'oosDd3': None,
                    'oosDd50': None,
                    'oosDd95': None,
                    # Metadata
                    'createdAt': created_at,
                }

                data['db']['results'].append(record)
                next_id += 1

            # Save batch
            data['nextId']['results'] = next_id
            self.save_db(data)

            print(f"[DB] Saved batch {i//batch_size + 1}: {len(batch)} results (total: {min(i + batch_size, len(results))})", file=sys.stderr)

        return len(results)


if __name__ == '__main__':
    # Test batch writer
    db = AtlasDatabase('../data/json/db.json')

    test_results = [
        {
            'ticker': 'SPY',
            'indicator': 'RSI',
            'period': 14,
            'comparator': 'LT',
            'threshold': 30,
            'TIM': 45.5,
            'TIMAR': 65.3,
            'MaxDD': 12.2,
            'CAGR': 8.5,
            'Trades': 125,
            'AvgHold': 3.5,
            'Sharpe': 1.25,
            'DD3': 2.1,
            'DD50': 5.5,
            'DD95': 10.2,
            'TIMAR3': 31.1,
        }
    ]

    count = db.batch_insert_results(job_id=1, results=test_results)
    print(f"Inserted {count} results", file=sys.stderr)
