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
- "My name is Sarah" → LONG-TERM: category="personal", key="full_name", value="Sarah"
- "I own a restaurant" → LONG-TERM: category="professional", key="business_type", value="restaurant"
- "My wife's birthday is June 5th" → LONG-TERM: category="events", key="wife_birthday", value="June 5th"
- "I'm asking about marketing" → SHORT-TERM: conversation context
- "For this project, make it formal" → SHORT-TERM: session preferences

Only extract clear, factual information. Be very selective.`;

  try {
    const response = await (openai as any).responses.create({
      model: "gpt-4",
      input: [
        { role: "system", content: "Extract memories from the conversation following the JSON format specified." },
        { role: "user", content: extractionPrompt }
      ],
      temperature: 0.7,
      max_output_tokens: 1000
    });

    // Extract the assistant's response (not the reasoning part)
    let content = '{"short_term":[],"long_term":[]}';
    if (response.output && Array.isArray(response.output)) {
      // Look for the assistant's response in the output array
      for (const output of response.output) {
        if (output.role === 'assistant' && output.content && output.content[0]?.text) {
          content = output.content[0].text;
          break;
        }
      }
      
      // Fallback: if no assistant role found, try the first content item
      if (content === '{"short_term":[],"long_term":[]}' && response.output[0]?.content?.[0]?.text) {
        content = response.output[0].content[0].text;
      }
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
    
    // Add user message
    messages.push({ role: 'user', content: message });

    // Use responses API for ALL models
    const activeModel = model || 'gpt-4';
    const isReasoningModel = /^(o[1-9]|gpt-4\.1)/i.test(activeModel);
    
    console.log(`🔍 Model: ${activeModel}, isReasoningModel: ${isReasoningModel}`);
    
    // Use input parameter for responses API
    const requestParams: any = {
      model: activeModel,
      input: messages,
      max_output_tokens: 2000
    };

    // Only add temperature and top_p for non-reasoning models
    if (!isReasoningModel) {
      console.log(`✅ Adding temperature for non-reasoning model: ${activeModel}`);
      requestParams.temperature = 0.7;
      requestParams.top_p = 1;
    } else {
      console.log(`🚫 Skipping temperature for reasoning model: ${activeModel}`);
    }
    
    const response = await (openai as any).responses.create(requestParams);
    
    // Debug: Log the full response structure
    console.log('🔍 Full response structure:', JSON.stringify(response, null, 2));
    
    // Extract the assistant's response (not the reasoning part)
    let fullResponse = '';
    if (response.output && Array.isArray(response.output)) {
      console.log(`📊 Output array has ${response.output.length} items`);
      
      // Look for the assistant's response in the output array
      for (let i = 0; i < response.output.length; i++) {
        const output = response.output[i];
        console.log(`📋 Output ${i}:`, { role: output.role, hasContent: !!output.content, contentLength: output.content?.[0]?.text?.length });
        
        if (output.role === 'assistant' && output.content && output.content[0]?.text) {
          fullResponse = output.content[0].text;
          console.log(`✅ Found assistant response at index ${i}`);
          break;
        }
      }
      
      // Fallback: if no assistant role found, try the first content item
      if (!fullResponse && response.output[0]?.content?.[0]?.text) {
        fullResponse = response.output[0].content[0].text;
        console.log(`⚠️ Using fallback from index 0`);
      }
    }
    
    console.log(`📝 Extracted response length: ${fullResponse.length}, preview: ${fullResponse.substring(0, 100)}...`);
    
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