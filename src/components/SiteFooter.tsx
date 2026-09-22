import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export default function SiteFooter() {
  return <footer className="site-footer"><div className="container footer-grid"><div><Link href="/" className="brand footer-brand"><span className="brand-mark">C<span>.</span></span><span>carwise<span className="brand-dot">.</span></span></Link><p>A simpler way to find your next car. Browse with confidence, then ask us anything.</p></div><div><h4>Explore</h4><Link href="/cars">Browse cars</Link><Link href="/#how-it-works">How it works</Link><Link href="/contact">Contact</Link></div><div><h4>Get in touch</h4><Link href="/cars">Enquire about a car <ArrowUpRight size={14}/></Link><span>India</span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Carwise. All rights reserved.</span><Link href="/admin">Admin</Link></div></footer>;
}
