'use client';
import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { api, Car } from '@/lib/api';

export default function EnquiryForm({ car }: { car: Car }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await api('/enquiries', { method: 'POST', body: JSON.stringify({
        carId: car._id, name: form.get('name'), email: form.get('email'), phone: form.get('phone'),
        city: form.get('city'), message: form.get('message')
      }) });
      setDone(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  if (done) return <div className="success-state"><CheckCircle2 size={44}/><h3>Enquiry received</h3><p>Thanks for your interest. Our team will contact you about the {car.brand} {car.model} soon.</p></div>;
  return <form onSubmit={submit} className="enquiry-form">
    <div className="form-row"><label>Full name<input name="name" required minLength={2} maxLength={100} placeholder="Your name" /></label><label>Phone number<input name="phone" required minLength={7} maxLength={25} type="tel" placeholder="Your phone" /></label></div>
    <div className="form-row"><label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label><label>City<input name="city" maxLength={100} placeholder="Your city" /></label></div>
    <label>Anything we should know?<textarea name="message" rows={3} maxLength={2000} placeholder="Tell us what you would like to know about this car" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-primary full" disabled={busy}>{busy ? 'Sending…' : 'Send enquiry'} <ArrowRight size={18}/></button>
    <p className="form-note">No booking or payment required. We&apos;ll only use your details to respond to this enquiry.</p>
  </form>;
}
