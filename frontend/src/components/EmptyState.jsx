// Friendly empty states (spec section 32).
export default function EmptyState({ icon = '🖼️', title, message, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 text-5xl opacity-70">{icon}</div>
      <h3 className="font-heading text-2xl">{title}</h3>
      {message && <p className="mt-2 max-w-sm text-sm" style={{ color: 'var(--muted)' }}>{message}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
