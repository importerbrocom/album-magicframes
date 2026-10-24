/**
 * Magic Frames brand logo — an inline SVG script wordmark.
 *
 * Inlined (rather than an <img>) so the lettering inherits `currentColor`,
 * letting it adapt to light pages (admin, landing) and the dark Akhila theme
 * alike. To use the exact brand artwork instead, drop a `logo.png` into
 * `frontend/public/` and swap the <svg> below for an <img src="/logo.png" />.
 */
export default function Logo({ className = '', title = 'Magic Frames' }) {
  return (
    <svg
      viewBox="0 0 520 320"
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <text
        x="260"
        y="150"
        fontSize="132"
        textAnchor="middle"
        style={{ fontFamily: "'Great Vibes', cursive" }}
      >
        Magic
      </text>
      <text
        x="260"
        y="268"
        fontSize="132"
        textAnchor="middle"
        style={{ fontFamily: "'Great Vibes', cursive" }}
      >
        Frames
      </text>
      <text
        x="470"
        y="78"
        fontSize="30"
        textAnchor="middle"
        style={{ fontFamily: "'Montserrat', Arial, sans-serif", fontWeight: 500 }}
      >
        ™
      </text>
    </svg>
  );
}
