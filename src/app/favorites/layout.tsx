import type { Metadata } from 'next';

// Favorites live in the visitor's browser, so there is nothing here for Google to index.
export const metadata: Metadata = { title: 'Your favorite cars', robots: { index: false, follow: true } };

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
