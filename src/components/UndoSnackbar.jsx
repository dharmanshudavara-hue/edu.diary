import { useState, useEffect, useCallback } from 'react';

let showSnackbarGlobal = null;

/**
 * Call this from anywhere to show an undo snackbar.
 * @param {string} message - The message to display
 * @param {Function} onUndo - Callback when user clicks Undo
 * @param {number} duration - Auto-dismiss duration in ms (default 4000)
 */
export function showUndo(message, onUndo, duration = 4000) {
    if (showSnackbarGlobal) {
        showSnackbarGlobal({ message, onUndo, duration });
    }
}

export default function UndoSnackbar() {
    const [snack, setSnack] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        showSnackbarGlobal = ({ message, onUndo, duration }) => {
            setSnack({ message, onUndo, duration });
            setVisible(true);
        };
        return () => { showSnackbarGlobal = null; };
    }, []);

    useEffect(() => {
        if (!snack) return;
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(() => setSnack(null), 350);
        }, snack.duration);
        return () => clearTimeout(timer);
    }, [snack]);

    const handleUndo = useCallback(() => {
        if (snack?.onUndo) snack.onUndo();
        setVisible(false);
        setTimeout(() => setSnack(null), 350);
    }, [snack]);

    const handleDismiss = useCallback(() => {
        setVisible(false);
        setTimeout(() => setSnack(null), 350);
    }, []);

    if (!snack) return null;

    return (
        <>
            <style>{snackStyles}</style>
            <div className={`undo-snackbar ${visible ? 'undo-snackbar--show' : 'undo-snackbar--hide'}`}
                 role="alert" aria-live="assertive">
                <span className="undo-snackbar-msg">{snack.message}</span>
                <div className="undo-snackbar-actions">
                    <button className="undo-snackbar-undo" onClick={handleUndo}>Undo</button>
                    <button className="undo-snackbar-close" onClick={handleDismiss} aria-label="Dismiss">✕</button>
                </div>
            </div>
        </>
    );
}

const snackStyles = `
.undo-snackbar {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    min-width: 300px;
    max-width: 460px;
    padding: 14px 20px;
    background: var(--fg);
    color: var(--bg);
    border: 3px solid var(--border);
    border-radius: var(--radius-wobbly);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    z-index: 2000;
    font-family: var(--font-body);
    font-size: 15px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
}
.undo-snackbar--show {
    opacity: 1;
    pointer-events: auto;
    transform: translateX(-50%) translateY(0);
}
.undo-snackbar--hide {
    opacity: 0;
    pointer-events: none;
    transform: translateX(-50%) translateY(20px);
}
.undo-snackbar-msg {
    flex: 1;
}
.undo-snackbar-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
}
.undo-snackbar-undo {
    background: none;
    border: 2px solid var(--bg);
    color: var(--postit);
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 14px;
    padding: 5px 14px;
    border-radius: var(--radius-wobbly-alt);
    cursor: pointer;
    transition: all 0.15s;
}
.undo-snackbar-undo:hover {
    background: var(--accent);
    color: var(--white);
    border-color: var(--accent);
}
.undo-snackbar-close {
    background: none;
    border: none;
    color: var(--bg);
    opacity: 0.5;
    font-size: 16px;
    cursor: pointer;
    padding: 2px;
}
.undo-snackbar-close:hover { opacity: 1; }

@media (max-width: 500px) {
    .undo-snackbar {
        min-width: calc(100vw - 40px);
        bottom: 80px;
    }
}
`;
