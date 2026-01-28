import { NextResponse } from "next/server";
import { askWritingAssistant } from "@/lib/kai/writing-assistant";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { question } = body;

        // Validate input
        if (!question || typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json(
                { error: "Please enter a valid writing request." },
                { status: 400 }
            );
        }

        // Check question length (prevent abuse)
        if (question.length > 1000) {
            return NextResponse.json(
                { error: "Writing request is too long. Please keep it under 1000 characters." },
                { status: 400 }
            );
        }

        // Additional content validation
        const questionLower = question.trim().toLowerCase();
        
        // Block obviously inappropriate requests
        const blockedPatterns = [
            /how to (harm|hurt|kill)/,
            /write about (violence|death|suicide)/,
            /create (hateful|offensive|explicit)/,
            /generate (inappropriate|nsfw|adult)/
        ];

        for (const pattern of blockedPatterns) {
            if (pattern.test(questionLower)) {
                return NextResponse.json(
                    { 
                        error: "I can only help with positive, inspiring writing content. Let's focus on uplifting themes like personal growth, creativity, or overcoming challenges.",
                        success: false 
                    },
                    { status: 400 }
                );
            }
        }

        const answer = await askWritingAssistant(question.trim());
        
        return NextResponse.json({ 
            answer,
            success: true 
        });
    } catch (error: any) {
        console.error("KAI Writing API Error:", error);
        
        let errorMessage = "Sorry, I couldn't generate writing suggestions right now. Please try again.";
        let statusCode = 500;
        
        if (error instanceof Error) {
            errorMessage = error.message;
            
            // Set appropriate status codes for different error types
            if (errorMessage.includes("quota exceeded")) {
                statusCode = 429;
            } else if (errorMessage.includes("Invalid OpenAI API key")) {
                statusCode = 401;
            }
        }
        
        return NextResponse.json(
            { 
                error: errorMessage,
                success: false 
            },
            { status: statusCode }
        );
    }
}
