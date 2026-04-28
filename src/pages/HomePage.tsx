import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Pill, Share2, Calendar, ArrowRight, X, ExternalLink } from 'lucide-react';
import { MedIcon, CAT_ICON_MAP } from '../components/ui/MedIcons';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Ad } from '../types';

const CATS_QUICK = [
  { id: 'lombalgie', label: 'Lombalgie', icon: 'bone' },
  { id: 'goutte', label: 'Goutte', icon: 'crystal' },
  { id: 'sciatique', label: 'Sciatique', icon: 'nerve' },
  { id: 'arthrite-aigue', label: 'Arthrite aiguë', icon: 'joint' },
  { id: 'osteoporose', label: 'Ostéoporose', icon: 'bone' },
  { id: 'gonalgie', label: 'Gonalgie', icon: 'knee' },
];

// ─── Bannière pub ─────────────────────────────────────────────────
const AdBanner: React.FC<{ ad: Ad; onClose: () => void }> = ({ ad, onClose }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onClose(); }, 5000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const content = (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, width: 'calc(100% - 2rem)', maxWidth: 480,
      background: 'white', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      border: '1px solid var(--border)', overflow: 'hidden',
      animation: 'slideUp 0.3s ease',
    }}>
      {ad.imageUrl && (
        <img src={ad.imageUrl} alt={ad.title} style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ padding: '0.875rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              {ad.laboName} · Publicité
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', fontFamily: 'Sora, sans-serif' }}>{ad.title}</div>
            {ad.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.4 }}>{ad.description}</div>}
          </div>
          <button onClick={e => { e.stopPropagation(); setVisible(false); onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 0 0 8px', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>
        {(ad as any).lienUrl && (
          <div style={{ marginTop: '0.5rem' }}>
            <a href={(ad as any).lienUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
              <ExternalLink size={12} /> En savoir plus
            </a>
          </div>
        )}
        {/* Barre de progression 5s */}
        <div style={{ marginTop: 8, height: 3, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: 'var(--primary)', borderRadius: 2, animation: 'adProgress 5s linear forwards' }} />
        </div>
      </div>
    </div>
  );

  return (ad as any).lienUrl ? (
    <a href={(ad as any).lienUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      {content}
    </a>
  ) : <>{content}</>;
};

const HomePage: React.FC = () => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [adIndex, setAdIndex] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const snap = await getDocs(query(collection(db, 'ads'), where('status', '==', 'active')));
        const activeAds = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Ad))
          .filter(a => {
            if (a.expiresAt && a.expiresAt < today) return false;
            // Filtrer par zone: si zones définies, doit inclure 'home'
            const zones = (a as any).zones as string[] | undefined;
            if (zones && zones.length > 0 && !zones.includes('home')) return false;
            return true;
          });

        // Gestion fréquence : max 3 affichages/jour, intervalle min 2h par pub, 10min entre pubs
        const now = Date.now();
        const storageKey = 'ar_ads_log';
        let log: {id: string; ts: number}[] = [];
        try { log = JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch {}
        // Nettoyer les logs de plus de 24h
        log = log.filter(l => now - l.ts < 24 * 60 * 60 * 1000);

        // Dernière pub affichée (toutes confondues)
        const lastAnyTs = log.length > 0 ? Math.max(...log.map(l => l.ts)) : 0;
        const minBetweenDiff = 10 * 60 * 1000; // 10 min entre pubs différentes

        // Filtrer les pubs éligibles
        const eligible = activeAds.filter(a => {
          const adLog = log.filter(l => l.id === a.id);
          if (adLog.length >= 3) return false; // max 3x/jour
          if (adLog.length > 0 && now - Math.max(...adLog.map(l => l.ts)) < 2 * 60 * 60 * 1000) return false; // 2h entre occurrences
          return true;
        });

        if (eligible.length > 0 && (now - lastAnyTs >= minBetweenDiff || lastAnyTs === 0)) {
          setAds(eligible);
          setTimeout(() => setShowAd(true), 1500);
        }
      } catch {}
    };
    fetchAds();
  }, []);

  const handleAdClose = useCallback(() => {
    // Log this ad display
    const ad = ads[adIndex];
    if (ad) {
      try {
        const storageKey = 'ar_ads_log';
        const log = JSON.parse(localStorage.getItem(storageKey) || '[]');
        log.push({ id: ad.id, ts: Date.now() });
        localStorage.setItem(storageKey, JSON.stringify(log));
      } catch {}
    }
    setShowAd(false);
    if (adIndex < ads.length - 1) {
      setTimeout(() => { setAdIndex(i => i + 1); setShowAd(true); }, 10 * 60 * 1000); // 10min entre pubs
    }
  }, [adIndex, ads.length, ads]);

  return (
    <div className="animate-fade">
      <style>{`
        @keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        @keyframes adProgress { from { width: 100%; } to { width: 0%; } }
      `}</style>

      {/* Bannière pub */}
      {showAd && ads[adIndex] && (
        <AdBanner ad={ads[adIndex]} onClose={handleAdClose} />
      )}

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
                {currentUser?.displayName?.charAt(0) || 'M'}
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
          { to: '/medicaments', icon: Pill, label: "Médicaments d'usage courant", desc: '17 molécules', color: '#16a085', bg: '#e0f5f0' },
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
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" style={{flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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
