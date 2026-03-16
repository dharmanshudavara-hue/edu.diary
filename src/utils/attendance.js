// ─── Attendance Calculation Helpers ───

import { getAttendance, getCourses } from './storage';

/**
 * Get attendance stats for a specific course
 * Returns { attended, total, percentage }
 */
export function calculateAttendance(courseId) {
    const records = getAttendance();
    const courses = getCourses();
    const course = courses.find(c => c.id === courseId);

    let attended = course?.manualAttended || 0;
    let total = course?.manualTotal || 0;

    for (const record of records) {
        for (const entry of record.entries) {
            if (entry.courseId === courseId) {
                total++;
                if (entry.attended) attended++;
            }
        }
    }

    const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);
    return { attended, total, percentage };
}

/**
 * Get attendance stats for ALL courses
 */
export function calculateAllAttendance() {
    const courses = getCourses();
    const stats = {};
    for (const c of courses) {
        stats[c.id] = calculateAttendance(c.id);
    }
    return stats;
}

/**
 * Overall aggregate attendance
 */
export function calculateOverallAttendance() {
    const courses = getCourses();
    let totalAttended = 0;
    let totalClasses = 0;

    for (const c of courses) {
        const s = calculateAttendance(c.id);
        totalAttended += s.attended;
        totalClasses += s.total;
    }

    const percentage = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);
    return { attended: totalAttended, total: totalClasses, percentage };
}

/**
 * How many consecutive classes can be skipped while staying ≥ 75%
 * Formula: skip = floor((attended - 0.75 * total) / 0.75)
 * If already below 75%, returns 0
 */
export function predictSkippable(courseId) {
    const { attended, total } = calculateAttendance(courseId);
    if (total === 0) return 0;
    const canSkip = Math.floor((attended - 0.75 * total) / 0.75);
    return Math.max(0, canSkip);
}

/**
 * If below 75%, how many MORE classes needed to attend in a row to reach 75%
 * Formula: needed = ceil((0.75 * total - attended) / 0.25)
 * If already ≥ 75%, returns 0
 */
export function predictRequired(courseId) {
    const { attended, total, percentage } = calculateAttendance(courseId);
    if (total === 0 || percentage >= 75) return 0;
    const needed = Math.ceil((0.75 * total - attended) / 0.25);
    return Math.max(0, needed);
}

/**
 * Get color class based on percentage
 */
export function getAttColor(pct) {
    if (pct >= 75) return 'att-good';
    if (pct >= 60) return 'att-warn';
    return 'att-danger';
}

/**
 * Get bar color based on percentage
 */
export function getBarColor(pct) {
    if (pct >= 75) return '#22c55e';
    if (pct >= 60) return '#f59e0b';
    return '#ff4d4d';
}
