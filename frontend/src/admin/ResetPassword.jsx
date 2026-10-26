import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { useToast } from '../contexts/ToastContext';
import { usePageMeta } from '../hooks/usePageMeta';

export default function ResetPassword() {
  usePageMeta({ title: 'Reset Password | Magic Frames' });
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const token = params.get('token') || '';
  const emailFromLink = params.get('email') || '';

  const [form, setForm] = useState({
    email: emailFromLink,
    password: '',
    password_confirmation: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await adminService.resetPassword({ ...form, token });
      toast.success('Password reset. Please sign in.');
      navigate('/admin/login', { replace: true });
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      toast.error(err.response?.data?.message || 'Could not reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const err = (k) => errors[k]?.[0];

  return (
    <div data-theme="modern" className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="themed-surface w-full max-w-sm p-8">
        <h1 className="font-heading text-2xl font-semibold">Reset password</h1>
        {!token ? (
          <>
            <p className="mt-4 text-sm text-red-600">This reset link is invalid or has expired.</p>
            <Link to="/admin/forgot-password" className="btn-accent mt-6 inline-block !rounded-lg text-sm">
              Request a new link
            </Link>
          </>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="inp"
              />
              {err('email') && <p className="mt-1 text-xs text-red-600">{err('email')}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">New password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="inp"
              />
              {err('password') && <p className="mt-1 text-xs text-red-600">{err('password')}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm">Confirm new password</label>
              <input
                type="password"
                value={form.password_confirmation}
                onChange={(e) => setForm((f) => ({ ...f, password_confirmation: e.target.value }))}
                className="inp"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-accent w-full !rounded-lg disabled:opacity-50">
              {submitting ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        )}
        <style>{`.inp{width:100%;border:1px solid rgba(0,0,0,.15);border-radius:.5rem;padding:.6rem .75rem;font-size:.9rem;outline:none;background:transparent}.inp:focus{border-color:var(--text)}`}</style>
      </div>
    </div>
  );
}
