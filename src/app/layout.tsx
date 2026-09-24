import type { Metadata } from 'next';
import './globals.css';
import './marketplace.css';
import './admin.css';
import QueryProvider from '@/components/QueryProvider';
import BackToTop from '@/components/BackToTop';
import CompareBar from '@/components/CompareBar';
import WhatsAppButton from '@/components/WhatsAppButton';
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  title: 'KangaCars | Find the right car with confidence',
  description: 'Explore quality cars and send a simple enquiry to our team.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><QueryProvider>{children}<CompareBar/><WhatsAppButton/><BackToTop/></QueryProvider><SpeedInsights/></body></html>;
}
