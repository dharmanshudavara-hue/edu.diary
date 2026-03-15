// ─── LocalStorage Helpers ───

const STORAGE_KEY = 'studentDiary';

export function getData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

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

export function clearData() {
    localStorage.removeItem(STORAGE_KEY);
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
