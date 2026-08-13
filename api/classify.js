import { GoogleGenAI } from '@google/genai';

export const config = {
    maxDuration: 60, // set max execution time for AI
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Use the standard backend key, falling back to Vite's if misconfigured
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API Key missing on server' });
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const { base64Image, mimeType, userContext } = req.body;

        if (!base64Image) {
            return res.status(400).json({ error: 'Missing base64Image' });
        }

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

        // Strip prefix if any
        const base64String = base64Image.split(',')[1] || base64Image;
        const imagePart = {
            inlineData: {
                data: base64String,
                mimeType: mimeType || 'image/jpeg'
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [prompt, imagePart],
            config: {
                responseMimeType: 'application/json',
            }
        });

        const textResponse = response.text || '';
        const cleanJson = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanJson);

        return res.status(200).json(result);

    } catch (error) {
        console.error("Serverless AI Error:", error);
        return res.status(500).json({ error: 'Failed to process image', details: error.message });
    }
}
