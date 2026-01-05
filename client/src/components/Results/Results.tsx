import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function Results() {
  const [jobId, setJobId] = useState<number>(1);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadResults = async () => {
    setLoading(true);
    try {
      const data = await api.results.getResults(jobId, 'is_timar', 'desc', 100);
      setResults(Array.isArray(data) ? data : []);
    } catch(e) { console.error(e); setResults([]); }
    setLoading(false);
  };

  const handleExport = () => {
    api.results.downloadCSV(jobId);
  };

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Results</h2></div>
      <Card className="p-6">
        <div className="flex gap-2 mb-4">
          <input type="number" value={jobId} onChange={(e)=>setJobId(+e.target.value)} className="border rounded px-2" placeholder="Job ID" />
          <Button onClick={loadResults}>Load Results</Button>
          <Button onClick={handleExport} variant="outline">Export CSV</Button>
        </div>
        {loading ? <p>Loading...</p> : (
          results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    <th className="p-2 text-left">Ticker</th>
                    <th className="p-2 text-left">Indicator</th>
                    <th className="p-2 text-right">Period</th>
                    <th className="p-2 text-center">Comp</th>
                    <th className="p-2 text-right">Threshold</th>
                    <th className="p-2 text-right">IS TIMAR</th>
                    <th className="p-2 text-right">IS MaxDD</th>
                    <th className="p-2 text-right">IS Trades</th>
                    <th className="p-2 text-right">OOS TIMAR</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r,i)=>(
                    <tr key={i} className="border-b hover:bg-secondary/50">
                      <td className="p-2">{r.signalTicker}</td>
                      <td className="p-2">{r.indicator}</td>
                      <td className="p-2 text-right">{r.period}</td>
                      <td className="p-2 text-center">{r.comparator}</td>
                      <td className="p-2 text-right">{r.threshold}</td>
                      <td className="p-2 text-right font-medium text-green-600">{r.isTimar?.toFixed(1)}</td>
                      <td className="p-2 text-right text-red-600">{r.isMaxdd?.toFixed(1)}%</td>
                      <td className="p-2 text-right">{r.isTrades}</td>
                      <td className="p-2 text-right font-medium">{r.oosTimar?.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-muted-foreground">No results. Run Forge first.</p>
        )}
      </Card>
    </div>
  );
}
