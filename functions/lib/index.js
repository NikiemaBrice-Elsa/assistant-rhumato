"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyAdminSummary = exports.weeklyCleanup = exports.sendPendingNotifications = exports.onPushQueueCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
// ─── Fonction 1 : Envoi push déclenché par une nouvelle entrée push_queue ────
// Se déclenche automatiquement dès qu'un document est créé dans push_queue
exports.onPushQueueCreated = functions
    .region('us-central1')
    .firestore
    .document('push_queue/{notifId}')
    .onCreate(async (snap, context) => {
    const notifId = context.params.notifId;
    const data = snap.data();
    // Ne pas retraiter si déjà envoyé
    if (data.sent)
        return null;
    functions.logger.info(`📨 Envoi notification: ${data.title}`, { notifId });
    try {
        // 1. Récupérer tous les tokens FCM actifs
        const tokensSnap = await db.collection('fcm_tokens').get();
        if (tokensSnap.empty) {
            functions.logger.warn('Aucun token FCM enregistré');
            await snap.ref.update({ sent: true, sentAt: admin.firestore.FieldValue.serverTimestamp(), recipientsCount: 0 });
            return null;
        }
        const tokens = [];
        const tokensByUserId = {};
        tokensSnap.docs.forEach(doc => {
            const t = doc.data();
            if (t.token && t.token.length > 20) {
                tokens.push(t.token);
                tokensByUserId[t.userId] = t.token;
            }
        });
        if (tokens.length === 0) {
            await snap.ref.update({ sent: true, recipientsCount: 0 });
            return null;
        }
        // 2. Construire le message FCM
        const message = {
            tokens,
            notification: {
                title: data.title,
                body: data.body,
                imageUrl: data.icon || 'https://assistant-rhumato.vercel.app/pwa-192x192.png',
            },
            webpush: {
                notification: {
                    title: data.title,
                    body: data.body,
                    icon: data.icon || '/pwa-192x192.png',
                    badge: '/pwa-192x192.png',
                    tag: data.tag || 'ar-notif',
                    requireInteraction: false,
                    actions: [{ action: 'open', title: 'Voir' }],
                },
                fcmOptions: {
                    link: `https://assistant-rhumato.vercel.app${data.url || '/'}`,
                },
            },
            android: {
                notification: {
                    title: data.title,
                    body: data.body,
                    icon: 'ic_launcher',
                    color: '#1a6bb5',
                    sound: 'default',
                    priority: 'high',
                    channelId: 'rhumato_notifications',
                },
                priority: 'high',
            },
            apns: {
                payload: {
                    aps: {
                        alert: { title: data.title, body: data.body },
                        badge: 1,
                        sound: 'default',
                    },
                },
            },
            data: {
                url: data.url || '/',
                tag: data.tag || '',
                notifId,
            },
        };
        // 3. Envoyer en multicast (max 500 tokens par batch)
        let successCount = 0;
        let failureCount = 0;
        const invalidTokens = [];
        // Découper en batches de 500 (limite FCM)
        const BATCH_SIZE = 500;
        for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
            const batch = tokens.slice(i, i + BATCH_SIZE);
            const batchMessage = { ...message, tokens: batch };
            const response = await messaging.sendEachForMulticast(batchMessage);
            successCount += response.successCount;
            failureCount += response.failureCount;
            // Identifier les tokens invalides à supprimer
            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error) {
                    const errorCode = resp.error.code;
                    if (errorCode === 'messaging/invalid-registration-token' ||
                        errorCode === 'messaging/registration-token-not-registered' ||
                        errorCode === 'messaging/invalid-argument') {
                        invalidTokens.push(batch[idx]);
                    }
                }
            });
        }
        functions.logger.info(`✅ Notifications envoyées: ${successCount} succès, ${failureCount} échecs`);
        // 4. Nettoyer les tokens invalides
        if (invalidTokens.length > 0) {
            functions.logger.info(`🗑️ Suppression de ${invalidTokens.length} tokens invalides`);
            const deletePromises = tokensSnap.docs
                .filter(d => invalidTokens.includes(d.data().token))
                .map(d => d.ref.delete());
            await Promise.all(deletePromises);
        }
        // 5. Marquer comme envoyé
        await snap.ref.update({
            sent: true,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            recipientsCount: successCount,
            failureCount,
            invalidTokensCleaned: invalidTokens.length,
        });
        return null;
    }
    catch (error) {
        functions.logger.error('❌ Erreur envoi notifications:', error);
        await snap.ref.update({
            sent: false,
            error: String(error),
            lastAttempt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw error; // Permet à Firebase de retenter
    }
});
// ─── Fonction 2 : Envoi planifié toutes les heures (filet de sécurité) ───────
// Récupère les notifications push_queue non envoyées et les envoie
exports.sendPendingNotifications = functions
    .region('us-central1')
    .pubsub
    .schedule('every 60 minutes')
    .timeZone('Africa/Ouagadougou')
    .onRun(async () => {
    functions.logger.info('⏰ Vérification des notifications en attente...');
    const pending = await db.collection('push_queue')
        .where('sent', '==', false)
        .orderBy('createdAt', 'asc')
        .limit(50)
        .get();
    if (pending.empty) {
        functions.logger.info('Aucune notification en attente.');
        return null;
    }
    functions.logger.info(`📬 ${pending.size} notification(s) en attente à traiter.`);
    // Marquer chaque document pour déclencher onPushQueueCreated via une mise à jour
    // Alternative : traiter directement ici
    const tokensSnap = await db.collection('fcm_tokens').get();
    if (tokensSnap.empty)
        return null;
    const tokens = tokensSnap.docs
        .map(d => d.data().token)
        .filter(t => t && t.length > 20);
    if (tokens.length === 0)
        return null;
    for (const doc of pending.docs) {
        const data = doc.data();
        try {
            const msg = {
                tokens,
                notification: { title: data.title, body: data.body },
                webpush: {
                    fcmOptions: { link: `https://assistant-rhumato.vercel.app${data.url || '/'}` },
                    notification: { tag: data.tag, icon: '/pwa-192x192.png', badge: '/pwa-192x192.png' },
                },
                data: { url: data.url || '/', tag: data.tag || '' },
            };
            const resp = await messaging.sendEachForMulticast(msg);
            await doc.ref.update({ sent: true, sentAt: admin.firestore.FieldValue.serverTimestamp(), recipientsCount: resp.successCount });
        }
        catch (e) {
            await doc.ref.update({ error: String(e), lastAttempt: admin.firestore.FieldValue.serverTimestamp() });
        }
    }
    return null;
});
// ─── Fonction 3 : Nettoyage hebdomadaire (tokens expirés + vieilles notifs) ──
exports.weeklyCleanup = functions
    .region('us-central1')
    .pubsub
    .schedule('every monday 03:00')
    .timeZone('Africa/Ouagadougou')
    .onRun(async () => {
    functions.logger.info('🧹 Nettoyage hebdomadaire...');
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    // Supprimer les anciennes notifications envoyées (> 7 jours)
    const oldNotifs = await db.collection('push_queue')
        .where('sent', '==', true)
        .where('sentAt', '<', admin.firestore.Timestamp.fromDate(oneWeekAgo))
        .limit(500)
        .get();
    const batch = db.batch();
    oldNotifs.docs.forEach(doc => batch.delete(doc.ref));
    if (!oldNotifs.empty)
        await batch.commit();
    functions.logger.info(`🗑️ ${oldNotifs.size} anciennes notifications supprimées.`);
    return null;
});
// ─── Fonction 4 : Stats admin — résumé hebdomadaire ──────────────────────────
exports.weeklyAdminSummary = functions
    .region('us-central1')
    .pubsub
    .schedule('every monday 08:00')
    .timeZone('Africa/Ouagadougou')
    .onRun(async () => {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const ts = admin.firestore.Timestamp.fromDate(oneWeekAgo);
        // Compter les nouvelles inscriptions
        const newUsers = await db.collection('users')
            .where('createdAt', '>=', ts.toDate().toISOString())
            .get();
        // Compter les nouveaux cas cliniques
        const newCases = await db.collection('cases')
            .where('createdAt', '>=', ts.toDate().toISOString())
            .get();
        // Nombre total d'utilisateurs
        const totalUsers = await db.collection('users').count().get();
        functions.logger.info('📊 Résumé hebdomadaire:', {
            newUsers: newUsers.size,
            newCases: newCases.size,
            totalUsers: totalUsers.data().count,
        });
        // Envoyer une notification à l'admin
        // Chercher le token admin via l'email
        const usersSnap = await db.collection('users')
            .where('email', '==', 'bricenikiemagg@gmail.com')
            .limit(1)
            .get();
        if (!usersSnap.empty) {
            const adminId = usersSnap.docs[0].id;
            const adminTokenDoc = await db.collection('fcm_tokens').doc(adminId).get();
            if (adminTokenDoc.exists) {
                const token = adminTokenDoc.data().token;
                await messaging.send({
                    token,
                    notification: {
                        title: '📊 Résumé hebdomadaire — Assistant Rhumato',
                        body: `${newUsers.size} nouveaux médecins · ${newCases.size} cas cliniques · ${totalUsers.data().count} total`,
                    },
                    webpush: { fcmOptions: { link: 'https://assistant-rhumato.vercel.app/admin' } },
                });
            }
        }
    }
    catch (e) {
        functions.logger.error('Erreur résumé hebdomadaire:', e);
    }
    return null;
});
//# sourceMappingURL=index.js.map