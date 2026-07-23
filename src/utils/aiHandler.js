import { getCourses, saveCourses, getTodayClasses, getEvents, saveEvents, todayStr, getTimetable, saveTimetable, getAttendance, saveAttendance, getLumiPrefs, getLumiMemory } from "./storage";
import { calculateAllAttendance, calculateOverallAttendance, predictSkippable, predictRequired, predictSkippableWithGoal, predictRequiredWithGoal } from "./attendance";

const QUOTES = {
    stressed: [
        ["You don't have to be perfect. You just have to keep showing up.", "Unknown"],
        ["Take a deep breath. You've overcome challenges before.", "Unknown"],
        ["The secret of getting ahead is getting started.", "Mark Twain"],
        ["Stress means you care. Channel it into action.", "Unknown"],
    ],
    tired: [
        ["Rest if you must, but don't you quit.", "John Greenleaf Whittier"],
        ["It does not matter how slowly you go as long as you do not stop.", "Confucius"],
        ["Even the strongest warriors need to sharpen their swords.", "Unknown"],
    ],
    unmotivated: [
        ["Motivation gets you started. Habit keeps you going.", "Jim Ryun"],
        ["The best time to plant a tree was 20 years ago. The second best time is now.", "Chinese Proverb"],
        ["Don't watch the clock; do what it does. Keep going.", "Sam Levenson"],
        ["You are braver than you believe, stronger than you seem.", "A.A. Milne"],
    ],
    general: [
        ["Education is the most powerful weapon to change the world.", "Nelson Mandela"],
        ["The expert in anything was once a beginner.", "Helen Hayes"],
        ["The beautiful thing about learning is no one can take it away from you.", "B.B. King"],
        ["Push yourself, because no one else is going to do it for you.", "Unknown"],
        ["Dream big. Start small. Act now.", "Robin Sharma"],
        ["The only way to do great work is to love what you do.", "Steve Jobs"],
        ["There are no shortcuts to any place worth going.", "Beverly Sills"],
    ]
};

const PERSONALITY_PROMPTS = {
    buddy: "You're encouraging, empathetic, and playful. Use emojis freely (but not excessively). Celebrate achievements warmly. If the user seems stressed, be supportive first before giving advice. Keep a friendly, warm tone like a close study partner.",
    coach: "You're a strict but caring academic coach. Be direct and hold the user accountable. Minimize emojis (use sparingly). Push them to do better. Don't sugarcoat poor performance. Use motivational but firm language.",
    minimal: "Be concise and factual. Minimal to no emojis. Give information efficiently without fluff or filler. Short sentences. Get straight to the point. Only elaborate when specifically asked.",
    genz: "You speak casual Gen-Z. Use slang like 'no cap', 'lowkey', 'slay', 'fr fr', 'bet', 'bruh'. Be very playful, use lots of emojis and internet humor. Keep it real and relatable. Hype up achievements with energy."
};

/**
 * Builds the context string from local data to send to the AI.
 */
