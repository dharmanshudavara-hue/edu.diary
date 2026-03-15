import Layout from '../components/Layout';
import { getUser, getCourses, getTodayClasses, getTodayDay, DAY_LABELS } from '../utils/storage';
import { calculateAllAttendance, calculateOverallAttendance, getAttColor, getBarColor } from '../utils/attendance';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
    const navigate = useNavigate();
    const user = getUser();
    const courses = getCourses();
    const todayClasses = getTodayClasses();
    const todayDay = getTodayDay();
    const overall = calculateOverallAttendance();
    const allStats = calculateAllAttendance();

    // Find courses needing attention (below 75%)
    const needAttention = courses.filter(c => {
        const s = allStats[c.id];
        return s && s.total > 0 && s.percentage < 75;
    });

    const dayLabel = DAY_LABELS[todayDay] || todayDay;

    return (
        <Layout>
            <style>{styles}</style>
            <div style={{ animation: 'hd-fadeIn 0.4s ease-out' }}>
                {/* Greeting */}
                <div className="dash-header">
                    <div>
                        <h1 className="dash-greeting">Hey, {user?.name || 'Student'}! 👋</h1>
                        <p className="hd-text-muted" style={{ fontSize: 16 }}>
                            Here's your diary for today — {dayLabel}, {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="dash-stats">
                    <div className="dash-stat-card" style={{ borderRadius: '62% 38% 70% 30% / 44% 58% 42% 56%' }}>
                        <div className="dash-stat-num">{overall.percentage}%</div>
                        <div className="dash-stat-label">Overall Attendance</div>
                    </div>
                    <div className="dash-stat-card" style={{ borderRadius: '38% 62% 30% 70% / 58% 44% 56% 42%' }}>
                        <div className="dash-stat-num">{todayClasses.length}</div>
                        <div className="dash-stat-label">Today's Classes</div>
                    </div>
                    <div className="dash-stat-card" style={{ borderRadius: '50% 30% 60% 40% / 35% 55% 45% 65%' }}>
                        <div className="dash-stat-num">{courses.length}</div>
                        <div className="dash-stat-label">Courses</div>
                    </div>
                    <div className="dash-stat-card" style={{ borderRadius: '30% 60% 40% 70% / 65% 35% 55% 45%' }}>
                        <div className="dash-stat-num">{needAttention.length}</div>
                        <div className="dash-stat-label">Need Attention</div>
                    </div>
                </div>

                {/* Info & Schedule row */}
                <div className="dash-row">
                    {/* Student info card */}
                    <div className="hd-card hd-card--flat dash-info-card" style={{ transform: 'rotate(-0.5deg)' }}>
                        <div className="hd-tape" />
                        <h3 style={{ marginBottom: 12 }}>📋 Student Info</h3>
                        <div className="dash-info-grid">
                            <div className="dash-info-item">
                                <span className="dash-info-label">Name</span>
                                <span className="dash-info-val">{user?.name || '—'}</span>
                            </div>
                            <div className="dash-info-item">
                                <span className="dash-info-label">ID</span>
                                <span className="dash-info-val">{user?.username || '—'}</span>
                            </div>
                            <div className="dash-info-item">
                                <span className="dash-info-label">Branch</span>
                                <span className="dash-info-val">{user?.branch || '—'}</span>
                            </div>
                            <div className="dash-info-item">
                                <span className="dash-info-label">Courses</span>
                                <span className="dash-info-val">{courses.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Today's schedule */}
                    <div className="hd-card hd-card--flat dash-today-card" style={{ transform: 'rotate(0.3deg)' }}>
                        <div className="hd-tack" />
                        <h3 style={{ marginBottom: 12 }}>📅 Today's Schedule</h3>
                        {todayClasses.length === 0 ? (
                            <p className="hd-text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>
                                {todayDay === 'sunday' ? 'It\'s Sunday! No classes 🎉' : 'No classes scheduled today'}
                            </p>
                        ) : (
                            <div className="dash-today-list">
                                {todayClasses.map((slot, i) => {
                                    const course = courses.find(c => c.id === slot.courseId);
                                    return (
                                        <div key={i} className="dash-today-item">
                                            <span className="dash-today-time">{slot.time}</span>
                                            <span className="dash-today-name">{course?.name || 'Unknown'}</span>
                                            <span className="hd-badge">{course?.code || '—'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Course attendance overview */}
                <div className="hd-card hd-card--flat hd-mt-lg" style={{ transform: 'rotate(0.2deg)' }}>
                    <h3 style={{ marginBottom: 16 }}>📊 Attendance Overview</h3>
                    {courses.length === 0 ? (
                        <p className="hd-text-muted hd-text-center">No courses yet</p>
                    ) : (
                        <div className="dash-att-list">
                            {courses.map(c => {
                                const s = allStats[c.id] || { attended: 0, total: 0, percentage: 0 };
                                return (
                                    <div key={c.id} className="dash-att-item">
                                        <div className="dash-att-top">
                                            <span className="dash-att-name">{c.name}</span>
                                            <span className={`dash-att-pct ${getAttColor(s.percentage)}`}>{s.percentage}%</span>
                                        </div>
                                        <div className="att-bar">
                                            <div className="att-bar-fill" style={{ width: `${s.percentage}%`, background: getBarColor(s.percentage) }} />
                                        </div>
                                        <div className="dash-att-detail">
                                            {s.attended}/{s.total} classes attended
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Quick actions */}
                <div className="dash-actions hd-mt-lg">
                    <button className="hd-btn" onClick={() => navigate('/attendance')}>
                        📋 View Attendance
                    </button>
                    <button className="hd-btn hd-btn--secondary" onClick={() => navigate('/schedule')}>
                        📅 View Schedule
                    </button>
                </div>
            </div>
        </Layout>
    );
}

const styles = `
.dash-header {
  margin-bottom: 24px;
}
.dash-greeting {
  font-size: 32px;
  margin-bottom: 4px;
}
.dash-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.dash-stat-card {
  background: var(--white);
  border: 3px solid var(--border);
  box-shadow: var(--shadow);
  padding: 20px 16px;
  text-align: center;
  transition: transform 0.1s;
}
.dash-stat-card:hover { transform: rotate(-1deg); }
.dash-stat-num {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 32px;
  color: var(--fg);
  line-height: 1;
}
.dash-stat-label {
  font-size: 13px;
  opacity: 0.55;
  margin-top: 6px;
}
.dash-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.dash-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.dash-info-item {
  display: flex;
  flex-direction: column;
}
.dash-info-label {
  font-size: 12px;
  opacity: 0.45;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.dash-info-val {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 17px;
}
.dash-today-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dash-today-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: var(--bg);
  border: 2px dashed var(--muted);
  border-radius: var(--radius-wobbly-alt);
}
.dash-today-time {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 15px;
  min-width: 50px;
}
.dash-today-name { flex: 1; font-size: 15px; }
.dash-att-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dash-att-item { }
.dash-att-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.dash-att-name {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 16px;
}
.dash-att-pct {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 18px;
}
.dash-att-detail {
  font-size: 12px;
  opacity: 0.45;
  margin-top: 4px;
}
.dash-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
@media (max-width: 768px) {
  .dash-stats { grid-template-columns: repeat(2, 1fr); }
  .dash-row { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .dash-greeting { font-size: 26px; }
}
`;
