import { useState, useEffect, useRef, useCallback } from 'react';

const MODES = {
    focus: { label: '🎯 Focus', duration: 25 * 60, color: 'var(--accent)' },
    short: { label: '☕ Short Break', duration: 5 * 60, color: '#22c55e' },
    long:  { label: '🌴 Long Break', duration: 15 * 60, color: 'var(--blue)' },
};

export default function PomodoroTimer() {
    const [mode, setMode] = useState('focus');
    const [seconds, setSeconds] = useState(MODES.focus.duration);
    const [running, setRunning] = useState(false);
    const [sessions, setSessions] = useState(() => {
        try { return parseInt(sessionStorage.getItem('pomodoroSessions')) || 0; } 
        catch { return 0; }
    });
    const [expanded, setExpanded] = useState(false);
    const intervalRef = useRef(null);

    const currentMode = MODES[mode];

    const reset = useCallback((newMode) => {
        setRunning(false);
        clearInterval(intervalRef.current);
        const m = newMode || mode;
        setMode(m);
        setSeconds(MODES[m].duration);
    }, [mode]);

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => {
                    if (prev <= 1) {
                        clearInterval(intervalRef.current);
                        setRunning(false);
                        // Completed!
                        if (mode === 'focus') {
                            const newCount = sessions + 1;
                            setSessions(newCount);
                            sessionStorage.setItem('pomodoroSessions', String(newCount));
                            // Notify user
                            if (Notification.permission === 'granted') {
                                new Notification('🍅 Pomodoro Done!', { body: `Session #${newCount} complete. Take a break!` });
                            }
                        }
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [running, mode, sessions]);

    function switchMode(newMode) {
        reset(newMode);
        setMode(newMode);
        setSeconds(MODES[newMode].duration);
    }

    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    const progress = 1 - (seconds / currentMode.duration);
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference * (1 - progress);

    // Request notification permission
    useEffect(() => {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    if (!expanded) {
        return (
            <>
                <style>{pomodoroStyles}</style>
                <button
                    className="pomo-pill"
                    onClick={() => setExpanded(true)}
                    title="Pomodoro Timer"
                    aria-label="Open Pomodoro Timer"
                >
                    🍅 {running ? `${mins}:${secs}` : 'Pomodoro'}
                </button>
            </>
        );
    }

    return (
        <>
            <style>{pomodoroStyles}</style>
            <div className="pomo-widget hd-card" role="timer" aria-label="Pomodoro Timer">
                <div className="pomo-header">
                    <h3 className="pomo-title">🍅 Pomodoro</h3>
                    <button className="pomo-collapse" onClick={() => setExpanded(false)} aria-label="Minimize timer">─</button>
                </div>

                {/* Mode tabs */}
                <div className="pomo-tabs">
                    {Object.entries(MODES).map(([key, m]) => (
                        <button
                            key={key}
                            className={`pomo-tab ${mode === key ? 'pomo-tab--active' : ''}`}
                            onClick={() => switchMode(key)}
                            style={mode === key ? { borderColor: m.color, color: m.color } : {}}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                {/* Circular timer */}
                <div className="pomo-circle-wrap">
                    <svg className="pomo-svg" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" className="pomo-track" />
                        <circle
                            cx="60" cy="60" r="54"
                            className="pomo-progress"
                            style={{
                                stroke: currentMode.color,
                                strokeDasharray: circumference,
                                strokeDashoffset: strokeDashoffset,
                            }}
                        />
                    </svg>
                    <div className="pomo-time">{mins}:{secs}</div>
                </div>

                {/* Controls */}
                <div className="pomo-controls">
                    <button
                        className="hd-btn hd-btn--sm"
                        onClick={() => setRunning(!running)}
                        style={{ minWidth: 80 }}
                    >
                        {running ? '⏸ Pause' : seconds === 0 ? '🔄 Restart' : '▶ Start'}
                    </button>
                    <button
                        className="hd-btn hd-btn--sm hd-btn--secondary"
                        onClick={() => reset()}
                    >
                        ↺ Reset
                    </button>
                </div>

                {/* Sessions counter */}
                <div className="pomo-sessions">
                    {sessions > 0 && (
                        <span className="hd-badge hd-badge--blue">
                            🔥 {sessions} session{sessions !== 1 ? 's' : ''} today
                        </span>
                    )}
                </div>
            </div>
        </>
    );
}

const pomodoroStyles = `
.pomo-pill {
    padding: 8px 18px;
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--fg);
    background: var(--white);
    border: 2px solid var(--border);
    border-radius: var(--radius-wobbly);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all 0.15s;
    animation: hd-fadeIn 0.3s ease-out;
}
.pomo-pill:hover {
    background: var(--accent);
    color: var(--white);
    transform: translateY(-2px);
    box-shadow: var(--shadow);
}

.pomo-widget {
    animation: hd-pop 0.3s ease-out;
    padding: 20px;
    max-width: 280px;
    margin: 0 auto;
    transform: rotate(0.5deg);
}
.pomo-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.pomo-title {
    font-size: 20px;
    margin: 0;
}
.pomo-collapse {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: var(--fg);
    opacity: 0.5;
    padding: 4px 8px;
}
.pomo-collapse:hover { opacity: 1; }

.pomo-tabs {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
}
.pomo-tab {
    flex: 1;
    padding: 5px 4px;
    font-family: var(--font-body);
    font-size: 11px;
    background: var(--bg);
    border: 2px solid var(--muted);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
    color: var(--fg);
    text-align: center;
}
.pomo-tab:hover { border-color: var(--border); }
.pomo-tab--active {
    background: var(--white);
    font-weight: 700;
    box-shadow: var(--shadow-sm);
}

.pomo-circle-wrap {
    position: relative;
    width: 140px;
    height: 140px;
    margin: 0 auto 16px;
}
.pomo-svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
}
.pomo-track {
    fill: none;
    stroke: var(--muted);
    stroke-width: 6;
}
.pomo-progress {
    fill: none;
    stroke-width: 6;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.5s ease;
}
.pomo-time {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 32px;
    color: var(--fg);
}

.pomo-controls {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-bottom: 10px;
}

.pomo-sessions {
    text-align: center;
    min-height: 24px;
}
`;
