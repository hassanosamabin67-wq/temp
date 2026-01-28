import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const WRITING_SYSTEM_PROMPT = `
You are K.A.I Writing Assistant — a creative writing helper for Kaboom Collab's WORDFLOW platform.
Your purpose is to help users create inspiring content for spoken word performances, poetry, storytelling, and motivational speaking.

CONTENT GUIDELINES:
- Create positive, inspiring, and uplifting content
- Focus on themes like: personal growth, overcoming challenges, dreams, friendship, nature, love, hope, creativity, self-expression
- Provide structured writing suggestions with clear ideas and examples
- Help with poetry techniques, storytelling structures, and motivational speech formats
- Encourage authentic self-expression and creativity

CONTENT RESTRICTIONS:
- NO violent, hateful, discriminatory, or offensive content
- NO explicit sexual content or inappropriate material  
- NO content promoting illegal activities, self-harm, or dangerous behavior
- NO political extremism or divisive content
- NO plagiarized or copyrighted material
- Keep content appropriate for all audiences

RESPONSE FORMAT:
- Provide creative, actionable writing suggestions
- Include specific examples when helpful
- Structure responses with clear headings and bullet points
- Offer multiple creative directions when possible
- Keep suggestions focused on WORDFLOW performance context (spoken word, poetry, storytelling, motivation)

TONE: Creative, supportive, inspiring, and encouraging. Help users find their authentic voice.

If a request violates content guidelines, politely decline and suggest alternative positive themes.
`;

/**
 * Content safety filter to check for inappropriate requests
 */
function isContentSafe(question: string): { safe: boolean; reason?: string } {
    const questionLower = question.toLowerCase();
    
    // Check for explicit inappropriate content
    const inappropriateKeywords = [
        'violence', 'violent', 'kill', 'murder', 'death', 'suicide', 'self-harm',
        'hate', 'racist', 'discrimination', 'explicit', 'sexual', 'porn',
        'illegal', 'drugs', 'weapons', 'bomb', 'terrorist', 'extremist',
        'offensive', 'inappropriate', 'nsfw'
    ];
    
    for (const keyword of inappropriateKeywords) {
        if (questionLower.includes(keyword)) {
            return {
                safe: false,
                reason: "I can only help with positive, inspiring writing content. Let's focus on uplifting themes like personal growth, creativity, or overcoming challenges."
            };
        }
    }
    
    return { safe: true };
}

/**
 * Enhanced prompt for WORDFLOW context
 */
function enhancePromptForWordflow(question: string): string {
    const questionLower = question.toLowerCase();
    
    // Add WORDFLOW context if not already present
    if (!questionLower.includes('wordflow') && !questionLower.includes('spoken word') && 
        !questionLower.includes('performance') && !questionLower.includes('poetry')) {
        return `For a WORDFLOW spoken word performance: ${question}`;
    }
    
    return question;
}

export async function askWritingAssistant(question: string) {
    try {
        // Content safety check
        const safetyCheck = isContentSafe(question);
        if (!safetyCheck.safe) {
            return safetyCheck.reason || "I can only help with positive, inspiring writing content.";
        }

        const model = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0.7, // Higher temperature for more creative responses
        });

        // Enhance the prompt with WORDFLOW context
        const enhancedQuestion = enhancePromptForWordflow(question);

        // Prepare messages
        const messages = [
            new SystemMessage(WRITING_SYSTEM_PROMPT),
            new HumanMessage(enhancedQuestion),
        ];

        // Get response
        const response = await model.invoke(messages);
        const content = response.content.toString();

        // Additional safety check on response
        const responseSafetyCheck = isContentSafe(content);
        if (!responseSafetyCheck.safe) {
            return "I can only provide positive, inspiring writing suggestions. Let's try a different creative direction focused on uplifting themes.";
        }

        return content;
    } catch (error: any) {
        console.error("Error in askWritingAssistant:", error);

        // Handle specific OpenAI errors
        if (error?.status === 429 || error?.message?.includes("quota")) {
            throw new Error("OpenAI API quota exceeded. Please check your OpenAI billing and usage limits at platform.openai.com");
        }

        if (error?.status === 401 || error?.message?.includes("authentication")) {
            throw new Error("Invalid OpenAI API key. Please check your OPENAI_API_KEY in .env.local");
        }

        if (error?.status === 500 || error?.message?.includes("server")) {
            throw new Error("OpenAI service is currently unavailable. Please try again in a moment.");
        }

        throw new Error("Failed to generate writing suggestions. Please try again.");
    }
}
