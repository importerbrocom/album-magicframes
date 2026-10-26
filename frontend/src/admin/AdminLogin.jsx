import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import Logo from '../components/Logo';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  usePageMeta({ title: 'Sign in | Magic Frames' });

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
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Left brand panel */}
      <div className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden bg-[#161c2d] md:min-h-screen">
        {/* Decorative circles */}
        <span className="pointer-events-none absolute left-[-40px] top-10 h-40 w-40 rounded-full bg-white/5" />
        <span className="pointer-events-none absolute bottom-[-60px] right-10 h-64 w-64 rounded-full bg-white/5" />
        <span className="pointer-events-none absolute bottom-24 left-24 h-24 w-24 rounded-full bg-white/5" />
        <div className="relative z-10 text-center">
          {/* Real uploaded logo (/logo.png) with SVG fallback */}
          <Logo className="mx-auto h-40 w-auto" />
          <p className="mt-2 text-[0.7rem] uppercase tracking-[0.35em] text-white/70">magicframes.co.in</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account to continue</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-gray-900 focus:border-gray-900 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 pr-10 text-gray-900 focus:border-gray-900 focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
            </div>

            <div className="flex items-center justify-between gap-4">
              <a href="#" className="text-sm text-gray-700 underline">Forgot your password?</a>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-[#161c2d] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-50"
              >
                {submitting ? 'Signing in…' : 'Log In'}
              </button>
            </div>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200" />
            or continue with
            <span className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={() => setError('Google sign-in is not configured yet.')}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <GoogleG /> Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-gray-400">
            Demo: admin@magicframes.test / password
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.2 13.3 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z" />
      <path fill="#FBBC05" d="M10.4 28.3c-.5-1.4-.8-2.9-.8-4.3s.3-3 .8-4.3l-7.8-6.1C1 16.6 0 20.2 0 24s1 7.4 2.6 10.4l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.5l-7.1-5.5c-2 1.3-4.5 2.1-8.2 2.1-6.4 0-11.8-3.8-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
