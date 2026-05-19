function ProductBadge({ label, type = "default" }) {
  return <span className={`product-badge product-badge-${type}`}>{label}</span>;
}

export default ProductBadge;
