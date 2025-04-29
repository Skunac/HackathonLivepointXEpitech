import { Ollama } from "@langchain/ollama";

const ollama = new Ollama({
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    model: "deepseek-r1:1.5b",
    temperature: 0.3,
});

export async function getIntermediateResponse(userMessage: string) {
    try {
        // Create a prompt directly without using PromptTemplate
        const prompt = `You are an AI assistant that evaluates whether requests are appropriate for technical assistance.

User Request: "${userMessage}"

STRICT CRITERIA FOR TECHNICAL QUESTIONS:
1. Must relate directly to programming, computer science, IT infrastructure, or specific technologies
2. Must demonstrate effort and clarity (not just "how to code" or single words)
3. Must be specific enough to be answerable with technical knowledge
4. Must not be easily answerable with a basic web search

IMPORTANT: Framework and library-specific questions ARE technical questions, especially questions about:
- Symfony, Laravel, Django, Flask, Spring, Express, Nestjs, Rails (web frameworks)
- React, Vue, Angular, Svelte (frontend frameworks)
- Middleware, plugins, hooks, components, or implementation examples

Examples of NON-TECHNICAL questions (should NOT be "GOOD"):
- "Hello"
- "Test"
- "How are you"
- "What's up"
- Any single word request
- Any request with less than 5 characters
- Any greeting or chitchat
- Any profanity or inappropriate content
- Any request with no clear technical context

Examples of PROPER TECHNICAL questions (should be "GOOD"):
- "How do I implement a binary search tree in Python?"
- "What's the difference between RESTful and GraphQL APIs?"
- "My MongoDB query is slow, how can I optimize: db.users.find({age: {$gt: 30}})"
- "How do I fix this TypeScript error: Type 'string' is not assignable to type 'number'"
- "Show me an example of Symfony middleware"
- "How to create middleware in Express.js"
- "Can you explain Laravel middleware?"
- "What's the best way to implement JWT authentication in Django?"

EXAMPLES OF "SHOW ME" QUESTIONS THAT ARE VALID TECHNICAL REQUESTS:
- "Show me how to write a React component" - GOOD
- "Show me an example of Symfony middleware" - GOOD
- "Show me how to create a Docker container" - GOOD

Your task is to categorize this request using EXACTLY ONE of these formats:
1. "ERROR:NO_SUBSTANCE" - For greetings, single words, or non-technical/low-effort messages
2. "LMGTFY:" followed by search terms - For simple questions easily answered via search or not technical questions
3. "DOC:" followed by technology name and URL - For questions about specific documentation
4. "MAN:" followed by command name - For bash/terminal command questions
5. "GOOD" - ONLY for genuine technical questions meeting ALL criteria above

RESPONSE FORMAT: Only output one of the exact formats above, no explanations.`;

        // Call Ollama directly without using chains
        const response = await ollama.invoke(prompt);
        const trimmedResponse = response.trim();

        // Log the raw response for debugging
        console.log("Intermediate response:", trimmedResponse);

        // Extract just the decision code (ignore any thinking or explanation)
        let decision = trimmedResponse;

        // If response contains multiple lines or thinking sections, extract just the decision code
        if (trimmedResponse.includes("\n") || trimmedResponse.includes("<think>")) {
            // Try to find the decision code in the response
            const codePatterns = [
                /ERROR:NO_SUBSTANCE/i,
                /LMGTFY:.+/i,
                /DOC:.+/i,
                /MAN:.+/i,
                /\bGOOD\b/i
            ];

            for (const pattern of codePatterns) {
                const match = trimmedResponse.match(pattern);
                if (match) {
                    decision = match[0].trim();
                    break;
                }
            }

            // If still couldn't find a clear code, default to NO_SUBSTANCE
            if (decision === trimmedResponse) {
                // Default to NO_SUBSTANCE for unclear responses
                decision = "ERROR:NO_SUBSTANCE";
            }
        }

        console.log("Extracted decision:", decision);

        // Process the decision
        if (decision.startsWith("LMGTFY:")) {
            const searchTerm = decision.substring(7).trim();
            const encodedSearchTerm = encodeURIComponent(searchTerm);
            return `This could be easily answered with a Google search: https://letmegooglethat.com/?q=${encodedSearchTerm}`;
        } else if (decision.includes("ERROR:NO_SUBSTANCE")) {
            return "Please provide a specific technical question or request that I can help you with.";
        } else if (decision.startsWith("DOC:")) {
            // Extract technology name and doc URL
            const parts = decision.substring(4).split(":");
            if (parts.length >= 2) {
                const technology = parts[0].trim();
                const docURL = parts.slice(1).join(":").trim(); // Rejoin in case URL contains colons
                return `Please refer to the official ${technology} documentation: ${docURL}`;
            }
            return "Please check the official documentation for this technology.";
        } else if (decision.startsWith("MAN:")) {
            const command = decision.substring(4).trim();
            return `Please refer to the manual page for '${command}'. You can view it by typing 'man ${command}' in your terminal.`;
        } else if (decision.includes("GOOD")) {
            return "GOOD";
        } else {
            // Default to "ERROR:NO_SUBSTANCE" if the response doesn't match any pattern
            console.warn("Unrecognized intermediate response pattern:", trimmedResponse);
            return "Please provide a specific technical question or request that I can help you with.";
        }
    } catch (error) {
        console.error("Error generating intermediate response:", error);
        // On error, default to ERROR:NO_SUBSTANCE to avoid processing non-technical requests
        return "Please provide a specific technical question or request that I can help you with.";
    }
}