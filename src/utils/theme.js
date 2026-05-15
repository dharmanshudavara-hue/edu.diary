// ─── Dark Mode / Theme Manager ───

const THEME_KEY = 'studentDiary_theme';

export function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
}

export function setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
}

export function toggleTheme() {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
}

export function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
    } else {
        root.removeAttribute('data-theme');
    }
}

// Apply saved theme on load
applyTheme(getTheme());
