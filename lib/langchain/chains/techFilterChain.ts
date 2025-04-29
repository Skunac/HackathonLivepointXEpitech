import { classifyQuestionDomain } from "./domainClassifier";
import { isLikelyTechnical } from "@/lib/data/technicalDomains";

/**
 * Response for non-technical questions
 */
export const NON_TECHNICAL_RESPONSE = {
  content: "I only answer technical questions related to computer science and programming.",
  metadata: { 
    isNonTechnicalResponse: true,
    confidence: 100
  }
};

/**
 * Performs a fast preliminary check followed by a more detailed analysis if needed
 */
export async function isTechnicalQuestion(question: string): Promise<{
  isTechnical: boolean;
  confidence: number;
  domain?: string;
  reason?: string;
}> {
  // First, do a quick check with keywords
  if (isLikelyTechnical(question)) {
    return {
      isTechnical: true,
      confidence: 90,
      domain: "technical (keyword match)",
      reason: "Quick check found technical keywords"
    };
  }

  // If the quick check didn't find it technical, use the LLM classifier
  const classification = await classifyQuestionDomain(question);

  return {
    isTechnical: classification.isTechnical,
    confidence: classification.confidence,
    domain: classification.domain,
    reason: classification.reason
  };
}

/**
 * Filter function that determines if a question should be answered
 * Returns the filtering result and metadata
 */
export async function filterTechnicalQuestions(question: string): Promise<{
  shouldAnswer: boolean;
  response?: {
    content: string;
    metadata: any;
  };
  technicalAnalysis?: {
    isTechnical: boolean;
    confidence: number;
    domain?: string;
    reason?: string;
  };
}> {
  try {
    const analysis = await isTechnicalQuestion(question);

    if (!analysis.isTechnical) {
      return {
        shouldAnswer: false,
        response: NON_TECHNICAL_RESPONSE,
        technicalAnalysis: analysis
      };
    }

    return {
      shouldAnswer: true,
      technicalAnalysis: analysis
    };
  } catch (error) {
    console.error("Error in technical filter:", error);

    // Default to allowing the question if there's an error
    return {
      shouldAnswer: true,
      technicalAnalysis: {
        isTechnical: true,
        confidence: 50,
        reason: "Error during filtering, allowing by default"
      }
    };
  }
}