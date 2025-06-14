import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  : null;

// Helper to generate embeddings
async function generateEmbedding(text: string, apiKey?: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

// Fetch relevant memories
async function fetchMemories(userId: string, threadId: string, userMessage: string, apiKey?: string) {
  if (!supabaseAdmin) return { shortTermMemories: [], longTermMemories: [] };
  
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
  }

  // 2. Get relevant long-term memories using semantic search
  let longTermMemories = [];
  try {
    const messageEmbedding = await generateEmbedding(userMessage, apiKey);
    
    const { data, error: longError } = await supabaseAdmin.rpc('match_memories', {
      query_embedding: messageEmbedding,
      match_threshold: 0.7,
      match_count: 5,
      user_id: userId
    });
    
    if (longError) {
      console.error('❌ Long-term memory fetch error:', longError);
    } else {
      longTermMemories = data || [];
    }
  } catch (error) {
    console.error('❌ Error generating embedding:', error);
  }

  return {
    shortTermMemories: shortTermMemories || [],
    longTermMemories: longTermMemories || []
  };
}

// Process memories for context
function processMemoriesForContext(memories: any) {
  const { shortTermMemories, longTermMemories } = memories;
  
  let contextParts = [];
  
  if (shortTermMemories.length > 0) {
    const shortTermContext = shortTermMemories
      .map((m: any) => `[${new Date(m.timestamp).toLocaleString()}] ${m.sender}: ${m.message}`)
      .join('\n');
    contextParts.push(`Recent conversation history:\n${shortTermContext}`);
  }
  
  if (longTermMemories.length > 0) {
    const longTermContext = longTermMemories
      .map((m: any) => `- ${m.display_text || m.value}`)
      .join('\n');
    contextParts.push(`Relevant information from memory:\n${longTermContext}`);
  }
  
  return contextParts.length > 0 ? contextParts.join('\n\n') : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, apiKey, model, userId, threadId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Initialize OpenAI with provided API key or default
    const openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || 'demo_key'
    });

    // Fetch memories if we have user and thread info
    let memoryContext = null;
    if (userId && threadId && supabaseAdmin) {
      const memories = await fetchMemories(userId, threadId, message, apiKey);
      memoryContext = processMemoriesForContext(memories);
    }

    // Build messages array
    const messages: any[] = [];
    
    // Add memory context as system message if available
    if (memoryContext) {
      messages.push({
        role: 'system',
        content: `You are Kai, a helpful AI assistant. Here is some context from our previous conversations:\n\n${memoryContext}\n\nUse this context to provide more personalized and relevant responses.`
      });
    } else {
      messages.push({
        role: 'system',
        content: 'You are Kai, a helpful AI assistant. Be helpful, harmless, and honest.'
      });
    }
    
    // Add user message
    messages.push({ role: 'user', content: message });

    // Use responses API for ALL models
    const activeModel = model || 'gpt-4';
    const isReasoningModel = /^(o1)/i.test(activeModel);
    
    const systemContent = messages.find(m => m.role === 'system')?.content || '';
    const userContent = messages.find(m => m.role === 'user')?.content || '';
    
    const requestParams: any = {
      model: activeModel,
      instructions: systemContent,
      input: userContent,
      max_output_tokens: 2000
    };

    // Only add temperature and top_p for non-reasoning models
    if (!isReasoningModel) {
      requestParams.temperature = 0.7;
      requestParams.top_p = 1;
    }
    
    const response = await (openai as any).responses.create(requestParams);
    const fullResponse = response.output?.[0]?.content?.[0]?.text || '';
    
    // Stream the response word by word to simulate streaming
    const words = fullResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      const word = i === 0 ? words[i] : ' ' + words[i];
      res.write(`data: ${JSON.stringify({ content: word })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Save the conversation to database if we have the necessary info
    if (userId && threadId && supabaseAdmin) {
      // Save user message
      await supabaseAdmin
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          role: 'user',
          content: message,
          metadata: { user_id: userId }
        });

      // Save assistant response
      await supabaseAdmin
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          role: 'assistant',
          content: fullResponse,
          metadata: { user_id: userId, model: activeModel }
        });

      // Extract and save memories
      // For now, just save the exchange as short-term memory
      await supabaseAdmin
        .from('short_term_memory')
        .insert([
          {
            user_id: userId,
            thread_id: threadId,
            message: message,
            display_text: message,
            sender: 'user',
            tags: []
          },
          {
            user_id: userId,
            thread_id: threadId,
            message: fullResponse,
            display_text: fullResponse.substring(0, 200) + (fullResponse.length > 200 ? '...' : ''),
            sender: 'assistant',
            tags: []
          }
        ]);

      // Send memory update notification
      res.write(`data: ${JSON.stringify({ 
        type: 'memory_update',
        memories: {
          short_term: [{ type: 'conversation', saved: true }]
        }
      })}\n\n`);
    }

    // Send done signal
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error: any) {
    console.error('Stream error:', error);
    
    // If headers haven't been sent yet, send error as JSON
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
      });
    } else {
      // If streaming has started, send error in stream
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
}