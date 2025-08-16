import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";

dotenv.config();

const app = express();

// ---------------------- MIDDLEWARE ----------------------
// Fix the syntax error here: add a closing parenthesis `)`
app.use(cors({
origin: "http://127.0.0.1:8080"
})); // <-- The missing parenthesis was here
app.use(express.json());

// ---------------------- AI CLIENT ----------------------
const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// ---------------------- ROUTE ----------------------
app.post("/generate-quiz", async (req, res) => {
    const { topic, difficulty } = req.body || {};

    if (!topic || !difficulty) {
        return res.status(400).json({ error: "Missing topic or difficulty in request body" });
    }

    try {
        const prompt = `Generate 5 multiple-choice questions on the topic "${topic}" with difficulty "${difficulty}".
Return ONLY a JSON array (no markdown, no code blocks, no explanations). Each item must be a JSON object with the following keys:
{
"question": "...",
"options": ["...", "...", "...", "..."],
"answer": "..."
}
`;

        const response = await client.chat.completions.create({
            model: "llama3-8b-8192",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 1500,
        });

        const rawText = response.choices[0].message.content.trim();

        // New, more robust JSON parsing logic
        let quizData;
        try {
            // Attempt to parse the response directly
            quizData = JSON.parse(rawText);
        } catch (initialParseError) {
            // If the first parse fails, try to clean the text
            const cleanText = rawText
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
            try {
                // Try parsing the cleaned text
                quizData = JSON.parse(cleanText);
            } catch (finalParseError) {
                // If all parsing attempts fail, log the error and return a detailed response
                console.error("❌ Failed to parse AI response.");
                console.error("Raw text from AI:", rawText);
                console.error("Initial parse error:", initialParseError.message);
                console.error("Final parse error:", finalParseError.message);
                return res.status(500).json({
                    error: "Invalid AI response. Could not parse JSON.",
                    raw: rawText,
                });
            }
        }

        // Validate the structure of the parsed data
        if (!Array.isArray(quizData) || quizData.length === 0) {
            console.error("❌ AI response is not a valid JSON array or is empty.");
            return res.status(500).json({ error: "Invalid AI response: Expected a non-empty array." });
        }

        // Convert to frontend format (index of correct option)
        const formattedQuiz = quizData.map(q => ({
            question: q.question,
            options: q.options,
            correct: q.options ? q.options.indexOf(q.answer) : -1
        }));

        res.json(formattedQuiz);

    } catch (err) {
        console.error("❌ Groq Error:", err);
        res.status(500).json({ error: "Failed to generate quiz", details: err.message });
    }
});

// ---------------------- START SERVER ----------------------
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));