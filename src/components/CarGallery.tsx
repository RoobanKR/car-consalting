'use client';
import { useState } from 'react';
import { Camera, Check, ChevronLeft, ChevronRight, GitCompare, Heart } from 'lucide-react';
import type { Car } from '@/lib/api';
import { useFavorites } from '@/lib/favorites';
import { useCompare } from '@/lib/compare';
import CarLightbox from './CarLightbox';

export default function CarGallery({ images, name, carId }: { images: Car['images']; name: string; carId?: string }) {
  const [selected, setSelected] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [compareMessage, setCompareMessage] = useState('');
  const { isFavorite, toggle: toggleFavorite, ready: favReady } = useFavorites();
  const { inCompare, toggle: toggleCompare, ready: cmpReady, isFull, max } = useCompare();
  const photos = images || [];
  const current = photos[selected];
  const favorited = Boolean(carId) && favReady && isFavorite(carId!);
  const compared = Boolean(carId) && cmpReady && inCompare(carId!);

  function move(direction: number) { setSelected(index => (index + direction + photos.length) % photos.length); }

  function handleCompareClick() {
    if (!carId) return;
    setCompareMessage('');
    const result = toggleCompare(carId);
    if (!result.ok && result.reason === 'full') {
      setCompareMessage(`Compare full (max ${max})`);
      window.setTimeout(() => setCompareMessage(''), 2200);
    }
  }

  return <div className="car-gallery">
    <div className="main-car-image">
      {current?.url ? <img src={current.url} alt={`${name} photo ${selected + 1}`}/> : <div className="car-placeholder"><span>KANGACARS SELECT</span><strong>{name}</strong></div>}
      {photos.length > 0 && <button type="button" className="market-photo-badge" onClick={() => setLightboxOpen(true)} aria-label={`Open ${photos.length}-photo gallery`}>
        <Camera size={13} strokeWidth={2.4}/> {photos.length}
      </button>}
      {carId && <div className="detail-gallery-tools">
        <button type="button" className={favorited ? 'market-card-fav active' : 'market-card-fav'} onClick={() => toggleFavorite(carId)} aria-label={favorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`} aria-pressed={favorited} title={favorited ? 'Remove from favorites' : 'Add to favorites'}>
          <Heart size={17} fill={favorited ? 'currentColor' : 'none'} strokeWidth={2.4}/>
        </button>
        <button type="button" className={compared ? 'market-card-cmp active' : (isFull ? 'market-card-cmp disabled' : 'market-card-cmp')} onClick={handleCompareClick} aria-label={compared ? `Remove ${name} from compare` : `Add ${name} to compare`} aria-pressed={compared} title={compared ? 'Remove from compare' : (isFull ? `Compare full (max ${max})` : 'Add to compare')}>
          {compared ? <Check size={17} strokeWidth={2.6}/> : <GitCompare size={17} strokeWidth={2.4}/>}
        </button>
      </div>}
      {compareMessage && <div className="market-card-toast detail-card-toast">{compareMessage}</div>}
      {photos.length > 1 && <><button type="button" className="detail-gallery-arrow previous" onClick={() => move(-1)} aria-label="Previous car photo"><ChevronLeft size={24}/></button><button type="button" className="detail-gallery-arrow next" onClick={() => move(1)} aria-label="Next car photo"><ChevronRight size={24}/></button><span className="detail-gallery-count">{selected + 1} / {photos.length}</span></>}
    </div>
    {photos.length > 1 && <div className="thumb-grid">{photos.map((image, index) => <button key={`${image.url}-${index}`} type="button" className={selected === index ? 'selected' : ''} onClick={() => setSelected(index)} aria-label={`Show photo ${index + 1}`} aria-pressed={selected === index}><img src={image.url} alt={`${name} thumbnail ${index + 1}`}/></button>)}</div>}
    {lightboxOpen && <CarLightbox images={photos} name={name} startIndex={selected} onClose={() => setLightboxOpen(false)}/>}
  </div>;
}
