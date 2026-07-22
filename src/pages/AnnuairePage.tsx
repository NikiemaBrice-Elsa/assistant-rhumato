import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { MapPin, Phone, Mail, Clock, ChevronDown, ChevronUp, User } from 'lucide-react';

interface Centre {
  nom: string;
  adresse: string;
  jours: string;
  heures: string;
  telephone: string;
}

interface Rhumatologue {
  id: string;
  nom: string;
  prenom: string;
  titre: string;
  photo?: string;
  telephone?: string;
  email?: string;
  centres: Centre[];
  createdAt: string;
}

const RhumatoCard: React.FC<{ rhumato: Rhumatologue }> = ({ rhumato }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card animate-fade" style={{ overflow: 'hidden' }}>
      {/* En-tête */}
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '1rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        {rhumato.photo ? (
          <img src={rhumato.photo} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={24} color="white" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
            {rhumato.titre} {rhumato.prenom} {rhumato.nom}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Rhumatologue · {rhumato.centres.length} centre{rhumato.centres.length > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Contacts directs */}
      {(rhumato.telephone || rhumato.email) && !expanded && (
        <div style={{ display: 'flex', gap: 8, padding: '0 1rem 0.75rem', flexWrap: 'wrap' }}>
          {rhumato.telephone && (
            <a href={`tel:${rhumato.telephone}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>
              <Phone size={13} /> {rhumato.telephone}
            </a>
          )}
        </div>
      )}

      {/* Centres détaillés */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.875rem 1rem' }}>
          {(rhumato.telephone || rhumato.email) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: '0.875rem', flexWrap: 'wrap' }}>
              {rhumato.telephone && (
                <a href={`tel:${rhumato.telephone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                  <Phone size={14} /> {rhumato.telephone}
                </a>
              )}
              {rhumato.email && (
                <a href={`mailto:${rhumato.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                  <Mail size={14} /> {rhumato.email}
                </a>
              )}
            </div>
          )}

          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
            Centres de consultation
          </div>

          <div style={{ display: 'grid', gap: '0.625rem' }}>
            {rhumato.centres.map((centre, i) => (
              <div key={i} style={{
                background: 'var(--surface2)', borderRadius: 10,
                padding: '0.75rem 1rem', border: '1px solid var(--border)',
              }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: 6 }}>
                  {centre.nom}
                </div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {centre.adresse && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <MapPin size={13} style={{ flexShrink: 0, marginTop: 1, color: 'var(--primary)' }} />
                      {centre.adresse}
                    </div>
                  )}
                  {centre.jours && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Clock size={13} style={{ color: 'var(--primary)' }} />
                      <span><strong>{centre.jours}</strong>{centre.heures ? ` · ${centre.heures}` : ''}</span>
                    </div>
                  )}
                  {centre.telephone && (
                    <a href={`tel:${centre.telephone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none' }}>
                      <Phone size={13} /> {centre.telephone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const AnnuairePage: React.FC = () => {
  const [rhumatologues, setRhumatologues] = useState<Rhumatologue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'rhumatologues'), orderBy('nom', 'asc')));
        setRhumatologues(snap.docs.map(d => ({ id: d.id, ...d.data() } as Rhumatologue)));
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = rhumatologues.filter(r =>
    !search || `${r.nom} ${r.prenom} ${r.centres.map(c => c.nom).join(' ')}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Annuaire des Rhumatologues</h1>
        <p className="section-subtitle">Spécialistes disponibles au Burkina Faso</p>
        <div className="search-bar" style={{ marginTop: '0.75rem' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input placeholder="Rechercher par nom, centre..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <User size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <div style={{ fontWeight: 500 }}>
            {search ? 'Aucun résultat pour cette recherche' : 'Annuaire en cours de constitution'}
          </div>
          <div style={{ fontSize: '0.875rem', marginTop: 4 }}>
            {!search && 'Les rhumatologues seront ajoutés par l\'équipe administrative.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.875rem' }}>
          {filtered.map(r => <RhumatoCard key={r.id} rhumato={r} />)}
        </div>
      )}
    </div>
  );
};

export default AnnuairePage;
