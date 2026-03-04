const { Telegraf } = require('telegraf');
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
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = "YOUR_TELEGRAM_ID"; // আপনার আইডি দিন

bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const referrerId = ctx.startPayload;

  const userRef = db.collection('users').doc(userId);
  const doc = await userRef.get();

  if (!doc.exists) {
    await userRef.set({
      id: userId,
      name: ctx.from.first_name,
      balance: 0,
      refer_count: 0,
      referred_by: referrerId || null,
      ads_watched: 0,
      isVerified: false
    });

    if (referrerId && referrerId !== userId) {
      await db.collection('users').doc(referrerId).update({
        balance: admin.firestore.FieldValue.increment(5),
        refer_count: admin.firestore.FieldValue.increment(1)
      });
    }
  }

  ctx.reply(`স্বাগতম! আর্ন করতে নিচের বাটনে ক্লিক করুন।`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 ওপেন মিনি অ্যাপ", web_app: { url: process.env.APP_URL } }]
      ]
    }
  });
});

// এডমিন ব্রডকাস্ট সিস্টেম
bot.command('broadcast', async (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) return;
  const msg = ctx.message.text.split(' ').slice(1).join(' ');
  const users = await db.collection('users').get();
  users.forEach(u => ctx.telegram.sendMessage(u.id, `📢 নোটিশ: ${msg}`));
});

module.exports = async (req, res) => {
  await bot.handleUpdate(req.body);
  res.status(200).send('OK');
};
