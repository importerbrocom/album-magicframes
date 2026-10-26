// Circular profile photo with initials fallback. Used across profile + staff.
function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export default function Avatar({ src, name = '', size = 40, className = '' }) {
  const dim = { width: size, height: size };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Profile photo'}
        style={dim}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      style={{ ...dim, fontSize: size * 0.4 }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-black/10 font-medium text-black/60 ${className}`}
      aria-label={name || 'Profile photo'}
    >
      {initials(name) || '?'}
    </span>
  );
}
