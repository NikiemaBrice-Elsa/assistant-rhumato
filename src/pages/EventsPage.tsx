import React, { useState, useEffect } from 'react';
import { collection, getDocs, orderBy, query, addDoc } from 'firebase/firestore';
import { sendConfirmationEmail } from '../services/emailService';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, MapPin, User, Check } from 'lucide-react';
import type { MedicalEvent } from '../types';

const EVENT_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  congres: { label: 'Congrès', color: '#1d4ed8', bg: '#dbeafe' },
  formation: { label: 'Formation', color: '#15803d', bg: '#dcfce7' },
  webinaire: { label: 'Webinaire', color: '#7c3aed', bg: '#ede9fe' },
  sponsored: { label: 'Sponsorisé', color: '#b45309', bg: '#fef3c7' },
};

const EventsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [participating, setParticipating] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as MedicalEvent)));
      } catch (e) {
        // Show demo events if Firebase not set up
        setEvents(DEMO_EVENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleParticipate = async (eventId: string) => {
    if (participating.has(eventId)) return;
    try {
      await addDoc(collection(db, 'confirmations'), {
        invitationId: eventId,
        userId: currentUser!.uid,
        userName: currentUser!.displayName,
        userEmail: currentUser!.email,
        response: 'confirmed',
        respondedAt: new Date().toISOString(),
      });
      // Email de confirmation
      const event = events.find(e => e.id === eventId);
      if (event && currentUser!.email) {
        await sendConfirmationEmail({
          to: currentUser!.email,
          name: currentUser!.displayName || 'Médecin',
          eventTitle: event.title,
          eventDate: event.date,
          eventCity: event.city,
        }).catch(() => {}); // email non bloquant
      }
      setParticipating(prev => new Set([...prev, eventId]));
    } catch (e) {
      setParticipating(prev => new Set([...prev, eventId]));
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="section-title">Évènements</h1>
        <p className="section-subtitle">Congrès, formations, webinaires et rencontres médicales</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>📅</div>
          <div style={{ fontWeight: 500 }}>Aucun évènement programmé</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {events.map(event => {
            const type = EVENT_TYPES[event.type] || EVENT_TYPES.formation;
            const joined = participating.has(event.id);
            return (
              <div key={event.id} className="card animate-fade" style={{ overflow: 'hidden' }}>
                {event.imageUrl && (
                  <div style={{ height: 160, overflow: 'hidden' }}>
                    <img src={event.imageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: 8 }}>
                    <span className="badge" style={{ background: type.bg, color: type.color }}>{type.label}</span>
                  </div>
                  <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.875rem', color: 'var(--text)', lineHeight: 1.3 }}>
                    {event.title}
                  </h3>
                  <div style={{ display: 'grid', gap: '0.4rem', marginBottom: '1rem' }}>
                    <EventInfo icon={<Calendar size={14} />} text={formatDate(event.date)} />
                    <EventInfo icon={<Clock size={14} />} text={event.heure} />
                    <EventInfo icon={<MapPin size={14} />} text={event.city} />
                    <EventInfo icon={<User size={14} />} text={event.organizer} />
                  </div>
                  {event.description && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1rem', lineHeight: 1.5 }}>
                      {event.description}
                    </p>
                  )}
                  <button
                    onClick={() => handleParticipate(event.id)}
                    disabled={joined}
                    className={joined ? 'btn-secondary' : 'btn-primary'}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {joined ? <><Check size={15} /> Participation confirmée</> : '🎯 Participer'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EventInfo: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
    <span style={{ color: 'var(--primary)', flexShrink: 0 }}>{icon}</span>
    {text}
  </div>
);

// Demo events when Firebase not configured
const DEMO_EVENTS: MedicalEvent[] = [
  {
    id: '1',
    title: 'Journée nationale de Rhumatologie — Burkina Faso 2025',
    date: '2025-06-15',
    heure: '08h00 – 17h00',
    city: 'Ouagadougou',
    organizer: 'Société Burkinabè de Rhumatologie',
    type: 'congres',
    description: 'Une journée dédiée aux avancées en rhumatologie, avec des conférences d\'experts et des ateliers pratiques pour les médecins généralistes.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Webinaire : Prise en charge de la goutte en pratique quotidienne',
    date: '2025-05-20',
    heure: '19h00 – 20h30',
    city: 'En ligne (Zoom)',
    organizer: 'Association des Médecins Généralistes du BF',
    type: 'webinaire',
    description: 'Cas pratiques et recommandations actualisées pour la gestion de l\'hyperuricémie et des crises de goutte.',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Formation : Infiltrations articulaires pour le généraliste',
    date: '2025-07-10',
    heure: '09h00 – 13h00',
    city: 'Bobo Dioulasso',
    organizer: 'CHU Sanou Souro',
    type: 'formation',
    description: 'Atelier pratique avec simulation sur les infiltrations des principales articulations (genou, épaule).',
    createdAt: new Date().toISOString(),
  },
];

export default EventsPage;
