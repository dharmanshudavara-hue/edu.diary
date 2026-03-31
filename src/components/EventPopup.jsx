import { useState, useEffect } from 'react';
import { getEvents, saveEvents, isEventPopupDismissed, setEventPopupDismissed, todayStr } from '../utils/storage';

export default function EventPopup() {
    const [show, setShow] = useState(false);
    const [dueEvents, setDueEvents] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            const dismissed = isEventPopupDismissed();
            if (dismissed) return;

            const events = getEvents();
            // Show overdue and today's events that are not done
            const tomorrowDate = new Date();
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const tomorrowStr = tomorrowDate.toISOString().split('T')[0] + 'T00:00:00';

            const urgent = events.filter(e => 
                !e.done && 
                new Date(e.date) < new Date(tomorrowStr)
            );

            if (urgent.length > 0) {
                // sort such that older/overdue is first
                urgent.sort((a,b) => new Date(a.date) - new Date(b.date));
                setDueEvents(urgent);
                setShow(true);
            }
        }, 1200); // Trigger slightly after Attendance popup if both are true

        return () => clearTimeout(timer);
    }, []);

    function dismiss() {
        setEventPopupDismissed(true);
        setShow(false);
    }

    function markDone(id) {
        const events = getEvents();
        const updated = events.map(ev => 
            ev.id === id ? { ...ev, done: true } : ev
        );
        saveEvents(updated);
        
        // Remove from current view
        const remaining = dueEvents.filter(ev => ev.id !== id);
        setDueEvents(remaining);
        
        if (remaining.length === 0) {
            dismiss();
        }
    }

    if (!show) return null;

    return (
        <>
            <style>{styles}</style>
            <div className="hd-overlay" style={{ zIndex: 1000 }} onClick={dismiss}>
                <div className="hd-modal event-popup-modal" onClick={e => e.stopPropagation()}>
                    <div className="hd-tape" style={{ left: '50%', transform: 'translateX(-50%) rotate(-2deg)' }} />
                    <button className="popup-close" onClick={dismiss} title="Dismiss">✕</button>

                    <h2 className="event-popup-title">⏰ Reminders!</h2>
                    <p className="hd-text-muted hd-text-center" style={{ marginBottom: 20 }}>
                        {dueEvents.length} pending task{dueEvents.length > 1 ? 's' : ''} to review.
                    </p>

                    <div className="event-popup-list">
                        {dueEvents.map(ev => {
                            const isOverdue = new Date(ev.date) < new Date(todayStr() + 'T00:00:00');
                            return (
                                <div key={ev.id} className="event-popup-item">
                                    <div className="event-popup-info">
                                        <div className="event-popup-name">
                                            {isOverdue && <span className="hd-badge hd-badge--red" style={{ marginRight: 6 }}>Overdue</span>}
                                            {ev.title}
                                        </div>
                                        <div className="event-popup-date">
                                            Deadine: {new Date(ev.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                    <button className="hd-btn" style={{ padding: '6px 12px', fontSize: 13 }} onClick={() => markDone(ev.id)}>
                                        ✅ Done
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                        <button className="hd-btn hd-btn--secondary" style={{ width: '100%' }} onClick={dismiss}>
                            Snooze for now 💤
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

const styles = `
.event-popup-modal {
    max-width: 420px;
    transform: rotate(0.5deg);
    border-color: var(--blue);
}
.event-popup-title {
    text-align: center;
    font-size: 26px;
    margin-top: 8px;
    color: var(--blue);
}
.event-popup-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 50vh;
    overflow-y: auto;
    padding-right: 4px;
}
.event-popup-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: var(--bg);
    border: 2px dashed var(--muted);
    border-radius: var(--radius-wobbly-alt);
}
.event-popup-info {
    flex: 1;
}
.event-popup-name {
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 4px;
}
.event-popup-date {
    font-size: 12px;
    opacity: 0.6;
}
`;
