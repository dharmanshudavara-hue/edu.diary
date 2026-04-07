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
    }
];

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.GROQ_API_KEY; 
    if (!apiKey) {
        return res.status(500).json({ error: "Groq API key is not configured on the server. Please set GROQ_API_KEY in Vercel settings." });
    }

    try {
        const { context, messages, lastMessage } = req.body;

        if (!lastMessage) {
            return res.status(400).json({ error: "Missing lastMessage in request body." });
        }

        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: "https://api.groq.com/openai/v1"
        });

        const systemMessage = `You are Lumi, a friendly, personal study assistant for a student diary app.
Here is the user's latest local data:
${context || "No context available."}
Answer naturally, keep it relatively concise, and format answers using Markdown when making lists or bolding things. 
If the user asks you to add a task, use the addTask tool. If they ask to add or remove an opted course, use the manageCourse tool. If they ask to add or remove a class from their weekly timetable/schedule, use the manageTimetable tool. If they ask to mark or remove attendance for a subject, use the manageAttendance tool. Only respond as Lumi. Do NOT expose internal IDs or technical implementation details.`;

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
            tools: tools
        });

        const message = result.choices[0].message;

        if (message.tool_calls && message.tool_calls.length > 0) {
            const toolCall = message.tool_calls[0];
            return res.status(200).json({
                type: "functionCall",
                name: toolCall.function.name,
                args: JSON.parse(toolCall.function.arguments)
            });
        }

        return res.status(200).json({
            type: "text",
            content: message.content || "I processed your request but couldn't generate a response."
        });

    } catch (e) {
        console.error("Serverless Lumi error:", e);
        return res.status(500).json({ error: e.message || "AI processing failed." });
    }
}
