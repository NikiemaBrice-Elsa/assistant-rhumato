import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Home, FileText, Pill, Share2, Calendar, User,
  Shield, Menu, X, Sun, Moon, LogOut, Bell,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Accueil', icon: Home, exact: true },
  { to: '/cats', label: 'CAT Rhumato', icon: FileText },
  { to: '/medicaments', label: 'Médicaments', icon: Pill },
  { to: '/cas-cliniques', label: 'Cas cliniques', icon: Share2 },
  { to: '/evenements', label: 'Évènements', icon: Calendar },
  { to: '/profil', label: 'Mon profil', icon: User },
];

const MainLayout: React.FC = () => {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();
  const { dark, toggleDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    if (confirm('Se déconnecter ?')) await logout();
  };

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 18 }}>🩺</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)', lineHeight: 1.1 }}>
              Assistant
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.1 }}>
              Rhumato
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.75rem', overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0.625rem 0.75rem',
              borderRadius: 8,
              marginBottom: 2,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={() => setSidebarOpen(false)}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '0.625rem 0.75rem',
              borderRadius: 8,
              marginTop: 8,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#7c3aed' : '#6d28d9',
              background: isActive ? '#ede9fe' : 'transparent',
              border: '1px solid',
              borderColor: isActive ? '#c4b5fd' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            {({ isActive }) => (
              <>
                <Shield size={17} strokeWidth={isActive ? 2.5 : 1.8} />
                Administrateur
              </>
            )}
          </NavLink>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)' }}>
        {/* User info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0.5rem 0.5rem',
          background: 'var(--surface2)', borderRadius: 8,
          marginBottom: '0.5rem',
        }}>
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>
              {currentUser?.displayName?.charAt(0) || 'M'}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.displayName || 'Médecin'}
            </div>
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
      {/* Desktop sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 100,
        display: 'none',
      }} className="desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside style={{
        width: 260,
        background: 'var(--surface)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 300,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
        borderRight: '1px solid var(--border)',
      }}>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', marginLeft: 0 }} id="main-wrap">
        {/* Top bar */}
        <header style={{
          height: 56,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1rem',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🩺</span>
              <span style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                Assistant Rhumato
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleDark} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, position: 'relative' }}>
              <Bell size={18} />
            </button>
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer' }} />
            ) : (
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>
                {currentUser?.displayName?.charAt(0) || 'M'}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '1.5rem 1rem', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
          <Outlet />
        </main>
      </div>

      {/* Desktop sidebar spacing */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: block !important; }
          #main-wrap { margin-left: 220px !important; }
        }
      `}</style>

      {/* Bottom mobile nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 50,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      }} className="mobile-bottom-nav">
        {[
          { to: '/', icon: Home, label: 'Accueil', exact: true },
          { to: '/cats', icon: FileText, label: 'CAT' },
          { to: '/medicaments', icon: Pill, label: 'Médicaments' },
          { to: '/cas-cliniques', icon: Share2, label: 'Cas' },
          { to: '/evenements', icon: Calendar, label: 'Évèn.' },
        ].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            style={({ isActive }) => ({
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '0.5rem 0.25rem',
              textDecoration: 'none',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.65rem',
              gap: 2,
            })}
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <style>{`
        @media (min-width: 768px) {
          .mobile-bottom-nav { display: none !important; }
        }
        @media (max-width: 767px) {
          #main-wrap > main { padding-bottom: 70px !important; }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
