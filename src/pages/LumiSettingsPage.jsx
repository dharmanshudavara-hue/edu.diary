import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { getLumiPrefs, saveLumiPrefs, getLumiMemory, saveLumiMemory } from '../utils/storage';

export default function LumiSettingsPage() {
    const navigate = useNavigate();
    const [prefs, setPrefs] = useState(getLumiPrefs());
    const [memory, setMemory] = useState(getLumiMemory());
    const [showSaved, setShowSaved] = useState(false);

    function handleSave() {
        saveLumiPrefs(prefs);
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    }

    function handleClearMemory() {
        if (window.confirm("Are you sure you want to clear Lumi's memory? This will reset chat history and activity tracking.")) {
            saveLumiMemory({ lastActiveTime: null, taskCompletionTimes: [], chatCount: 0, topicsAsked: [] });
            setMemory(getLumiMemory());
        }
    }

    return (
        <Layout>
            <style>{styles}</style>
            <div style={{ animation: 'hd-fadeIn 0.3s ease-out', maxWidth: 800, margin: '0 auto' }}>
                <div className="lumi-settings-header">
                    <h2>⚙️ Lumi Settings</h2>
                    <p className="hd-text-muted">Personalize how your AI study assistant interacts with you.</p>
                </div>

                <div className="hd-card hd-mt-md" style={{ transform: 'rotate(-0.5deg)' }}>
                    <div className="hd-tape" />
                    <h3>🎯 Attendance Goal</h3>
                    <p className="hd-text-muted hd-mb-md" style={{ fontSize: 14 }}>
                        University minimum is 75%, but what is YOUR personal goal? Lumi will advise you based on this.
                    </p>
                    <div className="lumi-goal-wrap">
                        <input 
                            type="range" 
                            min="60" max="100" 
                            value={prefs.attendanceGoal} 
                            onChange={e => setPrefs({...prefs, attendanceGoal: parseInt(e.target.value)})}
                            className="lumi-slider"
                        />
                        <div className="lumi-goal-display">
                            {prefs.attendanceGoal}%
                        </div>
                    </div>
                </div>

                <div className="hd-card hd-mt-lg" style={{ transform: 'rotate(0.3deg)' }}>
                    <div className="hd-tack" />
                    <h3>🎭 Lumi's Personality</h3>
                    <p className="hd-text-muted hd-mb-md" style={{ fontSize: 14 }}>
                        How do you want Lumi to sound when chatting with you?
                    </p>
                    
                    <div className="lumi-personality-grid">
                        <div 
                            className={`lumi-p-card ${prefs.personality === 'buddy' || !prefs.personality ? 'active' : ''}`}
                            onClick={() => setPrefs({...prefs, personality: 'buddy'})}
                        >
                            <div className="lumi-p-emoji">🤗</div>
                            <h4>Study Buddy</h4>
                            <p>Warm, encouraging, and playful. Uses emojis freely.</p>
                        </div>
                        <div 
                            className={`lumi-p-card ${prefs.personality === 'coach' ? 'active' : ''}`}
                            onClick={() => setPrefs({...prefs, personality: 'coach'})}
                        >
                            <div className="lumi-p-emoji">🏋️</div>
                            <h4>Strict Coach</h4>
                            <p>Direct, no-nonsense. Holds you accountable to your goals.</p>
                        </div>
                        <div 
                            className={`lumi-p-card ${prefs.personality === 'minimal' ? 'active' : ''}`}
                            onClick={() => setPrefs({...prefs, personality: 'minimal'})}
                        >
                            <div className="lumi-p-emoji">🧘</div>
                            <h4>Minimalist</h4>
                            <p>Concise, factual, low emoji usage. Gets straight to the point.</p>
                        </div>
                        <div 
                            className={`lumi-p-card ${prefs.personality === 'genz' ? 'active' : ''}`}
                            onClick={() => setPrefs({...prefs, personality: 'genz'})}
                        >
                            <div className="lumi-p-emoji">🔥</div>
                            <h4>Gen-Z Mode</h4>
                            <p>Casual slang, very playful, internet humor. No cap.</p>
                        </div>
                    </div>
                </div>

                <div className="hd-card hd-mt-lg" style={{ transform: 'rotate(-0.2deg)' }}>
                    <h3>📚 Study Preferences</h3>
                    
                    <div className="hd-form-group hd-mt-md">
                        <label className="hd-label">Preferred Study Time</label>
                        <select 
                            className="hd-select" 
                            value={prefs.preferredStudyTime} 
                            onChange={e => setPrefs({...prefs, preferredStudyTime: e.target.value})}
                        >
                            <option value="morning">Morning (5 AM - 12 PM)</option>
                            <option value="afternoon">Afternoon (12 PM - 5 PM)</option>
                            <option value="evening">Evening (5 PM - 10 PM)</option>
                            <option value="night">Night Owl (10 PM - 5 AM)</option>
                        </select>
                    </div>

                    <div className="hd-form-group">
                        <label className="hd-label">Primary Study Goal</label>
                        <input 
                            type="text" 
                            className="hd-input" 
                            placeholder="e.g. Crack GATE 2027, Top my class, Survive the semester" 
                            value={prefs.studyGoal} 
                            onChange={e => setPrefs({...prefs, studyGoal: e.target.value})}
                        />
                        <p className="hd-text-muted hd-mt-sm" style={{ fontSize: 13 }}>Lumi will keep this in mind and occasionally remind you of it.</p>
                    </div>
                </div>

                <div className="hd-card hd-mt-lg hd-card--postit" style={{ transform: 'rotate(0.5deg)' }}>
                    <h3>🧠 Lumi's Memory</h3>
                    <p className="hd-text-muted hd-mb-md" style={{ fontSize: 14 }}>
                        Lumi learns your patterns passively over time to serve you better.
                    </p>
                    
                    <div className="hd-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <strong>Total Chats:</strong> {memory.chatCount || 0}
                        </div>
                        <div>
                            <strong>Last Active:</strong> {memory.lastActiveTime ? new Date(memory.lastActiveTime).toLocaleString() : 'Never'}
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <strong>Tracked Task Completions:</strong> {memory.taskCompletionTimes?.length || 0} (used to detect peak focus hours)
                        </div>
                    </div>

                    <button className="hd-btn hd-btn--sm hd-btn--secondary hd-mt-md" onClick={handleClearMemory}>
                        🗑️ Clear Memory
                    </button>
                </div>

                <div className="lumi-settings-actions hd-mt-lg hd-mb-lg">
                    <button className="hd-btn hd-btn--secondary" onClick={() => navigate('/dashboard')}>Cancel</button>
                    <button className="hd-btn" onClick={handleSave}>
                        {showSaved ? '✅ Saved!' : '💾 Save Settings'}
                    </button>
                </div>
            </div>
        </Layout>
    );
}

