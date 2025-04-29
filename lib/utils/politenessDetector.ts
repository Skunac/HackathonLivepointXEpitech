export function checkPoliteness(message: string): {
    isOnlyPoliteness: boolean;
    containsPoliteness: boolean;
} {
    const lowerMessage = message.toLowerCase().trim();
    const cleanMessage = lowerMessage.replace(/[.,!?;:]/g, '');
    const messageWords = cleanMessage.split(/\s+/);

    const greetings = [
        "hello", "hi", "hey", "hi there", "hello there", "greetings",
        "good morning", "good afternoon", "good evening", "good day",
        "howdy", "what's up", "sup", "hiya", "morning", "afternoon",
        "evening", "good to see you", "nice to see you", "pleasure to see you",
        "welcome", "yo", "hola", "how are you", "how are you doing",
        "how's it going", "how do you do", "how have you been",
        "how's everything", "how's your day", "how's your day going",
        "how are things", "how's life", "what's new", "what's happening"
    ];

    const thankYouExpressions = [
        "thank you", "thanks", "thank you very much", "thanks a lot",
        "thanks so much", "thank you so much", "many thanks",
        "thanks a million", "thank you kindly", "much appreciated",
        "i appreciate it", "appreciate it", "grateful", "i am grateful",
        "thankful", "cheers", "ta", "merci", "gracias", "danke",
        "appreciate your help", "thank you for your help",
        "thanks for your assistance", "thank you for your time",
        "thanks for your time", "thank you for your support"
    ];

    const farewells = [
        "goodbye", "bye", "see you", "see you later", "farewell",
        "take care", "have a good day", "have a nice day", "have a great day",
        "have a good one", "catch you later", "talk to you later",
        "until next time", "later", "so long", "cheers", "adios",
        "ciao", "auf wiedersehen", "have a good evening", "have a good night",
        "good night", "have a good weekend", "have a nice weekend",
        "see you soon", "see you tomorrow", "bye for now", "signing off",
        "i'll be going now", "i have to go", "gotta go", "ttyl"
    ];

    const apologies = [
        "sorry", "i apologize", "my apologies", "forgive me",
        "i'm sorry", "pardon me", "excuse me", "regret",
        "i regret", "apologies for", "sorry for", "sorry about",
        "i apologize for", "please forgive", "i beg your pardon",
        "i didn't mean to", "it was my fault", "my bad", "oops",
        "my mistake", "i made a mistake", "i was wrong"
    ];

    const politeRequests = [
        "please", "kindly", "if you don't mind", "if you could",
        "would you", "could you", "would you mind", "could you please",
        "would you please", "may i", "might i", "if possible",
        "if it's not too much trouble", "when you have a moment",
        "at your convenience", "when you get a chance"
    ];

    const generalPoliteness = [
        "nice to meet you", "pleased to meet you", "pleasure to meet you",
        "it's a pleasure", "delighted", "honored", "with pleasure",
        "happy to help", "glad to help", "no problem", "no worries",
        "my pleasure", "don't mention it", "you're welcome",
        "welcome", "not at all", "it's nothing", "anytime",
        "glad to be of assistance", "glad to be of service"
    ];

    const allPolitenessExpressions = [
        ...greetings,
        ...thankYouExpressions,
        ...farewells,
        ...apologies,
        ...politeRequests,
        ...generalPoliteness
    ];

    const fillerWords = [
        "a", "the", "and", "or", "but", "so", "very", "much",
        "my", "i", "me", "to", "you", "your", "for", "just",
        "am", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would",
        "shall", "should", "may", "might", "must", "can", "could",
        "of", "in", "on", "at", "by", "with", "about", "against",
        "from", "into", "during", "before", "after", "above", "below",
        "this", "that", "these", "those", "it", "its", "they", "them"
    ];

    const containsPoliteness = allPolitenessExpressions.some(expr =>
        cleanMessage.includes(expr)
    );

    if (!containsPoliteness) {
        return { isOnlyPoliteness: false, containsPoliteness: false };
    }

    const substantiveWords = messageWords.filter(word => {
        if (!word || word.length < 2) return false;

        if (fillerWords.includes(word)) return false;

        const isInPolitenessOnly = allPolitenessExpressions.some(expr =>
            expr.includes(word)
        );

        return !isInPolitenessOnly;
    });

    const isOnlyPoliteness = substantiveWords.length === 0;

    return {
        isOnlyPoliteness,
        containsPoliteness
    };
}