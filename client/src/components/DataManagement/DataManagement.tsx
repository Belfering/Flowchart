import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useDataDownloadManager,
  useSyncProgress,
  useTiingoKeyManagement,
  useSyncSettings,
  useTickerRegistry,
  useDownloadQueue,
  useMissingMetadata,
  useTickerDatabaseTable,
} from '@/hooks';

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState('downloads');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Management</h2>
        <p className="text-muted-foreground">Download and manage market data from yfinance and Tiingo.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="downloads">Data Downloads</TabsTrigger>
          <TabsTrigger value="database">Ticker Database</TabsTrigger>
        </TabsList>

        <TabsContent value="downloads" className="space-y-6 mt-6">
          <DataDownloadsPanel activeTab={activeTab} />
        </TabsContent>

        <TabsContent value="database" className="space-y-6 mt-6">
          <TickerDatabasePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Data Downloads Panel (Tab 1) - Refactored to use custom hooks
function DataDownloadsPanel({ activeTab }: { activeTab: string }) {
  const [fillGaps, setFillGaps] = useState(false);

  const downloadManager = useDataDownloadManager(activeTab);
  const syncProgress = useSyncProgress(downloadManager.syncSchedule);
  const tiingoKey = useTiingoKeyManagement();
  const syncSettings = useSyncSettings();
  const tickerRegistry = useTickerRegistry();
  const downloadQueue = useDownloadQueue(fillGaps);
  const missingMetadata = useMissingMetadata();

  const currentJob = downloadManager.syncSchedule?.status?.currentJob;
  const isRunning = downloadManager.syncSchedule?.status?.isRunning;

  return (
    <>
      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Parquet Files</p>
          <p className="text-3xl font-bold">{downloadManager.parquetTickers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Available for queries</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-2">Last Sync</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs font-semibold">yFinance</p>
              <p className="text-sm">
                {downloadManager.syncSchedule?.lastSync?.yfinance?.date || 'Never'}
                {downloadManager.syncSchedule?.lastSync?.yfinance?.status && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    downloadManager.syncSchedule.lastSync.yfinance.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {downloadManager.syncSchedule.lastSync.yfinance.status}
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold">Tiingo</p>
              <p className="text-sm">
                {downloadManager.syncSchedule?.lastSync?.tiingo?.date || 'Never'}
                {downloadManager.syncSchedule?.lastSync?.tiingo?.status && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    downloadManager.syncSchedule.lastSync.tiingo.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {downloadManager.syncSchedule.lastSync.tiingo.status}
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Status</p>
          <p className="text-lg font-semibold">
            {isRunning ? 'Download Running' : 'Idle'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Active tickers: {downloadManager.parquetTickers.length}
          </p>
        </Card>
      </div>

      {/* Current Job Status */}
      {isRunning && currentJob && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-semibold">
                Download In Progress
              </h3>
            </div>
            <Button onClick={downloadManager.stopDownload} variant="destructive">
              Stop
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-sm font-semibold">{currentJob.syncedCount} / {currentJob.tickerCount}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Elapsed</p>
              <p className="text-sm font-semibold">
                {syncProgress.elapsed >= 60
                  ? `${Math.floor(syncProgress.elapsed / 60)}m ${syncProgress.elapsed % 60}s`
                  : `${syncProgress.elapsed}s`}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rate</p>
              <p className="text-sm font-semibold">{syncProgress.rate} per/sec</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress: {syncProgress.progress}%</span>
              <span>ETA: {syncProgress.eta >= 60
                ? `${Math.floor(syncProgress.eta / 60)}m ${syncProgress.eta % 60}s`
                : `${syncProgress.eta}s`}</span>
            </div>
            <div className="w-full bg-white rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${syncProgress.progress}%` }}></div>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-3">
        <Button onClick={() => downloadManager.startYFinanceDownload(fillGaps)} disabled={isRunning} className="h-12">
          {currentJob?.source === 'yfinance' ? 'yFinance Running' : fillGaps ? 'yFinance Fill Gaps' : 'yFinance Download'}
        </Button>
        <Button onClick={downloadManager.startTiingoDownload} disabled={isRunning || !tiingoKey.hasKey} className="h-12">
          {currentJob?.source === 'tiingo' ? 'Tiingo Running' : 'Tiingo Download'}
        </Button>
        <Button onClick={downloadManager.loadAllData} variant="outline" className="h-12">
          Refresh Stats
        </Button>
        <Button onClick={syncSettings.updateSettings} variant="outline" className="h-12" disabled={!syncSettings.hasChanges}>
          Save Settings
        </Button>
      </div>

      {/* Configuration Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Download Settings</h3>
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={fillGaps}
              onChange={(e) => setFillGaps(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Fill Gaps Mode</span>
            <span className="text-xs text-muted-foreground">(Download only missing tickers)</span>
          </label>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Batch Size</label>
            <Input
              type="number"
              min="1"
              max="500"
              value={syncSettings.batchSize}
              onChange={(e) => syncSettings.setBatchSize(+e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Tickers per batch (1-500)</p>
          </div>
          <div>
            <label className="text-sm font-medium">yFinance Pause (seconds)</label>
            <Input
              type="number"
              min="0"
              max="60"
              step="0.5"
              value={syncSettings.yfinancePause}
              onChange={(e) => syncSettings.setYfinancePause(+e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Delay between batches</p>
          </div>
          <div>
            <label className="text-sm font-medium">Tiingo Pause (seconds)</label>
            <Input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={syncSettings.tiingoPause}
              onChange={(e) => syncSettings.setTiingoPause(+e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">Delay between API calls</p>
          </div>
        </div>
      </Card>

      {/* Ticker Registry Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Ticker Registry</h3>
          <Button
            onClick={tickerRegistry.syncRegistry}
            disabled={tickerRegistry.syncing || isRunning}
            variant="outline"
          >
            {tickerRegistry.syncing ? 'Syncing Tiingo...' : 'Sync Tiingo Registry'}
          </Button>
        </div>

        {tickerRegistry.stats ? (
          <div className="grid grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Tickers</p>
              <p className="text-2xl font-bold">{tickerRegistry.stats.total.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{tickerRegistry.stats.active.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Stocks</p>
              <p className="text-2xl font-bold">{tickerRegistry.stats.stocks.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">ETFs</p>
              <p className="text-2xl font-bold">{tickerRegistry.stats.etfs.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Last Sync</p>
              <p className="text-sm font-semibold">
                {tickerRegistry.stats.lastSync
                  ? new Date(tickerRegistry.stats.lastSync).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">No registry data. Click "Sync Tiingo Registry" to download the master ticker list.</p>
        )}

        {tickerRegistry.missing && tickerRegistry.missing.count > 0 && (
          <details className="border-t pt-4 mt-4">
            <summary className={`cursor-pointer font-medium ${tickerRegistry.missing.count > 0 ? 'text-orange-600' : ''}`}>
              Missing Tickers ({tickerRegistry.missing.count.toLocaleString()})
            </summary>
            <div className="mt-3 space-y-3">
              <div className="text-sm text-muted-foreground">
                Registry: {tickerRegistry.missing.registryTotal.toLocaleString()} tickers |
                Parquet: {tickerRegistry.missing.parquetTotal.toLocaleString()} files |
                Missing: {tickerRegistry.missing.count.toLocaleString()}
              </div>

              {/* Missing Tickers Table */}
              <div className="border rounded-lg overflow-hidden bg-muted/30">
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold">Ticker</th>
                        <th className="text-left px-3 py-2 font-semibold">Name</th>
                        <th className="text-left px-3 py-2 font-semibold">Asset Type</th>
                        <th className="text-left px-3 py-2 font-semibold">Exchange</th>
                        <th className="text-left px-3 py-2 font-semibold">Start Date</th>
                        <th className="text-left px-3 py-2 font-semibold">End Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickerRegistry.missing.missing.slice(0, 100).map((ticker) => (
                        <tr key={ticker.ticker} className="border-t border-muted hover:bg-muted/50">
                          <td className="px-3 py-2 font-mono font-semibold">{ticker.ticker}</td>
                          <td className="px-3 py-2 text-muted-foreground">{ticker.name || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground">{ticker.assetType || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{ticker.exchange || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{ticker.startDate || '—'}</td>
                          <td className="px-3 py-2 text-muted-foreground text-xs">{ticker.endDate || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {tickerRegistry.missing.count > 100 && (
                  <div className="px-3 py-2 bg-muted/70 text-xs text-muted-foreground text-center border-t">
                    Showing first 100 of {tickerRegistry.missing.count.toLocaleString()} missing tickers
                  </div>
                )}
              </div>

              <Button
                onClick={() => downloadManager.startYFinanceDownload(true)}
                disabled={isRunning}
                variant="default"
                className="w-full"
              >
                Download All Missing ({tickerRegistry.missing.count.toLocaleString()})
              </Button>
            </div>
          </details>
        )}

        {tickerRegistry.missing && tickerRegistry.missing.count === 0 && (
          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-green-600 font-medium">✓ All registry tickers have been downloaded</p>
          </div>
        )}
      </Card>

      {/* Download Queue */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Download Queue {fillGaps ? '(Fill Gaps Mode)' : '(Full Download)'}
          </h3>
          <Button
            onClick={downloadQueue.refresh}
            disabled={downloadQueue.loading || isRunning}
            variant="outline"
            size="sm"
          >
            {downloadQueue.loading ? 'Loading...' : 'Refresh Queue'}
          </Button>
        </div>

        {downloadQueue.error ? (
          <p className="text-sm text-red-600">Error: {downloadQueue.error}</p>
        ) : downloadQueue.loading ? (
          <p className="text-sm text-muted-foreground">Loading queue...</p>
        ) : (
          <>
            <div className="mb-3">
              <p className="text-sm text-muted-foreground">
                {downloadQueue.queuedTickers.length.toLocaleString()} tickers will be downloaded
              </p>
            </div>
            {downloadQueue.queuedTickers.length > 0 && (
              <details className="border-t pt-4">
                <summary className="cursor-pointer font-medium text-sm mb-2">
                  View Queue ({downloadQueue.queuedTickers.length.toLocaleString()} tickers)
                </summary>
                <div className="mt-2 max-h-60 overflow-auto border rounded p-3 bg-muted/30">
                  <div className="grid grid-cols-1 gap-1">
                    {downloadQueue.queuedTickers.slice(0, 50).map((ticker) => (
                      <div key={ticker.ticker} className="text-xs flex justify-between py-1 border-b border-muted">
                        <span className="font-mono font-semibold">{ticker.ticker}</span>
                        <span className="text-muted-foreground">{ticker.name || 'No name'}</span>
                        <span className="text-muted-foreground text-[10px]">{ticker.assetType || ''}</span>
                      </div>
                    ))}
                    {downloadQueue.queuedTickers.length > 50 && (
                      <p className="text-xs text-muted-foreground italic mt-2">
                        ... and {(downloadQueue.queuedTickers.length - 50).toLocaleString()} more
                      </p>
                    )}
                  </div>
                </div>
              </details>
            )}
          </>
        )}
      </Card>

      {/* Missing Metadata */}
      {missingMetadata.missingMetadata.length > 0 && (
        <Card className="p-6 border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-orange-600">
              Missing Metadata ({missingMetadata.missingMetadata.length})
            </h3>
            <Button
              onClick={missingMetadata.enrichAll}
              disabled={missingMetadata.enriching || !tiingoKey.hasKey}
              variant="default"
              size="sm"
            >
              {missingMetadata.enriching ? 'Enriching...' : 'Enrich All from Tiingo'}
            </Button>
          </div>

          {!tiingoKey.hasKey && (
            <p className="text-sm text-orange-600 mb-3">⚠️ Tiingo API key required for enrichment</p>
          )}

          {missingMetadata.enrichError && (
            <p className="text-sm text-red-600 mb-3">Error: {missingMetadata.enrichError}</p>
          )}

          <p className="text-sm text-muted-foreground mb-3">
            These tickers are missing name or description metadata
          </p>

          <details>
            <summary className="cursor-pointer font-medium text-sm mb-2">
              View Tickers ({missingMetadata.missingMetadata.length})
            </summary>
            <div className="mt-2 max-h-60 overflow-auto border rounded p-3 bg-orange-50">
              <div className="grid grid-cols-1 gap-1">
                {missingMetadata.missingMetadata.slice(0, 30).map((ticker) => (
                  <div key={ticker.ticker} className="text-xs flex justify-between py-1 border-b border-orange-100">
                    <span className="font-mono font-semibold">{ticker.ticker}</span>
                    <span className="text-muted-foreground">{ticker.name || '(no name)'}</span>
                    <span className="text-muted-foreground text-[10px]">{ticker.assetType || ''}</span>
                  </div>
                ))}
                {missingMetadata.missingMetadata.length > 30 && (
                  <p className="text-xs text-muted-foreground italic mt-2">
                    ... and {missingMetadata.missingMetadata.length - 30} more
                  </p>
                )}
              </div>
            </div>
          </details>
        </Card>
      )}

      {/* Tiingo API Key */}
      <details className="group">
        <summary className="cursor-pointer p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
          <span className="font-semibold">Tiingo API Key</span>
          <span className="ml-2 text-sm text-muted-foreground">
            {tiingoKey.hasKey ? '✓ Configured' : '✗ Not configured'}
          </span>
        </summary>
        <Card className="p-6 mt-2">
          <div className="space-y-4">
            {!tiingoKey.hasKey ? (
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter Tiingo API key"
                  value={tiingoKey.tiingoKey}
                  onChange={(e) => tiingoKey.setTiingoKey(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={tiingoKey.saveTiingoKey} disabled={!tiingoKey.tiingoKey.trim() || tiingoKey.loading}>
                  {tiingoKey.loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-green-600 mb-2">✓ API key is configured</p>
                <Button onClick={tiingoKey.removeTiingoKey} variant="destructive" size="sm">
                  Remove Key
                </Button>
              </div>
            )}
            {tiingoKey.error && (
              <p className="text-sm text-red-600">{tiingoKey.error}</p>
            )}
          </div>
        </Card>
      </details>

      {/* Available Tickers */}
      <details className="group">
        <summary className="cursor-pointer p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
          <span className="font-semibold">Available Tickers ({downloadManager.parquetTickers.length})</span>
        </summary>
        <Card className="p-6 mt-2">
          {downloadManager.parquetTickers.length > 0 ? (
            <div className="text-sm font-mono max-h-40 overflow-y-auto">
              {downloadManager.parquetTickers.join(', ')}
            </div>
          ) : (
            <p className="text-muted-foreground">No data downloaded yet</p>
          )}
        </Card>
      </details>
    </>
  );
}

// Ticker Database Panel (Tab 2) - Refactored to use custom hooks
function TickerDatabasePanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const databaseTable = useTickerDatabaseTable();

  // Filter tickers based on search and active status
  const filteredTickers = databaseTable.tickers.filter(ticker => {
    const matchesSearch = !searchQuery ||
      ticker.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticker.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesActive = !showActiveOnly || ticker.isActive;

    return matchesSearch && matchesActive;
  });

  // Format last synced date
  const formatLastSynced = (isoDate: string | null) => {
    if (!isoDate) return '—';
    try {
      return new Date(isoDate).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Tickers in Registry</p>
          <p className="text-3xl font-bold">{databaseTable.total}</p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Tickers with Data</p>
          <p className="text-3xl font-bold">{databaseTable.withData}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {((databaseTable.withData / databaseTable.total) * 100).toFixed(1)}% coverage
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Filtered Results</p>
          <p className="text-3xl font-bold">{filteredTickers.length}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by ticker or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Active only</span>
          </label>
          <Button onClick={databaseTable.refresh} disabled={databaseTable.loading}>
            {databaseTable.loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </Card>

      {/* Ticker Database Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Ticker Database ({filteredTickers.length} of {databaseTable.total})
        </h3>

        {databaseTable.loading ? (
          <p className="text-center text-muted-foreground py-8">Loading ticker database...</p>
        ) : databaseTable.error ? (
          <p className="text-center text-red-600 py-8">{databaseTable.error}</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Ticker</th>
                    <th className="text-left px-3 py-2 font-semibold">Name</th>
                    <th className="text-left px-3 py-2 font-semibold">Asset Type</th>
                    <th className="text-left px-3 py-2 font-semibold">Exchange</th>
                    <th className="text-center px-3 py-2 font-semibold">Active</th>
                    <th className="text-left px-3 py-2 font-semibold">Last Synced</th>
                    <th className="text-left px-3 py-2 font-semibold">Start Date</th>
                    <th className="text-left px-3 py-2 font-semibold">End Date</th>
                    <th className="text-left px-3 py-2 font-semibold">Currency</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickers.map((ticker) => (
                    <tr key={ticker.ticker} className="border-t border-muted hover:bg-muted/50">
                      <td className="px-3 py-2 font-mono font-semibold">{ticker.ticker}</td>
                      <td className="px-3 py-2 text-muted-foreground">{ticker.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{ticker.assetType}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{ticker.exchange}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${ticker.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{formatLastSynced(ticker.lastSynced)}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{ticker.startDate}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{ticker.endDate}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">{ticker.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!databaseTable.loading && filteredTickers.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No tickers match your search criteria
          </p>
        )}
      </Card>
    </>
  );
}
