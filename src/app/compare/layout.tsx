import type { Metadata } from 'next';

// The comparison lives in the visitor's browser, so there is nothing here for Google to index.
export const metadata: Metadata = { title: 'Compare cars', robots: { index: false, follow: true } };

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
