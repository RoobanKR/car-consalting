'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, GitCompare, X } from 'lucide-react';
import { Car } from '@/lib/api';
import { useCarsByIds } from '@/lib/queries';
import { useCompare } from '@/lib/compare';

export default function CompareBar() {
  const router = useRouter();
  const { compareIds, ready, remove, clear, max } = useCompare();

  // Clearing empties the bar and it disappears, which leaves you nowhere — send you
  // back to the catalog so there is something to pick from.
  function clearAndBrowse() { clear(); router.push('/cars'); }
  const { data: cars = [] } = useCarsByIds(compareIds, ready);

  if (!ready || compareIds.length === 0) return null;
  const selected = compareIds.map(id => cars.find(car => car._id === id) || { _id: id, brand: 'Loading', model: '', year: 0, images: [] } as unknown as Car);
  return <div className="compare-bar" role="region" aria-label="Cars to compare">
    <div className="container compare-bar-inner">
      <div className="compare-bar-meta"><GitCompare size={17}/><strong>{compareIds.length}/{max} cars to compare</strong></div>
      <div className="compare-bar-cars">
        {selected.map(car => <div key={car._id} className="compare-bar-chip" title={`${car.brand} ${car.model}`}>
          <span className="compare-bar-thumb">{car.images?.[0]?.url ? <img src={car.images[0].url} alt=""/> : <GitCompare size={14}/>}</span>
          <span className="compare-bar-label"><strong>{car.brand} {car.model}</strong><small>{car.year || '—'}</small></span>
          <button type="button" onClick={() => remove(car._id)} aria-label={`Remove ${car.brand} ${car.model} from compare`}><X size={13}/></button>
        </div>)}
      </div>
      <div className="compare-bar-actions">
        <button type="button" className="compare-bar-clear" onClick={clearAndBrowse}>Clear</button>
        <Link href="/compare" className="compare-bar-cta">{compareIds.length === 1 ? 'View selection' : 'Compare now'} <ArrowRight size={16}/></Link>
      </div>
    </div>
  </div>;
}
