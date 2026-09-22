'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CalendarDays, CarFront, Check, ChevronDown, MapPin, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CarCard from '@/components/CarCard';
import { money } from '@/lib/api';
import { useCarsInfinite, useCarFacets, CARS_PER_PAGE, type CarFilters } from '@/lib/queries';

const sortLabels: Record<string, string> = { newest: 'Newest first', 'price-asc': 'Price: low to high', 'price-desc': 'Price: high to low', 'year-desc': 'Newest model year' };
const kmOptions: { value: string; label: string }[] = [
  { value: '', label: 'Any distance' },
  { value: '25000', label: 'Under 25,000 km' },
  { value: '50000', label: 'Under 50,000 km' },
  { value: '100000', label: 'Under 1,00,000 km' }
];
const parseList = (value: string | null): string[] => value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];
const toggleValue = <T,>(list: T[], value: T): T[] => list.includes(value) ? list.filter(item => item !== value) : [...list, value];

function CustomSelect({ options, value, onChange, ariaLabel, icon }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; ariaLabel: string; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDocClick(event: MouseEvent) { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') setOpen(false); }
    if (open) { document.addEventListener('mousedown', onDocClick); document.addEventListener('keydown', onKey); }
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const selected = options.find(option => option.value === value) || options[0];
  return <div ref={ref} className={open ? 'catalog-select open' : 'catalog-select'}>
    <button type="button" className="catalog-select-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen(!open)}>
      {icon}<span>{selected?.label}</span><ChevronDown size={15}/>
    </button>
    {open && <div className="catalog-select-menu" role="listbox">
      {options.map(option => <button key={option.value} type="button" role="option" aria-selected={option.value === value} className={option.value === value ? 'selected' : ''} onClick={() => { onChange(option.value); setOpen(false); }}>
        <span>{option.label}</span>{option.value === value && <Check size={14}/>}
      </button>)}
    </div>}
  </div>;
}

function MultiSelect({ options, value, onChange, placeholder, ariaLabel, icon, searchable }: { options: { value: string; label: string; count?: number }[]; value: string[]; onChange: (v: string[]) => void; placeholder: string; ariaLabel: string; icon?: React.ReactNode; searchable?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDocClick(event: MouseEvent) { if (ref.current && !ref.current.contains(event.target as Node)) { setOpen(false); setQuery(''); } }
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') { setOpen(false); setQuery(''); } }
    if (open) { document.addEventListener('mousedown', onDocClick); document.addEventListener('keydown', onKey); }
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey); };
  }, [open]);
  const shown = query ? options.filter(option => option.label.toLowerCase().includes(query.trim().toLowerCase())) : options;
  const label = value.length === 0 ? placeholder : value.length === 1 ? (options.find(option => option.value === value[0])?.label || value[0]) : `${value.length} selected`;
  return <div ref={ref} className={open ? 'catalog-multi open' : 'catalog-multi'}>
    <button type="button" className="catalog-multi-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel} onClick={() => setOpen(!open)}>
      {icon}<span className={value.length ? 'has-value' : ''}>{label}</span>
      {value.length > 0 && <span className="catalog-multi-badge">{value.length}</span>}
      <ChevronDown size={15}/>
    </button>
    {open && <div className="catalog-multi-menu" role="listbox" aria-multiselectable="true">
      {searchable && <div className="catalog-multi-search"><Search size={14}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search…" autoFocus aria-label="Filter options"/>{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={13}/></button>}</div>}
      <div className="catalog-multi-list">{shown.length ? shown.map(option => <label key={option.value} className="catalog-multi-option"><input type="checkbox" checked={value.includes(option.value)} onChange={() => onChange(toggleValue(value, option.value))}/><span>{option.label}</span>{typeof option.count === 'number' && <small>{option.count}</small>}</label>) : <p className="catalog-multi-empty">No matches.</p>}</div>
      {value.length > 0 && <div className="catalog-multi-foot"><button type="button" onClick={() => onChange([])}>Clear selection</button><span>{value.length} selected</span></div>}
    </div>}
  </div>;
}

