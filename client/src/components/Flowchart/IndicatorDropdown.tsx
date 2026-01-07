/**
 * Indicator Dropdown Component
 * Searchable dropdown with 64 indicators organized by category
 * Phase 2: Basic dropdown (search in Phase 5)
 */

import { Select } from '@/components/ui/select';
import { INDICATORS, getCategoryName, INDICATOR_CATEGORIES } from '@/lib/indicators';
import type { MetricChoice } from '@/types/flowchart';

interface IndicatorDropdownProps {
  value: MetricChoice;
  onChange: (value: MetricChoice) => void;
  className?: string;
}

// Map Atlas Forge indicator IDs to Flowchart MetricChoice names
// Most are 1:1, but some need mapping
const INDICATOR_ID_TO_METRIC: Record<string, MetricChoice> = {
  'RSI': 'Relative Strength Index',
  'Current Price': 'Current Price',
  'Simple Moving Average': 'Simple Moving Average',
  'Exponential Moving Average': 'Exponential Moving Average',
  'Hull Moving Average': 'Hull Moving Average',
  'Weighted Moving Average': 'Weighted Moving Average',
  'Wilder Moving Average': 'Wilder Moving Average',
  'DEMA': 'DEMA',
  'TEMA': 'TEMA',
  'KAMA': 'KAMA',
  'RSI (SMA)': 'RSI (SMA)',
  'RSI (EMA)': 'RSI (EMA)',
  'Stochastic RSI': 'Stochastic RSI',
  'Laguerre RSI': 'Laguerre RSI',
  'Momentum (Weighted)': 'Momentum (Weighted)',
  'Momentum (Unweighted)': 'Momentum (Unweighted)',
  'Momentum (12-Month SMA)': 'Momentum (12-Month SMA)',
  'Rate of Change': 'Rate of Change',
  'Williams %R': 'Williams %R',
  'CCI': 'CCI',
  'Stochastic %K': 'Stochastic %K',
  'Stochastic %D': 'Stochastic %D',
  'ADX': 'ADX',
  'Standard Deviation': 'Standard Deviation',
  'Standard Deviation of Price': 'Standard Deviation of Price',
  'Max Drawdown': 'Max Drawdown',
  'Drawdown': 'Drawdown',
  'Bollinger %B': 'Bollinger %B',
  'Bollinger Bandwidth': 'Bollinger Bandwidth',
  'ATR': 'ATR',
  'ATR %': 'ATR %',
  'Historical Volatility': 'Historical Volatility',
  'Ulcer Index': 'Ulcer Index',
  'Cumulative Return': 'Cumulative Return',
  'SMA of Returns': 'SMA of Returns',
  'Trend Clarity': 'Trend Clarity',
  'Ultimate Smoother': 'Ultimate Smoother',
  'Linear Reg Slope': 'Linear Reg Slope',
  'Linear Reg Value': 'Linear Reg Value',
  'Price vs SMA': 'Price vs SMA',
  'Aroon Up': 'Aroon Up',
  'Aroon Down': 'Aroon Down',
  'Aroon Oscillator': 'Aroon Oscillator',
  'MACD Histogram': 'MACD Histogram',
  'PPO Histogram': 'PPO Histogram',
  'Money Flow Index': 'Money Flow Index',
  'OBV Rate of Change': 'OBV Rate of Change',
  'VWAP Ratio': 'VWAP Ratio',
};

// Reverse mapping for display
const METRIC_TO_INDICATOR_ID: Record<MetricChoice, string> = Object.entries(
  INDICATOR_ID_TO_METRIC
).reduce((acc, [id, metric]) => {
  acc[metric] = id;
  return acc;
}, {} as Record<MetricChoice, string>);

export function IndicatorDropdown({ value, onChange, className }: IndicatorDropdownProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const indicatorId = e.target.value;
    const metricChoice = INDICATOR_ID_TO_METRIC[indicatorId];
    if (metricChoice) {
      onChange(metricChoice);
    }
  };

  // Get current indicator ID from MetricChoice value
  const currentIndicatorId = METRIC_TO_INDICATOR_ID[value] || 'RSI';

  return (
    <Select value={currentIndicatorId} onChange={handleChange} className={className}>
      {INDICATOR_CATEGORIES.map((category) => {
        const categoryIndicators = Object.values(INDICATORS).filter(
          (ind) => ind.category === category
        );

        if (categoryIndicators.length === 0) return null;

        return (
          <optgroup key={category} label={getCategoryName(category)}>
            {categoryIndicators.map((indicator) => (
              <option key={indicator.id} value={indicator.id}>
                {indicator.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </Select>
  );
}
