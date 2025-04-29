import { NextRequest, NextResponse } from "next/server";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";
import { ChatMessage } from "@/lib/types";

import { model } from "@/lib/langchain/model";
import { basePromptTemplate } from "@/lib/langchain/prompts/basePrompt";
import { checkPoliteness } from "@/lib/utils/politenessDetector";
import { filterTechnicalQuestions } from "@/lib/langchain/chains/techFilterChain";
import { analyzeUserQuery } from "@/lib/utils/letmegooglethat";

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

// Function to sanitize and potentially repair JSON content
function sanitizeJsonContent(content) {
  // Remove thinking sections
  let sanitized = content.replace(/<think>[\s\S]*?<\/think>/g, '');

  // Extract JSON from markdown code blocks if present
  const jsonMatch = sanitized.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    sanitized = jsonMatch[1].trim();
  }

  // Fix common JSON escaping issues
  sanitized = sanitized
      // Fix double backslashes in namespace paths (common in PHP code examples)
      .replace(/App\\\\Middleware/g, "App\\\\\\\\Middleware")
      .replace(/Symfony\\Component/g, "Symfony\\\\Component")
      .replace(/\\Component\\\\App/g, "\\\\Component\\\\\\\\App")
      .replace(/\\Component\\\\Container/g, "\\\\Component\\\\\\\\Container")
      .replace(/\\Component\\\\Factory/g, "\\\\Component\\\\\\\\Factory")
      .replace(/\\Component\\HttpFoundation/g, "\\\\Component\\\\HttpFoundation")
      .replace(/\\\\"/g, '\\\\\\"') // Double escape quotes inside strings

      // Fix invalid escaping
      .replace(/\.MiddleWare/g, "\\.MiddleWare");

  return sanitized;
}

