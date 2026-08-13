import { GoogleGenAI } from '@google/genai';
import { classifyWithGroq } from './groq';

// Ensure VITE_GEMINI_API_KEY is defined in your .env file
// Top-level initialization removed to prevent crashes on load when missing.
/**
 * Helper to convert Base64 string to an object the Gemini API expects
 */
function base64ToPart(base64Data, mimeType) {
    const base64String = base64Data.split(',')[1] || base64Data;
    return {
        inlineData: {
            data: base64String,
            mimeType
        }
    };
}

/**
 * Analyzes an image of a civic issue to extract categorization and severity.
 * Securely calls Vercel backend /api/classify first to hide API keys.
 * 
 * @param {string} base64Image - The image data as a Base64 string.
 * @param {string} mimeType - The MIME type (e.g., "image/jpeg").
 * @param {string} userContext - Optional text description provided by the user.
 * @returns {Promise<Object>} An object containing classification data.
 */
export async function analyzeCivicIssue(base64Image, mimeType = 'image/jpeg', userContext = "") {
    try {
        // Try hitting the Vercel serverless backend to keep API keys completely hidden
        const response = await fetch('/api/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image, mimeType, userContext })
        });

        if (response.ok) {
            return await response.json();
        }

        // If 404, we are likely running 'npm run dev' locally using Vite which doesn't host /api/ natively.
        console.warn("Vercel backend /api/classify not found. Falling back to local execution.");
        return await fallbackLocalExecution(base64Image, mimeType, userContext);
    } catch (err) {
        console.warn('[Gemini] Backend fetch failed, falling back to local execution.', err);
        try {
            return await fallbackLocalExecution(base64Image, mimeType, userContext);
        } catch (localErr) {
            console.warn('[Gemini] Local execution failed, switching to Groq Llama fallback.', localErr);
            return await classifyWithGroq(base64Image, mimeType, userContext);
        }
    }
}

async function fallbackLocalExecution(base64Image, mimeType, userContext) {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
        console.warn("Gemini API key is missing entirely. Returning mock classification.");
        return {
            issueType: 'pothole',
            severity: 7,
            isRealIssue: true,
            confidence: 0.85,
            description: "Appears to be a moderate sized pothole on an asphalt road."
        };
    }

    try {
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
        const formattedContext = userContext ? `\nThe reporting citizen provided this context: "${userContext}"\nDO NOT blindly trust this text. Use it only as context if the image matches it.` : "";

        const prompt = `
      You are an expert civic infrastructure assessment AI and an aggressive anti-abuse moderator. 
      Analyze this image of a reported issue and return a JSON object with strictly these keys:
      - "isRealIssue": (boolean) MUST be true ONLY if this is a genuine, real-world outdoor photograph of a civic problem. Aggressively flag as false if this is a screenshot, meme, drawing, a screen capture of a monitor/phone, a selfie, an indoor photo, or completely irrelevant to civic infrastructure.
      - "issueType": (string) categorize it tightly into one of: 'pothole', 'garbage', 'waterlog', 'street_light', 'open_drain', 'other'.
      - "severity": (number, 1-10) score how severe the issue is. 1 = minor cosmetic, 10 = critical hazard to life or property.
      - "description": (string, max 2 sentences) a brief objective description of what is actually seen in the image. IMPORTANT: You must also analyze the user's provided text context below. If the user's text is abusive, spammy, political hate speech, or completely contradicts the image, set "isRealIssue" to false immediately.
      ${formattedContext}
      Output ONLY valid JSON without Markdown wrappers like \`\`\`json.
    `;

        const imagePart = base64ToPart(base64Image, mimeType);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [prompt, imagePart],
            config: {
                responseMimeType: 'application/json',
            }
        });

        try {
            const textResponse = response.text || '';
            const cleanJson = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (parseError) {
            console.error("Failed to parse Gemini response as JSON:", response.text);
            throw new Error("Invalid response format from AI");
        }
    } catch (error) {
        console.error("Error analyzing image locally:", error);
        throw error;
    }
}
