import { useState } from 'react';
import { albumService } from '../services/albumService';

/**
 * Public enquiry form. Submissions are stored and forwarded to the CRN system.
 * Open to the client or anyone viewing the album (friends/relatives), including
 * reshared links.
 */
export default function EnquiryForm({ slug }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      setError('Please add a phone number or email so we can reach you.');
      return;
    }
    setSubmitting(true);
    try {
      await albumService.submitEnquiry(slug, {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send your enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="themed-surface p-6 text-center">
        <div className="mb-2 text-4xl">💌</div>
        <h3 className="font-heading text-2xl">Thank you!</h3>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Your enquiry has been sent to Magic Frames. We'll be in touch soon.
        </p>
        <button onClick={() => { setDone(false); setForm({ name: '', phone: '', email: '', message: '' }); }} className="mt-4 text-sm themed-accent-text">
          Send another enquiry
        </button>
      </section>
    );
  }

  return (
    <section className="themed-surface p-6">
      <h3 className="font-heading text-2xl">Enquire with Magic Frames</h3>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        Loved these photos? Book Magic Frames for your event — send us an enquiry.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input value={form.name} onChange={set('name')} placeholder="Your name *" maxLength={120}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm focus:border-current focus:outline-none" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input value={form.phone} onChange={set('phone')} placeholder="Phone" maxLength={40}
            className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm focus:border-current focus:outline-none" />
          <input value={form.email} onChange={set('email')} type="email" placeholder="Email" maxLength={150}
            className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm focus:border-current focus:outline-none" />
        </div>
        <textarea value={form.message} onChange={set('message')} placeholder="Tell us about your event (date, type, location)…" rows={3} maxLength={2000}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm focus:border-current focus:outline-none" />
        {/* Honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-accent text-sm disabled:opacity-50">
          {submitting ? 'Sending…' : 'Send Enquiry'}
        </button>
      </form>
    </section>
  );
}
