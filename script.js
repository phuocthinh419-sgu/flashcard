let availableRealms = []; 
let currentRealm = "";

let currentLeagueView = 'c1'; 
let currentC1Data = null; let currentC2Data = null; let currentFullBracketData = null; let defendingChampion = ""; 

const ADMIN_UID = "PKi9FfQacTW7gNkjBiYqQLBtZ4t1";
const firebaseConfig = {
    apiKey: "AIzaSyAmDqBfe4JRBKDGVwqVS0yI9_P2O2WIzxI",
    authDomain: "academic-planner-v100.firebaseapp.com",
    databaseURL: "https://academic-planner-v100-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "academic-planner-v100",
    storageBucket: "academic-planner-v100.firebasestorage.app",
    messagingSenderId: "80448326816",
    appId: "1:80448326816:web:15e6dda33c3be03be90dc5"
};

let db, auth, rtdb;
try { firebase.initializeApp(firebaseConfig); db = firebase.firestore(); auth = firebase.auth(); rtdb = firebase.database(); } 
catch (e) { console.error("Lỗi Firebase!"); }

let currentUser = null;
let userData = { role: 'student', gold: 0, xp: 0, lifetime_xp: 0, realm: "", streak: 1, displayName: '', lastLogin: '', hasShield: false, potionExpiry: null, potionX3Expiry: null, maskExpiry: null, magnifyingGlass: 0, vouchers: [], blindBoxCount: 0, lastBlindBoxDate: '', streakIcon: '🔥', theme: 'theme_default', purchasedItems: [], weeklyXp: 0, lastWeekXp: 0, currentWeekStr: '', highestWeeklyXp: 0, hasBrokenRecordThisWeek: false, timeMachine: null, mastered_words: 0, mastered_lessons: [] };

let currentGeneratedVocab = []; 
let allLessonsData = [];
window.isSpectating = false;

function initSystem() {
    if(!db) { fallbackInit(); return; }
    db.collection('realms').onSnapshot(snap => {
        availableRealms = [];
        let selectUI = document.getElementById('adminRealmSelect'); 
        let syncUI = document.getElementById('syncRealmSelect');
        let delUI = document.getElementById('deleteRealmSelect');
        
        if(selectUI) selectUI.innerHTML = ''; 
        if(syncUI) syncUI.innerHTML = '';
        if(delUI) delUI.innerHTML = '';
        
        snap.forEach(doc => {
            availableRealms.push(doc.id);
            if(selectUI) selectUI.innerHTML += `<option value="${doc.id}">${doc.id}</option>`;
            if(syncUI) syncUI.innerHTML += `<option value="${doc.id}">${doc.id}</option>`;
            if(delUI) delUI.innerHTML += `<option value="${doc.id}">${doc.id}</option>`;
        });
        if(availableRealms.length === 0) availableRealms = ['Khởi Nguyên'];
        checkAuth();
    }, err => {
        console.warn("Tường lửa Firebase chặn tải Phủ:", err);
        availableRealms = ['Khởi Nguyên'];
        checkAuth();
    });
}

function checkAuth() {
    if(auth) {
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user; 
                if (typeof startAdminNotification === 'function') startAdminNotification(user.uid);
                const todayStr = new Date().toLocaleDateString('en-GB'); 
                const isEmperor = (user.email === "phuocthinh419@gmail.com"); 
                const trueRole = isEmperor ? 'teacher' : 'student';

                db.collection('vocab_users').doc(user.uid).get().then(doc => {
                    if (doc.exists) {
                        userData = Object.assign(userData, doc.data()); 
                        if(!userData.realm || !availableRealms.includes(userData.realm)) userData.realm = availableRealms[0];
                        currentRealm = userData.realm;
                        
                        if(!userData.streak) userData.streak = 1; if(!userData.lastLogin) userData.lastLogin = todayStr;
                        if(!userData.vouchers) userData.vouchers = []; if(!userData.streakIcon) userData.streakIcon = '🔥';
                        if(!userData.theme) userData.theme = 'theme_default'; if(!userData.purchasedItems) userData.purchasedItems = [];
                        if(!userData.lifetime_xp) userData.lifetime_xp = 0; if(!userData.weeklyXp) userData.weeklyXp = 0;
                        if(!userData.lastWeekXp) userData.lastWeekXp = 0; if(!userData.highestWeeklyXp) userData.highestWeeklyXp = 0;
                        if(!userData.mastered_words) userData.mastered_words = 0; if(!userData.mastered_lessons) userData.mastered_lessons = [];
                        
                        // Khởi tạo các biến túi đồ mới nếu chưa có
                        if(userData.glass_100 === undefined) userData.glass_100 = userData.magnifyingGlass || 0; // Chuyển đồ cũ sang đồ 100%
                        if(userData.glass_80 === undefined) userData.glass_80 = 0;
                        if(userData.shield_100 === undefined) userData.shield_100 = userData.shieldCount || (userData.hasShield ? 3 : 0);
                        if(userData.shield_80 === undefined) userData.shield_80 = 0;
                        if(userData.time_100 === undefined) userData.time_100 = 0;
                        if(userData.time_80 === undefined) userData.time_80 = 0;
                        if(userData.torch_100 === undefined) userData.torch_100 = 0;
                        if(userData.torch_80 === undefined) userData.torch_80 = 0;

                        if(userData.potionExpiry && userData.potionExpiry < Date.now()) userData.potionExpiry = null;
                        if(userData.potionX3Expiry && userData.potionX3Expiry < Date.now()) userData.potionX3Expiry = null;
                        if(userData.maskExpiry && userData.maskExpiry < Date.now()) userData.maskExpiry = null;

                        let currentWeek = getCurrentWeekStr();
                        if(userData.currentWeekStr !== currentWeek) {
                            userData.lastWeekXp = userData.weeklyXp || 0;
                            if (userData.lastWeekXp > (userData.highestWeeklyXp || 0)) userData.highestWeeklyXp = userData.lastWeekXp;
                            userData.weeklyXp = 0; userData.currentWeekStr = currentWeek; userData.hasBrokenRecordThisWeek = false;
                            db.collection('vocab_users').doc(user.uid).update({ lastWeekXp: userData.lastWeekXp, weeklyXp: 0, currentWeekStr: currentWeek, hasBrokenRecordThisWeek: false, highestWeeklyXp: userData.highestWeeklyXp });
                        }
                        
                        if(userData.role !== trueRole) { userData.role = trueRole; db.collection('vocab_users').doc(user.uid).update({ role: trueRole }); }

                        applyTheme(userData.theme);
                        
                        let lastParts = userData.lastLogin.split('/');
                        if (lastParts.length === 3) {
                            let todayDate = new Date(); let lastDate = new Date(lastParts[2], lastParts[1] - 1, lastParts[0]);
                            let tToday = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();
                            let tLast = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
                            let diffDays = Math.round((tToday - tLast) / 86400000);
                            
                            if (diffDays === 1) { 
                                let oldStreak = userData.streak;
                                userData.streak += 1; userData.lastLogin = todayStr; 
                                db.collection('vocab_users').doc(user.uid).update({ streak: userData.streak, lastLogin: todayStr }).then(() => {
                                    if(window.checkAndGrantStreakRewards) window.checkAndGrantStreakRewards(oldStreak, userData.streak);
                                });
                            } else if (diffDays > 1) {
                                let missedDays = diffDays - 1; 
                                let totalShields = (userData.shield_100 || 0) + (userData.shield_80 || 0);
                                
                                if (totalShields >= missedDays) { 
                                    // Ưu tiên trừ bùa 80% trước, thiếu mới trừ bùa 100%
                                    let remainingMissed = missedDays;
                                    if(userData.shield_80 >= remainingMissed) {
                                        userData.shield_80 -= remainingMissed;
                                    } else {
                                        remainingMissed -= userData.shield_80;
                                        userData.shield_80 = 0;
                                        userData.shield_100 -= remainingMissed;
                                    }
                                    
                                    userData.lastLogin = todayStr; 
                                    db.collection('vocab_users').doc(user.uid).update({ lastLogin: todayStr, shield_100: userData.shield_100, shield_80: userData.shield_80 }); 
                                    alert(`🛡️ May quá! Hệ thống đã dùng ${missedDays} Bùa Bảo Hộ để lấp đầy ${missedDays} ngày vắng mặt của bạn!`); 
                                } else { 
                                    userData.xp = Math.max(0, userData.xp - Math.floor(userData.xp * 0.2));
                                    userData.gold = Math.max(0, userData.gold - Math.floor(userData.gold * 0.2));
                                    
                                    userData.shield_100 = 0; userData.shield_80 = 0;

                                    if (diffDays <= 4) {
                                        userData.timeMachine = { lostStreak: userData.streak, missedDays: missedDays, lostTimestamp: Date.now(), status: 'available', attemptsToday: 0, lastAttemptDate: todayStr, daysRecovered: 0, currentBank: [] };
                                    } else {
                                        userData.timeMachine = null; 
                                    }
                                    userData.streak = 1; userData.lastLogin = todayStr; 
                                    
                                    db.collection('vocab_users').doc(user.uid).update({ streak: 1, lastLogin: todayStr, xp: userData.xp, gold: userData.gold, shield_100: 0, shield_80: 0, timeMachine: userData.timeMachine || null }).then(() => { 
                                        document.getElementById('missedDaysCount').innerText = missedDays;
                                        document.getElementById('streakBrokenModal').classList.add('active'); 
                                    });
                                }
                            } else if (diffDays === 0 && userData.lastLogin !== todayStr) { 
                                userData.lastLogin = todayStr; 
                                db.collection('vocab_users').doc(user.uid).update({ lastLogin: todayStr }); 
                            }
                        }
                        
                        updateUI(); setupRealmListeners(); fetchLessonsFromFirebase(); 
                    } else { 
                        userData = { role: trueRole, gold: 0, xp: 0, lifetime_xp: 0, realm: "", streak: 1, displayName: '', lastLogin: todayStr, shield_100: 0, shield_80: 0, glass_100: 0, glass_80: 0, time_100: 0, time_80: 0, torch_100: 0, torch_80: 0, potionExpiry: null, potionX3Expiry: null, maskExpiry: null, vouchers: [], blindBoxCount: 0, lastBlindBoxDate: todayStr, streakIcon: '🔥', theme: 'theme_default', purchasedItems: [], weeklyXp: 0, lastWeekXp: 0, currentWeekStr: getCurrentWeekStr(), highestWeeklyXp: 0, hasBrokenRecordThisWeek: false, timeMachine: null, mastered_words: 0, mastered_lessons: [] };
                        
                        let obSelect = document.getElementById('onboardRealmSelect');
                        if (obSelect) {
                            obSelect.innerHTML = '';
                            availableRealms.forEach(r => { obSelect.innerHTML += `<option value="${r}">${r}</option>`; });
                        }
                        document.getElementById('nameModal').classList.add('active'); 
                    }
                }).catch(err => {
                    console.error("Lỗi xác thực:", err); alert("Lỗi tải hồ sơ! Có thể do mạng yếu hoặc kết nối bị gián đoạn.");
                });
            } else { 
                currentUser = null; userData = { role: 'student', gold: 0, xp: 0, lifetime_xp: 0, realm: "Khởi Nguyên", streak: 0, displayName: 'Khách', vouchers: [], streakIcon: '🔥', theme: 'theme_default', purchasedItems: [], weeklyXp: 0, lastWeekXp: 0, currentWeekStr: '', highestWeeklyXp: 0, hasBrokenRecordThisWeek: false, potionX3Expiry: null, timeMachine: null, mastered_words: 0, mastered_lessons: [] };
                currentRealm = "Khởi Nguyên"; applyTheme('theme_default'); updateUI(); fetchLessonsFromFirebase();
            }
        });
    }
}

function fallbackInit() { availableRealms = ['Khởi Nguyên']; currentRealm = 'Khởi Nguyên'; updateUI(); checkAuth(); }

function transferToAdmin(amount, itemName) {
    let buyerName = (currentUser && currentUser.displayName) ? currentUser.displayName : "Người dùng ẩn danh";
    db.collection('vocab_users').doc(ADMIN_UID).set({
        gold: firebase.firestore.FieldValue.increment(amount),
        lastTransaction: { amount: amount, item: itemName, buyer: buyerName, time: Date.now() }
    }, { merge: true }).catch(err => console.error("Lỗi cập nhật số dư Admin: ", err));
}

let lastSeenTxTime = 0; 

function startAdminNotification(userUid) {
    if (userUid !== ADMIN_UID) return; 
    db.collection('vocab_users').doc(ADMIN_UID).onSnapshot((doc) => {
        const data = doc.data();
        if (data) {
            if (userData && currentUser && currentUser.uid === ADMIN_UID) {
                userData.gold = data.gold || 0;
                let uiGold = document.getElementById('ui-gold');
                if (uiGold) {
                    uiGold.innerText = userData.gold;
                    uiGold.style.transition = "all 0.3s ease";
                    uiGold.style.textShadow = "0 0 15px #ffd700";
                    uiGold.style.color = "#ffd700"; 
                    setTimeout(() => { uiGold.style.textShadow = "none"; uiGold.style.color = ""; }, 1000);
                }
            }
            if (data.lastTransaction) {
                const tx = data.lastTransaction;
                if (tx.time !== lastSeenTxTime) {
                    if (lastSeenTxTime !== 0) showBankNotification(tx.amount, tx.item, tx.buyer, data.gold);
                    lastSeenTxTime = tx.time; 
                }
            }
        }
    });
}

function showBankNotification(amount, item, buyer, total) {
    const toast = document.createElement('div');
    toast.style = `position: fixed; top: 20px; right: 20px; width: 320px; background: rgba(33, 33, 33, 0.95); border-left: 5px solid #4caf50; color: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 9999; font-family: Arial, sans-serif; animation: slideIn 0.5s ease-out; backdrop-filter: blur(5px);`;
    const style = document.createElement('style');
    style.innerHTML = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }`;
    document.head.appendChild(style);
    toast.innerHTML = `<div style="font-weight: bold; color: #4caf50; margin-bottom: 8px; font-size: 14px;">🏦 BIẾN ĐỘNG SỐ DƯ</div><div style="font-size: 16px; margin-bottom: 5px;">Số tiền: <span style="color: #4caf50; font-weight: bold;">+${amount} Vàng</span></div><div style="font-size: 13px; color: #ccc;">Người dùng: <b style="color: #fff;">${buyer}</b></div><div style="font-size: 13px; color: #ccc;">Giao dịch: <i style="color: #ffb300;">${item}</i></div><div style="font-size: 12px; color: #888; text-align: right; margin-top: 10px; border-top: 1px solid #444; padding-top: 5px;">Số dư cuối: ${total} Vàng</div>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = "slideOut 0.5s ease-in forwards"; setTimeout(() => toast.remove(), 500); }, 5000);
}

