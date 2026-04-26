/**
 * emailService.ts — Assistant Rhumato
 *
 * Envoi emails via EmailJS (sans serveur) + fallback Firebase Trigger Email.
 *
 * CONFIGURATION (dans .env) :
 *   VITE_EMAILJS_SERVICE_ID=service_xxx
 *   VITE_EMAILJS_PUBLIC_KEY=user_xxx
 *   VITE_EMAILJS_TEMPLATE_INVITATION=template_xxx
 *   VITE_EMAILJS_TEMPLATE_WELCOME=template_xxx
 *   VITE_EMAILJS_TEMPLATE_CONFIRMATION=template_xxx
 *   VITE_EMAILJS_TEMPLATE_CASE_APPROVED=template_xxx
 *
 * Créer compte gratuit : https://www.emailjs.com (200 emails/mois gratuits)
 */

import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const TMPL_INVITATION = import.meta.env.VITE_EMAILJS_TEMPLATE_INVITATION || '';
const TMPL_WELCOME = import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME || '';
const TMPL_CONFIRMATION = import.meta.env.VITE_EMAILJS_TEMPLATE_CONFIRMATION || '';
const TMPL_CASE = import.meta.env.VITE_EMAILJS_TEMPLATE_CASE_APPROVED || '';

const ejsReady = Boolean(EMAILJS_SERVICE_ID && EMAILJS_PUBLIC_KEY);

async function sendViaEmailJS(templateId: string, params: Record<string, string>): Promise<boolean> {
  if (!ejsReady || !templateId) return false;
  try {
    const ejs = await import('emailjs-com');
    await ejs.send(EMAILJS_SERVICE_ID, templateId, params, EMAILJS_PUBLIC_KEY);
    return true;
  } catch (e) {
    console.warn('[EmailJS]', e);
    return false;
  }
}

