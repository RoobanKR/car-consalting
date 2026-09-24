'use client';
import { usePathname } from 'next/navigation';
import { generalMessage, whatsappLink, WHATSAPP_DISPLAY } from '@/lib/whatsapp';

/** Floating contact button shown on every public page. */
export default function WhatsAppButton() {
  const pathname = usePathname() || '/';
  // The admin workspace has its own bottom bar on mobile; this would sit on top of it.
  if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) return null;

  return <a
    className="whatsapp-fab"
    href={whatsappLink(generalMessage)}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`Chat with us on WhatsApp at ${WHATSAPP_DISPLAY}`}
  >
    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.15-.17.2-.34.22-.63.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.18-.24-.58-.48-.5-.66-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.25-4.36c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.25 8.24z"/>
    </svg>
    <span className="whatsapp-fab-label">Chat on WhatsApp</span>
  </a>;
}
