import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatRequestSchema, type ChatResponse } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "demo_key"
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat streaming endpoint
  app.post("/api/chat/stream", async (req, res) => {
    try {
      const { message, apiKey, model } = chatRequestSchema.parse(req.body);

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Store user message
      await storage.createMessage({
        content: message,
        role: "user"
      });

      // Use client-provided API key or fallback to server environment variable
      const activeApiKey = apiKey || process.env.OPENAI_API_KEY;
      const activeModel = model || "gpt-4o";

      let assistantMessage = "";

      // Add a thinking delay
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

      if (activeApiKey && activeApiKey !== "demo_key") {
        try {
          // Create OpenAI client with user's API key
          const userOpenai = new OpenAI({
            apiKey: activeApiKey,
          });

          const response = await userOpenai.responses.create({
            model: activeModel,
            input: [
              {
                "role": "system",
                "content": [
                  {
                    "type": "input_text",
                    "text": "You are a helpful AI assistant. Provide clear, concise, and helpful responses. You can use markdown formatting in your responses."
                  }
                ]
              },
              {
                "role": "user", 
                "content": [
                  {
                    "type": "input_text",
                    "text": message
                  }
                ]
              }
            ],
            text: {
              "format": {
                "type": "text"
              }
            },
            reasoning: {},
            tools: [],
            temperature: 0.7,
            max_output_tokens: 1000,
            top_p: 1,
            store: true
          });

          // Extract the response text content
          const responseText = response.output_text || "";
          assistantMessage = responseText;

          // Simulate streaming by breaking the response into chunks
          const words = responseText.split(' ');
          let currentText = "";
          
          for (let i = 0; i < words.length; i++) {
            const wordToAdd = i === 0 ? words[i] : ' ' + words[i];
            currentText += wordToAdd;
            res.write(`data: ${JSON.stringify({ content: wordToAdd, done: false })}\n\n`);
            // Small delay between chunks for more natural streaming
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        } catch (error) {
          console.error("OpenAI API error:", error);
          assistantMessage = "I'm sorry, I'm experiencing technical difficulties. Please try again later.";
          res.write(`data: ${JSON.stringify({ content: assistantMessage, done: false })}\n\n`);
        }
      } else {
        // Mock streaming response
        const mockResponse = generateMockResponse(message);
        const words = mockResponse.split(' ');
        
        for (let i = 0; i < words.length; i++) {
          const wordToAdd = i === 0 ? words[i] : ' ' + words[i];
          assistantMessage += wordToAdd;
          res.write(`data: ${JSON.stringify({ content: wordToAdd, done: false })}\n\n`);
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 100));
        }
      }

      // Store assistant message
      await storage.createMessage({
        content: assistantMessage,
        role: "assistant"
      });

      // Send final message
      res.write(`data: ${JSON.stringify({ content: "", done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Chat streaming endpoint error:", error);
      res.write(`data: ${JSON.stringify({ error: "Invalid request" })}\n\n`);
      res.end();
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, apiKey, model } = chatRequestSchema.parse(req.body);

      // Store user message
      await storage.createMessage({
        content: message,
        role: "user"
      });

      let assistantMessage: string;

      // Use client-provided API key or fallback to server environment variable
      const activeApiKey = apiKey || process.env.OPENAI_API_KEY;
      const activeModel = model || "gpt-4o";

      // Check if we have a real API key
      if (activeApiKey && activeApiKey !== "demo_key") {
        try {
          // Add a 2-3 second thinking delay
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

          // Create OpenAI client with user's API key
          const userOpenai = new OpenAI({
            apiKey: activeApiKey,
          });

          const response = await userOpenai.responses.create({
            model: activeModel,
            input: [
              {
                "role": "system",
                "content": [
                  {
                    "type": "input_text",
                    "text": "You are a helpful AI assistant. Provide clear, concise, and helpful responses. You can use markdown formatting in your responses."
                  }
                ]
              },
              {
                "role": "user", 
                "content": [
                  {
                    "type": "input_text",
                    "text": message
                  }
                ]
              }
            ],
            text: {
              "format": {
                "type": "text"
              }
            },
            reasoning: {},
            tools: [],
            temperature: 0.7,
            max_output_tokens: 1000,
            top_p: 1,
            store: true
          });

          assistantMessage = response.output_text || "I apologize, but I couldn't generate a response.";
        } catch (error) {
          console.error("OpenAI API error:", error);
          assistantMessage = "I'm sorry, I'm experiencing technical difficulties. Please try again later.";
        }
      } else {
        // Mock response for demo/development
        assistantMessage = generateMockResponse(message);
      }

      // Store assistant message
      await storage.createMessage({
        content: assistantMessage,
        role: "assistant"
      });

      const response: ChatResponse = {
        content: assistantMessage,
        role: "assistant"
      };

      res.json(response);
    } catch (error) {
      console.error("Chat endpoint error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid request" 
      });
    }
  });

  // Get chat history
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Messages endpoint error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateMockResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  // Handle common greetings
  if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi")) {
    return "Hello! I'm your AI assistant. How can I help you today?";
  }
  
  // Handle help requests
  if (lowerPrompt.includes("help")) {
    return "I'm here to help! You can ask me questions about various topics, request explanations, help with coding, writing, math problems, and much more. What would you like to know?";
  }
  
  // Handle coding questions
  if (lowerPrompt.includes("code") || lowerPrompt.includes("programming")) {
    return `I'd be happy to help with coding! Here's a simple example:

\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}

console.log(greet("World"));
\`\`\`

What specific programming topic would you like help with?`;
  }
  
  // Handle machine learning questions
  if (lowerPrompt.includes("machine learning") || lowerPrompt.includes("ml")) {
    return `**Machine Learning** is a subset of artificial intelligence (AI) that enables computers to learn and improve from experience without being explicitly programmed.

Here are the key concepts:

- **Training Data**: Large datasets used to teach algorithms
- **Algorithms**: Mathematical models that find patterns
- **Prediction**: Making informed guesses on new data

Would you like me to explain any specific aspect of machine learning?`;
  }
  
  // Default responses
  const responses = [
    "That's an interesting question! I'd be happy to help you explore this topic further. Could you provide more specific details about what you'd like to know?",
    "I understand you're looking for information about that. Here are some key points to consider:\n\n• Context is important when addressing this question\n• There are multiple perspectives to consider\n• The best approach depends on your specific needs\n\nWould you like me to elaborate on any particular aspect?",
    "Thank you for that question! This is definitely something worth exploring.\n\n**Key considerations:**\n- Understanding the fundamentals is important\n- Practical application varies by situation\n- There are both benefits and potential challenges\n\nWhat specific aspect interests you most?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
