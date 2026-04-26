import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { CATS_DATA, CATEGORIES } from '../data/cats';

const CATListPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Tous');

  const filtered = useMemo(() => {
    return CATS_DATA.filter(cat => {
      const matchCat = category === 'Tous' || cat.category === category;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        cat.title.toLowerCase().includes(q) ||
        cat.tags.some(t => t.toLowerCase().includes(q)) ||
        cat.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, category]);

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Conduites à tenir — Rhumatologie</h1>
        <p className="section-subtitle">Fiches cliniques pour la prise en charge initiale en médecine générale</p>

        {/* Search */}
        <div className="search-bar" style={{ marginBottom: '0.75rem' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            placeholder="Rechercher une pathologie..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: '0.3rem 0.875rem',
                borderRadius: 20,
                border: '1.5px solid',
                borderColor: category === cat ? 'var(--primary)' : 'var(--border)',
                background: category === cat ? 'var(--primary)' : 'var(--surface)',
                color: category === cat ? 'white' : 'var(--text-muted)',
                fontSize: '0.8rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>🔍</div>
          <div style={{ fontWeight: 500 }}>Aucun résultat</div>
          <div style={{ fontSize: '0.875rem', marginTop: 4 }}>Essayez un autre terme de recherche</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {filtered.map(cat => (
            <Link
              key={cat.id}
              to={`/cats/${cat.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.25rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 12,
                background: 'var(--primary-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', marginBottom: 2 }}>
                  {cat.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{cat.category}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {cat.signesAlerte.length} signes d'alerte
                  </span>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CATListPage;
