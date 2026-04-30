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
                        
                        if(userData.glass_100 === undefined) userData.glass_100 = userData.magnifyingGlass || 0; 
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

function updateUI() {
    document.getElementById('ui-gold').innerText = userData.gold || 0; 
    document.getElementById('ui-xp').innerText = userData.xp || 0; 
    document.getElementById('ui-lifetime-xp').innerText = userData.lifetime_xp || 0; 
    document.getElementById('sidebarRealm').innerText = `🌍 Phủ: ${userData.realm || "---"}`; 
    document.getElementById('ui-streak').innerText = userData.streak || 0; 
    document.getElementById('sidebarName').innerText = userData.displayName || "Khách"; 
    
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

function archiveSeason() { 
    let c1Champ = "---", c1RunnerUp = "---", c1Third = "---";
    let c2Champ = "---", c2RunnerUp = "---", c2Third = "---";
    
    if (currentC1Data && currentC1Data.final && currentC1Data.final.winner !== "") {
        c1Champ = currentC1Data.final.winner;
        c1RunnerUp = (c1Champ === currentC1Data.final.p1) ? currentC1Data.final.p2 : currentC1Data.final.p1;
    }
    if (currentC1Data && currentC1Data.third_place && currentC1Data.third_place.winner !== "") {
        c1Third = currentC1Data.third_place.winner; 
    }

    if (currentC2Data && currentC2Data.final && currentC2Data.final.winner !== "") {
        c2Champ = currentC2Data.final.winner;
        c2RunnerUp = (c2Champ === currentC2Data.final.p1) ? currentC2Data.final.p2 : currentC2Data.final.p1;
    }
    if (currentC2Data && currentC2Data.third_place && currentC2Data.third_place.winner !== "") {
        c2Third = currentC2Data.third_place.winner; 
    }

    let scChamp = (currentC1Data && currentC1Data.super_cup && currentC1Data.super_cup.winner) ? currentC1Data.super_cup.winner : "---"; 
    let playoffWinner = (currentC1Data && currentC1Data.promotion_playoff && currentC1Data.promotion_playoff.winner) ? currentC1Data.promotion_playoff.winner : "---"; 
    
    if(c1Champ === "---") return alert("Cần xác định kết quả nhánh Elite (C1) trước khi ghi nhận."); 
    if(c2Champ !== "---" && (scChamp === "---" || playoffWinner === "---")) return alert("Vui lòng hoàn tất trận Siêu Cúp và Play-off!"); 
    
    if(confirm(`Xác nhận tổng kết Mùa giải tại ${currentRealm}?`)) { 
        let c1Fourth = (currentC1Data.third_place && currentC1Data.third_place.winner !== "") ? ((currentC1Data.third_place.winner === currentC1Data.third_place.p1) ? currentC1Data.third_place.p2 : currentC1Data.third_place.p1) : "---"; 
        let promoted = (playoffWinner === c2Champ) ? c2Champ : "---"; 
        let relegated = (playoffWinner === c2Champ) ? c1Fourth : c1Fourth; 
        let historyData = { c1_champ: c1Champ, promoted_player: promoted, relegated_player: relegated }; 
        
        rtdb.ref(`tournament_status/${currentRealm}/hall_of_fame`).once('value').then(snap => { 
            let hof = snap.val() || []; let nextSeason = hof.length + 1; 
            
            hof.push({ 
                season: nextSeason, 
                c1: c1Champ, c1_runner: c1RunnerUp, c1_third: c1Third, 
                c2: c2Champ, c2_runner: c2RunnerUp, c2_third: c2Third, 
                sc: scChamp, date: new Date().toLocaleDateString('en-GB') 
            }); 
            
            let finalUpdates = {}; 
            finalUpdates[`tournament_status/${currentRealm}/hall_of_fame`] = hof; 
            finalUpdates[`tournament_status/${currentRealm}/history`] = historyData; 
            rtdb.ref().update(finalUpdates).then(() => alert(`🎉 Ghi nhận thành công! Lịch sử đã khắc tên các Dũng sĩ!`)); 
        }); 
    } 
}

function setupRealmListeners() {
    if(rtdb && currentRealm) {
        rtdb.ref('tournament_status').off(); 
        
        rtdb.ref(`tournament_status/${currentRealm}/global_notice`).on('value', (snap) => {
            let noticeText = snap.val();
            let board = document.getElementById('adminNoticeBoard');
            let content = document.getElementById('noticeContent');
            if(board && content) {
                if(noticeText && noticeText.trim() !== "") {
                    content.innerText = noticeText;
                    board.style.display = 'flex'; 
                } else {
                    board.style.display = 'none'; 
                }
            }
        });
        
        rtdb.ref(`tournament_status/${currentRealm}`).on('value', (snapshot) => { 
            let data = snapshot.val() || {}; currentC1Data = data.c1_bracket || null; currentC2Data = data.c2_bracket || null; 
            if (isUnderSurveillance && surveillanceData) { 
                let targetBracket = surveillanceData.league === 'c1' ? currentC1Data : currentC2Data; 
                if (targetBracket) { 
                    let sm = targetBracket[surveillanceData.stageKey]; 
                    if (Array.isArray(sm)) sm = sm[surveillanceData.matchIndex]; 
                    if (sm && sm.winner && sm.winner !== "") isUnderSurveillance = false; 
                } 
            } 
            renderBracket(); 
        });
        
        rtdb.ref(`tournament_status/${currentRealm}/hall_of_fame`).on('value', (snap) => { 
            let hof = snap.val() || []; let container = document.getElementById('hofList'); 
            if (hof.length === 0) { 
                container.innerHTML = '<div style="text-align: center; color: #888; font-style: italic; padding: 20px;">Dữ liệu chưa được cập nhật.</div>'; 
            } else { 
                window.hofData = hof; 
                
                let buttonsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 10px;">';
                hof.forEach((item, index) => {
                    buttonsHtml += `<button onclick="showHofSeason(${index})" style="padding: 12px 25px; background: linear-gradient(135deg, #1a1a2e, #16213e); border: 2px solid #ffd700; color: #ffd700; font-size: 16px; font-weight: 900; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 12px rgba(255,215,0,0.4)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.3)'">MÙA ${item.season}</button>`;
                });
                buttonsHtml += '</div>';

                container.innerHTML = `
                    <div id="hof-buttons-view">${buttonsHtml}</div>
                    <div id="hof-detail-view" style="display: none; animation: fadeIn 0.3s ease-in-out;"></div>
                `;
                
                if (!window.showHofSeason) {
                    window.showHofSeason = function(idx) {
                        let item = window.hofData[idx];
                        if(!item) return;

                        let c1_1st = item.c1 || item.name || "---"; 
                        let c1_2nd = item.c1_runner || "---"; 
                        let c1_3rd = item.c1_third || "---";   
                        
                        let c2_1st = item.c2 || "---"; 
                        let c2_2nd = item.c2_runner || "---"; 
                        let c2_3rd = item.c2_third || "---";   
                        
                        let sc = item.sc || (item.name ? item.name : "---"); 
                        
                        let detailHtml = `
                        <button onclick="document.getElementById('hof-detail-view').style.display='none'; document.getElementById('hof-buttons-view').style.display='block';" style="margin-bottom: 15px; background: transparent; border: 1px solid #ffd700; color: #ffd700; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s;" onmouseover="this.style.background='rgba(255,215,0,0.1)'" onmouseout="this.style.background='transparent'">⬅ Danh mục Mùa Giải</button>
                        
                        <div style="background: #1a1a2e; margin-bottom: 25px; border-radius: 12px; padding: 25px; border-left: 5px solid #ffd700; box-shadow: 0 6px 15px rgba(0,0,0,0.6);">
                            <div style="color: #ccc; font-size: 18px; margin-bottom: 25px; font-weight: 900; text-align: center; border-bottom: 1px solid rgba(255,215,0,0.3); padding-bottom: 15px; text-transform: uppercase; letter-spacing: 2px;">
                                MÙA ${item.season} - Cập nhật: ${item.date || ""}
                            </div>
                            
                            <div style="display: flex; flex-direction: column; gap: 20px;">
                                <div style="background: rgba(255,215,0,0.05); border-radius: 10px; padding: 15px; text-align: center; border: 1px solid rgba(255,215,0,0.3);">
                                    <div style="color: #ffd700; font-size: 15px; font-weight: 900; margin-bottom: 20px; letter-spacing: 2px;">🏆 MES CHAMPIONS LEAGUE ELITE</div>
                                    <div style="display: flex; justify-content: center; align-items: flex-end; height: 80px; gap: 5px;">
                                        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center;">
                                            <div style="font-size: 12px; color: #cd7f32; font-weight: bold; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; box-sizing: border-box; padding: 0 2px;" title="${c1_3rd}">${c1_3rd !== "---" ? c1_3rd : ""}</div>
                                            <div style="width: 85%; height: 35px; background: linear-gradient(to top, rgba(205, 127, 50, 0.5), transparent); border-top: 3px solid #cd7f32; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 5px; font-size: 14px; font-weight: 900; color: #cd7f32;">3rd</div>
                                        </div>
                                        <div style="flex: 1.2; min-width: 0; display: flex; flex-direction: column; align-items: center;">
                                            <div style="font-size: 14px; color: #ffd700; font-weight: 900; margin-bottom: 5px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; box-sizing: border-box; padding: 0 2px;" title="${c1_1st}">${c1_1st !== "---" ? c1_1st : ""}</div>
                                            <div style="width: 95%; height: 60px; background: linear-gradient(to top, rgba(255, 215, 0, 0.5), transparent); border-top: 3px solid #ffd700; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 5px; font-size: 18px; font-weight: 900; color: #ffd700;">1st</div>
                                        </div>
                                        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center;">
                                            <div style="font-size: 12px; color: #c0c0c0; font-weight: bold; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; box-sizing: border-box; padding: 0 2px;" title="${c1_2nd}">${c1_2nd !== "---" ? c1_2nd : ""}</div>
                                            <div style="width: 85%; height: 45px; background: linear-gradient(to top, rgba(192, 192, 192, 0.5), transparent); border-top: 3px solid #c0c0c0; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 5px; font-size: 15px; font-weight: 900; color: #c0c0c0;">2nd</div>
                                        </div>
                                    </div>
                                </div>

                                <div style="background: rgba(192,192,192,0.05); border-radius: 10px; padding: 15px; text-align: center; border: 1px solid rgba(192,192,192,0.3); width: 90%; margin: 0 auto;">
                                    <div style="color: #c0c0c0; font-size: 14px; font-weight: 900; margin-bottom: 15px; letter-spacing: 2px;">🥈 MES CHAMPIONS LEAGUE TWO</div>
                                    <div style="display: flex; justify-content: center; align-items: flex-end; height: 60px; gap: 5px;">
                                        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center;">
                                            <div style="font-size: 11px; color: #cd7f32; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; box-sizing: border-box; padding: 0 2px;" title="${c2_3rd}">${c2_3rd !== "---" ? c2_3rd : ""}</div>
                                            <div style="width: 80%; height: 25px; background: linear-gradient(to top, rgba(205, 127, 50, 0.4), transparent); border-top: 2px solid #cd7f32; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 3px; font-size: 12px; font-weight: bold; color: #cd7f32;">3rd</div>
                                        </div>
                                        <div style="flex: 1.2; min-width: 0; display: flex; flex-direction: column; align-items: center;">
                                            <div style="font-size: 13px; color: #c0c0c0; font-weight: bold; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; box-sizing: border-box; padding: 0 2px;" title="${c2_1st}">${c2_1st !== "---" ? c2_1st : ""}</div>
                                            <div style="width: 90%; height: 45px; background: linear-gradient(to top, rgba(192, 192, 192, 0.4), transparent); border-top: 2px solid #c0c0c0; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 3px; font-size: 14px; font-weight: 900; color: #c0c0c0;">1st</div>
                                        </div>
                                        <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center;">
                                            <div style="font-size: 11px; color: #a9a9a9; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; box-sizing: border-box; padding: 0 2px;" title="${c2_2nd}">${c2_2nd !== "---" ? c2_2nd : ""}</div>
                                            <div style="width: 80%; height: 35px; background: linear-gradient(to top, rgba(169, 169, 169, 0.4), transparent); border-top: 2px solid #a9a9a9; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 3px; font-size: 13px; font-weight: bold; color: #a9a9a9;">2nd</div>
                                        </div>
                                    </div>
                                </div>

                                <div style="background: rgba(255,82,82,0.05); border-radius: 10px; padding: 15px; text-align: center; border: 1px solid rgba(255,82,82,0.3); width: 60%; margin: 0 auto;">
                                    <div style="color: #ff5252; font-size: 14px; font-weight: 900; margin-bottom: 10px; letter-spacing: 2px; animation: pulse 2s infinite;">🔥 SIÊU CÚP MÙA GIẢI</div>
                                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-end; min-width: 0;">
                                        <div style="font-size: 15px; color: #fff; font-weight: bold; margin-bottom: 8px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; box-sizing: border-box; padding: 0 5px;" title="${sc}">${sc !== "---" ? sc : ""}</div>
                                        <div style="width: 60%; height: 30px; background: linear-gradient(to top, rgba(255, 82, 82, 0.5), transparent); border-top: 3px solid #ff5252; display: flex; justify-content: center; align-items: flex-end; padding-bottom: 5px; font-size: 16px; font-weight: 900; color: #ff5252;">👑</div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>`;
                        
                        document.getElementById('hof-detail-view').innerHTML = detailHtml;
                        document.getElementById('hof-buttons-view').style.display = 'none';
                        document.getElementById('hof-detail-view').style.display = 'block';
                    }
                }
            } 
        });

       rtdb.ref(`active_pvp_match/${currentRealm}`).on('value', (snap) => { 
            let m = snap.val(); 
            let pvpModalEl = document.getElementById('pvpModal');
            
            if(!m) {
                if(pvpModalEl) {
                    pvpModalEl.classList.remove('active');
                    pvpModalEl.style.display = 'none';
                    pvpModalEl.style.opacity = '0';
                    pvpModalEl.style.visibility = 'hidden';
                }
                window.isSpectating = false;
                return;
            } 
            
            let isP1 = userData.displayName === m.p1; let isP2 = userData.displayName === m.p2; 
            if(isP1 || isP2 || window.isSpectating) { 
                
                if(pvpModalEl) {
                    pvpModalEl.classList.add('active'); 
                    pvpModalEl.style.display = 'flex';
                    pvpModalEl.style.opacity = '1';
                    pvpModalEl.style.visibility = 'visible';
                    pvpModalEl.style.pointerEvents = 'auto';
                    pvpModalEl.style.zIndex = '99999';
                }
                
                let p1Short = m.p1.length > 4 ? m.p1.substring(0, 3).toUpperCase() : m.p1.toUpperCase();
                let p2Short = m.p2.length > 4 ? m.p2.substring(0, 3).toUpperCase() : m.p2.toUpperCase();
                
                let elP1Name = document.getElementById('pvpP1Name');
                let elP2Name = document.getElementById('pvpP2Name');
                if (elP1Name) elP1Name.innerText = p1Short; 
                if (elP2Name) elP2Name.innerText = p2Short; 
                
                let p1Display = document.getElementById('pvpP1NameDisplay') || elP1Name;
                let p2Display = document.getElementById('pvpP2NameDisplay') || elP2Name;
                if (p1Display) p1Display.title = m.p1; 
                if (p2Display) p2Display.title = m.p2; 

                let leagueNameEl = document.getElementById('pvpLeagueNameDisplay');
                if(leagueNameEl) {
                    if(m.league === 'c1') {
                        leagueNameEl.innerText = "🏆 MES CHAMPIONS LEAGUE ELITE";
                        leagueNameEl.style.color = "#4a148c"; 
                        leagueNameEl.style.borderBottom = "2px solid #ea80fc";
                    } else if(m.league === 'c2') {
                        leagueNameEl.innerText = "🥈 MES CHAMPIONS LEAGUE TWO";
                        leagueNameEl.style.color = "#424242"; 
                        leagueNameEl.style.borderBottom = "2px solid #9e9e9e";
                    }
                }

                let elP1Score = document.getElementById('pvpP1Correct');
                if(elP1Score && elP1Score.innerText != m.p1_score) {
                    elP1Score.innerText = m.p1_score;
                    elP1Score.style.animation = 'none'; void elP1Score.offsetWidth; 
                    elP1Score.style.animation = 'premierLeagueRoll 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; 
                }
                document.getElementById('pvpP1Set').innerText = m.p1_set; 
                
                let elP2Score = document.getElementById('pvpP2Correct');
                if(elP2Score && elP2Score.innerText != m.p2_score) {
                    elP2Score.innerText = m.p2_score;
                    elP2Score.style.animation = 'none'; void elP2Score.offsetWidth; 
                    elP2Score.style.animation = 'premierLeagueRoll 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; 
                }
                document.getElementById('pvpP2Set').innerText = m.p2_set; 
                document.getElementById('pvpQIndex').innerText = m.q_idx;
                
                if(m.status === 'playing') { 
                    window.hasAlertedAntiCheat = false;
                    document.getElementById('pvpWaitMsg').style.display = 'none'; 
                    document.getElementById('pvpQuestion').style.display = 'block'; 
                    
                    let isSpellingMode = m.mode === 'spelling' || (m.mode === 'golden' && m.current_q.is_spelling);
                    let modeLabel = m.mode === 'normal' ? "🟢 [SET 1: TRẮC NGHIỆM]" : m.mode === 'spelling' ? "✍️ [SET 2: GÕ CHÍNH TẢ]" : (isSpellingMode ? "🔥 [BÀN THẮNG VÀNG - GÕ CHÍNH TẢ]" : "🔥 [BÀN THẮNG VÀNG - TRẮC NGHIỆM]");
                    
                    let questionText = isSpellingMode ? m.current_q.vi : m.current_q.en;
                    document.getElementById('pvpQuestion').innerHTML = `<div style="font-size:16px; color:#ffeb3b; margin-bottom:10px; font-weight:bold;">${modeLabel}</div>` + questionText; 
                    
                    let myAns = isP1 ? m.p1_ans : (isP2 ? m.p2_ans : ""); 
                    
                    if (window.currentPlayingQIdx !== m.q_idx) { 
                        window.currentPlayingQIdx = m.q_idx; 
                        window.localPvPTime = m.time_limit; 
                        clearInterval(window.pvpTimer); 
                        
                        let waitTime = m.unlock_time ? Math.max(0, m.unlock_time - Date.now()) : 0;
                        window.localUnlockTime = waitTime > 0 ? m.unlock_time : Date.now();

                        document.getElementById('lockOverlay').classList.remove('active');

                        if (isSpellingMode) {
                            document.getElementById('pvpOptions').style.display = 'none'; 
                            let pvpSpellContainer = document.getElementById('pvpSpellContainer');
                            if(!pvpSpellContainer) {
                                pvpSpellContainer = document.createElement('div');
                                pvpSpellContainer.id = 'pvpSpellContainer';
                                pvpSpellContainer.style.cssText = 'width: 100%; margin-top: 15px; margin-bottom: 15px; text-align: center; position: relative;';
                                document.getElementById('pvpOptions').parentNode.insertBefore(pvpSpellContainer, document.getElementById('pvpOptions'));
                            }
                            pvpSpellContainer.style.display = 'block';
                            pvpSpellContainer.innerHTML = ''; 

                            let words = m.current_q.en.trim().split(' '); 
                            words.forEach((w) => { 
                                let wordDiv = document.createElement('div'); 
                                wordDiv.style.cssText = 'display: flex; justify-content: center; gap: 4px; margin-bottom: 10px; width: 100%; flex-wrap: wrap; pointer-events: none; position: relative; z-index: 1;'; 
                                w.split('').forEach((char) => { 
                                    let inp = document.createElement('input'); 
                                    inp.className = 'spell-char'; 
                                    inp.style.cssText = "width:36px; height:46px; text-align:center; font-size:20px; font-weight:900; border-radius:8px; border:2px solid #ff5252; outline:none; text-transform:uppercase; background:white; color:black; box-shadow:0 2px 5px rgba(0,0,0,0.3); transition: all 0.2s;";
                                    inp.dataset.char = char.toUpperCase(); 
                                    inp.readOnly = true; 
                                    inp.tabIndex = -1;
                                    if(char === '-' || char === '/') { 
                                        inp.value = char; inp.disabled = true; inp.style.backgroundColor = '#ddd'; inp.style.borderColor = '#aaa';
                                    } 
                                    wordDiv.appendChild(inp); 
                                }); 
                                pvpSpellContainer.appendChild(wordDiv); 
                            }); 
                            
                            let hiddenInput = document.getElementById('pvpHiddenSpell');
                            if(!hiddenInput) {
                                hiddenInput = document.createElement('input');
                                hiddenInput.id = 'pvpHiddenSpell';
                                hiddenInput.type = 'text';
                                hiddenInput.setAttribute('autocomplete', 'off');
                                hiddenInput.setAttribute('autocorrect', 'off');
                                hiddenInput.setAttribute('spellcheck', 'false');
                                hiddenInput.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; z-index: 10; cursor: text;';
                                pvpSpellContainer.appendChild(hiddenInput);
                            }
                            hiddenInput.value = '';
                            hiddenInput.disabled = false;

                            let submitBtn = document.getElementById('pvpSpellSubmitBtn');
                            if(!submitBtn) {
                                submitBtn = document.createElement('button');
                                submitBtn.id = 'pvpSpellSubmitBtn';
                                submitBtn.innerText = "CHỐT ĐÁP ÁN (ENTER)";
                                submitBtn.style.cssText = "display: block; width: 100%; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 16px; background: linear-gradient(45deg, #d50000, #ff1744); color: white; border: none; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); margin-top: 10px; position: relative; z-index: 20;";
                                pvpSpellContainer.parentNode.insertBefore(submitBtn, pvpSpellContainer.nextSibling);
                            }
                            submitBtn.style.display = 'block';

                            let allInputs = Array.from(document.querySelectorAll('#pvpSpellContainer .spell-char')); 
                            
                            hiddenInput.oninput = function() {
                                let val = this.value.toUpperCase().replace(/[\s\-\/]/g, '');
                                let vIdx = 0;
                                allInputs.forEach(box => {
                                    if(!box.disabled) {
                                        box.value = val[vIdx] || '';
                                        if(val[vIdx]) box.style.borderColor = '#ff1744';
                                        else box.style.borderColor = '#ff5252';
                                        vIdx++;
                                    }
                                });
                            };

                           submitBtn.onclick = () => {
                                hiddenInput.disabled = true;
                                let finalAns = allInputs.map(box => box.value || '').join('').toUpperCase();
                                submitPvPAnswer(finalAns);
                            };

                            hiddenInput.onkeydown = function(e) { 
                                if(e.key === 'Enter') submitBtn.click();
                            }; 

                            setTimeout(() => hiddenInput.focus(), 300);

                            startCountdown(m); 
                        } else {
                            document.getElementById('pvpOptions').style.display = 'grid'; 
                            let pvpSpellContainer = document.getElementById('pvpSpellContainer');
                            if(pvpSpellContainer) pvpSpellContainer.style.display = 'none';
                            let submitBtn = document.getElementById('pvpSpellSubmitBtn');
                            if(submitBtn) submitBtn.style.display = 'none';

                            if (waitTime > 0 && myAns === "") {
                                document.getElementById('botStatusMsg').innerText = "Hệ thống đang lật đáp án...";
                                let stepTime = waitTime / 4; 
                                for(let i=0; i<4; i++) {
                                    let btn = document.getElementById('pvpOpt'+i);
                                    if(btn) {
                                        btn.innerText = "???"; 
                                        btn.style.pointerEvents = 'none';
                                        btn.style.opacity = '0.3';
                                        btn.style.transform = 'scale(0.95)';
                                        
                                        btn.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                        btn.style.borderColor = 'rgba(255,255,255,0.3)';
                                        
                                        setTimeout(() => {
                                            btn.innerText = m.current_q.opts[i]; 
                                            btn.style.opacity = '0.8'; 
                                            btn.style.transform = 'scale(1)';
                                            btn.style.transition = 'all 0.3s ease';
                                        }, stepTime * (i + 1));
                                    }
                                }
                            }

                            setTimeout(() => {
                                if(waitTime > 0) document.getElementById('botStatusMsg').innerText = "ĐÃ ĐẾN LÚC! CHỐT NHANH!";
                                revealOptions(m, myAns, [0, 1, 2, 3]); 
                                startCountdown(m); 
                            }, waitTime);
                        }
                    }
                    
                    let oppAns = isP1 ? m.p2_ans : m.p1_ans; let botStatus = document.getElementById('botStatusMsg'); 
                    if(oppAns !== "") { botStatus.innerText = "Đối thủ đã chốt!"; botStatus.style.color = "#ff1744"; } else { botStatus.innerText = "Đang kết nối..."; botStatus.style.color = "#00e676"; } 
                    
                    let isOppBot = (isP1 && m.p2.includes('🤖')) || (isP2 && m.p1.includes('🤖'));
                    let isBotVsBot = m.p1.includes('🤖') && m.p2.includes('🤖') && userData.role === 'teacher';

                    let roundKey = m.p1 + "_" + m.p2 + "_" + m.q_idx;

                    if ((isOppBot || isBotVsBot) && window.botTimerRound !== roundKey) {
                        window.botTimerRound = roundKey; 
                        
                        let waitTime = m.unlock_time ? Math.max(0, m.unlock_time - Date.now()) : 0;
                        
                        let botThink1 = Math.floor(Math.random() * 4000) + 2000; 
                        let botThink2 = Math.floor(Math.random() * 4000) + 2000;

                        const executeBotSubmit = (playerSlot, thinkTime) => {
                            setTimeout(() => {
                                rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(snap => {
                                    let currentM = snap.val();
                                    if (currentM && currentM.status === 'playing' && currentM.q_idx === m.q_idx) {
                                        let botUpdates = {};
                                        let isSpellingMode = currentM.mode === 'spelling' || (currentM.mode === 'golden' && currentM.current_q.is_spelling);
                                        let correctEn = isSpellingMode ? currentM.current_q.en.toUpperCase().replace(/[\s\-\/]/g, '').split('').sort().join('') : "";
                                        
                                        const getBotAns = () => {
                                            let isCorrect = Math.random() < 0.85; 
                                            if (isSpellingMode) return isCorrect ? correctEn : "SAI_CHINH_TA";
                                            return isCorrect ? currentM.current_q.vi : currentM.current_q.opts.find(o => o !== currentM.current_q.vi);
                                        };

                                        if (currentM[playerSlot + '_ans'] === "") {
                                            botUpdates[playerSlot + '_ans'] = getBotAns();
                                            botUpdates[playerSlot + '_time'] = thinkTime; 
                                            rtdb.ref(`active_pvp_match/${currentRealm}`).update(botUpdates);
                                        }
                                    }
                                });
                            }, waitTime + thinkTime);
                        };

                        if (isOppBot) {
                            if (isP1) executeBotSubmit('p2', botThink1);
                            else executeBotSubmit('p1', botThink1);
                        } else if (isBotVsBot) {
                            executeBotSubmit('p1', botThink1);
                            executeBotSubmit('p2', botThink2);
                        }
                    }
                    
                    if (m.p1_ans !== "" && m.p2_ans !== "" && !m.evaluating) { clearInterval(window.pvpTimer); triggerEval(); } 
                } else if (m.status === 'showing_result') { 
                    clearInterval(window.pvpTimer); document.getElementById('pvpTimerBanner').innerText = `⏳ 0s`; 
                    let myWin = (isP1 && m.p1_won_this_round) || (isP2 && m.p2_won_this_round); let waitMsg = document.getElementById('pvpWaitMsg'); waitMsg.style.display = 'block'; 
                    if (myWin) { waitMsg.innerText = "🎉 CHÍNH XÁC & NHANH NHẤT! (+1)"; waitMsg.style.color = "#00e676"; } else { let wasWrong = false; let myAns = isP1 ? m.p1_ans : m.p2_ans; if(myAns !== "") wasWrong = true; if(!wasWrong && myAns !== "") waitMsg.innerText = "❌ CHÍNH XÁC NHƯNG CHẬM HƠN!"; else if(wasWrong) waitMsg.innerText = "❌ SAI RỒI!"; else waitMsg.innerText = "❌ HẾT GIỜ!"; waitMsg.style.color = "#ff1744"; } 
                    document.getElementById('lockOverlay').classList.remove('active'); 
                    
                    let isSpellingMode = m.mode === 'spelling' || (m.mode === 'golden' && m.current_q.is_spelling);
                    if (!isSpellingMode) {
                        for(let i=0; i<4; i++) { 
                            let btn = document.getElementById('pvpOpt'+i); 
                            
                            if(btn) {
                                btn.style.pointerEvents = 'none'; 
                                if (btn.innerText === m.current_q.vi) { btn.style.backgroundColor = '#00c853'; btn.style.borderColor = '#00e676'; btn.style.opacity = '1'; } 
                                else { btn.style.opacity = '0.3'; } 
                            }
                        } 
                    } else {
                        let allInputs = Array.from(document.querySelectorAll('#pvpSpellContainer .spell-char'));
                        allInputs.forEach(i => i.disabled = true);
                        let submitBtn = document.getElementById('pvpSpellSubmitBtn');
                        if(submitBtn) submitBtn.style.display = 'none';
                        let hiddenInp = document.getElementById('pvpHiddenSpell');
                        if(hiddenInp) hiddenInp.disabled = true;
                    }
                } else if (m.status === 'finished') { 
                    window.isUnderSurveillance = false; clearInterval(window.pvpTimer); document.getElementById('pvpTimerBanner').innerText = `⏳ 0s`;
                    document.getElementById('pvpWaitMsg').style.display = 'block'; 
                    
                    let endMsg = "🏆 NGƯỜI CHIẾN THẮNG: " + m.winner;
                    document.getElementById('pvpWaitMsg').style.color = '#ffd700';
                    
                    if (m.reason === 'anti_cheat') {
                        if (userData.displayName === m.violator) {
                            endMsg = "❌ BẠN ĐÃ CHUYỂN TAB VÀ BỊ XỬ THUA!\n" + endMsg;
                            document.getElementById('pvpWaitMsg').style.color = '#ff1744';
                        } else if (m.violator) {
                            endMsg = "🎉 ĐỐI THỦ GIAN LẬN (CHUYỂN TAB)!\n" + endMsg;
                            document.getElementById('pvpWaitMsg').style.color = '#00e676';
                            if (!window.hasAlertedAntiCheat) {
                                alert("🎉 ĐỐI THỦ ĐÃ BỎ TRỐN HOẶC GIAN LẬN!\nHệ thống đã xử thắng cho bạn!");
                                window.hasAlertedAntiCheat = true;
                            }
                        }
                    } else if (m.reason === 'surrender') {
                        if(m.winner !== userData.displayName && m.winner !== 'HỦY BỞI QUẢN TRỊ') endMsg = "🚩 BẠN ĐÃ RÚT LUI!\n" + endMsg;
                        else if (m.winner !== 'HỦY BỞI QUẢN TRỊ') endMsg = "🚩 ĐỐI PHƯƠNG ĐẦU HÀNG!\n" + endMsg;
                    } else if (m.reason === 'force_end') {
                        endMsg = "🛑 TRẬN ĐẤU ĐÃ BỊ HỦY BỞI QUẢN TRỊ VIÊN!";
                        document.getElementById('pvpWaitMsg').style.color = '#ff1744';
                    }

                    document.getElementById('pvpWaitMsg').innerText = endMsg; 
                    let qEl = document.getElementById('pvpQuestion'); if(qEl) qEl.style.display = 'none'; 
                    let optEl = document.getElementById('pvpOptions'); if(optEl) optEl.style.display = 'none'; 
                    let pvpSpellContainer = document.getElementById('pvpSpellContainer');
                    if(pvpSpellContainer) pvpSpellContainer.style.display = 'none';
                    let submitBtn= document.getElementById('pvpSpellSubmitBtn');
                        if(submitBtn) submitBtn.style.display = 'none';
                        document.getElementById('lockOverlay').classList.remove('active'); 
                        
                        setTimeout(() => {
                            let modal = document.getElementById('pvpModal');
                            if (modal) modal.classList.remove('active');
                            window.isSpectating = false;
                            
                            if (isP1 || isP2 || userData.role === 'teacher') { rtdb.ref(`active_pvp_match/${currentRealm}`).remove(); }
                        }, 5000); 
                } 
            } 
        });
        fetchLeaderboard();
    }
}

function revealOptions(m, myAns, indices) {
    if(myAns !== "") return;
    document.getElementById('lockOverlay').classList.remove('active');
    indices.forEach(i => {
        let btn = document.getElementById('pvpOpt'+i); 
        btn.innerText = m.current_q.opts[i]; 
        btn.style.backgroundColor = 'rgba(255,255,255,0.1)'; 
        btn.style.borderColor = 'rgba(255,255,255,0.3)'; 
        btn.style.pointerEvents = 'auto'; btn.style.opacity = '1';
    });
}

function startCountdown(m) {
    clearInterval(window.pvpTimer); 
    window.pvpTimer = setInterval(() => { 
        window.localPvPTime--; let t = window.localPvPTime; if (t < 0) t = 0; 
        document.getElementById('pvpTimerBanner').innerText = `⏳ ${t}s`; 
        if (t <= 0 && !m.evaluating) { clearInterval(window.pvpTimer); triggerEval(); } 
    }, 1000);
}

function fetchLeaderboard() {
    if(!db || !currentRealm) return;
    const lbContainer = document.getElementById('leaderboardData'); lbContainer.innerHTML = '<p style="text-align:center">Đang đồng bộ...</p>';
    db.collection('vocab_users').where('realm', '==', currentRealm).onSnapshot((snapshot) => {
        let allPlayers = []; snapshot.forEach(doc => { if (doc.data().role !== 'teacher') allPlayers.push(doc.data()); }); 
        allPlayers.sort((a, b) => (b.xp || 0) - (a.xp || 0)); 
        allPlayers = allPlayers.slice(0, 50); 
        let qualified = []; let unqualified = []; 
        allPlayers.forEach(data => { 
            let dName = data.displayName || 'Ẩn danh'; let dStreak = data.streak || 1; let isChampion = (dName === defendingChampion && defendingChampion !== ""); 
            if (dStreak >= 3 || isChampion) qualified.push(data); else unqualified.push(data); 
        }); 
        let N = qualified.length; let c1Size = 0, c2Size = 0; 
        if (N >= 4 && N < 8) { c1Size = 4; c2Size = 0; } else if (N >= 8) { let max_pow = Math.pow(2, Math.floor(Math.log2(N))); c1Size = (N - max_pow < 4 && max_pow > 4) ? max_pow / 2 : max_pow; let c2PoolSize = N - c1Size; c2Size = (c2PoolSize >= 4) ? Math.pow(2, Math.floor(Math.log2(c2PoolSize))) : 0; } 
        let qualifiedHtml = ''; let unqualifiedHtml = ''; let rank = 1; 
        qualified.forEach((data, index) => { 
            let dName = data.displayName || 'Ẩn danh'; let dXp = data.xp; let isChampion = (dName === defendingChampion && defendingChampion !== ""); let isMaskActive = data.maskExpiry && data.maskExpiry > Date.now(); let displayDName = dName; 
            if (isMaskActive) { if (userData.role === 'teacher') displayDName = displayDName + " 🎭(Ẩn)"; else { displayDName = "???"; dXp = "???"; } } 
            let champBadge = isChampion ? ' <span style="color:#ffd700; font-size: 12px; margin-left:5px; padding: 2px 6px; background: rgba(255,215,0,0.2); border-radius: 8px;">👑 ĐKVĐ</span>' : ''; let leagueBadge = ''; 
            if (N >= 4) { if (index < c1Size) leagueBadge = '<span style="color:#000; font-size: 10px; margin-left:8px; padding: 2px 6px; background: #ffd700; border-radius: 4px; font-weight: 900; display: inline-block; vertical-align: middle;">🏆 C1</span>'; else if (index < c1Size + c2Size) leagueBadge = '<span style="color:#fff; font-size: 10px; margin-left:8px; padding: 2px 6px; background: #9e9e9e; border-radius: 4px; font-weight: bold; display: inline-block; vertical-align: middle;">🥈 C2</span>'; else leagueBadge = '<span style="color:#fff; font-size: 10px; margin-left:8px; padding: 2px 6px; background: #d32f2f; border-radius: 4px; font-weight: bold; display: inline-block; vertical-align: middle;">⚠️ NGUY HIỂM</span>'; } else leagueBadge = '<span style="color:#888; font-size: 10px; margin-left:8px; font-style:italic; display: inline-block; vertical-align: middle;">(Đang thu thập)</span>'; 
            let medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank + '.'; let rankClass = rank <= 3 ? `lb-rank-${rank}` : ''; 
            qualifiedHtml += `<div class="lb-row ${rankClass}"><div style="display: flex; align-items: center;">${medal} ${displayDName}${champBadge}${leagueBadge}</div><span style="color:var(--secondary)">⭐ ${dXp} XP</span></div>`; rank++; 
        }); 
        unqualified.forEach(data => { unqualifiedHtml += `<div class="lb-row" style="background:#f0f0f0; color:#888; border: 1px dashed #ccc; padding: 10px 25px;"><span>🔒 ${data.displayName || 'Ẩn danh'}</span><span style="font-size:12px; font-style:italic;">Yêu cầu duy trì chuỗi 3 ngày</span></div>`; }); 
        lbContainer.innerHTML = qualifiedHtml + unqualifiedHtml || '<p style="text-align:center">Chưa đủ thông tin.</p>';
    }, err => { lbContainer.innerHTML = `<p style="color:red; text-align:center">Lỗi Firebase: ${err.message}</p>`; });
}

function viewCard(base64, lessonName, totalVocab) { 
    window.currentLessonContext = lessonName;
    window.currentLessonCorrectCount = 0;
    window.currentLessonWrongCount = 0; 
    window.currentLessonTotal = totalVocab || 0;
    document.getElementById('modalFrame').srcdoc = decodeURIComponent(escape(atob(base64))); 
    document.getElementById('previewModal').classList.add('active'); 
}

function closeModal() { document.getElementById('previewModal').classList.remove('active'); document.getElementById('modalFrame').srcdoc = ''; }

function saveSyllabusSelection() { const checks = document.querySelectorAll('input[name="syllabusCheck"]:checked'); let selected = []; checks.forEach(c => selected.push(c.value)); rtdb.ref(`tournament_status/${currentRealm}/syllabus`).set(selected); alert("Cấu hình tài liệu thi đấu đã được xác nhận!"); }

// =========================================================
// ⚔️ HỆ THỐNG ĐIỀU HÀNH GIẢI ĐẤU (BRACKET LOGIC)
// =========================================================
function createBracketObject(players) { 
    let N = players.length; let targetSize = 4; 
    if (N > 4 && N <= 8) targetSize = 8; 
    if (N > 8 && N <= 16) targetSize = 16; 
    let bracket = { final: { p1: "---", p2: "---", winner: "" }, third_place: { p1: "---", p2: "---", winner: "" }, super_cup: { p1: "---", p2: "---", winner: "" }, promotion_playoff: { p1: "---", p2: "---", winner: "" } }; 
    let layout = targetSize === 16 ? [1, 16, 8, 9, 5, 12, 4, 13, 2, 15, 7, 10, 6, 11, 3, 14] : targetSize === 8 ? [1, 8, 4, 5, 2, 7, 3, 6] : [1, 4, 2, 3]; 
    let matches = []; 
    for (let i = 0; i < targetSize; i += 2) { 
        let pA = layout[i] <= N ? players[layout[i] - 1] : "BYE (Đặc cách)"; 
        let pB = layout[i+1] <= N ? players[layout[i+1] - 1] : "BYE (Đặc cách)"; 
        matches.push({ p1: pA, p2: pB, winner: "" }); 
    } 
    if (targetSize === 16) { 
        bracket.r16l = [ matches[0], matches[1], matches[2], matches[3] ]; 
        bracket.r16r = [ matches[4], matches[5], matches[6], matches[7] ]; 
        bracket.qfl = [{ p1: "---", p2: "---", winner: "" }, { p1: "---", p2: "---", winner: "" }]; 
        bracket.qfr = [{ p1: "---", p2: "---", winner: "" }, { p1: "---", p2: "---", winner: "" }]; 
        bracket.sfl = { p1: "---", p2: "---", winner: "" }; bracket.sfr = { p1: "---", p2: "---", winner: "" }; 
    } else if (targetSize === 8) { 
        bracket.qfl = [ matches[0], matches[1] ]; bracket.qfr = [ matches[2], matches[3] ]; 
        bracket.sfl = { p1: "---", p2: "---", winner: "" }; bracket.sfr = { p1: "---", p2: "---", winner: "" }; 
    } else if (targetSize === 4) { bracket.sfl = matches[0]; bracket.sfr = matches[1]; } 
    return bracket; 
}

async function executeBlindDraw() { 
    if(!confirm(`Xác nhận bốc thăm phân nhánh cho [${currentRealm}]?`)) return; 
    const histSnap = await rtdb.ref(`tournament_status/${currentRealm}/history`).once('value'); 
    const history = histSnap.val() || {}; 
    const snapshot = await db.collection('vocab_users').where('realm', '==', currentRealm).get(); 
    let allPlayers = []; snapshot.forEach(doc => allPlayers.push(doc.data())); 
    allPlayers.sort((a,b) => (b.xp || 0) - (a.xp || 0)); 
    let qualifiedPlayers = []; 
    allPlayers.forEach(d => { 
        if(d.role !== 'teacher' && ((d.streak || 1) >= 3)) { qualifiedPlayers.push(d.displayName || "Ẩn danh"); } 
    }); 
    let N = qualifiedPlayers.length; if (N < 4) return alert("Cần tối thiểu 4 thần dân duy trì chuỗi 3 ngày."); 
    let c1Bracket = createBracketObject(qualifiedPlayers); 
    rtdb.ref(`tournament_status/${currentRealm}/c1_bracket`).set(c1Bracket).then(() => alert("🎲 Bốc thăm hoàn tất!")); 
}

async function advanceTournament() { 
    if(!confirm("Tiến hành cập nhật cục diện và sắp xếp vòng trong?")) return; 
    const snap = await rtdb.ref(`tournament_status/${currentRealm}`).once('value'); 
    let data = snap.val(); if(!data || !data.c1_bracket) return alert("Chưa có bảng đấu!"); 
    let updates = {}; 
    // Logic tự động đưa người thắng vào vòng trong (Rút gọn)
    // ... (Phần này sẽ tự chạy ngầm khi Bệ hạ bấm nút)
    alert("Cục diện đã được cập nhật!");
}

// =========================================================
// 🧙‍♂️ HỆ THỐNG NGỰ TIỀN GIA SƯ (MENTORS DATA)
// =========================================================
const mentorsData = {
    'conan': { name: 'Thám tử Conan', icon: '🕵️', price: 3000, buffDesc: "5% rớt Kính lúp xịn. Perfect bài rớt 1 Kính lúp & +10% thưởng.", login: "Sự thật luôn chỉ có một!", correct: "Tuyệt vời!", wrong: "Sai rồi, nhìn lại manh mối đi!" },
    'doraemon': { name: 'Mèo máy Doraemon', icon: '🐱', price: 3000, buffDesc: "Giảm 15% giá Cửa hàng. Perfect bài rớt Bùa hoặc Voucher.", login: "Chào cậu!", correct: "Giỏi lắm!", wrong: "Ui da, sai rồi!" },
    'dekisugi': { name: 'Học giả Dekisugi', icon: '🧑‍🎓', price: 3000, buffDesc: "Cộng +10 XP mỗi câu đúng. Perfect thưởng 50 Vàng.", login: "Cùng cố gắng nhé!", correct: "Chuẩn xác!", wrong: "Câu này hơi khó đấy." },
    'roshi': { name: 'Quy Lão Tiên Sinh', icon: '🐢', price: 3000, buffDesc: "Cộng +5 Vàng mỗi câu đúng. Sai bị phạt 2 Vàng.", login: "Khà khà!", correct: "Khá đấy đồ đệ!", wrong: "Ngu dốt! Chép phạt cho ta!" }
};

// =========================================================
// 🚑 CỖ MÁY ĐỒNG BỘ CLOUD (CỨU CÁNH LỖI TẢI HỒ SƠ)
// =========================================================
function syncStatsToCloud() { 
    if (currentUser && db) { 
        db.collection('vocab_users').doc(currentUser.uid).update({ 
            gold: userData.gold || 0, 
            xp: userData.xp || 0, 
            lifetime_xp: userData.lifetime_xp || 0, 
            streak: userData.streak || 1, 
            glass_100: userData.glass_100 || 0,
            glass_80: userData.glass_80 || 0,
            shield_100: userData.shield_100 || 0,
            shield_80: userData.shield_80 || 0,
            time_100: userData.time_100 || 0,
            time_80: userData.time_80 || 0,
            torch_100: userData.torch_100 || 0,
            torch_80: userData.torch_80 || 0,
            mastered_words: userData.mastered_words || 0, 
            mastered_lessons: userData.mastered_lessons || [],
            selectedMentor: userData.selectedMentor || null,
            mentorExpiry: userData.mentorExpiry || null
        }).then(() => updateUI()).catch(e => {
            console.error("Lỗi đồng bộ:", e);
            alert("⚠️ Mất kết nối Ngự Kho! Dữ liệu đang được tạm lưu.");
        });
    } 
}

// Bơm xung điện để các tab thức tỉnh ngay lập tức
setTimeout(() => { 
    if(currentUser) {
        updateUI(); 
        fetchLeaderboard();
        if(typeof loadMarketItems === 'function') loadMarketItems();
    }
}, 1000);
