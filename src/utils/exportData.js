import { getData, getCourses, getAttendance, getEvents } from './storage';

export function exportAsJSON() {
    const data = getData();
    if (!data) return alert('No data to export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `edudiary-backup-${todayFileStr()}.json`);
}

export function exportAttendanceCSV() {
    const courses = getCourses();
    const attendance = getAttendance();
    if (!attendance.length) return alert('No attendance data');

    let csv = 'Date,Course,Code,Status\n';
    attendance.forEach(record => {
        record.entries.forEach(entry => {
            const course = courses.find(c => c.id === entry.courseId);
            csv += `${record.date},"${course?.name || entry.courseId}",${course?.code || ''},${entry.attended ? 'Present' : 'Absent'}\n`;
        });
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `attendance-${todayFileStr()}.csv`);
}

export function exportTasksCSV() {
    const events = getEvents();
    if (!events.length) return alert('No tasks data');

    let csv = 'Title,Date,Description,Status\n';
    events.forEach(ev => {
        csv += `"${ev.title}",${ev.date},"${ev.description || ''}",${ev.done ? 'Done' : 'Pending'}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `tasks-${todayFileStr()}.csv`);
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function todayFileStr() {
    return new Date().toISOString().split('T')[0];
}
