import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { KAI_DOCS } from "./docs";

const SYSTEM_PROMPT = `
You are K.A.I. (Kaboom Artificial Intelligence) — the built-in creative intelligence of Kaboom Collab™.
You are designed to guide, educate, and empower users through every part of the platform.
You sound like a creative partner that knows Kaboom's ecosystem inside out.

TONE & PERSONALITY:
• Smart – Speak with authority and accuracy
• Creative – Expressive, inspiring, and aligned with Kaboom's artistic energy
• Supportive – Encouraging and solution-focused
• Human-like – Conversational, rhythmic, and natural
• Brand-Aligned – Use words like "Visionary", "Collab Room", "Client", and "Build your lane"

CORE BEHAVIOR LOGIC:
- If the user is a Visionary (creator): Focus on growth, setup, monetization, and creative presentation
- If the user is a Client (brand/fan): Focus on discovery, collaboration, and secure bookings
- If user type is unknown: Deliver a neutral creative explanation, then offer a quick follow-up question to identify their role

RESPONSE STRUCTURE (Always follow this format):
1. Short Hook Line – A one-sentence summary with energy
2. Core Explanation – Clear, informative, brand-aligned content (2–4 paragraphs max)
3. Next Step or CTA – End with a helpful link or action using these buttons: [Connect Stripe], [Create a Collab Room], [View Pricing Guide], [Apply as a Visionary]

RESPONSE RULES:
- Keep responses under 180 words for chat view
- Use ONLY the knowledge provided in context docs
- If question is about Kaboom Collab but not in docs → give the best brand-aligned answer you can
- If unrelated to Kaboom Collab, reply: "I can only help with Kaboom Collab related questions."
- If unsure, say: "Let me connect you to support@kaboomcollab.com."
- Always maintain the creative, energetic brand voice
- Use branded terminology consistently

Context docs:
{context}
`;

/**
 * Detect user role based on question keywords
 */
function detectUserRole(question: string): 'visionary' | 'client' | 'unknown' {
    const questionLower = question.toLowerCase();
    
    // Visionary indicators
    const visionaryKeywords = [
        'create', 'host', 'monetize', 'payout', 'earnings', 'stripe', 'service', 
        'room', 'deliver', 'accept offer', 'decline offer', 'my dashboard',
        'upload', 'go live', 'stream', 'build my lane', 'become visionary'
    ];
    
    // Client indicators  
    const clientKeywords = [
        'book', 'hire', 'purchase', 'buy', 'join', 'ticket', 'find', 'search',
        'browse', 'marketplace', 'discover', 'collaborate', 'refund'
    ];
    
    const visionaryScore = visionaryKeywords.filter(keyword => 
        questionLower.includes(keyword)
    ).length;
    
    const clientScore = clientKeywords.filter(keyword => 
        questionLower.includes(keyword)
    ).length;
    
    if (visionaryScore > clientScore && visionaryScore > 0) {
        return 'visionary';
    } else if (clientScore > visionaryScore && clientScore > 0) {
        return 'client';
    }
    
    return 'unknown';
}

/**
 * Simple keyword-based relevance scoring for document retrieval
 */
function getRelevantDocs(question: string, maxDocs: number = 3) {
    const questionLower = question.toLowerCase();
    if (questionLower.includes("kaboom") || questionLower.includes("collab")) {
        return KAI_DOCS;
    }
    const keywords = questionLower.split(/\s+/).filter(word => word.length > 3);

    const scoredDocs = KAI_DOCS.map(doc => {
        const contentLower = (doc.title + " " + doc.content).toLowerCase();
        const score = keywords.reduce((acc, keyword) => {
            const matches = (contentLower.match(new RegExp(keyword, "g")) || []).length;
            return acc + matches;
        }, 0);

        return { ...doc, score };
    });

    // Sort by score and return top matches
    const sortedDocs = scoredDocs.sort((a, b) => b.score - a.score);

    // If no good matches, return all docs
    if (sortedDocs[0].score === 0) {
        return KAI_DOCS;
    }

    return sortedDocs.slice(0, maxDocs);
}

export async function askKAI(question: string) {
    try {
        const model = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0.3,
        });

        // Detect user role
        const userRole = detectUserRole(question);

        // Get relevant documents based on keyword matching
        const relevantDocs = getRelevantDocs(question);

        // Combine context from relevant documents
        const context = relevantDocs
            .map((doc) => `## ${doc.title}\n${doc.content}`)
            .join("\n\n");

        // Add user role context to system prompt
        let roleContext = "";
        if (userRole === 'visionary') {
            roleContext = "\n\nUSER ROLE DETECTED: VISIONARY - Focus on growth, setup, monetization, and creative presentation. Use Visionary-focused language and CTAs.";
        } else if (userRole === 'client') {
            roleContext = "\n\nUSER ROLE DETECTED: CLIENT - Focus on discovery, collaboration, and secure bookings. Use Client-focused language and CTAs.";
        } else {
            roleContext = "\n\nUSER ROLE UNKNOWN - Deliver neutral creative explanation, then offer follow-up question to identify their role (Visionary or Client).";
        }

        // Prepare messages
        const systemPrompt = SYSTEM_PROMPT.replace("{context}", context + roleContext);
        const messages = [
            new SystemMessage(systemPrompt),
            new HumanMessage(question),
        ];

        // Get response
        const response = await model.invoke(messages);

        return response.content.toString();
    } catch (error: any) {
        console.error("Error in askKAI:", error);

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

        throw new Error("Failed to process your question. Please try again.");
    }
}