// =========================================================
// 🔄 CẬP NHẬT GIAO DIỆN CHÍNH (ĐÃ DỌN SẠCH CODE RÁC)
// =========================================================
function updateUI() {
    document.getElementById('ui-gold').innerText = userData.gold || 0; 
    document.getElementById('ui-xp').innerText = userData.xp || 0; 
    document.getElementById('ui-lifetime-xp').innerText = userData.lifetime_xp || 0; 
    document.getElementById('sidebarRealm').innerText = `🌍 Phủ: ${userData.realm || "---"}`; 
    document.getElementById('ui-streak').innerText = userData.streak || 0; 
    document.getElementById('sidebarName').innerText = userData.displayName || "Khách"; 
    
    // Giao diện đã đổi sang hàng 100% và 80%, tuyệt đối không gọi đồ cũ
    if(document.getElementById('ui-glass-100')) document.getElementById('ui-glass-100').innerText = userData.glass_100 || 0;
    if(document.getElementById('ui-glass-80')) document.getElementById('ui-glass-80').innerText = userData.glass_80 || 0;
    if(document.getElementById('ui-shield-100')) document.getElementById('ui-shield-100').innerText = userData.shield_100 || 0;
    if(document.getElementById('ui-shield-80')) document.getElementById('ui-shield-80').innerText = userData.shield_80 || 0;
    if(document.getElementById('ui-time-100')) document.getElementById('ui-time-100').innerText = userData.time_100 || 0;
    if(document.getElementById('ui-time-80')) document.getElementById('ui-time-80').innerText = userData.time_80 || 0;
    if(document.getElementById('ui-torch-100')) document.getElementById('ui-torch-100').innerText = userData.torch_100 || 0;
    if(document.getElementById('ui-torch-80')) document.getElementById('ui-torch-80').innerText = userData.torch_80 || 0;
    
    let streakIconEl = document.getElementById('ui-streak-icon');
    if (streakIconEl) {
        let currentIcon = userData.streakIcon || '🔥';
        streakIconEl.innerText = currentIcon;
        streakIconEl.className = ''; 
        if (['❄️', '🌸', '⚽', '🏀'].includes(currentIcon)) streakIconEl.classList.add('icon-spin');
        else if (currentIcon === '🔥') streakIconEl.classList.add('icon-neon-fire');
    }

    let mentorExpiryEl = document.getElementById('ui-mentor-expiry');
    if (mentorExpiryEl) {
        if (userData.selectedMentor && userData.mentorExpiry && userData.mentorExpiry > Date.now()) {
            let d = new Date(userData.mentorExpiry);
            let dateStr = d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
            let mentorName = (typeof mentorsData !== 'undefined' && mentorsData[userData.selectedMentor]) ? mentorsData[userData.selectedMentor].name : "Cố vấn";
            mentorExpiryEl.innerText = mentorName + " (" + dateStr + ")";
            mentorExpiryEl.style.color = "#00c853"; 
        } else {
            mentorExpiryEl.innerText = "Chưa ký kết / Hết hạn";
            mentorExpiryEl.style.color = "#d32f2f"; 
        }
    }
    
    if(document.getElementById('ui-mastered-words')) document.getElementById('ui-mastered-words').innerText = userData.mastered_words || 0;
    if(document.getElementById('ui-mastered-lessons')) document.getElementById('ui-mastered-lessons').innerText = (userData.mastered_lessons || []).length;
    
    let vText = "Trống"; if(userData.vouchers && userData.vouchers.length > 0) vText = userData.vouchers.map(v => `-${v}%`).join(', '); if(document.getElementById('ui-vouchers')) document.getElementById('ui-vouchers').innerText = vText;
    let todayStr = new Date().toLocaleDateString('en-GB'); let bbLeft = 3; if (userData.lastBlindBoxDate === todayStr) bbLeft = 3 - (userData.blindBoxCount || 0); if(document.getElementById('ui-wheel-left')) document.getElementById('ui-wheel-left').innerText = bbLeft;
    
    const badge = document.getElementById('sidebarRole'); 
    let forceBtn = document.getElementById('adminForceEndBtn'); 

    if(userData.role === 'teacher') { 
        badge.className = 'user-badge badge-teacher'; badge.innerText = '👨‍🏫 Quản trị viên'; 
        document.getElementById('nav-creator').style.display = 'flex'; document.getElementById('nav-arena').style.display = 'flex'; 
        if(forceBtn) forceBtn.style.display = 'block'; 
        if(document.getElementById('adminNoticeControl')) document.getElementById('adminNoticeControl').style.display = 'block';
    } else { 
        badge.className = 'user-badge badge-student'; badge.innerText = '👨‍🎓 Học Sinh'; 
        document.getElementById('nav-creator').style.display = 'none'; document.getElementById('nav-arena').style.display = 'none'; 
        if(forceBtn) forceBtn.style.display = 'none'; 
        if(document.getElementById('adminNoticeControl')) document.getElementById('adminNoticeControl').style.display = 'none';
    }            
    
    let itemsToCheck = ['streak_snow', 'streak_peach', 'streak_soccer', 'streak_basket', 'streak_cap', 'theme_aurora', 'theme_snow', 'theme_royal']; 
    if(userData.purchasedItems) { 
        itemsToCheck.forEach(item => { 
            let btn = document.getElementById('btn-' + item); let priceTag = document.getElementById('price-' + item); 
            if(btn && priceTag) { 
                if(userData.purchasedItems.includes(item)) { btn.innerText = "Dùng Ngay"; btn.style.background = "#9e9e9e"; priceTag.innerText = "Đã sở hữu"; } 
                else { btn.innerText = "Đổi Ngay"; btn.style.background = ""; let price = 5000; if(item === 'theme_aurora' || item === 'theme_snow') price = 15000; else if(item === 'theme_royal') price = 20000; priceTag.innerText = "🪙 " + price; } 
            } 
        }); 
    }
    if (document.getElementById('ui-weekly-xp')) document.getElementById('ui-weekly-xp').innerText = userData.weeklyXp || 0; 
    if (document.getElementById('ui-highest-xp')) document.getElementById('ui-highest-xp').innerText = userData.highestWeeklyXp || 0;
    
    if (typeof renderBracket === 'function') renderBracket();
    if (typeof renderAchievements === 'function') renderAchievements();
    
    if (typeof loadMarketItems === 'function') loadMarketItems(); 
}

// =========================================================
// 🛒 LOGIC MUA HÀNG & CHUYỂN TAB CỬA HÀNG KÉP
// =========================================================

function toggleStoreMenu() {
    const dropdown = document.getElementById('store-dropdown');
    const arrow = document.getElementById('store-arrow');
    const mainBtn = document.getElementById('nav-shop-main');
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'flex'; arrow.style.transform = 'rotate(-180deg)'; mainBtn.style.background = 'rgba(255, 255, 255, 0.1)';
    } else {
        dropdown.style.display = 'none'; arrow.style.transform = 'rotate(0deg)'; mainBtn.style.background = '';
    }
}

function switchTab(tabId) { 
    try {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active')); 
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active')); 
        
        const viewEl = document.getElementById('view-' + tabId);
        if (viewEl) viewEl.classList.add('active'); 
        
        if (tabId === 'shop') { document.getElementById('nav-shop-main').classList.add('active'); document.getElementById('nav-shop').classList.add('active'); } 
        else if (tabId === 'market') { document.getElementById('nav-shop-main').classList.add('active'); document.getElementById('nav-market').classList.add('active'); } 
        else { const navBtn = document.getElementById('nav-' + tabId); if(navBtn) navBtn.classList.add('active'); }

        if (tabId === 'shop' || tabId === 'market') {
            let dropdown = document.getElementById('store-dropdown'); let arrow = document.getElementById('store-arrow');
            if (dropdown.style.display === 'none' || dropdown.style.display === '') { dropdown.style.display = 'flex'; arrow.style.transform = 'rotate(-180deg)'; }
        }

        if (window.innerWidth <= 768) toggleSidebar(); 
        if (tabId === 'library') fetchLessonsFromFirebase(); 
        if (tabId === 'leaderboard') fetchLeaderboard(); 
        if (tabId === 'market') loadMarketItems();
    } catch (error) { console.error("Lỗi khi chuyển tab:", error); }
}

function buyItem(itemType, basePrice) { 
    if (!currentUser) return alert("Hệ thống yêu cầu phải đăng nhập mới sử dụng tính năng giao dịch!"); 
    
    if (['streak_snow', 'streak_peach', 'streak_soccer', 'streak_basket', 'streak_cap', 'theme_aurora', 'theme_snow', 'theme_royal'].includes(itemType)) {
        if (userData.purchasedItems && userData.purchasedItems.includes(itemType)) {
            let updates = {};
            if (itemType.startsWith('streak_')) updates.streakIcon = itemType === 'streak_snow' ? '❄️' : itemType === 'streak_peach' ? '🌸' : itemType === 'streak_soccer' ? '⚽' : itemType === 'streak_basket' ? '🏀' : '🎓';
            else if (itemType.startsWith('theme_')) updates.theme = itemType.replace('_', '-');
            userData.streakIcon = updates.streakIcon || userData.streakIcon; userData.theme = updates.theme || userData.theme;
            if(updates.theme) applyTheme(userData.theme);
            db.collection('vocab_users').doc(currentUser.uid).update(updates).then(() => { updateUI(); alert("Áp dụng thành công vật phẩm đã sở hữu!"); });
            return;
        }
    } else if (itemType === 'theme_default' || itemType === 'streak_fire') {
         let updates = {};
         if (itemType === 'theme_default') { updates.theme = 'theme_default'; userData.theme = updates.theme; applyTheme(userData.theme); }
         if (itemType === 'streak_fire') { updates.streakIcon = '🔥'; userData.streakIcon = updates.streakIcon; }
         db.collection('vocab_users').doc(currentUser.uid).update(updates).then(() => { updateUI(); alert("Giao diện đã quay về trạng thái gốc!"); });
         return;
    }
    
    let isStore = itemType.endsWith('_100'); let isMarket = itemType.endsWith('_80');
    let quantity = 1; let finalPrice = basePrice;
    
    if (itemType === 'glass_100') {
        let qStr = prompt("🔍 Nhập số lượng Kính Lúp ngài muốn mua:\n(🔥 ƯU ĐÃI: Mua từ 3 kính trở lên, giá giảm chỉ còn 150 🪙 / kính)", "1");
        if (qStr === null) return; quantity = parseInt(qStr);
        if (isNaN(quantity) || quantity <= 0) return alert("Số lượng không hợp lệ!");
        finalPrice = (quantity >= 3 ? 150 : 200) * quantity;
    }

    let bestVoucher = 0; let vIndex = -1;
    if(userData.vouchers && userData.vouchers.length > 0) { bestVoucher = userData.vouchers[0]; vIndex = 0; }
    if (bestVoucher > 0) finalPrice = Math.floor(finalPrice * (100 - bestVoucher) / 100);
    
    let hasDoraemonBuff = (userData.selectedMentor === 'doraemon' && userData.mentorExpiry && userData.mentorExpiry > Date.now());
    if (hasDoraemonBuff) finalPrice = Math.floor(finalPrice * 0.85);

    if (isMarket) finalPrice = Math.floor(finalPrice * 1.05); 
    if (userData.gold < finalPrice) return alert(`Giao dịch thất bại! Bạn cần thanh toán ${finalPrice} 🪙.`);
    
    let confirmMsg = `Xác nhận thanh toán ${finalPrice} Vàng?`;
    if(isMarket) confirmMsg = `Thanh toán ${finalPrice} Vàng (đã bao gồm 5% thuế phí Chợ đen)?`;
    
    if(confirm(confirmMsg)) {
        let updates = { gold: userData.gold - finalPrice };
        if (vIndex > -1) { userData.vouchers.splice(vIndex, 1); updates.vouchers = userData.vouchers; }
        
        if (itemType === 'rename_100' || itemType === 'rename_80') { 
            let newName = prompt("Nhập tên hiển thị bạn mong muốn:"); 
            if (!newName || newName.trim() === "") return alert("Quy trình hủy do thông tin tên không hợp lệ!"); 
            updates.displayName = newName.trim(); 
        }
        
        if (itemType === 'shield_100') updates.shield_100 = (userData.shield_100 || 0) + 3; 
        if (itemType === 'shield_80') updates.shield_80 = (userData.shield_80 || 0) + 1;  
        if (itemType === 'glass_100') updates.glass_100 = (userData.glass_100 || 0) + quantity;
        if (itemType === 'glass_80') updates.glass_80 = (userData.glass_80 || 0) + 1;
        if (itemType === 'time_100') updates.time_100 = (userData.time_100 || 0) + 1;
        if (itemType === 'time_80') updates.time_80 = (userData.time_80 || 0) + 1;
        if (itemType === 'torch_100') updates.torch_100 = (userData.torch_100 || 0) + 1;
        if (itemType === 'torch_80') updates.torch_80 = (userData.torch_80 || 0) + 1;

        if (itemType.startsWith('potion_')) updates.potionExpiry = Date.now() + (isStore ? 86400000 : 43200000); 
        if (itemType.startsWith('potion_x3_')) updates.potionX3Expiry = Date.now() + (isStore ? 21600000 : 10800000); 
        if (itemType.startsWith('mask_')) updates.maskExpiry = Date.now() + (isStore ? 86400000 : 43200000); 
        
        if (['streak_snow', 'streak_peach', 'streak_soccer', 'streak_basket', 'streak_cap', 'theme_aurora', 'theme_snow', 'theme_royal'].includes(itemType)) {
            if (!userData.purchasedItems) userData.purchasedItems = [];
            userData.purchasedItems.push(itemType); updates.purchasedItems = userData.purchasedItems;
        }

        let extraMsg = "";
        if (isStore) {
            let xpBonus = Math.floor((userData.xp || 0) * 0.05); updates.xp = (userData.xp || 0) + xpBonus;
            if(!userData.vouchers) userData.vouchers = []; userData.vouchers.push(45); userData.vouchers.sort((a,b) => b - a); updates.vouchers = userData.vouchers;
            extraMsg = `\n✨ Đặc quyền Chính hãng: Nhận thêm ${xpBonus} XP và 1 Voucher Giảm 45%!`;
        }
        
        db.collection('vocab_users').doc(currentUser.uid).update(updates).then(() => {
            if (typeof transferToAdmin === 'function') transferToAdmin(finalPrice, `Cửa hàng: ${itemType}`);
            Object.assign(userData, updates); updateUI(); 
            if (itemType.startsWith('rename')) fetchLeaderboard(); 
            let anim = document.getElementById('rewardAnim'); anim.innerText = `🛒 Giao dịch thành công! -${finalPrice} 🪙${extraMsg}`; 
            anim.classList.add('show'); setTimeout(() => anim.classList.remove('show'), 3500);
        });
    }
}

