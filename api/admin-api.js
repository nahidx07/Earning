const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

module.exports = async (req, res) => {
  const { action, data, auth } = req.body;

  // সিম্পল অথেন্টিকেশন (Vercel Env থেকে)
  if (auth.email !== process.env.ADMIN_EMAIL || auth.password !== process.env.ADMIN_PASS) {
    return res.status(401).send("Unauthorized");
  }

  try {
    if (action === 'updateSettings') {
      await db.collection('settings').doc('app_config').set(data, { merge: true });
      return res.json({ status: "Success" });
    }
    
    if (action === 'getStats') {
      const users = await db.collection('users').get();
      const settings = await db.collection('settings').doc('app_config').get();
      return res.json({ userCount: users.size, settings: settings.data() });
    }
  } catch (e) {
    res.status(500).send(e.message);
  }
};
