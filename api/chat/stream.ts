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

// Extract memories from conversation
async function extractMemories(userMessage: string, assistantMessage: string, apiKey?: string) {
  console.log('🧠 Extracting memories from conversation...');
  
  const openai = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
  
  const extractionPrompt = `You are a memory extraction expert. Your job is to identify and extract factual information about a person from conversation.

CONVERSATION:
User: ${userMessage}
Assistant: ${assistantMessage}

TASK: Extract ALL factual information about the user and categorize it correctly.

SCAN FOR THESE FACTS (extract EVERY one you find):

PERSONAL FACTS:
- Names (first, last, nicknames)
- Age or age-related information
- Gender/pronouns
- Location (city, state, country, where they live, where they moved to)
- Background (education, nationality, family origin)
- Life events (moving, traveling, major changes)

PROFESSIONAL FACTS:
- Job titles or roles
- Company names
- Industry or field of work
- Skills or expertise mentioned
- Work history or career details
- Consulting work or side businesses

RELATIONSHIP FACTS:
- Family members mentioned (spouse, wife, husband, children, parents, siblings)
- Professional relationships (colleagues, clients, partners)
- Pets (names, types)
- Relationship status or events

OTHER FACTS:
- Hobbies or interests mentioned
- Personal preferences
- Goals or aspirations (if ongoing/important)
- Important dates or events
- Places they want to visit or explore
- How long they've lived somewhere

CURRENT TASKS/TEMPORARY CONTEXT (short-term only):
- What they're currently trying to do today/this week
- Immediate problems or questions
- Current mood or feelings in this conversation
- Session-specific requests
- Today's plans or activities

EXAMPLE 1: "My name is Khaya, a 41 year old man and I work at staffingreferrals.com as their head of product, I also do tech consulting for Southwest Airlines. I'm currently trying to figure out ways to be more organized."

EXAMPLE 2: "today my wife and i are going to explore Dallas TX, as we moved here 2 years ago and still haven't visited a lot of places."

EXPECTED OUTPUT FOR EXAMPLE 2:
{
  "short_term": [
    {
      "display": "Planning to explore Dallas TX with wife today",
      "tags": ["today_plans", "activities"]
    }
  ],
  "long_term": [
    {
      "category": "relationships",
      "key": "marital_status", 
      "value": "married",
      "display": "User is married (has a wife)",
      "importance": 5
    },
    {
      "category": "personal",
      "key": "current_location",
      "value": "Dallas, TX",
      "display": "Lives in Dallas, TX",
      "importance": 5
    },
    {
      "category": "personal",
      "key": "moved_to_dallas",
      "value": "2 years ago",
      "display": "Moved to Dallas 2 years ago",
      "importance": 4
    }
  ]
}

EXPECTED OUTPUT FOR EXAMPLE 1:
{
  "short_term": [
    {
      "display": "Currently trying to figure out ways to be more organized",
      "tags": ["current_goal", "productivity"]
    }
  ],
  "long_term": [
    {
      "category": "personal",
      "key": "full_name",
      "value": "Khaya",
      "display": "User's name is Khaya",
      "importance": 5
    },
    {
      "category": "personal", 
      "key": "age",
      "value": "41",
      "display": "User is 41 years old",
      "importance": 4
    },
    {
      "category": "personal",
      "key": "gender",
      "value": "man",
      "display": "User identifies as a man",
      "importance": 3
    },
    {
      "category": "professional",
      "key": "current_job_title",
      "value": "head of product",
      "display": "Works as head of product",
      "importance": 5
    },
    {
      "category": "professional",
      "key": "current_company",
      "value": "staffingreferrals.com",
      "display": "Works at staffingreferrals.com",
      "importance": 5
    },
    {
      "category": "professional",
      "key": "consulting_work",
      "value": "tech consulting for Southwest Airlines",
      "display": "Does tech consulting for Southwest Airlines",
      "importance": 4
    }
  ]
}

NOW EXTRACT FROM THE ACTUAL CONVERSATION ABOVE. Be thorough - extract EVERY factual detail about the person.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Extract memories from the conversation following the JSON format specified." },
        { role: "user", content: extractionPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Extract the assistant's response
    let content = '{"short_term":[],"long_term":[]}';
    if (response.choices && response.choices[0]?.message?.content) {
      content = response.choices[0].message.content;
    }
    
    console.log('📝 Raw extraction response:', content);
    
    // Try to clean the response if it has markdown code blocks
    let cleanedContent = content;
    if (content.includes('```json')) {
      cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    }
    
    try {
      const extracted = JSON.parse(cleanedContent);
      console.log('📝 Parsed memories:', extracted);
      return extracted;
    } catch (parseError) {
      console.error('❌ Failed to parse memory extraction response:', parseError);
      console.error('Raw content was:', content);
      return { short_term: [], long_term: [] };
    }
  } catch (error) {
    console.error('❌ Memory extraction error:', error);
    return { short_term: [], long_term: [] };
  }
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
    
    // Fetch previous messages from this thread to maintain context
    if (threadId && supabaseAdmin) {
      console.log('📚 Fetching conversation history for thread:', threadId);
      const { data: previousMessages, error } = await supabaseAdmin
        .from('chat_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Failed to fetch previous messages:', error);
      } else if (previousMessages && previousMessages.length > 0) {
        console.log(`📚 Found ${previousMessages.length} previous messages in thread`);
        // Add all previous messages to maintain full context
        for (const msg of previousMessages) {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
    }
    
    // Add current user message
    messages.push({ role: 'user', content: message });

    // Use chat completions API with streaming
    const activeModel = model || 'gpt-4';
    const isReasoningModel = /^(o[1-9]|gpt-4\.1)/i.test(activeModel);
    
    console.log(`🔍 Model: ${activeModel}, isReasoningModel: ${isReasoningModel}`);
    
    // Use messages parameter for chat completions API
    const requestParams: any = {
      model: activeModel,
      messages: messages,
      max_completion_tokens: 2000,
      stream: true
    };

    // Only add temperature and top_p for non-reasoning models
    if (!isReasoningModel) {
      console.log(`✅ Adding temperature for non-reasoning model: ${activeModel}`);
      requestParams.temperature = 0.7;
      requestParams.top_p = 1;
    } else {
      console.log(`🚫 Skipping temperature for reasoning model: ${activeModel}`);
    }
    
    const stream = await openai.chat.completions.create(requestParams);
    
    // Stream the response
    let fullResponse = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    
    console.log(`📝 Streamed response complete. Length: ${fullResponse.length}`);

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
      console.log('💾 Attempting to save assistant message to chat_messages...', {
        thread_id: threadId,
        role: 'assistant',
        content_length: fullResponse.length,
        model: activeModel,
        user_id: userId
      });
      
      const { data: assistantData, error: assistantError } = await supabaseAdmin
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          role: 'assistant',
          content: fullResponse,
          metadata: { user_id: userId, model: activeModel }
        })
        .select();
        
      if (assistantError) {
        console.error('❌ Failed to save assistant message to chat_messages:', {
          error: assistantError.message,
          code: assistantError.code,
          details: assistantError.details,
          hint: assistantError.hint
        });
      } else {
        console.log('✅ Assistant message saved to chat_messages:', assistantData);
      }

      // Extract and save memories using AI analysis
      console.log('🎯 Attempting to extract and save memories...');
      const extractedMemories = await extractMemories(message, fullResponse, apiKey);
      
      // Log what was extracted
      console.log('📊 Extracted memories:', {
        shortTermCount: extractedMemories.short_term?.length || 0,
        longTermCount: extractedMemories.long_term?.length || 0,
        shortTermMemories: extractedMemories.short_term,
        longTermMemories: extractedMemories.long_term
      });

      // Save short-term memories
      if (extractedMemories.short_term && extractedMemories.short_term.length > 0) {
        console.log(`💾 Saving ${extractedMemories.short_term.length} short-term memories...`);
        for (const memory of extractedMemories.short_term) {
          const { error } = await supabaseAdmin.from('short_term_memory').insert({
            user_id: userId,
            thread_id: threadId,
            message: memory.display,
            display_text: memory.display,
            sender: 'system',
            tags: memory.tags || ['auto-captured'],
            metadata: { auto_captured: true }
          });
          if (error) {
            console.error('❌ Short-term memory save error:', error);
          }
        }
      }

      // Save long-term memories with embeddings
      if (extractedMemories.long_term && extractedMemories.long_term.length > 0) {
        console.log(`💾 Saving ${extractedMemories.long_term.length} long-term memories...`);
        for (const memory of extractedMemories.long_term) {
          const embedding = await generateEmbedding(memory.value, apiKey);
          
          const { error } = await supabaseAdmin.from('long_term_memory').insert({
            user_id: userId,
            category: memory.category,
            key: memory.key,
            value: memory.value,
            display_text: memory.display,
            importance: memory.importance || 3,
            embedding: embedding,
            metadata: { 
              auto_captured: true,
              subcategory: memory.key.split('_')[0],
              extracted_from: 'conversation'
            }
          });
          if (error) {
            console.error('❌ Long-term memory save error:', error);
          } else {
            console.log('✅ Long-term memory saved:', { 
              category: memory.category, 
              key: memory.key, 
              value: memory.value,
              importance: memory.importance 
            });
          }
        }
      }

      // Send memory update notification with actual extracted memories
      res.write(`data: ${JSON.stringify({ 
        type: 'memory_update',
        memories: extractedMemories
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