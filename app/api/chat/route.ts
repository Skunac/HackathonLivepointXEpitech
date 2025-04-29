import { NextRequest, NextResponse } from "next/server";
import { getOllamaResponse } from "@/lib/ollama";
import { checkPoliteness } from "@/lib/utils/politenessDetector";
import { getIntermediateResponse } from "@/lib/intermediateOllama";

// Define point penalties for different error types
const POINT_PENALTIES = {
    POLITENESS: -5,         // Penalty for sending just a greeting
    GOOGLEABLE: -10,        // Penalty for asking easily googleable questions
    DOCUMENTATION: -5,      // Penalty for questions that should use documentation
    NO_SUBSTANCE: -3,       // Penalty for low-effort messages
    INVALID_FORMAT: -2      // Penalty for sending invalid request format
};

export async function POST(req: NextRequest) {
    try {
        // Get points directly from cookies
        const pointsCookie = req.cookies.get("points");
        const currentPoints = pointsCookie ? parseInt(pointsCookie.value, 10) : 100;
        const pseudo = req.cookies.get("pseudo")?.value || "Unknown";

        let pointDelta = 0;
        let filterReason = null;
        let newPoints = currentPoints;
        let response: NextResponse;

        const { message } = await req.json();

        if (!message || typeof message !== "string") {
            // Invalid request format
            pointDelta = POINT_PENALTIES.INVALID_FORMAT;
            newPoints = Math.max(0, currentPoints + pointDelta);

            response = NextResponse.json(
                {
                    error: "Message is required and must be a string",
                    pointsUpdate: {
                        delta: pointDelta,
                        newTotal: newPoints,
                        reason: "Invalid request format costs points"
                    }
                },
                { status: 400 }
            );

            // Set the updated points cookie
            response.cookies.set("points", newPoints.toString(), {
                path: "/",
                maxAge: 60 * 60 * 24 * 7, // 1 week
            });

            console.log(`Request from ${pseudo} (${currentPoints} → ${newPoints} points) - invalid format`);
            return response;
        }

        // First check: Politeness check
        const { isOnlyPoliteness } = checkPoliteness(message);
        if (isOnlyPoliteness) {
            pointDelta = POINT_PENALTIES.POLITENESS;
            filterReason = "politeness";
            newPoints = Math.max(0, currentPoints + pointDelta);

            response = NextResponse.json(
                {
                    error: "Please ask a technical question",
                    pointsUpdate: {
                        delta: pointDelta,
                        newTotal: newPoints,
                        reason: "Sending only a greeting costs points"
                    }
                },
                { status: 400 }
            );

            // Set the updated points cookie
            response.cookies.set("points", newPoints.toString(), {
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            });

            console.log(`Request from ${pseudo} (${currentPoints} → ${newPoints} points) - politeness`);
            return response;
        }

        // Second check: Agent check for relevance/Google-ability/documentation
        const intermediateResponse = await getIntermediateResponse(message);

        // Only proceed with full response if we get "GOOD"
        if (intermediateResponse === "GOOD") {
            // If we've passed both checks, proceed with the full Ollama response
            const finalResponse = await getOllamaResponse(message);

            // Add logging to help debug responses
            console.log("Final response length:", finalResponse.length);
            console.log(`Request from ${pseudo} (${currentPoints} points) - Successful query`);

            return NextResponse.json({
                response: finalResponse,
                metadata: {
                    filtered: false,
                    processedLength: finalResponse.length,
                    points: currentPoints // Include current points in the response
                }
            });
        } else {
            // Determine the filter reason and point penalty
            if (intermediateResponse.startsWith("This could be easily")) {
                filterReason = "googleable";
                pointDelta = POINT_PENALTIES.GOOGLEABLE;
            } else if (intermediateResponse.startsWith("Please refer to")) {
                filterReason = "documentation";
                pointDelta = POINT_PENALTIES.DOCUMENTATION;
            } else {
                filterReason = "no_substance";
                pointDelta = POINT_PENALTIES.NO_SUBSTANCE;
            }

            // Calculate new points
            newPoints = Math.max(0, currentPoints + pointDelta);

            console.log(`Request from ${pseudo} (${currentPoints} → ${newPoints} points) - ${filterReason}`);

            // Create the response
            response = NextResponse.json(
                {
                    error: intermediateResponse,
                    pointsUpdate: {
                        delta: pointDelta,
                        newTotal: newPoints,
                        reason: getPointPenaltyReason(filterReason)
                    },
                    metadata: {
                        filtered: true,
                        filterReason: filterReason
                    }
                },
                { status: 400 }
            );

            // Set the updated points cookie
            response.cookies.set("points", newPoints.toString(), {
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            });

            return response;
        }
    } catch (error) {
        console.error("Error in chat API route:", error);
        return NextResponse.json(
            {
                error: "Failed to process your request",
                errorDetails: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

/**
 * Get a user-friendly explanation for the point penalty
 */
function getPointPenaltyReason(filterReason: string): string {
    switch (filterReason) {
        case "googleable":
            return "Asking easily googleable questions costs points";
        case "documentation":
            return "Questions that should use documentation cost points";
        case "no_substance":
            return "Low-effort messages cost points";
        case "politeness":
            return "Sending only greetings costs points";
        default:
            return "Invalid requests cost points";
    }
}