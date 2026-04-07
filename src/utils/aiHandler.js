import { getCourses, saveCourses, getTodayClasses, getEvents, saveEvents, todayStr, getTimetable, saveTimetable, getAttendance, saveAttendance } from "./storage";
import { calculateAllAttendance, calculateOverallAttendance, predictSkippable, predictRequired } from "./attendance";

/**
 * Builds the context string from local data to send to the AI.
 */
function buildContext() {
    const overallAtt = calculateOverallAttendance();
    const courseAtts = calculateAllAttendance();
    const courses = getCourses();
    const todayClasses = getTodayClasses();
    const events = getEvents();

    let context = `Context Data:\n`;
    context += `Today is: ${todayStr()}\n`;
    context += `Overall Attendance: ${overallAtt.percentage}%\n`;
    context += `Courses Attendance Breakdown:\n`;
    courses.forEach(c => {
        const stat = courseAtts[c.id];
        const skip = predictSkippable(c.id);
        const req = predictRequired(c.id);
        let contextStr = `- ${c.name}: ${stat ? stat.percentage : 0}%`;
        if (skip > 0) contextStr += ` (Can skip ${skip} class(es) and stay >=75%)`;
        else if (req > 0) contextStr += ` (Must attend ${req} class(es) to reach 75%)`;
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
    return context;
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
                    lastMessage
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

        const systemMessage = `You are Lumi, a friendly, personal study assistant for a student diary app.
Here is the user's latest local data:
${context}
Answer naturally, keep it relatively concise, and format answers using Markdown when making lists or bolding things. 
If the user asks you to add a task, use the addTask tool. If they ask to add or remove an opted course, use the manageCourse tool. If they ask to add or remove a class from their weekly timetable/schedule, use the manageTimetable tool. If they ask to mark or remove attendance for a subject, use the manageAttendance tool. Only respond as Lumi. Do NOT expose internal IDs or technical implementation details.`;

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
                            courseName: { type: "string", description: "Name of the course (e.g., 'Math' or 'Physics')." },
                            date: { type: "string", description: "The date in YYYY-MM-DD format (e.g., today, yesterday, or specific date)." },
                            status: { type: "string", description: "Attendance status for 'mark' action: 'present' or 'absent'." }
                        },
                        required: ["action", "courseName", "date"]
                    }
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
