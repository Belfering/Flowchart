/**
 * API client for Atlas Forge
 */

const API_BASE = '/api';

export const api = {
  // Data Management
  data: {
    async download(ticker: string, startDate?: string, endDate?: string) {
      const res = await fetch(`${API_BASE}/data/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, startDate, endDate }),
      });
      return res.json();
    },

    async getDownloads() {
      const res = await fetch(`${API_BASE}/data/downloads`);
      return res.json();
    },

    async getTickers() {
      const res = await fetch(`${API_BASE}/data/tickers`);
      return res.json();
    },

    async getTickerLists() {
      const res = await fetch(`${API_BASE}/data/ticker-lists`);
      return res.json();
    },

    async createTickerList(name: string, type: 'etf' | 'stock' | 'mixed', tickers: string[]) {
      const res = await fetch(`${API_BASE}/data/ticker-lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, tickers }),
      });
      return res.json();
    },

    // Sync/batch download methods
    async getSyncStatus() {
      const res = await fetch(`${API_BASE}/data/sync-status`);
      return res.json();
    },

    async startYFinanceDownload(fillGaps: boolean = false) {
      const res = await fetch(`${API_BASE}/data/sync/yfinance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fillGaps }),
      });
      return res.json();
    },

    async startTiingoDownload() {
      const res = await fetch(`${API_BASE}/data/sync/tiingo`, {
        method: 'POST',
      });
      return res.json();
    },

    async stopDownload() {
      const res = await fetch(`${API_BASE}/data/sync/stop`, {
        method: 'POST',
      });
      return res.json();
    },

    async updateSyncSettings(settings: { batchSize: number; yfinancePause: number; tiingoPause: number }) {
      const res = await fetch(`${API_BASE}/data/sync-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      return res.json();
    },

    // Tiingo API key methods
    async getTiingoKeyStatus() {
      const res = await fetch(`${API_BASE}/data/tiingo-key`);
      return res.json();
    },

    async saveTiingoKey(key: string) {
      const res = await fetch(`${API_BASE}/data/tiingo-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      return res.json();
    },

    async removeTiingoKey() {
      const res = await fetch(`${API_BASE}/data/tiingo-key`, {
        method: 'DELETE',
      });
      return res.json();
    },

    // Ticker database methods
    async searchTickers(query: string) {
      const res = await fetch(`${API_BASE}/data/search?q=${encodeURIComponent(query)}&limit=10`);
      return res.json();
    },

    async getTickerPreview(ticker: string) {
      const res = await fetch(`${API_BASE}/data/preview/${ticker}?limit=50`);
      return res.json();
    },

    // Ticker registry methods
    async syncRegistry() {
      const res = await fetch(`${API_BASE}/data/registry/sync`, {
        method: 'POST',
      });
      return res.json();
    },

    async getRegistryStats() {
      const res = await fetch(`${API_BASE}/data/registry/stats`);
      return res.json();
    },

    async searchRegistry(query: string) {
      const res = await fetch(`${API_BASE}/data/registry/search?q=${encodeURIComponent(query)}`);
      return res.json();
    },

    async getRegistryTickers() {
      const res = await fetch(`${API_BASE}/data/registry/tickers`);
      return res.json();
    },

    async getMissingTickers() {
      const res = await fetch(`${API_BASE}/data/registry/missing`);
      return res.json();
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
      return res.json();
    },

    async cancel(jobId: number) {
      const res = await fetch(`${API_BASE}/forge/cancel/${jobId}`, {
        method: 'POST',
      });
      return res.json();
    },

    async getStatus(jobId: number) {
      const res = await fetch(`${API_BASE}/forge/status/${jobId}`);
      return res.json();
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
      return res.json();
    },

    async getConfigs() {
      const res = await fetch(`${API_BASE}/forge/configs`);
      return res.json();
    },

    async saveConfig(name: string, config: any) {
      const res = await fetch(`${API_BASE}/forge/configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config }),
      });
      return res.json();
    },
  },

  // Results
  results: {
    async getJobs() {
      const res = await fetch(`${API_BASE}/results/jobs`);
      return res.json();
    },

    async getResults(jobId: number, sortBy?: string, order?: 'asc' | 'desc', limit?: number) {
      const params = new URLSearchParams();
      if (sortBy) params.append('sortBy', sortBy);
      if (order) params.append('order', order);
      if (limit) params.append('limit', limit.toString());

      const res = await fetch(`${API_BASE}/results/${jobId}?${params}`);
      return res.json();
    },

    async downloadCSV(jobId: number) {
      const res = await fetch(`${API_BASE}/results/${jobId}/csv`);
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
      return res.text();
    },
  },
};
