'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Heart, RotateCcw } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CarCard from '@/components/CarCard';
import { api, Car } from '@/lib/api';
import { useFavorites } from '@/lib/favorites';

export default function FavoritesPage() {
  const { favorites, ready, clear } = useFavorites();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { api<Car[]>('/cars').then(setCars).catch(caught => setError(caught.message)).finally(() => setLoading(false)); }, []);

  const savedCars = favorites.map(id => cars.find(car => car._id === id)).filter((car): car is Car => Boolean(car));
  const missing = favorites.length - savedCars.length;
  const busy = loading || !ready;

  return <><SiteHeader/><main className="catalog-page">
    <div className="container catalog-breadcrumb"><span>Home</span><span>/</span><strong>Favorites</strong></div>
    <div className="container favorites-page">
      <div className="favorites-head">
        <div>
          <span className="catalog-eyebrow">YOUR SHORTLIST</span>
          <h1>Your favorite cars <Heart size={26} strokeWidth={2.4} fill={favorites.length > 0 ? 'currentColor' : 'none'}/></h1>
          <p>{busy ? 'Loading your favorites…' : `${savedCars.length} ${savedCars.length === 1 ? 'car' : 'cars'} saved${missing > 0 ? ` · ${missing} no longer available` : ''}`}</p>
        </div>
        {ready && favorites.length > 0 && <button type="button" className="favorites-clear" onClick={clear}><RotateCcw size={14}/> Clear all favorites</button>}
      </div>
      <p className="favorites-note">Your favorites are stored on this device only, so they stay private and work offline. Clearing your browser data will remove them.</p>
      {error ? <div className="catalog-empty"><Heart size={38}/><h2>Favorites could not load</h2><p>{error}</p></div>
        : !busy && favorites.length === 0 ? <div className="catalog-empty"><Heart size={38}/><h2>No favorites yet</h2><p>Tap the heart on any car to save it here for later.</p><Link href="/cars" className="favorites-cta">Browse cars <ArrowRight size={17}/></Link></div>
        : !busy && savedCars.length === 0 ? <div className="catalog-empty"><Heart size={38}/><h2>These cars are no longer available</h2><p>Every car you saved has been removed or hidden.</p><button type="button" onClick={clear}>Clear saved list <RotateCcw size={16}/></button></div>
        : <div className="catalog-card-grid">{savedCars.map(car => <CarCard key={car._id} car={car}/>)}</div>}
    </div>
  </main><SiteFooter/></>;
}
