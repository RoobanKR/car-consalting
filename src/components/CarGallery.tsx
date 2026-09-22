'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Car } from '@/lib/api';

export default function CarGallery({ images, name }: { images: Car['images']; name: string }) {
  const [selected, setSelected] = useState(0);
  const photos = images || [];
  const current = photos[selected];
  function move(direction: number) { setSelected(index => (index + direction + photos.length) % photos.length); }
  return <div className="car-gallery">
    <div className="main-car-image">
      {current?.url ? <img src={current.url} alt={`${name} photo ${selected + 1}`}/> : <div className="car-placeholder"><span>CARWISE SELECT</span><strong>{name}</strong></div>}
      {photos.length > 1 && <><button type="button" className="detail-gallery-arrow previous" onClick={() => move(-1)} aria-label="Previous car photo"><ChevronLeft size={24}/></button><button type="button" className="detail-gallery-arrow next" onClick={() => move(1)} aria-label="Next car photo"><ChevronRight size={24}/></button><span className="detail-gallery-count">{selected + 1} / {photos.length}</span></>}
    </div>
    {photos.length > 1 && <div className="thumb-grid">{photos.map((image, index) => <button key={`${image.url}-${index}`} type="button" className={selected === index ? 'selected' : ''} onClick={() => setSelected(index)} aria-label={`Show photo ${index + 1}`} aria-pressed={selected === index}><img src={image.url} alt={`${name} thumbnail ${index + 1}`}/></button>)}</div>}
  </div>;
}
