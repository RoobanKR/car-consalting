import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CarFront, ChevronRight, CircleHelp, MessageSquareText, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CarCard from '@/components/CarCard';
import FeedbackSection from '@/components/FeedbackSection';
import SiteStatsBand from '@/components/SiteStats';
import { Car, Feedback, HeroMedia } from '@/lib/api';
import { getActiveHeroMedia, getSiteStats, listActiveCars, listFeedback } from '@/lib/server/data';

export const dynamic = 'force-dynamic';
export default async function Home() {
  const [cars, hero, feedback, stats] = await Promise.all([
    listActiveCars().catch(() => []) as Promise<Car[]>,
    getActiveHeroMedia().catch(() => null) as Promise<HeroMedia | null>,
    listFeedback({ limit: 5 }).catch(() => ({ items: [], total: 0 })) as Promise<{ items: Feedback[]; total: number }>,
    getSiteStats().catch(() => null)
  ]);
  const bodyTypes = ['SUV', 'Hatchback', 'Sedan'];
  const heroVideo = hero?.type === 'video' ? hero : null;
  const heroImage = hero?.type === 'image' ? hero : null;
  // A custom still swaps in through the --hero-image variable so every breakpoint keeps its own gradient.
  const heroStyle = heroImage ? ({ '--hero-image': `url("${heroImage.url}")` } as CSSProperties) : undefined;
  return <><SiteHeader/><main className="market-home">
    <section className={`market-hero${heroVideo ? ' market-hero-video' : ''}`} style={heroStyle}>{heroVideo && <><video className="market-hero-media" autoPlay muted loop playsInline preload="auto" poster={heroVideo.posterUrl || undefined} src={heroVideo.url}/><span className="market-hero-scrim" aria-hidden="true"/></>}<div className="container market-hero-inner"><div className="market-hero-copy"><span className="market-hero-kicker"><Sparkles size={15}/> YOUR CAR SEARCH STARTS HERE</span><h1>Find a car you&apos;ll<br/><em>love to drive.</em></h1><p>Explore used cars, compare the details and ask our team anything before you decide.</p><form action="/cars" className="market-hero-search"><Search size={21}/><input name="search" aria-label="Search cars" placeholder="Search by brand, model or city"/><button type="submit">Search cars <ArrowRight size={18}/></button></form><div className="market-hero-caption"><span>Popular searches</span><Link href="/cars?body=SUV">SUV <ChevronRight size={13}/></Link><Link href="/cars?body=Sedan">Sedan <ChevronRight size={13}/></Link><Link href="/cars?body=Hatchback">Hatchback <ChevronRight size={13}/></Link></div></div></div></section>
    <section className="market-trust-bar"><div className="container"><span><Search size={19}/> Easy car search</span><span><SlidersHorizontal size={19}/> Useful filters</span><span><MessageSquareText size={19}/> Direct enquiries</span><span><CircleHelp size={19}/> Answers from our team</span></div></section>
    {stats && <SiteStatsBand stats={stats}/>}
    <section className="market-home-section"><div className="container"><div className="market-section-heading"><div><span className="market-overline">START EXPLORING</span><h2>What type of car fits you?</h2><p>Start with a body style, then refine the details.</p></div><Link href="/cars">Browse all cars <ArrowUpRight size={17}/></Link></div><div className="market-body-grid">{bodyTypes.map((body, index) => <Link href={`/cars?body=${encodeURIComponent(body)}`} className={`market-body-card body-${index}`} key={body}><div className="body-card-art"><CarFront size={72} strokeWidth={1.25}/></div><div><strong>{body}s</strong><span>Explore {body.toLowerCase()} cars <ArrowRight size={16}/></span></div></Link>)}</div></div></section>
    <section className="market-home-section market-featured"><div className="container"><div className="market-section-heading"><div><span className="market-overline">THE LATEST LISTINGS</span><h2>Cars to take a closer look at</h2><p>Every listing includes the price and key details up front.</p></div><Link href="/cars">View all cars <ArrowUpRight size={17}/></Link></div>{cars.length ? <div className="catalog-card-grid">{cars.slice(0, 6).map(car => <CarCard key={car._id} car={car}/>)}</div> : <div className="catalog-empty market-home-empty"><CarFront size={40}/><h3>Fresh listings are on the way</h3><p>New cars will appear here when they are added.</p><Link href="/cars">Explore the catalog <ArrowRight size={17}/></Link></div>}</div></section>
    <FeedbackSection entries={feedback.items} total={feedback.total}/>
    <section id="how-it-works" className="market-steps"><div className="container"><div className="market-section-heading"><div><span className="market-overline">SIMPLE FROM START TO FINISH</span><h2>Your next car in three easy steps</h2></div></div><div className="market-step-grid"><div><span>01</span><Search size={27}/><h3>Browse cars</h3><p>Use filters to find cars that match your budget and preferences.</p></div><div><span>02</span><CarFront size={27}/><h3>Check the details</h3><p>See photos, price, specifications and features in one place.</p></div><div><span>03</span><MessageSquareText size={27}/><h3>Send an enquiry</h3><p>Ask about a car and the team will follow up. No booking is needed.</p></div></div></div></section>
    <section className="market-home-cta"><div className="container"><div><span>READY TO EXPLORE?</span><h2>Your next car could be one search away.</h2><p>Browse the collection and get in touch when a car feels right.</p></div><Link href="/cars">Find your car <ArrowRight size={19}/></Link></div></section>
  </main><SiteFooter/></>;
}
