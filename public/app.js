const tg = window.Telegram.WebApp;
tg.expand();
tg.headerColor = '#0b0f1a';

const user = tg.initDataUnsafe.user;

// ১. অটো প্রোফাইল সেটআপ
if (user) {
    document.getElementById('user-name').innerText = user.first_name;
    document.getElementById('profile-name').innerText = user.first_name;
    document.getElementById('profile-id').innerText = "@" + (user.username || user.id);
    document.getElementById('user-pic').src = user.photo_url || 'https://via.placeholder.com/150';
    document.getElementById('profile-pic-big').src = user.photo_url || 'https://via.placeholder.com/150';
    document.getElementById('ref-link').innerText = `https://t.me/ramadan_earn_hub_bot/app?start=${user.id}`;
}

// ২. ট্যাব সুইচিং ফাংশন
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-tab'));
    document.getElementById(tabId + '-tab').classList.add('active-tab');

    // ন্যাভিগেশন কালার পরিবর্তন
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('nav-active'));
    // যেহেতু ইভেন্ট লিসেনার নেই, তাই বাটনের পজিশন অনুযায়ী কাজ করতে হবে
}

// ৩. ডাটাবেজ থেকে লাইভ ডাটা লোড (Demo)
function updateUI(balance, ads, ref) {
    document.getElementById('header-balance').innerText = balance.toFixed(2);
    document.getElementById('home-balance').innerText = balance.toFixed(2);
    document.getElementById('wallet-bal').innerText = balance.toFixed(2);
    document.getElementById('total-ads').innerText = ads;
    document.getElementById('total-ref').innerText = ref;
}

// ৪. এড দেখার ফাংশন (Demo)
function watchAds() {
    tg.showConfirm("আপনি কি এড দেখে ০.৫০ টাকা আয় করতে চান?", (res) => {
        if(res) {
            tg.showAlert("একটি এড লোড হচ্ছে...");
            // এখানে এডস্টাররা বা মনেট্যাগ এর লিংক ওপেন করতে পারেন
        }
    });
}

// ইনিশিয়াল ডাটা লোড
updateUI(6.50, 11, 0);
