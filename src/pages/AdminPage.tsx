import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { triggerPushNotification } from '../services/notificationService';
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


// ─── Get logo as base64 for PDF ──────────────────────────────────
const getLogoBase64 = (): Promise<string | null> => {
  return new Promise(resolve => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = '/logo.png?v=' + Date.now();
    } catch { resolve(null); }
  });
};

// ─── PDF Header with logo ─────────────────────────────────────────
const addPDFHeader = (pdf: any, title: string, logoBase64?: string | null, subtitle?: string): number => {
  const pageWidth = pdf.internal.pageSize.getWidth();

  // Blue header background
  pdf.setFillColor(26, 107, 181);
  pdf.rect(0, 0, pageWidth, 38, 'F');

  // Logo if available
  if (logoBase64) {
    try { pdf.addImage(logoBase64, 'PNG', 6, 3, 30, 30); } catch {}
  }

  const textX = logoBase64 ? 42 : 14;

  // Title in white
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, textX, 17);

  // Subtitle & date
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(subtitle || 'Groupe Assistant Rhumato', textX, 27);
  pdf.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 62, 27);

  // Reset
  pdf.setTextColor(0, 0, 0);
  pdf.setDrawColor(26, 107, 181);
  pdf.setLineWidth(0.3);
  pdf.line(0, 38, pageWidth, 38);

  return 44;
};

// ─── PDF Footer ───────────────────────────────────────────────────
const addPDFFooter = (pdf: any): void => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);
  pdf.text('Groupe Assistant Rhumato — Burkina Faso', 14, pageHeight - 8);
  pdf.text(`Page ${pdf.internal.getCurrentPageInfo().pageNumber}`, pageWidth - 20, pageHeight - 8);
  pdf.setTextColor(0, 0, 0);
};

type AdminTab = 'users' | 'events' | 'invitations' | 'labs' | 'ads' | 'medications' | 'stats' | 'revenues';

const AdminPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('users');
  const [catStats, setCatStats] = useState<{catId:string;title:string;visits:number}[]>([]);
  const [revenues, setRevenues] = useState<any[]>([]);
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
      } else if (tab === 'stats') {
        const snap = await getDocs(collection(db, 'cat_stats'));
        const list = snap.docs.map(d => ({ catId: d.id, ...d.data() } as {catId:string;title:string;visits:number}));
        list.sort((a, b) => (b.visits || 0) - (a.visits || 0));
        setCatStats(list);
      } else if (tab === 'revenues') {
        const snap = await getDocs(query(collection(db, 'ads'), orderBy('createdAt', 'desc')));
        setRevenues(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Export PDF - users
  const exportUsersPDF = async () => {
    const logo = await getLogoBase64();
    const pdf = new jsPDF();
    const startY = addPDFHeader(pdf, 'Liste des utilisateurs', logo, 'Groupe Assistant Rhumato');
    const filtered = users.filter(u => cityFilter === 'Tous' || u.city === cityFilter);
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${filtered.length} médecin${filtered.length > 1 ? 's' : ''} — Filtre: ${cityFilter}`, 14, startY - 4);
    pdf.setTextColor(0, 0, 0);
    autoTable(pdf, {
      startY,
      head: [['Nom', 'Email', 'Ville', 'Inscription']],
      body: filtered.map(u => [
        u.displayName,
        u.email,
        u.city,
        new Date(u.createdAt).toLocaleDateString('fr-FR'),
      ]),
      headStyles: { fillColor: [26, 107, 181], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 249, 255] },
      styles: { fontSize: 9 },
      didDrawPage: () => addPDFFooter(pdf),
    });
    addPDFFooter(pdf);
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
    { key: 'stats', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label: 'Stats CAT' },
    { key: 'revenues', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>, label: 'Revenus' },
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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
          {tab === 'stats' && (
            <div className="animate-fade">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', margin: 0, color: 'var(--text)' }}>
                  Consultations des fiches CAT
                </h3>
                {catStats.length > 0 && (
                  <button onClick={async () => {
                    const logo = await getLogoBase64();
                    const pdf = new jsPDF();
                    const startY = addPDFHeader(pdf, 'Statistiques — CAT Rhumato', logo, 'Groupe Assistant Rhumato');
                    const total = catStats.reduce((sum, s) => sum + (s.visits || 0), 0);
                    pdf.setFontSize(9); pdf.setTextColor(100);
                    pdf.text(`Total : ${total} visite${total > 1 ? 's' : ''} · ${catStats.length} fiche${catStats.length > 1 ? 's' : ''}`, 14, startY - 4);
                    pdf.setTextColor(0, 0, 0);
                    autoTable(pdf, {
                      startY,
                      head: [['#', 'Fiche CAT', 'Visites']],
                      body: catStats.map((s, i) => [i + 1, s.title, s.visits]),
                      headStyles: { fillColor: [26, 107, 181], textColor: 255, fontStyle: 'bold' },
                      columnStyles: { 0: { cellWidth: 12 }, 2: { cellWidth: 20, halign: 'center' } },
                      alternateRowStyles: { fillColor: [240, 247, 255] },
                      styles: { fontSize: 9 },
                      didDrawPage: () => addPDFFooter(pdf),
                    });
                    addPDFFooter(pdf);
                    pdf.save('stats_CAT_rhumato.pdf');
                  }} className="btn-ghost" style={{ padding: '0.35rem 0.875rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                    Exporter PDF
                  </button>
                )}
              </div>
              {catStats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Aucune statistique disponible — les visites seront comptabilisées dès qu'un utilisateur ouvrira une fiche.
                </div>
              ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  {catStats.map((s, i) => {
                    const maxVisits = catStats[0]?.visits || 1;
                    const pct = Math.round((s.visits / maxVisits) * 100);
                    return (
                      <div key={s.catId} style={{
                        padding: '0.875rem 1.25rem',
                        borderBottom: i < catStats.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex', alignItems: 'center', gap: '1rem',
                      }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '0.75rem', color: 'var(--primary)' }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: 4 }}>{s.title}</div>
                          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: pct + '%', background: 'var(--primary)', borderRadius: 3 }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{s.visits}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>visite{s.visits > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {tab === 'revenues' && (
            <RevenuesAdmin ads={revenues} onRefresh={loadData} />
          )}
        </>
      )}
    </div>
  );
};

// ---- Sub-sections ----

const EventsAdmin: React.FC<{ events: MedicalEvent[]; onRefresh: () => void }> = ({ events, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', heure: '', city: '', organizer: '', description: '', type: 'formation' as MedicalEvent['type'], pdfUrl: '', lienUrl: '' });
  const [confirmations, setConfirmations] = useState<{[eventId: string]: any[]}>({});
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title || !form.date) return;
    await addDoc(collection(db, 'events'), { ...form, createdAt: new Date().toISOString() });
    triggerPushNotification({ title: 'Nouvel évènement', body: form.title, url: '/evenements', tag: 'new-event' }).catch(() => {});
    setShowForm(false);
    setForm({ title: '', date: '', heure: '', city: '', organizer: '', description: '', type: 'formation', pdfUrl: '', lienUrl: '' });
    onRefresh();
  };

  const loadConfirmations = async (eventId: string) => {
    if (confirmations[eventId]) { setShowConfirm(eventId); return; }
    const snap = await getDocs(collection(db, 'confirmations'));
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const forEvent = all.filter((c: any) => c.invitationId === eventId);
    setConfirmations(prev => ({ ...prev, [eventId]: forEvent }));
    setShowConfirm(eventId);
  };

  const exportParticipantsPDF = async (eventId: string) => {
    const eventTitle = events.find(e => e.id === eventId)?.title || 'Évènement';
    const list = confirmations[eventId] || [];
    const logo = await getLogoBase64();
    const pdf = new jsPDF();
    const startY = addPDFHeader(pdf, `Participants — ${eventTitle}`, logo, 'Groupe Assistant Rhumato');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${list.length} participant${list.length > 1 ? 's' : ''} confirmé${list.length > 1 ? 's' : ''}`, 14, startY - 4);
    pdf.setTextColor(0, 0, 0);
    autoTable(pdf, {
      startY,
      head: [['Nom', 'Email']],
      body: list.map((c: any) => [c.userName || '', c.userEmail || '']),
      headStyles: { fillColor: [26, 107, 181], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 247, 255] },
      styles: { fontSize: 9 },
      didDrawPage: () => addPDFFooter(pdf),
    });
    addPDFFooter(pdf);
    pdf.save(`participants_${eventTitle.replace(/\s+/g, '_')}.pdf`);
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
            <input className="input" placeholder="Lien PDF ou image (URL externe)" value={form.pdfUrl} onChange={e => setForm({ ...form, pdfUrl: e.target.value })} />
            <input className="input" placeholder="Lien vidéo ou site (URL externe)" value={form.lienUrl} onChange={e => setForm({ ...form, lienUrl: e.target.value })} />
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
                <td style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => loadConfirmations(e.id)} className="btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} title="Voir les participants">
                    Participants
                  </button>
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

      {/* Modal participants */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(null)}>
          <div className="modal" style={{ maxWidth: 500, padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, margin: 0, color: 'var(--text)' }}>Participants confirmés</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {(confirmations[showConfirm] || []).length > 0 && (
                  <button onClick={() => exportParticipantsPDF(showConfirm)} className="btn-ghost" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                    Exporter PDF
                  </button>
                )}
                <button onClick={() => setShowConfirm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
              </div>
            </div>
            {(confirmations[showConfirm] || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Aucune confirmation pour cet évènement.</div>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {(confirmations[showConfirm] || []).map((c: any, i: number) => (
                  <div key={i} style={{ padding: '0.75rem', background: 'var(--surface2)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text)' }}>{c.userName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.userEmail}</div>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>Confirmé</span>
                  </div>
                ))}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>
                  {(confirmations[showConfirm] || []).length} participant(s)
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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

    const logo = await getLogoBase64();
    const pdf = new jsPDF();
    const startY = addPDFHeader(pdf, `Participants — ${invTitle}`, logo, 'Groupe Assistant Rhumato');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${confirmed.length} participant${confirmed.length > 1 ? 's' : ''} confirmé${confirmed.length > 1 ? 's' : ''}`, 14, startY - 4);
    pdf.setTextColor(0, 0, 0);
    autoTable(pdf, {
      startY,
      head: [['Nom', 'Email', 'Ville']],
      body: confirmed.map(c => [c.userName, c.userEmail, c.userCity]),
      headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 245, 255] },
      styles: { fontSize: 9 },
      didDrawPage: () => addPDFFooter(pdf),
    });
    addPDFFooter(pdf);
    pdf.save(`participants_${invTitle.replace(/\s+/g, '_')}.pdf`);
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
                  Envoyer un email aux médecins sélectionnés
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
  const [form, setForm] = useState({ nom: '', contact: '', telephone: '', email: '', afficheUrl: '' });

  const handleSave = async () => {
    if (!form.nom) return;
    await addDoc(collection(db, 'labs'), { ...form, createdAt: new Date().toISOString() });
    setShowForm(false);
    setForm({ nom: '', contact: '', telephone: '', email: '', afficheUrl: '' });
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
            <input className="input" placeholder="URL de l'affiche (lien image externe, ex: https://...)" value={form.afficheUrl} onChange={e => setForm({ ...form, afficheUrl: e.target.value })} />
            {form.afficheUrl && (
              <div style={{ marginTop: 4 }}>
                <img src={form.afficheUrl} alt="Aperçu affiche" style={{ maxHeight: 120, borderRadius: 6, border: '1px solid var(--border)' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSave} className="btn-primary"><Check size={14} /> Enregistrer</button>
              <button onClick={() => setShowForm(false)} className="btn-ghost"><X size={14} /> Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="card table-wrapper">
        <table>
          <thead><tr><th>Laboratoire</th><th>Contact</th><th>Téléphone</th><th>Email</th><th>Affiche</th><th>Actions</th></tr></thead>
          <tbody>
            {labs.map(l => (
              <tr key={l.id}>
                <td style={{ fontWeight: 600 }}>{l.nom}</td>
                <td style={{ fontSize: '0.85rem' }}>{l.contact}</td>
                <td style={{ fontSize: '0.85rem' }}>{l.telephone}</td>
                <td style={{ fontSize: '0.85rem' }}>{l.email}</td>
                <td>
                  {(l as any).afficheUrl ? (
                    <a href={(l as any).afficheUrl} target="_blank" rel="noopener noreferrer">
                      <img src={(l as any).afficheUrl} alt="affiche" style={{ height: 36, borderRadius: 4, objectFit: 'cover' }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    </a>
                  ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}
                </td>
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

const ADS_FORMATS = [
  { id: 'banniere', label: "Bannière (bas d'écran 5s)", desc: 'Visible à chaque connexion' },
  { id: 'interstitiel', label: 'Interstitiel (plein écran)', desc: '1x/jour au lancement' },
  { id: 'card', label: 'Card sponsorisée', desc: 'Intégrée dans le contenu' },
  { id: 'push', label: 'Notification Push', desc: 'Directement sur le téléphone' },
];

const ADS_TARIFS: Record<string, Record<string, number>> = {
  banniere:     { semaine: 20000, quinzaine: 35000, mois: 60000, trimestre: 150000 },
  interstitiel: { semaine: 40000, quinzaine: 70000, mois: 120000, trimestre: 300000 },
  card:         { semaine: 25000, quinzaine: 45000, mois: 80000, trimestre: 200000 },
  push:         { envoi: 15000 },
};

const ZONES = [
  { id: 'home', label: 'Tableau de bord', supplement: 0 },
  { id: 'medicaments', label: 'Médicaments', supplement: 20 },
  { id: 'cas', label: 'Cas cliniques', supplement: 15 },
  { id: 'evenements', label: 'Évènements', supplement: 10 },
  { id: 'cats', label: 'CAT Rhumato (liste)', supplement: 0 },
  { id: 'cat_detail', label: 'Fiche CAT détail', supplement: 30 },
];

const calcPrice = (format: string, duree: string, zones: string[], remisePct: number) => {
  const base = (ADS_TARIFS[format] || {})[duree] || 0;
  const maxSupplement = Math.max(...zones.map(z => ZONES.find(zz => zz.id === z)?.supplement || 0), 0);
  const withZone = base * (1 + maxSupplement / 100);
  return Math.round(withZone * (1 - remisePct / 100));
};

const AdsAdmin: React.FC<{ ads: Ad[]; labs: Lab[]; onRefresh: () => void }> = ({ ads, labs, onRefresh }) => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    laboId: '', laboName: '', title: '', description: '',
    format: 'banniere', duree: 'semaine',
    status: 'active' as Ad['status'], startsAt: '', expiresAt: '',
    imageUrl: '', lienUrl: '', zones: [] as string[],
    montant: 0, paiementStatut: 'en_attente' as 'en_attente' | 'recu',
    remise: 0, notes: '',
  });
  // Calcul automatique du prix
  const prixCalcule = calcPrice(form.format, form.duree, form.zones, form.remise);

  const handleSave = async () => {
    if (!form.title || !form.laboId) return;
    const data = {
      ...form, montant: form.montant || prixCalcule,
      createdAt: new Date().toISOString(),
      impressions: 0,
    };
    await addDoc(collection(db, 'ads'), data);
    // Trigger push notification si format push
    if (form.format === 'push') {
      await addDoc(collection(db, 'push_queue'), {
        title: form.title, body: form.description || form.title,
        url: '/', tag: 'ad-push', createdAt: new Date(), sent: false,
      });
    }
    setShowForm(false);
    setForm({ laboId: '', laboName: '', title: '', description: '', format: 'banniere', duree: 'semaine', status: 'active', startsAt: '', expiresAt: '', imageUrl: '', lienUrl: '', zones: [], montant: 0, paiementStatut: 'en_attente', remise: 0, notes: '' });
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette publication ?')) return;
    await deleteDoc(doc(db, 'ads', id));
    onRefresh();
  };

  const handleTogglePaiement = async (ad: Ad) => {
    const newStatut = (ad as any).paiementStatut === 'recu' ? 'en_attente' : 'recu';
    await updateDoc(doc(db, 'ads', ad.id), { paiementStatut: newStatut });
    onRefresh();
  };

  const generateFacturePDF = async (ad: any) => {
    const logo = await getLogoBase64();
    const pdf = new jsPDF();
    addPDFHeader(pdf, 'FACTURE PUBLICITAIRE', logo, 'Groupe Assistant Rhumato');
    const y = 60;
    pdf.setFontSize(10); pdf.setTextColor(0);
    pdf.text(`Laboratoire : ${ad.laboName}`, 14, y);
    pdf.text(`Publication : ${ad.title}`, 14, y + 8);
    pdf.text(`Format : ${ADS_FORMATS.find(f => f.id === ad.format)?.label || ad.format}`, 14, y + 16);
    pdf.text(`Durée : ${ad.duree || '—'}`, 14, y + 24);
    pdf.text(`Zones : ${(ad.zones || []).join(', ') || '—'}`, 14, y + 32);
    pdf.text(`Période : ${ad.startsAt || '—'} → ${ad.expiresAt || '—'}`, 14, y + 40);
    pdf.setDrawColor(200); pdf.line(14, y + 50, 196, y + 50);
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
    pdf.text(`Montant : ${(ad.montant || 0).toLocaleString('fr-FR')} FCFA`, 14, y + 62);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9); pdf.setTextColor(100);
    pdf.text(`Statut paiement : ${ad.paiementStatut === 'recu' ? 'Reçu ✓' : 'En attente'}`, 14, y + 72);
    pdf.text(`Créé le : ${new Date(ad.createdAt).toLocaleDateString('fr-FR')}`, 14, y + 80);
    pdf.text('Paiement par virement bancaire ou Mobile Money (Orange/Moov)', 14, y + 96);
    addPDFFooter(pdf);
    pdf.save(`facture_${ad.laboName}_${ad.title}.pdf`);
  };

  const totalRevenue = ads.filter((a: any) => a.paiementStatut === 'recu').reduce((s: number, a: any) => s + (a.montant || 0), 0);
  const pending = ads.filter((a: any) => a.paiementStatut !== 'recu').reduce((s: number, a: any) => s + (a.montant || 0), 0);

  return (
    <div className="animate-fade">
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          { label: 'Revenus perçus', value: `${totalRevenue.toLocaleString('fr-FR')} FCFA`, color: '#15803d', bg: '#dcfce7' },
          { label: 'En attente', value: `${pending.toLocaleString('fr-FR')} FCFA`, color: '#b45309', bg: '#fef3c7' },
          { label: 'Pubs actives', value: ads.filter((a: any) => a.status === 'active').length, color: 'var(--primary)', bg: 'var(--primary-light)' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: 10, padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Sora, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '0.7rem', color: k.color, opacity: 0.8, marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginBottom: '1rem' }}>
        <Plus size={15} /> Nouvelle publication
      </button>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, margin: '0 0 1rem', color: 'var(--text)' }}>Publication commerciale</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <select className="input" value={form.laboId} onChange={e => { const lab = labs.find(l => l.id === e.target.value); setForm({ ...form, laboId: e.target.value, laboName: lab?.nom || '' }); }}>
              <option value="">Sélectionner un laboratoire *</option>
              {labs.map(l => <option key={l.id} value={l.id}>{l.nom}</option>)}
            </select>
            <input className="input" placeholder="Titre *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <textarea className="input" placeholder="Description / message" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

            {/* Format */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Format</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {ADS_FORMATS.map(f => (
                  <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '0.5rem 0.75rem', borderRadius: 8, background: form.format === f.id ? 'var(--primary-light)' : 'var(--surface2)', border: `1.5px solid ${form.format === f.id ? 'var(--primary)' : 'var(--border)'}` }}>
                    <input type="radio" name="format" value={f.id} checked={form.format === f.id} onChange={() => setForm({ ...form, format: f.id })} style={{ accentColor: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text)' }}>{f.label}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.desc}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                      {Object.entries(ADS_TARIFS[f.id] || {}).map(([k, v]) => `${k}: ${v.toLocaleString('fr-FR')} FCFA`).join(' · ')}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Durée (pas pour push) */}
            {form.format !== 'push' && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Durée</div>
                <select className="input" value={form.duree} onChange={e => setForm({ ...form, duree: e.target.value })}>
                  <option value="semaine">1 semaine</option>
                  <option value="quinzaine">2 semaines</option>
                  <option value="mois">1 mois</option>
                  <option value="trimestre">3 mois</option>
                </select>
              </div>
            )}

            {/* Zones */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Zones d'affichage</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                {ZONES.map(z => (
                  <label key={z.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text)', padding: '0.35rem 0' }}>
                    <input type="checkbox" checked={form.zones.includes(z.id)} onChange={e => setForm({ ...form, zones: e.target.checked ? [...form.zones, z.id] : form.zones.filter(z2 => z2 !== z.id) }) } style={{ width: 15, height: 15, accentColor: 'var(--primary)' }} />
                    {z.label} {z.supplement > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--primary)' }}>+{z.supplement}%</span>}
                  </label>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Date début</label><input className="input" type="date" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} /></div>
              <div><label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Date fin</label><input className="input" type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
            </div>

            <input className="input" placeholder="URL image ou affiche" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
            <input className="input" placeholder="URL lien (site, PDF, vidéo)" value={form.lienUrl} onChange={e => setForm({ ...form, lienUrl: e.target.value })} />
            {form.imageUrl && <img src={form.imageUrl} alt="Aperçu" style={{ maxHeight: 100, borderRadius: 6, border: '1px solid var(--border)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}

            {/* Tarification */}
            <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '0.75rem', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>TARIFICATION CALCULÉE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Prix de base</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{prixCalcule.toLocaleString('fr-FR')} FCFA</div>
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>Remise % (fidélité/négociation)</div>
                  <input type="number" min={0} max={50} className="input" value={form.remise} onChange={e => setForm({ ...form, remise: Number(e.target.value) })} style={{ padding: '0.3rem 0.5rem' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Montant final</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#15803d' }}>{prixCalcule.toLocaleString('fr-FR')} FCFA</div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3 }}>Ou saisir un montant personnalisé</div>
                <input type="number" className="input" placeholder="Montant personnalisé (FCFA)" value={form.montant || ''} onChange={e => setForm({ ...form, montant: Number(e.target.value) })} style={{ padding: '0.3rem 0.5rem' }} />
              </div>
            </div>

            <select className="input" value={form.paiementStatut} onChange={e => setForm({ ...form, paiementStatut: e.target.value as any })}>
              <option value="en_attente">Paiement en attente</option>
              <option value="recu">Paiement reçu</option>
            </select>
            <textarea className="input" placeholder="Notes internes" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSave} disabled={!form.title || !form.laboId} className="btn-primary"><Check size={14} /> Publier</button>
              <button onClick={() => setShowForm(false)} className="btn-ghost"><X size={14} /> Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des pubs */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {ads.map((ad: any) => (
          <div key={ad.id} className="card" style={{ padding: '1rem', borderLeft: `4px solid ${ad.status === 'active' ? '#15803d' : ad.status === 'planned' ? '#b45309' : '#9ca3af'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 2 }}>{ad.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  {ad.laboName} · {ADS_FORMATS.find(f => f.id === ad.format)?.label || ad.format}
                  {ad.startsAt && ` · ${ad.startsAt} → ${ad.expiresAt || '?'}`}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {ad.status === 'active' && <span className="badge badge-green">En cours</span>}
                  {ad.status === 'planned' && <span className="badge badge-yellow">Planifié</span>}
                  {ad.status === 'expired' && <span className="badge badge-gray">Expiré</span>}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ad.paiementStatut === 'recu' ? '#15803d' : '#b45309' }}>
                    {(ad.montant || 0).toLocaleString('fr-FR')} FCFA — {ad.paiementStatut === 'recu' ? '✓ Payé' : '⏳ En attente'}
                  </span>
                  {(ad.impressions || 0) > 0 && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ad.impressions} affichages</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => handleTogglePaiement(ad)} className="btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }} title="Marquer paiement">
                  {ad.paiementStatut === 'recu' ? '↩ En attente' : '✓ Reçu'}
                </button>
                <button onClick={() => generateFacturePDF(ad)} className="btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }} title="Facture PDF">
                  PDF
                </button>
                <button onClick={() => handleDelete(ad.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {ads.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucune publication</div>}
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

// ─── Onglet Revenus ───────────────────────────────────────────────
const RevenuesAdmin: React.FC<{ ads: any[]; onRefresh: () => void }> = ({ ads }) => {
  const months: Record<string, number> = {};
  ads.forEach(a => {
    if (a.paiementStatut === 'recu' && a.montant) {
      const m = (a.createdAt || '').slice(0, 7);
      months[m] = (months[m] || 0) + a.montant;
    }
  });
  const totalRecu = ads.filter(a => a.paiementStatut === 'recu').reduce((s, a) => s + (a.montant || 0), 0);
  const totalAttendu = ads.reduce((s, a) => s + (a.montant || 0), 0);
  const monthsList = Object.entries(months).sort((a, b) => b[0].localeCompare(a[0]));

  const exportRevenuePDF = async () => {
    const logo = await getLogoBase64();
    const pdf = new jsPDF();
    const startY = addPDFHeader(pdf, 'Rapport de revenus publicitaires', logo, 'Groupe Assistant Rhumato');
    pdf.setFontSize(9); pdf.setTextColor(100);
    pdf.text(`Total perçu : ${totalRecu.toLocaleString('fr-FR')} FCFA  |  Total attendu : ${totalAttendu.toLocaleString('fr-FR')} FCFA`, 14, startY - 4);
    pdf.setTextColor(0);
    autoTable(pdf, {
      startY,
      head: [['Laboratoire', 'Publication', 'Format', 'Montant (FCFA)', 'Statut', 'Date']],
      body: ads.map(a => [
        a.laboName || '',
        a.title || '',
        a.format || '',
        (a.montant || 0).toLocaleString('fr-FR'),
        a.paiementStatut === 'recu' ? 'Reçu ✓' : 'En attente',
        (a.createdAt || '').slice(0, 10),
      ]),
      headStyles: { fillColor: [26, 107, 181], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 247, 255] },
      styles: { fontSize: 8 },
      didDrawPage: () => addPDFFooter(pdf),
    });
    addPDFFooter(pdf);
    pdf.save('revenus_assistant_rhumato.pdf');
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1rem', margin: 0, color: 'var(--text)' }}>Revenus publicitaires</h3>
        <button onClick={exportRevenuePDF} className="btn-ghost" style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          Exporter PDF
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ background: '#dcfce7', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: '#15803d' }}>{totalRecu.toLocaleString('fr-FR')}</div>
          <div style={{ fontSize: '0.75rem', color: '#15803d' }}>FCFA perçus</div>
        </div>
        <div style={{ background: '#fef3c7', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
          <div style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: '#b45309' }}>{(totalAttendu - totalRecu).toLocaleString('fr-FR')}</div>
          <div style={{ fontSize: '0.75rem', color: '#b45309' }}>FCFA en attente</div>
        </div>
      </div>

      {monthsList.length > 0 && (
        <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text)' }}>Revenus par mois</div>
          {monthsList.map(([m, v]) => (
            <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{new Date(m + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
              <span style={{ fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>{v.toLocaleString('fr-FR')} FCFA</span>
            </div>
          ))}
        </div>
      )}

      <div className="card table-wrapper">
        <table>
          <thead><tr><th>Laboratoire</th><th>Publication</th><th>Montant</th><th>Statut</th><th>Date</th></tr></thead>
          <tbody>
            {ads.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500 }}>{a.laboName}</td>
                <td style={{ fontSize: '0.82rem' }}>{a.title}</td>
                <td style={{ fontWeight: 700, color: '#15803d' }}>{(a.montant || 0).toLocaleString('fr-FR')} FCFA</td>
                <td><span className={`badge ${a.paiementStatut === 'recu' ? 'badge-green' : 'badge-yellow'}`}>{a.paiementStatut === 'recu' ? 'Reçu' : 'En attente'}</span></td>
                <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{(a.createdAt || '').slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ads.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Aucun contrat publicitaire</div>}
      </div>
    </div>
  );
};

export default AdminPage;
