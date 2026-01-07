/**
 * Flowchart Estimate Hook
 * Phase 3: Calculate branch count and time estimates for flowchart mode
 */

import { useMemo } from 'react';
import type { ParameterRange } from '@/types/flowchart';

export interface FlowchartEstimate {
  totalBranches: number;
  estimatedSeconds: number;
  estimatedMinutes: number;
  parameterCombinations: number;
  tickerCount: number;
}

/**
 * Calculate total branches from parameter ranges and ticker count
 * Formula: (Product of all enabled parameter range sizes) × (Number of tickers)
 */
function calculateTotalBranches(
  parameterRanges: ParameterRange[],
  tickerCount: number
): number {
  const enabledRanges = parameterRanges.filter((p) => p.enabled);

  if (enabledRanges.length === 0) {
    // No parameters enabled = 1 combination per ticker
    return Math.max(1, tickerCount);
  }

  // Calculate product of all range sizes
  const parameterCombinations = enabledRanges.reduce((product, range) => {
    const rangeSize = Math.floor((range.max - range.min) / range.step) + 1;
    return product * rangeSize;
  }, 1);

  return parameterCombinations * Math.max(1, tickerCount);
}

/**
 * Hook to calculate flowchart branch estimates
 * @param parameterRanges - Array of parameter ranges from useParameterExtraction
 * @param tickerCount - Number of tickers to test
 * @returns Estimate with branch count and time predictions
 */
export function useFlowchartEstimate(
  parameterRanges: ParameterRange[],
  tickerCount: number
): FlowchartEstimate | null {
  return useMemo(() => {
    if (!parameterRanges || tickerCount === 0) {
      return null;
    }

    const totalBranches = calculateTotalBranches(parameterRanges, tickerCount);

    // Estimate based on 100 branches/second (conservative)
    const estimatedSeconds = Math.ceil(totalBranches / 100);
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60);

    const enabledRanges = parameterRanges.filter((p) => p.enabled);
    const parameterCombinations = enabledRanges.length === 0
      ? 1
      : enabledRanges.reduce((product, range) => {
          const rangeSize = Math.floor((range.max - range.min) / range.step) + 1;
          return product * rangeSize;
        }, 1);

    return {
      totalBranches,
      estimatedSeconds,
      estimatedMinutes,
      parameterCombinations,
      tickerCount,
    };
  }, [parameterRanges, tickerCount]);
}
