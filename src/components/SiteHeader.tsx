'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CarFront, Check, ChevronDown, Heart, Menu, MessageCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useFavorites } from '@/lib/favorites';

export default function SiteHeader() {
  const pathname = usePathname() || '/';
  const { favorites } = useFavorites();
  const [open, setOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const modelRef = useRef<HTMLDivElement>(null);
  const isCars = pathname === '/cars' || pathname.startsWith('/cars/');
  const isHowItWorks = pathname === '/';
  const isContact = pathname === '/contact';
  const isFavorites = pathname === '/favorites';

  useEffect(() => {
    setModel(new URLSearchParams(window.location.search).get('model') || '');
    api<{ models: { value: string }[] }>('/cars/facets').then(facets => setModels(facets.models.map(item => item.value))).catch(() => {});
  }, []);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) setModelOpen(false);
    }
    function onKey(event: KeyboardEvent) { if (event.key === 'Escape') setModelOpen(false); }
    if (modelOpen) {
      document.addEventListener('mousedown', onDocClick);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [modelOpen]);

  function chooseModel(value: string) {
    setModel(value);
    setModelOpen(false);
    const target = new URL('/cars', window.location.origin);
    if (window.location.pathname === '/cars') target.search = window.location.search;
    if (value) target.searchParams.set('model', value);
    else target.searchParams.delete('model');
    window.location.assign(target.pathname + target.search);
  }

  return <header className="market-header">
    <div className="market-topline"><div className="container"><span>Find a car that fits your life</span><Link href="/contact">Questions? Get in touch <MessageCircle size={14}/></Link></div></div>
    <div className="container market-header-main">
      <Link href="/" className="market-logo" aria-label="Carwise home"><span className="market-logo-icon"><CarFront size={22} strokeWidth={2.6}/></span><span>carwise<span>.</span></span></Link>
      <div ref={modelRef} className={modelOpen ? 'market-location-wrap open' : 'market-location-wrap'}>
        <button type="button" className="market-location" aria-haspopup="listbox" aria-expanded={modelOpen} onClick={() => setModelOpen(!modelOpen)}>
          <CarFront size={17}/>
          <span><small>Browse by model</small><strong>{model || 'All models'}</strong></span>
          <ChevronDown size={15}/>
        </button>
        {modelOpen && <div className="market-location-menu" role="listbox" aria-label="Choose a car model">
          <button type="button" role="option" aria-selected={!model} className={!model ? 'selected' : ''} onClick={() => chooseModel('')}>
            <span>All models</span>{!model && <Check size={14}/>}
          </button>
          {models.map(name => <button key={name} type="button" role="option" aria-selected={model === name} className={model === name ? 'selected' : ''} onClick={() => chooseModel(name)}>
            <span>{name}</span>{model === name && <Check size={14}/>}
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
