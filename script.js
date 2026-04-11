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
                                if (userData.hasShield) { 
                                    userData.hasShield = false; 
                                    userData.lastLogin = todayStr; 
                                    db.collection('vocab_users').doc(user.uid).update({ lastLogin: todayStr, hasShield: false }); 
                                    alert("🛡️ May quá! Hệ thống đã dùng 1 Bùa Bảo Hộ để giữ lại chuỗi của bạn!"); 
                                } else { 
                                    userData.xp = Math.max(0, userData.xp - Math.floor(userData.xp * 0.2));
                                    userData.gold = Math.max(0, userData.gold - Math.floor(userData.gold * 0.2));
                                    if (diffDays <= 4) {
                                        userData.timeMachine = { lostStreak: userData.streak, missedDays: diffDays - 1, lostTimestamp: Date.now(), status: 'available', attemptsToday: 0, lastAttemptDate: todayStr, daysRecovered: 0, currentBank: [] };
                                    } else {
                                        userData.timeMachine = null; 
                                    }
                                    userData.streak = 1; userData.lastLogin = todayStr; 
                                    db.collection('vocab_users').doc(user.uid).update({ streak: 1, lastLogin: todayStr, xp: userData.xp, gold: userData.gold, timeMachine: userData.timeMachine || null }).then(() => { 
                                        let oldStreak = userData.timeMachine ? userData.timeMachine.lostStreak : "cũ";
                                        console.error(`[HỆ THỐNG] Cảnh báo: Chuỗi ${oldStreak} ngày đã đứt do vắng mặt ${diffDays - 1} ngày. Đang thiết lập lại về 1.`);
                                        document.getElementById('missedDaysCount').innerText = diffDays - 1;
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
                        userData = { role: trueRole, gold: 0, xp: 0, lifetime_xp: 0, realm: "", streak: 1, displayName: '', lastLogin: todayStr, hasShield: false, potionExpiry: null, potionX3Expiry: null, maskExpiry: null, magnifyingGlass: 0, vouchers: [], blindBoxCount: 0, lastBlindBoxDate: todayStr, streakIcon: '🔥', theme: 'theme_default', purchasedItems: [], weeklyXp: 0, lastWeekXp: 0, currentWeekStr: getCurrentWeekStr(), highestWeeklyXp: 0, hasBrokenRecordThisWeek: false, timeMachine: null, mastered_words: 0, mastered_lessons: [] };
                        
                        let obSelect = document.getElementById('onboardRealmSelect');
                        if (obSelect) {
                            obSelect.innerHTML = '';
                            availableRealms.forEach(r => {
                                obSelect.innerHTML += `<option value="${r}">${r}</option>`;
                            });
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
function loginWithGoogle() { 
    if (!auth) return; 
    var provider = new firebase.auth.GoogleAuthProvider(); 
    
    // Ép Google bắt buộc phải hiện bảng "Chọn tài khoản"
    provider.setCustomParameters({ prompt: 'select_account' }); 
    
    // Thử dùng Popup trước, nếu Edge chặn thì tự động xoay sang Redirect
    auth.signInWithPopup(provider).then(() => {
        window.location.reload();
    }).catch(err => {
        console.warn("Popup bị chặn, chuyển sang Redirect...", err);
        auth.signInWithRedirect(provider);
    });
}
function loginWithEmail() { if (!auth) return; const email = document.getElementById('loginEmail').value.trim(); const pass = document.getElementById('loginPass').value.trim(); if (!email || !pass) return alert("Vui lòng cung cấp đầy đủ thông tin truy cập!"); auth.signInWithEmailAndPassword(email, pass).catch(err => alert("Lỗi: " + err.message)); }
function registerWithEmail() { if (!auth) return; const email = document.getElementById('loginEmail').value.trim(); const pass = document.getElementById('loginPass').value.trim(); if (!email || !pass) return alert("Vui lòng cung cấp đầy đủ thông tin để đăng ký!"); auth.createUserWithEmailAndPassword(email, pass).then(() => alert("Đăng ký thành công!")).catch(err => alert("Lỗi: " + err.message)); }

function saveDisplayName() { 
    const name = document.getElementById('displayNameInput').value.trim(); 
    if (!name) return alert("Tên hiển thị không được để trống!"); 
    
    // Thu thập lựa chọn Khóa học của người mới
    let onboardRealm = document.getElementById('onboardRealmSelect');
    if (onboardRealm && onboardRealm.value && !userData.realm) {
        userData.realm = onboardRealm.value;
        currentRealm = userData.realm;
    }
    
    userData.displayName = name; 
    userData.email = currentUser.email; 
    
    db.collection('vocab_users').doc(currentUser.uid).set(userData, {merge: true}).then(() => { 
        document.getElementById('nameModal').classList.remove('active'); 
        updateUI(); 
        setupRealmListeners(); 
        fetchLessonsFromFirebase(); // Tải kho bài học của khóa vừa chọn
        
        alert(`🎉 Thiết lập thành công! Chào mừng bạn đến với khóa học [${userData.realm}]!`);
    }); 
}

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
        if(document.getElementById('adminNoticeControl')) document.getElementById('adminNoticeControl').style.display = 'block';
    } else { 
        badge.className = 'user-badge badge-student'; 
        badge.innerText = '👨‍🎓 Học Sinh'; 
        document.getElementById('nav-creator').style.display = 'none'; 
        document.getElementById('nav-arena').style.display = 'none'; 
        if(forceBtn) forceBtn.style.display = 'none'; 
        if(document.getElementById('adminNoticeControl')) document.getElementById('adminNoticeControl').style.display = 'none';
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
    
    let quantity = 1;
    if (itemType === 'glass') {
        let qStr = prompt("🔍 Nhập số lượng Kính Lúp ngài muốn mua:\n(🔥 ƯU ĐÃI: Mua từ 3 kính trở lên, giá giảm chỉ còn 150 🪙 / kính)", "1");
        if (qStr === null) return; 
        quantity = parseInt(qStr);
        if (isNaN(quantity) || quantity <= 0) return alert("Số lượng không hợp lệ!");
        let unitPrice = quantity >= 3 ? 150 : 200;
        basePrice = unitPrice * quantity;
    }
    
    let bestVoucher = 0; let vIndex = -1;
    if(userData.vouchers && userData.vouchers.length > 0) {
        bestVoucher = userData.vouchers[0]; vIndex = 0;
    }
    
    let finalPrice = basePrice;
    if (bestVoucher > 0) { finalPrice = Math.floor(basePrice * (100 - bestVoucher) / 100); }
    
    if (userData.gold < finalPrice) return alert(`Giao dịch thất bại! Bạn cần thanh toán ${finalPrice} 🪙.`);
    
    let itemName = itemType === 'glass' ? `${quantity} Kính Lúp` : 'vật phẩm này';
    let confirmMsg = `Xác nhận thanh toán ${finalPrice} Vàng cho ${itemName}?`;
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
        
        if (itemType === 'glass') updates.magnifyingGlass = (userData.magnifyingGlass || 0) + quantity;
        
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
            if(updates.potionExpiry) updates.potionExpiry = updates.potionExpiry; 
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
    
    // ⚠️ ĐÃ VỨT BỎ LỆNH ALERT Ở ĐÂY VÌ TRÌNH DUYỆT SẼ CHẶN ĐỨNG CODE NẾU BẬT ALERT LÚC ĐANG ẨN TAB!

    let key = `tournament_status/${currentRealm}/${surveillanceData.league}_bracket/${surveillanceData.stageKey}`;
    if (!['sfl', 'sfr', 'final', 'third_place', 'super_cup', 'promotion_playoff'].includes(surveillanceData.stageKey)) { 
        key += `/${surveillanceData.matchIndex}`; 
    }
    
    let p1_s = surveillanceData.playerSlot === 'p1' ? 0 : 2;
    let p2_s = surveillanceData.playerSlot === 'p2' ? 0 : 2;

    // Âm thầm xử thua trên Cây Đấu (Bracket)
    rtdb.ref(key).update({ winner: surveillanceData.oppName, p1_set: p1_s, p2_set: p2_s });
    
    // Âm thầm tước đoạt sinh mạng trên võ đài
    rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(snap => {
        let m = snap.val();
        if(m && m.status !== 'finished' && (m.p1 === surveillanceData.myName || m.p2 === surveillanceData.myName)) {
            rtdb.ref(`active_pvp_match/${currentRealm}`).update({ 
                status: 'finished', 
                winner: surveillanceData.oppName, 
                reason: 'anti_cheat', 
                violator: surveillanceData.myName 
            });
        }
    });
}

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
        window.checkAndGrantStreakRewards = function(oldS, newS) {
    if (oldS >= newS) return;
    let granted = false;
    for(let s = oldS + 1; s <= newS; s++) {
        let mod = s % 100; let reward = 0;
        if (mod === 15) reward = 20; else if (mod === 30) reward = 35; else if (mod === 60) reward = 50; else if (mod === 0 && s >= 100) reward = 100;
        if (reward > 0) {
            if(!userData.vouchers) userData.vouchers = [];
            userData.vouchers.push(reward);
            granted = true;
            alert(`🔥 QUÀ TẶNG CHUỖI ${s} NGÀY!\nHệ thống ban tặng 1 Mã giảm giá ${reward}% vào Cửa Hàng!`);
        }
    }
    if (granted) {
        userData.vouchers.sort((a,b) => b - a);
        if(currentUser && db) db.collection('vocab_users').doc(currentUser.uid).update({ vouchers: userData.vouchers }).then(() => updateUI());
    }
};
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

setInterval(() => {
    if(userData.role !== 'teacher' || !currentRealm) return;
    let now = Date.now();
    let updates = {}; let needsUpdate = false;

   function checkWalkover(m, stage, idx, league) {
        if(m && m.p1 && m.p2 && m.p1 !== "---" && m.p2 !== "---" && !m.winner && m.schedule) {
            let diff = m.schedule - now;
            
            // 🤖 BÙA CHÚ 1: BOT TỰ ĐỘNG VÀO PHÒNG KHI TỚI GIỜ MỞ CỬA
            if (diff <= 0 && diff > -600000) {
                let needBotUpdate = false;
                let botUpdates = {};
                // Nếu thấy tên có icon 🤖 là ép nó tự bấm Sẵn Sàng
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
        const style = document.createElement('style');
        style.id = 'c1-elite-style';
        style.innerHTML = `
            @keyframes sweepShine {
                0% { left: -100%; }
                20% { left: 100%; }
                100% { left: 100%; }
            }
            .c1-elite-theme {
                position: relative;
                overflow: hidden;
                border-radius: 8px;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.4) !important; 
                background-color: rgba(0, 0, 0, 0.1); 
            }
            .c1-elite-theme::before {
                content: '';
                position: absolute;
                top: 0; left: -100%;
                width: 50%; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
                transform: skewX(-25deg);
                animation: sweepShine 3s infinite;
                pointer-events: none;
                z-index: 1;
            }
        `;
        document.head.appendChild(style);
    }

    currentFullBracketData = currentLeagueView === 'c1' ? currentC1Data : currentC2Data;
    
    if (!currentFullBracketData) {
        document.getElementById('bracketMatches').innerHTML = '<div style="color:#888; text-align:center; width:100%;">Giai đoạn này hiện tại chưa có dữ liệu.</div>';
        return;
    }
    
    let boardEl = document.getElementById('bracketBoard');
    boardEl.style.display = 'block';
    
    if (currentLeagueView === 'c1') boardEl.classList.add('c1-elite-theme');
    else boardEl.classList.remove('c1-elite-theme');

    let statusEl = document.getElementById('bracketStatus');
    if (statusEl) {
        statusEl.innerText = `GIAI ĐOẠN: Sơ đồ loại trực tiếp | Trạng thái: Đang tiến hành`;
        statusEl.style.color = '#ccc';
        statusEl.style.fontWeight = 'normal';
    }
    let titleEl = document.getElementById('leagueTitle');
    if (titleEl) {
        titleEl.style.color = currentLeagueView === 'c1' ? '#ffd700' : '#c0c0c0';
        titleEl.style.textShadow = 'none';
    }

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

    const isFinished = !!m.winner;
    let p1Name = m.p1 || '---'; let p2Name = m.p2 || '---';
    let p1Class = ''; let p2Class = ''; let p1Star = ''; let p2Star = '';
    
    let s1Text = (m.p1_set !== undefined) ? `<span style="background:#ff1744; color:#fff; padding:2px 8px; border-radius:4px; font-family:monospace; font-weight:900; font-size:14px; box-shadow: 0 0 8px #ff1744; animation: pulse 1.5s infinite; position: relative; z-index: 3;">${m.p1_set}</span>` : '';
    let s2Text = (m.p2_set !== undefined) ? `<span style="background:#ff1744; color:#fff; padding:2px 8px; border-radius:4px; font-family:monospace; font-weight:900; font-size:14px; box-shadow: 0 0 8px #ff1744; animation: pulse 1.5s infinite; position: relative; z-index: 3;">${m.p2_set}</span>` : '';

    if (isFinished) {
        if (m.winner === m.p1) { p1Class = 'won'; p2Class = 'lost'; p1Star = ' ⭐'; } 
        else if (m.winner === m.p2) { p2Class = 'won'; p1Class = 'lost'; p2Star = ' ⭐'; }
    }

    let timeInfo = ''; let btnAction = '';
    let validMatch = m.p1 && m.p2 && m.p1 !== "---" && m.p2 !== "---" && !isFinished;
    
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
                
                if(m.p1_ready && m.p2_ready) {
                    timeInfo = `<div class="match-time" style="color:#00e676; font-weight:bold; animation: pulse 1s infinite; position: relative; z-index: 2;">✅ SẴN SÀNG - CHỜ LỆNH BẮT ĐẦU</div>`;
                }
            } else { 
                timeInfo = `<div class="match-time" style="color:#ff5252; position: relative; z-index: 2;">⏳ Đang cập nhật...</div>`;
            }
        }
        
        if (userData.role === 'teacher') {
            let safeP1 = (m.p1 || '').replace(/'/g, "\\'");
            let safeP2 = (m.p2 || '').replace(/'/g, "\\'");
            
            btnAction += `<button class="btn-schedule" style="display:block; position: relative; z-index: 2;" onclick="openScheduleModal('${league}', '${stageKey}', ${matchIndex})">⏰ LÊN LỊCH</button>`;
            btnAction += `<button class="btn-fight" style="display:block; position: relative; z-index: 2;" onclick="adminStartPvP('${league}', '${stageKey}', ${matchIndex}, '${safeP1}', '${safeP2}')">⚔️ BẮT ĐẦU NGAY</button>`;
        }
    }

    let p1Badge = m.p1_ready && !isFinished ? `<span style="color:#00e676; font-size:12px; margin-left:4px; position: relative; z-index: 2;">✅</span>` : '';
    let p2Badge = m.p2_ready && !isFinished ? `<span style="color:#00e676; font-size:12px; margin-left:4px; position: relative; z-index: 2;">✅</span>` : '';

    const matchEl = document.createElement('div'); matchEl.className = 'bracket-match';
    
    let vsPill = `<div class="vs-text" style="margin: 0; padding: 2px 8px; position: relative; z-index: 2;">VS</div>`;

    matchEl.innerHTML = `
        <div class="player-name ${p1Class}" style="text-align: center; border-bottom: none; padding-bottom: 2px; position: relative; z-index: 2;">
            <span>${p1Name}${p1Star}</span> ${p1Badge}
        </div>
        <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin: 4px 0; position: relative; z-index: 2;">
            ${s1Text}
            ${vsPill}
            ${s2Text}
        </div>
        <div class="player-name ${p2Class}" style="text-align: center; border-bottom: 1px dashed rgba(255,255,255,0.2); padding-top: 2px; padding-bottom: 8px; position: relative; z-index: 2;">
            <span>${p2Name}${p2Star}</span> ${p2Badge}
        </div>
        ${timeInfo}
        ${btnAction}
    `;
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
                                pvpSpellContainer.style.cssText = 'width: 100%; margin-top: 15px; margin-bottom: 15px; text-align: center;';
                                document.getElementById('pvpOptions').parentNode.insertBefore(pvpSpellContainer, document.getElementById('pvpOptions'));
                            }
                            pvpSpellContainer.style.display = 'block';
                            pvpSpellContainer.innerHTML = ''; 

                            let words = m.current_q.en.trim().split(' '); 
                            words.forEach((w) => { 
                                let wordDiv = document.createElement('div'); 
                                wordDiv.style.cssText = 'display: flex; justify-content: center; gap: 4px; margin-bottom: 10px; width: 100%; flex-wrap: wrap;'; 
                                w.split('').forEach((char) => { 
                                    let inp = document.createElement('input'); 
                                    inp.className = 'spell-char'; 
                                    inp.style.cssText = "width:36px; height:46px; text-align:center; font-size:20px; font-weight:900; border-radius:8px; border:2px solid #ff5252; outline:none; text-transform:uppercase; background:white; color:black; box-shadow:0 2px 5px rgba(0,0,0,0.3); transition: all 0.2s;";
                                    // ĐÃ GỠ BỎ MÀN CHẮN MAXLENGTH ĐỂ BỘ GÕ TIẾNG TRUNG TỰ DO THỞ
                                    inp.dataset.char = char.toUpperCase(); 
                                    
                                    if(char === '-' || char === '/') { 
                                        inp.value = char; 
                                        inp.disabled = true; 
                                        inp.style.backgroundColor = '#ddd'; 
                                        inp.style.borderColor = '#aaa';
                                    } 
                                    wordDiv.appendChild(inp); 
                                }); 
                                pvpSpellContainer.appendChild(wordDiv); 
                            }); 
                            
                            let submitBtn = document.getElementById('pvpSpellSubmitBtn');
                            if(!submitBtn) {
                                submitBtn = document.createElement('button');
                                submitBtn.id = 'pvpSpellSubmitBtn';
                                submitBtn.innerText = "CHỐT ĐÁP ÁN (ENTER)";
                                submitBtn.style.cssText = "display: block; width: 100%; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 16px; background: linear-gradient(45deg, #d50000, #ff1744); color: white; border: none; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); margin-top: 10px;";
                                pvpSpellContainer.parentNode.insertBefore(submitBtn, pvpSpellContainer.nextSibling);
                            }
                            submitBtn.style.display = 'block';

                            let allInputs = Array.from(document.querySelectorAll('#pvpSpellContainer .spell-char')); 
                            
                            submitBtn.onclick = () => {
                                let fullAns = '';
                                allInputs.forEach(i => fullAns += i.value || '');
                                submitPvPAnswer(fullAns);
                            };

                            allInputs.forEach((inp, idx) => { 
                                if(!inp.disabled) { 
                                    inp.addEventListener('focus', () => inp.style.borderColor = '#ff1744');
                                    inp.addEventListener('blur', () => inp.style.borderColor = '#ff5252');
                                    
                                    // BÙA CHÚ DÀNH RIÊNG CHO BỘ GÕ PINYIN TIẾNG TRUNG
                                    let isComposing = false;
                                    inp.addEventListener('compositionstart', function() { isComposing = true; });
                                    inp.addEventListener('compositionend', function() { 
                                        isComposing = false; 
                                        handleInputAdvance(); 
                                    });
                                    inp.addEventListener('input', function() { 
                                        if(!isComposing) handleInputAdvance(); 
                                    });
                                    
                                    const handleInputAdvance = () => {
                                        if(inp.value) { 
                                            // Chỉ lấy ký tự đầu tiên để tránh kẹt chữ
                                            inp.value = inp.value.substring(0, 1).toUpperCase(); 
                                            if(idx < allInputs.length - 1) { 
                                                let curr = idx; 
                                                let next = allInputs[curr + 1]; 
                                                while(next && next.disabled && curr < allInputs.length - 1) { curr++; next = allInputs[curr + 1]; } 
                                                if(next && !next.disabled) next.focus(); 
                                            } 
                                        }
                                    };

                                    inp.addEventListener('keydown', function(e) { 
                                        if(e.key === 'Backspace' && !inp.value && idx > 0) { 
                                            let prevIdx = idx - 1; let prev = allInputs[prevIdx]; 
                                            while(prev && prev.disabled && prevIdx > 0) { prevIdx--; prev = allInputs[prevIdx]; } 
                                            if(prev && !prev.disabled) { prev.focus(); prev.value = ''; e.preventDefault(); } 
                                        } 
                                        if(e.key === 'Enter') {
                                            submitBtn.click();
                                        }
                                    }); 
                                } 
                            }); 
                            let first = allInputs.find(i => !i.disabled); 
                            if(first) setTimeout(() => first.focus(), 300);

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

                            setTimeout(() => {
                                if(waitTime > 0) document.getElementById('botStatusMsg').innerText = "ĐÃ ĐẾN LÚC! CHỐT NHANH!";
                                revealOptions(m, myAns, [0, 1, 2, 3]); 
                                startCountdown(m); 
                            }, waitTime);
                        }
                    }
                    
                    let oppAns = isP1 ? m.p2_ans : m.p1_ans; let botStatus = document.getElementById('botStatusMsg'); 
                    if(oppAns !== "") { botStatus.innerText = "Đối thủ đã chốt!"; botStatus.style.color = "#ff1744"; } else { botStatus.innerText = "Đang kết nối..."; botStatus.style.color = "#00e676"; } 
                   // =========================================================
                    // 🤖 BÙA CHÚ 2: THỔI HỒN CHO BOT TỰ THI ĐẤU (V2.1 - Chống Lú Lẫn)
                    // =========================================================
                    let isOppBot = (isP1 && m.p2.includes('🤖')) || (isP2 && m.p1.includes('🤖'));
                    let isBotVsBot = m.p1.includes('🤖') && m.p2.includes('🤖') && userData.role === 'teacher';

                    // Đạo bùa mới: Ghép Tên 2 cao thủ + Số hiệp để tạo Chìa khóa độc nhất!
                    // Tránh việc trận mới bị lú lẫn trí nhớ của trận cũ!
                    let roundKey = m.p1 + "_" + m.p2 + "_" + m.q_idx;

                    if ((isOppBot || isBotVsBot) && window.botTimerRound !== roundKey) {
                        window.botTimerRound = roundKey; 
                        
                        let waitTime = m.unlock_time ? Math.max(0, m.unlock_time - Date.now()) : 0;
                        
                        let botThink1 = Math.floor(Math.random() * 4000) + 2000; // Bot nảy số 2s - 6s
                        let botThink2 = Math.floor(Math.random() * 4000) + 2000;

                        const executeBotSubmit = (playerSlot, thinkTime) => {
                            setTimeout(() => {
                                rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(snap => {
                                    let currentM = snap.val();
                                    if (currentM && currentM.status === 'playing' && currentM.q_idx === m.q_idx) {
                                        let botUpdates = {};
                                        let isSpellingMode = currentM.mode === 'spelling' || (currentM.mode === 'golden' && currentM.current_q.is_spelling);
                                        let correctEn = isSpellingMode ? currentM.current_q.en.toUpperCase().replace(/\s+/g, '').split('/').sort().join('/') : "";
                                        
                                        // Độ thông minh 85%
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
                    // =========================================================
                    if (m.p1_ans !== "" && m.p2_ans !== "" && !m.evaluating) { clearInterval(window.pvpTimer); triggerEval(); } 
                } else if (m.status === 'showing_result') { 
                    clearInterval(window.pvpTimer); document.getElementById('pvpTimerBanner').innerText = `⏳ 0s`; 
                    let myWin = (isP1 && m.p1_won_this_round) || (isP2 && m.p2_won_this_round); let waitMsg = document.getElementById('pvpWaitMsg'); waitMsg.style.display = 'block'; 
                    if (myWin) { waitMsg.innerText = "🎉 CHÍNH XÁC & NHANH NHẤT! (+1)"; waitMsg.style.color = "#00e676"; } else { let wasWrong = false; let myAns = isP1 ? m.p1_ans : m.p2_ans; if(myAns !== "") wasWrong = true; if(!wasWrong && myAns !== "") waitMsg.innerText = "❌ CHÍNH XÁC NHƯNG CHẬM HƠN!"; else if(wasWrong) waitMsg.innerText = "❌ SAI RỒI!"; else waitMsg.innerText = "❌ HẾT GIỜ!"; waitMsg.style.color = "#ff1744"; } 
                    document.getElementById('lockOverlay').classList.remove('active'); 
                    
                    let isSpellingMode = m.mode === 'spelling' || (m.mode === 'golden' && m.current_q.is_spelling);
                    if (!isSpellingMode) {
                        for(let i=0; i<4; i++) { let btn = document.getElementById('pvpOpt'+i); btn.style.pointerEvents = 'none'; if (btn.innerText === m.current_q.vi) { btn.style.backgroundColor = '#00c853'; btn.style.borderColor = '#00e676'; btn.style.opacity = '1'; } else { btn.style.opacity = '0.3'; } } 
                    } else {
                        let allInputs = Array.from(document.querySelectorAll('#pvpSpellContainer .spell-char'));
                        allInputs.forEach(i => i.disabled = true);
                        let submitBtn = document.getElementById('pvpSpellSubmitBtn');
                        if(submitBtn) submitBtn.style.display = 'none';
                    }
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
                    document.getElementById('pvpQuestion').style.display = 'none'; document.getElementById('pvpOptions').style.display = 'none'; 
                    let pvpSpellContainer = document.getElementById('pvpSpellContainer');
                    if(pvpSpellContainer) pvpSpellContainer.style.display = 'none';
                    let submitBtn = document.getElementById('pvpSpellSubmitBtn');
                    if(submitBtn) submitBtn.style.display = 'none';
                    document.getElementById('lockOverlay').classList.remove('active'); 
                    
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

async function adminStartPvP(league, stageKey, matchIndex, p1Name, p2Name) { 
    const syllabusSnap = await rtdb.ref(`tournament_status/${currentRealm}/syllabus`).once('value'); 
    const selectedLessons = syllabusSnap.val(); 
    
    // Đã thêm lệnh cảnh báo gắt gao nếu chưa có giáo án!
    if(!selectedLessons || selectedLessons.length === 0) return alert("❌ Báo cáo: Ngự Thiện Phòng chưa có giáo án!\nBệ hạ vui lòng chọn Bài Học và bấm 'Khóa đề thi' trước khi khởi động trận đấu."); 
    
    let allVocab = []; 
    selectedLessons.forEach(ln => { 
        let lesson = allLessonsData.find(l => l.name === ln); 
        if(lesson) allVocab = allVocab.concat(lesson.vocab); 
    }); 
    
    // Đã nới lỏng yêu cầu số từ xuống 10 (thay vì 30) để dễ test, và báo lỗi sập màn hình nếu thiếu!
    if(allVocab.length < 10) return alert(`❌ Lỗi: Kho dữ liệu hiện tại chỉ có ${allVocab.length} từ. Lôi đài cần ít nhất 10 từ để khởi động!\nBệ hạ hãy chọn thêm Bài học ở Ngự Thiện Phòng.`); 
    
    allVocab.sort(() => Math.random() - 0.5); 
    let bankSize = Math.min(30, allVocab.length); // Tự động co giãn từ 10 - 30 câu tùy ngân hàng
    
    let pvpQuestionBank = allVocab.slice(0, bankSize).map(v => { 
        let wrong = allVocab.filter(x => x.vi !== v.vi).sort(() => Math.random() - 0.5).slice(0, 3); 
        // Bơm thêm đáp án ảo nếu kho từ vựng quá nghèo nàn, tránh nổ tung
        while(wrong.length < 3) { wrong.push({vi: "Nhiễu " + Math.random().toString(36).substr(2, 5)}); }
        let opts = [v.vi, ...wrong.map(w => w.vi)].sort(() => Math.random() - 0.5); 
        return { en: v.en, vi: v.vi, opts: opts }; 
    }); 
    
    window.isSpectating = true; 
    
    rtdb.ref(`active_pvp_match/${currentRealm}`).set({ 
        league: league, stage: stageKey, match_idx: matchIndex, p1: p1Name, p2: p2Name, 
        p1_set: 0, p2_set: 0, p1_score: 0, p2_score: 0, status: 'playing', 
        q_idx: 1, current_q: pvpQuestionBank[0], 
        mode: 'normal', 
        time_limit: 15, unlock_time: Date.now() + 8000, 
        p1_ans: "", p1_time: 0, p2_ans: "", p2_time: 0, evaluating: false, question_bank: pvpQuestionBank 
    }); 
}

function submitPvPAnswer(idxOrStr) {
    rtdb.ref(`active_pvp_match/${currentRealm}`).once('value').then(snap => {
        let m = snap.val(); if(!m || m.status !== 'playing' || m.evaluating) return;
        let isP1 = userData.displayName === m.p1; let isP2 = userData.displayName === m.p2;
        if((isP1 && m.p1_ans !== "") || (isP2 && m.p2_ans !== "")) return;
        
        let selectedText = "";
        let isCorrect = false;

        if (typeof idxOrStr === 'string') {
            selectedText = idxOrStr.trim().toUpperCase();
            
            // ĐẠO LUẬT BAO DUNG: Băm chuỗi theo dấu /, sắp xếp lại, rồi mới so sánh
            let compareUser = selectedText.replace(/\s+/g, '').split('/').sort().join('/');
            let compareCorrect = m.current_q.en.toUpperCase().replace(/\s+/g, '').split('/').sort().join('/');
            isCorrect = compareUser === compareCorrect;
            
            let allInputs = Array.from(document.querySelectorAll('#pvpSpellContainer .spell-char'));
            allInputs.forEach(i => i.disabled = true);
            if (isCorrect) {
                allInputs.forEach(i => { i.style.backgroundColor = '#d1fae5'; i.style.borderColor = '#10b981'; i.style.color = '#065f46'; });
            } else {
                allInputs.forEach(inp => { 
                    inp.style.backgroundColor = '#fee2e2'; 
                    inp.style.borderColor = '#ef4444'; 
                    inp.style.color = '#991b1b'; 
                    if(inp.dataset.char !== '-' && inp.dataset.char !== '/') inp.value = inp.dataset.char; 
                });
            }
            let submitBtn = document.getElementById('pvpSpellSubmitBtn');
            if(submitBtn) submitBtn.style.display = 'none';
        } else {
            selectedText = m.current_q.opts[idxOrStr]; 
            isCorrect = selectedText === m.current_q.vi;
            let btn = document.getElementById('pvpOpt' + idxOrStr); 
            btn.style.backgroundColor = isCorrect ? '#00c853' : '#d50000'; 
            btn.style.borderColor = isCorrect ? '#00e676' : '#ff1744';
            for(let i=0; i<4; i++) { document.getElementById('pvpOpt'+i).style.pointerEvents = 'none'; } 
        }

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
            
            let p1_c = false; let p2_c = false;
            if (m.mode === 'spelling' || (m.mode === 'golden' && m.current_q.is_spelling)) {
                // ĐẠO LUẬT BAO DUNG: Băm chuỗi theo dấu /, sắp xếp lại, rồi mới so sánh
                let correctStr = m.current_q.en.toUpperCase().replace(/\s+/g, '').split('/').sort().join('/');
                p1_c = (m.p1_ans || "").toUpperCase().replace(/\s+/g, '').split('/').sort().join('/') === correctStr;
                p2_c = (m.p2_ans || "").toUpperCase().replace(/\s+/g, '').split('/').sort().join('/') === correctStr;
            } else {
                p1_c = m.p1_ans === m.current_q.vi; 
                p2_c = m.p2_ans === m.current_q.vi;
            }
            
            let p1_w = false; let p2_w = false;
            
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
            
            else if (m.q_idx === 20) {
                if(set1 > set2) { status = 'finished'; winner = m.p1; }
                else if(set2 > set1) { status = 'finished'; winner = m.p2; }
            }
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
            updates.status = 'playing'; updates.q_idx = nextIdx; 
            let nextQ = m.question_bank[nextIdx - 1];
            updates.current_q = nextQ; 
            
            if (nextIdx <= 10) { 
                updates.mode = 'normal'; 
                updates.time_limit = 15; 
                updates.unlock_time = Date.now() + 8000;
            } 
            else if (nextIdx <= 20) { 
                updates.mode = 'spelling'; 
                updates.time_limit = 30; 
                updates.unlock_time = 0;
            } 
            else { 
                let isSpellingNow = Math.random() > 0.5;
                updates.mode = 'golden'; 
                updates.current_q.is_spelling = isSpellingNow; 

                if (isSpellingNow) {
                    updates.time_limit = 20; 
                    updates.unlock_time = 0;
                } else {
                    updates.time_limit = 7; 
                    updates.unlock_time = Date.now() + 8000;
                }
            }
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
    if (e.data === 'CORRECT' || e.data === 'SPELLING_CORRECT') { 
        if (currentUser && userData) { 
            let multiplier = (userData.potionX3Expiry && userData.potionX3Expiry > Date.now()) ? 3 : ((userData.potionExpiry && userData.potionExpiry > Date.now()) ? 2 : 1);
            
            let baseXP = (e.data === 'SPELLING_CORRECT') ? 25 : 15;
            let baseGold = (e.data === 'SPELLING_CORRECT') ? 25 : 10;

            let xpGained = baseXP * multiplier; let goldGained = baseGold * multiplier; 
            userData.xp = (userData.xp || 0) + xpGained; userData.gold = (userData.gold || 0) + goldGained; userData.weeklyXp = (userData.weeklyXp || 0) + xpGained;
            
            let oldHighest = userData.highestWeeklyXp || 0; let isRecordBroken = false;
            if (oldHighest > 0 && userData.weeklyXp > oldHighest) { userData.highestWeeklyXp = userData.weeklyXp; if (!userData.hasBrokenRecordThisWeek) { userData.hasBrokenRecordThisWeek = true; isRecordBroken = true; } } else if (oldHighest === 0 && userData.weeklyXp > 0) { userData.highestWeeklyXp = userData.weeklyXp; }
            
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
    else if (e.data === 'TM_RESULT_PASS') { closeModal(); let oldS = userData.streak; userData.streak = userData.timeMachine.lostStreak + userData.timeMachine.missedDays; userData.timeMachine = null; db.collection('vocab_users').doc(currentUser.uid).update({ streak: userData.streak, timeMachine: null }).then(() => { updateUI(); alert(`🎉 KỲ TÍCH! Chuỗi đã phục hồi lên mốc ${userData.streak}!`); triggerConfetti(); if(window.checkAndGrantStreakRewards) window.checkAndGrantStreakRewards(oldS, userData.streak); }); }
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
    
    const template = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"><\/script><style>body { background-color: transparent; margin: 0; padding: 10px; font-family: 'Segoe UI', sans-serif; } .perspective { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .flipped .transform-style-3d { transform: rotateY(180deg); } .quiz-btn { width: 100%; padding: 15px; margin-bottom: 10px; border-radius: 12px; border: 2px solid #e0e7ff; background: white; font-weight: bold; color: #3730a3; transition: 0.2s; text-align: left; font-size: 16px; cursor: pointer;} .quiz-btn:hover { border-color: #4f46e5; background: #e0e7ff; } .quiz-btn.correct { background: #10b981; color: white; border-color: #059669; } .quiz-btn.wrong { background: #ef4444; color: white; border-color: #b91c1c; } .disabled { pointer-events: none; }</style></head><body><div id="flashcard-section" class="flex flex-col items-center w-full max-w-md mx-auto"><div class="text-center mb-4 text-indigo-800 font-bold" id="card-counter">Thẻ 1 / ${vocabArray.length}</div><div id="flashcard" class="perspective w-full h-80 cursor-pointer mb-6" onclick="flipCard()"><div class="transform-style-3d relative w-full h-full rounded-2xl shadow-lg"><div id="card-front" class="backface-hidden absolute w-full h-full bg-white rounded-2xl flex flex-col items-center justify-center p-6 border-2 border-indigo-100"><div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;"><div id="word-en" class="text-5xl font-extrabold text-indigo-900">Word</div><button onclick="speakWord(document.getElementById('word-en').innerText); event.stopPropagation();" style="background:none; border:none; font-size: 28px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" title="Nghe phát âm">🔊</button></div><div id="word-pro" class="text-lg text-gray-500 mb-4 font-mono">/pronunciation/</div><span id="word-type" class="px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold uppercase">Type</span></div><div id="card-back" class="backface-hidden rotate-y-180 absolute w-full h-full bg-gradient-to-br from-indigo-600 to-blue-800 rounded-2xl flex flex-col items-center justify-center p-6 text-white text-center"><div id="word-vi" class="text-3xl font-bold text-yellow-300">Nghĩa</div></div></div></div><div class="flex gap-4 w-full"><button onclick="prevCard()" class="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300">⬅ Trước</button><button onclick="nextCard()" id="next-btn" class="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">Tiếp ➡</button></div></div><div id="summary-section" class="hidden w-full max-w-md mx-auto relative"><div class="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100"><h2 class="text-xl font-bold text-indigo-800 mb-4 text-center border-b pb-3 flex items-center justify-center gap-2">📄 Vocabulary Summary</h2><div id="summary-list" class="max-h-96 overflow-y-auto pr-2 space-y-2"></div></div><button onclick="startQuiz()" class="w-full py-3 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600 text-lg shadow-md transition mb-3">Làm Trắc Nghiệm 🪙</button><button onclick="startSpelling()" class="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 text-lg shadow-md transition">Thử Thách Gõ Chính Tả ✍️</button></div><div id="quiz-section" class="hidden w-full max-w-md mx-auto relative"><div class="text-center mb-4"><span class="inline-block px-4 py-1 bg-yellow-100 text-yellow-800 font-bold rounded-full text-sm mb-2">Bài Tập Trắc Nghiệm 🪙</span><div id="timer-display" style="position: relative; width: 70px; height: 70px; margin: 0 auto 10px auto;"><svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"></circle><circle id="timer-circle" cx="50" cy="50" r="45" fill="none" stroke="#ef4444" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear;"></circle></svg><div id="timer-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: #ef4444;">15</div></div><button id="glass-btn" onclick="requestGlass()" class="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-lg text-sm mb-4 hover:bg-blue-200 transition">🔍 Dùng Kính Lúp (50/50)</button><div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 8px;"><h2 id="quiz-question" class="text-4xl font-extrabold text-indigo-900">Word</h2><button onclick="speakWord(document.getElementById('quiz-question').innerText);" style="background:none; border:none; font-size: 24px; cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" title="Nghe phát âm">🔊</button></div></div><div id="quiz-options" class="w-full"></div></div><div id="spelling-section" class="hidden w-full max-w-md mx-auto relative"><div class="text-center mb-4"><span class="inline-block px-4 py-1 bg-purple-100 text-purple-800 font-bold rounded-full text-sm mb-2">Gõ Chính Tả ✍️</span><div style="position: relative; width: 70px; height: 70px; margin: 0 auto 10px auto;"><svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"></circle><circle id="spell-timer-circle" cx="50" cy="50" r="45" fill="none" stroke="#9333ea" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear;"></circle></svg><div id="spell-timer-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: #9333ea;">30</div></div><h2 id="spell-question" class="text-3xl font-extrabold text-indigo-900 mt-2 mb-6">Nghĩa Tiếng Việt</h2></div><div id="spell-inputs" class="flex flex-wrap justify-center gap-2 mb-6 w-full"></div><button onclick="submitSpelling()" id="spell-submit-btn" class="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 text-lg shadow-md transition">Chốt Đáp Án (Enter)</button></div><script>function speakWord(text) { if ('speechSynthesis' in window) { let msg = new SpeechSynthesisUtterance(text); let isChinese = /[\\u4E00-\\u9FA5]/.test(text); msg.lang = isChinese ? 'zh-CN' : 'en-US'; msg.rate = 0.9; let voices = window.speechSynthesis.getVoices(); if(isChinese) { let zhVoice = voices.find(v => v.lang.includes('zh')); if(zhVoice) msg.voice = zhVoice; } else { let femaleVoice = voices.find(v => v.name.includes('Zira') || v.name.includes('Google US English') || v.name.includes('Hazel') || v.name.includes('Samantha')); if (femaleVoice) { msg.voice = femaleVoice; } } window.speechSynthesis.speak(msg); } } const vocabList = [${vocabArray.join(',\n')}]; let currentIndex = 0; const flashcardEl = document.getElementById('flashcard'); function loadCard(index) { flashcardEl.classList.remove('flipped'); setTimeout(() => { document.getElementById('word-en').innerText = vocabList[index].en; document.getElementById('word-pro').innerText = vocabList[index].pro; document.getElementById('word-type').innerText = vocabList[index].type; document.getElementById('word-vi').innerText = vocabList[index].vi; document.getElementById('card-counter').innerText = 'Thẻ ' + (index + 1) + ' / ' + vocabList.length; const nextBtn = document.getElementById('next-btn'); if (index === vocabList.length - 1) { nextBtn.innerText = "Xem Tổng Hợp 📄"; nextBtn.className = "flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold hover:bg-yellow-600"; } else { nextBtn.innerText = "Tiếp ➡"; nextBtn.className = "flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700"; } }, 150); } function flipCard() { flashcardEl.classList.toggle('flipped'); } function prevCard() { if (currentIndex > 0) { currentIndex--; loadCard(currentIndex); } } function nextCard() { if (currentIndex < vocabList.length - 1) { currentIndex++; loadCard(currentIndex); } else { showSummary(); } } function showSummary() { document.getElementById('flashcard-section').classList.add('hidden'); document.getElementById('summary-section').classList.remove('hidden'); const listContainer = document.getElementById('summary-list'); listContainer.innerHTML = ''; vocabList.forEach(item => { let proText = item.pro ? \`<span class="text-sm text-gray-500 font-mono ml-2">\${item.pro}</span>\` : ''; listContainer.innerHTML += \`<div class="border-b border-gray-100 pb-3 flex justify-between items-center hover:bg-gray-50 p-2 rounded-lg transition"><div><div class="flex items-baseline"><span class="text-lg font-bold text-gray-900">\${item.en}</span>\${proText}</div><div class="text-sm text-gray-600 mt-1">\${item.vi}</div></div><button onclick="speakWord('\${item.en}')" class="text-indigo-500 hover:text-indigo-700 text-2xl" title="Nghe phát âm">🔊</button></div>\`; }); } let currentQuizIndex = 0; let quizOrder = []; let timerId; let timeLeft = 15; let glassUsedThisQuestion = false; function startTimer() { timeLeft = 15; document.getElementById('timer-circle').style.strokeDashoffset = '0'; document.getElementById('timer-text').innerText = timeLeft; clearInterval(timerId); timerId = setInterval(() => { timeLeft--; const offset = 283 - (timeLeft / 15) * 283; document.getElementById('timer-circle').style.strokeDashoffset = offset; document.getElementById('timer-text').innerText = timeLeft; if(timeLeft <= 0) { clearInterval(timerId); timeOut(); } }, 1000); } function timeOut() { const optionsContainer = document.getElementById('quiz-options'); optionsContainer.classList.add('disabled'); const correctWord = vocabList[quizOrder[currentQuizIndex]]; Array.from(optionsContainer.children).forEach(child => { child.style.visibility = 'visible'; if (child.innerText === correctWord.vi) child.classList.add('correct'); else child.classList.add('wrong'); }); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadQuizQuestion(); else finishQuiz(); }, 2000); } function startQuiz() { document.getElementById('summary-section').classList.add('hidden'); document.getElementById('quiz-section').classList.remove('hidden'); quizOrder = [...Array(vocabList.length).keys()].sort(() => Math.random() - 0.5); currentQuizIndex = 0; loadQuizQuestion(); } function loadQuizQuestion() { glassUsedThisQuestion = false; document.getElementById('glass-btn').classList.remove('hidden'); const optionsContainer = document.getElementById('quiz-options'); optionsContainer.innerHTML = ''; optionsContainer.classList.remove('disabled'); const correctWord = vocabList[quizOrder[currentQuizIndex]]; document.getElementById('quiz-question').innerText = correctWord.en; let options = [correctWord.vi]; let wrongOptions = vocabList.filter(w => w.en !== correctWord.en).map(w => w.vi); wrongOptions = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 3); options = options.concat(wrongOptions); options.sort(() => Math.random() - 0.5); options.forEach(opt => { const btn = document.createElement('button'); btn.className = 'quiz-btn'; btn.innerText = opt; btn.onclick = () => checkAnswer(btn, opt, correctWord.vi); optionsContainer.appendChild(btn); }); startTimer(); } function requestGlass() { if(glassUsedThisQuestion) return; if(window.parent) window.parent.postMessage('REQ_GLASS', '*'); } window.addEventListener('message', function(e) { if(e.data === 'APPROVE_GLASS') { glassUsedThisQuestion = true; document.getElementById('glass-btn').classList.add('hidden'); const optionsContainer = document.getElementById('quiz-options'); const correctWord = vocabList[quizOrder[currentQuizIndex]]; let hiddenCount = 0; Array.from(optionsContainer.children).forEach(btn => { if(btn.innerText !== correctWord.vi && hiddenCount < 2) { btn.style.visibility = 'hidden'; hiddenCount++; } }); } }); function finishQuiz() { const optionsContainer = document.getElementById('quiz-options'); optionsContainer.innerHTML = '<div class="text-center p-6 bg-green-100 text-green-800 rounded-xl font-bold text-xl">🎉 Đã hoàn thành Trắc Nghiệm! Nhấn F5 để ôn lại.</div>'; document.getElementById('timer-display').style.display = 'none'; document.getElementById('glass-btn').style.display = 'none'; } function checkAnswer(btn, selectedVi, correctVi) { clearInterval(timerId); const optionsContainer = document.getElementById('quiz-options'); optionsContainer.classList.add('disabled'); if (selectedVi === correctVi) { btn.classList.add('correct'); if(window.parent) window.parent.postMessage('CORRECT', '*'); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadQuizQuestion(); else finishQuiz(); }, 1500); } else { btn.classList.add('wrong'); Array.from(optionsContainer.children).forEach(child => { child.style.visibility = 'visible'; if (child.innerText === correctVi) child.classList.add('correct'); }); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadQuizQuestion(); else finishQuiz(); }, 2000); } } let spellTimerId; let spellTimeLeft = 30; function startSpelling() { document.getElementById('summary-section').classList.add('hidden'); document.getElementById('spelling-section').classList.remove('hidden'); quizOrder = [...Array(vocabList.length).keys()].sort(() => Math.random() - 0.5); currentQuizIndex = 0; loadSpellingQuestion(); } function loadSpellingQuestion() { const correctWord = vocabList[quizOrder[currentQuizIndex]]; document.getElementById('spell-question').innerText = correctWord.vi; document.getElementById('spell-submit-btn').classList.remove('hidden'); const container = document.getElementById('spell-inputs'); container.innerHTML = ''; let words = correctWord.en.trim().split(' '); words.forEach((w) => { let wordDiv = document.createElement('div'); wordDiv.className = 'flex flex-wrap justify-center gap-1 sm:gap-2 mb-3 w-full'; w.split('').forEach((char) => { let inp = document.createElement('input'); inp.className = 'spell-char w-8 sm:w-10 h-11 sm:h-12 text-center text-lg sm:text-xl font-bold rounded-lg border-2 border-purple-300 focus:border-purple-600 focus:outline-none uppercase bg-white shadow-sm shrink-0'; inp.dataset.char = char.toUpperCase(); if(char === '-' || char === '/') { inp.value = char; inp.disabled = true; inp.classList.add('bg-gray-200'); } wordDiv.appendChild(inp); }); container.appendChild(wordDiv); }); let allInputs = Array.from(document.querySelectorAll('.spell-char')); allInputs.forEach((inp, idx) => { if(!inp.disabled) { let isComposing = false; inp.addEventListener('compositionstart', function() { isComposing = true; }); inp.addEventListener('compositionend', function() { isComposing = false; handleInput(); }); inp.addEventListener('input', function() { if(!isComposing) handleInput(); }); function handleInput() { if(inp.value) { inp.value = inp.value.substring(0, 1).toUpperCase(); if(idx < allInputs.length - 1) { let curr = idx; let next = allInputs[curr + 1]; while(next && next.disabled && curr < allInputs.length - 1) { curr++; next = allInputs[curr + 1]; } if(next && !next.disabled) next.focus(); } } } inp.addEventListener('keydown', function(e) { if(e.key === 'Backspace' && !inp.value && idx > 0) { let prevIdx = idx - 1; let prev = allInputs[prevIdx]; while(prev && prev.disabled && prevIdx > 0) { prevIdx--; prev = allInputs[prevIdx]; } if(prev && !prev.disabled) { prev.focus(); prev.value = ''; e.preventDefault(); } } if(e.key === 'Enter') submitSpelling(); }); } }); let first = allInputs.find(i => !i.disabled); if(first) setTimeout(() => first.focus(), 300); spellTimeLeft = 30; document.getElementById('spell-timer-circle').style.strokeDashoffset = '0'; document.getElementById('spell-timer-text').innerText = spellTimeLeft; clearInterval(spellTimerId); spellTimerId = setInterval(() => { spellTimeLeft--; const offset = 283 - (spellTimeLeft / 30) * 283; document.getElementById('spell-timer-circle').style.strokeDashoffset = offset; document.getElementById('spell-timer-text').innerText = spellTimeLeft; if(spellTimeLeft <= 0) { checkSpellingAnswer(true); } }, 1000); } function submitSpelling() { checkSpellingAnswer(false); } function checkSpellingAnswer(isTimeOut) { clearInterval(spellTimerId); document.getElementById('spell-submit-btn').classList.add('hidden'); let allInputs = Array.from(document.querySelectorAll('.spell-char')); allInputs.forEach(i => i.disabled = true); const container = document.getElementById('spell-inputs'); let fullUserAns = []; Array.from(container.children).forEach(wordDiv => { let w = ''; Array.from(wordDiv.children).forEach(inp => w += inp.value || ''); fullUserAns.push(w); }); let finalStr = fullUserAns.join(' ').toUpperCase(); let correctStr = vocabList[quizOrder[currentQuizIndex]].en.toUpperCase().trim(); let compareUser = finalStr.replace(/\\s+/g, '').split('/').sort().join('/'); let compareCorrect = correctStr.replace(/\\s+/g, '').split('/').sort().join('/'); const isCorrect = (compareUser === compareCorrect) && !isTimeOut; if (isCorrect) { allInputs.forEach(i => { i.style.backgroundColor = '#d1fae5'; i.style.borderColor = '#10b981'; i.style.color = '#065f46'; }); if(window.parent) window.parent.postMessage('SPELLING_CORRECT', '*'); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadSpellingQuestion(); else finishSpelling(); }, 1200); } else { allInputs.forEach(inp => { inp.style.backgroundColor = '#fee2e2'; inp.style.borderColor = '#ef4444'; inp.style.color = '#991b1b'; inp.value = inp.dataset.char; }); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadSpellingQuestion(); else finishSpelling(); }, 2500); } } function finishSpelling() { document.getElementById('spell-inputs').innerHTML = ''; document.getElementById('spell-question').style.display = 'none'; document.getElementById('spelling-section').innerHTML += '<div class="text-center p-6 bg-purple-100 text-purple-800 rounded-xl font-bold text-xl">🎉 Đã hoàn thành thử thách Gõ Chính Tả! Nhấn F5 để ôn lại.</div>'; } loadCard(0); <\/script></body></html>`;
    document.getElementById('generatedCode').value = template;
    let evalVocab = []; try { evalVocab = eval("[" + vocabArray.join(',') + "]"); } catch(e) {}
    currentGeneratedVocab = evalVocab;
    alert("Đúc mã thành công! Giao diện đã tương thích hoàn hảo với Mobile!");
}

function openTimeMachineModal() {
    let bank = userData.timeMachine.currentBank; let vocabArray = bank.map(v => `{ en: "${v.en.replace(/"/g, '\\"')}", vi: "${v.vi.replace(/"/g, '\\"')}", pro: "${(v.pro||'').replace(/"/g, '\\"')}", type: "${(v.type||'').replace(/"/g, '\\"')}" }`); let currentDay = (userData.timeMachine.daysRecovered || 0) + 1; let totalDays = userData.timeMachine.missedDays;
    let tmTemplate = `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script src="https://cdn.tailwindcss.com"><\/script><style>body { background-color: #f3e5f5; margin: 0; padding: 10px; font-family: 'Segoe UI', sans-serif; } .perspective { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1); } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); } .flipped .transform-style-3d { transform: rotateY(180deg); } .quiz-btn { width: 100%; padding: 15px; margin-bottom: 10px; border-radius: 12px; border: 2px solid #e0e7ff; background: white; font-weight: bold; color: #3730a3; transition: 0.2s; text-align: left; font-size: 16px; cursor: pointer;} .quiz-btn:hover { border-color: #4f46e5; background: #e0e7ff; } .quiz-btn.correct { background: #10b981; color: white; border-color: #059669; } .quiz-btn.wrong { background: #ef4444; color: white; border-color: #b91c1c; } .disabled { pointer-events: none; }</style></head><body><div id="flashcard-section" class="flex flex-col items-center w-full max-w-md mx-auto"><div class="text-center mb-4 text-purple-800 font-bold text-xl">⏳ KHỔ HÌNH: NGÀY ${currentDay}/${totalDays} ⏳</div><div class="text-center mb-4 text-purple-600 font-bold" id="card-counter">Thẻ 1 / ${vocabArray.length}</div><div id="flashcard" class="perspective w-full h-80 cursor-pointer mb-6" onclick="flipCard()"><div class="transform-style-3d relative w-full h-full rounded-2xl shadow-lg"><div id="card-front" class="backface-hidden absolute w-full h-full bg-white rounded-2xl flex flex-col items-center justify-center p-6 border-4 border-purple-300"><div id="word-en" class="text-5xl font-extrabold text-purple-900 mb-2">Word</div><div id="word-pro" class="text-lg text-gray-500 mb-4 font-mono">/pronunciation/</div><span id="word-type" class="px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold uppercase">Type</span></div><div id="card-back" class="backface-hidden rotate-y-180 absolute w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex flex-col items-center justify-center p-6 text-white text-center"><div id="word-vi" class="text-3xl font-bold text-yellow-300">Nghĩa</div></div></div></div><div class="flex gap-4 w-full"><button onclick="prevCard()" class="flex-1 py-3 rounded-xl bg-gray-300 text-gray-700 font-bold hover:bg-gray-400">⬅ Trước</button><button onclick="nextCard()" id="next-btn" class="flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700">Tiếp ➡</button></div></div><div id="quiz-section" class="hidden w-full max-w-md mx-auto relative"><div class="text-center mb-4"><span class="inline-block px-4 py-1 bg-red-100 text-red-800 font-bold rounded-full text-sm mb-2">Sinh Tử Gõ Chính Tả: ${currentDay}/${totalDays} ⏳</span><div style="position: relative; width: 70px; height: 70px; margin: 0 auto 10px auto;"><svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: rotate(-90deg);" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="8"></circle><circle id="spell-timer-circle" cx="50" cy="50" r="45" fill="none" stroke="#dc2626" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="0" style="transition: stroke-dashoffset 1s linear;"></circle></svg><div id="spell-timer-text" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: #dc2626;">25</div></div><h2 id="spell-question" class="text-3xl font-extrabold text-purple-900 mt-2 mb-6">Nghĩa Tiếng Việt</h2></div><div id="spell-inputs" class="flex flex-wrap justify-center gap-2 mb-6 w-full"></div><button onclick="submitSpelling()" id="spell-submit-btn" class="w-full py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 text-lg shadow-md transition">Chốt Đáp Án (Enter)</button></div><script>const vocabList = [${vocabArray.join(',\n')}]; let currentIndex = 0; const flashcardEl = document.getElementById('flashcard'); function loadCard(index) { flashcardEl.classList.remove('flipped'); setTimeout(() => { document.getElementById('word-en').innerText = vocabList[index].en; document.getElementById('word-pro').innerText = vocabList[index].pro; document.getElementById('word-type').innerText = vocabList[index].type; document.getElementById('word-vi').innerText = vocabList[index].vi; document.getElementById('card-counter').innerText = 'Thẻ ' + (index + 1) + ' / ' + vocabList.length; const nextBtn = document.getElementById('next-btn'); if (index === vocabList.length - 1) { nextBtn.innerText = "BẮT ĐẦU THI"; nextBtn.className = "flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"; } else { nextBtn.innerText = "Tiếp ➡"; nextBtn.className = "flex-1 py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700"; } }, 150); } function flipCard() { flashcardEl.classList.toggle('flipped'); } function prevCard() { if (currentIndex > 0) { currentIndex--; loadCard(currentIndex); } } function nextCard() { if (currentIndex < vocabList.length - 1) { currentIndex++; loadCard(currentIndex); } else { startSpelling(); } } let currentQuizIndex = 0; let quizOrder = []; let spellTimerId; let spellTimeLeft = 25; let correctAnswersCount = 0; function startSpelling() { document.getElementById('flashcard-section').classList.add('hidden'); document.getElementById('quiz-section').classList.remove('hidden'); quizOrder = [...Array(vocabList.length).keys()].sort(() => Math.random() - 0.5); currentQuizIndex = 0; loadSpellingQuestion(); } function loadSpellingQuestion() { const correctWord = vocabList[quizOrder[currentQuizIndex]]; document.getElementById('spell-question').innerText = correctWord.vi; document.getElementById('spell-submit-btn').classList.remove('hidden'); const container = document.getElementById('spell-inputs'); container.innerHTML = ''; let words = correctWord.en.trim().split(' '); words.forEach((w) => { let wordDiv = document.createElement('div'); wordDiv.className = 'flex flex-wrap justify-center gap-1 sm:gap-2 mb-3 w-full'; w.split('').forEach((char) => { let inp = document.createElement('input'); inp.className = 'spell-char w-8 sm:w-10 h-11 sm:h-12 text-center text-lg sm:text-xl font-bold rounded-lg border-2 border-red-300 focus:border-red-600 focus:outline-none uppercase bg-white shadow-sm shrink-0'; inp.dataset.char = char.toUpperCase(); if(char === '-' || char === '/') { inp.value = char; inp.disabled = true; inp.classList.add('bg-gray-200'); } wordDiv.appendChild(inp); }); container.appendChild(wordDiv); }); let allInputs = Array.from(document.querySelectorAll('.spell-char')); allInputs.forEach((inp, idx) => { if(!inp.disabled) { inp.addEventListener('input', function() { this.value = this.value.toUpperCase(); if(this.value && idx < allInputs.length - 1) { let next = allInputs[idx + 1]; while(next && next.disabled && idx < allInputs.length - 1) { idx++; next = allInputs[idx + 1]; } if(next && !next.disabled) next.focus(); } }); inp.addEventListener('keydown', function(e) { if(e.key === 'Backspace' && !this.value && idx > 0) { let prevIdx = idx - 1; let prev = allInputs[prevIdx]; while(prev && prev.disabled && prevIdx > 0) { prevIdx--; prev = allInputs[prevIdx]; } if(prev && !prev.disabled) { prev.focus(); prev.value = ''; e.preventDefault(); } } if(e.key === 'Enter') submitSpelling(); }); } }); let first = allInputs.find(i => !i.disabled); if(first) setTimeout(() => first.focus(), 300); spellTimeLeft = 25; document.getElementById('spell-timer-circle').style.strokeDashoffset = '0'; document.getElementById('spell-timer-text').innerText = spellTimeLeft; clearInterval(spellTimerId); spellTimerId = setInterval(() => { spellTimeLeft--; const offset = 283 - (spellTimeLeft / 25) * 283; document.getElementById('spell-timer-circle').style.strokeDashoffset = offset; document.getElementById('spell-timer-text').innerText = spellTimeLeft; if(spellTimeLeft <= 0) { checkSpellingAnswer(true); } }, 1000); } function submitSpelling() { checkSpellingAnswer(false); } function checkSpellingAnswer(isTimeOut) { clearInterval(spellTimerId); document.getElementById('spell-submit-btn').classList.add('hidden'); let allInputs = Array.from(document.querySelectorAll('.spell-char')); allInputs.forEach(i => i.disabled = true); const container = document.getElementById('spell-inputs'); let fullUserAns = []; Array.from(container.children).forEach(wordDiv => { let w = ''; Array.from(wordDiv.children).forEach(inp => w += inp.value || ''); fullUserAns.push(w); }); let finalStr = fullUserAns.join(' ').toUpperCase(); let correctStr = vocabList[quizOrder[currentQuizIndex]].en.toUpperCase().trim(); let compareUser = finalStr.replace(/\\s+/g, '').split('/').sort().join('/'); let compareCorrect = correctStr.replace(/\\s+/g, '').split('/').sort().join('/'); const isCorrect = (compareUser === compareCorrect) && !isTimeOut; if (isCorrect) { allInputs.forEach(i => { i.style.backgroundColor = '#d1fae5'; i.style.borderColor = '#10b981'; i.style.color = '#065f46'; }); correctAnswersCount++; setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadSpellingQuestion(); else finishSpelling(); }, 800); } else { allInputs.forEach(inp => { inp.style.backgroundColor = '#fee2e2'; inp.style.borderColor = '#ef4444'; inp.style.color = '#991b1b'; inp.value = inp.dataset.char; }); setTimeout(() => { currentQuizIndex++; if (currentQuizIndex < vocabList.length) loadSpellingQuestion(); else finishSpelling(); }, 2000); } } function finishSpelling() { clearInterval(spellTimerId); document.getElementById('spell-timer-text').parentElement.style.display = 'none'; let ratio = correctAnswersCount / vocabList.length; let container = document.getElementById('spell-inputs'); document.getElementById('spell-question').style.display = 'none'; if (ratio >= 0.8) { if (${currentDay} < ${totalDays}) { container.innerHTML = '<div class="text-center p-6 bg-green-100 text-green-900 rounded-xl font-bold text-xl mb-4 w-full">✅ Đã vượt qua Nhịp ' + ${currentDay} + ' (' + correctAnswersCount + '/' + vocabList.length + ')</div><button onclick="window.parent.postMessage(\\'TM_NEXT_DAY\\', \\'*\\')" class="w-full py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700">Chuyển sang ngày tiếp theo ➡</button>'; } else { container.innerHTML = '<div class="text-center p-6 bg-yellow-100 text-yellow-900 rounded-xl font-bold text-xl mb-4 w-full">🎉 XUYÊN KHÔNG THÀNH CÔNG! (' + correctAnswersCount + '/' + vocabList.length + ')</div><button onclick="window.parent.postMessage(\\'TM_RESULT_PASS\\', \\'*\\')" class="w-full py-3 rounded-xl bg-yellow-600 text-white font-bold hover:bg-yellow-700">Nhận Lại Chuỗi Của Bạn</button>'; } } else { container.innerHTML = '<div class="text-center p-6 bg-red-100 text-red-900 rounded-xl font-bold text-xl mb-4 w-full">❌ THẤT BẠI! Bạn chỉ đạt ' + correctAnswersCount + '/' + vocabList.length + '. Yêu cầu >= 80%.</div><button onclick="window.parent.postMessage(\\'TM_RESULT_FAIL\\', \\'*\\')" class="w-full py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700">Chấp nhận hình phạt</button>'; } } loadCard(0); <\/script></body></html>`;
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

setInterval(() => {
    if (currentRealm && currentFullBracketData) {
        if (typeof renderBracket === 'function') {
            renderBracket();
        }
    }
}, 10000);

function publishNotice() {
    let text = document.getElementById('adminNoticeInput').value;
    if(!text) return alert("Bệ hạ chưa nhập thánh ý!");
    rtdb.ref(`tournament_status/${currentRealm}/global_notice`).set(text).then(() => {
        alert("📢 Đã truyền loa thành công ra toàn cõi!");
        document.getElementById('adminNoticeInput').value = "";
    });
}

function clearNotice() {
    if(!confirm("Bệ hạ muốn thu hồi Thánh chỉ và tắt bảng LED?")) return;
    rtdb.ref(`tournament_status/${currentRealm}/global_notice`).set("").then(() => {
        alert("🔇 Đã tắt loa phát thanh!");
    });
}

function logoutApp() {
    if(auth) {
        auth.signOut().then(() => {
            alert("🚪 Đã thoát xác thành công! Ký ức cũ đã bị xóa sạch.");
            window.location.reload();
        }).catch(err => alert("Lỗi: " + err.message));
    }
}
