import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { usePageMeta } from '../hooks/usePageMeta';

export default function ForgotPassword() {
  usePageMeta({ title: 'Forgot Password | Magic Frames' });
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await adminService.forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-theme="modern" className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="themed-surface w-full max-w-sm p-8">
        <h1 className="font-heading text-2xl font-semibold">Forgot password</h1>
        {done ? (
          <>
            <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
              If an account exists for <span className="font-medium">{email}</span>, a password reset link
              has been sent. The link expires in 60 minutes.
            </p>
            <Link to="/admin/login" className="btn-accent mt-6 inline-block !rounded-lg text-sm">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="mb-6 mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              Enter your email and we'll send you a secure reset link.
            </p>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-black/15 px-3 py-2.5 focus:border-charcoal focus:outline-none"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={submitting} className="btn-accent w-full !rounded-lg disabled:opacity-50">
                {submitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
            <Link to="/admin/login" className="mt-6 block text-center text-xs" style={{ color: 'var(--muted)' }}>
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
