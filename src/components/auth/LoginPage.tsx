import React, { useState } from 'react';
import logoImg from '/logo.png';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const CGUModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
    <div style={{ background: 'white', borderRadius: 14, maxWidth: 600, width: '100%', padding: '2rem', marginTop: '2rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Conditions Générales d'Utilisation
        </h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>✕</button>
      </div>

      <div style={{ fontSize: '0.875rem', color: '#374151', lineHeight: 1.7, maxHeight: '70vh', overflowY: 'auto' }}>
        <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1rem' }}>Version 1.0 — Novembre 2024</p>

        <h3 style={{ color: '#1a6bb5', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>1. Objet de l'application</h3>
        <p>L'application <strong>Assistant Rhumato</strong>, développée par le <strong>Groupe Assistant Rhumato</strong> sous la direction du Dr NIKIEMA W. Brice Florentin, est un outil d'aide à la décision clinique en rhumatologie destiné exclusivement aux <strong>professionnels de santé</strong> (médecins généralistes et spécialistes) exerçant au Burkina Faso.</p>
        <p>Elle ne constitue en aucun cas un substitut à un avis médical spécialisé, à l'examen clinique du patient ou aux recommandations en vigueur. L'utilisateur reste seul responsable de ses décisions cliniques.</p>

        <h3 style={{ color: '#1a6bb5', fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>2. Accès et inscription</h3>
        <p>L'accès à l'application est réservé aux professionnels de santé dûment inscrits. En créant un compte, l'utilisateur déclare sur l'honneur être un professionnel de santé qualifié. Tout usage par une personne non habilitée est strictement interdit.</p>
        <p>La connexion se fait via un compte Google ou Apple. L'utilisateur est responsable de la confidentialité de ses identifiants.</p>

        <h3 style={{ color: '#1a6bb5', fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>3. Données personnelles et confidentialité</h3>
        <p>Les données collectées (nom, adresse email, ville, spécialité) sont utilisées exclusivement pour le fonctionnement de l'application. Elles ne sont jamais transmises à des tiers à des fins commerciales.</p>
        <p>Conformément aux dispositions applicables sur la protection des données personnelles, l'utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données en contactant : <strong>bricenikiemagg@gmail.com</strong>.</p>
        <p>Les cas cliniques publiés doivent être <strong>anonymisés</strong>. Tout cas comportant des données identifiantes de patient sera supprimé.</p>

        <h3 style={{ color: '#1a6bb5', fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>4. Contenu et publications</h3>
        <p>L'utilisateur s'engage à ne publier que des contenus médicaux pertinents, véridiques et conformes à l'éthique médicale. Sont strictement interdits :</p>
        <ul style={{ paddingLeft: '1.5rem', margin: '0.5rem 0' }}>
          <li>La publication de données patient identifiantes</li>
          <li>Tout contenu à caractère publicitaire non autorisé</li>
          <li>Les contenus à caractère diffamatoire, discriminatoire ou illégal</li>
          <li>La promotion de produits ou pratiques contraires aux recommandations médicales</li>
        </ul>
        <p>L'équipe éditoriale se réserve le droit de modérer ou de supprimer tout contenu non conforme.</p>

        <h3 style={{ color: '#1a6bb5', fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>5. Responsabilité médicale</h3>
        <p>Les informations contenues dans l'application (fiches CAT, médicaments, cas cliniques) sont fournies à titre indicatif. Elles sont basées sur les recommandations scientifiques en vigueur mais peuvent ne pas refléter les spécificités locales ou les dernières mises à jour.</p>
        <p><strong>Le médecin utilisateur reste seul responsable de ses décisions diagnostiques et thérapeutiques.</strong> Le Groupe Assistant Rhumato décline toute responsabilité en cas de préjudice résultant d'une utilisation inappropriée de l'application.</p>

        <h3 style={{ color: '#1a6bb5', fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>6. Propriété intellectuelle</h3>
        <p>Le contenu éditorial de l'application (fiches CAT, textes, algorithmes) est la propriété exclusive du Groupe Assistant Rhumato. Toute reproduction, modification ou distribution sans autorisation écrite préalable est interdite.</p>

        <h3 style={{ color: '#1a6bb5', fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>7. Publicités et partenariats</h3>
        <p>L'application peut afficher des contenus publicitaires de laboratoires pharmaceutiques partenaires, clairement identifiés comme tels. Ces publicités sont soumises à validation éditoriale et ne constituent pas une recommandation de prescription.</p>

        <h3 style={{ color: '#1a6bb5', fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>8. Modifications des CGU</h3>
        <p>Le Groupe Assistant Rhumato se réserve le droit de modifier les présentes CGU à tout moment. L'utilisateur sera informé des modifications significatives via l'application.</p>

        <h3 style={{ color: '#1a6bb5', fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>9. Contact</h3>
        <p>Pour toute question relative aux présentes CGU : <strong>bricenikiemagg@gmail.com</strong></p>
        <p>Groupe Assistant Rhumato — Ouagadougou, Burkina Faso</p>
      </div>

      <button onClick={onClose} style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem', background: '#1a6bb5', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'DM Sans, sans-serif' }}>
        J'ai lu et compris les CGU
      </button>
    </div>
  </div>
);

const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const { dark } = useTheme();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState('');
  const [showCGU, setShowCGU] = useState(false);
  const [cguAccepted, setCguAccepted] = useState(false);

  const handleGoogle = async () => {
    if (!cguAccepted) { setError('Veuillez accepter les CGU pour continuer.'); return; }
    setLoading('google'); setError('');
    try { await signInWithGoogle(); }
    catch { setError('Erreur de connexion Google. Veuillez réessayer.'); }
    finally { setLoading(null); }
  };

  const handleApple = async () => {
    if (!cguAccepted) { setError('Veuillez accepter les CGU pour continuer.'); return; }
    setLoading('apple'); setError('');
    try { await signInWithApple(); }
    catch (e: any) {
      if (e?.code === 'auth/popup-closed-by-user') return;
      setError('Connexion Apple non disponible sur cet appareil. Utilisez Google.');
    }
    finally { setLoading(null); }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: dark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)'
        : 'linear-gradient(135deg, #e8f2fb 0%, #d1e8f5 30%, #f0f9ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', position: 'relative', overflow: 'hidden',
    }}>
      {showCGU && <CGUModal onClose={() => setShowCGU(false)} />}

      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', opacity: 0.06, background: 'var(--primary)', top: -100, right: -100, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', opacity: 0.05, background: 'var(--secondary)', bottom: -80, left: -80, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 440 }} className="animate-fade">
        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src={logoImg} alt="Assistant Rhumato"
            style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 8px 24px rgba(26,107,181,0.35)', marginBottom: '1rem' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 0.5rem', lineHeight: 1.2 }}>
            Assistant Rhumato
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Aide à la décision clinique en médecine générale
          </p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.2rem', fontWeight: 600, margin: '0 0 0.5rem', color: 'var(--text)' }}>Connexion</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Réservé aux professionnels de santé</p>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid #fca5a5' }}>
              {error}
            </div>
          )}

          {/* CGU checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--surface2)', borderRadius: 8, border: `1.5px solid ${cguAccepted ? '#1a6bb5' : 'var(--border)'}` }}>
            <input type="checkbox" checked={cguAccepted} onChange={e => { setCguAccepted(e.target.checked); setError(''); }}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: '#1a6bb5', flexShrink: 0 }} />
            <span style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5 }}>
              J'ai lu et j'accepte les{' '}
              <button onClick={e => { e.preventDefault(); setShowCGU(true); }}
                style={{ background: 'none', border: 'none', color: '#1a6bb5', cursor: 'pointer', padding: 0, fontSize: '0.82rem', fontWeight: 600, textDecoration: 'underline', fontFamily: 'inherit' }}>
                Conditions Générales d'Utilisation
              </button>
              {' '}et certifie être un professionnel de santé.
            </span>
          </label>

          {/* Google button */}
          <button onClick={handleGoogle} disabled={loading !== null}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              padding: '0.875rem 1.5rem', background: 'var(--surface)', border: '1.5px solid var(--border)',
              borderRadius: 10, cursor: loading ? 'wait' : 'pointer', fontSize: '0.95rem',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: 'var(--text)', transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1, marginBottom: '0.75rem',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = '#4285F4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(66,133,244,0.2)'; }}}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {loading === 'google' ? <div className="spinner" style={{ width: 20, height: 20 }} /> : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading === 'google' ? 'Connexion...' : 'Continuer avec Google'}
          </button>

          {/* Apple button */}
          <button onClick={handleApple} disabled={loading !== null}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
              padding: '0.875rem 1.5rem',
              background: 'var(--text)', border: '1.5px solid var(--text)',
              borderRadius: 10, cursor: loading ? 'wait' : 'pointer', fontSize: '0.95rem',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 500, color: 'var(--surface)', transition: 'all 0.2s',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = '0.88'; }}}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            {loading === 'apple' ? <div className="spinner" style={{ width: 20, height: 20, borderColor: 'var(--surface)', borderTopColor: 'transparent' }} /> : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
              </svg>
            )}
            {loading === 'apple' ? 'Connexion...' : 'Continuer avec Apple'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', marginBottom: 0 }}>
            En vous connectant, vous confirmez être un professionnel de santé
          </p>
        </div>

        {/* Features preview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1.5rem' }}>
          {[
            { label: 'Fiches CAT', svg: 'filetext' },
            { label: 'Médicaments', svg: 'pill' },
            { label: 'Communauté', svg: 'users' },
          ].map(f => (
            <div key={f.label} style={{ textAlign: 'center', padding: '0.875rem 0.5rem', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
