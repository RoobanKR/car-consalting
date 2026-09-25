import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Check, Eye, Fuel, Gauge, MapPin, Settings2, CalendarDays, ArrowRight, ArrowUpRight } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import EnquiryForm from '@/components/EnquiryForm';
import CarGallery from '@/components/CarGallery';
import CarCard from '@/components/CarCard';
import JsonLd from '@/components/JsonLd';
import { Car, carHref, money } from '@/lib/api';
import { getPublicCar, getRelatedCars } from '@/lib/server/data';
import { absoluteUrl, breadcrumbJsonLd, carDescription, carJsonLd, carTitle } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

// getPublicCar bumps the view counter; cache() makes the metadata and the page share
// one lookup per request so each visit still counts once.
const loadCar = cache((slug: string) => getPublicCar(slug).catch(() => null) as Promise<Car | null>);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const car = await loadCar((await params).slug);
  if (!car) return { title: 'Car not found', robots: { index: false, follow: true } };
  const title = `${carTitle(car)} for Sale in ${car.location || 'Musiri'} – ${money(car.price)}`;
  const description = carDescription(car);
  const path = carHref(car);
  const images = (car.images || []).slice(0, 4).map((image, index) => ({ url: absoluteUrl(image.url), alt: `${carTitle(car)} photo ${index + 1}` }));
  return {
    title,
    description,
    keywords: [`used ${car.brand} ${car.model} Musiri`, `${car.brand} ${car.model} for sale`, `second hand ${car.brand} ${car.location}`, 'used car in Musiri', 'car sale in Musiri'],
    alternates: { canonical: path },
    openGraph: { type: 'website', url: path, title: `${title} | KangaCars`, description, images },
    twitter: { card: 'summary_large_image', title: `${title} | KangaCars`, description, images: images.map(image => image.url) }
  };
}

export default async function CarDetails({ params }: Props) {
  const { slug } = await params;
  // Same process as the API now, so read the database directly instead of fetching ourselves over HTTP.
  const car = await loadCar(slug);
  if (!car) return <><SiteHeader/><main className="container not-found"><h1>Car not found</h1><p>This car may no longer be available.</p><Link className="button button-dark" href="/cars">Browse cars <ArrowRight size={17}/></Link></main><SiteFooter/></>;
  const related = await getRelatedCars(slug).catch(() => []) as Car[];
  return <><SiteHeader/><JsonLd data={[carJsonLd(car), breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Used cars in Musiri', path: '/cars' }, { name: carTitle(car), path: carHref(car) }])]}/><main><nav className="container catalog-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/cars">Used cars</Link><span aria-hidden="true">/</span><strong aria-current="page">{car.brand} {car.model}</strong></nav><div className="container details-top"><Link href="/cars" className="back-link"><ArrowLeft size={17}/> Back to cars</Link><div className="details-heading"><div><div className="eyebrow dark"><span className="eyebrow-line"/> AVAILABLE CAR</div><h1>{car.year} {car.brand} {car.model}<span className="details-h1-sub"> for sale in {car.location || 'Musiri'}</span></h1><p><MapPin size={16}/>{car.location}{typeof car.viewCount === 'number' && car.viewCount > 0 && <span className="detail-view-count"><Eye size={14}/>{car.viewCount} {car.viewCount === 1 ? 'view' : 'views'}</span>}</p></div><div className="detail-price"><small>Asking price</small><strong>{money(car.price)}</strong></div></div>
  <div className="details-grid"><div><CarGallery images={car.images} name={`${car.brand} ${car.model}`} carId={car._id}/>{car.images?.some(image => image.illustrative) && <div className="photo-disclosure"><strong>Illustrative model photos.</strong> These images show the model, not this exact vehicle. Confirm its condition with our team.{car.images.some(image => image.attribution === 'AI-generated illustrative image') && <span>Some views are AI-generated illustrations.</span>}{car.images.filter(image => image.illustrative && image.sourceUrl).map((image, index) => <span key={image.sourceUrl}><a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">Photo {index + 1}</a>{image.attribution && ` by ${image.attribution}`}{image.licenseUrl ? <> · <a href={image.licenseUrl} target="_blank" rel="noopener noreferrer">{image.license || 'License'}</a></> : image.license && ` · ${image.license}`}</span>)}</div>}
    <div className="details-section"><h2>Overview</h2><div className="spec-grid"><div><CalendarDays/><span>Year</span><strong>{car.year}</strong></div><div><Gauge/><span>Kilometres</span><strong>{Number(car.kmDriven).toLocaleString('en-IN')} km</strong></div><div><Fuel/><span>Fuel type</span><strong>{car.fuelType}</strong></div><div><Settings2/><span>Transmission</span><strong>{car.transmission}</strong></div></div></div>
    {car.description && <div className="details-section"><h2>About this car</h2><p className="car-description">{car.description}</p></div>}
    {car.features?.length > 0 && <div className="details-section"><h2>Features</h2><div className="features-grid">{car.features.map(feature => <span key={feature}><Check size={16}/>{feature}</span>)}</div></div>}
  </div><aside className="enquiry-panel"><div className="enquiry-panel-head"><span>INTERESTED IN THIS CAR?</span><h2>Let&apos;s talk about it.</h2><p>Send your details and our team will get back to you with answers.</p></div><EnquiryForm car={car}/></aside></div></div>
  {related.length > 0 && <section className="market-home-section market-related"><div className="container"><div className="market-section-heading"><div><span className="market-overline">SIMILAR CARS</span><h2>More {car.brand} cars in this price range</h2><p>Other {car.brand} listings within about 30% of {money(car.price)}.</p></div><Link href={`/cars?brand=${encodeURIComponent(car.brand)}`}>See all {car.brand} cars <ArrowUpRight size={17}/></Link></div><div className="catalog-card-grid">{related.map(item => <CarCard key={item._id} car={item}/>)}</div></div></section>}
  </main><SiteFooter/></>;
}
