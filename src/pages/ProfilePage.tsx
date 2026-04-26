import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import type { City } from '../types';
import { Save, LogOut, User, Mail, MapPin, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const CITIES: City[] = ['Ouagadougou', 'Bobo Dioulasso', 'Koudougou', 'Kaya', 'Koupéla', 'Autre'];

const ProfilePage: React.FC = () => {
  const { currentUser, userProfile, isAdmin, logout, refreshProfile } = useAuth();
  const [city, setCity] = useState<City>(userProfile?.city || 'Ouagadougou');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), { city });
      await refreshProfile();
      toast.success('Profil mis à jour !');
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Se déconnecter de votre compte ?')) {
      await logout();
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="animate-fade" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 className="section-title">Mon profil</h1>
      <p className="section-subtitle">Informations de votre compte</p>

      {/* Avatar + name */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
        {currentUser?.photoURL ? (
          <img src={currentUser.photoURL} alt="" style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1rem', display: 'block', border: '3px solid var(--primary)', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '2rem', color: 'white',
          }}>
            {currentUser?.displayName?.charAt(0) || '👨‍⚕️'}
          </div>
        )}
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px', color: 'var(--text)' }}>
          {currentUser?.displayName || 'Médecin'}
        </h2>
        {isAdmin && (
          <span className="badge badge-purple" style={{ margin: '0 auto' }}>
            <Shield size={11} /> Administrateur
          </span>
        )}
      </div>

      {/* Info fields */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 1rem', color: 'var(--text)' }}>
          Informations du compte
        </h3>

        <div style={{ display: 'grid', gap: '0.875rem' }}>
          <InfoField icon={<User size={15} />} label="Nom" value={currentUser?.displayName || '—'} />
          <InfoField icon={<Mail size={15} />} label="Email Google" value={currentUser?.email || '—'} />
          <InfoField icon={<User size={15} />} label="Membre depuis" value={formatDate(userProfile?.createdAt)} />
        </div>

        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text)' }}>
            <MapPin size={15} style={{ display: 'inline', marginRight: 6 }} />
            Lieu d'exercice
          </label>
          <select
            value={city}
            onChange={e => setCity(e.target.value as City)}
            className="input"
            style={{ marginBottom: '0.75rem' }}
          >
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Account actions */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 1rem', color: 'var(--text)' }}>
          Compte
        </h3>
        <button onClick={handleLogout} className="btn-danger" style={{ width: '100%', justifyContent: 'center' }}>
          <LogOut size={15} /> Se déconnecter
        </button>
      </div>
    </div>
  );
};

const InfoField: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500 }}>{value}</div>
    </div>
  </div>
);

export default ProfilePage;