// Function to extract useful content when JSON parsing fails
function extractContent(responseContent) {
  // Remove thinking sections
  let content = responseContent.replace(/<think>[\s\S]*?<\/think>/g, '');

  // Remove markdown code blocks
  content = content.replace(/```json\s*([\s\S]*?)\s*```/g, '$1');

  // If it looks like valid JSON with content field, try to extract just that field
  try {
    const jsonObj = JSON.parse(content);
    if (typeof jsonObj === 'object' && jsonObj.content) {
      return jsonObj.content;
    }
  } catch (e) {
    // If parsing fails, continue with regular extraction
  }

  // Handle the specific Symfony middleware case we're seeing
  if (content.includes("Here's a simple Symfony middleware example")) {
    // Concatenate all content fields
    const parts = [];

    // Extract from the first content field (controller example)
    const controllerMatch = content.match(/"content"\s*:\s*"([^"]+)"/);
    if (controllerMatch && controllerMatch[1]) {
      parts.push(controllerMatch[1].replace(/\\n/g, '\n'));
    }

    // Extract from the second content field (middleware example)
    let remainingContent = content.substring(content.indexOf('"confidence"'));
    const middlewareMatch = remainingContent.match(/"content"\s*:\s*"([^"]+)"/);
    if (middlewareMatch && middlewareMatch[1]) {
      parts.push(middlewareMatch[1].replace(/\\n/g, '\n'));
    }

    // Extract main.js.php content if available
    const mainJsMatch = content.match(/"main\.js\.php"\s*:\s*"([^"]+)"/);
    if (mainJsMatch && mainJsMatch[1]) {
      parts.push("3. Create the main.js.php file:\n\n" + mainJsMatch[1].replace(/\\n/g, '\n'));
    }

    return parts.join('\n\n');
  }

  // Default to returning the whole content with minimal cleaning
  return content;
}

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

    // FILTER 2: Check if it's a technical question and determine the appropriate action
    const queryAnalysis = analyzeUserQuery(userMessage);

    // Handle different action types from queryAnalysis
    switch (queryAnalysis.action) {
      case 'google':
        // Return a redirect response for Google searches
        return NextResponse.json({
          role: "assistant",
          content: "This looks like something you should Google.",
          metadata: {
            redirectType: "google",
            redirectUrl: queryAnalysis.redirectUrl
          }
        });

      case 'docs':
        // Return a documentation redirect
        return NextResponse.json({
          role: "assistant",
          content: `This is best answered in the ${queryAnalysis.docSource} documentation.`,
          metadata: {
            redirectType: "documentation",
            redirectUrl: queryAnalysis.redirectUrl,
            docSource: queryAnalysis.docSource
          }
        });

      case 'manpage':
        // Return a manpage redirect for command line commands
        return NextResponse.json({
          role: "assistant",
          content: `Check the man page for the '${queryAnalysis.command}' command.`,
          metadata: {
            redirectType: "manpage",
            redirectUrl: queryAnalysis.redirectUrl,
            command: queryAnalysis.command
          }
        });

      case 'answer':
      default:
        // Continue with LLM processing for technical answers
        // If the message passes all filters, send to LLM model with standardized formatting
        const formattedPrompt = await basePromptTemplate.format({
          input: userMessage,
          format_instructions: responseParser.getFormatInstructions()
        });

        // Invoke the LLM model
        const rawResponse = await model.invoke(formattedPrompt);
        console.log("Raw response:", rawResponse);

        try {
          // Extract content from response object
          const responseContent = rawResponse.content || rawResponse;

          // Try to sanitize and repair the JSON
          const sanitizedContent = sanitizeJsonContent(responseContent);

          // Log sanitized content for debugging
          console.log("Sanitized content:", sanitizedContent);

          // Parse the sanitized JSON
          let parsedContent;
          try {
            parsedContent = JSON.parse(sanitizedContent);
          } catch (jsonError) {
            console.warn("Failed to parse JSON:", jsonError, "\nContent:", sanitizedContent);

            // If we still can't parse, do a more aggressive cleanup
            try {
              // Try to replace all backslashes with double backslashes
              const doubleEscaped = sanitizedContent.replace(/\\/g, '\\\\')
                  .replace(/\\\\\\\\/g, '\\\\') // Fix any quadruple backslashes
                  .replace(/\\\\"/g, '\\"'); // Fix any double-escaped quotes

              console.log("Double-escaped content:", doubleEscaped);
              parsedContent = JSON.parse(doubleEscaped);
            } catch (e) {
              console.warn("Still failed to parse JSON after double escaping:", e);
              throw new Error("Invalid JSON format");
            }
          }

          // If we have duplicate content fields, merge them
          if (parsedContent.content && typeof parsedContent.content === 'string') {
            // Check for additional content fields and merge if needed
            const fields = Object.keys(parsedContent);
            let mergedContent = parsedContent.content;

            for (const field of fields) {
              if (field !== 'content' && field !== 'confidence' && field !== 'redirections' &&
                  typeof parsedContent[field] === 'string' &&
                  (field.includes('content') || field.endsWith('.php'))) {
                // Append this content with a header
                mergedContent += `\n\n${field}: ${parsedContent[field]}`;
              }
            }

            // Update the content field with merged content
            parsedContent.content = mergedContent;
          }

          // Ensure confidence is a number between 0-100
          if (typeof parsedContent.confidence !== 'number' ||
              parsedContent.confidence < 0 ||
              parsedContent.confidence > 100) {
            parsedContent.confidence = 80; // Default confidence
          }

          // Ensure redirections is an array if present
          if (parsedContent.redirections && !Array.isArray(parsedContent.redirections)) {
            parsedContent.redirections = [];
          }

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

          // Extract useful content even if JSON parsing fails
          const extractedContent = extractContent(rawResponse.content || "");

          // Fallback to extracted content
          return NextResponse.json({
            role: "assistant",
            content: extractedContent,
            metadata: {
              confidence: 70,
              parsingError: true
            }
          });
        }
    }

  } catch (error) {
    console.error("Error in chat API route:", error);
    return NextResponse.json(
        { error: "Failed to process your request" },
        { status: 500 }
    );
  }
}