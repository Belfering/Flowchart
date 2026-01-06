/**
 * useTickerSearch Hook
 *
 * Manages debounced ticker search with autocomplete functionality.
 * Provides search query state, results, and loading indicators.
 *
 * @example
 * ```tsx
 * const { searchQuery, setSearchQuery, searchResults, searchOpen, setSearchOpen, loading } = useTickerSearch();
 * ```
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { TickerSearchResult } from '@/types';

export interface UseTickerSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: TickerSearchResult[];
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  loading: boolean;
}

/**
 * Hook for ticker search with debouncing
 *
 * Features:
 * - Debounced API calls (200ms delay)
 * - Automatic clearing of results when query is empty
 * - Loading state management
 * - Dropdown visibility control
 */
export function useTickerSearch(): UseTickerSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TickerSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debounced search effect
  useEffect(() => {
    // Clear results if query is empty
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      setLoading(false);
      return;
    }

    // Start loading indicator
    setLoading(true);

    // Debounce the API call (200ms)
    const timeout = setTimeout(async () => {
      try {
        const results = await api.data.searchTickers(searchQuery);
        setSearchResults(Array.isArray(results) ? results : []);
        setSearchOpen(true);
      } catch (error) {
        console.error('Ticker search error:', error);
        setSearchResults([]);
        setSearchOpen(false);
      } finally {
        setLoading(false);
      }
    }, 200);

    // Cleanup timeout on query change
    return () => {
      clearTimeout(timeout);
      setLoading(false);
    };
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchOpen,
    setSearchOpen,
    loading,
  };
}
