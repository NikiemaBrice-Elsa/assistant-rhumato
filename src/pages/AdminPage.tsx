import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { sendInvitationEmail } from '../services/emailService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Users, Calendar, Mail, Building2, Megaphone, Pill,
  Plus, Trash2, Download, Search, X, Check, Send,
} from 'lucide-react';
import type { UserProfile, MedicalEvent, Lab, Invitation, Confirmation, Ad } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type AdminTab = 'users' | 'events' | 'invitations' | 'labs' | 'ads' | 'medications';

const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [cityFilter, setCityFilter] = useState('Tous');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadData();
  }, [isAdmin, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'users') {
        const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
        setUsers(snap.docs.map(d => d.data() as UserProfile));
      } else if (tab === 'events') {
        const snap = await getDocs(query(collection(db, 'events'), orderBy('createdAt', 'desc')));
        setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as MedicalEvent)));
      } else if (tab === 'labs') {
        const snap = await getDocs(query(collection(db, 'labs'), orderBy('createdAt', 'desc')));
        setLabs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lab)));
      } else if (tab === 'invitations') {
        const snap = await getDocs(query(collection(db, 'invitations'), orderBy('createdAt', 'desc')));
        setInvitations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invitation)));
      } else if (tab === 'ads') {
        const snap = await getDocs(query(collection(db, 'ads'), orderBy('createdAt', 'desc')));
        setAds(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad)));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Export PDF - users
  const exportUsersPDF = () => {
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Assistant Rhumato — Liste des utilisateurs', 14, 22);
    pdf.setFontSize(10);
    pdf.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
    const filtered = users.filter(u => cityFilter === 'Tous' || u.city === cityFilter);
    autoTable(pdf, {
      startY: 36,
      head: [['Nom', 'Email', 'Ville', 'Inscription']],
      body: filtered.map(u => [
        u.displayName,
        u.email,
        u.city,
        new Date(u.createdAt).toLocaleDateString('fr-FR'),
      ]),
      headStyles: { fillColor: [26, 107, 181] },
    });
    pdf.save('utilisateurs_rhumato.pdf');
  };

  if (!isAdmin) return null;

  const TABS: { key: AdminTab; icon: React.ReactNode; label: string }[] = [
    { key: 'users', icon: <Users size={16} />, label: 'Utilisateurs' },
    { key: 'events', icon: <Calendar size={16} />, label: 'Évènements' },
    { key: 'invitations', icon: <Mail size={16} />, label: 'Invitations' },
    { key: 'labs', icon: <Building2 size={16} />, label: 'Labos' },
    { key: 'ads', icon: <Megaphone size={16} />, label: 'Publications' },
    { key: 'medications', icon: <Pill size={16} />, label: 'Médicaments' },
  ];

  const CITIES = ['Tous', 'Ouagadougou', 'Bobo Dioulasso', 'Koudougou', 'Kaya', 'Koupéla', 'Autre'];

  const filteredUsers = users.filter(u => {
    if (cityFilter !== 'Tous' && u.city !== cityFilter) return false;
    if (search && !u.displayName.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fade">
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 28 }}>🔐</div>
          <div>
            <h1 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
              Dashboard Administrateur
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.85 }}>
              {users.length} médecins inscrits · Accès complet
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Médecins', value: users.length, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'Évènements', value: events.length, color: '#15803d', bg: '#dcfce7' },
          { label: 'Labos partenaires', value: labs.length, color: '#7c3aed', bg: '#ede9fe' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '0.875rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, fontFamily: 'Sora, sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', overflowX: 'auto', padding: '2px' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.5rem 0.875rem',
              borderRadius: 8,
              background: tab === t.key ? '#6d28d9' : 'var(--surface)',
              color: tab === t.key ? 'white' : 'var(--text-muted)',
              border: tab === t.key ? 'none' : '1px solid var(--border)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '0.8rem', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              boxShadow: tab === t.key ? '0 2px 8px rgba(109,40,217,0.35)' : 'none',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : (
        <>
          {/* USERS */}
          {tab === 'users' && (
            <div className="animate-fade">
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
                  <Search size={15} color="var(--text-muted)" />
                  <input placeholder="Rechercher un médecin..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} className="input" style={{ width: 'auto' }}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={exportUsersPDF} className="btn-secondary">
                  <Download size={14} /> PDF
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                {filteredUsers.length} médecin{filteredUsers.length > 1 ? 's' : ''}
              </div>
              <div className="card table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Médecin</th>
                      <th>Email</th>
                      <th>Ville</th>
                      <th>Inscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>
                                {u.displayName?.charAt(0)}
                              </div>
                            )}
                            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{u.displayName}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.email}</td>
                        <td><span className="badge badge-blue">{u.city}</span></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun utilisateur trouvé</div>
                )}
              </div>
            </div>
          )}

          {/* EVENTS */}
          {tab === 'events' && (
            <EventsAdmin events={events} onRefresh={loadData} />
          )}

          {/* INVITATIONS */}
          {tab === 'invitations' && (
            <InvitationsAdmin users={users} invitations={invitations} onRefresh={loadData} />
          )}

          {/* LABS */}
          {tab === 'labs' && (
            <LabsAdmin labs={labs} onRefresh={loadData} />
          )}

          {/* ADS */}
          {tab === 'ads' && (
            <AdsAdmin ads={ads} labs={labs} onRefresh={loadData} />
          )}

          {/* MEDICATIONS */}
          {tab === 'medications' && (
            <AdminMedications />
          )}
        </>
      )}
    </div>
  );
};

