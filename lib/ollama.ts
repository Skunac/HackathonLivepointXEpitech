import { Ollama } from "@langchain/ollama";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// Create Ollama instance
const ollama = new Ollama({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: "deepseek-r1:7b", // Change to your preferred model
    temperature: 0.7,
});

// Create a chat chain
export async function getOllamaResponse(userMessage: string) {
    const template = `You are a helpful AI assistant.

Question: {question}
Answer:`;

    const promptTemplate = PromptTemplate.fromTemplate(template);
    const outputParser = new StringOutputParser();

    const chain = promptTemplate.pipe(ollama).pipe(outputParser);

    try {
        const response = await chain.invoke({
            question: userMessage,
        });
        return response;
    } catch (error) {
        console.error("Error generating response:", error);
        return "Sorry, I encountered an error while processing your request.";
    }
}