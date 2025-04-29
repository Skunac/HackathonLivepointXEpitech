import { NextRequest, NextResponse } from "next/server";
import { getOllamaResponse } from "@/lib/ollama";
import { checkPoliteness } from "@/lib/utils/politenessDetector";
import { getIntermediateResponse } from "@/lib/intermediateOllama";
import {analyzeUserQuery} from "@/lib/utils/letmegooglethat";

// Define point penalties for different error types
const POINT_PENALTIES = {
    POLITENESS: -5,         // Penalty for sending just a greeting
    GOOGLEABLE: -10,        // Penalty for asking easily googleable questions
    DOCUMENTATION: -5,      // Penalty for questions that should use documentation
    MANPAGE: -5,            // Penalty for man page requests
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
                    error: "Don't bother with politeness, it's wasting a lot of ressources so please be direct",
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

        // New approach: Use analyzeUserQuery for advanced classification
        const analysisResult = analyzeUserQuery(message);

        // Log the analysis result
        console.log(`Query analysis for "${message.substring(0, 50)}...": ${analysisResult.action}`);

        // Based on the analysis, determine how to handle the request
        switch (analysisResult.action) {
            case 'google':
                // Handle googleable questions
                filterReason = "googleable";
                pointDelta = POINT_PENALTIES.GOOGLEABLE;
                newPoints = Math.max(0, currentPoints + pointDelta);

                response = NextResponse.json(
                    {
                        error: `This could be easily answered with a Google search: ${analysisResult.redirectUrl}`,
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
                break;

            case 'docs':
                // Handle documentation requests
                filterReason = "documentation";
                pointDelta = POINT_PENALTIES.DOCUMENTATION;
                newPoints = Math.max(0, currentPoints + pointDelta);

                response = NextResponse.json(
                    {
                        error: `Please refer to the official ${analysisResult.docSource} documentation: ${analysisResult.redirectUrl}`,
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
                break;

            case 'manpage':
                // Handle man page requests
                filterReason = "manpage";
                pointDelta = POINT_PENALTIES.MANPAGE;
                newPoints = Math.max(0, currentPoints + pointDelta);

                response = NextResponse.json(
                    {
                        error: `Please refer to the manual page for '${analysisResult.command}'. You can view it by typing 'man ${analysisResult.command}' in your terminal or visit: ${analysisResult.redirectUrl}`,
                        pointsUpdate: {
                            delta: pointDelta,
                            newTotal: newPoints,
                            reason: "Simple command requests cost points"
                        },
                        metadata: {
                            filtered: true,
                            filterReason: filterReason
                        }
                    },
                    { status: 400 }
                );
                break;

            case 'answer':
                // This is a valid technical question - proceed with Ollama
                // Double-check with the intermediate model as a fallback
                const intermediateResponse = await getIntermediateResponse(message);

                if (intermediateResponse === "GOOD") {
                    // If both analyzers agree it's a good question, process it
                    const finalResponse = await getOllamaResponse(message);

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
                    // The intermediate model disagrees - use its categorization
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

                    newPoints = Math.max(0, currentPoints + pointDelta);

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
                }
                break;
        }

        // For anything other than 'answer' that proceeds directly, set the cookie and return
        if (response) {
            // Set the updated points cookie
            response.cookies.set("points", newPoints.toString(), {
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            });

            console.log(`Request from ${pseudo} (${currentPoints} → ${newPoints} points) - ${filterReason}`);
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
        case "manpage":
            return "Simple command requests cost points";
        case "no_substance":
            return "Low-effort messages cost points";
        case "politeness":
            return "Sending only greetings costs points";
        default:
            return "Invalid requests cost points";
    }
}