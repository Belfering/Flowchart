import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useEffect } from 'react';
import {
  useForgeConfig,
  useForgeEstimate,
  useForgeJob,
  useForgeStream,
  useProgressMetrics,
} from '@/hooks';

export default function ForgeDashboard() {
  const { config, updateConfig, isValid } = useForgeConfig();
  const { estimate } = useForgeEstimate(config);
  const { jobId, running, startTime, startJob, cancelJob, completeJob } = useForgeJob();
  const { status, debugLog } = useForgeStream(jobId);
  const progress = useProgressMetrics(status, startTime);

  // Mark job as complete when status shows completed/failed/cancelled
  useEffect(() => {
    if (status && running && (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled')) {
      completeJob();
    }
  }, [status, running, completeJob]);

  const handleStart = async () => {
    try {
      await startJob(config);
    } catch (error) {
      console.error('Failed to start job:', error);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelJob();
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Forge Dashboard</h2>
      </div>

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

      {/* Progress and Controls */}
      <Card className="p-6">
        {/* Estimate */}
        {estimate && !running && (
          <div className="mb-4 p-3 bg-secondary rounded">
            <p className="font-semibold">
              Estimate: {estimate.totalBranches.toLocaleString()} branches ≈{' '}
              {estimate.estimatedMinutes} min
            </p>
          </div>
        )}

        {/* Progress Bar */}
        {status && running && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-semibold">Progress: {progress.progress}%</span>
              <span className="text-muted-foreground">
                {status.completedBranches.toLocaleString()} /{' '}
                {status.totalBranches.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-sm mt-3">
              <div className="p-2 bg-green-50 rounded">
                <p className="text-xs text-muted-foreground">Passing</p>
                <p className="font-bold text-green-700">
                  {status.passingBranches.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-xs text-muted-foreground">Speed</p>
                <p className="font-bold text-blue-700">{progress.speed} br/sec</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="text-xs text-muted-foreground">Elapsed</p>
                <p className="font-bold">
                  {Math.floor(progress.elapsed / 60)}:
                  {(progress.elapsed % 60).toString().padStart(2, '0')}
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded">
                <p className="text-xs text-muted-foreground">ETA</p>
                <p className="font-bold text-purple-700">
                  {Math.floor(progress.eta / 60)}:
                  {(progress.eta % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex gap-3">
          {!running ? (
            <Button
              onClick={handleStart}
              className="flex-1 h-12 text-lg font-semibold"
              disabled={!isValid}
            >
              Start Forge
            </Button>
          ) : (
            <>
              <Button
                disabled
                className="flex-1 h-12 text-lg opacity-50 cursor-not-allowed"
              >
                Running...
              </Button>
              <Button
                onClick={handleCancel}
                variant="destructive"
                className="h-12 px-8 text-lg font-semibold"
              >
                Stop Run
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Debug Log */}
      {debugLog.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Debug Log (Last {debugLog.length} entries)</h3>
          <div className="bg-black text-green-400 font-mono text-xs p-3 rounded h-64 overflow-y-auto">
            {debugLog.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
