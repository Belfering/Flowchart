/**
 * Indicator Utilities for Flowchart
 * Helper functions for indicator-specific logic
 */

import type { MetricChoice } from '@/types/flowchart';
import { INDICATORS } from '@/lib/indicators';

// Map MetricChoice to indicator IDs for lookup
const METRIC_TO_ID: Record<MetricChoice, string> = {
  'Current Price': 'Current Price',
  'Simple Moving Average': 'Simple Moving Average',
  'Exponential Moving Average': 'Exponential Moving Average',
  'Hull Moving Average': 'Hull Moving Average',
  'Weighted Moving Average': 'Weighted Moving Average',
  'Wilder Moving Average': 'Wilder Moving Average',
  'DEMA': 'DEMA',
  'TEMA': 'TEMA',
  'KAMA': 'KAMA',
  'Relative Strength Index': 'RSI',
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
  'Date': 'Date', // Not in Atlas Forge indicators yet
};

/**
 * Check if an indicator requires a window parameter
 */
export function isWindowlessIndicator(metric: MetricChoice): boolean {
  const indicatorId = METRIC_TO_ID[metric];

  // Special cases not in indicators.ts
  if (metric === 'Date') return true;

  if (!indicatorId || !INDICATORS[indicatorId]) {
    return false;
  }

  return INDICATORS[indicatorId].windowless === true;
}

/**
 * Get default window for an indicator
 */
export function getDefaultWindow(metric: MetricChoice): number {
  const indicatorId = METRIC_TO_ID[metric];

  if (!indicatorId || !INDICATORS[indicatorId]) {
    return 14; // Default fallback
  }

  return INDICATORS[indicatorId].defaultPeriod;
}

/**
 * Get threshold range for an indicator
 */
export function getThresholdRange(metric: MetricChoice): [number, number] {
  const indicatorId = METRIC_TO_ID[metric];

  if (!indicatorId || !INDICATORS[indicatorId]) {
    return [0, 100]; // Default fallback
  }

  return INDICATORS[indicatorId].thresholdRange;
}
