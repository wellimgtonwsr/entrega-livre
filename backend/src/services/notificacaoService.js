// Serviço de notificações via Firebase FCM
let admin;

try {
  admin = require('firebase-admin');
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
  }
} catch {
  admin = null;
}

exports.enviarNotificacao = async ({ token, title, body, data = {} }) => {
  if (!admin || !token) return;
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
      data,
    });
  } catch (err) {
    console.error('[FCM] Erro ao enviar notificação:', err.message);
  }
};
