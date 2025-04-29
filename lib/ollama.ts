import { Ollama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Create Ollama instance
const ollama = new Ollama({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: "deepseek-r1:7b",
    temperature: 0.7,
});

export async function getOllamaResponse(userMessage: string) {
    const template = `
        You are a technical AI assistant specialized in computer science. Follow these rules strictly:
        1. ONLY answer technical questions related to computer science. 
        2. Be concise in your answers to complex questions.
        3. If the query is too simple, suggest searching on the internet.
        4. Do not respond to simple polite phrases like "hello" or "thank you".
        5. For simple bash commands, return the man page information.
        6. Never use polite formulas in your responses.
        7. Include a confidence level at the end of your response (as "Confidence: X%").
        
        IMPORTANT: Structure your response with <think> and </think> tags around your reasoning process,
        and then provide the final answer outside those tags. Only the content outside the <think> tags
        will be shown to the user.
 
        Question: {question}
        
        <think>
        First, let me reason through this question...
        </think>
        
        Answer:
    `;

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const outputParser = new StringOutputParser();

    const chain = promptTemplate.pipe(ollama).pipe(outputParser);

    try {
        const response = await chain.invoke({
            question: userMessage,
        });

        // Process the response to remove the thinking part
        return processResponse(response);
    } catch (error) {
        console.error("Error generating response:", error);
        return "Sorry, I encountered an error while processing your request.";
    }
}

/**
 * Process the response to extract only the final answer, removing any thinking parts
 */
function processResponse(response: string): string {
    // Remove everything between <think> and </think> tags including the tags
    let processedResponse = response.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    // If the response somehow still contains "think>" fragments, clean those up too
    processedResponse = processedResponse.replace(/<\/?think>/g, "").trim();

    // If there's nothing left after removing thinking sections, return the original
    if (!processedResponse) {
        // As a fallback, try to find content after the last </think> tag
        const parts = response.split("</think>");
        if (parts.length > 1) {
            return parts[parts.length - 1].trim();
        }
        return response;
    }

    return processedResponse;
}