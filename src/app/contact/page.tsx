import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { BUSINESS } from '@/lib/seo';
import { CONTACT_EMAIL, WHATSAPP_DISPLAY, WHATSAPP_NUMBER, generalMessage, whatsappLink } from '@/lib/whatsapp';

export const metadata: Metadata = {
  title: 'Contact – Car Consulting in Musiri',
  description: `Contact KangaCars for car consulting and used car sales in Musiri, Tamil Nadu. Call or WhatsApp ${WHATSAPP_DISPLAY}, or visit us at ${BUSINESS.street}, Musiri ${BUSINESS.postalCode}.`,
  alternates: { canonical: '/contact' }
};

const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`KangaCars, ${BUSINESS.street}, ${BUSINESS.city}, ${BUSINESS.state} ${BUSINESS.postalCode}`)}`;

export default function Contact() {
  return <><SiteHeader/><main className="contact-page"><div className="container contact-inner">
    <div className="eyebrow"><span className="eyebrow-line"/> CONTACT KANGACARS</div>
    <h1>Car consulting in Musiri – we&apos;re here to help.</h1>
    <p>Looking for a used car in Musiri, or need advice before you buy or sell? Call, WhatsApp or visit KangaCars. You can also open any car listing and send us an enquiry, and the team will follow up.</p>
    <address className="contact-nap">
      <strong>{BUSINESS.name}</strong>
      <a href={mapsLink} target="_blank" rel="noopener noreferrer"><MapPin size={16}/>{BUSINESS.street}, {BUSINESS.city}, {BUSINESS.district} district, {BUSINESS.state} {BUSINESS.postalCode}</a>
      <a href={`tel:+${WHATSAPP_NUMBER}`}><Phone size={16}/>{WHATSAPP_DISPLAY}</a>
      <a href={`mailto:${CONTACT_EMAIL}`}><Mail size={16}/>{CONTACT_EMAIL}</a>
    </address>
    <div className="contact-actions"><a href={whatsappLink(generalMessage)} target="_blank" rel="noopener noreferrer" className="button button-primary">Chat on WhatsApp <ArrowRight size={18}/></a><Link href="/cars" className="button button-secondary">Browse used cars <ArrowRight size={18}/></Link></div>
  </div></main><SiteFooter/></>;
}
