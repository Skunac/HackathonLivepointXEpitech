import { NextRequest, NextResponse } from "next/server";
import { getOllamaResponse } from "@/lib/ollama";
import {checkPoliteness} from "@/lib/utils/politenessDetector";
import {analyzeUserQuery} from "@/lib/utils/letmegooglethat";

export async function POST(req: NextRequest) {
    console.log("Request received");
    try {
        const { message } = await req.json();
        console.log("Message extracted:", message);

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "Message is required and must be a string" },
                { status: 400 }
            );
        }

        const { isOnlyPoliteness, containsPoliteness} = checkPoliteness(message);

        if ( isOnlyPoliteness ) {
            return NextResponse.json(
                { error: "Message is only polite expressions" },
                { status: 400 }
            );
        }

        if (containsPoliteness) {
            console.log("Message contains polite expressions");
        } else {
            console.log("Message does not contain polite expressions");
        }

        const {action, command, docSource, redirectUrl} = analyzeUserQuery(message);

        console.log("Action:", action);
        console.log("Command:", command);
        console.log("DocSource:", docSource);
        console.log("Redirect URL:", redirectUrl);


        console.log("About to call Ollama");
        const response = await getOllamaResponse(message);
        console.log("Ollama response received");

        return NextResponse.json({ response });
    } catch (error) {
        console.error("Error in chat API route:", error);
        return NextResponse.json(
            { error: "Failed to process your request" },
            { status: 500 }
        );
    }
}