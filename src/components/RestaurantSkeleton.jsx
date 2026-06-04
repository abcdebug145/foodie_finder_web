export default function RestaurantSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-media skeleton" />
      <div className="skeleton-body">
        <div className="skeleton-meta">
          <div className="skeleton-badge skeleton" />
          <div className="skeleton-rating skeleton" />
        </div>
        <div className="skeleton-title skeleton" />
        <div className="skeleton-address skeleton" />
        <div className="skeleton-tags">
          <div className="skeleton-tag skeleton" />
          <div className="skeleton-tag skeleton" />
          <div className="skeleton-tag skeleton" />
        </div>
      </div>
    </div>
  );
}
