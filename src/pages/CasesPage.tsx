import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, getDoc, addDoc, updateDoc, doc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { sendCaseApprovedEmail } from '../services/emailService';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Image, Send, X, Trash2, CheckCircle, XCircle } from 'lucide-react';
import type { ClinicalCase } from '../types';

const CasesPage: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');
  const [question, setQuestion] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = async () => {
    setLoading(true);
    try {
      // Charger tous les cas approuvés + les cas de l'utilisateur courant
      const q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const allCases = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClinicalCase));
      // Filtrer côté client : approuvés pour tous, + pending/rejected pour auteur et admin
      const visible = allCases.filter(c =>
        c.status === 'approved' ||
        isAdmin ||
        c.authorId === currentUser?.uid
      );
      setCases(visible);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, [isAdmin]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image trop grande (max 5MB)'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!text.trim() || !question.trim()) return;
    setSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Lecture image échouée'));
          reader.readAsDataURL(imageFile);
        });
      }
      await addDoc(collection(db, 'cases'), {
        authorId: currentUser!.uid,
        authorName: currentUser!.displayName || 'Médecin',
        authorPhoto: currentUser!.photoURL || '',
        text,
        imageUrl,
        question,
        status: 'approved', // Visible immédiatement
        likes: [],
        createdAt: new Date().toISOString(),
        commentsCount: 0,
      });
      setText(''); setQuestion(''); setImageFile(null); setImagePreview('');
      setShowForm(false);
      await fetchCases();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleLike = async (caseId: string, liked: boolean) => {
    const ref = doc(db, 'cases', caseId);
    await updateDoc(ref, { likes: liked ? arrayRemove(currentUser!.uid) : arrayUnion(currentUser!.uid) });
    setCases(prev => prev.map(c => c.id === caseId ? {
      ...c, likes: liked ? c.likes.filter(id => id !== currentUser!.uid) : [...c.likes, currentUser!.uid]
    } : c));
  };

  const handleModerate = async (caseId: string, status: 'approved' | 'rejected') => {
    await updateDoc(doc(db, 'cases', caseId), { status });
    if (status === 'approved') {
      const approvedCase = cases.find(c => c.id === caseId);
      if (approvedCase) {
        getDoc(doc(db, 'users', approvedCase.authorId)).then(snap => {
          if (snap.exists() && snap.data().email) {
            sendCaseApprovedEmail({
              to: snap.data().email,
              authorName: approvedCase.authorName,
              caseTitle: approvedCase.question.slice(0, 80),
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    }
    setCases(prev => prev.map(c => c.id === caseId ? { ...c, status } : c));
  };

  const handleDelete = async (caseId: string) => {
    if (!confirm('Supprimer ce cas ?')) return;
    await deleteDoc(doc(db, 'cases', caseId));
    setCases(prev => prev.filter(c => c.id !== caseId));
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="section-title">Cas cliniques</h1>
          <p className="section-subtitle">Partagez et discutez des cas avec la communauté</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <X size={15} /> : <Send size={15} />}
          {showForm ? 'Annuler' : 'Publier'}
        </button>
      </div>

      {showForm && (
        <div className="card animate-fade" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, margin: '0 0 1rem', color: 'var(--text)' }}>
            Nouveau cas clinique
          </h3>
          <textarea
            className="input"
            placeholder="Décrivez le cas clinique (présentation, contexte, histoire de la maladie...)"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            style={{ marginBottom: '0.75rem' }}
          />
          <input
            className="input"
            placeholder="Question à la communauté (ex: Quel diagnostic évoquez-vous ?)"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            style={{ marginBottom: '0.75rem' }}
          />

          {imagePreview && (
            <div style={{ position: 'relative', marginBottom: '0.75rem', display: 'inline-block' }}>
              <img src={imagePreview} alt="" style={{ maxHeight: 200, borderRadius: 8, display: 'block' }} />
              <button onClick={() => { setImageFile(null); setImagePreview(''); }} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={12} />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ cursor: 'pointer' }} className="btn-ghost">
              <Image size={15} /> Ajouter une image
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
            </label>
            <button onClick={handleSubmit} disabled={!text.trim() || !question.trim() || submitting} className="btn-primary">
              {submitting ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Send size={14} />}
              Publier
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      ) : cases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{marginBottom:"1rem"}}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
          <div style={{ fontWeight: 500 }}>Aucun cas publié pour l'instant</div>
          <div style={{ fontSize: '0.875rem', marginTop: 4 }}>Soyez le premier à partager un cas !</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {cases.map(c => {
            const liked = c.likes.includes(currentUser!.uid);
            return (
              <div key={c.id} className="card animate-fade" style={{ padding: '1.25rem', opacity: c.status === 'rejected' ? 0.6 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {c.authorPhoto ? (
                      <img src={c.authorPhoto} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600 }}>
                        {c.authorName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>{c.authorName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDate(c.createdAt)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {c.status === 'pending' && <span className="badge badge-yellow">En attente</span>}
                    {c.status === 'rejected' && <span className="badge badge-red">Refusé</span>}
                    {isAdmin && (
                      <>
                        {c.status === 'pending' && (
                          <>
                            <button onClick={() => handleModerate(c.id, 'approved')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d' }} title="Approuver">
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={() => handleModerate(c.id, 'rejected')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }} title="Rejeter">
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Supprimer">
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6 }}>{c.text}</p>

                {c.imageUrl && (
                  <img src={c.imageUrl} alt="Cas clinique" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, marginBottom: '0.75rem' }} />
                )}

                <div style={{
                  background: 'var(--primary-light)', borderRadius: 8,
                  padding: '0.75rem 1rem', marginBottom: '0.875rem',
                  borderLeft: '3px solid var(--primary)',
                  fontSize: '0.875rem', color: 'var(--text)', fontStyle: 'italic',
                }}>
                  {c.question}
                </div>

                <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => handleLike(c.id, liked)} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: liked ? '#dc2626' : 'var(--text-muted)',
                    fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif',
                    padding: 0, transition: 'color 0.15s',
                  }}>
                    <Heart size={17} fill={liked ? '#dc2626' : 'none'} />
                    {c.likes.length}
                  </button>
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '0.85rem',
                    fontFamily: 'DM Sans, sans-serif', padding: 0,
                  }}>
                    <MessageCircle size={17} />
                    {c.commentsCount || 0} commentaire{(c.commentsCount || 0) > 1 ? 's' : ''}
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

export default CasesPage;
