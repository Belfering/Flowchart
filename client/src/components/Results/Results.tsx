import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useJobsManagement, useResultsData, useResultsExport } from '@/hooks';
import { formatDateTime, formatDuration } from '@/lib/utils';

export default function Results() {
  const { jobs, selectedJobId, setSelectedJobId, loading: jobsLoading } =
    useJobsManagement();
  const { results, loading: resultsLoading, sortBy, order } = useResultsData(selectedJobId);
  const { exportCSV, exporting } = useResultsExport();

  // Get selected job for timestamp display
  const selectedJob = jobs.find((job) => job.id === selectedJobId);

  const handleExport = async () => {
    if (selectedJobId) {
      try {
        await exportCSV(selectedJobId);
      } catch (error) {
        console.error('Export failed:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Results</h2>
      </div>

      <Card className="p-6">
        {/* Job Selector */}
        <div className="flex gap-2 mb-4 items-center">
          <label className="font-semibold">Job:</label>
          <select
            value={selectedJobId || ''}
            onChange={(e) => setSelectedJobId(e.target.value ? +e.target.value : null)}
            className="border rounded px-3 py-2 flex-1"
            disabled={jobsLoading}
          >
            <option value="">Select a job...</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                Job #{job.id} - {job.status} - {job.passingBranches || 0} passing branches -{' '}
                {new Date(job.createdAt).toLocaleString()}
              </option>
            ))}
          </select>
          <Button
            onClick={handleExport}
            variant="outline"
            disabled={!selectedJobId || results.length === 0 || exporting}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>

        {/* Job Timestamps */}
        {selectedJob && (
          <div className="mb-4 px-4 py-3 bg-muted/50 rounded-md text-sm space-y-1">
            <div className="flex gap-2">
              <span className="font-semibold text-muted-foreground">Run started:</span>
              <span>{formatDateTime(selectedJob.startedAt)}</span>
            </div>
            {selectedJob.completedAt && (
              <>
                <div className="flex gap-2">
                  <span className="font-semibold text-muted-foreground">Completed:</span>
                  <span>{formatDateTime(selectedJob.completedAt)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold text-muted-foreground">Duration:</span>
                  <span>{formatDuration(selectedJob.startedAt, selectedJob.completedAt)}</span>
                </div>
              </>
            )}
            {!selectedJob.completedAt && selectedJob.status === 'running' && (
              <div className="flex gap-2">
                <span className="font-semibold text-muted-foreground">Duration:</span>
                <span>In progress</span>
              </div>
            )}
          </div>
        )}

        {/* Results Table */}
        {resultsLoading ? (
          <p className="text-center py-8">Loading results...</p>
        ) : results.length > 0 ? (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              Showing {results.length} passing branches sorted by {sortBy} ({order})
            </p>
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
                  {results.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-secondary/50">
                      <td className="p-2">{r.signalTicker}</td>
                      <td className="p-2">{r.indicator}</td>
                      <td className="p-2 text-right">{r.period}</td>
                      <td className="p-2 text-center">{r.comparator}</td>
                      <td className="p-2 text-right">{r.threshold}</td>
                      <td className="p-2 text-right font-medium text-green-600">
                        {r.isTimar?.toFixed(1)}
                      </td>
                      <td className="p-2 text-right text-red-600">
                        {r.isMaxdd?.toFixed(1)}%
                      </td>
                      <td className="p-2 text-right">{r.isTrades}</td>
                      <td className="p-2 text-right font-medium">
                        {r.oosTimar?.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            {selectedJobId
              ? 'No passing branches found for this job.'
              : 'Select a job to view results.'}
          </p>
        )}
      </Card>
    </div>
  );
}
