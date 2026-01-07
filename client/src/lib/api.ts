/**
 * API client for Atlas Forge
 */

const API_BASE = '/api';

// Helper function to handle API responses
async function handleResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      // Response body is not JSON or empty
    }
    throw new Error(errorMessage);
  }

  // Check if response has content
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

export const api = {
  // Data Management
  data: {
    async download(ticker: string, startDate?: string, endDate?: string) {
      const res = await fetch(`${API_BASE}/data/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, startDate, endDate }),
      });
      return handleResponse(res);
    },

    async getDownloads() {
      const res = await fetch(`${API_BASE}/data/downloads`);
      return handleResponse(res);
    },

    async getTickers() {
      const res = await fetch(`${API_BASE}/data/tickers`);
      return handleResponse(res);
    },

    async getTickerLists() {
      const res = await fetch(`${API_BASE}/data/ticker-lists`);
      return handleResponse(res);
    },

    async createTickerList(name: string, type: 'etf' | 'stock' | 'mixed', tickers: string[]) {
      const res = await fetch(`${API_BASE}/data/ticker-lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, tickers }),
      });
      return handleResponse(res);
    },

    // Sync/batch download methods
    async getSyncStatus() {
      const res = await fetch(`${API_BASE}/data/sync-status`);
      return handleResponse(res);
    },

    async startYFinanceDownload(fillGaps: boolean = false) {
      const res = await fetch(`${API_BASE}/data/sync/yfinance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fillGaps }),
      });
      return handleResponse(res);
    },

    async startTiingoDownload() {
      const res = await fetch(`${API_BASE}/data/sync/tiingo`, {
        method: 'POST',
      });
      return handleResponse(res);
    },

    async stopDownload() {
      const res = await fetch(`${API_BASE}/data/sync/stop`, {
        method: 'POST',
      });
      return handleResponse(res);
    },

    async updateSyncSettings(settings: { batchSize: number; yfinancePause: number; tiingoPause: number }) {
      const res = await fetch(`${API_BASE}/data/sync-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      return handleResponse(res);
    },

    // Tiingo API key methods
    async getTiingoKeyStatus() {
      const res = await fetch(`${API_BASE}/data/tiingo-key`);
      return handleResponse(res);
    },

    async saveTiingoKey(key: string) {
      const res = await fetch(`${API_BASE}/data/tiingo-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      return handleResponse(res);
    },

    async removeTiingoKey() {
      const res = await fetch(`${API_BASE}/data/tiingo-key`, {
        method: 'DELETE',
      });
      return handleResponse(res);
    },

    // Ticker database methods
    async searchTickers(query: string) {
      const res = await fetch(`${API_BASE}/data/search?q=${encodeURIComponent(query)}&limit=10`);
      return handleResponse(res);
    },

    async getTickerPreview(ticker: string) {
      const res = await fetch(`${API_BASE}/data/preview/${ticker}?limit=50`);
      return handleResponse(res);
    },

    // Ticker registry methods
    async syncRegistry() {
      const res = await fetch(`${API_BASE}/data/registry/sync`, {
        method: 'POST',
      });
      return handleResponse(res);
    },

    async getRegistryStats() {
      const res = await fetch(`${API_BASE}/data/registry/stats`);
      return handleResponse(res);
    },

    async searchRegistry(query: string) {
      const res = await fetch(`${API_BASE}/data/registry/search?q=${encodeURIComponent(query)}`);
      return handleResponse(res);
    },

    async getRegistryTickers() {
      const res = await fetch(`${API_BASE}/data/registry/tickers`);
      return handleResponse(res);
    },

    async getMissingTickers() {
      const res = await fetch(`${API_BASE}/data/registry/missing`);
      return handleResponse(res);
    },

    async getQueue(fillGaps: boolean = false) {
      const res = await fetch(`${API_BASE}/data/queue?fillGaps=${fillGaps}`);
      return handleResponse(res);
    },

    async getMissingMetadata() {
      const res = await fetch(`${API_BASE}/data/registry/missing-metadata`);
      return handleResponse(res);
    },

    async enrichMetadata(tickers: string[]) {
      const res = await fetch(`${API_BASE}/data/registry/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers }),
      });
      return handleResponse(res);
    },

    async getDatabase() {
      const res = await fetch(`${API_BASE}/data/database`);
      return handleResponse(res);
    },
  },

  // Forge
  forge: {
    async start(config: any) {
      const res = await fetch(`${API_BASE}/forge/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      return handleResponse(res);
    },

    async cancel(jobId: number) {
      const res = await fetch(`${API_BASE}/forge/cancel/${jobId}`, {
        method: 'POST',
      });
      return handleResponse(res);
    },

    async getStatus(jobId: number) {
      const res = await fetch(`${API_BASE}/forge/status/${jobId}`);
      return handleResponse(res);
    },

    createEventSource(jobId: number) {
      return new EventSource(`${API_BASE}/forge/stream/${jobId}`);
    },

    async estimate(config: any) {
      const res = await fetch(`${API_BASE}/forge/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      return handleResponse(res);
    },

    async getConfigs() {
      const res = await fetch(`${API_BASE}/forge/configs`);
      return handleResponse(res);
    },

    async saveConfig(name: string, config: any) {
      const res = await fetch(`${API_BASE}/forge/configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config }),
      });
      return handleResponse(res);
    },
  },

  // Results
  results: {
    async getJobs() {
      const res = await fetch(`${API_BASE}/results/jobs`);
      return handleResponse(res);
    },

    async getResults(jobId: number, sortBy?: string, order?: 'asc' | 'desc', limit?: number) {
      const params = new URLSearchParams();
      if (sortBy) params.append('sortBy', sortBy);
      if (order) params.append('order', order);
      if (limit) params.append('limit', limit.toString());

      const res = await fetch(`${API_BASE}/results/${jobId}?${params}`);
      return handleResponse(res);
    },

    async downloadCSV(jobId: number) {
      const res = await fetch(`${API_BASE}/results/${jobId}/csv`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `results_job${jobId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    },

    async exportCSV(jobId: number) {
      const res = await fetch(`${API_BASE}/results/${jobId}/csv`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.text();
    },
  },
};
