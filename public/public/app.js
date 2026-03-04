const tg = window.Telegram.WebApp;
tg.expand();

const user = tg.initDataUnsafe.user;
if(user) {
    document.getElementById('u-name').innerText = user.first_name;
    document.getElementById('u-pic').src = user.photo_url || 'https://via.placeholder.com/100';
}

function tab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(name).classList.add('active');
}

// এখানে Firebase থেকে ডাটা ফেচ করার কোড যোগ করতে হবে
async function syncData() {
    // ডেমো হিসেবে ব্যালেন্স সেট করা
    document.getElementById('top-balance').innerText = "6.50";
    document.getElementById('h-bal').innerText = "6.50";
}
syncData();
