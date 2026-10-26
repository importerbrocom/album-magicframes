import { useRef, useState } from 'react';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

/**
 * Profile-photo picker with live preview + client-side type/size validation
 * (the backend re-validates). `onSelect(file)` is called with a valid File, or
 * null when the photo is cleared. In "controlled" mode the parent handles
 * persistence; `currentUrl` shows the already-saved avatar.
 */
export default function AvatarUploader({
  name,
  currentUrl,
  onSelect,
  onRemove,
  size = 96,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  const pick = () => !disabled && inputRef.current?.click();

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    setError('');
    if (!ACCEPT.includes(file.type)) {
      setError('Please choose a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be 5 MB or smaller.');
      return;
    }

    setPreview(URL.createObjectURL(file));
    onSelect?.(file);
  };

  const clear = () => {
    setPreview(null);
    setError('');
    onSelect?.(null);
    onRemove?.();
  };

  const shown = preview || currentUrl;

  return (
    <div className="flex items-center gap-4">
      <div
        onClick={pick}
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-black/10"
        style={{ width: size, height: size, cursor: disabled ? 'default' : 'pointer' }}
      >
        {shown ? (
          <img src={shown} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="font-heading text-xl" style={{ color: 'var(--muted)' }}>
            {initials(name)}
          </span>
        )}
      </div>

      <div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={pick}
            disabled={disabled}
            className="rounded-lg border border-black/15 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {shown ? 'Change photo' : 'Upload photo'}
          </button>
          {shown && (
            <button
              type="button"
              onClick={clear}
              disabled={disabled}
              className="rounded-lg px-3 py-1.5 text-sm text-red-600 disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          JPG, PNG or WEBP · max 5 MB
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(',')}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
