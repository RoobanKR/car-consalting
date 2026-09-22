'use client';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, CalendarDays, CarFront, Check, ChevronDown, ChevronLeft, ChevronRight, MapPin, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CarCard from '@/components/CarCard';
import { api, Car, money } from '@/lib/api';

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
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(Number(params.get('pageSize')) || 15);

  useEffect(() => { api<Car[]>('/cars').then(setCars).catch(error => setError(error.message)).finally(() => setLoading(false)); }, []);

  const brands = useMemo(() => [...new Set(cars.map(car => car.brand))].sort(), [cars]);
  const models = useMemo(() => [...new Set(cars.filter(car => brand.length === 0 || brand.includes(car.brand)).map(car => car.model))].sort(), [cars, brand]);
  const bodyTypes = useMemo(() => [...new Set(cars.map(car => car.bodyType).filter(Boolean))].sort(), [cars]);
  const locationList = useMemo(() => [...new Set(cars.map(car => car.location))].sort(), [cars]);
  const yearList = useMemo(() => [...new Set(cars.map(car => car.year))].sort((a, b) => b - a), [cars]);
  const priceCeiling = useMemo(() => Math.max(1000000, Math.ceil(Math.max(...cars.map(car => car.price), 1000000) / 1000000) * 1000000), [cars]);
  const priceStep = 50000;
  const effectiveMax = maxPrice ?? priceCeiling;
  const locationOptions = useMemo(() => locationList.map(city => ({ value: city, label: city, count: cars.filter(car => car.location === city).length })), [locationList, cars]);
  const yearOptions = useMemo(() => yearList.map(year => ({ value: String(year), label: String(year), count: cars.filter(car => car.year === year).length })), [yearList, cars]);

  const filtered = useMemo(() => cars.filter(car => {
    const query = search.trim().toLowerCase();
    return (!query || `${car.brand} ${car.model} ${car.location}`.toLowerCase().includes(query))
      && (brand.length === 0 || brand.includes(car.brand))
      && (model.length === 0 || model.includes(car.model))
      && (fuel.length === 0 || fuel.includes(car.fuelType))
      && (transmission.length === 0 || transmission.includes(car.transmission))
      && (bodyType.length === 0 || bodyType.includes(car.bodyType))
      && (location.length === 0 || location.includes(car.location))
      && (yearFilter.length === 0 || yearFilter.includes(String(car.year)))
      && car.price >= minPrice && car.price <= effectiveMax
      && (!maxKm || car.kmDriven <= Number(maxKm));
  }).sort((a, b) => sort === 'price-asc' ? a.price - b.price : sort === 'price-desc' ? b.price - a.price : sort === 'year-desc' ? b.year - a.year : new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
  [cars, search, brand, model, fuel, transmission, bodyType, location, yearFilter, minPrice, effectiveMax, maxKm, sort]);

  const activeCount = (search ? 1 : 0)
    + brand.length + model.length + fuel.length + transmission.length + bodyType.length + location.length + yearFilter.length
    + (minPrice > 0 ? 1 : 0) + (maxPrice !== null && maxPrice < priceCeiling ? 1 : 0)
    + (maxKm ? 1 : 0);

  useEffect(() => { setPage(1); }, [search, brand, model, fuel, transmission, bodyType, location, yearFilter, minPrice, maxPrice, maxKm, sort, pageSize]);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const resultsRef = useRef<HTMLElement>(null);
  const firstScrollSkip = useRef(true);
  useEffect(() => {
    if (firstScrollSkip.current) { firstScrollSkip.current = false; return; }
    const target = resultsRef.current;
    if (!target) return;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const top = target.getBoundingClientRect().top + window.scrollY - 16;
      const dest = Math.max(0, top);
      try { window.scrollTo({ top: dest, behavior: 'smooth' }); }
      catch { window.scrollTo(0, dest); }
    }));
  }, [currentPage]);
  const paginated = filtered.slice(pageStart, pageStart + pageSize);
  const pageNumbers: (number | 'gap')[] = totalPages <= 7
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : (() => {
        const set = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
        const sorted = [...set].filter(n => n >= 1 && n <= totalPages).sort((a, b) => a - b);
        const output: (number | 'gap')[] = [];
        sorted.forEach((n, index) => { if (index > 0 && n - sorted[index - 1] > 1) output.push('gap'); output.push(n); });
        return output;
      })();

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
    <div className="container catalog-breadcrumb"><span>Home</span><span>/</span><strong>Used cars</strong></div>
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
          <div className="catalog-choice-list">{brands.length ? brands.map(item => <label key={item} className="catalog-check"><input type="checkbox" checked={brand.includes(item)} onChange={() => { setBrand(current => toggleValue(current, item)); setModel([]); }}/><span>{item}</span><small>{cars.filter(car => car.brand === item).length}</small></label>) : <p className="catalog-filter-empty">Brands appear when cars are added.</p>}</div>
          {brand.length > 0 && models.length > 0 && <div className="catalog-submodel"><span className="catalog-submodel-label">Models</span><div className="catalog-choice-list">{models.map(item => <label key={item} className="catalog-check"><input type="checkbox" checked={model.includes(item)} onChange={() => setModel(current => toggleValue(current, item))}/><span>{item}</span><small>{cars.filter(car => car.model === item).length}</small></label>)}</div></div>}
        </div>
        <div className="catalog-filter-section"><h3>Body type</h3><div className="catalog-pill-grid">{bodyTypes.length ? bodyTypes.map(item => <button key={item} className={bodyType.includes(item) ? 'active' : ''} onClick={() => setBodyType(current => toggleValue(current, item))}>{item}</button>) : <p className="catalog-filter-empty">No body types yet.</p>}</div></div>
        <div className="catalog-filter-section"><h3>Fuel type</h3><div className="catalog-choice-list">{fuelOptions.map(item => <label key={item} className="catalog-check"><input type="checkbox" checked={fuel.includes(item)} onChange={() => setFuel(current => toggleValue(current, item))}/><span>{item}</span><small>{cars.filter(car => car.fuelType === item).length}</small></label>)}</div></div>
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
        <button className="catalog-mobile-done" onClick={() => setShowFilters(false)}>Show {filtered.length} cars <ArrowRight size={17}/></button>
      </aside>
      <section className="catalog-results" ref={resultsRef}>
        <div className="catalog-search"><Search size={20}/><input value={search} onChange={event => setSearch(event.target.value)} aria-label="Search cars" placeholder="Search cars by brand, model or location"/>{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X size={17}/></button>}</div>
        <div className="catalog-benefits"><div><span className="benefit-icon purple"><CarFront size={21}/></span><strong>Explore available cars</strong><small>Browse price, photos &amp; details</small></div><div><span className="benefit-icon orange"><Search size={21}/></span><strong>Find your match</strong><small>Use filters to narrow the list</small></div><div><span className="benefit-icon blue"><Check size={21}/></span><strong>Enquire simply</strong><small>No booking or payment needed</small></div></div>
        <div className="catalog-results-head"><div><span className="catalog-eyebrow">CARWISE COLLECTION</span><h1>Used cars in India</h1><p>{loading ? 'Loading available cars…' : `${filtered.length} ${filtered.length === 1 ? 'car' : 'cars'} found`}</p></div><div className="catalog-toolbar"><button className="catalog-mobile-filter" onClick={() => setShowFilters(true)}><SlidersHorizontal size={17}/> Filters {activeCount > 0 && `(${activeCount})`}</button><div className="catalog-sort"><button type="button" className="catalog-sort-trigger" aria-expanded={sortOpen} onClick={() => setSortOpen(!sortOpen)}><span>Sort by</span><strong>{sortLabels[sort]}</strong><ChevronDown size={16}/></button>{sortOpen && <div className="catalog-sort-menu" role="menu">{[["newest", "Newest first"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["year-desc", "Newest model year"]].map(([value, label]) => <button key={value} type="button" role="menuitemradio" aria-checked={sort === value} className={sort === value ? "selected" : ""} onClick={() => { setSort(value); setSortOpen(false); }}>{label}{sort === value && <Check size={15}/>}</button>)}</div>}</div></div></div>
        {activeChips.length > 0 && <div className="catalog-active-filters">{activeChips.map(chip => <button key={chip.key} onClick={chip.onRemove}>{chip.label} <X size={13}/></button>)}<button className="catalog-clear-chip" onClick={clear}><RotateCcw size={13}/> Clear all</button></div>}
        {error ? <div className="catalog-empty"><CarFront size={42}/><h2>Cars could not load</h2><p>{error}</p></div> : !loading && !filtered.length ? <div className="catalog-empty"><CarFront size={42}/><h2>{cars.length ? 'No cars match these filters' : 'Cars are coming soon'}</h2><p>{cars.length ? 'Try changing a filter to see more available cars.' : 'Our available cars will appear here as soon as the team adds them.'}</p>{cars.length > 0 && <button onClick={clear}>Clear filters <ArrowRight size={17}/></button>}</div> : <>
          <div className="catalog-card-grid">{paginated.map(car => <CarCard key={car._id} car={car}/>)}</div>
          {total > 0 && <div className="catalog-pagination">
            <div className="catalog-pagination-meta"><span>Showing</span><strong>{pageStart + 1}–{Math.min(pageStart + pageSize, total)}</strong><span>of {total} {total === 1 ? 'car' : 'cars'}</span></div>
            <div className="catalog-pagination-controls">
              <CustomSelect ariaLabel="Cars per page" options={[15, 40, 70, 100].map(n => ({ value: String(n), label: `${n} per page` }))} value={String(pageSize)} onChange={value => setPageSize(Number(value))}/>
              {totalPages > 1 && <div className="catalog-pagination-nav" role="navigation" aria-label="Pagination">
                <button type="button" onClick={() => setPage(current => Math.max(1, current - 1))} disabled={currentPage === 1} aria-label="Previous page"><ChevronLeft size={16}/></button>
                {pageNumbers.map((entry, index) => entry === 'gap' ? <span key={`gap-${index}`} className="catalog-pagination-gap">…</span> : <button key={entry} type="button" onClick={() => setPage(entry)} aria-current={entry === currentPage ? 'page' : undefined} className={entry === currentPage ? 'active' : ''}>{entry}</button>)}
                <button type="button" onClick={() => setPage(current => Math.min(totalPages, current + 1))} disabled={currentPage === totalPages} aria-label="Next page"><ChevronRight size={16}/></button>
              </div>}
            </div>
          </div>}
        </>}
      </section>
    </div>
  </main><SiteFooter/></>;
}

export default function CarsPage() { return <Suspense fallback={<div className="catalog-page"><div className="container catalog-empty">Loading cars…</div></div>}><CarsContent/></Suspense>; }
