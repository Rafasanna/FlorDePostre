function CategoryFilter({ categories, activeCategory, onChange }) {
  return (
    <div className="category-filter" aria-label="Categorias de productos">
      {categories.map((category) => (
        <button
          key={category}
          className={category === activeCategory ? "active" : ""}
          type="button"
          onClick={() => onChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
