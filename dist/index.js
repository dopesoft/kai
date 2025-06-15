// server/index.ts
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
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
  model: z.string().optional(),
  userId: z.string().optional(),
  threadId: z.string().optional()
  // CHANGED: from sessionId to threadId
});
var chatResponseSchema = z.object({
  content: z.string(),
  role: z.literal("assistant")
});

// server/routes.ts
import OpenAI from "openai";

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
var supabaseInstance = null;
var supabaseAdminInstance = null;
function getSupabase() {
  if (supabaseInstance === null) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      console.log("\u2705 Supabase configured successfully");
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      console.warn("\u26A0\uFE0F Supabase not configured - memory features will be disabled");
      console.warn("Add SUPABASE_URL and SUPABASE_ANON_KEY to environment variables");
      console.warn("Current env:", {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        supabaseUrlValue: process.env.SUPABASE_URL ? "Set" : "Not set",
        supabaseKeyValue: process.env.SUPABASE_ANON_KEY ? "Set" : "Not set"
      });
      supabaseInstance = null;
    }
  }
  return supabaseInstance;
}
function getSupabaseAdmin() {
  if (supabaseAdminInstance === null) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    console.log("\u{1F527} Initializing Supabase admin client...", {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceRoleKey,
      urlValue: supabaseUrl ? "Set" : "Not set",
      serviceKeyValue: supabaseServiceRoleKey ? "Set" : "Not set"
    });
    if (supabaseUrl && supabaseServiceRoleKey) {
      console.log("\u2705 Supabase admin client configured successfully");
      supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });
    } else {
      console.error("\u274C Supabase admin client not configured - THIS WILL CAUSE ERRORS");
      console.error("Missing:", {
        SUPABASE_URL: !supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !supabaseServiceRoleKey
      });
      supabaseAdminInstance = null;
    }
  }
  return supabaseAdminInstance;
}
var supabase = new Proxy({}, {
  get(target, prop) {
    const instance = getSupabase();
    if (instance) {
      return instance[prop];
    }
    return void 0;
  }
});
var supabaseAdmin = new Proxy({}, {
  get(target, prop) {
    const instance = getSupabaseAdmin();
    if (instance) {
      return instance[prop];
    }
    throw new Error(`Supabase admin client not initialized. Check environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`);
  }
});

