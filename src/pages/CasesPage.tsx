import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, doc, arrayUnion, arrayRemove, deleteDoc, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { triggerPushNotification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Image, Send, X, Trash2, ChevronDown, ChevronUp, Download } from 'lucide-react';
import type { ClinicalCase, CaseComment } from '../types';

// ─── Section commentaires d'un cas ───────────────────────────────
const CommentsSection: React.FC<{ caseId: string; commentsCount: number; imageUrl?: string }> = ({ caseId, commentsCount, imageUrl }) => {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<{id:string;name:string} | null>(null);
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    if (loaded) return;
    try {
      const snap = await getDocs(query(collection(db, 'cases', caseId, 'comments'), orderBy('createdAt', 'asc')));
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as CaseComment)));
      setLoaded(true);
    } catch (e) { console.error(e); }
  };

  const handleToggle = () => { const next = !open; setOpen(next); if (next) loadComments(); };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const comment: Omit<CaseComment, 'id'> = {
        caseId,
        authorId: currentUser!.uid,
        authorName: currentUser!.displayName || 'Médecin',
        authorPhoto: currentUser!.photoURL || '',
        text: replyTo ? `@${replyTo.name} ${text.trim()}` : text.trim(),
        replyToId: replyTo?.id,
        createdAt: new Date().toISOString(),
      };
      const ref = await addDoc(collection(db, 'cases', caseId, 'comments'), comment);
      await updateDoc(doc(db, 'cases', caseId), { commentsCount: increment(1) });
      setComments(prev => [...prev, { id: ref.id, ...comment }]);
      setText(''); setReplyTo(null);
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleDownloadImage = async () => {
    if (!imageUrl) return;
    // Si base64
    if (imageUrl.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `cas_clinique_${caseId}.jpg`;
      a.click();
      return;
    }
    // Si URL distante
    try {
      const resp = await fetch(imageUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `cas_clinique_${caseId}.jpg`; a.click();
      URL.revokeObjectURL(url);
    } catch { window.open(imageUrl, '_blank'); }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  return (
    <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: open ? '0.75rem' : 0 }}>
        <button onClick={handleToggle} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: open ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', padding: 0 }}>
          <MessageCircle size={17} />
          {commentsCount} commentaire{commentsCount > 1 ? 's' : ''}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {imageUrl && (
          <button onClick={handleDownloadImage} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif', padding: 0 }}>
            <Download size={15} /> Télécharger image
          </button>
        )}
      </div>

      {open && (
        <div>
          {comments.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>Aucun commentaire. Soyez le premier à répondre.</div>
          ) : (
            <div style={{ display: 'grid', gap: '0.625rem', marginBottom: '0.75rem' }}>
              {comments.map(cm => (
                <div key={cm.id} style={{ display: 'flex', gap: 8 }}>
                  {cm.authorPhoto ? (
                    <img src={cm.authorPhoto} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 2 }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                      {cm.authorName.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.78rem', color: 'var(--text)' }}>{cm.authorName}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(cm.createdAt)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5 }}>{cm.text}</p>
                    <button onClick={() => { setReplyTo({ id: cm.id, name: cm.authorName }); setOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.72rem', padding: '4px 0 0', fontFamily: 'DM Sans, sans-serif' }}>
                      Répondre
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {replyTo && (
            <div style={{ background: 'var(--primary-light)', borderRadius: 6, padding: '4px 10px', marginBottom: 6, fontSize: '0.78rem', color: 'var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Réponse à <strong>{replyTo.name}</strong></span>
              <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><X size={12} /></button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {currentUser?.photoURL
              ? <img src={currentUser.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: 4 }} />
              : <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0, marginTop: 4 }}>{currentUser?.displayName?.charAt(0) || 'M'}</div>}
            <div style={{ flex: 1, display: 'flex', gap: 6 }}>
              <input className="input" placeholder={replyTo ? `Répondre à ${replyTo.name}...` : 'Votre commentaire...'} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }} />
              <button onClick={handleSend} disabled={!text.trim() || sending} className="btn-primary" style={{ padding: '0.45rem 0.75rem', minWidth: 0 }}>
                {sending ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


// ─── Cas clinique en bouton accordéon ────────────────────────────
const CaseCard: React.FC<{
  c: ClinicalCase;
  liked: boolean;
  onLike: () => void;
  onDelete?: () => void;
  formatDate: (iso: string) => string;
}> = ({ c, liked, onLike, onDelete, formatDate }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card animate-fade" style={{ overflow: 'hidden' }}>
      {/* Bouton titre — toujours visible */}
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.875rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
        gap: 12, textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          {c.authorPhoto ? (
            <img src={c.authorPhoto} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0 }}>
              {c.authorName.charAt(0)}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.question}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>
              {c.authorName} · {formatDate(c.createdAt)}
              {' · '}{c.likes.length} <span style={{fontSize:'0.65rem'}}>♥</span>
              {' · '}{c.commentsCount || 0} commentaire{(c.commentsCount||0)>1?'s':''}
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
          <ChevronDown size={18} />
        </div>
      </button>

      {/* Contenu déplié */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.875rem 1rem' }}>
          {onDelete && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <Trash2 size={15} />
              </button>
            </div>
          )}
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.6 }}>{c.text}</p>
          {c.imageUrl && (
            <img src={c.imageUrl} alt="Cas clinique" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 8, marginBottom: '0.75rem', cursor: 'pointer' }}
              onClick={() => window.open(c.imageUrl, '_blank')} />
          )}
          <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.875rem', borderLeft: '3px solid var(--primary)', fontSize: '0.875rem', color: 'var(--text)', fontStyle: 'italic' }}>
            {c.question}
          </div>
          <div style={{ display: 'flex', gap: '1rem', paddingBottom: '0.5rem' }}>
            <button onClick={onLike} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: liked ? '#dc2626' : 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif', padding: 0 }}>
              <Heart size={17} fill={liked ? '#dc2626' : 'none'} />
              {c.likes.length}
            </button>
          </div>
          <CommentsSection caseId={c.id} commentsCount={c.commentsCount || 0} imageUrl={c.imageUrl} />
        </div>
      )}
    </div>
  );
};

// ─── Page principale ─────────────────────────────────────────────
const CasesPage: React.FC = () => {
  const { currentUser, isAdmin, isModerator } = useAuth();
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
      const q = query(collection(db, 'cases'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const allCases = snap.docs.map(d => ({ id: d.id, ...d.data() } as ClinicalCase));
      const visible = allCases.filter(c =>
        c.status === 'approved' || isAdmin || isModerator || c.authorId === currentUser?.uid
      );
      setCases(visible);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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
        text, imageUrl, question,
        status: 'approved', // Tous les cas sont approuvés directement
        likes: [],
        createdAt: new Date().toISOString(),
        commentsCount: 0,
      });
      setText(''); setQuestion(''); setImageFile(null); setImagePreview('');
      setShowForm(false);
      // Notification push
      triggerPushNotification({ title: 'Nouveau cas clinique', body: question.slice(0, 80), url: '/cas-cliniques', tag: 'new-case' }).catch(() => {});
      await fetchCases();
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const handleLike = async (caseId: string, liked: boolean) => {
    await updateDoc(doc(db, 'cases', caseId), {
      likes: liked ? arrayRemove(currentUser!.uid) : arrayUnion(currentUser!.uid)
    });
    setCases(prev => prev.map(c => c.id === caseId ? {
      ...c, likes: liked ? c.likes.filter(id => id !== currentUser!.uid) : [...c.likes, currentUser!.uid]
    } : c));
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
          <h3 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, margin: '0 0 1rem', color: 'var(--text)' }}>Nouveau cas clinique</h3>
          <textarea className="input" placeholder="Décrivez le cas clinique..." value={text} onChange={e => setText(e.target.value)} rows={5} style={{ marginBottom: '0.75rem' }} />
          <input className="input" placeholder="Question à la communauté (ex: Quel diagnostic évoquez-vous ?)" value={question} onChange={e => setQuestion(e.target.value)} style={{ marginBottom: '0.75rem' }} />
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
          <MessageCircle size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <div style={{ fontWeight: 500 }}>Aucun cas publié pour l'instant</div>
          <div style={{ fontSize: '0.875rem', marginTop: 4 }}>Soyez le premier à partager un cas !</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {cases.map(c => {
            const liked = c.likes.includes(currentUser!.uid);
            return (
              <CaseCard key={c.id} c={c} liked={liked}
                onLike={() => handleLike(c.id, liked)}
                onDelete={(isAdmin || isModerator) ? () => handleDelete(c.id) : undefined}
                formatDate={formatDate} />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CasesPage;
