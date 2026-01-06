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
  useTickerSearch,
  useTickerDatabase,
  useTickerRegistry,
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
  const downloadManager = useDataDownloadManager(activeTab);
  const syncProgress = useSyncProgress(downloadManager.syncSchedule);
  const tiingoKey = useTiingoKeyManagement();
  const syncSettings = useSyncSettings();
  const tickerRegistry = useTickerRegistry();

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
        <Button onClick={() => downloadManager.startYFinanceDownload(false)} disabled={isRunning} className="h-12">
          {currentJob?.source === 'yfinance' ? 'yFinance Running' : 'yFinance Download'}
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
            <div className="mt-3 space-y-2">
              <div className="text-sm text-muted-foreground">
                Registry: {tickerRegistry.missing.registryTotal.toLocaleString()} tickers |
                Parquet: {tickerRegistry.missing.parquetTotal.toLocaleString()} files |
                Missing: {tickerRegistry.missing.count.toLocaleString()}
              </div>
              <Button
                onClick={() => downloadManager.startYFinanceDownload(true)}
                disabled={isRunning}
                variant="default"
              >
                Download Missing ({tickerRegistry.missing.count.toLocaleString()})
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
  const tickerSearch = useTickerSearch();
  const tickerDb = useTickerDatabase();

  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Ticker Search</h3>
        <div className="relative">
          <Input
            placeholder="Search by ticker or name..."
            value={tickerSearch.searchQuery}
            onChange={(e) => tickerSearch.setSearchQuery(e.target.value)}
            onFocus={() => tickerSearch.searchResults.length > 0 && tickerSearch.setSearchOpen(true)}
            onBlur={() => setTimeout(() => tickerSearch.setSearchOpen(false), 200)}
          />
          {tickerSearch.searchOpen && tickerSearch.searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
              {tickerSearch.searchResults.map((result) => (
                <div
                  key={result.ticker}
                  className="p-3 hover:bg-secondary cursor-pointer border-b last:border-b-0"
                  onClick={() => {
                    tickerDb.setSelected(result.ticker);
                    tickerSearch.setSearchQuery('');
                    tickerSearch.setSearchOpen(false);
                  }}
                >
                  <div className="font-semibold">{result.ticker}</div>
                  {result.name && <div className="text-sm text-muted-foreground">{result.name}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Selected Ticker</h3>
            <p className="text-2xl font-mono font-bold mt-1">{tickerDb.selected || 'None'}</p>
          </div>
          <Button onClick={tickerDb.loadPreview} disabled={!tickerDb.selected || tickerDb.loading}>
            {tickerDb.loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {tickerDb.preview.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary sticky top-0">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-right">Open</th>
                  <th className="p-2 text-right">High</th>
                  <th className="p-2 text-right">Low</th>
                  <th className="p-2 text-right">Close</th>
                </tr>
              </thead>
              <tbody className="max-h-80 overflow-y-auto">
                {tickerDb.preview.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-secondary/50">
                    <td className="p-2">{row.Date}</td>
                    <td className="p-2 text-right font-mono">{row.Open?.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono">{row.High?.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono">{row.Low?.toFixed(2)}</td>
                    <td className="p-2 text-right font-mono">{row.Close?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : tickerDb.loading ? (
          <p className="text-center text-muted-foreground py-8">Loading...</p>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {tickerDb.selected ? 'No data available' : 'Select a ticker to view data'}
          </p>
        )}

        {tickerDb.error && (
          <p className="text-sm text-red-600 mt-4">{tickerDb.error}</p>
        )}
      </Card>
    </>
  );
}
