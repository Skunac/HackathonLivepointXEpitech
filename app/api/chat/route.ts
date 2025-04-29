import { NextRequest, NextResponse } from "next/server";
import { getOllamaResponse } from "@/lib/ollama";

export async function POST(req: NextRequest) {
    try {
        const { message } = await req.json();

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required and must be a string" },
                { status: 400 }
            );
        }

        const response = await getOllamaResponse(message);

        return NextResponse.json({ response });
    } catch (error) {
        console.error("Error in chat API route:", error);
        return NextResponse.json(
            { error: "Failed to process your request" },
            { status: 500 }
        );
    }
}