const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// Firebase Initialization
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
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const userRef = db.collection('users').doc(userId);
  
  try {
    const doc = await userRef.get();
    if (!doc.exists) {
      // অটোমেটিক আইডি তৈরি ও ডাটা সেভ
      await userRef.set({
        id: userId,
        name: ctx.from.first_name,
        username: ctx.from.username || "N/A",
        balance: 0,
        ads_watched: 0,
        refer_count: 0,
        joinedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    ctx.reply(`🌙 স্বাগতম ${ctx.from.first_name}!\nআপনার একাউন্টটি সফলভাবে তৈরি হয়েছে।`, {
      reply_markup: {
        inline_keyboard: [[{ text: "🚀 ওপেন মিনি অ্যাপ", web_app: { url: process.env.APP_URL } }]]
      }
    });
  } catch (e) {
    console.error("Firebase Error:", e);
    ctx.reply("সার্ভার ত্রুটি! আবার চেষ্টা করুন।");
  }
});

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } else {
    res.status(200).send('Server is running');
  }
};
