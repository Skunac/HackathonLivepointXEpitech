"use client";

import { useState } from "react";

interface Message {
    content: string;
    role: "user" | "assistant";
}

export default function ChatUI() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message to chat
        const userMessage = { content: input, role: "user" as const };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Send request to API
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ message: input }),
            });

            const data = await response.json();

            // Add assistant response to chat
            if (response.ok) {
                setMessages((prev) => [
                    ...prev,
                    { content: data.response, role: "assistant" },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    { content: `Error: ${data.error}`, role: "assistant" },
                ]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    content: "Failed to send message. Please try again.",
                    role: "assistant",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[70vh] bg-gray-50 rounded-lg border">
            {/* Chat messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <p className="text-center text-gray-400 my-6">
                        No messages yet. Start a conversation!
                    </p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`p-3 rounded-lg ${
                                msg.role === "user"
                                    ? "bg-blue-100 ml-auto max-w-[80%]"
                                    : "bg-white mr-auto max-w-[80%] border"
                            }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="bg-white p-3 rounded-lg mr-auto max-w-[80%] border">
                        <p className="text-gray-400">Thinking...</p>
                    </div>
                )}
            </div>

            {/* Chat input */}
            <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-blue-300"
                    >
                        {isLoading ? "Sending..." : "Send"}
                    </button>
                </form>
            </div>
        </div>
    );
}