function loadMarketItems() {
    const container = document.getElementById('pawnshopContainer');
    if(!container) return;
    
    let html = ''; let hasItems = false;
    const pawnPrices = {
        'glass_100': { name: 'Kính Lúp', price: 160, count: userData.glass_100 || 0, icon: '🔍' },
        'shield_100': { name: 'Bùa Bảo Hộ', price: 6400, count: Math.floor((userData.shield_100 || 0)/3), icon: '🛡️' },
        'time_100': { name: 'Đồng Hồ', price: 240, count: userData.time_100 || 0, icon: '⏳' },
        'torch_100': { name: 'Ngọn Đuốc', price: 200, count: userData.torch_100 || 0, icon: '🔥' }
    };

    for (const [id, item] of Object.entries(pawnPrices)) {
        if (item.count > 0) {
            hasItems = true;
            html += `<div style="background: rgba(255,255,255,0.8); border: 1px solid #ffcc80; padding: 10px; border-radius: 6px; width: 45%; min-width: 120px;"><div style="font-size: 16px; margin-bottom: 5px;">${item.icon}</div><div style="font-size: 13px; font-weight: bold; color: #424242;">${item.name}</div><div style="font-size: 11px; color: #888;">(Có: ${item.count})</div><button onclick="sellItemToSystem('${id}', ${item.price})" style="margin-top: 5px; width: 100%; padding: 5px; background: #ff9800; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">BÁN (+${item.price} 🪙)</button></div>`;
        }
    }
    if(hasItems) container.innerHTML = html; else container.innerHTML = `<span style="font-size: 12px; color: #888; font-style: italic;">Túi đồ của bạn hiện chưa có pháp bảo 100% nào để bán.</span>`;
}

function sellItemToSystem(itemId, earnGold) {
    if (!confirm(`Xác nhận thanh lý món đồ này cho hệ thống để lấy ${earnGold} Vàng?`)) return;
    let updates = { gold: (userData.gold || 0) + earnGold };
    if (itemId === 'glass_100') updates.glass_100 = userData.glass_100 - 1;
    if (itemId === 'shield_100') updates.shield_100 = userData.shield_100 - 3;
    if (itemId === 'time_100') updates.time_100 = userData.time_100 - 1;
    if (itemId === 'torch_100') updates.torch_100 = userData.torch_100 - 1;

    db.collection('vocab_users').doc(currentUser.uid).update(updates).then(() => {
        if (typeof transferToAdmin === 'function') transferToAdmin(-earnGold, `Thu mua lại: ${itemId}`);
        Object.assign(userData, updates); updateUI(); 
        let anim = document.getElementById('rewardAnim'); anim.innerText = `🏦 Thanh lý thành công! +${earnGold} 🪙`; 
        anim.classList.add('show'); setTimeout(() => anim.classList.remove('show'), 3000);
    });
}

// BỎ HÀM GENERATECODE VÀ CÁC HÀM CŨ XUỐNG DƯỚI NÀY
function createNewRealm() { let name = document.getElementById('newRealmInput').value.trim(); if(!name) return alert("Vui lòng nhập tên Vũ trụ / Phủ mới!"); if(availableRealms.includes(name)) return alert("Tên Phủ này đã tồn tại trong hệ thống!"); db.collection('realms').doc(name).set({ created: Date.now() }).then(() => { alert(`🌌 Lập Phủ [${name}] thành công!`); document.getElementById('newRealmInput').value = ""; }); }
async function deleteRealm() { let targetRealm = document.getElementById('deleteRealmSelect').value; if(!targetRealm) return alert("Vui lòng chọn Phủ cần xóa!"); if(targetRealm === 'Khởi Nguyên') return alert("Kháng chỉ! Không thể thiêu rụi Phủ gốc [Khởi Nguyên] của hệ thống!"); let confirm1 = confirm(`CẢNH BÁO: Bạn đang muốn XÓA VĨNH VIỄN phủ [${targetRealm}]?\nToàn bộ bài học và giải đấu của lãnh thổ này sẽ bốc hơi!`); if(!confirm1) return; let promptText = prompt(`Để xác nhận hủy diệt, bạn vui lòng gõ chính xác tên phủ: ${targetRealm}`); if(promptText !== targetRealm) return alert("Hủy thao tác do nhập sai tên Phủ."); try { const lessonsSnap = await db.collection('realms').doc(targetRealm).collection('lessons').get(); const batch = db.batch(); lessonsSnap.forEach(doc => batch.delete(doc.ref)); await batch.commit(); await db.collection('realms').doc(targetRealm).delete(); await rtdb.ref(`tournament_status/${targetRealm}`).remove(); await rtdb.ref(`active_pvp_match/${targetRealm}`).remove(); alert(`🔥 Đã thiêu rụi Phủ [${targetRealm}] thành tro bụi! Thần dân của Phủ này sẽ tự động dạt về [Khởi Nguyên] trong lần đăng nhập tới.`); if (currentRealm === targetRealm) { window.location.reload(); } } catch (e) { alert("Lỗi khi hủy diệt: " + e.message); } }
function deleteLesson(lessonId, event) { if (event) event.stopPropagation(); if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bài học này khỏi kho không?")) return; db.collection('realms').doc(currentRealm).collection('lessons').doc(lessonId).delete().then(() => { alert("Đã xóa bài học thành công!"); }).catch(err => { alert("Lỗi khi xóa bài học: " + err.message); }); }
function saveLessonToFirebase() { let title = document.getElementById('adminLessonName').value.trim(); let realm = document.getElementById('adminRealmSelect').value; let code = document.getElementById('generatedCode').value; if(!title || !realm || !code) return alert("Yêu cầu nhập đầy đủ Tên bài, Phủ và Đúc Mã trước khi lưu!"); if(currentGeneratedVocab.length === 0) return alert("Mã chưa có mảng từ vựng hợp lệ. Vui lòng bấm Đúc Mã lại!"); db.collection('realms').doc(realm).collection('lessons').add({ name: title, html: code, vocab: currentGeneratedVocab, created: Date.now() }).then(() => { alert(`💾 Đã lưu bài [${title}] vào kho [${realm}] thành công!`); document.getElementById('adminLessonName').value = ""; document.getElementById('generatedCode').value = ""; document.getElementById('rawInput').value = ""; currentGeneratedVocab = []; if(realm === currentRealm) fetchLessonsFromFirebase();  }); }
async function syncFromSheetsToFirebase() { let targetRealm = document.getElementById('syncRealmSelect').value; if(!targetRealm) return alert("Hệ thống chưa có Phủ nào để chứa dữ liệu. Vui lòng tạo Phủ trước!"); if(!confirm(`⚠️ CHÚ Ý: Toàn bộ bài học từ Google Sheets cũ sẽ được hút thẳng vào phủ [${targetRealm}]. Chắc chắn muốn tiếp tục?`)) return; const SHEET_LINK = 'https://docs.google.com/spreadsheets/d/1dZA9LTtjrKEYZb6kUm4E7p2XLt5NBYqvnKmYarIpxCg/edit?usp=sharing'; let sheetId = SHEET_LINK.includes('/d/') ? SHEET_LINK.split('/d/')[1].split('/')[0] : SHEET_LINK; try { const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&t=${new Date().getTime()}`); const text = await response.text(); const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1); const data = JSON.parse(jsonString); let count = 0; for (let i = 1; i < data.table.rows.length; i++) { const r = data.table.rows[i]; if (r && r.c && r.c[0] && r.c[1] && r.c[1].v) { const lessonName = r.c[0].v; const rawHTML = r.c[1].v; let vocabMatch = rawHTML.match(/const vocabList = \[(.*?)\];/s); let currentVocab = []; if (vocabMatch) { try { currentVocab = eval("[" + vocabMatch[1] + "]"); } catch(e){} } await db.collection('realms').doc(targetRealm).collection('lessons').add({ name: lessonName, html: rawHTML, vocab: currentVocab, created: Date.now() + i }); count++; } } alert(`🚀 Dời đô hoàn tất! Đã đồng bộ thành công ${count} bài học. Ngài có thể xóa Google Sheets cũ.`); if(targetRealm === currentRealm) fetchLessonsFromFirebase(); } catch(e) { alert("Lỗi khi kết nối với Sheets cũ: " + e); } }
function fetchLessonsFromFirebase() { const container = document.getElementById('libraryContainer'); const syllabusDiv = document.getElementById('syllabusChecklist');  if (!container || !db || !currentRealm) return; container.innerHTML = "<p>Đang mở kho tàng...</p>"; db.collection('realms').doc(currentRealm).collection('lessons').orderBy('created', 'asc').onSnapshot(snap => { let htmlLib = ''; let htmlArena = ''; allLessonsData = []; snap.forEach(doc => { const data = doc.data(); allLessonsData.push({ id: doc.id, name: data.name, vocab: data.vocab, raw: data.html }); let deleteBtn = userData.role === 'teacher' ? `<button class="btn-delete-lib" onclick="deleteLesson('${doc.id}', event)">Xóa</button>` : ''; htmlLib += `<div class="lib-card">${deleteBtn}<h3>${data.name}</h3><p style="font-size:11px;">Số lượng: ${data.vocab.length} từ</p><button class="btn-run" style="margin-top:10px;" onclick="viewCard('${btoa(unescape(encodeURIComponent(data.html)))}', '${data.name.replace(/'/g, "\\'")}', ${data.vocab.length})">▶ VÀO HỌC</button></div>`; htmlArena += `<label class="syllabus-item"><input type="checkbox" name="syllabusCheck" value="${data.name}"> <span>${data.name} (${data.vocab.length} từ)</span></label>`; }); if(allLessonsData.length === 0) htmlLib = "<p style='color:#888'>Kho bài học của Phủ này hiện đang trống. Quản trị viên vui lòng vào Ngự Thư Phòng để thêm bài.</p>"; container.innerHTML = htmlLib; if(syllabusDiv) syllabusDiv.innerHTML = htmlArena; if(userData.role === 'teacher') { document.querySelectorAll('.lib-card').forEach(card => { card.addEventListener('mouseenter', () => { let btn = card.querySelector('.btn-delete-lib'); if(btn) btn.style.display = 'block'; }); card.addEventListener('mouseleave', () => { let btn = card.querySelector('.btn-delete-lib'); if(btn) btn.style.display = 'none'; }); }); } }, err => { container.innerHTML = `<p style="color:#ff5252;">Lỗi Tường Lửa: ${err.message}<br>Vui lòng vào tab Cài Đặt đăng nhập hệ thống.</p>`; }); }
function getCurrentWeekStr() { let d = new Date(); d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7)); let yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1)); let weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7); return d.getUTCFullYear() + "-W" + weekNo; }
function triggerConfetti() { for (let i = 0; i < 60; i++) { let conf = document.createElement('div'); conf.className = 'confetti'; conf.style.left = Math.random() * 100 + 'vw'; conf.style.backgroundColor = ['#fbc02d', '#ff5722', '#00c853', '#2962ff', '#e040fb'][Math.floor(Math.random() * 5)]; conf.style.animationDuration = (Math.random() * 2 + 2) + 's'; document.body.appendChild(conf); setTimeout(() => conf.remove(), 4000); } }
function loginWithGoogle() {  if (!auth) return;  var provider = new firebase.auth.GoogleAuthProvider();  provider.setCustomParameters({ prompt: 'select_account' });  auth.signInWithPopup(provider).then(() => { window.location.reload(); }).catch(err => { console.warn("Popup bị chặn, chuyển sang Redirect...", err); auth.signInWithRedirect(provider); }); }
function loginWithEmail() { if (!auth) return; const email = document.getElementById('loginEmail').value.trim(); const pass = document.getElementById('loginPass').value.trim(); if (!email || !pass) return alert("Vui lòng cung cấp đầy đủ thông tin truy cập!"); auth.signInWithEmailAndPassword(email, pass).catch(err => alert("Lỗi: " + err.message)); }
function registerWithEmail() { if (!auth) return; const email = document.getElementById('loginEmail').value.trim(); const pass = document.getElementById('loginPass').value.trim(); if (!email || !pass) return alert("Vui lòng cung cấp đầy đủ thông tin để đăng ký!"); auth.createUserWithEmailAndPassword(email, pass).then(() => alert("Đăng ký thành công!")).catch(err => alert("Lỗi: " + err.message)); }
function saveDisplayName() {  const name = document.getElementById('displayNameInput').value.trim();  if (!name) return alert("Tên hiển thị không được để trống!");  let onboardRealm = document.getElementById('onboardRealmSelect'); if (onboardRealm && onboardRealm.value && !userData.realm) { userData.realm = onboardRealm.value; currentRealm = userData.realm; } userData.displayName = name;  userData.email = currentUser.email;  db.collection('vocab_users').doc(currentUser.uid).set(userData, {merge: true}).then(() => {  document.getElementById('nameModal').classList.remove('active');  updateUI();  setupRealmListeners();  fetchLessonsFromFirebase();  alert(`🎉 Thiết lập thành công! Chào mừng bạn đến với khóa học [${userData.realm}]!`); });  }
function syncStatsToCloud() {  if (currentUser && db) {  db.collection('vocab_users').doc(currentUser.uid).update(userData);  updateUI();  }  }
function applyTheme(themeName) { document.body.classList.remove('theme-aurora', 'theme-snow', 'theme-royal'); if (themeName && themeName !== 'theme_default') { document.body.classList.add(themeName); if(themeName === 'theme-snow' || themeName === 'theme-aurora' || themeName === 'theme-royal') { document.body.classList.remove('dark-mode'); document.getElementById('themeToggleBtn').innerText = '🌙'; localStorage.setItem('darkMode', 'false'); } } }
function openHOFModal() {  document.getElementById('hofModal').classList.add('active');  }
function switchLeagueTab(league) { currentLeagueView = league; document.getElementById('btn-tab-c1').style.background = league === 'c1' ? '#ffd700' : '#555'; document.getElementById('btn-tab-c1').style.color = league === 'c1' ? '#000' : '#ccc'; document.getElementById('btn-tab-c1').style.boxShadow = league === 'c1' ? '0 0 10px #ffd700' : 'none';  document.getElementById('btn-tab-c2').style.background = league === 'c2' ? '#c0c0c0' : '#555'; document.getElementById('btn-tab-c2').style.color = league === 'c2' ? '#000' : '#ccc'; document.getElementById('btn-tab-c2').style.boxShadow = league === 'c2' ? '0 0 10px #c0c0c0' : 'none';  document.getElementById('leagueTitle').innerText = league === 'c1' ? "🏆 MES CHAMPIONS LEAGUE ELITE 🏆" : "🥈 MES CHAMPIONS LEAGUE TWO 🥈"; document.getElementById('leagueTitle').style.color = league === 'c1' ? '#ffd700' : '#c0c0c0'; renderBracket(); }
let windowLeagueToSchedule = ""; let windowStageToSchedule = ""; let windowIndexToSchedule = 0;
function openScheduleModal(league, stageKey, matchIndex) { windowLeagueToSchedule = league; windowStageToSchedule = stageKey; windowIndexToSchedule = matchIndex; document.getElementById('scheduleModal').classList.add('active'); }
function saveSchedule() { let val = document.getElementById('scheduleInput').value; if(!val) return alert("Vui lòng thiết lập thời gian cho trận đấu!"); let ts = new Date(val).getTime(); let key = `tournament_status/${currentRealm}/${windowLeagueToSchedule}_bracket/${windowStageToSchedule}`; if(windowStageToSchedule !== 'sfl' && windowStageToSchedule !== 'sfr' && windowStageToSchedule !== 'final' && windowStageToSchedule !== 'third_place' && windowStageToSchedule !== 'super_cup' && windowStageToSchedule !== 'promotion_playoff') { key += `/${windowIndexToSchedule}`; } rtdb.ref(key).update({ schedule: ts }).then(() => { alert("Đã cập nhật lịch thành công. Hệ thống sẽ tự động mở phòng vào đúng giờ."); document.getElementById('scheduleModal').classList.remove('active'); }); }
let isUnderSurveillance = false; let surveillanceData = null;
function showAntiCheatModal(league, stageKey, matchIndex, playerSlot) { let fb = league === 'c1' ? currentC1Data : currentC2Data; let m = fb[stageKey]; if (Array.isArray(m)) m = m[matchIndex];  surveillanceData = { league: league, stageKey: stageKey, matchIndex: matchIndex, playerSlot: playerSlot, myName: playerSlot === 'p1' ? m.p1 : m.p2, oppName: playerSlot === 'p1' ? m.p2 : m.p1 }; document.getElementById('antiCheatModal').classList.add('active'); }
function confirmJoinMatch() { document.getElementById('antiCheatModal').classList.remove('active'); if (!surveillanceData) return;  let key = `tournament_status/${currentRealm}/${surveillanceData.league}_bracket/${surveillanceData.stageKey}`; if (!['sfl', 'sfr', 'final', 'third_place', 'super_cup', 'promotion_playoff'].includes(surveillanceData.stageKey)) {  key += `/${surveillanceData.matchIndex}`;  } let updateData = {}; updateData[surveillanceData.playerSlot + "_ready"] = true;  rtdb.ref(key).update(updateData).then(() => { isUnderSurveillance = true;   let p1_s = surveillanceData.playerSlot === 'p1' ? 0 : 2; let p2_s = surveillanceData.playerSlot === 'p2' ? 0 : 2;  rtdb.ref(`active_pvp_match/${currentRealm}`).onDisconnect().update({  status: 'finished',  winner: surveillanceData.oppName, reason: 'anti_cheat', violator: surveillanceData.myName });  rtdb.ref(key).onDisconnect().update({  winner: surveillanceData.oppName,  p1_set: p1_s,  p2_set: p2_s  }); }); }
function executeAntiCheatPunishment() { if (!isUnderSurveillance || !surveillanceData) return; isUnderSurveillance = false;  let waitMsg = document.getElementById('pvpWaitMsg'); if(waitMsg) { waitMsg.style.display = 'block'; waitMsg.innerText = "❌ BẠN ĐÃ CHUYỂN TAB VÀ BỊ XỬ THUA!"; waitMsg.style.color = '#ff1744'; } let qEl = document.getElementById('pvpQuestion'); if(qEl) qEl.style.display = 'none'; let optEl = document.getElementById('pvpOptions'); if(optEl) optEl.style.display = 'none'; let spellEl = document.getElementById('pvpSpellContainer'); if(spellEl) spellEl.style.display = 'none'; let subBtn = document.getElementById('pvpSpellSubmitBtn'); if(subBtn) subBtn.style.display = 'none'; clearInterval(window.pvpTimer); let banner = document.getElementById('pvpTimerBanner'); if(banner) banner.innerText = `⏳ 0s`; let key = `tournament_status/${currentRealm}/${surveillanceData.league}_bracket/${surveillanceData.stageKey}`; if (!['sfl', 'sfr', 'final', 'third_place', 'super_cup', 'promotion_playoff'].includes(surveillanceData.stageKey)) {  key += `/${surveillanceData.matchIndex}`;  }  let p1_s = surveillanceData.playerSlot === 'p1' ? 0 : 2; let p2_s = surveillanceData.playerSlot === 'p2' ? 0 : 2; let updates = {};  updates[`${key}/winner`] = surveillanceData.oppName; updates[`${key}/p1_set`] = p1_s; updates[`${key}/p2_set`] = p2_s;  updates[`active_pvp_match/${currentRealm}/status`] = 'finished'; updates[`active_pvp_match/${currentRealm}/winner`] = surveillanceData.oppName; updates[`active_pvp_match/${currentRealm}/reason`] = 'anti_cheat'; updates[`active_pvp_match/${currentRealm}/violator`] = surveillanceData.myName; rtdb.ref().update(updates); }
function forceEndMatch() { if(userData.role !== 'teacher') return; let tempSurveillance = isUnderSurveillance; isUnderSurveillance = false;   if(!confirm("Bạn có chắc chắn muốn kết thúc ép buộc trận đấu này? Thao tác này sẽ giải tán võ đài và giải phóng cả 2 tuyển thủ khỏi tình trạng bị kẹt.")) { isUnderSurveillance = tempSurveillance;  return; }  rtdb.ref(`active_pvp_match/${currentRealm}`).update({  status: 'finished',  winner: 'HỦY BỞI QUẢN TRỊ', reason: 'force_end' }).then(() => { document.getElementById('pvpModal').classList.remove('active'); alert("Đã giải tán võ đài thành công!"); setTimeout(() => rtdb.ref(`active_pvp_match/${currentRealm}`).remove(), 2000); }); }
function surrenderMatch() { let tempSurveillance = isUnderSurveillance; isUnderSurveillance = false;   if(confirm("Bạn có chắc chắn muốn rút lui khỏi trận này? Hệ thống sẽ xử thua!")) { window.isSpectating = false; let myName = userData.displayName; rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(snap => { let m = snap.val(); if(m && m.status !== 'finished') { let oppName = (m.p1 === myName) ? m.p2 : m.p1;  if(m.stage && m.match_idx !== undefined && m.league) { let key = `tournament_status/${currentRealm}/${m.league}_bracket/${m.stage}`; if(!['sfl', 'sfr', 'final', 'third_place', 'super_cup', 'promotion_playoff'].includes(m.stage)) {  key += `/${m.match_idx}`;  } let p1s = (oppName === m.p1) ? 2 : 0; let p2s = (oppName === m.p2) ? 2 : 0; rtdb.ref(key).update({ winner: oppName, p1_set: p1s, p2_set: p2s }); } rtdb.ref(`active_pvp_match/${currentRealm}`).update({ status: 'finished', winner: oppName, reason: 'surrender' }); } }); } else { isUnderSurveillance = tempSurveillance;  } }

