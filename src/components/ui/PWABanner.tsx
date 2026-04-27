import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

const PWABanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'other'>('other');

  useEffect(() => {
    // Already installed as PWA?
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setInstalled(true);
      return;
    }

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    // Catch Chrome/Edge install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show banner after 2s on every load (as requested)
    const t = setTimeout(() => setShow(true), 2000);
    return () => { window.removeEventListener('beforeinstallprompt', handler); clearTimeout(t); };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setInstalled(true); setShow(false); }
      setDeferredPrompt(null);
    }
  };

  if (!show || installed) return null;

  const isIOS = platform === 'ios';
  const hasNativePrompt = !!deferredPrompt;

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)',
      maxWidth: 460,
      zIndex: 999,
      animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a6bb5 0%, #0d5299 100%)',
        borderRadius: 14,
        padding: '1rem 1.25rem',
        boxShadow: '0 8px 30px rgba(26,107,181,0.45)',
        color: 'white',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        position: 'relative',
      }}>
        <img src="/logo.png" alt="AR" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
            Installer Assistant Rhumato
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.9, lineHeight: 1.5, marginBottom: '0.75rem' }}>
            {isIOS
              ? "Appuyez sur Partager dans Safari, puis Sur l'ecran d'accueil."
              : hasNativePrompt
                ? "Installez l'app pour un acces rapide, meme hors connexion."
                : "Dans Chrome : cliquez sur le menu puis Installer l'application."
            }
          </div>

          {isIOS ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: '0.75rem' }}>
              <Smartphone size={13} />
              <span>Safari &rarr; <strong>Partager</strong> &rarr; Sur l&apos;écran d&apos;accueil</span>
            </div>
          ) : hasNativePrompt ? (
            <button
              onClick={handleInstall}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white', color: '#1a6bb5', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
            >
              <Download size={14} /> Installer maintenant
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: '0.75rem' }}>
              <Monitor size={13} />
              <span>Chrome : Menu → <strong>Installer</strong></span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShow(false)}
          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

export default PWABanner;