function buildContext() {
    const overallAtt = calculateOverallAttendance();
    const courseAtts = calculateAllAttendance();
    const courses = getCourses();
    const todayClasses = getTodayClasses();
    const events = getEvents();
    const prefs = getLumiPrefs();
    const memory = getLumiMemory();

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const goalPct = prefs.attendanceGoal || 75;
    const hasCustomGoal = goalPct !== 75;

    let context = `Context Data:\n`;
    context += `Today is: ${dayOfWeek}, ${todayStr()} (${timeStr})\n`;
    context += `Overall Attendance: ${overallAtt.percentage}%\n`;
    context += `Courses Attendance Breakdown:\n`;
    courses.forEach(c => {
        const stat = courseAtts[c.id];
        const skip = predictSkippable(c.id);
        const req = predictRequired(c.id);
        let contextStr = `- ${c.name}: ${stat ? stat.percentage : 0}%`;
        if (skip > 0) contextStr += ` (Can skip ${skip} class(es) and stay >=75%)`;
        else if (req > 0) contextStr += ` (Must attend ${req} class(es) to reach 75%)`;
        // Add custom goal info if different from 75%
        if (hasCustomGoal) {
            const customSkip = predictSkippableWithGoal(c.id, goalPct);
            const customReq = predictRequiredWithGoal(c.id, goalPct);
            if (customSkip > 0) contextStr += ` [User goal ${goalPct}%: can skip ${customSkip}]`;
            else if (customReq > 0) contextStr += ` [User goal ${goalPct}%: need ${customReq} more]`;
        }
        context += contextStr + '\n';
    });
    context += `Today's Schedule:\n`;
    if (todayClasses.length === 0) {
        context += `- No classes scheduled today.\n`;
    } else {
        todayClasses.forEach(slot => {
            const c = courses.find(course => course.id === slot.courseId);
            context += `- ${slot.time}: ${c ? c.name : 'Unknown Class'}\n`;
        });
    }
    context += `Current Tasks (not done):\n`;
    const pendingEvents = events.filter(e => !e.done);
    if (pendingEvents.length === 0) {
        context += `- No pending tasks.\n`;
    } else {
        pendingEvents.forEach(t => {
            context += `- [Date: ${t.date}] ${t.title}\n`;
        });
    }

    // Upcoming deadlines (next 3 days)
    const upcoming = events.filter(e => {
        if (e.done) return false;
        const d = new Date(e.date);
        const diff = (d - now) / (1000*60*60*24);
        return diff >= 0 && diff <= 3;
    });
    if (upcoming.length > 0) {
        context += `Upcoming Deadlines (next 3 days):\n`;
        upcoming.forEach(t => {
            const daysLeft = Math.ceil((new Date(t.date) - now) / (1000*60*60*24));
            context += `- ${t.title} — ${daysLeft === 0 ? 'TODAY' : `in ${daysLeft} day(s)`}\n`;
        });
    }

    // User preferences & memory
    context += `\nUser Preferences:\n`;
    context += `- Attendance Goal: ${goalPct}%${hasCustomGoal ? ' (custom, not default 75%)' : ' (default)'}\n`;
    context += `- Preferred Study Time: ${prefs.preferredStudyTime || 'not set'}\n`;
    if (prefs.studyGoal) context += `- Study Goal: ${prefs.studyGoal}\n`;
    context += `- Chat History: ${memory.chatCount || 0} conversations with Lumi\n`;
    if (memory.lastActiveTime) {
        const lastActive = new Date(memory.lastActiveTime);
        const hoursAgo = Math.round((now - lastActive) / (1000 * 60 * 60));
        context += `- Last Active: ${hoursAgo < 1 ? 'just now' : hoursAgo < 24 ? hoursAgo + ' hours ago' : Math.round(hoursAgo / 24) + ' days ago'}\n`;
    }
    // Detect peak activity hours from task completions
    if (memory.taskCompletionTimes && memory.taskCompletionTimes.length >= 5) {
        const hourCounts = {};
        memory.taskCompletionTimes.forEach(t => {
            const h = t.hour;
            hourCounts[h] = (hourCounts[h] || 0) + 1;
        });
        const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
        if (peakHour) {
            const h = parseInt(peakHour[0]);
            const label = h < 12 ? `${h || 12} AM` : `${h === 12 ? 12 : h - 12} PM`;
            context += `- Peak Activity: Most tasks completed around ${label}\n`;
        }
    }

    return context;
}

/**
 * Builds the appropriate system message with dynamic personality.
 */
function buildSystemMessage(context, personalityKey) {
    const personality = PERSONALITY_PROMPTS[personalityKey] || PERSONALITY_PROMPTS.buddy;
    const prefs = getLumiPrefs();
    const memory = getLumiMemory();

    // Adaptive greeting instruction based on memory
    let greetingHint = '';
    if (!memory.lastActiveTime || memory.chatCount <= 1) {
        greetingHint = 'This is a new user — be extra welcoming and introduce yourself warmly.';
    } else {
        const hoursAgo = (Date.now() - new Date(memory.lastActiveTime).getTime()) / (1000 * 60 * 60);
        if (hoursAgo > 72) {
            greetingHint = 'The user hasn\'t chatted in a while — welcome them back warmly.';
        } else if (memory.chatCount > 20) {
            greetingHint = 'This is a frequent user — be casual and natural, no need for formal intros.';
        }
    }

    return `You are Lumi ✨, a personal study assistant for a student diary app.

PERSONALITY: ${personality}
${greetingHint ? `\nGREETING STYLE: ${greetingHint}` : ''}
${prefs.studyGoal ? `\nUSER'S STUDY GOAL: "${prefs.studyGoal}" — Keep this in mind and reference it when relevant.` : ''}

TOOLS: addTask, manageCourse, manageTimetable, manageAttendance, getMotivation (for encouragement), generateStudyPlan (study scheduling), getInsights (academic analytics), manageTask (complete/delete/edit tasks).

NATIVE ABILITIES (no tool needed): Explain concepts, translate text, answer study questions, give tips.

Here is the user's latest local data:
${context}

RULES: Answer naturally, use Markdown. Use tools when appropriate. For explanations/translations respond directly. Don't expose IDs. Be proactive with suggestions. Only respond as Lumi.${prefs.attendanceGoal !== 75 ? `\nIMPORTANT: The user has set a personal attendance goal of ${prefs.attendanceGoal}% (university minimum is 75%). When discussing attendance, reference THEIR goal of ${prefs.attendanceGoal}%, not just the 75% minimum.` : ''}`;
}

