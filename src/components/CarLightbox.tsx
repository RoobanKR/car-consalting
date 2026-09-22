'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Car } from '@/lib/api';

export default function CarLightbox({ images, name, startIndex = 0, onClose }: { images: Car['images']; name: string; startIndex?: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef(0);
  const photos = images || [];
  const total = photos.length;
  const current = photos[index];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') setIndex(i => (i - 1 + total) % total);
      else if (event.key === 'ArrowRight') setIndex(i => (i + 1) % total);
    }
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow; };
  }, [total, onClose]);

  // Arrows are gone, so a swipe keeps the gallery usable on a phone.
  function onTouchEnd(event: React.TouchEvent) {
    const travelled = event.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(travelled) > 45) setIndex(i => (i + (travelled < 0 ? 1 : -1) + total) % total);
  }

  if (!mounted || !total) return null;

  // The card this is opened from lifts on hover with a transform, which would make it
  // the containing block for position:fixed and clip the overlay inside the card.
  // Rendering into <body> keeps the gallery full screen wherever it is opened from.
  return createPortal(
    <div className="car-lightbox" role="dialog" aria-modal="true" aria-label={`${name} photos`} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="car-lightbox-inner">
        <div className="car-lightbox-topbar">
          <span>{index + 1} / {total} · {name}</span>
          <button type="button" onClick={onClose} aria-label="Close gallery"><X size={22}/></button>
        </div>
        <div className="car-lightbox-stage" onClick={event => { if (event.target === event.currentTarget) onClose(); }} onTouchStart={event => { touchStartX.current = event.changedTouches[0].clientX; }} onTouchEnd={onTouchEnd}>
          <img src={current.url} alt={`${name} photo ${index + 1}`}/>
        </div>
        {total > 1 && <div className="car-lightbox-dots">
          {photos.map((image, dotIndex) => <button key={`${image.url}-${dotIndex}`} type="button" className={dotIndex === index ? 'selected' : ''} onClick={() => setIndex(dotIndex)} aria-label={`Show photo ${dotIndex + 1}`} aria-current={dotIndex === index}><span/></button>)}
        </div>}
      </div>
    </div>,
    document.body
  );
}
