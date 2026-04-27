import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';

// This banner appears at every login as requested
// It shows instructions to install the PWA

const PWABanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const installed = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsInstalled(installed);

    if (installed) return; // Don't show if already installed

    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    // Listen for Android/Desktop install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show banner after short delay (every login as requested)
    const timer = setTimeout(() => setShow(true), 1500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setShow(false);
      }
    }
  };

  if (!show || isInstalled) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 80, // above bottom nav on mobile
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)',
      maxWidth: 480,
      zIndex: 999,
      animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a6bb5, #0d5299)',
        borderRadius: 14,
        padding: '1rem 1.25rem',
        boxShadow: '0 8px 30px rgba(26,107,181,0.4)',
        color: 'white',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        {/* Logo */}
        <img
          src="/logo.png"
          alt="AR"
          style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
        />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: 3 }}>
            Installer Assistant Rhumato
          </div>
          <div style={{ fontSize: '0.8rem', opacity: 0.9, lineHeight: 1.4, marginBottom: '0.75rem' }}>
            {isIOS
              ? 'Appuyez sur le bouton Partager puis "Sur l\'écran d\'accueil" pour installer l\'app.'
              : 'Installez l\'application sur votre appareil pour un accès rapide, même hors connexion.'
            }
          </div>
          {isIOS ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '5px 10px',
              fontSize: '0.78rem', fontWeight: 500,
            }}>
              <Smartphone size={14} />
              <span>
                <strong>Safari</strong> → icône Partager → "Sur l'écran d'accueil"
              </span>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'white', color: '#1a6bb5',
                border: 'none', borderRadius: 8,
                padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                transition: 'opacity 0.15s',
              }}
            >
              <Download size={14} />
              Installer maintenant
            </button>
          )}
        </div>

        {/* Close */}
        <button
          onClick={() => setShow(false)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: '50%',
            width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white', flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default PWABanner;
