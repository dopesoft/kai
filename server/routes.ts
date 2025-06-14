import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatRequestSchema, type ChatResponse } from "@shared/schema";
import OpenAI from "openai";
import { supabase, supabaseAdmin } from './supabase';
import { nanoid } from 'nanoid';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "demo_key"
});

// Helper to generate embeddings
async function generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
  const client = apiKey ? new OpenAI({ apiKey }) : openai;
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// Fetch relevant memories
async function fetchMemories(userId: string, threadId: string, userMessage: string, apiKey?: string) {
  console.log('🔍 Fetching memories for:', { userId, threadId });
  
  // 1. Get recent short-term memories for this thread
  const { data: shortTermMemories, error: shortError } = await supabaseAdmin
    .from('short_term_memory')
    .select('*')
    .eq('user_id', userId)
    .eq('thread_id', threadId)
    .order('timestamp', { ascending: false })
    .limit(10);

  if (shortError) {
    console.error('❌ Short-term memory fetch error:', shortError);
  } else {
    console.log('✅ Short-term memories found:', shortTermMemories?.length || 0);
  }

  // 2. Get relevant long-term memories using semantic search
  const messageEmbedding = await generateEmbedding(userMessage, apiKey);
  
  const { data: longTermMemories, error: longError } = await supabaseAdmin.rpc('match_memories', {
    query_embedding: messageEmbedding,
    match_threshold: 0.7,
    match_count: 5,
    user_id: userId
  });

  if (longError) {
    console.error('❌ Long-term memory fetch error:', longError);
  } else {
    console.log('✅ Long-term memories found:', longTermMemories?.length || 0);
  }

  return { shortTermMemories, longTermMemories };
}

// Extract memories from conversation
async function extractMemories(userMessage: string, assistantMessage: string, apiKey?: string) {
  console.log('🧠 Extracting memories from conversation...');
  
  const client = apiKey ? new OpenAI({ apiKey }) : openai;
  
  const extractionPrompt = `Look at this conversation and identify anything worth remembering.

User: ${userMessage}
Assistant: ${assistantMessage}

Return a JSON object with:
- "short_term": temporary context about THIS conversation with:
  - display: natural language version of the context
  - tags: relevant tags as array
- "long_term": permanent facts about the user with:
  - category: type of information (personal, dates, preferences, goals, context)
  - key: snake_case identifier
  - value: the actual value
  - display: natural language version
  - importance: 1-5

Example response:
{
  "short_term": [
    {
      "display": "User is planning a birthday party for their wife",
      "tags": ["birthday", "planning", "wife"]
    }
  ],
  "long_term": [
    {
      "category": "personal",
      "key": "wife_name", 
      "value": "Ariana",
      "display": "My wife's name is Ariana",
      "importance": 5
    },
    {
      "category": "dates",
      "key": "wife_birthday",
      "value": "September 12",
      "display": "My wife Ariana's birthday is September 12th",
      "importance": 5
    }
  ]
}

Be smart about what matters. Generate natural, conversational display text.`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: extractionPrompt }],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '{"short_term":[],"long_term":[]}';
    console.log('📝 Raw extraction response:', content);
    
    const extracted = JSON.parse(content);
    console.log('📝 Parsed memories:', extracted);
    return extracted;
  } catch (error) {
    console.error('❌ Memory extraction error:', error);
    return { short_term: [], long_term: [] };
  }
}