/**
 * Executes a function call returned by the AI (runs locally on the client).
 */
function executeFunctionCall(name, args) {
    if (name === "addTask") {
        const { title, date } = args;
        const localEvents = getEvents();
        localEvents.push({
            id: Date.now().toString(),
            title: title || "New Reminder",
            date: date || todayStr(),
            description: "Added by Lumi",
            done: false
        });
        localEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        saveEvents(localEvents);
        return `Got it! I have added **"${title}"** to your tasks for ${date === todayStr() ? 'today' : date}.`;
    }

    if (name === "manageCourse") {
        const { action, courseName } = args;
        let userCourses = getCourses();

        if (action === "add") {
            const exists = userCourses.find(c => c.name.toLowerCase() === courseName.toLowerCase());
            if (!exists) {
                userCourses.push({
                    id: Date.now().toString(),
                    name: courseName,
                    manualAttended: 0,
                    manualTotal: 0
                });
                saveCourses(userCourses);
                return `I've successfully added **${courseName}** to your opted courses!`;
            }
            return `You already have **${courseName}** in your opted courses.`;
        } else if (action === "remove") {
            const filtered = userCourses.filter(c => c.name.toLowerCase() !== courseName.toLowerCase());
            if (filtered.length < userCourses.length) {
                saveCourses(filtered);
                return `I've removed **${courseName}** from your opted courses.`;
            }
            return `I couldn't find **${courseName}** in your opted courses.`;
        }
    }

    if (name === "manageTimetable") {
        let { action, courseName, day, time } = args;

        day = (day || "").toLowerCase();
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(day)) {
            return `Error: Invalid day '${day}'.`;
        }

        let userCourses = getCourses();
        let course = userCourses.find(c => c.name.toLowerCase() === courseName.toLowerCase());

        if (action === "add") {
            if (!course) {
                course = {
                    id: Date.now().toString(),
                    name: courseName,
                    manualAttended: 0,
                    manualTotal: 0
                };
                userCourses.push(course);
                saveCourses(userCourses);
            }

            let timetable = getTimetable();
            if (!timetable[day]) timetable[day] = [];

            const exists = timetable[day].find(s => s.time === time && s.courseId === course.id);
            if (!exists) {
                timetable[day].push({ courseId: course.id, time });
                saveTimetable(timetable);
                return `I've successfully scheduled **${course.name}** on ${day.charAt(0).toUpperCase() + day.slice(1)} at ${time}.`;
            }
            return `You already have **${course.name}** scheduled on ${day} at ${time}.`;

        } else if (action === "remove") {
            if (!course) return `I couldn't find a course named **${courseName}** in your list.`;

            let timetable = getTimetable();
            if (!timetable[day] || timetable[day].length === 0) return `You don't have any classes on ${day}.`;

            const initialLen = timetable[day].length;
            timetable[day] = timetable[day].filter(s => !(s.time === time && s.courseId === course.id));

            if (timetable[day].length < initialLen) {
                saveTimetable(timetable);
                return `I've removed **${course.name}** from your timetable on ${day.charAt(0).toUpperCase() + day.slice(1)} at ${time}.`;
            }
            return `I couldn't find **${course.name}** on ${day} at ${time} in your timetable.`;
        }
    }

    if (name === "manageAttendance") {
        const { action, courseName, date, status } = args;
        const userCourses = getCourses();
        const course = userCourses.find(c => c.name.toLowerCase() === courseName.toLowerCase());

        if (!course) {
            return `I couldn't find a course named **${courseName}**. Please make sure it's in your opted courses first!`;
        }

        let attendance = getAttendance();
        let dayRecord = attendance.find(r => r.date === date);

        if (action === "mark") {
            const isAttended = status === "present";
            if (!dayRecord) {
                dayRecord = { date, entries: [] };
                attendance.push(dayRecord);
            }

            const existingEntryIndex = dayRecord.entries.findIndex(e => e.courseId === course.id);
            if (existingEntryIndex >= 0) {
                dayRecord.entries[existingEntryIndex].attended = isAttended;
            } else {
                dayRecord.entries.push({ courseId: course.id, attended: isAttended });
            }

            saveAttendance(attendance);
            return `I've marked **${course.name}** as **${status}** for ${date}.`;
        } else if (action === "remove") {
            if (!dayRecord) {
                return `There are no attendance records for ${date}.`;
            }

            const initialLen = dayRecord.entries.length;
            dayRecord.entries = dayRecord.entries.filter(e => e.courseId !== course.id);

            if (dayRecord.entries.length < initialLen) {
                if (dayRecord.entries.length === 0) {
                    attendance = attendance.filter(r => r.date !== date);
                }
                saveAttendance(attendance);
                return `I've removed the attendance record for **${course.name}** on ${date}.`;
            }
            return `I couldn't find an attendance record for **${course.name}** on ${date}.`;
        }
    }

    if (name === "getMotivation") {
        const mood = args.mood || 'general';
        const pool = QUOTES[mood] || QUOTES.general;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        return `💡 *"${pick[0]}"*\n— ${pick[1]}`;
    }

    if (name === "generateStudyPlan") {
        const days = Math.min(args.days || 7, 14);
        const focus = args.focusArea;
        const courses = getCourses();
        const events = getEvents();
        const timetable = getTimetable();
        const courseAtts = calculateAllAttendance();
        const weak = courses.filter(c => { const s = courseAtts[c.id]; return s && s.percentage < 75; });
        const pending = events.filter(e => !e.done).sort((a,b) => new Date(a.date)-new Date(b.date));
        let plan = `📚 **Your ${days}-Day Study Plan**\n\n`;
        if (focus) plan += `🎯 **Focus:** ${focus}\n\n`;
        if (weak.length > 0) {
            plan += `⚠️ **Priority Subjects** (below 75%):\n`;
            weak.forEach(c => { const s = courseAtts[c.id]; const r = predictRequired(c.id); plan += `- **${c.name}**: ${s.percentage}% — attend ${r} more\n`; });
            plan += `\n`;
        }
        if (pending.length > 0) {
            plan += `📅 **Upcoming Tasks:**\n`;
            pending.slice(0,5).forEach(e => { const d = Math.ceil((new Date(e.date)-new Date())/(1000*60*60*24)); plan += `- **${e.title}** — ${d<=0?'TODAY!':`in ${d}d`}\n`; });
            plan += `\n`;
        }
        const dayNames = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        plan += `📋 **Daily Breakdown:**\n`;
        for (let i = 0; i < Math.min(days,7); i++) {
            const d = new Date(); d.setDate(d.getDate()+i);
            const dn = dayNames[d.getDay()];
            const label = d.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
            const cls = timetable[dn] || [];
            plan += `\n**${label}:**\n`;
            if (cls.length > 0) { plan += `  📖 ${cls.map(s => { const c=courses.find(x=>x.id===s.courseId); return `${c?c.name:'?'} (${s.time})`; }).join(', ')}\n`; }
            if (weak.length > 0 && cls.length < 4) { plan += `  💡 Focus: Review **${weak[i%weak.length].name}**\n`; }
        }
        plan += `\n✨ **Tips:** Use Pomodoro (50min work / 10min break). Review notes within 24hrs.`;
        return plan;
    }

    if (name === "getInsights") {
        const type = args.type || 'all';
        const courses = getCourses();
        const events = getEvents();
        const courseAtts = calculateAllAttendance();
        const overall = calculateOverallAttendance();
        let out = `📊 **Academic Insights**\n\n`;
        if (type==='attendance'||type==='all') {
            out += `**📈 Attendance:** ${overall.percentage}% (${overall.attended}/${overall.total})\n`;
            out += overall.percentage>=75 ? '✅ Above threshold\n' : '⚠️ Below 75% threshold!\n';
            courses.forEach(c => { const s=courseAtts[c.id]; if(!s)return; const sk=predictSkippable(c.id); const rq=predictRequired(c.id); out += `- ${s.percentage>=75?'✅':'🔴'} **${c.name}**: ${s.percentage}%`; if(sk>0)out+=` (can skip ${sk})`; if(rq>0)out+=` (need ${rq} more)`; out+='\n'; });
            out += '\n';
        }
        if (type==='tasks'||type==='all') {
            const done=events.filter(e=>e.done).length; const pend=events.filter(e=>!e.done);
            const overdue=pend.filter(e=>new Date(e.date)<new Date(todayStr()));
            out += `**📝 Tasks:** ${done} done, ${pend.length} pending`;
            if(overdue.length>0) out += `, ${overdue.length} overdue 🚨`;
            out += '\n\n';
        }
        if (type==='all'||type==='overview') {
            let score=0;
            if(overall.percentage>=75)score+=40; else if(overall.percentage>=60)score+=20;
            const overdue=events.filter(e=>!e.done&&new Date(e.date)<new Date(todayStr()));
            if(overdue.length===0)score+=30; else if(overdue.length<=2)score+=15;
            if(courses.length>0)score+=15; if(Object.keys(getTimetable()).length>0)score+=15;
            out += `**🏆 Health Score: ${score}/100** — `;
            if(score>=80)out+='Amazing! 🎉'; else if(score>=60)out+='Good progress!'; else out+='Room to improve!';
        }
        return out;
    }

    if (name === "manageTask") {
        const { action, taskTitle, newTitle, newDate } = args;
        let localEvents = getEvents();
        const idx = localEvents.findIndex(e => e.title.toLowerCase().includes(taskTitle.toLowerCase()));
        if (idx === -1) return `I couldn't find a task matching **"${taskTitle}"**.`;
        const task = localEvents[idx];
        if (action === 'complete') { localEvents[idx].done = true; saveEvents(localEvents); return `✅ Marked **"${task.title}"** as complete!`; }
        if (action === 'delete') { const t=task.title; localEvents.splice(idx,1); saveEvents(localEvents); return `🗑️ Deleted **"${t}"**.`; }
        if (action === 'edit') { if(newTitle)localEvents[idx].title=newTitle; if(newDate)localEvents[idx].date=newDate; saveEvents(localEvents); return `✏️ Updated: **"${localEvents[idx].title}"** on ${localEvents[idx].date}.`; }
        return 'Unknown task action.';
    }

    return "I received an unknown action. Please try again.";
}

