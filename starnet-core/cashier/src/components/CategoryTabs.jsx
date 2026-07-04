export default function CategoryTabs({ categories, categoryId, setCategoryId, productCount }) {
  const tabs = [{ id: '', name: 'Головна' }, ...categories.map((c) => ({ id: String(c.id), name: c.name }))];

  return (
    <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-ainur-border bg-white px-3 py-2">
      {tabs.map((t) => (
        <button
          key={t.id || 'home'}
          type="button"
          onClick={() => setCategoryId(t.id)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
            categoryId === t.id
              ? 'bg-ainur-blue text-white'
              : 'bg-ainur-bg text-ainur-text hover:bg-blue-50'
          }`}
        >
          {t.name}
          {t.id === '' && productCount != null && (
            <span className="ml-1 text-xs opacity-80">({productCount})</span>
          )}
        </button>
      ))}
    </div>
  );
}
