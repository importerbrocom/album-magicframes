import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';

/**
 * Shown when a staff member logs in with a temporary password. They cannot
 * reach any other screen until a new password is set (enforced server-side too).
 */
export default function FirstLoginPassword() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  usePageMeta({ title: 'Set a New Password | Magic Frames' });

  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Safety: if an already-cleared user lands here, send them on.
  useEffect(() => {
    if (user && !user.must_change_password) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await adminService.changePassword(pw);
      await refreshUser();
      toast.success('Password updated. Welcome!');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      toast.error(err.response?.data?.message || 'Could not set password.');
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k) => errors[k]?.[0];

  return (
    <div data-theme="modern" className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="themed-surface w-full max-w-sm p-8">
        <h1 className="font-heading text-2xl font-semibold">Set a new password</h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
          For your security, please replace the temporary password before continuing.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <Field label="Temporary (current) password" error={err('current_password')}>
            <input
              type="password"
              value={pw.current_password}
              onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))}
              className="inp"
            />
          </Field>
          <Field label="New password" error={err('password')}>
            <input
              type="password"
              value={pw.password}
              onChange={(e) => setPw((p) => ({ ...p, password: e.target.value }))}
              className="inp"
            />
          </Field>
          <Field label="Confirm new password" error={err('password_confirmation')}>
            <input
              type="password"
              value={pw.password_confirmation}
              onChange={(e) => setPw((p) => ({ ...p, password_confirmation: e.target.value }))}
              className="inp"
            />
          </Field>
          <button type="submit" disabled={submitting} className="btn-accent w-full !rounded-lg disabled:opacity-50">
            {submitting ? 'Saving…' : 'Set Password & Continue'}
          </button>
        </form>
        <button onClick={() => logout().then(() => navigate('/admin/login'))} className="mt-4 text-xs text-red-600">
          Log out
        </button>
        <style>{`.inp{width:100%;border:1px solid rgba(0,0,0,.15);border-radius:.5rem;padding:.6rem .75rem;font-size:.9rem;outline:none;background:transparent}.inp:focus{border-color:var(--text)}`}</style>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