// ---- Sub-sections ----

const EventsAdmin: React.FC<{ events: MedicalEvent[]; onRefresh: () => void }> = ({ events, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', heure: '', city: '', organizer: '', description: '', type: 'formation' as MedicalEvent['type'] });

  const handleSave = async () => {
    if (!form.title || !form.date) return;
    await addDoc(collection(db, 'events'), { ...form, createdAt: new Date().toISOString() });
    setShowForm(false);
    setForm({ title: '', date: '', heure: '', city: '', organizer: '', description: '', type: 'formation' });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet évènement ?')) return;
    await deleteDoc(doc(db, 'events', id));
    onRefresh();
  };

  return (
    <div className="animate-fade">
      <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginBottom: '1rem' }}>
        <Plus size={15} /> Nouvel évènement
      </button>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, margin: '0 0 1rem', color: 'var(--text)' }}>Créer un évènement</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input className="input" placeholder="Titre de l'évènement *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              <input className="input" placeholder="Heure (ex: 09h00 – 17h00)" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input className="input" placeholder="Ville" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
              <input className="input" placeholder="Organisateur" value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} />
            </div>
            <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as MedicalEvent['type'] })}>
              <option value="congres">Congrès</option>
              <option value="formation">Formation</option>
              <option value="webinaire">Webinaire</option>
              <option value="sponsored">Sponsorisé</option>
            </select>
            <textarea className="input" placeholder="Description" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSave} className="btn-primary"><Check size={14} /> Enregistrer</button>
              <button onClick={() => setShowForm(false)} className="btn-ghost"><X size={14} /> Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="card table-wrapper">
        <table>
          <thead><tr><th>Titre</th><th>Date</th><th>Ville</th><th>Type</th><th>Actions</th></tr></thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 500 }}>{e.title}</td>
                <td style={{ fontSize: '0.85rem' }}>{new Date(e.date).toLocaleDateString('fr-FR')}</td>
                <td style={{ fontSize: '0.85rem' }}>{e.city}</td>
                <td><span className="badge badge-blue">{e.type}</span></td>
                <td>
                  <button onClick={() => handleDelete(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun évènement</div>}
      </div>
    </div>
  );
};

