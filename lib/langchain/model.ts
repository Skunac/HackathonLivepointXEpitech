import { ChatOllama } from "@langchain/ollama";

export const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "deepseek-r1:7b",
  temperature: 0.7,
});