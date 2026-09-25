import type { Car } from './api';
import { carHref } from './api';
import { CONTACT_EMAIL, WHATSAPP_NUMBER } from './whatsapp';

/** Public address of the site. Every canonical link, sitemap entry and social
 *  preview is built from it, so set NEXT_PUBLIC_SITE_URL once a custom domain
 *  (e.g. https://kangacars.in) is connected in Vercel. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://car-consalting.vercel.app').replace(/\/+$/, '');

export const SITE_NAME = 'KangaCars';

export const BUSINESS = {
  name: 'KangaCars',
  legalName: 'KangaCars – Used Car Sales & Car Consulting, Musiri',
  phone: `+${WHATSAPP_NUMBER}`,
  email: CONTACT_EMAIL,
  street: 'Thirumurugan Nagar',
  city: 'Musiri',
  district: 'Tiruchirappalli',
  state: 'Tamil Nadu',
  postalCode: '621211',
  country: 'IN',
  // Musiri town centre. Replace with the exact shop pin from Google Maps for best local results.
  latitude: 10.9530,
  longitude: 78.4436,
  /** Towns the business serves, used in schema and page copy. */
  areaServed: ['Musiri', 'Thottiyam', 'Thuraiyur', 'Kulithalai', 'Manachanallur', 'Tiruchirappalli (Trichy)', 'Namakkal', 'Karur']
};

export const DEFAULT_TITLE = 'KangaCars | Used Cars for Sale & Car Consulting in Musiri';
export const DEFAULT_DESCRIPTION = 'KangaCars is a trusted car consulting and used car sales service in Musiri, Tamil Nadu. Buy verified second-hand cars in Musiri, Thottiyam, Thuraiyur and Trichy with honest prices and expert help.';

export const KEYWORDS = [
  'KangaCars', 'Kanga Cars', 'car sale in Musiri', 'car sales Musiri', 'used car in Musiri', 'used cars Musiri',
  'second hand cars Musiri', 'car consulting Musiri', 'car consulting', 'car consultant Musiri',
  'used cars Trichy', 'second hand cars Trichy', 'used cars Thottiyam', 'used cars Thuraiyur',
  'buy used car Tamil Nadu', 'pre-owned cars Musiri'
];

export const absoluteUrl = (path = '/') => (/^https?:\/\//i.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`);

export const carTitle = (car: Pick<Car, 'year' | 'brand' | 'model'>) => `${car.year} ${car.brand} ${car.model}`;

const inr = (value: number) => `₹${Number(value).toLocaleString('en-IN')}`;

export function carDescription(car: Car) {
  return `Used ${carTitle(car)} for sale in ${car.location || BUSINESS.city} at ${inr(car.price)}. ${Number(car.kmDriven).toLocaleString('en-IN')} km, ${car.fuelType}, ${car.transmission}. Enquire with KangaCars, car consulting in Musiri.`;
}

/** The business itself. AutoDealer is the schema.org type Google uses for car
 *  dealers in local results and the knowledge panel. */
export function businessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    '@id': `${SITE_URL}/#business`,
    name: BUSINESS.name,
    alternateName: ['Kanga Cars', BUSINESS.legalName],
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    logo: absoluteUrl('/kangacars-logo.png'),
    image: absoluteUrl('/carwise-hero.png'),
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.street,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.state,
      postalCode: BUSINESS.postalCode,
      addressCountry: BUSINESS.country
    },
    geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.latitude, longitude: BUSINESS.longitude },
    areaServed: BUSINESS.areaServed.map(name => ({ '@type': 'City', name })),
    knowsAbout: ['Used car sales', 'Car consulting', 'Second-hand car buying advice', 'Car valuation'],
    contactPoint: { '@type': 'ContactPoint', telephone: BUSINESS.phone, contactType: 'sales', areaServed: 'IN', availableLanguage: ['English', 'Tamil'] }
  };
}

/** Lets Google show a search box for the site and ties the brand name to it. */
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: 'Kanga Cars',
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#business` },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/cars?search={search_term_string}` },
      'query-input': 'required name=search_term_string'
    }
  };
}

export function carJsonLd(car: Car) {
  const url = absoluteUrl(carHref(car));
  return {
    '@context': 'https://schema.org',
    '@type': ['Product', 'Car'],
    name: carTitle(car),
    description: car.description || carDescription(car),
    url,
    image: (car.images || []).map(image => absoluteUrl(image.url)),
    brand: { '@type': 'Brand', name: car.brand },
    model: car.model,
    vehicleModelDate: String(car.year),
    fuelType: car.fuelType,
    vehicleTransmission: car.transmission,
    bodyType: car.bodyType,
    itemCondition: 'https://schema.org/UsedCondition',
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: car.kmDriven, unitCode: 'KMT' },
    offers: {
      '@type': 'Offer',
      url,
      price: car.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/UsedCondition',
      areaServed: car.location || BUSINESS.city,
      seller: { '@id': `${SITE_URL}/#business` }
    }
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.name, item: absoluteUrl(item.path) }))
  };
}

export const HOME_FAQ = [
  { q: 'Where can I buy a used car in Musiri?', a: 'KangaCars in Thirumurugan Nagar, Musiri lists verified second-hand cars with clear prices, photos and full details. Browse the cars online, then call or WhatsApp us to see the car in person.' },
  { q: 'What does car consulting at KangaCars include?', a: 'Our car consulting in Musiri helps you pick the right car for your budget, check its condition and documents, compare prices and complete the purchase with confidence.' },
  { q: 'Do you help people from Trichy, Thottiyam and Thuraiyur?', a: 'Yes. Along with Musiri we help buyers from Thottiyam, Thuraiyur, Kulithalai, Manachanallur, Trichy, Namakkal and Karur.' },
  { q: 'Can I sell my car through KangaCars?', a: 'Yes. Contact us with your car details and our team will guide you on a fair price and help you find a buyer in and around Musiri.' }
];

export function faqJsonLd(items = HOME_FAQ) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({ '@type': 'Question', name: item.q, acceptedAnswer: { '@type': 'Answer', text: item.a } }))
  };
}
