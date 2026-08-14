import { GoogleGenerativeAI } from "@google/generative-ai";

export async function parseTimetableFile(file, apiKey) {
    if (!apiKey) {
        throw new Error("Gemini API key is missing. Please set VITE_GEMINI_API_KEY in .env.local");
    }

    // Convert file to base64
    const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const mimeType = file.type;

    const promptText = `
    You are an expert AI parser. Analyze this timetable document (image or PDF).
    Extract all unique courses (subjects) and their weekly schedule slots.
    
    IMPORTANT RULES:
    1. Output strictly valid JSON matching the schema below.
    2. Do NOT wrap the JSON in markdown code blocks like \`\`\`json. Output raw JSON only.
    3. Time must be in 24-hour format (e.g., "09:00", "14:30").
    4. Days must be lowercase: monday, tuesday, wednesday, thursday, friday, saturday, sunday.
    5. Generate a unique ID (e.g., "c1", "c2") for each course, and use it in the timetable slots.
    
    JSON SCHEMA TO FOLLOW:
    {
      "courses": [
        { "id": "c1", "name": "Mathematics", "code": "MATH101" }
      ],
      "timetable": {
        "monday": [{ "courseId": "c1", "time": "09:00" }],
        "tuesday": [],
        "wednesday": [],
        "thursday": [],
        "friday": [],
        "saturday": [],
        "sunday": []
      }
    }
    `;

    const modelsToTry = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-flash-latest"];
    let lastError = null;
    
    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTry) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: "application/json"
                    }
                });

                const result = await model.generateContent([
                    promptText,
                    {
                        inlineData: {
                            data: base64Data,
                            mimeType
                        }
                    }
                ]);

                let textResponse = result.response.text();
                textResponse = textResponse.replace(/^```json/m, '').replace(/^```/m, '').trim();
                
                return JSON.parse(textResponse);
            } catch (error) {
                console.warn(`Attempt ${attempt} with ${modelName} failed:`, error.message);
                lastError = error;
                
                // If it's a 503, wait before retrying the same model
                if (error.message && error.message.includes("503")) {
                    await new Promise(res => setTimeout(res, 1500 * attempt));
                    continue; // retry
                } else {
                    break; // break inner loop, try next model
                }
            }
        }
    }

    console.error("All AI models/attempts failed:", lastError);
    throw new Error(lastError?.message || "AI server is currently too busy. Please try again in a few moments.");
}
