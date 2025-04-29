import { NextRequest, NextResponse } from "next/server";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { ChatMessage } from "@/lib/types";

import { model } from "@/lib/langchain/model";
import { basePromptTemplate } from "@/lib/langchain/prompts/basePrompt";
import { checkPoliteness } from "@/lib/utils/politenessDetector";
import { filterTechnicalQuestions } from "@/lib/langchain/chains/techFilterChain";
// Import other utility functions as needed
// import { isSimpleQuery, generateSearchUrl } from "@/lib/utils/simplicityDetector";

// Define the formatted response schema
const responseParser = StructuredOutputParser.fromZodSchema(
  z.object({
    content: z.string().describe("The main response"),
    confidence: z.number().min(0).max(100).describe("Confidence percentage from 0 to 100"),
    redirections: z.array(
      z.object({
        type: z.enum(["google", "letmegooglothat", "documentation", "history"]),
        url: z.string().optional(),
        message: z.string().optional()
      })
    ).optional()
  })
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let messages: ChatMessage[] = [];
 
    // Handle both message formats
    if (body.messages && Array.isArray(body.messages)) {
      // Standard format: { messages: [...] }
      messages = body.messages;

      // Validate each message in the array
      for (const msg of messages) {
        if (!msg.role || !msg.content || (msg.role !== 'user' && msg.role !== 'assistant')) {
          return NextResponse.json(
            { error: "Invalid message format. Each message must have 'role' ('user' or 'assistant') and 'content'." },
            { status: 400 }
          );
        }
      }
    } else if (body.message && typeof body.message === 'string') {
      // Simple format: { message: "..." }
      messages = [{ role: 'user', content: body.message }];
    } else {
      return NextResponse.json(
        { error: "Invalid request format. Expected 'messages' array or 'message' string." },
        { status: 400 }
      );
    }
    
    // Check if the messages array is empty
    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided" },
        { status: 400 }
      );
    }

    // Extract the last user message
    const lastMessage = messages[messages.length - 1];
    
    // Ensure the last message is from the user
    if (lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: "The last message must be from the user" },
        { status: 400 }
      );
    }
    
    const userMessage = lastMessage.content;

    // FILTER 1: Check if it's a simple greeting or politeness
    const politenessCheck = checkPoliteness(userMessage);
    if (politenessCheck.isOnlyPoliteness) {
      return NextResponse.json({
        role: "assistant",
        content: "No need for polite formulas, on the contrary, you're making me use precious energy for nothing",
        metadata: { isGreetingResponse: true }
      });
    }

    // (Reste de votre code inchangé)
    // ...

    // FILTER 2: Check if it's a technical question
    const technicalCheck = await filterTechnicalQuestions(userMessage);
    if (!technicalCheck.shouldAnswer) {
      // Return the predefined response for non-technical questions
      return NextResponse.json({
        role: "assistant",
        content: technicalCheck.response?.content || "I only answer technical questions related to computer science.",
        metadata: technicalCheck.response?.metadata || { isNonTechnicalResponse: true }
      });
    }

    // If the message passes all filters, send to LLM model with standardized formatting
    const formattedPrompt = await basePromptTemplate.format({
      input: userMessage
    });

    // Invoke the LLM model
    const rawResponse = await model.invoke(formattedPrompt);
    
    try {
      // Try to parse the response using the structured output parser
      const parsedContent = responseParser.parse(rawResponse.content);
      
      return NextResponse.json({
        role: "assistant",
        content: parsedContent.content,
        metadata: {
          confidence: parsedContent.confidence,
          redirections: parsedContent.redirections || []
        }
      });
      
    } catch (parseError) {
      console.warn("Failed to parse structured output from LLM:", parseError);
      
      // Fallback to raw response if parsing fails
      return NextResponse.json({
        role: "assistant",
        content: rawResponse.content,
        metadata: { 
          confidence: 70,
          parsingError: true
        }
      });
    }

  } catch (error) {
    console.error("Error in chat API route:", error);
    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}