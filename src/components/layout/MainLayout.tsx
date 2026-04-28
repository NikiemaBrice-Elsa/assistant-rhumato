import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Home, FileText, Pill, Share2, Calendar, User,
  Shield, Menu, X, Sun, Moon, LogOut, Info, Star,
} from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, query, orderBy, limit, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

// ─── Hook notifications ───────────────────────────────────────────
const useNotifications = (userId?: string) => {
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!userId) return;

    // Charger les dernières visites depuis Firestore (persistance cross-device)
    const loadAndCheck = async () => {
      try {
        let seen: Record<string, string> = {};
        const ref = doc(db, 'user_last_seen', userId);
        const snap = await getDoc(ref);
        if (snap.exists()) seen = snap.data() as Record<string, string>;
        setLastSeen(seen);

        const newBadges: Record<string, number> = {};

        // Cas cliniques
        const casSnap = await getDocs(query(collection(db, 'cases'), orderBy('createdAt', 'desc'), limit(30)));
        const lastCas = seen['cas'] || '';
        newBadges['cas'] = casSnap.docs.filter(d => (d.data().createdAt || '') > lastCas && d.data().status === 'approved').length;

        // Évènements
        const evSnap = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(20)));
        const lastEv = seen['evenements'] || '';
        newBadges['evenements'] = evSnap.docs.filter(d => (d.data().createdAt || '') > lastEv).length;

        // Médicaments custom (collection Firestore)
        try {
          const medSnap = await getDocs(query(collection(db, 'medications'), orderBy('createdAt', 'desc'), limit(20)));
          const lastMed = seen['medicaments'] || '';
          newBadges['medicaments'] = medSnap.docs.filter(d => (d.data().createdAt || '') > lastMed).length;
        } catch { newBadges['medicaments'] = 0; }

        setBadges(newBadges);
      } catch {}
    };

    loadAndCheck();
    const interval = setInterval(loadAndCheck, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userId]);

  const markSeen = async (route: string) => {
    if (!userId) return;
    const now = new Date().toISOString();
    const updated = { ...lastSeen, [route]: now };
    setLastSeen(updated);
    setBadges(prev => ({ ...prev, [route]: 0 }));
    try {
      await setDoc(doc(db, 'user_last_seen', userId), updated, { merge: true });
    } catch {}
  };

  return { badges, markSeen };
};

// ─── Badge component ─────────────────────────────────────────────
const NotifBadge: React.FC<{ count: number }> = ({ count }) => {
  if (!count) return null;
  return (
    <div style={{
      position: 'absolute', top: -4, right: -4,
      background: '#dc2626', color: 'white',
      borderRadius: '50%', width: 16, height: 16,
      fontSize: '0.6rem', fontWeight: 700,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1.5px solid var(--surface)',
      lineHeight: 1,
    }}>
      {count > 9 ? '9+' : count}
    </div>
  );
};

// ─── Offline banner ──────────────────────────────────────────────
const OfflineBanner: React.FC = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [justBack, setJustBack] = useState(false);

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => {
      setOffline(false);
      setJustBack(true);
      setTimeout(() => setJustBack(false), 3000);
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => { window.removeEventListener('offline', onOffline); window.removeEventListener('online', onOnline); };
  }, []);

  if (!offline && !justBack) return null;

  return (
    <div style={{
      position: 'fixed', top: 56, left: 0, right: 0, zIndex: 200,
      background: justBack ? '#15803d' : '#dc2626',
      color: 'white', textAlign: 'center', padding: '6px 12px',
      fontSize: '0.78rem', fontWeight: 500,
      transition: 'background 0.3s',
    }}>
      {justBack
        ? '✓ Connexion rétablie — données actualisées'
        : '⚠ Hors connexion — contenu en cache disponible'}
    </div>
  );
};

// ─── Main Layout ─────────────────────────────────────────────────
const navItems = [
  { to: '/', label: 'Accueil', icon: Home, exact: true, key: 'home' },
  { to: '/cats', label: 'CAT Rhumato', icon: FileText, key: 'cats' },
  { to: '/medicaments', label: 'Médicaments', icon: Pill, key: 'medicaments' },
  { to: '/cas-cliniques', label: 'Cas cliniques', icon: Share2, key: 'cas' },
  { to: '/evenements', label: 'Évènements', icon: Calendar, key: 'evenements' },
  { to: '/profil', label: 'Mon profil', icon: User, key: 'profil' },
  { to: '/a-propos', label: 'À propos', icon: Info, key: 'apropos' },
  { to: '/evaluation', label: 'Évaluation', icon: Star, key: 'evaluation' },
];

