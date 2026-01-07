/**
 * Condition Editor Component
 * Single condition row with indicator, window, comparator, threshold
 * Phase 2: Simplified version (advanced features in Phase 5)
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { ConditionLine, MetricChoice, ComparatorChoice } from '@/types/flowchart';
import { IndicatorDropdown } from './IndicatorDropdown';
import { isWindowlessIndicator } from '@/lib/flowchart/indicatorUtils';

export interface ConditionEditorProps {
  condition: ConditionLine;
  /** Index of this condition in the list */
  index: number;
  /** Total number of conditions */
  total: number;
  /** Whether delete is allowed for the first condition */
  allowDeleteFirst?: boolean;
  /** Called when any field is updated */
  onUpdate: (updates: Partial<ConditionLine>) => void;
  /** Called to delete this condition */
  onDelete: () => void;
}

export function ConditionEditor({
  condition: cond,
  index,
  total,
  allowDeleteFirst = false,
  onUpdate,
  onDelete,
}: ConditionEditorProps) {
  const prefix = cond.type === 'and' ? 'And if the ' : cond.type === 'or' ? 'Or if the ' : 'If the ';
  const isSingleLineItem = total === 1;
  const canDelete = (total > 1 && (index > 0 || allowDeleteFirst)) || (allowDeleteFirst && isSingleLineItem);
  const showWindow = !isWindowlessIndicator(cond.metric);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="default" className="gap-1 py-1 px-2.5 flex items-center flex-wrap">
        <span className="whitespace-nowrap">{prefix}</span>

        {/* Indicator dropdown */}
        <IndicatorDropdown
          value={cond.metric}
          onChange={(m: MetricChoice) => onUpdate({ metric: m })}
          className="h-8 px-1.5 mx-1 text-xs"
        />

        {/* Window input (hidden for windowless indicators) */}
        {showWindow && (
          <>
            <Input
              className="w-14 h-8 px-1.5 mx-1 inline-flex text-xs"
              type="number"
              min={1}
              value={cond.window}
              onChange={(e) => onUpdate({ window: Number(e.target.value) || 14 })}
            />
            <span className="text-xs">d</span>
          </>
        )}

        {/* Ticker display (simplified - no modal for Phase 2) */}
        <span className="text-xs mx-1">of</span>
        <span className="h-8 px-2 mx-1 border border-border rounded bg-card text-xs font-mono inline-flex items-center">
          {cond.ticker || 'SPY'}
        </span>

        {/* Comparator */}
        <Select
          className="h-8 px-1.5 mx-1 text-xs"
          value={cond.comparator}
          onChange={(e) => onUpdate({ comparator: e.target.value as ComparatorChoice })}
        >
          <option value="lt">is Less Than</option>
          <option value="gt">is Greater Than</option>
          <option value="crossAbove">Crosses Above</option>
          <option value="crossBelow">Crosses Below</option>
        </Select>

        {/* Threshold */}
        <Input
          className="w-16 h-8 px-1.5 mx-1 inline-flex text-xs"
          type="number"
          step="0.1"
          value={cond.threshold}
          onChange={(e) => onUpdate({ threshold: Number(e.target.value) || 0 })}
        />
      </Badge>

      {/* Delete button */}
      {canDelete && (
        <Button
          variant="destructive"
          size="icon"
          className="h-7 w-7 p-0 text-xs"
          onClick={onDelete}
          title="Delete condition"
        >
          ×
        </Button>
      )}
    </div>
  );
}
