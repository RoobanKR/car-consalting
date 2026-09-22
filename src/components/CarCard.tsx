'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Camera, Check, Gauge, GitCompare, Heart, MapPin } from 'lucide-react';
import { Car, carHref, money } from '@/lib/api';
import { useFavorites } from '@/lib/favorites';
import { useCompare } from '@/lib/compare';
import { useSwipe } from '@/lib/useSwipe';
import CarLightbox from './CarLightbox';

export default function CarCard({ car }: { car: Car }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [compareMessage, setCompareMessage] = useState('');
  const { isFavorite, toggle: toggleFavorite, ready: favReady } = useFavorites();
  const { inCompare, toggle: toggleCompare, ready: cmpReady, isFull, max } = useCompare();
  const images = car.images || [];
  const photo = images[photoIndex];
  const href = carHref(car);
  const favorited = favReady && isFavorite(car._id);
  const compared = cmpReady && inCompare(car._id);
  // Swiping the photo moves through the gallery; the dots stay as a tap target.
  const { handlers: swipeHandlers, swiped } = useSwipe(direction => {
    setPhotoIndex(index => (index + direction + images.length) % images.length);
  });

  function handleCompareClick() {
    setCompareMessage('');
    const result = toggleCompare(car._id);
    if (!result.ok && result.reason === 'full') {
      setCompareMessage(`Compare full (max ${max})`);
      window.setTimeout(() => setCompareMessage(''), 2200);
    }
  }
  return <article className="market-car-card">
    <div className={images.length > 1 ? 'market-car-image market-car-image-swipe' : 'market-car-image'} {...(images.length > 1 ? swipeHandlers : {})} onClickCapture={event => { if (swiped.current) { swiped.current = false; event.preventDefault(); event.stopPropagation(); } }}>
      <Link href={href} className="market-car-image-link" aria-label={`View ${car.brand} ${car.model}`}>
        {photo?.url ? <img src={photo.url} alt={`${car.brand} ${car.model} photo ${photoIndex + 1}`} loading="lazy"/> : <div className="market-car-placeholder"><span><Gauge size={46}/></span><strong>{car.brand}</strong><small>Photos coming soon</small></div>}
      </Link>
      {images.length > 0 && <button type="button" className="market-photo-badge" onClick={() => setLightboxOpen(true)} aria-label={`Open ${images.length}-photo gallery`}>
        <Camera size={13} strokeWidth={2.4}/> {images.length}
      </button>}
      <div className="market-card-tools">
        <button type="button" className={favorited ? 'market-card-fav active' : 'market-card-fav'} onClick={() => toggleFavorite(car._id)} aria-label={favorited ? `Remove ${car.brand} ${car.model} from favorites` : `Add ${car.brand} ${car.model} to favorites`} aria-pressed={favorited} title={favorited ? 'Remove from favorites' : 'Add to favorites'}>
          <Heart size={16} fill={favorited ? 'currentColor' : 'none'} strokeWidth={2.4}/>
        </button>
        <button type="button" className={compared ? 'market-card-cmp active' : (isFull ? 'market-card-cmp disabled' : 'market-card-cmp')} onClick={handleCompareClick} aria-label={compared ? `Remove ${car.brand} ${car.model} from compare` : `Add ${car.brand} ${car.model} to compare`} aria-pressed={compared} title={compared ? 'Remove from compare' : (isFull ? `Compare full (max ${max})` : 'Add to compare')}>
          {compared ? <Check size={16} strokeWidth={2.6}/> : <GitCompare size={16} strokeWidth={2.4}/>}
        </button>
      </div>
      {compareMessage && <div className="market-card-toast">{compareMessage}</div>}
      {photo?.illustrative && <span className="market-illustrative-badge">Illustrative photo</span>}
      {images.length > 1 && <div className="market-card-dots">
        {images.map((image, dotIndex) => <button key={`${image.url}-${dotIndex}`} type="button" className={dotIndex === photoIndex ? 'active' : ''} onClick={() => setPhotoIndex(dotIndex)} onMouseEnter={() => setPhotoIndex(dotIndex)} aria-label={`Show photo ${dotIndex + 1} of ${car.brand} ${car.model}`} aria-current={dotIndex === photoIndex}><span/></button>)}
      </div>}
    </div>
    <div className="market-car-content">
      <span className="market-stock-label">AVAILABLE CAR</span>
      <h3><Link href={href}>{car.year} {car.brand} {car.model}</Link></h3>
      <div className="market-spec-pills"><span>{Number(car.kmDriven).toLocaleString('en-IN')} km</span><span>{car.fuelType}</span><span>{car.transmission}</span></div>
      <div className="market-card-price"><strong>{money(car.price)}</strong><span>Asking price</span></div>
      <div className="market-card-footer"><span><MapPin size={14}/>{car.location}</span><Link href={href}>View &amp; enquire <ArrowUpRight size={16}/></Link></div>
    </div>
    {lightboxOpen && <CarLightbox images={images} name={`${car.brand} ${car.model}`} startIndex={photoIndex} onClose={() => setLightboxOpen(false)}/>}
  </article>;
}
