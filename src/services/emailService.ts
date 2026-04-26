/**
 * emailService.ts
 *
 * Service d'envoi d'emails via la collection Firestore "mail".
 * Nécessite l'extension Firebase "Trigger Email" configurée sur le projet.
 *
 * Installation de l'extension :
 *   Firebase Console → Extensions → "Trigger Email from Firestore"
 *   → Configurer avec SMTP Gmail ou SendGrid
 *
 * Chaque document ajouté dans la collection `mail` est automatiquement
 * traité par l'extension qui envoie l'email correspondant.
 */

import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

// ─── Types ───────────────────────────────────────────────────────

interface EmailPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  message: {
    subject: string;
    html: string;
    text?: string;
  };
}

// ─── Envoi générique ─────────────────────────────────────────────

export async function sendEmail(payload: EmailPayload): Promise<void> {
  await addDoc(collection(db, 'mail'), {
    ...payload,
    createdAt: new Date().toISOString(),
  });
}

// ─── Templates ───────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  max-width: 580px; margin: 32px auto;
  background: #ffffff; border-radius: 16px; overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
`;

const HEADER_HTML = (title: string, subtitle?: string) => `
  <div style="background:linear-gradient(135deg,#1a6bb5,#16a085);padding:28px 36px 22px;">
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:28px;">🩺</span>
      <div>
        <div style="font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px;">
          Assistant Rhumato
        </div>
        <div style="font-size:17px;font-weight:600;color:#ffffff;">${title}</div>
        ${subtitle ? `<div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:2px;">${subtitle}</div>` : ''}
      </div>
    </div>
  </div>
`;

const FOOTER_HTML = `
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 36px;text-align:center;">
    <p style="font-size:11px;color:#94a3b8;margin:0;">
      Assistant Rhumato · Burkina Faso — Pour les médecins généralistes
    </p>
  </div>
`;

// ─── 1. Email de bienvenue ────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  city: string;
}): Promise<void> {
  const html = `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;">
