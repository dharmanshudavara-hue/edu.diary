import { useState } from 'react';
import { getTheme, toggleTheme } from '../utils/theme';

export default function ThemeToggle() {
    const [theme, setThemeState] = useState(getTheme());

    function handleToggle() {
        const next = toggleTheme();
        setThemeState(next);
    }

    return (
        <>
            <style>{toggleStyles}</style>
            <button
                className="theme-toggle"
                onClick={handleToggle}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
                <span className={`theme-toggle-icon ${theme === 'dark' ? 'theme-toggle-icon--moon' : ''}`}>
                    {theme === 'dark' ? '🌙' : '☀️'}
                </span>
            </button>
        </>
    );
}

const toggleStyles = `
.theme-toggle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid var(--border);
    background: var(--bg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: all 0.25s ease;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
}
.theme-toggle:hover {
    transform: rotate(20deg) scale(1.1);
    box-shadow: var(--shadow);
    background: var(--postit);
}
.theme-toggle:active {
    transform: scale(0.95);
}
.theme-toggle-icon {
    transition: transform 0.3s ease;
    display: inline-block;
}
.theme-toggle-icon--moon {
    animation: hd-wiggle 0.5s ease-out;
}
`;