setInterval(() => {
    if(userData.role !== 'teacher' || !currentRealm) return;
    let now = Date.now();
    let updates = {}; let needsUpdate = false;

   function checkWalkover(m, stage, idx, league) {
        if(m && m.p1 && m.p2 && m.p1 !== "---" && m.p2 !== "---" && !m.winner && m.schedule) {
            let diff = m.schedule - now;
            
            if (diff <= 0 && diff > -600000) {
                let needBotUpdate = false;
                let botUpdates = {};
                if (m.p1.includes('🤖') && !m.p1_ready) { botUpdates.p1_ready = true; needBotUpdate = true; m.p1_ready = true; }
                if (m.p2.includes('🤖') && !m.p2_ready) { botUpdates.p2_ready = true; needBotUpdate = true; m.p2_ready = true; }
                if (needBotUpdate) {
                    let k = (stage === 'sfl' || stage === 'sfr' || stage === 'final' || stage === 'third_place' || stage === 'super_cup' || stage === 'promotion_playoff') 
                        ? `tournament_status/${currentRealm}/${league}_bracket/${stage}` 
                        : `tournament_status/${currentRealm}/${league}_bracket/${stage}/${idx}`;
                    rtdb.ref(k).update(botUpdates);
                }
            }

            if(diff <= -600000) { 
                let winner = "";
                if(m.p1_ready && !m.p2_ready) winner = m.p1;
                else if(!m.p1_ready && m.p2_ready) winner = m.p2;
                else if(!m.p1_ready && !m.p2_ready) winner = Math.random() > 0.5 ? m.p1 : m.p2;
                
                if(winner !== "") {
                    let k = (stage === 'sfl' || stage === 'sfr' || stage === 'final' || stage === 'third_place' || stage === 'super_cup' || stage === 'promotion_playoff') 
                        ? `tournament_status/${currentRealm}/${league}_bracket/${stage}/winner` 
                        : `tournament_status/${currentRealm}/${league}_bracket/${stage}/${idx}/winner`;
                    updates[k] = winner; needsUpdate = true;
                }
            }
        }
    }

    function scanLeague(fb, league) {
        if(!fb) return;
        if(fb.r16l) fb.r16l.forEach((m, i) => checkWalkover(m, 'r16l', i, league));
        if(fb.r16r) fb.r16r.forEach((m, i) => checkWalkover(m, 'r16r', i, league));
        if(fb.qfl) fb.qfl.forEach((m, i) => checkWalkover(m, 'qfl', i, league));
        if(fb.qfr) fb.qfr.forEach((m, i) => checkWalkover(m, 'qfr', i, league));
        checkWalkover(fb.sfl, 'sfl', 0, league); checkWalkover(fb.sfr, 'sfr', 0, league);
        checkWalkover(fb.final, 'final', 0, league); checkWalkover(fb.third_place, 'third_place', 0, league);
        if(fb.super_cup) checkWalkover(fb.super_cup, 'super_cup', 0, league);
        if(fb.promotion_playoff) checkWalkover(fb.promotion_playoff, 'promotion_playoff', 0, league);
    }

    scanLeague(currentC1Data, 'c1');
    scanLeague(currentC2Data, 'c2');

    if(needsUpdate) { rtdb.ref().update(updates); }
}, 5000);

function renderBracket() {
    if (!document.getElementById('c1-elite-style')) {
        const style = document.createElement('style'); style.id = 'c1-elite-style';
        style.innerHTML = `@keyframes sweepShine { 0% { left: -100%; } 20% { left: 100%; } 100% { left: 100%; } } .c1-elite-theme { position: relative; overflow: hidden; border-radius: 8px; box-shadow: 0 0 15px rgba(0, 0, 0, 0.4) !important;  background-color: rgba(0, 0, 0, 0.1);  } .c1-elite-theme::before { content: ''; position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); transform: skewX(-25deg); animation: sweepShine 3s infinite; pointer-events: none; z-index: 1; }`;
        document.head.appendChild(style);
    }

    currentFullBracketData = currentLeagueView === 'c1' ? currentC1Data : currentC2Data;
    if (!currentFullBracketData) { document.getElementById('bracketMatches').innerHTML = '<div style="color:#888; text-align:center; width:100%;">Giai đoạn này hiện tại chưa có dữ liệu.</div>'; return; }
    
    let boardEl = document.getElementById('bracketBoard'); boardEl.style.display = 'block';
    if (currentLeagueView === 'c1') boardEl.classList.add('c1-elite-theme'); else boardEl.classList.remove('c1-elite-theme');

    let statusEl = document.getElementById('bracketStatus'); if (statusEl) { statusEl.innerText = `GIAI ĐOẠN: Sơ đồ loại trực tiếp | Trạng thái: Đang tiến hành`; statusEl.style.color = '#ccc'; statusEl.style.fontWeight = 'normal'; }
    let titleEl = document.getElementById('leagueTitle'); if (titleEl) { titleEl.style.color = currentLeagueView === 'c1' ? '#ffd700' : '#c0c0c0'; titleEl.style.textShadow = 'none'; }

    const container = document.getElementById('bracketMatches'); container.innerHTML = ''; 
    const columns = [];
    if (currentFullBracketData.r16l) columns.push({ title: 'Vòng 1/8', key: 'r16l' });
    if (currentFullBracketData.qfl) columns.push({ title: 'Tứ Kết', key: 'qfl' });
    if (currentFullBracketData.sfl) columns.push({ title: 'Bán Kết', key: 'sfl' });
    columns.push({ title: 'TRẬN CHIẾN TỐI THƯỢNG', key: 'center_col' });
    if (currentFullBracketData.sfr) columns.push({ title: 'Bán Kết', key: 'sfr' });
    if (currentFullBracketData.qfr) columns.push({ title: 'Tứ Kết', key: 'qfr' });
    if (currentFullBracketData.r16r) columns.push({ title: 'Vòng 1/8', key: 'r16r' });

    container.style.gridTemplateColumns = `repeat(${columns.length}, minmax(130px, 1fr))`;

    columns.forEach(col => {
        const colEl = document.createElement('div'); colEl.className = 'bracket-column';
        let titleColor = currentLeagueView === 'c1' ? '#ffd700' : '#ffd700'; 
        let borderStyle = currentLeagueView === 'c1' ? '1px dashed #ffd700' : '1px dashed #ffd700';

        const colTitle = document.createElement('div'); 
        colTitle.style.cssText = `font-size: 13px; font-weight: bold; color: ${titleColor}; text-align: center; margin-bottom: 15px; border-bottom: ${borderStyle}; padding-bottom: 5px; position: relative; z-index: 2;`; 
        colTitle.innerText = col.title; colEl.appendChild(colTitle);

        if (col.key === 'center_col') {
            if (currentLeagueView === 'c1' && currentFullBracketData.super_cup && currentC2Data) {
                let scLabel = document.createElement('div'); scLabel.innerHTML = `<div style="font-size:13px; color:#ff1744; margin-top:5px; margin-bottom:5px; font-weight:900; animation: pulse 1.5s infinite; position: relative; z-index: 2;">🔥 SIÊU CÚP MÙA GIẢI</div>`; colEl.appendChild(scLabel);
                colEl.appendChild(createMatchBox(currentFullBracketData.super_cup, 'super_cup', 0, currentLeagueView));
            }
            if (currentFullBracketData.final) {
                let fLabel = document.createElement('div'); fLabel.innerHTML = `<div style="font-size:13px; color:#ffd700; margin-top:15px; margin-bottom:5px; font-weight:bold; position: relative; z-index: 2;">🥇 CHUNG KẾT</div>`; colEl.appendChild(fLabel);
                colEl.appendChild(createMatchBox(currentFullBracketData.final, 'final', 0, currentLeagueView));
            }
            if (currentFullBracketData.third_place && (currentFullBracketData.sfl || currentFullBracketData.sfr)) { 
                let tLabel = document.createElement('div'); tLabel.innerHTML = `<div style="font-size:13px; color:#cd7f32; margin-top:15px; margin-bottom:5px; font-weight:bold; position: relative; z-index: 2;">🥉 TRANH HẠNG 3</div>`; colEl.appendChild(tLabel);
                colEl.appendChild(createMatchBox(currentFullBracketData.third_place, 'third_place', 0, currentLeagueView));
            }
            if (currentLeagueView === 'c1' && currentFullBracketData.promotion_playoff && currentC2Data) {
                let poLabel = document.createElement('div'); poLabel.innerHTML = `<div style="font-size:13px; color:#00e676; margin-top:15px; margin-bottom:5px; font-weight:900; position: relative; z-index: 2;">⚔️ PLAY-OFF THĂNG HẠNG</div>`; colEl.appendChild(poLabel);
                colEl.appendChild(createMatchBox(currentFullBracketData.promotion_playoff, 'promotion_playoff', 0, currentLeagueView));
            }
        } else {
            const data = currentFullBracketData[col.key];
            if (Array.isArray(data)) { data.forEach((m, index) => { colEl.appendChild(createMatchBox(m, col.key, index, currentLeagueView)); }); } 
            else if (data) { colEl.appendChild(createMatchBox(data, col.key, 0, currentLeagueView)); }
        }
        container.appendChild(colEl);
    });
}

