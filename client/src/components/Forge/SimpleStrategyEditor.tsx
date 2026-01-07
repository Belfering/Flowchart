/**
 * Simple Strategy Editor
 * Phase 2: Extracted from ForgeDashboard for mode separation
 * Handles single indicator with period/threshold ranges
 */

import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { ForgeConfig } from '@/types/forge';

interface SimpleStrategyEditorProps {
  config: ForgeConfig;
  updateConfig: (updates: Partial<ForgeConfig>) => void;
}

export function SimpleStrategyEditor({ config, updateConfig }: SimpleStrategyEditorProps) {
  return (
    <div className="space-y-4">
      {/* Configuration Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Indicator</h3>
          <Input
            value={config.indicator}
            onChange={(e) => updateConfig({ indicator: e.target.value })}
          />
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Tickers</h3>
          <Input
            value={config.tickers.join(',')}
            onChange={(e) =>
              updateConfig({
                tickers: e.target.value.split(',').map((t) => t.trim()),
              })
            }
          />
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Comparator</h3>
          <select
            value={config.comparator}
            onChange={(e) => updateConfig({ comparator: e.target.value as any })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="LT">LT (Less Than)</option>
            <option value="GT">GT (Greater Than)</option>
            <option value="BOTH">Both (LT + GT)</option>
          </select>
        </Card>
      </div>

      {/* Periods and Thresholds */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Periods (Min - Max)</h3>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={config.periodMin}
              onChange={(e) => updateConfig({ periodMin: +e.target.value })}
            />
            <Input
              type="number"
              placeholder="Max"
              value={config.periodMax}
              onChange={(e) => updateConfig({ periodMax: +e.target.value })}
            />
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Thresholds (Min - Max)</h3>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={config.thresholdMin}
              onChange={(e) => updateConfig({ thresholdMin: +e.target.value })}
            />
            <Input
              type="number"
              placeholder="Max"
              value={config.thresholdMax}
              onChange={(e) => updateConfig({ thresholdMax: +e.target.value })}
            />
          </div>
        </Card>
      </div>

      {/* Pass/Fail Criteria */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Pass/Fail Criteria</h3>
        <div className="grid grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Min TIM %</label>
            <Input
              type="number"
              value={config.minTIM}
              onChange={(e) => updateConfig({ minTIM: +e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Min TIMAR</label>
            <Input
              type="number"
              value={config.minTIMAR}
              onChange={(e) => updateConfig({ minTIMAR: +e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Max DD %</label>
            <Input
              type="number"
              value={config.maxDD}
              onChange={(e) => updateConfig({ maxDD: +e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Min Trades</label>
            <Input
              type="number"
              value={config.minTrades}
              onChange={(e) => updateConfig({ minTrades: +e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Min TIMAR/DD</label>
            <Input
              type="number"
              step="0.1"
              value={config.minTIMARDD}
              onChange={(e) => updateConfig({ minTIMARDD: +e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* L2 Conditions */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="l2"
            checked={config.useL2}
            onChange={(e) => updateConfig({ useL2: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="l2" className="font-semibold cursor-pointer">
            Enable L2 Conditions (Multi-conditional branches)
          </label>
        </div>
      </Card>

      {/* IS/OOS Data Split */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">In-Sample / Out-of-Sample Data Split</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="split-even-odd-month"
              name="splitStrategy"
              checked={config.splitStrategy === 'even_odd_month'}
              onChange={() => updateConfig({ splitStrategy: 'even_odd_month', oosStartDate: undefined })}
              className="w-4 h-4"
            />
            <label htmlFor="split-even-odd-month" className="cursor-pointer text-sm">
              Even/Odd Month (50/50 split)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="split-even-odd-year"
              name="splitStrategy"
              checked={config.splitStrategy === 'even_odd_year'}
              onChange={() => updateConfig({ splitStrategy: 'even_odd_year', oosStartDate: undefined })}
              className="w-4 h-4"
            />
            <label htmlFor="split-even-odd-year" className="cursor-pointer text-sm">
              Even/Odd Year (50/50 split)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="radio"
              id="split-chronological"
              name="splitStrategy"
              checked={config.splitStrategy === 'chronological'}
              onChange={() => updateConfig({ splitStrategy: 'chronological' })}
              className="w-4 h-4"
            />
            <label htmlFor="split-chronological" className="cursor-pointer text-sm">
              Chronological (Date-based split)
            </label>
          </div>

          {config.splitStrategy === 'chronological' && (
            <div className="ml-6 mt-2">
              <label className="text-xs text-muted-foreground block mb-1">
                Out-of-Sample Start Date (YYYY-MM-DD)
              </label>
              <Input
                type="date"
                value={config.oosStartDate || ''}
                onChange={(e) => updateConfig({ oosStartDate: e.target.value })}
                className="w-full"
                placeholder="2020-01-01"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Data before this date = In-Sample, on or after = Out-of-Sample
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
