import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ChevronDown, ChevronUp, FileText, Stethoscope, Pill, Phone } from 'lucide-react';
import { CATS_DATA } from '../data/cats';

const Section: React.FC<{ title: string; icon: React.ReactNode; items: string[]; color: string; bg: string; defaultOpen?: boolean }> = ({
  title, icon, items, color, bg, defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: '0.75rem', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.875rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
            {icon}
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{title}</span>
        </div>
        {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border)' }}>
          <ul style={{ margin: '0.75rem 0 0', padding: 0, listStyle: 'none' }}>
            {items.map((item, i) => (
              <li key={i} style={{
                display: 'flex', gap: 8, padding: '0.4rem 0',
                borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5,
              }}>
                <span style={{ color, flexShrink: 0, marginTop: 2 }}>•</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const CATDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cat = CATS_DATA.find(c => c.id === id);

  if (!cat) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <div style={{ fontSize: 48 }}>❓</div>
        <div style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' }}>Fiche non trouvée</div>
        <Link to="/cats" className="btn-primary">Retour aux CAT</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ marginBottom: '0.75rem', padding: '0.4rem 0.75rem' }}>
          <ArrowLeft size={16} /> Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(26,107,181,0.3)',
          }}>
            {cat.icon}
          </div>
          <div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>
              {cat.title}
            </h1>
            <span className="badge badge-blue">{cat.category}</span>
          </div>
        </div>
      </div>

      {/* Signes d'alerte - always prominent */}
      <div style={{
        background: '#fef2f2',
        border: '1.5px solid #fca5a5',
        borderRadius: 'var(--radius)',
        padding: '1rem',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
          <AlertTriangle size={18} color="#dc2626" />
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: '#dc2626', fontSize: '0.95rem' }}>
            Signes d'alerte
          </span>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {cat.signesAlerte.map((s, i) => (
            <li key={i} style={{
              fontSize: '0.85rem', color: '#7f1d1d',
              padding: '0.3rem 0',
              borderBottom: i < cat.signesAlerte.length - 1 ? '1px solid #fca5a5' : 'none',
              lineHeight: 1.5,
            }}>
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Sections */}
      <Section title="Interrogatoire clé" icon={<FileText size={14} />} items={cat.interrogatoire} color="var(--primary)" bg="var(--primary-light)" />
      <Section title="Examen clinique" icon={<Stethoscope size={14} />} items={cat.examenClinique} color="#16a085" bg="#e0f5f0" />

      {/* Diagnostics */}
      <Section
        title="Hypothèses diagnostiques"
        icon={<span style={{ fontSize: 12 }}>🔬</span>}
        items={cat.diagnostics}
        color="#7c3aed"
        bg="#ede9fe"
      />

      {/* Bilan */}
      <Section
        title="Bilan de première intention"
        icon={<span style={{ fontSize: 12 }}>📋</span>}
        items={cat.bilan}
        color="#b45309"
        bg="#fef3c7"
      />

      {/* Ordonnance */}
      <div className="card" style={{ marginBottom: '0.75rem', overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border)' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pill size={14} color="#15803d" />
          </div>
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
            Ordonnance possible
          </span>
        </div>
        <div style={{ padding: '0.75rem 1rem' }}>
          {cat.ordonnance.map((ord, i) => (
            <div key={i} style={{
              padding: '0.75rem',
              background: 'var(--surface2)',
              borderRadius: 8,
              marginBottom: i < cat.ordonnance.length - 1 ? '0.5rem' : 0,
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <strong style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{ord.medicament}</strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {ord.posologie} — {ord.duree}
                  </div>
                </div>
              </div>
              {ord.note && (
                <div style={{
                  marginTop: '0.5rem', padding: '0.4rem 0.6rem',
                  background: '#fef3c7', borderRadius: 4,
                  fontSize: '0.78rem', color: '#92400e',
                }}>
                  ℹ️ {ord.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quand référer */}
      <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
          <Phone size={16} color="#15803d" />
          <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.9rem', color: '#15803d' }}>
            Quand référer au rhumatologue ?
          </span>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {cat.quandReferer.map((r, i) => (
            <li key={i} style={{
              display: 'flex', gap: 8, fontSize: '0.875rem',
              color: '#166534', padding: '0.3rem 0',
              borderBottom: i < cat.quandReferer.length - 1 ? '1px solid #bbf7d0' : 'none',
              lineHeight: 1.5,
            }}>
              <span>→</span><span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CATDetailPage;
