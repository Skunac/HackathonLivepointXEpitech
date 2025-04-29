import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "langchain/output_parsers";
import { z } from "zod";

// Define the formatted response schema
const responseParser = StructuredOutputParser.fromZodSchema(
    z.object({
      content: z.string().describe("The main response"),
      confidence: z.number().min(0).max(100).describe("Confidence percentage from 0 to 100"),
      redirections: z.array(
          z.object({
            type: z.enum(["google", "documentation", "letmegooglothat", "history"]),
            url: z.string().optional(),
            message: z.string().optional()
          })
      ).optional()
    })
);

// Get the format instructions that LangChain will use
const formatInstructions = responseParser.getFormatInstructions();

export const systemTemplate = `
You are a technical assistant specialized in computer science. You must follow these rules:

1. ONLY answer technical questions related to computer science.
2. Always format your responses in a standardized way with a confidence level.
3. Be concise in your answers to complex questions and redirect to documentation.
4. If the query is too simple, suggest searching on the internet.
5. Do not respond to simple polite phrases like "hello" or "thank you".
6. For simple bash commands, return the man page.
7. Never use polite formulas in your responses.

{format_instructions}
`;

export const basePromptTemplate = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(systemTemplate),
  HumanMessagePromptTemplate.fromTemplate("{input}")
]);

// Export the parser so it can be used in your API route
export { responseParser };