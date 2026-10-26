import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { adminService } from '../services/adminService';

/**
 * Forced password change on first login. Reached only when the authenticated
 * user has must_change_password = true (enforced by RequireAuth + the backend
 * account.active middleware). No current password is required here.
 */
export default function FirstLogin() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  usePageMeta({ title: 'Set your password | Admin' });

  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If somehow reached without the flag, send to the dashboard.
  if (user && !user.must_change_password) {
    navigate('/admin/dashboard', { replace: true });
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPw !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await adminService.changePassword({
        password: newPw,
        password_confirmation: confirmPw,
      });
      updateUser({ ...user, must_change_password: false });
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not set your password.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Set a new password</h1>
        <p className="mt-1 text-sm text-gray-500">
          For security, please choose a new password before continuing.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
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
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
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
            {submitting ? 'Saving…' : 'Set password & continue'}
          </button>
          <button type="button" onClick={cancel} className="w-full text-center text-sm text-gray-500">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