const InvitationsAdmin: React.FC<{ users: UserProfile[]; invitations: Invitation[]; onRefresh: () => void }> = ({ users, invitations, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [form, setForm] = useState({ laboName: '', title: '', message: '', date: '', heure: '', city: '', recipients: 'all' as string, sendEmail: true });

  const handleSend = async () => {
    if (!form.title || !form.laboName) return;
    setSending(true);
    setSentCount(0);
    try {
      // 1 — Créer le document invitation
      const inv = await addDoc(collection(db, 'invitations'), {
        ...form, createdAt: new Date().toISOString(),
      });

      // 2 — Sélectionner les destinataires
      let targetUsers = users;
      if (form.recipients !== 'all') {
        targetUsers = users.filter(u => u.city === form.recipients);
      }

      let emailsSent = 0;
      // 3 — Pour chaque destinataire : confirmation + email
      for (const u of targetUsers.slice(0, 100)) {
        // Créer la confirmation Firestore
        await addDoc(collection(db, 'confirmations'), {
          invitationId: inv.id,
          userId: u.uid,
          userName: u.displayName,
          userEmail: u.email,
          userCity: u.city,
          response: 'pending',
        });

        // Envoyer email via emailService (Firebase Extension Trigger Email)
        if (form.sendEmail && u.email) {
          await sendInvitationEmail({
            to: u.email,
            recipientName: u.displayName,
            laboName: form.laboName,
            title: form.title,
            message: form.message,
            date: form.date,
            heure: form.heure,
            city: form.city,
          });
          emailsSent++;
          setSentCount(emailsSent);
        }
      }

      setShowForm(false);
      setForm({ laboName: '', title: '', message: '', date: '', heure: '', city: '', recipients: 'all', sendEmail: true });
      onRefresh();
    } finally {
      setSending(false);
    }
  };

  const exportConfirmedPDF = async (invId: string, invTitle: string) => {
    const snap = await getDocs(collection(db, 'confirmations'));
    const confirmed = snap.docs
      .map(d => d.data() as Confirmation)
      .filter(c => c.invitationId === invId && c.response === 'confirmed');

    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text(`Participants confirmés — ${invTitle}`, 14, 20);
    pdf.setFontSize(10);
    pdf.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} — ${confirmed.length} confirmés`, 14, 28);
    autoTable(pdf, {
      startY: 34,
      head: [['Nom', 'Email', 'Ville']],
      body: confirmed.map(c => [c.userName, c.userEmail, c.userCity]),
      headStyles: { fillColor: [109, 40, 217] },
    });
    pdf.save(`participants_${invId}.pdf`);
  };

  const CITIES = ['Ouagadougou', 'Bobo Dioulasso', 'Koudougou', 'Kaya', 'Koupéla', 'Autre'];

  return (
    <div className="animate-fade">
      <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginBottom: '1rem' }}>
        <Plus size={15} /> Créer une invitation
      </button>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, margin: '0 0 1rem', color: 'var(--text)' }}>Nouvelle invitation</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input className="input" placeholder="Nom du laboratoire *" value={form.laboName} onChange={e => setForm({ ...form, laboName: e.target.value })} />
            <input className="input" placeholder="Titre de l'invitation *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea className="input" placeholder="Message" rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              <input className="input" placeholder="Heure" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })} />
            </div>
            <input className="input" placeholder="Ville" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            <select className="input" value={form.recipients} onChange={e => setForm({ ...form, recipients: e.target.value })}>
              <option value="all">Tous les médecins</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* Option email */}
            <div style={{
              background: form.sendEmail ? '#e8f2fb' : 'var(--surface2)',
              border: `1.5px solid ${form.sendEmail ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 8, padding: '0.875rem 1rem',
              display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
            }} onClick={() => setForm({ ...form, sendEmail: !form.sendEmail })}>
              <div style={{
                width: 18, height: 18, borderRadius: 4, border: `2px solid ${form.sendEmail ? 'var(--primary)' : 'var(--border)'}`,
                background: form.sendEmail ? 'var(--primary)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
              }}>
                {form.sendEmail && <span style={{ color: 'white', fontSize: 11, lineHeight: 1 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
                  📧 Envoyer un email aux médecins sélectionnés
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Utilise la collection Firestore <code style={{ background: 'var(--surface)', padding: '1px 4px', borderRadius: 3 }}>mail</code> —
                  nécessite l'extension Firebase <strong>Trigger Email</strong> configurée.
                </div>
              </div>
            </div>

            {/* Feedback envoi */}
            {sending && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '0.75rem 1rem',
                background: '#e0f5f0', border: '1px solid #a7f3d0', borderRadius: 8,
              }}>
                <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#16a085' }} />
                <span style={{ fontSize: '0.875rem', color: '#065f46', fontWeight: 500 }}>
                  Envoi en cours... {sentCount} email{sentCount > 1 ? 's' : ''} envoyé{sentCount > 1 ? 's' : ''}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSend} disabled={sending} className="btn-primary">
                {sending
                  ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Envoi...</>
                  : <><Send size={14} /> {form.sendEmail ? `Envoyer + Email` : 'Envoyer sans email'}</>
                }
              </button>
              <button onClick={() => setShowForm(false)} className="btn-ghost"><X size={14} /> Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="card table-wrapper">
        <table>
          <thead><tr><th>Titre</th><th>Labo</th><th>Date</th><th>Destinataires</th><th>Actions</th></tr></thead>
          <tbody>
            {invitations.map(inv => (
              <tr key={inv.id}>
                <td style={{ fontWeight: 500 }}>{inv.title}</td>
                <td style={{ fontSize: '0.85rem' }}>{inv.laboName}</td>
                <td style={{ fontSize: '0.85rem' }}>{inv.date ? new Date(inv.date).toLocaleDateString('fr-FR') : '—'}</td>
                <td><span className="badge badge-gray">{inv.recipients === 'all' ? 'Tous' : inv.recipients}</span></td>
                <td>
                  <button onClick={() => exportConfirmedPDF(inv.id, inv.title)} className="btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                    <Download size={12} /> PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {invitations.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucune invitation envoyée</div>}
      </div>
    </div>
  );
};

const LabsAdmin: React.FC<{ labs: Lab[]; onRefresh: () => void }> = ({ labs, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nom: '', contact: '', telephone: '', email: '' });

  const handleSave = async () => {
    if (!form.nom) return;
    await addDoc(collection(db, 'labs'), { ...form, createdAt: new Date().toISOString() });
    setShowForm(false);
    setForm({ nom: '', contact: '', telephone: '', email: '' });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce laboratoire ?')) return;
    await deleteDoc(doc(db, 'labs', id));
    onRefresh();
  };

  return (
    <div className="animate-fade">
      <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginBottom: '1rem' }}>
        <Plus size={15} /> Ajouter un labo
      </button>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, margin: '0 0 1rem', color: 'var(--text)' }}>Nouveau laboratoire</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input className="input" placeholder="Nom du laboratoire *" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
            <input className="input" placeholder="Contact (nom)" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
            <input className="input" placeholder="Téléphone" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
            <input className="input" placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSave} className="btn-primary"><Check size={14} /> Enregistrer</button>
              <button onClick={() => setShowForm(false)} className="btn-ghost"><X size={14} /> Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="card table-wrapper">
        <table>
          <thead><tr><th>Laboratoire</th><th>Contact</th><th>Téléphone</th><th>Email</th><th>Actions</th></tr></thead>
          <tbody>
            {labs.map(l => (
              <tr key={l.id}>
                <td style={{ fontWeight: 600 }}>{l.nom}</td>
                <td style={{ fontSize: '0.85rem' }}>{l.contact}</td>
                <td style={{ fontSize: '0.85rem' }}>{l.telephone}</td>
                <td style={{ fontSize: '0.85rem' }}>{l.email}</td>
                <td>
                  <button onClick={() => handleDelete(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {labs.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun laboratoire partenaire</div>}
      </div>
    </div>
  );
};

const AdsAdmin: React.FC<{ ads: Ad[]; labs: Lab[]; onRefresh: () => void }> = ({ ads, labs, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ laboId: '', laboName: '', title: '', description: '', status: 'active' as Ad['status'], startsAt: '', expiresAt: '' });

  const handleSave = async () => {
    if (!form.title) return;
    await addDoc(collection(db, 'ads'), { ...form, createdAt: new Date().toISOString() });
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette publication ?')) return;
    await deleteDoc(doc(db, 'ads', id));
    onRefresh();
  };

  const statusBadge = (s: Ad['status']) => {
    if (s === 'active') return <span className="badge badge-green">En cours</span>;
    if (s === 'planned') return <span className="badge badge-yellow">Planifié</span>;
    return <span className="badge badge-gray">Expiré</span>;
  };

  return (
    <div className="animate-fade">
      <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginBottom: '1rem' }}>
        <Plus size={15} /> Nouvelle publication
      </button>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, margin: '0 0 1rem', color: 'var(--text)' }}>Publication commerciale</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <select className="input" value={form.laboId} onChange={e => {
              const lab = labs.find(l => l.id === e.target.value);
              setForm({ ...form, laboId: e.target.value, laboName: lab?.nom || '' });
            }}>
              <option value="">Sélectionner un laboratoire</option>
              {labs.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
            </select>
            <input className="input" placeholder="Titre *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea className="input" placeholder="Description" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Ad['status'] })}>
              <option value="active">En cours</option>
              <option value="planned">Planifié</option>
              <option value="expired">Expiré</option>
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Date début</label>
                <input className="input" type="date" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Date fin</label>
                <input className="input" type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSave} className="btn-primary"><Check size={14} /> Publier</button>
              <button onClick={() => setShowForm(false)} className="btn-ghost"><X size={14} /> Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="card table-wrapper">
        <table>
          <thead><tr><th>Titre</th><th>Laboratoire</th><th>Statut</th><th>Expire</th><th>Actions</th></tr></thead>
          <tbody>
            {ads.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500 }}>{a.title}</td>
                <td style={{ fontSize: '0.85rem' }}>{a.laboName}</td>
                <td>{statusBadge(a.status)}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {a.expiresAt ? new Date(a.expiresAt).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td>
                  <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ads.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucune publication commerciale</div>}
      </div>
    </div>
  );
};

