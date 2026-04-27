import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Pill, Share2, Calendar, ArrowRight } from 'lucide-react';
import { MedIcon, CAT_ICON_MAP } from '../components/ui/MedIcons';

const CATS_QUICK = [
  { id: 'lombalgie', label: 'Lombalgie', icon: 'bone' },
  { id: 'goutte', label: 'Goutte', icon: 'crystal' },
  { id: 'sciatique', label: 'Sciatique', icon: 'nerve' },
  { id: 'arthrite-aigue', label: 'Arthrite aiguë', icon: 'joint' },
  { id: 'osteoporose', label: 'Ostéoporose', icon: 'bone' },
  { id: 'gonalgie', label: 'Gonalgie', icon: 'knee' },
];

const HomePage: React.FC = () => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="animate-fade">
      {/* Hero greeting */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #0d5299 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', right: 20, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="" style={{ width: 42, height: 42, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)' }} />
            ) : (
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {currentUser?.displayName?.charAt(0) || '👨‍⚕️'}
              </div>
            )}
            <div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{greeting},</div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>
                Dr. {currentUser?.displayName?.split(' ').slice(-1)[0] || 'Médecin'}
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9, lineHeight: 1.5 }}>
            {isAdmin ? 'Accès administrateur actif · ' : ''}
            {userProfile?.city ? `Ville : ${userProfile.city}` : ''}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem', marginBottom: '1.5rem',
      }}>
        {[
          { to: '/cats', icon: FileText, label: 'CAT Rhumatologie', desc: '10 fiches cliniques', color: 'var(--primary)', bg: 'var(--primary-light)' },
          { to: '/medicaments', icon: Pill, label: 'Médicaments', desc: '20 médicaments', color: '#16a085', bg: '#e0f5f0' },
          { to: '/cas-cliniques', icon: Share2, label: 'Cas cliniques', desc: 'Communauté', color: '#7c3aed', bg: '#ede9fe' },
          { to: '/evenements', icon: Calendar, label: 'Évènements', desc: 'Formations & congrès', color: '#b45309', bg: '#fef3c7' },
        ].map(item => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              display: 'flex', flexDirection: 'column',
              padding: '1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              transition: 'all 0.2s',
              gap: 4,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 4,
            }}>
              <item.icon size={17} style={{ color: item.color }} />
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Quick CAT access */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', margin: 0, color: 'var(--text)' }}>
              Accès rapide — CAT
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Conduites à tenir fréquentes</p>
          </div>
          <Link to="/cats" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none' }}>
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {CATS_QUICK.map(cat => (
            <Link
              key={cat.id}
              to={`/cats/${cat.id}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '0.75rem 0.5rem',
                background: CAT_ICON_MAP[cat.icon]?.bg || '#e8f2fb',
                borderRadius: 8,
                textDecoration: 'none',
                gap: 6,
                transition: 'all 0.15s',
                border: '1px solid transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <MedIcon name={cat.icon} size={22} color={CAT_ICON_MAP[cat.icon]?.color || '#1a6bb5'} />
              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--text)', textAlign: 'center', lineHeight: 1.2 }}>
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Info banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        border: '1px solid #bbf7d0',
        borderRadius: 'var(--radius)',
        padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>💡</div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#15803d', marginBottom: 2 }}>
            Rappel clinique
          </div>
          <div style={{ fontSize: '0.8rem', color: '#166534', lineHeight: 1.5 }}>
            Tout genou chaud et fébrile doit faire évoquer une <strong>arthrite septique</strong> jusqu'à preuve du contraire. 
            Une ponction articulaire urgente s'impose.
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
