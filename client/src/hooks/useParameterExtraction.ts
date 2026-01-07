/**
 * Parameter Extraction Hook
 * Phase 3: Automatically detect periods and thresholds from flowchart
 */

import { useMemo } from 'react';
import type { FlowNode, ParameterRange, SlotId } from '@/types/flowchart';
import { isWindowlessIndicator } from '@/lib/flowchart/indicatorUtils';

interface ExtractedParameter {
  id: string;
  type: 'period' | 'threshold';
  nodeId: string;
  nodeTitle: string;
  conditionId?: string;
  currentValue: number;
  path: string; // Description for UI (e.g., "Indicator Block 1 > RSI > Period")
}

/**
 * Recursively scan flowchart tree and extract all parameters
 */
function extractParametersFromNode(
  node: FlowNode,
  path: string = '',
  results: ExtractedParameter[] = []
): ExtractedParameter[] {
  const nodePath = path ? `${path} > ${node.title}` : node.title;

  // Extract periods and thresholds from indicator blocks
  if (node.kind === 'indicator' && node.conditions) {
    node.conditions.forEach((cond, idx) => {
      // Extract period (window) if not windowless
      if (!isWindowlessIndicator(cond.metric) && cond.window) {
        results.push({
          id: `${node.id}-${cond.id}-period`,
          type: 'period',
          nodeId: node.id,
          nodeTitle: node.title,
          conditionId: cond.id,
          currentValue: cond.window,
          path: `${nodePath} > Condition ${idx + 1} > ${cond.metric} > Period`,
        });
      }

      // Extract threshold
      if (cond.threshold !== undefined) {
        results.push({
          id: `${node.id}-${cond.id}-threshold`,
          type: 'threshold',
          nodeId: node.id,
          nodeTitle: node.title,
          conditionId: cond.id,
          currentValue: cond.threshold,
          path: `${nodePath} > Condition ${idx + 1} > ${cond.metric} > Threshold`,
        });
      }
    });
  }

  // Extract from numbered blocks (Phase 5)
  if (node.kind === 'numbered' && node.numbered) {
    node.numbered.items.forEach((item, itemIdx) => {
      item.conditions.forEach((cond, condIdx) => {
        // Extract period
        if (!isWindowlessIndicator(cond.metric) && cond.window) {
          results.push({
            id: `${node.id}-${item.id}-${cond.id}-period`,
            type: 'period',
            nodeId: node.id,
            nodeTitle: node.title,
            conditionId: cond.id,
            currentValue: cond.window,
            path: `${nodePath} > Item ${itemIdx + 1} > Condition ${condIdx + 1} > ${cond.metric} > Period`,
          });
        }

        // Extract threshold
        if (cond.threshold !== undefined) {
          results.push({
            id: `${node.id}-${item.id}-${cond.id}-threshold`,
            type: 'threshold',
            nodeId: node.id,
            nodeTitle: node.title,
            conditionId: cond.id,
            currentValue: cond.threshold,
            path: `${nodePath} > Item ${itemIdx + 1} > Condition ${condIdx + 1} > ${cond.metric} > Threshold`,
          });
        }
      });
    });
  }

  // Extract from function blocks (Phase 5)
  if (node.kind === 'function' && node.window) {
    results.push({
      id: `${node.id}-function-period`,
      type: 'period',
      nodeId: node.id,
      nodeTitle: node.title,
      currentValue: node.window,
      path: `${nodePath} > ${node.metric} > Period`,
    });
  }

  // Recursively process children
  const slots = Object.keys(node.children) as SlotId[];
  for (const slot of slots) {
    const children = node.children[slot];
    if (children) {
      children.forEach((child) => {
        if (child) {
          extractParametersFromNode(child, nodePath, results);
        }
      });
    }
  }

  return results;
}

/**
 * Convert extracted parameters to ParameterRange format with defaults
 */
function createParameterRange(param: ExtractedParameter): ParameterRange {
  const currentValue = param.currentValue;

  if (param.type === 'period') {
    // Period defaults: current ± 5, step 1
    return {
      id: param.id,
      type: 'period',
      nodeId: param.nodeId,
      conditionId: param.conditionId,
      currentValue,
      enabled: false, // Disabled by default
      min: Math.max(1, currentValue - 5),
      max: currentValue + 5,
      step: 1,
      path: param.path,
    };
  } else {
    // Threshold defaults: current ± 10, step 1
    return {
      id: param.id,
      type: 'threshold',
      nodeId: param.nodeId,
      conditionId: param.conditionId,
      currentValue,
      enabled: false,
      min: currentValue - 10,
      max: currentValue + 10,
      step: 1,
      path: param.path,
    };
  }
}

/**
 * Hook to extract all parameters from flowchart tree
 * Returns ParameterRange[] that can be configured by user
 */
export function useParameterExtraction(flowchart: FlowNode | null): ParameterRange[] {
  return useMemo(() => {
    if (!flowchart) return [];

    const extracted = extractParametersFromNode(flowchart);
    return extracted.map(createParameterRange);
  }, [flowchart]);
}

/**
 * Calculate total number of branches from enabled parameter ranges
 */
export function calculateBranchCount(parameterRanges: ParameterRange[]): number {
  const enabledRanges = parameterRanges.filter((p) => p.enabled);

  if (enabledRanges.length === 0) {
    return 1; // No parameters = 1 branch (just the flowchart as-is)
  }

  // Calculate product of all range sizes
  return enabledRanges.reduce((product, range) => {
    const rangeSize = Math.floor((range.max - range.min) / range.step) + 1;
    return product * rangeSize;
  }, 1);
}
