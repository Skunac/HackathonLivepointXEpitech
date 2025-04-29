import { NextRequest, NextResponse } from "next/server";
import { getOllamaResponse } from "@/lib/ollama";
import {checkPoliteness} from "@/lib/utils/politenessDetector";
import {analyzeUserQuery} from "@/lib/utils/letmegooglethat";

export async function POST(req: NextRequest) {
    console.log("Request received");
    try {
        const { message } = await req.json();
        console.log("Message extracted:", message);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is empty" },
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

    // Check if it's a simple greeting or politeness using the updated function
    const politenessCheck = checkPoliteness(userMessage);
    if (politenessCheck.isOnlyPoliteness) {
      return NextResponse.json({
        role: "assistant",
        content: "No need for polite formulas, on the contrary, you're making me use precious energy for nothing",
        metadata: { isGreetingResponse: true }
      });
    }

    // Check if it's a bash command
    if (isBashCommand(userMessage)) {
      const manPage = await getManPage(userMessage);
      return NextResponse.json({
        role: "assistant",
        content: manPage,
        metadata: { isManPage: true }
      });
    }

    // Check if it's a repeated question
    if (isRepeatedQuestion(messages)) {
      return NextResponse.json({
        role: "assistant",
        content: "I've already answered this question. Please scroll up to find my previous response.",
        metadata: { isRepetitionWarning: true }
      });
    }

    // Check if it's not a technical question
    if (!isTechnicalQuestion(userMessage)) {
      return NextResponse.json({
        role: "assistant",
        content: "I only answer technical questions related to computer science.",
        metadata: { isNonTechnicalResponse: true }
      });
    }

    // Check if it's a very simple query
    const simplicityCheck = isSimpleQuery(userMessage);
    if (simplicityCheck.isSimple) {
      const searchUrl = generateSearchUrl(userMessage, simplicityCheck.verySimple);
      return NextResponse.json({
        role: "assistant",
        content: simplicityCheck.verySimple
          ? "This is a very basic question that can be easily found online."
          : "This question can be better answered by a quick web search.",
        metadata: {
          isRedirection: true,
          redirections: [{
            type: simplicityCheck.verySimple ? "letmegooglothat" : "google",
            url: searchUrl,
            message: "Try searching here:"
          }]
        }
      });
    }

    // Send to LLM model with standardized formatting
    const formattedPrompt = await basePromptTemplate.format({
      input: userMessage
    });

    const response = await model.invoke(formattedPrompt);

    // Parse the response according to our standard format
    try {
      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      const parsedResponse = await responseParser.parse(content);

      return NextResponse.json({
        role: "assistant",
        content: parsedResponse.content,
        metadata: {
          confidence: parsedResponse.confidence,
          ...parsedResponse.redirections && parsedResponse.redirections.length > 0
            ? { isRedirection: true, redirections: parsedResponse.redirections }
            : {}
        }
      });
    } catch (parseError) {
      console.error("Failed to parse model response:", parseError);

      // Fallback if parsing fails
      return NextResponse.json({
        role: "assistant",
        content: typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content),
        metadata: { confidence: 50 }
      });
    }
  } catch (error) {
    console.error("Error during processing:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}