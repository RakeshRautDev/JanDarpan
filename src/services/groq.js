/**
 * Groq AI Fallback Service
 * Uses Llama-3 via Groq API as a fallback when Gemini AI fails.
 * Groq processes images via URL. We send the Cloudinary URL after upload,
 * or describe the scenario in text if the image is base64 only.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Classify a civic issue image using Groq Llama-3.2-Vision as fallback
 */
export async function classifyWithGroq(base64Image, mimeType = 'image/jpeg', userContext = '') {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        console.warn('[Groq Fallback] No VITE_GROQ_API_KEY found. Returning mock result.');
        return {
            issueType: 'pothole',
            severity: 6,
            isRealIssue: true,
            confidence: 0.75,
            description: '[Groq Fallback Mock] Appears to be a civic infrastructure issue.',
            source: 'groq_mock'
        };
    }

    const contextNote = userContext
        ? `\nThe citizen provided this description: "${userContext}". Cross-check it with the image.`
        : '';

    const prompt = `You are a civic infrastructure AI moderator analyzing a reported issue image.
Return ONLY a JSON object with these exact keys:
- "isRealIssue": (boolean) true only if this is a real outdoor photo of a civic problem
- "issueType": one of: 'pothole', 'garbage', 'waterlog', 'street_light', 'open_drain', 'other'
- "severity": (number 1-10) how dangerous or urgent
- "description": (string, max 2 sentences) what you see
- "confidence": (number 0-1) your confidence
${contextNote}

Do NOT wrap your answer in markdown. Return raw JSON only.`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.2-11b-vision-preview',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: base64Image.startsWith('data:')
                                        ? base64Image
                                        : `data:${mimeType};base64,${base64Image}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 512,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Groq API error: ${response.status} ${err}`);
        }

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content || '';
        const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
        const result = JSON.parse(clean);

        return { ...result, source: 'groq' };
    } catch (error) {
        console.error('[Groq Fallback] Error:', error);
        throw error;
    }
}
