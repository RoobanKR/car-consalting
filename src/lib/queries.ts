'use client';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api, type Car } from './api';

export const CARS_PER_PAGE = 15;

export type CarPage = { items: Car[]; total: number; page: number; limit: number; hasMore: boolean };
export type Counted = { value: string; count: number };
export type CarFacets = {
  brands: Counted[]; models: Counted[]; bodyTypes: Counted[]; fuelTypes: Counted[];
  transmissions: Counted[]; locations: Counted[]; years: Counted[];
  priceCeiling: number; total: number;
};

export type CarFilters = {
  search?: string;
  brand?: string[];
  model?: string[];
  fuelType?: string[];
  transmission?: string[];
  bodyType?: string[];
  location?: string[];
  year?: string[];
  minPrice?: number;
  maxPrice?: number | null;
  maxKm?: string;
  sort?: string;
};

function toSearchParams(filters: CarFilters, page: number) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(CARS_PER_PAGE));
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  for (const key of ['brand', 'model', 'fuelType', 'transmission', 'bodyType', 'location', 'year'] as const) {
    const value = filters[key];
    if (value?.length) params.set(key, value.join(','));
  }
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
  if (filters.maxKm) params.set('maxKm', filters.maxKm);
  if (filters.sort) params.set('sort', filters.sort);
  return params;
}

/** The catalog list: 15 cars per request, filtered and sorted in the database.
 *  React Query keeps each filter combination cached, so going back to a previous
 *  set of filters is instant instead of refetching. */
export function useCarsInfinite(filters: CarFilters) {
  return useInfiniteQuery<CarPage>({
    queryKey: ['cars', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api<CarPage>(`/cars?${toSearchParams(filters, pageParam as number)}`),
    getNextPageParam: last => (last.hasMore ? last.page + 1 : undefined),
    placeholderData: previous => previous
  });
}

/** Sidebar option lists and counts. Covers the whole inventory, not just the loaded
 *  page, and changes rarely — hence the long stale time. */
export function useCarFacets(brands: string[] = []) {
  const key = [...brands].sort().join(',');
  return useQuery<CarFacets>({
    queryKey: ['car-facets', key],
    queryFn: () => api<CarFacets>(`/cars/facets${key ? `?brand=${encodeURIComponent(key)}` : ''}`),
    staleTime: 5 * 60_000
  });
}

/** Resolves saved favourite / compare ids straight from the database, so a car that
 *  is not on the first page still shows up. */
export function useCarsByIds(ids: string[], enabled = true) {
  const key = ids.join(',');
  return useQuery<Car[]>({
    queryKey: ['cars-by-ids', key],
    queryFn: () => api<Car[]>(`/cars/by-ids?ids=${encodeURIComponent(key)}`),
    enabled: enabled && ids.length > 0
  });
}