function createMatchBox(m, stageKey, matchIndex, league) {
    if (!m) return document.createElement('div'); 
    const isFinished = !!m.winner; let p1Name = m.p1 || '---'; let p2Name = m.p2 || '---';
    let p1Class = ''; let p2Class = ''; let p1Star = ''; let p2Star = '';
    let s1Text = (m.p1_set !== undefined) ? `<span style="background:#ff1744; color:#fff; padding:2px 8px; border-radius:4px; font-family:monospace; font-weight:900; font-size:14px; box-shadow: 0 0 8px #ff1744; animation: pulse 1.5s infinite; position: relative; z-index: 3;">${m.p1_set}</span>` : '';
    let s2Text = (m.p2_set !== undefined) ? `<span style="background:#ff1744; color:#fff; padding:2px 8px; border-radius:4px; font-family:monospace; font-weight:900; font-size:14px; box-shadow: 0 0 8px #ff1744; animation: pulse 1.5s infinite; position: relative; z-index: 3;">${m.p2_set}</span>` : '';
    if (isFinished) { if (m.winner === m.p1) { p1Class = 'won'; p2Class = 'lost'; p1Star = ' ⭐'; }  else if (m.winner === m.p2) { p2Class = 'won'; p1Class = 'lost'; p2Star = ' ⭐'; } }

    let timeInfo = ''; let btnAction = ''; let validMatch = m.p1 && m.p2 && m.p1 !== "---" && m.p2 !== "---" && !isFinished;
    if(validMatch) {
        let now = Date.now();
        if(m.schedule) {
            let diff = m.schedule - now;
            if(diff > 0) {
                let d = new Date(m.schedule);
                timeInfo = `<div class="match-time" style="position: relative; z-index: 2;">🕒 Lịch: ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth()+1}</div>`;
            } else if (diff <= 0 && diff > -600000) { 
                let minsLeft = Math.floor((600000 + diff)/60000) + 1;
                timeInfo = `<div class="match-time" style="color:#00e676; font-weight:bold; animation: pulse 1s infinite; position: relative; z-index: 2;">🟢 ĐANG MỞ (Còn ${minsLeft}p)</div>`;
                let isP1 = userData.displayName === m.p1; let isP2 = userData.displayName === m.p2;
                if(isP1 && !m.p1_ready) btnAction = `<button class="btn-join" style="display:block; position: relative; z-index: 2;" onclick="showAntiCheatModal('${league}', '${stageKey}', ${matchIndex}, 'p1')">🚪 VÀO PHÒNG (P1)</button>`;
                if(isP2 && !m.p2_ready) btnAction = `<button class="btn-join" style="display:block; position: relative; z-index: 2;" onclick="showAntiCheatModal('${league}', '${stageKey}', ${matchIndex}, 'p2')">🚪 VÀO PHÒNG (P2)</button>`;
                if(m.p1_ready && m.p2_ready) timeInfo = `<div class="match-time" style="color:#00e676; font-weight:bold; animation: pulse 1s infinite; position: relative; z-index: 2;">✅ SẴN SÀNG - CHỜ LỆNH BẮT ĐẦU</div>`;
            } else { timeInfo = `<div class="match-time" style="color:#ff5252; position: relative; z-index: 2;">⏳ Đang cập nhật...</div>`; }
        }
        if (userData.role === 'teacher') {
            let safeP1 = (m.p1 || '').replace(/'/g, "\\'"); let safeP2 = (m.p2 || '').replace(/'/g, "\\'");
            btnAction += `<button class="btn-schedule" style="display:block; position: relative; z-index: 2;" onclick="openScheduleModal('${league}', '${stageKey}', ${matchIndex})">⏰ LÊN LỊCH</button>`;
            btnAction += `<button class="btn-fight" style="display:block; position: relative; z-index: 2;" onclick="adminStartPvP('${league}', '${stageKey}', ${matchIndex}, '${safeP1}', '${safeP2}')">⚔️ BẮT ĐẦU NGAY</button>`;
        }
    }

    let p1Badge = m.p1_ready && !isFinished ? `<span style="color:#00e676; font-size:12px; margin-left:4px; position: relative; z-index: 2;">✅</span>` : '';
    let p2Badge = m.p2_ready && !isFinished ? `<span style="color:#00e676; font-size:12px; margin-left:4px; position: relative; z-index: 2;">✅</span>` : '';
    const matchEl = document.createElement('div'); matchEl.className = 'bracket-match';
    let vsPill = `<div class="vs-text" style="margin: 0; padding: 2px 8px; position: relative; z-index: 2;">VS</div>`;
    matchEl.innerHTML = `<div class="player-name ${p1Class}" style="text-align: center; border-bottom: none; padding-bottom: 2px; position: relative; z-index: 2;"><span>${p1Name}${p1Star}</span> ${p1Badge}</div><div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin: 4px 0; position: relative; z-index: 2;">${s1Text}${vsPill}${s2Text}</div><div class="player-name ${p2Class}" style="text-align: center; border-bottom: 1px dashed rgba(255,255,255,0.2); padding-top: 2px; padding-bottom: 8px; position: relative; z-index: 2;"><span>${p2Name}${p2Star}</span> ${p2Badge}</div>${timeInfo}${btnAction}`;
    return matchEl;
}

// BỎ HÀM TẠO HTML NGỰ THƯ PHÒNG (VỊ TRÍ MỚI)
function generateCode() {
    try {
        const raw = document.getElementById('rawInput').value.trim();
        if (!raw) return alert("Yêu cầu nhập nội dung từ khóa!");
        const lines = raw.split('\n'); let vocabArray = [];
        for (let i = 0; i < lines.length; i++) {
            let parts = lines[i].split('|').map(s => s.trim());
            if (parts.length >= 2) { vocabArray.push({ en: parts[0], vi: parts[1], pro: parts[2] || '', type: parts[3] || '' }); }
        }
        if (vocabArray.length === 0) return alert("Định dạng không hợp lệ!");
        const jsonVocabStr = JSON.stringify(vocabArray);

        const template = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"><\/script>
    <style>
        body { background-color: transparent; margin: 0; padding: 10px; font-family: 'Segoe UI', sans-serif; }
        .perspective { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .flipped .transform-style-3d { transform: rotateY(180deg); }
        .quiz-btn { width: 100%; padding: 15px; margin-bottom: 10px; border-radius: 12px; border: 2px solid #e0e7ff; background: white; font-weight: bold; color: #3730a3; transition: 0.2s; text-align: left; cursor: pointer; }
        .quiz-btn:hover { border-color: #4f46e5; background: #e0e7ff; }
        .quiz-btn.correct { background: #10b981; color: white; border-color: #059669; }
        .quiz-btn.wrong { background: #ef4444; color: white; border-color: #b91c1c; }
        .disabled { pointer-events: none; }
        .spell-char { width: 38px; height: 48px; text-align: center; font-size: 20px; font-weight: 900; border-radius: 8px; border: 2px solid #9333ea; outline: none; text-transform: uppercase; background: white; }
    </style>
</head>
<body>
    <div id="flashcard-section" class="flex flex-col items-center w-full max-w-md mx-auto">
        <div class="text-center mb-4 text-indigo-800 font-bold" id="card-counter"></div>
        <div id="flashcard" class="perspective w-full h-80 cursor-pointer mb-6" onclick="this.classList.toggle('flipped')">
            <div class="transform-style-3d relative w-full h-full rounded-2xl shadow-lg">
                <div class="backface-hidden absolute w-full h-full bg-white rounded-2xl flex flex-col items-center justify-center p-6 border-2 border-indigo-100">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                        <div class="text-5xl font-extrabold text-indigo-900 mb-2" id="word-en"></div>
                        <button onclick="speakWord(document.getElementById('word-en').innerText); event.stopPropagation();" style="background:none; border:none; font-size: 28px; cursor: pointer;">🔊</button>
                    </div>
                    <div class="text-lg text-gray-500 mb-4 font-mono" id="word-pro"></div>
                    <span class="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold uppercase" id="word-type"></span>
                </div>
                <div class="backface-hidden rotate-y-180 absolute w-full h-full bg-gradient-to-br from-indigo-600 to-blue-800 rounded-2xl flex flex-col items-center justify-center p-6 text-white text-center">
                    <div class="text-3xl font-bold text-yellow-300" id="word-vi"></div>
                </div>
            </div>
        </div>
        <div class="flex gap-4 w-full">
            <button onclick="prevCard()" class="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold">⬅ Trước</button>
            <button onclick="nextCard()" id="next-btn" class="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold">Tiếp ➡</button>
        </div>
    </div>

    <div id="summary-section" class="hidden w-full max-w-md mx-auto relative">
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 class="text-xl font-bold text-indigo-800 mb-4 text-center border-b pb-3">📄 Tổng hợp bài học</h2>
            <div id="summary-list" class="max-h-96 overflow-y-auto space-y-2"></div>
        </div>
        <button onclick="startQuiz()" class="w-full py-3 rounded-xl bg-yellow-500 text-white font-bold mb-3 shadow-md">Làm Trắc Nghiệm 🪙</button>
        <button onclick="startSpelling()" class="w-full py-3 rounded-xl bg-purple-600 text-white font-bold shadow-md">Gõ Chính Tả ✍️</button>
    </div>

    <div id="quiz-section" class="hidden w-full max-w-md mx-auto">
        <div class="text-center mb-6">
            <div style="position: relative; width: 70px; height: 70px; margin: 0 auto 10px auto;">
                <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"></circle>
                    <circle id="quiz-circle" cx="50" cy="50" r="45" fill="none" stroke="#ef4444" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear;"></circle>
                </svg>
                <div id="timer-text" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: #ef4444;">15</div>
            </div>
            <div style="display: flex; justify-content: center; align-items: center; gap: 10px;">
                <h2 id="quiz-question" class="text-4xl font-extrabold text-indigo-900"></h2>
                <button onclick="speakWord(document.getElementById('quiz-question').innerText);">🔊</button>
            </div>
        </div>
        
        <div style="display: flex; justify-content: center; margin-bottom: 15px;">
            <button id="btn-use-glass" onclick="requestGlass()" style="padding: 6px 16px; border-radius: 20px; background: #e0f2fe; color: #0284c7; font-weight: bold; border: 1px solid #bae6fd; cursor: pointer; transition: 0.2s; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">🔍 Dùng Kính Lúp</button>
        </div>

        <div id="quiz-options" class="w-full"></div>
    </div>

    <div id="spelling-section" class="hidden w-full max-w-md mx-auto">
        <div class="text-center mb-6">
            <div style="position: relative; width: 70px; height: 70px; margin: 0 auto 10px auto;">
                <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"></circle>
                    <circle id="spell-circle" cx="50" cy="50" r="45" fill="none" stroke="#9333ea" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear;"></circle>
                </svg>
                <div id="spell-timer-text" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: #9333ea;">30</div>
            </div>
            <h2 id="spell-question" class="text-3xl font-extrabold text-indigo-900 mt-2 mb-1"></h2>
        </div>
        <div id="spell-inputs" class="flex flex-wrap justify-center gap-2 mb-6 relative min-h-[60px]"></div>
        <button onclick="submitSpelling()" id="spell-submit-btn" class="w-full py-3 rounded-xl bg-purple-600 text-white font-bold">Chốt Đáp Án (Enter)</button>
    </div>

    <script>
        function speakWord(t) {
            if ('speechSynthesis' in window) {
                let e = new SpeechSynthesisUtterance(t);
                e.lang = /[\\u4E00-\\u9FA5]/.test(t) ? 'zh-CN' : 'en-US';
                window.speechSynthesis.speak(e);
            }
        }

        const vocabList = ${jsonVocabStr};
        let currentIndex = 0; let quizOrder = []; let timerId = null; let timeLeft = 0;

        window.addEventListener('message', function(e) {
            if (e.data === 'APPROVE_GLASS') {
                let btns = Array.from(document.getElementsByClassName('quiz-btn'));
                let currentItem = vocabList[quizOrder[currentIndex]];
                let wrongBtns = btns.filter(b => b.innerText !== currentItem.vi && b.style.opacity !== '0');
                
                wrongBtns.sort(() => Math.random() - 0.5); 
                if(wrongBtns.length > 0) { wrongBtns[0].style.opacity = '0'; wrongBtns[0].style.pointerEvents = 'none'; }
                if(wrongBtns.length > 1) { wrongBtns[1].style.opacity = '0'; wrongBtns[1].style.pointerEvents = 'none'; }
                
                document.getElementById('btn-use-glass').style.display = 'none'; 
            }
        });

        function requestGlass() {
            if(window.parent) window.parent.postMessage('REQ_GLASS', '*');
        }

        function loadCard(idx) {
            document.getElementById('flashcard').classList.remove('flipped');
            const item = vocabList[idx];
            document.getElementById('word-en').innerText = item.en;
            document.getElementById('word-pro').innerText = item.pro;
            document.getElementById('word-type').innerText = item.type;
            document.getElementById('word-vi').innerText = item.vi;
            document.getElementById('card-counter').innerText = 'Thẻ ' + (idx + 1) + ' / ' + vocabList.length;
            document.getElementById('next-btn').innerText = idx === vocabList.length - 1 ? "Xem Tổng Hợp 📄" : "Tiếp ➡";
        }

        function prevCard() { if (currentIndex > 0) { currentIndex--; loadCard(currentIndex); } }
        function nextCard() { 
            if (currentIndex < vocabList.length - 1) { currentIndex++; loadCard(currentIndex); } 
            else { 
                document.getElementById('flashcard-section').classList.add('hidden');
                document.getElementById('summary-section').classList.remove('hidden');
                const list = document.getElementById('summary-list');
                let html = '';
                for(let i=0; i<vocabList.length; i++) {
                    html += '<div class="p-2 border-b flex justify-between items-center"><div><b>'+vocabList[i].en+'</b><br><span class="text-sm text-gray-600">'+vocabList[i].vi+'</span></div><button onclick="speakWord(\\''+vocabList[i].en+'\\')">🔊</button></div>';
                }
                list.innerHTML = html;
            }
        }

        function startQuiz() {
            document.getElementById('summary-section').classList.add('hidden');
            document.getElementById('quiz-section').classList.remove('hidden');
            quizOrder = []; for (let i = 0; i < vocabList.length; i++) quizOrder.push(i);
            quizOrder.sort(function() { return Math.random() - 0.5; });
            currentIndex = 0; loadQuiz();
        }

        function loadQuiz() {
            document.getElementById('btn-use-glass').style.display = 'inline-block';
            const item = vocabList[quizOrder[currentIndex]];
            document.getElementById('quiz-question').innerText = item.en;
            let wrongOptions = [];
            for(let i = 0; i < vocabList.length; i++) {
                if(vocabList[i].vi !== item.vi) wrongOptions.push(vocabList[i].vi);
            }
            wrongOptions.sort(function() { return Math.random() - 0.5; });
            wrongOptions = wrongOptions.slice(0, 3);
            let options = [item.vi].concat(wrongOptions);
            options.sort(function() { return Math.random() - 0.5; });
            const container = document.getElementById('quiz-options');
            container.innerHTML = '';
            container.classList.remove('disabled');
            for(let i = 0; i < options.length; i++) {
                let opt = options[i]; let btn = document.createElement('button'); btn.className = 'quiz-btn'; btn.innerText = opt;
                btn.onclick = function() {
                    clearInterval(timerId); container.classList.add('disabled'); document.getElementById('btn-use-glass').style.display = 'none'; 
                    if (opt === item.vi) { 
                        btn.classList.add('correct'); 
                        if(window.parent) window.parent.postMessage('CORRECT', '*'); 
                    } else { 
                        btn.classList.add('wrong'); 
                        if(window.parent) window.parent.postMessage(JSON.stringify({status: 'WRONG', en: item.en, vi: item.vi}), '*'); 
                        let allBtns = document.getElementsByClassName('quiz-btn');
                        for(let j=0; j<allBtns.length; j++) { if(allBtns[j].innerText === item.vi) allBtns[j].classList.add('correct'); }
                    }
                    setTimeout(function() { 
                        currentIndex++; 
                        if (currentIndex < vocabList.length) loadQuiz(); 
                        else finish("quiz-section", "Hoàn thành Trắc nghiệm!"); 
                    }, 1500);
                };
                container.appendChild(btn);
            }
            startTimer(15, 'timer-text', 'quiz-circle', function() {
                if(window.parent) window.parent.postMessage(JSON.stringify({status: 'WRONG', en: item.en, vi: item.vi}), '*');
                let btns = document.getElementsByClassName('quiz-btn');
                if(btns.length > 0) {
                    container.classList.add('disabled'); document.getElementById('btn-use-glass').style.display = 'none'; btns[0].classList.add('wrong');
                    for(let j=0; j<btns.length; j++) { if(btns[j].innerText === item.vi) btns[j].classList.add('correct'); }
                    setTimeout(function() { 
                        currentIndex++; 
                        if (currentIndex < vocabList.length) loadQuiz(); 
                        else finish("quiz-section", "Hoàn thành Trắc nghiệm!"); 
                    }, 1500);
                }
            });
        }

        function startSpelling() {
            document.getElementById('summary-section').classList.add('hidden');
            document.getElementById('spelling-section').classList.remove('hidden');
            quizOrder = []; for (let i = 0; i < vocabList.length; i++) quizOrder.push(i);
            quizOrder.sort(function() { return Math.random() - 0.5; });
            currentIndex = 0; loadSpelling();
        }

        function loadSpelling() {
            const item = vocabList[quizOrder[currentIndex]];
            document.getElementById('spell-question').innerText = item.vi;
            const container = document.getElementById('spell-inputs');
            container.innerHTML = '';
            const words = item.en.trim().split(' ');
            for(let i=0; i<words.length; i++) {
                let word = words[i]; let div = document.createElement('div'); div.className = 'flex gap-1 mb-2';
                let chars = word.split('');
                for(let j=0; j<chars.length; j++) {
                    let char = chars[j]; let input = document.createElement('input'); input.className = 'spell-char'; input.dataset.char = char.toUpperCase();
                    if (char === '-' || char === '/') { 
                        input.value = char; input.disabled = true; input.style.background = '#eee'; 
                    }
                    div.appendChild(input);
                }
                container.appendChild(div);
            }
            let hidden = document.createElement('input'); hidden.style.position = 'absolute'; hidden.style.opacity = '0'; hidden.style.top = '0'; hidden.style.left = '0'; hidden.style.width = '100%'; hidden.style.height = '100%'; hidden.style.zIndex = '10'; hidden.id = 'h-inp'; container.appendChild(hidden); hidden.focus();
            let inputs = document.querySelectorAll('.spell-char');
            hidden.oninput = function(e) {
                let val = e.target.value.toUpperCase().replace(/[ \\-\\/]/g, ''); let charIdx = 0;
                for(let k=0; k<inputs.length; k++) {
                    if(!inputs[k].disabled) { inputs[k].value = val[charIdx] || ''; charIdx++; }
                }
            };
            hidden.onkeydown = function(e) { if(e.key === 'Enter') submitSpelling(); };
            startTimer(30, 'spell-timer-text', 'spell-circle', submitSpelling);
        }

        function submitSpelling() {
            clearInterval(timerId); let inputs = document.querySelectorAll('.spell-char'); let userVal = "";
            for(let i=0; i<inputs.length; i++) { userVal += inputs[i].value || ""; }
            userVal = userVal.toUpperCase().replace(/\\s/g, '');
            
            let currentItem = vocabList[quizOrder[currentIndex]];
            let correctVal = currentItem.en.toUpperCase().replace(/\\s/g, '');
            
            function formatWords(str) { let arr = str.split('/'); let res = []; for(let i=0; i<arr.length; i++) res.push(arr[i].trim()); res.sort(); return res.join('/'); }

            if (formatWords(userVal) === formatWords(correctVal)) {
                for(let i=0; i<inputs.length; i++) inputs[i].style.background = '#d1fae5';
                if(window.parent) window.parent.postMessage('SPELLING_CORRECT', '*');
            } else {
                if(window.parent) window.parent.postMessage(JSON.stringify({status: 'WRONG', en: currentItem.en, vi: currentItem.vi}), '*');
                for(let i=0; i<inputs.length; i++) {
                    inputs[i].style.background = '#fee2e2'; inputs[i].value = inputs[i].dataset.char;
                }
            }
            setTimeout(function() { 
                currentIndex++; 
                if (currentIndex < vocabList.length) loadSpelling(); 
                else finish("spelling-section", "Hoàn thành Gõ chính tả!"); 
            }, 2000);
        }

        function startTimer(sec, textId, circleId, cb) {
            timeLeft = sec; const total = sec;
            document.getElementById(textId).innerText = timeLeft; document.getElementById(circleId).style.strokeDashoffset = '0';
            clearInterval(timerId);
            timerId = setInterval(function() {
                timeLeft--; document.getElementById(textId).innerText = timeLeft;
                const offset = 283 - (timeLeft / total) * 283; document.getElementById(circleId).style.strokeDashoffset = offset;
                if (timeLeft <= 0) { clearInterval(timerId); cb(); }
            }, 1000);
        }

        function finish(id, msg) { document.getElementById(id).innerHTML = '<div class="text-center p-10 bg-green-50 text-green-800 font-bold rounded-xl text-xl">🎉 '+msg+'</div>'; }

        window.onload = function() { loadCard(0); };
    <\/script>
</body>
</html>`;

        document.getElementById('generatedCode').value = template; currentGeneratedVocab = vocabArray;
        alert("Đúc mã thành công! Nút Kính Lúp và Đặc quyền đã được khảm vào hệ thống.");
    } catch (e) { alert("Lỗi nghiêm trọng khi đúc mã: " + e.message); }
}

// BỎ HÀM CỔ MÁY THỜI GIAN VÀO ĐÚNG CHỖ CỦA NÓ
function openTimeMachineModal() {
    let bank = userData.timeMachine.currentBank; let vocabArray = bank.map(v => `{ en: "${v.en.replace(/"/g, '\\"')}", vi: "${v.vi.replace(/"/g, '\\"')}", pro: "${(v.pro||'').replace(/"/g, '\\"')}", type: "${(v.type||'').replace(/"/g, '\\"')}" }`); let currentDay = (userData.timeMachine.daysRecovered || 0) + 1; let totalDays = userData.timeMachine.missedDays;
    let tmTemplate = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"><\/script><style>body { background-color: #f3e5f5; margin: 0; padding: 10px; font-family: 'Segoe UI', sans-serif; } .perspective { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .flipped .transform-style-3d { transform: rotateY(180deg); } .quiz-btn { width: 100%; padding: 15px; margin-bottom: 10px; border-radius: 12px; border: 2px solid #e0e7ff; background: white; font-weight: bold; color: #3730a3; transition: 0.2s; text-align: left; font-size: 16px; cursor: pointer;} .quiz-btn:hover { border-color: #4f46e5; background: #e0e7ff; } .quiz-btn.correct { background: #10b981; color: white; border-color: #059669; } .quiz-btn.wrong { background: #ef4444; color: white; border-color: #b91c1c; } .disabled { pointer-events: none; }</style></head><body><div id="flashcard-section" class="flex flex-col items-center w-full max-w-md mx-auto"><div class="text-center mb-4 text-purple-800 font-bold text-xl">⏳ KHỔ HÌNH: NGÀY ${currentDay}/${totalDays} ⏳</div><div class="text-center mb-4 text-purple-600 font-bold" id="card-counter">Thẻ 1 / ${vocabArray.length}</div><div id="flashcard" class="perspective w-full h-80 cursor-pointer mb-6" onclick="flipCard()"><div class="transform-style-3d relative w-full h-full rounded-2xl shadow-lg"><div id="card-front" class="backface-hidden absolute w-full h-full bg-white rounded-2xl flex flex-col items-center justify-center p-6 border-4 border-purple-300"><div id="word-en" class="text-5xl font-extrabold text-purple-900 mb-2">Word</div><div id="word-pro" class="text-lg text-gray-500 mb-4 font-mono">/pronunciation/</div><span id="word-type" class="px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold uppercase">Type</span></div><div id="card-back" class="backface-hidden rotate-y-180 absolute w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex flex-col items-center justify-center p-6 text-white text-center"><div id="word-vi" class="text-3xl font-bold text-yellow-300">Nghĩa</div></div></div></div><div class="flex gap-4 w-full"><button onclick="prevCard()" class="flex-1 py-3 rounded-xl bg-gray-300 text-gray-700 font-bold hover:bg-gray-400">⬅ Trước</button><button onclick="nextCard()" id="next-btn" class="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700">Tiếp ➡</button></div></div><div id="quiz-section" class="hidden w-full max-w-md mx-auto relative"><div class="text-center mb-4"><span class="inline-block px-4 py-1 bg-red-100 text-red-800 font-bold rounded-full text-sm mb-2">Sinh Tử Gõ Chính Tả: ${currentDay}/${totalDays} ⏳</span><div style="position: relative; width: 70px; height: 70px; margin: 0 auto 10px auto;"><svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"></circle><circle id="spell-timer-circle" cx="50" cy="50" r="45" fill="none" stroke="#dc2626" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear;"></circle></svg><div id="spell-timer-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: #dc2626;">25</div></div><h2 id="spell-question" class="text-3xl font-extrabold text-purple-900 mt-2 mb-1">Nghĩa Tiếng Việt</h2><div class="text-xs text-gray-500 mb-4">(Mẹo: Có thể đảo thứ tự từ, gõ từ có dấu trước)</div></div><div id="spell-inputs" class="flex flex-wrap justify-center gap-2 mb-6 w-full"></div><button onclick="submitSpelling()" id="spell-submit-btn" class="w-full py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 text-lg shadow-md transition">Chốt Đáp Án (Enter)</button></div><script>const vocabList = [${vocabArray.join(',\n')}]; let currentIndex = 0; const flashcardEl = document.getElementById('flashcard'); function loadCard(index) { flashcardEl.classList.remove('flipped'); setTimeout(() => { document.getElementById('word-en').innerText = vocabList[index].en; document.getElementById('word-pro').innerText = vocabList[index].pro; document.getElementById('word-type').innerText = vocabList[index].type; document.getElementById('word-vi').innerText = vocabList[index].vi; document.getElementById('card-counter').innerText = 'Thẻ ' + (index + 1) + ' / ' + vocabList.length; const nextBtn = document.getElementById('next-btn'); if (index === vocabList.length - 1) { nextBtn.innerText = "BẮT ĐẦU THI"; nextBtn.className = "flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"; } else { nextBtn.innerText = "Tiếp ➡"; nextBtn.className = "flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700"; } }, 150); } function flipCard() { flashcardEl.classList.toggle('flipped'); } function prevCard() { if (currentIndex > 0) { currentIndex--; loadCard(currentIndex); } } function nextCard() { if (currentIndex < vocabList.length - 1) { currentIndex++; loadCard(currentIndex); } else { startSpelling(); } } let currentQuizIndex = 0; let quizOrder = []; let spellTimerId; let spellTimeLeft = 25; let correctAnswersCount = 0; function startSpelling() { document.getElementById('flashcard-section').classList.add('hidden'); document.getElementById('quiz-section').classList.remove('hidden'); quizOrder = [...Array(vocabList.length).keys()].sort(() => Math.random() - 0.5); currentQuizIndex = 0; loadSpellingQuestion(); } function loadSpellingQuestion() { const correctWord = vocabList[quizOrder[currentQuizIndex]]; document.getElementById('spell-question').innerText = correctWord.vi; document.getElementById('spell-submit-btn').classList.remove('hidden'); const container = document.getElementById('spell-inputs'); container.innerHTML = ''; container.style.position = 'relative'; let words = correctWord.en.trim().split(' '); words.forEach((w) => { let wordDiv = document.createElement('div'); wordDiv.className = 'flex flex-wrap justify-center gap-1 sm:gap-2 mb-3 w-full pointer-events-none relative z-0'; w.split('').forEach((char) => { let inp = document.createElement('input'); inp.className = 'spell-char w-8 sm:w-10 h-11 sm:h-12 text-center text-lg sm:text-xl font-bold rounded-lg border-2 border-red-300 uppercase bg-white shadow-sm shrink-0'; inp.dataset.char = char.toUpperCase(); inp.readOnly = true; inp.tabIndex = -1; if(char === '-' || char === '/') { inp.value = char; inp.disabled = true; inp.classList.add('bg-gray-200'); } wordDiv.appendChild(inp); }); container.appendChild(wordDiv); }); let hiddenInp = document.createElement('input'); hiddenInp.type = 'text'; hiddenInp.id = 'hidden-spell-input'; hiddenInp.setAttribute('autocomplete', 'off'); hiddenInp.setAttribute('autocorrect', 'off'); hiddenInp.setAttribute('spellcheck', 'false'); hiddenInp.className = 'absolute top-0 left-0 w-full h-full opacity-0 z-10 cursor-text'; container.appendChild(hiddenInp); let allInputs = Array.from(document.querySelectorAll('.spell-char')); hiddenInp.oninput = function() { let val = this.value.toUpperCase().replace(/[\\\\s\\\\-\\\\/]/g, ''); let vIdx = 0; allInputs.forEach(box => { if(!box.disabled) { box.value = val[vIdx] || ''; if(val[vIdx]) box.classList.replace('border-red-300', 'border-red-600'); else box.classList.replace('border-red-600', 'border-red-300'); vIdx++; } }); }; hiddenInp.onkeydown = function(e) { if(e.key === 'Enter') submitSpelling(); }; setTimeout(() => hiddenInp.focus(), 300); spellTimeLeft = 25; document.getElementById('spell-timer-circle').style.strokeDashoffset = '0'; document.getElementById('spell-timer-text').innerText = spellTimeLeft; clearInterval(spellTimerId); spellTimerId = setInterval(() => { spellTimeLeft--; const offset = 283 - (spellTimeLeft / 25) * 283; document.getElementById('spell-timer-circle').style.strokeDashoffset = offset; document.getElementById('spell-timer-text').innerText = spellTimeLeft; if(spellTimeLeft <= 0) { checkSpellingAnswer(true); } }, 1000); } function submitSpelling() { checkSpellingAnswer(false); } function checkSpellingAnswer(isTimeOut) { clearInterval(spellTimerId); document.getElementById('spell-submit-btn').classList.add('hidden'); let allInputs = Array.from(document.querySelectorAll('.spell-char')); allInputs.forEach(i => i.disabled = true); let hiddenInp = document.getElementById('hidden-spell-input'); if(hiddenInp) hiddenInp.disabled = true; let finalStr = allInputs.map(box => box.value || '').join('').toUpperCase(); let correctStr = vocabList[quizOrder[currentQuizIndex]].en.toUpperCase().trim(); let compareUser = finalStr.split('/').map(s => s.replace(/[\\\\s\\\\-]/g, '').trim()).sort().join('/'); let compareCorrect = correctStr.split('/').map(s => s.replace(/[\\\\s\\\\-]/g, '').trim()).sort().join('/'); const isCorrect = (compareUser === compareCorrect) && !isTimeOut; if (isCorrect) { allInputs.forEach(i => { i.style.backgroundColor = '#d1fae5'; i.style.borderColor = '#10b981'; i.style.color = '#065f46'; }); if(window.parent) window.parent.postMessage('SPELLING_CORRECT', '*'); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadSpellingQuestion(); else finishSpelling(); }, 1200); } else { allInputs.forEach(inp => { inp.style.backgroundColor = '#fee2e2'; inp.style.borderColor = '#ef4444'; inp.style.color = '#991b1b'; inp.value = inp.dataset.char; }); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadSpellingQuestion(); else finishSpelling(); }, 2000); } } function finishSpelling() { clearInterval(spellTimerId); document.getElementById('spell-timer-text').parentElement.style.display = 'none'; let ratio = correctAnswersCount / vocabList.length; let container = document.getElementById('spell-inputs'); document.getElementById('spell-question').style.display = 'none'; if (ratio >= 0.8) { if (${currentDay} < ${totalDays}) { container.innerHTML = '<div class="text-center p-6 bg-green-100 text-green-900 rounded-xl font-bold text-xl mb-4 w-full">✅ Đã vượt qua Nhịp ' + ${currentDay} + ' (' + correctAnswersCount + '/' + vocabList.length + ')</div><button onclick="window.parent.postMessage(\\'TM_NEXT_DAY\\', \\'*\\')" class="w-full py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700">Chuyển sang ngày tiếp theo ➡</button>'; } else { container.innerHTML = '<div class="text-center p-6 bg-yellow-100 text-yellow-900 rounded-xl font-bold text-xl mb-4 w-full">🎉 XUYÊN KHÔNG THÀNH CÔNG! (' + correctAnswersCount + '/' + vocabList.length + ')</div><button onclick="window.parent.postMessage(\\'TM_RESULT_PASS\\', \\'*\\')" class="w-full py-3 rounded-xl bg-yellow-600 text-white font-bold hover:bg-yellow-700">Nhận Lại Chuỗi Của Bạn</button>'; } } else { container.innerHTML = '<div class="text-center p-6 bg-red-100 text-red-900 rounded-xl font-bold text-xl mb-4 w-full">❌ THẤT BẠI! Bạn chỉ đạt ' + correctAnswersCount + '/' + vocabList.length + '. Yêu cầu >= 80%.</div><button onclick="window.parent.postMessage(\\'TM_RESULT_FAIL\\', \\'*\\')" class="w-full py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700">Chấp nhận hình phạt</button>'; } } loadCard(0); <\/script></body></html>`;
    document.getElementById('modalFrame').srcdoc = tmTemplate; document.getElementById('previewModal').classList.add('active');
}

window.addEventListener('message', function(e) {
    let isWrong = false; let vocabContext = null;
    if (typeof e.data === 'string' && e.data.startsWith('{')) {
        try { let parsed = JSON.parse(e.data); if (parsed.status === 'WRONG') { isWrong = true; vocabContext = { en: parsed.en, vi: parsed.vi }; } } catch(err) {}
    } else if (e.data === 'WRONG' || e.data === 'INCORRECT') { isWrong = true; }

    if (isWrong) {
        if (window.currentLessonContext) window.currentLessonWrongCount = (window.currentLessonWrongCount || 0) + 1;
        if (currentUser && userData && userData.selectedMentor) {
            if (userData.selectedMentor === 'roshi') {
                userData.gold = Math.max(0, (userData.gold || 0) - 2); 
                let anim = document.getElementById('rewardAnim'); anim.innerText = `💢 Quy Lão phạt: -2 🪙`; anim.style.color = "#ff1744"; anim.classList.add('show');
                setTimeout(() => { anim.classList.remove('show'); anim.style.color = ""; }, 2000);
                syncStatsToCloud(); 
            }
            if (typeof showMentorDialogue === 'function') showMentorDialogue('wrong', vocabContext);
        }
    } else if (e.data === 'CORRECT' || e.data === 'SPELLING_CORRECT') { 
        if (window.currentLessonContext) window.currentLessonCorrectCount = (window.currentLessonCorrectCount || 0) + 1;
        if (currentUser && userData) { 
            let potionMult = (userData.potionX3Expiry && userData.potionX3Expiry > Date.now()) ? 3 : ((userData.potionExpiry && userData.potionExpiry > Date.now()) ? 2 : 1);
            let today = new Date().getDay(); let weekendMult = (today === 0 || today === 6) ? 3 : 1; let finalMultiplier = potionMult * weekendMult;
            let baseXP = (e.data === 'SPELLING_CORRECT') ? 25 : 15; let baseGold = (e.data === 'SPELLING_CORRECT') ? 25 : 10;
            
            let mentorNote = ""; 
            if (userData.selectedMentor === 'dekisugi') { baseXP += 10; mentorNote = " (🧑‍🎓+10XP)"; }
            if (userData.selectedMentor === 'roshi') { baseGold += 5; mentorNote = " (🐢+5🪙)"; }

            let xpGained = baseXP * finalMultiplier; let goldGained = baseGold * finalMultiplier; 
            userData.xp = (userData.xp || 0) + xpGained; userData.gold = (userData.gold || 0) + goldGained; userData.weeklyXp = (userData.weeklyXp || 0) + xpGained;
            
            let oldHighest = userData.highestWeeklyXp || 0; let isRecordBroken = false;
            if (oldHighest > 0 && userData.weeklyXp > oldHighest) { userData.highestWeeklyXp = userData.weeklyXp; if (!userData.hasBrokenRecordThisWeek) { userData.hasBrokenRecordThisWeek = true; isRecordBroken = true; } } else if (oldHighest === 0 && userData.weeklyXp > 0) { userData.highestWeeklyXp = userData.weeklyXp; }
            
            let itemDropped = "";
            if (userData.selectedMentor === 'conan' && Math.random() < 0.05) { 
                userData.glass_100 = (userData.glass_100 || 0) + 1; itemDropped = " | 🕵️ 🔍+1 (100%)"; 
            }

            syncStatsToCloud(); 
            if (typeof showMentorDialogue === 'function') showMentorDialogue('correct');
            
            if (isRecordBroken) { 
                document.getElementById('recordCurrentXp').innerText = userData.weeklyXp + " XP"; document.getElementById('recordOldXp').innerText = oldHighest; document.getElementById('recordModal').classList.add('active'); triggerConfetti(); 
            } else { 
                let anim = document.getElementById('rewardAnim'); let msgPrefix = "🎉";
                if (weekendMult === 3 && potionMult > 1) msgPrefix = `🔥 SIÊU CẤP CUỐI TUẦN (x${finalMultiplier})!`;
                else if (weekendMult === 3) msgPrefix = `🌞 THÁNH ÂN CUỐI TUẦN (x3)!`;
                else if (potionMult === 3) msgPrefix = `🏺 ĐANG X3!`;
                else if (potionMult === 2) msgPrefix = `🧪 ĐANG X2!`;
                anim.innerText = `${msgPrefix} +${goldGained} 🪙 | +${xpGained} ⭐${mentorNote}${itemDropped}`; 
                anim.classList.add('show'); setTimeout(() => anim.classList.remove('show'), 2000); 
            }
        } 
    }

    if (window.currentLessonContext && window.currentLessonTotal > 0 && (e.data === 'CORRECT' || e.data === 'SPELLING_CORRECT' || isWrong)) {
        let totalAnswered = (window.currentLessonCorrectCount || 0) + (window.currentLessonWrongCount || 0);
        if (totalAnswered === window.currentLessonTotal) {
            let isPerfect = (window.currentLessonWrongCount === 0);
            if (isPerfect) {
                let isFirstTimeMaster = false;
                if (!userData.mastered_lessons) userData.mastered_lessons = [];
                if (!userData.mastered_lessons.includes(window.currentLessonContext)) {
                    userData.mastered_lessons.push(window.currentLessonContext);
                    userData.mastered_words = (userData.mastered_words || 0) + window.currentLessonTotal;
                    isFirstTimeMaster = true;
                }
                
                let masterBonus = "";
                if (userData.selectedMentor === 'conan') {
                    userData.glass_100 = (userData.glass_100 || 0) + 1;
                    let bonusXP = Math.round(window.currentLessonTotal * 2); let bonusGold = Math.round(window.currentLessonTotal * 1.5);
                    userData.xp += bonusXP; userData.weeklyXp += bonusXP; userData.gold += bonusGold;
                    masterBonus = `\n🕵️ Conan truy quét thêm được ${bonusGold}🪙, ${bonusXP}⭐ (10% Bonus) và 1 Kính Lúp (100%)!`;
                } else if (userData.selectedMentor === 'doraemon') {
                    if (Math.random() < 0.5) {
                        userData.shield_100 = (userData.shield_100 || 0) + 3; userData.hasShield = true;
                        masterBonus = "\n🐱 Doraemon tặng bạn 1 Bùa Bảo Hộ (100%)!";
                    } else {
                        userData.vouchers.push(30); masterBonus = "\n🐱 Doraemon tặng bạn Voucher Giảm 30%!";
                    }
                } else if (userData.selectedMentor === 'dekisugi') {
                    userData.gold += 50; masterBonus = "\n🧑‍🎓 Dekisugi thưởng nóng 50 Vàng vì điểm 10!";
                }

                let finalAlertMsg = `🎓 PERFECT! Bạn đã càn quét 100% bài học không sai 1 ly!`;
                if (isFirstTimeMaster) finalAlertMsg += `\nCộng ${window.currentLessonTotal} từ vào Quỹ Thành Thạo!`;
                if (masterBonus !== "") finalAlertMsg += masterBonus;

                setTimeout(() => { alert(finalAlertMsg); if (isFirstTimeMaster && typeof renderAchievements === 'function') renderAchievements(); }, 800);
                if (currentUser && db) syncStatsToCloud();
            }
            window.currentLessonCorrectCount = 0; window.currentLessonWrongCount = 0;
        }
    }
    
    else if (e.data === 'REQ_GLASS') { 
        if (userData.glass_100 > 0) { 
            userData.glass_100--; syncStatsToCloud(); document.getElementById('modalFrame').contentWindow.postMessage('APPROVE_GLASS_100', '*'); 
        } else if (userData.glass_80 > 0) {
            userData.glass_80--; syncStatsToCloud(); document.getElementById('modalFrame').contentWindow.postMessage('APPROVE_GLASS_80', '*'); 
        } else { alert("Số lượng Kính Lúp hiện tại là 0!"); } 
    }
    else if (e.data === 'TM_NEXT_DAY') { userData.timeMachine.daysRecovered++; let allVocab = []; allLessonsData.forEach(l => allVocab = allVocab.concat(l.vocab)); userData.timeMachine.currentBank = allVocab.sort(() => Math.random() - 0.5).slice(0, Math.min(30, allVocab.length)); db.collection('vocab_users').doc(currentUser.uid).update({ timeMachine: userData.timeMachine }).then(() => { openTimeMachineModal(); }); }
    else if (e.data === 'TM_RESULT_PASS') { closeModal(); let oldS = userData.streak; userData.streak = userData.timeMachine.lostStreak + userData.timeMachine.missedDays; userData.timeMachine = null; db.collection('vocab_users').doc(currentUser.uid).update({ streak: userData.streak, timeMachine: null }).then(() => { updateUI(); alert(`🎉 KỲ TÍCH! Chuỗi đã phục hồi lên mốc ${userData.streak}!`); triggerConfetti(); if(window.checkAndGrantStreakRewards) window.checkAndGrantStreakRewards(oldS, userData.streak); }); }
    else if (e.data === 'TM_RESULT_FAIL') { closeModal(); userData.timeMachine.status = 'available'; userData.timeMachine.currentBank = []; db.collection('vocab_users').doc(currentUser.uid).update({ timeMachine: userData.timeMachine }).then(() => { updateUI(); alert(`❌ THẤT BẠI! Hãy thử lại nếu còn lượt.`); }); }
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'hidden') { 
        if (isUnderSurveillance) { if (typeof executeAntiCheatPunishment === 'function') executeAntiCheatPunishment(); if (rtdb) rtdb.goOffline(); }
    } else if (document.visibilityState === 'visible') { if (rtdb) rtdb.goOnline(); }
});
window.addEventListener("blur", () => {
    if (isUnderSurveillance) { if (typeof executeAntiCheatPunishment === 'function') executeAntiCheatPunishment(); if (rtdb) rtdb.goOffline(); }
});
window.addEventListener("focus", () => { if (rtdb) rtdb.goOnline(); });

function copyCode() { document.getElementById('generatedCode').select(); document.execCommand("copy"); alert("Thông tin mã được sao chép thành công."); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); const isDark = document.body.classList.contains('dark-mode'); localStorage.setItem('darkMode', isDark ? 'true' : 'false'); document.getElementById('themeToggleBtn').innerText = isDark ? '☀️' : '🌙'; }
function toggleSidebar() { let sidebar = document.getElementById('sidebar'); let overlay = document.getElementById('sidebarOverlay'); sidebar.classList.toggle('show'); if(sidebar.classList.contains('show')) { overlay.style.display = 'block'; setTimeout(() => overlay.style.opacity = '1', 10); } else { overlay.style.opacity = '0'; setTimeout(() => overlay.style.display = 'none', 300); } }

window.addEventListener('DOMContentLoaded', () => {
    initSystem();
    if (localStorage.getItem('darkMode') === 'true') { document.body.classList.add('dark-mode'); document.getElementById('themeToggleBtn').innerText = '☀️'; }
    switchTab('library');
});

setInterval(() => { if (currentRealm && currentFullBracketData) { if (typeof renderBracket === 'function') { renderBracket(); } } }, 10000);
function publishNotice() { let text = document.getElementById('adminNoticeInput').value; if(!text) return alert("Bệ hạ chưa nhập thánh ý!"); rtdb.ref(`tournament_status/${currentRealm}/global_notice`).set(text).then(() => { alert("📢 Đã truyền loa thành công ra toàn cõi!"); document.getElementById('adminNoticeInput').value = ""; }); }
function clearNotice() { if(!confirm("Bệ hạ muốn thu hồi Thánh chỉ và tắt bảng LED?")) return; rtdb.ref(`tournament_status/${currentRealm}/global_notice`).set("").then(() => { alert("🔇 Đã tắt loa phát thanh!"); }); }

// =========================================================
// 🚑 BẢN VÁ PHỤC HỒI DỮ LIỆU THỐNG KÊ & GIA SƯ
// =========================================================

function renderAchievements() {
    const container = document.getElementById('achieveGrid');
    if (!container) return;
    const mw = userData.mastered_words || 0;
    
    const badges = [
        { id: 'a1', title: 'Tân Binh (Rookie)', target: 30, icon: '🐣', color: '#9e9e9e' },
        { id: 'a2', title: 'Nhặt Đồ (Looter)', target: 50, icon: '🎒', color: '#8d6e63' },
        { id: 'a3', title: 'Thợ Săn Từ (Hunter)', target: 100, icon: '🏹', color: '#4caf50' },
        { id: 'a4', title: 'Chuyên Gia (Pro)', target: 150, icon: '🎓', color: '#03a9f4' },
        { id: 'a5', title: 'Học Giả (Elite)', target: 300, icon: '📖', color: '#3f51b5' },
        { id: 'a6', title: 'Huyền Thoại (Legendary)', target: 500, icon: '👑', color: '#ff9800' },
        { id: 'a7', title: 'Cỗ Máy Học (Cyborg)', target: 1000, icon: '🤖', color: '#e91e63' },
        { id: 'a8', title: 'Bậc Thầy (Mastermind)', target: 2500, icon: '🧠', color: '#9c27b0' },
        { id: 'a9', title: 'Siêu Việt (Transcendent)', target: 5000, icon: '🌌', color: 'linear-gradient(45deg, #00f2fe, #4facfe)' },
        { id: 'a10', title: 'Vị Thần (God of Vocab)', target: 10000, icon: '⚡', color: 'linear-gradient(45deg, #f12711, #f5af19)' }
    ];
    
    let html = '';
    badges.forEach((b, index) => {
        let isUnlocked = mw >= b.target;
        let progress = Math.min((mw / b.target) * 100, 100);
        let classState = isUnlocked ? 'unlocked' : 'locked';
        
        let isHidden = false;
        if (index >= 6) { 
            let prevBadge = badges[index - 1];
            if (mw < prevBadge.target * 0.8) isHidden = true;
        }

        let displayTitle = isHidden ? '??? (Bí ẩn)' : b.title;
        let displayIcon = isHidden ? '🔒' : b.icon;
        let iconColor = isUnlocked ? '' : 'style="opacity: 0.4; filter: grayscale(100%);"';
        
        let titleStyle = '';
        let barBg = '#4caf50'; 
        let cardBorder = '#333';
        
        if (!isHidden) {
            if (b.color.includes('gradient')) {
                titleStyle = `background: ${b.color}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900;`;
                barBg = b.color;
                cardBorder = isUnlocked ? '#f5af19' : '#333';
            } else {
                titleStyle = `color: ${b.color}; font-weight: 800;`;
                barBg = b.color;
                cardBorder = isUnlocked ? b.color : '#333';
            }
        } else {
            titleStyle = `color: #666; font-weight: bold; font-style: italic;`;
            barBg = '#555';
        }

        html += `
            <div class="achieve-card ${classState}" style="border-color: ${cardBorder}; transition: all 0.3s ease;">
                <div class="achieve-icon" ${iconColor} style="font-size: 32px; margin-bottom: 8px;">${displayIcon}</div>
                <div class="achieve-info">
                    <div class="achieve-title" style="${titleStyle}">${displayTitle}</div>
                    <div class="achieve-desc" style="font-size: 11px; color: #aaa; margin-bottom: 6px;">
                        ${isHidden ? 'Đạt 80% mốc trước để giải mã' : 'Thành thạo ' + b.target + ' từ vựng'}
                    </div>
                    <div class="achieve-progress-bg" style="background: rgba(255,255,255,0.1); border-radius: 10px; height: 6px; overflow: hidden; margin-bottom: 4px;">
                        <div class="achieve-progress-fill" style="width: ${progress}%; background: ${barBg}; height: 100%; transition: width 1s ease-out;"></div>
                    </div>
                    <div class="achieve-progress-text" style="font-size: 11px; text-align: right; color: #ccc;">${mw}/${b.target}</div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

const mentorsData = {
    'conan': {
        icon: '🕵️',
        avatarImg: 'https://static.ybox.vn/2022/8/2/1660030852217-conan.png', 
        name: 'Thám tử Conan',
        price: 3000,
        buffDesc: "5% rớt Kính lúp mỗi câu đúng. Vượt ải 100% rớt Kính lúp & thưởng +10% Vàng/XP tổng bài.",
        login: "Cậu đến đúng lúc lắm. Hiện trường bài học hôm nay vẫn còn nguyên dấu vết. Bắt tay vào thu thập manh mối trong kho bài học thôi!",
        correct: "Sự thật luôn chỉ có một! Suy luận của cậu rất sắc bén!",
        broken: "Hung thủ giết chết điểm số chính là sự trì hoãn của cậu đấy!",
        wrong: "Sai rồi! Manh mối rõ ràng như vậy mà cậu lại bỏ sót sao? Nhìn kỹ lại đi!"
    },
    'doraemon': {
        icon: '🐱',
        avatarImg: 'https://img3.thuthuatphanmem.vn/uploads/2019/10/10/anh-doremon-vay-chao_033146925.png',
        name: 'Mèo máy Doraemon',
        price: 3000,
        buffDesc: "Giảm 15% Cửa hàng. Vượt ải 100% có 50% tỉ lệ rơi Bùa Bảo Hộ hoặc Voucher 30%.",
        login: "Xin chào! Cậu có mang bánh rán cho tớ không? Cùng học nào!",
        correct: "Giỏi quá! Cậu xứng đáng được tặng một chiếc bánh rán!",
        broken: "Cậu lại lười biếng rồi! Có cần tớ lôi Cỗ Máy Thời Gian ra cứu chuỗi không hả?",
        wrong: "Ui da, sai mất rồi! Đừng nản chí, cậu hãy xem kĩ lại từ vựng đi!"
    },
    'dekisugi': {
        icon: '🧑‍🎓',
        avatarImg: 'https://wibu.com.vn/wp-content/uploads/2024/03/Dekisugi.png',
        name: 'Học giả Dekisugi',
        price: 3000,
        buffDesc: "Cộng +10 XP gốc mỗi câu đúng. Vượt ải 100% được thưởng nóng 50 Vàng.",
        login: "Chào cậu! Hôm nay chúng ta cùng cố gắng ôn tập nhé. Tớ vừa đọc xong một cuốn sách rất hay.",
        correct: "Tuyệt vời! Cậu làm tốt lắm. Cứ giữ vững phong độ này nhé!",
        broken: "Tớ thấy cậu vắng mặt hơi lâu. Việc học giống như xây gạch, phải kiên trì mỗi ngày mới vững chắc được.",
        wrong: "Ồ, câu này hơi lắt léo một chút. Cậu nên xem lại kiến thức phần này nhé."
    },
    'roshi': {
        icon: '🐢',
        avatarImg: 'https://wibu.com.vn/wp-content/uploads/2024/03/Muten-Roshi.png',
        name: 'Quy Lão Tiên Sinh',
        price: 3000,
        buffDesc: "Cộng +5 Vàng gốc mỗi câu đúng. Sai một câu bị phạt trừ 2 Vàng.",
        login: "Khà khà, nhìn cái mặt ngáp ngắn ngáp dài kìa, định vào đây cúng Vàng cho lão phu đi uống trà đấy à?",
        correct: "Ồ, câu này mà cũng làm được cơ đấy! Đúng là rùa mù vớ được cá rán! Chắc lại ăn may chứ gì?",
        broken: "Đứt chuỗi rồi à? Khà khà, ý chí tu luyện của đồ đệ còn ngắn hơn cả chiều cao của lão phu nữa!",
        wrong: "Ngu dốt! Làm bài mà cứ như ném phi tiêu thế à? Lão phu xin nhẹ 2 Vàng đi mua tạp chí nhé!"
    }
};

let tempMentorId = null;
let mentorTimeout = null;

window.openMentorContract = function(mentorId) {
    tempMentorId = mentorId;
    const mentor = mentorsData[mentorId];
    let avatarHtml = mentor.icon;
    if (mentor.avatarImg) avatarHtml = `<img src="${mentor.avatarImg}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    document.getElementById('contractAvatar').innerHTML = avatarHtml;
    document.getElementById('contractDesc').innerHTML = `Chiêu mộ <b>${mentor.name}</b> làm Ngự Tiền Gia Sư.<br>Lương tháng: <b style="color:#ff1744">${mentor.price} Vàng</b>.<br><br><span style="color:#2e7d32; font-weight:bold;">✨ Nội tại:</span> <span style="color:#555;">${mentor.buffDesc}</span>`;
    document.getElementById('mentorMonths').value = 1;
    updateContractTotal();
    document.getElementById('mentorContractModal').classList.add('active');
    document.getElementById('mentorMonths').oninput = updateContractTotal;
};

window.updateContractTotal = function() {
    let months = parseInt(document.getElementById('mentorMonths').value) || 1;
    if (months < 1) { months = 1; document.getElementById('mentorMonths').value = 1; }
    if (months > 12) { months = 12; document.getElementById('mentorMonths').value = 12; }
    let total = months * mentorsData[tempMentorId].price;
    document.getElementById('contractTotalGold').innerText = total.toLocaleString();
};

window.confirmMentorContract = async function() {
    let months = parseInt(document.getElementById('mentorMonths').value) || 1;
    let totalCost = months * mentorsData[tempMentorId].price;
    if (!userData.gold || userData.gold < totalCost) { alert("Báo cáo Bệ hạ: Ngân khố không đủ Vàng để trả lương cho Gia sư này. Hãy đi cày thêm!"); return; }
    let now = Date.now();
    let currentExpiry = userData.mentorExpiry || now;
    if (currentExpiry < now) currentExpiry = now; 
    let newExpiry = currentExpiry + (months * 30 * 24 * 60 * 60 * 1000);
    userData.gold -= totalCost;
    if (typeof transferToAdmin === 'function') { transferToAdmin(totalCost, `Thuê Gia sư: ${mentorsData[tempMentorId].name} (${months} tháng)`); }
    userData.mentorExpiry = newExpiry;
    userData.selectedMentor = tempMentorId;
    if (currentUser && db) { db.collection('vocab_users').doc(currentUser.uid).update(userData); }
    document.getElementById('mentorContractModal').classList.remove('active');
    updateUI();
    alert(`🎉 Chúc mừng! Bạn đã chiêu mộ thành công ${mentorsData[tempMentorId].name} trong ${months} tháng.`);
    showMentorDialogue('login');
};

window.showMentorDialogue = function(action, extraData = null) {
    const widget = document.getElementById('mentor-widget');
    if (!widget || !userData || !userData.selectedMentor) return;
    let now = Date.now();
    if (!userData.mentorExpiry || userData.mentorExpiry < now) { widget.style.display = 'none'; return; }
    let pvpModal = document.getElementById('pvpModal');
    if (pvpModal && pvpModal.classList.contains('active')) { widget.style.display = 'none'; return; }
    widget.style.display = 'flex';
    let mentor = mentorsData[userData.selectedMentor];
    const avatarEl = document.getElementById('mentor-avatar');
    if (mentor.avatarImg) { avatarEl.innerHTML = `<img src="${mentor.avatarImg}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`; } else { avatarEl.innerText = mentor.icon; }
    let textToSpeak = mentor[action];
    if (action === 'wrong' && extraData && extraData.en) {
        if (userData.selectedMentor === 'conan') { textToSpeak = `Sai rồi! Sự thật chỉ có một: "${extraData.en}" có nghĩa là "${extraData.vi}". Nhìn kỹ manh mối này nhé!`; } 
        else if (userData.selectedMentor === 'doraemon') { textToSpeak = `Ui da sai rồi! Từ điển tương lai ghi "${extraData.en}" nghĩa là "${extraData.vi}" đó nha!`; } 
        else if (userData.selectedMentor === 'dekisugi') { textToSpeak = `Tiếc quá! "${extraData.en}" phải mang nghĩa là "${extraData.vi}". Cậu note lại vào vở cho nhớ nhé!`; } 
        else if (userData.selectedMentor === 'roshi') { textToSpeak = `Trật lất! "${extraData.en}" nghĩa là "${extraData.vi}"! Phạt trừ 2 Vàng, chép phạt 10 lần cho ta!`; }
    }
    const bubble = document.getElementById('mentor-bubble');
    bubble.innerText = textToSpeak; bubble.classList.add('show');
    clearTimeout(mentorTimeout); mentorTimeout = setTimeout(() => { bubble.classList.remove('show'); }, 7000); 
};

window.pokeMentor = function() { showMentorDialogue('login'); };
setTimeout(() => { if(currentUser && userData) showMentorDialogue('login'); }, 2000);

// Khôi phục lại hàm lưu trữ an toàn (Đảm bảo không bị mất dữ liệu Cloud khi mạng yếu)
function syncStatsToCloud() { 
    if (currentUser && db) { 
        db.collection('vocab_users').doc(currentUser.uid).update({ 
            gold: userData.gold || 0, 
            xp: userData.xp || 0, 
            lifetime_xp: userData.lifetime_xp || 0, 
            realm: userData.realm || "", 
            streak: userData.streak || 1, 
            displayName: userData.displayName || "", 
            magnifyingGlass: userData.magnifyingGlass || 0, 
            glass_100: userData.glass_100 || 0,
            glass_80: userData.glass_80 || 0,
            shield_100: userData.shield_100 || 0,
            shield_80: userData.shield_80 || 0,
            time_100: userData.time_100 || 0,
            time_80: userData.time_80 || 0,
            torch_100: userData.torch_100 || 0,
            torch_80: userData.torch_80 || 0,
            vouchers: userData.vouchers || [], 
            streakIcon: userData.streakIcon || '🔥', 
            theme: userData.theme || 'theme_default', 
            purchasedItems: userData.purchasedItems || [], 
            weeklyXp: userData.weeklyXp || 0, 
            lastWeekXp: userData.lastWeekXp || 0, 
            currentWeekStr: userData.currentWeekStr || "", 
            highestWeeklyXp: userData.highestWeeklyXp || 0, 
            hasBrokenRecordThisWeek: userData.hasBrokenRecordThisWeek || false, 
            potionX3Expiry: userData.potionX3Expiry || null, 
            timeMachine: userData.timeMachine || null, 
            mastered_words: userData.mastered_words || 0, 
            mastered_lessons: userData.mastered_lessons || [],
            selectedMentor: userData.selectedMentor || null,
            mentorExpiry: userData.mentorExpiry || null
        }).then(() => updateUI()).catch(e => console.error("Lỗi đồng bộ:", e));
    } 
}

// Bơm xung điện để các tab tự động thức tỉnh
setTimeout(() => { updateUI(); fetchLeaderboard(); }, 500);
