import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

const PWABanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) return;

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    const t = setTimeout(() => setShow(true), 2000);
    return () => { window.removeEventListener('beforeinstallprompt', handler); clearTimeout(t); };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShow(false);
      setDeferredPrompt(null);
    } else {
      // Manual fallback: open Chrome install menu
      alert(platform === 'desktop'
        ? "Pour installer :\n1. Cliquez sur les 3 points (⋮) en haut à droite de Chrome\n2. Cliquez sur \"Installer Assistant Rhumato\""
        : "Pour installer :\n1. Appuyez sur les 3 points (⋮) dans Chrome\n2. Sélectionnez \"Ajouter à l'écran d'accueil\""
      );
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)', maxWidth: 460, zIndex: 999, animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a6bb5, #0d5299)',
        borderRadius: 14, padding: '1rem 1.25rem',
        boxShadow: '0 8px 30px rgba(26,107,181,0.45)',
        color: 'white', display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative',
      }}>
        <img src="/logo.png" alt="AR" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
            Installer Assistant Rhumato
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.9, lineHeight: 1.5, marginBottom: '0.75rem' }}>
            {platform === 'ios'
              ? "Dans Safari : Partager puis Sur l'ecran d'accueil."
              : "Installez l'app pour un acces rapide, meme hors connexion."}
          </div>
          {platform === 'ios' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 10px', fontSize: '0.75rem' }}>
              <Smartphone size={13} />
              <span>Safari &rarr; <strong>Partager</strong> &rarr; Sur l&apos;écran d&apos;accueil</span>
            </div>
          ) : (
            <button onClick={handleInstall} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'white', color: '#1a6bb5', border: 'none', borderRadius: 8,
              padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>
              {platform === 'desktop' ? <Monitor size={14} /> : <Download size={14} />}
              {deferredPrompt ? 'Installer maintenant' : 'Voir les instructions'}
            </button>
          )}
        </div>
        <button onClick={() => setShow(false)} style={{
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
