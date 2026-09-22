import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
export default function Contact() { return <><SiteHeader/><main className="contact-page"><div className="container contact-inner"><div className="eyebrow"><span className="eyebrow-line"/> CONTACT CARWISE</div><h1>Questions? We&apos;re here to help.</h1><p>Open a car listing and send us an enquiry. Tell us what you would like to know, and the team will follow up.</p><div className="contact-actions"><Link href="/cars" className="button button-primary">Browse cars <ArrowRight size={18}/></Link></div></div></main><SiteFooter/></>; }
