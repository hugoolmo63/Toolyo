export default function CategoriesLoading() {
  return (
    <section aria-busy="true">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton-stack">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton skeleton-row" />
        ))}
      </div>
    </section>
  );
}
