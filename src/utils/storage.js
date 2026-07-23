// ─── LocalStorage Helpers ───

const ACTIVE_USER_KEY = 'studentDiary_active_user';

export function getActiveUsername() {
    return localStorage.getItem(ACTIVE_USER_KEY);
}

export function setActiveUser(username) {
    if (username) {
        localStorage.setItem(ACTIVE_USER_KEY, username);
    } else {
        localStorage.removeItem(ACTIVE_USER_KEY);
    }
}

function getStorageKey() {
    const active = getActiveUsername();
    return active ? `studentDiary_${active}` : 'studentDiary_guest';
}

export function getData(username) {
    try {
        const key = username ? `studentDiary_${username}` : getStorageKey();
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function saveData(data, username) {
    const key = username ? `studentDiary_${username}` : getStorageKey();
    localStorage.setItem(key, JSON.stringify(data));
}

// ─── Data Migration for Existing Users ───
export function migrateOldData() {
    try {
        const oldRaw = localStorage.getItem('studentDiary');
        if (oldRaw) {
            const oldData = JSON.parse(oldRaw);
            const user = oldData.user?.username;
            if (user && !localStorage.getItem(`studentDiary_${user}`)) {
                // Move it to new multi-tenant slot
                localStorage.setItem(`studentDiary_${user}`, JSON.stringify(oldData));
            }
            // Remove the old global one to keep things clean
            localStorage.removeItem('studentDiary');
        }
    } catch (e) {
        console.warn("Migration failed:", e);
    }
}

// Call this immediately on script load
migrateOldData();

export function getUser() {
    const d = getData();
    return d?.user || null;
}

export function saveUser(user) {
    const d = getData() || {};
    d.user = user;
    saveData(d);
}

export function getCourses() {
    const d = getData();
    return d?.courses || [];
}

export function saveCourses(courses) {
    const d = getData() || {};
    d.courses = courses;
    saveData(d);
}

export function getTimetable() {
    const d = getData();
    return d?.timetable || {};
}

export function saveTimetable(timetable) {
    const d = getData() || {};
    d.timetable = timetable;
    saveData(d);
}

export function getAttendance() {
    const d = getData();
    return d?.attendance || [];
}

export function saveAttendance(attendance) {
    const d = getData() || {};
    d.attendance = attendance;
    saveData(d);
}

export function getSettings() {
    const d = getData();
    return d?.settings || {};
}

export function saveSettings(settings) {
    const d = getData() || {};
    d.settings = { ...(d.settings || {}), ...settings };
    saveData(d);
}

export function isLoggedIn() {
    return !!getUser()?.username;
}

export function isOnboarded() {
    const d = getData();
    return d?.onboarded === true;
}

export function setOnboarded(val) {
    const d = getData() || {};
    d.onboarded = val;
    saveData(d);
}

export function logoutUser() {
    setActiveUser(null);
}

export function clearData() {
    const key = getStorageKey();
    localStorage.removeItem(key);
}

export function todayStr() {
    return new Date().toISOString().split('T')[0];
}

export const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const DAY_LABELS = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
};

export function getTodayDay() {
    const d = new Date().getDay(); // 0=Sun
    const map = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return map[d];
}

export function getTodayClasses() {
    const tt = getTimetable();
    const day = getTodayDay();
    return tt[day] || [];
}
// Session-level flags (resets on refresh)
let attendancePopupDismissed = false;
let eventPopupDismissed = false;

export function isAttendancePopupDismissed() {
    return attendancePopupDismissed;
}

export function setAttendancePopupDismissed(val) {
    attendancePopupDismissed = !!val;
}

export function isEventPopupDismissed() {
    return eventPopupDismissed;
}

export function setEventPopupDismissed(val) {
    eventPopupDismissed = !!val;
}

export function getEvents() {
    const d = getData();
    return d?.events || [];
}

export function saveEvents(events) {
    const d = getData() || {};
    d.events = events;
    saveData(d);
}

// ─── Lumi Preferences ───

const DEFAULT_LUMI_PREFS = {
    attendanceGoal: 75,
    personality: null,          // null = not yet chosen (triggers first-time picker)
    preferredStudyTime: 'evening',
    studyGoal: '',
};

export function getLumiPrefs() {
    const d = getData();
    return { ...DEFAULT_LUMI_PREFS, ...(d?.lumiPrefs || {}) };
}

export function saveLumiPrefs(prefs) {
    const d = getData() || {};
    d.lumiPrefs = { ...(d.lumiPrefs || {}), ...prefs };
    saveData(d);
}

// ─── Lumi Memory (passive tracking) ───

const DEFAULT_LUMI_MEMORY = {
    lastActiveTime: null,
    taskCompletionTimes: [],
    chatCount: 0,
    topicsAsked: [],
};

export function getLumiMemory() {
    const d = getData();
    return { ...DEFAULT_LUMI_MEMORY, ...(d?.lumiMemory || {}) };
}

export function saveLumiMemory(memory) {
    const d = getData() || {};
    d.lumiMemory = { ...DEFAULT_LUMI_MEMORY, ...(d.lumiMemory || {}), ...memory };
    saveData(d);
}

export function recordTaskCompletion() {
    const mem = getLumiMemory();
    const now = new Date();
    mem.taskCompletionTimes = [
        ...(mem.taskCompletionTimes || []).slice(-49),
        { hour: now.getHours(), dayOfWeek: now.getDay(), timestamp: now.toISOString() }
    ];
    saveLumiMemory(mem);
}

export function recordChatInteraction(topic) {
    const mem = getLumiMemory();
    mem.chatCount = (mem.chatCount || 0) + 1;
    mem.lastActiveTime = new Date().toISOString();
    if (topic) {
        mem.topicsAsked = [...(mem.topicsAsked || []).slice(-19), topic];
    }
    saveLumiMemory(mem);
}
