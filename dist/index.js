// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
var MemStorage = class {
  users;
  messages;
  currentUserId;
  currentMessageId;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.messages = /* @__PURE__ */ new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
  }
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  async getMessages() {
    return Array.from(this.messages.values()).sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }
  async createMessage(insertMessage) {
    const id = this.currentMessageId++;
    const message = {
      ...insertMessage,
      id,
      timestamp: /* @__PURE__ */ new Date()
    };
    this.messages.set(id, message);
    return message;
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role").notNull(),
  // 'user' or 'assistant'
  timestamp: timestamp("timestamp").defaultNow().notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true
});
var chatRequestSchema = z.object({
  message: z.string().min(1).max(4e3),
  apiKey: z.string().optional(),
  model: z.string().optional()
});
var chatResponseSchema = z.object({
  content: z.string(),
  role: z.literal("assistant")
});

// server/routes.ts
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "demo_key"
});
async function registerRoutes(app2) {
  app2.post("/api/chat/stream", async (req, res) => {
    try {
      const { message, apiKey, model } = chatRequestSchema.parse(req.body);
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control"
      });
      await storage.createMessage({
        content: message,
        role: "user"
      });
      const activeApiKey = apiKey || process.env.OPENAI_API_KEY;
      const activeModel = model || "gpt-4o";
      let assistantMessage = "";
      await new Promise((resolve) => setTimeout(resolve, 2e3 + Math.random() * 1e3));
      if (activeApiKey && activeApiKey !== "demo_key") {
        try {
          const userOpenai = new OpenAI({
            apiKey: activeApiKey
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
            max_output_tokens: 1e3,
            top_p: 1,
            store: true
          });
          const responseText = response.output_text || "";
          assistantMessage = responseText;
          const words = responseText.split(" ");
          let currentText = "";
          for (let i = 0; i < words.length; i++) {
            const wordToAdd = i === 0 ? words[i] : " " + words[i];
            currentText += wordToAdd;
            res.write(`data: ${JSON.stringify({ content: wordToAdd, done: false })}

`);
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        } catch (error) {
          console.error("OpenAI API error:", error);
          assistantMessage = "I'm sorry, I'm experiencing technical difficulties. Please try again later.";
          res.write(`data: ${JSON.stringify({ content: assistantMessage, done: false })}

`);
        }
      } else {
        const mockResponse = generateMockResponse(message);
        const words = mockResponse.split(" ");
        for (let i = 0; i < words.length; i++) {
          const wordToAdd = i === 0 ? words[i] : " " + words[i];
          assistantMessage += wordToAdd;
          res.write(`data: ${JSON.stringify({ content: wordToAdd, done: false })}

`);
          await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 100));
        }
      }
      await storage.createMessage({
        content: assistantMessage,
        role: "assistant"
      });
      res.write(`data: ${JSON.stringify({ content: "", done: true })}

`);
      res.end();
    } catch (error) {
      console.error("Chat streaming endpoint error:", error);
      res.write(`data: ${JSON.stringify({ error: "Invalid request" })}

`);
      res.end();
    }
  });
  app2.post("/api/chat", async (req, res) => {
    try {
      const { message, apiKey, model } = chatRequestSchema.parse(req.body);
      await storage.createMessage({
        content: message,
        role: "user"
      });
      let assistantMessage;
      const activeApiKey = apiKey || process.env.OPENAI_API_KEY;
      const activeModel = model || "gpt-4o";
      if (activeApiKey && activeApiKey !== "demo_key") {
        try {
          await new Promise((resolve) => setTimeout(resolve, 2e3 + Math.random() * 1e3));
          const userOpenai = new OpenAI({
            apiKey: activeApiKey
          });
          const response2 = await userOpenai.responses.create({
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
            max_output_tokens: 1e3,
            top_p: 1,
            store: true
          });
          assistantMessage = response2.output_text || "I apologize, but I couldn't generate a response.";
        } catch (error) {
          console.error("OpenAI API error:", error);
          assistantMessage = "I'm sorry, I'm experiencing technical difficulties. Please try again later.";
        }
      } else {
        assistantMessage = generateMockResponse(message);
      }
      await storage.createMessage({
        content: assistantMessage,
        role: "assistant"
      });
      const response = {
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
  app2.get("/api/messages", async (req, res) => {
    try {
      const messages2 = await storage.getMessages();
      res.json(messages2);
    } catch (error) {
      console.error("Messages endpoint error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
function generateMockResponse(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes("hello") || lowerPrompt.includes("hi")) {
    return "Hello! I'm your AI assistant. How can I help you today?";
  }
  if (lowerPrompt.includes("help")) {
    return "I'm here to help! You can ask me questions about various topics, request explanations, help with coding, writing, math problems, and much more. What would you like to know?";
  }
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
  if (lowerPrompt.includes("machine learning") || lowerPrompt.includes("ml")) {
    return `**Machine Learning** is a subset of artificial intelligence (AI) that enables computers to learn and improve from experience without being explicitly programmed.

Here are the key concepts:

- **Training Data**: Large datasets used to teach algorithms
- **Algorithms**: Mathematical models that find patterns
- **Prediction**: Making informed guesses on new data

Would you like me to explain any specific aspect of machine learning?`;
  }
  const responses = [
    "That's an interesting question! I'd be happy to help you explore this topic further. Could you provide more specific details about what you'd like to know?",
    "I understand you're looking for information about that. Here are some key points to consider:\n\n\u2022 Context is important when addressing this question\n\u2022 There are multiple perspectives to consider\n\u2022 The best approach depends on your specific needs\n\nWould you like me to elaborate on any particular aspect?",
    "Thank you for that question! This is definitely something worth exploring.\n\n**Key considerations:**\n- Understanding the fundamentals is important\n- Practical application varies by situation\n- There are both benefits and potential challenges\n\nWhat specific aspect interests you most?"
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8e3;
  server.listen(port, "localhost", () => {
    log(`serving on port ${port}`);
  });
})();
