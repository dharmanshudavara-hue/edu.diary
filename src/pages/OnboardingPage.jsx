import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, saveUser, saveCourses, saveTimetable, setOnboarded, DAYS, DAY_LABELS } from '../utils/storage';
import avatar1 from '../assets/avatars/avatar1.png';
import avatar2 from '../assets/avatars/avatar2.png';
import avatar3 from '../assets/avatars/avatar3.png';
import avatar4 from '../assets/avatars/avatar4.png';
import avatar5 from '../assets/avatars/avatar5.png';

const AVATARS = [
    { id: 'av1', img: avatar1 },
    { id: 'av2', img: avatar2 },
    { id: 'av3', img: avatar3 },
    { id: 'av4', img: avatar4 },
    { id: 'av5', img: avatar5 },
];


export default function OnboardingPage() {
    const navigate = useNavigate();
    const user = getUser();
    const [step, setStep] = useState(1);

    // Step 1: Personal info
    const [name, setName] = useState(user?.name || '');
    const [branch, setBranch] = useState(user?.branch || '');
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'av1');


    // Step 2: Courses
    const [courses, setCourses] = useState([{ id: genId(), name: '', code: '' }]);

    // Step 3: Timetable
    const [timetable, setTimetable] = useState(
        DAYS.reduce((acc, d) => ({ ...acc, [d]: [] }), {})
    );

    function genId() {
        return 'c' + Math.random().toString(36).slice(2, 8);
    }

    function addCourse() {
        setCourses(prev => [...prev, { id: genId(), name: '', code: '' }]);
    }

    function removeCourse(id) {
        if (courses.length <= 1) return;
        setCourses(prev => prev.filter(c => c.id !== id));
    }

    function updateCourse(id, field, value) {
        setCourses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    }

    function addSlot(day) {
        setTimetable(prev => ({
            ...prev,
            [day]: [...prev[day], { courseId: courses[0]?.id || '', time: '09:00' }]
        }));
    }

    function removeSlot(day, idx) {
        setTimetable(prev => ({
            ...prev,
            [day]: prev[day].filter((_, i) => i !== idx)
        }));
    }

    function updateSlot(day, idx, field, value) {
        setTimetable(prev => ({
            ...prev,
            [day]: prev[day].map((s, i) => i === idx ? { ...s, [field]: value } : s)
        }));
    }

    function handleNext() {
        if (step === 1) {
            if (!name.trim() || !branch.trim()) return;
            saveUser({ ...user, name: name.trim(), branch: branch.trim(), avatar: selectedAvatar });
            setStep(2);
        } else if (step === 2) {
            const valid = courses.filter(c => c.name.trim() && c.code.trim());
            if (valid.length === 0) return;
            saveCourses(valid);
            setStep(3);
        } else if (step === 3) {
            saveTimetable(timetable);
            setOnboarded(true);
            navigate('/dashboard');
        }
    }

    function handleBack() {
        if (step > 1) setStep(step - 1);
    }

    return (
        <>
            <style>{styles}</style>
            <div className="onb-page">
                <div className="onb-blob onb-blob-1" />
                <div className="onb-blob onb-blob-2" />

                <div className="onb-card">
                    <div className="hd-tape" />
                    <div className="hd-tack" />

                    {/* Step indicator */}
                    <div className="hd-steps">
                        <div className={`hd-step-dot ${step >= 1 ? (step > 1 ? 'hd-step-dot--done' : 'hd-step-dot--active') : ''}`} />
                        <div className={`hd-step-line ${step > 1 ? 'hd-step-line--done' : ''}`} />
                        <div className={`hd-step-dot ${step >= 2 ? (step > 2 ? 'hd-step-dot--done' : 'hd-step-dot--active') : ''}`} />
                        <div className={`hd-step-line ${step > 2 ? 'hd-step-line--done' : ''}`} />
                        <div className={`hd-step-dot ${step >= 3 ? 'hd-step-dot--active' : ''}`} />
                    </div>

                    {step === 1 && (
                        <div style={{ animation: 'hd-fadeIn 0.3s ease-out' }}>
                            <h2 className="onb-title">Tell us about yourself ✏️</h2>
                            <p className="onb-sub">Step 1 of 3 — Personal Info</p>
                            <span className="hd-underline hd-mb-lg" />

                            <div className="onb-field">
                                <label className="hd-label">Your Name</label>
                                <input
                                    className="hd-input"
                                    placeholder="e.g. Dharmanshu"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div className="onb-field">
                                <label className="hd-label">Branch / Department</label>
                                <input
                                    className="hd-input"
                                    placeholder="e.g. ECE, CSE, ME..."
                                    value={branch}
                                    onChange={e => setBranch(e.target.value)}
                                />
                            </div>

                            <div className="onb-field">
                                <label className="hd-label">Pick an Avatar</label>
                                <div className="onb-avatars">
                                    {AVATARS.map(av => (
                                        <div
                                            key={av.id}
                                            className={`onb-avatar-item ${selectedAvatar === av.id ? 'onb-avatar-item--active' : ''}`}
                                            onClick={() => setSelectedAvatar(av.id)}
                                        >
                                            <img src={av.img} alt="Avatar" className="onb-avatar-img" />
                                            {selectedAvatar === av.id && <div className="onb-avatar-check">✓</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div style={{ animation: 'hd-fadeIn 0.3s ease-out' }}>
                            <h2 className="onb-title">Your Courses 📚</h2>
                            <p className="onb-sub">Step 2 of 3 — Add courses you're pursuing</p>
                            <span className="hd-underline hd-mb-lg" />

                            <div className="onb-courses-list">
                                {courses.map((c, i) => (
                                    <div key={c.id} className="onb-course-row">
                                        <span className="onb-course-num">{i + 1}.</span>
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
                                            style={{ width: 100 }}
                                        />
                                        {courses.length > 1 && (
                                            <button className="onb-remove-btn" onClick={() => removeCourse(c.id)} title="Remove">✕</button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button className="hd-btn hd-btn--sm hd-btn--secondary hd-mt-md" onClick={addCourse}>
                                + Add Course
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div style={{ animation: 'hd-fadeIn 0.3s ease-out' }}>
                            <h2 className="onb-title">Your Timetable 📅</h2>
                            <p className="onb-sub">Step 3 of 3 — Set your weekly class schedule</p>
                            <span className="hd-underline hd-mb-lg" />

                            <div className="onb-tt-wrap">
                                {DAYS.map(day => (
                                    <div key={day} className="onb-tt-day">
                                        <div className="onb-tt-day-header">
                                            <span className="onb-tt-day-label">{DAY_LABELS[day]}</span>
                                            <button className="hd-btn hd-btn--sm" onClick={() => addSlot(day)}>+ Add</button>
                                        </div>
                                        {timetable[day].length === 0 && (
                                            <p className="onb-tt-empty">No classes — click + Add</p>
                                        )}
                                        {timetable[day].map((slot, idx) => (
                                            <div key={idx} className="onb-tt-slot">
                                                <input
                                                    type="time"
                                                    className="hd-input"
                                                    style={{ width: 110, padding: '8px 10px', fontSize: 14 }}
                                                    value={slot.time}
                                                    onChange={e => updateSlot(day, idx, 'time', e.target.value)}
                                                />
                                                <select
                                                    className="hd-select"
                                                    style={{ flex: 1, padding: '8px 30px 8px 10px', fontSize: 14 }}
                                                    value={slot.courseId}
                                                    onChange={e => updateSlot(day, idx, 'courseId', e.target.value)}
                                                >
                                                    {courses.filter(c => c.name.trim()).map(c => (
                                                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                                    ))}
                                                </select>
                                                <button className="onb-remove-btn" onClick={() => removeSlot(day, idx)}>✕</button>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation buttons */}
                    <div className="onb-nav">
                        {step > 1 && (
                            <button className="hd-btn hd-btn--secondary" onClick={handleBack}>
                                ← Back
                            </button>
                        )}
                        <button className="hd-btn" onClick={handleNext} style={{ marginLeft: 'auto' }}>
                            {step === 3 ? 'Finish! 🎉' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

const styles = `
.onb-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}
.onb-blob {
  position: absolute;
  border: 2px dashed var(--muted);
  pointer-events: none;
}
.onb-blob-1 {
  width: 200px; height: 200px;
  border-radius: 62% 38% 70% 30% / 44% 58% 42% 56%;
  top: -60px; right: -40px;
}
.onb-blob-2 {
  width: 120px; height: 120px;
  border-radius: 50%;
  border-color: var(--accent);
  bottom: 40px; left: -30px;
  animation: hd-bounce 3s ease-in-out infinite;
}
.onb-card {
  background: var(--white);
  border: 3px solid var(--border);
  border-radius: var(--radius-wobbly);
  box-shadow: var(--shadow-lg);
  padding: 36px 32px 28px;
  width: 100%;
  max-width: 560px;
  position: relative;
  transform: rotate(0.3deg);
}
.onb-title {
  text-align: center;
  font-size: 26px;
  margin-bottom: 4px;
}
.onb-sub {
  text-align: center;
  font-size: 14px;
  opacity: 0.55;
  margin-bottom: 12px;
}
.onb-field { margin-bottom: 18px; }
.onb-courses-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.onb-course-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.onb-course-num {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 18px;
  min-width: 24px;
}
.onb-remove-btn {
  width: 32px; height: 32px;
  border: 2px solid var(--accent);
  border-radius: 50%;
  background: #fff0f0;
  color: var(--accent);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.1s;
}
.onb-remove-btn:hover {
  background: var(--accent);
  color: var(--white);
}
.onb-avatars {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 10px 0;
  flex-wrap: wrap;
}
.onb-avatar-item {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-wobbly);
  border: 3px solid var(--border);
  background: var(--postit);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.onb-avatar-item:hover {
  transform: scale(1.1) rotate(3deg);
  border-color: var(--accent);
}
.onb-avatar-item--active {
  border-color: var(--accent);
  transform: scale(1.1) rotate(-3deg);
  box-shadow: 0 0 15px rgba(255, 77, 77, 0.3);
}
.onb-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.onb-avatar-check {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background: var(--accent);
  color: var(--white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  border: 2px solid var(--border);
  font-weight: bold;
}
.onb-tt-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}
.onb-tt-day {
  background: var(--bg);
  border: 2px solid var(--border);
  border-radius: var(--radius-wobbly-alt);
  padding: 12px;
}
.onb-tt-day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.onb-tt-day-label {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 18px;
}
.onb-tt-empty {
  font-size: 13px;
  opacity: 0.4;
  text-align: center;
  padding: 6px 0;
}
.onb-tt-slot {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}
.onb-nav {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
@media (max-width: 480px) {
  .onb-card { padding: 28px 16px 20px; }
  .onb-course-row { flex-wrap: wrap; }
  .onb-tt-slot { flex-wrap: wrap; }
}
`;
