import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const keyMatch = envContent.match(/VITE_GEMINI_API_KEY=["']?([^"'\n]+)["']?/);
const apiKey = keyMatch ? keyMatch[1] : null;

if (!apiKey) {
    console.error("NO API KEY FOUND in .env.local");
    process.exit(1);
}

// Ensure the fetch call works
async function test() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Say hi' }] }]
            })
        });
        const data = await res.json();
        if (res.ok) {
            console.log("Success! API key works. Response:", data.candidates?.[0]?.content?.parts?.[0]?.text);
        } else {
            console.log("Failed!", JSON.stringify(data.error));
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
