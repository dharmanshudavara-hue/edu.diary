import Layout from '../components/Layout';
import { getCourses, getTimetable, getTodayDay, DAYS, DAY_LABELS } from '../utils/storage';

export default function SchedulePage() {
    const courses = getCourses();
    const timetable = getTimetable();
    const todayDay = getTodayDay();

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
                <h1 style={{ fontSize: 32, marginBottom: 4 }}>Class Schedule 📅</h1>
                <p className="hd-text-muted" style={{ marginBottom: 24 }}>Your weekly timetable</p>

                {isEmpty ? (
                    <div className="hd-card hd-card--flat hd-text-center" style={{ padding: '60px 20px' }}>
                        <p style={{ fontSize: 22, marginBottom: 8 }}>📝</p>
                        <p style={{ fontSize: 16, opacity: 0.5 }}>No timetable uploaded yet. Complete onboarding to set up your schedule!</p>
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
@media (max-width: 768px) {
  .sched-wrap { display: none; }
  .sched-mobile { display: block; }
}
`;
