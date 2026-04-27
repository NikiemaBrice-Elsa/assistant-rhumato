import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { City } from '../../types';

const CITIES: City[] = ['Ouagadougou', 'Bobo Dioulasso', 'Koudougou', 'Kaya', 'Koupéla', 'Autre'];

const OnboardingModal: React.FC = () => {
  const { completeOnboarding, currentUser } = useAuth();
  const [city, setCity] = useState<City | ''>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return;
    setLoading(true);
    try {
      await completeOnboarding(city as City);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal animate-fade" style={{ padding: '2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="AR" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover', margin: '0 auto 1rem', display: 'block', boxShadow: '0 4px 16px rgba(26,107,181,0.3)' }} />
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.3rem', fontWeight: 600, margin: '0 0 0.5rem', color: 'var(--text)' }}>
            Bienvenue, {currentUser?.displayName?.split(' ')[0]} !
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Une dernière information pour personnaliser votre expérience
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block', fontWeight: 500,
              fontSize: '0.875rem', marginBottom: '0.5rem',
              color: 'var(--text)',
            }}>
              Lieu d'exercice médical <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              value={city}
              onChange={e => setCity(e.target.value as City)}
              required
              className="input"
              style={{ cursor: 'pointer' }}
            >
              <option value="">Sélectionner votre ville...</option>
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{
            background: 'var(--primary-light)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginBottom: '1.25rem',
            lineHeight: 1.5,
          }}>
            Cette information nous permet de vous mettre en relation avec des médecins de votre région et de cibler les formations locales.
          </div>

          <button
            type="submit"
            disabled={!city || loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
          >
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Enregistrement...</> : 'Accéder à la plateforme'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingModal;
