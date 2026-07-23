import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getEvents, saveEvents, todayStr, recordTaskCompletion } from '../utils/storage';
import { showUndo } from '../components/UndoSnackbar';
import PomodoroTimer from '../components/PomodoroTimer';

export default function TasksPage() {
    const [events, setEvents] = useState([]);
    const [showForm, setShowForm] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [date, setDate] = useState(todayStr());
    const [description, setDescription] = useState('');

    useEffect(() => {
        setEvents(getEvents());
    }, []);

    function handleAdd(e) {
        e.preventDefault();
        if (!title.trim() || !date) return;
        
        const newEvent = {
            id: Date.now().toString(),
            title: title.trim(),
            date,
            description: description.trim(),
            done: false
        };
        
        const updated = [...events, newEvent];
        // Sort by date mostly
        updated.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setEvents(updated);
        saveEvents(updated);
        
        // Reset form
        setTitle('');
        setDate(todayStr());
        setDescription('');
        setShowForm(false);
    }
    
    function toggleDone(id) {
        const ev = events.find(e => e.id === id);
        const updated = events.map(e => 
            e.id === id ? { ...e, done: !e.done } : e
        );
        setEvents(updated);
        saveEvents(updated);

        if (!ev.done) {
            recordTaskCompletion();
            showUndo(`"${ev.title}" marked as done`, () => {
                const reverted = updated.map(e => 
                    e.id === id ? { ...e, done: false } : e
                );
                setEvents(reverted);
                saveEvents(reverted);
            });
        }
    }
    
    function handleDelete(id) {
        const deleted = events.find(e => e.id === id);
        const updated = events.filter(ev => ev.id !== id);
        setEvents(updated);
        saveEvents(updated);

        showUndo(`"${deleted.title}" deleted`, () => {
            const restored = [...updated, deleted].sort((a, b) => new Date(a.date) - new Date(b.date));
            setEvents(restored);
            saveEvents(restored);
        });
    }

    const upcoming = events.filter(e => !e.done && new Date(e.date) >= new Date(todayStr() + 'T00:00:00'));
    const overdue = events.filter(e => !e.done && new Date(e.date) < new Date(todayStr() + 'T00:00:00'));
    const completed = events.filter(e => e.done);

    return (
        <Layout>
            <style>{styles}</style>
            <div className="tasks-container" style={{ animation: 'hd-fadeIn 0.3s ease-out' }}>
                <div className="tasks-header">
                    <div>
                        <h1 className="hd-mt-0 hd-mb-sm">📝 Tasks & Events</h1>
                        <p className="hd-text-muted">Keep track of your assignments, exams, and deadlines.</p>
                    </div>
                    <div className="tasks-header-actions">
                        <PomodoroTimer />
                        <button className="hd-btn" onClick={() => setShowForm(true)} id="add-task-btn">
                            + Add New
                        </button>
                    </div>
                </div>
                
                {/* Form Modal */}
                {showForm && (
                    <div className="hd-overlay" onClick={() => setShowForm(false)}>
                        <div className="hd-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }} role="dialog" aria-label="New Task">
                            <h2 style={{ marginBottom: 16 }}>✏️ New Task / Event</h2>
                            <form onSubmit={handleAdd}>
                                <div className="hd-form-group">
                                    <label className="hd-label" htmlFor="task-title">Title</label>
                                    <input 
                                        id="task-title"
                                        className="hd-input" 
                                        value={title} 
                                        onChange={e => setTitle(e.target.value)} 
                                        placeholder="e.g. Math Midterm, CS Assignment"
                                        maxLength={50}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="hd-form-group">
                                    <label className="hd-label" htmlFor="task-date">Date / Deadline</label>
                                    <input 
                                        id="task-date"
                                        type="date"
                                        className="hd-input" 
                                        value={date} 
                                        onChange={e => setDate(e.target.value)} 
                                        required
                                    />
                                </div>
                                <div className="hd-form-group">
                                    <label className="hd-label" htmlFor="task-desc">Description (Optional)</label>
                                    <textarea 
                                        id="task-desc"
                                        className="hd-input" 
                                        rows="3"
                                        value={description} 
                                        onChange={e => setDescription(e.target.value)} 
                                        placeholder="Notes..."
                                    />
                                </div>
                                <div className="tasks-form-actions">
                                    <button type="button" className="hd-btn hd-btn--secondary" onClick={() => setShowForm(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="hd-btn" id="save-task-btn">
                                        Save Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className="hd-row" style={{ gap: 24, marginTop: 24, display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Overdue */}
                    {overdue.length > 0 && (
                        <div className="hd-card" style={{ transform: 'rotate(-0.5deg)', borderColor: 'var(--accent)' }}>
                            <div className="hd-tack" />
                            <h3 style={{ color: 'var(--accent)', marginBottom: 16 }}>⚠️ Overdue</h3>
                            <div className="tasks-list hd-stagger">
                                {overdue.map(ev => <TaskItem key={ev.id} event={ev} onToggle={() => toggleDone(ev.id)} onDelete={() => handleDelete(ev.id)} overdue />)}
                            </div>
                        </div>
                    )}

                    {/* Upcoming */}
                    <div className="hd-card hd-card--flat" style={{ transform: 'rotate(0.3deg)' }}>
                        <div className="hd-tape" />
                        <h3 style={{ marginBottom: 16 }}>📌 Upcoming Deadlines</h3>
                        {upcoming.length === 0 ? (
                            <p className="hd-text-muted hd-text-center" style={{ padding: '20px 0' }}>All caught up! 🎉</p>
                        ) : (
                            <div className="tasks-list hd-stagger">
                                {upcoming.map(ev => <TaskItem key={ev.id} event={ev} onToggle={() => toggleDone(ev.id)} onDelete={() => handleDelete(ev.id)} />)}
                            </div>
                        )}
                    </div>

                    {/* Completed */}
                    {completed.length > 0 && (
                        <div className="tasks-completed-section">
                            <h3 className="hd-text-muted" style={{ marginBottom: 12, fontSize: 18 }}>✅ Completed</h3>
                            <div className="tasks-list" style={{ opacity: 0.7 }}>
                                {completed.map(ev => <TaskItem key={ev.id} event={ev} onToggle={() => toggleDone(ev.id)} onDelete={() => handleDelete(ev.id)} />)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

function TaskItem({ event, onToggle, onDelete, overdue }) {
    return (
        <div className="task-item">
            <input 
                type="checkbox" 
                className="hd-checkbox task-check" 
                checked={event.done} 
                onChange={onToggle}
                aria-label={`Mark "${event.title}" as ${event.done ? 'incomplete' : 'complete'}`}
            />
            <div className={`task-content ${event.done ? 'task-done' : ''}`}>
                <div className="task-title">
                    {event.title}
                    {overdue && !event.done && <span className="hd-badge hd-badge--red" style={{ marginLeft: 8 }}>Overdue</span>}
                </div>
                <div className="task-meta">
                    📅 {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {event.description && <span style={{ marginLeft: 10 }}>📝 {event.description}</span>}
                </div>
            </div>
            <button className="task-delete btn-icon" onClick={onDelete} title="Delete" aria-label={`Delete "${event.title}"`}>🗑️</button>
        </div>
    );
}

const styles = `
.tasks-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24px;
}
.tasks-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}
.tasks-form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
}
.tasks-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.task-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    background: var(--bg);
    border: 2px dashed var(--muted);
    border-radius: var(--radius-wobbly-alt);
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.task-item:hover {
    transform: translateX(4px);
    border-color: var(--border);
    box-shadow: var(--shadow-sm);
}
.task-check {
    margin-top: 4px;
}
.task-content {
    flex: 1;
}
.task-title {
    font-family: var(--font-heading);
    font-weight: 700;
    font-size: 18px;
    color: var(--fg);
    margin-bottom: 2px;
}
.task-meta {
    font-size: 13px;
    color: var(--fg);
    opacity: 0.6;
}
.task-done .task-title {
    text-decoration: line-through;
    opacity: 0.5;
}
.task-delete {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    opacity: 0.4;
    padding: 4px;
    transition: all 0.15s;
}
.task-delete:hover {
    opacity: 1;
    transform: scale(1.2) rotate(10deg);
}
.tasks-completed-section {
    margin-top: 24px;
}
@media (max-width: 600px) {
    .tasks-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }
    .tasks-header-actions {
        flex-wrap: wrap;
    }
}
`;
