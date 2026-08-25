export default function CategoriesLoading() {
  return (
    <section>
      <div
        style={{
          height: 40,
          marginBottom: 24,
          borderRadius: "var(--ps-radius-md, 6px)",
          background: "var(--ps-neutral-100)",
        }}
      />
      <div style={{ display: "grid", gap: 16 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 72,
              borderRadius: "var(--ps-radius-lg, 8px)",
              background: "var(--ps-neutral-100)",
            }}
          />
        ))}
      </div>
    </section>
  );
}