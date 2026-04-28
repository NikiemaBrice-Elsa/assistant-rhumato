import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

// Detect if already installed as PWA
const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true;

const PWABanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isInstalled()) return;
    if (sessionStorage.getItem('pwa_banner_dismissed')) return;

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    // Listen for Chrome/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 2500);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS doesn't fire beforeinstallprompt — show banner after delay
    if (/iphone|ipad|ipod/.test(ua)) {
      setTimeout(() => setShow(true), 2500);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setShow(false); }
      setDeferredPrompt(null);
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('pwa_banner_dismissed', '1');
  };

  if (!show) return null;

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
        color: 'white', display: 'flex', gap: 12, alignItems: 'flex-start',
        position: 'relative',
      }}>
        <img src="/logo.png" alt="AR" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
            Installer Assistant Rhumato
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.9, lineHeight: 1.5, marginBottom: '0.75rem' }}>
            {platform === 'ios'
              ? "Accès rapide depuis votre écran d'accueil, même hors connexion."
              : "Installez l'app pour un accès instantané et une utilisation hors connexion."}
          </div>

          {platform === 'ios' ? (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Dans Safari :</div>
              <div>1. Appuyez sur <strong>Partager</strong> <span style={{fontSize:'1rem'}}>⬆</span></div>
              <div>2. Faites défiler → <strong>"Sur l'écran d'accueil"</strong></div>
              <div>3. Appuyez sur <strong>Ajouter</strong></div>
            </div>
          ) : deferredPrompt ? (
            <button onClick={handleInstall} disabled={installing} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'white', color: '#1a6bb5', border: 'none', borderRadius: 8,
              padding: '7px 16px', fontSize: '0.82rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>
              {installing
                ? <div className="spinner" style={{ width: 14, height: 14, borderColor: '#1a6bb5', borderTopColor: 'transparent' }} />
                : <Download size={15} />}
              {installing ? 'Installation...' : 'Installer maintenant'}
            </button>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Smartphone size={13} /> Dans Chrome :
              </div>
              <div>1. Cliquez sur <strong>⋮</strong> (menu 3 points)</div>
              <div>2. Cliquez sur <strong>"Installer l'application"</strong></div>
            </div>
          )}
        </div>
        <button onClick={handleDismiss} style={{
          position: 'absolute', top: 8, right: 8,
          background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
          width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white',
        }}>
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

export default PWABanner;
