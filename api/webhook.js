const { Telegraf } = require('telegraf');
const admin = require('firebase-admin');

// ১. ফায়ারবেস অ্যাডমিন সেটআপ (Vercel Environment Variables থেকে ডাটা নেবে)
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

// ২. স্টার্ট কমান্ড এবং রেফারেল লজিক
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const userName = ctx.from.first_name;
  const referrerId = ctx.startPayload; // লিংকের শেষের আইডি (যদি থাকে)

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // নতুন ইউজার রেজিস্টার করা
      await userRef.set({
        id: userId,
        name: userName,
        balance: 0,
        refer_count: 0,
        referred_by: referrerId || null,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // যদি রেফারেল লিংকে জয়েন করে থাকে
      if (referrerId && referrerId !== userId) {
        const refUserRef = db.collection('users').doc(referrerId);
        const refUserDoc = await refUserRef.get();

        if (refUserDoc.exists) {
          await refUserRef.update({
            balance: admin.firestore.FieldValue.increment(5), // প্রতি রেফারে ৫ টাকা
            refer_count: admin.firestore.FieldValue.increment(1),
          });

          // রেফারারকে মেসেজ পাঠানো
          await ctx.telegram.sendMessage(referrerId, `🎉 অভিনন্দন! ${userName} আপনার রেফারে জয়েন করেছে। আপনি ৫ টাকা বোনাস পেয়েছেন।`);
        }
      }
    }

    // বটের মেইন মেনু রিপ্লাই
    await ctx.reply(`স্বাগতম ${userName}! 👋\nনিচের বাটন থেকে ইনকাম শুরু করুন।`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "💰 ওপেন মিনি অ্যাপ", web_app: { url: process.env.APP_URL } }],
          [{ text: "📊 ব্যালেন্স চেক", callback_data: "check_balance" }],
          [{ text: "🔗 রেফারেল লিংক", callback_data: "get_refer" }]
        ]
      }
    });

  } catch (error) {
    console.error("Error in start command:", error);
  }
});

// ৩. বাটন ক্লিক হ্যান্ডলার (Inline Keyboard)
bot.on('callback_query', async (ctx) => {
  const userId = ctx.from.id.toString();
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  const userData = userDoc.data();

  if (ctx.callbackQuery.data === "check_balance") {
    await ctx.answerCbQuery();
    await ctx.reply(`👤 ইউজার: ${userData.name}\n💰 ব্যালেন্স: ${userData.balance} টাকা\n👥 মোট রেফার: ${userData.refer_count} জন`);
  } 
  
  else if (ctx.callbackQuery.data === "get_refer") {
    await ctx.answerCbQuery();
    const botUser = await ctx.telegram.getMe();
    const refLink = `https://t.me/${botUser.username}?start=${userId}`;
    await ctx.reply(`🔗 আপনার রেফারেল লিংক:\n${refLink}\n\nবন্ধুদের ইনভাইট করে ৫ টাকা বোনাস পান!`);
  }
});

// ৪. ভার্সেল এর জন্য এক্সপোর্ট (Serverless Function)
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
    res.status(200).send('Bot is running...');
  }
};