// server/routes.ts
import { nanoid } from "nanoid";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "demo_key"
});
async function generateEmbedding(text2, apiKey) {
  const client = apiKey ? new OpenAI({ apiKey }) : openai;
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text2
  });
  return response.data[0].embedding;
}
async function fetchMemories(userId, threadId, userMessage, apiKey) {
  console.log("\u{1F50D} Fetching memories for:", { userId, threadId });
  const { data: shortTermMemories, error: shortError } = await supabaseAdmin.from("short_term_memory").select("*").eq("user_id", userId).eq("thread_id", threadId).order("timestamp", { ascending: false }).limit(10);
  if (shortError) {
    console.error("\u274C Short-term memory fetch error:", shortError);
  } else {
    console.log("\u2705 Short-term memories found:", shortTermMemories?.length || 0);
  }
  const messageEmbedding = await generateEmbedding(userMessage, apiKey);
  const { data: longTermMemories, error: longError } = await supabaseAdmin.rpc("match_memories", {
    query_embedding: messageEmbedding,
    match_threshold: 0.7,
    match_count: 5,
    user_id: userId
  });
  if (longError) {
    console.error("\u274C Long-term memory fetch error:", longError);
  } else {
    console.log("\u2705 Long-term memories found:", longTermMemories?.length || 0);
  }
  return { shortTermMemories, longTermMemories };
}
async function extractMemories(userMessage, assistantMessage, apiKey) {
  console.log("\u{1F9E0} Extracting memories from conversation...");
  const client = apiKey ? new OpenAI({ apiKey }) : openai;
  const extractionPrompt = `Analyze this conversation and extract memorable information using a structured categorization system.

User: ${userMessage}
Assistant: ${assistantMessage}

## LONG-TERM MEMORY Categories:

### Personal
- **identity**: Full name, nicknames, pronouns, age, birthday
- **location**: Current city, country, timezone, previous locations  
- **background**: Birthplace, nationality, languages, cultural background
- **physical**: Health conditions, disabilities, allergies, dietary restrictions
- **personality**: Traits, MBTI type, values, communication style

### Professional  
- **career**: Current job title, company, industry, work schedule
- **expertise**: Skills, certifications, education, specializations
- **history**: Previous jobs, career transitions, major projects
- **goals**: Career aspirations, desired role changes, skill development

### Relationships
- **family**: Spouse/partner, children, parents, siblings, extended family
- **social**: Close friends, social circles, community involvement
- **professional**: Colleagues, mentors, business partners, clients
- **pets**: Pet names, types, care requirements

### Preferences
- **interests**: Hobbies, passions, entertainment preferences
- **lifestyle**: Daily routines, habits, living situation
- **technology**: Devices used, platforms preferred, tech comfort level
- **communication**: Preferred contact methods, response style, formality
- **learning**: Learning style, preferred formats, topics of interest

### Events
- **recurring**: Birthdays, anniversaries, regular appointments
- **upcoming**: Planned events, deadlines, milestones
- **historical**: Important past events, achievements, life changes

### Context
- **financial**: Budget ranges, financial goals, spending priorities
- **constraints**: Time zones, availability, schedule constraints, limitations

## SHORT-TERM MEMORY Categories:

### Conversation
- **current_topic**: What we're discussing right now
- **recent_questions**: Questions asked in this session
- **clarifications**: Specific details provided for current task
- **working_memory**: Temporary data, calculations, draft content

### Task Progress
- **active_projects**: Multi-step tasks in progress
- **decisions_made**: Choices confirmed in this conversation
- **next_steps**: Agreed upon actions for near future

### Emotional Context
- **current_mood**: User's expressed emotional state
- **concerns**: Worries or issues raised this session

### Session Metadata
- **preferences_stated**: Temporary preferences for this task
- **tools_used**: APIs, integrations accessed this session

Return JSON with this exact structure:
{
  "short_term": [
    {
      "display": "Natural language description",
      "tags": ["tag1", "tag2"]
    }
  ],
  "long_term": [
    {
      "category": "personal|professional|relationships|preferences|events|context",
      "key": "snake_case_identifier",
      "value": "actual_value",
      "display": "Natural language description",
      "importance": 1-5
    }
  ]
}

Examples:
- "My name is Sarah" \u2192 LONG-TERM: category="personal", key="full_name", value="Sarah"
- "I own a restaurant" \u2192 LONG-TERM: category="professional", key="business_type", value="restaurant"
- "My wife's birthday is June 5th" \u2192 LONG-TERM: category="events", key="wife_birthday", value="June 5th"
- "I'm asking about marketing" \u2192 SHORT-TERM: conversation context
- "For this project, make it formal" \u2192 SHORT-TERM: session preferences

Only extract clear, factual information. Be very selective.`;
  try {
    const response = await client.responses.create({
      model: "gpt-4",
      input: [
        { role: "system", content: "Extract memories from the conversation following the JSON format specified." },
        { role: "user", content: extractionPrompt }
      ],
      temperature: 0.7,
      max_output_tokens: 1e3
    });
    let content = '{"short_term":[],"long_term":[]}';
    if (response.output && Array.isArray(response.output)) {
      for (const output of response.output) {
        if (output.role === "assistant" && output.content && output.content[0]?.text) {
          content = output.content[0].text;
          break;
        }
      }
      if (content === '{"short_term":[],"long_term":[]}' && response.output[0]?.content?.[0]?.text) {
        content = response.output[0].content[0].text;
      }
    }
    console.log("\u{1F4DD} Raw extraction response:", content);
    let cleanedContent = content;
    if (content.includes("```json")) {
      cleanedContent = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    }
    try {
      const extracted = JSON.parse(cleanedContent);
      console.log("\u{1F4DD} Parsed memories:", extracted);
      return extracted;
    } catch (parseError) {
      console.error("\u274C Failed to parse memory extraction response:", parseError);
      console.error("Raw content was:", content);
      return { short_term: [], long_term: [] };
    }
  } catch (error) {
    console.error("\u274C Memory extraction error:", error);
    return { short_term: [], long_term: [] };
  }
}
function buildMemoryContext(shortTerm, longTerm) {
  let context = "";
  if (longTerm?.length > 0) {
    context += "Long-term memories:\n";
    longTerm.forEach((m) => {
      context += `- ${m.display_text || `${m.key}: ${m.value}`}
`;
    });
  }
  if (shortTerm?.length > 0) {
    context += "\nRecent conversation context:\n";
    shortTerm.slice(0, 5).forEach((m) => {
      context += `- ${m.display_text || m.message}
`;
    });
  }
  return context;
}
async function registerRoutes(app2) {
  app2.post("/api/chat/stream", async (req, res) => {
    try {
      console.log("\u{1F4E8} Received request body:", {
        hasMessage: !!req.body.message,
        hasApiKey: !!req.body.apiKey,
        hasModel: !!req.body.model,
        hasUserId: !!req.body.userId,
        hasThreadId: !!req.body.threadId,
        userId: req.body.userId,
        threadId: req.body.threadId
      });
      const { message, apiKey, model, userId, threadId } = req.body;
      const parsedData = chatRequestSchema.parse({ message, apiKey, model });
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control"
      });
      console.log("\u{1F50D} Request data:", {
        hasUserId: !!userId,
        hasThreadId: !!threadId,
        userId,
        threadId,
        messageLength: message?.length
      });
      if (userId && threadId) {
        console.log("\u{1F4BE} Attempting to save user message to chat_messages...", {
          thread_id: threadId,
          user_id: userId,
          role: "user",
          content_length: message.length,
          model: model || "o4-mini"
        });
        const { data, error } = await supabaseAdmin.from("chat_messages").insert({
          thread_id: threadId,
          role: "user",
          content: message,
          metadata: { model: model || "o4-mini", user_id: userId }
        }).select();
        if (error) {
          console.error("\u274C Failed to save user message to chat_messages:", {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            thread_id: threadId,
            user_id: userId
          });
        } else {
          console.log("\u2705 User message saved to chat_messages:", data);
        }
      } else {
        console.log("\u26A0\uFE0F Skipping user message save - missing userId or threadId:", { userId, threadId });
      }
      await storage.createMessage({
        content: message,
        role: "user"
      });
      let memoryContext = "";
      if (userId && threadId) {
        console.log("\u2705 User ID and Thread ID present, fetching memories...");
        const { shortTermMemories, longTermMemories } = await fetchMemories(userId, threadId, message, apiKey);
        memoryContext = buildMemoryContext(shortTermMemories, longTermMemories);
        console.log("\u{1F4CB} Memory context built:", memoryContext ? "Has context" : "No context");
      } else {
        console.log("\u26A0\uFE0F Missing userId or threadId, skipping memory fetch");
      }
      const activeApiKey = apiKey || process.env.OPENAI_API_KEY;
      const activeModel = model || "o4-mini";
      let assistantMessage = "";
      if (activeApiKey && activeApiKey !== "demo_key") {
        try {
          const userOpenai = new OpenAI({ apiKey: activeApiKey });
          const systemContent = memoryContext ? `You are a helpful AI assistant. Provide clear, concise, and helpful responses. You can use markdown formatting in your responses.

Context from memory:
${memoryContext}` : "You are a helpful AI assistant. Provide clear, concise, and helpful responses. You can use markdown formatting in your responses.";
          const isReasoningModel = /^(o[1-9]|gpt-4\.1)/i.test(activeModel);
          console.log(`\u{1F50D} Model: ${activeModel}, isReasoningModel: ${isReasoningModel}`);
          const messages2 = [
            { role: "system", content: systemContent },
            { role: "user", content: message }
          ];
          const requestParams = {
            model: activeModel,
            input: messages2,
            max_output_tokens: 1e3
          };
          if (!isReasoningModel) {
            console.log(`\u2705 Adding temperature for non-reasoning model: ${activeModel}`);
            requestParams.temperature = 0.7;
            requestParams.top_p = 1;
          } else {
            console.log(`\u{1F6AB} Skipping temperature for reasoning model: ${activeModel}`);
          }
          const respAny = await userOpenai.responses.create(requestParams);
          let responseText = "";
          if (respAny.output && Array.isArray(respAny.output)) {
            for (const output of respAny.output) {
              if (output.role === "assistant" && output.content && output.content[0]?.text) {
                responseText = output.content[0].text;
                break;
              }
            }
            if (!responseText && respAny.output[0]?.content?.[0]?.text) {
              responseText = respAny.output[0].content[0].text;
            }
          }
          let totalTokens = respAny.usage?.total_tokens || 0;
          console.log(`\u{1F4DD} Extracted response length: ${responseText.length}, preview: ${responseText.substring(0, 100)}...`);
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
          if (userId && threadId) {
            console.log("\u{1F4BE} Attempting to save assistant message to chat_messages...", {
              thread_id: threadId,
              role: "assistant",
              content_length: assistantMessage.length,
              model: activeModel,
              token_count: totalTokens
            });
            const { data, error } = await supabaseAdmin.from("chat_messages").insert({
              thread_id: threadId,
              role: "assistant",
              content: assistantMessage,
              metadata: {
                model: activeModel,
                token_count: totalTokens,
                user_id: userId
              }
            }).select();
            if (error) {
              console.error("\u274C Failed to save assistant message to chat_messages:", {
                error: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                thread_id: threadId,
                user_id: userId
              });
            } else {
              console.log("\u2705 Assistant message saved to chat_messages:", data);
            }
          }
          if (userId && threadId) {
            console.log("\u{1F3AF} Attempting to extract and save memories...");
            const extractedMemories = await extractMemories(message, assistantMessage, apiKey);
            console.log("\u{1F4CA} Extracted memories:", {
              shortTermCount: extractedMemories.short_term?.length || 0,
              longTermCount: extractedMemories.long_term?.length || 0,
              shortTermMemories: extractedMemories.short_term,
              longTermMemories: extractedMemories.long_term
            });
            if (extractedMemories.short_term.length > 0) {
              console.log(`\u{1F4BE} Saving ${extractedMemories.short_term.length} short-term memories...`);
              for (const memory of extractedMemories.short_term) {
                const { error } = await supabaseAdmin.from("short_term_memory").insert({
                  user_id: userId,
                  thread_id: threadId,
                  message: memory.display,
                  display_text: memory.display,
                  sender: "system",
                  tags: memory.tags || ["auto-captured"],
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  metadata: { auto_captured: true }
                });
                if (error) {
                  console.error("\u274C Short-term memory save error:", error);
                }
              }
            }
            if (extractedMemories.long_term.length > 0) {
              console.log(`\u{1F4BE} Saving ${extractedMemories.long_term.length} long-term memories...`);
              for (const memory of extractedMemories.long_term) {
                const embedding = await generateEmbedding(memory.value, apiKey);
                const { error } = await supabaseAdmin.from("long_term_memory").insert({
                  user_id: userId,
                  category: memory.category,
                  key: memory.key,
                  value: memory.value,
                  display_text: memory.display,
                  importance: memory.importance,
                  embedding,
                  metadata: {
                    auto_captured: true,
                    subcategory: memory.key.split("_")[0],
                    // Extract subcategory from key
                    extracted_from: "conversation"
                  }
                });
                if (error) {
                  console.error("\u274C Long-term memory save error:", error);
                } else {
                  console.log("\u2705 Long-term memory saved:", {
                    category: memory.category,
                    key: memory.key,
                    value: memory.value,
                    importance: memory.importance
                  });
                }
              }
            }
            res.write(`data: ${JSON.stringify({
              type: "memory_update",
              memories: extractedMemories
            })}

`);
          } else {
            console.log("\u26A0\uFE0F Skipping memory extraction - missing userId or threadId");
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
      const { message, apiKey, model, userId, threadId } = req.body;
      const parsedData = chatRequestSchema.parse({ message, apiKey, model });
      if (userId && threadId) {
        console.log("\u{1F4BE} [NON-STREAMING] Attempting to save user message to chat_messages...", {
          thread_id: threadId,
          user_id: userId,
          role: "user",
          content_length: message.length,
          model: model || "o4-mini"
        });
        const { data, error } = await supabaseAdmin.from("chat_messages").insert({
          thread_id: threadId,
          user_id: userId,
          role: "user",
          content: message,
          metadata: { model: model || "o4-mini" }
        }).select();
        if (error) {
          console.error("\u274C [NON-STREAMING] Failed to save user message to chat_messages:", {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            thread_id: threadId,
            user_id: userId
          });
        } else {
          console.log("\u2705 [NON-STREAMING] User message saved to chat_messages:", data);
        }
      } else {
        console.log("\u26A0\uFE0F [NON-STREAMING] Skipping user message save - missing userId or threadId:", { userId, threadId });
      }
      await storage.createMessage({
        content: message,
        role: "user"
      });
      let memoryContext = "";
      if (userId && threadId) {
        const { shortTermMemories, longTermMemories } = await fetchMemories(userId, threadId, message, apiKey);
        memoryContext = buildMemoryContext(shortTermMemories, longTermMemories);
      }
      let assistantMessage;
      const activeApiKey = apiKey || process.env.OPENAI_API_KEY;
      const activeModel = model || "o4-mini";
      if (activeApiKey && activeApiKey !== "demo_key") {
        try {
          const userOpenai = new OpenAI({ apiKey: activeApiKey });
          const systemContent = memoryContext ? `You are a helpful AI assistant. Provide clear, concise, and helpful responses. You can use markdown formatting in your responses.

Context from memory:
${memoryContext}` : "You are a helpful AI assistant. Provide clear, concise, and helpful responses. You can use markdown formatting in your responses.";
          const isReasoningModel = /^(o[1-9]|gpt-4\.1)/i.test(activeModel);
          console.log(`\u{1F50D} Model: ${activeModel}, isReasoningModel: ${isReasoningModel}`);
          const messages2 = [
            { role: "system", content: systemContent },
            { role: "user", content: message }
          ];
          const requestParams = {
            model: activeModel,
            input: messages2,
            max_output_tokens: 1e3
          };
          if (!isReasoningModel) {
            console.log(`\u2705 Adding temperature for non-reasoning model: ${activeModel}`);
            requestParams.temperature = 0.7;
            requestParams.top_p = 1;
          } else {
            console.log(`\u{1F6AB} Skipping temperature for reasoning model: ${activeModel}`);
          }
          const respAny = await userOpenai.responses.create(requestParams);
          let responseText = "";
          if (respAny.output && Array.isArray(respAny.output)) {
            for (const output of respAny.output) {
              if (output.role === "assistant" && output.content && output.content[0]?.text) {
                responseText = output.content[0].text;
                break;
              }
            }
            if (!responseText && respAny.output[0]?.content?.[0]?.text) {
              responseText = respAny.output[0].content[0].text;
            }
          }
          let totalTokens = respAny.usage?.total_tokens || 0;
          console.log(`\u{1F4DD} Extracted response length: ${responseText.length}, preview: ${responseText.substring(0, 100)}...`);
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
          if (userId && threadId) {
            console.log("\u{1F4BE} Attempting to save assistant message to chat_messages...", {
              thread_id: threadId,
              role: "assistant",
              content_length: assistantMessage.length,
              model: activeModel,
              token_count: totalTokens
            });
            const { data, error } = await supabaseAdmin.from("chat_messages").insert({
              thread_id: threadId,
              role: "assistant",
              content: assistantMessage,
              metadata: {
                model: activeModel,
                token_count: totalTokens,
                user_id: userId
              }
            }).select();
            if (error) {
              console.error("\u274C Failed to save assistant message to chat_messages:", {
                error: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                thread_id: threadId,
                user_id: userId
              });
            } else {
              console.log("\u2705 Assistant message saved to chat_messages:", data);
            }
          }
          if (userId && threadId) {
            const extractedMemories = await extractMemories(message, assistantMessage, apiKey);
            for (const memory of extractedMemories.short_term) {
              await supabaseAdmin.from("short_term_memory").insert({
                thread_id: threadId,
                message: memory.display,
                display_text: memory.display,
                sender: "system",
                tags: memory.tags || ["auto-captured"],
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                metadata: { auto_captured: true }
              });
            }
            for (const memory of extractedMemories.long_term) {
              const embedding = await generateEmbedding(memory.value, apiKey);
              await supabaseAdmin.from("long_term_memory").insert({
                category: memory.category,
                key: memory.key,
                value: memory.value,
                display_text: memory.display,
                importance: memory.importance,
                embedding,
                metadata: { auto_captured: true }
              });
            }
          }
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
  if (process.env.NODE_ENV !== "production") {
    app2.post("/api/chat/threads", async (req, res) => {
      try {
        const { user_id, thread_id, title } = req.body;
        if (!user_id || !thread_id) {
          return res.status(400).json({ error: "user_id and thread_id are required" });
        }
        if (!supabaseAdmin) {
          console.error("\u274C Supabase admin client is not initialized");
          return res.status(500).json({
            error: "Database connection not configured",
            details: "Supabase admin client not initialized"
          });
        }
        const { data, error } = await supabaseAdmin.from("chat_threads").insert({
          user_id,
          thread_id,
          title: title || "New Chat",
          metadata: {}
        }).select().single();
        if (error) {
          console.error("Error creating chat thread:", {
            error,
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          return res.status(500).json({
            error: "Failed to create thread",
            code: error.code,
            message: error.message
          });
        }
        res.json(data);
      } catch (error) {
        console.error("Create thread endpoint error:", error);
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    });
    app2.get("/api/chat/threads", async (req, res) => {
      try {
        const { user_id } = req.query;
        if (!user_id) {
          return res.status(400).json({ error: "user_id is required" });
        }
        const { data, error } = await supabaseAdmin.from("chat_threads").select("*").eq("user_id", user_id).eq("archived", false).order("updated_at", { ascending: false });
        if (error) {
          console.error("Error fetching threads:", error);
          return res.status(500).json({ error: "Failed to fetch threads" });
        }
        res.json(data || []);
      } catch (error) {
        console.error("Fetch threads endpoint error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    app2.get("/api/chat/threads/:threadId", async (req, res) => {
      try {
        const { threadId } = req.params;
        const { user_id } = req.query;
        if (!user_id) {
          return res.status(400).json({ error: "user_id is required" });
        }
        const { data: thread, error: threadError } = await supabaseAdmin.from("chat_threads").select("*").eq("thread_id", threadId).eq("user_id", user_id).single();
        if (threadError || !thread) {
          return res.status(404).json({ error: "Thread not found" });
        }
        const { data: messages2, error: messagesError } = await supabaseAdmin.from("chat_messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
        if (messagesError) {
          console.error("Error fetching messages:", messagesError);
          return res.status(500).json({ error: "Failed to fetch messages" });
        }
        res.json({
          ...thread,
          messages: messages2 || []
        });
      } catch (error) {
        console.error("Fetch thread endpoint error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    app2.delete("/api/chat/threads/:threadId", async (req, res) => {
      try {
        const { threadId } = req.params;
        const { error } = await supabaseAdmin.from("chat_threads").update({
          archived: true,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("thread_id", threadId);
        if (error) {
          console.error("Error archiving thread:", error);
          return res.status(500).json({ error: "Failed to archive thread" });
        }
        res.json({ success: true });
      } catch (error) {
        console.error("Delete thread endpoint error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
  }
  app2.get("/api/memory/short-term", async (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }
      const { data, error } = await supabaseAdmin.from("short_term_memory").select("*").eq("user_id", user_id).order("timestamp", { ascending: false });
      if (error) {
        console.error("Error fetching short-term memories:", error);
        return res.status(500).json({ error: "Failed to fetch memories" });
      }
      const processedData = (data || []).map((memory) => ({
        ...memory,
        display_text: memory.display_text || memory.message || ""
      }));
      res.json(processedData);
    } catch (error) {
      console.error("Short-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/memory/long-term", async (req, res) => {
    try {
      const { user_id } = req.query;
      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }
      const { data, error } = await supabaseAdmin.from("long_term_memory").select("*").eq("user_id", user_id).order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching long-term memories:", error);
        return res.status(500).json({ error: "Failed to fetch memories" });
      }
      res.json(data || []);
    } catch (error) {
      console.error("Long-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/memory/short-term", async (req, res) => {
    try {
      const { user_id, display_text, thread_id } = req.body;
      if (!user_id || !display_text) {
        return res.status(400).json({ error: "user_id and display_text are required" });
      }
      const newMemory = {
        user_id,
        thread_id: thread_id || nanoid(),
        // Use provided thread_id or generate new one
        message: display_text,
        display_text,
        sender: "user",
        tags: ["user-created"],
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        metadata: { auto_captured: false }
      };
      const { data, error } = await supabaseAdmin.from("short_term_memory").insert(newMemory).select().single();
      if (error) {
        console.error("Error creating short-term memory:", error);
        return res.status(500).json({
          error: "Failed to create memory",
          details: error.message
        });
      }
      res.json(data);
    } catch (error) {
      console.error("Create short-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/memory/long-term", async (req, res) => {
    try {
      const { user_id, display_text } = req.body;
      if (!user_id || !display_text) {
        return res.status(400).json({ error: "user_id and display_text are required" });
      }
      const key = display_text.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 50);
      const value = display_text;
      const embedding = await generateEmbedding(value);
      const newMemory = {
        user_id,
        category: "personal",
        key,
        value,
        display_text,
        importance: 3,
        embedding,
        metadata: { auto_captured: false }
      };
      const { data, error } = await supabaseAdmin.from("long_term_memory").insert(newMemory).select().single();
      if (error) {
        console.error("Error creating long-term memory:", error);
        return res.status(500).json({ error: "Failed to create memory" });
      }
      res.json(data);
    } catch (error) {
      console.error("Create long-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/memory/short-term/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { display_text } = req.body;
      if (!display_text) {
        return res.status(400).json({ error: "display_text is required" });
      }
      const { data, error } = await supabaseAdmin.from("short_term_memory").update({
        message: display_text,
        display_text
      }).eq("id", id).select().single();
      if (error) {
        console.error("Error updating short-term memory:", error);
        return res.status(500).json({ error: "Failed to update memory" });
      }
      res.json(data);
    } catch (error) {
      console.error("Update short-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/memory/long-term/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { display_text } = req.body;
      if (!display_text) {
        return res.status(400).json({ error: "display_text is required" });
      }
      const { data, error } = await supabaseAdmin.from("long_term_memory").update({
        display_text,
        last_updated: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id).select().single();
      if (error) {
        console.error("Error updating long-term memory:", error);
        return res.status(500).json({ error: "Failed to update memory" });
      }
      res.json(data);
    } catch (error) {
      console.error("Update long-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/memory/short-term/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from("short_term_memory").delete().eq("id", id);
      if (error) {
        console.error("Error deleting short-term memory:", error);
        return res.status(500).json({ error: "Failed to delete memory" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete short-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.delete("/api/memory/long-term/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from("long_term_memory").delete().eq("id", id);
      if (error) {
        console.error("Error deleting long-term memory:", error);
        return res.status(500).json({ error: "Failed to delete memory" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete long-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
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
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-toast"],
          motion: ["framer-motion"]
        }
      }
    }
  }
});

// server/vite.ts
import { nanoid as nanoid2 } from "nanoid";
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
    hmr: { server }
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
  app2.use("/api/*", (req, res) => {
    console.log(`API route not found: ${req.originalUrl}`);
    res.status(404).json({ error: "API endpoint not found", path: req.originalUrl });
  });
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    if (url.startsWith("/api/")) {
      return next();
    }
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
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
  app2.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
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
  app2.use("*", (req, res) => {
    if (req.originalUrl.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var serverEnvPath = join(__dirname, ".env");
console.log("\u{1F50D} Loading environment variables...");
console.log("\u{1F4C1} Server .env path:", serverEnvPath);
var serverResult = dotenv.config({ path: serverEnvPath });
if (serverResult.error) {
  console.log("\u274C Server .env not found or error:", serverResult.error.message);
  console.log("\u26A0\uFE0F  Please create a .env file in the server/ directory");
} else {
  console.log("\u2705 Server .env loaded successfully");
}
console.log("\u{1F50D} Environment variables check:");
console.log("- SUPABASE_URL:", process.env.SUPABASE_URL ? "\u2705 Set" : "\u274C Not set");
console.log("- SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "\u2705 Set" : "\u274C Not set");
console.log("- OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "\u2705 Set" : "\u274C Not set");
console.log("- PORT:", process.env.PORT || "Not set (will use 8000)");
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
