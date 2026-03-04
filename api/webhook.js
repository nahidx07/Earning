const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// ১. ফায়ারবেস অ্যাডমিন সেটআপ
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

// ২. স্টার্ট কমান্ড এবং অটো ইউজার রেজিস্ট্রেশন
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const userName = ctx.from.first_name;
  const referrerId = ctx.startPayload; // রেফারেল আইডি (যদি থাকে)

  try {
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();

    // যদি নতুন ইউজার হয়
    if (!doc.exists) {
      await userRef.set({
        id: userId,
        name: userName,
        username: ctx.from.username || "N/A",
        balance: 0,
        refer_count: 0,
        ads_watched: 0,
        referred_by: (referrerId && referrerId !== userId) ? referrerId : null,
        isVerified: false,
        joinedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // রেফারারকে বোনাস দেওয়া (অ্যাডমিন সেটিংস অনুযায়ী পার্সেন্টেজ লজিক এখানে কাজ করবে)
      if (referrerId && referrerId !== userId) {
        const refUserRef = db.collection('users').doc(referrerId);
        const refDoc = await refUserRef.get();

        if (refDoc.exists) {
          // রেফারেল বোনাস (ফিক্সড ৫ টাকা বা আপনার পছন্দমতো)
          await refUserRef.update({
            balance: admin.firestore.FieldValue.increment(5), 
            refer_count: admin.firestore.FieldValue.increment(1)
          });
          
          // রেফারারকে নোটিফিকেশন পাঠানো
          await ctx.telegram.sendMessage(referrerId, `🎉 অভিনন্দন! ${userName} আপনার রেফারে জয়েন করেছে। আপনি ৫ টাকা বোনাস পেয়েছেন।`);
        }
      }
    }

    // বটের মেইন মেনু রিপ্লাই
    await ctx.reply(`🌙 আসসালামু আলাইকুম ${userName}!\nলখপতি বিডি (LakhpotiBD)-তে আপনাকে স্বাগতম।`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 ওপেন মিনি অ্যাপ", web_app: { url: process.env.APP_URL } }],
          [{ text: "📢 আমাদের চ্যানেল", url: "https://t.me/lakhpotiOfficial" }]
        ]
      }
    });

  } catch (error) {
    console.error("Database Error:", error);
    ctx.reply("সার্ভার ত্রুটি! দয়া করে কিছুক্ষণ পর চেষ্টা করুন।");
  }
});

// ৩. টাস্ক কমপ্লিট করার পর রিওয়ার্ড লজিক (এটি অ্যাপ থেকে কল করার জন্য)
// এই ফাংশনটি আপনি আলাদা API এন্ডপয়েন্টেও রাখতে পারেন
async function handleTaskReward(userId, rewardAmount) {
  const settingsDoc = await db.collection('settings').doc('app_config').get();
  const settings = settingsDoc.data() || { ref_percent: 10 }; // ডিফল্ট ১০%
  
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  // ইউজারকে টাকা দেওয়া
  await userRef.update({
    balance: admin.firestore.FieldValue.increment(rewardAmount),
    ads_watched: admin.firestore.FieldValue.increment(1)
  });

  // রেফারারকে পার্সেন্টেজ বোনাস দেওয়া
  if (userData.referred_by) {
    const bonus = (rewardAmount * settings.ref_percent) / 100;
    await db.collection('users').doc(userData.referred_by).update({
      balance: admin.firestore.FieldValue.increment(bonus)
    });
  }
}

// ৪. Vercel Webhook Handler
module.exports = async (req, res) => {
  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      console.error(err);
      res.status(500).send('Webhook Error');
    }
  } else {
    res.status(200).send('Bot is active and running!');
  }
};
