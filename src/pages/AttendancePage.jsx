import { useState } from 'react';
import Layout from '../components/Layout';
import { getCourses, getAttendance, saveCourses } from '../utils/storage';
import { calculateAllAttendance, calculateOverallAttendance, predictSkippable, predictRequired, getAttColor, getBarColor } from '../utils/attendance';

export default function AttendancePage() {
    const [courses, setCoursesState] = useState(getCourses());
    const [editingCourse, setEditingCourse] = useState(null); // Course being edited
    const [editForm, setEditForm] = useState({ attended: 0, total: 0 });

    const allStats = calculateAllAttendance();
    const overall = calculateOverallAttendance();
    const attendance = getAttendance();

    function handleEdit(course) {
        setEditingCourse(course);
        setEditForm({
            attended: course.manualAttended || 0,
            total: course.manualTotal || 0
        });
    }

    function handleSave() {
        if (!editingCourse) return;
        const updatedCourses = courses.map(c =>
            c.id === editingCourse.id
                ? { ...c, manualAttended: parseInt(editForm.attended) || 0, manualTotal: parseInt(editForm.total) || 0 }
                : c
        );
        saveCourses(updatedCourses);
        setCoursesState(updatedCourses);
        setEditingCourse(null);
    }

    return (
        <Layout>
            <style>{styles}</style>
            <div style={{ animation: 'hd-fadeIn 0.4s ease-out' }}>
                <h1 style={{ fontSize: 32, marginBottom: 4 }}>Attendance 📋</h1>
                <p className="hd-text-muted" style={{ marginBottom: 24 }}>Track your attendance & see predictions</p>

                {/* Overall stats */}
                <div className="hd-card hd-card--flat att-overall" style={{ transform: 'rotate(-0.3deg)' }}>
                    <div className="hd-tape" />
                    <div className="att-overall-row">
                        <div className="att-overall-stat">
                            <div className={`att-overall-pct ${getAttColor(overall.percentage)}`}>{overall.percentage}%</div>
                            <div className="att-overall-label">Overall Attendance</div>
                        </div>
                        <div className="att-overall-stat">
                            <div className="att-overall-num">{overall.attended}</div>
                            <div className="att-overall-label">Classes Attended</div>
                        </div>
                        <div className="att-overall-stat">
                            <div className="att-overall-num">{overall.total}</div>
                            <div className="att-overall-label">Total Classes</div>
                        </div>
                    </div>
                </div>

                {/* Per-course cards */}
                <h2 className="hd-mt-lg" style={{ marginBottom: 16 }}>Course-wise Attendance</h2>

                {courses.length === 0 ? (
                    <div className="hd-card hd-card--flat hd-text-center" style={{ padding: '40px 20px' }}>
                        <p style={{ fontSize: 18, opacity: 0.5 }}>No courses added yet. Complete onboarding first! ✏️</p>
                    </div>
                ) : (
                    <div className="att-grid">
                        {courses.map(c => {
                            const s = allStats[c.id] || { attended: 0, total: 0, percentage: 0 };
                            const canSkip = predictSkippable(c.id);
                            const needMore = predictRequired(c.id);
                            return (
                                <div key={c.id} className="hd-card hd-card--flat att-course-card" style={{ transform: `rotate(${(Math.random() - 0.5) * 1.2}deg)` }}>
                                    <div className="att-course-header">
                                        <div>
                                            <div className="att-course-name">{c.name}</div>
                                            <div className="hd-badge">{c.code}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <div className={`att-course-pct ${getAttColor(s.percentage)}`}>{s.percentage}%</div>
                                            <button
                                                className="hd-btn hd-btn--sm"
                                                style={{ marginTop: 8, fontSize: 11, padding: '4px 8px' }}
                                                onClick={() => handleEdit(c)}
                                            >
                                                Edit ✏️
                                            </button>
                                        </div>
                                    </div>

                                    <div className="att-bar" style={{ marginTop: 12 }}>
                                        <div className="att-bar-fill" style={{ width: `${s.percentage}%`, background: getBarColor(s.percentage) }} />
                                    </div>

                                    <div className="att-course-detail">
                                        {s.attended} / {s.total} classes attended
                                        {(c.manualAttended > 0 || c.manualTotal > 0) && (
                                            <span style={{ marginLeft: 6, opacity: 0.8 }} title="Manual addition included">
                                                (incl. {c.manualAttended}/{c.manualTotal} manual)
                                            </span>
                                        )}
                                    </div>

                                    <div className="att-predict">
                                        {s.total === 0 ? (
                                            <div className="att-predict-item att-predict-info">
                                                📝 No data yet — mark attendance or add manually
                                            </div>
                                        ) : s.percentage >= 75 ? (
                                            <div className="att-predict-item att-predict-good">
                                                ✅ You can skip <strong>{canSkip}</strong> more class{canSkip !== 1 ? 'es' : ''} and still maintain 75%
                                            </div>
                                        ) : (
                                            <div className="att-predict-item att-predict-bad">
                                                ⚠️ Attend <strong>{needMore}</strong> more class{needMore !== 1 ? 'es' : ''} in a row to reach 75%
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Manual Attendance Modal */}
                {editingCourse && (
                    <div className="hd-overlay" onClick={() => setEditingCourse(null)}>
                        <div className="hd-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                            <div className="hd-tape" />
                            <h2 style={{ marginBottom: 8, fontSize: 24 }}>Edit Attendance</h2>
                            <p className="hd-text-muted" style={{ marginBottom: 20 }}>
                                {editingCourse.name} ({editingCourse.code})
                                <br />
                                <small>Add classes attended outside the app logging</small>
                            </p>

                            <div style={{ marginBottom: 16 }}>
                                <label className="hd-label">Manual Classes Attended</label>
                                <input
                                    type="number"
                                    className="hd-input"
                                    value={editForm.attended}
                                    onChange={e => setEditForm({ ...editForm, attended: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label className="hd-label">Manual Total Classes</label>
                                <input
                                    type="number"
                                    className="hd-input"
                                    value={editForm.total}
                                    onChange={e => setEditForm({ ...editForm, total: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                                <button className="hd-btn hd-btn--secondary" onClick={() => setEditingCourse(null)}>Cancel</button>
                                <button className="hd-btn" onClick={handleSave}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attendance Log */}
                <h2 className="hd-mt-lg" style={{ marginBottom: 16 }}>Attendance Log 📖</h2>
                <div className="hd-card hd-card--flat" style={{ transform: 'rotate(0.2deg)' }}>
                    {attendance.length === 0 ? (
                        <p className="hd-text-muted hd-text-center" style={{ padding: '20px 0' }}>
                            No attendance recorded yet. The daily popup will help you track! ✏️
                        </p>
                    ) : (
                        <div className="hd-table-wrap">
                            <table className="hd-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Course</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...attendance].reverse().map((record, ri) =>
                                        record.entries.map((entry, ei) => {
                                            const course = courses.find(c => c.id === entry.courseId);
                                            return (
                                                <tr key={`${ri}-${ei}`}>
                                                    {ei === 0 ? (
                                                        <td rowSpan={record.entries.length} style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, verticalAlign: 'top' }}>
                                                            {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </td>
                                                    ) : null}
                                                    <td>{course?.name || entry.courseId} <span className="hd-text-muted">({course?.code || ''})</span></td>
                                                    <td>
                                                        {entry.attended ? (
                                                            <span className="hd-badge hd-badge--blue">✓ Present</span>
                                                        ) : (
                                                            <span className="hd-badge hd-badge--accent">✕ Absent</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

const styles = `
.att-overall {
  padding: 28px;
}
.att-overall-row {
  display: flex;
  justify-content: space-around;
  text-align: center;
  flex-wrap: wrap;
  gap: 16px;
}
.att-overall-pct {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 42px;
  line-height: 1;
}
.att-overall-num {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 32px;
  line-height: 1;
}
.att-overall-label {
  font-size: 13px;
  opacity: 0.5;
  margin-top: 6px;
}
.att-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.att-course-card { transition: transform 0.1s; }
.att-course-card:hover { transform: rotate(0deg) !important; }
.att-course-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.att-course-name {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 4px;
}
.att-course-pct {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 28px;
  line-height: 1;
}
.att-course-detail {
  font-size: 12px;
  opacity: 0.45;
  margin-top: 6px;
}
.att-predict {
  margin-top: 12px;
}
.att-predict-item {
  padding: 8px 12px;
  border-radius: var(--radius-wobbly-alt);
  font-size: 14px;
  border: 2px dashed;
}
.att-predict-good {
  background: #f0fdf4;
  border-color: #22c55e;
  color: #166534;
}
.att-predict-bad {
  background: #fff7ed;
  border-color: #f59e0b;
  color: #92400e;
}
.att-predict-info {
  background: var(--bg);
  border-color: var(--muted);
  color: var(--fg);
  opacity: 0.6;
}
@media (max-width: 640px) {
  .att-grid { grid-template-columns: 1fr; }
}
`;
