let availableRealms = []; 
let currentRealm = "";

let currentLeagueView = 'c1'; 
let currentC1Data = null; let currentC2Data = null; let currentFullBracketData = null; let defendingChampion = ""; 

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
                currentUser = user; const todayStr = new Date().toLocaleDateString('en-GB'); 
                const isEmperor = (user.email === "phuocthinh419@gmail.com"); const trueRole = isEmperor ? 'teacher' : 'student';

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
                            let diffDays = Math.round((new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()) - lastDate) / 86400000);
                            if (diffDays === 1) { 
                                userData.streak += 1; userData.lastLogin = todayStr; 
                                let mod = userData.streak % 100; let reward = 0;
                                if (mod === 15) reward = 20; else if (mod === 30) reward = 35; else if (mod === 60) reward = 50; else if (mod === 0 && userData.streak >= 100) reward = 100;
                                if (reward > 0) { userData.vouchers.push(reward); userData.vouchers.sort((a,b) => b - a); alert(`🎉 Mã giảm giá ${reward}%!`); }
                                db.collection('vocab_users').doc(user.uid).update({ streak: userData.streak, lastLogin: todayStr, vouchers: userData.vouchers }); 
                            } else if (diffDays > 1) {
                                if (userData.hasShield) { userData.hasShield = false; userData.lastLogin = todayStr; db.collection('vocab_users').doc(user.uid).update({ lastLogin: todayStr, hasShield: false }); alert("🛡️ Đã dùng Bùa Bảo Hộ!"); } 
                                else { 
                                    userData.xp = Math.max(0, userData.xp - Math.floor(userData.xp * 0.2));
                                    userData.gold = Math.max(0, userData.gold - Math.floor(userData.gold * 0.2));
                                    if (diffDays > 1 && diffDays <= 4) userData.timeMachine = { lostStreak: userData.streak, missedDays: diffDays - 1, lostTimestamp: Date.now(), status: 'available', attemptsToday: 0, lastAttemptDate: todayStr, daysRecovered: 0, currentBank: [] };
                                    else userData.timeMachine = null;
                                    userData.streak = 1; userData.lastLogin = todayStr; 
                                    db.collection('vocab_users').doc(user.uid).update({ streak: 1, lastLogin: todayStr, xp: userData.xp, gold: userData.gold, timeMachine: userData.timeMachine || null }).then(() => { 
                                        let oldStreak = userData.timeMachine ? userData.timeMachine.lostStreak : "cũ";
                                        console.error(`[HỆ THỐNG] Cảnh báo: Chuỗi ${oldStreak} ngày đã đứt do vắng mặt ${diffDays} ngày. Đang thiết lập lại về 1.`);
                                        document.getElementById('missedDaysCount').innerText = diffDays;
                                        document.getElementById('streakBrokenModal').classList.add('active'); 
                                    });
                                }
                            } else if (diffDays === 0 && userData.lastLogin !== todayStr) { userData.lastLogin = todayStr; db.collection('vocab_users').doc(user.uid).update({ lastLogin: todayStr }); }
                        }
                        
                        updateUI(); setupRealmListeners(); fetchLessonsFromFirebase(); 
                    } else { 
                        userData = { role: trueRole, gold: 0, xp: 0, lifetime_xp: 0, realm: availableRealms[0], streak: 1, displayName: '', lastLogin: todayStr, hasShield: false, potionExpiry: null, potionX3Expiry: null, maskExpiry: null, magnifyingGlass: 0, vouchers: [], blindBoxCount: 0, lastBlindBoxDate: todayStr, streakIcon: '🔥', theme: 'theme_default', purchasedItems: [], weeklyXp: 0, lastWeekXp: 0, currentWeekStr: getCurrentWeekStr(), highestWeeklyXp: 0, hasBrokenRecordThisWeek: false, timeMachine: null, mastered_words: 0, mastered_lessons: [] };
                        currentRealm = userData.realm;
                        document.getElementById('nameModal').classList.add('active'); 
                    }
                }).catch(err => {
                    console.error("Lỗi xác thực:", err); alert("Lỗi tải hồ sơ! Bệ hạ chưa mở khóa Firebase Rules.");
                });
            } else { 
                currentUser = null; userData = { role: 'student', gold: 0, xp: 0, lifetime_xp: 0, realm: "Khởi Nguyên", streak: 0, displayName: 'Khách', vouchers: [], streakIcon: '🔥', theme: 'theme_default', purchasedItems: [], weeklyXp: 0, lastWeekXp: 0, currentWeekStr: '', highestWeeklyXp: 0, hasBrokenRecordThisWeek: false, potionX3Expiry: null, timeMachine: null, mastered_words: 0, mastered_lessons: [] };
                currentRealm = "Khởi Nguyên"; applyTheme('theme_default'); updateUI(); fetchLessonsFromFirebase();
            }
        });
    }
}

function fallbackInit() { availableRealms = ['Khởi Nguyên']; currentRealm = 'Khởi Nguyên'; updateUI(); checkAuth(); }

function createNewRealm() {
    let name = document.getElementById('newRealmInput').value.trim();
    if(!name) return alert("Vui lòng nhập tên Vũ trụ / Phủ mới!");
    if(availableRealms.includes(name)) return alert("Tên Phủ này đã tồn tại trong hệ thống!");
    db.collection('realms').doc(name).set({ created: Date.now() }).then(() => { alert(`🌌 Lập Phủ [${name}] thành công!`); document.getElementById('newRealmInput').value = ""; });
}

async function deleteRealm() {
    let targetRealm = document.getElementById('deleteRealmSelect').value;
    if(!targetRealm) return alert("Vui lòng chọn Phủ cần xóa!");
    if(targetRealm === 'Khởi Nguyên') return alert("Kháng chỉ! Không thể thiêu rụi Phủ gốc [Khởi Nguyên] của hệ thống!");
    
    let confirm1 = confirm(`CẢNH BÁO: Bạn đang muốn XÓA VĨNH VIỄN phủ [${targetRealm}]?\nToàn bộ bài học và giải đấu của lãnh thổ này sẽ bốc hơi!`);
    if(!confirm1) return;
    
    let promptText = prompt(`Để xác nhận hủy diệt, bạn vui lòng gõ chính xác tên phủ: ${targetRealm}`);
    if(promptText !== targetRealm) return alert("Hủy thao tác do nhập sai tên Phủ.");

    try {
        const lessonsSnap = await db.collection('realms').doc(targetRealm).collection('lessons').get();
        const batch = db.batch();
        lessonsSnap.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        await db.collection('realms').doc(targetRealm).delete();
        await rtdb.ref(`tournament_status/${targetRealm}`).remove();
        await rtdb.ref(`active_pvp_match/${targetRealm}`).remove();

        alert(`🔥 Đã thiêu rụi Phủ [${targetRealm}] thành tro bụi! Thần dân của Phủ này sẽ tự động dạt về [Khởi Nguyên] trong lần đăng nhập tới.`);
        if (currentRealm === targetRealm) { window.location.reload(); }
    } catch (e) { alert("Lỗi khi hủy diệt: " + e.message); }
}

function deleteLesson(lessonId, event) {
    if (event) event.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa vĩnh viễn bài học này khỏi kho không?")) return;

    db.collection('realms').doc(currentRealm).collection('lessons').doc(lessonId).delete().then(() => {
        alert("Đã xóa bài học thành công!");
    }).catch(err => {
        alert("Lỗi khi xóa bài học: " + err.message);
    });
}

function saveLessonToFirebase() {
    let title = document.getElementById('adminLessonName').value.trim(); let realm = document.getElementById('adminRealmSelect').value; let code = document.getElementById('generatedCode').value;
    if(!title || !realm || !code) return alert("Yêu cầu nhập đầy đủ Tên bài, Phủ và Đúc Mã trước khi lưu!");
    if(currentGeneratedVocab.length === 0) return alert("Mã chưa có mảng từ vựng hợp lệ. Vui lòng bấm Đúc Mã lại!");
    db.collection('realms').doc(realm).collection('lessons').add({ name: title, html: code, vocab: currentGeneratedVocab, created: Date.now() }).then(() => {
        alert(`💾 Đã lưu bài [${title}] vào kho [${realm}] thành công!`);
        document.getElementById('adminLessonName').value = ""; document.getElementById('generatedCode').value = ""; document.getElementById('rawInput').value = ""; currentGeneratedVocab = [];
        if(realm === currentRealm) fetchLessonsFromFirebase(); 
    });
}

async function syncFromSheetsToFirebase() {
    let targetRealm = document.getElementById('syncRealmSelect').value;
    if(!targetRealm) return alert("Hệ thống chưa có Phủ nào để chứa dữ liệu. Vui lòng tạo Phủ trước!");
    if(!confirm(`⚠️ CHÚ Ý: Toàn bộ bài học từ Google Sheets cũ sẽ được hút thẳng vào phủ [${targetRealm}]. Chắc chắn muốn tiếp tục?`)) return;
    const SHEET_LINK = 'https://docs.google.com/spreadsheets/d/1dZA9LTtjrKEYZb6kUm4E7p2XLt5NBYqvnKmYarIpxCg/edit?usp=sharing';
    let sheetId = SHEET_LINK.includes('/d/') ? SHEET_LINK.split('/d/')[1].split('/')[0] : SHEET_LINK;
    try {
        const response = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&t=${new Date().getTime()}`); const text = await response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1); const data = JSON.parse(jsonString);
        let count = 0;
        for (let i = 1; i < data.table.rows.length; i++) {
            const r = data.table.rows[i];
            if (r && r.c && r.c[0] && r.c[1] && r.c[1].v) {
                const lessonName = r.c[0].v; const rawHTML = r.c[1].v;
                let vocabMatch = rawHTML.match(/const vocabList = \[(.*?)\];/s); let currentVocab = [];
                if (vocabMatch) { try { currentVocab = eval("[" + vocabMatch[1] + "]"); } catch(e){} }
                await db.collection('realms').doc(targetRealm).collection('lessons').add({ name: lessonName, html: rawHTML, vocab: currentVocab, created: Date.now() + i });
                count++;
            }
        }
        alert(`🚀 Dời đô hoàn tất! Đã đồng bộ thành công ${count} bài học. Ngài có thể xóa Google Sheets cũ.`);
        if(targetRealm === currentRealm) fetchLessonsFromFirebase();
    } catch(e) { alert("Lỗi khi kết nối với Sheets cũ: " + e); }
}

function fetchLessonsFromFirebase() {
    const container = document.getElementById('libraryContainer'); const syllabusDiv = document.getElementById('syllabusChecklist'); 
    if (!container || !db || !currentRealm) return;
    container.innerHTML = "<p>Đang mở kho tàng...</p>";
    db.collection('realms').doc(currentRealm).collection('lessons').orderBy('created', 'asc').onSnapshot(snap => {
        let htmlLib = ''; let htmlArena = ''; allLessonsData = [];
        snap.forEach(doc => {
            const data = doc.data(); allLessonsData.push({ id: doc.id, name: data.name, vocab: data.vocab, raw: data.html });
            let deleteBtn = userData.role === 'teacher' ? `<button class="btn-delete-lib" onclick="deleteLesson('${doc.id}', event)">Xóa</button>` : '';
            htmlLib += `<div class="lib-card">${deleteBtn}<h3>${data.name}</h3><p style="font-size:11px;">Số lượng: ${data.vocab.length} từ</p><button class="btn-run" style="margin-top:10px;" onclick="viewCard('${btoa(unescape(encodeURIComponent(data.html)))}', '${data.name.replace(/'/g, "\\'")}', ${data.vocab.length})">▶ VÀO HỌC</button></div>`;
            htmlArena += `<label class="syllabus-item"><input type="checkbox" name="syllabusCheck" value="${data.name}"> <span>${data.name} (${data.vocab.length} từ)</span></label>`;
        });
        if(allLessonsData.length === 0) htmlLib = "<p style='color:#888'>Kho bài học của Phủ này hiện đang trống. Quản trị viên vui lòng vào Ngự Thư Phòng để thêm bài.</p>";
        container.innerHTML = htmlLib; if(syllabusDiv) syllabusDiv.innerHTML = htmlArena;
        if(userData.role === 'teacher') { document.querySelectorAll('.lib-card').forEach(card => { card.addEventListener('mouseenter', () => { let btn = card.querySelector('.btn-delete-lib'); if(btn) btn.style.display = 'block'; }); card.addEventListener('mouseleave', () => { let btn = card.querySelector('.btn-delete-lib'); if(btn) btn.style.display = 'none'; }); }); }
    }, err => {
        container.innerHTML = `<p style="color:#ff5252;">Lỗi Tường Lửa: ${err.message}<br>Vui lòng vào tab Cài Đặt đăng nhập hệ thống.</p>`;
    });
}

function getCurrentWeekStr() { let d = new Date(); d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7)); let yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1)); let weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7); return d.getUTCFullYear() + "-W" + weekNo; }
function triggerConfetti() { for (let i = 0; i < 60; i++) { let conf = document.createElement('div'); conf.className = 'confetti'; conf.style.left = Math.random() * 100 + 'vw'; conf.style.backgroundColor = ['#fbc02d', '#ff5722', '#00c853', '#2962ff', '#e040fb'][Math.floor(Math.random() * 5)]; conf.style.animationDuration = (Math.random() * 2 + 2) + 's'; document.body.appendChild(conf); setTimeout(() => conf.remove(), 4000); } }
function loginWithGoogle() { if (!auth) return; var provider = new firebase.auth.GoogleAuthProvider(); auth.signInWithPopup(provider); }
function loginWithEmail() { if (!auth) return; const email = document.getElementById('loginEmail').value.trim(); const pass = document.getElementById('loginPass').value.trim(); if (!email || !pass) return alert("Vui lòng cung cấp đầy đủ thông tin truy cập!"); auth.signInWithEmailAndPassword(email, pass).catch(err => alert("Lỗi: " + err.message)); }
function registerWithEmail() { if (!auth) return; const email = document.getElementById('loginEmail').value.trim(); const pass = document.getElementById('loginPass').value.trim(); if (!email || !pass) return alert("Vui lòng cung cấp đầy đủ thông tin để đăng ký!"); auth.createUserWithEmailAndPassword(email, pass).then(() => alert("Đăng ký thành công!")).catch(err => alert("Lỗi: " + err.message)); }

