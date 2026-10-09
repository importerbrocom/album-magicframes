import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@magicframes.test');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  usePageMeta({ title: 'Admin Login | Magic Frames' });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-theme="modern" className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="themed-surface w-full max-w-sm p-8">
        <h1 className="font-heading text-3xl font-semibold">Magic Frames</h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>Studio admin sign in</p>
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
          <div>
            <label className="mb-1 block text-sm">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full rounded-lg border border-black/15 px-3 py-2.5 focus:border-charcoal focus:outline-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-accent w-full !rounded-lg disabled:opacity-50">
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="mt-6 text-center text-xs" style={{ color: 'var(--muted)' }}>
          Demo: admin@magicframes.test / password
        </p>
      </div>
    </div>
  );
}
