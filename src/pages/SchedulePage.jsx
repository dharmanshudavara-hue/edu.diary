import { useState } from 'react';
import Layout from '../components/Layout';
import { getCourses, getTimetable, getTodayDay, DAYS, DAY_LABELS, saveCourses, saveTimetable } from '../utils/storage';

export default function SchedulePage() {
    const [courses, setCoursesState] = useState(getCourses());
    const [timetable, setTimetableState] = useState(getTimetable());
    const [showManage, setShowManage] = useState(false);

    // Form state for managing
    const [editCourses, setEditCourses] = useState([]);
    const [editTimetable, setEditTimetable] = useState({});

    const todayDay = getTodayDay();

    function openManage() {
        setEditCourses(getCourses());
        setEditTimetable(getTimetable());
        setShowManage(true);
    }

    function genId() {
        return 'c' + Math.random().toString(36).slice(2, 8);
    }

    function addCourse() {
        setEditCourses(prev => [...prev, { id: genId(), name: '', code: '' }]);
    }

    function removeCourse(id) {
        setEditCourses(prev => prev.filter(c => c.id !== id));
        // Also remove from timetable
        const nextTt = { ...editTimetable };
        for (const day in nextTt) {
            nextTt[day] = nextTt[day].filter(s => s.courseId !== id);
        }
        setEditTimetable(nextTt);
    }

    function updateCourse(id, field, value) {
        setEditCourses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    }

    function addSlot(day) {
        setEditTimetable(prev => ({
            ...prev,
            [day]: [...(prev[day] || []), { courseId: editCourses[0]?.id || '', time: '09:00' }]
        }));
    }

    function removeSlot(day, idx) {
        setEditTimetable(prev => ({
            ...prev,
            [day]: prev[day].filter((_, i) => i !== idx)
        }));
    }

    function updateSlot(day, idx, field, value) {
        setEditTimetable(prev => ({
            ...prev,
            [day]: prev[day].map((s, i) => i === idx ? { ...s, [field]: value } : s)
        }));
    }

    function handleSave() {
        const validCourses = editCourses.filter(c => c.name.trim() && c.code.trim());
        saveCourses(validCourses);
        saveTimetable(editTimetable);
        setCoursesState(validCourses);
        setTimetableState(editTimetable);
        setShowManage(false);
    }

    // Build time slots list (unique sorted times across all days)
    const allTimes = new Set();
    for (const day of DAYS) {
        for (const slot of (timetable[day] || [])) {
            allTimes.add(slot.time);
        }
    }
    const sortedTimes = [...allTimes].sort();

    const isEmpty = DAYS.every(d => (timetable[d] || []).length === 0);

    return (
        <Layout>
            <style>{styles}</style>
            <div style={{ animation: 'hd-fadeIn 0.4s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <div>
                        <h1 style={{ fontSize: 32, marginBottom: 4 }}>Class Schedule 📅</h1>
                        <p className="hd-text-muted">Your weekly timetable</p>
                    </div>
                    <button className="hd-btn" onClick={openManage}>Manage Schedule ✏️</button>
                </div>

                {isEmpty ? (
                    <div className="hd-card hd-card--flat hd-text-center" style={{ padding: '60px 20px' }}>
                        <p style={{ fontSize: 22, marginBottom: 8 }}>📝</p>
                        <p style={{ fontSize: 16, opacity: 0.5 }}>No timetable uploaded yet. Click "Manage Schedule" to set it up!</p>
                    </div>
                ) : (
                    <div className="hd-card hd-card--flat sched-wrap" style={{ transform: 'rotate(0.2deg)', padding: 0, overflow: 'hidden' }}>
                        <div className="hd-tape" style={{ top: -14, left: '50%', transform: 'translateX(-50%) rotate(-1deg)' }} />
                        <div className="hd-table-wrap">
                            <table className="sched-table">
                                <thead>
                                    <tr>
                                        <th className="sched-th-time">Time ⏰</th>
                                        {DAYS.map(day => (
                                            <th key={day} className={`sched-th ${todayDay === day ? 'sched-th--today' : ''}`}>
                                                {DAY_LABELS[day]}
                                                {todayDay === day && <span className="sched-today-tag">TODAY</span>}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedTimes.map(time => (
                                        <tr key={time}>
                                            <td className="sched-td-time">{time}</td>
                                            {DAYS.map(day => {
                                                const slots = (timetable[day] || []).filter(s => s.time === time);
                                                return (
                                                    <td key={day} className={`sched-td ${todayDay === day ? 'sched-td--today' : ''}`}>
                                                        {slots.map((slot, i) => {
                                                            const course = courses.find(c => c.id === slot.courseId);
                                                            return (
                                                                <div key={i} className="sched-cell">
                                                                    <div className="sched-cell-name">{course?.name || '—'}</div>
                                                                    <div className="sched-cell-code">{course?.code || ''}</div>
                                                                </div>
                                                            );
                                                        })}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Day-by-day view for mobile */}
                {!isEmpty && (
                    <div className="sched-mobile hd-mt-lg">
                        <h2 style={{ marginBottom: 16 }}>Day-by-Day View</h2>
                        {DAYS.map(day => {
                            const slots = timetable[day] || [];
                            if (slots.length === 0) return null;
                            const isToday = todayDay === day;
                            return (
                                <div key={day} className={`hd-card hd-card--flat sched-day-card ${isToday ? 'sched-day-card--today' : ''}`}>
                                    <h3 className="sched-day-title">
                                        {DAY_LABELS[day]}
                                        {isToday && <span className="hd-badge hd-badge--accent" style={{ marginLeft: 8 }}>TODAY</span>}
                                    </h3>
                                    <div className="sched-day-list">
                                        {[...slots].sort((a, b) => a.time.localeCompare(b.time)).map((slot, i) => {
                                            const course = courses.find(c => c.id === slot.courseId);
                                            return (
                                                <div key={i} className="sched-day-item">
                                                    <span className="sched-day-time">{slot.time}</span>
                                                    <span className="sched-day-name">{course?.name || '—'}</span>
                                                    <span className="hd-badge">{course?.code || ''}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Management Modal */}
                {showManage && (
                    <div className="hd-overlay" onClick={() => setShowManage(false)}>
                        <div className="hd-modal manage-modal" onClick={e => e.stopPropagation()}>
                            <div className="hd-tape" />
                            <h2 style={{ marginBottom: 4 }}>Manage Schedule ✏️</h2>
                            <p className="hd-text-muted" style={{ marginBottom: 24 }}>Add/remove subjects and update your timetable</p>

                            <div className="manage-scroll">
                                <h3 style={{ marginBottom: 12 }}>1. Your Courses</h3>
                                <div className="manage-courses">
                                    {editCourses.map((c, i) => (
                                        <div key={c.id} className="manage-row">
                                            <input
                                                className="hd-input"
                                                placeholder="Course Name"
                                                value={c.name}
                                                onChange={e => updateCourse(c.id, 'name', e.target.value)}
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                className="hd-input"
                                                placeholder="Code"
                                                value={c.code}
                                                onChange={e => updateCourse(c.id, 'code', e.target.value)}
                                                style={{ width: 80 }}
                                            />
                                            <button className="manage-remove-btn" onClick={() => removeCourse(c.id)}>✕</button>
                                        </div>
                                    ))}
                                    <button className="hd-btn hd-btn--sm hd-btn--secondary hd-mt-sm" onClick={addCourse}>+ Add Course</button>
                                </div>

                                <h3 style={{ marginTop: 32, marginBottom: 12 }}>2. Timetable</h3>
                                <div className="manage-tt">
                                    {DAYS.map(day => (
                                        <div key={day} className="manage-tt-day">
                                            <div className="manage-tt-header">
                                                <strong>{DAY_LABELS[day]}</strong>
                                                <button className="hd-btn hd-btn--sm" onClick={() => addSlot(day)}>+ Add</button>
                                            </div>
                                            {(editTimetable[day] || []).map((slot, idx) => (
                                                <div key={idx} className="manage-tt-slot">
                                                    <input
                                                        type="time"
                                                        className="hd-input"
                                                        style={{ width: 100, padding: '6px 8px', fontSize: 13 }}
                                                        value={slot.time}
                                                        onChange={e => updateSlot(day, idx, 'time', e.target.value)}
                                                    />
                                                    <select
                                                        className="hd-select"
                                                        style={{ flex: 1, padding: '6px 20px 6px 8px', fontSize: 13 }}
                                                        value={slot.courseId}
                                                        onChange={e => updateSlot(day, idx, 'courseId', e.target.value)}
                                                    >
                                                        <option value="">Select Course</option>
                                                        {editCourses.filter(c => c.name.trim()).map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                    <button className="manage-remove-btn" onClick={() => removeSlot(day, idx)}>✕</button>
                                                </div>
                                            ))}
                                            {(!editTimetable[day] || editTimetable[day].length === 0) && (
                                                <p style={{ fontSize: 12, opacity: 0.4, textAlign: 'center' }}>No classes</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                                <button className="hd-btn hd-btn--secondary" onClick={() => setShowManage(false)}>Cancel</button>
                                <button className="hd-btn" onClick={handleSave}>Save Everything</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

const styles = `
.sched-wrap { position: relative; }
.sched-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-body);
}
.sched-th-time, .sched-th {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 15px;
  padding: 14px 12px;
  text-align: center;
  background: var(--postit);
  border-bottom: 3px solid var(--border);
  white-space: nowrap;
}
.sched-th--today {
  background: var(--accent);
  color: var(--white);
}
.sched-today-tag {
  display: block;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 400;
  opacity: 0.8;
}
.sched-td-time {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 14px;
  padding: 12px;
  text-align: center;
  background: var(--bg);
  border-right: 2px dashed var(--muted);
  border-bottom: 2px dashed var(--muted);
  white-space: nowrap;
}
.sched-td {
  padding: 8px;
  text-align: center;
  vertical-align: middle;
  border-bottom: 2px dashed var(--muted);
  min-width: 100px;
}
.sched-td--today {
  background: rgba(255, 77, 77, 0.05);
}
.sched-cell {
  background: var(--white);
  border: 2px solid var(--border);
  border-radius: var(--radius-wobbly-alt);
  padding: 8px;
  box-shadow: 2px 2px 0 rgba(45,45,45,0.1);
}
.sched-cell-name {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 13px;
  line-height: 1.2;
}
.sched-cell-code {
  font-size: 11px;
  opacity: 0.5;
  margin-top: 2px;
}
.sched-mobile { display: none; }
.sched-day-card {
  margin-bottom: 16px;
  transition: transform 0.1s;
}
.sched-day-card:hover { transform: rotate(-0.5deg); }
.sched-day-card--today {
  border-color: var(--accent);
  box-shadow: 4px 4px 0 var(--accent);
}
.sched-day-title {
  font-size: 20px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}
.sched-day-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sched-day-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: var(--bg);
  border: 2px dashed var(--muted);
  border-radius: var(--radius-wobbly-alt);
}
.sched-day-time {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 15px;
  min-width: 50px;
}
.sched-day-name { flex: 1; }
.manage-modal {
  max-width: 800px;
  width: 95%;
  transform: rotate(-0.3deg);
}
.manage-scroll {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 12px;
}
.manage-courses {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg);
  padding: 16px;
  border: 2px dashed var(--muted);
  border-radius: var(--radius-wobbly-alt);
}
.manage-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.manage-remove-btn {
  width: 28px; height: 28px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  background: #fff0f0;
  color: var(--accent);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.manage-tt {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.manage-tt-day {
  background: var(--bg);
  border: 2px solid var(--border);
  border-radius: var(--radius-wobbly-alt);
  padding: 12px;
}
.manage-tt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  border-bottom: 2px dashed var(--muted);
  padding-bottom: 6px;
}
.manage-tt-slot {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}
@media (max-width: 768px) {
  .sched-wrap { display: none; }
  .sched-mobile { display: block; }
}
`;