const styles = `
.lumi-settings-header {
    margin-bottom: 24px;
}
.lumi-goal-wrap {
    display: flex;
    align-items: center;
    gap: 20px;
}
.lumi-slider {
    flex: 1;
    -webkit-appearance: none;
    width: 100%;
    height: 12px;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: var(--radius-wobbly);
    outline: none;
}
.lumi-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--accent);
    border: 3px solid var(--border);
    cursor: pointer;
}
.lumi-goal-display {
    font-family: var(--font-heading);
    font-size: 28px;
    font-weight: bold;
    color: var(--accent);
    min-width: 60px;
    text-align: right;
}

.lumi-personality-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}
@media(max-width: 600px) {
    .lumi-personality-grid { grid-template-columns: 1fr; }
}
.lumi-p-card {
    border: 2px dashed var(--muted);
    border-radius: var(--radius-wobbly-alt);
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    background: var(--bg);
}
.lumi-p-card:hover {
    border-color: var(--blue);
    transform: translateY(-2px);
}
.lumi-p-card.active {
    border-color: var(--accent);
    border-style: solid;
    border-width: 3px;
    background: #fff0f0;
    box-shadow: 4px 4px 0 var(--accent);
}
[data-theme="dark"] .lumi-p-card.active {
    background: rgba(255,107,107,0.1);
}
.lumi-p-emoji {
    font-size: 32px;
    margin-bottom: 8px;
}
.lumi-p-card h4 {
    margin-bottom: 4px;
    font-size: 18px;
}
.lumi-p-card p {
    font-size: 14px;
    opacity: 0.7;
}

.lumi-settings-actions {
    display: flex;
    justify-content: flex-end;
    gap: 16px;
}
`;