function saveDisplayName() { const name = document.getElementById('displayNameInput').value.trim(); if (!name) return alert("Thôngত্তি tin tên không được để trống!"); userData.displayName = name; userData.email = currentUser.email; db.collection('vocab_users').doc(currentUser.uid).set(userData, {merge: true}).then(() => { document.getElementById('nameModal').classList.remove('active'); updateUI(); setupRealmListeners(); }); }

function syncStatsToCloud() { if (currentUser && db) { db.collection('vocab_users').doc(currentUser.uid).update({ gold: userData.gold, xp: userData.xp, lifetime_xp: userData.lifetime_xp || 0, realm: userData.realm, streak: userData.streak, displayName: userData.displayName, magnifyingGlass: userData.magnifyingGlass || 0, vouchers: userData.vouchers || [], streakIcon: userData.streakIcon || '🔥', theme: userData.theme || 'theme_default', purchasedItems: userData.purchasedItems || [], weeklyXp: userData.weeklyXp || 0, lastWeekXp: userData.lastWeekXp || 0, currentWeekStr: userData.currentWeekStr, highestWeeklyXp: userData.highestWeeklyXp || 0, hasBrokenRecordThisWeek: userData.hasBrokenRecordThisWeek || false, potionX3Expiry: userData.potionX3Expiry || null, timeMachine: userData.timeMachine || null, mastered_words: userData.mastered_words || 0, mastered_lessons: userData.mastered_lessons || [] }); updateUI(); } }

function applyTheme(themeName) { document.body.classList.remove('theme-aurora', 'theme-snow', 'theme-royal'); if (themeName && themeName !== 'theme_default') { document.body.classList.add(themeName); if(themeName === 'theme-snow' || themeName === 'theme-aurora' || themeName === 'theme-royal') { document.body.classList.remove('dark-mode'); document.getElementById('themeToggleBtn').innerText = '🌙'; localStorage.setItem('darkMode', 'false'); } } }

function updateUI() {
    document.getElementById('ui-gold').innerText = userData.gold; document.getElementById('ui-xp').innerText = userData.xp; document.getElementById('ui-lifetime-xp').innerText = userData.lifetime_xp || 0; document.getElementById('sidebarRealm').innerText = `🌍 Phủ: ${userData.realm || "---"}`; document.getElementById('ui-streak').innerText = userData.streak; document.getElementById('sidebarName').innerText = userData.displayName || "Khách"; document.getElementById('ui-glass-count').innerText = userData.magnifyingGlass || 0; if (document.getElementById('ui-streak-icon')) document.getElementById('ui-streak-icon').innerText = userData.streakIcon || '🔥';
    if(document.getElementById('ui-mastered-words')) document.getElementById('ui-mastered-words').innerText = userData.mastered_words || 0;
    if(document.getElementById('ui-mastered-lessons')) document.getElementById('ui-mastered-lessons').innerText = (userData.mastered_lessons || []).length;
    
    let vText = "Trống"; if(userData.vouchers && userData.vouchers.length > 0) vText = userData.vouchers.map(v => `-${v}%`).join(', '); if(document.getElementById('ui-vouchers')) document.getElementById('ui-vouchers').innerText = vText;
    let todayStr = new Date().toLocaleDateString('en-GB'); let bbLeft = 3; if (userData.lastBlindBoxDate === todayStr) bbLeft = 3 - (userData.blindBoxCount || 0); if(document.getElementById('ui-wheel-left')) document.getElementById('ui-wheel-left').innerText = bbLeft;
    
    const badge = document.getElementById('sidebarRole'); 
    let forceBtn = document.getElementById('adminForceEndBtn'); 

    if(userData.role === 'teacher') { 
        badge.className = 'user-badge badge-teacher'; 
        badge.innerText = '👨‍🏫 Quản trị viên'; 
        document.getElementById('nav-creator').style.display = 'flex'; 
        document.getElementById('nav-arena').style.display = 'flex'; 
        if(forceBtn) forceBtn.style.display = 'block'; 
    } else { 
        badge.className = 'user-badge badge-student'; 
        badge.innerText = '👨‍🎓 Học Sinh'; 
        document.getElementById('nav-creator').style.display = 'none'; 
        document.getElementById('nav-arena').style.display = 'none'; 
        if(forceBtn) forceBtn.style.display = 'none'; 
    }            
    let itemsToCheck = ['streak_snow', 'streak_peach', 'streak_soccer', 'streak_basket', 'streak_cap', 'theme_aurora', 'theme_snow', 'theme_royal']; if(userData.purchasedItems) { itemsToCheck.forEach(item => { let btn = document.getElementById('btn-' + item); let priceTag = document.getElementById('price-' + item); if(btn && priceTag) { if(userData.purchasedItems.includes(item)) { btn.innerText = "Dùng Ngay"; btn.style.background = "#9e9e9e"; priceTag.innerText = "Đã sở hữu"; } else { btn.innerText = "Đổi Ngay"; btn.style.background = ""; let price = 5000; if(item === 'theme_aurora' || item === 'theme_snow') price = 15000; else if(item === 'theme_royal') price = 20000; priceTag.innerText = "🪙 " + price; } } }); }
    if (document.getElementById('ui-weekly-xp')) document.getElementById('ui-weekly-xp').innerText = userData.weeklyXp || 0; if (document.getElementById('ui-highest-xp')) document.getElementById('ui-highest-xp').innerText = userData.highestWeeklyXp || 0;
    let progressText = "Đang tích lũy"; let progressColor = "#888"; let lastW = userData.lastWeekXp || 0; let currW = userData.weeklyXp || 0; if (lastW > 0) { let ratio = ((currW - lastW) / lastW) * 100; if (ratio > 20) { progressText = "🔥 Bứt phá (>" + Math.round(ratio) + "%)"; progressColor = "#ff5722"; } else if (ratio >= -5 && ratio <= 20) { progressText = "📈 Ổn định (" + (ratio > 0 ? "+" : "") + Math.round(ratio) + "%)"; progressColor = "#00c853"; } else if (ratio >= -20 && ratio < -5) { progressText = "⚠️ Chững lại (" + Math.round(ratio) + "%)"; progressColor = "#fbc02d"; } else { progressText = "❄️ Sa sút (" + Math.round(ratio) + "%)"; progressColor = "#2962ff"; } } if (document.getElementById('ui-weekly-progress')) { document.getElementById('ui-weekly-progress').innerText = progressText; document.getElementById('ui-weekly-progress').style.color = progressColor; }
    let tmEl = document.getElementById('shop-time-machine'); if (userData.timeMachine && userData.timeMachine.status === 'available') { let now = Date.now(); if (now - userData.timeMachine.lostTimestamp <= 48 * 3600 * 1000) { tmEl.style.display = 'block'; let cost = userData.timeMachine.missedDays * 10000; document.getElementById('price-time-machine').innerText = `🪙 ${cost}`; let attempts = userData.timeMachine.lastAttemptDate === todayStr ? userData.timeMachine.attemptsToday : 0; document.getElementById('btn-time-machine').innerText = `Bù ${userData.timeMachine.missedDays} ngày (${3 - attempts} lượt)`; if (attempts >= 3) { document.getElementById('btn-time-machine').innerText = `Hết lượt`; document.getElementById('btn-time-machine').style.background = "#9e9e9e"; } else { document.getElementById('btn-time-machine').style.background = "linear-gradient(45deg, #9c27b0, #ab47bc)"; } } else { tmEl.style.display = 'none'; } } else if (userData.timeMachine && userData.timeMachine.status === 'in_progress') { tmEl.style.display = 'block'; document.getElementById('price-time-machine').innerText = `Đang kích hoạt`; let currentDay = (userData.timeMachine.daysRecovered || 0) + 1; document.getElementById('btn-time-machine').innerText = `Bù ngày ${currentDay}/${userData.timeMachine.missedDays} ▶`; document.getElementById('btn-time-machine').style.background = "linear-gradient(45deg, #d32f2f, #f44336)"; } else { tmEl.style.display = 'none'; }
    if (typeof renderBracket === 'function') renderBracket();
    if (typeof renderAchievements === 'function') renderAchievements();
}

