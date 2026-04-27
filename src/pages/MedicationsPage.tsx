import React, { useState, useMemo } from 'react';
import { Search, X, Check, AlertCircle, Plus, Calendar } from 'lucide-react';
import { MEDICATIONS_DATA, MEDICATION_CLASSES } from '../data/medications';
import type { Medication, NomCommercialEntry } from '../types';
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

// ─── Modal détail médicament ──────────────────────────────────────

const MedModal: React.FC<{ med: Medication; onClose: () => void; isAdmin: boolean; onUpdate: () => void }> = ({ med, onClose, isAdmin, onUpdate }) => {
  const [showAddName, setShowAddName] = useState(false);
  const [newNom, setNewNom] = useState('');
  const [newDateDebut, setNewDateDebut] = useState('');
  const [newDateFin, setNewDateFin] = useState('');
  const [saving, setSaving] = useState(false);
  const [localNames, setLocalNames] = useState<NomCommercialEntry[]>(med.nomsCommerciaux || med.nomCommercial.map(n => ({ nom: n })));

  const handleAddNom = async () => {
    if (!newNom.trim()) return;
    setSaving(true);
    try {
      const entry: NomCommercialEntry = { nom: newNom.trim(), dateDebut: newDateDebut || undefined, dateFin: newDateFin || undefined };
      await addDoc(collection(db, 'medications_noms', med.id, 'noms'), entry);
      setLocalNames(prev => [...prev, entry]);
      setNewNom(''); setNewDateDebut(''); setNewDateFin('');
      setShowAddName(false);
      onUpdate();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const isExpired = (dateFin?: string) => dateFin ? new Date(dateFin) < new Date() : false;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600, padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>{med.dci}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="badge badge-blue">{med.classe}</span>
              {med.disponibleLocalement
                ? <span className="badge badge-green">Disponible localement</span>
                : <span className="badge badge-gray">Import requis</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Noms commerciaux avec dates */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Noms commerciaux
            </div>
            {isAdmin && (
              <button onClick={() => setShowAddName(!showAddName)} className="btn-ghost" style={{ padding: '3px 10px', fontSize: '0.75rem' }}>
                <Plus size={12} /> Ajouter
              </button>
            )}
          </div>

          {/* Formulaire ajout */}
          {showAddName && (
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem', marginBottom: 8, border: '1px solid var(--border)' }}>
              <input className="input" placeholder="Nom commercial *" value={newNom} onChange={e => setNewNom(e.target.value)} style={{ marginBottom: 6 }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Date début</div>
                  <input className="input" type="date" value={newDateDebut} onChange={e => setNewDateDebut(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Date fin (expiration)</div>
                  <input className="input" type="date" value={newDateFin} onChange={e => setNewDateFin(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={handleAddNom} disabled={!newNom.trim() || saving} className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem' }}>
                  {saving ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Check size={12} />} Enregistrer
                </button>
                <button onClick={() => setShowAddName(false)} className="btn-ghost" style={{ fontSize: '0.8rem', padding: '0.4rem 0.875rem' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Liste noms */}
          {localNames.length === 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
              {isAdmin ? 'Aucun nom commercial. Cliquez sur "+ Ajouter" pour en ajouter un.' : 'Aucun nom commercial enregistré.'}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {localNames.map((n, i) => {
              const expired = isExpired(n.dateFin);
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px',
                  background: expired ? '#fef2f2' : 'var(--primary-light)',
                  borderRadius: 6,
                  border: `1px solid ${expired ? '#fca5a5' : '#bfdbfe'}`,
                  opacity: expired ? 0.75 : 1,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, color: expired ? '#b91c1c' : '#1d4ed8' }}>{n.nom}</div>
                    {(n.dateDebut || n.dateFin) && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {n.dateDebut && <span><Calendar size={10} style={{ display: 'inline', marginRight: 2 }} />Depuis {formatDate(n.dateDebut)}</span>}
                        {n.dateFin && <span style={{ color: expired ? '#b91c1c' : '#15803d' }}>
                          {expired ? 'Expiré' : 'Jusqu\'au'} {formatDate(n.dateFin)}
                        </span>}
                      </div>
                    )}
                  </div>
                  {expired && <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>Expiré</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Infos médicales */}
        <div style={{ display: 'grid', gap: '0.875rem' }}>
          <InfoRow label="Posologie" value={med.posologie} />
          <InfoRow label="Contre-indications" value={med.contreIndications.join(', ')} danger />
          <InfoRow label="Effets secondaires" value={med.effetsSecondaires.join(', ')} />
        </div>

        <button onClick={onClose} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem' }}>
          Fermer
        </button>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; danger?: boolean }> = ({ label, value, danger }) => (
  <div>
    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
    <div style={{ fontSize: '0.875rem', color: danger ? '#dc2626' : 'var(--text)', lineHeight: 1.5 }}>{value}</div>
  </div>
);

// ─── Page principale ─────────────────────────────────────────────

const MedicationsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [classe, setClasse] = useState('Tous');
  const [localOnly, setLocalOnly] = useState(false);
  const [selected, setSelected] = useState<Medication | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [search, classe, localOnly, refreshKey]);

  // Group by class
  const grouped = useMemo(() => {
    if (classe !== 'Tous') return { [classe]: filtered };
    const g: Record<string, Medication[]> = {};
    filtered.forEach(m => {
      if (!g[m.classe]) g[m.classe] = [];
      g[m.classe].push(m);
    });
    return g;
  }, [filtered, classe]);

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Médicaments courants</h1>
        <p className="section-subtitle">Rhumatologie — {MEDICATIONS_DATA.length} molécules référencées</p>

        <div className="search-bar" style={{ marginBottom: '0.75rem' }}>
          <Search size={16} color="var(--text-muted)" />
          <input placeholder="Rechercher par DCI, nom commercial..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={classe} onChange={e => setClasse(e.target.value)} className="input" style={{ width: 'auto', minWidth: 200 }}>
            {MEDICATION_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={() => setLocalOnly(!localOnly)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.55rem 0.875rem',
            border: `1.5px solid ${localOnly ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 8,
            background: localOnly ? '#dcfce7' : 'var(--surface)',
            color: localOnly ? '#15803d' : 'var(--text-muted)',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            {localOnly ? <Check size={14} /> : <AlertCircle size={14} />}
            Disponible localement
          </button>
        </div>
      </div>

      {Object.entries(grouped).map(([groupName, meds]) => (
        <div key={groupName} style={{ marginBottom: '1.5rem' }}>
          {classe === 'Tous' && (
            <div style={{
              fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.85rem',
              color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: '0.25rem 0', marginBottom: '0.5rem',
              borderBottom: '2px solid var(--border)',
            }}>
              {groupName} <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>({meds.length})</span>
            </div>
          )}
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {meds.map(med => (
              <button key={med.id} onClick={() => setSelected(med)} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '0.875rem 1rem',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s', width: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a6bb5" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M10.5 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7"/><path d="M8 12h8M12 8v8"/><circle cx="18" cy="18" r="4"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>{med.dci}</div>
                  {med.nomCommercial.filter(Boolean).length > 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {med.nomCommercial.slice(0, 3).join(' · ')}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                      Aucun nom commercial
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  {med.disponibleLocalement && <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Local</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '1rem' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <div style={{ fontWeight: 500 }}>Aucun résultat</div>
        </div>
      )}

      {selected && <MedModal med={selected} onClose={() => setSelected(null)} isAdmin={isAdmin} onUpdate={() => setRefreshKey(k => k + 1)} />}
    </div>
  );
};

export default MedicationsPage;
