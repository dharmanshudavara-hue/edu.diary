import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { getCourses, saveCourses, getTodayClasses, getEvents, saveEvents, todayStr, getTimetable, saveTimetable } from "./storage";
import { calculateAllAttendance, calculateOverallAttendance, predictSkippable, predictRequired } from "./attendance";

/**
 * Handles sending a message to Lumi, now powered by Gemini 1.5 Flash.
 */
export async function sendChatMessage(messageHistory) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return "System error: Gemini API key is missing in environment variables. Set VITE_GEMINI_API_KEY.";
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Gather all local data context
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

    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are Lumi, a friendly, personal study assistant for a student diary app.
Here is the user's latest local data:
${context}
Answer naturally, keep it relatively concise, and format answers using Markdown when making lists or bolding things. 
If the user asks you to add a task, use the addTask tool. If they ask to add or remove an opted course, use the manageCourse tool. If they ask to add or remove a class from their weekly timetable/schedule, use the manageTimetable tool. Only respond as Lumi. Do NOT expose internal IDs or technical implementation details.`,
        tools: [{
            functionDeclarations: [
                {
                    name: "addTask",
                    description: "Adds a new task or reminder to the user's schedule.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            title: { type: SchemaType.STRING, description: "The task title (e.g., 'Study Math')" },
                            date: { type: SchemaType.STRING, description: "The target date in YYYY-MM-DD format based on what the user said (e.g. today, tomorrow, specific date)." }
                        },
                        required: ["title", "date"]
                    }
                },
                {
                    name: "manageCourse",
                    description: "Adds or removes an opted course from the user's list. Use this when the user says 'add physics to my opted courses' or 'remove math'.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            action: { type: SchemaType.STRING, description: "'add' or 'remove'" },
                            courseName: { type: SchemaType.STRING, description: "The name of the course to add or remove" }
                        },
                        required: ["action", "courseName"]
                    }
                },
                {
                    name: "manageTimetable",
                    description: "Adds or removes a class from the user's weekly timetable.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            action: { type: SchemaType.STRING, description: "'add' or 'remove'" },
                            courseName: { type: SchemaType.STRING, description: "Name of the course (e.g., 'JEE' or 'Physics'). It will be auto-created if it doesn't exist." },
                            day: { type: SchemaType.STRING, description: "Day of the week (e.g., 'monday', 'tuesday'). Must be lowercase." },
                            time: { type: SchemaType.STRING, description: "Starting time of the class in 24-hour format HH:MM (e.g., '14:00' for 2:00pm)." }
                        },
                        required: ["action", "courseName", "day", "time"]
                    }
                }
            ]
        }]
    });

    try {
        // Prepare history for Gemini
        // Ensure role is exactly "user" or "model" and starts with 'user'
        let rawHistory = messageHistory.slice(0, -1);
        if (rawHistory.length > 0 && rawHistory[0].role === "model") {
            rawHistory = rawHistory.slice(1);
        }

        const geminiHistory = rawHistory.map(m => ({
            role: m.role,
            parts: [{ text: m.parts }]
        }));
        
        const lastMessage = messageHistory[messageHistory.length - 1].parts;

        const chat = model.startChat({
            history: geminiHistory,
        });

        const result = await chat.sendMessage(lastMessage);
        const functionCalls = result.response.functionCalls();
        
        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            if (call.name === "addTask") {
                const { title, date } = call.args;
                
                // Execute the logic to add the task
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
            } else if (call.name === "manageCourse") {
                const { action, courseName } = call.args;
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
            } else if (call.name === "manageTimetable") {
                let { action, courseName, day, time } = call.args;
                
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
        }

        return result.response.text();
    } catch (e) {
        console.error("Lumi AI error: ", e);
        return "Oops! I encountered an error connecting to my AI brain. Please try again later.";
    }
}
