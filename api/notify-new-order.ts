import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

// Vercel serverless function (Node runtime, auto-detected from this file's
// location under /api). Called by the client right after an order is
// created — it looks up every admin's stored push tokens and sends them a
// real OS-level notification via Firebase Cloud Messaging. This has to run
// server-side: FIREBASE_SERVICE_ACCOUNT_KEY is a private credential that
// grants Firestore/FCM admin access and must never reach the browser.
function getAdminApp() {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not configured');

  const serviceAccount = JSON.parse(raw);
  return initializeApp({ credential: cert(serviceAccount) });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { orderId } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!orderId || typeof orderId !== 'string') {
      res.status(400).json({ error: 'orderId is required' });
      return;
    }

    const app = getAdminApp();
    const db = getFirestore(app);

    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const order = orderSnap.data() as any;

    const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
    const tokens: string[] = [];
    adminsSnap.forEach((docSnap) => {
      const t = docSnap.data().fcmTokens;
      if (Array.isArray(t)) tokens.push(...t.filter((x) => typeof x === 'string'));
    });

    if (tokens.length === 0) {
      res.status(200).json({ sent: 0, reason: 'no admin devices registered' });
      return;
    }

    const messaging = getMessaging(app);
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: 'Novo Pedido Recebido!',
        body: `${order.userName || 'Cliente'} — ${formatCurrency(order.total)}`,
      },
      data: { orderId },
    });

    // Prune tokens FCM reports as no longer valid (uninstalled app, revoked
    // permission, etc.) so the admin list doesn't grow stale forever.
    const invalidTokens = new Set<string>();
    response.responses.forEach((r, i) => {
      const code = r.error?.code;
      if (!r.success && (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token')) {
        invalidTokens.add(tokens[i]);
      }
    });

    if (invalidTokens.size > 0) {
      const batch = db.batch();
      adminsSnap.forEach((docSnap) => {
        const current: string[] = docSnap.data().fcmTokens || [];
        const filtered = current.filter((t) => !invalidTokens.has(t));
        if (filtered.length !== current.length) {
          batch.update(docSnap.ref, { fcmTokens: filtered });
        }
      });
      await batch.commit();
    }

    res.status(200).json({ sent: response.successCount, failed: response.failureCount });
  } catch (err: any) {
    console.error('notify-new-order error', err);
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
