"use client";

import { useState } from "react";

interface Message {
    content: string;
    role: "user" | "assistant";
    isError?: boolean;
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
            const body = {
                message: input
            }
            // Send request to API
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
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
                    { content: data.error || "An error occurred", role: "assistant", isError: true },
                ]);
            }
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                {
                    content: "Failed to send message. Please try again.",
                    role: "assistant",
                    isError: true
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-emerald-50 rounded-xl border border-emerald-100 shadow-lg">
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-t-xl flex items-center justify-between">
                <h2 className="text-lg font-medium">Chat Assistant</h2>
                <div className="bg-emerald-700 bg-opacity-30 px-3 py-1 rounded-full text-xs">
                    Online
                </div>
            </div>

            {/* Chat messages */}
            <div className="flex-grow overflow-y-auto p-5 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-emerald-700 space-y-3">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <p className="text-emerald-800 font-medium text-lg">
                                Welcome to Tamagotchat
                            </p>
                            <p className="text-emerald-600 mt-1">
                                Ask a technical question to get started!
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${
                                msg.role === "user"
                                    ? "bg-emerald-600 text-white ml-auto"
                                    : msg.isError
                                        ? "bg-red-50 border border-red-200 text-red-700 mr-auto"
                                        : "bg-[#f5f0e6] text-gray-700 mr-auto"
                            }`}
                        >
                            {msg.isError ? (
                                <div className="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                        </div>
                    ))
                )}
                {isLoading && (
                    <div className="bg-[#f5f0e6] p-4 rounded-2xl mr-auto max-w-[80%] shadow-sm">
                        <div className="flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-100"></div>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse delay-200"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat input */}
            <div className="border-t border-emerald-100 p-4 bg-white rounded-b-xl">
                <form onSubmit={handleSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-grow p-3 border border-emerald-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-emerald-50 placeholder-emerald-400 text-gray-700"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-full disabled:bg-emerald-300 transition-colors duration-200 flex items-center justify-center shadow-md"
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="sr-only">Sending</span>
                            </span>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}