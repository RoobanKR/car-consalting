'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CalendarDays, CarFront, Check, Fuel, Gauge, GitCompare, MapPin, Settings2, X } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { api, Car, carHref, money } from '@/lib/api';
import { useCompare } from '@/lib/compare';

const SPECS: { key: string; label: string; icon: React.ReactNode; get: (car: Car) => string }[] = [
  { key: 'price', label: 'Asking price', icon: null, get: car => money(car.price) },
  { key: 'year', label: 'Model year', icon: <CalendarDays size={13}/>, get: car => String(car.year) },
  { key: 'kmDriven', label: 'Kilometres', icon: <Gauge size={13}/>, get: car => `${Number(car.kmDriven).toLocaleString('en-IN')} km` },
  { key: 'fuelType', label: 'Fuel type', icon: <Fuel size={13}/>, get: car => car.fuelType },
  { key: 'transmission', label: 'Transmission', icon: <Settings2 size={13}/>, get: car => car.transmission },
  { key: 'bodyType', label: 'Body type', icon: null, get: car => car.bodyType || '—' },
  { key: 'location', label: 'Location', icon: <MapPin size={13}/>, get: car => car.location },
  { key: 'views', label: 'Popularity', icon: null, get: car => `${(car.viewCount || 0).toLocaleString('en-IN')} views` }
];

export default function ComparePage() {
  const { compareIds, ready, remove, clear, max } = useCompare();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { api<Car[]>('/cars').then(setCars).catch(caught => setError(caught.message)).finally(() => setLoading(false)); }, []);

  const selected = compareIds.map(id => cars.find(car => car._id === id)).filter((car): car is Car => Boolean(car));
  const busy = loading || !ready;
  const featureUnion = Array.from(new Set(selected.flatMap(car => car.features || []))).sort();
  const cheapest = selected.length ? Math.min(...selected.map(car => car.price)) : 0;
  const newest = selected.length ? Math.max(...selected.map(car => car.year)) : 0;
  const leastDriven = selected.length ? Math.min(...selected.map(car => car.kmDriven)) : 0;

  return <><SiteHeader/><main className="catalog-page">
    <div className="container catalog-breadcrumb"><span>Home</span><span>/</span><strong>Compare</strong></div>
    <div className="container compare-page">
      <div className="compare-page-head">
        <div>
          <span className="catalog-eyebrow">SIDE-BY-SIDE</span>
          <h1>Compare cars <GitCompare size={26} strokeWidth={2.4}/></h1>
          <p>{busy ? 'Loading…' : `${selected.length} of ${max} cars selected${selected.length ? ' — best value highlighted in each row.' : ''}`}</p>
        </div>
        {ready && compareIds.length > 0 && <button type="button" className="favorites-clear" onClick={clear}><X size={14}/> Clear all</button>}
      </div>

      {error ? <div className="catalog-empty"><CarFront size={38}/><h2>Could not load cars</h2><p>{error}</p></div>
        : !busy && selected.length === 0 ? <div className="catalog-empty"><GitCompare size={38}/><h2>Nothing to compare yet</h2><p>Add up to {max} cars from the listings to see them side by side here.</p><Link href="/cars" className="favorites-cta">Browse cars <ArrowRight size={17}/></Link></div>
        : selected.length > 0 && <div className="compare-grid-wrap"><div className="compare-grid" style={{ gridTemplateColumns: `160px repeat(${selected.length}, minmax(220px, 1fr))` }}>
            <div className="compare-header-spec"/>
            {selected.map(car => <div key={car._id} className="compare-header-car">
              <button type="button" className="compare-header-remove" onClick={() => remove(car._id)} aria-label={`Remove ${car.brand} ${car.model}`}><X size={14}/></button>
              <div className="compare-header-photo">{car.images?.[0]?.url ? <img src={car.images[0].url} alt=""/> : <CarFront size={30}/>}</div>
              <strong>{car.year} {car.brand} {car.model}</strong>
              <small><MapPin size={12}/>{car.location}</small>
            </div>)}

            {SPECS.map(spec => <div key={spec.key} className="compare-row" style={{ gridColumn: `1 / span ${selected.length + 1}`, gridTemplateColumns: `160px repeat(${selected.length}, minmax(220px, 1fr))` }}>
              <div className="compare-row-label">{spec.icon}{spec.label}</div>
              {selected.map(car => {
                const value = spec.get(car);
                const highlight = (spec.key === 'price' && car.price === cheapest) || (spec.key === 'year' && car.year === newest) || (spec.key === 'kmDriven' && car.kmDriven === leastDriven);
                return <div key={car._id} className={highlight && selected.length > 1 ? 'compare-cell best' : 'compare-cell'}>{value}{highlight && selected.length > 1 && <span className="compare-best-badge">Best</span>}</div>;
              })}
            </div>)}

            {featureUnion.length > 0 && <div className="compare-row features-row" style={{ gridColumn: `1 / span ${selected.length + 1}`, gridTemplateColumns: `160px repeat(${selected.length}, minmax(220px, 1fr))` }}>
              <div className="compare-row-label"><Check size={13}/>Features</div>
              {selected.map(car => <div key={car._id} className="compare-cell compare-features"><ul>{featureUnion.map(feature => <li key={feature} className={car.features?.includes(feature) ? 'has' : 'miss'}><Check size={12}/>{feature}</li>)}</ul></div>)}
            </div>}

            <div className="compare-row actions-row" style={{ gridColumn: `1 / span ${selected.length + 1}`, gridTemplateColumns: `160px repeat(${selected.length}, minmax(220px, 1fr))` }}>
              <div className="compare-row-label"/>
              {selected.map(car => <div key={car._id} className="compare-cell"><Link href={carHref(car)} className="compare-view-link">View &amp; enquire <ArrowUpRight size={15}/></Link></div>)}
            </div>
          </div></div>
      }
    </div>
  </main><SiteFooter/></>;
}
