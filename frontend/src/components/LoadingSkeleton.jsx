// Reusable skeleton loaders (spec section 33).

export function CardSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="themed-surface overflow-hidden">
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="space-y-2 p-4">
            <div className="skeleton h-4 w-2/3 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GallerySkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton aspect-square w-full rounded-lg" />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton h-72 w-full rounded-2xl" />
      <div className="skeleton mx-auto h-8 w-56 rounded" />
      <div className="skeleton mx-auto h-4 w-72 rounded" />
    </div>
  );
}
