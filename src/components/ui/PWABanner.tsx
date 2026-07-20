import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

const STORAGE_KEY = 'ar_pwa_never_show';
const SESSION_KEY = 'ar_pwa_session_dismissed';

export const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true;

// Hook exporté pour être utilisé dans MainLayout (bouton sidebar)
export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) { setPlatform('ios'); setCanInstall(true); }
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return outcome === 'accepted';
    }
    return false;
  };

  return { canInstall, platform, triggerInstall, deferredPrompt };
};

const PWABanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const { canInstall, platform, triggerInstall, deferredPrompt } = usePWAInstall();

  useEffect(() => {
    if (isInstalled()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;   // "ne plus afficher" permanent
    if (sessionStorage.getItem(SESSION_KEY)) return;  // fermé cette session

    // Afficher après 2,5 secondes si éligible
    const t = setTimeout(() => {
      if (canInstall || /iphone|ipad|ipod/i.test(navigator.userAgent)) {
        setShow(true);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [canInstall]);

  if (!show) return null;

  const handleInstall = async () => {
    setInstalling(true);
    const accepted = await triggerInstall();
    setInstalling(false);
    if (accepted) setShow(false);
  };

  const handleDismissSession = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setShow(false);
  };

  const handleNeverShow = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)', maxWidth: 440, zIndex: 999,
      animation: 'slideUp 0.4s ease',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a6bb5, #0d5299)',
        borderRadius: 14, padding: '1rem 1.25rem',
        boxShadow: '0 8px 30px rgba(26,107,181,0.5)',
        color: 'white', position: 'relative',
      }}>
        {/* Close button (session only) */}
        <button onClick={handleDismissSession} style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white',
        }}>
          <X size={13} />
        </button>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <img src="/logo.png" alt="AR" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1, paddingRight: 20 }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
              Installer Assistant Rhumato
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.9, lineHeight: 1.5, marginBottom: '0.75rem' }}>
              {platform === 'ios'
                ? "Accès rapide depuis votre écran d'accueil, même hors connexion."
                : "Installez l'app pour un accès instantané et une utilisation hors connexion."}
            </div>

            {platform === 'ios' ? (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', lineHeight: 1.6, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Dans Safari :</div>
                <div>1. Appuyez sur <strong>Partager</strong> ⬆</div>
                <div>2. Faites défiler → <strong>"Sur l'écran d'accueil"</strong></div>
                <div>3. Appuyez sur <strong>Ajouter</strong></div>
              </div>
            ) : deferredPrompt ? (
              <button onClick={handleInstall} disabled={installing} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'white', color: '#1a6bb5', border: 'none', borderRadius: 8,
                padding: '7px 16px', fontSize: '0.82rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', marginBottom: 8,
              }}>
                {installing
                  ? <div className="spinner" style={{ width: 14, height: 14, borderColor: '#1a6bb5', borderTopColor: 'transparent' }} />
                  : <Download size={15} />}
                {installing ? 'Installation...' : 'Installer maintenant'}
              </button>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', lineHeight: 1.6, marginBottom: 8 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Smartphone size={13} /> Dans Chrome :
                </div>
                <div>1. Cliquez sur <strong>⋮</strong> (menu 3 points)</div>
                <div>2. Cliquez sur <strong>"Installer l'application"</strong></div>
              </div>
            )}

            {/* "Ne plus afficher" permanent */}
            <button onClick={handleNeverShow} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.65)', fontSize: '0.72rem',
              fontFamily: 'DM Sans, sans-serif', padding: 0, textDecoration: 'underline',
            }}>
              Ne plus afficher ce message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWABanner;