const MainLayout: React.FC = () => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { badges, markSeen } = useNotifications(currentUser?.uid);

  const handleLogout = async () => {
    if (confirm('Se déconnecter ?')) await logout();
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src="/logo.png" alt="AR" style={{ width: 18, height: 18, borderRadius: 4, objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.1 }}>Assistant</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.1 }}>Rhumato</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            onClick={() => { setSidebarOpen(false); markSeen(item.key); }}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.625rem 0.75rem', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              transition: 'all 0.15s', position: 'relative',
            })}>
            {({ isActive }) => (
              <>
                <div style={{ position: 'relative' }}>
                  <item.icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                  <NotifBadge count={badges[item.key] || 0} />
                </div>
                {item.label}
                {(badges[item.key] || 0) > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', borderRadius: 10, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700 }}>
                    {badges[item.key]}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink to="/admin" onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.625rem 0.75rem', borderRadius: 8, marginTop: 8,
              textDecoration: 'none', fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#7c3aed' : '#6d28d9',
              background: isActive ? '#ede9fe' : 'transparent',
              border: '1px solid', borderColor: isActive ? '#c4b5fd' : 'transparent',
              transition: 'all 0.15s',
            })}>
            {({ isActive }) => <><Shield size={17} strokeWidth={isActive ? 2.5 : 1.8} />Administrateur</>}
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem', background: 'var(--surface2)', borderRadius: 8, marginBottom: '0.5rem' }}>
          {currentUser?.photoURL
            ? <img src={currentUser.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>{currentUser?.displayName?.charAt(0) || 'M'}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.displayName || 'Médecin'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{userProfile?.city || ''}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={toggleDark} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '0.5rem', gap: 0 }} title="Mode sombre">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button onClick={handleLogout} className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '0.5rem', gap: 0, color: 'var(--danger)' }} title="Déconnexion">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <OfflineBanner />

      {/* Desktop sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100, display: 'none' }} className="desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }} onClick={() => setSidebarOpen(false)} />}

      {/* Mobile sidebar */}
      <aside style={{ width: 260, background: 'var(--surface)', position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 300, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease', borderRight: '1px solid var(--border)' }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', marginLeft: 0 }} id="main-wrap">
        {/* Topbar */}
        <header style={{ height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', position: 'sticky', top: 0, zIndex: 50, boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <img src="/logo.png" alt="AR" style={{ width: 26, height: 26, borderRadius: 6, objectFit: 'cover' }} />
            <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>Assistant Rhumato</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleDark} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            {currentUser?.photoURL
              ? <img src={currentUser.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>{currentUser?.displayName?.charAt(0) || 'M'}</div>}
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '1.25rem 1rem', maxWidth: 720, margin: '0 auto', width: '100%' }}>
          <Outlet />
        </main>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: block !important; }
          #main-wrap { margin-left: 220px !important; }
          #main-wrap > main { max-width: 1100px !important; }
          .mobile-bottom-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          #main-wrap > main { padding-bottom: 72px !important; }
        }
      `}</style>

      {/* Bottom mobile nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--surface)', borderTop: '1px solid var(--border)', display: 'flex', zIndex: 50, boxShadow: '0 -4px 12px rgba(0,0,0,0.08)' }} className="mobile-bottom-nav">
        {[
          { to: '/', icon: Home, label: 'Accueil', exact: true, key: 'home' },
          { to: '/cats', icon: FileText, label: 'CAT', key: 'cats' },
          { to: '/medicaments', icon: Pill, label: 'Médicaments', key: 'medicaments' },
          { to: '/cas-cliniques', icon: Share2, label: 'Cas', key: 'cas' },
          { to: '/evenements', icon: Calendar, label: 'Évèn.', key: 'evenements' },
        ].map(item => (
          <NavLink key={item.to} to={item.to} end={item.exact}
            onClick={() => markSeen(item.key)}
            style={({ isActive }) => ({
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '0.45rem 0.25rem', textDecoration: 'none',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.6rem', gap: 2, position: 'relative',
            })}>
            {({ isActive }) => (
              <>
                <div style={{ position: 'relative' }}>
                  <item.icon size={19} strokeWidth={isActive ? 2.5 : 1.8} />
                  <NotifBadge count={badges[item.key] || 0} />
                </div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default MainLayout;
