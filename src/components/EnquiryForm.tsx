'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';
import { api, Car } from '@/lib/api';
import { enquiryMessage, whatsappLink, type EnquiryDetails } from '@/lib/whatsapp';

export default function EnquiryForm({ car }: { car: Car }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<EnquiryDetails | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');
  // Filled after hydration; the first client render must match the server's.
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBlocked(false); setBusy(true);
    const form = new FormData(event.currentTarget);
    const details: EnquiryDetails = {
      name: String(form.get('name') || ''),
      phone: String(form.get('phone') || ''),
      email: String(form.get('email') || ''),
      city: String(form.get('city') || ''),
      message: String(form.get('message') || '')
    };

    // Opened here, before any await, so the browser still counts it as a click the
    // person made. Opening it after the save returns gets stopped by popup blockers.
    const chat = window.open(whatsappLink(enquiryMessage(car, details, origin)), '_blank', 'noopener,noreferrer');
    if (!chat) setBlocked(true);

    try {
      // The enquiry is also saved, so it reaches the admin inbox even if the
      // person never presses send in WhatsApp.
      await api('/enquiries', { method: 'POST', body: JSON.stringify({ carId: car._id, ...details }) });
      setSent(details);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }

  if (sent) return <div className="success-state">
    <CheckCircle2 size={44}/>
    <h3>Enquiry sent</h3>
    <p>{blocked
      ? `Your enquiry about the ${car.brand} ${car.model} is saved. Open WhatsApp below to send it to our team.`
      : `WhatsApp is open with your enquiry about the ${car.brand} ${car.model}. Press send there and our team will reply.`}</p>
    <a className="whatsapp-button" href={whatsappLink(enquiryMessage(car, sent, origin))} target="_blank" rel="noopener noreferrer">
      <MessageCircle size={18}/> {blocked ? 'Open WhatsApp' : 'Open WhatsApp again'}
    </a>
  </div>;

  return <form onSubmit={submit} className="enquiry-form">
    <div className="form-row"><label>Full name<input name="name" required minLength={2} maxLength={100} placeholder="Your name" /></label><label>Phone number<input name="phone" required minLength={7} maxLength={25} type="tel" placeholder="Your phone" /></label></div>
    <div className="form-row"><label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>City<input name="city" maxLength={100} placeholder="Your city" /></label></div>
    <label>Anything we should know?<textarea name="message" rows={3} maxLength={2000} placeholder="Tell us what you would like to know about this car" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary full enquiry-send" disabled={busy}>
      <MessageCircle size={18}/>
      <span>{busy ? 'Sending…' : 'Send enquiry'}</span>
      <ArrowRight size={18}/>
    </button>
    <p className="form-note">Opens WhatsApp with your details and this car so you can send it in one tap. We also save it so our team can reply.</p>
  </form>;
}
