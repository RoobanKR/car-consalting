'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ArrowUpRight, MessageSquareText } from 'lucide-react';
import FeedbackCard from '@/components/FeedbackCard';
import type { Feedback } from '@/lib/api';

export default function FeedbackSection({ entries, total }: { entries: Feedback[]; total: number }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ start: 0, visible: 1, end: false });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const update = () => {
      const card = rail.firstElementChild as HTMLElement | null;
      if (!card) return;
      const step = card.offsetWidth + parseFloat(getComputedStyle(rail).columnGap);
      const end = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 3;
      const visible = Math.max(1, Math.floor((rail.clientWidth + parseFloat(getComputedStyle(rail).columnGap) + 3) / step));
      setPosition({ start: Math.round(rail.scrollLeft / step), visible, end });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    rail.addEventListener('scroll', update, { passive: true });
    return () => { observer.disconnect(); rail.removeEventListener('scroll', update); };
  }, [entries.length]);

  function move(direction: number) {
    const rail = railRef.current;
    const card = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !card) return;
    const step = card.offsetWidth + parseFloat(getComputedStyle(rail).columnGap);
    rail.scrollBy({ left: direction * step, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  if (!entries.length) return null;
  const lastVisible = position.end ? entries.length : Math.min(entries.length, position.start + position.visible);

  return <section className="market-feedback" aria-labelledby="feedback-title">
    <div className="container">
      <header className="feedback-section-head">
        <div>
          <span className="feedback-eyebrow"><span/> THE PEOPLE BEHIND THE PURCHASES</span>
          <h2 id="feedback-title">Good cars. <em>Great experiences.</em></h2>
          <p>From the first test drive to the drive home. Hear it from our customers.</p>
        </div>
        <Link href="/feedback" className="feedback-all-link">Read all reviews <ArrowUpRight size={18}/></Link>
      </header>
      <div className="feedback-section-meta"><span><MessageSquareText size={16}/><strong>{total} customer {total === 1 ? 'story' : 'stories'}</strong></span><span>Real experiences, in their own words.</span></div>
      <div ref={railRef} id="customer-review-rail" className="feedback-rail" tabIndex={0} role="region" aria-label="Customer reviews. Use the arrow keys or the navigation buttons to browse.">
        {entries.map(entry => <FeedbackCard key={entry._id} entry={entry}/>)}
      </div>
      <div className="feedback-navigation">
        <div className="feedback-progress" aria-hidden="true"><span style={{ width: `${lastVisible / entries.length * 100}%` }}/></div>
        <span className="feedback-range" aria-live="polite" aria-atomic="true">{position.start + 1}–{lastVisible} <span>/ {entries.length}</span></span>
        <div className="feedback-arrows">
          <button type="button" onClick={() => move(-1)} disabled={position.start === 0} aria-label="Previous reviews" aria-controls="customer-review-rail"><ArrowLeft size={19}/></button>
          <button type="button" onClick={() => move(1)} disabled={position.end} aria-label="Next reviews" aria-controls="customer-review-rail"><ArrowRight size={19}/></button>
        </div>
      </div>
    </div>
  </section>;
}
