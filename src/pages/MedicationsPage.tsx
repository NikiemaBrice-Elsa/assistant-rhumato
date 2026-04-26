import React, { useState, useMemo } from 'react';
import { Search, X, Check, AlertCircle } from 'lucide-react';
import { MEDICATIONS_DATA, MEDICATION_CLASSES } from '../data/medications';
import type { Medication } from '../types';

const MedModal: React.FC<{ med: Medication; onClose: () => void }> = ({ med, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" style={{ maxWidth: 600, padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>
            {med.dci}
          </h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-blue">{med.classe}</span>
            {med.disponibleLocalement
              ? <span className="badge badge-green">✓ Disponible localement</span>
              : <span className="badge badge-gray">Import requis</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <X size={20} />
        </button>
      </div>

      {/* Noms commerciaux */}
      {med.nomCommercial.length > 0 && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--primary-light)', borderRadius: 8 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>Noms commerciaux</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text)' }}>{med.nomCommercial.join(' · ')}</div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '0.875rem' }}>
        <InfoRow icon="💊" label="Posologie" value={med.posologie} />
        <InfoRow icon="🚫" label="Contre-indications" value={med.contreIndications.join(', ')} color="#dc2626" />
        <InfoRow icon="⚠️" label="Effets secondaires" value={med.effetsSecondaires.join(', ')} />
        <InfoRow icon="💰" label="Prix indicatif" value={med.prixIndicatif} />
      </div>

      <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem' }}>
        Fermer
      </button>
    </div>
  </div>
);

const InfoRow: React.FC<{ icon: string; label: string; value: string; color?: string }> = ({ icon, label, value, color }) => (
  <div>
    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
      {icon} {label}
    </div>
    <div style={{ fontSize: '0.875rem', color: color || 'var(--text)', lineHeight: 1.5 }}>{value}</div>
  </div>
);

const MedicationsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [classe, setClasse] = useState('Tous');
  const [localOnly, setLocalOnly] = useState(false);
  const [selected, setSelected] = useState<Medication | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MEDICATIONS_DATA.filter(m => {
      if (!m.actif) return false;
      if (localOnly && !m.disponibleLocalement) return false;
      if (classe !== 'Tous' && m.classe !== classe) return false;
      if (q && !(
        m.dci.toLowerCase().includes(q) ||
        m.nomCommercial.some(n => n.toLowerCase().includes(q)) ||
        m.classe.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [search, classe, localOnly]);

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Médicaments courants</h1>
        <p className="section-subtitle">Base de données des médicaments d'usage courant en rhumatologie</p>

        <div className="search-bar" style={{ marginBottom: '0.75rem' }}>
          <Search size={16} color="var(--text-muted)" />
          <input placeholder="Rechercher par DCI, nom commercial..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={classe}
            onChange={e => setClasse(e.target.value)}
            className="input"
            style={{ width: 'auto', minWidth: 180 }}
          >
            {MEDICATION_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => setLocalOnly(!localOnly)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.55rem 0.875rem',
              border: `1.5px solid ${localOnly ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 8,
              background: localOnly ? '#dcfce7' : 'var(--surface)',
              color: localOnly ? '#15803d' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {localOnly ? <Check size={14} /> : <AlertCircle size={14} />}
            Disponible localement
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        {filtered.length} médicament{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
      </div>

      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {filtered.map(med => (
          <button
            key={med.id}
            onClick={() => setSelected(med)}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '0.875rem 1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.15s', width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
            }}>
              💊
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>
                {med.dci}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {med.nomCommercial.slice(0, 2).join(' · ')}
                {med.nomCommercial.length > 2 ? ` +${med.nomCommercial.length - 2}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{med.classe.split(' ')[0]}</span>
              {med.disponibleLocalement && (
                <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Local</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {selected && <MedModal med={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default MedicationsPage;
