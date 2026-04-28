import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Star, Send, Check } from 'lucide-react';

interface EvaluationData {
  userId: string;
  rating: number; // 1-5
  facilite: number;
  utilite: number;
  contenu: number;
  commentaire: string;
  createdAt: string;
}

const CRITERIA = [
  { key: 'facilite', label: "Facilité d'utilisation" },
  { key: 'utilite', label: 'Utilité clinique' },
  { key: 'contenu', label: 'Qualité du contenu' },
];

const StarRating: React.FC<{ value: number; onChange: (v: number) => void; size?: number }> = ({ value, onChange, size = 28 }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map(n => (
      <button key={n} onClick={() => onChange(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, transition: 'transform 0.1s' }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
        <Star size={size} fill={n <= value ? '#f59e0b' : 'none'} stroke={n <= value ? '#f59e0b' : '#d1d5db'} strokeWidth={1.5} />
      </button>
    ))}
  </div>
);

const EvaluationPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState<{ avg: number; count: number; dist: number[] } | null>(null);
  const [form, setForm] = useState({ rating: 0, facilite: 0, utilite: 0, contenu: 0, commentaire: '' });

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, 'evaluations'));
        const all = snap.docs.map(d => d.data() as EvaluationData);

        // Stats globales
        if (all.length > 0) {
          const avg = all.reduce((s, e) => s + e.rating, 0) / all.length;
          const dist = [1, 2, 3, 4, 5].map(n => all.filter(e => e.rating === n).length);
          setStats({ avg: Math.round(avg * 10) / 10, count: all.length, dist });
        }

        // Déjà évalué ?
        const mine = all.find(e => e.userId === currentUser?.uid);
        if (mine) setAlreadyDone(true);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [currentUser]);

  const handleSubmit = async () => {
    if (form.rating === 0) { alert('Veuillez donner une note globale.'); return; }
    setSending(true);
    try {
      await addDoc(collection(db, 'evaluations'), {
        userId: currentUser!.uid,
        userName: currentUser!.displayName || 'Médecin',
        ...form,
        createdAt: new Date().toISOString(),
      });
      setDone(true);
      setAlreadyDone(true);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Évaluation de l'application</h1>
        <p className="section-subtitle">Votre avis nous aide à améliorer l'Assistant Rhumato</p>
      </div>

      {/* Stats globales */}
      {stats && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '3rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{stats.avg}</div>
              <StarRating value={Math.round(stats.avg)} onChange={() => {}} size={16} />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{stats.count} avis</div>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              {[5, 4, 3, 2, 1].map(n => {
                const cnt = stats.dist[n - 1];
                const pct = stats.count > 0 ? Math.round((cnt / stats.count) * 100) : 0;
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 8 }}>{n}</span>
                    <Star size={11} fill="#f59e0b" stroke="#f59e0b" />
                    <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: '#f59e0b', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {done ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Check size={28} color="#15803d" />
          </div>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Merci pour votre évaluation !</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Votre retour contribue à l'amélioration continue de l'application.</p>
        </div>
      ) : alreadyDone ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Star size={28} color="var(--primary)" />
          </div>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' }}>Vous avez déjà évalué l'application</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Merci pour votre contribution !</p>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', margin: '0 0 1.25rem', color: 'var(--text)' }}>
            Évaluer l'application
          </h3>

          {/* Note globale */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Note globale *
            </div>
            <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} size={36} />
            {form.rating > 0 && (
              <div style={{ marginTop: 6, fontSize: '0.82rem', color: '#f59e0b', fontWeight: 500 }}>
                {['', 'Très insuffisant', 'Insuffisant', 'Correct', 'Bien', 'Excellent'][form.rating]}
              </div>
            )}
          </div>

          {/* Critères */}
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.25rem' }}>
            {CRITERIA.map(c => (
              <div key={c.key}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text)', marginBottom: 6 }}>{c.label}</div>
                <StarRating value={(form as any)[c.key]} onChange={v => setForm(f => ({ ...f, [c.key]: v }))} size={24} />
              </div>
            ))}
          </div>

          {/* Commentaire */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Commentaire (optionnel)
            </div>
            <textarea
              className="input"
              placeholder="Suggestions, remarques, fonctionnalités souhaitées..."
              value={form.commentaire}
              onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
              rows={4}
            />
          </div>

          <button onClick={handleSubmit} disabled={form.rating === 0 || sending} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {sending ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={16} />}
            Envoyer mon évaluation
          </button>
        </div>
      )}
    </div>
  );
};

export default EvaluationPage;
