function ProductSkeleton() {
  return (
    <article className="product-card skeleton-card">
      <div className="product-media skeleton-pulse"></div>
      <div className="product-info">
        <div>
          <div className="skeleton-line skeleton-title skeleton-pulse"></div>
          <div className="skeleton-line skeleton-pulse" style={{ width: '80%' }}></div>
          <div className="skeleton-line skeleton-pulse" style={{ width: '60%' }}></div>
        </div>
        <div className="product-footer">
          <div className="skeleton-price skeleton-pulse"></div>
          <div className="skeleton-button skeleton-pulse"></div>
        </div>
      </div>
    </article>
  );
}

export default ProductSkeleton;
