import React from 'react';
import { Award, BookOpen, Users, Heart, Globe } from 'lucide-react';

const TEAM = [
  {
    name: 'Dr Wendtongo Brice Florent NIKIEMA',
    role: 'Rhumatologue',
    fonction: 'Concepteur & Responsable scientifique',
    description: 'Médecin rhumatologue, concepteur de la plateforme Assistant Rhumato. Engagé dans l\'amélioration de la prise en charge rhumatologique en médecine générale au Burkina Faso.',
    isCreator: true,
    initials: 'WBN',
    color: '#1a6bb5',
  },
  {
    name: 'Dr Wendpanga Jean Emmanuel',
    role: 'Médecin',
    fonction: 'Membre de l\'équipe scientifique',
    description: 'Contribution à la validation scientifique du contenu médical de la plateforme.',
    initials: 'WJE',
    color: '#16a085',
  },
  {
    name: 'Dr Abdoul Salam TIEMTORE',
    role: 'Médecin',
    fonction: 'Membre de l\'équipe scientifique',
    description: 'Contribution à la validation scientifique du contenu médical de la plateforme.',
    initials: 'AST',
    color: '#7c3aed',
  },
];

const STATS = [
  { value: '10', label: 'Fiches CAT', icon: BookOpen, color: '#1a6bb5', bg: '#e8f2fb' },
  { value: '20+', label: 'Médicaments référencés', icon: Heart, color: '#16a085', bg: '#e0f5f0' },
  { value: '6', label: 'Villes couvertes', icon: Globe, color: '#7c3aed', bg: '#ede9fe' },
  { value: '100%', label: 'Contenu validé', icon: Award, color: '#b45309', bg: '#fef3c7' },
];

const AboutPage: React.FC = () => {
  return (
    <div className="animate-fade" style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Header hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a6bb5 0%, #0d5299 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem 1.5rem',
        marginBottom: '1.5rem',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            width: 72, height: 72,
            background: 'rgba(255,255,255,0.15)',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: 32,
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}>
            {/* Medical stethoscope SVG */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
              <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
              <circle cx="20" cy="10" r="2"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            Assistant Rhumato
          </h1>
          <p style={{ opacity: 0.9, fontSize: '0.9rem', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
            Aide à la décision clinique en rhumatologie
          </p>
          <p style={{ opacity: 0.75, fontSize: '0.8rem', margin: 0 }}>
            Développé pour les médecins généralistes du Burkina Faso
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: 'var(--text)', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={16} color="var(--primary)" />
          Notre mission
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>
          Assistant Rhumato est une plateforme d'aide à la décision clinique conçue pour améliorer
          la prise en charge des pathologies rhumatologiques en médecine générale au Burkina Faso.
          Elle fournit aux praticiens des conduites à tenir structurées, des références médicamenteuses
          et un espace de partage de cas cliniques pour renforcer les compétences collectives.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {STATS.map(s => (
          <div key={s.label} className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.3rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Équipe scientifique */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
          <Users size={18} color="var(--primary)" />
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', color: 'var(--text)', margin: 0 }}>
            Équipe scientifique
          </h2>
        </div>

        {TEAM.map((member, i) => (
          <div key={i} className="card" style={{
            padding: '1.25rem',
            marginBottom: '0.75rem',
            borderLeft: `3px solid ${member.color}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {/* Avatar */}
              <div style={{
                width: 52, height: 52,
                borderRadius: '50%',
                background: member.isCreator
                  ? `linear-gradient(135deg, ${member.color}, #16a085)`
                  : member.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white',
                fontFamily: 'Sora, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0,
                boxShadow: member.isCreator ? `0 4px 12px ${member.color}40` : 'none',
              }}>
                {member.initials}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                  <div>
                    <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                      {member.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: member.color, fontWeight: 500 }}>
                      {member.role}
                    </div>
                  </div>
                  {member.isCreator && (
                    <span style={{
                      background: '#fef3c7', color: '#b45309',
                      padding: '2px 10px', borderRadius: 20,
                      fontSize: '0.72rem', fontWeight: 600,
                      border: '1px solid #fcd34d',
                      display: 'flex', alignItems: 'center', gap: 4,
                      flexShrink: 0,
                    }}>
                      <Award size={11} /> Concepteur
                    </span>
                  )}
                </div>
                <div style={{
                  display: 'inline-block',
                  background: 'var(--surface2)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                  border: '1px solid var(--border)',
                }}>
                  {member.fonction}
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                  {member.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Version & contact */}
      <div className="card" style={{ padding: '1.25rem', background: 'var(--surface2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>Version</div>
            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>1.0.0 — 2025</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>Pays</div>
            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>Burkina Faso 🇧🇫</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 2 }}>Usage</div>
            <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>Médecine générale</div>
          </div>
        </div>
        <div style={{
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
          textAlign: 'center',
        }}>
          Cette plateforme est destinée aux professionnels de santé. Le contenu est fourni à titre
          indicatif et ne remplace pas le jugement clinique du médecin.
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