const AdminMedications: React.FC = () => {
  const [meds, setMeds] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ dci: '', nomCommercial: '', classe: '', posologie: '', prixIndicatif: '', disponibleLocalement: true, actif: true });
  useEffect(() => {
    const fetch = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'medications'), orderBy('createdAt', 'desc')));
        setMeds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { setMeds([]); }
      finally { }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!form.dci) return;
    await addDoc(collection(db, 'medications'), {
      ...form,
      nomCommercial: form.nomCommercial.split(',').map(s => s.trim()),
      contreIndications: [],
      effetsSecondaires: [],
      createdAt: new Date().toISOString(),
    });
    setShowForm(false);
    setForm({ dci: '', nomCommercial: '', classe: '', posologie: '', prixIndicatif: '', disponibleLocalement: true, actif: true });
  };

  const toggleActive = async (id: string, actif: boolean) => {
    await updateDoc(doc(db, 'medications', id), { actif: !actif });
    setMeds(prev => prev.map(m => m.id === id ? { ...m, actif: !actif } : m));
  };

  return (
    <div className="animate-fade">
      <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginBottom: '1rem' }}>
        <Plus size={15} /> Ajouter un médicament
      </button>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, margin: '0 0 1rem', color: 'var(--text)' }}>Nouveau médicament</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <input className="input" placeholder="DCI *" value={form.dci} onChange={e => setForm({ ...form, dci: e.target.value })} />
            <input className="input" placeholder="Noms commerciaux (séparés par virgule)" value={form.nomCommercial} onChange={e => setForm({ ...form, nomCommercial: e.target.value })} />
            <input className="input" placeholder="Classe thérapeutique" value={form.classe} onChange={e => setForm({ ...form, classe: e.target.value })} />
            <textarea className="input" placeholder="Posologie" rows={2} value={form.posologie} onChange={e => setForm({ ...form, posologie: e.target.value })} />
            <input className="input" placeholder="Prix indicatif (ex: 1000–3000 FCFA)" value={form.prixIndicatif} onChange={e => setForm({ ...form, prixIndicatif: e.target.value })} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text)' }}>
              <input type="checkbox" checked={form.disponibleLocalement} onChange={e => setForm({ ...form, disponibleLocalement: e.target.checked })} />
              Disponible localement
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSave} className="btn-primary"><Check size={14} /> Enregistrer</button>
              <button onClick={() => setShowForm(false)} className="btn-ghost"><X size={14} /> Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="card table-wrapper">
        <table>
          <thead><tr><th>DCI</th><th>Classe</th><th>Disponible</th><th>Statut</th><th>Actions</th></tr></thead>
          <tbody>
            {meds.map(m => (
              <tr key={m.id} style={{ opacity: m.actif ? 1 : 0.5 }}>
                <td style={{ fontWeight: 500 }}>{m.dci}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{m.classe}</td>
                <td>{m.disponibleLocalement ? <span className="badge badge-green">✓</span> : <span className="badge badge-gray">Non</span>}</td>
                <td>{m.actif ? <span className="badge badge-green">Actif</span> : <span className="badge badge-gray">Désactivé</span>}</td>
                <td>
                  <button onClick={() => toggleActive(m.id, m.actif)} className="btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                    {m.actif ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {meds.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Les médicaments ajoutés ici seront prioritaires sur ceux intégrés.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
