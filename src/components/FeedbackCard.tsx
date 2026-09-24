import { Quote, Star } from 'lucide-react';
import type { Feedback } from '@/lib/api';

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  return <span className="feedback-stars" aria-label={`${value} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, index) => (
      <Star key={index} size={size} strokeWidth={2.2} className={index < value ? 'filled' : ''} fill={index < value ? 'currentColor' : 'none'} aria-hidden="true"/>
    ))}
  </span>;
}

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || '?';

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';

export default function FeedbackCard({ entry }: { entry: Feedback }) {
  return <article className="feedback-card">
    <div className="feedback-card-top"><Stars rating={entry.rating} size={16}/><Quote className="feedback-quote" size={30} strokeWidth={1.5} aria-hidden="true"/></div>
    <blockquote className="feedback-message">{entry.message}</blockquote>
    <footer className="feedback-by">
      <span className={entry.image?.url ? 'feedback-photo' : 'feedback-avatar'}>
        {entry.image?.url ? <img src={entry.image.url} alt={`Photo shared with ${entry.name}'s review`} loading="lazy"/> : initials(entry.name)}
      </span>
      <span className="feedback-by-text">
        <strong>{entry.name}</strong>
        {entry.createdAt && <small>{formatDate(entry.createdAt)}</small>}
      </span>
    </footer>
  </article>;
}
