import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { adminService } from '../services/adminService';

export default function ForgotPassword() {
  usePageMeta({ title: 'Forgot password | Magic Frames' });
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
      setError(err.response?.data?.message || 'Could not process the request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Forgot your password?</h1>
        <p className="mt-1 text-sm text-gray-500">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {done ? (
          <div className="mt-6">
            <p className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              If that email is registered, a password reset link has been sent. Please check your
              inbox.
            </p>
            <Link to="/admin/login" className="mt-4 inline-block text-sm text-gray-700 underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 focus:border-gray-900 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[#161c2d] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
            <Link to="/admin/login" className="block text-center text-sm text-gray-500">
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
