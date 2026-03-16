import { useState, useEffect } from 'react';
import { getCourses, getTodayClasses, getAttendance, saveAttendance, getSettings, saveSettings, todayStr, isAttendancePopupDismissed, setAttendancePopupDismissed } from '../utils/storage';

export default function AttendancePopup() {
    const [show, setShow] = useState(false);
    const [mode, setMode] = useState(null); // null, 'yes-all', 'yes-except', 'no'
    const [exceptList, setExceptList] = useState([]); // courseIds to skip
    const [extraLecture, setExtraLecture] = useState(false);
    const [extraCourseId, setExtraCourseId] = useState('');

    const courses = getCourses();
    const todayClasses = getTodayClasses();
    const today = todayStr();

    useEffect(() => {
        // Check if popup should show after a delay
        const timer = setTimeout(() => {
            const attendance = getAttendance();
            const alreadyRecorded = attendance.some(r => r.date === today);

            if (!alreadyRecorded && !isAttendancePopupDismissed() && todayClasses.length > 0) {
                setShow(true);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [today, todayClasses.length]); // Re-run if day or number of classes changes

    function toggleExcept(courseId) {
        setExceptList(prev =>
            prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
        );
    }

    function handleSubmit() {
        const attendance = getAttendance();
        const entries = [];

        for (const slot of todayClasses) {
            if (mode === 'yes-all') {
                entries.push({ courseId: slot.courseId, attended: true });
            } else if (mode === 'yes-except') {
                entries.push({ courseId: slot.courseId, attended: !exceptList.includes(slot.courseId) });
            } else if (mode === 'no') {
                entries.push({ courseId: slot.courseId, attended: false });
            }
        }

        // Extra lecture
        if (extraLecture && extraCourseId) {
            entries.push({ courseId: extraCourseId, attended: true });
        }

        // Remove duplicate courseIds (keep last occurrence – most relevant)
        const uniqueEntries = [];
        const seen = new Set();
        for (let i = entries.length - 1; i >= 0; i--) {
            const key = entries[i].courseId;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueEntries.unshift(entries[i]);
            }
        }

        attendance.push({ date: today, entries: uniqueEntries });
        saveAttendance(attendance);
        saveSettings({ lastPopupDate: today });
        setShow(false);

        // Refresh the page to update stats
        window.location.reload();
    }

    function dismiss() {
        setAttendancePopupDismissed(true);
        setShow(false);
    }

    if (!show) return null;

    const uniqueCourseIds = [...new Set(todayClasses.map(s => s.courseId))];

    return (
        <>
            <style>{styles}</style>
            <div className="hd-overlay" onClick={dismiss}>
                <div className="hd-modal popup-modal" onClick={e => e.stopPropagation()}>
                    <div className="hd-tape" />
                    <div className="hd-tack" style={{ right: 30 }} />

                    <button className="popup-close" onClick={dismiss} title="Dismiss">✕</button>

                    <h2 className="popup-title">📢 Class Reminder!</h2>
                    <p className="popup-sub">
                        You have <strong>{todayClasses.length}</strong> class{todayClasses.length !== 1 ? 'es' : ''} today. Did you attend?
                    </p>

                    {/* Today's classes list */}
                    <div className="popup-classes">
                        {uniqueCourseIds.map(cId => {
                            const course = courses.find(c => c.id === cId);
                            const count = todayClasses.filter(s => s.courseId === cId).length;
                            return (
                                <div key={cId} className="popup-class-item">
                                    <span className="popup-class-name">{course?.name || cId}</span>
                                    <span className="hd-badge">{course?.code || ''}</span>
                                    {count > 1 && <span className="hd-badge hd-badge--blue">×{count}</span>}
                                </div>
                            );
                        })}
                    </div>

                    {/* Options */}
                    {mode === null && (
                        <div className="popup-options" style={{ animation: 'hd-fadeIn 0.2s ease-out' }}>
                            <button className="hd-btn popup-opt-btn popup-opt-yes" onClick={() => setMode('yes-all')}>
                                ✅ Yes — All classes
                            </button>
                            <button className="hd-btn popup-opt-btn popup-opt-except" onClick={() => setMode('yes-except')}>
                                ✅ Yes — Except some
                            </button>
                            <button className="hd-btn popup-opt-btn popup-opt-no" onClick={() => setMode('no')}>
                                ❌ No — Didn't attend
                            </button>
                        </div>
                    )}

                    {/* Yes Except: show checkboxes */}
                    {mode === 'yes-except' && (
                        <div className="popup-except" style={{ animation: 'hd-fadeIn 0.2s ease-out' }}>
                            <p className="popup-except-title">Select classes you <strong>DID NOT</strong> attend:</p>
                            {uniqueCourseIds.map(cId => {
                                const course = courses.find(c => c.id === cId);
                                return (
                                    <label key={cId} className="popup-except-row">
                                        <input
                                            type="checkbox"
                                            className="hd-checkbox"
                                            checked={exceptList.includes(cId)}
                                            onChange={() => toggleExcept(cId)}
                                        />
                                        <span>{course?.name || cId}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}

                    {/* Show selected mode label */}
                    {mode !== null && (
                        <div style={{ animation: 'hd-fadeIn 0.2s ease-out' }}>
                            <div className="popup-mode-label">
                                {mode === 'yes-all' && '✅ Marking all classes as attended'}
                                {mode === 'yes-except' && `✅ Attending all except: ${exceptList.map(id => courses.find(c => c.id === id)?.name || id).join(', ') || 'none selected'}`}
                                {mode === 'no' && '❌ Marking all classes as absent'}
                            </div>

                            {/* Extra lecture toggle */}
                            <div className="popup-extra">
                                <label className="popup-except-row">
                                    <input
                                        type="checkbox"
                                        className="hd-checkbox"
                                        checked={extraLecture}
                                        onChange={e => setExtraLecture(e.target.checked)}
                                    />
                                    <span>Had an extra lecture?</span>
                                </label>
                                {extraLecture && (
                                    <select
                                        className="hd-select"
                                        style={{ marginTop: 8 }}
                                        value={extraCourseId}
                                        onChange={e => setExtraCourseId(e.target.value)}
                                    >
                                        <option value="">Select course...</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="popup-actions">
                                <button className="hd-btn hd-btn--secondary" onClick={() => { setMode(null); setExceptList([]); }}>
                                    ← Change
                                </button>
                                <button className="hd-btn" onClick={handleSubmit}>
                                    Save Attendance ✏️
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

const styles = `
.popup-modal {
  max-width: 480px;
  transform: rotate(-0.5deg);
}
.popup-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--fg);
  opacity: 0.4;
  transition: opacity 0.15s;
}
.popup-close:hover { opacity: 1; }
.popup-title {
  text-align: center;
  font-size: 26px;
  margin-bottom: 4px;
  margin-top: 8px;
}
.popup-sub {
  text-align: center;
  font-size: 15px;
  opacity: 0.6;
  margin-bottom: 16px;
}
.popup-classes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
  padding: 12px;
  background: var(--bg);
  border: 2px dashed var(--muted);
  border-radius: var(--radius-wobbly-alt);
}
.popup-class-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.popup-class-name {
  flex: 1;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 15px;
}
.popup-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.popup-opt-btn {
  width: 100%;
  justify-content: center;
  font-size: 16px;
}
.popup-opt-yes:hover { background: #22c55e; border-color: #22c55e; }
.popup-opt-except:hover { background: var(--blue); border-color: var(--blue); }
.popup-opt-no:hover { background: var(--accent); border-color: var(--accent); }
.popup-except {
  margin-bottom: 16px;
}
.popup-except-title {
  font-size: 14px;
  margin-bottom: 10px;
  opacity: 0.7;
}
.popup-except-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  cursor: pointer;
  font-size: 15px;
}
.popup-mode-label {
  padding: 10px 14px;
  background: var(--postit);
  border: 2px solid var(--border);
  border-radius: var(--radius-wobbly-alt);
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
}
.popup-extra {
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg);
  border: 2px dashed var(--muted);
  border-radius: var(--radius-wobbly-alt);
}
.popup-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
`;
