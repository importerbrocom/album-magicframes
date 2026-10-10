import { useEffect, useState } from 'react';
import { albumService } from '../services/albumService';

/**
 * Public comment section (works for anyone viewing the shared/reshared album).
 * Collects a name + comment and shows the name beside each comment.
 */
export default function CommentBox({ slug }) {
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(() => localStorage.getItem('mf_commenter_name') || '');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = (p = 1) => {
    setLoading(true);
    albumService
      .comments(slug, p)
      .then((res) => {
        setComments((prev) => (p === 1 ? res.data : [...prev, ...res.data]));
        setLastPage(res.last_page || 1);
        setPage(res.current_page || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      const created = await albumService.addComment(slug, { name: name.trim(), body: body.trim() });
      localStorage.setItem('mf_commenter_name', name.trim());
      setComments((prev) => [created, ...prev]);
      setBody('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post your comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="themed-surface p-6">
      <h3 className="font-heading text-2xl">Leave a message</h3>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        Share your wishes — anyone viewing this album can leave a comment.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={80}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm focus:border-current focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment…"
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm focus:border-current focus:outline-none"
        />
        {/* Honeypot (hidden from humans) */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting || !name.trim() || !body.trim()} className="btn-accent text-sm disabled:opacity-50">
          {submitting ? 'Posting…' : 'Post Comment'}
        </button>
      </form>

      <div className="mt-6 space-y-4">
        {comments.length === 0 && !loading && (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Be the first to leave a message.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="border-t border-black/10 pt-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full themed-accent-bg text-sm font-medium">
                {c.name?.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium leading-none">{c.name}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.ago}</p>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm">{c.body}</p>
          </div>
        ))}
        {page < lastPage && (
          <button onClick={() => load(page + 1)} className="text-sm themed-accent-text">
            Load more comments
          </button>
        )}
      </div>
    </section>
  );
}
