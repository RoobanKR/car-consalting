'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CarFront, Check, ChevronDown, Heart, MapPin, Menu, MessageCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api, Car } from '@/lib/api';
import { useFavorites } from '@/lib/favorites';

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const { favorites } = useFavorites();
  const [open, setOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const locRef = useRef<HTMLDivElement>(null);
  const isCars = pathname === '/cars' || pathname.startsWith('/cars/');
  const isHowItWorks = pathname === '/';
  const isContact = pathname === '/contact';
  const isFavorites = pathname === '/favorites';

  useEffect(() => {
    setLocation(new URLSearchParams(window.location.search).get('location') || '');
    api<Car[]>('/cars').then(cars => setLocations([...new Set(cars.map(car => car.location).filter(Boolean))].sort())).catch(() => {});
  }, []);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (locRef.current && !locRef.current.contains(event.target as Node)) setLocOpen(false);
    }
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') setLocOpen(false); }
    if (locOpen) {
      document.addEventListener('mousedown', onDocClick);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [locOpen]);

  function chooseLocation(value: string) {
    setLocation(value);
    setLocOpen(false);
    const target = new URL('/cars', window.location.origin);
    if (window.location.pathname === '/cars') target.search = window.location.search;
    if (value) target.searchParams.set('location', value);
    else target.searchParams.delete('location');
    window.location.assign(target.pathname + target.search);
  }

  return <header className="market-header">
    <div className="market-topline"><div className="container"><span>Find a car that fits your life</span><Link href="/contact">Questions? Get in touch <MessageCircle size={14}/></Link></div></div>
    <div className="container market-header-main">
      <Link href="/" className="market-logo" aria-label="Carwise home"><span className="market-logo-icon"><CarFront size={22} strokeWidth={2.6}/></span><span>carwise<span>.</span></span></Link>
      <div ref={locRef} className={locOpen ? 'market-location-wrap open' : 'market-location-wrap'}>
        <button type="button" className="market-location" aria-haspopup="listbox" aria-expanded={locOpen} onClick={() => setLocOpen(!locOpen)}>
          <MapPin size={17}/>
          <span><small>Browse across</small><strong>{location || 'All India'}</strong></span>
          <ChevronDown size={15}/>
        </button>
        {locOpen && <div className="market-location-menu" role="listbox" aria-label="Choose city">
          <button type="button" role="option" aria-selected={!location} className={!location ? 'selected' : ''} onClick={() => chooseLocation('')}>
            <span>All India</span>{!location && <Check size={14}/>}
          </button>
          {locations.map(city => <button key={city} type="button" role="option" aria-selected={location === city} className={location === city ? 'selected' : ''} onClick={() => chooseLocation(city)}>
            <span>{city}</span>{location === city && <Check size={14}/>}
          </button>)}
        </div>}
      </div>
      <nav className={open ? 'market-nav open' : 'market-nav'} aria-label="Main navigation">
        <Link href="/cars" onClick={() => setOpen(false)} className={isCars ? 'active' : ''} aria-current={isCars ? 'page' : undefined}>Buy used cars</Link>
        <Link href="/#how-it-works" onClick={() => setOpen(false)} className={isHowItWorks ? 'active' : ''}>How it works</Link>
        <Link href="/favorites" onClick={() => setOpen(false)} className={isFavorites ? 'active market-nav-fav' : 'market-nav-fav'} aria-current={isFavorites ? 'page' : undefined}><Heart size={14} fill={favorites.length > 0 ? 'currentColor' : 'none'} strokeWidth={2.4}/> Favorites{favorites.length > 0 && <span className="market-nav-count">{favorites.length}</span>}</Link>
        <Link href="/contact" onClick={() => setOpen(false)} className={isContact ? 'active' : ''} aria-current={isContact ? 'page' : undefined}>Contact us</Link>
      </nav>
      <Link href="/cars" className="market-header-cta">Explore cars</Link>
      <button className="market-menu" type="button" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button>
    </div>
  </header>;
}
