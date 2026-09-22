import type { Metadata } from 'next';
import './globals.css';
import './marketplace.css';
import './admin.css';
import BackToTop from '@/components/BackToTop';
import CompareBar from '@/components/CompareBar';

export const metadata: Metadata = {
  title: 'Carwise | Find the right car with confidence',
  description: 'Explore quality cars and send a simple enquiry to our team.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<CompareBar/><BackToTop/></body></html>;
}