<div style="${BASE_STYLE}">
  ${HEADER_HTML('Bienvenue sur Assistant Rhumato !')}
  <div style="padding:32px 36px;">
    <p style="font-size:15px;color:#1a202c;margin:0 0 12px;">Bonjour <strong>${params.name}</strong>,</p>
    <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 24px;">
      Votre compte médecin est activé sur <strong>Assistant Rhumato</strong>,
      la plateforme d'aide à la décision clinique en rhumatologie pour les médecins
      généralistes du Burkina Faso.
    </p>
    <div style="background:#f8fafc;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <div style="font-size:13px;font-weight:600;color:#1a202c;margin-bottom:14px;">Ce que vous pouvez faire :</div>
      ${[
        ['📋', 'Consulter les 10 fiches CAT rhumatologie', 'Conduites à tenir pour la pratique quotidienne'],
        ['💊', 'Accéder à la base médicaments', 'Posologies, CI, disponibilité locale'],
        ['👥', 'Partager des cas cliniques', 'Discuter avec la communauté médicale'],
        ['📅', 'Participer aux évènements', 'Congrès, formations, webinaires'],
      ].map(([icon, title, sub]) => `
        <div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start;">
          <span style="font-size:16px;flex-shrink:0;">${icon}</span>
          <div>
            <div style="font-size:13px;font-weight:500;color:#1a202c;">${title}</div>
            <div style="font-size:12px;color:#64748b;">${sub}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="text-align:center;margin:8px 0 24px;">
      <a href="https://assistant-rhumato.vercel.app" style="display:inline-block;background:#1a6bb5;color:#ffffff;font-size:14px;font-weight:600;padding:13px 34px;border-radius:10px;text-decoration:none;">
        Accéder à la plateforme →
      </a>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
      Lieu d'exercice enregistré : <strong>${params.city}</strong>
    </p>
  </div>
  ${FOOTER_HTML}
</div>
</body></html>`;

  await sendEmail({
    to: [params.to],
    message: {
      subject: '🩺 Bienvenue sur Assistant Rhumato !',
      html,
      text: `Bienvenue ${params.name} ! Votre compte Assistant Rhumato est activé. Accédez à la plateforme sur assistant-rhumato.vercel.app`,
    },
  });
}

// ─── 2. Email d'invitation laboratoire ───────────────────────────

export async function sendInvitationEmail(params: {
  to: string;
  recipientName: string;
  laboName: string;
  title: string;
  message: string;
  date: string;
  heure: string;
  city: string;
}): Promise<void> {
  const dateFormatted = params.date
    ? new Date(params.date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : '';

  const html = `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;">
<div style="${BASE_STYLE}">
  ${HEADER_HTML('Invitation médicale', `de ${params.laboName}`)}
  <div style="padding:32px 36px;">
    <p style="font-size:15px;color:#1a202c;margin:0 0 8px;">
      Bonjour <strong>${params.recipientName}</strong>,
    </p>
    <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 24px;">
      <strong style="color:#1a6bb5;">${params.laboName}</strong> vous invite à l'évènement suivant :
    </p>
    <div style="background:#f8fafc;border-left:4px solid #1a6bb5;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
      <h2 style="font-size:17px;font-weight:700;color:#1a202c;margin:0 0 14px;">${params.title}</h2>
      ${dateFormatted ? `<div style="font-size:13px;color:#64748b;margin-bottom:6px;">📅 ${dateFormatted}</div>` : ''}
      ${params.heure ? `<div style="font-size:13px;color:#64748b;margin-bottom:6px;">🕐 ${params.heure}</div>` : ''}
      ${params.city ? `<div style="font-size:13px;color:#64748b;">📍 ${params.city}</div>` : ''}
    </div>
    ${params.message ? `
    <div style="font-size:14px;color:#475569;line-height:1.7;margin-bottom:24px;white-space:pre-wrap;">${params.message}</div>
    ` : ''}
    <div style="text-align:center;margin:24px 0;">
      <a href="https://assistant-rhumato.vercel.app/evenements" style="display:inline-block;background:#1a6bb5;color:#ffffff;font-size:14px;font-weight:600;padding:13px 34px;border-radius:10px;text-decoration:none;">
        Confirmer ma participation →
      </a>
    </div>
  </div>
  ${FOOTER_HTML}
</div>
</body></html>`;

  await sendEmail({
    to: [params.to],
    message: {
      subject: `[Assistant Rhumato] Invitation : ${params.title}`,
      html,
      text: `${params.laboName} vous invite à : ${params.title}. Date : ${dateFormatted}. Lieu : ${params.city}.`,
    },
  });
}

// ─── 3. Email de confirmation de participation ────────────────────

export async function sendConfirmationEmail(params: {
  to: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  eventCity: string;
}): Promise<void> {
  const dateFormatted = params.eventDate
    ? new Date(params.eventDate).toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : params.eventDate;

  const html = `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;">
<div style="${BASE_STYLE}">
  ${HEADER_HTML('Participation confirmée ✓')}
  <div style="padding:32px 36px;">
    <p style="font-size:15px;color:#1a202c;margin:0 0 12px;">
      Bonjour <strong>${params.name}</strong>,
    </p>
    <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 24px;">
      Votre participation a bien été enregistrée pour l'évènement suivant :
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
      <div style="font-size:13px;color:#15803d;font-weight:600;margin-bottom:10px;">✓ Confirmé</div>
      <div style="font-size:16px;font-weight:700;color:#1a202c;margin-bottom:10px;">${params.eventTitle}</div>
      ${dateFormatted ? `<div style="font-size:13px;color:#64748b;margin-bottom:4px;">📅 ${dateFormatted}</div>` : ''}
      <div style="font-size:13px;color:#64748b;">📍 ${params.eventCity}</div>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
      Nous vous attendons ! Pour toute modification, contactez l'organisateur.
    </p>
  </div>
  ${FOOTER_HTML}
</div>
</body></html>`;

  await sendEmail({
    to: [params.to],
    message: {
      subject: `✓ Participation confirmée — ${params.eventTitle}`,
      html,
      text: `Votre participation est confirmée pour : ${params.eventTitle}, le ${dateFormatted} à ${params.eventCity}.`,
    },
  });
}

// ─── 4. Email de notification cas clinique approuvé ───────────────

export async function sendCaseApprovedEmail(params: {
  to: string;
  authorName: string;
  caseTitle: string;
}): Promise<void> {
  const html = `
<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f8;">
<div style="${BASE_STYLE}">
  ${HEADER_HTML('Cas clinique publié ✓')}
  <div style="padding:32px 36px;">
    <p style="font-size:15px;color:#1a202c;margin:0 0 12px;">
      Bonjour <strong>${params.authorName}</strong>,
    </p>
    <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 24px;">
      Votre cas clinique a été <strong style="color:#15803d;">approuvé et publié</strong> sur la plateforme.
      Il est maintenant visible par toute la communauté médicale.
    </p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://assistant-rhumato.vercel.app/cas-cliniques" style="display:inline-block;background:#1a6bb5;color:#ffffff;font-size:14px;font-weight:600;padding:13px 34px;border-radius:10px;text-decoration:none;">
        Voir les discussions →
      </a>
    </div>
  </div>
  ${FOOTER_HTML}
</div>
</body></html>`;

  await sendEmail({
    to: [params.to],
    message: {
      subject: '✓ Votre cas clinique a été publié — Assistant Rhumato',
      html,
    },
  });
}