function CarsContent() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [brand, setBrand] = useState<string[]>(parseList(params.get('brand')));
  const [model, setModel] = useState<string[]>(parseList(params.get('model')));
  const [fuel, setFuel] = useState<string[]>(parseList(params.get('fuel')));
  const [transmission, setTransmission] = useState<string[]>(parseList(params.get('transmission')));
  const [bodyType, setBodyType] = useState<string[]>(parseList(params.get('body')));
  const [location, setLocation] = useState<string[]>(parseList(params.get('location')));
  const [yearFilter, setYearFilter] = useState<string[]>(parseList(params.get('year')));
  const [minPrice, setMinPrice] = useState<number>(Number(params.get('minPrice')) || 0);
  const [maxPrice, setMaxPrice] = useState<number | null>(params.get('maxPrice') ? Number(params.get('maxPrice')) : null);
  const [maxKm, setMaxKm] = useState('');
  const [sort, setSort] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Filters live in the query key, so every combination is cached separately and
  // going back to a previous set of filters renders from cache instead of refetching.
  const filters = useMemo<CarFilters>(() => ({
    search, brand, model, fuelType: fuel, transmission, bodyType, location,
    year: yearFilter, minPrice, maxPrice, maxKm, sort
  }), [search, brand, model, fuel, transmission, bodyType, location, yearFilter, minPrice, maxPrice, maxKm, sort]);

  const carsQuery = useCarsInfinite(filters);
  const { data: facets } = useCarFacets(brand);
  const cars = useMemo(() => carsQuery.data?.pages.flatMap(entry => entry.items) ?? [], [carsQuery.data]);
  const total = carsQuery.data?.pages[0]?.total ?? 0;
  const loading = carsQuery.isLoading;
  const error = carsQuery.error instanceof Error ? carsQuery.error.message : '';
  const inventoryTotal = facets?.total ?? 0;

  const brands = facets?.brands ?? [];
  const models = facets?.models ?? [];
  const bodyTypes = facets?.bodyTypes ?? [];
  const fuelCounts = useMemo(() => new Map((facets?.fuelTypes ?? []).map(item => [item.value, item.count])), [facets]);
  const priceCeiling = facets?.priceCeiling ?? 3000000;
  const priceStep = 50000;
  const effectiveMax = maxPrice ?? priceCeiling;
  const locationOptions = useMemo(() => (facets?.locations ?? []).map(item => ({ value: item.value, label: item.value, count: item.count })), [facets]);
  const yearOptions = useMemo(() => (facets?.years ?? []).map(item => ({ value: item.value, label: item.value, count: item.count })), [facets]);

  const activeCount = (search ? 1 : 0)
    + brand.length + model.length + fuel.length + transmission.length + bodyType.length + location.length + yearFilter.length
    + (minPrice > 0 ? 1 : 0) + (maxPrice !== null && maxPrice < priceCeiling ? 1 : 0)
    + (maxKm ? 1 : 0);

  const resultsRef = useRef<HTMLElement>(null);

  const clear = () => {
    setSearch(''); setBrand([]); setModel([]); setFuel([]); setTransmission([]); setBodyType([]); setLocation([]); setYearFilter([]);
    setMinPrice(0); setMaxPrice(null); setMaxKm(''); setSort('newest');
  };
  const fuelOptions = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
  const transmissionOptions = ['Manual', 'Automatic'];

  const handleMinPrice = (raw: number) => {
    const upper = (maxPrice ?? priceCeiling) - priceStep;
    setMinPrice(Math.max(0, Math.min(raw, upper)));
  };
  const handleMaxPrice = (raw: number) => {
    if (raw >= priceCeiling) { setMaxPrice(null); return; }
    setMaxPrice(Math.max(minPrice + priceStep, raw));
  };
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...(search ? [{ key: 'search', label: `“${search}”`, onRemove: () => setSearch('') }] : []),
    ...brand.map(value => ({ key: `brand-${value}`, label: value, onRemove: () => { setBrand(current => current.filter(item => item !== value)); setModel([]); } })),
    ...model.map(value => ({ key: `model-${value}`, label: value, onRemove: () => setModel(current => current.filter(item => item !== value)) })),
    ...fuel.map(value => ({ key: `fuel-${value}`, label: value, onRemove: () => setFuel(current => current.filter(item => item !== value)) })),
    ...transmission.map(value => ({ key: `transmission-${value}`, label: value, onRemove: () => setTransmission(current => current.filter(item => item !== value)) })),
    ...bodyType.map(value => ({ key: `body-${value}`, label: value, onRemove: () => setBodyType(current => current.filter(item => item !== value)) })),
    ...location.map(value => ({ key: `location-${value}`, label: value, onRemove: () => setLocation(current => current.filter(item => item !== value)) })),
    ...yearFilter.map(value => ({ key: `year-${value}`, label: value, onRemove: () => setYearFilter(current => current.filter(item => item !== value)) })),
    ...(minPrice > 0 ? [{ key: 'minPrice', label: `From ${money(minPrice)}`, onRemove: () => setMinPrice(0) }] : []),
    ...(maxPrice !== null && maxPrice < priceCeiling ? [{ key: 'maxPrice', label: `Up to ${money(maxPrice)}`, onRemove: () => setMaxPrice(null) }] : []),
    ...(maxKm ? [{ key: 'maxKm', label: `Under ${Number(maxKm).toLocaleString('en-IN')} km`, onRemove: () => setMaxKm('') }] : [])
  ];

  return <><SiteHeader/><main className="catalog-page">
    <nav className="container catalog-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><strong aria-current="page">Used cars</strong></nav>
    <div className="container catalog-layout">
      <aside className={showFilters ? 'catalog-sidebar open' : 'catalog-sidebar'} aria-label="Car filters">
        <div className="catalog-filter-head"><div><SlidersHorizontal size={19}/><strong>Filters</strong>{activeCount > 0 && <span>{activeCount}</span>}</div><div className="catalog-filter-actions"><button type="button" onClick={clear}>Clear all</button><button className="catalog-filter-close" type="button" aria-label="Close filters" onClick={() => setShowFilters(false)}><X size={19}/></button></div></div>
        <div className="catalog-filter-section">
          <h3>Budget</h3>
          <div className="budget-values"><strong>{money(minPrice)}</strong><strong>{maxPrice !== null ? money(maxPrice) : `${money(priceCeiling)}+`}</strong></div>
          <div className="dual-range" aria-label="Budget range">
            <div className="dual-range-track"/>
            <div className="dual-range-fill" style={{ left: `${(minPrice / priceCeiling) * 100}%`, right: `${100 - (effectiveMax / priceCeiling) * 100}%` }}/>
            <input aria-label="Minimum budget" type="range" min={0} max={priceCeiling} step={priceStep} value={minPrice} onChange={event => handleMinPrice(Number(event.target.value))}/>
            <input aria-label="Maximum budget" type="range" min={0} max={priceCeiling} step={priceStep} value={effectiveMax} onChange={event => handleMaxPrice(Number(event.target.value))}/>
          </div>
          <div className="budget-chips">{[500000, 1000000, 2000000].filter(value => value < priceCeiling).map(value => <button className={maxPrice === value ? 'selected' : ''} key={value} onClick={() => setMaxPrice(maxPrice === value ? null : value)}>Under {money(value)}</button>)}</div>
        </div>
        <div className="catalog-filter-section">
          <h3>Make &amp; model</h3>
          <label className="catalog-input"><Search size={17}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search brand or model"/></label>
          <div className="catalog-choice-list">{brands.length ? brands.map(item => <label key={item.value} className="catalog-check"><input type="checkbox" checked={brand.includes(item.value)} onChange={() => { setBrand(current => toggleValue(current, item.value)); setModel([]); }}/><span>{item.value}</span><small>{item.count}</small></label>) : <p className="catalog-filter-empty">Brands appear when cars are added.</p>}</div>
          {brand.length > 0 && models.length > 0 && <div className="catalog-submodel"><span className="catalog-submodel-label">Models</span><div className="catalog-choice-list">{models.map(item => <label key={item.value} className="catalog-check"><input type="checkbox" checked={model.includes(item.value)} onChange={() => setModel(current => toggleValue(current, item.value))}/><span>{item.value}</span><small>{item.count}</small></label>)}</div></div>}
        </div>
        <div className="catalog-filter-section"><h3>Body type</h3><div className="catalog-pill-grid">{bodyTypes.length ? bodyTypes.map(item => <button key={item.value} className={bodyType.includes(item.value) ? 'active' : ''} onClick={() => setBodyType(current => toggleValue(current, item.value))}>{item.value}</button>) : <p className="catalog-filter-empty">No body types yet.</p>}</div></div>
        <div className="catalog-filter-section"><h3>Fuel type</h3><div className="catalog-choice-list">{fuelOptions.map(item => <label key={item} className="catalog-check"><input type="checkbox" checked={fuel.includes(item)} onChange={() => setFuel(current => toggleValue(current, item))}/><span>{item}</span><small>{fuelCounts.get(item) ?? 0}</small></label>)}</div></div>
        <div className="catalog-filter-section"><h3>Transmission</h3><div className="catalog-pill-grid">{transmissionOptions.map(item => <button key={item} className={transmission.includes(item) ? 'active' : ''} onClick={() => setTransmission(current => toggleValue(current, item))}>{item}</button>)}</div></div>
        <div className="catalog-filter-section">
          <h3>Model year</h3>
          <MultiSelect options={yearOptions} value={yearFilter} onChange={setYearFilter} placeholder="Any year" ariaLabel="Model year" icon={<CalendarDays size={16}/>}/>
        </div>
        <div className="catalog-filter-section">
          <h3>Kilometres driven</h3>
          <CustomSelect ariaLabel="Kilometres driven" options={kmOptions} value={maxKm} onChange={setMaxKm}/>
        </div>
        <div className="catalog-filter-section">
          <h3>Location</h3>
          <MultiSelect options={locationOptions} value={location} onChange={setLocation} placeholder="All locations" ariaLabel="Location" icon={<MapPin size={16}/>} searchable/>
        </div>
        <button className="catalog-mobile-done" onClick={() => setShowFilters(false)}>Show {total} cars <ArrowRight size={17}/></button>
      </aside>
      <section className="catalog-results" ref={resultsRef}>
        <div className="catalog-search"><Search size={20}/><input value={search} onChange={event => setSearch(event.target.value)} aria-label="Search cars" placeholder="Search cars by brand, model or location"/>{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={17}/></button>}</div>
        <div className="catalog-benefits"><div><span className="benefit-icon purple"><CarFront size={21}/></span><strong>Explore available cars</strong><small>Browse price, photos &amp; details</small></div><div><span className="benefit-icon orange"><Search size={21}/></span><strong>Find your match</strong><small>Use filters to narrow the list</small></div><div><span className="benefit-icon blue"><Check size={21}/></span><strong>Enquire simply</strong><small>No booking or payment needed</small></div></div>
        <div className="catalog-results-head"><div><span className="catalog-eyebrow">CARWISE COLLECTION</span><h1>Used cars in India</h1><p>{loading ? 'Loading available cars…' : `${total} ${total === 1 ? 'car' : 'cars'} found`}</p></div><div className="catalog-toolbar"><button className="catalog-mobile-filter" onClick={() => setShowFilters(true)}><SlidersHorizontal size={17}/> Filters {activeCount > 0 && `(${activeCount})`}</button><div className="catalog-sort"><button type="button" className="catalog-sort-trigger" aria-expanded={sortOpen} onClick={() => setSortOpen(!sortOpen)}><span>Sort by</span><strong>{sortLabels[sort]}</strong><ChevronDown size={16}/></button>{sortOpen && <div className="catalog-sort-menu" role="menu">{[["newest", "Newest first"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["year-desc", "Newest model year"]].map(([value, label]) => <button key={value} type="button" role="menuitemradio" aria-checked={sort === value} className={sort === value ? "selected" : ""} onClick={() => { setSort(value); setSortOpen(false); }}>{label}{sort === value && <Check size={15}/>}</button>)}</div>}</div></div></div>
        {activeChips.length > 0 && <div className="catalog-active-filters">{activeChips.map(chip => <button key={chip.key} onClick={chip.onRemove}>{chip.label} <X size={13}/></button>)}<button className="catalog-clear-chip" onClick={clear}><RotateCcw size={13}/> Clear all</button></div>}
        {error ? <div className="catalog-empty"><CarFront size={42}/><h2>Cars could not load</h2><p>{error}</p></div> : loading ? <div className="catalog-card-grid">{Array.from({ length: 6 }, (_, index) => <div key={index} className="car-card-skeleton" aria-hidden="true"/>)}</div> : !cars.length ? <div className="catalog-empty"><CarFront size={42}/><h2>{inventoryTotal ? 'No cars match these filters' : 'Cars are coming soon'}</h2><p>{inventoryTotal ? 'Try changing a filter to see more available cars.' : 'Our available cars will appear here as soon as the team adds them.'}</p>{inventoryTotal > 0 && <button onClick={clear}>Clear filters <ArrowRight size={17}/></button>}</div> : <>
          <div className="catalog-card-grid">{cars.map(car => <CarCard key={car._id} car={car}/>)}</div>
          {carsQuery.isFetchingNextPage && <div className="catalog-card-grid catalog-card-grid-more">{Array.from({ length: 3 }, (_, index) => <div key={index} className="car-card-skeleton" aria-hidden="true"/>)}</div>}
          {total > 0 && <div className="catalog-loadmore">
            <p className="catalog-loadmore-meta">Showing <strong>{cars.length}</strong> of {total} {total === 1 ? 'car' : 'cars'}</p>
            <div className="catalog-loadmore-track" aria-hidden="true"><span style={{ width: `${total ? Math.min(100, (cars.length / total) * 100) : 0}%` }}/></div>
            {carsQuery.hasNextPage
              ? <button type="button" className="catalog-loadmore-button" onClick={() => carsQuery.fetchNextPage()} disabled={carsQuery.isFetchingNextPage}>{carsQuery.isFetchingNextPage ? 'Loading…' : `Load ${Math.min(CARS_PER_PAGE, total - cars.length)} more`} <ChevronDown size={16}/></button>
              : <p className="catalog-loadmore-end">You have seen every matching car.</p>}
          </div>}
        </>}
      </section>
    </div>
  </main><SiteFooter/></>;
}

export default function CarsPage() { return <Suspense fallback={<div className="catalog-page"><div className="container catalog-empty">Loading cars…</div></div>}><CarsContent/></Suspense>; }
