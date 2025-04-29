import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { model } from "@/lib/langchain/model";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { technicalDomains, technicalKeywords } from "@/lib/data/technicalDomains";

// Schema for classification output
const classificationSchema = z.object({
  isTechnical: z.boolean().describe("Whether the question is about a technical topic"),
  confidence: z.number().min(0).max(100).describe("Confidence in the classification (0-100)"),
  domain: z.string().describe("The detected domain of the question"),
  reason: z.string().describe("Reasoning behind the classification")
});

const parser = StructuredOutputParser.fromZodSchema(classificationSchema);

// Create the domain classifier prompt
const classifierPrompt = ChatPromptTemplate.fromTemplate(`
You are a specialized filter that determines if a question is related to technical topics, specifically computer science and programming.

Technical domains include: ${technicalDomains.join(", ")}

Technical keywords include: ${technicalKeywords.join(", ")}

Question: {question}

Determine if this question is related to a technical domain. 
Consider both explicit domain references and implicit technical nature.

${parser.getFormatInstructions()}
`);

// Create the classification chain
export const domainClassifier = RunnableSequence.from([
  {
    question: (input: string) => input,
  },
  classifierPrompt,
  model,
  parser
]);

/**
 * Analyzes a question to determine if it's related to a technical domain
 */
export async function classifyQuestionDomain(question: string) {
  try {
    return await domainClassifier.invoke(question);
  } catch (error) {
    console.error("Error classifying question domain:", error);
 
    // Default to technical if there's an error, to avoid blocking legitimate questions
    return {
      isTechnical: true,
      confidence: 50,
      domain: "unknown",
      reason: "Error during classification, allowing as technical by default"
    };
  }
}