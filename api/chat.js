
import OpenAI from "openai";

const tools = [
    {
        type: "function",
        function: {
            name: "addTask",
            description: "Adds a new task or reminder to the user's schedule.",
            parameters: {
                type: "object",
                properties: {
                    title: { type: "string", description: "The task title (e.g., 'Study Math')" },
                    date: { type: "string", description: "The target date in YYYY-MM-DD format based on what the user said (e.g. today, tomorrow, specific date)." }
                },
                required: ["title", "date"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "manageCourse",
            description: "Adds or removes an opted course from the user's list. Use this when the user says 'add physics to my opted courses' or 'remove math'.",
            parameters: {
                type: "object",
                properties: {
                    action: { type: "string", description: "'add' or 'remove'" },
                    courseName: { type: "string", description: "The name of the course to add or remove" }
                },
                required: ["action", "courseName"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "manageTimetable",
            description: "Adds or removes a class from the user's weekly timetable.",
            parameters: {
                type: "object",
                properties: {
                    action: { type: "string", description: "'add' or 'remove'" },
                    courseName: { type: "string", description: "Name of the course (e.g., 'JEE' or 'Physics'). It will be auto-created if it doesn't exist." },
                    day: { type: "string", description: "Day of the week (e.g., 'monday', 'tuesday'). Must be lowercase." },
                    time: { type: "string", description: "Starting time of the class in 24-hour format HH:MM (e.g., '14:00' for 2:00pm)." }
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
    },
    {
        type: "function",
        function: {
            name: "getMotivation",
            description: "Returns an inspiring motivational quote. Use when the user feels stressed, tired, demotivated, or asks for encouragement, motivation, or a pep talk.",
            parameters: {
                type: "object",
                properties: {
                    mood: { type: "string", description: "The user's mood: 'stressed', 'tired', 'unmotivated', or 'general'. Default 'general'." }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "generateStudyPlan",
            description: "Generates a personalized study plan based on the user's upcoming tasks, timetable, attendance, and workload. Use when the user asks for a study plan, schedule suggestion, or how to organize their study time.",
            parameters: {
                type: "object",
                properties: {
                    days: { type: "number", description: "Number of days to plan for (default 7, max 14)." },
                    focusArea: { type: "string", description: "Optional specific subject to focus on." }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getInsights",
            description: "Provides detailed analytics and insights about the user's academic performance, attendance trends, task completion, and a health score. Use when the user asks how they're doing, wants analysis, insights, a summary, or performance review.",
            parameters: {
                type: "object",
                properties: {
                    type: { type: "string", description: "'attendance', 'tasks', 'overview', or 'all'. Default 'all'." }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "manageTask",
            description: "Manages existing tasks: mark as complete/done, delete, or edit. Use when the user wants to finish, remove, or change an existing task.",
            parameters: {
                type: "object",
                properties: {
                    action: { type: "string", description: "'complete', 'delete', or 'edit'" },
                    taskTitle: { type: "string", description: "Title or partial title of the task to manage" },
                    newTitle: { type: "string", description: "New title (only for 'edit' action)" },
                    newDate: { type: "string", description: "New date in YYYY-MM-DD (only for 'edit' action)" }
                },
                required: ["action", "taskTitle"]
            }
        }
    }
];
const PERSONALITY_PROMPTS = {
    buddy: "You're encouraging, empathetic, and playful. Use emojis freely (but not excessively). Celebrate achievements warmly. If the user seems stressed, be supportive first before giving advice. Keep a friendly, warm tone like a close study partner.",
    coach: "You're a strict but caring academic coach. Be direct and hold the user accountable. Minimize emojis (use sparingly). Push them to do better. Don't sugarcoat poor performance. Use motivational but firm language.",
    minimal: "Be concise and factual. Minimal to no emojis. Give information efficiently without fluff or filler. Short sentences. Get straight to the point. Only elaborate when specifically asked.",
    genz: "You speak casual Gen-Z. Use slang like 'no cap', 'lowkey', 'slay', 'fr fr', 'bet', 'bruh'. Be very playful, use lots of emojis and internet humor. Keep it real and relatable. Hype up achievements with energy."
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.GROQ_API_KEY; 
    if (!apiKey) {
        return res.status(500).json({ error: "Groq API key is not configured on the server. Please set GROQ_API_KEY in Vercel settings." });
    }

    try {
        const { context, messages, lastMessage, prefs = {}, memory = {} } = req.body;

        if (!lastMessage) {
            return res.status(400).json({ error: "Missing lastMessage in request body." });
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1"
        });

        const personalityKey = prefs.personality || "buddy";
        const personality = PERSONALITY_PROMPTS[personalityKey] || PERSONALITY_PROMPTS.buddy;
        
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

        const systemMessage = `You are Lumi ✨, a personal study assistant for a student diary app.

PERSONALITY: ${personality}
${greetingHint ? `\nGREETING STYLE: ${greetingHint}` : ''}
${prefs.studyGoal ? `\nUSER'S STUDY GOAL: "${prefs.studyGoal}" — Keep this in mind and reference it when relevant.` : ''}

CAPABILITIES (use the right tool for each):
- addTask: Add new tasks/reminders
- manageCourse: Add/remove opted courses
- manageTimetable: Add/remove timetable classes
- manageAttendance: Mark/remove attendance
- getMotivation: Get motivational quotes (when user is stressed/tired/demotivated)
- generateStudyPlan: Create personalized study plans from their data
- getInsights: Provide detailed academic analytics and performance insights
- manageTask: Complete, delete, or edit existing tasks

NATIVE ABILITIES (respond directly, no tool needed):
- Explain academic concepts, definitions, and terms
- Translate text to other languages
- Answer general knowledge and study questions
- Give study tips and learning strategies

Here is the user's latest local data:
${context || "No context available."}

RULES:
- Answer naturally, keep it concise, use Markdown for formatting
- Use the appropriate tool when the request matches a tool's purpose
- For explanations, definitions, translations: respond directly without tools
- Do NOT expose internal IDs or technical details
- Be proactive: suggest relevant follow-up actions
- Only respond as Lumi${prefs.attendanceGoal !== 75 ? `\nIMPORTANT: The user has set a personal attendance goal of ${prefs.attendanceGoal}% (university minimum is 75%). When discussing attendance, reference THEIR goal of ${prefs.attendanceGoal}%, not just the 75% minimum.` : ''}`;

        // Filter history: must start with "user" role
        let rawHistory = messages || [];
        if (rawHistory.length > 0 && rawHistory[0].role === "model") {
            rawHistory = rawHistory.slice(1);
        }

        const openAiHistory = rawHistory.map(m => ({
            role: m.role === "model" ? "assistant" : "user",
            content: m.parts || m.content || ""
        }));

        openAiHistory.push({ role: "user", content: lastMessage });

        const result = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile", 
            messages: [
                { role: "system", content: systemMessage },
                ...openAiHistory
            ],
            tools: tools,
            stream: true
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        let isFunctionCall = false;
        let functionName = "";
        let functionArgs = "";

        for await (const chunk of result) {
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;
            
            if (delta.tool_calls) {
                isFunctionCall = true;
                const tc = delta.tool_calls[0];
                if (tc.function?.name) functionName += tc.function.name;
                if (tc.function?.arguments) functionArgs += tc.function.arguments;
            } else if (delta.content) {
                res.write(`data: ${JSON.stringify({ type: 'text', content: delta.content })}\n\n`);
            }
        }

        if (isFunctionCall) {
            res.write(`data: ${JSON.stringify({ type: 'functionCall', name: functionName, args: JSON.parse(functionArgs || '{}') })}\n\n`);
        }
        
        res.end();

    } catch (e) {
        console.error("Serverless Lumi error:", e);
        return res.status(500).json({ error: e.message || "AI processing failed." });
    }
}
