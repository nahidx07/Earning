const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// Firebase Admin Setup (Vercel Environment Variables থেকে আসবে)
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

// ১. স্টার্ট কমান্ড ও রেফারেল সিস্টেম
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const referrerId = ctx.startPayload; // লিংকের শেষের ID

  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    // নতুন ইউজার তৈরি
    await userRef.set({
      id: userId,
      name: ctx.from.first_name,
      balance: 0,
      refer_count: 0,
      referred_by: referrerId || null,
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // রেফারারকে বোনাস দেওয়া
    if (referrerId && referrerId !== userId) {
      const refUser = db.collection('users').doc(referrerId);
      await refUser.update({
        balance: admin.firestore.FieldValue.increment(5), // ৫ টাকা বোনam
        refer_count: admin.firestore.FieldValue.increment(1)
      });
      try {
        await ctx.telegram.sendMessage(referrerId, `🎉 অভিনন্দন! কেউ আপনার লিংকে জয়েন করেছে। আপনি ৫ টাকা বোনাস পেয়েছেন।`);
      } catch (e) { console.log("Referrer blocked bot"); }
    }
  }

  ctx.reply(`স্বাগতম ${ctx.from.first_name}! 💰\n\nএখান থেকে টাস্ক পূরণ করে ইনকাম করুন।\n\nআপনার রেফার লিংক:\nhttps://t.me/${ctx.botInfo.username}?start=${userId}`);
});

// ২. ব্যালেন্স চেক কমান্ড
bot.command('balance', async (ctx) => {
  const userDoc = await db.collection('users').doc(ctx.from.id.toString()).get();
  const data = userDoc.data();
  ctx.reply(`আপনার বর্তমান ব্যালেন্স: ${data.balance} টাকা\nমোট রেফার: ${data.refer_count} জন`);
});

// Vercel Webhook Handler
module.exports = async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
};