async function sendViaFirebase(to: string, subject: string, html: string): Promise<void> {
  try {
    await addDoc(collection(db, 'mail'), {
      to: [to], message: { subject, html }, createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Firebase mail]', e);
  }
}

const wrap = (body: string) => `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Helvetica,Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
<div style="background:linear-gradient(135deg,#1a6bb5,#16a085);padding:24px 32px;">
<div style="font-size:17px;font-weight:700;color:#fff;">🩺 Assistant Rhumato</div>
<div style="font-size:11px;color:rgba(255,255,255,0.75);">Dr Brice NIKIEMA — Rhumatologue</div>
</div>
<div style="padding:28px 32px;">${body}</div>
<div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;text-align:center;">
<p style="font-size:11px;color:#94a3b8;margin:0;">Assistant Rhumato · Burkina Faso 🇧🇫</p>
</div></div></body></html>`;

export async function sendWelcomeEmail(p: { to: string; name: string; city: string }) {
  const subject = '🩺 Bienvenue sur Assistant Rhumato !';
  const html = wrap(`<p style="font-size:15px;color:#1a202c;margin:0 0 12px;">Bonjour <strong>${p.name}</strong>,</p>
  <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 16px;">Votre compte est activé sur <strong>Assistant Rhumato</strong>, plateforme d'aide à la décision clinique en rhumatologie pour les médecins généralistes du Burkina Faso.</p>
  <div style="text-align:center;margin:20px 0;"><a href="https://assistant-rhumato.vercel.app" style="display:inline-block;background:#1a6bb5;color:#fff;font-size:14px;font-weight:600;padding:13px 30px;border-radius:10px;text-decoration:none;">Accéder à la plateforme →</a></div>
  <p style="font-size:12px;color:#94a3b8;text-align:center;">Ville enregistrée : ${p.city}</p>`);
  if (!await sendViaEmailJS(TMPL_WELCOME, { to_email: p.to, to_name: p.name, city: p.city }))
    await sendViaFirebase(p.to, subject, html);
}

export async function sendInvitationEmail(p: {
  to: string; recipientName: string; laboName: string;
  title: string; message: string; date: string; heure: string; city: string;
}) {
  const df = p.date ? new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const subject = `[Assistant Rhumato] Invitation : ${p.title}`;
  const html = wrap(`<p style="font-size:15px;color:#1a202c;margin:0 0 8px;">Bonjour <strong>${p.recipientName}</strong>,</p>
  <p style="font-size:14px;color:#64748b;margin:0 0 16px;"><strong style="color:#1a6bb5;">${p.laboName}</strong> vous invite :</p>
  <div style="background:#f8fafc;border-left:4px solid #1a6bb5;border-radius:8px;padding:16px 20px;margin-bottom:16px;">
  <h2 style="font-size:16px;color:#1a202c;margin:0 0 10px;">${p.title}</h2>
  ${df ? `<div style="font-size:13px;color:#64748b;">📅 ${df}</div>` : ''}
  ${p.heure ? `<div style="font-size:13px;color:#64748b;">🕐 ${p.heure}</div>` : ''}
  ${p.city ? `<div style="font-size:13px;color:#64748b;">📍 ${p.city}</div>` : ''}
  </div>
  ${p.message ? `<p style="font-size:14px;color:#475569;line-height:1.7;">${p.message}</p>` : ''}
  <div style="text-align:center;margin:20px 0;"><a href="https://assistant-rhumato.vercel.app/evenements" style="display:inline-block;background:#1a6bb5;color:#fff;font-size:14px;font-weight:600;padding:13px 30px;border-radius:10px;text-decoration:none;">Confirmer ma participation →</a></div>`);
  if (!await sendViaEmailJS(TMPL_INVITATION, { to_email: p.to, to_name: p.recipientName, labo_name: p.laboName, event_title: p.title, event_date: df, event_time: p.heure, event_city: p.city, message: p.message }))
    await sendViaFirebase(p.to, subject, html);
}

export async function sendConfirmationEmail(p: { to: string; name: string; eventTitle: string; eventDate: string; eventCity: string }) {
  const df = p.eventDate ? new Date(p.eventDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : p.eventDate;
  const subject = `✓ Participation confirmée — ${p.eventTitle}`;
  const html = wrap(`<p style="font-size:15px;color:#1a202c;margin:0 0 12px;">Bonjour <strong>${p.name}</strong>,</p>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:16px;">
  <div style="font-size:13px;color:#15803d;font-weight:600;margin-bottom:6px;">✓ Participation confirmée</div>
  <div style="font-size:15px;font-weight:700;color:#1a202c;margin-bottom:8px;">${p.eventTitle}</div>
  ${df ? `<div style="font-size:13px;color:#64748b;">📅 ${df}</div>` : ''}
  <div style="font-size:13px;color:#64748b;">📍 ${p.eventCity}</div>
  </div>`);
  if (!await sendViaEmailJS(TMPL_CONFIRMATION, { to_email: p.to, to_name: p.name, event_title: p.eventTitle, event_date: df, event_city: p.eventCity }))
    await sendViaFirebase(p.to, subject, html);
}

export async function sendCaseApprovedEmail(p: { to: string; authorName: string; caseTitle: string }) {
  const subject = '✓ Votre cas clinique a été publié — Assistant Rhumato';
  const html = wrap(`<p style="font-size:15px;color:#1a202c;margin:0 0 12px;">Bonjour <strong>${p.authorName}</strong>,</p>
  <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 20px;">Votre cas clinique a été <strong style="color:#15803d;">approuvé et publié</strong> sur la plateforme.</p>
  <div style="text-align:center;"><a href="https://assistant-rhumato.vercel.app/cas-cliniques" style="display:inline-block;background:#1a6bb5;color:#fff;font-size:14px;font-weight:600;padding:13px 30px;border-radius:10px;text-decoration:none;">Voir les discussions →</a></div>`);
  if (!await sendViaEmailJS(TMPL_CASE, { to_email: p.to, to_name: p.authorName, case_title: p.caseTitle }))
    await sendViaFirebase(p.to, subject, html);
}