// Helper to format memories into context
function buildMemoryContext(shortTerm: any[], longTerm: any[]): string {
  let context = '';

  if (longTerm?.length > 0) {
    context += 'Long-term memories:\n';
    longTerm.forEach(m => {
      context += `- ${m.display_text || `${m.key}: ${m.value}`}\n`;
    });
  }

  if (shortTerm?.length > 0) {
    context += '\nRecent conversation context:\n';
    shortTerm.slice(0, 5).forEach(m => {
      context += `- ${m.display_text || m.message}\n`;
    });
  }

  return context;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat streaming endpoint with memory
  app.post("/api/chat/stream", async (req, res) => {
    try {
      // First, let's see what we're receiving
      console.log('📨 Received request body:', {
        hasMessage: !!req.body.message,
        hasApiKey: !!req.body.apiKey,
        hasModel: !!req.body.model,
        hasUserId: !!req.body.userId,
        hasThreadId: !!req.body.threadId,
        userId: req.body.userId,
        threadId: req.body.threadId
      });

      const { message, apiKey, model, userId, threadId } = req.body;
      
      // Parse only the required fields
      const parsedData = chatRequestSchema.parse({ message, apiKey, model });

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Save user message to database if userId provided
      if (userId && threadId) {
        await supabaseAdmin.from('chat_messages').insert({
          thread_id: threadId,
          user_id: userId,
          role: 'user',
          content: message,
          metadata: { model: model || 'o4-mini' }
        });
      }

      // Store user message in local storage (for backward compatibility)
      await storage.createMessage({
        content: message,
        role: "user"
      });

      // Fetch memories if userId and threadId provided
      let memoryContext = '';
      if (userId && threadId) {
        console.log('✅ User ID and Thread ID present, fetching memories...');
        const { shortTermMemories, longTermMemories } = await fetchMemories(userId, threadId, message, apiKey);
        memoryContext = buildMemoryContext(shortTermMemories, longTermMemories);
        console.log('📋 Memory context built:', memoryContext ? 'Has context' : 'No context');
      } else {
        console.log('⚠️ Missing userId or threadId, skipping memory fetch');
      }

      const activeApiKey = apiKey || process.env.OPENAI_API_KEY;
      const activeModel = model || "o4-mini";

      let assistantMessage = "";

      // Add thinking delay
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

      if (activeApiKey && activeApiKey !== "demo_key") {
        try {
          const userOpenai = new OpenAI({ apiKey: activeApiKey });

          // Enhanced system prompt with memory context
          const systemContent = memoryContext 
            ? `You are a helpful AI assistant. Provide clear, concise, and helpful responses. You can use markdown formatting in your responses.\n\nContext from memory:\n${memoryContext}`
            : "You are a helpful AI assistant. Provide clear, concise, and helpful responses. You can use markdown formatting in your responses.";

          const response = await userOpenai.chat.completions.create({
            model: activeModel,
            messages: [
              {
                role: "system",
                content: systemContent
              },
              {
                role: "user",
                content: message
              }
            ],
            temperature: 0.7,
            max_completion_tokens: 1000,
            top_p: 1
          });

          const responseText = response.choices[0]?.message?.content || "";
          assistantMessage = responseText;

          // Stream the response
          const words = responseText.split(' ');
          let currentText = "";
          
          for (let i = 0; i < words.length; i++) {
            const wordToAdd = i === 0 ? words[i] : ' ' + words[i];
            currentText += wordToAdd;
            res.write(`data: ${JSON.stringify({ content: wordToAdd, done: false })}\n\n`);
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          // Save assistant message to database
          if (userId && threadId) {
            await supabaseAdmin.from('chat_messages').insert({
              thread_id: threadId,
              user_id: userId,
              role: 'assistant',
              content: assistantMessage,
              metadata: { 
                model: activeModel,
                token_count: response.usage?.total_tokens || 0
              }
            });
          }

          // Extract and save memories if userId/threadId provided
          if (userId && threadId) {
            console.log('🎯 Attempting to extract and save memories...');
            const extractedMemories = await extractMemories(message, assistantMessage, apiKey);

            // Save short-term memories
            if (extractedMemories.short_term.length > 0) {
              console.log(`💾 Saving ${extractedMemories.short_term.length} short-term memories...`);
              for (const memory of extractedMemories.short_term) {
                const { error } = await supabaseAdmin.from('short_term_memory').insert({
                  user_id: userId,
                  thread_id: threadId,
                  message: memory.display,
                  display_text: memory.display,
                  sender: 'system',
                  tags: memory.tags || ['auto-captured'],
                  timestamp: new Date().toISOString(),
                  metadata: { auto_captured: true }
                });
                if (error) {
                  console.error('❌ Short-term memory save error:', error);
                }
              }
            }

            // Save long-term memories with embeddings
            if (extractedMemories.long_term.length > 0) {
              console.log(`💾 Saving ${extractedMemories.long_term.length} long-term memories...`);
              for (const memory of extractedMemories.long_term) {
                const embedding = await generateEmbedding(memory.value, apiKey);
                
                const { error } = await supabaseAdmin.from('long_term_memory').insert({
                  user_id: userId,
                  category: memory.category,
                  key: memory.key,
                  value: memory.value,
                  display_text: memory.display,
                  importance: memory.importance,
                  embedding: embedding,
                  metadata: { auto_captured: true }
                });
                if (error) {
                  console.error('❌ Long-term memory save error:', error);
                }
              }
            }

            // Send memory update notification
            res.write(`data: ${JSON.stringify({ 
              type: 'memory_update',
              memories: extractedMemories 
            })}\n\n`);
          } else {
            console.log('⚠️ Skipping memory extraction - missing userId or threadId');
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

      // Store assistant message in local storage
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

  // Keep your existing non-streaming endpoint with memory support
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, apiKey, model, userId, threadId } = req.body;
      const parsedData = chatRequestSchema.parse({ message, apiKey, model });

      // Save user message to database if userId provided
      if (userId && threadId) {
        await supabaseAdmin.from('chat_messages').insert({
          thread_id: threadId,
          user_id: userId,
          role: 'user',
          content: message,
          metadata: { model: model || 'o4-mini' }
        });
      }

      // Store user message
      await storage.createMessage({
        content: message,
        role: "user"
      });

      // Fetch memories if userId and threadId provided
      let memoryContext = '';
      if (userId && threadId) {
        const { shortTermMemories, longTermMemories } = await fetchMemories(userId, threadId, message, apiKey);
        memoryContext = buildMemoryContext(shortTermMemories, longTermMemories);
      }

      let assistantMessage: string;

      const activeApiKey = apiKey || process.env.OPENAI_API_KEY;
      const activeModel = model || "o4-mini";

      if (activeApiKey && activeApiKey !== "demo_key") {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

          const userOpenai = new OpenAI({ apiKey: activeApiKey });

          // Enhanced system prompt with memory context
          const systemContent = memoryContext 
            ? `You are a helpful AI assistant. Provide clear, concise, and helpful responses. You can use markdown formatting in your responses.\n\nContext from memory:\n${memoryContext}`
            : "You are a helpful AI assistant. Provide clear, concise, and helpful responses. You can use markdown formatting in your responses.";

          const response = await userOpenai.chat.completions.create({
            model: activeModel,
            messages: [
              {
                role: "system",
                content: systemContent
              },
              {
                role: "user",
                content: message
              }
            ],
            temperature: 0.7,
            max_completion_tokens: 1000,
            top_p: 1
          });

          assistantMessage = response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";

          // Save assistant message to database
          if (userId && threadId) {
            await supabaseAdmin.from('chat_messages').insert({
              thread_id: threadId,
              user_id: userId,
              role: 'assistant',
              content: assistantMessage,
              metadata: { 
                model: activeModel,
                token_count: response.usage?.total_tokens || 0
              }
            });
          }

          // Extract and save memories if userId/threadId provided
          if (userId && threadId) {
            const extractedMemories = await extractMemories(message, assistantMessage, apiKey);

            // Save memories (same logic as streaming endpoint)
            for (const memory of extractedMemories.short_term) {
              await supabaseAdmin.from('short_term_memory').insert({
                user_id: userId,
                thread_id: threadId,
                message: memory.display,
                display_text: memory.display,
                sender: 'system',
                tags: memory.tags || ['auto-captured'],
                timestamp: new Date().toISOString(),
                metadata: { auto_captured: true }
              });
            }

            for (const memory of extractedMemories.long_term) {
              const embedding = await generateEmbedding(memory.value, apiKey);
              
              await supabaseAdmin.from('long_term_memory').insert({
                user_id: userId,
                category: memory.category,
                key: memory.key,
                value: memory.value,
                display_text: memory.display,
                importance: memory.importance,
                embedding: embedding,
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

  // Keep your existing messages endpoint
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Messages endpoint error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // ===== NEW CHAT PERSISTENCE ENDPOINTS =====
  
  // Create a new chat thread
  app.post("/api/chat/threads", async (req, res) => {
    try {
      const { user_id, thread_id, title } = req.body;
      
      if (!user_id || !thread_id) {
        return res.status(400).json({ error: "user_id and thread_id are required" });
      }
      
      const { data, error } = await supabaseAdmin
        .from('chat_threads')
        .insert({
          user_id,
          thread_id,
          title: title || 'New Chat',
          metadata: {}
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating chat thread:', error);
        return res.status(500).json({ error: "Failed to create thread" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Create thread endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get all threads for a user
  app.get("/api/chat/threads", async (req, res) => {
    try {
      const { user_id } = req.query;
      
      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }
      
      const { data, error } = await supabaseAdmin
        .from('chat_threads')
        .select('*')
        .eq('user_id', user_id)
        .eq('archived', false)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching threads:', error);
        return res.status(500).json({ error: "Failed to fetch threads" });
      }
      
      res.json(data || []);
    } catch (error) {
      console.error("Fetch threads endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get a specific thread with its messages
  app.get("/api/chat/threads/:threadId", async (req, res) => {
    try {
      const { threadId } = req.params;
      const { user_id } = req.query;
      
      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }
      
      // Get thread details
      const { data: thread, error: threadError } = await supabaseAdmin
        .from('chat_threads')
        .select('*')
        .eq('thread_id', threadId)
        .eq('user_id', user_id)
        .single();
      
      if (threadError || !thread) {
        return res.status(404).json({ error: "Thread not found" });
      }
      
      // Get messages for the thread
      const { data: messages, error: messagesError } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return res.status(500).json({ error: "Failed to fetch messages" });
      }
      
      res.json({
        ...thread,
        messages: messages || []
      });
    } catch (error) {
      console.error("Fetch thread endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update thread title
  app.put("/api/chat/threads/:threadId", async (req, res) => {
    try {
      const { threadId } = req.params;
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "title is required" });
      }
      
      const { data, error } = await supabaseAdmin
        .from('chat_threads')
        .update({ 
          title,
          updated_at: new Date().toISOString()
        })
        .eq('thread_id', threadId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating thread:', error);
        return res.status(500).json({ error: "Failed to update thread" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Update thread endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Delete thread (archive)
  app.delete("/api/chat/threads/:threadId", async (req, res) => {
    try {
      const { threadId } = req.params;
      
      // Archive instead of hard delete
      const { error } = await supabaseAdmin
        .from('chat_threads')
        .update({ 
          archived: true,
          updated_at: new Date().toISOString()
        })
        .eq('thread_id', threadId);
      
      if (error) {
        console.error('Error archiving thread:', error);
        return res.status(500).json({ error: "Failed to archive thread" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete thread endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Memory API endpoints - ALL UPDATED TO USE supabaseAdmin
  
  // Get short term memories for user
  app.get("/api/memory/short-term", async (req, res) => {
    try {
      const { user_id } = req.query;
      
      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }
      
      const { data, error } = await supabaseAdmin
        .from('short_term_memory')
        .select('*')
        .eq('user_id', user_id)
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error fetching short-term memories:', error);
        return res.status(500).json({ error: "Failed to fetch memories" });
      }
      
      // Ensure display_text exists
      const processedData = (data || []).map((memory: any) => ({
        ...memory,
        display_text: memory.display_text || memory.message || ''
      }));
      
      res.json(processedData);
    } catch (error) {
      console.error("Short-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Get long term memories for user
  app.get("/api/memory/long-term", async (req, res) => {
    try {
      const { user_id } = req.query;
      
      if (!user_id) {
        return res.status(400).json({ error: "user_id is required" });
      }
      
      const { data, error } = await supabaseAdmin
        .from('long_term_memory')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching long-term memories:', error);
        return res.status(500).json({ error: "Failed to fetch memories" });
      }
      
      res.json(data || []);
    } catch (error) {
      console.error("Long-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Add new short term memory
  app.post("/api/memory/short-term", async (req, res) => {
    try {
      const { user_id, display_text, thread_id } = req.body;
      
      if (!user_id || !display_text) {
        return res.status(400).json({ error: "user_id and display_text are required" });
      }
      
      const newMemory = {
        user_id,
        thread_id: thread_id || nanoid(), // Use provided thread_id or generate new one
        message: display_text,
        display_text: display_text,
        sender: 'user',
        tags: ['user-created'],
        timestamp: new Date().toISOString(),
        metadata: { auto_captured: false }
      };
      
      const { data, error } = await supabaseAdmin
        .from('short_term_memory')
        .insert(newMemory)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating short-term memory:', error);
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
  
  // Add new long term memory
  app.post("/api/memory/long-term", async (req, res) => {
    try {
      const { user_id, display_text } = req.body;
      
      if (!user_id || !display_text) {
        return res.status(400).json({ error: "user_id and display_text are required" });
      }
      
      // Generate key/value from display_text
      const key = display_text.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);
      const value = display_text;
      
      // Generate embedding for the value
      const embedding = await generateEmbedding(value);
      
      const newMemory = {
        user_id,
        category: 'personal',
        key,
        value,
        display_text,
        importance: 3,
        embedding,
        metadata: { auto_captured: false }
      };
      
      const { data, error } = await supabaseAdmin
        .from('long_term_memory')
        .insert(newMemory)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating long-term memory:', error);
        return res.status(500).json({ error: "Failed to create memory" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Create long-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update short term memory
  app.put("/api/memory/short-term/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { display_text } = req.body;
      
      if (!display_text) {
        return res.status(400).json({ error: "display_text is required" });
      }
      
      const { data, error } = await supabaseAdmin
        .from('short_term_memory')
        .update({ 
          message: display_text,
          display_text: display_text
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating short-term memory:', error);
        return res.status(500).json({ error: "Failed to update memory" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Update short-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Update long term memory
  app.put("/api/memory/long-term/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { display_text } = req.body;
      
      if (!display_text) {
        return res.status(400).json({ error: "display_text is required" });
      }
      
      const { data, error } = await supabaseAdmin
        .from('long_term_memory')
        .update({ 
          display_text,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating long-term memory:', error);
        return res.status(500).json({ error: "Failed to update memory" });
      }
      
      res.json(data);
    } catch (error) {
      console.error("Update long-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Delete short term memory
  app.delete("/api/memory/short-term/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabaseAdmin
        .from('short_term_memory')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting short-term memory:', error);
        return res.status(500).json({ error: "Failed to delete memory" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete short-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Delete long term memory
  app.delete("/api/memory/long-term/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabaseAdmin
        .from('long_term_memory')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting long-term memory:', error);
        return res.status(500).json({ error: "Failed to delete memory" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Delete long-term memory endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Keep your existing generateMockResponse function
function generateMockResponse(prompt: string): string {
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
    "I understand you're looking for information about that. Here are some key points to consider:\n\n• Context is important when addressing this question\n• There are multiple perspectives to consider\n• The best approach depends on your specific needs\n\nWould you like me to elaborate on any particular aspect?",
    "Thank you for that question! This is definitely something worth exploring.\n\n**Key considerations:**\n- Understanding the fundamentals is important\n- Practical application varies by situation\n- There are both benefits and potential challenges\n\nWhat specific aspect interests you most?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}