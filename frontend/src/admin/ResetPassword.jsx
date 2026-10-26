import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { adminService } from '../services/adminService';

export default function ResetPassword() {
  usePageMeta({ title: 'Reset password | Magic Frames' });
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get('token') || '';
  const emailParam = params.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await adminService.resetPassword({
        token,
        email,
        password,
        password_confirmation: confirm,
      });
      setDone(true);
      setTimeout(() => navigate('/admin/login', { replace: true }), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset your password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Reset your password</h1>

        {done ? (
          <p className="mt-6 rounded-md bg-green-50 p-3 text-sm text-green-700">
            Your password has been reset. Redirecting to sign in…
          </p>
        ) : !token ? (
          <div className="mt-6">
            <p className="text-sm text-red-600">This reset link is invalid or incomplete.</p>
            <Link to="/admin/forgot-password" className="mt-4 inline-block text-sm text-gray-700 underline">
              Request a new link
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 focus:border-gray-900 focus:outline-none"
              />
              <p className="mt-1 text-xs text-gray-400">
                At least 8 characters, including letters and numbers.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Confirm password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 focus:border-gray-900 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[#161c2d] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-50"
            >
              {submitting ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