function renderAchievements() {
    const container = document.getElementById('achieveGrid');
    if (!container) return;
    const mw = userData.mastered_words || 0;
    const badges = [
        { id: 'a1', title: 'Tân Binh', target: 30, icon: '🐣' },
        { id: 'a2', title: 'Người Sưu Tập', target: 50, icon: '📚' },
        { id: 'a3', title: 'Bậc Thầy Từ Vựng', target: 100, icon: '🧙‍♂️' },
        { id: 'a4', title: 'Chuyên Gia', target: 150, icon: '🎓' },
        { id: 'a5', title: 'Học Giả', target: 300, icon: '📖' },
        { id: 'a6', title: 'Huyền Thoại', target: 500, icon: '👑' }
    ];
    
    let html = '';
    badges.forEach(b => {
        let isUnlocked = mw >= b.target;
        let progress = Math.min((mw / b.target) * 100, 100);
        let classState = isUnlocked ? 'unlocked' : 'locked';
        let iconColor = isUnlocked ? '' : 'style="opacity: 0.5"';
        
        html += `
            <div class="achieve-card ${classState}">
                <div class="achieve-icon" ${iconColor}>${b.icon}</div>
                <div class="achieve-info">
                    <div class="achieve-title">${b.title}</div>
                    <div class="achieve-desc">Thành thạo ${b.target} từ vựng</div>
                    <div class="achieve-progress-bg">
                        <div class="achieve-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="achieve-progress-text">${mw}/${b.target}</div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

let isSpinning = false;
function openWheelModal() {
    if (!currentUser) return alert("Vui lòng thực hiện đăng nhập để dùng chức năng này.");
    let todayStr = new Date().toLocaleDateString('en-GB');
    if (userData.lastBlindBoxDate !== todayStr) { userData.blindBoxCount = 0; userData.lastBlindBoxDate = todayStr; }
    document.getElementById('ui-wheel-left').innerText = 3 - (userData.blindBoxCount || 0);
    document.getElementById('wheelModal').classList.add('active');
}

function spinWheel() {
    if (isSpinning) return;
    if (!currentUser) return alert("Vui lòng thực hiện đăng nhập để dùng chức năng này.");
    let todayStr = new Date().toLocaleDateString('en-GB');
    if (userData.lastBlindBoxDate !== todayStr) { userData.blindBoxCount = 0; userData.lastBlindBoxDate = todayStr; }
    if ((userData.blindBoxCount || 0) >= 3) return alert("Bạn đã dùng hết giới hạn 3 lượt quay của hôm nay. Vui lòng trở lại vào ngày mai.");
    if (userData.gold < 150) return alert("Số dư Vàng hiện tại không đủ thao tác.");
    
    if(confirm("Thanh toán 150 Vàng để kích hoạt Vòng Quay?")) {
        isSpinning = true;
        userData.gold -= 150; userData.blindBoxCount = (userData.blindBoxCount || 0) + 1;
        document.getElementById('ui-wheel-left').innerText = 3 - userData.blindBoxCount;
        updateUI();
        
        let r = Math.random(); 
        let sliceIndex = 0; let msg = ""; if(!userData.vouchers) userData.vouchers = [];
        
        if (r < 0.10) { sliceIndex = 0; msg = "🥺 Tiếc quá! Bạn không trúng giải thưởng nào đợt này."; }
        else if (r < 0.30) { sliceIndex = 1; userData.gold += 50; msg = "🪙 Bạn nhận được 50 Vàng từ hệ thống!"; }
        else if (r < 0.50) { sliceIndex = 2; userData.xp += 150; msg = "⭐ Chúc mừng bạn đã tích lũy thêm 150 XP!"; }
        else if (r < 0.70) { sliceIndex = 3; userData.vouchers.push(30); msg = "🎟️ Bạn đã nhận được 1 Mã Giảm Giá 30%!"; }
        else if (r < 0.80) { sliceIndex = 4; userData.vouchers.push(50); msg = "🎟️ Rất may mắn! Bạn có 1 Mã Giảm Giá 50%!"; }
        else if (r < 0.85) { sliceIndex = 5; userData.hasShield = true; msg = "🛡️ Chúc mừng! Bạn nhận được 1 Bùa Bảo Hộ!"; }
        else if (r < 0.90) { sliceIndex = 6; userData.magnifyingGlass = (userData.magnifyingGlass||0) + 1; msg = "🔍 Vật phẩm hiếm: 1 Kính Lúp Thám Tử đã thuộc về bạn!"; }
        else { sliceIndex = 7; msg = "🥺 Tiếc quá! Vòng quay dừng lại ở ô không may mắn."; }
        
        let randomOffset = Math.floor(Math.random() * 40) - 20; 
        let targetDegree = 3600 - (sliceIndex * 45 + 22.5) + randomOffset; 

        let wheelEl = document.getElementById('spinningWheel');
        wheelEl.style.transition = 'none';
        wheelEl.style.transform = `rotate(0deg)`;
        void wheelEl.offsetWidth; 

        wheelEl.style.transition = 'transform 4.2s cubic-bezier(0.17, 0.67, 0.1, 1)';
        wheelEl.style.transform = `rotate(${targetDegree}deg)`;
        
        setTimeout(() => {
            isSpinning = false;
            userData.vouchers.sort((a,b) => b - a); 
            
            db.collection('vocab_users').doc(currentUser.uid).update({
                gold: userData.gold, xp: userData.xp, vouchers: userData.vouchers,
                hasShield: userData.hasShield, magnifyingGlass: userData.magnifyingGlass,
                blindBoxCount: userData.blindBoxCount, lastBlindBoxDate: userData.lastBlindBoxDate
            }).then(() => { updateUI(); alert(msg); });
        }, 4400); 
    }
}

function buyItem(itemType, basePrice) { 
    if (!currentUser) return alert("Hệ thống yêu cầu phải đăng nhập mới sử dụng tính năng giao dịch!"); 
    
    if (['streak_snow', 'streak_peach', 'streak_soccer', 'streak_basket', 'streak_cap', 'theme_aurora', 'theme_snow', 'theme_royal'].includes(itemType)) {
        if (userData.purchasedItems && userData.purchasedItems.includes(itemType)) {
            let updates = {};
            if (itemType.startsWith('streak_')) {
                if (itemType === 'streak_snow') updates.streakIcon = '❄️';
                if (itemType === 'streak_peach') updates.streakIcon = '🌸';
                if (itemType === 'streak_soccer') updates.streakIcon = '⚽';
                if (itemType === 'streak_basket') updates.streakIcon = '🏀';
                if (itemType === 'streak_cap') updates.streakIcon = '🎓';
                userData.streakIcon = updates.streakIcon;
            } else if (itemType.startsWith('theme_')) {
                updates.theme = itemType.replace('_', '-');
                userData.theme = updates.theme;
                applyTheme(userData.theme);
            }
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
    
    let bestVoucher = 0; let vIndex = -1;
    if(userData.vouchers && userData.vouchers.length > 0) {
        bestVoucher = userData.vouchers[0]; vIndex = 0;
    }
    
    let finalPrice = basePrice;
    if (bestVoucher > 0) { finalPrice = Math.floor(basePrice * (100 - bestVoucher) / 100); }
    
    if (userData.gold < finalPrice) return alert(`Giao dịch thất bại! Bạn cần thanh toán ${finalPrice} 🪙.`);
    
    let confirmMsg = `Xác nhận thanh toán ${finalPrice} Vàng cho vật phẩm này?`;
    if (bestVoucher > 0) confirmMsg = `🎟️ Hệ thống đang tự áp dụng ưu đãi Giảm ${bestVoucher}% từ kho!\nSố dư yêu cầu giảm từ ${basePrice} xuống còn ${finalPrice} Vàng. Mua ngay?`;
    
    if(confirm(confirmMsg)) {
        let updates = { gold: userData.gold - finalPrice };
        if (vIndex > -1) { 
            userData.vouchers.splice(vIndex, 1); 
            updates.vouchers = userData.vouchers; 
        }
        
        if (itemType === 'rename') { let newName = prompt("Nhập tên hiển thị bạn mong muốn:"); if (!newName || newName.trim() === "") return alert("Quy trình hủy do thông tin tên không hợp lệ!"); updates.displayName = newName.trim(); }
        if (itemType === 'shield') updates.hasShield = true; 
        if (itemType === 'potion') updates.potionExpiry = Date.now() + 86400000; 
        if (itemType === 'potion_x3') updates.potionX3Expiry = Date.now() + 10800000; 
        if (itemType === 'mask') updates.maskExpiry = Date.now() + 86400000; 
        if (itemType === 'glass') updates.magnifyingGlass = (userData.magnifyingGlass || 0) + 1;
        
        if (['streak_snow', 'streak_peach', 'streak_soccer', 'streak_basket', 'streak_cap', 'theme_aurora', 'theme_snow', 'theme_royal'].includes(itemType)) {
            if (!userData.purchasedItems) userData.purchasedItems = [];
            userData.purchasedItems.push(itemType);
            updates.purchasedItems = userData.purchasedItems;
            
            if (itemType.startsWith('streak_')) {
                if (itemType === 'streak_snow') updates.streakIcon = '❄️';
                if (itemType === 'streak_peach') updates.streakIcon = '🌸';
                if (itemType === 'streak_soccer') updates.streakIcon = '⚽';
                if (itemType === 'streak_basket') updates.streakIcon = '🏀';
                if (itemType === 'streak_cap') updates.streakIcon = '🎓';
            } else if (itemType.startsWith('theme_')) {
                updates.theme = itemType.replace('_', '-');
            }
        }
        
        db.collection('vocab_users').doc(currentUser.uid).update(updates).then(() => {
            userData.gold -= finalPrice; 
            if(updates.hasShield) userData.hasShield = true; 
            if(updates.potionExpiry) userData.potionExpiry = updates.potionExpiry; 
            if(updates.potionX3Expiry) userData.potionX3Expiry = updates.potionX3Expiry; 
            if(updates.maskExpiry) userData.maskExpiry = updates.maskExpiry; 
            if(updates.magnifyingGlass) userData.magnifyingGlass = updates.magnifyingGlass; 
            if(updates.displayName) userData.displayName = updates.displayName;
            if(updates.streakIcon) userData.streakIcon = updates.streakIcon;
            if(updates.theme) { userData.theme = updates.theme; applyTheme(userData.theme); }
            if(updates.purchasedItems) userData.purchasedItems = updates.purchasedItems;
            
            updateUI(); 
            if (itemType === 'rename') fetchLeaderboard(); 
            let anim = document.getElementById('rewardAnim'); 
            anim.innerText = `🛒 Giao dịch thành công! (Còn dư: ${userData.gold} 🪙)`; 
            anim.classList.add('show'); setTimeout(() => anim.classList.remove('show'), 3000);
        });
    }
}

function openHOFModal() { 
    document.getElementById('hofModal').classList.add('active'); 
}

function switchLeagueTab(league) {
    currentLeagueView = league;
    document.getElementById('btn-tab-c1').style.background = league === 'c1' ? '#ffd700' : '#555';
    document.getElementById('btn-tab-c1').style.color = league === 'c1' ? '#000' : '#ccc';
    document.getElementById('btn-tab-c1').style.boxShadow = league === 'c1' ? '0 0 10px #ffd700' : 'none';
    
    document.getElementById('btn-tab-c2').style.background = league === 'c2' ? '#c0c0c0' : '#555';
    document.getElementById('btn-tab-c2').style.color = league === 'c2' ? '#000' : '#ccc';
    document.getElementById('btn-tab-c2').style.boxShadow = league === 'c2' ? '0 0 10px #c0c0c0' : 'none';
    
    document.getElementById('leagueTitle').innerText = league === 'c1' ? "🏆 MES CHAMPIONS LEAGUE ELITE 🏆" : "🥈 MES CHAMPIONS LEAGUE TWO 🥈";
    document.getElementById('leagueTitle').style.color = league === 'c1' ? '#ffd700' : '#c0c0c0';
    renderBracket();
}

let windowLeagueToSchedule = "";
let windowStageToSchedule = "";
let windowIndexToSchedule = 0;

function openScheduleModal(league, stageKey, matchIndex) {
    windowLeagueToSchedule = league; windowStageToSchedule = stageKey; windowIndexToSchedule = matchIndex;
    document.getElementById('scheduleModal').classList.add('active');
}

function saveSchedule() {
    let val = document.getElementById('scheduleInput').value;
    if(!val) return alert("Vui lòng thiết lập thời gian cho trận đấu!");
    let ts = new Date(val).getTime();
    let key = `tournament_status/${currentRealm}/${windowLeagueToSchedule}_bracket/${windowStageToSchedule}`;
    if(windowStageToSchedule !== 'sfl' && windowStageToSchedule !== 'sfr' && windowStageToSchedule !== 'final' && windowStageToSchedule !== 'third_place' && windowStageToSchedule !== 'super_cup' && windowStageToSchedule !== 'promotion_playoff') {
        key += `/${windowIndexToSchedule}`;
    }
    rtdb.ref(key).update({ schedule: ts }).then(() => {
        alert("Đã cập nhật lịch thành công. Hệ thống sẽ tự động mở phòng vào đúng giờ.");
        document.getElementById('scheduleModal').classList.remove('active');
    });
}

let isUnderSurveillance = false;
let surveillanceData = null;

function showAntiCheatModal(league, stageKey, matchIndex, playerSlot) {
    let fb = league === 'c1' ? currentC1Data : currentC2Data;
    let m = fb[stageKey];
    if (Array.isArray(m)) m = m[matchIndex];
    
    surveillanceData = {
        league: league, stageKey: stageKey, matchIndex: matchIndex, playerSlot: playerSlot,
        myName: playerSlot === 'p1' ? m.p1 : m.p2,
        oppName: playerSlot === 'p1' ? m.p2 : m.p1
    };
    document.getElementById('antiCheatModal').classList.add('active');
}

function confirmJoinMatch() {
    document.getElementById('antiCheatModal').classList.remove('active');
    if (!surveillanceData) return;
    
    let key = `tournament_status/${currentRealm}/${surveillanceData.league}_bracket/${surveillanceData.stageKey}`;
    if (!['sfl', 'sfr', 'final', 'third_place', 'super_cup', 'promotion_playoff'].includes(surveillanceData.stageKey)) { 
        key += `/${surveillanceData.matchIndex}`; 
    }
    let updateData = {}; updateData[surveillanceData.playerSlot + "_ready"] = true;
    rtdb.ref(key).update(updateData).then(() => {
        isUnderSurveillance = true; 
        rtdb.ref(`active_pvp_match/${currentRealm}`).onDisconnect().update({ status: 'finished', winner: surveillanceData.oppName });
    });
}

function executeAntiCheatPunishment() {
    if (!isUnderSurveillance || !surveillanceData) return;
    isUnderSurveillance = false; 
    
    let key = `tournament_status/${currentRealm}/${surveillanceData.league}_bracket/${surveillanceData.stageKey}`;
    if (!['sfl', 'sfr', 'final', 'third_place', 'super_cup', 'promotion_playoff'].includes(surveillanceData.stageKey)) { 
        key += `/${surveillanceData.matchIndex}`; 
    }
    
    let p1_s = surveillanceData.playerSlot === 'p1' ? 0 : 2;
    let p2_s = surveillanceData.playerSlot === 'p2' ? 0 : 2;

    rtdb.ref(key).update({ winner: surveillanceData.oppName, p1_set: p1_s, p2_set: p2_s });
    
    rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(snap => {
        let m = snap.val();
        if(m && m.status !== 'finished' && (m.p1 === surveillanceData.myName || m.p2 === surveillanceData.myName)) {
            rtdb.ref(`active_pvp_match/${currentRealm}`).update({ status: 'finished', winner: surveillanceData.oppName, reason: 'anti_cheat', violator: surveillanceData.myName });
        }
    });
}

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'hidden' && isUnderSurveillance) { 
        executeAntiCheatPunishment(); 
    }
});

window.addEventListener("blur", () => {
    if (isUnderSurveillance) {
        executeAntiCheatPunishment();
    }
});

function forceEndMatch() {
    if(userData.role !== 'teacher') return;
    let tempSurveillance = isUnderSurveillance;
    isUnderSurveillance = false; 
    
    if(!confirm("Bạn có chắc chắn muốn kết thúc ép buộc trận đấu này? Thao tác này sẽ giải tán võ đài và giải phóng cả 2 tuyển thủ khỏi tình trạng bị kẹt.")) {
        isUnderSurveillance = tempSurveillance; 
        return;
    }
    
    rtdb.ref(`active_pvp_match/${currentRealm}`).update({ 
        status: 'finished', 
        winner: 'HỦY BỞI QUẢN TRỊ',
        reason: 'force_end'
    }).then(() => {
        document.getElementById('pvpModal').classList.remove('active');
        alert("Đã giải tán võ đài thành công!");
        setTimeout(() => rtdb.ref(`active_pvp_match/${currentRealm}`).remove(), 2000);
    });
}

function surrenderMatch() {
    let tempSurveillance = isUnderSurveillance;
    isUnderSurveillance = false; 
    
    if(confirm("Bạn có chắc chắn muốn rút lui khỏi trận này? Hệ thống sẽ xử thua!")) {
        window.isSpectating = false;
        let myName = userData.displayName;
        rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(snap => {
            let m = snap.val();
            if(m && m.status !== 'finished') {
                let oppName = (m.p1 === myName) ? m.p2 : m.p1;
                
                if(m.stage && m.match_idx !== undefined && m.league) {
                    let key = `tournament_status/${currentRealm}/${m.league}_bracket/${m.stage}`;
                    if(!['sfl', 'sfr', 'final', 'third_place', 'super_cup', 'promotion_playoff'].includes(m.stage)) { 
                        key += `/${m.match_idx}`; 
                    }
                    let p1s = (oppName === m.p1) ? 2 : 0;
                    let p2s = (oppName === m.p2) ? 2 : 0;
                    rtdb.ref(key).update({ winner: oppName, p1_set: p1s, p2_set: p2s });
                }

                rtdb.ref(`active_pvp_match/${currentRealm}`).update({ status: 'finished', winner: oppName, reason: 'surrender' });
            }
        });
    } else {
        isUnderSurveillance = tempSurveillance; 
    }
}

    function checkWalkover(m, stage, idx, league) {
        if(m && m.p1 && m.p2 && m.p1 !== "---" && m.p2 !== "---" && !m.winner && m.schedule) {
            let diff = m.schedule - now;
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
    currentFullBracketData = currentLeagueView === 'c1' ? currentC1Data : currentC2Data;
    
    if (!currentFullBracketData) {
        document.getElementById('bracketMatches').innerHTML = '<div style="color:#888; text-align:center; width:100%;">Giai đoạn này hiện tại chưa có dữ liệu.</div>';
        return;
    }
    
    document.getElementById('bracketBoard').style.display = 'block';
    document.getElementById('bracketStatus').innerText = `GIAI ĐOẠN: Sơ đồ loại trực tiếp | Trạng thái: Đang tiến hành`;
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
        const colTitle = document.createElement('div'); colTitle.style.cssText = 'font-size: 12px; font-weight: bold; color: #ffd700; text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #ffd700; padding-bottom: 5px;'; colTitle.innerText = col.title; colEl.appendChild(colTitle);

        if (col.key === 'center_col') {
            if (currentLeagueView === 'c1' && currentFullBracketData.super_cup) {
                let scLabel = document.createElement('div'); scLabel.innerHTML = '<div style="font-size:12px; color:#ff1744; margin-top:5px; margin-bottom:5px; font-weight:900; animation: pulse 1.5s infinite;">🔥 SIÊU CÚP MÙA GIẢI</div>'; colEl.appendChild(scLabel);
                colEl.appendChild(createMatchBox(currentFullBracketData.super_cup, 'super_cup', 0, currentLeagueView));
            }
            if (currentFullBracketData.final) {
                let fLabel = document.createElement('div'); fLabel.innerHTML = '<div style="font-size:12px; color:#ffd700; margin-top:15px; margin-bottom:5px; font-weight:bold;">🥇 CHUNG KẾT</div>'; colEl.appendChild(fLabel);
                colEl.appendChild(createMatchBox(currentFullBracketData.final, 'final', 0, currentLeagueView));
            }
            if (currentFullBracketData.third_place && (currentFullBracketData.sfl || currentFullBracketData.sfr)) { 
                let tLabel = document.createElement('div'); tLabel.innerHTML = '<div style="font-size:12px; color:#cd7f32; margin-top:15px; margin-bottom:5px; font-weight:bold;">🥉 TRANH HẠNG 3</div>'; colEl.appendChild(tLabel);
                colEl.appendChild(createMatchBox(currentFullBracketData.third_place, 'third_place', 0, currentLeagueView));
            }
            if (currentLeagueView === 'c1' && currentFullBracketData.promotion_playoff) {
                let poLabel = document.createElement('div'); poLabel.innerHTML = '<div style="font-size:12px; color:#00e676; margin-top:15px; margin-bottom:5px; font-weight:900;">⚔️ PLAY-OFF THĂNG HẠNG</div>'; colEl.appendChild(poLabel);
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
    const isFinished = !!m.winner;
    let p1Name = m.p1 || '---'; let p2Name = m.p2 || '---';
    let p1Class = ''; let p2Class = ''; let p1Star = ''; let p2Star = '';
    
    let s1Text = (m.p1_set !== undefined) ? `<span style="float:right; background:rgba(0,0,0,0.4); padding:2px 6px; border-radius:4px; font-family:monospace; margin-left:8px;">${m.p1_set}</span>` : '';
    let s2Text = (m.p2_set !== undefined) ? `<span style="float:right; background:rgba(0,0,0,0.4); padding:2px 6px; border-radius:4px; font-family:monospace; margin-left:8px;">${m.p2_set}</span>` : '';

    if (isFinished) {
        if (m.winner === m.p1) { 
            p1Class = 'won'; p2Class = 'lost'; p1Star = ' ⭐'; 
            if(m.p1_set !== undefined) { s1Text = `<span style="float:right; background:#00c853; color:#000; padding:2px 6px; border-radius:4px; font-family:monospace; margin-left:8px;">${m.p1_set}</span>`; s2Text = `<span style="float:right; background:rgba(0,0,0,0.4); padding:2px 6px; border-radius:4px; font-family:monospace; margin-left:8px;">${m.p2_set}</span>`; }
        } 
        else if (m.winner === m.p2) { 
            p2Class = 'won'; p1Class = 'lost'; p2Star = ' ⭐'; 
            if(m.p2_set !== undefined) { s2Text = `<span style="float:right; background:#00c853; color:#000; padding:2px 6px; border-radius:4px; font-family:monospace; margin-left:8px;">${m.p2_set}</span>`; s1Text = `<span style="float:right; background:rgba(0,0,0,0.4); padding:2px 6px; border-radius:4px; font-family:monospace; margin-left:8px;">${m.p1_set}</span>`; }
        }
    }

    let timeInfo = ''; let btnAction = '';
    let validMatch = m.p1 && m.p2 && m.p1 !== "---" && m.p2 !== "---" && !isFinished;
    
    if(validMatch) {
        let now = Date.now();
        if(m.schedule) {
            let diff = m.schedule - now;
            if(diff > 0) {
                let d = new Date(m.schedule);
                timeInfo = `<div class="match-time">🕒 Lịch: ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')} ${d.getDate()}/${d.getMonth()+1}</div>`;
            } else if (diff <= 0 && diff > -600000) { 
                let minsLeft = Math.floor((600000 + diff)/60000) + 1;
                timeInfo = `<div class="match-time" style="color:#00e676; animation: pulse 1s infinite;">🟢 ĐANG MỞ (Còn ${minsLeft}p)</div>`;
                
                let isP1 = userData.displayName === m.p1; let isP2 = userData.displayName === m.p2;
                
                if(isP1 && !m.p1_ready) btnAction = `<button class="btn-join" style="display:block;" onclick="showAntiCheatModal('${league}', '${stageKey}', ${matchIndex}, 'p1')">🚪 VÀO PHÒNG (P1)</button>`;
                if(isP2 && !m.p2_ready) btnAction = `<button class="btn-join" style="display:block;" onclick="showAntiCheatModal('${league}', '${stageKey}', ${matchIndex}, 'p2')">🚪 VÀO PHÒNG (P2)</button>`;
                
                if(m.p1_ready && m.p2_ready) {
                    timeInfo = `<div class="match-time" style="color:#ff5252;">⚔️ ĐANG THI ĐẤU...</div>`;
                    if(userData.role === 'teacher' || isP2) {
                        rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(s => {
                            let ac = s.val();
                            if(!ac || ac.stage !== stageKey || ac.league !== league || ac.status === 'finished') {
                                adminStartPvP(league, stageKey, matchIndex, m.p1, m.p2);
                            }
                        });
                    }
                }
            } else { 
                timeInfo = `<div class="match-time" style="color:#ff5252;">⏳ Hệ thống đang cập nhật kết quả...</div>`;
            }
        }
        
        if (userData.role === 'teacher') {
            let safeP1 = (m.p1 || '').replace(/'/g, "\\'");
            let safeP2 = (m.p2 || '').replace(/'/g, "\\'");
            
            btnAction += `<button class="btn-schedule" style="display:block;" onclick="openScheduleModal('${league}', '${stageKey}', ${matchIndex})">⏰ LÊN LỊCH</button>`;
            btnAction += `<button class="btn-fight" style="display:block;" onclick="adminStartPvP('${league}', '${stageKey}', ${matchIndex}, '${safeP1}', '${safeP2}')">⚔️ BẮT ĐẦU NGAY</button>`;
        }
    }

    let p1Badge = m.p1_ready && !isFinished ? `<span class="ready-badge">✅</span>` : '';
    let p2Badge = m.p2_ready && !isFinished ? `<span class="ready-badge">✅</span>` : '';

    const matchEl = document.createElement('div'); matchEl.className = 'bracket-match';
    matchEl.innerHTML = `
        <div class="player-name ${p1Class}" style="text-align: left;"><span>${p1Name}${p1Star}</span> ${p1Badge}${s1Text}</div>
        <div class="vs-text">VS</div>
        <div class="player-name ${p2Class}" style="text-align: left;"><span>${p2Name}${p2Star}</span> ${p2Badge}${s2Text}</div>
        ${timeInfo}
        ${btnAction}
    `;
    return matchEl;
}

function setupRealmListeners() {
    if(rtdb && currentRealm) {
        rtdb.ref('tournament_status').off(); 
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
                let html = ''; 
                hof.forEach(item => { 
                    let c1 = item.c1 || item.name || "---"; let c2 = item.c2 || "---"; let sc = item.sc || (item.name ? item.name : "---"); 
                    html += `<div style="background: rgba(255,255,255,0.05); margin-bottom: 15px; border-radius: 8px; padding: 15px; border-left: 4px solid #ffd700; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"><div style="color: #ccc; font-size: 14px; margin-bottom: 12px; font-weight: bold; text-align: center; border-bottom: 1px dashed rgba(255,215,0,0.3); padding-bottom: 8px;">MÙA ${item.season} - Cập nhật: ${item.date || ""}</div><div style="display: flex; justify-content: space-between; text-align: center; gap: 10px;"><div style="flex: 1;"><div style="color: #ffd700; font-size: 12px; font-weight: 900; margin-bottom: 5px;">🏆 C1 ELITE</div><div style="color: #fff; font-size: 15px; font-weight: bold;">${c1}</div></div><div style="flex: 1; border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1);"><div style="color: #c0c0c0; font-size: 12px; font-weight: 900; margin-bottom: 5px;">🥈 C2 TWO</div><div style="color: #fff; font-size: 15px; font-weight: bold;">${c2}</div></div><div style="flex: 1;"><div style="color: #ff5252; font-size: 12px; font-weight: 900; margin-bottom: 5px;">🔥 SIÊU CÚP</div><div style="color: #fff; font-size: 15px; font-weight: bold;">${sc}</div></div></div></div>`; 
                }); 
                container.innerHTML = html; 
            } 
        });

        rtdb.ref(`active_pvp_match/${currentRealm}`).on('value', (snap) => { 
            let m = snap.val(); 
            if(!m) {
                document.getElementById('pvpModal').classList.remove('active');
                window.isSpectating = false;
                return;
            } 
            let isP1 = userData.displayName === m.p1; let isP2 = userData.displayName === m.p2; 
            if(isP1 || isP2 || window.isSpectating) { 
                document.getElementById('pvpModal').classList.add('active'); 
                document.getElementById('pvpP1Name').innerText = m.p1; document.getElementById('pvpP1Correct').innerText = m.p1_score; document.getElementById('pvpP1Set').innerText = m.p1_set; 
                document.getElementById('pvpP2Name').innerText = m.p2; document.getElementById('pvpP2Correct').innerText = m.p2_score; document.getElementById('pvpP2Set').innerText = m.p2_set; 
                document.getElementById('pvpQIndex').innerText = m.q_idx; 
                
                if(m.status === 'playing') { 
                    document.getElementById('pvpWaitMsg').style.display = 'none'; document.getElementById('pvpQuestion').style.display = 'block'; document.getElementById('pvpOptions').style.display = 'grid'; 
                    let modeText = m.mode === 'delay' ? "⏱️ [SET 2]" : m.mode === 'golden' ? "🔥 [BÀN THẮNG VÀNG]" : "🟢 [SET 1]"; 
                    document.getElementById('pvpQuestion').innerHTML = `<div style="font-size:16px; color:#ffeb3b; margin-bottom:10px;">${modeText}</div>` + m.current_q.en; 
                    let myAns = isP1 ? m.p1_ans : (isP2 ? m.p2_ans : ""); 
                    
                    if (window.currentPlayingQIdx !== m.q_idx) { 
                        window.currentPlayingQIdx = m.q_idx; window.localPvPTime = m.time_limit; clearInterval(window.pvpTimer); 
                        if (m.mode === 'normal') { 
                            window.localUnlockTime = Date.now(); revealOptions(m, myAns, [0, 1, 2, 3]); startCountdown(m); 
                        } else { 
                            document.getElementById('pvpTimerBanner').innerText = `🔒 Thiết lập thông...`; 
                            for(let i=0; i<4; i++) { let btn = document.getElementById('pvpOpt'+i); btn.innerText = "???"; btn.style.pointerEvents = 'none'; btn.style.backgroundColor = 'rgba(0,0,0,0.5)'; btn.style.borderColor = '#555'; } 
                            setTimeout(() => { if(m.status==='playing') document.getElementById('pvpOpt0').innerText = m.current_q.opts[0]; }, 1500); 
                            setTimeout(() => { if(m.status==='playing') document.getElementById('pvpOpt1').innerText = m.current_q.opts[1]; }, 3000); 
                            setTimeout(() => { if(m.status==='playing') document.getElementById('pvpOpt2').innerText = m.current_q.opts[2]; }, 4500); 
                            setTimeout(() => { if(m.status==='playing') document.getElementById('pvpOpt3').innerText = m.current_q.opts[3]; }, 6000); 
                            setTimeout(() => { if(m.status==='playing' && myAns === "") { window.localUnlockTime = Date.now(); revealOptions(m, myAns, [0, 1, 2, 3]); startCountdown(m); } }, 6500); 
                        } 
                    } 
                    
                    let oppAns = isP1 ? m.p2_ans : m.p1_ans; let botStatus = document.getElementById('botStatusMsg'); 
                    if(oppAns !== "") { botStatus.innerText = "Đối thủ đã chốt!"; botStatus.style.color = "#ff1744"; } else { botStatus.innerText = "Đang kết nối..."; botStatus.style.color = "#00e676"; } 
                    if (m.p1_ans !== "" && m.p2_ans !== "" && !m.evaluating) { clearInterval(window.pvpTimer); triggerEval(); } 
                } else if (m.status === 'showing_result') { 
                    clearInterval(window.pvpTimer); document.getElementById('pvpTimerBanner').innerText = `⏳ 0s`; 
                    let myWin = (isP1 && m.p1_won_this_round) || (isP2 && m.p2_won_this_round); let waitMsg = document.getElementById('pvpWaitMsg'); waitMsg.style.display = 'block'; 
                    if (myWin) { waitMsg.innerText = "🎉 CHÍNH XÁC & NHANH NHẤT! (+1)"; waitMsg.style.color = "#00e676"; } else { let wasWrong = false; let myAns = isP1 ? m.p1_ans : m.p2_ans; if(myAns !== "" && myAns !== m.current_q.vi) wasWrong = true; if(!wasWrong && myAns !== "") waitMsg.innerText = "❌ CHÍNH XÁC NHƯNG CHẬM HƠN!"; else if(wasWrong) waitMsg.innerText = "❌ SAI RỒI!"; else waitMsg.innerText = "❌ HẾT GIỜ!"; waitMsg.style.color = "#ff1744"; } 
                    document.getElementById('lockOverlay').classList.remove('active'); 
                    for(let i=0; i<4; i++) { let btn = document.getElementById('pvpOpt'+i); btn.style.pointerEvents = 'none'; if (btn.innerText === m.current_q.vi) { btn.style.backgroundColor = '#00c853'; btn.style.borderColor = '#00e676'; btn.style.opacity = '1'; } else { btn.style.opacity = '0.3'; } } 
                } else if (m.status === 'finished') { 
                    isUnderSurveillance = false; clearInterval(window.pvpTimer); document.getElementById('pvpTimerBanner').innerText = `⏳ 0s`;
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
                        }
                    } else if (m.reason === 'surrender') {
                        if(m.winner !== userData.displayName && m.winner !== 'HỦY BỞI QUẢN TRỊ') endMsg = "🚩 BẠN ĐÃ RÚT LUI!\n" + endMsg;
                        else if (m.winner !== 'HỦY BỞI QUẢN TRỊ') endMsg = "🚩 ĐỐI PHƯƠNG ĐẦU HÀNG!\n" + endMsg;
                    } else if (m.reason === 'force_end') {
                        endMsg = "🛑 TRẬN ĐẤU ĐÃ BỊ HỦY BỞI QUẢN TRỊ VIÊN!";
                        document.getElementById('pvpWaitMsg').style.color = '#ff1744';
                    }

                    document.getElementById('pvpWaitMsg').innerText = endMsg; 
                    document.getElementById('pvpQuestion').style.display = 'none'; document.getElementById('pvpOptions').style.display = 'none'; document.getElementById('lockOverlay').classList.remove('active'); 
                    
                    setTimeout(() => {
                        document.getElementById('pvpModal').classList.remove('active');
                        window.isSpectating = false;
                        if (isP1 || userData.role === 'teacher') { rtdb.ref(`active_pvp_match/${currentRealm}`).remove(); }
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
    window.currentLessonTotal = totalVocab || 0;
    document.getElementById('modalFrame').srcdoc = decodeURIComponent(escape(atob(base64))); 
    document.getElementById('previewModal').classList.add('active'); 
}

function closeModal() { document.getElementById('previewModal').classList.remove('active'); document.getElementById('modalFrame').srcdoc = ''; }

function saveSyllabusSelection() { const checks = document.querySelectorAll('input[name="syllabusCheck"]:checked'); let selected = []; checks.forEach(c => selected.push(c.value)); rtdb.ref(`tournament_status/${currentRealm}/syllabus`).set(selected); alert("Cấu hình tài liệu thi đấu đã được xác nhận!"); }

function createBracketObject(players) { let N = players.length; let targetSize = 4; if (N > 4 && N <= 8) targetSize = 8; if (N > 8 && N <= 16) targetSize = 16; let bracket = { final: { p1: "---", p2: "---", winner: "" }, third_place: { p1: "---", p2: "---", winner: "" }, super_cup: { p1: "---", p2: "---", winner: "" }, promotion_playoff: { p1: "---", p2: "---", winner: "" } }; let layout = targetSize === 16 ? [1, 16, 8, 9, 5, 12, 4, 13, 2, 15, 7, 10, 6, 11, 3, 14] : targetSize === 8 ? [1, 8, 4, 5, 2, 7, 3, 6] : [1, 4, 2, 3]; let matches = []; for (let i = 0; i < targetSize; i += 2) { let pA = layout[i] <= N ? players[layout[i] - 1] : "BYE (Đặc cách)"; let pB = layout[i+1] <= N ? players[layout[i+1] - 1] : "BYE (Đặc cách)"; matches.push({ p1: pA, p2: pB, winner: "" }); } if (targetSize === 16) { bracket.r16l = [ matches[0], matches[1], matches[2], matches[3] ]; bracket.r16r = [ matches[4], matches[5], matches[6], matches[7] ]; bracket.qfl = [{ p1: "---", p2: "---", winner: "" }, { p1: "---", p2: "---", winner: "" }]; bracket.qfr = [{ p1: "---", p2: "---", winner: "" }, { p1: "---", p2: "---", winner: "" }]; bracket.sfl = { p1: "---", p2: "---", winner: "" }; bracket.sfr = { p1: "---", p2: "---", winner: "" }; } else if (targetSize === 8) { bracket.qfl = [ matches[0], matches[1] ]; bracket.qfr = [ matches[2], matches[3] ]; bracket.sfl = { p1: "---", p2: "---", winner: "" }; bracket.sfr = { p1: "---", p2: "---", winner: "" }; } else if (targetSize === 4) { bracket.sfl = matches[0]; bracket.sfr = matches[1]; } return bracket; }

async function executeBlindDraw() { 
    if(!confirm(`Xác nhận bốc thăm phân nhánh lại cho giải đấu tại ${currentRealm}?`)) return; 
    const histSnap = await rtdb.ref(`tournament_status/${currentRealm}/history`).once('value'); 
    const history = histSnap.val() || {}; 
    const snapshot = await db.collection('vocab_users').where('realm', '==', currentRealm).get(); 
    let allPlayers = []; snapshot.forEach(doc => allPlayers.push(doc.data())); allPlayers.sort((a,b) => (b.xp || 0) - (a.xp || 0)); 
    let qualifiedPlayers = []; 
    allPlayers.forEach(d => { 
        let dName = d.displayName || "Ẩn danh"; let isChampion = (dName === defendingChampion && defendingChampion !== ""); let isPromoted = (dName === history.promoted_player); 
        if(d.role !== 'teacher' && ((d.streak || 1) >= 3 || isChampion || isPromoted)) { qualifiedPlayers.push(dName); } 
    }); 
    let N = qualifiedPlayers.length; if (N < 4) return alert("Chỉ có " + N + " tài khoản thỏa điều kiện. Yêu cầu tối thiểu là 4."); 
    let c1Size = 0, c2Size = 0; let c1Players = [], c2Players = []; 
    if (N < 8) { c1Size = N; c1Players = qualifiedPlayers; } else { let max_pow = Math.pow(2, Math.floor(Math.log2(N))); c1Size = (N - max_pow < 4 && max_pow > 4) ? max_pow / 2 : max_pow; let c2PoolSize = N - c1Size; c2Size = (c2PoolSize >= 4) ? Math.pow(2, Math.floor(Math.log2(c2PoolSize))) : 0; let autoC1 = []; let forcedC2 = []; let normalPool = []; qualifiedPlayers.forEach(name => { if (name === defendingChampion || name === history.promoted_player) autoC1.push(name); else if (name === history.relegated_player) forcedC2.push(name); else normalPool.push(name); }); c1Players = [...autoC1]; while (c1Players.length < c1Size && normalPool.length > 0) c1Players.push(normalPool.shift()); c2Players = [...forcedC2]; while (c2Players.length < c2Size && normalPool.length > 0) c2Players.push(normalPool.shift()); } 
    let c1Bracket = createBracketObject(c1Players); let c2Bracket = c2Size >= 4 ? createBracketObject(c2Players) : null; 
    let updates = {}; updates[`tournament_status/${currentRealm}/c1_bracket`] = c1Bracket; updates[`tournament_status/${currentRealm}/c2_bracket`] = c2Bracket; 
    rtdb.ref(`tournament_status/${currentRealm}/result`).remove(); rtdb.ref().update(updates).then(() => alert(`Bốc thăm hoàn thiện.\n🏆 Giải Elite: ${c1Players.length} thành viên.\n🥈 Giải Two: ${c2Players.length} thành viên.`)); 
}

async function advanceTournament() { 
    if(!confirm("Tiến hành cập nhật cục diện hiện tại và sắp xếp vòng trong?")) return; 
    const snap = await rtdb.ref(`tournament_status/${currentRealm}`).once('value'); 
    let data = snap.val(); if(!data || !data.c1_bracket) return alert("Chưa có thông tin bảng phân nhánh hợp lệ!"); 
    let updateNeeded = false; let updates = {}; 
    
    function processByes(fb, leaguePrefix) { 
        if(!fb) return; 
        function checkBye(match, stagePath) { 
            if (match && match.winner === "" && match.p1 !== "---" && match.p2 !== "---") { 
                if (match.p2 === "BYE (Đặc cách)") { match.winner = match.p1; updates[`tournament_status/${currentRealm}/${leaguePrefix}_bracket/${stagePath}/winner`] = match.p1; updateNeeded = true; } 
                else if (match.p1 === "BYE (Đặc cách)") { match.winner = match.p2; updates[`tournament_status/${currentRealm}/${leaguePrefix}_bracket/${stagePath}/winner`] = match.p2; updateNeeded = true; } 
            } 
        } 
        if(fb.r16l) fb.r16l.forEach((m,i) => checkBye(m, `r16l/${i}`)); if(fb.r16r) fb.r16r.forEach((m,i) => checkBye(m, `r16r/${i}`)); if(fb.qfl) fb.qfl.forEach((m,i) => checkBye(m, `qfl/${i}`)); if(fb.qfr) fb.qfr.forEach((m,i) => checkBye(m, `qfr/${i}`)); checkBye(fb.sfl, 'sfl'); checkBye(fb.sfr, 'sfr'); 
    } 
    processByes(data.c1_bracket, 'c1'); processByes(data.c2_bracket, 'c2'); 
    
    function advanceLeague(fb, leaguePrefix) { 
        if(!fb) return; 
        if (!fb.final) fb.final = { p1: "---", p2: "---", winner: "" }; if (!fb.third_place) fb.third_place = { p1: "---", p2: "---", winner: "" }; 
        if (fb.r16l && !fb.qfl) fb.qfl = [{ p1: "---", p2: "---", winner: "" }, { p1: "---", p2: "---", winner: "" }]; 
        if (fb.r16r && !fb.qfr) fb.qfr = [{ p1: "---", p2: "---", winner: "" }, { p1: "---", p2: "---", winner: "" }]; 
        if (fb.qfl && !fb.sfl) fb.sfl = { p1: "---", p2: "---", winner: "" }; if (fb.qfr && !fb.sfr) fb.sfr = { p1: "---", p2: "---", winner: "" }; 
        
        function moveWinner(sourceMatch, targetStage, targetIdx, targetPlayerSlot) { 
            if (sourceMatch && sourceMatch.winner && sourceMatch.winner !== "" && fb[targetStage]) { 
                if (Array.isArray(fb[targetStage])) { 
                    if (fb[targetStage][targetIdx][targetPlayerSlot] !== sourceMatch.winner) { fb[targetStage][targetIdx][targetPlayerSlot] = sourceMatch.winner; updateNeeded = true; } 
                } else { 
                    if (fb[targetStage][targetPlayerSlot] !== sourceMatch.winner) { fb[targetStage][targetPlayerSlot] = sourceMatch.winner; updateNeeded = true; } 
                } 
            } 
        } 
        if(fb.r16l) { moveWinner(fb.r16l[0], 'qfl', 0, 'p1'); moveWinner(fb.r16l[1], 'qfl', 0, 'p2'); moveWinner(fb.r16l[2], 'qfl', 1, 'p1'); moveWinner(fb.r16l[3], 'qfl', 1, 'p2'); } 
        if(fb.r16r) { moveWinner(fb.r16r[0], 'qfr', 0, 'p1'); moveWinner(fb.r16r[1], 'qfr', 0, 'p2'); moveWinner(fb.r16r[2], 'qfr', 1, 'p1'); moveWinner(fb.r16r[3], 'qfr', 1, 'p2'); } 
        if(fb.qfl) { moveWinner(fb.qfl[0], 'sfl', 0, 'p1'); moveWinner(fb.qfl[1], 'sfl', 0, 'p2'); } 
        if(fb.qfr) { moveWinner(fb.qfr[0], 'sfr', 0, 'p1'); moveWinner(fb.qfr[1], 'sfr', 0, 'p2'); } 
        if(fb.sfl && fb.sfl.winner && fb.sfl.winner !== "") { moveWinner(fb.sfl, 'final', 0, 'p1'); let loser1 = fb.sfl.winner === fb.sfl.p1 ? fb.sfl.p2 : fb.sfl.p1; if (fb.third_place.p1 !== loser1) { fb.third_place.p1 = loser1; updateNeeded = true; } } 
        if(fb.sfr && fb.sfr.winner && fb.sfr.winner !== "") { moveWinner(fb.sfr, 'final', 0, 'p2'); let loser2 = fb.sfr.winner === fb.sfr.p1 ? fb.sfr.p2 : fb.sfr.p1; if (fb.third_place.p2 !== loser2) { fb.third_place.p2 = loser2; updateNeeded = true; } } 
        updates[`tournament_status/${currentRealm}/${leaguePrefix}_bracket`] = fb; 
    } 
    advanceLeague(data.c1_bracket, 'c1'); advanceLeague(data.c2_bracket, 'c2'); 
    
    let c1Done = data.c1_bracket && data.c1_bracket.final && data.c1_bracket.final.winner !== ""; 
    let c1ThirdDone = data.c1_bracket && data.c1_bracket.third_place && data.c1_bracket.third_place.winner !== ""; 
    let c2Done = data.c2_bracket && data.c2_bracket.final && data.c2_bracket.final.winner !== ""; 
    if (c1Done && c1ThirdDone && c2Done) { 
        let c1Champ = data.c1_bracket.final.winner; let c2Champ = data.c2_bracket.final.winner; let c1Fourth = data.c1_bracket.third_place.winner === data.c1_bracket.third_place.p1 ? data.c1_bracket.third_place.p2 : data.c1_bracket.third_place.p1; 
        if (data.c1_bracket.super_cup && data.c1_bracket.super_cup.p1 === "---") { updates[`tournament_status/${currentRealm}/c1_bracket/super_cup/p1`] = c1Champ; updates[`tournament_status/${currentRealm}/c1_bracket/super_cup/p2`] = c2Champ; updateNeeded = true; alert("🔥 Hệ thống đã xác nhận cặp đấu SIÊU CÚP (Super Cup)!"); } 
        if (data.c1_bracket.promotion_playoff && data.c1_bracket.promotion_playoff.p1 === "---") { updates[`tournament_status/${currentRealm}/c1_bracket/promotion_playoff/p1`] = c2Champ; updates[`tournament_status/${currentRealm}/c1_bracket/promotion_playoff/p2`] = c1Fourth; updateNeeded = true; alert("⚔️ Hệ thống đã xác nhận cặp đấu PLAY-OFF Tranh vé vớt!"); } 
    } 
    if (updateNeeded) { await rtdb.ref().update(updates); alert("Hoàn tất cập nhật lịch trình tiến cấp!"); } else { alert("Trạng thái ổn định."); } 
}

function archiveSeason() { 
    let c1Champ = (currentC1Data && currentC1Data.final && currentC1Data.final.winner) ? currentC1Data.final.winner : "---"; 
    let c2Champ = (currentC2Data && currentC2Data.final && currentC2Data.final.winner) ? currentC2Data.final.winner : "---"; 
    let scChamp = (currentC1Data && currentC1Data.super_cup && currentC1Data.super_cup.winner) ? currentC1Data.super_cup.winner : "---"; 
    let playoffWinner = (currentC1Data && currentC1Data.promotion_playoff && currentC1Data.promotion_playoff.winner) ? currentC1Data.promotion_playoff.winner : "---"; 
    if(c1Champ === "---") return alert("Cần xác định kết quả nhánh Elite (C1) trước khi ghi nhận."); 
    if(c2Champ !== "---" && (scChamp === "---" || playoffWinner === "---")) return alert("Vui lòng hoàn tất trận Siêu Cúp và Play-off!"); 
    
    if(confirm(`Xác nhận tổng kết Mùa giải tại ${currentRealm}?`)) { 
        let c1Fourth = (currentC1Data.third_place.winner === currentC1Data.third_place.p1) ? currentC1Data.third_place.p2 : currentC1Data.third_place.p1; 
        let promoted = (playoffWinner === c2Champ) ? c2Champ : "---"; 
        let relegated = (playoffWinner === c2Champ) ? c1Fourth : c1Fourth; 
        let historyData = { c1_champ: c1Champ, promoted_player: promoted, relegated_player: relegated }; 
        
        rtdb.ref(`tournament_status/${currentRealm}/hall_of_fame`).once('value').then(snap => { 
            let hof = snap.val() || []; let nextSeason = hof.length + 1; 
            hof.push({ season: nextSeason, c1: c1Champ, c2: c2Champ, sc: scChamp, date: new Date().toLocaleDateString('en-GB') }); 
            let finalUpdates = {}; 
            finalUpdates[`tournament_status/${currentRealm}/hall_of_fame`] = hof; 
            finalUpdates[`tournament_status/${currentRealm}/history`] = historyData; 
            rtdb.ref().update(finalUpdates).then(() => alert(`🎉 Ghi nhận thành công!`)); 
        }); 
    } 
}

async function adminStartPvP(league, stageKey, matchIndex, p1Name, p2Name) { 
    const syllabusSnap = await rtdb.ref(`tournament_status/${currentRealm}/syllabus`).once('value'); 
    const selectedLessons = syllabusSnap.val(); 
    if(!selectedLessons || selectedLessons.length === 0) return alert("Thao tác bị từ chối: Giáo án tỷ võ chưa thiết lập."); 
    
    let allVocab = []; 
    selectedLessons.forEach(ln => { 
        let lesson = allLessonsData.find(l => l.name === ln); 
        if(lesson) allVocab = allVocab.concat(lesson.vocab); 
    }); 
    if(allVocab.length < 30) return alert(`Không đủ ngân hàng dữ liệu (tối thiểu 30 câu).`); 
    
    allVocab.sort(() => Math.random() - 0.5); 
    let pvpQuestionBank = allVocab.slice(0, 30).map(v => { 
        let wrong = allVocab.filter(x => x.vi !== v.vi).sort(() => Math.random() - 0.5).slice(0, 3); 
        let opts = [v.vi, ...wrong.map(w => w.vi)].sort(() => Math.random() - 0.5); 
        return { en: v.en, vi: v.vi, opts: opts }; 
    }); 
    
    window.isSpectating = true; 
    rtdb.ref(`active_pvp_match/${currentRealm}`).set({ 
        league: league, stage: stageKey, match_idx: matchIndex, p1: p1Name, p2: p2Name, 
        p1_set: 0, p2_set: 0, p1_score: 0, p2_score: 0, status: 'playing', 
        q_idx: 1, current_q: pvpQuestionBank[0], mode: 'normal', time_limit: 15, unlock_time: 0, 
        p1_ans: "", p1_time: 0, p2_ans: "", p2_time: 0, evaluating: false, question_bank: pvpQuestionBank 
    }); 
}

function submitPvPAnswer(idx) {
    rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(snap => {
        let m = snap.val(); if(!m || m.status !== 'playing' || m.evaluating) return;
        let isP1 = userData.displayName === m.p1; let isP2 = userData.displayName === m.p2;
        if((isP1 && m.p1_ans !== "") || (isP2 && m.p2_ans !== "")) return;
        
        const selectedText = m.current_q.opts[idx]; const isCorrect = selectedText === m.current_q.vi;
        let btn = document.getElementById('pvpOpt' + idx); btn.style.backgroundColor = isCorrect ? '#00c853' : '#d50000'; btn.style.borderColor = isCorrect ? '#00e676' : '#ff1744';
        for(let i=0; i<4; i++) { document.getElementById('pvpOpt'+i).style.pointerEvents = 'none'; } document.getElementById('lockOverlay').classList.add('active');
        
        let time_taken = Date.now() - (window.localUnlockTime || Date.now());
        
        let updates = {}; 
        if(isP1) { updates.p1_ans = selectedText; updates.p1_time = time_taken; } 
        if(isP2) { updates.p2_ans = selectedText; updates.p2_time = time_taken; }
        rtdb.ref(`active_pvp_match/${currentRealm}`).update(updates);
    });
}

function triggerEval() {
    rtdb.ref(`active_pvp_match/${currentRealm}`).transaction(m => {
        if (m && m.status === 'playing' && m.evaluating === false) {
            m.evaluating = true; m.status = 'showing_result';
            let p1_c = m.p1_ans === m.current_q.vi; let p2_c = m.p2_ans === m.current_q.vi; let p1_w = false; let p2_w = false;
            
            if (p1_c && p2_c) { 
                if (m.p1_time <= m.p2_time) p1_w = true; else p2_w = true; 
            } else if (p1_c) { p1_w = true; } else if (p2_c) { p2_w = true; }
            
            m.p1_score += p1_w ? 1 : 0; m.p2_score += p2_w ? 1 : 0; m.p1_won_this_round = p1_w; m.p2_won_this_round = p2_w; return m;
        } return; 
    }, (err, comm, snap) => { if(comm && snap.val()) setTimeout(() => processNextRound(snap.val().q_idx), 3500); });
}

function processNextRound(currentQIdx) {
    rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(snap => {
        let m = snap.val(); if(!m || m.q_idx !== currentQIdx || m.status !== 'showing_result') return; 
        let nextIdx = m.q_idx + 1; let s1 = m.p1_score; let s2 = m.p2_score; let set1 = m.p1_set; let set2 = m.p2_set; let status = 'playing'; let winner = "";

        if(m.q_idx === 10 || m.q_idx === 20) {
            if(s1 > s2) set1++; else if(s2 > s1) set2++; 
            s1 = 0; s2 = 0; 
            
            if(set1 === 2) { status = 'finished'; winner = m.p1; } 
            else if(set2 === 2) { status = 'finished'; winner = m.p2; } 
        } 
        else if (m.q_idx >= 21) {
            if(s1 >= 3) { status = 'finished'; winner = m.p1; set1++; } 
            else if (s2 >= 3) { status = 'finished'; winner = m.p2; set2++;}
            else if (nextIdx > m.question_bank.length) { winner = "HÒA NHAU (GIAO THỨC TRẢ HÒA)"; status = 'finished'; } 
        }

        let updates = { p1_score: s1, p2_score: s2, p1_set: set1, p2_set: set2, p1_ans: "", p2_ans: "", p1_time: 0, p2_time: 0, evaluating: false, p1_won_this_round: null, p2_won_this_round: null };
        
        if(status === 'finished') { 
            updates.status = 'finished'; updates.winner = winner; 
        } 
        else { 
            updates.status = 'playing'; updates.q_idx = nextIdx; updates.current_q = m.question_bank[nextIdx - 1]; 
            
            if (nextIdx <= 10) { updates.mode = 'normal'; updates.time_limit = 15; updates.unlock_time = 0; } 
            else if (nextIdx <= 20) { updates.mode = 'delay'; updates.time_limit = 15; updates.unlock_time = Date.now() + 6500; } 
            else { updates.mode = 'golden'; updates.time_limit = 7; updates.unlock_time = Date.now() + 6500; }
        }

        rtdb.ref(`active_pvp_match/${currentRealm}`).update(updates).then(() => {
            if (status === 'finished' && winner !== "HÒA NHAU (GIAO THỨC TRẢ HÒA)") {
                rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(matchSnap => {
                    let matchInfo = matchSnap.val();
                    if(matchInfo.stage && matchInfo.match_idx !== undefined && matchInfo.league) {
                        let key = `tournament_status/${currentRealm}/${matchInfo.league}_bracket/${matchInfo.stage}`;
                        if(matchInfo.stage === 'sfl' || matchInfo.stage === 'sfr' || matchInfo.stage === 'final' || matchInfo.stage === 'third_place' || matchInfo.stage === 'super_cup' || matchInfo.stage === 'promotion_playoff') { 
                            rtdb.ref(key).update({ winner: winner, p1_set: set1, p2_set: set2 }); 
                        } else { 
                            rtdb.ref(key + `/${matchInfo.match_idx}`).update({ winner: winner, p1_set: set1, p2_set: set2 }); 
                        }
                    }
                });
            }
        });
    });
}

function buyTimeMachine() { let todayStr = new Date().toLocaleDateString('en-GB'); if (userData.timeMachine && userData.timeMachine.status === 'in_progress') { openTimeMachineModal(); return; } if (userData.timeMachine && userData.timeMachine.lastAttemptDate !== todayStr) { userData.timeMachine.attemptsToday = 0; userData.timeMachine.lastAttemptDate = todayStr; } if (userData.timeMachine && userData.timeMachine.attemptsToday >= 3) return alert("Hết lượt hôm nay!"); let cost = userData.timeMachine.missedDays * 10000; if (userData.gold < cost) return alert("Không đủ Vàng!"); if (!confirm(`XÁC NHẬN GIAO DỊCH:\nTiêu tốn ${cost} Vàng để thực hiện thử thách.\nCần vượt qua ${userData.timeMachine.missedDays} Giai đoạn. Chấp nhận?`)) return; let allVocab = []; allLessonsData.forEach(l => allVocab = allVocab.concat(l.vocab)); if (allVocab.length < 30) return alert("Kho dữ liệu chưa đủ 30 từ."); let bank = allVocab.sort(() => Math.random() - 0.5).slice(0, Math.min(30, allVocab.length)); userData.gold -= cost; userData.timeMachine.attemptsToday++; userData.timeMachine.status = 'in_progress'; userData.timeMachine.daysRecovered = 0; userData.timeMachine.currentBank = bank; db.collection('vocab_users').doc(currentUser.uid).update({ gold: userData.gold, timeMachine: userData.timeMachine }).then(() => { updateUI(); openTimeMachineModal(); }); }

window.addEventListener('message', function(e) {
    if (e.data === 'CORRECT') { 
        if (currentUser && userData) { 
            let multiplier = (userData.potionX3Expiry && userData.potionX3Expiry > Date.now()) ? 3 : ((userData.potionExpiry && userData.potionExpiry > Date.now()) ? 2 : 1);
            let xpGained = 15 * multiplier; let goldGained = 10 * multiplier; userData.xp = (userData.xp || 0) + xpGained; userData.gold = (userData.gold || 0) + goldGained; userData.weeklyXp = (userData.weeklyXp || 0) + xpGained;
            let oldHighest = userData.highestWeeklyXp || 0; let isRecordBroken = false;
            if (oldHighest > 0 && userData.weeklyXp > oldHighest) { userData.highestWeeklyXp = userData.weeklyXp; if (!userData.hasBrokenRecordThisWeek) { userData.hasBrokenRecordThisWeek = true; isRecordBroken = true; } } else if (oldHighest === 0 && userData.weeklyXp > 0) { userData.highestWeeklyXp = userData.weeklyXp; }
            
            // CẢM BIẾN THU THẬP THÀNH TỰU (PERFECT CLEAR)
            if (window.currentLessonContext) {
                window.currentLessonCorrectCount = (window.currentLessonCorrectCount || 0) + 1;
                if (window.currentLessonCorrectCount === window.currentLessonTotal) {
                    if (!userData.mastered_lessons) userData.mastered_lessons = [];
                    if (!userData.mastered_lessons.includes(window.currentLessonContext)) {
                        userData.mastered_lessons.push(window.currentLessonContext);
                        userData.mastered_words = (userData.mastered_words || 0) + window.currentLessonTotal;
                        setTimeout(() => {
                            alert(`🎓 CHÚC MỪNG! Bạn đã hoàn thành xuất sắc 100% bài [${window.currentLessonContext}].\nCộng thêm ${window.currentLessonTotal} từ vào Quỹ Thành Thạo!`);
                            if (typeof renderAchievements === 'function') renderAchievements();
                        }, 1000);
                    }
                }
            }

            syncStatsToCloud(); 
            if (isRecordBroken) { document.getElementById('recordCurrentXp').innerText = userData.weeklyXp + " XP"; document.getElementById('recordOldXp').innerText = oldHighest; document.getElementById('recordModal').classList.add('active'); triggerConfetti(); } else { let anim = document.getElementById('rewardAnim'); let prefix = multiplier === 3 ? `🏺 ĐANG X3!` : (multiplier === 2 ? `🧪 ĐANG X2!` : `🎉`); anim.innerText = `${prefix} +${goldGained} 🪙 | +${xpGained} ⭐`; anim.classList.add('show'); setTimeout(() => anim.classList.remove('show'), 2000); }
        } 
    }
    else if (e.data === 'REQ_GLASS') { if (userData.magnifyingGlass > 0) { userData.magnifyingGlass--; syncStatsToCloud(); document.getElementById('modalFrame').contentWindow.postMessage('APPROVE_GLASS', '*'); } else { alert("Số lượng Kính Lúp hiện tại là 0!"); } }
    else if (e.data === 'TM_NEXT_DAY') { userData.timeMachine.daysRecovered++; let allVocab = []; allLessonsData.forEach(l => allVocab = allVocab.concat(l.vocab)); userData.timeMachine.currentBank = allVocab.sort(() => Math.random() - 0.5).slice(0, Math.min(30, allVocab.length)); db.collection('vocab_users').doc(currentUser.uid).update({ timeMachine: userData.timeMachine }).then(() => { openTimeMachineModal(); }); }
    else if (e.data === 'TM_RESULT_PASS') { closeModal(); userData.streak = userData.timeMachine.lostStreak + userData.timeMachine.missedDays; userData.timeMachine = null; db.collection('vocab_users').doc(currentUser.uid).update({ streak: userData.streak, timeMachine: null }).then(() => { updateUI(); alert(`🎉 KỲ TÍCH! Chuỗi đã phục hồi lên mốc ${userData.streak}!`); triggerConfetti(); }); }
    else if (e.data === 'TM_RESULT_FAIL') { closeModal(); userData.timeMachine.status = 'available'; userData.timeMachine.currentBank = []; db.collection('vocab_users').doc(currentUser.uid).update({ timeMachine: userData.timeMachine }).then(() => { updateUI(); alert(`❌ THẤT BẠI! Hãy thử lại nếu còn lượt.`); }); }
});

function generateCode() {
    const raw = document.getElementById('rawInput').value.trim(); 
    if(!raw) return alert("Yêu cầu nhập nội dung từ khóa!");
    
    const lines = raw.split('\n'); let vocabArray = []; 
    for(let line of lines) { 
        let parts = line.split('|').map(s => s.trim()); 
        if(parts.length >= 2) vocabArray.push(`{ en: "${parts[0]}", vi: "${parts[1]}", pro: "${parts[2] || ''}", type: "${parts[3] || ''}" }`); 
    }
    
    const template = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"><\/script><style>body { background-color: transparent; margin: 0; padding: 10px; font-family: 'Segoe UI', sans-serif; } .perspective { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .flipped .transform-style-3d { transform: rotateY(180deg); } .quiz-btn { width: 100%; padding: 15px; margin-bottom: 10px; border-radius: 12px; border: 2px solid #e0e7ff; background: white; font-weight: bold; color: #3730a3; transition: 0.2s; text-align: left; font-size: 16px; cursor: pointer;} .quiz-btn:hover { border-color: #4f46e5; background: #e0e7ff; } .quiz-btn.correct { background: #10b981; color: white; border-color: #059669; } .quiz-btn.wrong { background: #ef4444; color: white; border-color: #b91c1c; } .disabled { pointer-events: none; }</style></head><body>
    
    <div id="flashcard-section" class="flex flex-col items-center w-full max-w-md mx-auto"><div class="text-center mb-4 text-indigo-800 font-bold" id="card-counter">Thẻ 1 / \${vocabArray.length}</div><div id="flashcard" class="perspective w-full h-80 cursor-pointer mb-6" onclick="flipCard()"><div class="transform-style-3d relative w-full h-full rounded-2xl shadow-lg"><div id="card-front" class="backface-hidden absolute w-full h-full bg-white rounded-2xl flex flex-col items-center justify-center p-6 border-2 border-indigo-100"><div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;"><div id="word-en" class="text-5xl font-extrabold text-indigo-900">Word</div><button onclick="speakWord(document.getElementById('word-en').innerText); event.stopPropagation();" style="background:none; border:none; font-size: 28px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" title="Nghe phát âm">🔊</button></div><div id="word-pro" class="text-lg text-gray-500 mb-4 font-mono">/pronunciation/</div><span id="word-type" class="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold uppercase">Type</span></div><div id="card-back" class="backface-hidden rotate-y-180 absolute w-full h-full bg-gradient-to-br from-indigo-600 to-blue-800 rounded-2xl flex flex-col items-center justify-center p-6 text-white text-center"><div id="word-vi" class="text-3xl font-bold text-yellow-300">Nghĩa</div></div></div></div><div class="flex gap-4 w-full"><button onclick="prevCard()" class="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300">⬅ Trước</button><button onclick="nextCard()" id="next-btn" class="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">Tiếp ➡</button></div></div>
    
    <div id="summary-section" class="hidden w-full max-w-md mx-auto relative">
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 class="text-xl font-bold text-indigo-800 mb-4 text-center border-b pb-3 flex items-center justify-center gap-2">📄 Vocabulary Summary</h2>
            <div id="summary-list" class="max-h-96 overflow-y-auto pr-2 space-y-2"></div>
        </div>
        <button onclick="startQuiz()" class="w-full py-3 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 text-lg shadow-md transition">Làm Trắc Nghiệm 🪙</button>
    </div>

    <div id="quiz-section" class="hidden w-full max-w-md mx-auto relative"><div class="text-center mb-4"><span class="inline-block px-4 py-1 bg-yellow-100 text-yellow-800 font-bold rounded-full text-sm mb-2">Bài Tập Trắc Nghiệm 🪙</span><div id="timer-display" style="position: relative; width: 70px; height: 70px; margin: 0 auto 10px auto;"><svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"></circle><circle id="timer-circle" cx="50" cy="50" r="45" fill="none" stroke="#ef4444" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear;"></circle></svg><div id="timer-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: #ef4444;">15</div></div><button id="glass-btn" onclick="requestGlass()" class="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-lg text-sm mb-4 hover:bg-blue-200 transition">🔍 Dùng Kính Lúp (50/50)</button><div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 8px;"><h2 id="quiz-question" class="text-4xl font-extrabold text-indigo-900">Word</h2><button onclick="speakWord(document.getElementById('quiz-question').innerText);" style="background:none; border:none; font-size: 24px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" title="Nghe phát âm">🔊</button></div></div><div id="quiz-options" class="w-full"></div></div>
    
    <script>
    function speakWord(text) {
        if ('speechSynthesis' in window) {
            let msg = new SpeechSynthesisUtterance(text);
            msg.lang = 'en-US'; 
            msg.rate = 0.9;
            let voices = window.speechSynthesis.getVoices();
            let femaleVoice = voices.find(v => v.name.includes('Zira') || v.name.includes('Google US English') || v.name.includes('Hazel') || v.name.includes('Samantha'));
            if (femaleVoice) { msg.voice = femaleVoice; }
            window.speechSynthesis.speak(msg);
        }
    }

    const vocabList = [\\${vocabArray.join(',\\n            ')}]; let currentIndex = 0; const flashcardEl = document.getElementById('flashcard'); 
    
    function loadCard(index) { 
        flashcardEl.classList.remove('flipped'); 
        setTimeout(() => { 
            document.getElementById('word-en').innerText = vocabList[index].en; 
            document.getElementById('word-pro').innerText = vocabList[index].pro; 
            document.getElementById('word-type').innerText = vocabList[index].type; 
            document.getElementById('word-vi').innerText = vocabList[index].vi; 
            document.getElementById('card-counter').innerText = 'Thẻ ' + (index + 1) + ' / ' + vocabList.length; 
            const nextBtn = document.getElementById('next-btn'); 
            if (index === vocabList.length - 1) { 
                nextBtn.innerText = "Xem Tổng Hợp 📄"; 
                nextBtn.className = "flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600"; 
            } else { 
                nextBtn.innerText = "Tiếp ➡"; 
                nextBtn.className = "flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"; 
            } 
        }, 150); 
    } 
    
    function flipCard() { flashcardEl.classList.toggle('flipped'); } 
    function prevCard() { if (currentIndex > 0) { currentIndex--; loadCard(currentIndex); } } 
    
    function nextCard() { 
        if (currentIndex < vocabList.length - 1) { 
            currentIndex++; loadCard(currentIndex); 
        } else { 
            showSummary(); 
        } 
    } 

    function showSummary() {
        document.getElementById('flashcard-section').classList.add('hidden');
        document.getElementById('summary-section').classList.remove('hidden');
        const listContainer = document.getElementById('summary-list');
        listContainer.innerHTML = '';
        vocabList.forEach(item => {
            let proText = item.pro ? \\\`<span class="text-sm text-gray-500 font-mono ml-2">\\\${item.pro}</span>\\\` : '';
            listContainer.innerHTML += \\\`
                <div class="border-b border-gray-100 pb-3 flex justify-between items-center hover:bg-gray-50 p-2 rounded-lg transition">
                    <div>
                        <div class="flex items-baseline">
                            <span class="text-lg font-bold text-gray-900">\\\${item.en}</span>
                            \\\${proText}
                        </div>
                        <div class="text-sm text-gray-600 mt-1">\\\${item.vi}</div>
                    </div>
                    <button onclick="speakWord('\\\${item.en}')" class="text-indigo-500 hover:text-indigo-700 text-2xl" title="Nghe phát âm">🔊</button>
                </div>
            \\\`;
        });
    }

    let currentQuizIndex = 0; let quizOrder = []; let timerId; let timeLeft = 15; let glassUsedThisQuestion = false; 
    
    function startTimer() { timeLeft = 15; document.getElementById('timer-circle').style.strokeDashoffset = '0'; document.getElementById('timer-text').innerText = timeLeft; clearInterval(timerId); timerId = setInterval(() => { timeLeft--; const offset = 283 - (timeLeft / 15) * 283; document.getElementById('timer-circle').style.strokeDashoffset = offset; document.getElementById('timer-text').innerText = timeLeft; if(timeLeft <= 0) { clearInterval(timerId); timeOut(); } }, 1000); } 
    function timeOut() { const optionsContainer = document.getElementById('quiz-options'); optionsContainer.classList.add('disabled'); const correctWord = vocabList[quizOrder[currentQuizIndex]]; Array.from(optionsContainer.children).forEach(child => { child.style.visibility = 'visible'; if (child.innerText === correctWord.vi) child.classList.add('correct'); else child.classList.add('wrong'); }); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadQuizQuestion(); else finishQuiz(); }, 2000); } 
    
    function startQuiz() { 
        document.getElementById('summary-section').classList.add('hidden'); 
        document.getElementById('quiz-section').classList.remove('hidden'); 
        quizOrder = [...Array(vocabList.length).keys()].sort(() => Math.random() - 0.5); 
        currentQuizIndex = 0; 
        loadQuizQuestion(); 
    } 
    
    function loadQuizQuestion() { glassUsedThisQuestion = false; document.getElementById('glass-btn').classList.remove('hidden'); const optionsContainer = document.getElementById('quiz-options'); optionsContainer.innerHTML = ''; optionsContainer.classList.remove('disabled'); const correctWord = vocabList[quizOrder[currentQuizIndex]]; document.getElementById('quiz-question').innerText = correctWord.en; let options = [correctWord.vi]; let wrongOptions = vocabList.filter(w => w.en !== correctWord.en).map(w => w.vi); wrongOptions = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3); options = options.concat(wrongOptions); options.sort(() => Math.random() - 0.5); options.forEach(opt => { const btn = document.createElement('button'); btn.className = 'quiz-btn'; btn.innerText = opt; btn.onclick = () => checkAnswer(btn, opt, correctWord.vi); optionsContainer.appendChild(btn); }); startTimer(); } 
    function requestGlass() { if(glassUsedThisQuestion) return; if(window.parent) window.parent.postMessage('REQ_GLASS', '*'); } 
    
    window.addEventListener('message', function(e) { if(e.data === 'APPROVE_GLASS') { glassUsedThisQuestion = true; document.getElementById('glass-btn').classList.add('hidden'); const optionsContainer = document.getElementById('quiz-options'); const correctWord = vocabList[quizOrder[currentQuizIndex]]; let hiddenCount = 0; Array.from(optionsContainer.children).forEach(btn => { if(btn.innerText !== correctWord.vi && hiddenCount < 2) { btn.style.visibility = 'hidden'; hiddenCount++; } }); } }); 
    function finishQuiz() { const optionsContainer = document.getElementById('quiz-options'); optionsContainer.innerHTML = '<div class="text-center p-6 bg-green-100 text-green-800 rounded-xl font-bold text-xl">🎉 Đã hoàn thành! Nhấn F5 để ôn lại hoặc ra ngoài học bài khác.</div>'; document.getElementById('timer-display').style.display = 'none'; document.getElementById('glass-btn').style.display = 'none'; } 
    function checkAnswer(btn, selectedVi, correctVi) { clearInterval(timerId); const optionsContainer = document.getElementById('quiz-options'); optionsContainer.classList.add('disabled'); if (selectedVi === correctVi) { btn.classList.add('correct'); if(window.parent) window.parent.postMessage('CORRECT', '*'); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadQuizQuestion(); else finishQuiz(); }, 1500); } else { btn.classList.add('wrong'); Array.from(optionsContainer.children).forEach(child => { child.style.visibility = 'visible'; if (child.innerText === correctVi) child.classList.add('correct'); }); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadQuizQuestion(); else finishQuiz(); }, 2000); } } 
    
    loadCard(0); 
    <\/script></body></html>`;
    
    document.getElementById('generatedCode').value = template;
    let evalVocab = []; try { evalVocab = eval("[" + vocabArray.join(',') + "]"); } catch(e) {}
    currentGeneratedVocab = evalVocab;
    alert("Đúc mã thành công! Bệ hạ hãy điền Tên Bài và chọn Phủ để lưu ngay xuống Firebase.");
}
        
function openTimeMachineModal() {
    let bank = userData.timeMachine.currentBank; let vocabArray = bank.map(v => `{ en: "${v.en.replace(/"/g, '\\"')}", vi: "${v.vi.replace(/"/g, '\\"')}", pro: "${(v.pro||'').replace(/"/g, '\\"')}", type: "${(v.type||'').replace(/"/g, '\\"')}" }`); let currentDay = (userData.timeMachine.daysRecovered || 0) + 1; let totalDays = userData.timeMachine.missedDays;
    let tmTemplate = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"><\/script><style>body { background-color: #f3e5f5; margin: 0; padding: 10px; font-family: 'Segoe UI', sans-serif; } .perspective { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .flipped .transform-style-3d { transform: rotateY(180deg); } .quiz-btn { width: 100%; padding: 15px; margin-bottom: 10px; border-radius: 12px; border: 2px solid #e0e7ff; background: white; font-weight: bold; color: #3730a3; transition: 0.2s; text-align: left; font-size: 16px; cursor: pointer;} .quiz-btn:hover { border-color: #4f46e5; background: #e0e7ff; } .quiz-btn.correct { background: #10b981; color: white; border-color: #059669; } .quiz-btn.wrong { background: #ef4444; color: white; border-color: #b91c1c; } .disabled { pointer-events: none; }</style></head><body>
    <div id="flashcard-section" class="flex flex-col items-center w-full max-w-md mx-auto"><div class="text-center mb-4 text-purple-800 font-bold text-xl">⏳ KHỔ HÌNH: NGÀY ${currentDay}/${totalDays} ⏳</div><div class="text-center mb-4 text-purple-600 font-bold" id="card-counter">Thẻ 1 / ${vocabArray.length}</div><div id="flashcard" class="perspective w-full h-80 cursor-pointer mb-6" onclick="flipCard()"><div class="transform-style-3d relative w-full h-full rounded-2xl shadow-lg"><div id="card-front" class="backface-hidden absolute w-full h-full bg-white rounded-2xl flex flex-col items-center justify-center p-6 border-4 border-purple-300"><div id="word-en" class="text-5xl font-extrabold text-purple-900 mb-2">Word</div><div id="word-pro" class="text-lg text-gray-500 mb-4 font-mono">/pronunciation/</div><span id="word-type" class="px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold uppercase">Type</span></div><div id="card-back" class="backface-hidden rotate-y-180 absolute w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex flex-col items-center justify-center p-6 text-white text-center"><div id="word-vi" class="text-3xl font-bold text-yellow-300">Nghĩa</div></div></div></div><div class="flex gap-4 w-full"><button onclick="prevCard()" class="flex-1 py-3 rounded-xl bg-gray-300 text-gray-700 font-bold hover:bg-gray-400">⬅ Trước</button><button onclick="nextCard()" id="next-btn" class="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700">Tiếp ➡</button></div></div>
    <div id="quiz-section" class="hidden w-full max-w-md mx-auto relative"><div class="text-center mb-4"><span class="inline-block px-4 py-1 bg-yellow-100 text-yellow-800 font-bold rounded-full text-sm mb-2">Thử Thách Sinh Tử: ${currentDay}/${totalDays} ⏳</span><div id="timer-display" style="position: relative; width: 70px; height: 70px; margin: 0 auto 10px auto;"><svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"></circle><circle id="timer-circle" cx="50" cy="50" r="45" fill="none" stroke="#9c27b0" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear;"></circle></svg><div id="timer-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: #9c27b0;">10</div></div><h2 id="quiz-question" class="text-4xl font-extrabold text-purple-900 mt-2">Word</h2></div><div id="quiz-options" class="w-full"></div></div>
    <script>
        const vocabList = [${vocabArray.join(',\n')}]; let currentIndex = 0; const flashcardEl = document.getElementById('flashcard'); function loadCard(index) { flashcardEl.classList.remove('flipped'); setTimeout(() => { document.getElementById('word-en').innerText = vocabList[index].en; document.getElementById('word-pro').innerText = vocabList[index].pro; document.getElementById('word-type').innerText = vocabList[index].type; document.getElementById('word-vi').innerText = vocabList[index].vi; document.getElementById('card-counter').innerText = 'Thẻ ' + (index + 1) + ' / ' + vocabList.length; const nextBtn = document.getElementById('next-btn'); if (index === vocabList.length - 1) { nextBtn.innerText = "BẮT ĐẦU THI"; nextBtn.className = "flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"; } else { nextBtn.innerText = "Tiếp ➡"; nextBtn.className = "flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700"; } }, 150); } function flipCard() { flashcardEl.classList.toggle('flipped'); } function prevCard() { if (currentIndex > 0) { currentIndex--; loadCard(currentIndex); } } function nextCard() { if (currentIndex < vocabList.length - 1) { currentIndex++; loadCard(currentIndex); } else { startQuiz(); } } let currentQuizIndex = 0; let quizOrder = []; let timerId; let timeLeft = 10; let correctAnswersCount = 0; 
        function startTimer() { timeLeft = 10; document.getElementById('timer-circle').style.strokeDashoffset = '0'; document.getElementById('timer-text').innerText = timeLeft; clearInterval(timerId); timerId = setInterval(() => { timeLeft--; const offset = 283 - (timeLeft / 10) * 283; document.getElementById('timer-circle').style.strokeDashoffset = offset; document.getElementById('timer-text').innerText = timeLeft; if(timeLeft <= 0) { clearInterval(timerId); timeOut(); } }, 1000); } function timeOut() { const optionsContainer = document.getElementById('quiz-options'); optionsContainer.classList.add('disabled'); const correctWord = vocabList[quizOrder[currentQuizIndex]]; Array.from(optionsContainer.children).forEach(child => { child.style.visibility = 'visible'; if (child.innerText === correctWord.vi) child.classList.add('correct'); else child.classList.add('wrong'); }); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadQuizQuestion(); else finishQuiz(); }, 1500); } function startQuiz() { document.getElementById('flashcard-section').classList.add('hidden'); document.getElementById('quiz-section').classList.remove('hidden'); quizOrder = [...Array(vocabList.length).keys()].sort(() => Math.random() - 0.5); currentQuizIndex = 0; loadQuizQuestion(); } function loadQuizQuestion() { const optionsContainer = document.getElementById('quiz-options'); optionsContainer.innerHTML = ''; optionsContainer.classList.remove('disabled'); const correctWord = vocabList[quizOrder[currentQuizIndex]]; document.getElementById('quiz-question').innerText = correctWord.en; let options = [correctWord.vi]; let wrongOptions = vocabList.filter(w => w.en !== correctWord.en).map(w => w.vi); wrongOptions = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3); options = options.concat(wrongOptions); options.sort(() => Math.random() - 0.5); options.forEach(opt => { const btn = document.createElement('button'); btn.className = 'quiz-btn'; btn.innerText = opt; btn.onclick = () => checkAnswer(btn, opt, correctWord.vi); optionsContainer.appendChild(btn); }); startTimer(); } 
        function finishQuiz() { clearInterval(timerId); document.getElementById('timer-display').style.display = 'none'; let ratio = correctAnswersCount / vocabList.length; let optionsContainer = document.getElementById('quiz-options'); optionsContainer.classList.remove('disabled'); if (ratio >= 0.8) { if (${currentDay} < ${totalDays}) { optionsContainer.innerHTML = '<div class="text-center p-6 bg-green-100 text-green-900 rounded-xl font-bold text-xl mb-4">✅ Đã vượt qua Nhịp ' + ${currentDay} + ' (' + correctAnswersCount + '/' + vocabList.length + ')</div><button onclick="window.parent.postMessage(\\'TM_NEXT_DAY\\', \\'*\\')" class="quiz-btn" style="background: linear-gradient(45deg, #10b981, #059669); color: white; border: none; text-align: center;">Chuyển sang ngày tiếp theo ➡</button>'; } else { optionsContainer.innerHTML = '<div class="text-center p-6 bg-yellow-100 text-yellow-900 rounded-xl font-bold text-xl mb-4">🎉 XUYÊN KHÔNG THÀNH CÔNG! (' + correctAnswersCount + '/' + vocabList.length + ')</div><button onclick="window.parent.postMessage(\\'TM_RESULT_PASS\\', \\'*\\')" class="quiz-btn" style="background: linear-gradient(45deg, #f59e0b, #d97706); color: white; border: none; text-align: center;">Nhận Lại Chuỗi Của Bạn</button>'; } } else { optionsContainer.innerHTML = '<div class="text-center p-6 bg-red-100 text-red-900 rounded-xl font-bold text-xl mb-4">❌ THẤT BẠI! Bạn chỉ đạt ' + correctAnswersCount + '/' + vocabList.length + ' (' + Math.round(ratio*100) + '%). Yêu cầu >= 80%.</div><button onclick="window.parent.postMessage(\\'TM_RESULT_FAIL\\', \\'*\\')" class="quiz-btn" style="background: linear-gradient(45deg, #ef4444, #b91c1c); color: white; border: none; text-align: center;">Chấp nhận hình phạt</button>'; } } 
        function checkAnswer(btn, selectedVi, correctVi) { clearInterval(timerId); const optionsContainer = document.getElementById('quiz-options'); optionsContainer.classList.add('disabled'); if (selectedVi === correctVi) { btn.classList.add('correct'); correctAnswersCount++; setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadQuizQuestion(); else finishQuiz(); }, 800); } else { btn.classList.add('wrong'); Array.from(optionsContainer.children).forEach(child => { child.style.visibility = 'visible'; if (child.innerText === correctVi) child.classList.add('correct'); }); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadQuizQuestion(); else finishQuiz(); }, 1500); } } loadCard(0); 
    <\/script></body></html>`;
    document.getElementById('modalFrame').srcdoc = tmTemplate; document.getElementById('previewModal').classList.add('active');
}

function copyCode() { document.getElementById('generatedCode').select(); document.execCommand("copy"); alert("Thông tin mã được sao chép thành công."); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); const isDark = document.body.classList.contains('dark-mode'); localStorage.setItem('darkMode', isDark ? 'true' : 'false'); document.getElementById('themeToggleBtn').innerText = isDark ? '☀️' : '🌙'; }

function switchTab(tabId) { 
    try {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active')); 
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active')); 
        
        const viewEl = document.getElementById('view-' + tabId);
        if (viewEl) viewEl.classList.add('active'); 
        
        const navBtn = document.getElementById('nav-' + tabId); 
        if(navBtn) navBtn.classList.add('active'); 
        
        if (window.innerWidth <= 768) toggleSidebar(); 
        
        if (tabId === 'library') fetchLessonsFromFirebase(); 
        if (tabId === 'leaderboard') fetchLeaderboard(); 
    } catch (error) { console.error("Lỗi khi chuyển tab:", error); }
}

function toggleSidebar() { 
    let sidebar = document.getElementById('sidebar'); let overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('show'); 
    if(sidebar.classList.contains('show')) { overlay.style.display = 'block'; setTimeout(() => overlay.style.opacity = '1', 10); } 
    else { overlay.style.opacity = '0'; setTimeout(() => overlay.style.display = 'none', 300); }
}

async function fixOldUsersRealm() {
    let targetRealm = document.getElementById('syncRealmSelect').value;
    if(!targetRealm) return alert("Bệ hạ vui lòng chọn một Phủ ở ô bên trên để cấp hộ khẩu!");
    if(!confirm(`Bệ hạ có muốn thu nhận toàn bộ thần dân cũ (chưa có phân vùng) vào Phủ [${targetRealm}] không?`)) return;
    try {
        const snapshot = await db.collection('vocab_users').get();
        let count = 0; let batch = db.batch(); 
        snapshot.forEach(doc => {
            let data = doc.data();
            if (!data.realm || data.realm === "") {
                let ref = db.collection('vocab_users').doc(doc.id);
                batch.update(ref, { realm: targetRealm }); count++;
            }
        });
        if (count > 0) { await batch.commit(); alert(`Tấu tiệp! Đã cấp hộ khẩu [${targetRealm}] thành công cho ${count} thần dân cũ. Bệ hạ hãy sang Bảng Xếp Hạng kiểm tra lại!`); fetchLeaderboard(); } 
        else { alert("Báo cáo: Toàn bộ thần dân trong hệ thống đều đã có hộ khẩu rõ ràng, không ai bị lưu lạc."); }
    } catch(error) { alert("Có lỗi xảy ra trong quá trình thu nhận: " + error.message); }
}

function openMigrationModal() { 
    if(availableRealms.length <= 1) return alert("Hệ thống hiện tại chỉ mới có 1 Lãnh Thổ duy nhất.");
    if(userData.role !== 'teacher' && userData.gold < 100000) return alert("Bạn không đủ 100.000 Vàng để mua Giấy Thông Hành!"); 
    document.getElementById('currentRealmDisplay').innerText = currentRealm; 
    let select = document.getElementById('realmSelect'); 
    select.innerHTML = ''; 
    availableRealms.forEach(phu => { 
        if(phu !== currentRealm) select.innerHTML += `<option value="${phu}">${phu}</option>`; 
    }); 
    document.getElementById('migrationModal').classList.add('active'); 
}

function confirmMigration() { 
    let newRealm = document.getElementById('realmSelect').value; 
    if(!newRealm) return; 
    if(userData.role !== 'teacher') {
        if(userData.gold < 100000) return alert("Không đủ vàng!"); 
        userData.gold -= 100000; 
    }
    userData.lifetime_xp = (userData.lifetime_xp || 0) + userData.xp; 
    userData.xp = 0; userData.weeklyXp = 0; userData.lastWeekXp = 0; userData.highestWeeklyXp = 0; userData.realm = newRealm; 
    db.collection('vocab_users').doc(currentUser.uid).update({ gold: userData.gold, lifetime_xp: userData.lifetime_xp, xp: 0, weeklyXp: 0, lastWeekXp: 0, highestWeeklyXp: 0, realm: newRealm }).then(() => { alert(`✈️ Đã di cư sang ${newRealm}!`); window.location.reload(); }); 
}

window.addEventListener('DOMContentLoaded', () => {
    initSystem();
    if (localStorage.getItem('darkMode') === 'true') { document.body.classList.add('dark-mode'); document.getElementById('themeToggleBtn').innerText = '☀️'; }
    switchTab('library');
});
