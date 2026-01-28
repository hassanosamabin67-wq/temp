import { NextResponse } from "next/server";
import { askKAI } from "@/lib/kai/assistant";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { question } = body;

        // Validate input
        if (!question || typeof question !== "string" || question.trim().length === 0) {
            return NextResponse.json(
                { error: "Please enter a valid question." },
                { status: 400 }
            );
        }

        // Check question length (prevent abuse)
        if (question.length > 500) {
            return NextResponse.json(
                { error: "Question is too long. Please keep it under 500 characters." },
                { status: 400 }
            );
        }

        const answer = await askKAI(question.trim());
        
        return NextResponse.json({ 
            answer,
            success: true 
        });
    } catch (error: any) {
        console.error("KAI API Error:", error);
        
        let errorMessage = "Sorry, something went wrong. Please try again.";
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