/**
 * Sends a chat message to Lumi.
 * In production: calls the secure /api/chat serverless function.
 * In development: calls Gemini directly (using VITE_GEMINI_API_KEY from .env.local).
 */
export async function sendChatMessage(messageHistory) {
    const context = buildContext();

    // Prepare history (exclude the last message, which is the current user input)
    let rawHistory = messageHistory.slice(0, -1);
    if (rawHistory.length > 0 && rawHistory[0].role === "model") {
        rawHistory = rawHistory.slice(1);
    }
    const lastMessage = messageHistory[messageHistory.length - 1].parts;

    // ───── PRODUCTION: Use secure serverless API route ─────
    if (import.meta.env.PROD) {
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    context,
                    messages: rawHistory,
                    lastMessage,
                    prefs: getLumiPrefs(),
                    memory: getLumiMemory()
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Server error ${res.status}`);
            }

            const data = await res.json();

            if (data.type === "functionCall") {
                return executeFunctionCall(data.name, data.args);
            }

            return data.content;
        } catch (e) {
            console.error("Lumi API error:", e);
            return "Oops! I encountered an error connecting to my AI brain. Please try again later.";
        }
    }

    // ───── DEVELOPMENT: Direct Groq call (key stays in .env.local) ─────
    try {
        const { OpenAI } = await import("openai");
        const apiKey = import.meta.env.VITE_GROQ_API_KEY;
        if (!apiKey) {
            return "Dev error: VITE_GROQ_API_KEY is missing in .env.local.";
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1",
            dangerouslyAllowBrowser: true // Required for client-side API requests
        });

        const systemMessage = buildSystemMessage(context, getLumiPrefs().personality);

        const tools = [
            {
                type: "function",
                function: {
                    name: "addTask",
                    description: "Adds a new task or reminder to the user's schedule.",
                    parameters: {
                        type: "object",
                        properties: {
                            title: { type: "string", description: "The task title" },
                            date: { type: "string", description: "Date in YYYY-MM-DD format based on what the user asked" }
                        },
                        required: ["title", "date"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "manageCourse",
                    description: "Adds or removes an opted course.",
                    parameters: {
                        type: "object",
                        properties: {
                            action: { type: "string", description: "'add' or 'remove'" },
                            courseName: { type: "string", description: "Course name" }
                        },
                        required: ["action", "courseName"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "manageTimetable",
                    description: "Adds or removes a class from the weekly timetable.",
                    parameters: {
                        type: "object",
                        properties: {
                            action: { type: "string", description: "'add' or 'remove'" },
                            courseName: { type: "string", description: "Course name" },
                            day: { type: "string", description: "Day of week (lowercase)" },
                            time: { type: "string", description: "Time in HH:MM 24h format" }
                        },
                        required: ["action", "courseName", "day", "time"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "manageAttendance",
                    description: "Marks or removes attendance for a specific subject on a specific date.",
                    parameters: {
                        type: "object",
                        properties: {
                            action: { type: "string", description: "'mark' or 'remove'" },
                            courseName: { type: "string", description: "Name of the course." },
                            date: { type: "string", description: "Date in YYYY-MM-DD format." },
                            status: { type: "string", description: "'present' or 'absent' (for 'mark')." }
                        },
                        required: ["action", "courseName", "date"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "getMotivation",
                    description: "Returns a motivational quote. Use when user feels stressed, tired, demotivated, or asks for encouragement.",
                    parameters: { type: "object", properties: { mood: { type: "string", description: "'stressed','tired','unmotivated','general'" } }, required: [] }
                }
            },
            {
                type: "function",
                function: {
                    name: "generateStudyPlan",
                    description: "Generates a personalized study plan from user's tasks, timetable, and attendance. Use when user asks for a study plan or schedule suggestion.",
                    parameters: { type: "object", properties: { days: { type: "number", description: "Days to plan (default 7)" }, focusArea: { type: "string", description: "Subject to focus on" } }, required: [] }
                }
            },
            {
                type: "function",
                function: {
                    name: "getInsights",
                    description: "Provides academic analytics, attendance trends, task stats, and health score. Use when user asks how they're doing or wants a performance summary.",
                    parameters: { type: "object", properties: { type: { type: "string", description: "'attendance','tasks','overview','all'" } }, required: [] }
                }
            },
            {
                type: "function",
                function: {
                    name: "manageTask",
                    description: "Complete, delete, or edit an existing task.",
                    parameters: { type: "object", properties: { action: { type: "string", description: "'complete','delete','edit'" }, taskTitle: { type: "string", description: "Task title or partial match" }, newTitle: { type: "string", description: "New title (edit only)" }, newDate: { type: "string", description: "New date YYYY-MM-DD (edit only)" } }, required: ["action","taskTitle"] }
                }
            }
        ];

        const openAiHistory = rawHistory.map(m => ({
            role: m.role === "model" ? "assistant" : "user",
            content: m.parts || m.content || ""
        }));
        
        openAiHistory.push({ role: "user", content: lastMessage });

        const result = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile", // Blazing fast Groq model
            messages: [
                { role: "system", content: systemMessage },
                ...openAiHistory
            ],
            tools: tools
        });

        const message = result.choices[0].message;

        if (message.tool_calls && message.tool_calls.length > 0) {
            const toolCall = message.tool_calls[0];
            const args = JSON.parse(toolCall.function.arguments);
            return executeFunctionCall(toolCall.function.name, args);
        }

        return message.content || "I couldn't generate a response.";
    } catch (e) {
        console.error("Lumi AI error:", e);
        return `Oops! I encountered an AI error: ${e.message}`;
    }
}
