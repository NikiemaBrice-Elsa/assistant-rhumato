import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const { dark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #e8f2fb 0%, #d1e8f5 30%, #f0f9ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', opacity: 0.06,
        background: 'var(--primary)',
        top: -100, right: -100,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300,
        borderRadius: '50%', opacity: 0.05,
        background: 'var(--secondary)',
        bottom: -80, left: -80,
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 440 }} className="animate-fade">
        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ margin: '0 auto 1rem', width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Assistant Rhumato" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 24px rgba(26,107,181,0.35)' }} />
          </div>
          <h1 style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 0.5rem',
            lineHeight: 1.2,
          }}>
            Assistant Rhumato
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Aide à la décision clinique en médecine générale
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 600, margin: '0 0 0.5rem', color: 'var(--text)' }}>
              Connexion
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Réservé aux professionnels de santé
            </p>
          </div>

          {error && (
            <div style={{
              background: '#fee2e2', color: '#b91c1c',
              padding: '0.75rem 1rem', borderRadius: 8,
              fontSize: '0.85rem', marginBottom: '1rem',
              border: '1px solid #fca5a5',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '0.875rem 1.5rem',
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              cursor: loading ? 'wait' : 'pointer',
              fontSize: '0.95rem',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 500,
              color: 'var(--text)',
              transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.boxShadow = '0 2px 8px rgba(26,107,181,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)', e.currentTarget.style.boxShadow = 'none')}
          >
            {loading ? (
              <div className="spinner" style={{ width: 20, height: 20 }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Connexion en cours...' : 'Continuer avec Google'}
          </button>

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'var(--primary-light)',
            borderRadius: 8,
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: 4 }}>
              🔒 Accès professionnel
            </strong>
            Cette plateforme est destinée aux médecins généralistes et professionnels de santé du Burkina Faso.
            Votre compte Google sera utilisé pour authentifier votre identité.
          </div>
        </div>

        {/* Features preview */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.75rem', marginTop: '1.5rem',
        }}>
          {[
            { icon: null, label: 'Fiches CAT', svg: 'filetext' },
            { icon: null, label: 'Médicaments', svg: 'pill' },
            { icon: null, label: 'Communauté', svg: 'users' },
          ].map(f => (
            <div key={f.label} style={{
              textAlign: 'center', padding: '0.875rem 0.5rem',
              background: 'var(--surface)', borderRadius: 10,
              border: '1px solid var(--border)',
              fontSize: '0.8rem', color: 'var(--text-muted)',
            }}>
              <div style={{ marginBottom: 4 }}>
                {f.svg === 'filetext' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a6bb5" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                {f.svg === 'pill' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a085" strokeWidth="1.8"><path d="M10.5 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12.5"/><path d="M8 16l2-4 3 6 2-3 2 3"/></svg>}
                {f.svg === 'users' && <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              </div>
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
