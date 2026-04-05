import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const toolDeclarations = [
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
];

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    try {
        const { context, messages, lastMessage } = req.body;

        if (!lastMessage) {
            return res.status(400).json({ error: "Missing lastMessage in request body." });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-lite",
            systemInstruction: `You are Lumi, a friendly, personal study assistant for a student diary app.
Here is the user's latest local data:
${context || "No context available."}
Answer naturally, keep it relatively concise, and format answers using Markdown when making lists or bolding things. 
If the user asks you to add a task, use the addTask tool. If they ask to add or remove an opted course, use the manageCourse tool. If they ask to add or remove a class from their weekly timetable/schedule, use the manageTimetable tool. Only respond as Lumi. Do NOT expose internal IDs or technical implementation details.`,
            tools: [{ functionDeclarations: toolDeclarations }]
        });

        // Filter history: must start with "user" role
        let history = messages || [];
        if (history.length > 0 && history[0].role === "model") {
            history = history.slice(1);
        }

        const geminiHistory = history.map(m => ({
            role: m.role,
            parts: [{ text: m.parts }]
        }));

        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessage(lastMessage);
        const functionCalls = result.response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            return res.status(200).json({
                type: "functionCall",
                name: call.name,
                args: call.args
            });
        }

        return res.status(200).json({
            type: "text",
            content: result.response.text()
        });

    } catch (e) {
        console.error("Serverless Lumi error:", e);
        return res.status(500).json({ error: "AI processing failed. " + (e.message || "") });
    }
}
