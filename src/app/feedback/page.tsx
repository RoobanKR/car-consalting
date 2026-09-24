'use client';
import Link from 'next/link';
import { ArrowRight, ChevronDown, MessageSquareText } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import FeedbackCard, { Stars } from '@/components/FeedbackCard';
import { useFeedbackInfinite, FEEDBACK_PER_PAGE } from '@/lib/queries';

export default function FeedbackPage() {
  const query = useFeedbackInfinite();
  const entries = query.data?.pages.flatMap(page => page.items) ?? [];
  const total = query.data?.pages[0]?.total ?? 0;
  const average = entries.length
    ? entries.reduce((sum, entry) => sum + entry.rating, 0) / entries.length
    : 0;

  return <><SiteHeader/><main className="catalog-page">
    <nav className="container catalog-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><strong aria-current="page">Feedback</strong></nav>
    <div className="container feedback-page">
      <header className="feedback-page-head">
        <span className="catalog-eyebrow">WHAT BUYERS SAY</span>
        <h1>Customer feedback</h1>
        {query.isLoading
          ? <p>Loading feedback…</p>
          : <p>{total} {total === 1 ? 'review' : 'reviews'}{average > 0 && <> · <Stars rating={average}/> {average.toFixed(1)} average</>}</p>}
      </header>

      {query.error
        ? <div className="catalog-empty"><MessageSquareText size={42}/><h2>Feedback could not load</h2><p>{query.error instanceof Error ? query.error.message : 'Please try again.'}</p></div>
        : query.isLoading
          ? <div className="feedback-grid">{Array.from({ length: 6 }, (_, index) => <div key={index} className="feedback-skeleton" aria-hidden="true"/>)}</div>
          : !entries.length
            ? <div className="catalog-empty"><MessageSquareText size={42}/><h2>No feedback yet</h2><p>Reviews from our customers will appear here.</p><Link href="/cars">Browse cars <ArrowRight size={17}/></Link></div>
            : <>
                <div className="feedback-grid">{entries.map(entry => <FeedbackCard key={entry._id} entry={entry}/>)}</div>
                {query.isFetchingNextPage && <div className="feedback-grid catalog-card-grid-more">{Array.from({ length: 3 }, (_, index) => <div key={index} className="feedback-skeleton" aria-hidden="true"/>)}</div>}
                <div className="catalog-loadmore">
                  <p className="catalog-loadmore-meta">Showing <strong>{entries.length}</strong> of {total}</p>
                  {query.hasNextPage
                    ? <button type="button" className="catalog-loadmore-button" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? 'Loading…' : `Load ${Math.min(FEEDBACK_PER_PAGE, total - entries.length)} more`} <ChevronDown size={16}/></button>
                    : <p className="catalog-loadmore-end">That is all the feedback so far.</p>}
                </div>
              </>}
    </div>
  </main><SiteFooter/></>;
}
