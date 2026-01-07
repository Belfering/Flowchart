/**
 * Parameter Extraction Panel
 * Phase 3: Display and configure automatically extracted parameters
 */

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ParameterRange } from '@/types/flowchart';

interface ParameterExtractionPanelProps {
  parameters: ParameterRange[];
  onUpdateParameter: (id: string, updates: Partial<ParameterRange>) => void;
  branchCount: number;
}

export function ParameterExtractionPanel({
  parameters,
  onUpdateParameter,
  branchCount,
}: ParameterExtractionPanelProps) {
  if (parameters.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-2">Parameter Extraction</h3>
        <p className="text-sm text-muted-foreground">
          No parameters found. Add indicator blocks with conditions to enable parameter extraction.
        </p>
      </Card>
    );
  }

  const enabledCount = parameters.filter((p) => p.enabled).length;
  const periodParams = parameters.filter((p) => p.type === 'period');
  const thresholdParams = parameters.filter((p) => p.type === 'threshold');

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Parameter Extraction</h3>
        <p className="text-sm text-muted-foreground">
          Found {parameters.length} parameters ({periodParams.length} periods, {thresholdParams.length} thresholds).
          {enabledCount > 0 && (
            <span className="font-semibold text-foreground"> {enabledCount} enabled.</span>
          )}
        </p>
      </div>

      {/* Branch Estimate */}
      {enabledCount > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-900">
          <p className="text-sm font-semibold">
            Branch Estimate: {branchCount.toLocaleString()} branches
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This is the total number of strategy combinations that will be tested
          </p>
        </div>
      )}

      {/* Period Parameters */}
      {periodParams.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Periods (Windows)</h4>
          <div className="space-y-2">
            {periodParams.map((param) => (
              <ParameterRow
                key={param.id}
                parameter={param}
                onUpdate={(updates) => onUpdateParameter(param.id, updates)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Threshold Parameters */}
      {thresholdParams.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Thresholds</h4>
          <div className="space-y-2">
            {thresholdParams.map((param) => (
              <ParameterRow
                key={param.id}
                parameter={param}
                onUpdate={(updates) => onUpdateParameter(param.id, updates)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {enabledCount === 0 && (
        <div className="mt-4 p-3 bg-muted rounded">
          <p className="text-xs text-muted-foreground">
            💡 Enable parameters by checking the boxes. The system will generate all combinations
            of enabled parameter values for testing.
          </p>
        </div>
      )}
    </Card>
  );
}

// Row component for a single parameter
interface ParameterRowProps {
  parameter: ParameterRange;
  onUpdate: (updates: Partial<ParameterRange>) => void;
}

function ParameterRow({ parameter, onUpdate }: ParameterRowProps) {
  const rangeSize = Math.floor((parameter.max - parameter.min) / parameter.step) + 1;

  return (
    <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg">
      {/* Enable checkbox */}
      <input
        type="checkbox"
        checked={parameter.enabled}
        onChange={(e) => onUpdate({ enabled: e.target.checked })}
        className="w-4 h-4"
      />

      {/* Parameter path */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{parameter.path}</p>
        <p className="text-xs text-muted-foreground">
          Current: {parameter.currentValue} {parameter.enabled && `• ${rangeSize} values`}
        </p>
      </div>

      {/* Range inputs (only show when enabled) */}
      {parameter.enabled && (
        <div className="flex items-center gap-2">
          <div>
            <label className="text-xs text-muted-foreground block">Min</label>
            <Input
              type="number"
              className="w-16 h-8 text-xs"
              value={parameter.min}
              onChange={(e) => onUpdate({ min: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block">Max</label>
            <Input
              type="number"
              className="w-16 h-8 text-xs"
              value={parameter.max}
              onChange={(e) => onUpdate({ max: Number(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block">Step</label>
            <Input
              type="number"
              className="w-16 h-8 text-xs"
              value={parameter.step}
              min={1}
              onChange={(e) => onUpdate({ step: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
