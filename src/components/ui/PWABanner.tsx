import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWABanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'other'>('other');

  useEffect(() => {
    // Already installed as PWA?
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
    else setPlatform('desktop');

    // Capture Chrome/Edge native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true); // Show immediately when prompt is available
    };
    window.addEventListener('beforeinstallprompt', handler);

    // For iOS: show after 2s (no native prompt available)
    const iosTimer = setTimeout(() => {
      if (/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())) {
        setShow(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(iosTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setShow(false);
    setDeferredPrompt(null);
  };

  if (!show || isInstalled) return null;

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
      }}>
        <img
          src="/logo.png"
          alt="AR"
          style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
        />

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
            Installer Assistant Rhumato
          </div>
          <div style={{ fontSize: '0.78rem', opacity: 0.9, lineHeight: 1.5, marginBottom: '0.75rem' }}>
            {platform === 'ios'
              ? "Dans Safari : appuyez sur le bouton Partager, puis \"Sur l'écran d'accueil\""
              : deferredPrompt
                ? "Installez l'app sur votre appareil pour un accès rapide, même hors connexion."
                : platform === 'desktop'
                  ? "Dans Chrome : cliquez sur l'icône d'installation dans la barre d'adresse"
                  : "Dans Chrome : menu (trois points) puis \"Ajouter à l'écran d'accueil\""
            }
          </div>

          {platform === 'ios' ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '6px 10px', fontSize: '0.75rem',
            }}>
              <Smartphone size={13} />
              <span>Safari &rarr; Partager &rarr; Sur l&apos;écran d&apos;accueil</span>
            </div>
          ) : deferredPrompt ? (
            <button
              onClick={handleInstall}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'white', color: '#1a6bb5',
                border: 'none', borderRadius: 8,
                padding: '7px 16px', fontSize: '0.85rem', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}
            >
              <Download size={15} />
              Installer maintenant
            </button>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 8, padding: '6px 10px', fontSize: '0.75rem',
            }}>
              <Monitor size={13} />
              <span>Cherchez l&apos;icône d&apos;installation dans Chrome</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShow(false)}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: '50%',
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white', flexShrink: 0,
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

export default PWABanner;
