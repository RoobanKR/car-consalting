import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Used Cars for Sale in Musiri', template: '%s | KangaCars' },
  description: 'Browse used cars for sale in Musiri, Thottiyam, Thuraiyur and Trichy. Filter second-hand cars by brand, price, fuel and body type, then enquire with KangaCars.',
  alternates: { canonical: '/cars' },
  openGraph: { url: '/cars', title: 'Used Cars for Sale in Musiri | KangaCars', description: 'Second-hand cars in Musiri and Trichy with clear prices and full details.' }
};

export default function CarsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
