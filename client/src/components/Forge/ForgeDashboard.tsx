import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function ForgeDashboard() {
  const [config, setConfig] = useState({ indicator: 'RSI', periodMin: 10, periodMax: 14, tickers: ['SPY'], comparator: 'LT', thresholdMin: 20, thresholdMax: 40, thresholdStep: 1, minTIM: 5, minTIMAR: 30, maxDD: 20, minTrades: 50, minTIMARDD: 4, splitStrategy: 'even_odd_month', numWorkers: 4 });
  const [estimate, setEstimate] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => { updateEstimate(); }, [config]);
  useEffect(() => {
    if (jobId) {
      const es = api.forge.createEventSource(jobId);
      es.onmessage = (e) => {
        const d = JSON.parse(e.data);
        setStatus(d);
        if (['completed', 'failed', 'cancelled'].includes(d.status)) {
          setRunning(false); es.close();
        }
      };
      return () => es.close();
    }
  }, [jobId]);

  const updateEstimate = async () => {
    try { const e = await api.forge.estimate(config); setEstimate(e); } catch(err){}
  };
  const handleStart = async () => {
    setRunning(true);
    try { const r = await api.forge.start(config); setJobId(r.jobId); } catch(e) { setRunning(false); }
  };
  const handleCancel = async () => {
    if (jobId) { await api.forge.cancel(jobId); setRunning(false); }
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Forge Dashboard</h2></div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Indicator</h3>
          <Input value={config.indicator} onChange={(e)=>setConfig({...config, indicator:e.target.value})} />
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Tickers</h3>
          <Input value={config.tickers.join(',')} onChange={(e)=>setConfig({...config, tickers:e.target.value.split(',').map(t=>t.trim())})} />
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Periods</h3>
          <div className="flex gap-2">
            <Input type="number" value={config.periodMin} onChange={(e)=>setConfig({...config,periodMin:+e.target.value})} />
            <Input type="number" value={config.periodMax} onChange={(e)=>setConfig({...config,periodMax:+e.target.value})} />
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Thresholds</h3>
          <div className="flex gap-2">
            <Input type="number" value={config.thresholdMin} onChange={(e)=>setConfig({...config,thresholdMin:+e.target.value})} />
            <Input type="number" value={config.thresholdMax} onChange={(e)=>setConfig({...config,thresholdMax:+e.target.value})} />
          </div>
        </Card>
      </div>
      <Card className="p-6">
        {estimate && <p className="mb-4">Est: {estimate.totalBranches} branches ≈ {estimate.estimatedMinutes} min</p>}
        {status && <p className="mb-4 text-blue-600">Progress: {status.completedBranches}/{status.totalBranches} | Passing: {status.passingBranches}</p>}
        <div className="flex gap-2">
          <Button onClick={handleStart} disabled={running} className="flex-1">{running ? 'Running...' : 'Start Forge'}</Button>
          {running && <Button onClick={handleCancel} variant="destructive">Cancel</Button>}
        </div>
      </Card>
    </div>
  );
}
